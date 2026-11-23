import * as THREE from 'three';

interface ParticleSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  growSpeed: number;
}

interface ShockwaveSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  life: number;
  maxLife: number;
  maxScale: number;
}

export class CombatVfxManager {
  private particles: ParticleSlot[] = [];
  private shockwaves: ShockwaveSlot[] = [];
  private sharedBoxGeo: THREE.OctahedronGeometry;
  private sharedRingGeo: THREE.RingGeometry;
  private group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    this.sharedBoxGeo = new THREE.OctahedronGeometry(0.08, 0);
    this.sharedRingGeo = new THREE.RingGeometry(0.25, 0.42, 24);

    // Pre-allocate 72 pooled particles (zero GC allocations during combat!)
    for (let i = 0; i < 72; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.sharedBoxGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        mat,
        active: false,
        life: 0,
        maxLife: 0.3,
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 0,
        growSpeed: 0,
      });
    }

    // Pre-allocate 10 pooled shockwave rings
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.sharedRingGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.shockwaves.push({
        mesh,
        mat,
        active: false,
        life: 0,
        maxLife: 0.35,
        maxScale: 3.5,
      });
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    color: number,
    scale: number,
    maxLife: number,
    gravity: number,
    growSpeed = 0,
  ) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.life = 0;
        p.maxLife = maxLife;
        p.vx = vx;
        p.vy = vy;
        p.vz = vz;
        p.gravity = gravity;
        p.growSpeed = growSpeed;
        p.mat.color.setHex(color);
        p.mat.opacity = 1;
        p.mesh.position.set(x, y, z);
        p.mesh.scale.setScalar(scale);
        p.mesh.visible = true;
        return;
      }
    }
  }

  public spawnShockwave(x: number, y: number, z: number, color: number, maxScale = 3.5, horizontal = true) {
    for (let i = 0; i < this.shockwaves.length; i++) {
      const s = this.shockwaves[i];
      if (!s.active) {
        s.active = true;
        s.life = 0;
        s.maxLife = 0.32;
        s.maxScale = maxScale;
        s.mat.color.setHex(color);
        s.mat.opacity = 0.9;
        s.mesh.position.set(x, y, z);
        s.mesh.rotation.set(horizontal ? -Math.PI / 2 : 0, 0, 0);
        s.mesh.scale.setScalar(0.3);
        s.mesh.visible = true;
        return;
      }
    }
  }

  public spawnHitSparks(x: number, y: number, z: number, heavy: boolean, color = 0xffb703) {
    const count = heavy ? 16 : 9;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (heavy ? 5.5 : 3.6) * (0.5 + Math.random() * 0.8);
      this.spawnParticle(
        x,
        y,
        z,
        Math.cos(angle) * spd,
        (Math.random() - 0.15) * spd * 0.9,
        Math.sin(angle) * spd * 0.7,
        i % 3 === 0 ? 0xffffff : color,
        heavy ? 1.45 : 0.95,
        heavy ? 0.34 : 0.22,
        12,
      );
    }
    this.spawnShockwave(x, y, z + 0.15, color, heavy ? 2.6 : 1.5, false);
  }

  public spawnBlockSparks(x: number, y: number, z: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2.8 + Math.random() * 2.2;
      this.spawnParticle(
        x,
        y,
        z,
        Math.cos(angle) * spd,
        Math.random() * 2.5,
        Math.sin(angle) * spd * 0.6,
        0x38bdf8,
        0.9,
        0.2,
        10,
      );
    }
    this.spawnShockwave(x, y, z + 0.1, 0x38bdf8, 1.8, false);
  }

  public spawnDust(x: number, z: number, count = 5) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 1.2 + Math.random() * 1.4;
      this.spawnParticle(
        x + Math.cos(a) * 0.2,
        0.08,
        z + Math.sin(a) * 0.2,
        Math.cos(a) * spd,
        0.5 + Math.random() * 0.6,
        Math.sin(a) * spd,
        0x94a3b8,
        1.2,
        0.32,
        1.5,
        2.5,
      );
    }
  }

  public spawnSpecialBurst(x: number, y: number, z: number, color: number) {
    this.spawnShockwave(x, 0.08, z, color, 5.2, true);
    this.spawnShockwave(x, y, z + 0.1, color, 3.8, false);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const spd = 4.2 + Math.random() * 3.5;
      this.spawnParticle(
        x,
        y,
        z,
        Math.cos(a) * spd,
        (Math.random() - 0.1) * 4.0,
        Math.sin(a) * spd,
        i % 2 === 0 ? color : 0xffffff,
        1.6,
        0.42,
        6,
      );
    }
  }

  public update(dt: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      const progress = p.life / p.maxLife;
      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.mesh.position.y < 0.04) {
        p.mesh.position.y = 0.04;
        p.vy *= -0.4;
      }
      if (p.growSpeed !== 0) {
        p.mesh.scale.addScalar(p.growSpeed * dt);
      } else {
        p.mesh.scale.multiplyScalar(1 - dt * 2.2);
      }
      p.mesh.rotation.x += dt * 8;
      p.mesh.rotation.y += dt * 6;
      p.mat.opacity = 1 - progress;
    }

    for (let i = 0; i < this.shockwaves.length; i++) {
      const s = this.shockwaves[i];
      if (!s.active) continue;
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      const t = s.life / s.maxLife;
      const scale = 0.3 + t * s.maxScale;
      s.mesh.scale.setScalar(scale);
      s.mat.opacity = (1 - t) * 0.85;
    }
  }

  public dispose() {
    this.sharedBoxGeo.dispose();
    this.sharedRingGeo.dispose();
    this.particles.forEach((p) => p.mat.dispose());
    this.shockwaves.forEach((s) => s.mat.dispose());
    this.group.parent?.remove(this.group);
  }
}
