# Weather Now

A real-time weather dashboard built with **React + Vite**. Search any city in the world and get live weather, a 7-day forecast, hourly updates, air quality info, and smart weather insights — all in a clean, modern UI with dark and light themes.

## Author
**Vishal Kumar**
GitHub: [@vishalkcse](https://github.com/vishalkcse)

---

## Features

- **City Search** — Search any city, village, or region worldwide
- **Current Weather** — Live temperature, weather condition, and precipitation chance
- **7-Day Forecast** — Daily high/low with weather emoji for each day, click any day to see its hourly data
- **Hourly Forecast** — 24-hour breakdown for the selected day shown in a scrollable sidebar
- **Air Quality** — Real-time AQI, PM2.5, and PM10 data from the air quality API
- **Weather Insights** — Custom panel showing power cut risk, road safety, clothes drying time, and outdoor comfort — all calculated from live weather numbers
- **Alert Banner** — Automatically appears at the top when landslide/weather risk is high
- **Voice Forecast** — Click HI or EN to hear the forecast spoken aloud in Hindi or English using the browser Speech API
- **Live Terrain Map** — Interactive map powered by Leaflet that auto-moves to the searched city
- **Dark / Light Mode** — Toggle between dark and light themes
- **Temperature Units** — Switch between Celsius and Fahrenheit anytime
- **Sunrise and Sunset Times** — Shown in the 7-day forecast section
- **Responsive Design** — Works on both mobile and desktop

---

## Built With

- **React 19** — Components, useState, useEffect
- **Vite** — Fast build and development tool
- **Vanilla CSS** — All custom styles, no CSS framework used
- **Lucide React** — Icon library
- **Leaflet + React-Leaflet** — Interactive map
- **Open-Meteo API** — Free weather forecast data (no API key needed)
- **Open-Meteo Air Quality API** — Free AQI data (no API key needed)
- **Nominatim API** — Free geocoding to convert city names to coordinates
- **Web Speech API** — Built into the browser, used for Hindi and English voice forecast

---

## Project Structure

`
src/
App.jsx     - Main component: all state, API calls, and UI
App.css     - All styles: dark/light theme, grid layout, cards, responsive
utils.js    - Helper functions: weather codes to names, emojis, time formatting
main.jsx    - Entry point: mounts React app into index.html
`

---

## Getting Started

1. Clone the repository
`
git clone https://github.com/vishalkcse/weather-now.git
`

2. Install dependencies
`
npm install
`

3. Run locally
`
npm run dev
`

4. Build for production
`
npm run build
`

No API keys needed. All APIs used are free and open source.

---

2025 Vishal Kumar
