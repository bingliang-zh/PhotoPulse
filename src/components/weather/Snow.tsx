import React from 'react';
import styles from './Snow.module.css';

type Props = {
  active: boolean;
};

export const Snow: React.FC<Props> = ({ active }) => {
  return (
    <div 
      className={`${styles.container} ${active ? styles.active : ''}`}
      aria-hidden="true" 
    />
  );
};
