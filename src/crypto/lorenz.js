import { BAUDOT_TABLE, REVERSE_BAUDOT, LORENZ_WHEEL_SIZES } from './constants.js';

export class LorenzSZ42Core {
  constructor() {
    this.positions = {};
    this.cams = {};
    this.initWheels();
  }

  initWheels() {
    Object.keys(LORENZ_WHEEL_SIZES).forEach(w => {
      this.positions[w] = 0;
      // Default alternating cam pin pattern
      this.cams[w] = new Array(LORENZ_WHEEL_SIZES[w]).fill(0).map((_, i) => (i % 2 === 0 ? 1 : 0));
    });
  }

  reset() {
    Object.keys(LORENZ_WHEEL_SIZES).forEach(w => {
      this.positions[w] = 0;
    });
  }

  randomizeCams() {
    Object.keys(LORENZ_WHEEL_SIZES).forEach(w => {
      this.cams[w] = new Array(LORENZ_WHEEL_SIZES[w]).fill(0).map(() => (Math.random() > 0.5 ? 1 : 0));
      this.positions[w] = 0;
    });
  }

  setCamPin(wheel, index, bit) {
    if (this.cams[wheel] && index >= 0 && index < this.cams[wheel].length) {
      this.cams[wheel][index] = bit ? 1 : 0;
    }
  }

  step() {
    // 1. Chi wheels always advance 1 pin
    ['chi1', 'chi2', 'chi3', 'chi4', 'chi5'].forEach(w => {
      this.positions[w] = (this.positions[w] + 1) % LORENZ_WHEEL_SIZES[w];
    });

    // 2. Motor wheel mu61 advances
    this.positions['mu61'] = (this.positions['mu61'] + 1) % LORENZ_WHEEL_SIZES['mu61'];
    const mu61Bit = this.cams['mu61'][this.positions['mu61']];

    // 3. Motor wheel mu37 steps only if mu61 active
    if (mu61Bit === 1) {
      this.positions['mu37'] = (this.positions['mu37'] + 1) % LORENZ_WHEEL_SIZES['mu37'];
    }

    // 4. Psi wheels step only if mu37 active
    const mu37Bit = this.cams['mu37'][this.positions['mu37']];
    if (mu37Bit === 1) {
      ['psi1', 'psi2', 'psi3', 'psi4', 'psi5'].forEach(w => {
        this.positions[w] = (this.positions[w] + 1) % LORENZ_WHEEL_SIZES[w];
      });
    }
  }

  getKeyBit(channelIdx) {
    const chiWheel = `chi${channelIdx + 1}`;
    const psiWheel = `psi${channelIdx + 1}`;
    const chiBit = this.cams[chiWheel][this.positions[chiWheel]];
    const psiBit = this.cams[psiWheel][this.positions[psiWheel]];
    return chiBit ^ psiBit;
  }

  encipherChar(char) {
    char = char.toUpperCase();
    const plainBits = BAUDOT_TABLE[char] || BAUDOT_TABLE[' '];
    this.step();

    let cipherBits = '';
    for (let ch = 0; ch < 5; ch++) {
      const pBit = parseInt(plainBits[ch], 10);
      const kBit = this.getKeyBit(ch);
      cipherBits += (pBit ^ kBit).toString();
    }
    return REVERSE_BAUDOT[cipherBits] || '?';
  }

  encipherMessage(msg) {
    return msg.split('').map(c => this.encipherChar(c)).join('');
  }

  // Teleprinter ITA2 stream cipher is self-inverting (symmetric XOR)
  decipherMessage(cipherMsg, resetFirst = true) {
    if (resetFirst) this.reset();
    return this.encipherMessage(cipherMsg);
  }
}
