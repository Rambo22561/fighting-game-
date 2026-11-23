export type GameScreen =
  | 'menu'
  | 'select'
  | 'stage'
  | 'tournament'
  | 'fighting'
  | 'paused'
  | 'result';

export type GameMode = 'versus' | 'arcade100' | 'tournament';

export type Difficulty = 'rookie' | 'challenger' | 'master';

export type FighterId =
  | 'ryujin'
  | 'valkyrie'
  | 'titan'
  | 'kage'
  | 'kurogane'
  | 'blaze'
  | 'frost'
  | 'viper'
  | 'goliath'
  | 'zenith'
  | 'ronin'
  | 'raiden';

export type StageId = 'temple' | 'rooftop' | 'dojo';

export interface StageSpec {
  id: StageId;
  name: string;
  subtitle: string;
  timeOfDay: string;
  location: string;
  accentHex: string;
}

export const STAGE_ROSTER: StageSpec[] = [
  {
    id: 'temple',
    name: 'Twilight Temple',
    subtitle: 'Ancient Stone Dais & Torii Courtyard',
    timeOfDay: 'Moonlit Dusk',
    location: 'Mount Kurama Summit',
    accentHex: '#f59e0b',
  },
  {
    id: 'rooftop',
    name: 'Skyline Rooftop',
    subtitle: 'High-Altitude Steel & Concrete Helipad',
    timeOfDay: 'Neon Sunset',
    location: 'Neo-Tokyo Tower 88F',
    accentHex: '#38bdf8',
  },
  {
    id: 'dojo',
    name: 'Grand Dojo',
    subtitle: 'Polished Hinoki Hall & Shoji Lanterns',
    timeOfDay: 'Lantern Night',
    location: 'Kyoto Master Sanctuary',
    accentHex: '#ef4444',
  },
];

export type FighterActionState =
  | 'idle'
  | 'walk_fwd'
  | 'walk_back'
  | 'jump'
  | 'block'
  | 'punch_1'
  | 'punch_2'
  | 'punch_3'
  | 'kick'
  | 'special'
  | 'hitstun'
  | 'ko'
  | 'victory';

export type FighterAccessoryType =
  | 'headband'
  | 'visor'
  | 'pauldrons'
  | 'scarf'
  | 'kabuto'
  | 'kasa'
  | 'halo'
  | 'oni'
  | 'hood'
  | 'mohawk';

export interface FighterSpec {
  id: FighterId;
  name: string;
  title: string;
  style: string;
  specialName: string;
  specialDesc: string;
  maxHp: number;
  moveSpeed: number;
  jumpForce: number;
  attackPower: number;
  reachBonus: number;
  stats: {
    power: number; // 1-10
    speed: number; // 1-10
    range: number; // 1-10
  };
  palette: {
    primary: number;
    secondary: number;
    accent: number;
    skin: number;
    metal: number;
    energy: number;
    uiAccent: string;
  };
  proportions: {
    shoulderWidth: number;
    chestDepth: number;
    limbThickness: number;
    heightScale: number;
  };
  accessories: FighterAccessoryType;
  hasArmBlades?: boolean;
}

export const FIGHTER_ROSTER: FighterSpec[] = [
  {
    id: 'ryujin',
    name: 'Ryujin',
    title: 'Crimson Dragon',
    style: 'Ansatsuken Karate',
    specialName: 'Dragon Wave',
    specialDesc: 'Blazing ki surge and rising dragon strike',
    maxHp: 100,
    moveSpeed: 5.4,
    jumpForce: 9.2,
    attackPower: 1.0,
    reachBonus: 0.0,
    stats: { power: 8, speed: 8, range: 7 },
    palette: {
      primary: 0xb91c1c,
      secondary: 0x1e293b,
      accent: 0xf59e0b,
      skin: 0xd9a077,
      metal: 0xd4af37,
      energy: 0xff7b00,
      uiAccent: '#ef4444',
    },
    proportions: { shoulderWidth: 1.0, chestDepth: 1.0, limbThickness: 1.0, heightScale: 1.0 },
    accessories: 'headband',
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie',
    title: 'Cobalt Tempest',
    style: 'Cyber Taekwondo',
    specialName: 'Tempest Spiral',
    specialDesc: 'High-velocity spinning gale kick with shockwave',
    maxHp: 94,
    moveSpeed: 6.2,
    jumpForce: 9.8,
    attackPower: 0.94,
    reachBonus: 0.16,
    stats: { power: 7, speed: 10, range: 9 },
    palette: {
      primary: 0x1d4ed8,
      secondary: 0x0f172a,
      accent: 0x38bdf8,
      skin: 0xe2b18d,
      metal: 0xcbd5e1,
      energy: 0x38bdf8,
      uiAccent: '#3b82f6',
    },
    proportions: { shoulderWidth: 0.88, chestDepth: 0.88, limbThickness: 0.9, heightScale: 0.97 },
    accessories: 'visor',
  },
  {
    id: 'titan',
    name: 'Titan',
    title: 'Iron Colossus',
    style: 'Heavy Pankration',
    specialName: 'Seismic Slam',
    specialDesc: 'Earth-shattering brass gauntlet slam shockwave',
    maxHp: 122,
    moveSpeed: 4.3,
    jumpForce: 8.3,
    attackPower: 1.24,
    reachBonus: 0.1,
    stats: { power: 10, speed: 5, range: 8 },
    palette: {
      primary: 0x27272a,
      secondary: 0x18181b,
      accent: 0xd97706,
      skin: 0xb6815c,
      metal: 0xf59e0b,
      energy: 0xfbbf24,
      uiAccent: '#f59e0b',
    },
    proportions: { shoulderWidth: 1.24, chestDepth: 1.2, limbThickness: 1.22, heightScale: 1.07 },
    accessories: 'pauldrons',
  },
  {
    id: 'kage',
    name: 'Kage',
    title: 'Emerald Phantom',
    style: 'Shadow Ninjutsu',
    specialName: 'Phantom Dash',
    specialDesc: 'Lightning-fast shadow lunge and blade arc',
    maxHp: 92,
    moveSpeed: 6.5,
    jumpForce: 10.2,
    attackPower: 0.96,
    reachBonus: 0.08,
    stats: { power: 7, speed: 10, range: 8 },
    palette: {
      primary: 0x111827,
      secondary: 0x064e3b,
      accent: 0x10b981,
      skin: 0xd19a72,
      metal: 0x94a3b8,
      energy: 0x10b981,
      uiAccent: '#10b981',
    },
    proportions: { shoulderWidth: 0.94, chestDepth: 0.92, limbThickness: 0.93, heightScale: 0.99 },
    accessories: 'scarf',
    hasArmBlades: true,
  },
  {
    id: 'kurogane',
    name: 'Kurogane',
    title: 'Black Shogun',
    style: 'Armored Kenjutsu',
    specialName: 'Shogun Cleave',
    specialDesc: 'Crescent steel shockwave from heavy samurai stance',
    maxHp: 112,
    moveSpeed: 4.9,
    jumpForce: 8.7,
    attackPower: 1.12,
    reachBonus: 0.12,
    stats: { power: 9, speed: 6, range: 8 },
    palette: {
      primary: 0x18181b,
      secondary: 0x450a0a,
      accent: 0xeab308,
      skin: 0xc9936d,
      metal: 0xe2e8f0,
      energy: 0xfacc15,
      uiAccent: '#eab308',
    },
    proportions: { shoulderWidth: 1.1, chestDepth: 1.08, limbThickness: 1.06, heightScale: 1.03 },
    accessories: 'kabuto',
  },
  {
    id: 'blaze',
    name: 'Blaze',
    title: 'Solar Striker',
    style: 'Muay Thai',
    specialName: 'Inferno Knee',
    specialDesc: 'Explosive solar rush and blazing knee impact',
    maxHp: 98,
    moveSpeed: 5.9,
    jumpForce: 9.6,
    attackPower: 1.04,
    reachBonus: 0.06,
    stats: { power: 8, speed: 9, range: 7 },
    palette: {
      primary: 0xc2410c,
      secondary: 0x292524,
      accent: 0xf97316,
      skin: 0xb97a50,
      metal: 0xfbbf24,
      energy: 0xf97316,
      uiAccent: '#f97316',
    },
    proportions: { shoulderWidth: 0.98, chestDepth: 0.98, limbThickness: 0.98, heightScale: 1.0 },
    accessories: 'mohawk',
  },
  {
    id: 'frost',
    name: 'Frost',
    title: 'Glacier Monk',
    style: 'Cryo Bajiquan',
    specialName: 'Absolute Zero',
    specialDesc: 'Freezing palm burst that shatters opponent guard',
    maxHp: 102,
    moveSpeed: 5.3,
    jumpForce: 9.1,
    attackPower: 1.02,
    reachBonus: 0.05,
    stats: { power: 8, speed: 7, range: 8 },
    palette: {
      primary: 0xe2e8f0,
      secondary: 0x0c4a6e,
      accent: 0x67e8f9,
      skin: 0xdcc0ad,
      metal: 0xbae6fd,
      energy: 0x22d3ee,
      uiAccent: '#22d3ee',
    },
    proportions: { shoulderWidth: 0.96, chestDepth: 0.96, limbThickness: 0.95, heightScale: 1.0 },
    accessories: 'hood',
  },
  {
    id: 'viper',
    name: 'Viper',
    title: 'Venom Fang',
    style: 'Lethal Silat',
    specialName: 'Acid Flurry',
    specialDesc: 'Twin arm-blade surge coated in neon toxin',
    maxHp: 90,
    moveSpeed: 6.4,
    jumpForce: 10.0,
    attackPower: 0.97,
    reachBonus: 0.18,
    stats: { power: 7, speed: 10, range: 9 },
    palette: {
      primary: 0x14532d,
      secondary: 0x09090b,
      accent: 0x84cc16,
      skin: 0xd8a885,
      metal: 0xa3e635,
      energy: 0x84cc16,
      uiAccent: '#84cc16',
    },
    proportions: { shoulderWidth: 0.89, chestDepth: 0.88, limbThickness: 0.88, heightScale: 0.96 },
    accessories: 'visor',
    hasArmBlades: true,
  },
  {
    id: 'goliath',
    name: 'Goliath',
    title: 'Crimson Warlord',
    style: 'Brute Sambo',
    specialName: 'Tectonic Crush',
    specialDesc: 'Colossal double-fist slam that launches foes skyward',
    maxHp: 126,
    moveSpeed: 4.1,
    jumpForce: 8.0,
    attackPower: 1.28,
    reachBonus: 0.14,
    stats: { power: 10, speed: 4, range: 8 },
    palette: {
      primary: 0x7f1d1d,
      secondary: 0x1c1917,
      accent: 0xf43f5e,
      skin: 0x9c6848,
      metal: 0x78716c,
      energy: 0xf43f5e,
      uiAccent: '#f43f5e',
    },
    proportions: { shoulderWidth: 1.28, chestDepth: 1.24, limbThickness: 1.26, heightScale: 1.09 },
    accessories: 'pauldrons',
  },
  {
    id: 'zenith',
    name: 'Zenith',
    title: 'Astral Sage',
    style: 'Celestial Kung Fu',
    specialName: 'Astral Nova',
    specialDesc: 'Radiant violet shockwave unleashed from halo focus',
    maxHp: 96,
    moveSpeed: 5.7,
    jumpForce: 9.7,
    attackPower: 1.05,
    reachBonus: 0.12,
    stats: { power: 8, speed: 8, range: 9 },
    palette: {
      primary: 0x4c1d95,
      secondary: 0x1e1b4b,
      accent: 0xc084fc,
      skin: 0xd5a584,
      metal: 0xfde047,
      energy: 0xa855f7,
      uiAccent: '#a855f7',
    },
    proportions: { shoulderWidth: 0.94, chestDepth: 0.94, limbThickness: 0.94, heightScale: 1.01 },
    accessories: 'halo',
  },
  {
    id: 'ronin',
    name: 'Ronin',
    title: 'Silver Wanderer',
    style: 'Iaijutsu Strike',
    specialName: 'Gale Flash',
    specialDesc: 'Blinding silver dash that cuts through defenses',
    maxHp: 98,
    moveSpeed: 5.8,
    jumpForce: 9.4,
    attackPower: 1.06,
    reachBonus: 0.15,
    stats: { power: 9, speed: 8, range: 9 },
    palette: {
      primary: 0x1e3a8a,
      secondary: 0x172554,
      accent: 0xe2e8f0,
      skin: 0xd19f7b,
      metal: 0xf1f5f9,
      energy: 0x93c5fd,
      uiAccent: '#60a5fa',
    },
    proportions: { shoulderWidth: 0.98, chestDepth: 0.95, limbThickness: 0.96, heightScale: 1.01 },
    accessories: 'kasa',
    hasArmBlades: true,
  },
  {
    id: 'raiden',
    name: 'Raiden',
    title: 'Thunder Oni',
    style: 'Lightning Kempo',
    specialName: 'Volt Judgement',
    specialDesc: 'High-voltage thunder clap that detonates on impact',
    maxHp: 106,
    moveSpeed: 5.5,
    jumpForce: 9.3,
    attackPower: 1.1,
    reachBonus: 0.08,
    stats: { power: 9, speed: 8, range: 7 },
    palette: {
      primary: 0x312e81,
      secondary: 0x090d16,
      accent: 0xfacc15,
      skin: 0xc68e68,
      metal: 0xfde047,
      energy: 0xfef08a,
      uiAccent: '#facc15',
    },
    proportions: { shoulderWidth: 1.08, chestDepth: 1.05, limbThickness: 1.06, heightScale: 1.03 },
    accessories: 'oni',
  },
];

export interface MoveDefinition {
  duration: number;
  windupEnd: number;
  activeEnd: number;
  damage: number;
  chipDamage: number;
  range: number;
  knockback: number;
  hitstun: number;
  hitstop: number;
  isHeavy: boolean;
  lungeSpeed: number;
}

export const MOVE_DATA: Record<'punch_1' | 'punch_2' | 'punch_3' | 'kick' | 'special', MoveDefinition> = {
  punch_1: {
    duration: 0.30,
    windupEnd: 0.09,
    activeEnd: 0.19,
    damage: 7,
    chipDamage: 1.5,
    range: 1.85,
    knockback: 2.2,
    hitstun: 0.24,
    hitstop: 0.03,
    isHeavy: false,
    lungeSpeed: 2.0,
  },
  punch_2: {
    duration: 0.34,
    windupEnd: 0.10,
    activeEnd: 0.21,
    damage: 9,
    chipDamage: 2,
    range: 1.95,
    knockback: 2.8,
    hitstun: 0.28,
    hitstop: 0.035,
    isHeavy: false,
    lungeSpeed: 2.6,
  },
  punch_3: {
    duration: 0.46,
    windupEnd: 0.14,
    activeEnd: 0.28,
    damage: 14,
    chipDamage: 3.5,
    range: 2.1,
    knockback: 5.5,
    hitstun: 0.42,
    hitstop: 0.055,
    isHeavy: true,
    lungeSpeed: 3.6,
  },
  kick: {
    duration: 0.44,
    windupEnd: 0.14,
    activeEnd: 0.27,
    damage: 13,
    chipDamage: 3,
    range: 2.35,
    knockback: 4.8,
    hitstun: 0.36,
    hitstop: 0.05,
    isHeavy: true,
    lungeSpeed: 2.4,
  },
  special: {
    duration: 0.68,
    windupEnd: 0.24,
    activeEnd: 0.48,
    damage: 26,
    chipDamage: 7,
    range: 3.4,
    knockback: 8.5,
    hitstun: 0.56,
    hitstop: 0.075,
    isHeavy: true,
    lungeSpeed: 6.8,
  },
};

export interface PlayerInputState {
  moveX: number;
  moveZ: number;
  block: boolean;
  jumpPressed: boolean;
  punchPressed: boolean;
  kickPressed: boolean;
  specialPressed: boolean;
}

export type RoundPhase = 'intro' | 'fight' | 'ko' | 'timeout' | 'match_over';

export interface TournamentMatch {
  id: string;
  p1: FighterId | null;
  p2: FighterId | null;
  winner: FighterId | null;
  stageId: StageId;
}

export interface TournamentState {
  playerFighter: FighterId;
  roundIndex: number; // 0 = Quarterfinal, 1 = Semifinal, 2 = Grand Final, 3 = Champion
  qf: TournamentMatch[]; // 4 matches
  sf: TournamentMatch[]; // 2 matches
  final: TournamentMatch;
  champion: FighterId | null;
}

export interface HudSnapshot {
  screen: GameScreen;
  gameMode: GameMode;
  arcadeLevel: number;
  p1Hp: number;
  p1MaxHp: number;
  p1Energy: number;
  p1Rounds: number;
  p1Combo: number;
  p1Action: FighterActionState;
  p2Hp: number;
  p2MaxHp: number;
  p2Energy: number;
  p2Rounds: number;
  p2Combo: number;
  p2Action: FighterActionState;
  timer: number;
  roundNumber: number;
  roundPhase: RoundPhase;
  bannerText: string;
  winner: 'p1' | 'p2' | 'draw' | null;
  matchStats: {
    damageDealt: number;
    maxCombo: number;
    blocksLanded: number;
    specialsUsed: number;
    elapsedSeconds: number;
  };
}
