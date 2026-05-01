import React, { useState, useEffect } from 'react';
import {
  Search, Thermometer, Droplets, Sun, Moon,
  AlertTriangle, Shirt, Zap, Mountain, Car, Wind
} from 'lucide-react';
import { getWeatherCodeName, formatTime, getWeatherEmoji } from './utils';

// Map library
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for leaflet marker icons not showing in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- Small reusable component to show each risk row ---
const RiskMeter = ({ label, value, colorClass, icon: Icon }) => (
  <div className="risk-item">
    <div className="risk-info">
      <div className={`risk-icon-box ${colorClass}-15`}>
        <Icon className={`icon-sm ${colorClass}`} />
      </div>
      <span className="risk-label-text">{label}</span>
    </div>
    <span className={`risk-value-text ${colorClass}`}>{value}</span>
  </div>
);

// --- This component updates the map when the city changes ---
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// --- MAIN APP COMPONENT ---
export default function App() {

  // --- STATE: store all the data the app needs ---
  const [weatherData, setWeatherData] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [insights, setInsights] = useState(null);
  const [location, setLocation] = useState({ city: 'Udhampur', lat: 32.926, lon: 75.132 });
  const [unit, setUnit] = useState('C');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [error, setError] = useState(null);

  // --- EFFECT: switch dark/light class on body when theme changes ---
  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  // --- EFFECT: load weather when app starts, and when unit changes ---
  useEffect(() => {
    fetchWeather(location.lat, location.lon);
  }, [unit]);

  // --- FETCH WEATHER DATA from Open-Meteo API ---
  async function fetchWeather(lat, lon) {
    try {
      // Build the weather API URL
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=7${unit === 'F' ? '&temperature_unit=fahrenheit' : ''}`;

      // Fetch weather data
      const weatherResponse = await fetch(weatherUrl);
      const data = await weatherResponse.json();

      // Fetch air quality data separately
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`;
      const aqiResponse = await fetch(aqiUrl);
      const aqiData = await aqiResponse.json();

      // Calculate our custom safety info from the weather data
      const safetyInfo = calculateInsights(data.current);

      // Save everything to state so the UI updates
      setWeatherData(data);
      setAqi(aqiData.current);
      setInsights(safetyInfo);
      setError(null);

    } catch (err) {
      setError('Could not load weather. Please try again.');
    }
  }

  // --- CALCULATE SAFETY INSIGHTS from raw weather numbers ---
  function calculateInsights(current) {
    const rain = current.precipitation || 0;
    const wind = current.wind_speed_10m || 0;
    const humidity = current.relative_humidity_2m || 0;
    const temp = current.temperature_2m || 0;

    // Landslide risk — based on how much it is raining
    let landslideRisk = 'Low';
    if (rain > 10) landslideRisk = 'High';
    else if (rain > 2) landslideRisk = 'Moderate';

    // Power cut chance — based on wind speed and rain
    let powerCutRisk = 'Unlikely';
    if (wind > 40 || (wind > 20 && rain > 5)) powerCutRisk = 'Highly Likely';
    else if (wind > 20 || rain > 2) powerCutRisk = 'Possible';

    // Road safety — based on landslide risk and wind
    let roadSafety = 'Safe';
    if (landslideRisk === 'High' || wind > 50) roadSafety = 'Dangerous';
    else if (landslideRisk === 'Moderate' || wind > 25) roadSafety = 'Caution';

    // Clothes drying time — based on rain and humidity
    let dryingTime = '2-4h (Fast)';
    if (rain > 0 || humidity > 85) dryingTime = "Don't Wash Today";
    else if (humidity > 60) dryingTime = '6-8h (Slow)';

    // Is it comfortable to go outside?
    let outdoorComfort = 'Comfortable';
    if (temp > 35 || temp < 5 || roadSafety === 'Dangerous') outdoorComfort = 'Avoid (Unsafe)';
    else if (temp > 30 || temp < 10 || roadSafety === 'Caution') outdoorComfort = 'Wear Layers';

    return { landslideRisk, powerCutRisk, roadSafety, dryingTime, outdoorComfort };
  }

  // --- SEARCH CITY using Nominatim geocoding API ---
  async function handleSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      // Ask the geocoding API for coordinates of the city the user typed
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchInput}&format=json&limit=1`);
      const result = await response.json();

      if (result.length > 0) {
        const { lat, lon, display_name } = result[0];

        // Make a clean city label from the full display name
        const parts = display_name.split(',');
        const cityLabel = parts.length > 1 ? `${parts[0]}, ${parts[1].trim()}` : parts[0];

        // Update the location state with new city
        setLocation({ city: cityLabel, lat: parseFloat(lat), lon: parseFloat(lon) });

        // Now fetch weather for the new city
        fetchWeather(lat, lon);

      } else {
        setError('City not found. Please try a different name.');
      }

    } catch (err) {
      setError('Search failed. Please try again.');
    }
  }

  // --- SPEAK the weather forecast using the browser's Speech API ---
  function speakForecast(lang) {
    if (!weatherData) return;

    // Stop any speech that is already playing
    window.speechSynthesis.cancel();

    const temp = Math.round(weatherData.current.temperature_2m);
    const state = getWeatherCodeName(weatherData.current.weather_code);

    // Build the sentence to speak
    const text = lang === 'hindi'
      ? `नमस्ते! आज ${location.city} में तापमान ${temp} डिग्री है।`
      : `Hello! Today in ${location.city}, the temperature is ${temp} degrees. The weather is ${state}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hindi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  // --- HELPER: pick a color based on risk level ---
  function getAlertColor(risk) {
    const r = risk?.toLowerCase();
    if (r?.includes('high') || r?.includes('dangerous') || r?.includes('unsafe')) return 'text-rose-500';
    if (r?.includes('moderate') || r?.includes('caution')) return 'text-amber-500';
    return 'text-emerald-500';
  }

  // --- Show error message if something went wrong ---
  if (error) return <div className="error-screen">{error}</div>;

  // Shortcuts so we don't type weatherData.current every time
  const current = weatherData?.current;
  const daily = weatherData?.daily;
  const hourly = weatherData?.hourly;

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <header className="main-header">
        <div className="logo-section">
          <img src="/assets/images/mylogo.jpg" alt="Logo" className="logo-image" />
          <h1 className="logo-text">WEATHER <span className="text-primary-light">NOW</span></h1>
        </div>

        {/* Search form — calls handleSearch when submitted */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search city, village, or region..."
            className="search-input"
          />
          <Search className="search-icon icon-header" />
        </form>

        <div className="controls-group">
          {/* Dark / Light toggle button */}
          <button onClick={() => setIsDark(!isDark)} className="icon-button">
            {isDark ? <Sun className="icon-header text-amber-400" /> : <Moon className="icon-header text-indigo-600" />}
          </button>

          {/* °C / °F toggle */}
          <div className="unit-toggle glass-card">
            <button onClick={() => setUnit('C')} className={`unit-btn ${unit === 'C' ? 'active' : ''}`}>°C</button>
            <button onClick={() => setUnit('F')} className={`unit-btn ${unit === 'F' ? 'active' : ''}`}>°F</button>
          </div>

          {/* Voice buttons */}
          <div className="flex-gap-2">
            <button onClick={() => speakForecast('hindi')} className="lang-btn">HI</button>
            <button onClick={() => speakForecast('english')} className="lang-btn">EN</button>
          </div>
        </div>
      </header>

      {/* Show loading text until data arrives */}
      {!weatherData ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <main className="content-grid">

          <div className="left-column">

            {/* Alert banner — only shows if landslide risk is not Low */}
            {insights?.landslideRisk !== 'Low' && (
              <div className="alert-banner animate-pulse">
                <AlertTriangle className="text-rose-500 icon-md" />
                <p className="alert-text">Landslide Risk: {insights.landslideRisk}</p>
              </div>
            )}

            {/* HERO CARD — shows city name, temperature, weather */}
            <section className="hero-card">
              <div className="hero-bg" style={{ backgroundImage: "url('/assets/images/bg-today-large.svg')" }} />
              <div className="hero-content">
                <div className="date-badge">Today • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <h2 className="city-name">{location.city}</h2>
                <div className="weather-main">
                  <div className="flex-items-center">
                    <span className="temp-large">{Math.round(current.temperature_2m)}°</span>
                    <div className="flex-column">
                      <div className="flex-items-center gap-2">
                        <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{getWeatherEmoji(current.weather_code)}</span>
                        <div className="flex-column" style={{ gap: '4px' }}>
                          <p className="weather-desc" style={{ margin: 0 }}>{getWeatherCodeName(current.weather_code).replace(/-/g, ' ')}</p>
                          <p className="rain-chance">Precip: {daily?.precipitation_probability_max?.[0] || 0}% chance</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weather Insights box */}
                  <div className="intel-box">
                    <div>
                      <p className="intel-label">WEATHER INSIGHTS</p>
                    </div>
                    <div className="intel-stats">
                      <div className="intel-row"><span>Power:</span> <span>{insights.powerCutRisk}</span></div>
                      <div className="intel-row"><span>Drying:</span> <span>{insights.dryingTime}</span></div>
                      <div className="intel-row"><span>Risk:</span> <span className={getAlertColor(insights.landslideRisk)}>{insights.landslideRisk}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SAFETY CARDS GRID */}
            <div className="safety-grid">
              <div className="glass-card safety-card">
                <h3 className="card-label">Safety</h3>
                <div className="risk-list">
                  <RiskMeter icon={Mountain} label="Landslide" value={insights.landslideRisk} colorClass={getAlertColor(insights.landslideRisk)} />
                  <RiskMeter icon={Car} label="Roads" value={insights.roadSafety} colorClass={getAlertColor(insights.roadSafety)} />
                  <RiskMeter icon={Zap} label="Power" value={insights.powerCutRisk} colorClass={getAlertColor(insights.powerCutRisk)} />
                </div>
              </div>
              <div className="glass-card safety-card">
                <h3 className="card-label">Practicality</h3>
                <div className="risk-list">
                  <RiskMeter icon={Shirt} label="Drying" value={insights.dryingTime} colorClass="text-sky-500" />
                  <RiskMeter icon={Droplets} label="Water" value="Normal" colorClass="text-emerald-500" />
                  <RiskMeter icon={Thermometer} label="Comfort" value={insights.outdoorComfort} colorClass={getAlertColor(insights.outdoorComfort)} />
                </div>
              </div>
              <div className="glass-card safety-card">
                <h3 className="card-label">Air Quality</h3>
                <div className="risk-list">
                  <RiskMeter icon={Wind} label="AQI" value={aqi?.us_aqi || 'N/A'} colorClass={aqi?.us_aqi > 100 ? 'text-amber-500' : 'text-emerald-500'} />
                  <RiskMeter icon={Droplets} label="PM 2.5" value={`${aqi?.pm2_5 || 0} µg`} colorClass={aqi?.pm2_5 > 35 ? 'text-rose-500' : 'text-sky-500'} />
                  <RiskMeter icon={Thermometer} label="PM 10" value={`${aqi?.pm10 || 0} µg`} colorClass="text-emerald-500" />
                </div>
              </div>
            </div>

            {/* 7-DAY FORECAST */}
            <div className="glass-card forecast-section">
              <div className="forecast-header">
                <h3 className="card-label">Next 7 Days</h3>
                <div className="sun-times">
                  <span>SUNRISE: {daily?.sunrise[0].split('T')[1]}</span>
                  <span>SUNSET: {daily?.sunset[0].split('T')[1]}</span>
                </div>
              </div>
              <div className="forecast-grid">
                {/* Loop through each day and show a button */}
                {daily.time.map((date, i) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDay(i)}
                    className={`day-btn glass-card ${selectedDay === i ? 'active' : ''}`}
                  >
                    <span className="day-name">{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(date))}</span>
                    <span className="day-emoji" style={{ fontSize: '1.5rem', margin: '4px 0' }}>{getWeatherEmoji(daily.weather_code[i])}</span>
                    <span className="day-rain-prob" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                      {daily?.precipitation_probability_max?.[i] || 0}%
                    </span>
                    <span className="day-temp">{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="day-min-temp">{Math.round(daily.temperature_2m_min[i])}°</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* HOURLY SIDEBAR */}
          <div className="hourly-sidebar-wrapper">
            <div className="glass-card hourly-sidebar">
              <div className="sidebar-header">HOURLY UPDATES</div>
              <div className="hourly-list scrollbar-hide">
                {/* Show 24 hours for the selected day */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const hourIdx = selectedDay * 24 + i;
                  if (!hourly?.time[hourIdx]) return null;
                  return (
                    <div key={hourIdx} className="hour-item">
                      <div className="hour-info">
                        <span className="hour-time" style={{ minWidth: '70px' }}>{formatTime(hourly.time[hourIdx])}</span>
                        <span className="hour-emoji" style={{ fontSize: '1.25rem', margin: '0 8px' }}>{getWeatherEmoji(hourly.weather_code[hourIdx])}</span>
                        <span className="hour-rain">PRECIP: {Math.round(hourly.precipitation[hourIdx])}mm</span>
                      </div>
                      <span className="hour-temp">{Math.round(hourly.temperature_2m[hourIdx])}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LEAFLET MAP */}
          <div className="glass-card map-container-wrapper">
            <div className="map-header">
              <h3 className="card-label">Terrain Map</h3>
            </div>
            <div className="map-content" style={{ filter: isDark ? 'grayscale(1) invert(1) hue-rotate(180deg) brightness(1.2) contrast(0.8)' : 'none' }}>
              <MapContainer center={[location.lat, location.lon]} zoom={12} className="leaflet-container-custom">
                <ChangeView center={[location.lat, location.lon]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.lat, location.lon]} />
              </MapContainer>
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
