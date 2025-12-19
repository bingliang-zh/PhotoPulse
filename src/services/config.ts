import { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { openFolderWithLogs } from '../utils/system';

export interface WeatherConfig {
    city?: string;
    latitude?: number;
    longitude?: number;
}

export interface AppConfig {
    stocks?: string[];
    weather?: WeatherConfig;
    crypto?: string[];
    interval?: number;
}

const DEFAULT_STOCKS = ['NVDA', 'AAPL', 'GOOGL', 'MSFT', 'AVGO', 'AMD', 'QQQ', 'IREN', 'TSM'];
const DEFAULT_CRYPTO = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XMR-USD'];
const DEFAULT_INTERVAL = 30;
const DEFAULT_WEATHER = {
    city: "Hangzhou",
    latitude: 30.2748,
    longitude: 120.1551
};

export const loadConfig = async (onLog?: (msg: string, type: 'info' | 'warn' | 'error', action?: { label: string, handler: () => void }) => void): Promise<AppConfig> => {
    let appDataPath = "unknown";

    try {
        try {
            appDataPath = await appDataDir();
        } catch (e) {
            onLog?.(`Config: Failed to resolve appDataDir: ${e}`, 'warn');
        }

        // 1. Ensure AppData/backgrounds exists
        try {
            const bgExists = await exists('backgrounds', { baseDir: BaseDirectory.AppData });
            if (!bgExists) {
                await mkdir('backgrounds', { baseDir: BaseDirectory.AppData, recursive: true });
                onLog?.("Config: Created 'backgrounds' directory in AppData.", 'info');
            }
        } catch (e) {
            onLog?.(`Config: mkdir 'backgrounds' failed: ${e}, trying absolute path...`, 'warn');
            if (appDataPath !== "unknown") {
                try {
                    const bgPath = await join(appDataPath, 'backgrounds');
                    await mkdir(bgPath, { recursive: true });
                    onLog?.(`Config: Created absolute path directory '${bgPath}'.`, 'info');
                } catch (e2) {
                    onLog?.(`Config: mkdir absolute failed: ${e2}`, 'error');
                }
            }
        }

        const fileExists = await exists('config.json', { baseDir: BaseDirectory.AppData });

        if (!fileExists) {
            onLog?.("Config: config.json not found. Creating default configuration...", 'info');
            const defaultConfig: AppConfig = {
                stocks: DEFAULT_STOCKS,
                weather: DEFAULT_WEATHER,
                crypto: DEFAULT_CRYPTO,
                interval: DEFAULT_INTERVAL
            };

            try {
                await writeTextFile('config.json', JSON.stringify(defaultConfig, null, 2), { baseDir: BaseDirectory.AppData });
                onLog?.("Config: Default configuration created successfully. You can edit config.json to customize settings.", 'info', {
                    label: 'Open Config Folder',
                    handler: () => openFolderWithLogs(undefined, onLog)
                });
            } catch (e) {
                onLog?.(`Config: Failed to write default config: ${e}`, 'error');
            }

            return defaultConfig;
        }

        onLog?.("Config: Loading existing config.json...", 'info');
        const content = await readTextFile('config.json', { baseDir: BaseDirectory.AppData });
        const config = JSON.parse(content);

        return {
            stocks: config.stocks,
            weather: config.weather,
            crypto: config.crypto,
            interval: config.interval
        };
    } catch (error) {
        onLog?.(`Config: Critical error loading config: ${error}`, 'error');
        return {
            stocks: DEFAULT_STOCKS,
            weather: DEFAULT_WEATHER,
            crypto: DEFAULT_CRYPTO,
            interval: DEFAULT_INTERVAL
        };
    }
};
