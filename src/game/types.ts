export type GameMode = 'vertical' | 'runner';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type CostumeId = 'pumpkin_witch' | 'sheet_ghost' | 'black_cat' | 'mini_vampire';

export interface CostumeInfo {
  id: CostumeId;
  name: string;
  subtitle: string;
  capeColor: string;
  accentColor: string;
  perkLabel: string;
}

export const COSTUMES: CostumeInfo[] = [
  {
    id: 'pumpkin_witch',
    name: 'Léo Citrouille',
    subtitle: 'Capuche Jack-O’-Lantern & Cape Écarlate',
    capeColor: '#FF477E',
    accentColor: '#FF7518',
    perkLabel: 'Équilibré & Classique',
  },
  {
    id: 'sheet_ghost',
    name: 'Camille Fantôme',
    subtitle: 'Drap Cousu Main & Lanterne Dorée',
    capeColor: '#A0E7E5',
    accentColor: '#FFD166',
    perkLabel: 'Flottaison Légère',
  },
  {
    id: 'black_cat',
    name: 'Milo Chat Noir',
    subtitle: 'Oreilles Félines & Écharpe Ambrée',
    capeColor: '#9B5DE5',
    accentColor: '#39FF14',
    perkLabel: 'Agilité Nocturne',
  },
  {
    id: 'mini_vampire',
    name: 'Nora Vampirette',
    subtitle: 'Cape Gothique & Médaillon Rubis',
    capeColor: '#FF2A54',
    accentColor: '#FF9E00',
    perkLabel: 'Chasseuse de Bonbons',
  },
];

export type PlatformType = 'rooftop' | 'vine' | 'spring' | 'fragile' | 'moving';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  vx?: number;
  minX?: number;
  maxX?: number;
  broken?: boolean;
  breakAnim?: number;
  springCompress?: number;
  hasChimney?: boolean;
  hasWindow?: boolean;
}

export type CandyType = 'wrapper' | 'lollipop' | 'candycorn' | 'goldenapple';
export type PowerupType = 'witch_hat' | 'magnet' | 'shield';

export interface CandyItem {
  id: number;
  x: number;
  y: number;
  type: CandyType;
  points: number;
  collected: boolean;
  bobOffset: number;
  magnetized?: boolean;
}

export interface PowerupItem {
  id: number;
  x: number;
  y: number;
  type: PowerupType;
  collected: boolean;
  bobOffset: number;
}

export type EnemyType = 'bat' | 'ghost';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  type: EnemyType;
  vx: number;
  phase: number;
  amplitude: number;
  alpha: number;
  defeated?: boolean;
  defeatVy?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  pixelShape?: 'square' | 'star' | 'leaf';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface HudStats {
  score: number;
  highScore: number;
  candies: number;
  combo: number;
  maxCombo: number;
  altitude: number;
  hasShield: boolean;
  magnetTime: number;
  rocketTime: number;
  causeOfDeath?: 'fall' | 'bat' | 'ghost';
  isNewRecord?: boolean;
}
