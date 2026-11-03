import {
  CandyItem,
  CostumeId,
  Enemy,
  FloatingText,
  GameMode,
  Particle,
  Platform,
  PowerupItem,
} from './types';

// Helper to draw crisp pixel rectangles
function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Draw 4-Layer Parallax Nocturnal Background
export function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollOffset: number,
  time: number,
  mode: GameMode
) {
  // LAYER 1: Deep Nocturnal Indigo Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#090514');
  skyGrad.addColorStop(0.45, '#130B29');
  skyGrad.addColorStop(0.82, '#241445');
  skyGrad.addColorStop(1, '#331A5C');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Twinkling Pixel Stars (parallax 0.05x)
  const starSeed = [
    { x: 0.08, y: 0.07, s: 3, c: '#FFF8E7' },
    { x: 0.22, y: 0.16, s: 2, c: '#FFD166' },
    { x: 0.37, y: 0.05, s: 3, c: '#A0E7E5' },
    { x: 0.51, y: 0.19, s: 2, c: '#FFF8E7' },
    { x: 0.64, y: 0.09, s: 4, c: '#FFD166' },
    { x: 0.89, y: 0.12, s: 2, c: '#FFF8E7' },
    { x: 0.14, y: 0.29, s: 2, c: '#FF477E' },
    { x: 0.44, y: 0.33, s: 3, c: '#FFF8E7' },
    { x: 0.78, y: 0.27, s: 2, c: '#A0E7E5' },
    { x: 0.93, y: 0.36, s: 3, c: '#FFD166' },
    { x: 0.05, y: 0.48, s: 2, c: '#FFF8E7' },
    { x: 0.31, y: 0.44, s: 2, c: '#FFD166' },
    { x: 0.61, y: 0.51, s: 3, c: '#FFF8E7' },
    { x: 0.84, y: 0.46, s: 2, c: '#A0E7E5' },
  ];

  starSeed.forEach((st, idx) => {
    const sx =
      mode === 'vertical'
        ? st.x * width
        : ((st.x * width - scrollOffset * 0.05) % width + width) % width;
    const sy =
      mode === 'vertical'
        ? ((st.y * height + scrollOffset * 0.04) % (height * 0.75) + height * 0.75) %
          (height * 0.75)
        : st.y * height * 0.7;

    const twinkle = Math.sin(time * 3.2 + idx * 1.9) > 0.25 ? st.s : Math.max(1, st.s - 1);
    pxRect(ctx, sx, sy, twinkle, twinkle, st.c);
    if (twinkle >= 3 && Math.sin(time * 4 + idx) > 0.6) {
      // Cross sparkle
      pxRect(ctx, sx - 2, sy + 1, twinkle + 4, 1, st.c);
      pxRect(ctx, sx + 1, sy - 2, 1, twinkle + 4, st.c);
    }
  });

  // Colossal Pixel Harvest Moon (Upper Right)
  const moonX = Math.round(width * 0.76);
  const moonY = Math.round(
    mode === 'vertical'
      ? Math.min(height * 0.28, 115 + ((scrollOffset * 0.015) % 80))
      : 105
  );
  const moonR = 46;

  // Outer Moon Halo (stepped concentric rings)
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(time * 1.5) * 0.03;
  pxRect(ctx, moonX - moonR - 22, moonY - moonR - 14, (moonR + 22) * 2, (moonR + 14) * 2, '#FF9E00');
  ctx.globalAlpha = 0.2;
  pxRect(ctx, moonX - moonR - 10, moonY - moonR - 6, (moonR + 10) * 2, (moonR + 6) * 2, '#FFD166');
  ctx.restore();

  // Pixelated Octagonal Harvest Moon body
  pxRect(ctx, moonX - moonR + 12, moonY - moonR, (moonR - 12) * 2, moonR * 2, '#F4D35E');
  pxRect(ctx, moonX - moonR + 6, moonY - moonR + 6, (moonR - 6) * 2, (moonR - 6) * 2, '#F4D35E');
  pxRect(ctx, moonX - moonR, moonY - moonR + 12, moonR * 2, (moonR - 12) * 2, '#FFF3B0');

  // Moon Craters in pixel style
  pxRect(ctx, moonX - 24, moonY - 16, 14, 10, '#E09F3E');
  pxRect(ctx, moonX + 10, moonY - 24, 10, 8, '#E09F3E');
  pxRect(ctx, moonX + 6, moonY + 8, 18, 12, '#E09F3E');
  pxRect(ctx, moonX - 18, moonY + 16, 8, 8, '#E09F3E');

  // Drifting spooky purple clouds across the moon & sky
  for (let i = 0; i < 4; i++) {
    const cloudX = ((i * 210 + time * (12 + i * 3)) % (width + 160)) - 80;
    const cloudY = 75 + i * 75;
    pxRect(ctx, cloudX, cloudY, 84, 10, 'rgba(43, 21, 79, 0.65)');
    pxRect(ctx, cloudX + 14, cloudY - 6, 52, 6, 'rgba(65, 34, 112, 0.55)');
  }

  // LAYER 2: Distant Gothic Town & Giant Pumpkin Stalk Silhouettes (0.2x speed)
  if (mode === 'vertical') {
    // Giant climbing background pumpkin stalk & gothic towers scrolling vertically
    const stalkSegmentH = 180;
    const offset = ((scrollOffset * 0.22) % stalkSegmentH + stalkSegmentH) % stalkSegmentH;

    // Distant gothic cathedral & crooked spires at low/mid altitude
    const townBaseY = height - 80 + Math.min(scrollOffset * 0.25, 340);
    if (townBaseY < height + 260) {
      const spires = [
        { x: 20, w: 68, h: 210, roofH: 48 },
        { x: 95, w: 56, h: 165, roofH: 36 },
        { x: 165, w: 84, h: 245, roofH: 60 },
        { x: 260, w: 62, h: 175, roofH: 40 },
        { x: 335, w: 78, h: 225, roofH: 52 },
        { x: 420, w: 65, h: 190, roofH: 44 },
      ];
      spires.forEach((sp, i) => {
        const topY = townBaseY - sp.h;
        pxRect(ctx, sp.x, topY, sp.w, sp.h + 100, '#160D2E');
        // Stepped pointed gothic roof
        for (let step = 0; step < 6; step++) {
          const inset = (step + 1) * (sp.w / 14);
          pxRect(
            ctx,
            sp.x + inset,
            topY - (step + 1) * (sp.roofH / 6),
            sp.w - inset * 2,
            sp.roofH / 6 + 1,
            '#1D113B'
          );
        }
        // Glowing distant gothic window
        pxRect(ctx, sp.x + sp.w / 2 - 6, topY + 24, 12, 18, i % 2 === 0 ? '#FF9E00' : '#FFD166');
        pxRect(ctx, sp.x + sp.w / 2 - 1, topY + 24, 2, 18, '#160D2E');
      });
    }

    // Colossal Background Twisting Pumpkin Beanstalk Pillar (always visible in distance)
    for (let y = -stalkSegmentH; y < height + stalkSegmentH; y += stalkSegmentH) {
      const segY = y + offset;
      const wave = Math.sin((segY - scrollOffset * 0.22) * 0.018) * 28;
      const centerX = width * 0.5 + wave;

      // Shadowed vine trunk
      pxRect(ctx, centerX - 24, segY, 48, stalkSegmentH + 2, '#15241E');
      pxRect(ctx, centerX - 16, segY, 28, stalkSegmentH + 2, '#1E352B');
      pxRect(ctx, centerX - 6, segY, 10, stalkSegmentH + 2, '#284739');

      // Side curly tendrils & background hanging pumpkins
      pxRect(ctx, centerX - 52, segY + 40, 28, 12, '#1E352B');
      pxRect(ctx, centerX - 60, segY + 52, 22, 18, '#6B2D14');
      pxRect(ctx, centerX + 24, segY + 110, 32, 12, '#1E352B');
      pxRect(ctx, centerX + 44, segY + 122, 20, 16, '#803718');
    }
  } else {
    // Runner Mode: Scrolling horizontal gothic town & pumpkin forest
    const segW = 140;
    const offset = -((scrollOffset * 0.25) % segW);
    for (let x = offset - segW; x < width + segW; x += segW) {
      const idx = Math.abs(Math.floor((x - offset) / segW));
      const h = 150 + ((idx * 47) % 95);
      const topY = height - h;
      pxRect(ctx, x + 8, topY, segW - 16, h, '#170E30');
      // Pointed gable
      pxRect(ctx, x + 22, topY - 18, segW - 44, 18, '#1F133D');
      pxRect(ctx, x + 38, topY - 34, segW - 76, 16, '#1F133D');
      // Lit windows
      pxRect(ctx, x + 34, topY + 22, 14, 20, '#FF9E00');
      pxRect(ctx, x + segW - 52, topY + 52, 14, 20, '#FFD166');
    }
  }
}

// Draw a Platform (Victorian Rooftop, Giant Pumpkin Vine, Spring Pumpkin, Fragile Branch, Moving Spectral Cloud)
export function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, time: number) {
  if (p.broken && (p.breakAnim ?? 0) > 1) return;

  ctx.save();
  const x = Math.round(p.x);
  let y = Math.round(p.y);
  const w = Math.round(p.width);
  const h = Math.round(p.height);

  if (p.broken && p.breakAnim) {
    y += Math.round(p.breakAnim * 28);
    ctx.globalAlpha = Math.max(0, 1 - p.breakAnim);
  }

  // Dark 2px outer pixel border for readability
  pxRect(ctx, x - 2, y - 2, w + 4, h + 4, '#070510');

  if (p.type === 'rooftop') {
    // Slate Victorian Rooftop with tiles, snow/moonlight trim & optional chimney/window
    if (p.hasChimney) {
      pxRect(ctx, x + 10, y - 18, 16, 18, '#070510');
      pxRect(ctx, x + 12, y - 16, 12, 16, '#5C2735');
      pxRect(ctx, x + 10, y - 18, 16, 4, '#7D3849');
    }

    // Main slate body
    pxRect(ctx, x, y, w, h, '#2D1E4A');
    // Top moonlit highlight strip
    pxRect(ctx, x, y, w, 4, '#6C509E');
    // Scalloped tile pattern
    for (let tx = x + 6; tx < x + w - 8; tx += 14) {
      pxRect(ctx, tx, y + 6, 8, 4, '#432E6E');
      pxRect(ctx, tx + 4, y + 11, 8, 3, '#1B1130');
    }
    // Underneath eaves + glowing attic window in tall runner platforms or thick rooftops
    if (h > 28) {
      pxRect(ctx, x + 4, y + 18, w - 8, h - 18, '#1A102E');
      for (let wx = x + 18; wx < x + w - 26; wx += 38) {
        pxRect(ctx, wx - 2, y + 28, 18, 24, '#070510');
        pxRect(ctx, wx, y + 30, 14, 20, '#FF9E00');
        pxRect(ctx, wx + 2, y + 32, 10, 16, '#FFD166');
        // Window crossbars
        pxRect(ctx, wx + 6, y + 30, 2, 20, '#1A102E');
        pxRect(ctx, wx, y + 39, 14, 2, '#1A102E');
      }
    }
  } else if (p.type === 'vine' || p.type === 'spring') {
    // Giant Twisted Pumpkin Branch
    pxRect(ctx, x, y, w, h, '#1E4D2B');
    pxRect(ctx, x, y, w, 4, '#4CC947'); // Vibrant top highlight
    pxRect(ctx, x + 2, y + h - 4, w - 4, 4, '#112E19'); // Deep shadow

    // Knots and autumn leaves along the branch
    for (let vx = x + 10; vx < x + w - 14; vx += 22) {
      pxRect(ctx, vx, y + 5, 10, 4, '#2E7040');
      // Little orange/gold autumn leaf sprouting
      pxRect(ctx, vx + 4, y - 5, 6, 4, '#FF7518');
      pxRect(ctx, vx + 6, y - 6, 4, 2, '#FFD166');
    }

    // Curled tendril on ends
    pxRect(ctx, x - 5, y + 3, 5, 6, '#2E7040');
    pxRect(ctx, x + w, y + 3, 5, 6, '#2E7040');

    // If 'spring', draw a Bouncy Jack-O'-Lantern on the center of the branch!
    if (p.type === 'spring') {
      const compress = p.springCompress ? Math.sin(p.springCompress * Math.PI) * 7 : 0;
      const px = Math.round(x + w / 2 - 14);
      const py = Math.round(y - 22 + compress);
      const ph = Math.round(22 - compress);

      // Outline
      pxRect(ctx, px - 2, py - 2, 32, ph + 4, '#070510');
      // Stem
      pxRect(ctx, px + 12, py - 6, 4, 5, '#4CC947');
      // Pumpkin body
      pxRect(ctx, px, py, 28, ph, '#FF7518');
      pxRect(ctx, px + 4, py, 20, ph, '#FF9E00');
      pxRect(ctx, px + 10, py, 8, ph, '#FFB703');
      // Glowing carved eyes & grin
      const glow = Math.sin(time * 10) > 0 ? '#FFF8E7' : '#FFD166';
      pxRect(ctx, px + 5, py + 5, 5, 5, '#070510');
      pxRect(ctx, px + 18, py + 5, 5, 5, '#070510');
      pxRect(ctx, px + 6, py + 6, 3, 3, glow);
      pxRect(ctx, px + 19, py + 6, 3, 3, glow);
      // Grin
      pxRect(ctx, px + 6, py + 13, 16, 4, '#070510');
      pxRect(ctx, px + 8, py + 14, 12, 2, glow);
    }
  } else if (p.type === 'fragile') {
    // Fragile Dry Cracked Autumn Branch
    pxRect(ctx, x, y, w, h, '#6E3B1E');
    pxRect(ctx, x, y, w, 3, '#A65E33');
    // Dark jagged crack in the middle
    const mid = x + Math.round(w / 2);
    pxRect(ctx, mid - 3, y, 4, 5, '#070510');
    pxRect(ctx, mid - 1, y + 5, 4, 6, '#070510');
    pxRect(ctx, mid - 5, y + 10, 4, 5, '#070510');
    // Dead orange leaf
    pxRect(ctx, x + 8, y - 4, 5, 4, '#D9531E');
  } else if (p.type === 'moving') {
    // Spectral Moving Platform with Will-o'-the-Wisp lanterns
    pxRect(ctx, x, y, w, h, '#3B2366');
    pxRect(ctx, x, y, w, 4, '#A0E7E5');
    pxRect(ctx, x + 4, y + 6, w - 8, 4, '#6C46B5');
    // Glowing cyan side crystals
    pxRect(ctx, x + 2, y + 4, 4, 6, '#39FF14');
    pxRect(ctx, x + w - 6, y + 4, 4, 6, '#39FF14');
  }

  ctx.restore();
}

// Draw Disguised Child Character Sprite (16-Bit Pixel Art)
export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  vy: number,
  facing: 1 | -1,
  costume: CostumeId,
  time: number,
  options?: {
    hasShield?: boolean;
    rocketTime?: number;
    magnetTime?: number;
    isRunner?: boolean;
    onGround?: boolean;
  }
) {
  ctx.save();
  const cx = Math.round(x + width / 2);
  const cy = Math.round(y + height / 2);

  // Squash & stretch subtle pixel offset
  const isRising = vy < -1.5;
  const isFalling = vy > 1.5;

  // Draw active Shield Aura if equipped
  if (options?.hasShield) {
    ctx.save();
    const pulse = Math.sin(time * 8) * 2;
    ctx.strokeStyle = '#FF9E00';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      Math.round(x - 8 - pulse),
      Math.round(y - 8 - pulse),
      Math.round(width + 16 + pulse * 2),
      Math.round(height + 16 + pulse * 2)
    );
    ctx.fillStyle = 'rgba(255, 158, 0, 0.14)';
    ctx.fillRect(
      Math.round(x - 6),
      Math.round(y - 6),
      Math.round(width + 12),
      Math.round(height + 12)
    );
    ctx.restore();
  }

  // Draw Magnet Ring if active
  if ((options?.magnetTime ?? 0) > 0) {
    ctx.save();
    ctx.strokeStyle = Math.sin(time * 14) > 0 ? '#FF477E' : '#A0E7E5';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 34 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.translate(cx, cy);
  ctx.scale(facing, 1);

  const bx = -16; // 32px wide sprite box
  const by = -20; // 40px tall sprite box

  // 1. Dynamic Fluttering Cape behind child
  const capeColors: Record<CostumeId, { main: string; shade: string }> = {
    pumpkin_witch: { main: '#FF477E', shade: '#9E1946' },
    sheet_ghost: { main: '#E0FBFC', shade: '#98C1D9' },
    black_cat: { main: '#9B5DE5', shade: '#5A2A96' },
    mini_vampire: { main: '#E6194B', shade: '#780016' },
  };
  const cape = capeColors[costume];
  const capeWave = Math.round(Math.sin(time * 14) * 3);
  const capeLift = isFalling ? -8 : isRising ? 6 : 0;

  // Cape Pixel Polygon
  pxRect(ctx, bx - 8, by + 14 + capeLift, 14, 16, '#070510');
  pxRect(ctx, bx - 6, by + 16 + capeLift, 12, 12, cape.shade);
  pxRect(ctx, bx - 10 + capeWave, by + 18 + capeLift, 12, 10, cape.main);

  // 2. Boots / Legs (Animated running cycle or jump pose)
  const legCycle = options?.isRunner && options?.onGround ? Math.sin(time * 22) * 5 : 0;
  const leftLegY = isRising ? by + 31 : by + 33 + Math.round(legCycle);
  const rightLegY = isRising ? by + 29 : by + 33 - Math.round(legCycle);

  // Left boot
  pxRect(ctx, bx + 6, leftLegY, 7, 8, '#070510');
  pxRect(ctx, bx + 7, leftLegY + 1, 5, 6, '#FF7518');
  // Right boot
  pxRect(ctx, bx + 18, rightLegY, 7, 8, '#070510');
  pxRect(ctx, bx + 19, rightLegY + 1, 5, 6, '#FF7518');

  // 3. Torso / Costume Outfit
  pxRect(ctx, bx + 5, by + 17, 22, 17, '#070510'); // outline
  if (costume === 'pumpkin_witch') {
    pxRect(ctx, bx + 7, by + 19, 18, 13, '#3B1E54'); // Tunic
    pxRect(ctx, bx + 7, by + 25, 18, 3, '#FF7518'); // Belt
    pxRect(ctx, bx + 14, by + 24, 5, 5, '#FFD166'); // Gold buckle
  } else if (costume === 'sheet_ghost') {
    pxRect(ctx, bx + 6, by + 18, 20, 15, '#FFF8E7'); // White sheet
    pxRect(ctx, bx + 6, by + 29, 20, 4, '#A0E7E5'); // Spectral hem
  } else if (costume === 'black_cat') {
    pxRect(ctx, bx + 7, by + 19, 18, 13, '#1E1B2E'); // Black cat suit
    pxRect(ctx, bx + 6, by + 18, 20, 4, '#FFD166'); // Golden scarf
    // Cat tail curling behind
    pxRect(ctx, bx - 5, by + 24 + capeWave, 7, 4, '#1E1B2E');
  } else {
    // Mini Vampire
    pxRect(ctx, bx + 5, by + 14, 6, 8, '#E6194B'); // High collar
    pxRect(ctx, bx + 7, by + 19, 18, 13, '#1A1423'); // Vest
    pxRect(ctx, bx + 13, by + 20, 6, 6, '#FF2A54'); // Ruby medallion
  }

  // 4. Head & Halloween Mask / Hood
  pxRect(ctx, bx + 4, by + 1, 24, 18, '#070510'); // Head outline

  if (costume === 'pumpkin_witch') {
    // Glowing Jack-O'-Lantern Hood
    pxRect(ctx, bx + 6, by + 3, 20, 14, '#FF7518');
    pxRect(ctx, bx + 9, by + 3, 14, 14, '#FF9E00');
    // Cute child face peeking inside hood
    pxRect(ctx, bx + 10, by + 6, 13, 10, '#1B1035');
    // Glowing eyes
    pxRect(ctx, bx + 12, by + 9, 3, 4, '#FFD166');
    pxRect(ctx, bx + 19, by + 9, 3, 4, '#FFD166');
    // Pumpkin stem on top
    pxRect(ctx, bx + 14, by - 4, 5, 6, '#39FF14');
  } else if (costume === 'sheet_ghost') {
    // Cute Ghost Hood
    pxRect(ctx, bx + 6, by + 3, 20, 15, '#FFF8E7');
    pxRect(ctx, bx + 6, by + 3, 4, 15, '#D8F3DC');
    // Big expressive eye holes
    pxRect(ctx, bx + 12, by + 8, 4, 5, '#070510');
    pxRect(ctx, bx + 19, by + 8, 4, 5, '#070510');
    pxRect(ctx, bx + 13, by + 9, 2, 2, '#A0E7E5');
    pxRect(ctx, bx + 20, by + 9, 2, 2, '#A0E7E5');
    // Blush cheeks
    pxRect(ctx, bx + 10, by + 13, 3, 2, '#FF477E');
    pxRect(ctx, bx + 21, by + 13, 3, 2, '#FF477E');
  } else if (costume === 'black_cat') {
    // Black Cat Head + Pointed Ears
    pxRect(ctx, bx + 6, by - 4, 6, 6, '#070510');
    pxRect(ctx, bx + 7, by - 3, 4, 5, '#FF477E');
    pxRect(ctx, bx + 20, by - 4, 6, 6, '#070510');
    pxRect(ctx, bx + 21, by - 3, 4, 5, '#FF477E');
    pxRect(ctx, bx + 6, by + 3, 20, 14, '#231942');
    // Bright neon green cat eyes
    pxRect(ctx, bx + 11, by + 8, 4, 4, '#39FF14');
    pxRect(ctx, bx + 19, by + 8, 4, 4, '#39FF14');
    pxRect(ctx, bx + 16, by + 12, 3, 2, '#FF7518'); // Cute nose
  } else {
    // Mini Vampire
    pxRect(ctx, bx + 6, by + 3, 20, 14, '#F1FAEE'); // Pale face
    pxRect(ctx, bx + 6, by + 2, 20, 5, '#070510'); // Widow's peak hair
    pxRect(ctx, bx + 14, by + 6, 4, 2, '#070510');
    // Crimson eyes & tiny fangs
    pxRect(ctx, bx + 12, by + 8, 3, 4, '#FF2A54');
    pxRect(ctx, bx + 19, by + 8, 3, 4, '#FF2A54');
    pxRect(ctx, bx + 13, by + 14, 2, 2, '#FFF8E7');
    pxRect(ctx, bx + 18, by + 14, 2, 2, '#FFF8E7');
  }

  // 5. Candy Bucket held in front hand!
  const bucketY = isRising ? by + 14 : by + 20;
  pxRect(ctx, bx + 23, bucketY, 11, 10, '#070510');
  pxRect(ctx, bx + 24, bucketY + 1, 9, 8, '#FF7518');
  pxRect(ctx, bx + 26, bucketY + 3, 2, 2, '#FFD166');
  pxRect(ctx, bx + 30, bucketY + 3, 2, 2, '#FFD166');

  // 6. If Witch Hat Rocket Boost is active, draw giant magical rocket witch hat & flame jets!
  if ((options?.rocketTime ?? 0) > 0) {
    // Witch hat crown on top of head
    pxRect(ctx, bx + 2, by - 4, 28, 5, '#070510');
    pxRect(ctx, bx + 4, by - 3, 24, 3, '#7209B7');
    pxRect(ctx, bx + 8, by - 12, 16, 9, '#7209B7');
    pxRect(ctx, bx + 11, by - 19, 10, 8, '#9B5DE5');
    pxRect(ctx, bx + 8, by - 6, 16, 3, '#FFD166'); // Hat buckle band

    // Rocket flame beneath boots
    const flameH = 14 + Math.round(Math.random() * 10);
    pxRect(ctx, bx + 9, by + 38, 14, flameH, '#FF7518');
    pxRect(ctx, bx + 12, by + 38, 8, flameH - 4, '#FFD166');
    pxRect(ctx, bx + 14, by + 38, 4, flameH - 8, '#FFF8E7');
  }

  ctx.restore();
}

// Draw Candy Item
export function drawCandy(ctx: CanvasRenderingContext2D, candy: CandyItem, time: number) {
  if (candy.collected) return;
  const bob = Math.round(Math.sin(time * 5 + candy.bobOffset) * 4);
  const x = Math.round(candy.x);
  const y = Math.round(candy.y + bob);

  ctx.save();

  // Subtle golden sparkle halo
  if (Math.sin(time * 8 + candy.bobOffset) > 0.3) {
    pxRect(ctx, x - 11, y - 11, 3, 3, '#FFD166');
    pxRect(ctx, x + 9, y + 8, 3, 3, '#FFF8E7');
  }

  if (candy.type === 'wrapper') {
    // Twisted Strawberry/Orange Wrapper Candy (+10)
    pxRect(ctx, x - 12, y - 6, 24, 12, '#070510');
    // Left & right wrapper wings
    pxRect(ctx, x - 11, y - 5, 5, 10, '#FF477E');
    pxRect(ctx, x + 6, y - 5, 5, 10, '#FF477E');
    // Center round candy
    pxRect(ctx, x - 6, y - 7, 12, 14, '#070510');
    pxRect(ctx, x - 5, y - 6, 10, 12, '#FF7518');
    pxRect(ctx, x - 3, y - 4, 6, 4, '#FFD166');
  } else if (candy.type === 'lollipop') {
    // Swirled Magenta & Gold Lollipop (+25)
    pxRect(ctx, x - 2, y + 4, 4, 11, '#070510');
    pxRect(ctx, x - 1, y + 5, 2, 9, '#FFF8E7'); // stick
    pxRect(ctx, x - 9, y - 11, 18, 16, '#070510');
    pxRect(ctx, x - 8, y - 10, 16, 14, '#FF477E');
    // Spiral pixels
    pxRect(ctx, x - 5, y - 7, 10, 8, '#FFD166');
    pxRect(ctx, x - 3, y - 5, 6, 4, '#FFF8E7');
  } else if (candy.type === 'candycorn') {
    // Classic Tricolor Candy Corn (+50)
    pxRect(ctx, x - 8, y - 10, 16, 20, '#070510');
    // Top white tip
    pxRect(ctx, x - 3, y - 8, 6, 5, '#FFF8E7');
    // Middle orange band
    pxRect(ctx, x - 5, y - 3, 10, 6, '#FF7518');
    // Bottom yellow base
    pxRect(ctx, x - 7, y + 3, 14, 5, '#FFD166');
  } else {
    // Golden Enchanted Caramel Apple (+100 & Combo +2)
    pxRect(ctx, x - 2, y - 14, 4, 6, '#6E3B1E'); // stick
    pxRect(ctx, x - 10, y - 9, 20, 18, '#070510');
    pxRect(ctx, x - 8, y - 7, 16, 14, '#FFD166');
    pxRect(ctx, x - 6, y - 5, 12, 10, '#FF9E00');
    pxRect(ctx, x - 4, y - 4, 4, 4, '#FFF8E7'); // shine
  }

  ctx.restore();
}

// Draw Power-Up Item (Witch Hat Rocket, Candy Magnet, Pumpkin Shield)
export function drawPowerup(ctx: CanvasRenderingContext2D, item: PowerupItem, time: number) {
  if (item.collected) return;
  const bob = Math.round(Math.sin(time * 6 + item.bobOffset) * 5);
  const x = Math.round(item.x);
  const y = Math.round(item.y + bob);

  ctx.save();
  // Magical pulsing aura box
  pxRect(ctx, x - 14, y - 14, 28, 28, 'rgba(57, 255, 20, 0.18)');

  if (item.type === 'witch_hat') {
    // Magical Purple Witch Hat Rocket
    pxRect(ctx, x - 13, y + 3, 26, 6, '#070510');
    pxRect(ctx, x - 11, y + 4, 22, 4, '#9B5DE5');
    pxRect(ctx, x - 8, y - 6, 16, 10, '#070510');
    pxRect(ctx, x - 6, y - 5, 12, 8, '#7209B7');
    pxRect(ctx, x - 4, y - 12, 8, 7, '#9B5DE5');
    pxRect(ctx, x - 6, y + 1, 12, 3, '#FFD166');
  } else if (item.type === 'magnet') {
    // U-Shaped Candy Magnet
    pxRect(ctx, x - 10, y - 10, 20, 20, '#070510');
    pxRect(ctx, x - 8, y - 8, 5, 16, '#FF2A54');
    pxRect(ctx, x + 3, y - 8, 5, 16, '#FF2A54');
    pxRect(ctx, x - 8, y + 3, 16, 5, '#FF2A54');
    // Silver tips
    pxRect(ctx, x - 8, y - 8, 5, 5, '#A0E7E5');
    pxRect(ctx, x + 3, y - 8, 5, 5, '#A0E7E5');
  } else {
    // Glowing Jack-O'-Lantern Shield Orb
    pxRect(ctx, x - 11, y - 11, 22, 22, '#070510');
    pxRect(ctx, x - 9, y - 9, 18, 18, '#FF9E00');
    pxRect(ctx, x - 6, y - 6, 12, 12, '#FFD166');
    pxRect(ctx, x - 3, y - 3, 6, 6, '#FFF8E7');
  }

  ctx.restore();
}

// Draw Monster (Bat or Ghost)
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  ctx.save();
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);
  const w = Math.round(enemy.width);
  const h = Math.round(enemy.height);

  ctx.globalAlpha = enemy.alpha;

  if (enemy.type === 'bat') {
    const cx = x + Math.round(w / 2);
    const cy = y + Math.round(h / 2);
    const wingUp = Math.sin(time * 18 + enemy.phase) > 0;

    // Wings
    if (wingUp) {
      pxRect(ctx, cx - 22, cy - 12, 14, 10, '#070510');
      pxRect(ctx, cx - 20, cy - 10, 12, 7, '#5A189A');
      pxRect(ctx, cx + 8, cy - 12, 14, 10, '#070510');
      pxRect(ctx, cx + 8, cy - 10, 12, 7, '#5A189A');
    } else {
      pxRect(ctx, cx - 22, cy - 2, 14, 10, '#070510');
      pxRect(ctx, cx - 20, cy, 12, 7, '#7B2CBF');
      pxRect(ctx, cx + 8, cy - 2, 14, 10, '#070510');
      pxRect(ctx, cx + 8, cy, 12, 7, '#7B2CBF');
    }

    // Bat round body & ears
    pxRect(ctx, cx - 9, cy - 9, 18, 18, '#070510');
    pxRect(ctx, cx - 7, cy - 7, 14, 14, '#3C096C');
    pxRect(ctx, cx - 7, cy - 13, 4, 5, '#070510');
    pxRect(ctx, cx + 3, cy - 13, 4, 5, '#070510');

    // Glowing Crimson Eyes & tiny fangs
    pxRect(ctx, cx - 5, cy - 3, 3, 3, '#FF2A54');
    pxRect(ctx, cx + 2, cy - 3, 3, 3, '#FF2A54');
    pxRect(ctx, cx - 3, cy + 2, 2, 2, '#FFF8E7');
    pxRect(ctx, cx + 1, cy + 2, 2, 2, '#FFF8E7');
  } else {
    // Spectral Haunting Ghost
    const cx = x + Math.round(w / 2);
    const cy = y + Math.round(h / 2);
    const tailWave = Math.round(Math.sin(time * 10 + enemy.phase) * 3);

    // Outer dark contour
    pxRect(ctx, cx - 15, cy - 15, 30, 28, '#070510');
    // Spectral cyan/lavender body
    pxRect(ctx, cx - 13, cy - 13, 26, 22, '#A0E7E5');
    pxRect(ctx, cx - 10, cy - 11, 20, 18, '#E0FBFC');

    // Waving ectoplasm skirt tails
    pxRect(ctx, cx - 13, cy + 9, 7, 6 + tailWave, '#A0E7E5');
    pxRect(ctx, cx - 3, cy + 9, 7, 6 - tailWave, '#A0E7E5');
    pxRect(ctx, cx + 6, cy + 9, 7, 6 + tailWave, '#A0E7E5');

    // Spooky hollow eyes & mouth
    pxRect(ctx, cx - 8, cy - 5, 5, 6, '#070510');
    pxRect(ctx, cx + 3, cy - 5, 5, 6, '#070510');
    pxRect(ctx, cx - 7, cy - 4, 2, 2, '#FF2A54');
    pxRect(ctx, cx + 4, cy - 4, 2, 2, '#FF2A54');
    pxRect(ctx, cx - 3, cy + 3, 6, 5, '#070510');
  }

  ctx.restore();
}

// Draw Particles & Floating Score Popups
export function drawParticlesAndPopups(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  popups: FloatingText[]
) {
  particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    pxRect(ctx, pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size, pt.color);
    ctx.restore();
  });

  popups.forEach((pop) => {
    ctx.save();
    const progress = 1 - pop.life / pop.maxLife;
    ctx.globalAlpha = progress > 0.7 ? Math.max(0, (1 - progress) / 0.3) : 1;
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    const rx = Math.round(pop.x);
    const ry = Math.round(pop.y);

    // Crisp pixel outline
    ctx.fillStyle = '#070510';
    ctx.fillText(pop.text, rx + 2, ry + 2);
    ctx.fillText(pop.text, rx - 1, ry - 1);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, rx, ry);

    if (pop.subtext) {
      ctx.font = 'bold 10px "Silkscreen", monospace';
      ctx.fillStyle = '#070510';
      ctx.fillText(pop.subtext, rx + 2, ry + 16);
      ctx.fillStyle = '#FFF8E7';
      ctx.fillText(pop.subtext, rx, ry + 14);
    }
    ctx.restore();
  });
}
