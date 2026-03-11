const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interaction.controller');
const socialController = require('../controllers/social.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/comment/:postId', interactionController.getComments);

// Protect all routes below
router.use(authMiddleware);

// Likes
router.post('/like/:postId', interactionController.toggleLike);

// Comments & Replies
router.post('/comment/:postId', interactionController.addComment);
router.get('/comment/replies/:commentId', interactionController.getReplies);
router.post('/comment/like/:commentId', interactionController.toggleCommentLike);

// Reports
router.post('/report', interactionController.reportContent);

// Follows
router.post('/follow/:id', socialController.toggleFollow);

// Favorites
router.post('/favorite/:restaurantId', socialController.addFavorite);
router.delete('/favorite/:restaurantId', socialController.removeFavorite);
router.get('/favorites', socialController.getFavorites);

// Lists
router.get('/followers/:userId', socialController.getFollowers);
router.get('/following/:userId', socialController.getFollowing);

// Activities
router.get('/activities', socialController.getActivities);
router.get('/activities/unread-count', socialController.getUnreadActivityCount);
router.put('/activities/read', socialController.markActivitiesAsRead);

// Saved Posts
router.post('/save-post/:postId', socialController.toggleSavePost);
router.get('/saved-posts', socialController.getSavedPosts);

module.exports = router;
