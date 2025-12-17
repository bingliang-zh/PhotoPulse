import React from 'react';

interface WidgetContainerProps {
    children: React.ReactNode;
    title?: string;
    style?: React.CSSProperties;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ children, title, style }) => {
    return (
        <div style={{
            color: 'white',
            padding: 20,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            ...style
        }}>
            {title && <h2 style={{ marginTop: 10 }}>{title}</h2>}
            {children}
        </div>
    );
};
