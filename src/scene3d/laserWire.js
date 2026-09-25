import { scene } from './scene.js';
import { keyMeshes, lampMeshes, steckerSockets, rotorMeshes, rotorBayGroup } from './enigmaModel.js';

export let activeLaserWire = null;
export let laserWireEnabled = true;

const laserMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  wireframe: false,
  transparent: true,
  opacity: 0.95
});

export function setLaserWireEnabled(val) {
  laserWireEnabled = val;
  if (!laserWireEnabled && activeLaserWire) {
    scene.remove(activeLaserWire);
    if (activeLaserWire.geometry) activeLaserWire.geometry.dispose();
    activeLaserWire = null;
  }
}

export function renderVolumetricElectricPath(pathArray) {
  if (activeLaserWire) {
    scene.remove(activeLaserWire);
    if (activeLaserWire.geometry) activeLaserWire.geometry.dispose();
    activeLaserWire = null;
  }
  if (!laserWireEnabled || !pathArray || pathArray.length === 0) return;

  const points = [];
  const keyChar = pathArray[0].letter;
  if (keyMeshes[keyChar]) {
    points.push(keyMeshes[keyChar].position.clone().add(new THREE.Vector3(0, 0.2, 0)));
  }

  const plugInChar = pathArray[1]?.letter;
  if (steckerSockets[plugInChar]) {
    points.push(steckerSockets[plugInChar].position.clone().add(new THREE.Vector3(0, -0.6, 8.4)));
  }

  for (let i = 0; i < 4; i++) {
    if (rotorMeshes[i] && rotorMeshes[i].visible) {
      points.push(rotorBayGroup.position.clone().add(rotorMeshes[i].position).add(new THREE.Vector3(0, 0.8, 0)));
    }
  }

  // Reflector point
  points.push(rotorBayGroup.position.clone().add(new THREE.Vector3(-3.2, 0.8, 0)));

  const lampChar = pathArray[pathArray.length - 1].letter;
  if (lampMeshes[lampChar]) {
    points.push(lampMeshes[lampChar].group.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
  }

  if (points.length >= 2) {
    const spline = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(spline, 64, 0.09, 8, false);
    activeLaserWire = new THREE.Mesh(tubeGeo, laserMat);
    scene.add(activeLaserWire);

    setTimeout(() => {
      if (activeLaserWire) {
        scene.remove(activeLaserWire);
        if (activeLaserWire.geometry) activeLaserWire.geometry.dispose();
        activeLaserWire = null;
      }
    }, 550);
  }
}
