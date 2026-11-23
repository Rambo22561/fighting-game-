import React, { useState } from 'react';
import { ArrowLeft, Flame, MapPin, Swords, Trophy } from 'lucide-react';
import { Difficulty, FIGHTER_ROSTER, FighterId, GameMode } from '../game/types';

interface CharacterSelectProps {
  p1Id: FighterId;
  p2Id: FighterId;
  gameMode: GameMode;
  savedArcadeLevel: number;
  difficulty: Difficulty;
  onSelectP1: (id: FighterId) => void;
  onSelectP2: (id: FighterId) => void;
  onChangeMode: (mode: GameMode) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  onBack: () => void;
  onOpenStage: () => void;
  onStartMatch: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  p1Id,
  p2Id,
  gameMode,
  savedArcadeLevel,
  difficulty,
  onSelectP1,
  onSelectP2,
  onChangeMode,
  onChangeDifficulty,
  onBack,
  onOpenStage,
  onStartMatch,
}) => {
  const [activeSlot, setActiveSlot] = useState<'p1' | 'p2'>('p1');

  const p1Spec = FIGHTER_ROSTER.find((f) => f.id === p1Id) || FIGHTER_ROSTER[0];
  const p2Spec = FIGHTER_ROSTER.find((f) => f.id === p2Id) || FIGHTER_ROSTER[1];
  const effectiveSlot = gameMode === 'versus' ? activeSlot : 'p1';
  const focusedSpec = effectiveSlot === 'p1' ? p1Spec : p2Spec;

  const handlePick = (id: FighterId) => {
    if (effectiveSlot === 'p1') {
      onSelectP1(id);
    } else {
      onSelectP2(id);
    }
  };

  const startLabel =
    gameMode === 'arcade100'
      ? `Start Lv.${savedArcadeLevel}`
      : gameMode === 'tournament'
        ? 'Bracket'
        : 'Fight';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* TOP HEADER BAR */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111622]/92 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </button>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-[#111622]/92 p-1">
          <button
            type="button"
            onClick={() => onChangeMode('arcade100')}
            className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
              gameMode === 'arcade100'
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            100 Levels
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('tournament')}
            className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
              gameMode === 'tournament'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Tournament
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('versus')}
            className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
              gameMode === 'versus'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            1v1
          </button>
        </div>

        {/* Slot Toggle (1v1 Mode) or Difficulty */}
        <div className="flex items-center gap-2">
          {gameMode === 'versus' && (
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-[#111622]/92 p-1">
              <button
                type="button"
                onClick={() => setActiveSlot('p1')}
                className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeSlot === 'p1'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                P1: {p1Spec.name}
              </button>
              <button
                type="button"
                onClick={() => setActiveSlot('p2')}
                className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeSlot === 'p2'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                CPU: {p2Spec.name}
              </button>
            </div>
          )}

          <div className="hidden items-center gap-1 rounded-xl border border-white/15 bg-[#111622]/92 p-1 md:flex">
            {(['rookie', 'challenger', 'master'] as Difficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChangeDifficulty(level)}
                className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  difficulty === level
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* UNOBSTRUCTED CENTER VIEWPORT SHOWING LIVE 3D FIGHTERS */}
      <div className="pointer-events-none flex items-center justify-between px-2 sm:px-6">
        <div className="rounded-lg border border-red-500/35 bg-[#0b0e14]/80 px-3 py-1.5">
          <div className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
            Player 1
          </div>
          <div className="font-display text-lg font-extrabold text-white uppercase sm:text-2xl">
            {p1Spec.name}
          </div>
          <div className="text-[11px] text-slate-400">{p1Spec.style}</div>
        </div>

        <div className="rounded-lg border border-blue-500/35 bg-[#0b0e14]/80 px-3 py-1.5 text-right">
          <div className="text-[10px] font-bold tracking-wider text-blue-400 uppercase">
            {gameMode === 'versus'
              ? 'CPU Opponent'
              : gameMode === 'arcade100'
                ? `Tower Lv.${savedArcadeLevel}`
                : '8-Fighter Cup'}
          </div>
          <div className="font-display text-lg font-extrabold text-white uppercase sm:text-2xl">
            {p2Spec.name}
          </div>
          <div className="text-[11px] text-slate-400">{p2Spec.style}</div>
        </div>
      </div>

      {/* BOTTOM UNIFIED 12-FIGHTER DOCK */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col gap-2 rounded-2xl border border-white/15 bg-[#0b0e14]/94 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3">
        {/* 12 3D Fighter Roster Grid (6x2 on tablet/landscape, 4x3 scrollable on narrow screens) */}
        <div className="grid max-h-[120px] flex-1 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5 sm:max-h-none sm:grid-cols-6 sm:overflow-visible">
          {FIGHTER_ROSTER.map((fighter) => {
            const isP1 = p1Id === fighter.id;
            const isP2 = gameMode === 'versus' && p2Id === fighter.id;
            const selectedForActive =
              (effectiveSlot === 'p1' && isP1) || (effectiveSlot === 'p2' && isP2);

            return (
              <button
                key={fighter.id}
                type="button"
                onClick={() => handlePick(fighter.id)}
                className={`relative flex min-h-[44px] flex-col items-start justify-center rounded-lg border px-2 py-1 text-left transition-colors ${
                  selectedForActive
                    ? 'border-amber-400 bg-slate-800/95'
                    : isP1 || isP2
                      ? 'border-white/35 bg-slate-900/95'
                      : 'border-white/12 bg-slate-900/75 hover:border-white/30'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="truncate font-display text-xs font-bold tracking-wide text-white uppercase sm:text-sm">
                    {fighter.name}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: fighter.palette.uiAccent }}
                  />
                </div>
                <span className="truncate text-[9px] text-slate-400">
                  {isP1 && isP2 ? 'P1/CPU' : isP1 ? 'P1' : isP2 ? 'CPU' : fighter.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Focused Fighter Stats Strip */}
        <div className="hidden w-48 shrink-0 flex-col gap-1 border-l border-white/10 pl-3 lg:flex">
          <div className="flex items-baseline justify-between gap-1">
            <span className="truncate text-xs font-bold text-amber-400">
              {focusedSpec.specialName}
            </span>
            <span className="font-mono-num text-[11px] text-slate-400">
              HP {focusedSpec.maxHp}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
            <div>
              <div className="flex justify-between">
                <span>PWR</span>
                <span className="font-mono-num">{focusedSpec.stats.power}</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${focusedSpec.stats.power * 10}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>SPD</span>
                <span className="font-mono-num">{focusedSpec.stats.speed}</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${focusedSpec.stats.speed * 10}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>RNG</span>
                <span className="font-mono-num">{focusedSpec.stats.range}</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${focusedSpec.stats.range * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage & Start Match CTAs */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenStage}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-[#161b26] px-3.5 py-2 font-display text-sm font-bold tracking-wider text-amber-300 uppercase transition-colors hover:bg-slate-800 active:scale-95 whitespace-nowrap sm:flex-initial sm:text-base"
          >
            <MapPin className="h-4 w-4" />
            Stage
          </button>

          <button
            type="button"
            onClick={onStartMatch}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 font-display text-base font-extrabold tracking-wider text-white uppercase shadow-lg transition-transform hover:bg-red-500 active:scale-95 whitespace-nowrap sm:flex-initial sm:text-lg"
          >
            {gameMode === 'arcade100' ? (
              <Flame className="h-4 w-4 text-amber-300" />
            ) : gameMode === 'tournament' ? (
              <Trophy className="h-4 w-4 text-amber-300" />
            ) : (
              <Swords className="h-4 w-4" />
            )}
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
