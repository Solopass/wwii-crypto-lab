export class CryptSoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.morseGain = null;
    this.morseOsc = null;
    this.noiseNode = null;
    this.noiseGain = null;
    this.morsePlaybackTimer = null;
  }

  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch (e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playKeyClick() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.045);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.045);
    } catch (e) {}
  }

  playRotorStep() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.07);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }

  playRelayClick() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
    } catch (e) {}
  }

  playValveHum() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  startMorseTone(freq = 750) {
    if (this.muted || !this.ctx) return;
    try {
      this.stopMorseTone();
      this.morseOsc = this.ctx.createOscillator();
      this.morseGain = this.ctx.createGain();
      this.morseOsc.type = 'sine';
      this.morseOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.morseGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.morseGain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.006);
      this.morseOsc.connect(this.morseGain);
      this.morseGain.connect(this.ctx.destination);
      this.morseOsc.start();
    } catch (e) {}
  }

  stopMorseTone() {
    if (!this.ctx || !this.morseGain || !this.morseOsc) return;
    try {
      const t = this.ctx.currentTime;
      this.morseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.008);
      this.morseOsc.stop(t + 0.01);
      this.morseOsc = null;
      this.morseGain = null;
    } catch (e) {}
  }

  startAtmosphericNoise() {
    if (this.muted || !this.ctx || this.noiseNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.08;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(900, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.noiseNode.connect(bandpass);
      bandpass.connect(this.noiseGain);
      this.noiseGain.connect(this.ctx.destination);
      this.noiseNode.start();
    } catch (e) {}
  }

  stopAtmosphericNoise() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      } catch (e) {}
    }
  }

  /**
   * Plays back a string in CW Morse audio using standard PARIS WPM timing.
   */
  playMorseSequence(morsePattern, wpm = 18, freq = 750, onDone = null) {
    if (this.muted || !this.ctx) {
      if (onDone) onDone();
      return;
    }
    this.stopMorsePlayback();

    const dotDuration = (1.2 / wpm) * 1000; // ms
    const elements = morsePattern.split('');
    let idx = 0;

    const playNext = () => {
      if (idx >= elements.length) {
        this.stopMorseTone();
        if (onDone) onDone();
        return;
      }

      const sym = elements[idx++];
      if (sym === '.') {
        this.startMorseTone(freq);
        this.morsePlaybackTimer = setTimeout(() => {
          this.stopMorseTone();
          this.morsePlaybackTimer = setTimeout(playNext, dotDuration); // inter-element gap
        }, dotDuration);
      } else if (sym === '-') {
        this.startMorseTone(freq);
        this.morsePlaybackTimer = setTimeout(() => {
          this.stopMorseTone();
          this.morsePlaybackTimer = setTimeout(playNext, dotDuration); // inter-element gap
        }, dotDuration * 3);
      } else if (sym === ' ') {
        this.morsePlaybackTimer = setTimeout(playNext, dotDuration * 3); // inter-letter gap
      } else if (sym === '/') {
        this.morsePlaybackTimer = setTimeout(playNext, dotDuration * 7); // inter-word gap
      } else {
        playNext();
      }
    };

    playNext();
  }

  stopMorsePlayback() {
    if (this.morsePlaybackTimer) {
      clearTimeout(this.morsePlaybackTimer);
      this.morsePlaybackTimer = null;
    }
    this.stopMorseTone();
  }
}

export const sound = new CryptSoundFX();
