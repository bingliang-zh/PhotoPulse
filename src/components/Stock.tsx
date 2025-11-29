import { useState, useEffect } from 'react';
import { fetch } from '@tauri-apps/plugin-http';

const STOCKS = ['NVDA', 'AAPL', 'GOOGL', 'MSFT', 'AVGO', 'AMD', 'QQQ', 'IREN', 'TSM'];

export const Stock = () => {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices: Record<string, string> = {};
      
      await Promise.all(STOCKS.map(async (symbol) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
          if (response.ok) {
            const data = await response.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (price !== undefined) {
              newPrices[symbol] = price.toFixed(2);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol}`, error);
        }
      }));

      setPrices(prev => ({ ...prev, ...newPrices }));
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ color: 'white', padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', marginTop: '20px' }}>
      <h2>Market</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {STOCKS.map(symbol => (
          <div key={symbol} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>{symbol}</span>
            <span>${prices[symbol] || '...'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
