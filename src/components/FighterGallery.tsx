import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Play,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Swords,
} from 'lucide-react';
import { FIGHTER_ROSTER, FighterActionState, FighterId } from '../game/types';

interface FighterGalleryProps {
  selectedId: FighterId;
  onSelectFighter: (id: FighterId) => void;
  onRotateModel: (deltaYaw: number) => void;
  onToggleAutoRotate: (auto: boolean) => void;
  onResetAngle: () => void;
  onPreviewMove: (action: FighterActionState) => void;
  onUseFighter: (id: FighterId) => void;
  onBack: () => void;
}

type GalleryTab = 'lore' | 'moves' | 'poses';

export const FighterGallery: React.FC<FighterGalleryProps> = ({
  selectedId,
  onSelectFighter,
  onRotateModel,
  onToggleAutoRotate,
  onResetAngle,
  onPreviewMove,
  onUseFighter,
  onBack,
}) => {
  const [tab, setTab] = useState<GalleryTab>('lore');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const currentIdx = Math.max(
    0,
    FIGHTER_ROSTER.findIndex((f) => f.id === selectedId),
  );
  const fighter = FIGHTER_ROSTER[currentIdx] || FIGHTER_ROSTER[0];

  const handleCycle = (dir: -1 | 1) => {
    const nextIdx = (currentIdx + dir + FIGHTER_ROSTER.length) % FIGHTER_ROSTER.length;
    onSelectFighter(FIGHTER_ROSTER[nextIdx].id);
  };

  const handleToggleSpin = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    onToggleAutoRotate(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic event capture failure
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    if (Math.abs(dx) > 0.2) {
      onRotateModel(dx * 0.012);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  const poseButtons: { label: string; action: FighterActionState }[] = [
    { label: 'Idle', action: 'idle' },
    { label: 'Jab', action: 'punch_1' },
    { label: 'Cross', action: 'punch_2' },
    { label: 'Uppercut', action: 'punch_3' },
    { label: 'Kick', action: 'kick' },
    { label: 'Special', action: 'special' },
    { label: 'Guard', action: 'block' },
    { label: 'Victory', action: 'victory' },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* TOP BAR */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111622]/94 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </button>

        {/* Center Hero Nameplate */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-[#111622]/92 px-3.5 py-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: fighter.palette.uiAccent }}
          />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg leading-none font-extrabold tracking-wide text-white uppercase sm:text-xl">
                {fighter.name}
              </span>
              <span className="rounded border border-emerald-400/35 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                Unlocked
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {fighter.title} · {fighter.style}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSpin}
            className={`hidden min-h-[42px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:flex ${
              autoRotate
                ? 'border-amber-400/60 bg-amber-500/15 text-amber-300'
                : 'border-white/15 bg-[#111622]/94 text-slate-300 hover:text-white'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {autoRotate ? 'Auto Spin On' : 'Auto Spin Off'}
          </button>

          <button
            type="button"
            onClick={() => onUseFighter(fighter.id)}
            className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 font-display text-sm font-extrabold tracking-wider text-white uppercase shadow-lg transition-transform hover:bg-red-500 active:scale-95 whitespace-nowrap sm:text-base"
          >
            <Swords className="h-4 w-4" />
            Select Fighter
          </button>
        </div>
      </div>

      {/* UNOBSTRUCTED DRAG-TO-ROTATE 3D VIEWPORT */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pointer-events-auto relative flex flex-1 cursor-grab touch-none items-end justify-center pb-2 active:cursor-grabbing"
      >
        <span className="pointer-events-none rounded-md border border-white/10 bg-[#0b0e14]/70 px-2.5 py-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
          Drag to rotate 3D model · {currentIdx + 1} / {FIGHTER_ROSTER.length} Unlocked
        </span>
      </div>

      {/* COLLAPSIBLE BOTTOM GALLERY DOCK */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="flex min-h-[30px] items-center gap-1.5 rounded-t-xl border border-b-0 border-white/15 bg-[#0b0e14]/95 px-4 py-1 text-[11px] font-bold tracking-wider text-slate-300 uppercase hover:text-white"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
              Show Fighter Info
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
              Hide Info
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full rounded-2xl border border-white/15 bg-[#0b0e14]/95 p-2.5 shadow-2xl sm:p-3.5">
            {/* Row 1: 12-Fighter Switcher Strip + Tab Selector */}
            <div className="flex flex-col gap-2 border-b border-white/10 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleCycle(-1)}
                  aria-label="Previous fighter"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
                  {FIGHTER_ROSTER.map((item) => {
                    const active = item.id === fighter.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectFighter(item.id)}
                        className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                          active
                            ? 'border-amber-400 bg-slate-800 text-white'
                            : 'border-white/10 bg-slate-900/75 text-slate-400 hover:border-white/25 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.palette.uiAccent }}
                        />
                        <span className="font-display tracking-wide uppercase">{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleCycle(1)}
                  aria-label="Next fighter"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/12 bg-[#111622] p-1">
                <button
                  type="button"
                  onClick={() => setTab('lore')}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    tab === 'lore'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Lore & Stats
                </button>
                <button
                  type="button"
                  onClick={() => setTab('moves')}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    tab === 'moves'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Swords className="h-3.5 w-3.5" />
                  Move Set
                </button>
                <button
                  type="button"
                  onClick={() => setTab('poses')}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    tab === 'poses'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  3D Poses
                </button>
              </div>
            </div>

            {/* Row 2: Active Tab Content */}
            <div className="mt-2.5 max-h-[168px] overflow-y-auto pr-1 sm:max-h-[155px]">
              {tab === 'lore' && (
                <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-400 uppercase">
                      <span>{fighter.origin}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-sky-300">Special: {fighter.specialName}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                      {fighter.lore}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2 rounded-xl border border-white/10 bg-[#111622] p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Base Vitality
                      </span>
                      <span className="font-mono-num font-bold text-white">{fighter.maxHp} HP</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                      <div>
                        <div className="flex justify-between">
                          <span>PWR</span>
                          <span className="font-mono-num font-bold text-white">
                            {fighter.stats.power}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${fighter.stats.power * 10}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <span>SPD</span>
                          <span className="font-mono-num font-bold text-white">
                            {fighter.stats.speed}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${fighter.stats.speed * 10}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <span>RNG</span>
                          <span className="font-mono-num font-bold text-white">
                            {fighter.stats.range}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${fighter.stats.range * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'moves' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {fighter.moves.map((move) => (
                    <button
                      key={move.name}
                      type="button"
                      onClick={() => onPreviewMove(move.action)}
                      className="flex flex-col justify-between rounded-xl border border-white/12 bg-[#111622] p-2.5 text-left transition-colors hover:border-amber-400/60 hover:bg-slate-900 active:scale-98"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display text-base leading-tight font-bold tracking-wide text-white uppercase">
                            {move.name}
                          </div>
                          <div className="mt-0.5 text-[10px] font-semibold text-amber-400">
                            {move.input} · {move.damageNote}
                          </div>
                        </div>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-800 text-amber-300">
                          <Play className="h-3 w-3 fill-current" />
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                        {move.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {tab === 'poses' && (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {poseButtons.map((pose) => (
                      <button
                        key={pose.action}
                        type="button"
                        onClick={() => onPreviewMove(pose.action)}
                        className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111622] px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-amber-400/60 hover:text-white active:scale-95"
                      >
                        <Play className="h-3 w-3 text-amber-400" />
                        {pose.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSpin}
                      className={`flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors sm:hidden ${
                        autoRotate
                          ? 'border-amber-400/60 bg-amber-500/15 text-amber-300'
                          : 'border-white/15 bg-[#111622] text-slate-300'
                      }`}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      {autoRotate ? 'Spin On' : 'Spin Off'}
                    </button>
                    <button
                      type="button"
                      onClick={onResetAngle}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111622] px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Angle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
