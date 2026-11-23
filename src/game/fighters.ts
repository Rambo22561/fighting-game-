import * as THREE from 'three';
import { FighterActionState, FighterSpec } from './types';

export interface FighterJoints {
  root: THREE.Group;
  bodyPivot: THREE.Group; // Shifts height/lean/ko fall without breaking root ground pos
  pelvis: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  ribbonTailA?: THREE.Group;
  ribbonTailB?: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  handL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  handR: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
  footL: THREE.Group;
  hipR: THREE.Group;
  kneeR: THREE.Group;
  footR: THREE.Group;
  auraRing: THREE.Mesh;
  blockShield: THREE.Mesh;
  contactShadow: THREE.Mesh;
  flashMaterials: THREE.MeshStandardMaterial[];
}

export interface FighterInstance {
  spec: FighterSpec;
  joints: FighterJoints;
  // Combat & Physics state
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1; // +1 faces +X (right), -1 faces -X (left)
  grounded: boolean;
  hp: number;
  maxHp: number;
  powerScale: number;
  energy: number; // 0..100
  action: FighterActionState;
  actionTimer: number;
  hitConfirmedThisMove: boolean;
  comboStep: 0 | 1 | 2;
  comboWindowTimer: number;
  comboCount: number;
  comboDisplayTimer: number;
  hitstunTimer: number;
  flashTimer: number;
  bufferedAttack: 'punch' | 'kick' | 'special' | null;
  dispose: () => void;
}

function createLatheLimb(
  rBottom: number,
  rMid: number,
  rTop: number,
  height: number,
  segments = 14,
): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(rBottom, height * 0.05),
    new THREE.Vector2(rMid, height * 0.52),
    new THREE.Vector2(rTop, height * 0.95),
    new THREE.Vector2(0.001, height),
  ];
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

function createBeveledPlate(w: number, h: number, depth: number, bevel = 0.022): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(bevel * 1.4, hw * 0.35, hh * 0.35);
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function createFighterInstance(
  spec: FighterSpec,
  fabricBump: THREE.Texture,
  contactShadowMap: THREE.Texture,
  startX: number,
  facing: 1 | -1,
): FighterInstance {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const flashMaterials: THREE.MeshStandardMaterial[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T, flashable = false): T => {
    materials.push(m);
    if (flashable && m instanceof THREE.MeshStandardMaterial) {
      flashMaterials.push(m);
    }
    return m;
  };

  // Distinct PBR Materials (varied roughness >= 0.25 & metalness between parts)
  const fabricMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: spec.palette.primary,
      roughness: 0.85,
      metalness: 0.05,
      bumpMap: fabricBump,
      bumpScale: 0.015,
    }),
    true,
  );

  const secondaryMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: spec.palette.secondary,
      roughness: 0.72,
      metalness: 0.14,
      bumpMap: fabricBump,
      bumpScale: 0.01,
    }),
    true,
  );

  const skinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: spec.palette.skin,
      roughness: 0.58,
      metalness: 0.02,
    }),
    true,
  );

  const metalMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: spec.palette.metal,
      roughness: 0.22,
      metalness: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    }),
    true,
  );

  const accentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: spec.palette.accent,
      roughness: 0.4,
      metalness: 0.25,
      emissive: spec.palette.energy,
      emissiveIntensity: 0.22,
    }),
    true,
  );

  const darkHairMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.75,
      metalness: 0.08,
    }),
  );

  const eyeGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: spec.palette.energy,
      emissive: spec.palette.energy,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.1,
    }),
  );

  const { shoulderWidth: sw, chestDepth: cd, limbThickness: lt, heightScale: hs } = spec.proportions;

  const root = new THREE.Group();
  root.position.set(startX, 0, 0);

  // Soft Grounded Contact Shadow
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(1.55, 1.2));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    }),
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.02;
  root.add(contactShadow);

  // Special Aura Ring (hidden unless charging/special)
  const auraGeo = trackGeo(new THREE.RingGeometry(0.45, 0.78, 32));
  const auraMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: spec.palette.energy,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.05;
  root.add(auraRing);

  const bodyPivot = new THREE.Group();
  bodyPivot.scale.setScalar(hs);
  root.add(bodyPivot);

  // Pelvis at hip height (y = 0.92 in local bodyPivot)
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.92, 0);
  bodyPivot.add(pelvis);

  const pelvisMesh = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.32 * sw, 0.16, 0.22 * cd, 0.03)),
    secondaryMat,
  );
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  pelvis.add(pelvisMesh);

  // Martial Arts Belt & Buckle
  const beltMesh = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.35 * sw, 0.075, 0.25 * cd, 0.02)),
    accentMat,
  );
  beltMesh.position.y = 0.06;
  beltMesh.castShadow = true;
  pelvis.add(beltMesh);

  const buckleMesh = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.11, 0.08, 0.04, 0.01)),
    metalMat,
  );
  buckleMesh.position.set(0, 0.06, 0.135 * cd);
  pelvis.add(buckleMesh);

  // Torso
  const torso = new THREE.Group();
  torso.position.set(0, 0.1, 0);
  pelvis.add(torso);

  const abdomenMesh = new THREE.Mesh(
    trackGeo(createLatheLimb(0.15 * sw, 0.17 * sw, 0.21 * sw, 0.34, 14)),
    fabricMat,
  );
  abdomenMesh.scale.z = 0.72 * cd;
  abdomenMesh.castShadow = true;
  abdomenMesh.receiveShadow = true;
  torso.add(abdomenMesh);

  const chestMesh = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.42 * sw, 0.3, 0.25 * cd, 0.04)),
    fabricMat,
  );
  chestMesh.position.y = 0.34;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Chest Armor / Gi Lapel V-Trim (Accent)
  const lapelL = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.08, 0.32, 0.04, 0.012)),
    accentMat,
  );
  lapelL.position.set(-0.07 * sw, 0.33, 0.13 * cd);
  lapelL.rotation.z = -0.22;
  torso.add(lapelL);

  const lapelR = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.08, 0.32, 0.04, 0.012)),
    accentMat,
  );
  lapelR.position.set(0.07 * sw, 0.33, 0.13 * cd);
  lapelR.rotation.z = 0.22;
  torso.add(lapelR);

  // Metallic sternum crest
  const crestMesh = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.055, 0)),
    metalMat,
  );
  crestMesh.scale.set(1, 1.3, 0.5);
  crestMesh.position.set(0, 0.36, 0.145 * cd);
  torso.add(crestMesh);

  // Block Shield Visual (attached to torso)
  const shieldGeo = trackGeo(new THREE.CylinderGeometry(0.58, 0.58, 0.06, 6));
  const shieldMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const blockShield = new THREE.Mesh(shieldGeo, shieldMat);
  blockShield.rotation.x = Math.PI / 2;
  blockShield.position.set(0, 0.3, 0.45);
  torso.add(blockShield);

  // Head & Neck
  const head = new THREE.Group();
  head.position.set(0, 0.54, 0);
  torso.add(head);

  const neckMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.068, 0.082, 0.11, 12)),
    skinMat,
  );
  neckMesh.position.y = 0.04;
  head.add(neckMesh);

  const craniumMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.135, 18, 14)),
    skinMat,
  );
  craniumMesh.scale.set(0.92, 1.08, 0.98);
  craniumMesh.position.y = 0.18;
  craniumMesh.castShadow = true;
  head.add(craniumMesh);

  // Sculpted Jaw
  const jawMesh = new THREE.Mesh(
    trackGeo(createBeveledPlate(0.16, 0.1, 0.14, 0.025)),
    skinMat,
  );
  jawMesh.position.set(0, 0.115, 0.025);
  head.add(jawMesh);

  // Hair / Helmet Crown
  const hairMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58)),
    spec.accessories === 'pauldrons' ? metalMat : darkHairMat,
  );
  hairMesh.position.set(0, 0.2, -0.01);
  hairMesh.rotation.x = -0.18;
  hairMesh.castShadow = true;
  head.add(hairMesh);

  // Character-specific head/neck accessories
  let ribbonTailA: THREE.Group | undefined;
  let ribbonTailB: THREE.Group | undefined;

  if (spec.accessories === 'headband') {
    const band = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.136, 0.022, 8, 24)),
      accentMat,
    );
    band.rotation.x = Math.PI / 2 - 0.1;
    band.position.set(0, 0.22, 0);
    head.add(band);

    ribbonTailA = new THREE.Group();
    ribbonTailA.position.set(-0.04, 0.21, -0.14);
    const tailGeo = trackGeo(createBeveledPlate(0.045, 0.26, 0.01, 0.004));
    const tailAMesh = new THREE.Mesh(tailGeo, accentMat);
    tailAMesh.position.y = -0.12;
    ribbonTailA.add(tailAMesh);
    head.add(ribbonTailA);

    ribbonTailB = new THREE.Group();
    ribbonTailB.position.set(0.04, 0.21, -0.14);
    const tailBMesh = new THREE.Mesh(tailGeo, accentMat);
    tailBMesh.position.y = -0.1;
    ribbonTailB.add(tailBMesh);
    head.add(ribbonTailB);
  } else if (spec.accessories === 'visor') {
    const visor = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.24, 0.065, 0.08, 0.015)),
      eyeGlowMat,
    );
    visor.position.set(0, 0.19, 0.11);
    head.add(visor);

    const crest = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.04, 0.14, 0.22, 0.01)),
      metalMat,
    );
    crest.position.set(0, 0.29, 0.0);
    head.add(crest);
  } else if (spec.accessories === 'pauldrons') {
    // Iron Oni-style half mask
    const mask = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.22, 0.11, 0.12, 0.02)),
      metalMat,
    );
    mask.position.set(0, 0.12, 0.085);
    head.add(mask);
  } else if (spec.accessories === 'scarf') {
    // Shinobi face mask + flowing scarf
    const mask = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.21, 0.11, 0.13, 0.02)),
      secondaryMat,
    );
    mask.position.set(0, 0.13, 0.07);
    head.add(mask);

    const collar = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.14, 0.042, 8, 20)),
      accentMat,
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.04, 0);
    head.add(collar);

    ribbonTailA = new THREE.Group();
    ribbonTailA.position.set(0, 0.05, -0.15);
    const scarfGeo = trackGeo(createBeveledPlate(0.1, 0.42, 0.015, 0.005));
    const scarfMesh = new THREE.Mesh(scarfGeo, accentMat);
    scarfMesh.position.y = -0.2;
    ribbonTailA.add(scarfMesh);
    head.add(ribbonTailA);
  } else if (spec.accessories === 'kabuto') {
    // Samurai Kabuto Helm + Crescent Maedate Horns
    const kabutoDome = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.162, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      metalMat,
    );
    kabutoDome.position.set(0, 0.21, 0);
    kabutoDome.castShadow = true;
    head.add(kabutoDome);

    const hornGeo = trackGeo(new THREE.ConeGeometry(0.028, 0.2, 6));
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(hornGeo, accentMat);
      horn.position.set(side * 0.08, 0.34, 0.11);
      horn.rotation.z = -side * 0.45;
      horn.rotation.x = 0.2;
      head.add(horn);
    });
  } else if (spec.accessories === 'kasa') {
    // Wide Ronin Conical Hat (Kasa)
    const kasaHat = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.36, 0.14, 18)),
      accentMat,
    );
    kasaHat.position.set(0, 0.3, 0);
    kasaHat.castShadow = true;
    head.add(kasaHat);
  } else if (spec.accessories === 'halo') {
    // Floating Astral Halo behind Torso/Head
    const haloRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.42, 0.028, 10, 32)),
      eyeGlowMat,
    );
    haloRing.position.set(0, 0.46, -0.22);
    torso.add(haloRing);
  } else if (spec.accessories === 'oni') {
    // Thunder Oni Horned Mask & Twin Horns
    const oniMask = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.22, 0.13, 0.12, 0.02)),
      accentMat,
    );
    oniMask.position.set(0, 0.13, 0.09);
    head.add(oniMask);

    const hornGeo = trackGeo(new THREE.ConeGeometry(0.032, 0.16, 8));
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(hornGeo, metalMat);
      horn.position.set(side * 0.075, 0.33, 0.07);
      horn.rotation.z = -side * 0.28;
      head.add(horn);
    });
  } else if (spec.accessories === 'hood') {
    // Glacier Monk Hood + Shoulder Mantle
    const hoodMesh = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.165, 16, 12)),
      fabricMat,
    );
    hoodMesh.scale.set(1.02, 1.12, 1.08);
    hoodMesh.position.set(0, 0.2, -0.02);
    head.add(hoodMesh);

    const mantle = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.48 * sw, 0.12, 0.32 * cd, 0.03)),
      secondaryMat,
    );
    mantle.position.set(0, 0.49, 0);
    torso.add(mantle);
  } else if (spec.accessories === 'mohawk') {
    // Blazing Flame Mohawk Crest
    const crest = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.045, 0.15, 0.26, 0.01)),
      eyeGlowMat,
    );
    crest.position.set(0, 0.31, -0.01);
    head.add(crest);
  }

  // Focused Eyes (unless visor covers)
  if (spec.accessories !== 'visor') {
    const eyeGeo = trackGeo(new THREE.BoxGeometry(0.038, 0.018, 0.02));
    const eyeL = new THREE.Mesh(eyeGeo, eyeGlowMat);
    eyeL.position.set(-0.046, 0.19, 0.125);
    const eyeR = new THREE.Mesh(eyeGeo, eyeGlowMat);
    eyeR.position.set(0.046, 0.19, 0.125);
    head.add(eyeL, eyeR);
  }

  // Helper to build Arms
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27 * sw, 0.45, 0);
    torso.add(shoulder);

    // Deltoid / Pauldron
    const pauldronSize = spec.accessories === 'pauldrons' ? 0.135 : 0.095;
    const deltoid = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(pauldronSize * lt, 12, 10)),
      spec.accessories === 'pauldrons' ? metalMat : fabricMat,
    );
    deltoid.castShadow = true;
    shoulder.add(deltoid);

    if (spec.accessories === 'pauldrons') {
      const spike = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.045, 0.13, 6)), metalMat);
      spike.position.set(side * 0.08, 0.09, 0);
      spike.rotation.z = -side * 0.6;
      shoulder.add(spike);
    }

    const upperArm = new THREE.Mesh(
      trackGeo(createLatheLimb(0.058 * lt, 0.072 * lt, 0.068 * lt, 0.28, 12)),
      spec.id === 'ryujin' || spec.id === 'titan' ? skinMat : secondaryMat,
    );
    upperArm.rotation.x = Math.PI; // Hang downward from shoulder
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.28, 0);
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(
      trackGeo(createLatheLimb(0.05 * lt, 0.064 * lt, 0.06 * lt, 0.26, 12)),
      spec.id === 'valkyrie' ? metalMat : skinMat,
    );
    forearm.rotation.x = Math.PI;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Combat Bracer / Wrist Wrap
    const bracer = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.062 * lt, 0.054 * lt, 0.14, 12)),
      spec.id === 'titan' || spec.id === 'goliath' ? metalMat : accentMat,
    );
    bracer.position.y = -0.17;
    bracer.castShadow = true;
    elbow.add(bracer);

    // Dual Forearm Blades for Ninja / Assassin / Ronin archetypes
    if (spec.hasArmBlades) {
      const blade = new THREE.Mesh(
        trackGeo(createBeveledPlate(0.018, 0.34, 0.055, 0.005)),
        metalMat,
      );
      blade.position.set(side * 0.065 * lt, -0.18, -0.04);
      elbow.add(blade);
    }

    const hand = new THREE.Group();
    hand.position.set(0, -0.27, 0);
    elbow.add(hand);

    const fist = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.095 * lt, 0.1, 0.095 * lt, 0.022)),
      spec.id === 'titan' || spec.id === 'goliath' ? metalMat : accentMat,
    );
    fist.castShadow = true;
    hand.add(fist);

    return { shoulder, elbow, hand };
  };

  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Helper to build Legs
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125 * sw, -0.04, 0);
    pelvis.add(hip);

    const thigh = new THREE.Mesh(
      trackGeo(createLatheLimb(0.078 * lt, 0.105 * lt, 0.112 * lt, 0.43, 14)),
      secondaryMat,
    );
    thigh.rotation.x = Math.PI;
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.43, 0);
    hip.add(knee);

    // Knee guard
    const kneePad = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.11 * lt, 0.1, 0.06, 0.02)),
      metalMat,
    );
    kneePad.position.set(0, 0, 0.075 * lt);
    knee.add(kneePad);

    const shin = new THREE.Mesh(
      trackGeo(createLatheLimb(0.06 * lt, 0.082 * lt, 0.078 * lt, 0.42, 12)),
      spec.id === 'valkyrie' ? fabricMat : secondaryMat,
    );
    shin.rotation.x = Math.PI;
    shin.castShadow = true;
    shin.receiveShadow = true;
    knee.add(shin);

    // Shin guard plate
    const greave = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.095 * lt, 0.28, 0.045, 0.015)),
      spec.id === 'titan' || spec.id === 'valkyrie' ? metalMat : accentMat,
    );
    greave.position.set(0, -0.21, 0.068 * lt);
    knee.add(greave);

    const foot = new THREE.Group();
    foot.position.set(0, -0.43, 0);
    knee.add(foot);

    const boot = new THREE.Mesh(
      trackGeo(createBeveledPlate(0.11 * lt, 0.08, 0.23, 0.022)),
      metalMat,
    );
    boot.position.set(0, -0.02, 0.055);
    boot.castShadow = true;
    foot.add(boot);

    return { hip, knee, foot };
  };

  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  // Face initial direction: fighters face along +X or -X in 2.5D arena
  root.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;

  const joints: FighterJoints = {
    root,
    bodyPivot,
    pelvis,
    torso,
    head,
    ribbonTailA,
    ribbonTailB,
    shoulderL: armL.shoulder,
    elbowL: armL.elbow,
    handL: armL.hand,
    shoulderR: armR.shoulder,
    elbowR: armR.elbow,
    handR: armR.hand,
    hipL: legL.hip,
    kneeL: legL.knee,
    footL: legL.foot,
    hipR: legR.hip,
    kneeR: legR.knee,
    footR: legR.foot,
    auraRing,
    blockShield,
    contactShadow,
    flashMaterials,
  };

  return {
    spec,
    joints,
    x: startX,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    facing,
    grounded: true,
    hp: spec.maxHp,
    maxHp: spec.maxHp,
    powerScale: spec.attackPower,
    energy: 25, // Start with 25% energy so players feel meter growth quickly
    action: 'idle',
    actionTimer: 0,
    hitConfirmedThisMove: false,
    comboStep: 0,
    comboWindowTimer: 0,
    comboCount: 0,
    comboDisplayTimer: 0,
    hitstunTimer: 0,
    flashTimer: 0,
    bufferedAttack: null,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
