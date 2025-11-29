import { useState, useEffect } from 'react';
import axios from 'axios';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    rain: number;
    weather_code: number;
  };
  daily: {
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

export const Weather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Hangzhou coordinates: 30.2748° N, 120.1551° E
        const [weatherRes, aqiRes] = await Promise.all([
          axios.get(
            'https://api.open-meteo.com/v1/forecast?latitude=30.2748&longitude=120.1551&current=temperature_2m,relative_humidity_2m,rain,weather_code&daily=sunrise,sunset&timezone=auto'
          ),
          axios.get(
            'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.2748&longitude=120.1551&current=us_aqi'
          )
        ]);
        
        const data = weatherRes.data;
        if (aqiRes.data?.current?.us_aqi !== undefined) {
          data.aqi = aqiRes.data.current.us_aqi;
        }
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
    const timer = setInterval(fetchWeather, 600000); // Update every 10 mins
    return () => clearInterval(timer);
  }, []);

  if (!weather) return <div>Loading Weather...</div>;

  const { current, daily, aqi } = weather;
  const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div style={{ color: 'white', padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px' }}>
      <h2>Hangzhou</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <p style={{ fontSize: '3em', margin: 0 }}>{current.temperature_2m}°C</p>
        <div>
           <p style={{ margin: '5px 0' }}>Humidity: {current.relative_humidity_2m}%</p>
           <p style={{ margin: '5px 0' }}>Rain: {current.rain} mm</p>
           {aqi !== undefined && (
             <p style={{ margin: '5px 0' }}>
               AQI: <span style={{ color: getAQIColor(aqi), fontWeight: 'bold' }}>{aqi}</span>
             </p>
           )}
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.9em', opacity: 0.9 }}>
        <span>☀️ ↑ {sunrise}</span>
        <span style={{ marginLeft: '15px' }}>↓ {sunset}</span>
      </div>
    </div>
  );
};
