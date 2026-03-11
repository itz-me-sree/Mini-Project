const pool = require('../config/db');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Protected
const createPost = async (req, res) => {
    const {
        restaurant_id, caption, rating, dish_name,
        food_rating, service_rating, ambience_rating, value_rating,
        tags, recommend, visibility, visit_type
    } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!image) {
        return res.status(400).json({ success: false, message: 'Image is required' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO posts (
                user_id, restaurant_id, caption, dish_name, image, rating, 
                food_rating, service_rating, ambience_rating, value_rating,
                tags, recommend, visibility, visit_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, restaurant_id, caption, dish_name, image, rating,
                food_rating || 0, service_rating || 0, ambience_rating || 0, value_rating || 0,
                tags, recommend, visibility, visit_type
            ]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                user_id: req.user.id,
                restaurant_id,
                caption,
                image,
                rating
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const { restaurant_name } = req.query;

    try {
        let query = `
            SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            ${userId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${userId}) > 0` : 'false'} as liked,
            ${userId ? `(SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ${userId}) > 0` : 'false'} as is_saved
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN restaurants r ON p.restaurant_id = r.id
        `;
        const params = [];

        if (restaurant_name) {
            query += ` WHERE r.name = ? AND r.category NOT LIKE '%Bar%'`;
            params.push(restaurant_name);
        } else {
            query += ` WHERE r.category NOT LIKE '%Bar%'`;
        }

        query += ` ORDER BY p.created_at DESC`;

        const [posts] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: posts
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Protected
const deletePost = async (req, res) => {
    try {
        // Check if post exists and belongs to user
        const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const post = posts[0];

        // Only author or admin can delete
        if (post.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // 1. Delete associated likes
        await pool.query('DELETE FROM likes WHERE post_id = ?', [req.params.id]);

        // 2. Delete associated comments and their replies
        // (Assuming comments references post_id, deleting parent comments will ideally cascade or we delete them all by post_id)
        await pool.query('DELETE FROM comments WHERE post_id = ?', [req.params.id]);

        // 3. Delete saved_posts entries
        await pool.query('DELETE FROM saved_posts WHERE post_id = ?', [req.params.id]);

        // 4. Finally, delete the post itself
        await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

        res.status(200).json({
            success: true,
            message: 'Post removed'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get posts from followed users
// @route   GET /api/posts/following
// @access  Protected
const getFollowingPosts = async (req, res) => {
    const userId = req.user.id;
    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) > 0 as liked,
             (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ?) > 0 as is_saved
             FROM posts p
             JOIN users u ON p.user_id = u.id
             JOIN restaurants r ON p.restaurant_id = r.id
             JOIN follows f ON p.user_id = f.following_id
             WHERE f.follower_id = ? AND r.category NOT LIKE '%Bar%'
             ORDER BY p.created_at DESC`,
            [userId, userId, userId]
        );

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get posts liked by user
// @route   GET /api/posts/liked
// @access  Protected
const getLikedPosts = async (req, res) => {
    const userId = req.user.id;
    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             true as liked,
             (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ?) > 0 as is_saved
             FROM posts p
             JOIN users u ON p.user_id = u.id
             JOIN restaurants r ON p.restaurant_id = r.id
             JOIN likes l ON p.id = l.post_id
             WHERE l.user_id = ? AND r.category NOT LIKE '%Bar%'
             ORDER BY p.created_at DESC`,
            [userId, userId]
        );

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Edit post caption
// @route   PUT /api/posts/:id
// @access  Protected
const editPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const postId = req.params.id;

        // Check if post exists and get its details
        const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const post = posts[0];

        // Ensure only the author can edit
        if (post.user_id !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized. You can only edit your own posts.' });
        }

        // Update the caption
        await pool.query('UPDATE posts SET caption = ? WHERE id = ?', [caption || '', postId]);

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            data: { id: postId, caption }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public (optional auth for liked/saved state)
const getPostById = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const postId = req.params.id;

    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            ${userId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${userId}) > 0` : 'false'} as liked,
            ${userId ? `(SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = ${userId}) > 0` : 'false'} as is_saved
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN restaurants r ON p.restaurant_id = r.id
            WHERE p.id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: posts[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    getFollowingPosts,
    getLikedPosts,
    editPost
};

