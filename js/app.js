// Initialize Map
let map = null;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('destination-input');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Initialize map with a default view (e.g., World)
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Autocomplete
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value;
        if (query.length < 3) {
            document.getElementById('suggestions').style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.getElementById('suggestions').style.display = 'none';
        }
    });
});

async function fetchSuggestions(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const suggestionsBox = document.getElementById('suggestions');
        suggestionsBox.innerHTML = '';

        if (data.length > 0) {
            suggestionsBox.style.display = 'block';
            data.forEach(place => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${place.display_name}`;
                div.addEventListener('click', () => {
                    document.getElementById('destination-input').value = place.display_name.split(',')[0]; // Just the city name
                    suggestionsBox.style.display = 'none';
                    handleSearch();
                });
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.style.display = 'none';
        }
    } catch (e) {
        console.error('Autocomplete Error:', e);
    }
}

async function handleSearch() {
    const city = document.getElementById('destination-input').value.trim();
    if (!city) return;

    showLoader(true);

    try {
        // 1. Get Coordinates (using OpenWeather Geocoding)
        const geoData = await getCoordinates(city);
        if (!geoData) {
            alert('Location not found!');
            showLoader(false);
            return;
        }

        const { lat, lon, name, country } = geoData;

        // Show Dashboard
        document.getElementById('dashboard').style.display = 'grid';

        // 2. Update Map
        updateMap(lat, lon);

        // 3. Fetch Weather
        const weatherData = await fetchWeather(lat, lon);
        updateWeatherUI(weatherData);

        // 4. Fetch Images
        fetchImages(name);

        // 5. Fetch Attractions (OpenTripMap)
        fetchAttractions(lat, lon);

        // 6. Generate AI Content (Gemini)
        const duration = document.getElementById('duration-input').value || 3;
        generateAIContent(name, country, weatherData, duration);

    } catch (error) {
        console.error('Error during search:', error);
        alert('Something went wrong. Please try again.');
    } finally {
        showLoader(false);
    }
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
}

async function getCoordinates(city) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${CONFIG.OPENWEATHER_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
}

function updateMap(lat, lon) {
    map.setView([lat, lon], 13);

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Add marker for center
    const mainMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup('Destination Center')
        .openPopup();
    markers.push(mainMarker);
}

async function fetchWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.OPENWEATHER_KEY}`;
    const res = await fetch(url);
    return await res.json();
}

function updateWeatherUI(data) {
    document.getElementById('temp-display').innerText = `${Math.round(data.main.temp)}°`;
    document.getElementById('weather-desc').innerText = data.weather[0].description;
    document.getElementById('feels-like').innerText = `${Math.round(data.main.feels_like)}°`;
    document.getElementById('humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('wind-speed').innerText = `${data.wind.speed} km/h`;

    // Icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weather-icon-container').innerHTML = `<img src="${iconUrl}" alt="Weather Icon">`;
}

async function fetchImages(query) {
    const url = `https://api.unsplash.com/search/photos?query=${query} travel&per_page=4&orientation=landscape&client_id=${CONFIG.UNSPLASH_ACCESS_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        const gallery = document.getElementById('image-gallery');
        gallery.innerHTML = '';

        data.results.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img.urls.small;
            imgEl.className = 'place-image';
            imgEl.alt = img.alt_description;
            gallery.appendChild(imgEl);
        });

        // Update background
        if (data.results.length > 0) {
            document.body.style.backgroundImage = `url(${data.results[0].urls.regular})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundBlendMode = 'overlay';
        }
    } catch (e) {
        console.error('Unsplash Error:', e);
    }
}

async function fetchAttractions(lat, lon) {
    // OpenTripMap Radius Search
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&kinds=interesting_places&rate=3&limit=10&apikey=${CONFIG.OPENTRIPMAP_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        data.features.forEach(place => {
            const [pLon, pLat] = place.geometry.coordinates;
            const marker = L.marker([pLat, pLon]).addTo(map);
            marker.bindPopup(`<b>${place.properties.name}</b>`);
            markers.push(marker);
        });
    } catch (e) {
        console.error('OpenTripMap Error:', e);
    }
}

async function generateAIContent(city, country, weather, duration) {
    const prompt = `
    I am planning a trip to ${city}, ${country} for ${duration} days.
    Current weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°C.
    
    Please provide the following in JSON format:
    1. "itinerary": An array of objects for each day. Each object should have:
       - "day": "Day 1", "Day 2", etc.
       - "title": A theme for the day (e.g., "Historical Tour").
       - "activities": An array of strings, each being a specific activity with time (e.g., "09:00 AM - Visit Museum").
    2. "packing": A list of 5-8 essential items to pack.
    3. "costs": An object with estimated costs for 1 person for ${duration} days in USD:
       - "hotel": "Total hotel cost",
       - "transport": "Total transport cost",
       - "food": "Total food cost",
       - "activities": "Total activities cost",
       - "total": "Grand total"
    4. "hotels": A list of 3 recommended hotels with:
       - "name": "Hotel Name",
       - "price": "Price per night",
       - "image": "A keyword to search for an image of this hotel type (e.g., 'luxury hotel bedroom')"
    
    Format response strictly as JSON:
    {
        "itinerary": [{"day": "Day 1", "title": "Theme", "activities": ["..."]}],
        "packing": ["item1", "item2"],
        "costs": {"hotel": "$500", "transport": "$100", "food": "$200", "activities": "$150", "total": "$950"},
        "hotels": [{"name": "Hotel A", "price": "$150/night", "image": "modern hotel room"}]
    }
    `;

    const generate = async (model) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GOOGLE_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response;
    };

    try {
        let response;
        try {
            response = await generate('gemini-1.5-flash');
        } catch (err) {
            console.warn('Gemini Flash failed, trying Pro...', err);
            response = await generate('gemini-pro');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);

        // Update UI - Itinerary Timeline
        const timelineContainer = document.getElementById('itinerary-timeline');
        timelineContainer.innerHTML = '';

        result.itinerary.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'timeline-day';

            let activitiesHtml = day.activities.map(act => `
                <div class="activity-item">
                    <div class="activity-time">${act.split('-')[0] || ''}</div>
                    <div>${act.split('-')[1] || act}</div>
                </div>
            `).join('');

            dayEl.innerHTML = `
                <div class="timeline-badge"></div>
                <div class="day-title">${day.day}: ${day.title}</div>
                ${activitiesHtml}
            `;
            timelineContainer.appendChild(dayEl);
        });

        // Update UI - Costs
        document.getElementById('cost-hotel').innerText = result.costs.hotel;
        document.getElementById('cost-transport').innerText = result.costs.transport;
        document.getElementById('cost-food').innerText = result.costs.food;
        document.getElementById('cost-activities').innerText = result.costs.activities;
        document.getElementById('cost-total').innerText = result.costs.total;

        // Update UI - Packing
        const packingList = document.getElementById('packing-list');
        packingList.innerHTML = '';
        result.packing.forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'packing-tag';
            tag.innerText = item;
            packingList.appendChild(tag);
        });

        // Update UI - Hotels
        const hotelsGrid = document.getElementById('hotels-grid');
        hotelsGrid.innerHTML = '';
        result.hotels.forEach(hotel => {
            const card = document.createElement('div');
            card.className = 'hotel-card';
            // Use Unsplash for hotel images based on keyword
            const imgUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(hotel.image)},hotel`;

            card.innerHTML = `
                <img src="${imgUrl}" class="hotel-img" alt="${hotel.name}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400'">
                <div class="hotel-info">
                    <span class="hotel-name">${hotel.name}</span>
                    <span class="hotel-price">${hotel.price}</span>
                </div>
            `;
            hotelsGrid.appendChild(card);
        });

    } catch (e) {
        console.error('Gemini Error:', e);

        let errorMsg = 'AI could not generate the plan at this moment.';
        if (e.message) errorMsg += ` (${e.message})`;

        document.getElementById('itinerary-timeline').innerHTML = `
            <div style="color: #ff6b6b; padding: 10px; background: rgba(255,0,0,0.1); border-radius: 8px;">
                <p><strong>Error:</strong> ${errorMsg}</p>
                <p style="font-size: 0.8rem; margin-top: 5px;">Check the console for more details.</p>
            </div>
        `;
    }
}
