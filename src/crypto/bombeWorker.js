import { ALPHABET, ROTOR_WIRINGS, ROTOR_NOTCHES, REFLECTORS } from './constants.js';

export const BOMBE_WORKER_CODE = `
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ROTOR_WIRINGS = {
  'I':    'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
  'II':   'AJDKSIRUXBLHWTMCQGZNPYFVOE',
  'III':  'BDFHJLCPRTXVZNYEIWGAKMUSQO',
  'IV':   'ESOVPZJAYQUIRHXLNFTGKDCMWB',
  'V':    'VZBRGITYUPSDNHLXAWMJQOFECK',
  'Beta': 'LEYJVCNIXWPBQMDRTAKZGFUHOS'
};

const ROTOR_NOTCHES = {
  'I':    ['Q'],
  'II':   ['E'],
  'III':  ['V'],
  'IV':   ['J'],
  'V':    ['Z'],
  'Beta': []
};

const REFLECTORS = {
  'B':      'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  'C':      'FVPJIAOYEDRZXWGCTKUQSBNMHL',
  'B_thin': 'ENKQAUYWJICOPBLMDXZVFTHRGS',
  'C_thin': 'RDOBJNTKVEHMLFCWZAXGYIPSUQ'
};

function passRotorForward(letterIdx, rType, pos, ring = 0) {
  const shift = (pos - ring + 26) % 26;
  const enterIdx = (letterIdx + shift) % 26;
  const wiredChar = ROTOR_WIRINGS[rType][enterIdx];
  const wiredIdx = ALPHABET.indexOf(wiredChar);
  return (wiredIdx - shift + 26) % 26;
}

function passRotorBackward(letterIdx, rType, pos, ring = 0) {
  const shift = (pos - ring + 26) % 26;
  const enterIdx = (letterIdx + shift) % 26;
  const wiredChar = ALPHABET[enterIdx];
  const revIdx = ROTOR_WIRINGS[rType].indexOf(wiredChar);
  return (revIdx - shift + 26) % 26;
}

function testPermutation(order, pos, cipher, crib, reflector = 'B') {
  let [p0, p1, p2] = pos;
  const steckerMap = {};

  for (let i = 0; i < Math.min(cipher.length, crib.length); i++) {
    const plainChar = crib[i];
    const cipherChar = cipher[i];
    if (plainChar === cipherChar) return false;

    // Advance right rotor
    p0 = (p0 + 1) % 26;
    if (ROTOR_NOTCHES[order[0]] && ROTOR_NOTCHES[order[0]].includes(ALPHABET[p0])) {
      p1 = (p1 + 1) % 26;
      if (ROTOR_NOTCHES[order[1]] && ROTOR_NOTCHES[order[1]].includes(ALPHABET[p1])) {
        p2 = (p2 + 1) % 26;
      }
    }

    let idx = ALPHABET.indexOf(plainChar);
    idx = passRotorForward(idx, order[0], p0);
    idx = passRotorForward(idx, order[1], p1);
    idx = passRotorForward(idx, order[2], p2);

    const refChar = REFLECTORS[reflector][idx];
    idx = ALPHABET.indexOf(refChar);

    idx = passRotorBackward(idx, order[2], p2);
    idx = passRotorBackward(idx, order[1], p1);
    idx = passRotorBackward(idx, order[0], p0);

    const outChar = ALPHABET[idx];

    if (steckerMap[outChar] && steckerMap[outChar] !== cipherChar) return false;
    if (steckerMap[cipherChar] && steckerMap[cipherChar] !== outChar) return false;
    steckerMap[outChar] = cipherChar;
    steckerMap[cipherChar] = outChar;
  }

  return true;
}

self.onmessage = function(e) {
  const { cipher, crib, orders, singleOrder } = e.data;
  const rotorPool = ['I', 'II', 'III', 'IV', 'V'];
  let searchOrders = [];

  if (singleOrder) {
    searchOrders = [singleOrder];
  } else {
    // Generate all 60 permutations of 3 rotors from pool of 5
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < 5; k++) {
          if (i !== j && j !== k && i !== k) {
            searchOrders.push([rotorPool[i], rotorPool[j], rotorPool[k]]);
          }
        }
      }
    }
  }

  const totalPositions = searchOrders.length * 17576;
  let scanned = 0;
  const startTime = Date.now();

  for (const order of searchOrders) {
    for (let r3 = 0; r3 < 26; r3++) {
      for (let r2 = 0; r2 < 26; r2++) {
        for (let r1 = 0; r1 < 26; r1++) {
          scanned++;
          const pos = [r1, r2, r3];

          if (testPermutation(order, pos, cipher, crib)) {
            const elapsed = Math.max((Date.now() - startTime) / 1000, 0.01);
            const rate = Math.round(scanned / elapsed);
            self.postMessage({
              type: 'STOP',
              order,
              pos,
              posStr: ALPHABET[r3] + ' - ' + ALPHABET[r2] + ' - ' + ALPHABET[r1],
              scanned,
              total: totalPositions,
              rate
            });
            return;
          }

          if (scanned % 8192 === 0) {
            const elapsed = Math.max((Date.now() - startTime) / 1000, 0.01);
            const rate = Math.round(scanned / elapsed);
            self.postMessage({
              type: 'PROGRESS',
              scanned,
              total: totalPositions,
              order,
              pos,
              rate
            });
          }
        }
      }
    }
  }

  self.postMessage({ type: 'COMPLETE', scanned, total: totalPositions });
};
`;

export class MultiOrderBombeWorker {
  constructor() {
    this.worker = null;
    this.isRunning = false;
  }

  start(cipher, crib, scanAll60 = true, singleOrder = ['III', 'II', 'I'], onProgress, onStop, onComplete) {
    this.stop();
    this.isRunning = true;

    const blob = new Blob([BOMBE_WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);

    this.worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'PROGRESS' && onProgress) {
        onProgress(msg.scanned, msg.total, msg.order, msg.pos, msg.rate);
      } else if (msg.type === 'STOP') {
        this.isRunning = false;
        if (onStop) onStop(msg);
        this.stop();
      } else if (msg.type === 'COMPLETE') {
        this.isRunning = false;
        if (onComplete) onComplete(msg);
        this.stop();
      }
    };

    this.worker.postMessage({
      cipher,
      crib,
      singleOrder: scanAll60 ? null : singleOrder
    });
  }

  stop() {
    this.isRunning = false;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
