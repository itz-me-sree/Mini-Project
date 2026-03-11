const pool = require('../config/db');


// @desc  Get dashboard stats
// @route GET /api/admin/stats
const getStats = async (req, res) => {
    try {
        const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
        const [[{ postCount }]] = await pool.query('SELECT COUNT(*) as postCount FROM posts');
        const [[{ restaurantCount }]] = await pool.query('SELECT COUNT(*) as restaurantCount FROM restaurants');
        const [[{ suspendedCount }]] = await pool.query("SELECT COUNT(*) as suspendedCount FROM users WHERE status = 'suspended'");

        res.json({ success: true, data: { userCount, postCount, restaurantCount, suspendedCount } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Get all users
// @route GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, full_name, username, email, role, status, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Suspend or activate a user
// @route PUT /api/admin/users/:id/status
const setUserStatus = async (req, res) => {
    const { status } = req.body; // 'active' | 'suspended'
    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    try {
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `User ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Delete a user
// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Get all posts (admin view)
// @route GET /api/admin/posts
const getPosts = async (req, res) => {
    try {
        const [posts] = await pool.query(
            `SELECT p.id, p.caption, p.image, p.rating, p.created_at,
                    u.username, u.full_name,
                    r.name AS restaurant_name,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id)    AS likes_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
             FROM posts p
             JOIN users u ON p.user_id = u.id
             JOIN restaurants r ON p.restaurant_id = r.id
             ORDER BY p.created_at DESC`
        );
        res.json({ success: true, data: posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Delete a post (admin)
// @route DELETE /api/admin/posts/:id
const deletePost = async (req, res) => {
    try {
        await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Get all restaurants (admin view)
// @route GET /api/admin/restaurants
const getRestaurants = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.id, r.name, r.location, r.category, r.image, r.created_at,
                    COALESCE(ROUND(AVG(p.rating), 1), 0) AS avg_rating,
                    COUNT(p.id) AS review_count
             FROM restaurants r
             LEFT JOIN posts p ON p.restaurant_id = r.id
             GROUP BY r.id
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Add a restaurant (admin)
// @route POST /api/admin/restaurants
const addRestaurant = async (req, res) => {
    const { name, location, category } = req.body;
    if (!name || !location) {
        return res.status(400).json({ success: false, message: 'Name and location are required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO restaurants (name, location, category, created_by) VALUES (?, ?, ?, ?)',
            [name, location, category || 'General', req.user.id]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, location, category } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Delete a restaurant (admin)
// @route DELETE /api/admin/restaurants/:id
const deleteRestaurant = async (req, res) => {
    try {
        await pool.query('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Restaurant deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Get all reports (admin view)
// @route GET /api/admin/reports
const getReports = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.id, r.reporter_id, r.reported_type, r.reported_id, r.reason, r.status, r.created_at,
                    u.username AS reporter_username
             FROM reports r
             JOIN users u ON r.reporter_id = u.id
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc  Update status of a report (admin)
// @route PUT /api/admin/reports/:id/status
const setReportStatus = async (req, res) => {
    const { status } = req.body;
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Report marked as ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getStats,
    getUsers, setUserStatus, deleteUser,
    getPosts, deletePost,
    getRestaurants, addRestaurant, deleteRestaurant,
    getReports, setReportStatus
};
