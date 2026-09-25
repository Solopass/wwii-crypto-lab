/**
 * WWII Analog HF Radio VFO (Variable Frequency Oscillator) & Superheterodyne Receiver Engine
 * Simulates:
 * - Atmospheric static & ionospheric fading on 80m, 40m, and 20m military bands
 * - Heterodyne BFO (Beat Frequency Oscillator) whistle as tuning approaches zero-beat
 * - Authentic CW Morse code transmissions from Kriegsmarine, Luftwaffe, and OKW stations
 */

import { MORSE_MAP } from '../crypto/constants.js';

export const RADIO_STATIONS = [
  {
    freq: 7050,
    band: '40m',
    callsign: 'DL4M',
    name: 'KMS Admiral Scheer (Kriegsmarine Shark)',
    cipher: 'STANDORTQUADRAT NACHRICHTEN X ENIGMA M4 BDZGO',
    wpm: 18
  },
  {
    freq: 7120,
    band: '40m',
    callsign: 'DF2K',
    name: 'Luftwaffe Fliegerkorps II (Channel Weather)',
    cipher: 'WETTERVORHERSAGE KANAL X WIND SUEDWEST STAERKE VIER X',
    wpm: 20
  },
  {
    freq: 14100,
    band: '20m',
    callsign: 'DD8W',
    name: 'OKW Oberkommando (Lorenz SZ42 Carrier)',
    cipher: 'UNTERNEHMEN ZITADELLE GENERALINSPEKTEUR DER PANZERTRUPPEN',
    wpm: 22
  },
  {
    freq: 3560,
    band: '80m',
    callsign: 'G4BP',
    name: 'Station X RSS Voluntary Interceptor Beacon',
    cipher: 'CQ CQ CQ DE G4BP BLETCHLEY PARK K',
    wpm: 16
  }
];

export class RadioVFOReceiver {
  constructor() {
    this.ctx = null;
    this.powered = false;
    this.bfoEnabled = true;
    this.frequency = 7050; // kHz
    this.band = '40m';
    this.volume = 0.6;

    this.masterGain = null;
    this.staticGain = null;
    this.staticFilter = null;
    this.noiseNode = null;

    this.bfoOsc = null;
    this.bfoGain = null;

    this.currentSignalStrength = 0; // 0.0 to 1.0
    this.onSignalUpdate = null;
    this.onMorseKeyed = null;

    this.morseLoopActive = false;
    this.morseLoopTimer = null;
    this.currentTxChar = '';
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setPower(on) {
    if (this.powered === on) return;
    this.powered = on;

    if (this.powered) {
      this.initContext();
      this.startAudioEngine();
      this.startMorseTransmissions();
    } else {
      this.stopAudioEngine();
      this.stopMorseTransmissions();
      this.currentSignalStrength = 0;
      if (this.onSignalUpdate) this.onSignalUpdate(0, 0, null);
    }
  }

  startAudioEngine() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Master receiver output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, t);
    this.masterGain.connect(this.ctx.destination);

    // 1. Atmospheric Noise Generator (White noise through bandpass)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.staticFilter = this.ctx.createBiquadFilter();
    this.staticFilter.type = 'bandpass';
    this.staticFilter.frequency.setValueAtTime(1400, t);
    this.staticFilter.Q.setValueAtTime(1.2, t);

    this.staticGain = this.ctx.createGain();
    this.staticGain.gain.setValueAtTime(0.12, t);

    this.noiseNode.connect(this.staticFilter);
    this.staticFilter.connect(this.staticGain);
    this.staticGain.connect(this.masterGain);
    this.noiseNode.start(t);

    // 2. Heterodyne BFO Beat Frequency Oscillator
    this.bfoOsc = this.ctx.createOscillator();
    this.bfoOsc.type = 'sine';
    this.bfoOsc.frequency.setValueAtTime(800, t);

    this.bfoGain = this.ctx.createGain();
    this.bfoGain.gain.setValueAtTime(0, t);

    this.bfoOsc.connect(this.bfoGain);
    this.bfoGain.connect(this.masterGain);
    this.bfoOsc.start(t);

    this.updateTuning();
  }

  stopAudioEngine() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) {}
      this.noiseNode = null;
    }
    if (this.bfoOsc) {
      try { this.bfoOsc.stop(); } catch (e) {}
      this.bfoOsc = null;
    }
    this.masterGain = null;
    this.staticGain = null;
    this.bfoGain = null;
  }

  setFrequency(khz) {
    this.frequency = khz;
    this.updateTuning();
  }

  setBand(band) {
    this.band = band;
    if (band === '80m') this.setFrequency(3560);
    else if (band === '40m') this.setFrequency(7050);
    else if (band === '20m') this.setFrequency(14100);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setBFO(enabled) {
    this.bfoEnabled = enabled;
    this.updateTuning();
  }

  getNearbyStation() {
    let closest = null;
    let minDiff = Infinity;
    for (const st of RADIO_STATIONS) {
      const diff = Math.abs(this.frequency - st.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = st;
      }
    }
    return { station: closest, diff: minDiff };
  }

  updateTuning() {
    if (!this.powered || !this.ctx || !this.bfoOsc || !this.staticGain) return;

    const { station, diff } = this.getNearbyStation();
    const tuningWindow = 3.5; // kHz reception aperture

    if (diff <= tuningWindow) {
      // Proximity: 1.0 (dead center) to 0.0 (edge of passband)
      const proximity = 1.0 - (diff / tuningWindow);
      this.currentSignalStrength = Math.pow(proximity, 1.5);

      // Heterodyne BFO Whistle:
      // Off frequency produces an audio pitch equal to offset (zero-beat right on frequency)
      // When exactly on frequency with BFO enabled, classic 750 Hz CW tone
      let beatPitch = 750;
      if (diff > 0.05) {
        beatPitch = Math.min(3200, Math.max(90, diff * 650));
      }
      this.bfoOsc.frequency.setValueAtTime(beatPitch, this.ctx.currentTime);

      // AGC: Automatic Gain Control lowers static when strong carrier is present
      const agcStatic = Math.max(0.02, 0.12 * (1 - this.currentSignalStrength * 0.75));
      this.staticGain.gain.setValueAtTime(agcStatic, this.ctx.currentTime);

      if (this.onSignalUpdate) {
        this.onSignalUpdate(this.currentSignalStrength, beatPitch, station);
      }
    } else {
      this.currentSignalStrength = 0;
      this.staticGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      if (this.onSignalUpdate) {
        this.onSignalUpdate(0, 0, null);
      }
    }
  }

  startMorseTransmissions() {
    this.morseLoopActive = true;
    let stationIdx = 0;
    let charIdx = 0;

    const tick = () => {
      if (!this.morseLoopActive || !this.powered) return;

      const { station, diff } = this.getNearbyStation();
      const currentStation = station || RADIO_STATIONS[0];
      const text = currentStation.cipher;

      if (charIdx >= text.length) {
        charIdx = 0;
        this.morseLoopTimer = setTimeout(tick, 2000); // 2s pause between repeats
        return;
      }

      const ch = text[charIdx++];
      this.currentTxChar = ch;

      if (ch === ' ') {
        // Word space (7 units)
        this.morseLoopTimer = setTimeout(tick, 450);
        return;
      }

      const code = MORSE_MAP[ch];
      if (!code) {
        this.morseLoopTimer = setTimeout(tick, 100);
        return;
      }

      // Play elements of this character
      let elementIdx = 0;
      const unitTime = Math.max(35, 1200 / currentStation.wpm); // standard Paris timing (ms)

      const playElement = () => {
        if (!this.morseLoopActive || !this.powered) return;

        if (elementIdx >= code.length) {
          // Finished character: inter-character gap (3 units)
          if (this.onMorseKeyed) this.onMorseKeyed(ch, currentStation);
          this.morseLoopTimer = setTimeout(tick, unitTime * 3);
          return;
        }

        const symbol = code[elementIdx++];
        const duration = symbol === '-' ? unitTime * 3 : unitTime;

        // Key audio if receiver is on and tuned to this station
        if (this.bfoGain && this.ctx && this.currentSignalStrength > 0.05) {
          const t = this.ctx.currentTime;
          const targetVol = 0.3 * this.currentSignalStrength;
          this.bfoGain.gain.setValueAtTime(targetVol, t);
          this.bfoGain.gain.setValueAtTime(0, t + (duration / 1000) * 0.85); // 85% duty cycle keying
        }

        this.morseLoopTimer = setTimeout(playElement, duration + unitTime);
      };

      playElement();
    };

    tick();
  }

  stopMorseTransmissions() {
    this.morseLoopActive = false;
    if (this.morseLoopTimer) {
      clearTimeout(this.morseLoopTimer);
      this.morseLoopTimer = null;
    }
  }
}

export const radioReceiver = new RadioVFOReceiver();
