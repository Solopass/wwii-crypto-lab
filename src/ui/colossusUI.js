import { BAUDOT_TABLE, LORENZ_WHEEL_SIZES } from '../crypto/constants.js';
import { LorenzSZ42Core } from '../crypto/lorenz.js';
import { ColossusEngine } from '../crypto/colossus.js';
import { sound } from '../audio/soundFX.js';
import { pulseColossusValves, spinColossusPulleys } from '../scene3d/colossusModel.js';
import { checkMissionStatus } from './missionsUI.js';

export const lorenz = new LorenzSZ42Core();
export const colossus = new ColossusEngine();

export function initColossusUI() {
  const plainInput = document.getElementById('lorenz-plain-input');
  const cipherOutput = document.getElementById('lorenz-cipher-output');
  const tapeStream = document.getElementById('tape-stream');
  const punchTapeBox = document.getElementById('baudot-punch-tape');
  const camPinsGrid = document.getElementById('lorenz-cam-pins-grid');

  // 1. Draw 5-hole Baudot Optical Punched Tape
  function renderBaudotPunchTape(text) {
    if (!punchTapeBox) return;
    punchTapeBox.innerHTML = '';
    const clean = text.toUpperCase().slice(0, 16);

    clean.split('').forEach(char => {
      const bits = BAUDOT_TABLE[char] || BAUDOT_TABLE[' '];
      const col = document.createElement('div');
      col.className = 'flex flex-col items-center gap-0.5 bg-slate-950 p-1 rounded border border-slate-800';

      const label = document.createElement('span');
      label.className = 'text-[9px] text-amber-400 font-bold';
      label.textContent = char;
      col.appendChild(label);

      // 5 Channels + central sprocket feed hole
      for (let ch = 0; ch < 5; ch++) {
        if (ch === 2) {
          // Sprocket guide hole
          const sprocket = document.createElement('div');
          sprocket.className = 'w-1.5 h-1.5 rounded-full bg-slate-600 my-0.5';
          col.appendChild(sprocket);
        }
        const hole = document.createElement('div');
        const isPunched = bits[ch] === '1';
        hole.className = `w-2 h-2 rounded-full border ${isPunched ? 'bg-sky-400 border-sky-300 shadow-sm shadow-sky-400' : 'bg-slate-900 border-slate-800'}`;
        col.appendChild(hole);
      }
      punchTapeBox.appendChild(col);
    });
  }

  // 2. Interactive 12-Wheel Cam Pin Editor
  function renderCamPinsGrid() {
    if (!camPinsGrid) return;
    camPinsGrid.innerHTML = '';

    Object.keys(LORENZ_WHEEL_SIZES).forEach(wheel => {
      const size = LORENZ_WHEEL_SIZES[wheel];
      const pins = lorenz.cams[wheel];

      const card = document.createElement('div');
      card.className = 'p-1.5 bg-slate-900 rounded border border-slate-800 text-[9px] flex flex-col justify-between';

      const header = document.createElement('div');
      header.className = 'flex justify-between font-bold text-sky-400 font-mono-code mb-1';
      header.innerHTML = `<span>${wheel.toUpperCase()}</span><span>${pins.filter(p => p === 1).length}/${size}</span>`;
      card.appendChild(header);

      const pinBar = document.createElement('div');
      pinBar.className = 'flex flex-wrap gap-0.5 max-h-12 overflow-y-auto';

      pins.slice(0, 16).forEach((pin, idx) => {
        const pBtn = document.createElement('button');
        pBtn.className = `w-2.5 h-2.5 rounded-xs transition-colors ${pin === 1 ? 'bg-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`;
        pBtn.title = `Pin ${idx + 1}`;
        pBtn.onclick = () => {
          lorenz.setCamPin(wheel, idx, pin === 1 ? 0 : 1);
          renderCamPinsGrid();
          sound.playKeyClick();
        };
        pinBar.appendChild(pBtn);
      });

      card.appendChild(pinBar);
      camPinsGrid.appendChild(card);
    });
  }

  // 3. Bill Tutte Delta-Chi Histogram Canvas
  function drawTutteHistogram(scores, peakIdx) {
    const canvas = document.getElementById('tutte-histogram-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 300;
    const h = canvas.height = canvas.clientHeight || 112;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Draw 50% noise baseline
    const baselineY = h * 0.5;
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '8px Courier Prime, monospace';
    ctx.fillText('50% NOISE BASELINE', 4, baselineY - 2);

    if (!scores || scores.length === 0) return;

    const barWidth = (w - 20) / scores.length;
    for (let i = 0; i < scores.length; i++) {
      const val = scores[i] || 50;
      const barHeight = (val / 100) * (h - 20);
      const x = 10 + i * barWidth;
      const y = h - barHeight - 4;

      if (i === peakIdx) {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;

        // Label peak
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 9px Courier Prime, monospace';
        ctx.fillText(`★ ${val}%`, x - 8, y - 4);
      } else {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    }
  }

  // Encipher with SZ42
  document.getElementById('btn-encipher-lorenz')?.addEventListener('click', () => {
    const plain = plainInput?.value || 'UNTERNEHMEN ZITADELLE';
    const cipher = lorenz.encipherMessage(plain);
    if (cipherOutput) cipherOutput.textContent = cipher;

    renderBaudotPunchTape(plain);
    if (tapeStream) {
      tapeStream.textContent = `/// SPEED: 5,000 CHAR/SEC /// RAW INTERCEPT: ${cipher} ///`;
    }

    pulseColossusValves();
    spinColossusPulleys();
    sound.playRelayClick();
    sound.playValveHum();
  });

  // Decipher with SZ42
  document.getElementById('btn-decipher-lorenz')?.addEventListener('click', () => {
    const cipher = cipherOutput?.textContent || '';
    if (cipher && cipher !== '---') {
      const recovered = lorenz.decipherMessage(cipher);
      if (plainInput) plainInput.value = recovered;
      renderBaudotPunchTape(recovered);
      sound.playRelayClick();
    }
  });

  // Randomize Cam Pins
  document.getElementById('btn-randomize-cams')?.addEventListener('click', () => {
    lorenz.randomizeCams();
    renderCamPinsGrid();
    sound.playRotorStep();
  });

  // Run Colossus 1,500-Valve Statistical Break
  document.getElementById('btn-run-colossus')?.addEventListener('click', () => {
    sound.playValveHum();

    // High speed valve flicker animation
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      pulseColossusValves();
      spinColossusPulleys(0.08);
      flickerCount++;
      if (flickerCount > 10) {
        clearInterval(flickerInterval);
        const cipher = cipherOutput?.textContent || 'UNTERNEHMEN ZITADELLE';
        const res = colossus.executeBreak(cipher);

        drawTutteHistogram(res.scores, res.peakIndex);

        const resultBox = document.getElementById('colossus-result-box');
        if (resultBox) {
          resultBox.classList.remove('hidden');
          resultBox.innerHTML = `
            <div class="text-sky-300 font-bold">★ TUTTE DELTA-CHI STATISTICAL PEAK CONFIRMED (${res.maxScore}%)</div>
            <div class="text-slate-300 text-[11px]">Optimum Wheel Chi-1 Position: <strong class="text-emerald-400">Cam Pin ${res.peakIndex + 1}</strong></div>
            <div class="text-slate-300 text-[11px]">Hitler High Command Directive Decoded:</div>
            <div class="text-emerald-400 font-bold">${res.decodedDirective}</div>
          `;
        }
        checkMissionStatus("CITADEL");
        sound.playRelayClick();
      }
    }, 70);
  });

  renderCamPinsGrid();
  renderBaudotPunchTape(plainInput?.value || 'CITADEL');
  drawTutteHistogram(colossus.computeDeltaChiDistribution('CITADEL').scores, 14);
}
