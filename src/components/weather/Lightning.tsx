import React from 'react';
import styles from './Lightning.module.css';

type Props = {
  active: boolean;
};

export const Lightning: React.FC<Props> = ({ active }) => {
  return (
    <div 
      className={`${styles.container} ${active ? styles.active : ''}`}
      aria-hidden="true" 
    />
  );
};
