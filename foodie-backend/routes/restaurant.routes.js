const express = require('express');
const router = express.Router();
const rc = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/multer.middleware');

// --- Public ---
router.get('/detail', optionalAuth, rc.getRestaurantByName);
router.get('/reviews', optionalAuth, rc.getRestaurantReviews);
router.get('/trending', rc.getTrendingRestaurants);
router.get('/reviews/:reviewId/comments', optionalAuth, rc.getReviewComments);
router.get('/reviews/:reviewId/comments/:commentId/replies', optionalAuth, rc.getCommentReplies);

// --- Protected ---
router.use(authMiddleware);

router.post('/reviews', upload.single('image'), rc.addReview);
router.post('/save', rc.toggleSave);
router.post('/follow', rc.toggleFollow);
router.post('/reviews/:reviewId/like', rc.toggleReviewLike);
router.post('/reviews/:reviewId/comments', rc.addReviewComment);
router.post('/photos', upload.single('image'), rc.addPhoto);

module.exports = router;
