import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherConfig } from '../services/config';
import { WidgetContainer } from './WidgetContainer';
import { mapWeatherCodeToEffect, WeatherEffectMode } from './WeatherEffects';

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

const getWeatherLabel = (mode: WeatherEffectMode): string => {
  const labels: Record<WeatherEffectMode, string> = {
    'clear': 'Clear',
    'cloudy': 'Cloudy',
    'rain': 'Rain',
    'thunder': 'Thunderstorm',
    'snow': 'Snow',
    'fog': 'Fog'
  };
  return labels[mode];
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
  const weatherMode = mapWeatherCodeToEffect(current.weather_code);

  return (
    <WidgetContainer title={displayCity}>
      <div className="weather-main" style={{ marginBottom: '20px' }}>
        <p className="weather-temp" style={{ fontWeight: '300' }}>{current.temperature_2m}°C</p>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.9em', opacity: 0.8, display: 'flex', gap: '8px' }}>
            <span>H: {daily.temperature_2m_max[0]}°</span>
            <span>L: {daily.temperature_2m_min[0]}°</span>
          </div>
          <div style={{ fontSize: '1.1em', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              {getWeatherLabel(weatherMode)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        paddingTop: '15px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7em', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sunrise</span>
            <span style={{ fontSize: '0.9em' }}>{sunrise}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7em', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sunset</span>
            <span style={{ fontSize: '0.9em' }}>{sunset}</span>
          </div>
        </div>
        {aqi !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2', marginTop: '4px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: getAQIColor(aqi),
              boxShadow: `0 0 10px ${getAQIColor(aqi)}`
            }}></span>
            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Air Quality Index:</span>
            <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{aqi}</span>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
