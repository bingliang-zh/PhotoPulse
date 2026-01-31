import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherConfig } from '../services/config';
import { WidgetContainer } from './WidgetContainer';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    rain: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
  aqi?: number;
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return '#00e676'; // Good
  if (aqi <= 100) return '#ffea00'; // Moderate
  if (aqi <= 150) return '#ff9100'; // Unhealthy for Sensitive Groups
  if (aqi <= 200) return '#ff1744'; // Unhealthy
  if (aqi <= 300) return '#d500f9'; // Very Unhealthy
  return '#b71c1c'; // Hazardous
};

interface WeatherProps {
  location: WeatherConfig;
  onLog?: (message: string, type: 'info' | 'warn' | 'error' | 'debug', action?: { label: string, handler: () => void }) => void;
  onWeatherCode?: (code: number) => void;
}

export const Weather = ({ location, onLog, onWeatherCode }: WeatherProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [displayCity, setDisplayCity] = useState(location.city || "Loading...");

  useEffect(() => {
    const fetchWeather = async () => {
      onLog?.('Weather: Fetching data...', 'info');
      try {
        let lat = location.latitude;
        let lng = location.longitude;
        let cityName = location.city;

        // Geocoding logic if coordinates are missing
        if ((lat === undefined || lng === undefined) && cityName) {
          try {
            const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
            if (geoRes.data.results && geoRes.data.results.length > 0) {
              lat = geoRes.data.results[0].latitude;
              lng = geoRes.data.results[0].longitude;
              // If we didn't have a display city yet (rare), use the one found
              if (!cityName) cityName = geoRes.data.results[0].name;
              onLog?.(`Weather: Geocoded ${cityName}`, 'info');
            }
          } catch (e) {
            console.error("Geocoding failed", e);
            onLog?.(`Weather: Geocoding failed: ${e}`, 'warn');
          }
        }

        // Fallback to Hangzhou if everything fails
        if (lat === undefined || lng === undefined) {
          lat = 30.2748;
          lng = 120.1551;
          if (!cityName) cityName = "Hangzhou";
          onLog?.('Weather: Using default location (Hangzhou)', 'warn');
        }

        setDisplayCity(location.city || cityName || "Unknown");

        const [weatherRes, aqiRes] = await Promise.all([
          axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
          ),
          axios.get(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`
          )
        ]);

        const data = weatherRes.data;
        if (aqiRes.data?.current?.us_aqi !== undefined) {
          data.aqi = aqiRes.data.current.us_aqi;
        }
        setWeather(data);
        const weatherCode = data?.current?.weather_code;
        onWeatherCode?.(weatherCode);
        
        // Log weather code and effect
        const effectMap: Record<number, string> = {
          0: 'clear', 1: 'clear', 2: 'clear', 3: 'cloudy',
          45: 'fog', 48: 'fog',
          51: 'rain', 53: 'rain', 55: 'rain', 56: 'rain', 57: 'rain',
          61: 'rain', 63: 'rain', 65: 'rain', 66: 'rain', 67: 'rain',
          71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
          80: 'rain', 81: 'rain', 82: 'rain', 85: 'snow', 86: 'snow',
          95: 'thunder', 96: 'thunder', 99: 'thunder'
        };
        const weatherEffect = effectMap[weatherCode] ?? 'cloudy';
        onLog?.(`Weather: Fetched code=${weatherCode}, effect=${weatherEffect}`, 'info');
      } catch (error) {
        console.error('Error fetching weather:', error);
        onLog?.(`Weather: Fetch failed: ${error}`, 'error');
      }
    };

    fetchWeather();
    const timer = setInterval(fetchWeather, 600000); // Update every 10 mins
    return () => clearInterval(timer);
  }, [location]);

  if (!weather) return <div>Loading Weather...</div>;

  const { current, daily, aqi } = weather;
  const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <WidgetContainer title={displayCity}>
      <div className="weather-main">
        <p className="weather-temp">{current.temperature_2m}°C</p>
        <div>
          <p style={{ margin: 0, opacity: 0.8 }}>High: {daily.temperature_2m_max[0]}°C</p>
          <p style={{ margin: 0, opacity: 0.8 }}>Low: {daily.temperature_2m_min[0]}°C</p>
        </div>
      </div>
      <div className="weather-info">
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>🌅 {sunrise}</span>
          <span>🌇 {sunset}</span>
        </div>
        {aqi !== undefined && (
          <p style={{ margin: 0 }}>
            AQI: <span style={{ color: getAQIColor(aqi), fontWeight: 'bold' }}>{aqi}</span>
          </p>
        )}
      </div>
    </WidgetContainer>
  );
};
