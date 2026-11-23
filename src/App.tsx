import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw, Smartphone } from 'lucide-react';
import { CharacterSelect } from './components/CharacterSelect';
import { DailyBountyModal } from './components/DailyBountyModal';
import { FightHud } from './components/FightHud';
import { FighterGallery } from './components/FighterGallery';
import { MainMenu } from './components/MainMenu';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { MatchRewardSummary, PauseModal, ResultModal } from './components/MatchModals';
import { OfflineIndicator } from './components/PWAInstallButton';
import { StageSelect } from './components/StageSelect';
import { TouchControls } from './components/TouchControls';
import { TournamentBracket } from './components/TournamentBracket';
import { combatAudio } from './game/audio';
import {
  evaluateBountyCondition,
  FIGHTER_SKINS,
  getDailyBountyForDate,
  getTodayDateKey,
  loadBountyProgress,
  saveBountyProgress,
} from './game/bounty';
import { KenseiGameEngine } from './game/engine';
import {
  advanceTournamentOnPlayerWin,
  createTournamentBracket,
  getActivePlayerMatch,
} from './game/tournament';
import {
  BountyProgressState,
  Difficulty,
  FIGHTER_ROSTER,
  FighterId,
  FighterSkinId,
  GameMode,
  HudSnapshot,
  MatchHistoryEntry,
  STAGE_ROSTER,
  StageId,
  TournamentState,
} from './game/types';

const STORAGE_ARCADE_LEVEL_KEY = 'kensei_arcade_level';
const STORAGE_MATCH_HISTORY_KEY = 'kensei_match_history';

function loadSavedArcadeLevel(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_ARCADE_LEVEL_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 1;
  } catch {
    return 1;
  }
}

function saveArcadeLevel(level: number): void {
  try {
    window.localStorage.setItem(STORAGE_ARCADE_LEVEL_KEY, String(Math.max(1, Math.min(100, level))));
  } catch {
    // Ignore storage restriction
  }
}

function loadMatchHistory(): MatchHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_MATCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10) as MatchHistoryEntry[];
  } catch {
    return [];
  }
}

function saveMatchHistory(entries: MatchHistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_MATCH_HISTORY_KEY, JSON.stringify(entries.slice(0, 10)));
  } catch {
    // Ignore storage restriction
  }
}

const INITIAL_HUD: HudSnapshot = {
  screen: 'menu',
  gameMode: 'versus',
  arcadeLevel: 1,
  p1Hp: 100,
  p1MaxHp: 100,
  p1Energy: 25,
  p1Rounds: 0,
  p1Combo: 0,
  p1Action: 'idle',
  p2Hp: 94,
  p2MaxHp: 94,
  p2Energy: 25,
  p2Rounds: 0,
  p2Combo: 0,
  p2Action: 'idle',
  timer: 99,
  roundNumber: 1,
  roundPhase: 'intro',
  bannerText: '',
  winner: null,
  matchStats: {
    damageDealt: 0,
    maxCombo: 0,
    blocksLanded: 0,
    specialsUsed: 0,
    elapsedSeconds: 0,
  },
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<KenseiGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [p1Id, setP1Id] = useState<FighterId>('ryujin');
  const [p2Id, setP2Id] = useState<FighterId>('valkyrie');
  const [stageId, setStageId] = useState<StageId>('temple');
  const [difficulty, setDifficulty] = useState<Difficulty>('challenger');
  const [gameMode, setGameMode] = useState<GameMode>('versus');
  const [savedArcadeLevel, setSavedArcadeLevel] = useState<number>(() => loadSavedArcadeLevel());
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>(() => loadMatchHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [bountyProgress, setBountyProgress] = useState<BountyProgressState>(() => loadBountyProgress());
  const [showBounty, setShowBounty] = useState(false);
  const [matchReward, setMatchReward] = useState<MatchRewardSummary | null>(null);
  const [galleryId, setGalleryId] = useState<FighterId>('ryujin');

  const [muted, setMuted] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissPortraitHint, setDismissPortraitHint] = useState(false);

  const keysHeld = useRef<Set<string>>(new Set());
  const recordedMatchRef = useRef(false);
  const bountyProgressRef = useRef<BountyProgressState>(bountyProgress);
  bountyProgressRef.current = bountyProgress;

  // Mount isolated Three.js engine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new KenseiGameEngine(
      container,
      (snapshot) => setHud(snapshot),
      (lost) => setContextLost(lost),
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Detect narrow portrait mobile viewport to offer gentle landscape recommendation
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth * 1.1 && window.innerWidth < 640;
      setIsPortraitMobile(portrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Sync fighter selection, stage, & difficulty with engine
  useEffect(() => {
    engineRef.current?.setSelectedFighters(p1Id, p2Id);
  }, [p1Id, p2Id]);

  useEffect(() => {
    engineRef.current?.setStage(stageId);
  }, [stageId]);

  useEffect(() => {
    engineRef.current?.setDifficulty(difficulty);
  }, [difficulty]);

  useEffect(() => {
    engineRef.current?.setPlayerSkin(bountyProgress.equippedSkin);
  }, [bountyProgress.equippedSkin]);

  // Automatically record match outcome and evaluate Daily Bounty rewards once when a fight finishes
  useEffect(() => {
    if (hud.screen === 'fighting') {
      recordedMatchRef.current = false;
      setShowHistory(false);
      setShowBounty(false);
      setMatchReward(null);
      return;
    }

    if (hud.screen === 'result' && hud.winner && !recordedMatchRef.current) {
      recordedMatchRef.current = true;
      const p1 = FIGHTER_ROSTER.find((f) => f.id === p1Id) || FIGHTER_ROSTER[0];
      const p2 = FIGHTER_ROSTER.find((f) => f.id === p2Id) || FIGHTER_ROSTER[1];
      const outcome: MatchHistoryEntry['outcome'] =
        hud.winner === 'p1' ? 'victory' : hud.winner === 'p2' ? 'defeat' : 'draw';

      const newEntry: MatchHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        playerFighterId: p1.id,
        playerName: p1.name,
        opponentId: p2.id,
        opponentName: p2.name,
        outcome,
        p1Rounds: hud.p1Rounds,
        p2Rounds: hud.p2Rounds,
        maxCombo: hud.matchStats.maxCombo,
        damageDealt: hud.matchStats.damageDealt,
        gameMode: hud.gameMode,
        arcadeLevel: hud.arcadeLevel,
      };

      setMatchHistory((prev) => {
        const next = [newEntry, ...prev].slice(0, 10);
        saveMatchHistory(next);
        return next;
      });

      if (hud.winner === 'p1') {
        const todayKey = getTodayDateKey();
        const todayBounty = getDailyBountyForDate(todayKey);
        const currentProgress = bountyProgressRef.current;
        const alreadyCompleted = currentProgress.completedDateKey === todayKey;
        const bountyDoneNow = !alreadyCompleted && evaluateBountyCondition(todayBounty, hud);

        const victoryGold = 40;
        const bountyGold = bountyDoneNow ? todayBounty.rewardGold : 0;
        const goldEarned = victoryGold + bountyGold;

        const isNewSkinUnlock =
          bountyDoneNow && !currentProgress.unlockedSkins.includes(todayBounty.rewardSkinId);
        const rewardSkin = FIGHTER_SKINS.find((s) => s.id === todayBounty.rewardSkinId);

        const nextUnlocked: FighterSkinId[] = bountyDoneNow
          ? (Array.from(new Set([...currentProgress.unlockedSkins, todayBounty.rewardSkinId])) as FighterSkinId[])
          : currentProgress.unlockedSkins;

        const nextProgress: BountyProgressState = {
          ...currentProgress,
          gold: currentProgress.gold + goldEarned,
          unlockedSkins: nextUnlocked,
          completedDateKey: bountyDoneNow ? todayKey : currentProgress.completedDateKey,
        };

        saveBountyProgress(nextProgress);
        setBountyProgress(nextProgress);
        setMatchReward({
          goldEarned,
          bountyJustCompleted: bountyDoneNow,
          bountyTitle: bountyDoneNow ? todayBounty.title : undefined,
          unlockedSkinName: isNewSkinUnlock && rewardSkin ? rewardSkin.name : undefined,
        });
      } else {
        setMatchReward(null);
      }
    }
  }, [
    hud,
    p1Id,
    p2Id,
  ]);

  const syncMovementFromKeys = useCallback(() => {
    const held = keysHeld.current;
    let mx = 0;
    let mz = 0;
    if (held.has('KeyA') || held.has('ArrowLeft')) mx -= 1;
    if (held.has('KeyD') || held.has('ArrowRight')) mx += 1;
    if (held.has('KeyW') || held.has('ArrowUp')) mz -= 1;
    if (held.has('KeyS') || held.has('ArrowDown')) mz += 1;
    engineRef.current?.setMoveVector(mx, mz);
    engineRef.current?.setBlock(
      held.has('KeyL') || held.has('KeyC') || held.has('ShiftLeft') || held.has('ShiftRight'),
    );
  }, []);

  // Full Keyboard Controls + Window Blur Input Reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (hud.screen === 'fighting' || hud.screen === 'paused') {
          engine.togglePause();
        }
        return;
      }

      if (e.code === 'Enter' && hud.screen === 'menu') {
        combatAudio.playUiClick();
        setGameMode('versus');
        engine.startMatch({ gameMode: 'versus', arcadeLevel: 1 });
        return;
      }

      if (hud.screen !== 'fighting') return;

      if (!e.repeat) {
        if (e.code === 'Space') {
          e.preventDefault();
          engine.triggerJump();
        } else if (e.code === 'KeyJ' || e.code === 'KeyZ') {
          engine.triggerPunch();
        } else if (e.code === 'KeyK' || e.code === 'KeyX') {
          engine.triggerKick();
        } else if (e.code === 'KeyU' || e.code === 'KeyV') {
          engine.triggerSpecial();
        }
      }

      keysHeld.current.add(e.code);
      syncMovementFromKeys();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
      syncMovementFromKeys();
    };

    const onBlur = () => {
      keysHeld.current.clear();
      engineRef.current?.clearInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [hud.screen, syncMovementFromKeys]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    combatAudio.setMuted(next);
    if (!next) {
      combatAudio.unlock();
      combatAudio.playUiClick();
    }
  };

  // Start specific level 1..100 in 100-Level Progressive Tower
  const startArcadeLevel = useCallback((level: number, playerFighter: FighterId) => {
    const clampedLevel = Math.max(1, Math.min(100, level));
    const opponents = FIGHTER_ROSTER.filter((f) => f.id !== playerFighter);
    const opponent = opponents[(clampedLevel - 1) % opponents.length];
    const nextStage = STAGE_ROSTER[(clampedLevel - 1) % STAGE_ROSTER.length].id;

    setGameMode('arcade100');
    setSavedArcadeLevel(clampedLevel);
    saveArcadeLevel(clampedLevel);
    setP1Id(playerFighter);
    setP2Id(opponent.id);
    setStageId(nextStage);

    engineRef.current?.setSelectedFighters(playerFighter, opponent.id);
    engineRef.current?.setStage(nextStage);
    engineRef.current?.startMatch({ gameMode: 'arcade100', arcadeLevel: clampedLevel });
  }, []);

  // Create and open an 8-fighter 3D knockout tournament
  const startNewTournament = useCallback((playerFighter: FighterId) => {
    const bracket = createTournamentBracket(playerFighter);
    setTournament(bracket);
    setGameMode('tournament');
    setP1Id(playerFighter);

    const active = getActivePlayerMatch(bracket);
    if (active) {
      const opp = active.p1 === playerFighter ? active.p2 : active.p1;
      if (opp) {
        setP2Id(opp);
        engineRef.current?.setSelectedFighters(playerFighter, opp);
      }
      setStageId(active.stageId);
      engineRef.current?.setStage(active.stageId);
    }

    engineRef.current?.setScreen('tournament');
  }, []);

  // Launch player's active tournament match in 3D
  const launchTournamentBout = useCallback(() => {
    if (!tournament) return;
    const active = getActivePlayerMatch(tournament);
    if (!active || !active.p1 || !active.p2) return;
    const opp = active.p1 === tournament.playerFighter ? active.p2 : active.p1;
    if (!opp) return;

    setGameMode('tournament');
    setP1Id(tournament.playerFighter);
    setP2Id(opp);
    setStageId(active.stageId);

    engineRef.current?.setSelectedFighters(tournament.playerFighter, opp);
    engineRef.current?.setStage(active.stageId);
    engineRef.current?.startMatch({
      gameMode: 'tournament',
      arcadeLevel: tournament.roundIndex + 1,
    });
  }, [tournament]);

  // Advance bracket on victory & return to live bracket screen
  const handleContinueTournament = useCallback(() => {
    if (!tournament) return;
    const updated = advanceTournamentOnPlayerWin(tournament);
    setTournament(updated);

    const nextBout = getActivePlayerMatch(updated);
    if (nextBout && nextBout.p1 && nextBout.p2) {
      const opp = nextBout.p1 === updated.playerFighter ? nextBout.p2 : nextBout.p1;
      if (opp) {
        setP2Id(opp);
        engineRef.current?.setSelectedFighters(updated.playerFighter, opp);
      }
      setStageId(nextBout.stageId);
      engineRef.current?.setStage(nextBout.stageId);
    }

    engineRef.current?.setScreen('tournament');
  }, [tournament]);

  const handleNextArcadeLevel = useCallback(() => {
    const nextLevel = Math.min(100, hud.arcadeLevel + 1);
    startArcadeLevel(nextLevel, p1Id);
  }, [hud.arcadeLevel, p1Id, startArcadeLevel]);

  const p1Spec = FIGHTER_ROSTER.find((f) => f.id === p1Id) || FIGHTER_ROSTER[0];
  const p2Spec = FIGHTER_ROSTER.find((f) => f.id === p2Id) || FIGHTER_ROSTER[1];
  const todayDateKey = getTodayDateKey();
  const todayBounty = getDailyBountyForDate(todayDateKey);
  const bountyCompletedToday = bountyProgress.completedDateKey === todayDateKey;

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#0b0e14]">
      {/* Isolated WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      <OfflineIndicator />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0e14] p-6 text-center">
          <p className="font-display text-2xl font-bold text-amber-400 uppercase">
            3D Graphics Context Suspended
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-300">
            Your device paused WebGL rendering. Tap below or reload to resume the arena.
          </p>
        </div>
      )}

      {/* Soft Landscape Orientation Recommendation on Narrow Portrait Phones */}
      {isPortraitMobile && !dismissPortraitHint && (
        <div className="fixed top-2 right-2 left-2 z-40 flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-[#111622]/95 px-3 py-2 text-xs text-slate-200 shadow-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0 text-amber-400" />
            <RotateCw className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>Rotate to landscape for best thumb controls</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissPortraitHint(true)}
            className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Screen 1: Main Menu, Match History & Daily Bounty Overlays */}
      {hud.screen === 'menu' && !showHistory && !showBounty && (
        <MainMenu
          difficulty={difficulty}
          muted={muted}
          savedArcadeLevel={savedArcadeLevel}
          historyCount={matchHistory.length}
          gold={bountyProgress.gold}
          bountyCompletedToday={bountyCompletedToday}
          onChangeDifficulty={(d) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setDifficulty(d);
          }}
          onToggleMute={handleToggleMute}
          onStartTower={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            startArcadeLevel(savedArcadeLevel, p1Id);
          }}
          onStartTournament={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            startNewTournament(p1Id);
          }}
          onQuickFight={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setGameMode('versus');
            engineRef.current?.startMatch({ gameMode: 'versus', arcadeLevel: 1 });
          }}
          onOpenSelect={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            engineRef.current?.setScreen('select');
          }}
          onOpenStage={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            engineRef.current?.setScreen('stage');
          }}
          onOpenHistory={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setShowHistory(true);
          }}
          onOpenGallery={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setGalleryId(p1Id);
            engineRef.current?.setGalleryFighter(p1Id);
            engineRef.current?.setScreen('gallery');
          }}
          onOpenBounty={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setShowBounty(true);
          }}
        />
      )}

      {/* Screen 1B: 3D Fighter Gallery */}
      {hud.screen === 'gallery' && (
        <FighterGallery
          selectedId={galleryId}
          onSelectFighter={(id) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setGalleryId(id);
            engineRef.current?.setGalleryFighter(id);
          }}
          onRotateModel={(delta) => engineRef.current?.rotateGalleryModel(delta)}
          onToggleAutoRotate={(auto) => {
            combatAudio.playUiClick();
            engineRef.current?.setGalleryAutoRotate(auto);
          }}
          onResetAngle={() => {
            combatAudio.playUiClick();
            engineRef.current?.resetGalleryAngle();
          }}
          onPreviewMove={(action) => engineRef.current?.previewGalleryMove(action)}
          onUseFighter={(id) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setP1Id(id);
            engineRef.current?.setSelectedFighters(id, p2Id);
            engineRef.current?.setScreen('select');
          }}
          onBack={() => {
            combatAudio.playUiClick();
            engineRef.current?.setSelectedFighters(p1Id, p2Id);
            engineRef.current?.setScreen('menu');
          }}
        />
      )}

      {hud.screen === 'menu' && showHistory && (
        <MatchHistoryModal
          entries={matchHistory}
          onClose={() => {
            combatAudio.playUiClick();
            setShowHistory(false);
          }}
          onClearHistory={() => {
            combatAudio.playUiClick();
            setMatchHistory([]);
            saveMatchHistory([]);
          }}
        />
      )}

      {hud.screen === 'menu' && showBounty && (
        <DailyBountyModal
          bounty={todayBounty}
          progress={bountyProgress}
          completedToday={bountyCompletedToday}
          onEquipSkin={(skinId) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            const next: BountyProgressState = { ...bountyProgress, equippedSkin: skinId };
            saveBountyProgress(next);
            setBountyProgress(next);
          }}
          onUnlockSkin={(skinId, price) => {
            if (bountyProgress.gold < price || bountyProgress.unlockedSkins.includes(skinId)) return;
            combatAudio.unlock();
            combatAudio.playUiClick();
            const next: BountyProgressState = {
              ...bountyProgress,
              gold: bountyProgress.gold - price,
              unlockedSkins: [...bountyProgress.unlockedSkins, skinId],
              equippedSkin: skinId,
            };
            saveBountyProgress(next);
            setBountyProgress(next);
          }}
          onClose={() => {
            combatAudio.playUiClick();
            setShowBounty(false);
          }}
        />
      )}

      {/* Screen 2: 12-Fighter 3D Selection */}
      {hud.screen === 'select' && (
        <CharacterSelect
          p1Id={p1Id}
          p2Id={p2Id}
          gameMode={gameMode}
          savedArcadeLevel={savedArcadeLevel}
          difficulty={difficulty}
          onSelectP1={(id) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setP1Id(id);
          }}
          onSelectP2={(id) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setP2Id(id);
          }}
          onChangeMode={(mode) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setGameMode(mode);
          }}
          onChangeDifficulty={(d) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setDifficulty(d);
          }}
          onBack={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('menu');
          }}
          onOpenStage={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            engineRef.current?.setScreen('stage');
          }}
          onStartMatch={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            if (gameMode === 'arcade100') {
              startArcadeLevel(savedArcadeLevel, p1Id);
            } else if (gameMode === 'tournament') {
              startNewTournament(p1Id);
            } else {
              engineRef.current?.startMatch({ gameMode: 'versus', arcadeLevel: 1 });
            }
          }}
        />
      )}

      {/* Screen 2B: Stage Selection */}
      {hud.screen === 'stage' && (
        <StageSelect
          stageId={stageId}
          onSelectStage={(id) => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            setStageId(id);
          }}
          onBack={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('select');
          }}
          onStartMatch={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            if (gameMode === 'arcade100') {
              startArcadeLevel(savedArcadeLevel, p1Id);
            } else if (gameMode === 'tournament') {
              startNewTournament(p1Id);
            } else {
              engineRef.current?.startMatch({ gameMode: 'versus', arcadeLevel: 1 });
            }
          }}
        />
      )}

      {/* Screen 2C: 8-Fighter 3D Knockout Tournament Bracket */}
      {hud.screen === 'tournament' && tournament && (
        <TournamentBracket
          tournament={tournament}
          onBack={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('menu');
          }}
          onStartNextBout={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            launchTournamentBout();
          }}
          onRestartTournament={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            startNewTournament(p1Id);
          }}
        />
      )}

      {/* Screen 3: Active Combat HUD + Multi-Touch Controls */}
      {(hud.screen === 'fighting' || hud.screen === 'paused') && (
        <>
          <FightHud
            hud={hud}
            p1Spec={p1Spec}
            p2Spec={p2Spec}
            muted={muted}
            onToggleMute={handleToggleMute}
            onTogglePause={() => {
              combatAudio.playUiClick();
              engineRef.current?.togglePause();
            }}
          />

          {hud.screen === 'fighting' && (
            <TouchControls
              energy={hud.p1Energy}
              specialName={p1Spec.specialName}
              onMove={(x, z) => engineRef.current?.setMoveVector(x, z)}
              onBlock={(active) => engineRef.current?.setBlock(active)}
              onJump={() => engineRef.current?.triggerJump()}
              onPunch={() => engineRef.current?.triggerPunch()}
              onKick={() => engineRef.current?.triggerKick()}
              onSpecial={() => engineRef.current?.triggerSpecial()}
            />
          )}
        </>
      )}

      {/* Screen 4: Pause Modal */}
      {hud.screen === 'paused' && (
        <PauseModal
          onResume={() => {
            combatAudio.playUiClick();
            engineRef.current?.togglePause();
          }}
          onRestart={() => {
            combatAudio.playUiClick();
            engineRef.current?.restartMatch();
          }}
          onSelectFighters={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('select');
          }}
          onSelectStage={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('stage');
          }}
          onMainMenu={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('menu');
          }}
        />
      )}

      {/* Screen 5: Victory / Defeat Result Modal */}
      {hud.screen === 'result' && (
        <ResultModal
          hud={hud}
          p1Spec={p1Spec}
          p2Spec={p2Spec}
          matchReward={matchReward}
          onRematch={() => {
            combatAudio.playUiClick();
            engineRef.current?.restartMatch();
          }}
          onNextLevel={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            handleNextArcadeLevel();
          }}
          onRestartTower={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            startArcadeLevel(1, p1Id);
          }}
          onContinueTournament={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            handleContinueTournament();
          }}
          onRestartTournament={() => {
            combatAudio.unlock();
            combatAudio.playUiClick();
            startNewTournament(p1Id);
          }}
          onSelectFighters={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('select');
          }}
          onSelectStage={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('stage');
          }}
          onMainMenu={() => {
            combatAudio.playUiClick();
            engineRef.current?.setScreen('menu');
          }}
        />
      )}
    </div>
  );
}
