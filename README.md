# 🍽 Foodie — Social Food Review Platform

A full-stack social web application where food lovers can post restaurant reviews, follow other foodies, discover trending spots nearby, and earn badges for their activity.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2/promise) |
| Authentication | JWT + bcryptjs |
| File Uploads | Multer (local `/uploads`) |
| Frontend | Vanilla JS + HTML + CSS |
| External API | OpenStreetMap / Overpass API |

---

## 📁 Project Structure

```
Foodie/
├── foodie-backend/
│   ├── server.js                  # App entry point
│   ├── .env                       # Environment variables
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool
│   │   ├── init.sql               # Database schema (run once)
│   │   └── seed.js                # Seed test data
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── post.controller.js
│   │   ├── social.controller.js
│   │   ├── interaction.controller.js
│   │   ├── restaurant.controller.js
│   │   ├── search.controller.js
│   │   ├── user.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verify + optionalAuth
│   │   ├── admin.middleware.js    # Role check (admin only)
│   │   └── multer.middleware.js   # Image upload config
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   ├── social.routes.js
│   │   ├── user.routes.js
│   │   ├── restaurant.routes.js
│   │   ├── misc.routes.js         # Search routes
│   │   └── admin.routes.js
│   ├── services/
│   │   └── osm.service.js         # OpenStreetMap fetch + DB sync
│   └── uploads/                   # User-uploaded images
│
└── foodie-front end/
    ├── index.html                 # Landing / redirect
    ├── login.html
    ├── signup.html
    ├── home.html                  # Main feed
    ├── post.html                  # Single post + comments
    ├── profile.html               # User profile + badges
    ├── restaurant.html            # Restaurant detail + reviews
    ├── explore.html               # Discovery page
    ├── create-post.html           # Post creation wizard
    ├── activity.html              # Notifications
    ├── admin-dashboard.html       # Admin panel
    ├── js/
    │   ├── app.js                 # Shared globals + utilities
    │   ├── home.js
    │   ├── post.js
    │   ├── profile.js
    │   ├── restaurant.js
    │   ├── search.js
    │   ├── create-post.js
    │   ├── activity.js
    │   └── auth.js
    └── styles/
        ├── main.css               # Global design system
        ├── home.css
        ├── profile.css
        ├── restaurant.css
        ├── post.css
        ├── search.css
        ├── create-post.css
        ├── activity.css
        └── auth.css
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL 8+

### 1. Clone & Install

```bash
cd foodie-backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=foodie_db
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Create the database and all tables
mysql -u root -p < config/init.sql

# (Optional) Seed with test data
node config/seed.js
```

### 4. Start the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server runs at **http://localhost:5000**

### 5. Open the Frontend

Open `foodie-front end/index.html` in your browser, or serve it with any static file server:

```bash
# Using VS Code Live Server, or:
npx serve "foodie-front end"
```

> Make sure `API_URL` in `js/app.js` points to your backend: `http://127.0.0.1:5000/api`

---

## 🔑 Test Accounts (after seeding)

| Username | Email | Password | Role |
|----------|-------|----------|------|
| alexfoods | alex@example.com | password123 | User |
| priyaeats | priya@example.com | password123 | User |
| marcusbites | marcus@example.com | password123 | User |
| admin | admin@foodie.com | password123 | Admin |

---

## 🌐 API Overview

Base URL: `http://localhost:5000/api`

> 🔒 = Requires `Authorization: Bearer <token>` header

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → returns JWT |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | All public posts |
| POST | `/posts` 🔒 | Create post + image |
| GET | `/posts/following` 🔒 | Feed from followed users |
| GET | `/posts/:id` | Single post |
| PUT | `/posts/:id` 🔒 | Edit caption |
| DELETE | `/posts/:id` 🔒 | Delete post |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/social/follow/:id` 🔒 | Follow / Unfollow user |
| POST | `/social/like/:postId` 🔒 | Like / Unlike post |
| POST | `/social/comment/:postId` 🔒 | Add comment or reply |
| POST | `/social/save-post/:postId` 🔒 | Save / Unsave post |
| GET | `/social/activities` 🔒 | Notifications feed |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restaurants/detail?name=` | Restaurant info + stats |
| GET | `/restaurants/reviews?name=` | Reviews list |
| POST | `/restaurants/reviews?name=` 🔒 | Submit review |
| GET | `/restaurants/trending` | Top 5 trending |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/unified?q=` | Search users + restaurants |
| GET | `/search/restaurants?q=&sort=&rating=` | Filter restaurants |
| GET | `/search/nearby?lat=&lng=` | OSM geolocation search |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile/:id` | User profile |
| PUT | `/users/profile` 🔒 | Update profile |
| GET | `/users/suggestions` 🔒 | Suggested users |
| GET | `/users/:id/level` 🔒 | XP + level + badges |

---

## ✨ Features

- **Feed** — Chronological + personalised following feed
- **Posts** — Photo reviews with dish name, sub-ratings (food/service/ambience/value), visit type, tags
- **Social Graph** — Follow/unfollow users, see followers/following lists
- **Interactions** — Like, comment (with threaded replies), save posts, report content
- **Restaurant Pages** — Aggregated stats, photo gallery, standalone reviews, trending score
- **Search** — Unified search, filter by rating/sort, nearby restaurants via OpenStreetMap
- **Notifications** — Activity feed for likes, comments, follows, mentions
- **Gamification** — XP system, 10 levels (Newcomer → Legend), 11 achievement badges
- **Admin Panel** — User management, content moderation, reports queue

---

## 🗃 Database Tables

`users` · `posts` · `restaurants` · `likes` · `comments` · `follows` · `favorites` · `saved_posts` · `activities` · `restaurant_reviews` · `restaurant_review_likes` · `restaurant_review_comments` · `restaurant_saves` · `restaurant_followers` · `restaurant_photos` · `reports` · `comment_likes`

---

## ⚠️ Known Issues

- SQL injection risk — `userId` is interpolated directly in some SQL strings in `post.controller.js` and `restaurant.controller.js`. Should use `?` parameterised queries.
- No input validation library — fields are not validated before hitting the DB.
- No pagination — all list endpoints return all rows.
- `forgot-password.html` is UI only — no backend endpoint implemented yet.
- Uploaded images are stored on local disk (not CDN-ready).

---

## 📦 Dependencies

```json
"express": "^5.2.1",
"mysql2": "^3.18.0",
"bcryptjs": "^3.0.3",
"jsonwebtoken": "^9.0.3",
"multer": "^2.0.2",
"dotenv": "^17.3.1",
"cors": "^2.8.6",
"morgan": "^1.10.1",
"axios": "^1.13.6"
```
