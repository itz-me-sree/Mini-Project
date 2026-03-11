const pool = require('../config/db');

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Protected
const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, full_name, username, email, profile_pic, bio, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get followers count
        const [[{ count: followersCount }]] = await pool.query(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
            [user.id]
        );

        // Get following count
        const [[{ count: followingCount }]] = await pool.query(
            'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
            [user.id]
        );

        // Get posts count
        const [[{ count: postsCount }]] = await pool.query(
            'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
            [user.id]
        );

        // Get total likes received across all posts and reviews
        const [[{ count: totalLikesRaw }]] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) +
                (SELECT COUNT(*) FROM restaurant_review_likes rrl JOIN restaurant_reviews rr ON rrl.review_id = rr.id WHERE rr.user_id = ?) as count`,
            [user.id, user.id]
        );
        const totalLikesCount = Number(totalLikesRaw);

        // Check if current user follows this user
        let isFollowing = false;
        if (req.user) {
            const [follows] = await pool.query(
                'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
                [req.user.id, user.id]
            );
            isFollowing = follows.length > 0;
        }

        res.status(200).json({
            success: true,
            data: {
                ...user,
                followersCount,
                followingCount,
                postsCount,
                totalLikesCount,
                isFollowing
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Protected
const updateProfile = async (req, res) => {
    const { full_name, bio, username } = req.body;
    let profile_pic = req.file ? req.file.filename : null;

    console.log('Update Profile Request:', { body: req.body, file: req.file });

    try {
        let query = 'UPDATE users SET ';
        const params = [];

        if (full_name) {
            query += 'full_name = ?, ';
            params.push(full_name);
        }

        if (username) {
            query += 'username = ?, ';
            params.push(username);
        }
        if (bio) {
            query += 'bio = ?, ';
            params.push(bio);
        }
        if (profile_pic) {
            query += 'profile_pic = ?, ';
            params.push(profile_pic);
        }

        if (params.length === 0) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }

        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ' WHERE id = ?';
        params.push(req.user.id);

        await pool.query(query, params);

        // Fetch updated user
        const [users] = await pool.query(
            'SELECT id, full_name, username, email, profile_pic, bio, role FROM users WHERE id = ?',
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: users[0]
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get user posts
// @route   GET /api/users/:id/posts
// @access  Protected
const getUserPosts = async (req, res) => {
    try {
        const [posts] = await pool.query(
            `SELECT p.*, r.name as restaurant_name, u.username, u.profile_pic 
             FROM posts p 
             JOIN restaurants r ON p.restaurant_id = r.id 
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ? 
             ORDER BY p.created_at DESC`,
            [req.params.id]
        );

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

// @desc    Get posts liked by specific user
// @route   GET /api/users/:id/liked
// @access  Protected
const getUserLikedPosts = async (req, res) => {
    const profileUserId = req.params.id;
    const currentUserId = req.user.id;
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
             JOIN likes l ON p.id = l.post_id
             WHERE l.user_id = ?
             ORDER BY p.created_at DESC`,
            [currentUserId, currentUserId, profileUserId]
        );

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get posts saved by specific user
// @route   GET /api/users/:id/saved
// @access  Protected
const getUserSavedPosts = async (req, res) => {
    const profileUserId = req.params.id;
    const currentUserId = req.user.id;

    // Optional: Only allow users to see their own saved posts
    if (profileUserId != currentUserId) {
        return res.status(200).json({ success: true, data: [], message: 'Private content' });
    }

    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.username, u.profile_pic, r.name as restaurant_name, r.location,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) > 0 as liked,
             true as is_saved
             FROM saved_posts sp
             JOIN posts p ON sp.post_id = p.id
             JOIN users u ON p.user_id = u.id
             JOIN restaurants r ON p.restaurant_id = r.id
             WHERE sp.user_id = ?
             ORDER BY sp.created_at DESC`,
            [currentUserId, profileUserId]
        );

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all reviews (posts + restaurant reviews) for a user
// @route   GET /api/users/:id/all-reviews
// @access  Protected
const getUserAllReviews = async (req, res) => {
    try {
        const [reviews] = await pool.query(
            `SELECT * FROM (
                SELECT 
                    'post' as type,
                    p.id,
                    p.user_id,
                    r.name as restaurant_name,
                    p.dish_name,
                    p.rating,
                    p.caption as text,
                    p.image,
                    r.image as restaurant_image,
                    r.category as restaurant_category,
                    p.created_at
                FROM posts p
                JOIN restaurants r ON p.restaurant_id = r.id
                WHERE p.user_id = ?

                UNION ALL

                SELECT 
                    'review' as type,
                    rr.id,
                    rr.user_id,
                    rr.restaurant_name,
                    NULL as dish_name,
                    rr.rating,
                    rr.review_text as text,
                    rr.image,
                    r.image as restaurant_image,
                    r.category as restaurant_category,
                    rr.created_at
                FROM restaurant_reviews rr
                LEFT JOIN restaurants r ON rr.restaurant_name = r.name
                WHERE rr.user_id = ?
            ) combined
            ORDER BY created_at DESC`,
            [req.params.id, req.params.id]
        );

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (err) {
        console.error('Get All Reviews Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get favorite restaurants for specific user
// @route   GET /api/users/:id/favorites
// @access  Protected
const getUserFavorites = async (req, res) => {
    const profileUserId = req.params.id;
    try {
        const [favorites] = await pool.query(
            `SELECT f.*, r.name, r.location, r.image, r.category 
             FROM favorites f 
             JOIN restaurants r ON f.restaurant_id = r.id 
             WHERE f.user_id = ?`,
            [profileUserId]
        );

        res.status(200).json({ success: true, data: favorites });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get suggested foodies (intelligent ranking)
// @route   GET /api/users/suggestions
// @access  Protected
const getSuggestedUsers = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT 
                u.id, u.username, u.full_name, u.profile_pic, u.bio,
                (
                    -- 1. Mutual Connections (+10 per mutual)
                    (SELECT COUNT(*) FROM follows f1 
                     JOIN follows f2 ON f1.following_id = f2.follower_id 
                     WHERE f1.follower_id = ? AND f2.following_id = u.id) * 10 
                    +
                    -- 2. Similar Interest (Shared restaurant categories) (+3)
                    CASE WHEN (
                        SELECT COUNT(DISTINCT r2.category) 
                        FROM posts p1 
                        JOIN restaurants r1 ON p1.restaurant_id = r1.id
                        JOIN posts p2 ON p2.user_id = u.id
                        JOIN restaurants r2 ON p2.restaurant_id = r2.id
                        WHERE p1.user_id = ? AND r1.category = r2.category
                    ) > 0 THEN 3 ELSE 0 END
                    +
                    -- 3. Location Similarity (Shared restaurant locations) (+5)
                    CASE WHEN (
                        SELECT COUNT(DISTINCT r3.location)
                        FROM posts p3 
                        JOIN restaurants r3 ON p3.restaurant_id = r3.id
                        JOIN posts p4 ON p4.user_id = u.id
                        JOIN restaurants r4 ON p4.restaurant_id = r4.id
                        WHERE p3.user_id = ? AND r3.location = r4.location
                    ) > 0 THEN 5 ELSE 0 END
                    +
                    -- 4. High Engagement Boost (+0.1 per follower)
                    (SELECT COUNT(*) FROM follows f3 WHERE f3.following_id = u.id) * 0.1
                ) AS suggestion_score
            FROM users u
            WHERE u.id != ? 
              AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
            ORDER BY suggestion_score DESC
            LIMIT 5
        `;

        const [suggestions] = await pool.query(query, [userId, userId, userId, userId, userId, userId]);

        res.status(200).json({
            success: true,
            data: suggestions
        });

    } catch (err) {
        console.error('Suggestions Error:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get level and achievements for user
// @route   GET /api/users/:id/level
// @access  Protected
const getLevelAndAchievements = async (req, res) => {
    const userId = req.params.id;

    try {
        // Count activity metrics
        const [[{ count: postsCount }]] = await pool.query(
            'SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]
        );
        const [[{ count: likesReceivedRaw }]] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) +
                (SELECT COUNT(*) FROM restaurant_review_likes rrl JOIN restaurant_reviews rr ON rrl.review_id = rr.id WHERE rr.user_id = ?) as count`,
            [userId, userId]
        );
        const likesReceived = Number(likesReceivedRaw);
        const [[{ count: followersCount }]] = await pool.query(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]
        );
        const [[{ count: ratingsGiven }]] = await pool.query(
            'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND rating > 0', [userId]
        );

        // Calculate total XP
        const total_xp = (postsCount * 20) + (likesReceived * 2) + (followersCount * 5);

        // Level thresholds
        const levels = [
            { level: 1, title: 'Newcomer', xp: 0 },
            { level: 2, title: 'Explorer', xp: 100 },
            { level: 3, title: 'Taste Tester', xp: 250 },
            { level: 4, title: 'Reviewer', xp: 500 },
            { level: 5, title: 'Critic', xp: 800 },
            { level: 6, title: 'Connoisseur', xp: 1200 },
            { level: 7, title: 'Influencer', xp: 1800 },
            { level: 8, title: 'Expert', xp: 2500 },
            { level: 9, title: 'Master', xp: 3500 },
            { level: 10, title: 'Legend', xp: 5000 }
        ];

        let current_level = 1;
        let level_title = 'Newcomer';
        let xp_current_level = 0;
        let xp_next_level = 100;
        let next_level_title = 'Explorer';

        for (let i = levels.length - 1; i >= 0; i--) {
            if (total_xp >= levels[i].xp) {
                current_level = levels[i].level;
                level_title = levels[i].title;
                xp_current_level = levels[i].xp;
                if (i < levels.length - 1) {
                    xp_next_level = levels[i + 1].xp;
                    next_level_title = levels[i + 1].title;
                } else {
                    xp_next_level = levels[i].xp;
                    next_level_title = 'Max Level';
                }
                break;
            }
        }

        // Define all achievements and check which are earned
        const allBadges = [
            // Influence
            { id: 'food_influencer', name: 'Food Influencer', icon: '⚡', category: 'influence', condition: 'Reach 200 followers', earned: followersCount >= 200 },
            { id: 'local_star', name: 'Local Star', icon: '⭐', category: 'influence', condition: 'Reach 500 followers', earned: followersCount >= 500 },
            { id: 'food_celebrity', name: 'Food Celebrity', icon: '👑', category: 'influence', condition: 'Reach 1000 followers', earned: followersCount >= 1000 },
            // Reviewer
            { id: 'first_bite', name: 'First Bite', icon: '🍴', category: 'reviewer', condition: 'Post your first review', earned: postsCount >= 1 },
            { id: 'food_explorer', name: 'Food Explorer', icon: '🧭', category: 'reviewer', condition: 'Post 5 reviews', earned: postsCount >= 5 },
            { id: 'taste_tester', name: 'Taste Tester', icon: '🍽️', category: 'reviewer', condition: 'Post 15 reviews', earned: postsCount >= 15 },
            { id: 'food_critic', name: 'Food Critic', icon: '📝', category: 'reviewer', condition: 'Post 30 reviews', earned: postsCount >= 30 },
            { id: 'master_reviewer', name: 'Master Reviewer', icon: '🏆', category: 'reviewer', condition: 'Post 50 reviews', earned: postsCount >= 50 },
            // Behavior
            { id: 'honest_rater', name: 'Honest Rater', icon: '⚖️', category: 'behavior', condition: 'Give 25 ratings', earned: ratingsGiven >= 25 },
            { id: 'elite_critic', name: 'Elite Critic', icon: '🎯', category: 'behavior', condition: 'Give 50 ratings', earned: ratingsGiven >= 50 },
            // Special
            { id: 'verified_foodie', name: 'Verified Foodie', icon: '🛡️', category: 'special', condition: 'Reach Level 5', earned: current_level >= 5 }
        ];

        const earned_badges = allBadges.filter(b => b.earned).map(b => b.id);

        res.status(200).json({
            success: true,
            data: {
                total_xp,
                current_level,
                level_title,
                xp_current_level,
                xp_next_level,
                next_level_title,
                earned_badges,
                all_badges: allBadges
            }
        });
    } catch (err) {
        console.error('Level Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Change Password
// @route   PUT /api/users/change-password
// @access  Protected
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');

    try {
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        res.status(200).json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('Change Pass Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete Account
// @route   DELETE /api/users/account
// @access  Protected
const deleteAccount = async (req, res) => {
    try {
        // In a real app, you might want to delete related data or mark as inactive
        // For this demo, we'll perform a full cleanup
        const userId = req.user.id;

        await pool.query('DELETE FROM follows WHERE follower_id = ? OR following_id = ?', [userId, userId]);
        await pool.query('DELETE FROM likes WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM saved_posts WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM comments WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM posts WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete Account Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {

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
};
