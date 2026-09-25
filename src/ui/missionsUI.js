import { applyKeyPreset } from './controllers.js';

export function checkMissionStatus(str) {
  const clean = str.replace(/[^A-Z]/g, '');
  if (clean.includes("STANDORTQUADRAT")) {
    const b = document.getElementById('badge-mission-1');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }
  if (clean.includes("WETTERVORHERSAGE")) {
    const b = document.getElementById('badge-mission-2');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }
  if (clean.includes("CITADEL") || clean.includes("ZITADELLE")) {
    const b = document.getElementById('badge-mission-3');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }
}

export function initMissionsUI(switchTabFn) {
  document.getElementById('btn-load-mission-1')?.addEventListener('click', () => {
    applyKeyPreset('u559');
    const input = document.getElementById('input-plaintext');
    if (input) input.value = "STANDORTQUADRAT";
    if (switchTabFn) switchTabFn('enigma');
  });

  document.getElementById('btn-load-mission-2')?.addEventListener('click', () => {
    const cipherIn = document.getElementById('bombe-cipher-input');
    const cribIn = document.getElementById('bombe-crib-input');
    if (cipherIn) cipherIn.value = "BDZGO";
    if (cribIn) cribIn.value = "AAAAA";
    if (switchTabFn) switchTabFn('bombe');
  });

  document.getElementById('btn-load-mission-3')?.addEventListener('click', () => {
    const plainIn = document.getElementById('lorenz-plain-input');
    if (plainIn) plainIn.value = "UNTERNEHMEN ZITADELLE";
    if (switchTabFn) switchTabFn('colossus');
  });
}
