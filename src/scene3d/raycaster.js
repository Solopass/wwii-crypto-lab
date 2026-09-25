import { camera } from './scene.js';
import { interactiveKeys, interactiveRotors } from './enigmaModel.js';
import { interactiveBombeDrums } from './bombeModel.js';
import { interactiveValves } from './colossusModel.js';
import { sound } from '../audio/soundFX.js';

export class SceneRaycaster {
  constructor(canvas) {
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onKeyClick = null;
    this.onRotorClick = null;
    this.onBombeDrumClick = null;

    this.init();
  }

  init() {
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(event) {
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    const candidates = [
      ...interactiveKeys,
      ...interactiveRotors,
      ...interactiveBombeDrums,
      ...interactiveValves
    ];

    const intersects = this.raycaster.intersectObjects(candidates, true);
    if (intersects.length > 0) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'grab';
    }
  }

  onPointerDown(event) {
    // Only process primary button clicks (left mouse button or touch)
    if (event.button !== 0) return;

    this.updatePointer(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    // 1. Check Keycaps
    const keyHits = this.raycaster.intersectObjects(interactiveKeys, true);
    if (keyHits.length > 0) {
      const hit = keyHits[0];
      const letter = hit.object.userData.letter || hit.object.parent?.userData?.letter;
      if (letter && this.onKeyClick) {
        this.onKeyClick(letter);
        return;
      }
    }

    // 2. Check Enigma Rotors
    const rotorHits = this.raycaster.intersectObjects(interactiveRotors, true);
    if (rotorHits.length > 0) {
      const hit = rotorHits[0];
      const rIdx = hit.object.userData.rotorIndex ?? hit.object.parent?.userData?.rotorIndex;
      if (rIdx !== undefined && this.onRotorClick) {
        // Upper half click advances, lower half click reverses
        const isUp = hit.point.y > 1.35;
        this.onRotorClick(rIdx, isUp ? 1 : -1);
        return;
      }
    }

    // 3. Check Bombe Drums
    const drumHits = this.raycaster.intersectObjects(interactiveBombeDrums, true);
    if (drumHits.length > 0) {
      const hit = drumHits[0];
      hit.object.parent.rotation.z += 0.25;
      sound.playRelayClick();
      if (this.onBombeDrumClick) {
        this.onBombeDrumClick(hit.object.userData.drumTier, hit.object.userData.drumCol);
      }
      return;
    }

    // 4. Check Colossus Valves
    const valveHits = this.raycaster.intersectObjects(interactiveValves, true);
    if (valveHits.length > 0) {
      sound.playValveHum();
      const vMesh = valveHits[0].object;
      if (vMesh.material && vMesh.material.emissive) {
        vMesh.material.emissive.setHex(0xffffff);
        setTimeout(() => {
          vMesh.material.emissive.setHex(0x0284c7);
        }, 200);
      }
    }
  }
}
