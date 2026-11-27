import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm select-none">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">ℹ️</span>
            <h2 className="text-lg sm:text-xl font-bold tracking-wide">Comment Sac de Bonbons a été fait</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p>
            <strong className="text-amber-400">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, icônes Lucide, bundle single-file HTML autonome.
          </p>
          <p>
            <strong className="text-amber-400">Graphismes :</strong> Rendu Canvas 2D pixel art 16-bit, quatre costumes au choix avec aperçu en temps réel, filtres scanlines CRT et vignette rétro.
          </p>
          <p>
            <strong className="text-amber-400">Musique &amp; sons :</strong> Web Audio API avec oscillateurs programmés pour bruitages d arcade (rebonds métalliques, carillons de multiplicateurs, jingle de game over).
          </p>
          <p>
            <strong className="text-amber-400">Interactions :</strong> Déplacement horizontal au clavier (Flèches / A-D), rebonds automatiques et boosters, pavé tactile virtuel pour mobile.
          </p>
          <p>
            <strong className="text-amber-400">Architecture :</strong> Architecture par composants (ArcadeCanvas, CostumePreviewCanvas), gestionnaire d état de partie (menu, jeu, pause, défaite), persistance des bonbons d or et du costume choisi.
          </p>
          <p>
            <strong className="text-amber-400">Algorithmes notables :</strong> Générateur de plateformes à difficulté dynamique croissante, physique de rebond avec vélocité verticale amortie, calcul de multiplicateur de score en combo.
          </p>
        </div>

        <p className="px-4 pb-1 text-center text-[11px] text-slate-400">Créé par Geoffroy Streit (Hylst) avec l'aide d'une IA.</p>
        <div className="bg-slate-950 p-3 sm:p-4 text-center border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition cursor-pointer text-sm shadow-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
