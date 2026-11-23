import * as THREE from 'three';

export interface ProceduralTextureSet {
  getArenaFloorMap: () => THREE.CanvasTexture;
  getArenaFloorRoughness: () => THREE.CanvasTexture;
  getCourtyardMap: () => THREE.CanvasTexture;
  getRooftopFloorMap: () => THREE.CanvasTexture;
  getDojoFloorMap: () => THREE.CanvasTexture;
  getShojiMap: () => THREE.CanvasTexture;
  getVolcanoFloorMap: () => THREE.CanvasTexture;
  getGlacierFloorMap: () => THREE.CanvasTexture;
  getBambooFloorMap: () => THREE.CanvasTexture;
  fabricBump: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const created: THREE.Texture[] = [];
  const aniso = Math.min(Math.max(1, maxAnisotropy), 8);

  let arenaFloorMap: THREE.CanvasTexture | null = null;
  let arenaFloorRoughness: THREE.CanvasTexture | null = null;
  let courtyardMap: THREE.CanvasTexture | null = null;
  let rooftopFloorMap: THREE.CanvasTexture | null = null;
  let dojoFloorMap: THREE.CanvasTexture | null = null;
  let shojiMap: THREE.CanvasTexture | null = null;
  let volcanoFloorMap: THREE.CanvasTexture | null = null;
  let glacierFloorMap: THREE.CanvasTexture | null = null;
  let bambooFloorMap: THREE.CanvasTexture | null = null;

  const getArenaFloorMap = () => {
    if (arenaFloorMap) return arenaFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    grad.addColorStop(0, '#2b3240');
    grad.addColorStop(0.55, '#1f2530');
    grad.addColorStop(1, '#141820');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 1200; i++) {
      const v = i % 2 === 0 ? 255 : 0;
      ctx.fillStyle = `rgba(${v},${v},${v},${0.025 + (i % 5) * 0.008})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    ctx.strokeStyle = 'rgba(10, 12, 18, 0.72)';
    ctx.lineWidth = 2;
    for (let r = 65; r <= 235; r += 42) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 65, 256 + Math.sin(a) * 65);
      ctx.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250);
      ctx.stroke();
    }

    ctx.strokeStyle = '#c28b2c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 195, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#d49a35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(256, 256);
    for (let k = 0; k < 2; k++) {
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = 'rgba(212, 154, 53, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-36, -36, 72, 72);
    }
    ctx.restore();

    arenaFloorMap = new THREE.CanvasTexture(canvas);
    arenaFloorMap.colorSpace = THREE.SRGBColorSpace;
    arenaFloorMap.anisotropy = aniso;
    created.push(arenaFloorMap);
    return arenaFloorMap;
  };

  const getArenaFloorRoughness = () => {
    if (arenaFloorRoughness) return arenaFloorRoughness;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 800; i++) {
      const shade = 115 + (i % 70);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 97, 0, Math.PI * 2);
    ctx.stroke();

    arenaFloorRoughness = new THREE.CanvasTexture(canvas);
    arenaFloorRoughness.anisotropy = aniso;
    created.push(arenaFloorRoughness);
    return arenaFloorRoughness;
  };

  const getCourtyardMap = () => {
    if (courtyardMap) return courtyardMap;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#12161f';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#090b10';
    ctx.lineWidth = 2;
    const tileSize = 32;
    for (let y = 0; y < 256; y += tileSize) {
      const offset = (y / tileSize) % 2 === 0 ? 0 : tileSize / 2;
      for (let x = -tileSize; x < 256 + tileSize; x += tileSize) {
        const shade = 18 + ((x + y) % 10);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 11})`;
        ctx.fillRect(x + offset + 1, y + 1, tileSize - 2, tileSize - 2);
        ctx.strokeRect(x + offset, y, tileSize, tileSize);
      }
    }
    courtyardMap = new THREE.CanvasTexture(canvas);
    courtyardMap.colorSpace = THREE.SRGBColorSpace;
    courtyardMap.wrapS = THREE.RepeatWrapping;
    courtyardMap.wrapT = THREE.RepeatWrapping;
    courtyardMap.repeat.set(16, 16);
    courtyardMap.anisotropy = aniso;
    created.push(courtyardMap);
    return courtyardMap;
  };

  const getRooftopFloorMap = () => {
    if (rooftopFloorMap) return rooftopFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, '#333b48');
    grad.addColorStop(0.7, '#252c37');
    grad.addColorStop(1, '#1a2029');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(12, 16, 24, 0.55)';
    ctx.lineWidth = 2;
    for (let g = 0; g <= 512; g += 64) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(512, g);
      ctx.stroke();
    }

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(256, 256, 208, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 178, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
    ctx.fillRect(215, 205, 17, 102);
    ctx.fillRect(280, 205, 17, 102);
    ctx.fillRect(215, 248, 82, 17);

    rooftopFloorMap = new THREE.CanvasTexture(canvas);
    rooftopFloorMap.colorSpace = THREE.SRGBColorSpace;
    rooftopFloorMap.anisotropy = aniso;
    created.push(rooftopFloorMap);
    return rooftopFloorMap;
  };

  const getDojoFloorMap = () => {
    if (dojoFloorMap) return dojoFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 32;
    for (let row = 0; row < 512 / plankH; row++) {
      const y = row * plankH;
      const offset = (row % 2) * 64;
      for (let x = -64; x < 512; x += 128) {
        const tone = (row * 7 + x * 3) % 24;
        ctx.fillStyle = `rgb(${94 + tone}, ${58 + Math.floor(tone * 0.7)}, ${32 + Math.floor(tone * 0.4)})`;
        ctx.fillRect(x + offset + 1, y + 1, 126, plankH - 2);
      }
    }

    ctx.strokeStyle = 'rgba(185, 28, 28, 0.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 198, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(217, 155, 46, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 65, 0, Math.PI * 2);
    ctx.stroke();

    dojoFloorMap = new THREE.CanvasTexture(canvas);
    dojoFloorMap.colorSpace = THREE.SRGBColorSpace;
    dojoFloorMap.anisotropy = aniso;
    created.push(dojoFloorMap);
    return dojoFloorMap;
  };

  const getShojiMap = () => {
    if (shojiMap) return shojiMap;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 170);
    grad.addColorStop(0, '#fff3d6');
    grad.addColorStop(0.65, '#f2d399');
    grad.addColorStop(1, '#cfa463');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#3b2414';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 250);
    ctx.lineWidth = 4;
    for (let i = 1; i < 4; i++) {
      const pos = i * 64;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(256, pos);
      ctx.stroke();
    }

    shojiMap = new THREE.CanvasTexture(canvas);
    shojiMap.colorSpace = THREE.SRGBColorSpace;
    shojiMap.anisotropy = aniso;
    created.push(shojiMap);
    return shojiMap;
  };

  // Shared Fighter Fabric Weave Bump Map
  const fabCanvas = document.createElement('canvas');
  fabCanvas.width = 64;
  fabCanvas.height = 64;
  const fbCtx = fabCanvas.getContext('2d')!;
  fbCtx.fillStyle = '#808080';
  fbCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 4) {
    fbCtx.fillStyle = y % 8 === 0 ? '#969696' : '#6c6c6c';
    fbCtx.fillRect(0, y, 64, 2);
  }
  const fabricBump = new THREE.CanvasTexture(fabCanvas);
  fabricBump.wrapS = THREE.RepeatWrapping;
  fabricBump.wrapT = THREE.RepeatWrapping;
  fabricBump.repeat.set(4, 4);
  created.push(fabricBump);

  // Soft Radial Contact Shadow Map
  const shadCanvas = document.createElement('canvas');
  shadCanvas.width = 128;
  shadCanvas.height = 128;
  const sCtx = shadCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  sGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadCanvas);
  created.push(contactShadowMap);

  const getVolcanoFloorMap = () => {
    if (volcanoFloorMap) return volcanoFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 25, 256, 256, 256);
    grad.addColorStop(0, '#2c1f1e');
    grad.addColorStop(0.65, '#1d1516');
    grad.addColorStop(1, '#110c0d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Molten magma radial cracks
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 58, 256 + Math.sin(a) * 58);
      ctx.lineTo(256 + Math.cos(a + 0.08) * 145, 256 + Math.sin(a + 0.08) * 145);
      ctx.lineTo(256 + Math.cos(a - 0.05) * 245, 256 + Math.sin(a - 0.05) * 245);
      ctx.stroke();
    }
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 198, 0, Math.PI * 2);
    ctx.stroke();

    volcanoFloorMap = new THREE.CanvasTexture(canvas);
    volcanoFloorMap.colorSpace = THREE.SRGBColorSpace;
    volcanoFloorMap.anisotropy = aniso;
    created.push(volcanoFloorMap);
    return volcanoFloorMap;
  };

  const getGlacierFloorMap = () => {
    if (glacierFloorMap) return glacierFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
    grad.addColorStop(0, '#c8f1ff');
    grad.addColorStop(0.55, '#6ec6e8');
    grad.addColorStop(1, '#27658a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 40, 256 + Math.sin(a) * 40);
      ctx.lineTo(256 + Math.cos(a + 0.14) * 240, 256 + Math.sin(a + 0.14) * 240);
      ctx.stroke();
    }
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.stroke();

    glacierFloorMap = new THREE.CanvasTexture(canvas);
    glacierFloorMap.colorSpace = THREE.SRGBColorSpace;
    glacierFloorMap.anisotropy = aniso;
    created.push(glacierFloorMap);
    return glacierFloorMap;
  };

  const getBambooFloorMap = () => {
    if (bambooFloorMap) return bambooFloorMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    grad.addColorStop(0, '#2e453b');
    grad.addColorStop(0.65, '#1e3028');
    grad.addColorStop(1, '#121f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(10, 18, 15, 0.65)';
    ctx.lineWidth = 3;
    for (let r = 64; r <= 230; r += 44) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 196, 0, Math.PI * 2);
    ctx.stroke();

    bambooFloorMap = new THREE.CanvasTexture(canvas);
    bambooFloorMap.colorSpace = THREE.SRGBColorSpace;
    bambooFloorMap.anisotropy = aniso;
    created.push(bambooFloorMap);
    return bambooFloorMap;
  };

  return {
    getArenaFloorMap,
    getArenaFloorRoughness,
    getCourtyardMap,
    getRooftopFloorMap,
    getDojoFloorMap,
    getShojiMap,
    getVolcanoFloorMap,
    getGlacierFloorMap,
    getBambooFloorMap,
    fabricBump,
    contactShadowMap,
    dispose: () => {
      created.forEach((t) => t.dispose());
    },
  };
}
