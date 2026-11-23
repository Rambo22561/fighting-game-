import React, { useEffect, useState } from 'react';
import { ChevronRight, Home, MapPin, Play, RotateCcw, Trophy, Users } from 'lucide-react';
import { FighterSpec, HudSnapshot } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSelectFighters: () => void;
  onSelectStage: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSelectFighters,
  onSelectStage,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b0e14]/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#111622] p-6 shadow-2xl">
        <h2 className="font-display text-center text-3xl font-extrabold tracking-wider text-white uppercase">
          Match Paused
        </h2>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-display text-lg font-bold tracking-wider text-slate-950 uppercase hover:bg-amber-400 active:scale-98"
          >
            <Play className="h-4 w-4 fill-current" />
            Resume Fight
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Match
          </button>

          <button
            type="button"
            onClick={onSelectFighters}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 active:scale-98"
          >
            <Users className="h-4 w-4" />
            Change Fighters
          </button>

          <button
            type="button"
            onClick={onSelectStage}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 active:scale-98"
          >
            <MapPin className="h-4 w-4" />
            Change Stage
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white active:scale-98"
          >
            <Home className="h-4 w-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface ResultModalProps {
  hud: HudSnapshot;
  p1Spec: FighterSpec;
  p2Spec: FighterSpec;
  onRematch: () => void;
  onNextLevel?: () => void;
  onRestartTower?: () => void;
  onContinueTournament?: () => void;
  onRestartTournament?: () => void;
  onSelectFighters: () => void;
  onSelectStage: () => void;
  onMainMenu: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  hud,
  p1Spec,
  p2Spec,
  onRematch,
  onNextLevel,
  onRestartTower,
  onContinueTournament,
  onRestartTournament,
  onSelectFighters,
  onSelectStage,
  onMainMenu,
}) => {
  const isVictory = hud.winner === 'p1';
  const isDraw = hud.winner === 'draw';
  const isTowerWin = hud.gameMode === 'arcade100' && isVictory && hud.arcadeLevel < 100;
  const isTowerComplete = hud.gameMode === 'arcade100' && isVictory && hud.arcadeLevel >= 100;
  const isTournamentWin = hud.gameMode === 'tournament' && isVictory;

  const [countdown, setCountdown] = useState(3);
  const nextLevelRef = React.useRef(onNextLevel);
  const continueTournamentRef = React.useRef(onContinueTournament);
  nextLevelRef.current = onNextLevel;
  continueTournamentRef.current = onContinueTournament;

  // Automatic next-level / next-bracket transition countdown on victory
  useEffect(() => {
    if (!isTowerWin && !isTournamentWin) return;
    setCountdown(3);
    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (isTowerWin && nextLevelRef.current) {
            nextLevelRef.current();
          } else if (isTournamentWin && continueTournamentRef.current) {
            continueTournamentRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTowerWin, isTournamentWin]);

  const subtitleText = isTowerComplete
    ? '100-Level Tower Conquered!'
    : isTowerWin
      ? `Level ${hud.arcadeLevel} Cleared · Next in ${countdown}s`
      : hud.gameMode === 'arcade100'
        ? `Tower Level ${hud.arcadeLevel} / 100`
        : isTournamentWin
          ? hud.arcadeLevel >= 3
            ? `Grand Champion! · Bracket in ${countdown}s`
            : `Bout Cleared · Bracket in ${countdown}s`
          : hud.gameMode === 'tournament'
            ? 'Tournament Eliminated'
            : isVictory
              ? 'Arena Winner'
              : isDraw
                ? 'Time Expired'
                : 'Defeated';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center p-4 sm:items-center">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/15 bg-[#111622]/96 p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span
              className={`text-xs font-bold tracking-widest uppercase ${
                isVictory ? 'text-amber-400' : isDraw ? 'text-slate-300' : 'text-red-400'
              }`}
            >
              {subtitleText}
            </span>
            <h2 className="font-display text-4xl font-extrabold tracking-wide text-white uppercase italic">
              {isTowerComplete
                ? 'Grand Master'
                : isVictory
                  ? 'Victory'
                  : isDraw
                    ? 'Draw Match'
                    : 'Defeat'}
            </h2>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
              isVictory
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-400'
                : 'border-white/15 bg-slate-800 text-slate-400'
            }`}
          >
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        {/* Scoreline & Stats */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span>
            {p1Spec.name} <strong className="font-mono-num text-white">{hud.p1Rounds}</strong>
            {' — '}
            <strong className="font-mono-num text-white">{hud.p2Rounds}</strong> {p2Spec.name}
          </span>
          <span className="font-mono-num text-slate-400">
            {Math.round(hud.matchStats.elapsedSeconds)}s
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-[#0b0e14]/80 p-3 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Damage</div>
            <div className="font-mono-num text-base font-bold text-white">
              {hud.matchStats.damageDealt}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Max Combo</div>
            <div className="font-mono-num text-base font-bold text-amber-400">
              {hud.matchStats.maxCombo}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Blocks</div>
            <div className="font-mono-num text-base font-bold text-sky-400">
              {hud.matchStats.blocksLanded}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Specials</div>
            <div className="font-mono-num text-base font-bold text-red-400">
              {hud.matchStats.specialsUsed}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {isTowerWin && onNextLevel ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 font-display text-lg font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400 active:scale-95 whitespace-nowrap"
            >
              Next Level ({hud.arcadeLevel + 1})
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : isTowerComplete && onRestartTower ? (
            <button
              type="button"
              onClick={onRestartTower}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-display text-lg font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400 active:scale-95 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              Play Lv.1 Again
            </button>
          ) : isTournamentWin && onContinueTournament ? (
            <button
              type="button"
              onClick={onContinueTournament}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 font-display text-lg font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400 active:scale-95 whitespace-nowrap"
            >
              {hud.arcadeLevel >= 3 ? 'Claim Trophy' : 'Continue Bracket'}
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : hud.gameMode === 'tournament' && onRestartTournament ? (
            <button
              type="button"
              onClick={onRestartTournament}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-display text-lg font-bold tracking-wider text-white uppercase hover:bg-red-500 active:scale-95 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              New Tournament
            </button>
          ) : (
            <button
              type="button"
              onClick={onRematch}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-display text-lg font-bold tracking-wider text-white uppercase hover:bg-red-500 active:scale-95 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              {hud.gameMode === 'arcade100' ? `Retry Lv.${hud.arcadeLevel}` : 'Rematch'}
            </button>
          )}

          <button
            type="button"
            onClick={onSelectFighters}
            className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 whitespace-nowrap"
          >
            <Users className="h-4 w-4" />
            Fighters
          </button>

          {hud.gameMode === 'versus' && (
            <button
              type="button"
              onClick={onSelectStage}
              className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 whitespace-nowrap"
            >
              <MapPin className="h-4 w-4" />
              Stage
            </button>
          )}

          <button
            type="button"
            onClick={onMainMenu}
            className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            Menu
          </button>
        </div>
      </div>
    </div>
  );
};
