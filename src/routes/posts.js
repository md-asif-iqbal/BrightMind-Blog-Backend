// backend/src/routes/posts.js
import { Router } from 'express';
import slugify from 'slugify';
import xss from 'xss';
import { connectDB } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

// GET /posts (list + filters)
router.get('/', async (req, res) => {
  const { q = '', categoryName, authorId, page = 1, limit = 9 } = req.query;
  const db = await connectDB();
  const filter = {};

  // Only published unless author filter = self
  const requesterId = req.user?._id?.toString();
  const isSelf = authorId && (authorId === 'me' || authorId === requesterId);
  if (!isSelf) filter.published = true;

  // Full-text search
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } }
    ];
  }

  // Filter by author
  if (authorId) {
    const id = authorId === 'me' ? requesterId : authorId;
    if (id) filter.author = new ObjectId(id);
  }

  // Filter by categoryName => match post slug
  if (categoryName) {
    filter.slug = { $regex: `^${categoryName}$`, $options: 'i' }; // case-insensitive
  }

  // Pagination + fetch
  const total = await db.collection('posts').countDocuments(filter);
  const items = await db.collection('posts')
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .toArray();

  // Manual populate categories + authors
  const catIds = [...new Set(items.map(i => i.category?.toString()).filter(Boolean))].map(id => new ObjectId(id));
  const authorIds = [...new Set(items.map(i => i.author?.toString()).filter(Boolean))].map(id => new ObjectId(id));

  const [cats, users] = await Promise.all([
    db.collection('categories').find({ _id: { $in: catIds } }).toArray(),
    db.collection('users').find({ _id: { $in: authorIds } }).toArray()
  ]);

  const catsMap = Object.fromEntries(cats.map(c => [c._id.toString(), c]));
  const usersMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const hydrated = items.map(p => ({
    ...p,
    category: p.category
      ? {
          _id: p.category,
          name: catsMap[p.category.toString()]?.name,
          slug: catsMap[p.category.toString()]?.slug
        }
      : null,
    author: p.author
      ? { _id: p.author, name: usersMap[p.author.toString()]?.name }
      : null
  }));

  res.json({
    items: hydrated,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  });
});

// GET /posts/:slug (single post)
router.get('/:slug', async (req, res) => {
  const db = await connectDB();
  const p = await db.collection('posts').findOne({ slug: req.params.slug, published: true });
  if (!p) return res.status(404).json({ error: 'Not found' });

  const [cat, author] = await Promise.all([
    p.category ? db.collection('categories').findOne({ _id: new ObjectId(p.category) }) : null,
    p.author ? db.collection('users').findOne({ _id: new ObjectId(p.author) }, { projection: { name: 1 } }) : null
  ]);

  res.json({
    ...p,
    category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : null,
    author: author ? { _id: author._id, name: author.name } : null
  });
});

// POST /posts (create)
router.post('/', requireAuth, async (req, res) => {
  const { title, excerpt, content, bannerUrl, categoryId, published = false } = req.body || {};
  if (!title || !content || !categoryId) return res.status(400).json({ error: 'Missing fields' });

  const db = await connectDB();
  const slug = slugify(title, { lower: true, strict: true });
  const exists = await db.collection('posts').findOne({ slug });
  if (exists) return res.status(409).json({ error: 'Slug exists' });

  const now = new Date();
  const isAdmin = req.user?.role === 'admin';
  const doc = {
    title,
    slug,
    excerpt: excerpt || String(content).replace(/<[^>]+>/g, '').slice(0, 150),
    content: xss(content),
    bannerUrl,
    category: new ObjectId(categoryId),
    author: new ObjectId(req.user._id),
    published: isAdmin ? Boolean(published) : false,
    createdAt: now,
    updatedAt: now
  };

  const r = await db.collection('posts').insertOne(doc);
  res.status(201).json({ ...doc, _id: r.insertedId });
});

// PATCH /posts/:id (update)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = await connectDB();
  const { title, excerpt, content, bannerUrl, categoryId, published } = req.body || {};
  const updates = { updatedAt: new Date() };

  if (title) {
    updates.title = title;
    updates.slug = slugify(title, { lower: true, strict: true });
  }
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (content !== undefined) updates.content = xss(content);
  if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
  if (categoryId) updates.category = new ObjectId(categoryId);
  if (typeof published === 'boolean') updates.published = published;

  const r = await db.collection('posts').findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: updates },
    { returnDocument: 'after' }
  );
  if (!r.value) return res.status(404).json({ error: 'Not found' });
  res.json(r.value);
});

// DELETE /posts/:id (delete)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = await connectDB();
  const r = await db.collection('posts').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!r.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
