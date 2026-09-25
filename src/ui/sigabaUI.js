import { ALPHABET } from '../crypto/constants.js';
import { SIGABACore } from '../crypto/sigaba.js';
import { sound } from '../audio/soundFX.js';
import { rotateSIGABARotors } from '../scene3d/sigabaModel.js';

export const sigaba = new SIGABACore();

export function initSIGABAUI() {
  function updateSIGABADisplay() {
    const ctrlEl = document.getElementById('sigaba-ctrl-pos');
    const idxEl = document.getElementById('sigaba-idx-pos');
    const ciphEl = document.getElementById('sigaba-ciph-pos');

    if (ctrlEl) ctrlEl.textContent = sigaba.controlPositions.map(p => ALPHABET[p]).join(' - ');
    if (idxEl) idxEl.textContent = sigaba.indexPositions.map(p => ALPHABET[p]).join(' - ');
    if (ciphEl) ciphEl.textContent = sigaba.cipherPositions.map(p => ALPHABET[p]).join(' - ');

    rotateSIGABARotors(sigaba.controlPositions, sigaba.indexPositions, sigaba.cipherPositions);
  }

  document.getElementById('btn-sigaba-encipher')?.addEventListener('click', () => {
    const input = document.getElementById('sigaba-plain-input');
    const plain = input?.value || 'US NAVY';
    const cipher = sigaba.encryptMessage(plain);
    const out = document.getElementById('sigaba-cipher-output');
    if (out) out.textContent = cipher.match(/.{1,5}/g)?.join(' ') || cipher;
    updateSIGABADisplay();
    sound.playRelayClick();
  });

  document.getElementById('btn-sigaba-reset')?.addEventListener('click', () => {
    sigaba.reset();
    updateSIGABADisplay();
    const out = document.getElementById('sigaba-cipher-output');
    if (out) out.textContent = '---';
    sound.playRotorStep();
  });

  updateSIGABADisplay();
}
