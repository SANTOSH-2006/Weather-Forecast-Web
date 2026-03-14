const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherContent = document.getElementById('weather-content');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

const elements = {
    cityName: document.getElementById('city-name'),
    weatherIcon: document.getElementById('weather-icon'),
    tempValue: document.getElementById('temp-value'),
    weatherDesc: document.getElementById('weather-desc'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    forecastContainer: document.getElementById('forecast-container')
};

// Map WMO Weather codes to readable descriptions and emojis
const weatherCodes = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫️' },
    48: { desc: 'Depositing rime fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌧️' },
    53: { desc: 'Moderate drizzle', icon: '🌧️' },
    55: { desc: 'Dense drizzle', icon: '🌧️' },
    61: { desc: 'Slight rain', icon: '🌦️' },
    63: { desc: 'Moderate rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    71: { desc: 'Slight snow fall', icon: '🌨️' },
    73: { desc: 'Moderate snow fall', icon: '🌨️' },
    75: { desc: 'Heavy snow fall', icon: '❄️' },
    80: { desc: 'Slight rain showers', icon: '🌦️' },
    81: { desc: 'Moderate rain showers', icon: '🌧️' },
    82: { desc: 'Violent rain showers', icon: '⛈️' },
    95: { desc: 'Thunderstorm', icon: '🌩️' },
    96: { desc: 'Thunderstorm with slight hail', icon: '⛈️' },
    99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

// Use emojis as data URIs for img src so we don't need external icon assets
const getEmojiDataURI = (emoji) => {
    return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
};

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

async function fetchWeather(city) {
    showLoading();
    
    try {
        // 1. Get Coordinates using Geocoding API
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        
        if (!geoResponse.ok) throw new Error('API error');
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }
        
        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;
        
        // 2. Get Weather using Open-Meteo API
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        
        if (!weatherResponse.ok) throw new Error('API error');
        
        const weatherData = await weatherResponse.json();
        
        updateUI(name, country, weatherData);
        
    } catch (error) {
        console.error("Error fetching weather:", error);
        showError();
    }
}

function updateUI(city, country, data) {
    const current = data.current;
    const daily = data.daily;
    
    const weatherInfo = weatherCodes[current.weather_code] || { desc: 'Unknown', icon: '❓' };
    
    // Update Current Weather
    elements.cityName.textContent = `${city}, ${country}`;
    elements.tempValue.textContent = Math.round(current.temperature_2m);
    elements.weatherDesc.textContent = weatherInfo.desc;
    
    elements.weatherIcon.src = getEmojiDataURI(weatherInfo.icon);
    elements.weatherIcon.style.display = 'block';
    
    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    
    // Update Forecast
    elements.forecastContainer.innerHTML = '';
    
    // Skip today (index 0), show next 6 days
    for (let i = 1; i <= 6; i++) {
        // Check if data exists for this day index first to prevent errors
        if (!daily.time[i] || daily.weather_code[i] === undefined || daily.temperature_2m_max[i] === undefined) {
             continue;
        }

        const date = new Date(daily.time[i]);
        // Add current timezone offset correction if needed but simple way is below
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);
        
        const code = daily.weather_code[i];
        const info = weatherCodes[code] || { desc: 'Unknown', icon: '❓' };
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        
        const itemHTML = `
            <div class="forecast-item">
                <span class="day">${dayName}</span>
                <img src="${getEmojiDataURI(info.icon)}" alt="${info.desc}">
                <span class="temp">${maxTemp}°</span>
            </div>
        `;
        
        elements.forecastContainer.insertAdjacentHTML('beforeend', itemHTML);
    }
    
    showContent();
}

function showLoading() {
    weatherContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
}

function showContent() {
    loadingIndicator.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

function showError() {
    loadingIndicator.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.classList.remove('hidden');
}

// Initial fetch for a default city
fetchWeather('New York');
