import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../db.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = await connectDB();
  const users = db.collection('users');
  const exists = await users.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Email in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const doc = {
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r = await users.insertOne(doc);
  res.status(201).json({ id: r.insertedId, name: doc.name, email: doc.email });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const db = await connectDB();
  const user = await db.collection('users').findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', async (req, res) => {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.id) },
      { projection: { passwordHash: 0 } }
    );
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

export default router;