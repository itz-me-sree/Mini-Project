const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const upload = require('../middleware/multer.middleware');

// Public search (Now mounted at /api/search)
router.get('/restaurants', searchController.searchRestaurants);
router.get('/users', searchController.searchUsers);
router.get('/unified', searchController.unifiedSearch);
router.get('/nearby', searchController.nearbySearch);

// Admin Routes (Protected + Admin)
router.post('/admin/restaurants', authMiddleware, adminMiddleware, upload.single('image'), adminController.addRestaurant);
router.delete('/admin/restaurants/:id', authMiddleware, adminMiddleware, adminController.deleteRestaurant);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

module.exports = router;
