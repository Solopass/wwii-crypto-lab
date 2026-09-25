import { ALPHABET } from './constants.js';

export class TypexCore {
  constructor() {
    this.positions = [0, 0, 0, 0, 0]; // 0=Stator1, 1=Stator2, 2=Rotor3, 3=Rotor4, 4=Rotor5 (Fast)
    this.wirings = [
      'EKMFLGDQVZNTOWYHXUSPAIBRCJ', // Stator 1
      'AJDKSIRUXBLHWTMCQGZNPYFVOE', // Stator 2
      'BDFHJLCPRTXVZNYEIWGAKMUSQO', // Rotor 3 (5 notches)
      'ESOVPZJAYQUIRHXLNFTGKDCMWB', // Rotor 4 (7 notches)
      'VZBRGITYUPSDNHLXAWMJQOFECK'  // Rotor 5 (9 notches)
    ];
    this.notches = [
      [],
      [],
      ['A', 'F', 'K', 'P', 'U'],
      ['B', 'E', 'H', 'K', 'N', 'Q', 'T'],
      ['A', 'D', 'G', 'J', 'M', 'P', 'S', 'V', 'Y']
    ];
    // Non-reciprocal reflector (Typex feature)
    this.reflector = 'BCDEFGHIJKLMNOPQRSTUVWXYZA';
  }

  reset() {
    this.positions = [0, 0, 0, 0, 0];
  }

  step() {
    const isNotch = (drumIdx, pos) => {
      const char = ALPHABET[pos % 26];
      return this.notches[drumIdx].includes(char);
    };

    const fastNotch = isNotch(4, this.positions[4]);
    const midNotch = isNotch(3, this.positions[3]);

    if (midNotch) {
      this.positions[2] = (this.positions[2] + 1) % 26;
      this.positions[3] = (this.positions[3] + 1) % 26;
    } else if (fastNotch) {
      this.positions[3] = (this.positions[3] + 1) % 26;
    }
    this.positions[4] = (this.positions[4] + 1) % 26;
  }

  encryptLetter(char) {
    char = char.toUpperCase();
    if (!ALPHABET.includes(char)) return char;

    this.step();
    let currIdx = ALPHABET.indexOf(char);

    // Forward pass: Rotor 5 -> 4 -> 3 -> 2 -> 1
    for (let i = 4; i >= 0; i--) {
      const shift = this.positions[i];
      const enterIdx = (currIdx + shift) % 26;
      const wiredChar = this.wirings[i][enterIdx];
      const wiredIdx = ALPHABET.indexOf(wiredChar);
      currIdx = (wiredIdx - shift + 26) % 26;
    }

    // Reflector
    const refChar = this.reflector[currIdx];
    currIdx = ALPHABET.indexOf(refChar);

    // Reverse pass: Stator 1 -> 2 -> 3 -> 4 -> 5
    for (let i = 0; i < 5; i++) {
      const shift = this.positions[i];
      const enterIdx = (currIdx + shift) % 26;
      const wiredChar = ALPHABET[enterIdx];
      const revIdx = this.wirings[i].indexOf(wiredChar);
      currIdx = (revIdx - shift + 26) % 26;
    }

    return ALPHABET[currIdx];
  }

  encryptMessage(msg) {
    return msg
      .toUpperCase()
      .split('')
      .filter(c => ALPHABET.includes(c))
      .map(c => this.encryptLetter(c))
      .join('');
  }
}
