import { ALPHABET } from '../crypto/constants.js';
import { TypexCore } from '../crypto/typex.js';
import { sound } from '../audio/soundFX.js';
import { rotateTypexDrums, updateTypexRibbon } from '../scene3d/typexModel.js';

export const typex = new TypexCore();

export function initTypexUI() {
  const typexInput = document.getElementById('typex-input');
  const tapeOutput = document.getElementById('typex-tape-output');

  function updateTypexDisplay() {
    for (let i = 0; i < 5; i++) {
      const disp = document.getElementById(`typex-disp-${i}`);
      if (disp) disp.textContent = ALPHABET[typex.positions[i] || 0];
    }
    rotateTypexDrums(typex.positions);
  }

  function handleTypexKeystroke(char) {
    char = char.toUpperCase();
    if (!ALPHABET.includes(char)) return;

    sound.playKeyClick();
    sound.playRotorStep();

    const cipherChar = typex.encryptLetter(char);
    updateTypexDisplay();

    if (tapeOutput) {
      if (tapeOutput.textContent.includes('READY ///')) {
        tapeOutput.textContent = '';
      }
      tapeOutput.textContent += cipherChar + ' ';
      tapeOutput.scrollLeft = tapeOutput.scrollWidth;
      updateTypexRibbon(tapeOutput.textContent);
    }
  }

  // Typex Text input listener
  let lastVal = '';
  typexInput?.addEventListener('input', () => {
    const val = typexInput.value.toUpperCase().replace(/[^A-Z]/g, '');
    typexInput.value = val;
    if (val.length > lastVal.length) {
      const added = val.slice(lastVal.length);
      for (const ch of added) handleTypexKeystroke(ch);
    } else if (val.length < lastVal.length) {
      typex.reset();
      updateTypexDisplay();
      if (tapeOutput) tapeOutput.textContent = 'TYPE-X TELEPRINTER READY /// ';
      for (const ch of val) handleTypexKeystroke(ch);
    }
    lastVal = val;
  });

  // Manual stepping buttons
  for (let i = 0; i < 5; i++) {
    document.getElementById(`typex-step-${i}`)?.addEventListener('click', () => {
      typex.positions[i] = (typex.positions[i] + 1) % 26;
      updateTypexDisplay();
      sound.playRotorStep();
    });
  }

  // Reset button
  document.getElementById('btn-typex-reset')?.addEventListener('click', () => {
    typex.reset();
    updateTypexDisplay();
    if (typexInput) typexInput.value = '';
    lastVal = '';
    if (tapeOutput) tapeOutput.textContent = 'TYPE-X TELEPRINTER READY /// ';
    updateTypexRibbon('TYPE-X TELEPRINTER READY ///');
    sound.playRotorStep();
  });

  // Churchill Directive Demo
  document.getElementById('btn-typex-demo')?.addEventListener('click', () => {
    typex.reset();
    updateTypexDisplay();
    const directive = "ACTION THIS DAY ASSIGN MAXIMUM PRIORITY TO STATION X";
    if (typexInput) typexInput.value = directive.replace(/\s+/g, '');
    if (tapeOutput) tapeOutput.textContent = 'TYPE-X TELEPRINTER READY /// ';
    for (const ch of directive.replace(/\s+/g, '')) {
      handleTypexKeystroke(ch);
    }
  });

  updateTypexDisplay();
}
