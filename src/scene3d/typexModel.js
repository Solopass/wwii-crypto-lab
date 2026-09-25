import { scene } from './scene.js';

export const typexGroup = new THREE.Group();
typexGroup.position.set(32, 0, 0);
scene.add(typexGroup);

const typexBase = new THREE.Mesh(
  new THREE.BoxGeometry(18, 3.2, 18),
  new THREE.MeshStandardMaterial({ color: 0x2e3642, roughness: 0.5 })
);
typexBase.position.y = -1.2;
typexGroup.add(typexBase);

// Creed Teleprinter Housing Attachment
const teleprinterCase = new THREE.Mesh(
  new THREE.BoxGeometry(5.2, 2.6, 6.0),
  new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.25 })
);
teleprinterCase.position.set(5.5, 0.4, 3.0);
typexGroup.add(teleprinterCase);

// Exit Paper Dispenser Slit
const exitSlit = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.35, 1.8),
  new THREE.MeshBasicMaterial({ color: 0x050505 })
);
exitSlit.position.set(8.12, 0.5, 3.0);
typexGroup.add(exitSlit);

// Dynamic Canvas Texture for Creed Paper Tape
const tapeCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
let tapeCtx = null;
let ribbonTexture = null;

if (tapeCanvas) {
  tapeCanvas.width = 1024;
  tapeCanvas.height = 128;
  tapeCtx = tapeCanvas.getContext('2d');
  ribbonTexture = new THREE.CanvasTexture(tapeCanvas);
  ribbonTexture.wrapS = THREE.ClampToEdgeWrapping;
  ribbonTexture.wrapT = THREE.ClampToEdgeWrapping;
}

// Curved 3D Paper Ribbon Geometry
const ribbonGeo = new THREE.PlaneGeometry(8.5, 1.4, 40, 2);
const posAttr = ribbonGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const normX = (posAttr.getX(i) + 4.25) / 8.5; // 0 (slot) to 1 (desk)
  // S-curve drape downward towards desk level
  const yDrop = -Math.sin(normX * Math.PI * 0.72) * 1.7;
  posAttr.setY(i, posAttr.getY(i) + yDrop);
  const zCurl = Math.sin(normX * Math.PI) * 0.25;
  posAttr.setZ(i, posAttr.getZ(i) + zCurl);
}
ribbonGeo.computeVertexNormals();

const ribbonMat = ribbonTexture
  ? new THREE.MeshStandardMaterial({
      map: ribbonTexture,
      roughness: 0.92,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  : new THREE.MeshStandardMaterial({ color: 0xfaf0d7, side: THREE.DoubleSide });

export const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
ribbonMesh.position.set(12.3, 0.45, 3.0);
ribbonMesh.rotation.set(-0.15, 0.2, -0.08);
typexGroup.add(ribbonMesh);

export function updateTypexRibbon(text = '') {
  if (!tapeCtx || !ribbonTexture) return;
  const w = tapeCanvas.width;
  const h = tapeCanvas.height;

  // Vintage aged gummed tape background
  tapeCtx.fillStyle = '#faf0d7';
  tapeCtx.fillRect(0, 0, w, h);

  // Subtle border margins
  tapeCtx.strokeStyle = '#d6c7a1';
  tapeCtx.lineWidth = 2;
  tapeCtx.strokeRect(2, 2, w - 4, h - 4);

  // Perforated sprocket feed dots along centerline
  tapeCtx.fillStyle = '#b8aa84';
  for (let x = 16; x < w; x += 32) {
    tapeCtx.beginPath();
    tapeCtx.arc(x, h * 0.5, 3.2, 0, Math.PI * 2);
    tapeCtx.fill();
  }

  // Typewriter stamped ink text
  tapeCtx.fillStyle = '#18181b';
  tapeCtx.font = 'bold 34px "Courier New", Courier, monospace';
  tapeCtx.textAlign = 'right';
  tapeCtx.textBaseline = 'middle';

  const clean = (text || 'TYPE-X TELEPRINTER READY ///').trim();
  tapeCtx.fillText(clean, w - 20, h * 0.3);
  tapeCtx.fillText(clean, w - 20, h * 0.72);

  ribbonTexture.needsUpdate = true;
}

export const typexDrums3D = [];
const drumGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.9, 32);

for (let td = 0; td < 5; td++) {
  const drumMat = new THREE.MeshStandardMaterial({
    color: td < 2 ? 0x991b1b : 0x10b981,
    roughness: 0.35,
    metalness: 0.7
  });
  const dMesh = new THREE.Mesh(drumGeo, drumMat);
  dMesh.rotation.z = Math.PI / 2;
  dMesh.position.set(3.0 - td * 1.5, 1.5, -4.5);
  typexGroup.add(dMesh);
  typexDrums3D.push(dMesh);
}

export function rotateTypexDrums(positions) {
  for (let i = 0; i < 5; i++) {
    if (typexDrums3D[i]) {
      const targetAngle = ((positions[i] || 0) / 26) * Math.PI * 2;
      typexDrums3D[i].rotation.x = targetAngle;
    }
  }
}

// Initial banner on tape
if (typeof document !== 'undefined') {
  updateTypexRibbon('TYPE-X MK 22 /// STATION X /// READY');
}
