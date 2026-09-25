import { PolishBiuroEngine } from '../crypto/polish.js';
import { sound } from '../audio/soundFX.js';

export const polishEngine = new PolishBiuroEngine();

export function initPolishUI() {
  document.getElementById('btn-rejewski-catalogue')?.addEventListener('click', () => {
    const cycles = polishEngine.computePermutationCycles();
    const cycleStr = cycles.slice(0, 6).map(c => `(${c.join('')})`).join(' ');
    const lengths = polishEngine.getCycleLengths(cycles).join(', ');
    const display = document.getElementById('polish-cycle-display');
    if (display) {
      display.textContent = `Cycles: ${cycleStr}... [Lengths: ${lengths}]`;
    }
    sound.playRelayClick();
  });

  function drawZygalskiLightTable() {
    const cv = document.getElementById('zygalski-light-table-canvas');
    if (!cv) return;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#020617';
    cx.fillRect(0, 0, 400, 400);

    const offX = parseInt(document.getElementById('zygalski-offset-x')?.value || 0, 10);
    const offY = parseInt(document.getElementById('zygalski-offset-y')?.value || 0, 10);

    const apertures = polishEngine.computeZygalskiApertures(offX, offY);

    let matchCount = 0;
    for (let r = 0; r < 26; r++) {
      for (let c = 0; c < 26; c++) {
        const x = 15 + c * 14;
        const y = 15 + r * 14;
        const isMatch = apertures[r][c];

        if (isMatch) {
          matchCount++;
          cx.fillStyle = '#38bdf8';
          cx.shadowColor = '#38bdf8';
          cx.shadowBlur = 10;
          cx.fillRect(x - 2, y - 2, 8, 8);
          cx.shadowBlur = 0;
        } else if ((r * 7 + c * 3 + 1) % 5 === 0) {
          cx.fillStyle = '#1e293b';
          cx.fillRect(x, y, 4, 4);
        }
      }
    }

    const resText = document.getElementById('zygalski-result-text');
    if (resText) {
      if (matchCount > 0) {
        resText.textContent = `★ Female aperture matches isolated: ${matchCount} ground setting candidate(s)`;
        resText.className = 'text-emerald-400 font-bold';
      } else {
        resText.textContent = 'No through-aperture. Shift sheets to scan indicators.';
        resText.className = 'text-amber-300 font-bold';
      }
    }
  }

  document.getElementById('btn-open-zygalski')?.addEventListener('click', () => {
    document.getElementById('modal-zygalski')?.classList.remove('hidden');
    drawZygalskiLightTable();
  });
  document.getElementById('btn-close-zygalski')?.addEventListener('click', () => {
    document.getElementById('modal-zygalski')?.classList.add('hidden');
  });
  document.getElementById('zygalski-offset-x')?.addEventListener('input', drawZygalskiLightTable);
  document.getElementById('zygalski-offset-y')?.addEventListener('input', drawZygalskiLightTable);

  drawZygalskiLightTable();
}
