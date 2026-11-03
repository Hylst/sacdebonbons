import { InfoModal } from './components/InfoModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Tv, Pause, Play, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { ArcadeCanvas } from './components/ArcadeCanvas';
import { CostumePreviewCanvas } from './components/CostumePreviewCanvas';
import {
  COSTUMES,
  CostumeId,
  GameMode,
  GameState,
  HudStats,
} from './game/types';
import { soundEngine } from './audio/soundEngine';

export function App() {
  const [showInfo, setShowInfo] = useState(false);
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('vertical');
  const [costume, setCostume] = useState<CostumeId>('pumpkin_witch');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [restartTrigger, setRestartTrigger] = useState<number>(0);

  // Active visual states for bottom arcade deck buttons
  const [activeKeys, setActiveKeys] = useState<{
    left: boolean;
    right: boolean;
    jump: boolean;
  }>({ left: false, right: false, jump: false });

  const [hud, setHud] = useState<HudStats>({
    score: 0,
    highScore: 0,
    candies: 0,
    combo: 1,
    maxCombo: 1,
    altitude: 0,
    hasShield: false,
    magnetTime: 0,
    rocketTime: 0,
  });

  const inputRef = useRef({
    left: false,
    right: false,
    jumpPressed: false,
    down: false,
    pointerX: null as number | null,
  });

  const startNewGame = useCallback(
    (selectedMode?: GameMode) => {
      if (selectedMode) {
        setGameMode(selectedMode);
      }
      soundEngine.playBlip(660);
      soundEngine.startMusic();
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpPressed = false;
      inputRef.current.pointerX = null;
      setRestartTrigger((prev) => prev + 1);
      setGameState('PLAYING');
    },
    []
  );

  const handleGameOver = useCallback((finalStats: HudStats) => {
    setHud(finalStats);
    setGameState('GAMEOVER');
  }, []);

  const toggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        soundEngine.playBlip(420);
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        soundEngine.playBlip(620);
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();

      if (key === 'm') {
        toggleMute();
        return;
      }
      if (key === 'c') {
        setCrtEnabled((prev) => !prev);
        return;
      }
      if (key === 'p' || e.key === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          togglePause();
        }
        return;
      }

      if (gameState === 'TITLE' || gameState === 'GAMEOVER') {
        if (e.key === ' ' || e.key === 'Enter') {
          startNewGame();
          return;
        }
      }

      if (e.key === 'ArrowLeft' || key === 'a' || key === 'q') {
        inputRef.current.left = true;
        inputRef.current.pointerX = null;
        setActiveKeys((k) => (k.left ? k : { ...k, left: true }));
      }
      if (e.key === 'ArrowRight' || key === 'd') {
        inputRef.current.right = true;
        inputRef.current.pointerX = null;
        setActiveKeys((k) => (k.right ? k : { ...k, right: true }));
      }
      if (e.key === 'ArrowUp' || key === 'w' || key === 'z' || e.key === ' ') {
        if (!e.repeat) {
          inputRef.current.jumpPressed = true;
        }
        setActiveKeys((k) => (k.jump ? k : { ...k, jump: true }));
      }
      if (e.key === 'ArrowDown' || key === 's') {
        inputRef.current.down = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || key === 'a' || key === 'q') {
        inputRef.current.left = false;
        setActiveKeys((k) => (!k.left ? k : { ...k, left: false }));
      }
      if (e.key === 'ArrowRight' || key === 'd') {
        inputRef.current.right = false;
        setActiveKeys((k) => (!k.right ? k : { ...k, right: false }));
      }
      if (e.key === 'ArrowUp' || key === 'w' || key === 'z' || e.key === ' ') {
        setActiveKeys((k) => (!k.jump ? k : { ...k, jump: false }));
      }
      if (e.key === 'ArrowDown' || key === 's') {
        inputRef.current.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startNewGame, toggleMute, togglePause]);

  const currentCostumeObj =
    COSTUMES.find((c) => c.id === costume) || COSTUMES[0];

  const formatScore = (n: number) => String(Math.floor(n)).padStart(6, '0');

  return (
    <div className="relative w-full h-dvh bg-[#070510] flex flex-col items-center justify-between overflow-hidden select-none">
      {/* Ambient Radial Arcade Room Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255, 117, 24, 0.14) 0%, rgba(155, 93, 229, 0.08) 45%, rgba(7, 5, 16, 0.98) 80%)',
        }}
      />

      {/* ARCADE CABINET CONTAINER */}
      <div className="relative z-10 w-full max-w-[540px] h-full flex flex-col justify-between px-2 py-1.5 sm:py-2.5">
        {/* 1. CABINET TOP MARQUEE & UTILITY CONTROLS */}
        <header className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#120A28] border-2 border-[#FF7518] shadow-[0_3px_0_#070510] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2.5 h-2.5 bg-[#39FF14] shadow-[0_0_6px_#39FF14] shrink-0" />
            <span className="font-arcade text-[10px] sm:text-[11px] text-[#FFD166] truncate text-pixel-shadow-sm">
              L’ARCADE RÉTRO
            </span>
            <span className="hidden xs:inline-block text-[10px] font-pixel text-[#FF9E00] px-1.5 py-0.5 bg-[#241445] border border-[#FF7518]/50">
              16-BIT
            </span>
          </div>

          {/* Mode Quick Pill */}
          <div className="flex items-center gap-1 bg-[#090514] p-0.5 border border-[#4A327A]">
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlip(520);
                setGameMode('vertical');
                setRestartTrigger((r) => r + 1);
              }}
              className={`px-2 py-0.5 text-[10px] font-pixel transition-colors cursor-pointer ${
                gameMode === 'vertical'
                  ? 'bg-[#FF7518] text-[#070510] font-bold'
                  : 'text-[#C8B6E2] hover:text-white'
              }`}
              title="Platformer Vertical Infini (Type Doodle Jump)"
            >
              GRIMPE
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlip(580);
                setGameMode('runner');
                setRestartTrigger((r) => r + 1);
              }}
              className={`px-2 py-0.5 text-[10px] font-pixel transition-colors cursor-pointer ${
                gameMode === 'runner'
                  ? 'bg-[#FF7518] text-[#070510] font-bold'
                  : 'text-[#C8B6E2] hover:text-white'
              }`}
              title="Auto-Runner Infini sur les Toits"
            >
              COURSE
            </button>
          </div>

          {/* Utility Bezel Buttons: CRT, Audio, Pause */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlip(480);
                setCrtEnabled((v) => !v);
              }}
              className={`p-1.5 border text-xs cursor-pointer transition-colors ${
                crtEnabled
                  ? 'bg-[#26174A] border-[#FFD166] text-[#FFD166]'
                  : 'bg-[#120A28] border-[#4A327A] text-[#C8B6E2]/60'
              }`}
              title="Filtre Écran Cathodique CRT (Touche C)"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={`p-1.5 border text-xs cursor-pointer transition-colors ${
                !isMuted
                  ? 'bg-[#26174A] border-[#39FF14] text-[#39FF14]'
                  : 'bg-[#120A28] border-[#FF2A54] text-[#FF2A54]'
              }`}
              title="Audio Chiptune 16-Bit (Touche M)"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <button
                type="button"
                onClick={togglePause}
                className="p-1.5 bg-[#FF7518] border border-[#FFF8E7] text-[#070510] cursor-pointer hover:brightness-110"
                title="Pause (Touche P)"
              >
                {gameState === 'PAUSED' ? (
                  <Play className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            )}
          </div>
        </header>

        {/* 2. MAIN CRT MONITOR SCREEN VIEWPORT */}
        <main className="relative flex-1 min-h-0 my-1.5 w-full bg-[#0D081D] border-[3px] border-[#4A327A] shadow-[inset_0_0_20px_#070510,0_0_0_2px_#070510] overflow-hidden flex items-center justify-center">
          {/* Interactive HTML5 Game Canvas */}
          <ArcadeCanvas
            gameState={gameState}
            gameMode={gameMode}
            costume={costume}
            inputRef={inputRef}
            onStatsUpdate={setHud}
            onGameOver={handleGameOver}
            restartTrigger={restartTrigger}
          />

          {/* CRT Scanline & Vignette Overlay */}
          {crtEnabled && (
            <>
              <div className="absolute inset-0 crt-scanlines z-20" />
              <div className="absolute inset-0 crt-vignette z-20" />
            </>
          )}

          {/* FLOATING IN-GAME HUD BAR (Top of Canvas) */}
          <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D081D]/88 border-2 border-[#FF7518] shadow-[3px_3px_0_#070510]">
              {/* Left: Score & Record */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-pixel text-[10px] text-[#C8B6E2]">SCORE</span>
                  <span
                    className="font-vt text-2xl sm:text-3xl leading-none text-[#FFD166] text-pixel-shadow-sm"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatScore(hud.score)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-pixel text-[#C8B6E2]">
                  <span>HI {formatScore(hud.highScore)}</span>
                  <span className="text-[#FF9E00]">• {hud.altitude}m</span>
                </div>
              </div>

              {/* Center: Active Power-Up Status Pills */}
              <div className="flex items-center gap-1">
                {hud.hasShield && (
                  <span className="px-1.5 py-0.5 bg-[#FF9E00]/25 border border-[#FF9E00] text-[#FFD166] font-pixel text-[9px] animate-pulse">
                    BOUCLIER
                  </span>
                )}
                {hud.magnetTime > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#FF477E]/25 border border-[#FF477E] text-[#FF477E] font-pixel text-[9px]">
                    AIMANT {Math.ceil(hud.magnetTime)}s
                  </span>
                )}
                {hud.rocketTime > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#9B5DE5]/35 border border-[#39FF14] text-[#39FF14] font-pixel text-[9px] animate-bounce">
                    FUSÉE!
                  </span>
                )}
              </div>

              {/* Right: Candies & Combo Multiplier */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="inline-block w-2.5 h-2.5 bg-[#FF477E] border border-[#FFF8E7]" />
                    <span
                      className="font-vt text-2xl leading-none text-[#FFF8E7] text-pixel-shadow-sm"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {hud.candies}
                    </span>
                  </div>
                  <span className="font-pixel text-[9px] text-[#C8B6E2] block">
                    BONBONS
                  </span>
                </div>

                <div
                  className={`px-2 py-1 border-2 font-arcade text-xs transition-transform ${
                    hud.combo > 1
                      ? 'bg-[#231442] border-[#39FF14] text-[#39FF14] scale-105 shadow-[0_0_10px_rgba(57,255,20,0.45)]'
                      : 'bg-[#160D2E] border-[#4A327A] text-[#C8B6E2]'
                  }`}
                >
                  x{hud.combo}
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              OVERLAY 1: TITLE SCREEN MODAL (Floating over Live Demo)
          ========================================================= */}
          {gameState === 'TITLE' && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-3 bg-[#070510]/65 backdrop-blur-[1px]">
              <div className="w-full max-w-[430px] pixel-box p-3.5 sm:p-4 flex flex-col gap-3 max-h-full overflow-y-auto">
                {/* Title Header */}
                <div className="text-center border-b-2 border-[#2A1B4E] pb-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2A154B] border border-[#FF9E00] text-[#FFD166] font-pixel text-[10px] mb-1.5">
                    <Sparkles className="w-3 h-3 text-[#FF7518]" />
                    <span>SPÉCIAL NUIT D’HALLOWEEN</span>
                  </div>
                  <h1 className="font-arcade text-base sm:text-lg leading-snug text-[#FF7518] text-glow-orange">
                    LA CHASSE AUX BONBONS INFINIE
                  </h1>
                  <p className="font-pixel text-[11px] text-[#C8B6E2] mt-1">
                    Bondis sur les toits & branches de citrouilles géantes !
                  </p>
                </div>

                {/* Game Mode Selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-arcade text-[9px] text-[#FFD166] uppercase">
                    1. CHOISIS TON MODE D’ARCADE :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip(540);
                        setGameMode('vertical');
                        setRestartTrigger((r) => r + 1);
                      }}
                      className={`p-2 text-left border-2 transition-all cursor-pointer ${
                        gameMode === 'vertical'
                          ? 'bg-[#2B1654] border-[#FFD166] shadow-[3px_3px_0_#070510]'
                          : 'bg-[#140B29] border-[#3C2468] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-arcade text-[10px] text-[#FF7518]">
                          GRIMPE INFINIE
                        </span>
                        {gameMode === 'vertical' && (
                          <span className="w-2 h-2 bg-[#39FF14]" />
                        )}
                      </div>
                      <p className="font-pixel text-[10px] text-[#FFF8E7] mt-0.5">
                        Type Doodle Jump
                      </p>
                      <p className="font-pixel text-[9px] text-[#C8B6E2] leading-tight mt-0.5">
                        Saute de branche en toit vers la lune !
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip(600);
                        setGameMode('runner');
                        setRestartTrigger((r) => r + 1);
                      }}
                      className={`p-2 text-left border-2 transition-all cursor-pointer ${
                        gameMode === 'runner'
                          ? 'bg-[#2B1654] border-[#FFD166] shadow-[3px_3px_0_#070510]'
                          : 'bg-[#140B29] border-[#3C2468] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-arcade text-[10px] text-[#39FF14]">
                          AUTO-RUNNER
                        </span>
                        {gameMode === 'runner' && (
                          <span className="w-2 h-2 bg-[#39FF14]" />
                        )}
                      </div>
                      <p className="font-pixel text-[10px] text-[#FFF8E7] mt-0.5">
                        Course sur les Toits
                      </p>
                      <p className="font-pixel text-[9px] text-[#C8B6E2] leading-tight mt-0.5">
                        Sprint effréné & double-saut aérien !
                      </p>
                    </button>
                  </div>
                </div>

                {/* Disguised Child Costume Selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-arcade text-[9px] text-[#FFD166] uppercase">
                      2. DÉGUISEMENT DE L’ENFANT :
                    </span>
                    <span className="font-pixel text-[10px] text-[#39FF14]">
                      {currentCostumeObj.perkLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {COSTUMES.map((c) => {
                      const selected = c.id === costume;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playBlip(640);
                            setCostume(c.id);
                          }}
                          className={`flex flex-col items-center p-1.5 border-2 transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#2B1654] border-[#FF7518] shadow-[2px_2px_0_#070510] -translate-y-0.5'
                              : 'bg-[#120A24] border-[#321E59] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <CostumePreviewCanvas
                            costume={c.id}
                            size={44}
                            animate={selected}
                          />
                          <span className="font-pixel text-[9px] text-[#FFF8E7] text-center leading-tight mt-1 truncate w-full">
                            {c.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-pixel text-[10px] text-[#C8B6E2] text-center bg-[#120A24] py-1 px-2 border border-[#2A1B4E]">
                    <strong className="text-[#FFD166]">{currentCostumeObj.name}</strong> :{' '}
                    {currentCostumeObj.subtitle}
                  </p>
                </div>

                {/* Mini Field Guide: Candies & Hazards */}
                <div className="grid grid-cols-2 gap-2 bg-[#110924] p-2 border border-[#321E59] text-[10px] font-pixel">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#FFD166] font-bold">À ATTRAPER :</span>
                    <span className="text-[#FFF8E7]">• Bonbons & Sucettes (+10 à +100)</span>
                    <span className="text-[#39FF14]">• Citrouille-Ressort & Fusée</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#FF2A54] font-bold">À ÉVITER (OU ÉCRASER) :</span>
                    <span className="text-[#C8B6E2]">• Chauves-Souris & Fantômes</span>
                    <span className="text-[#A0E7E5]">• Astuce: Saute sur leur tête !</span>
                  </div>
                </div>

                {/* Primary Start CTA */}
                <button
                  type="button"
                  onClick={() => startNewGame()}
                  className="arcade-btn w-full py-3 bg-[#FF7518] text-[#070510] font-arcade text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 animate-pulse-arcade"
                >
                  <span>LANCER LA CHASSE !</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              OVERLAY 2: PAUSE MODAL
          ========================================================= */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-[#070510]/75 backdrop-blur-[2px]">
              <div className="w-full max-w-[340px] pixel-box p-5 text-center flex flex-col gap-4">
                <h2 className="font-arcade text-base text-[#FFD166] text-pixel-shadow">
                  JEU EN PAUSE
                </h2>
                <p className="font-pixel text-xs text-[#C8B6E2]">
                  Reprends ton souffle sur les toits d’Halloween !
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="arcade-btn py-2.5 bg-[#39FF14] text-[#070510] font-arcade text-xs"
                  >
                    REPRENDRE (P)
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewGame()}
                    className="arcade-btn py-2.5 bg-[#FF7518] text-[#070510] font-arcade text-xs"
                  >
                    RECOMMENCER
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBlip(400);
                      setGameState('TITLE');
                    }}
                    className="arcade-btn py-2 bg-[#2B1654] text-[#FFF8E7] font-pixel text-xs"
                  >
                    MENU PRINCIPAL & COSTUMES
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              OVERLAY 3: GAME OVER SUMMARY CARD
          ========================================================= */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-3 bg-[#070510]/80 backdrop-blur-[2px]">
              <div className="w-full max-w-[390px] pixel-box-gold p-4 flex flex-col gap-3.5 text-center">
                <div>
                  {hud.isNewRecord && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#39FF14] text-[#070510] font-arcade text-[9px] mb-1.5 animate-bounce">
                      <Trophy className="w-3 h-3" />
                      <span>NOUVEAU RECORD BATTU !</span>
                    </div>
                  )}
                  <h2 className="font-arcade text-lg text-[#FF2A54] text-pixel-shadow">
                    FIN DE LA CHASSE !
                  </h2>
                  <p className="font-pixel text-xs text-[#C8B6E2] mt-1">
                    {hud.causeOfDeath === 'bat'
                      ? 'Une chauve-souris nocturne t’a fauché en plein vol !'
                      : hud.causeOfDeath === 'ghost'
                      ? 'Un fantôme rôdeur t’a glacé d’effroi !'
                      : 'Tu as glissé des toits dans la brume d’Halloween !'}
                  </p>
                </div>

                {/* Score & Candy Breakdown Grid */}
                <div className="grid grid-cols-2 gap-2 bg-[#0D081D] p-3 border-2 border-[#3C2468]">
                  <div className="flex flex-col items-center p-1.5 bg-[#160D2E] border border-[#2A1B4E]">
                    <span className="font-pixel text-[10px] text-[#C8B6E2]">SCORE FINAL</span>
                    <span className="font-vt text-3xl text-[#FFD166] leading-tight">
                      {formatScore(hud.score)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 bg-[#160D2E] border border-[#2A1B4E]">
                    <span className="font-pixel text-[10px] text-[#C8B6E2]">MEILLEUR SCORE</span>
                    <span className="font-vt text-3xl text-[#39FF14] leading-tight">
                      {formatScore(hud.highScore)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 bg-[#160D2E] border border-[#2A1B4E]">
                    <span className="font-pixel text-[10px] text-[#C8B6E2]">BONBONS</span>
                    <span className="font-vt text-2xl text-[#FF477E] leading-tight">
                      {hud.candies} récoltés
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 bg-[#160D2E] border border-[#2A1B4E]">
                    <span className="font-pixel text-[10px] text-[#C8B6E2]">
                      {gameMode === 'vertical' ? 'ALTITUDE MAX' : 'DISTANCE'}
                    </span>
                    <span className="font-vt text-2xl text-[#A0E7E5] leading-tight">
                      {hud.altitude}m (x{hud.maxCombo})
                    </span>
                  </div>
                </div>

                {/* Quick Costume Switcher on Game Over */}
                <div className="flex items-center justify-between bg-[#120A24] px-2.5 py-1.5 border border-[#321E59]">
                  <span className="font-pixel text-[10px] text-[#C8B6E2]">
                    CHANGER COSTUME :
                  </span>
                  <div className="flex items-center gap-1.5">
                    {COSTUMES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playBlip(600);
                          setCostume(c.id);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-pixel border cursor-pointer ${
                          costume === c.id
                            ? 'bg-[#FF7518] text-[#070510] border-[#FFF8E7] font-bold'
                            : 'bg-[#1D113B] text-[#C8B6E2] border-[#4A327A]'
                        }`}
                      >
                        {c.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startNewGame()}
                    className="arcade-btn flex-1 py-3 bg-[#FF7518] text-[#070510] font-arcade text-xs flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>REJOUER (ESPACE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBlip(440);
                      setGameState('TITLE');
                    }}
                    className="arcade-btn px-3 py-3 bg-[#2B1654] text-[#FFF8E7] font-pixel text-xs"
                  >
                    MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 3. TACTILE ARCADE CONTROL DECK (Keyboard + Touch / Mouse Buttons) */}
        <footer className="shrink-0 bg-[#120A28] border-2 border-[#4A327A] px-3 py-2 shadow-[0_4px_0_#070510] flex items-center justify-between gap-2">
          {gameMode === 'vertical' ? (
            <>
              {/* Left / Right D-Pad Buttons for Vertical Climb */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={() => {
                    inputRef.current.left = true;
                    inputRef.current.pointerX = null;
                    setActiveKeys((k) => ({ ...k, left: true }));
                  }}
                  onPointerUp={() => {
                    inputRef.current.left = false;
                    setActiveKeys((k) => ({ ...k, left: false }));
                  }}
                  onPointerLeave={() => {
                    inputRef.current.left = false;
                    setActiveKeys((k) => ({ ...k, left: false }));
                  }}
                  className={`arcade-btn px-4 py-2 bg-[#2B1654] text-[#FFF8E7] font-arcade text-xs select-none ${
                    activeKeys.left ? 'active-press bg-[#FF7518] text-[#070510]' : ''
                  }`}
                >
                  ◀ GAUCHE
                </button>

                <button
                  type="button"
                  onPointerDown={() => {
                    inputRef.current.right = true;
                    inputRef.current.pointerX = null;
                    setActiveKeys((k) => ({ ...k, right: true }));
                  }}
                  onPointerUp={() => {
                    inputRef.current.right = false;
                    setActiveKeys((k) => ({ ...k, right: false }));
                  }}
                  onPointerLeave={() => {
                    inputRef.current.right = false;
                    setActiveKeys((k) => ({ ...k, right: false }));
                  }}
                  className={`arcade-btn px-4 py-2 bg-[#2B1654] text-[#FFF8E7] font-arcade text-xs select-none ${
                    activeKeys.right ? 'active-press bg-[#FF7518] text-[#070510]' : ''
                  }`}
                >
                  DROITE ▶
                </button>
              </div>

              {/* Instructions & Mid-Air Double Jump Button */}
              <div className="hidden sm:flex flex-col items-center text-[10px] font-pixel text-[#C8B6E2]">
                <span>FLÈCHES ← / → ou SOURIS</span>
                <span className="text-[#FFD166]">ESPACE : DOUBLE-SAUT DE CAPE</span>
              </div>

              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.jumpPressed = true;
                  setActiveKeys((k) => ({ ...k, jump: true }));
                }}
                onPointerUp={() => setActiveKeys((k) => ({ ...k, jump: false }))}
                onPointerLeave={() => setActiveKeys((k) => ({ ...k, jump: false }))}
                className={`arcade-btn px-3.5 py-2 bg-[#FF7518] text-[#070510] font-arcade text-[10px] sm:text-xs select-none ${
                  activeKeys.jump ? 'active-press brightness-125' : ''
                }`}
              >
                CAPE ▲
              </button>
            </>
          ) : (
            <>
              {/* Runner Mode Controls */}
              <div className="flex flex-col text-[10px] font-pixel text-[#C8B6E2]">
                <span className="text-[#39FF14]">MODE AUTO-RUNNER SUR LES TOITS</span>
                <span>ESPACE / CLIC : SAUT & DOUBLE-SAUT</span>
              </div>

              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.jumpPressed = true;
                  setActiveKeys((k) => ({ ...k, jump: true }));
                }}
                onPointerUp={() => setActiveKeys((k) => ({ ...k, jump: false }))}
                onPointerLeave={() => setActiveKeys((k) => ({ ...k, jump: false }))}
                className={`arcade-btn px-6 py-2.5 bg-[#FF7518] text-[#070510] font-arcade text-xs select-none ${
                  activeKeys.jump ? 'active-press brightness-125' : ''
                }`}
              >
                SAUTER ▲ (ESPACE)
              </button>
            </>
          )}
        </footer>
      </div>
    
      {/* Bouton Infos technique */}
      <button
        onClick={() => setShowInfo(true)}
        className="fixed top-2.5 right-2.5 z-[100] flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-amber-200 shadow-md backdrop-blur hover:bg-slate-800 transition cursor-pointer select-none"
        title="Comment ce jeu a été fait"
        aria-label="Infos sur le jeu"
      >
        <span>ℹ️</span>
        <span className="hidden sm:inline">Infos</span>
      </button>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
</div>
  );
}

export default App;
