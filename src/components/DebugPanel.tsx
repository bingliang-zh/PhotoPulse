import { useState, useRef, useEffect } from 'react';
import { openFolderWithLogs } from '../utils/system';
import { getAutoLaunchEnabled, setAutoLaunchEnabled, updateConfigAutoLaunch } from '../services/config';

export interface LogEntry {
    message: string;
    type: 'info' | 'warn' | 'error' | 'debug';
    timestamp: string;
    action?: {
        label: string;
        handler: () => void;
    };
}

export type OnLogCallback = (message: string, type: 'info' | 'warn' | 'error' | 'debug', action?: { label: string, handler: () => void }) => void;

interface DebugPanelProps {
    logs: LogEntry[];
    onClose: () => void;
    onLog: OnLogCallback;
    testMode?: boolean;
    onTestModeToggle?: () => void;
    onNextWeather?: () => void;
    showBackground?: boolean;
    onBackgroundToggle?: () => void;
    showLive2D?: boolean;
    onLive2DToggle?: () => void;
}

export const DebugPanel = ({ 
    logs, 
    onClose, 
    onLog, 
    testMode, 
    onTestModeToggle, 
    onNextWeather, 
    showBackground, 
    onBackgroundToggle,
    showLive2D,
    onLive2DToggle
}: DebugPanelProps) => {
    const [verbose, setVerbose] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const [autoLaunchEnabled, setAutoLaunchEnabledState] = useState<boolean>(false);
    const [autoLaunchLoading, setAutoLaunchLoading] = useState<boolean>(false);

    useEffect(() => {
        // Load initial autoLaunch state
        getAutoLaunchEnabled().then(enabled => {
            setAutoLaunchEnabledState(enabled);
            onLog(`AutoLaunch: Current status is ${enabled ? 'enabled' : 'disabled'}`, 'info');
        }).catch(err => {
            onLog(`AutoLaunch: Failed to get status: ${err}`, 'error');
        });
    }, []);

    const openConfigFolder = () => openFolderWithLogs(undefined, (msg, type) => onLog(msg, type));

    const handleAutoLaunchToggle = async () => {
        if (autoLaunchLoading) return;
        
        const newValue = !autoLaunchEnabled;
        setAutoLaunchLoading(true);
        onLog(`AutoLaunch: ${newValue ? 'Enabling' : 'Disabling'}...`, 'info');

        try {
            await setAutoLaunchEnabled(newValue);
            await updateConfigAutoLaunch(newValue, onLog);
            setAutoLaunchEnabledState(newValue);
            onLog(`AutoLaunch: Successfully ${newValue ? 'enabled' : 'disabled'}`, 'info');
        } catch (err) {
            onLog(`AutoLaunch: Failed to toggle: ${err}`, 'error');
        } finally {
            setAutoLaunchLoading(false);
        }
    };

    const filteredLogs = verbose ? logs : logs.filter(l => l.type !== 'debug');

    // Auto-scroll to bottom when new logs arrive (if autoScroll is enabled)
    useEffect(() => {
        if (autoScroll && logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    // Handle scroll to detect if user is at bottom
    const handleScroll = () => {
        if (!logsContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setAutoScroll(isAtBottom);
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'error': return '#ff5252';
            case 'warn': return '#ffd740';
            case 'debug': return '#888888';
            case 'info': default: return '#69f0ae';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '300px',
            zIndex: 50,
            background: 'rgba(0,0,0,0.9)',
            borderTop: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            pointerEvents: 'auto'
        }}>
            {/* Header Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                background: '#111',
                borderBottom: '1px solid #333',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Debug Panel: <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.8rem' }}>(Press ` to toggle)</span></span>

                    <button
                        onClick={openConfigFolder}
                        style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Config Folder
                    </button>

                    <button
                        onClick={() => setVerbose(prev => !prev)}
                        style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            background: verbose ? '#555' : '#333',
                            color: verbose ? '#fff' : '#888',
                            border: `1px solid ${verbose ? '#888' : '#555'}`,
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Verbose {verbose ? 'ON' : 'OFF'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Launch on Login:</span>
                        <label style={{ 
                            position: 'relative', 
                            display: 'inline-block', 
                            width: '44px', 
                            height: '24px',
                            cursor: autoLaunchLoading ? 'not-allowed' : 'pointer'
                        }}>
                            <input 
                                type="checkbox" 
                                checked={autoLaunchEnabled}
                                onChange={handleAutoLaunchToggle}
                                disabled={autoLaunchLoading}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: autoLaunchLoading ? 'not-allowed' : 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: autoLaunchEnabled ? '#4CAF50' : '#555',
                                transition: '0.4s',
                                borderRadius: '24px',
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '18px',
                                    width: '18px',
                                    left: autoLaunchEnabled ? '23px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    transition: '0.4s',
                                    borderRadius: '50%',
                                }}></span>
                            </span>
                        </label>
                        {autoLaunchLoading && <span style={{ color: '#ffd740', fontSize: '0.7rem' }}>...</span>}
                    </div>

                    {onTestModeToggle && (
                        <button
                            onClick={onTestModeToggle}
                            style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                background: testMode ? '#8b5cf6' : '#333',
                                color: testMode ? '#fff' : '#888',
                                border: `1px solid ${testMode ? '#a78bfa' : '#555'}`,
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Weather Test {testMode ? 'ON' : 'OFF'}
                        </button>
                    )}

                    {onNextWeather && (
                        <button
                            onClick={onNextWeather}
                            disabled={!testMode}
                            style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                background: testMode ? '#3b82f6' : '#222',
                                color: testMode ? '#fff' : '#444',
                                border: `1px solid ${testMode ? '#60a5fa' : '#333'}`,
                                borderRadius: '4px',
                                cursor: testMode ? 'pointer' : 'not-allowed',
                                opacity: testMode ? 1 : 0.5
                            }}
                        >
                            Next Weather
                        </button>
                    )}

                    {onBackgroundToggle && (
                        <button
                            onClick={onBackgroundToggle}
                            style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                background: showBackground ? '#22c55e' : '#333',
                                color: showBackground ? '#fff' : '#888',
                                border: `1px solid ${showBackground ? '#4ade80' : '#555'}`,
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Background {showBackground ? 'ON' : 'OFF'}
                        </button>
                    )}

                    {onLive2DToggle && (
                        <button
                            onClick={onLive2DToggle}
                            style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                background: showLive2D ? '#ec4899' : '#333',
                                color: showLive2D ? '#fff' : '#888',
                                border: `1px solid ${showLive2D ? '#f472b6' : '#555'}`,
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Live2D {showLive2D ? 'ON' : 'OFF'}
                        </button>
                    )}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#aaa',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        padding: '0 5px'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Logs Area */}
            <div 
                ref={logsContainerRef}
                onScroll={handleScroll}
                className="custom-scrollbar" 
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}
            >
                {filteredLogs.length === 0 && <div style={{ color: '#555' }}>Ready. Logs will appear here...</div>}
                {filteredLogs.map((l, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', borderBottom: '1px solid #222', paddingBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#666' }}>[{l.timestamp}]</span>
                            <span style={{ color: getColor(l.type) }}>{l.message}</span>
                        </div>
                        {l.action && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLog(`Log Action '${l.action!.label}' clicked`, 'info');
                                    l.action!.handler();
                                }}
                                style={{
                                    marginLeft: '10px',
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    background: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#444'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#333'}
                            >
                                {l.action.label}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
