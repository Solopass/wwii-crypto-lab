import { scene } from './scene.js';

export const sigabaGroup = new THREE.Group();
sigabaGroup.position.set(62, 0, 0);
scene.add(sigabaGroup);

const sigabaFrame = new THREE.Mesh(
  new THREE.BoxGeometry(20, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0x293524, roughness: 0.6 })
);
sigabaFrame.position.y = 7;
sigabaGroup.add(sigabaFrame);

export const sigabaRotors3D = [];
const SIGABA_TIERS = [11, 7, 3];
const rotorGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.7, 24);

SIGABA_TIERS.forEach((ty, tierIdx) => {
  const tierRotors = [];
  const tierColor = tierIdx === 0 ? 0xd97706 : tierIdx === 1 ? 0x0284c7 : 0x10b981;
  const mat = new THREE.MeshStandardMaterial({ color: tierColor, metalness: 0.7, roughness: 0.3 });

  for (let r = 0; r < 5; r++) {
    const rMesh = new THREE.Mesh(rotorGeo, mat);
    rMesh.rotation.z = Math.PI / 2;
    rMesh.position.set(-4 + r * 2, ty, 6.1);
    sigabaGroup.add(rMesh);
    tierRotors.push(rMesh);
  }
  sigabaRotors3D.push(tierRotors);
});

export function rotateSIGABARotors(ctrl, idx, ciph) {
  if (sigabaRotors3D[0]) {
    for (let r = 0; r < 5; r++) {
      sigabaRotors3D[0][r].rotation.x = ((ctrl[r] || 0) / 26) * Math.PI * 2;
    }
  }
  if (sigabaRotors3D[1]) {
    for (let r = 0; r < 5; r++) {
      sigabaRotors3D[1][r].rotation.x = ((idx[r] || 0) / 26) * Math.PI * 2;
    }
  }
  if (sigabaRotors3D[2]) {
    for (let r = 0; r < 5; r++) {
      sigabaRotors3D[2][r].rotation.x = ((ciph[r] || 0) / 26) * Math.PI * 2;
    }
  }
}
