import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './db.js';
import { seedAdminAndCategories } from './utils/seed.js';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(
  cors({
    origin: "*",      
    credentials: false 
  })
);

app.set('trust proxy', 1);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, t: new Date().toISOString() })
);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (_req, res) => {
  res.type('text/plain').send('MERN Blog API is running. Try /api/health');
});

app.use((err, _req, res, _next) => {
  console.error('🔥 Error:', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  await seedAdminAndCategories();
  app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
};
start().catch((e) => {
  console.error('❌ Failed to start server', e);
  process.exit(1);
});
