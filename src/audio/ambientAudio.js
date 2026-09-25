/**
 * Bletchley Park Hut 11 & Newmanry Ambient Audio Engine
 * Pure Web Audio API synthesis modeling:
 * 1. 50 Hz British mains transformer hum & 100 Hz harmonic
 * 2. Rhythmic mechanical clatter of British Bombe commutators and Creed teleprinters
 */

export class AmbientAudioHut11 {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.volume = 0.35;
    this.masterGain = null;
    this.humGain = null;
    this.humOsc50 = null;
    this.humOsc100 = null;
    this.clatterTimer = null;
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

  start() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Master ambient gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, t);
    this.masterGain.gain.exponentialRampToValueAtTime(this.volume, t + 0.5);
    this.masterGain.connect(this.ctx.destination);

    // 1. British 50 Hz Electrical Mains & Transformer Hum
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240, t);
    lowpass.Q.setValueAtTime(1.8, t);
    lowpass.connect(this.masterGain);

    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.06, t);
    this.humGain.connect(lowpass);

    this.humOsc50 = this.ctx.createOscillator();
    this.humOsc50.type = 'sine';
    this.humOsc50.frequency.setValueAtTime(50, t);
    this.humOsc50.connect(this.humGain);
    this.humOsc50.start(t);

    this.humOsc100 = this.ctx.createOscillator();
    this.humOsc100.type = 'sine';
    this.humOsc100.frequency.setValueAtTime(100, t);
    const gain100 = this.ctx.createGain();
    gain100.gain.setValueAtTime(0.02, t);
    this.humOsc100.connect(gain100);
    gain100.connect(lowpass);
    this.humOsc100.start(t);

    // 2. Hut 11 Mechanical Drum Clatter & Relay Chattering
    this.scheduleClatter();

    this.isPlaying = true;
  }

  scheduleClatter() {
    if (!this.ctx || this.masterGain === null) return;

    const click = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      try {
        const now = this.ctx.currentTime;
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const tPulse = now + i * 0.045 + Math.random() * 0.02;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          const f = this.ctx.createBiquadFilter();

          f.type = 'bandpass';
          f.frequency.setValueAtTime(800 + Math.random() * 1200, tPulse);
          f.Q.setValueAtTime(3.0, tPulse);

          osc.type = Math.random() > 0.5 ? 'square' : 'triangle';
          osc.frequency.setValueAtTime(120 + Math.random() * 260, tPulse);
          osc.frequency.exponentialRampToValueAtTime(30, tPulse + 0.025);

          const pulseAmp = (0.015 + Math.random() * 0.025) * this.volume;
          g.gain.setValueAtTime(pulseAmp, tPulse);
          g.gain.exponentialRampToValueAtTime(0.0001, tPulse + 0.025);

          osc.connect(f);
          f.connect(g);
          g.connect(this.masterGain);

          osc.start(tPulse);
          osc.stop(tPulse + 0.028);
        }
      } catch (e) {}

      // Next mechanical pulse interval (simulating rotating commutators)
      const nextDelay = 120 + Math.random() * 280;
      this.clatterTimer = setTimeout(click, nextDelay);
    };

    this.clatterTimer = setTimeout(click, 150);
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.clatterTimer) {
      clearTimeout(this.clatterTimer);
      this.clatterTimer = null;
    }

    if (this.ctx && this.masterGain) {
      try {
        const t = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        setTimeout(() => {
          try {
            if (this.humOsc50) this.humOsc50.stop();
            if (this.humOsc100) this.humOsc100.stop();
          } catch (e) {}
          this.masterGain = null;
          this.humGain = null;
          this.humOsc50 = null;
          this.humOsc100 = null;
        }, 320);
      } catch (e) {}
    }

    this.isPlaying = false;
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
}

export const hut11Ambience = new AmbientAudioHut11();
