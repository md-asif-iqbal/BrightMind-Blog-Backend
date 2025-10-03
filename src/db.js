import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'mern_blog';

if (!uri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

export const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;
export async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    db.collection('posts').createIndex({ slug: 1 }, { unique: true }),
    db.collection('posts').createIndex({ createdAt: -1 }),
    db.collection('comments').createIndex({ post: 1, createdAt: -1 })
  ]);
  return db;
}