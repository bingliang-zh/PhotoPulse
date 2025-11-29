import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const imagesGlob = import.meta.glob('../assets/backgrounds/*', { eager: true, query: '?url', import: 'default' });
const images = Object.values(imagesGlob) as string[];

export const Carousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Preload images to avoid black screen during transition
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        <motion.img
          key={index}
          src={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AnimatePresence>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.3)' // Overlay to make text readable
      }} />
    </div>
  );
};
