import { Router } from 'express';
import { connectDB } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';
import xss from 'xss';

const router = Router();

router.get('/:postId', async (req, res) => {
  const db = await connectDB();
  const items = await db.collection('comments')
    .find({ post: new ObjectId(req.params.postId) })
    .sort({ createdAt: -1 })
    .toArray();

  // populate users
  const uid = [...new Set(items.map(i => i.author?.toString()))].filter(Boolean).map(id => new ObjectId(id));
  const users = uid.length ? await db.collection('users').find({ _id: { $in: uid } }).toArray() : [];
  const umap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
  res.json(items.map(c => ({ ...c, author: c.author ? { _id: c.author, name: umap[c.author.toString()]?.name } : null })));
});

router.post('/:postId', requireAuth, async (req, res) => {
  const { content } = req.body || {};
  if (!String(content).trim()) return res.status(400).json({ error: 'Content required' });
  const db = await connectDB();
  const doc = {
    post: new ObjectId(req.params.postId),
    author: new ObjectId(req.user._id),
    content: xss(String(content).trim()),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r = await db.collection('comments').insertOne(doc);
  res.status(201).json({ ...doc, _id: r.insertedId, author: { _id: req.user._id, name: req.user.name } });
});

export default router;
