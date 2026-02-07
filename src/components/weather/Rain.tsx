import React from 'react';
import styles from './Rain.module.css';

type Props = {
  active: boolean;
};

export const Rain: React.FC<Props> = ({ active }) => {
  return (
    <div 
      className={`${styles.container} ${active ? styles.active : ''}`}
      aria-hidden="true"
    >
      {/* 
         Previous implementation had multiple layers and glass effects.
         Current implementation is the requested "Spindle Debug" mode.
      */}
      <div className={styles.spindle} />
    </div>
  );
};
