import { FIGHTER_ROSTER, FighterId, STAGE_ROSTER, TournamentMatch, TournamentState } from './types';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createTournamentBracket(playerFighter: FighterId): TournamentState {
  const others = shuffle(FIGHTER_ROSTER.filter((f) => f.id !== playerFighter)).slice(0, 7);
  const participants: FighterId[] = [playerFighter, ...others.map((f) => f.id)];
  const stages = STAGE_ROSTER.map((s) => s.id);

  const qf: TournamentMatch[] = [
    { id: 'QF1', p1: participants[0], p2: participants[1], winner: null, stageId: stages[0] },
    { id: 'QF2', p1: participants[2], p2: participants[3], winner: null, stageId: stages[1] },
    { id: 'QF3', p1: participants[4], p2: participants[5], winner: null, stageId: stages[2] },
    { id: 'QF4', p1: participants[6], p2: participants[7], winner: null, stageId: stages[0] },
  ];

  const sf: TournamentMatch[] = [
    { id: 'SF1', p1: null, p2: null, winner: null, stageId: stages[1] },
    { id: 'SF2', p1: null, p2: null, winner: null, stageId: stages[2] },
  ];

  const final: TournamentMatch = {
    id: 'FINAL',
    p1: null,
    p2: null,
    winner: null,
    stageId: stages[0],
  };

  return {
    playerFighter,
    roundIndex: 0,
    qf,
    sf,
    final,
    champion: null,
  };
}

function pickAiWinner(a: FighterId, b: FighterId): FighterId {
  const specA = FIGHTER_ROSTER.find((f) => f.id === a);
  const specB = FIGHTER_ROSTER.find((f) => f.id === b);
  const scoreA = (specA ? specA.stats.power + specA.stats.speed : 14) + Math.random() * 5;
  const scoreB = (specB ? specB.stats.power + specB.stats.speed : 14) + Math.random() * 5;
  return scoreA >= scoreB ? a : b;
}

export function getActivePlayerMatch(state: TournamentState): TournamentMatch | null {
  const p = state.playerFighter;
  if (state.roundIndex === 0) {
    return state.qf.find((m) => m.p1 === p || m.p2 === p) || null;
  }
  if (state.roundIndex === 1) {
    return state.sf.find((m) => m.p1 === p || m.p2 === p) || null;
  }
  if (state.roundIndex === 2) {
    return state.final.p1 === p || state.final.p2 === p ? state.final : null;
  }
  return null;
}

export function advanceTournamentOnPlayerWin(state: TournamentState): TournamentState {
  const next: TournamentState = {
    ...state,
    qf: state.qf.map((m) => ({ ...m })),
    sf: state.sf.map((m) => ({ ...m })),
    final: { ...state.final },
  };
  const p = next.playerFighter;

  if (next.roundIndex === 0) {
    // Player wins QF1, simulate QF2..QF4
    next.qf.forEach((m) => {
      if (m.p1 === p || m.p2 === p) {
        m.winner = p;
      } else if (m.p1 && m.p2) {
        m.winner = pickAiWinner(m.p1, m.p2);
      }
    });
    next.sf[0].p1 = next.qf[0].winner;
    next.sf[0].p2 = next.qf[1].winner;
    next.sf[1].p1 = next.qf[2].winner;
    next.sf[1].p2 = next.qf[3].winner;
    next.roundIndex = 1;
  } else if (next.roundIndex === 1) {
    next.sf.forEach((m) => {
      if (m.p1 === p || m.p2 === p) {
        m.winner = p;
      } else if (m.p1 && m.p2) {
        m.winner = pickAiWinner(m.p1, m.p2);
      }
    });
    next.final.p1 = next.sf[0].winner;
    next.final.p2 = next.sf[1].winner;
    next.roundIndex = 2;
  } else if (next.roundIndex === 2) {
    next.final.winner = p;
    next.champion = p;
    next.roundIndex = 3;
  }

  return next;
}
