import { useState, useEffect } from 'react';
import './App.css';
import { Carousel } from './components/Carousel';
import { Weather } from './components/Weather';
import { Stock } from './components/Stock';

function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <Carousel />
      <div className="dashboard">
        <div className="widget-column">
          <Weather />
          <Stock />
        </div>
        <div className="time-display" style={{ marginTop: '5vh' }}>
          <h1>{time.toLocaleTimeString('en-US', { hour12: false })}</h1>
          <h2>{time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</h2>
          <h3>{time.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
        </div>
      </div>
    </div>
  );
}

export default App;
