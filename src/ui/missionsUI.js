import { applyKeyPreset, enigma, updateRotorUI } from './controllers.js';

export function checkMissionStatus(str) {
  const clean = str.replace(/[^A-Z]/g, '');

  // Mission 1: U-559 Shark
  if (clean.includes("STANDORTQUADRAT")) {
    const b = document.getElementById('badge-mission-1');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }

  // Mission 2: Normandy Weather
  if (clean.includes("WETTERVORHERSAGE")) {
    const b = document.getElementById('badge-mission-2');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }

  // Mission 3: Citadel Kursk
  if (clean.includes("CITADEL") || clean.includes("ZITADELLE")) {
    const b = document.getElementById('badge-mission-3');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }

  // Mission 4: Hunt for the Bismarck
  if (clean.includes("BISMARCK") || clean.includes("BREST")) {
    const b = document.getElementById('badge-mission-4');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }

  // Mission 5: Luftwaffe Red Rommel
  if (clean.includes("ROMMEL") || clean.includes("PANZERARMEE") || clean.includes("AFRIKA")) {
    const b = document.getElementById('badge-mission-5');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }

  // Mission 6: Battle of the Barents Sea (Regenbogen)
  if (clean.includes("REGENBOGEN") || clean.includes("HIPPER") || clean.includes("LUETZOW")) {
    const b = document.getElementById('badge-mission-6');
    if (b) {
      b.textContent = 'CLEARED';
      b.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
    }
  }
}

export function initMissionsUI(switchTabFn) {
  // Mission 1: U-559 Shark
  document.getElementById('btn-load-mission-1')?.addEventListener('click', () => {
    applyKeyPreset('u559');
    const input = document.getElementById('input-plaintext');
    if (input) {
      input.value = "STANDORTQUADRAT";
      input.dispatchEvent(new Event('input'));
    }
    if (switchTabFn) switchTabFn('enigma');
  });

  // Mission 2: Normandy Weather Crib
  document.getElementById('btn-load-mission-2')?.addEventListener('click', () => {
    const cipherIn = document.getElementById('bombe-cipher-input');
    const cribIn = document.getElementById('bombe-crib-input');
    if (cipherIn) cipherIn.value = "BDZGO";
    if (cribIn) cribIn.value = "AAAAA";
    if (switchTabFn) switchTabFn('bombe');
  });

  // Mission 3: Operation Citadel Lorenz
  document.getElementById('btn-load-mission-3')?.addEventListener('click', () => {
    const plainIn = document.getElementById('lorenz-plain-input');
    if (plainIn) plainIn.value = "UNTERNEHMEN ZITADELLE";
    if (switchTabFn) switchTabFn('colossus');
  });

  // Mission 4: Hunt for the Bismarck
  document.getElementById('btn-load-mission-4')?.addEventListener('click', () => {
    // Wehrmacht M3, Rotors II-I-III, Ring settings 01-01-01, ground B-I-S, Reflector B
    enigma.isM4 = false;
    enigma.rotorTypes = ['III', 'I', 'II', 'Beta'];
    enigma.ringSettings = [0, 0, 0, 0];
    enigma.positions = [18, 8, 1, 0]; // S, I, B (indices 18, 8, 1)
    enigma.reflectorType = 'B';
    enigma.setupPlugboard('AN CX EQ GL');
    updateRotorUI();

    const plugIn = document.getElementById('input-plugboard');
    if (plugIn) plugIn.value = 'AN CX EQ GL';

    const input = document.getElementById('input-plaintext');
    if (input) {
      input.value = "SCHLACHTSCHIFF BISMARCK ANLAUFEN BREST";
      input.dispatchEvent(new Event('input'));
    }
    if (switchTabFn) switchTabFn('enigma');
  });

  // Mission 5: Luftwaffe Red (Rommel Afrika Korps)
  document.getElementById('btn-load-mission-5')?.addEventListener('click', () => {
    enigma.isM4 = false;
    enigma.rotorTypes = ['V', 'II', 'IV', 'Beta'];
    enigma.ringSettings = [2, 5, 11, 0];
    enigma.positions = [12, 14, 17, 0]; // M, O, R
    enigma.reflectorType = 'B';
    enigma.setupPlugboard('AV BR EM FL');
    updateRotorUI();

    const plugIn = document.getElementById('input-plugboard');
    if (plugIn) plugIn.value = 'AV BR EM FL';

    const input = document.getElementById('input-plaintext');
    if (input) {
      input.value = "PANZERARMEE AFRIKA BETRIEBSSTOFF MANGEL";
      input.dispatchEvent(new Event('input'));
    }
    if (switchTabFn) switchTabFn('enigma');
  });

  // Mission 6: Operation Regenbogen (Barents Sea)
  document.getElementById('btn-load-mission-6')?.addEventListener('click', () => {
    enigma.isM4 = true;
    enigma.rotorTypes = ['IV', 'V', 'VI', 'Gamma'];
    enigma.ringSettings = [0, 0, 0, 0];
    enigma.positions = [1, 6, 4, 17]; // B, G, E, R
    enigma.reflectorType = 'B_thin';
    enigma.setupPlugboard('CD HJ KW MN');
    updateRotorUI();

    const plugIn = document.getElementById('input-plugboard');
    if (plugIn) plugIn.value = 'CD HJ KW MN';

    const input = document.getElementById('input-plaintext');
    if (input) {
      input.value = "OPERATION REGENBOGEN KREUZER HIPPER ANGRIFF";
      input.dispatchEvent(new Event('input'));
    }
    if (switchTabFn) switchTabFn('enigma');
  });
}
