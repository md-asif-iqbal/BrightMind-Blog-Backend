import { Router } from 'express';
import slugify from 'slugify';
import { connectDB } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await connectDB();
  const items = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
  res.json(items);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = await connectDB();
  const slug = slugify(name, { lower: true, strict: true });
  const exists = await db.collection('categories').findOne({ slug });
  if (exists) return res.status(409).json({ error: 'Exists' });
  const doc = { name, slug, createdAt: new Date(), updatedAt: new Date() };
  const r = await db.collection('categories').insertOne(doc);
  res.status(201).json({ ...doc, _id: r.insertedId });
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body || {};
  const db = await connectDB();
  const update = { updatedAt: new Date() };
  if (name) {
    update.name = name;
    update.slug = slugify(name, { lower: true, strict: true });
  }
  const r = await db.collection('categories')
    .findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: update }, { returnDocument: 'after' });
  if (!r.value) return res.status(404).json({ error: 'Not found' });
  res.json(r.value);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = await connectDB();
  const r = await db.collection('categories').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!r.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;