# 🌟 BrightMind Blog – Backend

This is the **backend** for **BrightMind Blog**, a full-stack MERN blogging system.  
Built with **Node.js + Express + MongoDB** (native driver, no Mongoose) and **JWT authentication** for Users & Admins.

---

## 🚀 Tech Stack

- **Node.js**
- **Express**
- **MongoDB** (native driver)
- **JWT** (jsonwebtoken)
- **bcryptjs**
- **CORS**
- **dotenv**

---

## 📦 Installation & Setup

### 1. Clone the repo
```bash
git clone <your-backend-repo-url> backend
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the root with the following content:

```env
PORT=5050
MONGODB_URI=mongodb+srv://<your-connection-uri>
JWT_SECRET=supersecretkey
```

### 4. Start development server
```bash
npm run dev
```
Backend runs on: [http://localhost:5050](http://localhost:5050)

---

## 🧑‍💻 Features

### 🔐 Authentication
- Register / Login
- JWT tokens (User & Admin roles)

### 📝 Posts
- CRUD posts with categories
- Slug generation
- XSS protection

### 📂 Categories
- Manage categories (CRUD)
- Unique slug enforcement

### 💬 Comments
- Add / fetch comments on posts

### 👤 Users
- Role-based access control (user/admin)
- Profile fetch

---

## 📁 Project Structure

```
src/
 ├── routes/          # auth.js, posts.js, categories.js, users.js
 ├── middleware/      # auth.js (JWT & role checks)
 ├── db.js            # MongoDB connection
 └── server.js        # Express server entrypoint
```

---

## 🌐 Deployment

Deploy backend easily on Render / Railway / Heroku:

1. Push repo to GitHub
2. Connect service (Render/Railway/Heroku)
3. Add environment variables:

```env
PORT=5050
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret>
```

---

## ✅ Checklist

- API follows REST conventions
- Fully connected with frontend
- JWT-protected routes
- Categories & Posts linked
- Admin & User