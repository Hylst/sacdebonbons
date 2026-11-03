// Synthétiseur Chiptune 16-Bit (Web Audio API pure, sans fichiers externes)

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private stepIndex: number = 0;

  constructor() {
    // Load persisted mute state if any
    try {
      const saved = localStorage.getItem('halloween_arcade_muted');
      if (saved === 'true') {
        this.isMuted = true;
      }
    } catch {
      // ignore storage errors
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('halloween_arcade_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.ensureContext();
      this.startMusic();
    }
    return this.isMuted;
  }

  public playBlip(freq = 540) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.setValueAtTime(freq * 1.25, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  public playJump(variant: 'normal' | 'spring' | 'rocket' | 'double' = 'normal') {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (variant === 'normal') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (variant === 'double') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.13);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (variant === 'spring') {
      // Bouncy Jack-O'-Lantern spring sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.28);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.30);
    } else if (variant === 'rocket') {
      // Witch Hat Rocket Boost fanfare + swoosh
      const notes = [330, 440, 554, 659, 880, 1108];
      notes.forEach((n, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(n, now + idx * 0.045);
        g.gain.setValueAtTime(0.08, now + idx * 0.045);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.12);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.045);
        o.stop(now + idx * 0.045 + 0.12);
      });
    }
  }

  public playCandy(tier: 1 | 2 | 3 | 4 = 1, combo = 1) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Pitch scales up with combo multiplier
    const comboSemitones = Math.min(combo - 1, 10);
    const pitchMult = Math.pow(2, comboSemitones / 12);

    const baseChords: Record<number, number[]> = {
      1: [587.33, 880], // D5 -> A5
      2: [587.33, 740, 1174.66], // D5 -> F#5 -> D6
      3: [659.25, 880, 1046.5, 1318.5], // E5 -> A5 -> C6 -> E6
      4: [587.33, 740, 880, 1174.66, 1480], // Golden Candy fanfare
    };

    const notes = baseChords[tier] || baseChords[1];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq * pitchMult, now + i * 0.045);

      gain.gain.setValueAtTime(0.09, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.13);
    });
  }

  public playPowerup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.09, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.15);
    });
  }

  public playStomp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playBranchCrack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crunchy low saw drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playShieldBlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 392, 659.25];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      gain.gain.setValueAtTime(0.12, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.12);
    });
  }

  public playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Spooky descending Halloween arcade jingle
    const notes = [440, 415.3, 392, 369.99, 349.23, 293.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const start = now + i * 0.11;
      const dur = i === notes.length - 1 ? 0.45 : 0.1;
      osc.frequency.setValueAtTime(freq, start);
      if (i === notes.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, start + dur);
      }
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    });
  }

  public startMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    // Spooky-cute 16-bit Halloween melody in D harmonic minor (150 BPM -> 200ms per 8th note)
    const melody: (number | null)[] = [
      293.66, 349.23, 440.0, 349.23, 466.16, 440.0, 415.3, 440.0,
      293.66, 349.23, 440.0, 587.33, 554.37, 466.16, 440.0, null,
      392.0, 466.16, 587.33, 466.16, 523.25, 440.0, 349.23, null,
      329.63, 415.3, 440.0, 554.37, 587.33, null, 293.66, null,
    ];

    const bass: (number | null)[] = [
      146.83, null, 220.0, null, 146.83, null, 220.0, null,
      146.83, null, 220.0, null, 164.81, null, 220.0, null,
      196.0, null, 146.83, null, 174.61, null, 146.83, null,
      164.81, null, 138.59, null, 146.83, 220.0, 146.83, null,
    ];

    const playStep = () => {
      if (!this.isMusicPlaying || this.isMuted) return;
      const c = this.ensureContext();
      if (!c) return;

      const now = c.currentTime;
      const idx = this.stepIndex % melody.length;
      const mNote = melody[idx];
      const bNote = bass[idx];

      if (mNote) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mNote, now);
        gain.gain.setValueAtTime(0.026, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.17);
      }

      if (bNote) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bNote, now);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }

      this.stepIndex++;
    };

    playStep();
    this.musicTimer = window.setInterval(playStep, 190);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new RetroSoundEngine();
