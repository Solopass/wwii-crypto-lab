import { ALPHABET, MORSE_CODE_MAP, REVERSE_MORSE } from '../crypto/constants.js';
import { sound } from '../audio/soundFX.js';
import { handleKeystroke } from './controllers.js';

export function initMorseUI() {
  const brassKeyBtn = document.getElementById('brass-telegraph-key');
  const freqSlider = document.getElementById('slider-morse-freq');
  const freqValEl = document.getElementById('morse-freq-val');
  const wpmSlider = document.getElementById('slider-morse-wpm');
  const wpmValEl = document.getElementById('morse-wpm-val');
  const staticChk = document.getElementById('chk-morse-static');
  const playStreamBtn = document.getElementById('btn-play-stream-morse');
  const patternEl = document.getElementById('morse-pattern-str');
  const decodedEl = document.getElementById('morse-decoded-char');

  let keyDownTime = 0;
  let morseTokens = '';
  let morseTimeout = null;
  let isPlayingStream = false;

  function handleMorseDown() {
    sound.init();
    keyDownTime = performance.now();
    const freq = parseInt(freqSlider?.value || 750, 10);
    sound.startMorseTone(freq);
    brassKeyBtn?.classList.add('translate-y-1');
  }

  function handleMorseUp() {
    if (keyDownTime === 0) return;
    const dur = performance.now() - keyDownTime;
    keyDownTime = 0;
    sound.stopMorseTone();
    brassKeyBtn?.classList.remove('translate-y-1');

    morseTokens += dur > 160 ? '-' : '.';
    if (patternEl) patternEl.textContent = morseTokens;

    clearTimeout(morseTimeout);
    morseTimeout = setTimeout(() => {
      const char = REVERSE_MORSE[morseTokens] || '?';
      if (decodedEl) decodedEl.textContent = char;
      if (ALPHABET.includes(char)) {
        handleKeystroke(char);
      }
      morseTokens = '';
    }, 450);
  }

  brassKeyBtn?.addEventListener('mousedown', handleMorseDown);
  brassKeyBtn?.addEventListener('mouseup', handleMorseUp);
  brassKeyBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); handleMorseDown(); });
  brassKeyBtn?.addEventListener('touchend', (e) => { e.preventDefault(); handleMorseUp(); });

  freqSlider?.addEventListener('input', () => {
    if (freqValEl) freqValEl.textContent = `${freqSlider.value} Hz`;
  });

  wpmSlider?.addEventListener('input', () => {
    if (wpmValEl) wpmValEl.textContent = `${wpmSlider.value} WPM`;
  });

  staticChk?.addEventListener('change', () => {
    sound.init();
    if (staticChk.checked) {
      sound.startAtmosphericNoise();
    } else {
      sound.stopAtmosphericNoise();
    }
  });

  // Play Active Cipher Stream in Morse
  playStreamBtn?.addEventListener('click', () => {
    sound.init();
    if (isPlayingStream) {
      sound.stopMorsePlayback();
      isPlayingStream = false;
      playStreamBtn.textContent = '▶ Play Active Cipher Stream in Morse';
      playStreamBtn.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      playStreamBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
      return;
    }

    const cipher = document.getElementById('output-ciphertext')?.textContent.replace(/[^A-Z]/g, '') || 'BDZGO';
    const morsePattern = cipher
      .split('')
      .map(c => MORSE_CODE_MAP[c] || '')
      .filter(Boolean)
      .join(' ');

    if (!morsePattern) return;

    isPlayingStream = true;
    playStreamBtn.textContent = '⏹ Stop Morse Playback';
    playStreamBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
    playStreamBtn.classList.add('bg-rose-600', 'hover:bg-rose-500');

    const wpm = parseInt(wpmSlider?.value || 18, 10);
    const freq = parseInt(freqSlider?.value || 750, 10);

    sound.playMorseSequence(morsePattern, wpm, freq, () => {
      isPlayingStream = false;
      playStreamBtn.textContent = '▶ Play Active Cipher Stream in Morse';
      playStreamBtn.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      playStreamBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    });
  });

  // Morse modal open/close
  document.getElementById('btn-morse-panel')?.addEventListener('click', () => {
    sound.init();
    if (staticChk?.checked) sound.startAtmosphericNoise();
    document.getElementById('modal-morse')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-morse')?.addEventListener('click', () => {
    sound.stopAtmosphericNoise();
    sound.stopMorsePlayback();
    document.getElementById('modal-morse')?.classList.add('hidden');
  });
}
