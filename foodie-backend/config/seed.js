const pool = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Clear existing data (optional, but good for a clean seed)
        // Be careful with this in production!
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE users');
        await pool.query('TRUNCATE TABLE restaurants');
        await pool.query('TRUNCATE TABLE posts');
        await pool.query('TRUNCATE TABLE likes');
        await pool.query('TRUNCATE TABLE comments');
        await pool.query('TRUNCATE TABLE follows');
        await pool.query('TRUNCATE TABLE favorites');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Tables cleared.');

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 3. Seed Users
        const users = [
            ['alexfoods', 'alex@example.com', hashedPassword, 'https://i.pravatar.cc/150?img=11', 'Chasing great bites 🍜 | Food critic | 500+ reviews', 'user'],
            ['priyaeats', 'priya@example.com', hashedPassword, 'https://i.pravatar.cc/150?img=25', 'Street food lover & home cook', 'user'],
            ['marcusbites', 'marcus@example.com', hashedPassword, 'https://i.pravatar.cc/150?img=33', 'From ramen to ravioli 🍝', 'user'],
            ['sofiaplates', 'sofia@example.com', hashedPassword, 'https://i.pravatar.cc/150?img=47', 'Vegetarian foodie | Recipe developer', 'user'],
            ['jordanwok', 'jordan@example.com', hashedPassword, 'https://i.pravatar.cc/150?img=52', 'Asian cuisine explorer 🥢', 'user'],
            ['admin', 'admin@foodie.com', hashedPassword, 'https://i.pravatar.cc/150?img=12', 'System Administrator', 'admin']
        ];

        const userMap = {};
        for (const user of users) {
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password, profile_pic, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
                user
            );
            userMap[user[0]] = result.insertId;
        }
        console.log('✅ Users seeded.');

        // 4. Seed Restaurants
        const restaurants = [
            ['Sakura Ramen House', '42 Noodle Lane, Downtown', 'Japanese', 'Authentic tonkotsu ramen house.', 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600', userMap['admin']],
            ['The Spice Route', '18 Curry Street, Midtown', 'Indian', 'Flavors from the heart of India.', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', userMap['admin']],
            ['Bella Napoli', '7 Pasta Piazza, Soho', 'Italian', 'Traditional Neapolitan wood-fired pizza.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', userMap['admin']],
            ['Seoul Kitchen', '93 K-Food Ave, Koreatown', 'Korean', 'Modern Korean BBQ experience.', 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600', userMap['admin']]
        ];

        const restoMap = {};
        for (const resto of restaurants) {
            const [result] = await pool.query(
                'INSERT INTO restaurants (name, location, category, description, image, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                resto
            );
            restoMap[resto[0]] = result.insertId;
        }
        console.log('✅ Restaurants seeded.');

        // 5. Seed Posts
        const posts = [
            [userMap['alexfoods'], restoMap['Sakura Ramen House'], 'Absolutely mind-blowing tonkotsu ramen 🍜 The broth was simmered for 18 hours!', 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800', 5],
            [userMap['sofiaplates'], restoMap['Bella Napoli'], 'This margherita is poetry on a plate 🍕 Fresh buffalo mozzarella and basil!', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', 5],
            [userMap['priyaeats'], restoMap['The Spice Route'], 'The lamb biryani is pure comfort food 🌶️ Fragrant and tender!', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 4],
            [userMap['jordanwok'], restoMap['Seoul Kitchen'], 'Korean BBQ night done right! 🔥 Perfectly marinated and grilled.', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800', 5]
        ];

        for (const post of posts) {
            await pool.query(
                'INSERT INTO posts (user_id, restaurant_id, caption, image, rating) VALUES (?, ?, ?, ?, ?)',
                post
            );
        }
        console.log('✅ Posts seeded.');

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seedDatabase();
