import React from 'react';

interface WidgetContainerProps {
    children: React.ReactNode;
    title?: string;
    style?: React.CSSProperties;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ children, title, style }) => {
    return (
        <div className="widget-container" style={style}>
            {title && <h2 className="widget-title">{title}</h2>}
            {children}
        </div>
    );
};
