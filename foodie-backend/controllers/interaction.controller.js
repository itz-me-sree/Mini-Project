const pool = require('../config/db');
const { logActivity } = require('./social.controller');

// --- LIKE SYSTEM ---

// @desc    Toggle like on a post
// @route   POST /api/interactions/like/:postId
// @access  Protected
const toggleLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Check if like exists
        const [likes] = await pool.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);

        if (likes.length > 0) {
            // Remove like
            await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
            return res.status(200).json({ success: true, message: 'Unliked', liked: false });
        } else {
            // Add like
            await pool.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);

            // Log Activity
            // Need post owner ID
            const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
            if (posts.length > 0 && posts[0].user_id !== userId) {
                await logActivity(posts[0].user_id, userId, 'like', postId);
            }

            return res.status(201).json({ success: true, message: 'Liked', liked: true });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- COMMENTS ---

// ... (skipping addComment and getComments for now as they will be replaced)
const addComment = async (req, res) => {
    const { postId } = req.params;
    const { comment, parent_id } = req.body;
    const userId = req.user.id;

    if (!comment) {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO comments (user_id, post_id, comment, parent_id) VALUES (?, ?, ?, ?)',
            [userId, postId, comment, parent_id || null]
        );

        // Log Activity
        const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        if (posts.length > 0 && posts[0].user_id !== userId) {
            await logActivity(posts[0].user_id, userId, 'comment', postId, comment);
        }

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                user_id: userId,
                post_id: postId,
                comment,
                parent_id: parent_id || null
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getComments = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user ? req.user.id : -1;
    const filter = req.query.filter || 'smart';

    try {
        let orderClause;
        switch (filter) {
            case 'friends':
                orderClause = `ORDER BY is_friend DESC, c.created_at DESC`;
                break;
            case 'top':
                orderClause = `ORDER BY author_followers_count DESC, c.created_at DESC`;
                break;
            case 'liked':
                orderClause = `ORDER BY likes_count DESC, c.created_at DESC`;
                break;
            case 'newest':
                orderClause = `ORDER BY c.created_at DESC`;
                break;
            case 'oldest':
                orderClause = `ORDER BY c.created_at ASC`;
                break;
            case 'smart':
            default:
                orderClause = `ORDER BY is_friend DESC, (author_followers_count > 1000) DESC, likes_count DESC, c.created_at DESC`;
        }

        let whereClause = `WHERE c.post_id = ? AND c.parent_id IS NULL`;
        if (filter === 'friends' && userId !== -1) {
            whereClause += ` AND (SELECT COUNT(*) FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = c.user_id) > 0`;
        }

        const queryParams = filter === 'friends' && userId !== -1
            ? [userId, userId, postId, userId]
            : [userId, userId, postId];

        const query = `
            SELECT c.*, u.username, u.profile_pic,
                   (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
                   (SELECT COUNT(*) FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = ?) as user_liked,
                   (SELECT COUNT(*) FROM follows f3 WHERE f3.follower_id = ? AND f3.following_id = c.user_id) as is_friend,
                   (SELECT COUNT(*) FROM follows f4 WHERE f4.following_id = c.user_id) as author_followers_count,
                   (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) as replies_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            ${whereClause}
            ${orderClause}
        `;

        const [comments] = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            data: comments
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getReplies = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user ? req.user.id : -1;

    try {
        const [replies] = await pool.query(
            `SELECT c.*, u.username, u.profile_pic,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
                (SELECT COUNT(*) FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = ?) as user_liked,
                (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) as replies_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.parent_id = ?
            ORDER BY c.created_at ASC`,
            [userId, commentId]
        );

        res.status(200).json({ success: true, data: replies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const toggleCommentLike = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        const [likes] = await pool.query('SELECT * FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);

        if (likes.length > 0) {
            await pool.query('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
            return res.status(200).json({ success: true, message: 'Unliked comment', liked: false });
        } else {
            await pool.query('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [userId, commentId]);
            return res.status(201).json({ success: true, message: 'Liked comment', liked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const reportContent = async (req, res) => {
    const reporterId = req.user.id;
    const { reported_type, reported_id, reason } = req.body;

    if (!['post', 'comment', 'user', 'restaurant'].includes(reported_type) || !reported_id || !reason) {
        return res.status(400).json({ success: false, message: 'Invalid report data' });
    }

    try {
        await pool.query(
            'INSERT INTO reports (reporter_id, reported_type, reported_id, reason) VALUES (?, ?, ?, ?)',
            [reporterId, reported_type, reported_id, reason]
        );
        res.status(201).json({ success: true, message: 'Report submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    toggleLike,
    addComment,
    getComments,
    getReplies,
    toggleCommentLike,
    reportContent
};
