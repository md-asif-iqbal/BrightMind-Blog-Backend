// backend/scripts/seedPosts.js
import 'dotenv/config';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'mern_blog';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

if (!uri) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const POSTS = [
  // title, slug, excerpt, bannerUrl, categorySlug, createdAt ISO
  ["Custom Software Development Company In Bangladesh","custom-software-development-company-in-bangladesh","How logistics companies in Bangladesh efficiently track vehicles in real-time across vast areas.","https://picsum.photos/id/1011/1200/540","software-development","2025-08-25T12:00:00Z"],
  ["Mastering Node.js Error Handling Practices (Part-2)","mastering-nodejs-error-handling-practices-part-2","Why handling async errors in Node.js is still one of the trickiest challenges.","https://picsum.photos/id/1015/1200/540","javascript","2025-08-25T12:30:00Z"],
  ["What Is The Software Development Life Cycle (SDLC)?","what-is-software-development-life-cycle-sdlc","SDLC is more than coding. It demands precision and clear requirements.","https://picsum.photos/id/102/1200/540","software-development","2025-08-25T13:00:00Z"],
  ["How Much Does It Cost To Build An MVP in 2025?","how-much-does-it-cost-to-build-an-mvp-in-2025","An MVP lets you test your business idea quickly and minimize mistakes.","https://picsum.photos/id/103/1200/540","mvp","2025-08-25T14:00:00Z"],
  ["Top 20 Web Design and Development Companies in Bangladesh","top-20-web-design-and-development-companies-in-bangladesh","Find the best companies to bring your brand identity to life online.","https://picsum.photos/id/104/1200/540","web","2025-08-25T15:00:00Z"],
  ["Why Mobile Apps Are Important For Your Business","why-mobile-apps-are-important-for-your-business","90% of consumers interact with brands through mobile apps.","https://picsum.photos/id/105/1200/540","mobile-app-development","2025-08-25T16:00:00Z"],
  ["AI In Software Testing: Smarter QA In 2025","ai-in-software-testing-smarter-qa-2025","AI is revolutionizing how QA teams detect bugs and optimize testing.","https://picsum.photos/id/106/1200/540","ai","2025-08-25T17:00:00Z"],
  ["Blockchain Beyond Cryptocurrency","blockchain-beyond-cryptocurrency","Blockchain is transforming supply chains, healthcare, and banking.","https://picsum.photos/id/107/1200/540","blockchain","2025-08-25T18:00:00Z"],
  ["The Rise of React Server Components","the-rise-of-react-server-components","RSC changes how we build modern frontend applications.","https://picsum.photos/id/108/1200/540","react","2025-08-25T19:00:00Z"],
  ["Scaling Databases With SQL Server 2025","scaling-databases-with-sql-server-2025","SQL Server innovations make it easier to scale apps globally.","https://picsum.photos/id/109/1200/540","sql-server","2025-08-25T20:00:00Z"],
  ["AI-Powered Mobile Apps","ai-powered-mobile-apps","How AI-driven mobile apps enhance personalization and UX.","https://picsum.photos/id/110/1200/540","mobile-app-development","2025-08-25T21:00:00Z"],
  ["Building MVPs With Golang","building-mvps-with-golang","Why startups choose Go to build fast and efficient MVPs.","https://picsum.photos/id/111/1200/540","mvp","2025-08-25T22:00:00Z"],
  ["Business Intelligence Trends 2025","business-intelligence-trends-2025","Data-driven insights reshape industries in 2025.","https://picsum.photos/id/112/1200/540","business","2025-08-25T23:00:00Z"],
  ["React vs Vue in 2025","react-vs-vue-in-2025","The frontend framework wars continue with new benchmarks.","https://picsum.photos/id/113/1200/540","javascript","2025-08-26T00:00:00Z"],
  ["Staff Augmentation Explained","staff-augmentation-explained","Why companies use staff augmentation for scaling teams.","https://picsum.photos/id/114/1200/540","staff-augmentation","2025-08-26T01:00:00Z"],
  ["Python for Data Engineering","python-for-data-engineering","Python dominates pipelines and ETL tasks in 2025.","https://picsum.photos/id/115/1200/540","data-engineering","2025-08-26T02:00:00Z"],
  ["The Future of SQL Server","the-future-of-sql-server","Where Microsoft is taking SQL Server next.","https://picsum.photos/id/116/1200/540","sql-server","2025-08-26T03:00:00Z"],
  ["Staff Augmentation vs Outsourcing","staff-augmentation-vs-outsourcing","Understand the difference between augmentation and outsourcing.","https://picsum.photos/id/117/1200/540","staff-augmentation","2025-08-26T04:00:00Z"],
  ["React Native in 2025","react-native-in-2025","Is React Native still relevant for mobile apps in 2025?","https://picsum.photos/id/118/1200/540","mobile-app-development","2025-08-26T05:00:00Z"],
  ["Business Case for AI Integration","business-case-for-ai-integration","Why every business must adopt AI strategies in 2025.","https://picsum.photos/id/119/1200/540","ai","2025-08-26T06:00:00Z"]
];

function stripHtml(html) {
  return String(html).replace(/<[^>]+>/g, '');
}

async function main() {
  const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }});
  await client.connect();
  const db = client.db(dbName);

  const admin = await db.collection('users').findOne({ email: adminEmail.toLowerCase() });
  if (!admin) throw new Error(`Admin user not found for email ${adminEmail}`);

  const cats = await db.collection('categories').find({}).toArray();
  if (!cats.length) throw new Error('No categories found. Run the server once to seed categories.');

  const catBySlug = Object.fromEntries(cats.map(c => [c.slug, c._id]));

  const docs = POSTS.map(([title, slug, excerpt, bannerUrl, categorySlug, createdAtIso]) => {
    const content = `<p>${excerpt}</p>`;
    const categoryId = catBySlug[categorySlug];
    if (!categoryId) throw new Error(`Category slug "${categorySlug}" not found in DB. Available: ${Object.keys(catBySlug).join(', ')}`);
    const now = new Date(createdAtIso);
    return {
      title,
      slug,
      excerpt,
      content,
      bannerUrl,
      published: true,
      category: new ObjectId(categoryId),
      author: new ObjectId(admin._id),
      createdAt: now,
      updatedAt: now
    };
  });

  // ensure unique slugs
  const existing = await db.collection('posts').find({ slug: { $in: docs.map(d => d.slug) } }).project({ slug: 1 }).toArray();
  const existingSet = new Set(existing.map(e => e.slug));
  const toInsert = docs.filter(d => !existingSet.has(d.slug));

  if (!toInsert.length) {
    console.log('Nothing to insert. All slugs already exist.');
  } else {
    const r = await db.collection('posts').insertMany(toInsert);
    console.log(`Inserted ${r.insertedCount} posts`);
  }

  await client.close();
}

main().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
