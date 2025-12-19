import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { readDir, BaseDirectory, DirEntry } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { openFolderWithLogs } from '../utils/system';

interface CarouselProps {
  interval?: number;
  onStateChange?: (hasImages: boolean) => void;
  onLog?: (message: string, type: 'info' | 'warn' | 'error', action?: { label: string, handler: () => void }) => void;
}

export const Carousel = ({ interval = 30, onStateChange, onLog }: CarouselProps) => {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      onLog?.("Carousel: Start scanning...", 'info');
      try {
        let entries: DirEntry[] = [];
        let basePath = "";

        try {
          // We read from AppData backgrounds folder
          entries = await readDir('backgrounds', { baseDir: BaseDirectory.AppData });
          const appData = await appDataDir();
          basePath = await join(appData, 'backgrounds');
          onLog?.(`Carousel: Found ${entries.length} entries in backgrounds`, 'info');
        } catch (e) {
          const appData = await appDataDir();
          basePath = await join(appData, 'backgrounds');
          onLog?.(`Carousel: default background path not found or empty: ${e}`, 'warn');
          entries = [];
        }

        const imageEntries = entries.filter(entry =>
          entry.isFile && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(entry.name)
        );

        if (imageEntries.length > 0) {
          const imageUrls = imageEntries.map(entry => {
            const fullPath = `${basePath}/${entry.name}`;
            const converted = convertFileSrc(fullPath);
            return converted;
          });
          setImages(imageUrls);
          onStateChange?.(true);
          onLog?.(`Carousel: Loaded ${imageEntries.length} images.`, 'info');
          return;
        } else {
          onStateChange?.(false);
          onLog?.(
            'Carousel: No images found. Click the button on the right to open the folder, drag images in, and restart for changes to take effect.',
            'warn',
            {
              label: 'Open Backgrounds',
              handler: async () => {
                await openFolderWithLogs('backgrounds', (msg: string, type: 'info' | 'warn' | 'error') => onLog?.(msg, type));
              }
            }
          );
          setImages([]);
          return;
        }

      } catch (err) {
        onLog?.(`Carousel: Failed to load images: ${err}`, 'error');
      }

      setImages([]);
      onStateChange?.(false);
      onLog?.('Carousel: No images found. Please check configuration.', 'warn');
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [images, interval]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length === 0) return;

      if (e.key === 'ArrowRight') {
        setIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images]);

  if (images.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#555',
        fontFamily: 'sans-serif',
        fontSize: '1.2rem'
      }}>
        No background images
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        <motion.img
          key={images[index]}
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
        background: 'rgba(0,0,0,0.3)'
      }} />
    </div>
  );
};
