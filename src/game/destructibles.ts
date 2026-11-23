import * as THREE from 'three';
import { combatAudio } from './audio';
import { StageId } from './types';
import { CombatVfxManager } from './vfx';

export type DestructibleKind = 'pillar' | 'vase';

export interface DestructibleSplashEvent {
  x: number;
  z: number;
  kind: DestructibleKind;
  color: number;
}

interface DebrisFragment {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  baseScale: number;
  bounces: number;
}

interface DestructibleProp {
  id: number;
  kind: DestructibleKind;
  x: number;
  z: number;
  radius: number;
  height: number;
  broken: boolean;
  accentColor: number;
  root: THREE.Group;
  intactGroup: THREE.Group;
  stumpGroup: THREE.Group;
  fragments: DebrisFragment[];
}

interface StagePropPalette {
  pillarPrimary: number;
  pillarSecondary: number;
  pillarMetal: number;
  vasePrimary: number;
  vaseTrim: number;
  vaseCore: number;
  vaseMetalness: number;
  vaseRoughness: number;
  pillarRoughness: number;
}

function getStagePropPalette(stageId: StageId): StagePropPalette {
  switch (stageId) {
    case 'temple':
      return {
        pillarPrimary: 0x3f4756,
        pillarSecondary: 0x8c2424,
        pillarMetal: 0xd49a35,
        vasePrimary: 0x991b1b,
        vaseTrim: 0xf59e0b,
        vaseCore: 0xff7a18,
        vaseMetalness: 0.15,
        vaseRoughness: 0.28,
        pillarRoughness: 0.85,
      };
    case 'rooftop':
      return {
        pillarPrimary: 0x475569,
        pillarSecondary: 0x1e293b,
        pillarMetal: 0xf59e0b,
        vasePrimary: 0x0284c7,
        vaseTrim: 0xfbbf24,
        vaseCore: 0x38bdf8,
        vaseMetalness: 0.65,
        vaseRoughness: 0.34,
        pillarRoughness: 0.72,
      };
    case 'dojo':
      return {
        pillarPrimary: 0x5c3621,
        pillarSecondary: 0x2b170e,
        pillarMetal: 0xd97706,
        vasePrimary: 0xd6d3d1,
        vaseTrim: 0x991b1b,
        vaseCore: 0xff9b3d,
        vaseMetalness: 0.08,
        vaseRoughness: 0.25,
        pillarRoughness: 0.76,
      };
    case 'volcano':
      return {
        pillarPrimary: 0x292124,
        pillarSecondary: 0x451a14,
        pillarMetal: 0xff5a14,
        vasePrimary: 0x1c1917,
        vaseTrim: 0xf97316,
        vaseCore: 0xff4500,
        vaseMetalness: 0.28,
        vaseRoughness: 0.42,
        pillarRoughness: 0.88,
      };
    case 'glacier':
      return {
        pillarPrimary: 0x38bdf8,
        pillarSecondary: 0x1e3a5f,
        pillarMetal: 0xe0f2fe,
        vasePrimary: 0xbae6fd,
        vaseTrim: 0x22d3ee,
        vaseCore: 0x67e8f9,
        vaseMetalness: 0.22,
        vaseRoughness: 0.16,
        pillarRoughness: 0.22,
      };
    case 'bamboo':
    default:
      return {
        pillarPrimary: 0x375244,
        pillarSecondary: 0x1f3329,
        pillarMetal: 0x10b981,
        vasePrimary: 0x92400e,
        vaseTrim: 0x34d399,
        vaseCore: 0xfbbf24,
        vaseMetalness: 0.1,
        vaseRoughness: 0.36,
        pillarRoughness: 0.86,
      };
  }
}

export class DestructibleArenaManager {
  private group = new THREE.Group();
  private props: DestructibleProp[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(parentGroup: THREE.Group, stageId: StageId, isSoftwareGl: boolean) {
    parentGroup.add(this.group);

    const pal = getStagePropPalette(stageId);

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      this.geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      this.materials.push(m);
      return m;
    };

    // Distinct PBR materials with >= 0.25 roughness/metalness contrast
    const pillarBodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: pal.pillarPrimary,
        roughness: pal.pillarRoughness,
        metalness: stageId === 'glacier' ? 0.12 : 0.08,
      }),
    );
    const pillarBaseMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: pal.pillarSecondary,
        roughness: Math.min(0.95, pal.pillarRoughness + 0.08),
        metalness: 0.12,
      }),
    );
    const pillarTrimMat = trackMat(
      stageId === 'volcano'
        ? new THREE.MeshStandardMaterial({
            color: pal.pillarMetal,
            emissive: pal.pillarMetal,
            emissiveIntensity: 0.9,
            roughness: 0.35,
            metalness: 0.2,
          })
        : new THREE.MeshPhysicalMaterial({
            color: pal.pillarMetal,
            metalness: 0.86,
            roughness: 0.22,
            clearcoat: 0.35,
          }),
    );

    const vaseBodyMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: pal.vasePrimary,
        roughness: pal.vaseRoughness,
        metalness: pal.vaseMetalness,
        clearcoat: 0.65,
        clearcoatRoughness: 0.2,
      }),
    );
    const vaseTrimMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: pal.vaseTrim,
        metalness: 0.85,
        roughness: 0.22,
        clearcoat: 0.3,
      }),
    );
    const vaseCoreMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: pal.vaseCore,
        emissive: pal.vaseCore,
        emissiveIntensity: 1.45,
        roughness: 0.3,
      }),
    );

    // Shared composite geometries for crumbling pillars (grounded at y = 0)
    const plinthGeo = trackGeo(new THREE.BoxGeometry(0.92, 0.24, 0.92));
    const lowerColGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.37, 0.82, 8));
    const midBandGeo = trackGeo(new THREE.CylinderGeometry(0.37, 0.37, 0.14, 10));
    const upperColGeo = trackGeo(new THREE.CylinderGeometry(0.3, 0.32, 0.86, 8));
    const capSlabGeo = trackGeo(new THREE.BoxGeometry(0.86, 0.22, 0.86));
    const stumpGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.39, 0.36, 7));
    const pillarShardGeo = trackGeo(new THREE.DodecahedronGeometry(0.18, 0));

    // Shared LatheGeometry vessel profile + composite collar/seal for exploding vases
    const lathePoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.36, 0.26),
      new THREE.Vector2(0.38, 0.56),
      new THREE.Vector2(0.24, 0.82),
      new THREE.Vector2(0.16, 0.94),
      new THREE.Vector2(0.22, 1.02),
      new THREE.Vector2(0.14, 1.02),
    ];
    const vaseBodyGeo = trackGeo(new THREE.LatheGeometry(lathePoints, 14));
    const vaseFootGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.1, 14));
    const vaseCollarGeo = trackGeo(new THREE.TorusGeometry(0.23, 0.045, 8, 16));
    const vaseSealGeo = trackGeo(new THREE.OctahedronGeometry(0.14, 0));
    const vaseShardBaseGeo = trackGeo(new THREE.CylinderGeometry(0.34, 0.18, 0.04, 7));
    const vaseShardGeo = trackGeo(new THREE.TetrahedronGeometry(0.14, 0));

    // Layout inside the 6.0m dais radius (flanks & rear corners leave center duel clear)
    const placements: Array<{ kind: DestructibleKind; x: number; z: number }> = [
      { kind: 'pillar', x: -4.45, z: -1.85 },
      { kind: 'pillar', x: 4.45, z: -1.85 },
      { kind: 'vase', x: -3.25, z: -2.05 },
      { kind: 'vase', x: 3.25, z: -2.05 },
      { kind: 'vase', x: -4.85, z: 0.72 },
      { kind: 'vase', x: 4.85, z: 0.72 },
    ];

    placements.forEach((p, idx) => {
      const root = new THREE.Group();
      root.position.set(p.x, 0, p.z);
      this.group.add(root);

      const intactGroup = new THREE.Group();
      const stumpGroup = new THREE.Group();
      stumpGroup.visible = false;
      root.add(intactGroup);
      root.add(stumpGroup);

      if (p.kind === 'pillar') {
        // 5-part crumbling pillar (plinth + lower shaft + metal band + upper shaft + cap)
        const plinth = new THREE.Mesh(plinthGeo, pillarBaseMat);
        plinth.position.y = 0.12;
        plinth.castShadow = !isSoftwareGl;
        plinth.receiveShadow = true;
        intactGroup.add(plinth);

        const lower = new THREE.Mesh(lowerColGeo, pillarBodyMat);
        lower.position.y = 0.65;
        lower.castShadow = !isSoftwareGl;
        lower.receiveShadow = true;
        intactGroup.add(lower);

        const band = new THREE.Mesh(midBandGeo, pillarTrimMat);
        band.position.y = 1.1;
        band.castShadow = !isSoftwareGl;
        intactGroup.add(band);

        const upper = new THREE.Mesh(upperColGeo, pillarBodyMat);
        upper.position.y = 1.56;
        upper.castShadow = !isSoftwareGl;
        upper.receiveShadow = true;
        intactGroup.add(upper);

        const cap = new THREE.Mesh(capSlabGeo, pillarBaseMat);
        cap.position.y = 2.08;
        cap.castShadow = !isSoftwareGl;
        intactGroup.add(cap);

        // Broken jagged base stump left on the dais
        const brokenPlinth = new THREE.Mesh(plinthGeo, pillarBaseMat);
        brokenPlinth.position.y = 0.12;
        brokenPlinth.receiveShadow = true;
        stumpGroup.add(brokenPlinth);

        const stump = new THREE.Mesh(stumpGeo, pillarBodyMat);
        stump.position.y = 0.38;
        stump.rotation.set(0.08, idx * 0.9, -0.06);
        stump.castShadow = !isSoftwareGl;
        stumpGroup.add(stump);
      } else {
        // 4-part exploding vase / pressurized canister (foot + lathe vessel + collar + glowing seal)
        const foot = new THREE.Mesh(vaseFootGeo, vaseTrimMat);
        foot.position.y = 0.05;
        foot.castShadow = !isSoftwareGl;
        intactGroup.add(foot);

        const body = new THREE.Mesh(vaseBodyGeo, vaseBodyMat);
        body.position.y = 0.06;
        body.castShadow = !isSoftwareGl;
        body.receiveShadow = true;
        intactGroup.add(body);

        const collar = new THREE.Mesh(vaseCollarGeo, vaseTrimMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 0.86;
        intactGroup.add(collar);

        const seal = new THREE.Mesh(vaseSealGeo, vaseCoreMat);
        seal.position.y = 1.12;
        intactGroup.add(seal);

        // Broken ceramic/metal ring residue
        const residue = new THREE.Mesh(vaseShardBaseGeo, vaseTrimMat);
        residue.position.y = 0.025;
        stumpGroup.add(residue);
      }

      // 7 pre-allocated 3D debris fragments per prop (Zero GC during fight)
      const fragments: DebrisFragment[] = [];
      const fragCount = 7;
      for (let f = 0; f < fragCount; f++) {
        const mesh = new THREE.Mesh(
          p.kind === 'pillar' ? pillarShardGeo : vaseShardGeo,
          p.kind === 'pillar'
            ? f % 3 === 0
              ? pillarTrimMat
              : pillarBodyMat
            : f % 2 === 0
              ? vaseBodyMat
              : vaseTrimMat,
        );
        mesh.visible = false;
        mesh.castShadow = !isSoftwareGl;
        root.add(mesh);

        fragments.push({
          mesh,
          active: false,
          life: 0,
          maxLife: 2.6,
          vx: 0,
          vy: 0,
          vz: 0,
          rx: 0,
          ry: 0,
          rz: 0,
          baseScale: p.kind === 'pillar' ? 0.85 + (f % 3) * 0.25 : 0.78 + (f % 3) * 0.2,
          bounces: 0,
        });
      }

      this.props.push({
        id: idx,
        kind: p.kind,
        x: p.x,
        z: p.z,
        radius: p.kind === 'pillar' ? 0.56 : 0.44,
        height: p.kind === 'pillar' ? 2.2 : 1.2,
        broken: false,
        accentColor: p.kind === 'pillar' ? pal.pillarMetal : pal.vaseCore,
        root,
        intactGroup,
        stumpGroup,
        fragments,
      });
    });
  }

  private shatterProp(
    prop: DestructibleProp,
    dirX: number,
    dirZ: number,
    vfx: CombatVfxManager,
    blastColor?: number,
  ): number {
    prop.broken = true;
    prop.intactGroup.visible = false;
    prop.stumpGroup.visible = true;

    const len = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / len;
    const nz = dirZ / len;

    // Launch all pre-allocated 3D debris chunks outward & upward
    for (let i = 0; i < prop.fragments.length; i++) {
      const frag = prop.fragments[i];
      const angle = (i / prop.fragments.length) * Math.PI * 2 + Math.random() * 0.5;
      const spread = prop.kind === 'vase' ? 4.4 : 3.2;

      frag.active = true;
      frag.life = 0;
      frag.maxLife = 2.4 + (i % 3) * 0.35;
      frag.bounces = 0;

      frag.mesh.position.set(
        Math.cos(angle) * 0.2,
        prop.kind === 'pillar' ? 0.45 + (i / prop.fragments.length) * 1.45 : 0.3 + (i % 4) * 0.18,
        Math.sin(angle) * 0.2,
      );
      frag.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      frag.mesh.scale.setScalar(frag.baseScale);
      frag.mesh.visible = true;

      frag.vx = nx * (2.2 + Math.random() * 2.0) + Math.cos(angle) * spread;
      frag.vy = (prop.kind === 'vase' ? 4.2 : 2.8) + Math.random() * 3.0;
      frag.vz = nz * (2.2 + Math.random() * 2.0) + Math.sin(angle) * spread;
      frag.rx = (Math.random() - 0.5) * 14;
      frag.ry = (Math.random() - 0.5) * 14;
      frag.rz = (Math.random() - 0.5) * 14;
    }

    const burstColor = blastColor ?? prop.accentColor;
    if (prop.kind === 'vase') {
      vfx.spawnHitSparks(prop.x, 0.72, prop.z, true, burstColor);
      vfx.spawnDust(prop.x, prop.z, 7);
    } else {
      vfx.spawnShockwave(prop.x, 0.08, prop.z, burstColor, 3.2, true);
      vfx.spawnDust(prop.x, prop.z, 10);
    }

    combatAudio.playPropBreak(prop.kind);
    return prop.kind === 'vase' ? 0.25 : 0.21;
  }

  /** Trigger props when a fighter collides physically or lunges into them. Returns camera shake + any exploding vase events. */
  public checkFighterCollision(
    fx: number,
    fy: number,
    fz: number,
    vfx: CombatVfxManager,
  ): { shake: number; explosions: DestructibleSplashEvent[] } {
    let shake = 0;
    const explosions: DestructibleSplashEvent[] = [];

    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      if (prop.broken) continue;

      const dx = prop.x - fx;
      const dz = prop.z - fz;
      const dist = Math.hypot(dx, dz);
      const hitDist = prop.radius + 0.52;

      if (dist <= hitDist && fy < prop.height) {
        const s = this.shatterProp(prop, dx, dz, vfx);
        shake = Math.max(shake, s);
        if (prop.kind === 'vase') {
          explosions.push({ x: prop.x, z: prop.z, kind: 'vase', color: prop.accentColor });
        }
      }
    }

    return { shake, explosions };
  }

  /** Shatter all intact props inside a Special Attack shockwave radius. */
  public triggerSpecialBlast(
    originX: number,
    originZ: number,
    blastRadius: number,
    energyColor: number,
    vfx: CombatVfxManager,
  ): { shake: number; explosions: DestructibleSplashEvent[] } {
    let shake = 0;
    const explosions: DestructibleSplashEvent[] = [];

    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      if (prop.broken) continue;

      const dx = prop.x - originX;
      const dz = prop.z - originZ;
      if (Math.hypot(dx, dz) <= blastRadius) {
        const s = this.shatterProp(prop, dx, dz, vfx, energyColor);
        shake = Math.max(shake, s);
        if (prop.kind === 'vase') {
          explosions.push({ x: prop.x, z: prop.z, kind: 'vase', color: energyColor });
        }
      }
    }

    return { shake, explosions };
  }

  public update(elapsed: number, dt: number): void {
    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];

      // Subtle floating gem pulse on intact exploding urns
      if (!prop.broken && prop.kind === 'vase') {
        const seal = prop.intactGroup.children[3];
        if (seal) {
          seal.rotation.y = elapsed * 2.2 + prop.id;
          seal.position.y = 1.12 + Math.sin(elapsed * 3.5 + prop.id) * 0.035;
        }
      }

      for (let f = 0; f < prop.fragments.length; f++) {
        const frag = prop.fragments[f];
        if (!frag.active) continue;

        frag.life += dt;
        if (frag.life >= frag.maxLife) {
          frag.active = false;
          frag.mesh.visible = false;
          continue;
        }

        frag.vy -= 20 * dt;
        frag.mesh.position.x += frag.vx * dt;
        frag.mesh.position.y += frag.vy * dt;
        frag.mesh.position.z += frag.vz * dt;
        frag.mesh.rotation.x += frag.rx * dt;
        frag.mesh.rotation.y += frag.ry * dt;
        frag.mesh.rotation.z += frag.rz * dt;

        // Bounce on stone dais top surface (y = 0.08)
        if (frag.mesh.position.y < 0.08) {
          frag.mesh.position.y = 0.08;
          if (frag.bounces < 2 && Math.abs(frag.vy) > 1.2) {
            frag.vy = -frag.vy * 0.42;
            frag.vx *= 0.68;
            frag.vz *= 0.68;
            frag.rx *= 0.65;
            frag.ry *= 0.65;
            frag.rz *= 0.65;
            frag.bounces++;
          } else {
            frag.vy = 0;
            frag.vx *= Math.max(0, 1 - dt * 5);
            frag.vz *= Math.max(0, 1 - dt * 5);
            frag.rx *= Math.max(0, 1 - dt * 6);
            frag.ry *= Math.max(0, 1 - dt * 6);
            frag.rz *= Math.max(0, 1 - dt * 6);
          }
        }

        // Smooth scale fade in final 0.55s
        const remaining = frag.maxLife - frag.life;
        if (remaining < 0.55) {
          frag.mesh.scale.setScalar(Math.max(0.01, frag.baseScale * (remaining / 0.55)));
        }
      }
    }
  }

  public resetAll(): void {
    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      prop.broken = false;
      prop.intactGroup.visible = true;
      prop.stumpGroup.visible = false;
      for (let f = 0; f < prop.fragments.length; f++) {
        const frag = prop.fragments[f];
        frag.active = false;
        frag.mesh.visible = false;
      }
    }
  }

  public dispose(): void {
    this.group.parent?.remove(this.group);
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
