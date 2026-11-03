import React, { useEffect, useRef } from 'react';
import {
  CandyItem,
  CandyType,
  CostumeId,
  Enemy,
  FloatingText,
  GameMode,
  GameState,
  HudStats,
  Particle,
  Platform,
  PlatformType,
  PowerupItem,
  PowerupType,
} from '../game/types';
import {
  drawCandy,
  drawEnemy,
  drawParallaxBackground,
  drawParticlesAndPopups,
  drawPlatform,
  drawPlayerSprite,
  drawPowerup,
} from '../game/pixelRenderer';
import { soundEngine } from '../audio/soundEngine';

export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 720;

interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  down: boolean;
  pointerX: number | null;
}

interface ArcadeCanvasProps {
  gameState: GameState;
  gameMode: GameMode;
  costume: CostumeId;
  inputRef: React.MutableRefObject<InputState>;
  onStatsUpdate: (stats: HudStats) => void;
  onGameOver: (finalStats: HudStats) => void;
  restartTrigger: number;
}

export const ArcadeCanvas: React.FC<ArcadeCanvasProps> = ({
  gameState,
  gameMode,
  costume,
  inputRef,
  onStatsUpdate,
  onGameOver,
  restartTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(gameState);
  const modeRef = useRef<GameMode>(gameMode);
  const costumeRef = useRef<CostumeId>(costume);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    modeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    costumeRef.current = costume;
  }, [costume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let rafId = 0;
    let lastTime = performance.now();
    let elapsedTotal = 0;

    // Entity ID counters
    let nextId = 1;

    // Player state
    const player = {
      x: LOGICAL_WIDTH / 2 - 16,
      y: LOGICAL_HEIGHT - 160,
      vx: 0,
      vy: 0,
      width: 32,
      height: 40,
      facing: 1 as 1 | -1,
      canDoubleJump: true,
      onGround: false,
      hasShield: false,
      magnetTime: 0,
      rocketTime: 0,
      combo: 1,
      maxCombo: 1,
      comboTimer: 0,
      score: 0,
      candies: 0,
      altitude: 0,
      scrollOffset: 0,
    };

    let platforms: Platform[] = [];
    let candies: CandyItem[] = [];
    let powerups: PowerupItem[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let popups: FloatingText[] = [];
    let screenShake = 0;
    let lastHudSync = 0;

    const getHighScoreKey = (m: GameMode) =>
      m === 'vertical' ? 'halloween_arcade_hi_vertical' : 'halloween_arcade_hi_runner';

    const readHighScore = (m: GameMode): number => {
      try {
        return parseInt(localStorage.getItem(getHighScoreKey(m)) || '0', 10) || 0;
      } catch {
        return 0;
      }
    };

    const writeHighScore = (m: GameMode, val: number) => {
      try {
        localStorage.setItem(getHighScoreKey(m), String(val));
      } catch {
        // ignore
      }
    };

    const spawnParticles = (
      x: number,
      y: number,
      count: number,
      colors: string[],
      speed = 140
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 30,
          size: 3 + Math.floor(Math.random() * 4),
          color: colors[i % colors.length],
          alpha: 1,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.35,
        });
      }
    };

    const spawnPopup = (
      x: number,
      y: number,
      text: string,
      color = '#FFD166',
      subtext?: string
    ) => {
      popups.push({
        id: nextId++,
        x: Math.max(54, Math.min(LOGICAL_WIDTH - 54, x)),
        y,
        text,
        subtext,
        color,
        life: 0,
        maxLife: 0.85,
        scale: 1,
      });
    };

    const pickCandyType = (): { type: CandyType; points: number } => {
      const r = Math.random();
      if (r < 0.48) return { type: 'wrapper', points: 10 };
      if (r < 0.78) return { type: 'lollipop', points: 25 };
      if (r < 0.94) return { type: 'candycorn', points: 50 };
      return { type: 'goldenapple', points: 100 };
    };

    // Generate next vertical platform above `highestY`
    const spawnVerticalPlatformAt = (yPos: number, forceSafe = false) => {
      const difficulty = Math.min(1, player.altitude / 2500);
      const w = forceSafe ? 104 : Math.round(92 - difficulty * 18 + Math.random() * 16);
      const x = Math.round(16 + Math.random() * (LOGICAL_WIDTH - w - 32));

      let type: PlatformType = 'rooftop';
      const r = Math.random();
      if (!forceSafe) {
        if (r < 0.36) type = 'rooftop';
        else if (r < 0.72) type = 'vine';
        else if (r < 0.84) type = 'spring';
        else if (r < 0.93) type = 'moving';
        else type = 'fragile';
      } else {
        type = Math.random() < 0.5 ? 'rooftop' : 'vine';
      }

      const plat: Platform = {
        id: nextId++,
        x,
        y: yPos,
        width: w,
        height: 16,
        type,
        vx: type === 'moving' ? (Math.random() < 0.5 ? 75 : -75) * (1 + difficulty * 0.4) : 0,
        minX: 14,
        maxX: LOGICAL_WIDTH - w - 14,
        hasChimney: type === 'rooftop' && Math.random() < 0.35,
      };
      platforms.push(plat);

      // If fragile, also spawn a guaranteed solid companion platform nearby so there's never an impossible gap
      if (type === 'fragile') {
        const altX =
          x < LOGICAL_WIDTH / 2
            ? Math.round(LOGICAL_WIDTH / 2 + 20 + Math.random() * (LOGICAL_WIDTH / 2 - 115))
            : Math.round(20 + Math.random() * (LOGICAL_WIDTH / 2 - 115));
        platforms.push({
          id: nextId++,
          x: altX,
          y: yPos - 12,
          width: 86,
          height: 16,
          type: 'vine',
        });
      }

      // Spawn candies above platform (68% chance)
      if (Math.random() < 0.68) {
        const pattern = Math.random();
        if (pattern < 0.6) {
          // Single candy or pair above platform
          const cInfo = pickCandyType();
          candies.push({
            id: nextId++,
            x: x + w / 2,
            y: yPos - 28,
            type: cInfo.type,
            points: cInfo.points,
            collected: false,
            bobOffset: Math.random() * 6,
          });
        } else {
          // Appetizing arc of 3 candies
          for (let i = -1; i <= 1; i++) {
            const cInfo = pickCandyType();
            candies.push({
              id: nextId++,
              x: Math.max(24, Math.min(LOGICAL_WIDTH - 24, x + w / 2 + i * 28)),
              y: yPos - 30 - (1 - Math.abs(i)) * 18,
              type: cInfo.type,
              points: cInfo.points,
              collected: false,
              bobOffset: i + Math.random() * 3,
            });
          }
        }
      }

      // Spawn power-up occasionally (8% chance)
      if (!forceSafe && Math.random() < 0.085) {
        const pRoll = Math.random();
        const pType: PowerupType =
          pRoll < 0.34 ? 'witch_hat' : pRoll < 0.68 ? 'magnet' : 'shield';
        powerups.push({
          id: nextId++,
          x: x + w / 2,
          y: yPos - 32,
          type: pType,
          collected: false,
          bobOffset: Math.random() * 5,
        });
      }

      // Spawn enemy (Bat or Ghost) at sufficient altitude
      if (!forceSafe && player.altitude > 60) {
        const enemyChance = Math.min(0.28, 0.1 + difficulty * 0.18);
        if (Math.random() < enemyChance) {
          const isGhost = Math.random() < 0.42;
          enemies.push({
            id: nextId++,
            x: Math.random() * (LOGICAL_WIDTH - 60) + 15,
            y: yPos - 55,
            baseY: yPos - 55,
            width: 38,
            height: 30,
            type: isGhost ? 'ghost' : 'bat',
            vx: (Math.random() < 0.5 ? 1 : -1) * (isGhost ? 55 : 95 + difficulty * 45),
            phase: Math.random() * Math.PI * 2,
            amplitude: isGhost ? 18 : 12,
            alpha: 1,
          });
        }
      }
    };

    // Spawn next horizontal platform for Runner Mode
    const spawnRunnerSegmentAfter = (rightmostX: number, forceSafe = false) => {
      const difficulty = Math.min(1, player.altitude / 1800);
      const gap = forceSafe ? 0 : Math.round(58 + Math.random() * (56 + difficulty * 35));
      const w = forceSafe ? 280 : Math.round(145 + Math.random() * 140);
      const prevPlat = platforms[platforms.length - 1];
      const baseY = prevPlat ? prevPlat.y : LOGICAL_HEIGHT - 140;
      const deltaY = forceSafe ? 0 : Math.round((Math.random() - 0.48) * 90);
      const y = Math.max(LOGICAL_HEIGHT - 340, Math.min(LOGICAL_HEIGHT - 110, baseY + deltaY));
      const x = rightmostX + gap;

      const isRooftop = Math.random() < 0.55;
      const hasSpring = !forceSafe && Math.random() < 0.22;

      platforms.push({
        id: nextId++,
        x,
        y,
        width: w,
        height: isRooftop ? LOGICAL_HEIGHT - y : 20,
        type: hasSpring ? 'spring' : isRooftop ? 'rooftop' : 'vine',
        hasChimney: isRooftop && Math.random() < 0.5,
      });

      // Spawn candies in an arc across the rooftop/branch or across the gap
      const candyCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < candyCount; i++) {
        const cInfo = pickCandyType();
        const cx = x + 28 + (i * (w - 40)) / Math.max(1, candyCount - 1);
        const arc = Math.sin((i / Math.max(1, candyCount - 1)) * Math.PI) * 38;
        candies.push({
          id: nextId++,
          x: cx,
          y: y - 34 - arc,
          type: cInfo.type,
          points: cInfo.points,
          collected: false,
          bobOffset: i * 0.7,
        });
      }

      // Powerup
      if (!forceSafe && Math.random() < 0.14) {
        const pRoll = Math.random();
        const pType: PowerupType =
          pRoll < 0.34 ? 'witch_hat' : pRoll < 0.68 ? 'magnet' : 'shield';
        powerups.push({
          id: nextId++,
          x: x + w * 0.5,
          y: y - 85,
          type: pType,
          collected: false,
          bobOffset: Math.random() * 4,
        });
      }

      // Enemy (Bat or Ghost)
      if (!forceSafe && Math.random() < 0.48) {
        const isGhost = Math.random() < 0.45;
        enemies.push({
          id: nextId++,
          x: x + w * 0.65,
          y: y - 55 - Math.random() * 55,
          baseY: y - 55 - Math.random() * 55,
          width: 38,
          height: 30,
          type: isGhost ? 'ghost' : 'bat',
          vx: isGhost ? -35 : -75,
          phase: Math.random() * Math.PI * 2,
          amplitude: 16,
          alpha: 1,
        });
      }
    };

    // Initialize / Reset World
    const initWorld = () => {
      platforms = [];
      candies = [];
      powerups = [];
      enemies = [];
      particles = [];
      popups = [];
      screenShake = 0;

      player.score = 0;
      player.candies = 0;
      player.combo = 1;
      player.maxCombo = 1;
      player.comboTimer = 0;
      player.altitude = 0;
      player.scrollOffset = 0;
      player.hasShield = false;
      player.magnetTime = 0;
      player.rocketTime = 0;
      player.canDoubleJump = true;

      if (modeRef.current === 'vertical') {
        player.x = LOGICAL_WIDTH / 2 - 16;
        player.y = LOGICAL_HEIGHT - 150;
        player.vx = 0;
        player.vy = -560;

        // Wide starting Victorian Rooftop base
        platforms.push({
          id: nextId++,
          x: LOGICAL_WIDTH / 2 - 75,
          y: LOGICAL_HEIGHT - 90,
          width: 150,
          height: 24,
          type: 'rooftop',
          hasChimney: true,
        });

        let curY = LOGICAL_HEIGHT - 175;
        while (curY > -80) {
          spawnVerticalPlatformAt(curY, curY > LOGICAL_HEIGHT - 360);
          curY -= 74 + Math.random() * 26;
        }
      } else {
        // Runner mode initialization
        player.x = 88;
        player.y = LOGICAL_HEIGHT - 210;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;

        platforms.push({
          id: nextId++,
          x: 0,
          y: LOGICAL_HEIGHT - 150,
          width: 360,
          height: 150,
          type: 'rooftop',
          hasChimney: true,
        });

        let rightX = 360;
        while (rightX < LOGICAL_WIDTH + 600) {
          spawnRunnerSegmentAfter(rightX, rightX < 650);
          const last = platforms[platforms.length - 1];
          rightX = last.x + last.width;
        }
      }

      onStatsUpdate({
        score: 0,
        highScore: readHighScore(modeRef.current),
        candies: 0,
        combo: 1,
        maxCombo: 1,
        altitude: 0,
        hasShield: false,
        magnetTime: 0,
        rocketTime: 0,
      });
    };

    initWorld();

    const triggerDeath = (cause: 'fall' | 'bat' | 'ghost') => {
      if (stateRef.current !== 'PLAYING') {
        // In TITLE attract mode, just reset seamlessly
        initWorld();
        return;
      }
      soundEngine.playGameOver();
      screenShake = 12;

      const prevHi = readHighScore(modeRef.current);
      const finalScore = Math.floor(player.score);
      const isNewRecord = finalScore > prevHi;
      const newHi = Math.max(prevHi, finalScore);
      if (isNewRecord) {
        writeHighScore(modeRef.current, newHi);
      }

      const finalStats: HudStats = {
        score: finalScore,
        highScore: newHi,
        candies: player.candies,
        combo: player.combo,
        maxCombo: player.maxCombo,
        altitude: Math.floor(player.altitude),
        hasShield: false,
        magnetTime: 0,
        rocketTime: 0,
        causeOfDeath: cause,
        isNewRecord,
      };
      onStatsUpdate(finalStats);
      onGameOver(finalStats);
    };

    // Main 60FPS Game Loop
    const updateAndRender = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      if (stateRef.current === 'PAUSED') {
        rafId = requestAnimationFrame(updateAndRender);
        return;
      }

      elapsedTotal += dt;
      const isAttractDemo = stateRef.current === 'TITLE';
      const isActive = stateRef.current === 'PLAYING' || isAttractDemo;

      if (isActive) {
        // Update timers
        if (player.magnetTime > 0) player.magnetTime = Math.max(0, player.magnetTime - dt);
        if (player.rocketTime > 0) player.rocketTime = Math.max(0, player.rocketTime - dt);
        if (player.comboTimer > 0) {
          player.comboTimer -= dt;
          if (player.comboTimer <= 0) {
            player.combo = 1;
          }
        }
        if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 30);

        const gravity = costumeRef.current === 'sheet_ghost' ? 1180 : 1320;
        const baseJumpVy = -620;

        if (modeRef.current === 'vertical') {
          // ==========================================
          // MODE A: VERTICAL PLATFORMER (DOODLE JUMP)
          // ==========================================
          const moveSpeed = costumeRef.current === 'black_cat' ? 350 : 315;

          if (isAttractDemo) {
            // Smart AI pilot for Title Screen Attract Mode
            let targetX = LOGICAL_WIDTH / 2;
            const reachable = platforms.filter(
              (p) => !p.broken && p.y > player.y - 180 && p.y < player.y + 180
            );
            if (reachable.length > 0) {
              reachable.sort(
                (a, b) =>
                  Math.abs(a.x + a.width / 2 - player.x) -
                  Math.abs(b.x + b.width / 2 - player.x)
              );
              targetX = reachable[0].x + reachable[0].width / 2 - player.width / 2;
            }
            const diff = targetX - player.x;
            player.vx = Math.max(-240, Math.min(240, diff * 4.5));
            if (Math.abs(player.vx) > 10) player.facing = player.vx > 0 ? 1 : -1;
          } else {
            const inp = inputRef.current;
            let dir = 0;
            if (inp.left) dir -= 1;
            if (inp.right) dir += 1;

            if (dir !== 0) {
              player.vx = dir * moveSpeed;
              player.facing = dir > 0 ? 1 : -1;
            } else if (inp.pointerX !== null) {
              const target = inp.pointerX - player.width / 2;
              const diff = target - player.x;
              player.vx = Math.max(-moveSpeed, Math.min(moveSpeed, diff * 8));
              if (Math.abs(diff) > 4) player.facing = diff > 0 ? 1 : -1;
            } else {
              player.vx *= 0.82;
            }

            // Optional Cape Double-Jump when pressing Space/Up in mid-air
            if (inp.jumpPressed) {
              inp.jumpPressed = false;
              if (player.canDoubleJump && player.vy > -180 && player.rocketTime <= 0) {
                player.vy = baseJumpVy * 0.88;
                player.canDoubleJump = false;
                soundEngine.playJump('double');
                spawnParticles(
                  player.x + player.width / 2,
                  player.y + player.height,
                  10,
                  ['#FF7518', '#FFD166', '#A0E7E5'],
                  130
                );
                spawnPopup(player.x + 16, player.y, 'DOUBLE SAUT!', '#A0E7E5');
              }
            }
          }

          // Apply Rocket Hat override or Gravity
          if (player.rocketTime > 0) {
            player.vy = -880;
            if (Math.random() < 0.6) {
              spawnParticles(
                player.x + player.width / 2,
                player.y + player.height,
                2,
                ['#FF7518', '#FFD166', '#9B5DE5'],
                90
              );
            }
          } else {
            player.vy += gravity * dt;
            if (inputRef.current.down && player.vy > 0) {
              player.vy += 600 * dt;
            }
          }

          const prevBottom = player.y + player.height;
          player.x += player.vx * dt;
          player.y += player.vy * dt;

          // Horizontal wrap-around (classic Doodle Jump style)
          if (player.x + player.width < 0) {
            player.x = LOGICAL_WIDTH;
          } else if (player.x > LOGICAL_WIDTH) {
            player.x = -player.width;
          }

          // Update moving platforms & spring animations
          platforms.forEach((p) => {
            if (p.type === 'moving' && p.vx) {
              p.x += p.vx * dt;
              if (p.x < (p.minX ?? 12)) {
                p.x = p.minX ?? 12;
                p.vx = Math.abs(p.vx);
              } else if (p.x > (p.maxX ?? LOGICAL_WIDTH - p.width - 12)) {
                p.x = p.maxX ?? LOGICAL_WIDTH - p.width - 12;
                p.vx = -Math.abs(p.vx);
              }
            }
            if (p.springCompress && p.springCompress > 0) {
              p.springCompress = Math.max(0, p.springCompress - dt * 3.5);
            }
            if (p.broken) {
              p.breakAnim = (p.breakAnim ?? 0) + dt * 2.8;
            }
          });

          // Landing on platforms (only when falling downward: vy > 0)
          if (player.vy > 0 && player.rocketTime <= 0) {
            const newBottom = player.y + player.height;
            const footLeft = player.x + 5;
            const footRight = player.x + player.width - 5;

            for (const p of platforms) {
              if (p.broken) continue;
              const overlapsX = footRight >= p.x && footLeft <= p.x + p.width;
              const crossedTop = prevBottom <= p.y + 12 && newBottom >= p.y;

              if (overlapsX && crossedTop) {
                player.y = p.y - player.height;
                player.canDoubleJump = true;

                if (p.type === 'spring') {
                  player.vy = baseJumpVy * 1.55;
                  p.springCompress = 1;
                  soundEngine.playJump('spring');
                  spawnParticles(
                    p.x + p.width / 2,
                    p.y,
                    16,
                    ['#FF7518', '#FFD166', '#39FF14'],
                    190
                  );
                  spawnPopup(player.x + 16, player.y - 10, 'CITROUILLE RESSORT!', '#FF9E00');
                } else if (p.type === 'fragile') {
                  player.vy = baseJumpVy * 0.95;
                  p.broken = true;
                  p.breakAnim = 0.01;
                  soundEngine.playBranchCrack();
                  spawnParticles(
                    p.x + p.width / 2,
                    p.y + 6,
                    14,
                    ['#6E3B1E', '#A65E33', '#FF7518'],
                    150
                  );
                } else {
                  player.vy = baseJumpVy;
                  if (!isAttractDemo) soundEngine.playJump('normal');
                  spawnParticles(
                    player.x + player.width / 2,
                    p.y,
                    6,
                    p.type === 'vine' ? ['#4CC947', '#FF7518'] : ['#A0E7E5', '#FFD166'],
                    90
                  );
                }
                break;
              }
            }
          }

          // Camera upward scroll when player rises above 42% of screen height
          const cameraThreshold = LOGICAL_HEIGHT * 0.42;
          if (player.y < cameraThreshold) {
            const dy = cameraThreshold - player.y;
            player.y = cameraThreshold;
            player.scrollOffset += dy;
            const gainedMeters = dy * 0.08;
            player.altitude += gainedMeters;
            player.score += gainedMeters * 1.5;

            platforms.forEach((p) => (p.y += dy));
            candies.forEach((c) => (c.y += dy));
            powerups.forEach((pw) => (pw.y += dy));
            enemies.forEach((e) => {
              e.y += dy;
              e.baseY += dy;
            });
            particles.forEach((pt) => (pt.y += dy));
            popups.forEach((pop) => (pop.y += dy));
          }

          // Spawn new platforms at top as camera ascends
          let highestY = LOGICAL_HEIGHT;
          for (const p of platforms) {
            if (!p.broken && p.y < highestY) highestY = p.y;
          }
          while (highestY > -90) {
            const step = 72 + Math.random() * 28;
            highestY -= step;
            spawnVerticalPlatformAt(highestY, false);
          }

          // Cull off-screen entities below bottom
          platforms = platforms.filter((p) => p.y < LOGICAL_HEIGHT + 80);
          candies = candies.filter((c) => !c.collected && c.y < LOGICAL_HEIGHT + 60);
          powerups = powerups.filter((pw) => !pw.collected && pw.y < LOGICAL_HEIGHT + 60);
          enemies = enemies.filter((e) => e.y < LOGICAL_HEIGHT + 80);

          // Check bottom fall out
          if (player.y > LOGICAL_HEIGHT + 35) {
            triggerDeath('fall');
          }
        } else {
          // ==========================================
          // MODE B: ROOFTOP AUTO-RUNNER
          // ==========================================
          const runSpeed = 245 + Math.min(140, player.altitude * 0.12);
          player.facing = 1;
          player.x = 88;

          const dx = runSpeed * dt;
          player.scrollOffset += dx;
          player.altitude += dx * 0.06;
          player.score += dx * 0.09;

          const inp = inputRef.current;

          // AI jump in attract mode
          if (isAttractDemo) {
            const upcomingGap = !platforms.some(
              (p) => p.x <= player.x + 70 && p.x + p.width >= player.x + 40
            );
            if (upcomingGap && player.onGround) {
              player.vy = baseJumpVy;
              player.onGround = false;
            }
          } else if (inp.jumpPressed) {
            inp.jumpPressed = false;
            if (player.onGround) {
              player.vy = baseJumpVy;
              player.onGround = false;
              player.canDoubleJump = true;
              soundEngine.playJump('normal');
              spawnParticles(player.x + 16, player.y + player.height, 8, ['#FFD166', '#FF7518'], 110);
            } else if (player.canDoubleJump) {
              player.vy = baseJumpVy * 0.9;
              player.canDoubleJump = false;
              soundEngine.playJump('double');
              spawnParticles(player.x + 16, player.y + player.height, 12, ['#A0E7E5', '#FF477E'], 135);
              spawnPopup(player.x + 16, player.y, 'DOUBLE SAUT!', '#A0E7E5');
            }
          }

          if (player.rocketTime > 0) {
            const targetY = 190;
            player.y += (targetY - player.y) * 6 * dt;
            player.vy = 0;
            spawnParticles(player.x, player.y + 28, 2, ['#FF7518', '#FFD166', '#9B5DE5'], 110);
          } else {
            player.vy += gravity * dt;
            if (inp.down && !player.onGround) {
              player.vy += 900 * dt;
            }
            const prevBottom = player.y + player.height;
            player.y += player.vy * dt;
            player.onGround = false;

            if (player.vy >= 0) {
              const newBottom = player.y + player.height;
              for (const p of platforms) {
                const overlapsX =
                  player.x + player.width - 6 >= p.x && player.x + 6 <= p.x + p.width;
                if (overlapsX && prevBottom <= p.y + 16 && newBottom >= p.y) {
                  player.y = p.y - player.height;
                  player.canDoubleJump = true;

                  if (p.type === 'spring') {
                    player.vy = baseJumpVy * 1.35;
                    player.onGround = false;
                    p.springCompress = 1;
                    soundEngine.playJump('spring');
                    spawnPopup(player.x + 16, player.y - 10, 'SUPER REBOND!', '#FF9E00');
                  } else {
                    player.vy = 0;
                    player.onGround = true;
                  }
                  break;
                }
              }
            }
          }

          // Scroll world left
          platforms.forEach((p) => {
            p.x -= dx;
            if (p.springCompress && p.springCompress > 0) {
              p.springCompress = Math.max(0, p.springCompress - dt * 3.5);
            }
          });
          candies.forEach((c) => (c.x -= dx));
          powerups.forEach((pw) => (pw.x -= dx));
          enemies.forEach((e) => (e.x -= dx));

          // Spawn new runner rooftops on the right
          let rightmostX = 0;
          for (const p of platforms) {
            if (p.x + p.width > rightmostX) rightmostX = p.x + p.width;
          }
          while (rightmostX < LOGICAL_WIDTH + 420) {
            spawnRunnerSegmentAfter(rightmostX, false);
            const last = platforms[platforms.length - 1];
            rightmostX = last.x + last.width;
          }

          platforms = platforms.filter((p) => p.x + p.width > -120);
          candies = candies.filter((c) => !c.collected && c.x > -60);
          powerups = powerups.filter((pw) => !pw.collected && pw.x > -60);
          enemies = enemies.filter((e) => e.x > -80);

          if (player.y > LOGICAL_HEIGHT + 40) {
            triggerDeath('fall');
          }
        }

        // ==========================================
        // SHARED COLLECTIBLES & MONSTER LOGIC
        // ==========================================
        const pCenterX = player.x + player.width / 2;
        const pCenterY = player.y + player.height / 2;

        // 1. Candy Collection & Magnet Pull
        for (const c of candies) {
          if (c.collected) continue;
          const dist = Math.hypot(c.x - pCenterX, c.y - pCenterY);

          if (player.magnetTime > 0 && dist < 190) {
            c.x += (pCenterX - c.x) * 9.5 * dt;
            c.y += (pCenterY - c.y) * 9.5 * dt;
          }

          if (dist < 30) {
            c.collected = true;
            player.candies += 1;
            player.comboTimer = 3.6;

            if (c.type === 'goldenapple') {
              player.combo = Math.min(8, player.combo + 2);
            } else if (player.candies % 3 === 0) {
              player.combo = Math.min(8, player.combo + 1);
            }
            if (player.combo > player.maxCombo) player.maxCombo = player.combo;

            const pts = c.points * player.combo;
            player.score += pts;

            if (!isAttractDemo) {
              const tier =
                c.type === 'wrapper'
                  ? 1
                  : c.type === 'lollipop'
                  ? 2
                  : c.type === 'candycorn'
                  ? 3
                  : 4;
              soundEngine.playCandy(tier, player.combo);
            }

            spawnParticles(
              c.x,
              c.y,
              10,
              ['#FFD166', '#FF477E', '#39FF14', '#FFF8E7'],
              145
            );
            spawnPopup(
              c.x,
              c.y - 8,
              `+${pts}`,
              c.type === 'goldenapple' ? '#39FF14' : '#FFD166',
              player.combo > 1 ? `COMBO x${player.combo}` : undefined
            );
          }
        }

        // 2. Power-Ups Collection
        for (const pw of powerups) {
          if (pw.collected) continue;
          const dist = Math.hypot(pw.x - pCenterX, pw.y - pCenterY);
          if (dist < 32) {
            pw.collected = true;
            if (pw.type === 'witch_hat') {
              player.rocketTime = 3.0;
              if (!isAttractDemo) soundEngine.playJump('rocket');
              spawnPopup(pw.x, pw.y - 10, 'CHAPEAU FUSÉE!', '#9B5DE5', 'VOL INVINCIBLE');
            } else if (pw.type === 'magnet') {
              player.magnetTime = 8.0;
              if (!isAttractDemo) soundEngine.playPowerup();
              spawnPopup(pw.x, pw.y - 10, 'AIMANT MAGIQUE!', '#FF477E', 'ATTIRE LES BONBONS');
            } else {
              player.hasShield = true;
              if (!isAttractDemo) soundEngine.playPowerup();
              spawnPopup(pw.x, pw.y - 10, 'BOUCLIER CITROUILLE!', '#FF9E00', 'PROTECTION ACTIVE');
            }
            spawnParticles(pw.x, pw.y, 16, ['#39FF14', '#FFD166', '#9B5DE5'], 170);
          }
        }

        // 3. Enemies (Bats & Ghosts) Movement & Collision
        for (const e of enemies) {
          if (e.defeated) {
            e.y += (e.defeatVy ?? 280) * dt;
            e.defeatVy = (e.defeatVy ?? 280) + 700 * dt;
            e.alpha = Math.max(0, e.alpha - dt * 2.2);
            continue;
          }

          e.x += e.vx * dt;
          if (modeRef.current === 'vertical') {
            if (e.x < 12) {
              e.x = 12;
              e.vx = Math.abs(e.vx);
            } else if (e.x + e.width > LOGICAL_WIDTH - 12) {
              e.x = LOGICAL_WIDTH - 12 - e.width;
              e.vx = -Math.abs(e.vx);
            }
          }

          e.y = e.baseY + Math.sin(elapsedTotal * 4.2 + e.phase) * e.amplitude;
          if (e.type === 'ghost') {
            e.alpha = 0.65 + Math.sin(elapsedTotal * 5 + e.phase) * 0.3;
          }

          // Hitbox check (forgiving 80% inner hitbox for fair arcade feel)
          const ex = e.x + 5;
          const ey = e.y + 5;
          const ew = e.width - 10;
          const eh = e.height - 10;

          const px = player.x + 5;
          const py = player.y + 5;
          const pw = player.width - 10;
          const ph = player.height - 8;

          const overlaps =
            px < ex + ew && px + pw > ex && py < ey + eh && py + ph > ey;

          if (overlaps) {
            const isStompFromAbove =
              player.vy > 40 && player.y + player.height - player.vy * dt <= e.y + 18;

            if (player.rocketTime > 0 || isStompFromAbove) {
              // Banish the monster & bounce high!
              e.defeated = true;
              e.defeatVy = -180;
              if (isStompFromAbove) {
                player.vy = baseJumpVy * 1.15;
                player.canDoubleJump = true;
              }
              player.score += 75 * player.combo;
              if (!isAttractDemo) soundEngine.playStomp();
              spawnParticles(
                e.x + e.width / 2,
                e.y + e.height / 2,
                16,
                ['#9B5DE5', '#39FF14', '#FFD166'],
                180
              );
              spawnPopup(
                e.x + e.width / 2,
                e.y,
                `+${75 * player.combo} BANNI!`,
                '#39FF14'
              );
            } else if (player.hasShield) {
              // Pumpkin Shield absorbs the hit!
              player.hasShield = false;
              e.defeated = true;
              e.defeatVy = -200;
              player.vy = baseJumpVy;
              screenShake = 8;
              if (!isAttractDemo) soundEngine.playShieldBlock();
              spawnParticles(
                pCenterX,
                pCenterY,
                20,
                ['#FF9E00', '#FFD166', '#FFF8E7'],
                200
              );
              spawnPopup(pCenterX, player.y - 10, 'BOUCLIER BRISÉ!', '#FF9E00', 'SAUVÉ !');
            } else {
              triggerDeath(e.type);
              break;
            }
          }
        }

        // 4. Update Particles & Floating Score Popups
        particles.forEach((pt) => {
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 260 * dt;
          pt.life += dt;
          pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        });
        particles = particles.filter((pt) => pt.life < pt.maxLife);

        popups.forEach((pop) => {
          pop.y -= 36 * dt;
          pop.life += dt;
        });
        popups = popups.filter((pop) => pop.life < pop.maxLife);

        // Throttled HUD update (every ~60ms)
        if (now - lastHudSync > 60 && stateRef.current === 'PLAYING') {
          lastHudSync = now;
          const currentScore = Math.floor(player.score);
          const hi = Math.max(readHighScore(modeRef.current), currentScore);
          onStatsUpdate({
            score: currentScore,
            highScore: hi,
            candies: player.candies,
            combo: player.combo,
            maxCombo: player.maxCombo,
            altitude: Math.floor(player.altitude),
            hasShield: player.hasShield,
            magnetTime: player.magnetTime,
            rocketTime: player.rocketTime,
          });
        }
      }

      // ==========================================
      // RENDER PASS
      // ==========================================
      ctx.save();
      if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(Math.round(sx), Math.round(sy));
      }

      drawParallaxBackground(
        ctx,
        LOGICAL_WIDTH,
        LOGICAL_HEIGHT,
        player.scrollOffset,
        elapsedTotal,
        modeRef.current
      );

      // Draw Platforms
      platforms.forEach((p) => drawPlatform(ctx, p, elapsedTotal));

      // Draw Candies & Powerups
      candies.forEach((c) => drawCandy(ctx, c, elapsedTotal));
      powerups.forEach((pw) => drawPowerup(ctx, pw, elapsedTotal));

      // Draw Enemies
      enemies.forEach((e) => drawEnemy(ctx, e, elapsedTotal));

      // Draw Player Sprite (plus wrap-around ghost clone if near screen edge in vertical mode)
      drawPlayerSprite(
        ctx,
        player.x,
        player.y,
        player.width,
        player.height,
        player.vy,
        player.facing,
        costumeRef.current,
        elapsedTotal,
        {
          hasShield: player.hasShield,
          rocketTime: player.rocketTime,
          magnetTime: player.magnetTime,
          isRunner: modeRef.current === 'runner',
          onGround: player.onGround,
        }
      );

      if (modeRef.current === 'vertical') {
        if (player.x < 16) {
          drawPlayerSprite(
            ctx,
            player.x + LOGICAL_WIDTH,
            player.y,
            player.width,
            player.height,
            player.vy,
            player.facing,
            costumeRef.current,
            elapsedTotal
          );
        } else if (player.x + player.width > LOGICAL_WIDTH - 16) {
          drawPlayerSprite(
            ctx,
            player.x - LOGICAL_WIDTH,
            player.y,
            player.width,
            player.height,
            player.vy,
            player.facing,
            costumeRef.current,
            elapsedTotal
          );
        }
      }

      // Draw Particles & Popups
      drawParticlesAndPopups(ctx, particles, popups);

      ctx.restore();

      rafId = requestAnimationFrame(updateAndRender);
    };

    rafId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(rafId);
  }, [restartTrigger, gameMode]);

  // Pointer / Touch direct tracking on the canvas for smooth movement or tap-to-jump
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || gameMode !== 'vertical') return;
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    inputRef.current.pointerX = relX;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    if (gameMode === 'vertical') {
      inputRef.current.pointerX = relX;
    } else {
      inputRef.current.jumpPressed = true;
    }
  };

  const handlePointerUp = () => {
    inputRef.current.pointerX = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={LOGICAL_WIDTH}
      height={LOGICAL_HEIGHT}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full h-full block touch-none select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
