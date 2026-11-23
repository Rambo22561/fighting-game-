import React, { useEffect, useState } from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { FighterSpec, HudSnapshot } from '../game/types';

interface FightHudProps {
  hud: HudSnapshot;
  p1Spec: FighterSpec;
  p2Spec: FighterSpec;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export const FightHud: React.FC<FightHudProps> = ({
  hud,
  p1Spec,
  p2Spec,
  muted,
  onToggleMute,
  onTogglePause,
}) => {
  const [p1Trail, setP1Trail] = useState(100);
  const [p2Trail, setP2Trail] = useState(100);

  const p1Pct = Math.max(0, Math.min(100, (hud.p1Hp / hud.p1MaxHp) * 100));
  const p2Pct = Math.max(0, Math.min(100, (hud.p2Hp / hud.p2MaxHp) * 100));

  useEffect(() => {
    const id = window.setTimeout(() => setP1Trail(p1Pct), 260);
    return () => clearTimeout(id);
  }, [p1Pct]);

  useEffect(() => {
    const id = window.setTimeout(() => setP2Trail(p2Pct), 260);
    return () => clearTimeout(id);
  }, [p2Pct]);

  const isBoss = hud.gameMode === 'arcade100' && hud.arcadeLevel % 10 === 0;
  const modeBadge =
    hud.gameMode === 'arcade100'
      ? `LV ${hud.arcadeLevel}/100${isBoss ? ' · BOSS' : ''}`
      : hud.gameMode === 'tournament'
        ? hud.arcadeLevel === 1
          ? 'QUARTERFINAL'
          : hud.arcadeLevel === 2
            ? 'SEMIFINAL'
            : 'GRAND FINAL'
        : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:px-6 sm:pt-4">
      {/* TOP COMBAT HUD BAR */}
      <div className="flex w-full items-start gap-2.5 sm:gap-4">
        {/* P1 LEFT BAR */}
        <div className="flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-base font-extrabold tracking-wide text-white uppercase sm:text-xl">
                {p1Spec.name}
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">You</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 1].map((idx) => (
                <span
                  key={idx}
                  className={`h-2.5 w-2.5 rotate-45 border ${
                    hud.p1Rounds > idx
                      ? 'border-amber-300 bg-amber-400'
                      : 'border-white/30 bg-slate-900/80'
                  }`}
                />
              ))}
              <span className="ml-1 font-mono-num text-xs font-bold text-slate-200">
                {hud.p1Hp}
              </span>
            </div>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-sm border border-white/25 bg-[#0b0e14]/90 sm:h-5">
            <div
              className="absolute inset-y-0 right-0 bg-amber-200/80 transition-all duration-300"
              style={{ width: `${p1Trail}%` }}
            />
            <div
              className={`absolute inset-y-0 right-0 transition-all duration-100 ${
                p1Pct <= 25 ? 'bg-red-500' : 'bg-gradient-to-l from-red-500 to-amber-500'
              }`}
              style={{ width: `${p1Pct}%` }}
            />
          </div>

          <div className="mt-1 flex items-center gap-2">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/90">
              <div
                className={`h-full transition-all duration-100 ${
                  hud.p1Energy >= 100 ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${hud.p1Energy}%` }}
              />
            </div>
            <span
              className={`font-mono-num text-[10px] font-bold ${
                hud.p1Energy >= 100 ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              {hud.p1Energy >= 100 ? 'SPECIAL READY' : `${hud.p1Energy}%`}
            </span>
          </div>
        </div>

        {/* CENTER TIMER & CONTROLS */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#111622]/90 text-slate-300 hover:text-white active:scale-95"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <div className="flex min-w-[60px] flex-col items-center rounded-lg border border-amber-400/40 bg-[#0b0e14]/95 px-2.5 py-0.5 sm:min-w-[70px]">
              <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                R{hud.roundNumber}
              </span>
              <span
                className={`font-mono-num text-xl leading-none font-bold sm:text-2xl ${
                  hud.timer <= 15 ? 'text-red-400' : 'text-white'
                }`}
              >
                {String(hud.timer).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={onTogglePause}
              aria-label="Pause game"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#111622]/90 text-slate-300 hover:text-white active:scale-95"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>

          {modeBadge && (
            <div
              className={`rounded-md border px-2 py-0.5 font-mono-num text-[10px] font-bold tracking-wider uppercase ${
                isBoss
                  ? 'border-red-400/60 bg-red-950/90 text-red-300'
                  : 'border-amber-400/35 bg-[#0b0e14]/90 text-amber-300'
              }`}
            >
              {modeBadge}
            </div>
          )}
        </div>

        {/* P2 / CPU RIGHT BAR */}
        <div className="flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="mr-1 font-mono-num text-xs font-bold text-slate-200">
                {hud.p2Hp}
              </span>
              {[0, 1].map((idx) => (
                <span
                  key={idx}
                  className={`h-2.5 w-2.5 rotate-45 border ${
                    hud.p2Rounds > idx
                      ? 'border-amber-300 bg-amber-400'
                      : 'border-white/30 bg-slate-900/80'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="hidden text-xs text-slate-400 sm:inline">CPU</span>
              <span className="font-display text-base font-extrabold tracking-wide text-white uppercase sm:text-xl">
                {p2Spec.name}
              </span>
            </div>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-sm border border-white/25 bg-[#0b0e14]/90 sm:h-5">
            <div
              className="absolute inset-y-0 left-0 bg-amber-200/80 transition-all duration-300"
              style={{ width: `${p2Trail}%` }}
            />
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-100 ${
                p2Pct <= 25 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${p2Pct}%` }}
            />
          </div>

          <div className="mt-1 flex items-center justify-end gap-2">
            <span className="font-mono-num text-[10px] font-bold text-slate-400">
              {hud.p2Energy}%
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/90">
              <div
                className={`ml-auto h-full transition-all duration-100 ${
                  hud.p2Energy >= 100 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${hud.p2Energy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* COMBO CALLOUTS & CENTER BANNER */}
      <div className="relative flex flex-1 items-center justify-between px-2">
        <div>
          {hud.p1Combo >= 2 && (
            <div className="rounded-md border border-amber-400/40 bg-[#0b0e14]/85 px-3 py-1">
              <span className="font-display text-2xl font-extrabold text-amber-400 italic sm:text-3xl">
                {hud.p1Combo} HIT
              </span>
              <span className="ml-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Combo
              </span>
            </div>
          )}
        </div>

        {hud.bannerText && (
          <div className="pointer-events-none flex flex-col items-center">
            <div className="rounded-lg border border-amber-400/50 bg-[#0b0e14]/90 px-8 py-2.5 shadow-2xl">
              <span className="font-display text-4xl font-extrabold tracking-widest text-amber-400 uppercase italic sm:text-6xl">
                {hud.bannerText}
              </span>
            </div>
          </div>
        )}

        <div>
          {hud.p2Combo >= 2 && (
            <div className="rounded-md border border-blue-400/40 bg-[#0b0e14]/85 px-3 py-1">
              <span className="font-display text-2xl font-extrabold text-blue-400 italic sm:text-3xl">
                {hud.p2Combo} HIT
              </span>
              <span className="ml-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Combo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
