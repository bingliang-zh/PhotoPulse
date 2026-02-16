import { useMemo, useEffect } from 'react';
import type { WeatherConfig, EffectsQuality } from '../services/config';
import './WeatherEffects.css';
import { Rain } from './weather/Rain';
import { Sun } from './weather/Sun';
import { Cloudy } from './weather/Cloudy';
import { Snow } from './weather/Snow';
import { Fog } from './weather/Fog';
import { Lightning } from './weather/Lightning';

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
  onLog?: (message: string, type: 'info' | 'warn' | 'error' | 'debug') => void;
  // for future: location-based day/night, intensity, etc.
  location?: WeatherConfig;
  effectsQuality?: EffectsQuality;
};

export function WeatherEffects({ weatherCode, enabled = true, onLog, effectsQuality = 3 }: Props) {
  const mode = useMemo(() => {
    if (!enabled || weatherCode === undefined || weatherCode === null) return 'clear' as WeatherEffectMode;
    return mapWeatherCodeToEffect(weatherCode);
  }, [weatherCode, enabled]);

  useEffect(() => {
    onLog?.(`WeatherEffects: Rendering effect="${mode}"`, 'info');
  }, [mode, onLog]);

  return (
    <div className={`weather-effects weather-${mode}`} aria-hidden data-weather-effect={mode}>
      {/* 
          All Weather Components are fully isolated CSS Modules.
          They receive an 'active' prop to handle their own transitions.
      */}
      
      <Sun active={mode === 'clear'} />
      
      <Cloudy active={mode === 'cloudy'} />
      
      <Rain 
        active={mode === 'rain' || mode === 'thunder'} 
        intensity={mode === 'thunder' ? 'heavy' : 'moderate'}
        quality={effectsQuality}
      />
      
      <Fog active={mode === 'fog'} />
      
      <Snow active={mode === 'snow'} />
      
      <Lightning active={mode === 'thunder'} />
    </div>
  );
}
