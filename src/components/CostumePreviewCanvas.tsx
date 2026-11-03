import React, { useEffect, useRef } from 'react';
import { CostumeId } from '../game/types';
import { drawPlayerSprite } from '../game/pixelRenderer';

interface CostumePreviewCanvasProps {
  costume: CostumeId;
  size?: number;
  animate?: boolean;
}

export const CostumePreviewCanvas: React.FC<CostumePreviewCanvasProps> = ({
  costume,
  size = 64,
  animate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let rafId = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = animate ? (now - startTime) / 1000 : 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bob = animate ? Math.sin(elapsed * 4) * 2.5 : 0;
      drawPlayerSprite(
        ctx,
        16,
        12 + bob,
        32,
        40,
        animate ? Math.sin(elapsed * 4) * 2 : 0,
        1,
        costume,
        elapsed,
        {
          isRunner: true,
          onGround: true,
        }
      );

      if (animate) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [costume, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      className="block"
    />
  );
};
