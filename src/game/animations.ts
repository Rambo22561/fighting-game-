import * as THREE from 'three';
import { FighterInstance } from './fighters';
import { MOVE_DATA } from './types';

interface PoseTargets {
  pelvisY: number;
  pelvisRotX: number;
  pelvisRotY: number;
  pelvisRotZ: number;
  torsoRotX: number;
  torsoRotY: number;
  torsoRotZ: number;
  headRotX: number;
  headRotY: number;
  shoulderL: [number, number, number];
  elbowL: [number, number, number];
  shoulderR: [number, number, number];
  elbowR: [number, number, number];
  hipL: [number, number, number];
  kneeL: [number, number, number];
  hipR: [number, number, number];
  kneeR: [number, number, number];
  bodyRotX: number;
  bodyPosY: number;
}

const DEFAULT_POSE: PoseTargets = {
  pelvisY: 0.92,
  pelvisRotX: 0,
  pelvisRotY: 0,
  pelvisRotZ: 0,
  torsoRotX: 0.08,
  torsoRotY: -0.25,
  torsoRotZ: 0,
  headRotX: -0.05,
  headRotY: 0.22,
  shoulderL: [-0.85, 0.25, -0.35],
  elbowL: [-1.45, 0, 0.2],
  shoulderR: [-0.95, -0.2, 0.35],
  elbowR: [-1.65, 0, -0.2],
  hipL: [-0.32, 0.15, -0.15],
  kneeL: [0.45, 0, 0],
  hipR: [0.28, -0.15, 0.15],
  kneeR: [0.35, 0, 0],
  bodyRotX: 0,
  bodyPosY: 0,
};

const _pose: PoseTargets = {
  ...DEFAULT_POSE,
  shoulderL: [0, 0, 0],
  elbowL: [0, 0, 0],
  shoulderR: [0, 0, 0],
  elbowR: [0, 0, 0],
  hipL: [0, 0, 0],
  kneeL: [0, 0, 0],
  hipR: [0, 0, 0],
  kneeR: [0, 0, 0],
};

function setTuple(arr: [number, number, number], x: number, y: number, z: number) {
  arr[0] = x;
  arr[1] = y;
  arr[2] = z;
}

function dampTuple(vec: THREE.Euler, target: [number, number, number], lambda: number, dt: number) {
  vec.x = THREE.MathUtils.damp(vec.x, target[0], lambda, dt);
  vec.y = THREE.MathUtils.damp(vec.y, target[1], lambda, dt);
  vec.z = THREE.MathUtils.damp(vec.z, target[2], lambda, dt);
}

export function updateFighterAnimation(f: FighterInstance, dt: number, elapsed: number): void {
  const t = f.actionTimer;
  const p = _pose;

  // Reset pose buffer to combat idle baseline
  p.pelvisY = 0.89 + Math.sin(elapsed * 4.8) * 0.025;
  p.pelvisRotX = 0.04;
  p.pelvisRotY = 0;
  p.pelvisRotZ = 0;
  p.torsoRotX = 0.1 + Math.sin(elapsed * 4.8) * 0.03;
  p.torsoRotY = -0.32;
  p.torsoRotZ = 0;
  p.headRotX = -0.06;
  p.headRotY = 0.28;
  p.bodyRotX = 0;
  p.bodyPosY = 0;

  const sway = Math.sin(elapsed * 4.8) * 0.07;
  setTuple(p.shoulderL, -0.88 + sway, 0.22, -0.32);
  setTuple(p.elbowL, -1.55, 0, 0.24);
  setTuple(p.shoulderR, -1.02 - sway, -0.18, 0.34);
  setTuple(p.elbowR, -1.72, 0, -0.22);
  setTuple(p.hipL, -0.34, 0.18, -0.16);
  setTuple(p.kneeL, 0.52, 0, 0);
  setTuple(p.hipR, 0.3, -0.14, 0.16);
  setTuple(p.kneeR, 0.38, 0, 0);

  let lambda = 16;

  switch (f.action) {
    case 'idle': {
      lambda = 14;
      break;
    }

    case 'walk_fwd':
    case 'walk_back': {
      const dir = f.action === 'walk_fwd' ? 1 : -1;
      const cycle = elapsed * 11 * dir;
      const stride = Math.sin(cycle);
      const liftL = Math.max(0, Math.cos(cycle));
      const liftR = Math.max(0, -Math.cos(cycle));

      p.pelvisY = 0.88 + Math.abs(Math.sin(cycle)) * 0.035;
      p.torsoRotX = dir > 0 ? 0.18 : -0.04;
      p.torsoRotY = -0.2 + stride * 0.14;
      p.headRotY = 0.18 - stride * 0.1;

      setTuple(p.hipL, -0.25 + stride * 0.52, 0.08, -0.12);
      setTuple(p.kneeL, 0.32 + liftL * 0.65, 0, 0);
      setTuple(p.hipR, -0.25 - stride * 0.52, -0.08, 0.12);
      setTuple(p.kneeR, 0.32 + liftR * 0.65, 0, 0);

      setTuple(p.shoulderL, -0.9 - stride * 0.22, 0.2, -0.3);
      setTuple(p.shoulderR, -0.95 + stride * 0.22, -0.2, 0.3);
      lambda = 18;
      break;
    }

    case 'jump': {
      const rising = f.vy > 0;
      p.pelvisY = 0.94;
      p.torsoRotX = rising ? 0.16 : 0.28;
      p.torsoRotY = -0.18;
      setTuple(p.hipL, -0.95, 0.12, -0.18);
      setTuple(p.kneeL, 1.45, 0, 0);
      setTuple(p.hipR, -0.55, -0.12, 0.18);
      setTuple(p.kneeR, 1.1, 0, 0);
      setTuple(p.shoulderL, -1.25, 0.3, -0.45);
      setTuple(p.elbowL, -1.35, 0, 0.2);
      setTuple(p.shoulderR, -1.25, -0.3, 0.45);
      setTuple(p.elbowR, -1.35, 0, -0.2);
      lambda = 16;
      break;
    }

    case 'block': {
      p.pelvisY = 0.81;
      p.torsoRotX = 0.2;
      p.torsoRotY = 0.05;
      p.headRotX = 0.12;
      p.headRotY = -0.04;
      setTuple(p.shoulderL, -1.38, 0.62, -0.22);
      setTuple(p.elbowL, -1.85, 0, 0.35);
      setTuple(p.shoulderR, -1.42, -0.62, 0.22);
      setTuple(p.elbowR, -1.85, 0, -0.35);
      setTuple(p.hipL, -0.48, 0.2, -0.2);
      setTuple(p.kneeL, 0.85, 0, 0);
      setTuple(p.hipR, 0.32, -0.2, 0.2);
      setTuple(p.kneeR, 0.65, 0, 0);
      lambda = 24;
      break;
    }

    case 'punch_1': {
      // Crisp Lead Jab (Left Arm Snap)
      const m = MOVE_DATA.punch_1;
      const ext = t < m.windupEnd ? -0.35 : t < m.activeEnd ? 1.0 : Math.max(0, 1 - (t - m.activeEnd) / (m.duration - m.activeEnd));
      p.pelvisY = 0.87;
      p.torsoRotX = 0.16;
      p.torsoRotY = -0.3 - ext * 0.55;
      p.headRotY = 0.28 + ext * 0.5;
      setTuple(p.shoulderL, -1.45 * ext - 0.5 * (1 - ext), 0.15, -0.15);
      setTuple(p.elbowL, -0.12 * ext - 1.4 * (1 - ext), 0, 0.05);
      setTuple(p.shoulderR, -1.1, -0.3, 0.35);
      setTuple(p.elbowR, -1.85, 0, -0.2);
      setTuple(p.hipL, -0.45, 0.18, -0.15);
      setTuple(p.kneeL, 0.72, 0, 0);
      setTuple(p.hipR, 0.38, -0.15, 0.15);
      setTuple(p.kneeR, 0.42, 0, 0);
      lambda = 32;
      break;
    }

    case 'punch_2': {
      // Heavy Cross (Right Arm Power Straight)
      const m = MOVE_DATA.punch_2;
      const ext = t < m.windupEnd ? -0.4 : t < m.activeEnd ? 1.0 : Math.max(0, 1 - (t - m.activeEnd) / (m.duration - m.activeEnd));
      p.pelvisY = 0.85;
      p.pelvisRotY = ext * 0.35;
      p.torsoRotX = 0.24;
      p.torsoRotY = 0.72 * ext - 0.2 * (1 - ext);
      p.headRotY = -0.58 * ext;
      setTuple(p.shoulderR, -1.52 * ext - 0.5 * (1 - ext), -0.12, 0.12);
      setTuple(p.elbowR, -0.1 * ext - 1.5 * (1 - ext), 0, -0.05);
      setTuple(p.shoulderL, -1.0, 0.35, -0.35);
      setTuple(p.elbowL, -1.8, 0, 0.25);
      setTuple(p.hipL, -0.52, 0.2, -0.16);
      setTuple(p.kneeL, 0.82, 0, 0);
      setTuple(p.hipR, 0.45, -0.15, 0.16);
      setTuple(p.kneeR, 0.36, 0, 0);
      lambda = 32;
      break;
    }

    case 'punch_3': {
      // Rising Dragon Uppercut Finisher
      const m = MOVE_DATA.punch_3;
      const ext = t < m.windupEnd ? -0.5 : t < m.activeEnd ? 1.0 : Math.max(0, 1 - (t - m.activeEnd) / (m.duration - m.activeEnd));
      p.pelvisY = 0.84 + ext * 0.18;
      p.torsoRotX = 0.1 - ext * 0.28;
      p.torsoRotY = 0.75 * ext;
      p.headRotX = -0.25 * ext;
      p.headRotY = -0.6 * ext;
      setTuple(p.shoulderR, -2.55 * ext - 0.4 * (1 - ext), -0.1, 0.25);
      setTuple(p.elbowR, -0.85, 0, 0);
      setTuple(p.shoulderL, -0.6, 0.4, -0.45);
      setTuple(p.elbowL, -1.6, 0, 0.2);
      setTuple(p.hipL, -0.35, 0.15, -0.15);
      setTuple(p.kneeL, 0.45, 0, 0);
      setTuple(p.hipR, 0.22, -0.15, 0.15);
      setTuple(p.kneeR, 0.25, 0, 0);
      lambda = 28;
      break;
    }

    case 'kick': {
      // High Snap / Roundhouse Kick (Right Leg)
      const m = MOVE_DATA.kick;
      const wind = t < m.windupEnd;
      const ext = wind ? 0.35 : t < m.activeEnd ? 1.0 : Math.max(0, 1 - (t - m.activeEnd) / (m.duration - m.activeEnd));
      p.pelvisY = 0.91;
      p.pelvisRotY = 0.45 * ext;
      p.pelvisRotZ = -0.28 * ext;
      p.torsoRotX = -0.18 * ext;
      p.torsoRotY = -0.35 * ext;
      p.headRotY = 0.18 * ext;

      if (wind) {
        // Chamber knee high first!
        setTuple(p.hipR, -1.55, -0.25, 0.35);
        setTuple(p.kneeR, 1.9, 0, 0);
      } else {
        setTuple(p.hipR, -1.62 * ext - 0.2 * (1 - ext), -0.25 * ext, 0.45 * ext);
        setTuple(p.kneeR, 0.08 * ext + 0.6 * (1 - ext), 0, 0);
      }
      setTuple(p.hipL, 0.1, 0.15, -0.12);
      setTuple(p.kneeL, 0.18, 0, 0);

      setTuple(p.shoulderL, -0.9, 0.35, -0.65);
      setTuple(p.shoulderR, -0.65, -0.35, 0.65);
      lambda = 30;
      break;
    }

    case 'special': {
      // Dramatic Windup Charge -> Explosive Lunge Strike
      const m = MOVE_DATA.special;
      if (t < m.windupEnd) {
        // Coiled charge crouch
        p.pelvisY = 0.76;
        p.torsoRotX = 0.35;
        p.torsoRotY = -0.85;
        p.headRotY = 0.72;
        setTuple(p.shoulderR, 0.6, -0.3, 0.45);
        setTuple(p.elbowR, -1.5, 0, 0);
        setTuple(p.shoulderL, -1.1, 0.4, -0.45);
        setTuple(p.elbowL, -1.6, 0, 0.2);
        setTuple(p.hipL, -0.65, 0.2, -0.2);
        setTuple(p.kneeL, 1.1, 0, 0);
        setTuple(p.hipR, 0.45, -0.2, 0.2);
        setTuple(p.kneeR, 0.85, 0, 0);
        lambda = 22;
      } else {
        const ext = t < m.activeEnd ? 1.0 : Math.max(0, 1 - (t - m.activeEnd) / (m.duration - m.activeEnd));
        p.pelvisY = 0.88;
        p.pelvisRotY = 0.55 * ext;
        p.torsoRotX = 0.32 * ext;
        p.torsoRotY = 0.95 * ext;
        p.headRotY = -0.82 * ext;
        setTuple(p.shoulderR, -1.55 * ext, -0.1, 0.1);
        setTuple(p.elbowR, -0.05, 0, 0);
        setTuple(p.shoulderL, -1.55 * ext, 0.15, -0.1);
        setTuple(p.elbowL, -0.05, 0, 0);
        setTuple(p.hipL, -0.58, 0.2, -0.15);
        setTuple(p.kneeL, 0.95, 0, 0);
        setTuple(p.hipR, 0.58, -0.2, 0.15);
        setTuple(p.kneeR, 0.32, 0, 0);
        lambda = 36;
      }
      break;
    }

    case 'hitstun': {
      p.pelvisY = 0.89;
      p.torsoRotX = -0.42;
      p.torsoRotY = 0.25;
      p.headRotX = -0.38;
      setTuple(p.shoulderL, -0.35, 0.2, -0.65);
      setTuple(p.elbowL, -0.8, 0, 0);
      setTuple(p.shoulderR, -0.35, -0.2, 0.65);
      setTuple(p.elbowR, -0.8, 0, 0);
      setTuple(p.hipL, -0.2, 0.1, -0.15);
      setTuple(p.kneeL, 0.4, 0, 0);
      setTuple(p.hipR, 0.25, -0.1, 0.15);
      setTuple(p.kneeR, 0.35, 0, 0);
      lambda = 28;
      break;
    }

    case 'ko': {
      // Dramatic backward fall onto the arena stones
      const fallProgress = Math.min(1, t / 0.55);
      p.bodyRotX = -Math.PI / 2 * fallProgress;
      p.bodyPosY = 0.22 * fallProgress;
      p.pelvisY = 0.88;
      p.torsoRotX = -0.25;
      p.headRotX = -0.25;
      setTuple(p.shoulderL, -0.4, 0.4, -0.9);
      setTuple(p.elbowL, -0.5, 0, 0);
      setTuple(p.shoulderR, -0.4, -0.4, 0.9);
      setTuple(p.elbowR, -0.5, 0, 0);
      setTuple(p.hipL, -0.15, 0.2, -0.2);
      setTuple(p.kneeL, 0.35, 0, 0);
      setTuple(p.hipR, 0.1, -0.2, 0.2);
      setTuple(p.kneeR, 0.25, 0, 0);
      lambda = 14;
      break;
    }

    case 'victory': {
      // Triumphant raised fist pose
      p.pelvisY = 0.93;
      p.torsoRotX = -0.06;
      p.torsoRotY = 0.25;
      p.headRotX = -0.15;
      p.headRotY = -0.2;
      setTuple(p.shoulderR, -2.75, -0.15, 0.35);
      setTuple(p.elbowR, -0.45, 0, 0);
      setTuple(p.shoulderL, -0.65, 0.3, -0.35);
      setTuple(p.elbowL, -1.45, 0, 0.2);
      setTuple(p.hipL, -0.22, 0.15, -0.15);
      setTuple(p.kneeL, 0.25, 0, 0);
      setTuple(p.hipR, 0.22, -0.15, 0.15);
      setTuple(p.kneeR, 0.25, 0, 0);
      lambda = 10;
      break;
    }
  }

  const j = f.joints;

  // Apply damped interpolation to all joints
  j.bodyPivot.rotation.x = THREE.MathUtils.damp(j.bodyPivot.rotation.x, p.bodyRotX, lambda, dt);
  j.bodyPivot.position.y = THREE.MathUtils.damp(j.bodyPivot.position.y, p.bodyPosY, lambda, dt);

  j.pelvis.position.y = THREE.MathUtils.damp(j.pelvis.position.y, p.pelvisY, lambda, dt);
  j.pelvis.rotation.x = THREE.MathUtils.damp(j.pelvis.rotation.x, p.pelvisRotX, lambda, dt);
  j.pelvis.rotation.y = THREE.MathUtils.damp(j.pelvis.rotation.y, p.pelvisRotY, lambda, dt);
  j.pelvis.rotation.z = THREE.MathUtils.damp(j.pelvis.rotation.z, p.pelvisRotZ, lambda, dt);

  j.torso.rotation.x = THREE.MathUtils.damp(j.torso.rotation.x, p.torsoRotX, lambda, dt);
  j.torso.rotation.y = THREE.MathUtils.damp(j.torso.rotation.y, p.torsoRotY, lambda, dt);
  j.torso.rotation.z = THREE.MathUtils.damp(j.torso.rotation.z, p.torsoRotZ, lambda, dt);

  j.head.rotation.x = THREE.MathUtils.damp(j.head.rotation.x, p.headRotX, lambda, dt);
  j.head.rotation.y = THREE.MathUtils.damp(j.head.rotation.y, p.headRotY, lambda, dt);

  dampTuple(j.shoulderL.rotation, p.shoulderL, lambda, dt);
  dampTuple(j.elbowL.rotation, p.elbowL, lambda, dt);
  dampTuple(j.shoulderR.rotation, p.shoulderR, lambda, dt);
  dampTuple(j.elbowR.rotation, p.elbowR, lambda, dt);

  dampTuple(j.hipL.rotation, p.hipL, lambda, dt);
  dampTuple(j.kneeL.rotation, p.kneeL, lambda, dt);
  dampTuple(j.hipR.rotation, p.hipR, lambda, dt);
  dampTuple(j.kneeR.rotation, p.kneeR, lambda, dt);

  // Flowing headband / scarf tail secondary motion
  const speedWind = Math.abs(f.vx) * 0.14 + Math.abs(f.vy) * 0.06;
  if (j.ribbonTailA) {
    j.ribbonTailA.rotation.x = 0.25 + speedWind + Math.sin(elapsed * 9) * 0.16;
    j.ribbonTailA.rotation.z = Math.cos(elapsed * 7) * 0.12;
  }
  if (j.ribbonTailB) {
    j.ribbonTailB.rotation.x = 0.35 + speedWind + Math.cos(elapsed * 10.5) * 0.18;
    j.ribbonTailB.rotation.z = -Math.sin(elapsed * 8) * 0.12;
  }

  // Contact shadow shrinks & softens as fighter jumps higher
  const shadowScale = Math.max(0.45, 1 - f.y * 0.18);
  j.contactShadow.scale.set(shadowScale, shadowScale, 1);
  (j.contactShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 0.58 - f.y * 0.15);

  // Special Aura Ring & Block Shield Opacity
  const auraMat = j.auraRing.material as THREE.MeshBasicMaterial;
  const targetAuraOp = f.action === 'special' ? 0.72 : f.energy >= 100 ? 0.25 + Math.sin(elapsed * 6) * 0.1 : 0;
  auraMat.opacity = THREE.MathUtils.damp(auraMat.opacity, targetAuraOp, 14, dt);
  j.auraRing.rotation.z = elapsed * 2.5;
  const auraScale = f.action === 'special' ? 1.45 : 1.05;
  j.auraRing.scale.setScalar(THREE.MathUtils.damp(j.auraRing.scale.x, auraScale, 12, dt));

  const shieldMat = j.blockShield.material as THREE.MeshBasicMaterial;
  const targetShieldOp = f.action === 'block' ? 0.38 : 0;
  shieldMat.opacity = THREE.MathUtils.damp(shieldMat.opacity, targetShieldOp, 20, dt);

  // Hit-flash emissive decay
  if (f.flashTimer > 0) {
    f.flashTimer = Math.max(0, f.flashTimer - dt);
    const boost = (f.flashTimer / 0.1) * 0.9;
    for (let i = 0; i < j.flashMaterials.length; i++) {
      j.flashMaterials[i].emissiveIntensity = 0.22 + boost;
      if (f.flashTimer > 0.01) {
        j.flashMaterials[i].emissive.setHex(0xffffff);
      } else {
        j.flashMaterials[i].emissive.setHex(f.spec.palette.energy);
      }
    }
  }
}
