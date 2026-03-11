const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const c = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Stats
router.get('/stats', c.getStats);

// Users
router.get('/users', c.getUsers);
router.put('/users/:id/status', c.setUserStatus);
router.delete('/users/:id', c.deleteUser);

// Posts
router.get('/posts', c.getPosts);
router.delete('/posts/:id', c.deletePost);

// Restaurants
router.get('/restaurants', c.getRestaurants);
router.post('/restaurants', c.addRestaurant);
router.delete('/restaurants/:id', c.deleteRestaurant);

// Reports
router.get('/reports', c.getReports);
router.put('/reports/:id/status', c.setReportStatus);

module.exports = router;
