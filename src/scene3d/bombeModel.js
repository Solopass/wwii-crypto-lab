import { scene } from './scene.js';
import { createMahoganyTexture } from './textures.js';

export const bombeGroup = new THREE.Group();
bombeGroup.position.set(-65, 0, 0);
scene.add(bombeGroup);

const bombeWoodTexture = createMahoganyTexture();
const bombeCabinet = new THREE.Mesh(
  new THREE.BoxGeometry(24, 20, 10),
  new THREE.MeshStandardMaterial({ map: bombeWoodTexture, color: 0x1f1610 })
);
bombeCabinet.position.y = 9.5;
bombeGroup.add(bombeCabinet);

export const drumMeshes = [];
export const interactiveBombeDrums = [];
const DRUM_TIERS = [
  { y: 14.5, color: 0xb91c1c },
  { y: 9.5,  color: 0xf1f5f9 },
  { y: 4.5,  color: 0xd97706 }
];

const drumCylinderGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.6, 32);

DRUM_TIERS.forEach((tier, tIdx) => {
  const mat = new THREE.MeshStandardMaterial({ color: tier.color, roughness: 0.45, metalness: 0.5 });
  for (let col = 0; col < 12; col++) {
    const dGroup = new THREE.Group();
    dGroup.position.set(-9.6 + col * 1.75, tier.y, 5.1);

    const dMesh = new THREE.Mesh(drumCylinderGeo, mat);
    dMesh.rotation.x = Math.PI / 2;
    dGroup.add(dMesh);

    dMesh.userData = { drumTier: tIdx, drumCol: col, group: dGroup };

    bombeGroup.add(dGroup);
    drumMeshes.push(dGroup);
    interactiveBombeDrums.push(dMesh);
  }
});

export function spinBombeDrums(delta = 0.15) {
  drumMeshes.forEach((d, i) => {
    // Top tier turns fastest, middle tier intermediate, bottom tier slow
    const speed = (i < 12) ? delta * 3 : (i < 24) ? delta * 1.5 : delta;
    d.rotation.z += speed;
  });
}
