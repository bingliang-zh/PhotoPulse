import React from 'react';
import styles from './Vignette.module.css';

type Props = {
  mode: string;
};

export const Vignette: React.FC<Props> = ({ mode }) => {
  // Determine which class to apply based on mode
  let modeClass = '';
  if (mode === 'clear') modeClass = styles.clear;
  else if (mode === 'cloudy') modeClass = styles.cloudy;

  return (
    <div 
      className={`${styles.container} ${modeClass}`}
      aria-hidden="true" 
    />
  );
};
