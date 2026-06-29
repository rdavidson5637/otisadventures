import type { WeatherType } from "@/types/otis";

export const WEATHER_EMOJIS: Record<WeatherType, string> = {
  sunny: "☀️",
  cloudy: "⛅",
  rainy: "🌧️",
  windy: "💨",
  stormy: "⛈️",
  snowy: "❄️",
  foggy: "🌫️",
};

export const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  rainy: "Rainy",
  windy: "Windy",
  stormy: "Stormy",
  snowy: "Snowy",
  foggy: "Foggy",
};

export const WEATHER_OPTIONS = Object.keys(WEATHER_EMOJIS) as WeatherType[];
