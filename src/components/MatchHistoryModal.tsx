import React from 'react';
import { History, Swords, Trash2, Trophy, X } from 'lucide-react';
import { FIGHTER_ROSTER, MatchHistoryEntry } from '../game/types';

interface MatchHistoryModalProps {
  entries: MatchHistoryEntry[];
  onClose: () => void;
  onClearHistory: () => void;
}

function formatModeLabel(entry: MatchHistoryEntry): string {
  if (entry.gameMode === 'arcade100') {
    return `Tower Lv.${entry.arcadeLevel ?? 1}`;
  }
  if (entry.gameMode === 'tournament') {
    const r = entry.arcadeLevel ?? 1;
    return r === 1 ? 'Cup QF' : r === 2 ? 'Cup SF' : 'Cup Final';
  }
  return '1v1 Versus';
}

function formatTimeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  entries,
  onClose,
  onClearHistory,
}) => {
  const wins = entries.filter((e) => e.outcome === 'victory').length;
  const losses = entries.filter((e) => e.outcome === 'defeat').length;
  const bestCombo = entries.reduce((max, e) => Math.max(max, e.maxCombo), 0);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#0b0e14]/88 p-3 sm:p-5">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111622] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl leading-none font-extrabold tracking-wider text-white uppercase">
                Match History
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Last {entries.length} of 10 recent fights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                aria-label="Clear match history"
                className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-red-400/50 hover:text-red-300 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close match history"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-900/90 text-slate-200 transition-colors hover:border-white/30 hover:text-white active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-[#0b0e14]/70 px-4 py-2.5 text-center sm:px-5">
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Wins
              </div>
              <div className="font-mono-num text-base font-bold text-amber-400">{wins}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Losses
              </div>
              <div className="font-mono-num text-base font-bold text-red-400">{losses}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Best Combo
              </div>
              <div className="font-mono-num text-base font-bold text-sky-400">
                {bestCombo} HIT
              </div>
            </div>
          </div>
        )}

        {/* Match List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-500">
                <Swords className="h-6 w-6" />
              </div>
              <p className="mt-3 font-display text-xl font-bold tracking-wide text-slate-200 uppercase">
                No Matches Recorded Yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Complete any fight in 1v1, 100-Level Tower, or Tournament to see your last 10 results here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, idx) => {
                const oppSpec = FIGHTER_ROSTER.find((f) => f.id === entry.opponentId);
                const isWin = entry.outcome === 'victory';
                const isDraw = entry.outcome === 'draw';

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0e14]/85 px-3 py-2.5 sm:px-4"
                  >
                    {/* Left: Index + Opponent & Fighter Info */}
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono-num w-4 shrink-0 text-xs font-semibold text-slate-500">
                        {idx + 1}.
                      </span>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-white/25"
                        style={{ backgroundColor: oppSpec?.palette.uiAccent ?? '#94a3b8' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display text-base font-extrabold tracking-wide text-white uppercase sm:text-lg">
                            vs {entry.opponentName}
                          </span>
                          <span className="hidden rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 uppercase sm:inline">
                            {formatModeLabel(entry)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>As {entry.playerName}</span>
                          <span>·</span>
                          <span className="font-mono-num">
                            {entry.p1Rounds}-{entry.p2Rounds}
                          </span>
                          <span>·</span>
                          <span>{formatTimeAgo(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Max Combo & Outcome */}
                    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <div className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                          Max Combo
                        </div>
                        <div className="font-mono-num text-sm font-bold text-amber-400">
                          {entry.maxCombo} HIT
                        </div>
                      </div>

                      <div
                        className={`flex min-w-[82px] items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 font-display text-sm font-extrabold tracking-wider uppercase ${
                          isWin
                            ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                            : isDraw
                              ? 'border-white/20 bg-slate-800 text-slate-200'
                              : 'border-red-500/40 bg-red-500/15 text-red-400'
                        }`}
                      >
                        {isWin && <Trophy className="h-3.5 w-3.5" />}
                        {isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/10 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[42px] items-center justify-center rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-slate-700 active:scale-95"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
