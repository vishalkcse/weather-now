export function getWeatherCodeName(code) {
  const map = {
    0: "sunny",
    1: "partly-cloudy",
    2: "partly-cloudy",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    71: "snow",
    73: "snow",
    75: "snow",
    80: "rain",
    81: "rain",
    82: "rain",
    95: "storm",
    96: "storm",
    99: "storm"
  };

  return map[code] || "sunny";
}

export function getWeatherEmoji(code) {
  const name = getWeatherCodeName(code);
  const emojiMap = {
    "sunny": "☀️",
    "partly-cloudy": "⛅",
    "overcast": "☁️",
    "fog": "🌫️",
    "drizzle": "🌦️",
    "rain": "🌧️",
    "snow": "❄️",
    "storm": "⛈️"
  };
  return emojiMap[name] || "☀️";
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", {
    hour: "numeric",
    hour12: true,
  });
}
