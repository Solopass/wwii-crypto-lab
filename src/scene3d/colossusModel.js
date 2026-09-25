import { scene } from './scene.js';
import { brassMat } from './enigmaModel.js';

export const colossusGroup = new THREE.Group();
colossusGroup.position.set(95, 0, 0);
scene.add(colossusGroup);

// Two equipment racks
const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });
const rackGeo = new THREE.BoxGeometry(11, 23, 5);
for (let r = 0; r < 2; r++) {
  const rack = new THREE.Mesh(rackGeo, rackMat);
  rack.position.set(-6.5 + r * 13, 11, 0);
  colossusGroup.add(rack);
}

// 72 Thermionic Vacuum Tubes (Shared geometry)
export const valveMeshes = [];
export const interactiveValves = [];
const valveGlassGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.1, 16);
const filamentGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);

const valveGlassMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  emissive: 0x0284c7,
  transparent: true,
  opacity: 0.8
});
const filamentMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

for (let r = 0; r < 2; r++) {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const vGroup = new THREE.Group();
      vGroup.position.set(-10.2 + r * 13 + col * 1.5, 4.0 + row * 2.8, 2.7);

      const vMesh = new THREE.Mesh(valveGlassGeo, valveGlassMat.clone());
      vGroup.add(vMesh);

      const fil = new THREE.Mesh(filamentGeo, filamentMat.clone());
      vGroup.add(fil);

      vGroup.userData = { glass: vMesh, filament: fil };
      colossusGroup.add(vGroup);
      valveMeshes.push(vGroup);
      interactiveValves.push(vMesh);
    }
  }
}

// Tape Pulleys
export const colossusPulleys = [];
const pulleyGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.4, 32);
for (let p = 0; p < 2; p++) {
  const pul = new THREE.Mesh(pulleyGeo, brassMat);
  pul.rotation.x = Math.PI / 2;
  pul.position.set(-3.5 + p * 7, 18.5, 2.8);
  colossusGroup.add(pul);
  colossusPulleys.push(pul);
}

export function pulseColossusValves() {
  valveMeshes.forEach(v => {
    const isBright = Math.random() > 0.4;
    v.userData.glass.material.emissive.setHex(isBright ? 0x38bdf8 : 0x0284c7);
    v.userData.filament.material.color.setHex(isBright ? 0xffffff : 0xfbbf24);
  });
}

export function spinColossusPulleys(speed = 0.035) {
  colossusPulleys.forEach(p => {
    p.rotation.z += speed;
  });
}
