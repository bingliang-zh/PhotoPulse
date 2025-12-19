import { useState, useEffect } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { WidgetContainer } from './WidgetContainer';

interface CryptoProps {
    symbols?: string[];
    onLog?: (message: string, type: 'info' | 'warn' | 'error', action?: { label: string, handler: () => void }) => void;
}

export const CryptoWidget = ({ symbols, onLog }: CryptoProps) => {
    const [prices, setPrices] = useState<Record<string, string>>({});

    const activeSymbols = symbols && symbols.length > 0 ? symbols : [];

    useEffect(() => {
        const fetchPrices = async () => {
            onLog?.('Crypto: Fetching prices...', 'info');
            const newPrices: Record<string, string> = {};

            await Promise.all(activeSymbols.map(async (symbol) => {
                try {
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
                    if (response.ok) {
                        const data = await response.json();
                        const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                        if (price !== undefined) {
                            const displaySymbol = symbol.split('-')[0];
                            newPrices[displaySymbol] = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    } else {
                        onLog?.(`Crypto: Failed response for ${symbol}`, 'warn');
                    }
                } catch (error) {
                    onLog?.(`Crypto: Failed to fetch ${symbol}: ${error}`, 'warn');
                }
            }));

            setPrices(newPrices);
            onLog?.('Crypto: Prices updated.', 'info');
        };

        fetchPrices();
        const timer = setInterval(fetchPrices, 5000); // Update every 5 seconds for crypto
        return () => clearInterval(timer);
    }, [symbols]);

    return (
        <WidgetContainer title="Crypto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {activeSymbols.map(fullSymbol => {
                    const symbol = fullSymbol.split('-')[0];
                    const price = prices[symbol];
                    return (
                        <div key={symbol} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>{symbol}</span>
                            <span>${price || '...'}</span>
                        </div>
                    );
                })}
            </div>
        </WidgetContainer>
    );
};
