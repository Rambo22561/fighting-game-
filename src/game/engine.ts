import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FighterAiController } from './ai';
import { updateFighterAnimation } from './animations';
import { ARENA_RADIUS, ArenaHandle, createFightingArena } from './arena';
import { combatAudio } from './audio';
import { createFighterInstance, FighterInstance } from './fighters';
import { createProceduralTextures, ProceduralTextureSet } from './textures';
import {
  Difficulty,
  FIGHTER_ROSTER,
  FighterId,
  GameMode,
  GameScreen,
  HudSnapshot,
  MOVE_DATA,
  PlayerInputState,
  RoundPhase,
  StageId,
} from './types';
import { CombatVfxManager } from './vfx';

// Pre-allocated math helpers (Zero GC inside tick loop)
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _camLookCurrent = new THREE.Vector3(0, 1.1, 0);

const GRAVITY = 24;
const ROUND_TIME_SECONDS = 99;

export class KenseiGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextureSet;
  private arena: ArenaHandle;
  private vfx: CombatVfxManager;
  private envRT: THREE.WebGLRenderTarget;

  private p1!: FighterInstance;
  private p2!: FighterInstance;
  private p1Id: FighterId = 'ryujin';
  private p2Id: FighterId = 'valkyrie';
  private stageId: StageId = 'temple';
  private difficulty: Difficulty = 'challenger';
  private gameMode: GameMode = 'versus';
  private arcadeLevel = 1;

  private ai = new FighterAiController();
  private screen: GameScreen = 'menu';
  private roundPhase: RoundPhase = 'intro';
  private roundNumber = 1;
  private p1Rounds = 0;
  private p2Rounds = 0;
  private timer = ROUND_TIME_SECONDS;
  private phaseTimer = 0;
  private bannerText = '';
  private winner: 'p1' | 'p2' | 'draw' | null = null;

  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private elapsed = 0;
  private lastTimestamp = 0;
  private frameId = 0;
  private disposed = false;
  private contextLost = false;

  // Match telemetry stats for Victory/Defeat summary
  private stats = {
    damageDealt: 0,
    maxCombo: 0,
    blocksLanded: 0,
    specialsUsed: 0,
    elapsedSeconds: 0,
  };

  // Continuous & edge-triggered input state
  private playerInput: PlayerInputState = {
    moveX: 0,
    moveZ: 0,
    block: false,
    jumpPressed: false,
    punchPressed: false,
    kickPressed: false,
    specialPressed: false,
  };

  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onContextIssue?: (lost: boolean) => void;
  private lastHudEmit = 0;
  private p1LowHpCrowdTriggered = false;
  private p2LowHpCrowdTriggered = false;
  private lastCrowdReactionTime = -10;

  constructor(
    container: HTMLElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onContextIssue?: (lost: boolean) => void,
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onContextIssue = onContextIssue;

    // 1. Detect software WebGL strictly via GPU renderer string
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Initialize Renderer with ACESFilmicToneMapping & SRGBColorSpace
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      this.contextLost = true;
      this.onContextIssue?.(true);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.2, 120);
      this.textures = createProceduralTextures(1);
      this.arena = createFightingArena(this.scene, this.textures, true, this.stageId);
      this.vfx = new CombatVfxManager(this.scene);
      this.envRT = new THREE.WebGLRenderTarget(1, 1);
      this.renderer = null as unknown as THREE.WebGLRenderer;
      return;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // WebGL Context Loss/Restore Handling
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 120);
    this.camera.position.set(0, 3.2, 8.8);
    this.camera.lookAt(0, 1.1, 0);

    // 4. Studio Environment Map via RoomEnvironment (every device)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmremGenerator.dispose();

    // 5. Procedural Textures, Arena, VFX, and Initial Fighters
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);
    this.arena = createFightingArena(this.scene, this.textures, this.isSoftwareGl, this.stageId);
    this.vfx = new CombatVfxManager(this.scene);

    this.spawnFighters(this.p1Id, this.p2Id);

    window.addEventListener('resize', this.handleResize);
    this.emitHud(true);
    this.lastTimestamp = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.onContextIssue?.(true);
  };

  private handleContextRestored = () => {
    this.contextLost = false;
    this.onContextIssue?.(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  private getSpec(id: FighterId) {
    return FIGHTER_ROSTER.find((f) => f.id === id) || FIGHTER_ROSTER[0];
  }

  private spawnFighters(p1Id: FighterId, p2Id: FighterId): void {
    if (this.p1) {
      this.scene.remove(this.p1.joints.root);
      this.p1.dispose();
    }
    if (this.p2) {
      this.scene.remove(this.p2.joints.root);
      this.p2.dispose();
    }
    this.p1Id = p1Id;
    this.p2Id = p2Id;

    this.p1 = createFighterInstance(
      this.getSpec(p1Id),
      this.textures.fabricBump,
      this.textures.contactShadowMap,
      -2.2,
      1,
    );
    this.p2 = createFighterInstance(
      this.getSpec(p2Id),
      this.textures.fabricBump,
      this.textures.contactShadowMap,
      2.2,
      -1,
    );
    this.scene.add(this.p1.joints.root);
    this.scene.add(this.p2.joints.root);
  }

  // Public API for React UI Controls
  public setScreen(screen: GameScreen): void {
    this.screen = screen;
    if (screen === 'menu' || screen === 'select' || screen === 'stage' || screen === 'tournament') {
      combatAudio.setCrowdActive(false);
      this.resetFighterToShowcase(this.p1, -2.0, 1);
      this.resetFighterToShowcase(this.p2, 2.0, -1);
      this.bannerText = '';
      this.winner = null;
    }
    this.emitHud(true);
  }

  public setStage(stageId: StageId): void {
    if (stageId === this.stageId) return;
    this.stageId = stageId;
    this.arena.dispose();
    this.arena = createFightingArena(this.scene, this.textures, this.isSoftwareGl, stageId);
    this.emitHud(true);
  }

  public setSelectedFighters(p1Id: FighterId, p2Id: FighterId): void {
    if (p1Id !== this.p1Id || p2Id !== this.p2Id) {
      this.spawnFighters(p1Id, p2Id);
      this.resetFighterToShowcase(this.p1, -2.0, 1);
      this.resetFighterToShowcase(this.p2, 2.0, -1);
      this.emitHud(true);
    }
  }

  public setDifficulty(diff: Difficulty): void {
    this.difficulty = diff;
  }

  public startMatch(options?: { gameMode?: GameMode; arcadeLevel?: number }): void {
    combatAudio.unlock();
    if (options?.gameMode) this.gameMode = options.gameMode;
    if (typeof options?.arcadeLevel === 'number') {
      this.arcadeLevel = Math.max(1, Math.min(100, options.arcadeLevel));
    }

    // Apply progressive 1..100 level scaling to CPU opponent
    const levelProgress = this.gameMode === 'arcade100' ? (this.arcadeLevel - 1) / 99 : 0;
    const isBossLevel = this.gameMode === 'arcade100' && this.arcadeLevel % 10 === 0;
    const hpMult =
      this.gameMode === 'arcade100'
        ? 1 + levelProgress * 0.55 + (isBossLevel ? 0.12 : 0)
        : this.gameMode === 'tournament'
          ? 1 + (this.arcadeLevel - 1) * 0.12
          : 1;
    const dmgMult =
      this.gameMode === 'arcade100'
        ? 1 + levelProgress * 0.36 + (isBossLevel ? 0.08 : 0)
        : this.gameMode === 'tournament'
          ? 1 + (this.arcadeLevel - 1) * 0.08
          : 1;

    this.p1.maxHp = this.p1.spec.maxHp;
    this.p1.powerScale = this.p1.spec.attackPower;

    this.p2.maxHp = Math.round(this.p2.spec.maxHp * hpMult);
    this.p2.powerScale = this.p2.spec.attackPower * dmgMult;

    this.screen = 'fighting';
    this.roundNumber = 1;
    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.winner = null;
    this.stats = {
      damageDealt: 0,
      maxCombo: 0,
      blocksLanded: 0,
      specialsUsed: 0,
      elapsedSeconds: 0,
    };
    this.startRound(1);
  }

  public restartMatch(): void {
    this.startMatch();
  }

  public togglePause(): void {
    if (this.screen === 'fighting') {
      this.screen = 'paused';
      combatAudio.setCrowdActive(false);
      this.emitHud(true);
    } else if (this.screen === 'paused') {
      this.screen = 'fighting';
      this.lastTimestamp = performance.now();
      combatAudio.setCrowdActive(true);
      this.emitHud(true);
    }
  }

  private resetFighterToShowcase(f: FighterInstance, x: number, facing: 1 | -1) {
    f.x = x;
    f.y = 0;
    f.z = 0;
    f.vx = 0;
    f.vy = 0;
    f.vz = 0;
    f.facing = facing;
    f.grounded = true;
    f.hp = f.maxHp;
    f.energy = 25;
    f.action = 'idle';
    f.actionTimer = 0;
    f.comboStep = 0;
    f.comboCount = 0;
    f.comboDisplayTimer = 0;
    f.hitstunTimer = 0;
    f.flashTimer = 0;
    f.bufferedAttack = null;
    f.joints.root.position.set(x, 0, 0);
    f.joints.root.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;
  }

  private startRound(roundNum: number): void {
    this.roundNumber = roundNum;
    this.timer = ROUND_TIME_SECONDS;
    this.roundPhase = 'intro';
    this.phaseTimer = 1.65;
    this.bannerText = `ROUND ${roundNum}`;
    this.p1LowHpCrowdTriggered = false;
    this.p2LowHpCrowdTriggered = false;
    this.ai.reset();
    this.resetFighterToShowcase(this.p1, -2.3, 1);
    this.resetFighterToShowcase(this.p2, 2.3, -1);
    combatAudio.playGong();
    combatAudio.setCrowdActive(true);
    combatAudio.updateCrowdTension(0.15);
    this.emitHud(true);
  }

  // Input methods called from Virtual Controls or Keyboard
  public setMoveVector(moveX: number, moveZ: number): void {
    this.playerInput.moveX = THREE.MathUtils.clamp(moveX, -1, 1);
    this.playerInput.moveZ = THREE.MathUtils.clamp(moveZ, -1, 1);
  }

  public setBlock(active: boolean): void {
    this.playerInput.block = active;
  }

  public triggerJump(): void {
    combatAudio.unlock();
    this.playerInput.jumpPressed = true;
  }

  public triggerPunch(): void {
    combatAudio.unlock();
    this.playerInput.punchPressed = true;
  }

  public triggerKick(): void {
    combatAudio.unlock();
    this.playerInput.kickPressed = true;
  }

  public triggerSpecial(): void {
    combatAudio.unlock();
    this.playerInput.specialPressed = true;
  }

  public clearInputs(): void {
    this.playerInput.moveX = 0;
    this.playerInput.moveZ = 0;
    this.playerInput.block = false;
    this.playerInput.jumpPressed = false;
    this.playerInput.punchPressed = false;
    this.playerInput.kickPressed = false;
    this.playerInput.specialPressed = false;
  }

  // Main Simulation Step
  private tick = (now: number) => {
    if (this.disposed) return;

    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (!this.contextLost) {
      if (this.screen !== 'paused') {
        this.elapsed += dt;
        this.arena.update(this.elapsed, dt);
        this.vfx.update(dt);

        if (this.screen === 'fighting') {
          this.stepCombat(dt);
        } else {
          // Menu / Select / Result live animations
          updateFighterAnimation(this.p1, dt, this.elapsed);
          updateFighterAnimation(this.p2, dt, this.elapsed + 0.7);
        }

        this.updateCamera(dt);
      }

      this.renderer.render(this.scene, this.camera);
    }

    this.scheduleNextFrame();
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    if (!this.renderer) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    let polls = 0;
    const poll = () => {
      if (this.disposed) return;
      polls++;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED && polls < 40) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepCombat(dt: number): void {
    // Hitstop freeze for heavy, meaty fighting game impact feel!
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Round state machine
    if (this.roundPhase === 'intro') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0.55 && this.bannerText !== 'FIGHT!') {
        this.bannerText = 'FIGHT!';
        combatAudio.playWhoosh(1.2);
      }
      if (this.phaseTimer <= 0) {
        this.roundPhase = 'fight';
        this.bannerText = '';
      }
      updateFighterAnimation(this.p1, dt, this.elapsed);
      updateFighterAnimation(this.p2, dt, this.elapsed + 0.5);
      this.emitHud(true);
      return;
    }

    if (this.roundPhase === 'ko' || this.roundPhase === 'timeout') {
      // Slow-motion finish!
      const slowDt = dt * 0.45;
      this.phaseTimer -= dt;
      this.stepFighterPhysics(this.p1, slowDt);
      this.stepFighterPhysics(this.p2, slowDt);
      updateFighterAnimation(this.p1, slowDt, this.elapsed);
      updateFighterAnimation(this.p2, slowDt, this.elapsed);

      if (this.phaseTimer <= 0) {
        this.resolveRoundEnd();
      }
      this.emitHud(false);
      return;
    }

    if (this.roundPhase === 'match_over') {
      updateFighterAnimation(this.p1, dt, this.elapsed);
      updateFighterAnimation(this.p2, dt, this.elapsed);
      return;
    }

    // Active Fight Phase
    this.stats.elapsedSeconds += dt;
    this.timer = Math.max(0, this.timer - dt);
    if (this.timer <= 0) {
      this.roundPhase = 'timeout';
      this.phaseTimer = 2.0;
      this.bannerText = 'TIME UP!';
      combatAudio.playGong();
      this.clearInputs();
      this.emitHud(true);
      return;
    }

    // Snapshot & consume edge-triggered player inputs
    const p1In: PlayerInputState = { ...this.playerInput };
    this.playerInput.jumpPressed = false;
    this.playerInput.punchPressed = false;
    this.playerInput.kickPressed = false;
    this.playerInput.specialPressed = false;

    const p2In = this.ai.update(
      this.p2,
      this.p1,
      this.difficulty,
      dt,
      this.gameMode === 'arcade100' ? this.arcadeLevel : this.gameMode === 'tournament' ? 20 + this.arcadeLevel * 20 : 1,
    );

    this.processFighterControl(this.p1, this.p2, p1In, dt);
    this.processFighterControl(this.p2, this.p1, p2In, dt);

    this.stepFighterPhysics(this.p1, dt);
    this.stepFighterPhysics(this.p2, dt);

    this.resolveFighterSeparation();

    // Resolve attack hitboxes
    this.checkAttackHit(this.p1, this.p2, true);
    this.checkAttackHit(this.p2, this.p1, false);

    // Check KO
    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      this.triggerKO();
    }

    updateFighterAnimation(this.p1, dt, this.elapsed);
    updateFighterAnimation(this.p2, dt, this.elapsed + 0.5);

    // Modulate ambient crowd excitement based on low HP (<45% -> <20%) and combo heat
    const minHpPct = Math.min(this.p1.hp / this.p1.maxHp, this.p2.hp / this.p2.maxHp);
    const activeCombo = Math.max(this.p1.comboCount, this.p2.comboCount);
    const hpTension = minHpPct < 0.45 ? Math.min(1, (0.45 - minHpPct) / 0.3) : 0;
    const comboTension = Math.min(0.4, activeCombo * 0.09);
    combatAudio.updateCrowdTension(Math.min(1, 0.15 + hpTension * 0.65 + comboTension));

    this.emitHud(false);
  }

  private processFighterControl(
    f: FighterInstance,
    opp: FighterInstance,
    input: PlayerInputState,
    dt: number,
  ): void {
    f.actionTimer += dt;
    if (f.comboWindowTimer > 0) f.comboWindowTimer -= dt;
    if (f.comboDisplayTimer > 0) {
      f.comboDisplayTimer -= dt;
      if (f.comboDisplayTimer <= 0) f.comboCount = 0;
    }

    // Passive energy trickle
    f.energy = Math.min(100, f.energy + dt * 2.2);

    if (f.action === 'ko' || f.action === 'victory') return;

    // Hitstun recovery
    if (f.action === 'hitstun') {
      f.hitstunTimer -= dt;
      if (f.hitstunTimer <= 0) {
        f.action = f.grounded ? 'idle' : 'jump';
        f.actionTimer = 0;
      }
      return;
    }

    const isAttacking =
      f.action === 'punch_1' ||
      f.action === 'punch_2' ||
      f.action === 'punch_3' ||
      f.action === 'kick' ||
      f.action === 'special';

    // Buffer attack inputs mid-combo
    if (isAttacking) {
      const move = MOVE_DATA[f.action as keyof typeof MOVE_DATA];
      if (input.punchPressed) f.bufferedAttack = 'punch';
      else if (input.kickPressed) f.bufferedAttack = 'kick';
      else if (input.specialPressed && f.energy >= 100) f.bufferedAttack = 'special';

      // Allow combo chaining once past active frames!
      if (f.actionTimer >= move.activeEnd && f.bufferedAttack) {
        const next = f.bufferedAttack;
        f.bufferedAttack = null;
        if (next === 'special' && f.energy >= 100) {
          this.startSpecial(f);
          return;
        }
        if (next === 'punch' && (f.action === 'punch_1' || f.action === 'punch_2')) {
          this.startPunch(f, f.action === 'punch_1' ? 'punch_2' : 'punch_3');
          return;
        }
        if (next === 'kick' && (f.action === 'punch_1' || f.action === 'punch_2')) {
          this.startKick(f);
          return;
        }
      }

      if (f.actionTimer >= move.duration) {
        f.action = f.grounded ? 'idle' : 'jump';
        f.actionTimer = 0;
        f.bufferedAttack = null;
      } else {
        // Apply forward lunge during active burst
        if (f.actionTimer >= move.windupEnd && f.actionTimer <= move.activeEnd) {
          f.vx = f.facing * move.lungeSpeed;
        } else {
          f.vx = THREE.MathUtils.damp(f.vx, 0, 12, dt);
        }
        return;
      }
    }

    // Face opponent when idle, walking, or blocking
    if (f.grounded && Math.abs(opp.x - f.x) > 0.15) {
      f.facing = opp.x >= f.x ? 1 : -1;
    }

    // Priority 1: Special Attack
    if (input.specialPressed && f.energy >= 100 && f.grounded) {
      this.startSpecial(f);
      return;
    }

    // Priority 2: Block (ground only)
    if (input.block && f.grounded) {
      if (f.action !== 'block') {
        f.action = 'block';
        f.actionTimer = 0;
      }
      f.vx = THREE.MathUtils.damp(f.vx, 0, 18, dt);
      f.vz = THREE.MathUtils.damp(f.vz, 0, 18, dt);
      return;
    }

    // Priority 3: Punch / Kick
    if (input.punchPressed) {
      const nextPunch =
        f.comboWindowTimer > 0 && f.comboStep === 1
          ? 'punch_2'
          : f.comboWindowTimer > 0 && f.comboStep === 2
            ? 'punch_3'
            : 'punch_1';
      this.startPunch(f, nextPunch);
      return;
    }
    if (input.kickPressed) {
      this.startKick(f);
      return;
    }

    // Priority 4: Jump
    if (input.jumpPressed && f.grounded) {
      f.grounded = false;
      f.vy = f.spec.jumpForce;
      f.vx = input.moveX * f.spec.moveSpeed * 0.95;
      f.action = 'jump';
      f.actionTimer = 0;
      combatAudio.playJump();
      this.vfx.spawnDust(f.x, f.z, 5);
      return;
    }

    // Movement on X & Z axes
    const spd = f.spec.moveSpeed;
    f.vx = THREE.MathUtils.damp(f.vx, input.moveX * spd, 14, dt);
    f.vz = THREE.MathUtils.damp(f.vz, input.moveZ * spd * 0.68, 14, dt);

    if (!f.grounded) {
      f.action = 'jump';
    } else if (Math.abs(input.moveX) > 0.15 || Math.abs(input.moveZ) > 0.15) {
      const movingToward = Math.sign(input.moveX) === f.facing;
      f.action = movingToward || Math.abs(input.moveX) < 0.15 ? 'walk_fwd' : 'walk_back';
    } else {
      f.action = 'idle';
    }
  }

  private startPunch(f: FighterInstance, type: 'punch_1' | 'punch_2' | 'punch_3') {
    f.action = type;
    f.actionTimer = 0;
    f.hitConfirmedThisMove = false;
    f.comboStep = type === 'punch_1' ? 1 : type === 'punch_2' ? 2 : 0;
    f.comboWindowTimer = 0.55;
    combatAudio.playWhoosh(type === 'punch_3' ? 0.8 : 1.15);
  }

  private startKick(f: FighterInstance) {
    f.action = 'kick';
    f.actionTimer = 0;
    f.hitConfirmedThisMove = false;
    f.comboStep = 0;
    combatAudio.playWhoosh(0.92);
  }

  private startSpecial(f: FighterInstance) {
    f.energy = 0;
    f.action = 'special';
    f.actionTimer = 0;
    f.hitConfirmedThisMove = false;
    f.comboStep = 0;
    if (f === this.p1) this.stats.specialsUsed++;
    combatAudio.playSpecial();
    this.vfx.spawnSpecialBurst(f.x, f.y + 1.0, f.z, f.spec.palette.energy);
    this.shakeIntensity = Math.max(this.shakeIntensity, 0.22);
  }

  private stepFighterPhysics(f: FighterInstance, dt: number): void {
    f.x += f.vx * dt;
    f.z += f.vz * dt;

    if (!f.grounded) {
      f.vy -= GRAVITY * dt;
      f.y += f.vy * dt;
      if (f.y <= 0) {
        f.y = 0;
        f.vy = 0;
        f.grounded = true;
        this.vfx.spawnDust(f.x, f.z, 4);
        if (f.action === 'jump') {
          f.action = 'idle';
          f.actionTimer = 0;
        }
      }
    }

    // Clamp to circular tournament dais (ARENA_RADIUS) and Z combat lane
    f.z = THREE.MathUtils.clamp(f.z, -2.5, 2.5);
    const distSq = f.x * f.x + f.z * f.z;
    const maxR = ARENA_RADIUS - 0.5;
    if (distSq > maxR * maxR) {
      const dist = Math.sqrt(distSq);
      f.x = (f.x / dist) * maxR;
      f.z = (f.z / dist) * maxR;
    }

    // Friction when airborne or stunned
    if (f.action === 'hitstun' || f.action === 'ko') {
      f.vx = THREE.MathUtils.damp(f.vx, 0, 7, dt);
      f.vz = THREE.MathUtils.damp(f.vz, 0, 7, dt);
    }

    // Update Three.js transform
    f.joints.root.position.set(f.x, f.y, f.z);
    const targetRotY = f.facing === 1 ? Math.PI / 2 : -Math.PI / 2;
    f.joints.root.rotation.y = THREE.MathUtils.damp(f.joints.root.rotation.y, targetRotY, 18, dt);
  }

  private resolveFighterSeparation(): void {
    const dx = this.p2.x - this.p1.x;
    const dz = this.p2.z - this.p1.z;
    const dist = Math.hypot(dx, dz);
    const minSep = 0.95;
    if (dist < minSep && Math.abs(this.p1.y - this.p2.y) < 1.2) {
      const nx = dist > 0.001 ? dx / dist : 1;
      const nz = dist > 0.001 ? dz / dist : 0;
      const push = (minSep - dist) * 0.5;
      this.p1.x -= nx * push;
      this.p1.z -= nz * push;
      this.p2.x += nx * push;
      this.p2.z += nz * push;
    }
  }

  private checkAttackHit(attacker: FighterInstance, defender: FighterInstance, isP1Attacking: boolean): void {
    if (attacker.hitConfirmedThisMove) return;
    if (
      attacker.action !== 'punch_1' &&
      attacker.action !== 'punch_2' &&
      attacker.action !== 'punch_3' &&
      attacker.action !== 'kick' &&
      attacker.action !== 'special'
    ) {
      return;
    }

    const move = MOVE_DATA[attacker.action];
    if (attacker.actionTimer < move.windupEnd || attacker.actionTimer > move.activeEnd) {
      return;
    }

    // Check facing, horizontal reach, depth lane tolerance, and vertical proximity
    const dx = defender.x - attacker.x;
    const dz = Math.abs(defender.z - attacker.z);
    const dy = Math.abs(defender.y - attacker.y);
    const reach = move.range + attacker.spec.reachBonus;

    const inFront = Math.sign(dx) === attacker.facing || Math.abs(dx) < 0.65;
    if (!inFront || Math.abs(dx) > reach || dz > 1.15 || dy > 1.5) {
      return;
    }

    // Hit confirmed!
    attacker.hitConfirmedThisMove = true;
    const hitX = (attacker.x + defender.x) * 0.5 + attacker.facing * 0.25;
    const hitY = defender.y + (attacker.action === 'kick' ? 1.3 : 1.12);
    const hitZ = defender.z;

    const isBlocked = defender.action === 'block' && attacker.action !== 'special';
    const rawDamage = move.damage * attacker.powerScale;

    if (isBlocked) {
      // Blocked strike!
      const chip = move.chipDamage;
      defender.hp = Math.max(1, defender.hp - chip);
      defender.vx = attacker.facing * move.knockback * 0.45;
      defender.energy = Math.min(100, defender.energy + 12);
      attacker.energy = Math.min(100, attacker.energy + 6);
      if (!isP1Attacking) this.stats.blocksLanded++;

      combatAudio.playBlock();
      this.vfx.spawnBlockSparks(hitX, hitY, hitZ);
      this.hitstopTimer = 0.025;
      this.shakeIntensity = Math.max(this.shakeIntensity, 0.08);
    } else {
      // Clean direct hit! (Special breaks regular block for partial heavy impact)
      const finalDamage = defender.action === 'block' ? rawDamage * 0.55 : rawDamage;
      defender.hp = Math.max(0, defender.hp - finalDamage);
      defender.vx = attacker.facing * move.knockback;
      if (attacker.action === 'punch_3' || attacker.action === 'special') {
        defender.vy = 3.2;
        defender.grounded = false;
      }

      defender.action = 'hitstun';
      defender.actionTimer = 0;
      defender.hitstunTimer = move.hitstun;
      defender.flashTimer = 0.1;

      attacker.energy = Math.min(100, attacker.energy + (move.isHeavy ? 18 : 11));
      defender.energy = Math.min(100, defender.energy + 9);

      attacker.comboCount++;
      attacker.comboDisplayTimer = 1.6;
      if (isP1Attacking) {
        this.stats.damageDealt += Math.round(finalDamage);
        if (attacker.comboCount > this.stats.maxCombo) {
          this.stats.maxCombo = attacker.comboCount;
        }
      }

      combatAudio.playHit(move.isHeavy);
      this.vfx.spawnHitSparks(hitX, hitY, hitZ, move.isHeavy, attacker.spec.palette.energy);
      this.hitstopTimer = move.hitstop;
      this.shakeIntensity = Math.max(this.shakeIntensity, move.isHeavy ? 0.24 : 0.1);

      // Reactive Arena Crowd Layer: low HP (<20%) & combo streak / special reactions
      if (defender.hp > 0) {
        const defPct = defender.hp / defender.maxHp;
        const canReact = this.elapsed - this.lastCrowdReactionTime >= 1.1;

        if (!isP1Attacking && defPct < 0.2 && !this.p1LowHpCrowdTriggered) {
          this.p1LowHpCrowdTriggered = true;
          this.lastCrowdReactionTime = this.elapsed;
          combatAudio.playCrowdBoo(0.92, true);
        } else if (isP1Attacking && defPct < 0.2 && !this.p2LowHpCrowdTriggered) {
          this.p2LowHpCrowdTriggered = true;
          this.lastCrowdReactionTime = this.elapsed;
          combatAudio.playCrowdCheer(0.9);
        } else if (isP1Attacking) {
          const isComebackHeavy = this.p1.hp / this.p1.maxHp < 0.2 && move.isHeavy;
          if (attacker.action === 'special' && this.elapsed - this.lastCrowdReactionTime >= 0.65) {
            this.lastCrowdReactionTime = this.elapsed;
            combatAudio.playCrowdCheer(0.95);
          } else if (attacker.comboCount >= 3 && (canReact || attacker.comboCount >= 5)) {
            this.lastCrowdReactionTime = this.elapsed;
            const intensity = Math.min(1, 0.55 + (attacker.comboCount - 2) * 0.14);
            combatAudio.playCrowdCheer(intensity);
          } else if (isComebackHeavy && canReact) {
            this.lastCrowdReactionTime = this.elapsed;
            combatAudio.playCrowdCheer(0.85);
          }
        } else {
          if (attacker.action === 'special' && canReact) {
            this.lastCrowdReactionTime = this.elapsed;
            combatAudio.playCrowdBoo(0.82, false);
          } else if (attacker.comboCount >= 3 && canReact) {
            this.lastCrowdReactionTime = this.elapsed;
            combatAudio.playCrowdBoo(Math.min(0.95, 0.58 + attacker.comboCount * 0.08), false);
          }
        }
      }
    }
  }

  private triggerKO(): void {
    this.roundPhase = 'ko';
    this.phaseTimer = 2.3;
    this.bannerText = 'K.O.!';
    combatAudio.playGong();
    this.shakeIntensity = 0.36;
    this.clearInputs();

    if (this.p1.hp <= 0) {
      this.p1.action = 'ko';
      this.p1.actionTimer = 0;
      this.p1.vx = -this.p1.facing * 4.5;
    }
    if (this.p2.hp <= 0) {
      this.p2.action = 'ko';
      this.p2.actionTimer = 0;
      this.p2.vx = -this.p2.facing * 4.5;
    }

    if (this.p2.hp <= 0 && this.p1.hp > 0) {
      combatAudio.playCrowdCheer(1.0);
    } else {
      combatAudio.playCrowdBoo(1.0, true);
    }

    this.emitHud(true);
  }

  private resolveRoundEnd(): void {
    const p1Pct = this.p1.hp / this.p1.maxHp;
    const p2Pct = this.p2.hp / this.p2.maxHp;

    if (p1Pct > p2Pct) {
      this.p1Rounds++;
      this.p1.action = 'victory';
    } else if (p2Pct > p1Pct) {
      this.p2Rounds++;
      this.p2.action = 'victory';
    }

    if (this.p1Rounds >= 2 || this.p2Rounds >= 2 || this.roundNumber >= 3) {
      this.roundPhase = 'match_over';
      this.winner = this.p1Rounds > this.p2Rounds ? 'p1' : this.p2Rounds > this.p1Rounds ? 'p2' : 'draw';
      this.bannerText = this.winner === 'p1' ? 'VICTORY' : this.winner === 'p2' ? 'DEFEAT' : 'DRAW';
      this.screen = 'result';
      combatAudio.setCrowdActive(false);
      this.emitHud(true);
    } else {
      this.startRound(this.roundNumber + 1);
    }
  }

  private updateCamera(dt: number): void {
    if (this.screen === 'menu') {
      const orbitA = this.elapsed * 0.24;
      _camPosTarget.set(Math.sin(orbitA) * 7.8, 2.6 + Math.sin(this.elapsed * 0.4) * 0.35, Math.cos(orbitA) * 7.8);
      _camLookTarget.set(0, 1.15, 0);
    } else if (this.screen === 'select') {
      _camPosTarget.set(0, 2.05, 6.2);
      _camLookTarget.set(0, 1.15, 0);
    } else if (this.screen === 'stage' || this.screen === 'tournament') {
      const sway = Math.sin(this.elapsed * 0.35) * 1.9;
      _camPosTarget.set(sway, 3.25, 9.8);
      _camLookTarget.set(0, 1.5, -1.8);
    } else if (this.screen === 'result') {
      const champ = this.winner === 'p2' ? this.p2 : this.p1;
      _camPosTarget.set(champ.x + champ.facing * 1.4, 1.85, champ.z + 4.1);
      _camLookTarget.set(champ.x, 1.25, champ.z);
    } else {
      // Dynamic Fighting Camera framing both fighters
      const midX = (this.p1.x + this.p2.x) * 0.5;
      const midY = Math.max(this.p1.y, this.p2.y) * 0.4 + 1.18;
      const midZ = (this.p1.z + this.p2.z) * 0.5;
      const sep = Math.abs(this.p1.x - this.p2.x);
      const camDist = THREE.MathUtils.clamp(5.8 + sep * 0.62, 6.2, 10.6);

      _camPosTarget.set(midX * 0.72, 2.25 + sep * 0.1, midZ + camDist);
      _camLookTarget.set(midX, midY, midZ);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camPosTarget.x, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camPosTarget.y, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camPosTarget.z, 8, dt);

    _camLookCurrent.x = THREE.MathUtils.damp(_camLookCurrent.x, _camLookTarget.x, 10, dt);
    _camLookCurrent.y = THREE.MathUtils.damp(_camLookCurrent.y, _camLookTarget.y, 10, dt);
    _camLookCurrent.z = THREE.MathUtils.damp(_camLookCurrent.z, _camLookTarget.z, 10, dt);

    // Decaying Camera Shake on heavy combat hits
    if (this.shakeIntensity > 0.002) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 14, dt);
    }

    this.camera.lookAt(_camLookCurrent);
  }

  private emitHud(force: boolean): void {
    const now = performance.now();
    if (!force && now - this.lastHudEmit < 50) return; // ~20Hz HUD updates keeps React lightweight
    this.lastHudEmit = now;

    this.onHudUpdate({
      screen: this.screen,
      gameMode: this.gameMode,
      arcadeLevel: this.arcadeLevel,
      p1Hp: Math.ceil(this.p1.hp),
      p1MaxHp: this.p1.maxHp,
      p1Energy: Math.floor(this.p1.energy),
      p1Rounds: this.p1Rounds,
      p1Combo: this.p1.comboCount,
      p1Action: this.p1.action,
      p2Hp: Math.ceil(this.p2.hp),
      p2MaxHp: this.p2.maxHp,
      p2Energy: Math.floor(this.p2.energy),
      p2Rounds: this.p2Rounds,
      p2Combo: this.p2.comboCount,
      p2Action: this.p2.action,
      timer: Math.ceil(this.timer),
      roundNumber: this.roundNumber,
      roundPhase: this.roundPhase,
      bannerText: this.bannerText,
      winner: this.winner,
      matchStats: { ...this.stats },
    });
  }

  public dispose(): void {
    this.disposed = true;
    combatAudio.setCrowdActive(false);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }

    this.p1?.dispose();
    this.p2?.dispose();
    this.arena.dispose();
    this.vfx.dispose();
    this.textures.dispose();
    this.envRT.dispose();
  }
}
