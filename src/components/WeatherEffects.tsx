import { useMemo } from 'react';
import type { WeatherConfig } from '../services/config';

export type WeatherEffectMode = 'clear' | 'cloudy' | 'rain' | 'thunder' | 'snow' | 'fog';

// Open-Meteo weather codes:
// https://open-meteo.com/en/docs
export function mapWeatherCodeToEffect(code: number): WeatherEffectMode {
  if (code === 0) return 'clear';
  if ([1, 2].includes(code)) return 'clear';
  if (code === 3) return 'cloudy';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'thunder';
  return 'cloudy';
}

type Props = {
  weatherCode?: number;
  enabled?: boolean;
  // for future: location-based day/night, intensity, etc.
  location?: WeatherConfig;
};

export function WeatherEffects({ weatherCode, enabled = true }: Props) {
  const mode = useMemo(() => {
    if (!enabled || weatherCode === undefined || weatherCode === null) return 'clear' as WeatherEffectMode;
    return mapWeatherCodeToEffect(weatherCode);
  }, [weatherCode, enabled]);

  return (
    <div className={`weather-effects weather-${mode}`} aria-hidden>
      {/* Overlay layers are implemented purely in CSS (GPU-friendly). */}
      <div className="weather-layer weather-vignette" />
      <div className="weather-layer weather-sun" />
      <div className="weather-layer weather-rain" />
      <div className="weather-layer weather-fog" />
      <div className="weather-layer weather-snow" />
      <div className="weather-layer weather-lightning" />
    </div>
  );
}
