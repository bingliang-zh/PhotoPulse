import { useState, useEffect, useCallback } from 'react';
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
  const [realWeatherCode, setRealWeatherCode] = useState<number | undefined>(undefined);
  const [testMode, setTestMode] = useState(false);
  const [showBackground, setShowBackground] = useState(true);

  // Test weather codes: clear(0), cloudy(3), fog(45), rain(61), snow(73), thunder(95)
  const testWeatherCodes = [0, 3, 45, 61, 73, 95];
  const testWeatherNames = ['clear', 'cloudy', 'fog', 'rain', 'snow', 'thunder'];

  const addLog: OnLogCallback = useCallback((message, type, action) => {
    setLogs(prev => [...prev, { message, type, action, timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  // Test mode: cycle through weather codes every 2 seconds
  useEffect(() => {
    if (!testMode) {
      // Restore real weather code when test mode is off
      if (realWeatherCode !== undefined) {
        setWeatherCode(realWeatherCode);
        addLog(`Test Mode: Restored real weather code=${realWeatherCode}`, 'info');
      }
      return;
    }
    let index = 0;
    addLog(`Test Mode: Starting weather cycle`, 'info');
    setWeatherCode(testWeatherCodes[0]);

    const timer = setInterval(() => {
      index = (index + 1) % testWeatherCodes.length;
      const code = testWeatherCodes[index];
      addLog(`Test Mode: code=${code}, effect=${testWeatherNames[index]}`, 'info');
      setWeatherCode(code);
    }, 2000);

    return () => clearInterval(timer);
  }, [testMode, realWeatherCode, addLog]);

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
      {showBackground && (
        <Carousel
          interval={config.interval}
          onStateChange={setHasImages}
          onLog={addLog}
        />
      )}
      {!showBackground && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: '#1a1a1a'
        }} />
      )}
      <WeatherEffects weatherCode={weatherCode} enabled={!!config.weather} onLog={addLog} />
      <div className="dashboard">
        <div className="widget-column">
          {config.weather && config.weather.city && (
            <Weather
              location={config.weather}
              onLog={addLog}
              onWeatherCode={(code) => {
                setRealWeatherCode(code);
                if (!testMode) {
                  setWeatherCode(code);
                }
              }}
            />
          )}
          {config.stocks && config.stocks.length > 0 && (
            <Stock symbols={config.stocks} onLog={addLog} />
          )}
          {config.crypto && config.crypto.length > 0 && (
            <CryptoWidget symbols={config.crypto} onLog={addLog} />
          )}
        </div>
        <div className="time-display" style={{ marginTop: "5vh" }}>
          <h1>{time.toLocaleTimeString("en-US", { hour12: false })}</h1>
          <h2>
            {time.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </h2>
          <h3>{time.toLocaleDateString("en-US", { weekday: "long" })}</h3>
        </div>
      </div>
      {debugVisible && (
        <DebugPanel
          onClose={() => setDebugVisible(false)}
          logs={logs}
          onLog={addLog}
          testMode={testMode}
          onTestModeToggle={() => setTestMode(prev => !prev)}
          showBackground={showBackground}
          onBackgroundToggle={() => setShowBackground(prev => !prev)}
        />
      )}
    </div>
  );
}

export default App;
