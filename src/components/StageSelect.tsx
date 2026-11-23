import React from 'react';
import { ArrowLeft, MapPin, Swords } from 'lucide-react';
import { STAGE_ROSTER, StageId } from '../game/types';

interface StageSelectProps {
  stageId: StageId;
  onSelectStage: (id: StageId) => void;
  onBack: () => void;
  onStartMatch: () => void;
}

export const StageSelect: React.FC<StageSelectProps> = ({
  stageId,
  onSelectStage,
  onBack,
  onStartMatch,
}) => {
  const activeStage = STAGE_ROSTER.find((s) => s.id === stageId) || STAGE_ROSTER[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP BAR */}
      <div className="pointer-events-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-[#111622]/92 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Fighters
        </button>

        <div className="rounded-xl border border-white/15 bg-[#111622]/92 px-4 py-2 text-center">
          <span className="font-display text-lg font-extrabold tracking-wider text-white uppercase sm:text-xl">
            Select Arena
          </span>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-white/15 bg-[#111622]/92 px-3.5 py-2 text-xs text-slate-300 sm:flex">
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
          <span>{activeStage.location}</span>
        </div>
      </div>

      {/* UNOBSTRUCTED LIVE 3D STAGE PREVIEW IN CENTER */}
      <div className="pointer-events-none my-auto" />

      {/* BOTTOM UNIFIED STAGE SELECTOR DOCK */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-2.5 rounded-2xl border border-white/15 bg-[#0b0e14]/92 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-3.5">
        {/* 3 Stage Cards */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-1 sm:items-center">
          {STAGE_ROSTER.map((stage) => {
            const selected = stage.id === stageId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelectStage(stage.id)}
                className={`flex min-h-[54px] flex-1 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-colors ${
                  selected
                    ? 'border-amber-400 bg-slate-800/95'
                    : 'border-white/12 bg-slate-900/80 hover:border-white/30'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1.5">
                  <span className="font-display text-sm font-bold tracking-wide text-white uppercase sm:text-base">
                    {stage.name}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.accentHex }}
                  />
                </div>
                <span className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-[11px]">
                  {stage.timeOfDay}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Details */}
        <div className="hidden flex-col justify-center border-l border-white/10 pl-4 md:flex md:w-52">
          <div className="font-display text-base font-bold text-amber-400 uppercase">
            {activeStage.name}
          </div>
          <div className="text-[11px] leading-snug text-slate-300">{activeStage.subtitle}</div>
        </div>

        {/* Start Match CTA */}
        <button
          type="button"
          onClick={onStartMatch}
          className="flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-display text-lg font-extrabold tracking-wider text-white uppercase shadow-lg transition-transform hover:bg-red-500 active:scale-95 whitespace-nowrap"
        >
          <Swords className="h-5 w-5" />
          Fight Here
        </button>
      </div>
    </div>
  );
};
