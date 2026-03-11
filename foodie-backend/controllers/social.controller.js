const pool = require('../config/db');

// --- FOLLOW SYSTEM ---

// @desc    Follow/Unfollow user
// @route   POST /api/social/follow/:id
// @access  Protected
const toggleFollow = async (req, res) => {
    const followerId = req.user.id;
    const followingId = req.params.id;

    if (followerId == followingId) {
        return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
            return res.status(200).json({ success: true, message: 'Unfollowed' });
        } else {
            await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);

            // Log Activity
            await logActivity(followingId, followerId, 'follow');

            return res.status(201).json({ success: true, message: 'Followed' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- FAVORITES ---

// @desc    Add restaurant to favorites
// @route   POST /api/social/favorite/:restaurantId
// @access  Protected
const addFavorite = async (req, res) => {
    const userId = req.user.id;
    const restaurantId = req.params.restaurantId;

    try {
        await pool.query('INSERT IGNORE INTO favorites (user_id, restaurant_id) VALUES (?, ?)', [userId, restaurantId]);
        res.status(201).json({ success: true, message: 'Added to favorites' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove from favorites
// @route   DELETE /api/social/favorite/:restaurantId
// @access  Protected
const removeFavorite = async (req, res) => {
    const userId = req.user.id;
    const restaurantId = req.params.restaurantId;

    try {
        await pool.query('DELETE FROM favorites WHERE user_id = ? AND restaurant_id = ?', [userId, restaurantId]);
        res.status(200).json({ success: true, message: 'Removed from favorites' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all favorite restaurants
// @route   GET /api/social/favorites
// @access  Protected
const getFavorites = async (req, res) => {
    try {
        const [favorites] = await pool.query(
            `SELECT f.*, r.name, r.location, r.image, r.category 
             FROM favorites f 
             JOIN restaurants r ON f.restaurant_id = r.id 
             WHERE f.user_id = ?`,
            [req.user.id]
        );

        res.status(200).json({ success: true, data: favorites });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get followers list
// @route   GET /api/social/followers/:userId
// @access  Protected
const getFollowers = async (req, res) => {
    try {
        const [followers] = await pool.query(
            `SELECT u.id, u.username, u.profile_pic, u.bio 
             FROM users u
             JOIN follows f ON u.id = f.follower_id
             WHERE f.following_id = ?`,
            [req.params.userId]
        );
        res.status(200).json({ success: true, data: followers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get following list
// @route   GET /api/social/following/:userId
// @access  Protected
const getFollowing = async (req, res) => {
    try {
        const [following] = await pool.query(
            `SELECT u.id, u.username, u.profile_pic, u.bio 
             FROM users u
             JOIN follows f ON u.id = f.following_id
             WHERE f.follower_id = ?`,
            [req.params.userId]
        );
        res.status(200).json({ success: true, data: following });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- ACTIVITIES (NOTIFICATIONS) ---

// @desc    Get user activities/notifications
// @route   GET /api/social/activities
// @access  Protected
const getActivities = async (req, res) => {
    try {
        const [activities] = await pool.query(
            `SELECT a.*, COALESCE(u.full_name, u.username) as actor_name, u.username as actor_username, u.profile_pic as actor_avatar, p.image as post_image
             FROM activities a
             JOIN users u ON a.actor_id = u.id
             LEFT JOIN posts p ON a.post_id = p.id
             WHERE a.user_id = ?
             ORDER BY a.created_at DESC
             LIMIT 100`,
            [req.user.id]
        );

        res.status(200).json({ success: true, data: activities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Mark all activities as read
// @route   PUT /api/social/activities/read
// @access  Protected
const markActivitiesAsRead = async (req, res) => {
    try {
        await pool.query('UPDATE activities SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
        res.status(200).json({ success: true, message: 'Activities marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get unread activity count
// @route   GET /api/social/activities/unread-count
// @access  Protected
const getUnreadActivityCount = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as unreadCount FROM activities WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.status(200).json({ success: true, count: rows[0].unreadCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- SAVED POSTS ---

// @desc    Toggle save post
// @route   POST /api/social/save-post/:postId
// @access  Protected
const toggleSavePost = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.postId;

    try {
        const [existing] = await pool.query(
            'SELECT * FROM saved_posts WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?', [userId, postId]);
            return res.status(200).json({ success: true, message: 'Post unsaved', isSaved: false });
        } else {
            await pool.query('INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            return res.status(201).json({ success: true, message: 'Post saved', isSaved: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all saved posts
// @route   GET /api/social/saved-posts
// @access  Protected
const getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const [savedPosts] = await pool.query(
            `SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             true as is_saved,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) > 0 as liked
             FROM saved_posts sp
             JOIN posts p ON sp.post_id = p.id
             JOIN users u ON p.user_id = u.id
             JOIN restaurants r ON p.restaurant_id = r.id
             WHERE sp.user_id = ?
             ORDER BY sp.created_at DESC`,
            [userId, userId]
        );

        res.status(200).json({ success: true, data: savedPosts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Helper function to log activity
const logActivity = async (userId, actorId, type, postId = null, text = null) => {
    try {
        await pool.query(
            'INSERT INTO activities (user_id, actor_id, type, post_id, text) VALUES (?, ?, ?, ?, ?)',
            [userId, actorId, type, postId, text]
        );
    } catch (err) {
        console.error('Error logging activity:', err);
    }
};

module.exports = {
    toggleFollow,
    addFavorite,
    removeFavorite,
    getFavorites,
    getFollowers,
    getFollowing,
    getActivities,
    markActivitiesAsRead,
    getUnreadActivityCount,
    toggleSavePost,
    getSavedPosts,
    logActivity
};
