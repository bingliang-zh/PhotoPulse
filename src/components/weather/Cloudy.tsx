import React from 'react';
import styles from './Cloudy.module.css';

type Props = {
  active: boolean;
};

export const Cloudy: React.FC<Props> = ({ active }) => {
  return (
    <div 
      className={`${styles.container} ${active ? styles.active : ''}`} 
      aria-hidden="true"
    />
  );
};
