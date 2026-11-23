import React, { useEffect, useState } from 'react';
import { Check, Clock, Coins, Lock, Sparkles, Target, X } from 'lucide-react';
import { FIGHTER_SKINS } from '../game/bounty';
import { BountyProgressState, DailyBountySpec, FighterSkinId } from '../game/types';

interface DailyBountyModalProps {
  bounty: DailyBountySpec;
  progress: BountyProgressState;
  completedToday: boolean;
  onEquipSkin: (skinId: FighterSkinId) => void;
  onUnlockSkin: (skinId: FighterSkinId, price: number) => void;
  onClose: () => void;
}

function formatHexColor(hexNum: number): string {
  return `#${hexNum.toString(16).padStart(6, '0')}`;
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export const DailyBountyModal: React.FC<DailyBountyModalProps> = ({
  bounty,
  progress,
  completedToday,
  onEquipSkin,
  onUnlockSkin,
  onClose,
}) => {
  const [resetIn, setResetIn] = useState<string>(() => getTimeUntilMidnight());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setResetIn(getTimeUntilMidnight());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const rewardSkin = FIGHTER_SKINS.find((s) => s.id === bounty.rewardSkinId) || FIGHTER_SKINS[1];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0b0e14]/82 p-3 sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-2xl border border-white/15 bg-[#111622] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-wider text-white uppercase">
                Daily Bounty &amp; Skins
              </h2>
              <p className="text-xs text-slate-400">
                Complete today&apos;s combat contract for Arena Gold &amp; 3D armor skins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-1.5">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-mono-num text-sm font-bold text-amber-300">
                {progress.gold} Gold
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Daily Bounty"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-slate-800/80 text-slate-200 transition-colors hover:border-amber-400/60 hover:text-white active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Today's Featured Bounty Card */}
          <div
            className={`rounded-xl border p-4 ${
              completedToday
                ? 'border-emerald-500/45 bg-emerald-500/10'
                : 'border-amber-400/45 bg-[#0b0e14]/90'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                      completedToday
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {completedToday ? 'Claimed Today' : 'Active Daily Contract'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Resets in {resetIn}
                  </span>
                </div>

                <h3 className="mt-1.5 font-display text-2xl font-extrabold tracking-wide text-white uppercase">
                  {bounty.title}
                </h3>
                <p className="mt-0.5 text-sm text-slate-200">{bounty.description}</p>
              </div>

              {/* Bounty Rewards Box */}
              <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-[#111622] px-3.5 py-2.5 sm:min-w-[210px]">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Bounty Rewards
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="font-mono-num">+{bounty.rewardGold} Arena Gold</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded border border-white/30"
                    style={{ backgroundColor: formatHexColor(rewardSkin.palette.primary) }}
                  />
                  <span>{rewardSkin.name} Skin</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-xs text-slate-400">
              <span>Qualifies in 1v1 Fight, 100-Level Tower, or Tournament matches.</span>
              <span className="font-semibold text-amber-300/90">Every match victory also pays +40 Gold</span>
            </div>
          </div>

          {/* 3D Fighter Skins Section */}
          <div className="mt-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-extrabold tracking-wider text-white uppercase">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Special 3D Fighter Skins
              </h3>
              <span className="font-mono-num text-xs text-slate-400">
                {progress.unlockedSkins.length} / {FIGHTER_SKINS.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {FIGHTER_SKINS.map((skin) => {
                const isUnlocked = progress.unlockedSkins.includes(skin.id);
                const isEquipped = progress.equippedSkin === skin.id;
                const canAfford = progress.gold >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-colors ${
                      isEquipped
                        ? 'border-amber-400/70 bg-amber-500/10'
                        : isUnlocked
                          ? 'border-white/15 bg-[#0b0e14]/85'
                          : 'border-white/10 bg-[#0b0e14]/55'
                    }`}
                  >
                    <div>
                      {/* 3-Color 3D Palette Swatch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span
                            className="h-5 w-5 rounded border border-white/25"
                            style={{ backgroundColor: formatHexColor(skin.palette.primary) }}
                          />
                          <span
                            className="h-5 w-5 rounded border border-white/25"
                            style={{ backgroundColor: formatHexColor(skin.palette.metal) }}
                          />
                          <span
                            className="h-5 w-5 rounded border border-white/25"
                            style={{ backgroundColor: formatHexColor(skin.palette.energy) }}
                          />
                        </div>

                        {isEquipped ? (
                          <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                            <Check className="h-3 w-3" />
                            Equipped
                          </span>
                        ) : isUnlocked ? (
                          <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                            Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 font-mono-num text-[10px] font-bold text-slate-300">
                            <Lock className="h-3 w-3 text-amber-400" />
                            {skin.price} Gold
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 font-display text-lg font-bold tracking-wide text-white uppercase">
                        {skin.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-400">{skin.subtitle}</p>
                    </div>

                    <div className="mt-3">
                      {isEquipped ? (
                        <button
                          type="button"
                          disabled
                          className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200 uppercase"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Active on 3D Model
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onEquipSkin(skin.id)}
                          className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white uppercase transition-colors hover:bg-amber-500 hover:text-slate-950 active:scale-95"
                        >
                          Equip Skin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockSkin(skin.id, skin.price)}
                          className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                              : 'cursor-not-allowed border border-white/10 bg-slate-900 text-slate-500'
                          }`}
                        >
                          <Coins className="h-3.5 w-3.5" />
                          {canAfford ? `Unlock · ${skin.price} Gold` : `Need ${skin.price} Gold`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
