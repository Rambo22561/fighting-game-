import {
  BountyProgressState,
  DailyBountySpec,
  FighterSkinId,
  FighterSkinSpec,
  FighterSpec,
  HudSnapshot,
} from './types';

const STORAGE_BOUNTY_KEY = 'kensei_bounty_progress';

export const FIGHTER_SKINS: FighterSkinSpec[] = [
  {
    id: 'default',
    name: 'Classic Master',
    subtitle: 'Signature warrior colors',
    price: 0,
    palette: {
      primary: 0xb91c1c,
      secondary: 0x1e293b,
      accent: 0xf59e0b,
      metal: 0xd4af37,
      energy: 0xff7b00,
      uiAccent: '#f59e0b',
    },
  },
  {
    id: 'gold_sovereign',
    name: 'Gilded Sovereign',
    subtitle: 'Imperial white cloth & polished 24K gold armor',
    price: 380,
    palette: {
      primary: 0xf1f5f9,
      secondary: 0x292524,
      accent: 0xfbbf24,
      metal: 0xfde047,
      energy: 0xfbbf24,
      uiAccent: '#fbbf24',
    },
  },
  {
    id: 'obsidian_eclipse',
    name: 'Obsidian Eclipse',
    subtitle: 'Matte midnight armor with astral violet energy',
    price: 400,
    palette: {
      primary: 0x18181b,
      secondary: 0x09090b,
      accent: 0xc084fc,
      metal: 0x94a3b8,
      energy: 0xa855f7,
      uiAccent: '#a855f7',
    },
  },
  {
    id: 'cyber_plasma',
    name: 'Plasma Surge',
    subtitle: 'Deep cobalt plating with arc-cyan lightning aura',
    price: 360,
    palette: {
      primary: 0x0f172a,
      secondary: 0x1e3a8a,
      accent: 0x22d3ee,
      metal: 0xe2e8f0,
      energy: 0x38bdf8,
      uiAccent: '#38bdf8',
    },
  },
  {
    id: 'crimson_inferno',
    name: 'Solar Inferno',
    subtitle: 'Blazing magma scarlet with volcanic ember trim',
    price: 420,
    palette: {
      primary: 0x991b1b,
      secondary: 0x1c1917,
      accent: 0xf97316,
      metal: 0xf59e0b,
      energy: 0xff5a14,
      uiAccent: '#f97316',
    },
  },
  {
    id: 'emerald_jade',
    name: 'Jade Dragon',
    subtitle: 'Sanctuary jade tunic with bronze crest metalwork',
    price: 350,
    palette: {
      primary: 0x065f46,
      secondary: 0x0f172a,
      accent: 0x34d399,
      metal: 0xd97706,
      energy: 0x10b981,
      uiAccent: '#10b981',
    },
  },
];

const BOUNTY_POOL: Omit<DailyBountySpec, 'id' | 'dateKey'>[] = [
  {
    title: 'Iron Resolve',
    description: 'Win any match with at least 50% health remaining.',
    condition: 'win_min_hp_50',
    rewardGold: 250,
    rewardSkinId: 'gold_sovereign',
  },
  {
    title: 'Combo Virtuoso',
    description: 'Win any match after landing a 4+ hit combo streak.',
    condition: 'win_combo_4',
    rewardGold: 220,
    rewardSkinId: 'cyber_plasma',
  },
  {
    title: 'Unbreakable Guard',
    description: 'Win any match while blocking at least 3 enemy attacks.',
    condition: 'win_blocks_3',
    rewardGold: 210,
    rewardSkinId: 'obsidian_eclipse',
  },
  {
    title: 'Special Finisher',
    description: 'Win any match after unleashing at least 2 Special attacks.',
    condition: 'win_specials_2',
    rewardGold: 240,
    rewardSkinId: 'crimson_inferno',
  },
  {
    title: 'Blitz Victory',
    description: 'Win any match in under 45 seconds of active combat.',
    condition: 'win_under_45s',
    rewardGold: 260,
    rewardSkinId: 'emerald_jade',
  },
  {
    title: 'Dominant Champion',
    description: 'Win any match dealing 200+ damage with 60%+ health left.',
    condition: 'win_heavy_flawless',
    rewardGold: 300,
    rewardSkinId: 'gold_sovereign',
  },
];

export function getTodayDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyBountyForDate(dateKey = getTodayDateKey()): DailyBountySpec {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const template = BOUNTY_POOL[hash % BOUNTY_POOL.length];
  return {
    id: `${dateKey}-${template.condition}`,
    dateKey,
    ...template,
  };
}

export function evaluateBountyCondition(bounty: DailyBountySpec, hud: HudSnapshot): boolean {
  if (hud.winner !== 'p1') return false;
  const hpRatio = hud.p1MaxHp > 0 ? hud.p1Hp / hud.p1MaxHp : 0;

  switch (bounty.condition) {
    case 'win_min_hp_50':
      return hpRatio >= 0.5;
    case 'win_combo_4':
      return hud.matchStats.maxCombo >= 4;
    case 'win_blocks_3':
      return hud.matchStats.blocksLanded >= 3;
    case 'win_specials_2':
      return hud.matchStats.specialsUsed >= 2;
    case 'win_under_45s':
      return hud.matchStats.elapsedSeconds > 0 && hud.matchStats.elapsedSeconds <= 45;
    case 'win_heavy_flawless':
      return hud.matchStats.damageDealt >= 200 && hpRatio >= 0.6;
  }
}

export function applySkinToFighterSpec(spec: FighterSpec, skinId: FighterSkinId): FighterSpec {
  if (skinId === 'default') return spec;
  const skin = FIGHTER_SKINS.find((s) => s.id === skinId);
  if (!skin) return spec;
  return {
    ...spec,
    palette: {
      ...spec.palette,
      primary: skin.palette.primary,
      secondary: skin.palette.secondary,
      accent: skin.palette.accent,
      metal: skin.palette.metal,
      energy: skin.palette.energy,
      uiAccent: skin.palette.uiAccent,
    },
  };
}

export function loadBountyProgress(): BountyProgressState {
  const fallback: BountyProgressState = {
    gold: 100,
    unlockedSkins: ['default'],
    equippedSkin: 'default',
    completedDateKey: null,
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_BOUNTY_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<BountyProgressState>;
    const unlocked: FighterSkinId[] = Array.isArray(parsed.unlockedSkins)
      ? Array.from(new Set(['default', ...parsed.unlockedSkins])) as FighterSkinId[]
      : ['default'];
    const equipped: FighterSkinId =
      parsed.equippedSkin && unlocked.includes(parsed.equippedSkin)
        ? parsed.equippedSkin
        : 'default';

    return {
      gold: typeof parsed.gold === 'number' && parsed.gold >= 0 ? Math.floor(parsed.gold) : 100,
      unlockedSkins: unlocked,
      equippedSkin: equipped,
      completedDateKey: typeof parsed.completedDateKey === 'string' ? parsed.completedDateKey : null,
    };
  } catch {
    return fallback;
  }
}

export function saveBountyProgress(state: BountyProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_BOUNTY_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage restriction
  }
}
