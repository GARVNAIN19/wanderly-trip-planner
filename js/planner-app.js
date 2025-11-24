// Trip Planner App - Full AI-Powered
let currentTripData = null;

document.addEventListener('DOMContentLoaded', () => {
    const tripForm = document.getElementById('trip-form');
    const destinationInput = document.getElementById('destination');
    const backBtn = document.getElementById('back-btn');

    // Form submission
    tripForm.addEventListener('submit', handleFormSubmit);

    // Back button
    backBtn.addEventListener('click', () => {
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Destination autocomplete
    let debounceTimer;
    destinationInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value;
        if (query.length < 3) {
            document.getElementById('destination-suggestions').style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(() => fetchDestinationSuggestions(query), 300);
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-wrapper')) {
            document.getElementById('destination-suggestions').style.display = 'none';
        }
    });
});

async function fetchDestinationSuggestions(query) {
    const suggestionsBox = document.getElementById('destination-suggestions');

    // Show loading state
    suggestionsBox.style.display = 'block';
    suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor: default;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1&featuretype=city`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        suggestionsBox.innerHTML = '';

        if (data.length > 0) {
            suggestionsBox.style.display = 'block';
            const seenNames = new Set();

            data.forEach(place => {
                // Format display name: City, Country
                let displayName = place.display_name;
                if (place.address) {
                    const city = place.address.city || place.address.town || place.address.village || place.name;
                    const country = place.address.country;
                    if (city && country) {
                        displayName = `${city}, ${country}`;
                    }
                }

                // Skip duplicates
                if (seenNames.has(displayName)) return;
                seenNames.add(displayName);

                const div = document.createElement('div');
                div.className = 'suggestion-item';

                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i>
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${displayName.split(',')[0]}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${displayName}</div>
                        </div>
                    </div>
                `;

                div.addEventListener('click', () => {
                    document.getElementById('destination').value = displayName.split(',')[0]; // Just the city name
                    suggestionsBox.style.display = 'none';
                });
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor: default; color: var(--text-muted);">No results found</div>';
        }
    } catch (e) {
        console.error('Autocomplete Error:', e);
        suggestionsBox.style.display = 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const destination = document.getElementById('destination').value.trim();
    const travelDays = document.getElementById('travel-days').value;
    const travelStyle = document.getElementById('travel-style').value;
    const budget = document.getElementById('budget').value;
    const preferences = document.getElementById('preferences').value.trim();

    if (!destination || !travelDays || !travelStyle || !budget) {
        alert('Please fill in all required fields');
        return;
    }

    // Store trip data
    currentTripData = {
        destination,
        travelDays,
        travelStyle,
        budget,
        preferences
    };

    // Show loader
    document.getElementById('trip-form').style.display = 'none';
    document.getElementById('form-loader').style.display = 'flex';

    try {
        // Get coordinates for weather
        const geoData = await getCoordinates(destination);

        if (!geoData) {
            throw new Error('Location not found');
        }

        const { lat, lon, name, country } = geoData;

        // Fetch weather
        const weatherData = await fetchWeather(lat, lon);

        // Generate AI trip plan
        await generateTripPlan(name, country, travelDays, travelStyle, budget, preferences, weatherData);

        // Update overview
        updateOverview(name, travelDays, travelStyle, budget);

        // Update weather display
        updateWeatherDisplay(weatherData);

        // Show results
        document.getElementById('form-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error generating trip:', error);
        alert(`Failed to generate trip plan: ${error.message}`);
        document.getElementById('trip-form').style.display = 'block';
        document.getElementById('form-loader').style.display = 'none';
    }
}

async function getCoordinates(city) {
    // Use Netlify Function
    const url = `/.netlify/functions/geocode?city=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch coordinates');
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
}

async function fetchWeather(lat, lon) {
    // Use Netlify Function
    const url = `/.netlify/functions/weather?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return await res.json();
}

function updateWeatherDisplay(data) {
    document.getElementById('weather-temp').innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weather-description').innerText = data.weather[0].description;
    document.getElementById('weather-humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('weather-wind').innerText = `${data.wind.speed} m/s`;

    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weather-icon-display').innerHTML = `<img src="${iconUrl}" alt="Weather Icon" style="width: 80px; height: 80px;">`;
}

function updateOverview(destination, days, style, budget) {
    document.getElementById('overview-destination').innerText = destination;
    document.getElementById('overview-duration').innerText = `${days} ${days == 1 ? 'day' : 'days'}`;
    document.getElementById('overview-style').innerText = style;
    document.getElementById('overview-budget').innerText = budget;
}

async function generateTripPlan(city, country, days, style, budget, preferences, weather) {
    const prompt = `You are an expert travel planner. Create a comprehensive ${days}-day trip plan for ${city}, ${country}.

Trip Details:
- Duration: ${days} days
- Travel Style: ${style}
- Budget: ${budget}
- Additional Preferences: ${preferences || 'None'}
- Current Weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°C

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.

Provide this exact JSON structure:
{
  "itinerary": [
    {
      "day": "Day 1",
      "theme": "Theme for the day",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "location": "Specific location",
          "description": "Brief description",
          "cost": "$XX"
        }
      ]
    }
  ],
  "hotels": [
    {
      "name": "Hotel Name",
      "rating": "4.5",
      "pricePerNight": "$150",
      "amenities": ["WiFi", "Breakfast", "Pool"],
      "description": "Brief description",
      "bookingLink": "https://www.booking.com/searchresults.html?ss=Hotel+Name"
    }
  ],
  "costs": {
    "accommodation": "$XXX",
    "transportation": "$XXX",
    "food": "$XXX",
    "activities": "$XXX",
    "total": "$XXX"
  },
  "packing": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7", "Item 8"],
  "tips": [
    "Tip 1 about the destination",
    "Tip 2 about local customs",
    "Tip 3 about transportation",
    "Tip 4 about safety",
    "Tip 5 about best times to visit attractions"
  ]
}

Make sure:
1. Activities match the ${style} travel style
2. Costs align with ${budget} budget
3. Include specific restaurant recommendations for meals
4. Provide realistic timing (8 AM - 10 PM daily)
5. Include ${days} complete days in the itinerary
6. Hotels should have real-sounding names appropriate for ${city}
7. All costs should be in USD`;

    const generate = async (model) => {
        // Use Netlify Function for Gemini
        const url = `/.netlify/functions/gemini`;
        console.log(`Calling Gemini Function with model: ${model}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                model: model
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response;
    };

    try {
        let response;
        try {
            response = await generate('gemini-2.0-flash');
        } catch (err) {
            console.warn('Gemini 2.0 Flash failed, trying gemini-flash-latest...', err);
            response = await generate('gemini-flash-latest');
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response structure');
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log('Raw AI Response:', text);

        // Clean up the response
        let jsonStr = text.trim();
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jsonStr = jsonStr.trim();

        console.log('Cleaned JSON:', jsonStr);

        const result = JSON.parse(jsonStr);
        console.log('Parsed result:', result);

        // Render all sections
        renderItinerary(result.itinerary);
        renderHotels(result.hotels);
        updateCosts(result.costs);
        renderPackingList(result.packing);
        renderTravelTips(result.tips);

    } catch (e) {
        console.error('AI Generation Error:', e);

        document.getElementById('daily-itinerary').innerHTML = `
            <div style="color: #ff6b6b; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 12px; text-align: center;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p><strong>Unable to generate trip plan</strong></p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Error: ${e.message}</p>
                <p style="font-size: 0.85rem; margin-top: 5px; opacity: 0.8;">Please check the browser console (F12) for more details.</p>
            </div>
        `;
        throw e;
    }
}

function renderItinerary(itinerary) {
    const container = document.getElementById('daily-itinerary');
    container.innerHTML = '';

    itinerary.forEach((day, index) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';

        let activitiesHTML = day.activities.map(activity => `
            <div class="activity-card">
                <div class="activity-time">
                    <i class="fa-solid fa-clock"></i>
                    ${activity.time}
                </div>
                <div class="activity-content">
                    <h4 class="activity-title">${activity.activity}</h4>
                    <p class="activity-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${activity.location}
                    </p>
                    <p class="activity-description">${activity.description}</p>
                    ${activity.cost ? `<span class="activity-cost">${activity.cost}</span>` : ''}
                </div>
            </div>
        `).join('');

        dayCard.innerHTML = `
            <div class="day-header">
                <div class="day-number">${index + 1}</div>
                <div class="day-info">
                    <h3 class="day-title">${day.day}</h3>
                    <p class="day-theme">${day.theme}</p>
                </div>
            </div>
            <div class="day-activities">
                ${activitiesHTML}
            </div>
        `;

        container.appendChild(dayCard);
    });
}

function renderHotels(hotels) {
    const container = document.getElementById('hotels-grid');
    container.innerHTML = '';

    const hotelImages = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000&auto=format&fit=crop'
    ];

    hotels.forEach((hotel, index) => {
        const hotelCard = document.createElement('div');
        hotelCard.className = 'hotel-card';

        const amenitiesHTML = hotel.amenities.slice(0, 3).map(amenity =>
            `<span class="amenity-tag"><i class="fa-solid fa-check"></i> ${amenity}</span>`
        ).join('');

        // Pick an image based on index to ensure they are different
        const imageUrl = hotelImages[index % hotelImages.length];

        hotelCard.innerHTML = `
            <div class="hotel-image">
                <img src="${imageUrl}" alt="${hotel.name}">
                <div class="hotel-rating">
                    <i class="fa-solid fa-star"></i> ${hotel.rating}
                </div>
            </div>
            <div class="hotel-info">
                <h4 class="hotel-name">${hotel.name}</h4>
                <p class="hotel-description">${hotel.description}</p>
                <div class="hotel-amenities">
                    ${amenitiesHTML}
                </div>
                <div class="hotel-footer">
                    <span class="hotel-price hotel-price-tag" data-original-price="${hotel.pricePerNight}">${hotel.pricePerNight}/night</span>
                    <a href="${hotel.bookingLink}" target="_blank" class="btn-small btn-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> Book Now</a>
                </div>
            </div>
        `;

        container.appendChild(hotelCard);
    });
}

function updateCosts(costs) {
    document.getElementById('cost-accommodation').innerText = costs.accommodation;
    document.getElementById('cost-transportation').innerText = costs.transportation;
    document.getElementById('cost-food').innerText = costs.food;
    document.getElementById('cost-activities').innerText = costs.activities;
    document.getElementById('cost-total').innerText = costs.total;
}

function renderPackingList(items) {
    const container = document.getElementById('packing-list');
    container.innerHTML = '';

    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'packing-item';
        itemEl.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <span>${item}</span>
        `;
        container.appendChild(itemEl);
    });
}

function renderTravelTips(tips) {
    const container = document.getElementById('travel-tips');
    container.innerHTML = '';

    tips.forEach(tip => {
        const tipEl = document.createElement('div');
        tipEl.className = 'tip-item';
        tipEl.innerHTML = `
            <i class="fa-solid fa-lightbulb"></i>
            <span>${tip}</span>
        `;
        container.appendChild(tipEl);
    });
}
