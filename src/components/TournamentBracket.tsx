import React from 'react';
import { ArrowLeft, Crown, RotateCcw, Swords, Trophy } from 'lucide-react';
import { FIGHTER_ROSTER, FighterId, TournamentMatch, TournamentState } from '../game/types';

interface TournamentBracketProps {
  tournament: TournamentState;
  onBack: () => void;
  onStartNextBout: () => void;
  onRestartTournament: () => void;
}

const getFighter = (id: FighterId | null) =>
  id ? FIGHTER_ROSTER.find((f) => f.id === id) || null : null;

const MatchSlotCard: React.FC<{
  match: TournamentMatch;
  playerId: FighterId;
  isActiveBout: boolean;
}> = ({ match, playerId, isActiveBout }) => {
  const f1 = getFighter(match.p1);
  const f2 = getFighter(match.p2);

  const renderFighterRow = (f: ReturnType<typeof getFighter>, isWinner: boolean) => {
    const isPlayer = f?.id === playerId;
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs ${
          isWinner
            ? 'bg-amber-500/20 font-bold text-amber-200'
            : isPlayer
              ? 'bg-red-500/15 font-semibold text-white'
              : 'text-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: f ? f.palette.uiAccent : '#475569' }}
          />
          <span className="truncate font-display tracking-wide uppercase">
            {f ? f.name : 'TBD'}
          </span>
          {isPlayer && <span className="text-[10px] text-red-400">(YOU)</span>}
        </div>
        {isWinner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-1.5 ${
        isActiveBout
          ? 'border-amber-400 bg-[#161b26] shadow-lg'
          : 'border-white/12 bg-[#0b0e14]/90'
      }`}
    >
      {renderFighterRow(f1, !!match.winner && match.winner === match.p1)}
      <div className="h-px bg-white/10" />
      {renderFighterRow(f2, !!match.winner && match.winner === match.p2)}
    </div>
  );
};

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onBack,
  onStartNextBout,
  onRestartTournament,
}) => {
  const isChampion = tournament.roundIndex >= 3 && tournament.champion === tournament.playerFighter;
  const roundLabel =
    tournament.roundIndex === 0
      ? 'Quarterfinals'
      : tournament.roundIndex === 1
        ? 'Semifinals'
        : tournament.roundIndex === 2
          ? 'Grand Final'
          : 'Champion';

  const activeBoutId =
    tournament.roundIndex === 0
      ? tournament.qf.find((m) => m.p1 === tournament.playerFighter || m.p2 === tournament.playerFighter)?.id
      : tournament.roundIndex === 1
        ? tournament.sf.find((m) => m.p1 === tournament.playerFighter || m.p2 === tournament.playerFighter)?.id
        : tournament.roundIndex === 2
          ? tournament.final.id
          : null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex flex-col justify-between bg-[#0b0e14]/82 p-3 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-[#111622] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-[#111622] px-4 py-1.5">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="font-display text-lg font-extrabold tracking-wider text-white uppercase sm:text-xl">
            Grand Tournament · {roundLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onRestartTournament}
          className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111622] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/30 hover:text-white active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Bracket</span>
        </button>
      </div>

      {/* 3-Column 8-Fighter Bracket Grid */}
      <div className="my-auto mx-auto grid w-full max-w-4xl grid-cols-3 items-center gap-3 sm:gap-5">
        {/* Column 1: Quarterfinals */}
        <div className="flex flex-col gap-2">
          <div className="text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Quarterfinals
          </div>
          {tournament.qf.map((m) => (
            <MatchSlotCard
              key={m.id}
              match={m}
              playerId={tournament.playerFighter}
              isActiveBout={m.id === activeBoutId}
            />
          ))}
        </div>

        {/* Column 2: Semifinals */}
        <div className="flex flex-col justify-around gap-8">
          <div className="text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Semifinals
          </div>
          {tournament.sf.map((m) => (
            <MatchSlotCard
              key={m.id}
              match={m}
              playerId={tournament.playerFighter}
              isActiveBout={m.id === activeBoutId}
            />
          ))}
        </div>

        {/* Column 3: Grand Final & Trophy */}
        <div className="flex flex-col items-stretch justify-center gap-3">
          <div className="text-center text-[10px] font-bold tracking-widest text-amber-400 uppercase">
            Grand Final
          </div>
          <MatchSlotCard
            match={tournament.final}
            playerId={tournament.playerFighter}
            isActiveBout={tournament.final.id === activeBoutId}
          />
          {isChampion && (
            <div className="rounded-xl border border-amber-400/60 bg-amber-500/15 p-3 text-center">
              <Crown className="mx-auto h-6 w-6 text-amber-400" />
              <div className="mt-1 font-display text-xl font-extrabold tracking-wider text-amber-300 uppercase">
                Champion!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-center gap-3">
        {isChampion ? (
          <button
            type="button"
            onClick={onRestartTournament}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-amber-500 px-8 py-2.5 font-display text-xl font-extrabold tracking-wider text-slate-950 uppercase shadow-lg hover:bg-amber-400 active:scale-95"
          >
            <Trophy className="h-5 w-5" />
            Play New Tournament
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartNextBout}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-red-600 px-8 py-2.5 font-display text-xl font-extrabold tracking-wider text-white uppercase shadow-lg hover:bg-red-500 active:scale-95"
          >
            <Swords className="h-5 w-5" />
            Fight {roundLabel}
          </button>
        )}
      </div>
    </div>
  );
};
