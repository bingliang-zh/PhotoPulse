import { useState, useEffect } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { WidgetContainer } from './WidgetContainer';

interface StockProps {
  symbols: string[];
  onLog?: (message: string, type: 'info' | 'warn' | 'error', action?: { label: string, handler: () => void }) => void;
}

export const Stock = ({ symbols, onLog }: StockProps) => {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      onLog?.('Stock: Fetching prices...', 'info');
      const newPrices: Record<string, string> = {};

      await Promise.all(symbols.map(async (symbol) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
          if (response.ok) {
            const data = await response.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (price !== undefined) {
              newPrices[symbol] = price.toFixed(2);
            }
          } else {
            onLog?.(`Stock: Failed fetch response for ${symbol}`, 'warn');
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol}`, error);
          onLog?.(`Stock: Failed to fetch ${symbol}: ${error}`, 'warn');
        }
      }));

      setPrices(newPrices);
      onLog?.('Stock: Prices updated.', 'info');
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [symbols]);

  return (
    <WidgetContainer title="Market">
      <div className="widget-grid">
        {symbols.map(symbol => (
          <div key={symbol} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>{symbol}</span>
            <span>${prices[symbol] || '...'}</span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
};
