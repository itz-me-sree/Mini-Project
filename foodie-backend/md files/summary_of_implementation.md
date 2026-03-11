# Foodie Implementation Summary

## Backend Overview
The backend is a Node.js/Express REST API serving the Foodie application.

### Core Modules
- **Authentication**: JWT & BCrypt (Register/Login).
- **Social**: Likes, Comments, Follows, Favorites.
- **Content**: Post creation with image uploads (Multer).
- **Search**: Dynamic search for users and restaurants.
- **Admin**: Dashboard for managing the platform.

## Frontend-Backend Integration
- **Direct API Calls**: Removed all mock data and `localStorage` dependencies.
- **FormData**: Implemented multipart uploads for reviews and profile updates.
- **Dynamic Renders**: Feed, Discover, and Profile pages now query the DB via `fetch()`.

## Setup
1. MySQL database: `foodie_db` (use `config/init.sql`).
2. Environment: `.env` (configured for localhost).
3. Seeding: `node config/seed.js` to seed initial data.
4. Server: `npm start`.
