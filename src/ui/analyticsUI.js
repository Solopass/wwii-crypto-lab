import { ALPHABET } from '../crypto/constants.js';
import {
  calculateFrequencies,
  calculateIndexOfCoincidence,
  kasiskiExamination,
  GERMAN_FREQUENCIES,
  ENGLISH_FREQUENCIES
} from '../crypto/analytics.js';

export function initAnalyticsUI() {
  const freqCanvas = document.getElementById('analytics-freq-canvas');
  const iocValEl = document.getElementById('analytics-ioc-val');
  const iocBarEl = document.getElementById('analytics-ioc-bar');
  const iocDescEl = document.getElementById('analytics-ioc-desc');
  const kasiskiListEl = document.getElementById('analytics-kasiski-list');

  function updateAnalytics() {
    const cipherText = document.getElementById('output-ciphertext')?.textContent.replace(/[^A-Z]/g, '') || '';
    const plainText = document.getElementById('input-plaintext')?.value.replace(/[^A-Z]/g, '') || '';
    const targetText = cipherText || plainText || 'BDZGOWETTERVORHERSAGE';

    const freqData = calculateFrequencies(targetText);
    const ioc = calculateIndexOfCoincidence(targetText);
    const kasiski = kasiskiExamination(targetText, 3);

    // 1. Draw Frequency Canvas
    if (freqCanvas) {
      const ctx = freqCanvas.getContext('2d');
      const w = freqCanvas.width = freqCanvas.clientWidth || 320;
      const h = freqCanvas.height = freqCanvas.clientHeight || 130;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      const barWidth = (w - 20) / 26;
      const maxPct = 20;

      for (let i = 0; i < 26; i++) {
        const ch = ALPHABET[i];
        const observedPct = freqData.percentages[ch] || 0;
        const expectedGerPct = GERMAN_FREQUENCIES[ch] || 0;

        const x = 10 + i * barWidth;
        const barHeight = Math.min((observedPct / maxPct) * (h - 24), h - 24);
        const y = h - barHeight - 14;

        // Observed Frequency Bar (Amber)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // Expected German Benchmark Marker (Emerald Dot)
        const gerMarkerY = h - Math.min((expectedGerPct / maxPct) * (h - 24), h - 24) - 14;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x + (barWidth - 1) / 2, gerMarkerY, 2, 0, Math.PI * 2);
        ctx.fill();

        // X-axis letter labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px Courier Prime, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ch, x + (barWidth - 1) / 2, h - 3);
      }
    }

    // 2. Update Index of Coincidence Gauge
    if (iocValEl) {
      iocValEl.textContent = ioc.toFixed(4);
    }
    if (iocBarEl) {
      // Map 0.038 (random/Enigma) to 0.076 (German Plaintext) onto 0% to 100%
      const pct = Math.max(0, Math.min(100, ((ioc - 0.035) / (0.078 - 0.035)) * 100));
      iocBarEl.style.width = `${pct}%`;
      if (ioc >= 0.065) {
        iocBarEl.className = 'h-full bg-emerald-500 transition-all duration-300';
        if (iocDescEl) iocDescEl.innerHTML = '<span class="text-emerald-400 font-bold">★ MONOLINGUAL PLAINTEXT RECOVERED (IoC &ge; 0.065)</span>';
      } else if (ioc >= 0.050) {
        iocBarEl.className = 'h-full bg-amber-500 transition-all duration-300';
        if (iocDescEl) iocDescEl.innerHTML = '<span class="text-amber-300 font-bold">Transitional Polyalphabetic Mixture</span>';
      } else {
        iocBarEl.className = 'h-full bg-rose-500 transition-all duration-300';
        if (iocDescEl) iocDescEl.innerHTML = '<span class="text-rose-400 font-bold">High Entropy Enigma Keystream (IoC &approx; 0.038)</span>';
      }
    }

    // 3. Update Kasiski Examination List
    if (kasiskiListEl) {
      kasiskiListEl.innerHTML = '';
      if (kasiski.length === 0) {
        kasiskiListEl.innerHTML = '<div class="text-[10px] text-slate-500 font-mono-code">No repeated 3-grams found in current stream.</div>';
      } else {
        kasiski.forEach(k => {
          const div = document.createElement('div');
          div.className = 'flex justify-between text-[10px] font-mono-code text-slate-300 border-b border-slate-900 pb-0.5';
          div.innerHTML = `<span class="text-amber-300 font-bold">"${k.gram}"</span><span>${k.occurrences}x (distances: ${k.distances.join(', ')})</span>`;
          kasiskiListEl.appendChild(div);
        });
      }
    }
  }

  // Hook into stream updates
  document.getElementById('input-plaintext')?.addEventListener('input', updateAnalytics);
  document.getElementById('btn-run-analytics')?.addEventListener('click', updateAnalytics);

  updateAnalytics();
}
