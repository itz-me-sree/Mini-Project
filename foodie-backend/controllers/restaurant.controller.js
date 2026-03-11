const pool = require('../config/db');


// ── GET /api/restaurants/detail?name= ──────────────────────────────────────
const getRestaurantByName = async (req, res) => {
    const { name } = req.query;
    const userId = req.user ? req.user.id : -1;

    if (!name) return res.status(400).json({ success: false, message: 'Restaurant name required' });

    try {
        // Get aggregate stats from both sources
        const [[stats]] = await pool.query(`
            SELECT
                COUNT(*) as total_reviews,
                COALESCE(AVG(rating), 0) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as r5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as r4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as r3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as r2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as r1,
                (
                    SELECT COUNT(*) FROM posts p2 JOIN restaurants r2 ON p2.restaurant_id = r2.id WHERE r2.name = ? AND p2.image IS NOT NULL
                ) + (
                    SELECT COUNT(*) FROM restaurant_reviews WHERE restaurant_name = ? AND image IS NOT NULL
                ) + (
                    SELECT COUNT(*) FROM restaurant_photos WHERE restaurant_name = ?
                ) as total_photos
            FROM (
                SELECT p.rating FROM posts p JOIN restaurants r ON p.restaurant_id = r.id WHERE r.name = ?
                UNION ALL
                SELECT rating FROM restaurant_reviews WHERE restaurant_name = ?
            ) all_reviews
        `, [name, name, name, name, name]);

        const [[restInfo]] = await pool.query(`
            SELECT r.*, 
                   COUNT(DISTINCT rf.user_id) as followers_count,
                   COUNT(DISTINCT rs.user_id) as saves_count,
                   ${userId !== -1 ? `(SELECT COUNT(*) FROM restaurant_followers WHERE restaurant_name = r.name AND user_id = ${userId}) > 0` : 'false'} as is_following,
                   ${userId !== -1 ? `(SELECT COUNT(*) FROM restaurant_saves WHERE restaurant_name = r.name AND user_id = ${userId}) > 0` : 'false'} as is_saved
            FROM restaurants r
            LEFT JOIN restaurant_followers rf ON rf.restaurant_name = r.name
            LEFT JOIN restaurant_saves rs ON rs.restaurant_name = r.name
            WHERE r.name = ?
            GROUP BY r.id
        `, [name]);

        // Get photos from all sources: posts, restaurant_reviews, and restaurant_photos
        const [postPhotos] = await pool.query(`
            SELECT p.image as url, u.username, u.profile_pic, p.created_at
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN restaurants r ON p.restaurant_id = r.id
            WHERE r.name = ? AND p.image IS NOT NULL
            ORDER BY p.created_at DESC
            LIMIT 10
        `, [name]);

        const [reviewPhotos] = await pool.query(`
            SELECT rr.image as url, u.username, u.profile_pic, rr.created_at
            FROM restaurant_reviews rr
            JOIN users u ON rr.user_id = u.id
            WHERE rr.restaurant_name = ? AND rr.image IS NOT NULL
            ORDER BY rr.created_at DESC
            LIMIT 10
        `, [name]);

        const [standalonePhotos] = await pool.query(`
            SELECT rp.image_url as url, u.username, u.profile_pic, rp.created_at
            FROM restaurant_photos rp
            JOIN users u ON rp.user_id = u.id
            WHERE rp.restaurant_name = ?
            ORDER BY rp.created_at DESC
            LIMIT 10
        `, [name]);

        res.json({
            success: true,
            data: {
                restaurant: restInfo || { name, address: '', phone: '', website: '' },
                stats: {
                    ...stats,
                    avg_rating: parseFloat(stats.avg_rating || 0).toFixed(1),
                    total_reviews: stats.total_reviews || 0,
                    followers_count: restInfo?.followers_count || 0,
                    saves_count: restInfo?.saves_count || 0,
                    is_following: !!restInfo?.is_following,
                    is_saved: !!restInfo?.is_saved,
                },
                photos: [...postPhotos, ...reviewPhotos, ...standalonePhotos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20),
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── GET /api/restaurants/reviews?name=&filter= ─────────────────────────────
const getRestaurantReviews = async (req, res) => {
    const { name, filter = 'smart' } = req.query;
    const userId = req.user ? req.user.id : -1;

    if (!name) return res.status(400).json({ success: false, message: 'Restaurant name required' });

    let orderClause;
    switch (filter) {
        case 'friends': orderClause = `ORDER BY is_friend DESC, rr.created_at DESC`; break;
        case 'top': orderClause = `ORDER BY author_followers DESC, rr.created_at DESC`; break;
        case 'liked': orderClause = `ORDER BY likes_count DESC, rr.created_at DESC`; break;
        case 'newest': orderClause = `ORDER BY rr.created_at DESC`; break;
        case 'oldest': orderClause = `ORDER BY rr.created_at ASC`; break;
        default: orderClause = `ORDER BY is_friend DESC, (author_followers > 500) DESC, likes_count DESC, rr.created_at DESC`;
    }

    try {
        const [reviews] = await pool.query(`
            SELECT rr.*,
                u.username, u.profile_pic,
                (SELECT COUNT(*) FROM restaurant_review_likes rl WHERE rl.review_id = rr.id) as likes_count,
                ${userId !== -1 ? `(SELECT COUNT(*) FROM restaurant_review_likes rl2 WHERE rl2.review_id = rr.id AND rl2.user_id = ${userId}) > 0` : 'false'} as user_liked,
                ${userId !== -1 ? `(SELECT COUNT(*) FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = rr.user_id) > 0` : 'false'} as is_friend,
                (SELECT COUNT(*) FROM follows WHERE following_id = rr.user_id) as author_followers,
                (SELECT COUNT(*) FROM restaurant_review_comments rc WHERE rc.review_id = rr.id AND rc.parent_id IS NULL) as comments_count
            FROM restaurant_reviews rr
            JOIN users u ON rr.user_id = u.id
            WHERE rr.restaurant_name = ?
            ${orderClause}
        `, [name]);

        res.json({ success: true, data: reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/reviews?name= ────────────────────────────────────
const addReview = async (req, res) => {
    const { name } = req.query;
    const { rating, review_text } = req.body;
    const userId = req.user.id;
    const image = req.file ? req.file.filename : null;

    if (!name || !rating) return res.status(400).json({ success: false, message: 'Name and rating required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO restaurant_reviews (restaurant_name, user_id, rating, review_text, image) VALUES (?, ?, ?, ?, ?)',
            [name, userId, rating, review_text || null, image]
        );
        res.status(201).json({ success: true, message: 'Review posted!', data: { id: result.insertId } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/save?name= ───────────────────────────────────────
const toggleSave = async (req, res) => {
    const { name } = req.query;
    const userId = req.user.id;
    try {
        const [existing] = await pool.query('SELECT id FROM restaurant_saves WHERE restaurant_name = ? AND user_id = ?', [name, userId]);
        if (existing.length) {
            await pool.query('DELETE FROM restaurant_saves WHERE restaurant_name = ? AND user_id = ?', [name, userId]);
            return res.json({ success: true, saved: false, message: 'Removed from favourites' });
        }
        await pool.query('INSERT INTO restaurant_saves (restaurant_name, user_id) VALUES (?, ?)', [name, userId]);
        res.status(201).json({ success: true, saved: true, message: 'Saved to favourites!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/follow?name= ─────────────────────────────────────
const toggleFollow = async (req, res) => {
    const { name } = req.query;
    const userId = req.user.id;
    try {
        const [existing] = await pool.query('SELECT id FROM restaurant_followers WHERE restaurant_name = ? AND user_id = ?', [name, userId]);
        if (existing.length) {
            await pool.query('DELETE FROM restaurant_followers WHERE restaurant_name = ? AND user_id = ?', [name, userId]);
            return res.json({ success: true, following: false, message: 'Unfollowed' });
        }
        await pool.query('INSERT INTO restaurant_followers (restaurant_name, user_id) VALUES (?, ?)', [name, userId]);
        res.status(201).json({ success: true, following: true, message: 'Now following!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/reviews/:reviewId/like ───────────────────────────
const toggleReviewLike = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    try {
        const [existing] = await pool.query('SELECT id FROM restaurant_review_likes WHERE review_id = ? AND user_id = ?', [reviewId, userId]);
        if (existing.length) {
            await pool.query('DELETE FROM restaurant_review_likes WHERE review_id = ? AND user_id = ?', [reviewId, userId]);
            return res.json({ success: true, liked: false });
        }
        await pool.query('INSERT INTO restaurant_review_likes (review_id, user_id) VALUES (?, ?)', [reviewId, userId]);
        res.status(201).json({ success: true, liked: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── GET /api/restaurants/reviews/:reviewId/comments ────────────────────────
const getReviewComments = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user ? req.user.id : -1;
    const filter = req.query.filter || 'smart';

    let orderClause;
    switch (filter) {
        case 'friends': orderClause = `ORDER BY is_friend DESC, c.created_at DESC`; break;
        case 'top': orderClause = `ORDER BY author_followers DESC, c.created_at DESC`; break;
        case 'liked': orderClause = `ORDER BY likes_count DESC`; break;
        case 'newest': orderClause = `ORDER BY c.created_at DESC`; break;
        case 'oldest': orderClause = `ORDER BY c.created_at ASC`; break;
        default: orderClause = `ORDER BY is_friend DESC, likes_count DESC, c.created_at DESC`;
    }

    try {
        const [comments] = await pool.query(`
            SELECT c.*, u.username, u.profile_pic,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
                ${userId !== -1 ? `(SELECT COUNT(*) FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = ${userId}) > 0` : 'false'} as user_liked,
                ${userId !== -1 ? `(SELECT COUNT(*) FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = c.user_id) > 0` : 'false'} as is_friend,
                (SELECT COUNT(*) FROM follows WHERE following_id = c.user_id) as author_followers,
                (SELECT COUNT(*) FROM restaurant_review_comments rc WHERE rc.parent_id = c.id) as replies_count
            FROM restaurant_review_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.review_id = ? AND c.parent_id IS NULL
            ${orderClause}
        `, [reviewId]);

        res.json({ success: true, data: comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── GET /api/restaurants/reviews/:reviewId/comments/:commentId/replies ──────
const getCommentReplies = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user ? req.user.id : -1;

    try {
        const [replies] = await pool.query(`
            SELECT c.*, u.username, u.profile_pic,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
                ${userId !== -1 ? `(SELECT COUNT(*) FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = ${userId}) > 0` : 'false'} as user_liked,
                (SELECT COUNT(*) FROM restaurant_review_comments rc WHERE rc.parent_id = c.id) as replies_count
            FROM restaurant_review_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.parent_id = ?
            ORDER BY c.created_at ASC
        `, [commentId]);

        res.json({ success: true, data: replies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/reviews/:reviewId/comments ───────────────────────
const addReviewComment = async (req, res) => {
    const { reviewId } = req.params;
    const { comment, parent_id } = req.body;
    const userId = req.user.id;

    if (!comment) return res.status(400).json({ success: false, message: 'Comment required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO restaurant_review_comments (review_id, user_id, comment, parent_id) VALUES (?, ?, ?, ?)',
            [reviewId, userId, comment, parent_id || null]
        );
        res.status(201).json({ success: true, message: 'Comment posted!', data: { id: result.insertId } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── POST /api/restaurants/photos?name= ─────────────────────────────────────
const addPhoto = async (req, res) => {
    const { name } = req.query;
    const userId = req.user.id;
    const image_url = req.file ? req.file.filename : null;

    if (!image_url) return res.status(400).json({ success: false, message: 'Image required' });

    try {
        await pool.query('INSERT INTO restaurant_photos (restaurant_name, user_id, image_url) VALUES (?, ?, ?)', [name, userId, image_url]);
        res.status(201).json({ success: true, message: 'Photo added!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ── GET /api/restaurants/trending ───────────────────────────────────────────
const getTrendingRestaurants = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, r.name, r.location, r.category, r.image,
                (SELECT COALESCE(AVG(rating), 0) FROM (
                    SELECT rating FROM posts WHERE restaurant_id = r.id
                    UNION ALL
                    SELECT rating FROM restaurant_reviews WHERE restaurant_name = r.name
                ) all_ratings) as avg_rating,
                (SELECT COUNT(*) FROM (
                    SELECT id FROM posts WHERE restaurant_id = r.id
                    UNION ALL
                    SELECT id FROM restaurant_reviews WHERE restaurant_name = r.name
                ) all_reviews) as review_count,
                (
                    -- Recent reviews (last 7 days) count * 2
                    COUNT(CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) * 2 +
                    -- Total likes on reviews
                    (SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id = p2.id WHERE p2.restaurant_id = r.id) +
                    -- Average rating * 5
                    ((SELECT COALESCE(AVG(rating), 0) FROM (
                        SELECT rating FROM posts WHERE restaurant_id = r.id
                        UNION ALL
                        SELECT rating FROM restaurant_reviews WHERE restaurant_name = r.name
                    ) t) * 5) +
                    -- Total comments on reviews
                    (SELECT COUNT(*) FROM comments c JOIN posts p3 ON c.post_id = p3.id WHERE p3.restaurant_id = r.id) +
                    -- Recent engagement boost (likes in last 7 days)
                    (SELECT COUNT(*) FROM likes l3 JOIN posts p4 ON l3.post_id = p4.id 
                     WHERE p4.restaurant_id = r.id AND l3.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) +
                    -- Recent engagement boost (comments in last 7 days)
                    (SELECT COUNT(*) FROM comments c2 JOIN posts p5 ON c2.post_id = p5.id 
                     WHERE p5.restaurant_id = r.id AND c2.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
                ) as trending_score
            FROM restaurants r
            LEFT JOIN posts p ON r.id = p.restaurant_id
            WHERE r.category NOT LIKE '%Bar%'
            GROUP BY r.id
            ORDER BY trending_score DESC
            LIMIT 5
        `;

        const [rows] = await pool.query(query);

        // Format the results
        const formatted = rows.map(r => ({
            ...r,
            avg_rating: parseFloat(r.avg_rating).toFixed(1),
            trending_score: parseFloat(r.trending_score).toFixed(2)
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Trending Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {

    getRestaurantByName,
    getRestaurantReviews,
    addReview,
    toggleSave,
    toggleFollow,
    toggleReviewLike,
    getReviewComments,
    getCommentReplies,
    addReviewComment,
    addPhoto,
    getTrendingRestaurants,
};
