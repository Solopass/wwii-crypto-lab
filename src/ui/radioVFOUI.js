/**
 * WWII National HRO / Telefunken E52 Style HF Radio Receiver VFO UI Controller
 */

import { radioReceiver, RADIO_STATIONS } from '../audio/radioVFO.js';

export function initRadioVFOUI(switchTabFn) {
  const freqDisp = document.getElementById('vfo-freq-display');
  const tuningSlider = document.getElementById('vfo-tuning-slider');
  const stationName = document.getElementById('vfo-station-name');
  const smeterBar = document.getElementById('vfo-smeter-bar');
  const smeterText = document.getElementById('vfo-smeter-text');
  const powerBtn = document.getElementById('vfo-power-toggle');
  const bfoBtn = document.getElementById('vfo-bfo-toggle');
  const volSlider = document.getElementById('vfo-volume-slider');
  const interceptStream = document.getElementById('vfo-intercept-stream');

  let interceptedBuffer = '';

  function formatFreq(khz) {
    const mhz = (khz / 1000).toFixed(3);
    return `${mhz} MHz`;
  }

  function updateDisplay() {
    if (freqDisp) freqDisp.textContent = formatFreq(radioReceiver.frequency);
    if (tuningSlider) tuningSlider.value = radioReceiver.frequency;
  }

  // Update signal telemetry from receiver engine
  radioReceiver.onSignalUpdate = (strength, pitch, station) => {
    if (!smeterBar || !smeterText) return;

    const pct = Math.round(strength * 100);
    smeterBar.style.width = `${pct}%`;

    if (strength > 0.85) {
      smeterText.textContent = `S9 +20dB [CENTER TUNE ${Math.round(pitch)}Hz]`;
      smeterBar.className = 'h-full bg-emerald-500 transition-all duration-150';
    } else if (strength > 0.45) {
      smeterText.textContent = `S7-S8 [BEAT ${Math.round(pitch)}Hz]`;
      smeterBar.className = 'h-full bg-amber-500 transition-all duration-150';
    } else if (strength > 0.1) {
      smeterText.textContent = `S3-S5 [WEAK HETERODYNE ${Math.round(pitch)}Hz]`;
      smeterBar.className = 'h-full bg-sky-500 transition-all duration-150';
    } else {
      smeterText.textContent = radioReceiver.powered ? 'S1 NOISE FLOOR' : 'OFFLINE';
      smeterBar.className = 'h-full bg-slate-700 transition-all duration-150';
    }

    if (stationName) {
      if (station && strength > 0.15) {
        stationName.textContent = `★ ${station.callsign}: ${station.name}`;
        stationName.className = 'text-xs font-mono-code text-emerald-400 font-bold';
      } else {
        stationName.textContent = radioReceiver.powered ? 'ATMOSPHERIC STATIC / SCANNING...' : 'RECEIVER POWER OFF';
        stationName.className = 'text-xs font-mono-code text-slate-400';
      }
    }
  };

  // Receive decoded Morse characters
  radioReceiver.onMorseKeyed = (ch, station) => {
    if (!interceptStream) return;
    interceptedBuffer += ch;
    if (interceptedBuffer.length > 120) {
      interceptedBuffer = interceptedBuffer.slice(-100);
    }
    interceptStream.textContent = interceptedBuffer;
    interceptStream.scrollLeft = interceptStream.scrollWidth;
  };

  // Power Toggle
  powerBtn?.addEventListener('click', () => {
    const nextPower = !radioReceiver.powered;
    radioReceiver.setPower(nextPower);
    if (powerBtn) {
      powerBtn.textContent = nextPower ? 'POWER: ON' : 'POWER: OFF';
      powerBtn.className = nextPower
        ? 'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-code text-xs font-bold'
        : 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono-code text-xs';
    }
  });

  // BFO Toggle
  bfoBtn?.addEventListener('click', () => {
    const nextBfo = !radioReceiver.bfoEnabled;
    radioReceiver.setBFO(nextBfo);
    if (bfoBtn) {
      bfoBtn.textContent = nextBfo ? 'BFO: ON' : 'BFO: OFF';
      bfoBtn.className = nextBfo
        ? 'px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono-code text-xs font-bold'
        : 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono-code text-xs';
    }
  });

  // Volume
  volSlider?.addEventListener('input', (e) => {
    radioReceiver.setVolume(parseFloat(e.target.value));
  });

  // Tuning Slider
  tuningSlider?.addEventListener('input', (e) => {
    const khz = parseFloat(e.target.value);
    radioReceiver.setFrequency(khz);
    if (freqDisp) freqDisp.textContent = formatFreq(khz);
  });

  // Fine Step Buttons
  document.getElementById('vfo-step-down')?.addEventListener('click', () => {
    radioReceiver.setFrequency(Math.max(3000, radioReceiver.frequency - 5));
    updateDisplay();
  });
  document.getElementById('vfo-step-up')?.addEventListener('click', () => {
    radioReceiver.setFrequency(Math.min(15000, radioReceiver.frequency + 5));
    updateDisplay();
  });

  // Quick Band Presets
  document.getElementById('vfo-band-80m')?.addEventListener('click', () => {
    if (tuningSlider) { tuningSlider.min = 3500; tuningSlider.max = 3800; }
    radioReceiver.setBand('80m');
    updateDisplay();
  });
  document.getElementById('vfo-band-40m')?.addEventListener('click', () => {
    if (tuningSlider) { tuningSlider.min = 7000; tuningSlider.max = 7300; }
    radioReceiver.setBand('40m');
    updateDisplay();
  });
  document.getElementById('vfo-band-20m')?.addEventListener('click', () => {
    if (tuningSlider) { tuningSlider.min = 14000; tuningSlider.max = 14350; }
    radioReceiver.setBand('20m');
    updateDisplay();
  });

  // Feed to Enigma
  document.getElementById('btn-vfo-feed-enigma')?.addEventListener('click', () => {
    const ptInput = document.getElementById('input-plaintext');
    const { station } = radioReceiver.getNearbyStation();
    const payload = (station ? station.cipher : interceptedBuffer).replace(/[^A-Z]/g, '');
    if (ptInput && payload) {
      ptInput.value = payload;
      ptInput.dispatchEvent(new Event('input'));
    }
    document.getElementById('modal-radio-vfo')?.classList.add('hidden');
    if (switchTabFn) switchTabFn('enigma');
  });

  // Feed to Bombe
  document.getElementById('btn-vfo-feed-bombe')?.addEventListener('click', () => {
    const bIn = document.getElementById('bombe-cipher-input');
    const { station } = radioReceiver.getNearbyStation();
    const payload = (station ? station.cipher : interceptedBuffer).replace(/[^A-Z]/g, '');
    if (bIn && payload) {
      bIn.value = payload.slice(0, 15);
      bIn.dispatchEvent(new Event('input'));
    }
    document.getElementById('modal-radio-vfo')?.classList.add('hidden');
    if (switchTabFn) switchTabFn('bombe');
  });

  // Modal open/close
  document.getElementById('btn-radio-vfo')?.addEventListener('click', () => {
    document.getElementById('modal-radio-vfo')?.classList.remove('hidden');
    if (!radioReceiver.powered) {
      powerBtn?.click();
    }
  });
  document.getElementById('btn-close-radio-vfo')?.addEventListener('click', () => {
    document.getElementById('modal-radio-vfo')?.classList.add('hidden');
  });

  updateDisplay();
}
