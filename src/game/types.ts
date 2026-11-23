export type GameScreen =
  | 'menu'
  | 'select'
  | 'stage'
  | 'tournament'
  | 'gallery'
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

export type StageId = 'temple' | 'rooftop' | 'dojo' | 'volcano' | 'glacier' | 'bamboo';

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
  {
    id: 'volcano',
    name: 'Obsidian Caldera',
    subtitle: 'Basalt Forge Dais & Molten Lava Ring',
    timeOfDay: 'Molten Night',
    location: 'Mount Fuji Crater Rim',
    accentHex: '#f97316',
  },
  {
    id: 'glacier',
    name: 'Frozen Sanctum',
    subtitle: 'Glacial Ice Ring & Northern Aurora',
    timeOfDay: 'Aurora Midnight',
    location: 'Himalayan Ice Spire',
    accentHex: '#22d3ee',
  },
  {
    id: 'bamboo',
    name: 'Misty Grove',
    subtitle: 'Jade Stone Dais & Towering Bamboo Forest',
    timeOfDay: 'Morning Mist',
    location: 'Arashiyama High Forest',
    accentHex: '#10b981',
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

export interface FighterMoveInfo {
  name: string;
  input: string;
  action: FighterActionState;
  type: 'Strike' | 'Combo' | 'Kick' | 'Defense' | 'Special';
  damageNote: string;
  description: string;
}

export interface FighterSpec {
  id: FighterId;
  name: string;
  title: string;
  style: string;
  origin: string;
  lore: string;
  specialName: string;
  specialDesc: string;
  moves: FighterMoveInfo[];
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
    origin: 'Mount Kurama Monastery',
    lore:
      'Trained since childhood beneath storm-swept mountain shrines, Ryujin swore to master the forbidden Crimson Dragon fist without surrendering to its rage. He enters the Kensei Arena seeking worthy rivals capable of pushing his ki past mortal limits.',
    specialName: 'Dragon Wave',
    specialDesc: 'Blazing ki surge and rising dragon strike',
    moves: [
      {
        name: 'Dragon Jab',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Fast lead snap that opens guard and starts a three-hit chain.',
      },
      {
        name: 'Crimson Straight',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Stepping cross punch with crisp forward momentum.',
      },
      {
        name: 'Shoryu Ascent',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '14 DMG · Launch',
        description: 'Rising dragon uppercut that blasts defenders off their feet.',
      },
      {
        name: 'Crescent Spin Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '13 DMG',
        description: 'High-arcing roundhouse tuned for mid-range pressure.',
      },
      {
        name: 'Dragon Wave',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '26 DMG · Guard Break',
        description: 'Full-meter blazing surge that shatters regular blocks.',
      },
      {
        name: 'Mountain Guard',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Tight forearm guard that builds energy while deflecting combos.',
      },
    ],
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
    origin: 'Neo-Tokyo Sector 9',
    lore:
      'Once an elite aerial recon officer, Valkyrie augmented her combat visor with predictive trajectory optics after surviving an orbital ambush. Her supersonic kicking drills turn every square meter of the dais into a wind tunnel.',
    specialName: 'Tempest Spiral',
    specialDesc: 'High-velocity spinning gale kick with shockwave',
    moves: [
      {
        name: 'Aero Palm',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Rapid open-hand jab designed to interrupt slower brawlers.',
      },
      {
        name: 'Volt Cross',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '8 DMG',
        description: 'Precision follow-up strike guided by visor lock-on.',
      },
      {
        name: 'Skyline Upper',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '13 DMG · Launch',
        description: 'Vaulting palm lift that sends opponents flying backward.',
      },
      {
        name: 'Gale Crescent',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '12 DMG · Long Reach',
        description: 'Extended cyber-leg snap kick with superior horizontal reach.',
      },
      {
        name: 'Tempest Spiral',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '24 DMG · Guard Break',
        description: 'Cobalt shockwave rush that punches straight through defenses.',
      },
      {
        name: 'Aegis Visor Guard',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Reactive barrier stance minimizing chip damage on impact.',
      },
    ],
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
    origin: 'Foundry District, Athens',
    lore:
      'Forged in subterranean pit rings where rules barely existed, Titan wears forged brass pauldrons weighing over eighty kilograms. What he concedes in foot speed he repays tenfold whenever his gauntlets collide with stone or bone.',
    specialName: 'Seismic Slam',
    specialDesc: 'Earth-shattering brass gauntlet slam shockwave',
    moves: [
      {
        name: 'Anvil Jab',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '9 DMG',
        description: 'Crushing lead knuckle that hits harder than most heavy blows.',
      },
      {
        name: 'Forge Hook',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '11 DMG',
        description: 'Wide armored swing driving opponents toward the arena edge.',
      },
      {
        name: 'Colossus Uppercut',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '17 DMG · Launch',
        description: 'Thunderous rising gauntlet that launches heavyweights skyward.',
      },
      {
        name: 'Pillar Boot',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '16 DMG',
        description: 'Brutal forward boot kick with heavy stagger force.',
      },
      {
        name: 'Seismic Slam',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '32 DMG · Guard Break',
        description: 'Seismic twin-gauntlet surge dealing massive impact trauma.',
      },
      {
        name: 'Bastion Wall',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Brass shoulder wall built to endure prolonged rushdown.',
      },
    ],
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
    origin: 'Iga Mist Valley',
    lore:
      'Bound to an ancient clan oath of silence, Kage stalks corrupt warlords using twin wrist-mounted kunai blades and emerald spirit energy. Few opponents ever see the opening slash—only the flutter of his trailing scarf.',
    specialName: 'Phantom Dash',
    specialDesc: 'Lightning-fast shadow lunge and blade arc',
    moves: [
      {
        name: 'Kunai Snap',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Razor-quick forearm blade slash with minimal recovery.',
      },
      {
        name: 'Mist Cross',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Reverse-grip shadow strike extending combo pressure.',
      },
      {
        name: 'Vortex Fang',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '13 DMG · Launch',
        description: 'Spinning upward blade cut lifting foes out of stance.',
      },
      {
        name: 'Shadow Whip Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '12 DMG',
        description: 'Acrobatic high kick honed for whiff-punishing.',
      },
      {
        name: 'Phantom Dash',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '25 DMG · Guard Break',
        description: 'Emerald spirit lunge carving straight through guarded stances.',
      },
      {
        name: 'Smoke Veil',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Compact shinobi parry stance priming rapid counterattacks.',
      },
    ],
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
    origin: 'Edo Iron Citadel',
    lore:
      'Bearing the obsidian crest of a fallen shogunate, Kurogane spent twenty winters perfecting bare-handed techniques capable of snapping tempered katana steel. His golden kabuto horns signal the arrival of absolute battlefield discipline.',
    specialName: 'Shogun Cleave',
    specialDesc: 'Crescent steel shockwave from heavy samurai stance',
    moves: [
      {
        name: 'Iron Palm',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '8 DMG',
        description: 'Disciplined knife-hand strike built for spacing control.',
      },
      {
        name: 'Citadel Thrust',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '10 DMG',
        description: 'Armored shoulder-driven straight breaking opponent rhythm.',
      },
      {
        name: 'Crest Breaker',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '16 DMG · Launch',
        description: 'Heavily weighted rising palm shockwave.',
      },
      {
        name: 'Tachi Sweep Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '15 DMG',
        description: 'Broad-arcing armored kick with commanding reach.',
      },
      {
        name: 'Shogun Cleave',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '29 DMG · Guard Break',
        description: 'Golden samurai surge unleashing crushing arena force.',
      },
      {
        name: 'Kabuto Brace',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Immovable shogunate guard stance.',
      },
    ],
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
    origin: 'Bangkok Ember Stadium',
    lore:
      'Undefeated champion of underground torchlit rings, Blaze channels blistering body heat into relentless Muay Thai elbows and knees. Every round he fights grows hotter until the air itself shimmers around his fists.',
    specialName: 'Inferno Knee',
    specialDesc: 'Explosive solar rush and blazing knee impact',
    moves: [
      {
        name: 'Ember Jab',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Crisp boxing jab keeping opponents locked inside striking range.',
      },
      {
        name: 'Flare Elbow',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Close-quarters rotational strike igniting combo heat.',
      },
      {
        name: 'Solar Uppercut',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '15 DMG · Launch',
        description: 'Explosive upward hook wrapped in solar sparks.',
      },
      {
        name: 'Tiger Roundhouse',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '14 DMG',
        description: 'Full-hip Muay Thai roundhouse delivering fierce knockback.',
      },
      {
        name: 'Inferno Knee',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '27 DMG · Guard Break',
        description: 'Blazing sprint surge shattering shields on impact.',
      },
      {
        name: 'Flame Tight Guard',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'High Muay Thai elbow shell absorbing heavy combos.',
      },
    ],
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
    origin: 'Kunlun Ice Peaks',
    lore:
      'Meditating inside frozen caverns for a decade, Frost learned to slow his heartbeat and strike with crystalline precision. Beneath his pale ceremonial hood lies calm fury capable of cracking granite with a single inch-punch.',
    specialName: 'Absolute Zero',
    specialDesc: 'Freezing palm burst that shatters opponent guard',
    moves: [
      {
        name: 'Rime Snap',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Sharp straight palm checking advancing attackers.',
      },
      {
        name: 'Glacier Ram',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Compact Bajiquan shoulder-and-fist drive.',
      },
      {
        name: 'Permafrost Lift',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '14 DMG · Launch',
        description: 'Chilling short-range burst launching foes upward.',
      },
      {
        name: 'Shatter Heel Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '13 DMG',
        description: 'Snapping side-snap kick controlling neutral space.',
      },
      {
        name: 'Absolute Zero',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '26 DMG · Guard Break',
        description: 'Cryo-infused palm detonation breaking defensive shells.',
      },
      {
        name: 'Crystal Shell',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Balanced monk guard turning enemy offense into counter meter.',
      },
    ],
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
    origin: 'Jakarta Shadow Docks',
    lore:
      'A former syndicate enforcer turned rogue duelist, Viper pairs venomous neon arm-blades with deceptive Silat footwork. She slips past heavy swings with effortless agility before carving long, punishing combo chains.',
    specialName: 'Acid Flurry',
    specialDesc: 'Twin arm-blade surge coated in neon toxin',
    moves: [
      {
        name: 'Fang Flick',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG · Long Reach',
        description: 'Extended forearm-blade jab poking safely from range.',
      },
      {
        name: 'Venom Hook',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Slashing follow-up keeping stunned opponents pinned.',
      },
      {
        name: 'Cobra Rise',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '14 DMG · Launch',
        description: 'Acrobatic blade uppercut ending agile strings.',
      },
      {
        name: 'Serpent Tail Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '13 DMG · Long Reach',
        description: 'Whipping high Silat kick exploiting her top-tier reach.',
      },
      {
        name: 'Acid Flurry',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '25 DMG · Guard Break',
        description: 'Twin venom-blade lunge slicing straight through blocks.',
      },
      {
        name: 'Coil Parry',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Low-profile defensive coil preparing sudden counter-lunges.',
      },
    ],
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
    origin: 'Ural Iron Bastion',
    lore:
      'Towering above every challenger in the roster, Goliath crushed entire mercenary battalions bare-handed before claiming the crimson warlord mantle. His unmatched durability lets him trade blows until one devastating crush ends the round.',
    specialName: 'Tectonic Crush',
    specialDesc: 'Colossal double-fist slam that launches foes skyward',
    moves: [
      {
        name: 'Warlord Clobber',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '9 DMG',
        description: 'Massive forearm slam imposing immediate close-range dread.',
      },
      {
        name: 'Siege Straight',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '12 DMG',
        description: 'Heavy torso-turned smash tearing through guard stamina.',
      },
      {
        name: 'Quake Uppercut',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '18 DMG · Launch',
        description: 'Bone-rattling uppercut delivering top-tier knockback.',
      },
      {
        name: 'Mammoth Boot',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '17 DMG',
        description: 'Crushing high boot that punishes reckless approaches.',
      },
      {
        name: 'Tectonic Crush',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '33 DMG · Guard Break',
        description: 'The single hardest-hitting special attack in the arena.',
      },
      {
        name: 'Ironclad Guard',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Fortress stance paired with a huge 126 HP reserve.',
      },
    ],
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
    origin: 'Tibetan Sky Observatory',
    lore:
      'Keeper of an astral relic manifested as a floating golden halo, Zenith blends fluid kung fu arcs with cosmic harmonic force. He views combat not as hatred, but as an exact geometric test of balance and timing.',
    specialName: 'Astral Nova',
    specialDesc: 'Radiant violet shockwave unleashed from halo focus',
    moves: [
      {
        name: 'Starlight Palm',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG',
        description: 'Flowing lead palm with crisp recovery and reach.',
      },
      {
        name: 'Orbit Cross',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '9 DMG',
        description: 'Harmonic rotating palm strike setting up finishers.',
      },
      {
        name: 'Zenith Rising',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '15 DMG · Launch',
        description: 'Astral-charged uppercut lifting adversaries into the air.',
      },
      {
        name: 'Nebula Sweep',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '14 DMG · Long Reach',
        description: 'Sweeping celestial kick controlling long mid-range.',
      },
      {
        name: 'Astral Nova',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '27 DMG · Guard Break',
        description: 'Radiant violet blast channeling full celestial focus.',
      },
      {
        name: 'Halo Barrier',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Composed defensive ward deflecting flurry strings.',
      },
    ],
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
    origin: 'Kyoto Bamboo Roads',
    lore:
      'Wandering beneath a wide bamboo kasa hat, Ronin abandoned noble patronage after refusing an unjust duel. Armed with twin silver iaijutsu arm-blades, he finishes bouts in decisive bursts of razor-sharp precision.',
    specialName: 'Gale Flash',
    specialDesc: 'Blinding silver dash that cuts through defenses',
    moves: [
      {
        name: 'Draw Slash',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '7 DMG · Long Reach',
        description: 'Quick-draw forearm cut punishing exposed limbs.',
      },
      {
        name: 'Silver Riposte',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '10 DMG',
        description: 'Twin-edge horizontal slice pushing rivals back.',
      },
      {
        name: 'Moonlit Ascent',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '15 DMG · Launch',
        description: 'Rising blade arc sending foes tumbling backward.',
      },
      {
        name: 'Bamboo Crescent',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '14 DMG · Long Reach',
        description: 'Disciplined long-range kick keeping pressure at sword length.',
      },
      {
        name: 'Gale Flash',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '28 DMG · Guard Break',
        description: 'Silver storm lunge cleaving straight past guards.',
      },
      {
        name: 'Wanderer Guard',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Calm crossed-blade guard poised for iaijutsu counters.',
      },
    ],
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
    origin: 'Storm Shrine of Nara',
    lore:
      'Adorned with forged thunder-oni horns, Raiden attracts static lightning during every fierce exchange. His Kempo strikes crackle like thunderclaps, overwhelming cautious defenders with relentless high-voltage blows.',
    specialName: 'Volt Judgement',
    specialDesc: 'High-voltage thunder clap that detonates on impact',
    moves: [
      {
        name: 'Spark Knuckle',
        input: 'Punch (J)',
        action: 'punch_1',
        type: 'Strike',
        damageNote: '8 DMG',
        description: 'Snapping electric fist opening rapid Kempo combos.',
      },
      {
        name: 'Thunder Cross',
        input: 'Punch ×2',
        action: 'punch_2',
        type: 'Combo',
        damageNote: '10 DMG',
        description: 'Charged straight right rocking opponent poise.',
      },
      {
        name: 'Oni Skybreaker',
        input: 'Punch ×3',
        action: 'punch_3',
        type: 'Combo',
        damageNote: '15 DMG · Launch',
        description: 'Lightning-charged uppercut launching foes into stun.',
      },
      {
        name: 'Storm Heel Kick',
        input: 'Kick (K)',
        action: 'kick',
        type: 'Kick',
        damageNote: '14 DMG',
        description: 'High-impact lightning roundhouse.',
      },
      {
        name: 'Volt Judgement',
        input: 'Special (U)',
        action: 'special',
        type: 'Special',
        damageNote: '29 DMG · Guard Break',
        description: 'Detonating golden thunder rush breaking every guard.',
      },
      {
        name: 'Static Ward',
        input: 'Block (L)',
        action: 'block',
        type: 'Defense',
        damageNote: 'Absorbs Hits',
        description: 'Sturdy Oni guard storing kinetic energy on block.',
      },
    ],
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

export interface MatchHistoryEntry {
  id: string;
  timestamp: number;
  playerFighterId: FighterId;
  playerName: string;
  opponentId: FighterId;
  opponentName: string;
  outcome: 'victory' | 'defeat' | 'draw';
  p1Rounds: number;
  p2Rounds: number;
  maxCombo: number;
  damageDealt: number;
  gameMode: GameMode;
  arcadeLevel?: number;
}

export type FighterSkinId =
  | 'default'
  | 'gold_sovereign'
  | 'obsidian_eclipse'
  | 'emerald_jade'
  | 'cyber_plasma'
  | 'crimson_inferno';

export interface FighterSkinSpec {
  id: FighterSkinId;
  name: string;
  subtitle: string;
  price: number;
  palette: {
    primary: number;
    secondary: number;
    accent: number;
    metal: number;
    energy: number;
    uiAccent: string;
  };
}

export type BountyConditionType =
  | 'win_min_hp_50'
  | 'win_combo_4'
  | 'win_blocks_3'
  | 'win_specials_2'
  | 'win_under_45s'
  | 'win_heavy_flawless';

export interface DailyBountySpec {
  id: string;
  dateKey: string;
  title: string;
  description: string;
  condition: BountyConditionType;
  rewardGold: number;
  rewardSkinId: FighterSkinId;
}

export interface BountyProgressState {
  gold: number;
  unlockedSkins: FighterSkinId[];
  equippedSkin: FighterSkinId;
  completedDateKey: string | null;
}
