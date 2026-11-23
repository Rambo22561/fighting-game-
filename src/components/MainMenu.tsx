import React from 'react';
import { BookOpen, Coins, Flame, History, MapPin, Swords, Target, Trophy, Users, Volume2, VolumeX } from 'lucide-react';
import { Difficulty, FIGHTER_ROSTER, STAGE_ROSTER } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface MainMenuProps {
  difficulty: Difficulty;
  muted: boolean;
  savedArcadeLevel: number;
  historyCount: number;
  gold: number;
  bountyCompletedToday: boolean;
  onChangeDifficulty: (d: Difficulty) => void;
  onToggleMute: () => void;
  onStartTower: () => void;
  onStartTournament: () => void;
  onQuickFight: () => void;
  onOpenSelect: () => void;
  onOpenStage: () => void;
  onOpenHistory: () => void;
  onOpenGallery: () => void;
  onOpenBounty: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  difficulty,
  muted,
  savedArcadeLevel,
  historyCount,
  gold,
  bountyCompletedToday,
  onChangeDifficulty,
  onToggleMute,
  onStartTower,
  onStartTournament,
  onQuickFight,
  onOpenSelect,
  onOpenStage,
  onOpenHistory,
  onOpenGallery,
  onOpenBounty,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-7">
      {/* Top Bar: Title Tag, Arena Gold, Install App & Quiet Mute Button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-widest text-amber-400/90 uppercase">
          3D Tournament Fighter · {FIGHTER_ROSTER.length} Fighters · {STAGE_ROSTER.length} Places
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBounty}
            aria-label="Open Daily Bounty and Skins"
            className="pointer-events-auto flex h-11 items-center gap-1.5 rounded-xl border border-amber-400/40 bg-[#111622]/90 px-3 text-xs font-bold text-amber-300 transition-colors hover:border-amber-400 hover:text-amber-200 active:scale-95"
          >
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-mono-num">{gold}</span>
          </button>
          <PWAInstallButton />
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#111622]/90 text-slate-200 transition-colors hover:border-amber-400/60 hover:text-white"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Left-Aligned Title Lockup & Actions leaving right/center arena unobstructed */}
      <div className="my-auto flex max-w-xl flex-col items-start gap-3.5">
        {/* Bespoke Inline SVG Title Lockup */}
        <svg
          viewBox="0 0 420 110"
          className="h-auto w-64 sm:w-88"
          aria-label="Kensei Arena"
        >
          <defs>
            <linearGradient id="kaGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M4 14 L38 14 L26 22 L4 22 Z" fill="#ef4444" />
          <text
            x="4"
            y="64"
            fill="#f8fafc"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="58"
            letterSpacing="3"
          >
            KENSEI
          </text>
          <text
            x="6"
            y="100"
            fill="url(#kaGold)"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="38"
            letterSpacing="8"
          >
            ARENA
          </text>
          <rect x="148" y="84" width="160" height="3" fill="#ef4444" opacity="0.85" />
        </svg>

        {/* Difficulty Segmented Control */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/15 bg-[#111622]/92 p-1">
          {(['rookie', 'challenger', 'master'] as Difficulty[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChangeDifficulty(level)}
              className={`min-h-[38px] rounded-lg px-3.5 py-1 text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                difficulty === level
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Primary Game Mode Action Buttons */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartTower}
            className="flex min-h-[48px] items-center gap-2.5 rounded-xl bg-red-600 px-5 py-2.5 font-display text-lg font-extrabold tracking-wider text-white uppercase shadow-lg transition-transform hover:bg-red-500 active:scale-95 whitespace-nowrap sm:text-xl"
          >
            <Flame className="h-5 w-5 text-amber-300" />
            100-Level Tower
            <span className="rounded-md bg-black/30 px-2 py-0.5 font-mono-num text-xs font-bold text-amber-300">
              Lv.{savedArcadeLevel}
            </span>
          </button>

          <button
            type="button"
            onClick={onStartTournament}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-display text-lg font-extrabold tracking-wider text-slate-950 uppercase shadow-lg transition-transform hover:bg-amber-400 active:scale-95 whitespace-nowrap sm:text-xl"
          >
            <Trophy className="h-5 w-5" />
            Tournament
          </button>

          <button
            type="button"
            onClick={onQuickFight}
            className="flex min-h-[48px] items-center gap-2 rounded-xl border border-white/25 bg-[#161b26]/92 px-4 py-2.5 font-display text-lg font-bold tracking-wider text-white uppercase transition-colors hover:border-red-400/70 active:scale-95 whitespace-nowrap"
          >
            <Swords className="h-5 w-5 text-red-400" />
            1v1 Fight
          </button>
        </div>

        {/* Roster & Stage Customization Buttons */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSelect}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-[#161b26]/92 px-4 py-2 font-display text-base font-bold tracking-wider text-slate-100 uppercase transition-colors hover:border-amber-400/60 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <Users className="h-4 w-4 text-amber-400" />
            {FIGHTER_ROSTER.length} Fighters
          </button>

          <button
            type="button"
            onClick={onOpenStage}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-[#161b26]/92 px-4 py-2 font-display text-base font-bold tracking-wider text-slate-100 uppercase transition-colors hover:border-amber-400/60 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <MapPin className="h-4 w-4 text-sky-400" />
            {STAGE_ROSTER.length} Stages
          </button>

          <button
            type="button"
            onClick={onOpenGallery}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-[#161b26]/92 px-4 py-2 font-display text-base font-bold tracking-wider text-slate-100 uppercase transition-colors hover:border-amber-400/60 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 text-purple-400" />
            Gallery
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-[#161b26]/92 px-4 py-2 font-display text-base font-bold tracking-wider text-slate-100 uppercase transition-colors hover:border-amber-400/60 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <History className="h-4 w-4 text-emerald-400" />
            History
            {historyCount > 0 && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono-num text-[11px] font-bold text-amber-300">
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBounty}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/35 bg-[#161b26]/92 px-4 py-2 font-display text-base font-bold tracking-wider text-slate-100 uppercase transition-colors hover:border-amber-400 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <Target className="h-4 w-4 text-amber-400" />
            Daily Bounty
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                bountyCompletedToday
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {bountyCompletedToday ? 'Done' : 'Active'}
            </span>
          </button>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Touch: Left Stick Move · Right Pad Fight</span>
        <span className="hidden sm:inline">
          Keyboard: WASD Move · J Punch · K Kick · L Block · U Special · Space Jump
        </span>
      </div>
    </div>
  );
};
