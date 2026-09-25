import {
  scene,
  cameraTargetPos,
  controlsTargetPos,
  animate,
  registerAnimationCallback,
  resizeRenderer
} from './scene3d/scene.js';
import {
  initEnigmaUI,
  handleKeystroke,
  enigma,
  updateRotorUI,
  animateEnigmaFrame,
  setActiveTab
} from './ui/controllers.js';
import { initTypexUI } from './ui/typexUI.js';
import { initSIGABAUI } from './ui/sigabaUI.js';
import { initPolishUI } from './ui/polishUI.js';
import { initBombeUI } from './ui/bombeUI.js';
import { initColossusUI } from './ui/colossusUI.js';
import { initMorseUI } from './ui/morseUI.js';
import { initTelegramUI } from './ui/telegramUI.js';
import { initMissionsUI } from './ui/missionsUI.js';
import { initDiagnosticsUI, diag } from './ui/diagnostics.js';
import { SceneRaycaster } from './scene3d/raycaster.js';
import { sound } from './audio/soundFX.js';

let activeTabName = 'enigma';

export function switchTab(tab) {
  activeTabName = tab;
  setActiveTab(tab);

  const tabs = ['enigma', 'typex', 'sigaba', 'polish', 'bombe', 'colossus', 'missions'];
  tabs.forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.remove(
      'bg-amber-600', 'bg-red-600', 'bg-emerald-600', 'bg-rose-600', 'bg-sky-600', 'text-white'
    );
    document.getElementById(`tab-${t}`)?.classList.add('text-slate-400');
    document.getElementById(`panel-${t}-controls`)?.classList.add('hidden');
  });

  const activeBtn = document.getElementById(`tab-${tab}`);
  const activePanel = document.getElementById(`panel-${tab}-controls`);

  if (tab === 'colossus') activeBtn?.classList.add('bg-sky-600', 'text-white');
  else if (tab === 'typex') activeBtn?.classList.add('bg-red-600', 'text-white');
  else if (tab === 'sigaba') activeBtn?.classList.add('bg-emerald-600', 'text-white');
  else if (tab === 'polish') activeBtn?.classList.add('bg-rose-600', 'text-white');
  else activeBtn?.classList.add('bg-amber-600', 'text-white');

  activeBtn?.classList.remove('text-slate-400');
  activePanel?.classList.remove('hidden');

  // Camera cinematic targets
  if (tab === 'enigma' || tab === 'missions') {
    cameraTargetPos.set(0, 18, 20); controlsTargetPos.set(0, 1, 0);
  } else if (tab === 'typex') {
    cameraTargetPos.set(32, 16, 20); controlsTargetPos.set(32, 1, 0);
  } else if (tab === 'sigaba') {
    cameraTargetPos.set(62, 16, 22); controlsTargetPos.set(62, 7, 0);
  } else if (tab === 'polish') {
    cameraTargetPos.set(0, 18, 20); controlsTargetPos.set(0, 1, 0);
  } else if (tab === 'bombe') {
    cameraTargetPos.set(-65, 17, 28); controlsTargetPos.set(-65, 9.5, 0);
  } else if (tab === 'colossus') {
    cameraTargetPos.set(95, 20, 30); controlsTargetPos.set(95, 11, 0);
  }
}

// P2P Simulated Shortwave Radio Net
let radioBroadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    radioBroadcastChannel = new BroadcastChannel('station_x_radio_net');
    radioBroadcastChannel.onmessage = (e) => {
      const data = e.data;
      const logBox = document.getElementById('p2p-log-box');
      if (logBox && data) {
        const div = document.createElement('div');
        div.textContent = `[${data.freq} MHz] ${data.callsign}: ${data.cipher}`;
        logBox.appendChild(div);
        logBox.scrollTop = logBox.scrollHeight;
      }
    };
  }
} catch (err) {}

function initGlobalActions() {
  ['enigma', 'typex', 'sigaba', 'polish', 'bombe', 'colossus', 'missions'].forEach(t => {
    document.getElementById(`tab-${t}`)?.addEventListener('click', () => switchTab(t));
  });

  // Audio Toggle
  document.getElementById('btn-audio-toggle')?.addEventListener('click', (e) => {
    sound.muted = !sound.muted;
    e.target.textContent = sound.muted ? '🔇' : '🔊';
  });

  // Dossier Modal
  document.getElementById('btn-info-modal')?.addEventListener('click', () => {
    document.getElementById('modal-dossier')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-dossier')?.addEventListener('click', () => {
    document.getElementById('modal-dossier')?.classList.add('hidden');
  });
  document.getElementById('btn-dismiss-dossier')?.addEventListener('click', () => {
    document.getElementById('modal-dossier')?.classList.add('hidden');
  });

  // P2P Radio Modal
  document.getElementById('btn-p2p-net')?.addEventListener('click', () => {
    document.getElementById('modal-p2p')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-p2p')?.addEventListener('click', () => {
    document.getElementById('modal-p2p')?.classList.add('hidden');
  });
  document.getElementById('btn-p2p-broadcast')?.addEventListener('click', () => {
    const cipher = document.getElementById('output-ciphertext')?.textContent || 'BDZGO';
    const freq = document.getElementById('p2p-freq-sel')?.value || '7050';
    const callsign = document.getElementById('p2p-callsign')?.value || 'DL4M';

    if (radioBroadcastChannel) {
      radioBroadcastChannel.postMessage({ freq, callsign, cipher });
    }
    const logBox = document.getElementById('p2p-log-box');
    if (logBox) {
      const div = document.createElement('div');
      div.textContent = `[TX] ${freq} MHz ${callsign}: ${cipher}`;
      logBox.appendChild(div);
      logBox.scrollTop = logBox.scrollHeight;
    }
    sound.startMorseTone(750);
    setTimeout(() => sound.stopMorseTone(), 300);
  });

  document.getElementById('btn-p2p-feed-bombe')?.addEventListener('click', () => {
    const cipher = document.getElementById('output-ciphertext')?.textContent.replace(/[^A-Z]/g, '') || 'BDZGO';
    const bIn = document.getElementById('bombe-cipher-input');
    if (bIn) bIn.value = cipher;
    document.getElementById('modal-p2p')?.classList.add('hidden');
    switchTab('bombe');
  });
}

function initRaycasting() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const raycaster = new SceneRaycaster(canvas);

  // 3D Keycap Click Handler
  raycaster.onKeyClick = (letter) => {
    sound.init();
    handleKeystroke(letter, false);
  };

  // 3D Rotor Click Handler
  raycaster.onRotorClick = (rIdx, dir) => {
    sound.init();
    enigma.positions[rIdx] = (enigma.positions[rIdx] + (dir > 0 ? 1 : 25)) % 26;
    updateRotorUI();
    sound.playRotorStep();
  };
}

// Application Startup Lifecycle
window.addEventListener('DOMContentLoaded', () => {
  resizeRenderer();
  initEnigmaUI();
  initTypexUI();
  initSIGABAUI();
  initPolishUI();
  initBombeUI(switchTab);
  initColossusUI();
  initMorseUI();
  initTelegramUI();
  initMissionsUI(switchTab);
  initDiagnosticsUI();
  initGlobalActions();
  initRaycasting();

  registerAnimationCallback(animateEnigmaFrame);

  animate();
});
