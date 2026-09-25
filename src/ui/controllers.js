import { ALPHABET } from '../crypto/constants.js';
import { EnigmaCore } from '../crypto/enigma.js';
import { sound } from '../audio/soundFX.js';
import {
  keyMeshes,
  lampMeshes,
  rotorMeshes,
  pawls,
  render3DJumperCables,
  rotorBayGroup,
  lidHingeGroup,
  rotorSpacing
} from '../scene3d/enigmaModel.js';
import { lampLight, cameraTargetPos, controlsTargetPos } from '../scene3d/scene.js';
import { renderVolumetricElectricPath, setLaserWireEnabled, laserWireEnabled } from '../scene3d/laserWire.js';
import { checkMissionStatus } from './missionsUI.js';

export const enigma = new EnigmaCore();

const LAMP_KEYS = "QWERTZUIOASDFGHJKPYXCVBNML";
export const uiLamps = {};

let activeBulbChar = null;
let bulbTimeout = null;
export let isExploded = false;
export let activeTab = 'enigma';

export function setActiveTab(t) {
  activeTab = t;
}

export function initEnigmaUI() {
  const lampboardContainer = document.getElementById('lampboard-container');
  if (lampboardContainer) {
    lampboardContainer.innerHTML = '';
    LAMP_KEYS.split('').forEach(char => {
      const lDiv = document.createElement('div');
      lDiv.className = 'w-7 h-7 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono-code font-bold text-amber-500/50 flex items-center justify-center transition-all duration-75 shadow-inner';
      lDiv.textContent = char;
      lampboardContainer.appendChild(lDiv);
      uiLamps[char] = lDiv;
    });
  }

  // 2D Keyboard buttons
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => handleKeystroke(btn.getAttribute('data-key')));
  });

  // Rotor stepped manual adjustments
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`rotor-up-${i}`)?.addEventListener('click', () => {
      enigma.positions[i - 1] = ((enigma.positions[i - 1] || 0) + 1) % 26;
      updateRotorUI();
      sound.playRotorStep();
    });
    document.getElementById(`rotor-down-${i}`)?.addEventListener('click', () => {
      enigma.positions[i - 1] = ((enigma.positions[i - 1] || 0) + 25) % 26;
      updateRotorUI();
      sound.playRotorStep();
    });
    document.getElementById(`sel-rotor-${i}`)?.addEventListener('change', (e) => {
      enigma.rotorTypes[i - 1] = e.target.value;
      updateRotorUI();
    });
    document.getElementById(`ring-${i}`)?.addEventListener('change', (e) => {
      enigma.ringSettings[i - 1] = (parseInt(e.target.value) - 1) % 26;
    });
  }

  // Reflector selection
  document.getElementById('sel-reflector')?.addEventListener('change', (e) => {
    enigma.reflectorType = e.target.value;
  });

  // Model M3 vs M4 Radio Selection
  document.querySelectorAll('input[name="enigma-model"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isM4 = e.target.value === 'M4';
      enigma.isM4 = isM4;
      const col4 = document.getElementById('rotor-col-4');
      if (isM4) {
        col4?.classList.remove('opacity-40', 'pointer-events-none');
        if (rotorMeshes[3]) rotorMeshes[3].visible = true;
        const refSel = document.getElementById('sel-reflector');
        if (refSel) refSel.value = 'B_thin';
        enigma.reflectorType = 'B_thin';
      } else {
        col4?.classList.add('opacity-40', 'pointer-events-none');
        if (rotorMeshes[3]) rotorMeshes[3].visible = false;
        const refSel = document.getElementById('sel-reflector');
        if (refSel) refSel.value = 'B';
        enigma.reflectorType = 'B';
      }
      updateRotorUI();
    });
  });

  // Plugboard input
  document.getElementById('input-plugboard')?.addEventListener('input', (e) => {
    enigma.setupPlugboard(e.target.value);
    render3DJumperCables(e.target.value);
  });
  document.getElementById('btn-clear-plugs')?.addEventListener('click', () => {
    const input = document.getElementById('input-plugboard');
    if (input) input.value = '';
    enigma.setupPlugboard('');
    render3DJumperCables('');
  });

  // Plaintext input box synchronization
  const ptInputEl = document.getElementById('input-plaintext');
  let lastPlaintextVal = '';
  ptInputEl?.addEventListener('input', () => {
    const currentVal = ptInputEl.value.toUpperCase().replace(/[^A-Z]/g, '');
    ptInputEl.value = currentVal;

    if (currentVal.length > lastPlaintextVal.length) {
      const addedChars = currentVal.slice(lastPlaintextVal.length);
      for (const ch of addedChars) handleKeystroke(ch, true);
    } else if (currentVal.length < lastPlaintextVal.length) {
      enigma.positions = [0, 0, 0, 0];
      updateRotorUI();
      document.getElementById('output-ciphertext').textContent = '---';
      for (const ch of currentVal) handleKeystroke(ch, true);
    }
    lastPlaintextVal = currentVal;
  });

  // Stream action buttons
  document.getElementById('btn-clear-stream')?.addEventListener('click', () => {
    if (ptInputEl) ptInputEl.value = '';
    lastPlaintextVal = '';
    const outCipher = document.getElementById('output-ciphertext');
    if (outCipher) outCipher.textContent = '---';
    const sigPath = document.getElementById('signal-path-steps');
    if (sigPath) sigPath.textContent = 'Stream cleared.';
  });

  document.getElementById('btn-copy-cipher')?.addEventListener('click', () => {
    const cipher = document.getElementById('output-ciphertext')?.textContent;
    if (cipher && cipher !== '---') {
      navigator.clipboard?.writeText(cipher).catch(() => {});
      const sigPath = document.getElementById('signal-path-steps');
      if (sigPath) sigPath.textContent = 'Cipher copied to clipboard.';
    }
  });

  document.getElementById('btn-reciprocal-test')?.addEventListener('click', () => {
    showNoticeModal(
      "Reciprocal Mathematical Proof",
      "Enigma is an involutory reciprocal cipher: E(E(x)) = x. Feeding the enciphered text back into an identically configured Enigma decrypts it back to original plaintext."
    );
  });

  // Cinematic 3D camera presets
  document.getElementById('btn-view-iso')?.addEventListener('click', () => {
    cameraTargetPos.set(0, 18, 20); controlsTargetPos.set(0, 1, 0);
  });
  document.getElementById('btn-view-top')?.addEventListener('click', () => {
    cameraTargetPos.set(0, 22, 1.2); controlsTargetPos.set(0, 0.5, 2.5);
  });
  document.getElementById('btn-view-front')?.addEventListener('click', () => {
    cameraTargetPos.set(0, 3, 18); controlsTargetPos.set(0, 0, 8.4);
  });
  document.getElementById('btn-view-rotors')?.addEventListener('click', () => {
    cameraTargetPos.set(0, 6.5, -1.8); controlsTargetPos.set(0, 1.6, -5.8);
  });

  // Disassemble / Exploded Internal View
  document.getElementById('btn-toggle-inspection')?.addEventListener('click', () => {
    isExploded = !isExploded;
    sound.playRotorStep();
  });

  // 3D Laser Wire Spline Toggle
  document.getElementById('btn-toggle-laser-wire')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-toggle-laser-wire');
    setLaserWireEnabled(!laserWireEnabled);
    if (laserWireEnabled) {
      if (btn) btn.className = 'px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-[11px] text-cyan-300 hover:bg-cyan-900 shadow-lg transition-all flex items-center gap-1.5 font-medium';
    } else {
      if (btn) btn.className = 'px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] text-slate-400 hover:bg-slate-800 shadow-lg transition-all flex items-center gap-1.5 font-medium';
    }
  });

  // Presets
  document.getElementById('preset-u559')?.addEventListener('click', () => applyKeyPreset('u559'));
  document.getElementById('preset-dday')?.addEventListener('click', () => applyKeyPreset('dday'));
  document.getElementById('preset-bismarck')?.addEventListener('click', () => applyKeyPreset('bismarck'));

  // Window key listener
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (activeTab !== 'enigma') return;

    const char = e.key.toUpperCase();
    if (ALPHABET.includes(char)) {
      handleKeystroke(char);
    } else if (e.key === 'Backspace') {
      const ptInput = document.getElementById('input-plaintext');
      const outCipher = document.getElementById('output-ciphertext');
      if (ptInput) ptInput.value = ptInput.value.slice(0, -1);
      if (outCipher) {
        const raw = outCipher.textContent.replace(/\s+/g, '').slice(0, -1);
        outCipher.textContent = raw ? (raw.match(/.{1,5}/g)?.join(' ') || raw) : '---';
      }
    }
  });

  updateRotorUI();
}

export function updateRotorUI() {
  for (let i = 0; i < 4; i++) {
    const char = ALPHABET[enigma.positions[i] || 0];
    const disp = document.getElementById(`rotor-display-${i + 1}`);
    if (disp) disp.textContent = char;
  }
}

export function handleKeystroke(letter, fromTextInput = false) {
  letter = letter.toUpperCase();
  if (!ALPHABET.includes(letter)) return;

  sound.playKeyClick();
  sound.playRotorStep();

  // Animate pawls
  pawls.forEach(p => {
    p.rotation.x = -0.4;
    setTimeout(() => { p.rotation.x = 0; }, 100);
  });

  const enc = enigma.encryptLetter(letter);
  updateRotorUI();

  const ptInput = document.getElementById('input-plaintext');
  const outCipher = document.getElementById('output-ciphertext');

  if (!fromTextInput && ptInput) {
    ptInput.value += letter;
  }

  if (outCipher) {
    const cleanCipher = outCipher.textContent === '---' ? '' : outCipher.textContent.replace(/\s+/g, '');
    const newCipher = cleanCipher + enc.result;
    outCipher.textContent = newCipher.match(/.{1,5}/g)?.join(' ') || newCipher;
    checkMissionStatus(newCipher);
  }

  // Electrical trace HUD
  const pathStr = enc.path.map(p => `${p.stage} [${p.letter}]`).join(' → ');
  const sigPath = document.getElementById('signal-path-steps');
  if (sigPath) sigPath.textContent = pathStr;

  // 3D Laser Wire Spline
  renderVolumetricElectricPath(enc.path);

  // Animate 3D keycap depress
  const keyGroup = keyMeshes[letter];
  if (keyGroup) {
    keyGroup.position.y = 0.65;
    setTimeout(() => { keyGroup.position.y = keyGroup.userData.baseY || 0.95; }, 110);
  }

  // Illuminate Lampboard (3D & 2D)
  if (activeBulbChar && lampMeshes[activeBulbChar]) {
    lampMeshes[activeBulbChar].material.emissive.setHex(0x000000);
    if (uiLamps[activeBulbChar]) uiLamps[activeBulbChar].classList.remove('lamp-glow');
  }

  activeBulbChar = enc.result;
  const curLamp = lampMeshes[activeBulbChar];
  if (curLamp) {
    curLamp.material.emissive.setHex(0xf59e0b);
    lampLight.position.copy(curLamp.group.position);
    lampLight.position.y += 0.8;
    lampLight.intensity = 3.2;
  }
  if (uiLamps[activeBulbChar]) {
    uiLamps[activeBulbChar].classList.add('lamp-glow');
  }

  clearTimeout(bulbTimeout);
  bulbTimeout = setTimeout(() => {
    if (curLamp) curLamp.material.emissive.setHex(0x000000);
    if (uiLamps[activeBulbChar]) uiLamps[activeBulbChar].classList.remove('lamp-glow');
    lampLight.intensity = 0;
    activeBulbChar = null;
  }, 450);
}

export function applyKeyPreset(preset) {
  if (preset === 'u559') {
    const m4Radio = document.querySelector('input[name="enigma-model"][value="M4"]');
    if (m4Radio) { m4Radio.checked = true; m4Radio.dispatchEvent(new Event('change')); }
    enigma.rotorTypes = ['I', 'IV', 'II', 'Beta'];
    enigma.positions = [0, 11, 4, 17];
    enigma.reflectorType = 'B_thin';
    const plugs = "AV BS CG DL FU HZ IN KM OW RX";
    const plugInput = document.getElementById('input-plugboard');
    if (plugInput) plugInput.value = plugs;
    enigma.setupPlugboard(plugs);
    render3DJumperCables(plugs);
  } else if (preset === 'dday') {
    const m3Radio = document.querySelector('input[name="enigma-model"][value="M3"]');
    if (m3Radio) { m3Radio.checked = true; m3Radio.dispatchEvent(new Event('change')); }
    enigma.rotorTypes = ['III', 'II', 'I', 'Beta'];
    enigma.positions = [13, 20, 5, 0];
    enigma.reflectorType = 'B';
    const plugs = "BQ CR EJ KW MT OS";
    const plugInput = document.getElementById('input-plugboard');
    if (plugInput) plugInput.value = plugs;
    enigma.setupPlugboard(plugs);
    render3DJumperCables(plugs);
  } else if (preset === 'bismarck') {
    const m3Radio = document.querySelector('input[name="enigma-model"][value="M3"]');
    if (m3Radio) { m3Radio.checked = true; m3Radio.dispatchEvent(new Event('change')); }
    enigma.rotorTypes = ['I', 'V', 'II', 'Beta'];
    enigma.positions = [2, 14, 18, 0];
    enigma.reflectorType = 'B';
    const plugs = "AY BR CU DH EQ FS GL";
    const plugInput = document.getElementById('input-plugboard');
    if (plugInput) plugInput.value = plugs;
    enigma.setupPlugboard(plugs);
    render3DJumperCables(plugs);
  }
  updateRotorUI();
  sound.playRotorStep();
}

export function showNoticeModal(title, msg) {
  const box = document.createElement('div');
  box.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4';
  box.innerHTML = `
    <div class="max-w-md bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 shadow-2xl">
      <h3 class="text-sm font-bold text-amber-400 font-cinzel">${title}</h3>
      <p class="text-xs text-slate-300 leading-relaxed">${msg}</p>
      <div class="text-right pt-2">
        <button class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold" onclick="this.closest('.fixed').remove()">
          Acknowledge
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
}

// 3D Animation Hook for Exploded View & Rotor Rotations
export function animateEnigmaFrame() {
  const targetLidAngle = isExploded ? -Math.PI / 1.8 : 0;
  lidHingeGroup.rotation.x += (targetLidAngle - lidHingeGroup.rotation.x) * 0.1;

  const targetRotorY = isExploded ? 4.2 : 1.35;
  rotorBayGroup.position.y += (targetRotorY - rotorBayGroup.position.y) * 0.1;

  for (let i = 0; i < 4; i++) {
    if (rotorMeshes[i]) {
      const baseTargetX = 2.0 - i * (isExploded ? 2.4 : rotorSpacing);
      rotorMeshes[i].position.x += (baseTargetX - rotorMeshes[i].position.x) * 0.1;

      const targetRot = ((enigma.positions[i] || 0) / 26) * Math.PI * 2;
      const currentRot = rotorMeshes[i].rotation.x;
      const delta = Math.atan2(Math.sin(targetRot - currentRot), Math.cos(targetRot - currentRot));
      rotorMeshes[i].rotation.x += delta * 0.25;
    }
  }
}
