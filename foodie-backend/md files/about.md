# 📁 Foodie Backend: File Overviews

This document provides a summary of each file and folder in the `foodie-backend` project.

## 📂 Root Files
- **`server.js`**: The entry point of the application. Initializes Express, sets up middleware (CORS, Morgan, Body Parser), and connects all routes to the server.
- **`.env`**: Stores environment variables like `DB_HOST`, `DB_USER`, `DB_PASS`, and `JWT_SECRET`.
- **`package.json`**: Lists all dependencies and convenience scripts (`npm start`, `npm run dev`).
- **`SETUP_GUIDE.md`**: Step-by-step instructions to set up the backend and seed the database.
- **`CREDENTIALS.md`**: Quick reference for test account emails and passwords.

## 📂 `config/`
- **`db.js`**: Configures the connection to the MySQL database using `mysql2/promise`.
- **`init.sql`**: Contains the SQL commands to create all database tables.
- **`seed.js`**: Script to populate the database with test data (Users, Restaurants, Posts). Run with `node config/seed.js`.

## 📂 `controllers/` (Business Logic)
- **`auth.controller.js`**: Handles user registration and login, including password hashing with BCrypt and JWT generation.
- **`post.controller.js`**: Logic for creating posts, fetching the feed, and deleting posts.
- **`user.controller.js`**: Logic for fetching user profiles and updating bio/profile pictures.
- **`social.controller.js`**: Handles likes, comments, following users, and favorite restaurants.
- **`search.controller.js`**: Implements search functionality for both users and restaurants.
- **`admin.controller.js`**: Admin-only logic for managing the system.

## 📂 `routes/` (API Endpoints)
- **`auth.routes.js`**: `/api/auth` endpoints.
- **`post.routes.js`**: `/api/posts` endpoints.
- **`user.routes.js`**: `/api/users` endpoints.
- **`social.routes.js`**: `/api/social` endpoints.
- **`search.routes.js`**: `/api/search` endpoints.

## 📂 `middleware/`
- **`auth.middleware.js`**: Verifies JWT tokens to protect private routes.
- **`multer.middleware.js`**: Handles file uploads for post images and profile pictures.

## 📂 `uploads/`
- Stores all images uploaded by users (posts, avatars).
