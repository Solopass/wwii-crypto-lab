import { camera } from './scene.js';
import { interactiveKeys, interactiveRotors, interactiveSockets, steckerGroup, updatePendingCable, clearPendingCable } from './enigmaModel.js';
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
    this.onSocketClick = null;
    this.onBombeDrumClick = null;

    this.pendingSocketLetter = null;
    this.draggedRotor = null;
    this.plugboardPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -8.4);

    this.init();
  }

  init() {
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointerup', () => this.onPointerUp());
    this.canvas.addEventListener('pointercancel', () => this.onPointerUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  setPendingSocket(letter) {
    this.pendingSocketLetter = letter;
    if (!letter) {
      clearPendingCable();
    }
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerUp() {
    this.draggedRotor = null;
  }

  onWheel(event) {
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    const rotorHits = this.raycaster.intersectObjects(interactiveRotors, true);
    if (rotorHits.length > 0) {
      event.preventDefault();
      const hit = rotorHits[0];
      const rIdx = hit.object.userData.rotorIndex ?? hit.object.parent?.userData?.rotorIndex;
      if (rIdx !== undefined && this.onRotorClick) {
        const dir = event.deltaY < 0 ? 1 : -1;
        this.onRotorClick(rIdx, dir);
      }
    }
  }

  onPointerMove(event) {
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    // 1. Check if dragging an Enigma rotor
    if (this.draggedRotor) {
      const deltaY = event.clientY - this.draggedRotor.lastY;
      if (Math.abs(deltaY) >= 22) {
        const dir = deltaY < 0 ? 1 : -1;
        if (this.onRotorClick) {
          this.onRotorClick(this.draggedRotor.rIdx, dir);
        }
        this.draggedRotor.lastY = event.clientY;
      }
      this.canvas.style.cursor = 'ns-resize';
      return;
    }

    // 2. Update dynamic pending Stecker cable if a socket is currently selected
    if (this.pendingSocketLetter) {
      const intersectPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.plugboardPlane, intersectPoint)) {
        // Convert world coordinate to steckerGroup local coordinate
        const localPt = steckerGroup.worldToLocal(intersectPoint);
        updatePendingCable(this.pendingSocketLetter, localPt);
      }
    }

    // 3. Hover Cursor Check
    const candidates = [
      ...interactiveKeys,
      ...interactiveRotors,
      ...interactiveSockets,
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

    // 1. Check Plugboard Sockets
    const socketHits = this.raycaster.intersectObjects(interactiveSockets, true);
    if (socketHits.length > 0) {
      const hit = socketHits[0];
      const socketLetter = hit.object.userData.letter || hit.object.parent?.userData?.letter;
      if (socketLetter && this.onSocketClick) {
        this.onSocketClick(socketLetter);
        return;
      }
    }

    // 2. Check Keycaps
    const keyHits = this.raycaster.intersectObjects(interactiveKeys, true);
    if (keyHits.length > 0) {
      const hit = keyHits[0];
      const letter = hit.object.userData.letter || hit.object.parent?.userData?.letter;
      if (letter && this.onKeyClick) {
        this.onKeyClick(letter);
        return;
      }
    }

    // 3. Check Enigma Rotors
    const rotorHits = this.raycaster.intersectObjects(interactiveRotors, true);
    if (rotorHits.length > 0) {
      const hit = rotorHits[0];
      const rIdx = hit.object.userData.rotorIndex ?? hit.object.parent?.userData?.rotorIndex;
      if (rIdx !== undefined) {
        this.draggedRotor = { rIdx, lastY: event.clientY };
        if (this.onRotorClick) {
          const isUp = hit.point.y > 1.35;
          this.onRotorClick(rIdx, isUp ? 1 : -1);
        }
        return;
      }
    }

    // 4. Check Bombe Drums
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

    // 5. Check Colossus Valves
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
