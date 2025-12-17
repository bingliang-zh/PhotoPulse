import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { readDir, BaseDirectory, DirEntry } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { openFolderWithLogs } from '../utils/system';

interface CarouselProps {
  customDir?: string;
  onStateChange?: (hasImages: boolean) => void;
  onLog?: (message: string, type: 'info' | 'warn' | 'error', action?: { label: string, handler: () => void }) => void;
}

export const Carousel = ({ customDir, onStateChange, onLog }: CarouselProps) => {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      onLog?.("Carousel: Start scanning...", 'info');
      try {
        let entries: DirEntry[] = [];
        let basePath = "";

        if (customDir && customDir.trim() !== "") {
          try {
            entries = await readDir(customDir);
            basePath = customDir;
          } catch (e) { /* fall through to default */ }
        }

        // If customDir didn't work or wasn't provided, try default
        if (!entries) {
          try {
            // We initially try to read from AppData to see if files exist
            entries = await readDir('backgrounds', { baseDir: BaseDirectory.AppData });
            const appData = await appDataDir();
            basePath = await join(appData, 'backgrounds');
          } catch (e) {
            // If strictly reading failed, we might still want to know the path to open for the user
            const appData = await appDataDir();
            basePath = await join(appData, 'backgrounds');

            onLog?.(`Carousel: default background path not found or empty: ${e}`, 'warn');
            // Don't return yet, let next block handle empty entries
            entries = [];
          }
        }

        const imageEntries = entries.filter(entry =>
          entry.isFile && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(entry.name)
        );

        if (imageEntries.length > 0) {
          const imageUrls = imageEntries.map(entry => {
            return convertFileSrc(`${basePath}/${entry.name}`);
          });
          setImages(imageUrls);
          onStateChange?.(true);
          onLog?.(`Carousel: Loaded ${imageEntries.length} images.`, 'info');
          return;
        } else {
          // Resolved path exists but is empty of images
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
      // Fallback log if specific paths didn't catch it
      onLog?.('Carousel: No images found. Please check configuration.', 'warn');
    };

    loadImages();
  }, [customDir]);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 15000);
    return () => clearInterval(timer);
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
