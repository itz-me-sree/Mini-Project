const pool = require('../config/db');
const osmService = require('../services/osm.service');

// @desc    Search restaurants by name
// @route   GET /api/search/restaurants
// @access  Protected
const searchRestaurants = async (req, res) => {
    let query = `
        SELECT r.*, 
               (SELECT COALESCE(AVG(rating), 0) FROM (
                   SELECT rating FROM posts WHERE restaurant_id = r.id
                   UNION ALL
                   SELECT rating FROM restaurant_reviews WHERE restaurant_name = r.name
               ) all_ratings) as avg_rating,
               (SELECT COUNT(*) FROM (
                   SELECT id FROM posts WHERE restaurant_id = r.id
                   UNION ALL
                   SELECT id FROM restaurant_reviews WHERE restaurant_name = r.name
               ) all_reviews) as reviews_count,
               (
                    COUNT(CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) * 2 +
                    (SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id = p2.id WHERE p2.restaurant_id = r.id) +
                    ((SELECT COALESCE(AVG(rating), 0) FROM (
                        SELECT rating FROM posts WHERE restaurant_id = r.id
                        UNION ALL
                        SELECT rating FROM restaurant_reviews WHERE restaurant_name = r.name
                    ) t) * 5) +
                    (SELECT COUNT(*) FROM comments c JOIN posts p3 ON c.post_id = p3.id WHERE p3.restaurant_id = r.id) +
                    (SELECT COUNT(*) FROM likes l3 JOIN posts p4 ON l3.post_id = p4.id 
                     WHERE p4.restaurant_id = r.id AND l3.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) +
                    (SELECT COUNT(*) FROM comments c2 JOIN posts p5 ON c2.post_id = p5.id 
                     WHERE p5.restaurant_id = r.id AND c2.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))
                ) as trending_score
        FROM restaurants r
        LEFT JOIN posts p ON r.id = p.restaurant_id
    `;
    const params = [];

    const { id, q, rating, status, sort } = req.query;

    if (id) {
        query += ` WHERE r.id = ? AND r.category NOT LIKE '%Bar%'`;
        params.push(id);
    } else {
        const searchTerm = q ? `%${q}%` : '%';
        query += ` WHERE (r.name LIKE ? OR r.category LIKE ? OR r.location LIKE ?) AND r.category NOT LIKE '%Bar%'`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY r.id`;

    // Having clause for rating
    if (rating && parseFloat(rating) > 0) {
        query += ` HAVING avg_rating >= ?`;
        params.push(parseFloat(rating));
    }

    // Order by clause
    if (sort === 'trending') {
        query += ` ORDER BY trending_score DESC`;
    } else if (sort === 'rating') {
        query += ` ORDER BY avg_rating DESC`;
    } else if (sort === 'reviews') {
        query += ` ORDER BY reviews_count DESC`;
    } else {
        query += ` ORDER BY r.id DESC`;
    }

    try {
        const [restaurants] = await pool.query(query, params);
        res.status(200).json({ success: true, data: restaurants });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Search users by username
// @route   GET /api/search/users
// @access  Protected
const searchUsers = async (req, res) => {
    const { q } = req.query;

    try {
        const [users] = await pool.query(
            'SELECT id, username, profile_pic, bio FROM users WHERE username LIKE ?',
            [`%${q}%`]
        );

        res.status(200).json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Unified search for users and restaurants
// @route   GET /api/search/unified
// @access  Public
const unifiedSearch = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, data: { users: [], restaurants: [] } });

    try {
        const [users] = await pool.query(
            'SELECT id, username, profile_pic, bio FROM users WHERE username LIKE ? OR full_name LIKE ? LIMIT 5',
            [`%${q}%`, `%${q}%`]
        );

        const [restaurants] = await pool.query(
            "SELECT id, name, category, location, image FROM restaurants WHERE (name LIKE ? OR category LIKE ?) AND category NOT LIKE '%Bar%' LIMIT 5",
            [`%${q}%`, `%${q}%`]
        );

        res.status(200).json({
            success: true,
            data: { users, restaurants }
        });
    } catch (err) {
        console.error('Unified Search Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Nearby search using OSM and local data
// @route   GET /api/search/nearby
// @access  Public
const nearbySearch = async (req, res) => {
    const { lat, lng, q } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    try {
        // 1. Fetch from OSM via service
        const osmRestaurants = await osmService.fetchNearbyFromOSM(lat, lng);

        // 2. Sync to DB
        if (osmRestaurants.length > 0) {
            await osmService.syncOSMToDB(osmRestaurants);
        }

        // 3. Fetch from our DB (which now includes synced OSM restaurants)
        // We'll search for restaurants within a small radius or just return everything nearby
        // For simplicity and since we just synced, we'll fetch from DB filtering by lat/lng roughly
        const [rows] = await pool.query(`
            SELECT r.*, 
                   (SELECT COALESCE(AVG(rating), 0) FROM (
                       SELECT rating FROM posts WHERE restaurant_id = r.id
                       UNION ALL
                       SELECT rating FROM restaurant_reviews WHERE restaurant_name = r.name
                   ) t) as avg_rating,
                   (SELECT COUNT(*) FROM (
                       SELECT id FROM posts WHERE restaurant_id = r.id
                       UNION ALL
                       SELECT id FROM restaurant_reviews WHERE restaurant_name = r.name
                   ) t2) as reviews_count,
                   (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
            FROM restaurants r
            WHERE (r.source != 'osm' OR (
                r.name NOT LIKE '%Akshaya%' AND 
                r.name NOT LIKE '%CSC%' AND 
                r.name NOT LIKE '%E-Center%' AND
                r.category NOT LIKE '%Internet_cafe%' AND
                r.category NOT LIKE '%Bank%' AND
                r.category NOT LIKE '%Office%'
            )) AND r.category NOT LIKE '%Bar%'
            HAVING distance < 5
            ORDER BY distance ASC
            LIMIT 50
        `, [lat, lng, lat]);

        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Nearby Search Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    searchRestaurants,
    searchUsers,
    unifiedSearch,
    nearbySearch
};
