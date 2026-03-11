let map;
let typeSelect;
let markersLayer;

function initMap() {
    // Initialize Leaflet map targeting the 'map' div
    map = L.map('map').setView([8.5241, 76.9366], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    typeSelect = document.querySelector('.type-select');
    typeSelect.addEventListener('change', () => {
        nearbySearch();
    });

    // Initial search
    nearbySearch();

    // Re-search when map is moved/panned
    map.on('moveend', () => {
        nearbySearch();
    });
}

async function nearbySearch() {
    const center = map.getCenter();
    const lat = center.lat;
    const lon = center.lng;

    // Calculate radius based on map bounds (roughly)
    const bounds = map.getBounds();
    const radius = Math.min(map.distance(bounds.getNorthEast(), bounds.getSouthWest()) / 2, 5000);

    const amenity = typeSelect.value;

    const query = `
        [out:json];
        (
          node["amenity"="${amenity}"](around:${radius},${lat},${lon});
          way["amenity"="${amenity}"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query
        });
        const data = await response.json();
        const elements = data.elements;

        // Clear existing markers
        markersLayer.clearLayers();

        if (elements && elements.length) {
            elements.forEach((el) => {
                const position = [
                    el.lat || el.center.lat,
                    el.lon || el.center.lon
                ];

                const name = el.tags.name || "Unnamed " + amenity;
                const address = el.tags['addr:full'] || el.tags['addr:street'] || 'Address not available';
                const website = el.tags.website ? `<br><a href="${el.tags.website}" target="_blank">Visit Website</a>` : '';

                const popupContent = `
                    <div style="font-family: sans-serif;">
                        <h4 style="margin: 0 0 5px 0;">${name}</h4>
                        <p style="margin: 0; font-size: 13px; color: #666;">${address}</p>
                        ${website}
                    </div>
                `;

                L.marker(position)
                    .bindPopup(popupContent)
                    .addTo(markersLayer);
            });
        } else {
            console.log('No Overpass results found for: ' + amenity);
        }
    } catch (error) {
        console.error('Overpass API error:', error);
    }
}

// Start the map
initMap();