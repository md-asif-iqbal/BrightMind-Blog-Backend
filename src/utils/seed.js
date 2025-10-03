import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { connectDB } from '../db.js';

const CATEGORY_LIST = [
  '.NET','AI','Blockchain','Blog','Business','Data Engineering','DBI','Golang','Java','JavaScript',
  'Mobile App Development','MVP','Personal','Programming & Development','Python','React',
  'Software Development','SQL Server','Staff Augmentation','Technology','Web'
];

export async function seedAdminAndCategories() {
  const db = await connectDB();

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const users = db.collection('users');
    const found = await users.findOne({ email: adminEmail.toLowerCase() });
    if (!found) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await users.insertOne({
        name: 'Admin',
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Seeded admin:', adminEmail);
    }
  }

  // Seed categories
  const categories = db.collection('categories');
  const count = await categories.countDocuments();
  if (count === 0) {
    await categories.insertMany(
      CATEGORY_LIST.map((name) => ({
        name,
        slug: slugify(name, { lower: true, strict: true }),
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    console.log('Seeded categories');
  }
}
