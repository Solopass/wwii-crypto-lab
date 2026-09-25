import { PolishBiuroEngine } from '../crypto/polish.js';
import { RejewskiCatalogue } from '../crypto/rejewskiCatalogue.js';
import { sound } from '../audio/soundFX.js';

export const polishEngine = new PolishBiuroEngine();
export const rejewskiCatalogue = new RejewskiCatalogue();

export function initPolishUI() {
  const display = document.getElementById('polish-cycle-display');
  const cardResultsEl = document.getElementById('rejewski-card-results');

  document.getElementById('btn-rejewski-catalogue')?.addEventListener('click', () => {
    const cycles = polishEngine.computePermutationCycles();
    const cycleStr = cycles.slice(0, 6).map(c => `(${c.join('')})`).join(' ');
    const lengths = polishEngine.getCycleLengths(cycles).join(', ');

    if (display) {
      display.textContent = `Cycles: ${cycleStr}... [Lengths: ${lengths}]`;
    }

    // Query the Rejewski Card Catalogue
    const matches = rejewskiCatalogue.search(lengths);
    if (cardResultsEl) {
      cardResultsEl.innerHTML = '';
      matches.forEach(m => {
        const item = document.createElement('div');
        item.className = 'p-2 rounded bg-slate-900 border border-amber-600/30 text-xs font-mono-code space-y-1';
        item.innerHTML = `
          <div class="flex justify-between text-amber-400 font-bold">
            <span>Rotors: ${m.rotors.join(' - ')}</span>
            <span class="text-[10px] text-slate-400">${m.period}</span>
          </div>
          <div class="text-slate-300 text-[11px]">Ground Setting Candidate: <strong class="text-emerald-400">${m.ground}</strong></div>
        `;
        cardResultsEl.appendChild(item);
      });
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
