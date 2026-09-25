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
