import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';
import { StageId } from './types';

export interface ArenaHandle {
  group: THREE.Group;
  update: (elapsed: number, dt: number) => void;
  dispose: () => void;
}

export const ARENA_RADIUS = 6.0;

export function createFightingArena(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
  stageId: StageId = 'temple',
): ArenaHandle {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const group = new THREE.Group();
  scene.add(group);

  const animatedHandlers: Array<(elapsed: number) => void> = [];

  // Helper to configure key/hemi/rim 3-point rig
  const setupLighting = (
    skyBg: number,
    fogDensity: number,
    hemiSky: number,
    hemiGround: number,
    hemiInt: number,
    keyColor: number,
    keyInt: number,
    rimColor: number,
    rimInt: number,
  ) => {
    scene.background = new THREE.Color(skyBg);
    scene.fog = new THREE.FogExp2(skyBg, fogDensity);

    const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, hemiInt);
    hemi.position.set(0, 25, 0);
    group.add(hemi);

    const key = new THREE.DirectionalLight(keyColor, keyInt);
    key.position.set(6, 13, 8);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 34;
    key.shadow.camera.left = -8.5;
    key.shadow.camera.right = 8.5;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    group.add(key);

    const rim = new THREE.DirectionalLight(rimColor, rimInt);
    rim.position.set(-6, 7, -9);
    group.add(rim);
  };

  // =========================================================================
  // STAGE 1: TWILIGHT TEMPLE
  // =========================================================================
  if (stageId === 'temple') {
    setupLighting(0x0c111d, 0.022, 0x7aa2d4, 0x2a1d17, 0.85, 0xffdfb8, 2.2, 0x5da9ff, 1.35);

    const daisMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.getArenaFloorMap(),
        roughnessMap: textures.getArenaFloorRoughness(),
        roughness: 0.78,
        metalness: 0.14,
      }),
    );
    const daisMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.8, 7.3, 0.7, 32)), daisMat);
    daisMesh.position.y = -0.35;
    daisMesh.receiveShadow = true;
    group.add(daisMesh);

    const brassMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xd49a35,
        metalness: 0.9,
        roughness: 0.22,
        clearcoat: 0.3,
      }),
    );
    const darkStoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x181d28,
        roughness: 0.85,
        metalness: 0.08,
      }),
    );
    const crimsonWoodMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x7f1d1d,
        roughness: 0.65,
        metalness: 0.08,
      }),
    );

    const rimRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.78, 0.1, 10, 48)), brassMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = -0.02;
    group.add(rimRing);

    const stepBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8.2, 8.8, 0.55, 32)), darkStoneMat);
    stepBase.position.y = -0.98;
    stepBase.receiveShadow = true;
    group.add(stepBase);

    const courtMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.getCourtyardMap(),
        roughness: 0.88,
        metalness: 0.08,
      }),
    );
    const courtMesh = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(65, 48)), courtMat);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.y = -1.25;
    courtMesh.receiveShadow = true;
    group.add(courtMesh);

    // Corner Fire Braziers
    const brazierCoords: [number, number][] = [
      [-7.1, -4.6],
      [7.1, -4.6],
      [-7.1, 4.6],
      [7.1, 4.6],
    ];
    const flameMeshes: THREE.Mesh[] = [];
    const fireLights: THREE.PointLight[] = [];

    const pedestalGeo = trackGeo(new THREE.CylinderGeometry(0.36, 0.52, 1.35, 8));
    const bowlGeo = trackGeo(new THREE.CylinderGeometry(0.62, 0.25, 0.42, 12));
    const flameGeo = trackGeo(new THREE.ConeGeometry(0.28, 0.78, 8));
    const flameMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xff8c1a, transparent: true, opacity: 0.88 }));

    brazierCoords.forEach(([bx, bz], idx) => {
      const pedestal = new THREE.Mesh(pedestalGeo, darkStoneMat);
      pedestal.position.set(bx, -0.58, bz);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      const bowl = new THREE.Mesh(bowlGeo, brassMat);
      bowl.position.set(bx, 0.22, bz);
      bowl.castShadow = true;
      group.add(bowl);

      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(bx, 0.72, bz);
      group.add(flame);
      flameMeshes.push(flame);

      if (idx < 2) {
        const fLight = new THREE.PointLight(0xff7a18, 5.5, 16, 1.6);
        fLight.position.set(bx, 1.15, bz);
        group.add(fLight);
        fireLights.push(fLight);
      }
    });

    animatedHandlers.push((elapsed) => {
      for (let i = 0; i < flameMeshes.length; i++) {
        const f = flameMeshes[i];
        const flicker = 0.88 + Math.sin(elapsed * 14 + i * 2.1) * 0.16 + Math.cos(elapsed * 23 + i) * 0.08;
        f.scale.set(1, flicker, 1);
        f.rotation.y = elapsed * 2 + i;
      }
      for (let i = 0; i < fireLights.length; i++) {
        fireLights[i].intensity = 5.2 + Math.sin(elapsed * 13 + i * 1.7) * 1.1;
      }
    });

    // Torii Archways
    const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 6.2, 12));
    const baseGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.44, 0.8, 12));
    const lintelTopGeo = trackGeo(new THREE.BoxGeometry(6.8, 0.42, 0.55));
    const lintelMidGeo = trackGeo(new THREE.BoxGeometry(5.6, 0.28, 0.34));
    const tabletGeo = trackGeo(new THREE.BoxGeometry(0.75, 0.95, 0.22));

    const buildTorii = (tx: number, tz: number, rotY: number, scale = 1) => {
      const torii = new THREE.Group();
      torii.position.set(tx, -1.25, tz);
      torii.rotation.y = rotY;
      torii.scale.setScalar(scale);

      [-2.0, 2.0].forEach((px) => {
        const p = new THREE.Mesh(pillarGeo, crimsonWoodMat);
        p.position.set(px, 3.1, 0);
        p.castShadow = true;
        torii.add(p);

        const b = new THREE.Mesh(baseGeo, darkStoneMat);
        b.position.set(px, 0.4, 0);
        torii.add(b);
      });

      const topBeam = new THREE.Mesh(lintelTopGeo, darkStoneMat);
      topBeam.position.set(0, 6.2, 0);
      torii.add(topBeam);

      const upperBeam = new THREE.Mesh(lintelMidGeo, crimsonWoodMat);
      upperBeam.position.set(0, 5.3, 0);
      torii.add(upperBeam);

      const centerTablet = new THREE.Mesh(tabletGeo, brassMat);
      centerTablet.position.set(0, 5.72, 0.14);
      torii.add(centerTablet);
      group.add(torii);
    };

    buildTorii(0, -13.5, 0, 1.25);
    buildTorii(-13.5, -7.0, Math.PI / 3.4, 0.95);
    buildTorii(13.5, -7.0, -Math.PI / 3.4, 0.95);

    // Distant Mountain Ring
    const peakGeo = trackGeo(new THREE.ConeGeometry(9, 18, 6));
    const peakMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x101726, roughness: 0.95, metalness: 0.05 }));
    const peakCount = 24;
    const peakInstanced = new THREE.InstancedMesh(peakGeo, peakMat, peakCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < peakCount; i++) {
      const angle = (i / peakCount) * Math.PI * 2;
      const dist = 36 + (i % 3) * 6;
      dummy.position.set(Math.cos(angle) * dist, 5.5 + (i % 4) * 1.4, Math.sin(angle) * dist);
      dummy.rotation.y = angle + i * 0.7;
      const sc = 0.85 + (i % 5) * 0.22;
      dummy.scale.set(sc * 1.2, sc, sc * 1.2);
      dummy.updateMatrix();
      peakInstanced.setMatrixAt(i, dummy.matrix);
    }
    peakInstanced.instanceMatrix.needsUpdate = true;
    peakInstanced.computeBoundingSphere();
    group.add(peakInstanced);

    const moonMesh = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(4.2, 32)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0xfde68a, fog: false })),
    );
    moonMesh.position.set(-14, 15, -42);
    group.add(moonMesh);
  }

  // =========================================================================
  // STAGE 2: SKYLINE ROOFTOP (High-Altitude Helipad & Neon Skyscrapers)
  // =========================================================================
  else if (stageId === 'rooftop') {
    setupLighting(0x131728, 0.017, 0x60a5fa, 0x1e293b, 0.9, 0xffcaa6, 2.3, 0x38bdf8, 1.6);

    // Concrete Helipad Fighting Dais (top at y = 0)
    const padMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.getRooftopFloorMap(),
        roughness: 0.72,
        metalness: 0.18,
      }),
    );
    const padMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.9, 7.2, 0.65, 32)), padMat);
    padMesh.position.y = -0.325;
    padMesh.receiveShadow = true;
    group.add(padMesh);

    const steelMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x64748b,
        metalness: 0.88,
        roughness: 0.26,
        clearcoat: 0.25,
      }),
    );
    const darkRoofMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x171c26,
        roughness: 0.85,
        metalness: 0.2,
      }),
    );
    const cyanGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
      }),
    );
    const amberGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
      }),
    );

    // Brushed Steel Helipad Rim & Lower Building Roof Deck
    const steelRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.88, 0.11, 10, 48)), steelMat);
    steelRim.rotation.x = Math.PI / 2;
    steelRim.position.y = -0.02;
    group.add(steelRim);

    const mainRoofDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(22, 2.2, 16)), darkRoofMat);
    mainRoofDeck.position.set(0, -1.75, 0);
    mainRoofDeck.receiveShadow = true;
    group.add(mainRoofDeck);

    // Perimeter Safety Railings along back edge + glowing helipad corner beacons
    const postGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8));
    const railBeamGeo = trackGeo(new THREE.BoxGeometry(20, 0.06, 0.06));
    const backRailTop = new THREE.Mesh(railBeamGeo, steelMat);
    backRailTop.position.set(0, 0.42, -7.6);
    group.add(backRailTop);
    const backRailMid = new THREE.Mesh(railBeamGeo, steelMat);
    backRailMid.position.set(0, -0.05, -7.6);
    group.add(backRailMid);

    for (let x = -9.5; x <= 9.5; x += 2.375) {
      const post = new THREE.Mesh(postGeo, steelMat);
      post.position.set(x, -0.1, -7.6);
      post.castShadow = true;
      group.add(post);
    }

    // 8 Helipad Perimeter Landing Beacons (pulsing gently)
    const beaconGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.18, 0.14, 12));
    const beaconMats: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const bMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x38bdf8 : 0xf59e0b,
        }),
      );
      beaconMats.push(bMat);
      const beacon = new THREE.Mesh(beaconGeo, bMat);
      beacon.position.set(Math.cos(angle) * 6.55, 0.05, Math.sin(angle) * 6.55);
      group.add(beacon);
    }

    // Rooftop HVAC & Antenna Props on Sides
    const hvacGeo = trackGeo(new THREE.BoxGeometry(2.2, 1.25, 1.8));
    [-8.6, 8.6].forEach((hx, i) => {
      const hvac = new THREE.Mesh(hvacGeo, steelMat);
      hvac.position.set(hx, -0.05, -5.2);
      hvac.castShadow = true;
      group.add(hvac);

      const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.12, 4.5, 8)), steelMat);
      mast.position.set(hx * 1.05, 1.6, -6.2);
      group.add(mast);

      const tip = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 10, 10)), i === 0 ? amberGlowMat : cyanGlowMat);
      tip.position.set(hx * 1.05, 3.9, -6.2);
      group.add(tip);
    });

    // Surrounding Cityscape Skyscrapers with Glowing Window Strips
    const towerGeo = trackGeo(new THREE.BoxGeometry(4.2, 26, 4.2));
    const towerMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f1523, roughness: 0.55, metalness: 0.45 }));
    const stripGeo = trackGeo(new THREE.BoxGeometry(4.28, 0.22, 4.28));

    const towerCoords: Array<[number, number, number, number]> = [
      [-18, -12, -22, 1.2],
      [-9, -15, -26, 1.45],
      [0, -14, -30, 1.6],
      [10, -15, -24, 1.35],
      [19, -13, -21, 1.15],
      [-24, -14, -10, 1.1],
      [24, -14, -10, 1.2],
      [-14, -16, -34, 1.5],
      [14, -16, -35, 1.55],
    ];

    towerCoords.forEach(([tx, ty, tz, scaleY], idx) => {
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(tx, ty, tz);
      tower.scale.set(1, scaleY, 1);
      group.add(tower);

      const glowStrip = new THREE.Mesh(stripGeo, idx % 2 === 0 ? cyanGlowMat : amberGlowMat);
      glowStrip.position.set(tx, ty + 11.5 * scaleY, tz);
      group.add(glowStrip);
    });

    // Sunset Horizon Glow Disc
    const sunDisc = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(6.5, 32)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0xfb923c, fog: false })),
    );
    sunDisc.position.set(14, 12, -52);
    group.add(sunDisc);

    animatedHandlers.push((elapsed) => {
      for (let i = 0; i < beaconMats.length; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5 + i * 0.8);
        beaconMats[i].color.setHex(i % 2 === 0 ? 0x38bdf8 : 0xf59e0b).multiplyScalar(0.6 + pulse * 0.6);
      }
    });
  }

  // =========================================================================
  // STAGE 3: GRAND DOJO (Polished Hardwood Sanctuary & Shoji Screens)
  // =========================================================================
  else {
    setupLighting(0x161010, 0.018, 0xfcd34d, 0x2b170e, 0.78, 0xffe4b5, 2.1, 0xf97316, 1.3);

    // Elevated Polished Hardwood Dais (top at y = 0)
    const dojoFloorMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        map: textures.getDojoFloorMap(),
        roughness: 0.34,
        metalness: 0.05,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    );
    const daisMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.8, 7.1, 0.52, 32)), dojoFloorMat);
    daisMesh.position.y = -0.26;
    daisMesh.receiveShadow = true;
    group.add(daisMesh);

    const timberMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x362013,
        roughness: 0.75,
        metalness: 0.06,
      }),
    );
    const crimsonLacquerMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x881313,
        roughness: 0.32,
        metalness: 0.1,
        clearcoat: 0.55,
      }),
    );
    const outerWoodMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x24150c,
        roughness: 0.7,
        metalness: 0.04,
      }),
    );

    const daisTrim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(6.8, 0.11, 10, 48)), crimsonLacquerMat);
    daisTrim.rotation.x = Math.PI / 2;
    daisTrim.position.y = -0.02;
    group.add(daisTrim);

    // Outer Grand Dojo Floor Deck
    const outerFloor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(28, 0.4, 22)), outerWoodMat);
    outerFloor.position.set(0, -0.72, -1);
    outerFloor.receiveShadow = true;
    group.add(outerFloor);

    // Shoji Illuminated Lattice Screens along Back Wall
    const shojiImg = textures.getShojiMap();
    const shojiMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: shojiImg,
        emissive: 0xffb74d,
        emissiveMap: shojiImg,
        emissiveIntensity: 0.55,
        roughness: 0.9,
      }),
    );
    const shojiGeo = trackGeo(new THREE.BoxGeometry(3.6, 5.2, 0.14));
    for (let i = -2; i <= 2; i++) {
      const screenPanel = new THREE.Mesh(shojiGeo, shojiMat);
      screenPanel.position.set(i * 3.9, 2.0, -8.8);
      group.add(screenPanel);
    }

    // Timber Columns & Overhead Beam
    const colGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 7.0, 12));
    [-9.8, -5.85, -1.95, 1.95, 5.85, 9.8].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, timberMat);
      col.position.set(cx, 2.7, -8.5);
      col.castShadow = true;
      group.add(col);
    });

    const topBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(23, 0.65, 0.85)), timberMat);
    topBeam.position.set(0, 5.1, -8.5);
    group.add(topBeam);

    // Side Timber Columns & Hanging Paper Lanterns
    const lanternMeshes: THREE.Group[] = [];
    const lanternBodyGeo = trackGeo(new THREE.SphereGeometry(0.42, 14, 12));
    const lanternCapGeo = trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12));
    const lanternGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xff8a1f,
        emissiveIntensity: 1.4,
        roughness: 0.6,
      }),
    );

    [-7.8, -3.9, 3.9, 7.8].forEach((lx, idx) => {
      const lantern = new THREE.Group();
      lantern.position.set(lx, 4.75, -7.2);

      const cord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6)), timberMat);
      cord.position.y = -0.4;
      lantern.add(cord);

      const body = new THREE.Mesh(lanternBodyGeo, lanternGlowMat);
      body.scale.set(0.85, 1.25, 0.85);
      body.position.y = -1.1;
      lantern.add(body);

      const capTop = new THREE.Mesh(lanternCapGeo, timberMat);
      capTop.position.y = -0.62;
      lantern.add(capTop);

      const capBot = new THREE.Mesh(lanternCapGeo, timberMat);
      capBot.position.y = -1.58;
      lantern.add(capBot);

      group.add(lantern);
      lanternMeshes.push(lantern);

      if (idx === 1 || idx === 2) {
        const lLight = new THREE.PointLight(0xff9b3d, 5.0, 18, 1.6);
        lLight.position.set(lx, 3.6, -6.5);
        group.add(lLight);
      }
    });

    // Dojo Center Scroll / Crest Banner
    const scrollMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 }));
    const scrollMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.5, 2.8, 0.08)), scrollMat);
    scrollMesh.position.set(0, 2.5, -8.55);
    group.add(scrollMesh);

    const crestCircle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24)), crimsonLacquerMat);
    crestCircle.rotation.x = Math.PI / 2;
    crestCircle.position.set(0, 2.7, -8.48);
    group.add(crestCircle);

    animatedHandlers.push((elapsed) => {
      for (let i = 0; i < lanternMeshes.length; i++) {
        lanternMeshes[i].rotation.z = Math.sin(elapsed * 1.4 + i * 1.1) * 0.05;
      }
    });
  }

  return {
    group,
    update: (elapsed: number) => {
      for (let i = 0; i < animatedHandlers.length; i++) {
        animatedHandlers[i](elapsed);
      }
    },
    dispose: () => {
      scene.remove(group);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
