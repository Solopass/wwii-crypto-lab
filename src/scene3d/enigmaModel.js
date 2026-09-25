import { scene } from './scene.js';
import { createMahoganyTexture, createKnurledRotorTexture, createKeycapTexture, createLampTexture } from './textures.js';
import { ALPHABET } from '../crypto/constants.js';

export const enigmaGroup = new THREE.Group();
scene.add(enigmaGroup);

const woodTexture = createMahoganyTexture();
const knurledRotorTex = createKnurledRotorTexture();

// Cabinet
const cabinetMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.45, metalness: 0.15 });
const cabinetBase = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2.8, 17.5), cabinetMat);
cabinetBase.position.y = -1.4;
cabinetBase.castShadow = true;
enigmaGroup.add(cabinetBase);

export const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });
const metalDeckMat = new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.55, metalness: 0.75 });
const metalDeck = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.8, 16.6), metalDeckMat);
metalDeck.position.y = 0.4;
enigmaGroup.add(metalDeck);

// Lid
export const lidHingeGroup = new THREE.Group();
lidHingeGroup.position.set(0, 1.8, -9.2);
enigmaGroup.add(lidHingeGroup);
const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.7, 18.0), cabinetMat);
lidMesh.position.set(0, 0.35, 9.0);
lidHingeGroup.add(lidMesh);

// Rotor Bay
export const rotorBayGroup = new THREE.Group();
rotorBayGroup.position.set(0, 1.35, -5.8);
enigmaGroup.add(rotorBayGroup);

const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 8.5, 24), brassMat);
spindle.rotation.z = Math.PI / 2;
rotorBayGroup.add(spindle);

// Shared Pawl geometry & material
export const pawls = [];
const pawlGeo = new THREE.BoxGeometry(0.15, 0.65, 0.3);
const pawlMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
for (let p = 0; p < 4; p++) {
  const pawlMesh = new THREE.Mesh(pawlGeo, pawlMat);
  pawlMesh.position.set(2.0 - p * 1.35, 0.8, 1.4);
  rotorBayGroup.add(pawlMesh);
  pawls.push(pawlMesh);
}

// Rotors (Shared geometry)
export const rotorMeshes = [];
export const interactiveRotors = [];
export const rotorSpacing = 1.35;
const rotorWheelGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.85, 36);
const rotorWheelMat = new THREE.MeshStandardMaterial({ map: knurledRotorTex, metalness: 0.65, roughness: 0.35 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
const rimTorusGeo = new THREE.TorusGeometry(1.47, 0.12, 12, 36);

for (let i = 0; i < 4; i++) {
  const rGroup = new THREE.Group();
  rGroup.position.x = 2.0 - i * rotorSpacing;

  const rWheel = new THREE.Mesh(rotorWheelGeo, rotorWheelMat);
  rWheel.rotation.z = Math.PI / 2;
  rWheel.castShadow = true;
  rGroup.add(rWheel);

  const leftRim = new THREE.Mesh(rimTorusGeo, rimMat);
  leftRim.rotation.y = Math.PI / 2;
  leftRim.position.x = -0.42;
  rGroup.add(leftRim);

  const rightRim = new THREE.Mesh(rimTorusGeo, rimMat);
  rightRim.rotation.y = Math.PI / 2;
  rightRim.position.x = 0.42;
  rGroup.add(rightRim);

  rGroup.userData = { rotorIndex: i };
  rWheel.userData = { rotorIndex: i };
  leftRim.userData = { rotorIndex: i };
  rightRim.userData = { rotorIndex: i };

  rotorBayGroup.add(rGroup);
  rotorMeshes.push(rGroup);
  interactiveRotors.push(rWheel, leftRim, rightRim);
}
rotorMeshes[3].visible = false; // Greek rotor hidden by default (M3 mode)

// Tastatur (Keys) & Lampboard (Lamps)
export const keyMeshes = {};
export const lampMeshes = {};
export const interactiveKeys = [];

const KEYBOARD_LAYOUT = [
  { row: 0, keys: 'QWERTZUIO', z: 3.6, xStart: -4.8, step: 1.2 },
  { row: 1, keys: 'ASDFGHJK',  z: 4.9, xStart: -4.2, step: 1.2 },
  { row: 2, keys: 'PYXCVBNML', z: 6.2, xStart: -4.8, step: 1.2 }
];

const LAMPBOARD_LAYOUT = [
  { row: 0, keys: 'QWERTZUIO', z: -0.5, xStart: -4.8, step: 1.2 },
  { row: 1, keys: 'ASDFGHJK',  z: 0.8,  xStart: -4.2, step: 1.2 },
  { row: 2, keys: 'PYXCVBNML', z: 2.1,  xStart: -4.8, step: 1.2 }
];

// Shared geometry buffers
const keyCapGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.22, 28);
const keyStemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12);
const lampRingGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 28);

KEYBOARD_LAYOUT.forEach(rowInfo => {
  for (let c = 0; c < rowInfo.keys.length; c++) {
    const char = rowInfo.keys[c];
    const kGroup = new THREE.Group();
    const xPos = rowInfo.xStart + c * rowInfo.step;
    kGroup.position.set(xPos, 0.95, rowInfo.z);

    const capTex = createKeycapTexture(char);
    const keyCapMat = new THREE.MeshStandardMaterial({
      map: capTex,
      metalness: 0.8,
      roughness: 0.25
    });

    const cap = new THREE.Mesh(keyCapGeo, keyCapMat);
    cap.castShadow = true;
    kGroup.add(cap);

    const stem = new THREE.Mesh(keyStemGeo, brassMat);
    stem.position.y = -0.3;
    kGroup.add(stem);

    kGroup.userData = { letter: char, baseY: 0.95 };
    cap.userData = { letter: char, group: kGroup };

    enigmaGroup.add(kGroup);
    keyMeshes[char] = kGroup;
    interactiveKeys.push(cap);
  }
});

LAMPBOARD_LAYOUT.forEach(rowInfo => {
  for (let c = 0; c < rowInfo.keys.length; c++) {
    const char = rowInfo.keys[c];
    const lGroup = new THREE.Group();
    const xPos = rowInfo.xStart + c * rowInfo.step;
    lGroup.position.set(xPos, 0.86, rowInfo.z);

    const lampTex = createLampTexture(char);
    const lampMat = new THREE.MeshStandardMaterial({
      map: lampTex,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 1.5,
      roughness: 0.3
    });

    const bulb = new THREE.Mesh(lampRingGeo, lampMat);
    lGroup.add(bulb);

    enigmaGroup.add(lGroup);
    lampMeshes[char] = { mesh: bulb, material: lampMat, group: lGroup };
  }
});

// Steckerbrett (Plugboard front panel)
export const steckerGroup = new THREE.Group();
steckerGroup.position.set(0, -0.2, 8.4);
enigmaGroup.add(steckerGroup);

export const steckerSockets = {};
export let active3DCables = [];

const socketGeo = new THREE.TorusGeometry(0.28, 0.06, 8, 20);
const sockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 });

KEYBOARD_LAYOUT.forEach((rowInfo, rIdx) => {
  for (let c = 0; c < rowInfo.keys.length; c++) {
    const char = rowInfo.keys[c];
    const sockGroup = new THREE.Group();
    sockGroup.position.set(rowInfo.xStart + c * rowInfo.step, 0.6 - rIdx * 0.9, 0.35);

    const rim = new THREE.Mesh(socketGeo, sockMat);
    sockGroup.add(rim);

    steckerGroup.add(sockGroup);
    steckerSockets[char] = sockGroup;
  }
});

const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });

export function render3DJumperCables(steckerString) {
  // Properly dispose old cable geometries and remove meshes
  active3DCables.forEach(c => {
    steckerGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
  });
  active3DCables = [];

  if (!steckerString) return;

  const pairs = steckerString.toUpperCase().match(/[A-Z]{2}/g) || [];
  pairs.forEach(pair => {
    const a = pair[0], b = pair[1];
    if (steckerSockets[a] && steckerSockets[b]) {
      const p1 = steckerSockets[a].position.clone();
      const p2 = steckerSockets[b].position.clone();
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p1.x, p1.y, 0.2),
        new THREE.Vector3((p1.x + p2.x) / 2, Math.min(p1.y, p2.y) - 1.2, 1.4),
        new THREE.Vector3(p2.x, p2.y, 0.2)
      );
      const tubeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.08, 8, false), cableMaterial);
      steckerGroup.add(tubeMesh);
      active3DCables.push(tubeMesh);
    }
  });
}
