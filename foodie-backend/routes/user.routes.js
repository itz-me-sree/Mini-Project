const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getUserPosts,
    getUserLikedPosts,
    getUserSavedPosts,
    getUserAllReviews,
    getUserFavorites,
    getSuggestedUsers,
    getLevelAndAchievements,
    changePassword,
    deleteAccount
} = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/multer.middleware');

// Protected routes
router.use(authMiddleware);

router.get('/profile/:id', getProfile);
router.get('/suggestions', getSuggestedUsers);
router.put('/profile', upload.single('profile_pic'), updateProfile);
router.get('/:id/posts', getUserPosts);
router.get('/:id/liked', getUserLikedPosts);
router.get('/:id/saved', getUserSavedPosts);
router.get('/:id/all-reviews', getUserAllReviews);
router.get('/:id/favorites', getUserFavorites);
router.get('/:id/level', getLevelAndAchievements);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);

module.exports = router;
