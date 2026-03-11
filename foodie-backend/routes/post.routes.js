const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, deletePost, getFollowingPosts, getLikedPosts, editPost } = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/multer.middleware');

// Public routes
router.get('/', optionalAuth, getPosts);

// Named protected routes (must come BEFORE /:id to avoid route conflict)
router.get('/following', authMiddleware, getFollowingPosts);
router.get('/liked', authMiddleware, getLikedPosts);

// Single post by ID (after named routes)
router.get('/:id', optionalAuth, getPostById);

// Mutating routes
router.post('/', authMiddleware, upload.single('image'), createPost);
router.put('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;


