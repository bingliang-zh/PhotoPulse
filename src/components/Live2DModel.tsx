import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel as PIXILive2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism2';

interface Live2DModelProps {
  modelPath: string;
  width?: number;
  height?: number;
  scale?: number;
  x?: number;
  y?: number;
}

export function Live2DModel({
  modelPath,
  width = 300,
  height = 400,
  scale = 0.15,
  x = 150,
  y = 250,
  onLog,
}: Live2DModelProps & { onLog?: (msg: string, type: 'info' | 'warn' | 'error') => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    onLog?.('Live2D: Initializing model...', 'info');

    // 创建 PIXI Application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // 加载 Live2D 模型
    PIXILive2DModel.from(modelPath)
      .then((model: any) => {
        modelRef.current = model;
        app.stage.addChild(model);

        // 设置模型位置和缩放
        model.scale.set(scale);
        model.x = x;
        model.y = y;

        // 启用自动交互
        model.on('hit', (hitAreas: string[]) => {
          onLog?.(`Live2D hit: ${hitAreas.join(', ')}`, 'info');
          if (hitAreas.includes('body')) {
            model.motion('tap_body');
          } else if (hitAreas.includes('head')) {
            model.expression();
          }
        });

        // 启动空闲动画
        model.motion('idle');

        onLog?.('Live2D: Shizuku model loaded successfully', 'info');
      })
      .catch((error: Error) => {
        onLog?.(`Live2D: Failed to load model: ${error.message}`, 'error');
      });

    // 清理函数
    return () => {
      if (modelRef.current) {
        modelRef.current.destroy();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, [modelPath, width, height, scale, x, y, onLog]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        bottom: '0',
        right: '0',
        zIndex: 15,
        pointerEvents: 'auto',
      }}
    />
  );
}
