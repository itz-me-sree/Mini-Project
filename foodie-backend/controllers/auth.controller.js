const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    const { full_name, username, email, password } = req.body;

    try {
        // Check if user exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const defaultPic = 'profile_pic-1772205025364-612489142.png';
        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, email, password, profile_pic) VALUES (?, ?, ?, ?, ?)',
            [full_name || username, username, email, hashedPassword, defaultPic]
        );

        const userId = result.insertId;

        // Generate JWT
        const token = jwt.sign(
            { id: userId, username, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            data: {
                id: userId,
                full_name: full_name || username,
                username,
                email,
                profile_pic: defaultPic,
                role: 'user',
                token
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                profile_pic: user.profile_pic,
                bio: user.bio,
                website: user.website,
                role: user.role,
                token
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

module.exports = {
    register,
    login
};
