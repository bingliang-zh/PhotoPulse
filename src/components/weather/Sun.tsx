import React from 'react';
import styles from './Sun.module.css';

type Props = {
  active: boolean;
};

export const Sun: React.FC<Props> = ({ active }) => {
  return (
    <div 
      className={`${styles.container} ${active ? styles.active : ''}`}
      aria-hidden="true"
    />
  );
};
