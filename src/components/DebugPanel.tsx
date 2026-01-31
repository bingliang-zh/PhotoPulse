import { useState } from 'react';
import { openFolderWithLogs } from '../utils/system';

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
}

export const DebugPanel = ({ logs, onClose, onLog }: DebugPanelProps) => {
    const [verbose, setVerbose] = useState(false);

    const openConfigFolder = () => openFolderWithLogs(undefined, (msg, type) => onLog(msg, type));

    const filteredLogs = verbose ? logs : logs.filter(l => l.type !== 'debug');

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
            <div className="custom-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
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
