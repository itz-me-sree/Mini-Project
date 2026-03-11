const pool = require('./db');

const addColumnIfNotExists = async (columnName, definition) => {
    const [columns] = await pool.query('SHOW COLUMNS FROM restaurants LIKE ?', [columnName]);
    if (columns.length === 0) {
        console.log(`➕ Adding column ${columnName}...`);
        await pool.query(`ALTER TABLE restaurants ADD COLUMN ${columnName} ${definition}`);
    } else {
        console.log(`⏩ Column ${columnName} already exists.`);
    }
};

const migrate = async () => {
    try {
        console.log('🚀 Starting migration...');

        await addColumnIfNotExists('source', "ENUM('internal', 'osm') DEFAULT 'internal'");
        await addColumnIfNotExists('lat', "DECIMAL(10, 8)");
        await addColumnIfNotExists('lng', "DECIMAL(11, 8)");
        await addColumnIfNotExists('osm_id', "BIGINT UNIQUE");

        console.log('✅ Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
