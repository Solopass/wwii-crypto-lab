import { ALPHABET } from '../crypto/constants.js';
import { TuringBombe } from '../crypto/bombe.js';
import { sound } from '../audio/soundFX.js';
import { spinBombeDrums } from '../scene3d/bombeModel.js';
import { enigma, updateRotorUI, handleKeystroke } from './controllers.js';

export const bombe = new TuringBombe();

export function initBombeUI(switchTabFn) {
  const cipherInput = document.getElementById('bombe-cipher-input');
  const cribInput = document.getElementById('bombe-crib-input');
  const statusBadge = document.getElementById('bombe-status-badge');
  const scannedCountEl = document.getElementById('bombe-scanned-count');
  const progressBar = document.getElementById('bombe-progress-bar');
  const solutionBox = document.getElementById('bombe-solution-box');
  const stopRotorsEl = document.getElementById('bombe-stop-rotors');
  const stopPosEl = document.getElementById('bombe-stop-pos');

  // Menu Graph Canvas Renderer
  function drawMenuGraph() {
    const canvas = document.getElementById('bombe-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 300;
    const h = canvas.height = canvas.clientHeight || 140;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    const cipher = cipherInput?.value.toUpperCase().replace(/[^A-Z]/g, '') || 'BDZGO';
    const crib = cribInput?.value.toUpperCase().replace(/[^A-Z]/g, '') || 'WETTE';
    const edges = bombe.buildMenuGraph(cipher, crib);

    if (edges.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Courier Prime, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Enter matching crib & cipher to form menu loops', w / 2, h / 2);
      return;
    }

    // Extract unique letters
    const letters = Array.from(new Set([...edges.map(e => e.cipher), ...edges.map(e => e.crib)]));
    const nodeCoords = {};
    const radius = Math.min(w, h) * 0.38;
    const centerX = w / 2;
    const centerY = h / 2;

    letters.forEach((l, idx) => {
      const angle = (idx / letters.length) * Math.PI * 2 - Math.PI / 2;
      nodeCoords[l] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    // Draw Edges (scramblers)
    ctx.strokeStyle = '#f59e0b88';
    ctx.lineWidth = 2;
    edges.forEach(e => {
      const p1 = nodeCoords[e.cipher];
      const p2 = nodeCoords[e.crib];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // Draw Nodes (letters)
    letters.forEach(l => {
      const p = nodeCoords[l];
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px Courier Prime, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l, p.x, p.y);
    });
  }

  cipherInput?.addEventListener('input', drawMenuGraph);
  cribInput?.addEventListener('input', drawMenuGraph);
  drawMenuGraph();

  // Run Bombe Scan
  document.getElementById('btn-run-bombe')?.addEventListener('click', () => {
    const cipher = cipherInput?.value || 'BDZGO';
    const crib = cribInput?.value || 'AAAAA';

    if (statusBadge) {
      statusBadge.textContent = 'SCANNING (HUT 11)...';
      statusBadge.className = 'text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold animate-pulse';
    }
    if (solutionBox) solutionBox.classList.add('hidden');

    drawMenuGraph();

    let clickCounter = 0;
    bombe.startScan(
      cipher,
      crib,
      (scanned, total, pos) => {
        if (scannedCountEl) scannedCountEl.textContent = `${scanned.toLocaleString()} / ${total.toLocaleString()}`;
        if (progressBar) progressBar.style.width = `${Math.min((scanned / total) * 100, 100)}%`;
        spinBombeDrums(0.3);

        clickCounter++;
        if (clickCounter % 8 === 0) {
          sound.playRelayClick();
        }
      },
      (stop) => {
        if (statusBadge) {
          statusBadge.textContent = '★ TURING STOP CONFIRMED';
          statusBadge.className = 'text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold';
        }
        if (solutionBox) solutionBox.classList.remove('hidden');
        if (stopRotorsEl) stopRotorsEl.innerHTML = `Rotors: <strong class="text-amber-300">${stop.rotors.join(' - ')}</strong>`;
        if (stopPosEl) stopPosEl.innerHTML = `Positions: <strong class="text-emerald-400">${stop.positionStr}</strong>`;
        sound.playRotorStep();
        sound.playRelayClick();
      },
      () => {
        if (statusBadge) {
          statusBadge.textContent = 'SCAN COMPLETED (NO STOPS)';
          statusBadge.className = 'text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-400';
        }
      }
    );
  });

  // Stop Bombe Scan
  document.getElementById('btn-stop-bombe')?.addEventListener('click', () => {
    bombe.stopScan();
    if (statusBadge) {
      statusBadge.textContent = 'STOPPED';
      statusBadge.className = 'text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-400';
    }
  });

  // Transfer Key to Enigma & Decipher
  document.getElementById('btn-bombe-transfer-key')?.addEventListener('click', () => {
    if (bombe.stopFound) {
      const stop = bombe.stopFound;
      enigma.rotorTypes = [stop.rotors[2], stop.rotors[1], stop.rotors[0], 'Beta'];
      enigma.positions = [stop.positions[0], stop.positions[1], stop.positions[2], 0];
      updateRotorUI();

      if (switchTabFn) switchTabFn('enigma');

      // Clear streams and re-decrypt intercept
      const cipher = cipherInput?.value.toUpperCase().replace(/[^A-Z]/g, '') || '';
      const ptInput = document.getElementById('input-plaintext');
      const outCipher = document.getElementById('output-ciphertext');
      if (ptInput) ptInput.value = '';
      if (outCipher) outCipher.textContent = '---';

      // Feed ciphertext back through reciprocal Enigma to reveal plaintext
      for (const ch of cipher) {
        handleKeystroke(ch, false);
      }
    }
  });

  // 26x26 Welchman Diagonal Board Matrix Modal
  initWelchmanBoard();
}

export function initWelchmanBoard() {
  const matrixGrid = document.getElementById('diagonal-matrix-grid');
  const selHypo = document.getElementById('sel-diagonal-hypothesis');
  if (!matrixGrid) return;
  matrixGrid.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'w-5 h-5 font-bold text-amber-500 flex items-center justify-center';
  corner.textContent = '·';
  matrixGrid.appendChild(corner);

  for (let c = 0; c < 26; c++) {
    const colHdr = document.createElement('div');
    colHdr.className = 'w-5 h-5 font-bold text-amber-400 flex items-center justify-center';
    colHdr.textContent = ALPHABET[c];
    matrixGrid.appendChild(colHdr);
  }

  for (let r = 0; r < 26; r++) {
    const rowHdr = document.createElement('div');
    rowHdr.className = 'w-5 h-5 font-bold text-amber-400 flex items-center justify-center';
    rowHdr.textContent = ALPHABET[r];
    matrixGrid.appendChild(rowHdr);

    for (let c = 0; c < 26; c++) {
      const cell = document.createElement('div');
      cell.id = `diag-${ALPHABET[r]}-${ALPHABET[c]}`;
      cell.className = 'w-5 h-5 border border-slate-800 flex items-center justify-center cursor-pointer transition-all';
      cell.textContent = r === c ? '—' : '·';
      cell.onclick = () => injectVoltageHypothesis(ALPHABET[r]);
      matrixGrid.appendChild(cell);
    }
  }

  if (selHypo) {
    selHypo.innerHTML = '';
    ALPHABET.split('').forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch;
      opt.textContent = `Hypothesis: ${ch}`;
      selHypo.appendChild(opt);
    });
  }

  document.getElementById('btn-open-diagonal-board')?.addEventListener('click', () => {
    document.getElementById('modal-diagonal-board')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-diagonal-board')?.addEventListener('click', () => {
    document.getElementById('modal-diagonal-board')?.classList.add('hidden');
  });
  document.getElementById('btn-step-diagonal-voltage')?.addEventListener('click', () => {
    injectVoltageHypothesis(selHypo?.value || 'A');
  });
  document.getElementById('btn-reset-diagonal-board')?.addEventListener('click', () => initWelchmanBoard());
}

export function injectVoltageHypothesis(startChar) {
  sound.playRelayClick();
  const energized = new Set([startChar]);
  const cipher = document.getElementById('bombe-cipher-input')?.value.toUpperCase() || '';
  const crib = document.getElementById('bombe-crib-input')?.value.toUpperCase() || '';

  for (let i = 0; i < Math.min(cipher.length, crib.length, 12); i++) {
    if (energized.has(cipher[i])) energized.add(crib[i]);
    if (energized.has(crib[i])) energized.add(cipher[i]);
  }

  for (let r = 0; r < 26; r++) {
    for (let c = 0; c < 26; c++) {
      const cell = document.getElementById(`diag-${ALPHABET[r]}-${ALPHABET[c]}`);
      if (!cell || r === c) continue;
      const live = energized.has(ALPHABET[r]) && energized.has(ALPHABET[c]);
      cell.style.backgroundColor = live ? '#f59e0b' : '#030712';
      cell.style.color = live ? '#000000' : '#64748b';
    }
  }

  const statusText = document.getElementById('diagonal-status-text');
  if (statusText) {
    if (energized.size >= 25) {
      statusText.innerHTML = `Hypothesis <strong class="text-rose-400">${startChar}</strong> energized ${energized.size}/26 wires: <strong class="text-rose-400">CONTRADICTION DETECTED</strong>. Position rejected!`;
    } else {
      statusText.innerHTML = `Hypothesis <strong class="text-emerald-400">${startChar}</strong> energized ${energized.size}/26 wires: <strong class="text-emerald-400">TURING STOP CANDIDATE</strong>!`;
    }
  }
}
