import { useState, useEffect } from 'react';
import './App.css';
import { Carousel } from './components/Carousel';
import { Weather } from './components/Weather';
import { Stock } from './components/Stock';
import { CryptoWidget } from './components/Crypto';
import { DebugPanel, LogEntry, OnLogCallback } from './components/DebugPanel';
import { loadConfig, AppConfig } from './services/config';
import { WeatherEffects } from './components/WeatherEffects';

function App() {
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [hasImages, setHasImages] = useState(true);
  const [debugVisible, setDebugVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [weatherCode, setWeatherCode] = useState<number | undefined>(undefined);

  const addLog: OnLogCallback = (message, type, action) => {
    setLogs(prev => [...prev, { message, type, action, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    addLog('App: Initializing...', 'info');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setDebugVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!hasImages) {
      setDebugVisible(true);
    }
  }, [hasImages]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadConfig(addLog).then(cfg => {
      setConfig(cfg);
    }).catch(err => {
      addLog(`App: Config load failed: ${err}`, 'error');
    });
  }, []);

  if (!config) return null; // Or a loading spinner // You can customize settings in config.json

  return (
    <div className="container">
      <WeatherEffects weatherCode={weatherCode} enabled={!!config.weather} />
      <Carousel interval={config.interval} onStateChange={setHasImages} onLog={addLog} />
      <div className="dashboard">
        <div className="widget-column">
          {config.weather && config.weather.city && (
            <Weather
              location={config.weather}
              onLog={addLog}
              onWeatherCode={(code) => setWeatherCode(code)}
            />
          )}
          {config.stocks && config.stocks.length > 0 && (
            <Stock symbols={config.stocks} onLog={addLog} />
          )}
          {config.crypto && config.crypto.length > 0 && (
            <CryptoWidget symbols={config.crypto} onLog={addLog} />
          )}
        </div>
        <div className="time-display" style={{ marginTop: '5vh' }}>
          <h1>{time.toLocaleTimeString('en-US', { hour12: false })}</h1>
          <h2>{time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</h2>
          <h3>{time.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
        </div>
      </div>
      {debugVisible && <DebugPanel onClose={() => setDebugVisible(false)} logs={logs} onLog={addLog} />}
    </div>
  );
}

export default App;
