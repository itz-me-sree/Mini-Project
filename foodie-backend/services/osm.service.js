const axios = require('axios');
const pool = require('../config/db');

const CUISINE_IMAGES = {
    'italian': 'https://images.unsplash.com/photo-1498579127083-ef40a08e068a',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    'japanese': 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d',
    'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
    'indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe',
    'chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e',
    'mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47',
    'burger': 'https://images.unsplash.com/photo-1571091718767-18b5c1457add',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    'fast_food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330',
    'restaurant': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    'korean': 'https://images.unsplash.com/photo-1590301157890-4810ed352733',
    'juice': 'https://images.unsplash.com/photo-1622597467827-0bb80cc66f1e',
    'dessert': 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
    'ice_cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a',
    'american': 'https://images.unsplash.com/photo-1534422298391-e4f8c170db0a',
    'pub': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b'
};

const ALLOWED_AMENITIES = ['restaurant', 'cafe', 'fast_food'];
const BANNED_KEYWORDS = ['akshaya', 'csc', 'e-center', 'bank', 'office', 'government'];

const getPlaceholderImage = (cuisine, amenity) => {
    const cuisines = (cuisine || '').toLowerCase().split(/[;,]+/).map(c => c.trim());
    const amen = (amenity || '').toLowerCase();

    // 1. Try specific cuisine
    for (const c of cuisines) {
        if (CUISINE_IMAGES[c]) return CUISINE_IMAGES[c];
        for (const key in CUISINE_IMAGES) {
            if (c.includes(key)) return CUISINE_IMAGES[key];
        }
    }

    // 2. Try amenity
    if (CUISINE_IMAGES[amen]) return CUISINE_IMAGES[amen];

    // 3. Absolute Fallback
    return CUISINE_IMAGES['default'];
};

/**
 * Strict filtering and normalization of OSM results
 */
const filterAndNormalizeOSMResults = (osmResults) => {
    console.log(`[OSM Filter] Processing ${osmResults.length} raw results...`);
    const validResults = [];

    osmResults.forEach(el => {
        const tags = el.tags || {};
        const name = tags.name?.trim();
        const amenity = tags.amenity?.toLowerCase();
        const lowerName = name?.toLowerCase() || "";

        // 1. Must have a name
        if (!name) return;

        // 2. Strict Whitelist Check
        if (!ALLOWED_AMENITIES.includes(amenity)) {
            console.log(`[OSM Rejected] Invalid Amenity: "${amenity}" | Name: "${name}"`);
            return;
        }

        // 3. Block Banned Keywords (Defensive against Akshaya centers etc)
        const isBanned = BANNED_KEYWORDS.some(kw => lowerName.includes(kw));
        if (isBanned) {
            console.log(`[OSM Rejected] Banned Keyword in Name: "${name}"`);
            return;
        }

        // 4. Block specific tags (like internet_access)
        if (tags.internet_access === 'yes' || tags.office) {
            console.log(`[OSM Rejected] Defensive catch (tag): "${name}"`);
            return;
        }

        // 5. Geometry Check
        const lat = el.lat || (el.center && el.center.lat);
        const lng = el.lon || (el.center && el.center.lon);
        if (!lat || !lng) return;

        const cuisine = tags.cuisine || '';

        validResults.push({
            osm_id: el.id,
            name: name,
            location: tags["addr:full"] ||
                (tags["addr:street"] ? `${tags["addr:housenumber"] || ''} ${tags["addr:street"]}`.trim() : null) ||
                "Address not available",
            category: cuisine ? cuisine.split(';')[0].charAt(0).toUpperCase() + cuisine.split(';')[0].slice(1) : (amenity.charAt(0).toUpperCase() + amenity.slice(1)),
            description: tags.description || `${cuisine ? cuisine.replace(/;/g, ', ') + ' ' : ''}${amenity} discovered via OpenStreetMap.`,
            image: getPlaceholderImage(cuisine, amenity),
            lat: lat,
            lng: lng,
            source: 'osm',
            avg_rating: 0,
            reviews_count: 0
        });
    });

    console.log(`[OSM Filter] Success: ${validResults.length}/${osmResults.length} kept.`);
    return validResults;
};

const fetchNearbyFromOSM = async (lat, lng, radius = 2000) => {
    // Precise Overpass query (no regex, explicit equality)
    const query = `
        [out:json];
        (
          node["amenity"="restaurant"](around:${radius},${lat},${lng});
          node["amenity"="cafe"](around:${radius},${lat},${lng});
          node["amenity"="fast_food"](around:${radius},${lat},${lng});
          way["amenity"="restaurant"](around:${radius},${lat},${lng});
          way["amenity"="cafe"](around:${radius},${lat},${lng});
          way["amenity"="fast_food"](around:${radius},${lat},${lng});
        );
        out center;
    `;

    try {
        const response = await axios.post("https://overpass-api.de/api/interpreter", query, { timeout: 15000 });
        const rawElements = response.data.elements || [];

        return filterAndNormalizeOSMResults(rawElements);
    } catch (error) {
        console.error('[OSM Fetch Error]', error.message);
        return [];
    }
};

const syncOSMToDB = async (restaurants) => {
    if (!restaurants.length) return;

    const query = `
        INSERT INTO restaurants (name, location, category, description, image, lat, lng, source, osm_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        location = VALUES(location),
        category = VALUES(category),
        lat = VALUES(lat),
        lng = VALUES(lng),
        source = 'osm'
    `;

    const values = restaurants.map(r => [
        r.name, r.location, r.category, r.description, r.image, r.lat, r.lng, r.source, r.osm_id
    ]);

    try {
        await pool.query(query, [values]);
    } catch (error) {
        console.error('[Sync OSM Error]', error.message);
    }
};

module.exports = {
    fetchNearbyFromOSM,
    syncOSMToDB,
    filterAndNormalizeOSMResults
};
