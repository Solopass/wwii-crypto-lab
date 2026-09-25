import { ALPHABET } from './constants.js';

export class SIGABACore {
  constructor() {
    this.cipherPositions = [0, 0, 0, 0, 0];
    this.controlPositions = [0, 0, 0, 0, 0];
    this.indexPositions = [0, 0, 0, 0, 0];
    this.cipherWirings = [
      'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
      'AJDKSIRUXBLHWTMCQGZNPYFVOE',
      'BDFHJLCPRTXVZNYEIWGAKMUSQO',
      'ESOVPZJAYQUIRHXLNFTGKDCMWB',
      'VZBRGITYUPSDNHLXAWMJQOFECK'
    ];
  }

  reset() {
    this.cipherPositions.fill(0);
    this.controlPositions.fill(0);
    this.indexPositions.fill(0);
  }

  step() {
    // Control bank stepping (pseudo-odometer)
    this.controlPositions[4] = (this.controlPositions[4] + 1) % 26;
    if (this.controlPositions[4] % 3 === 0) {
      this.controlPositions[3] = (this.controlPositions[3] + 1) % 26;
    }
    if (this.controlPositions[3] % 4 === 0) {
      this.controlPositions[2] = (this.controlPositions[2] + 1) % 26;
    }

    // Signals generated through control and index banks driving cipher bank
    const p1 = (this.controlPositions[0] + this.indexPositions[0]) % 26;
    const p2 = (this.controlPositions[2] + this.indexPositions[2]) % 26;
    const p3 = (this.controlPositions[4] + this.indexPositions[4]) % 26;

    if (p1 % 2 === 0) this.cipherPositions[0] = (this.cipherPositions[0] + 1) % 26;
    this.cipherPositions[1] = (this.cipherPositions[1] + 1) % 26;
    if (p2 % 3 === 0) this.cipherPositions[2] = (this.cipherPositions[2] + 1) % 26;
    if (p3 % 5 === 0) this.cipherPositions[4] = (this.cipherPositions[4] + 1) % 26;
  }

  encryptLetter(char, decrypt = false) {
    char = char.toUpperCase();
    if (!ALPHABET.includes(char)) return char;
    this.step();

    let idx = ALPHABET.indexOf(char);
    if (!decrypt) {
      // Forward pass through 5 cipher rotors
      for (let i = 0; i < 5; i++) {
        const shift = this.cipherPositions[i];
        const enterIdx = (idx + shift) % 26;
        const wiredChar = this.cipherWirings[i][enterIdx];
        idx = (ALPHABET.indexOf(wiredChar) - shift + 26) % 26;
      }
    } else {
      // Decrypt: Reverse pass through cipher rotors
      for (let i = 4; i >= 0; i--) {
        const shift = this.cipherPositions[i];
        const enterIdx = (idx + shift) % 26;
        const wiredChar = ALPHABET[enterIdx];
        const revIdx = this.cipherWirings[i].indexOf(wiredChar);
        idx = (revIdx - shift + 26) % 26;
      }
    }
    return ALPHABET[idx];
  }

  encryptMessage(msg) {
    return msg
      .toUpperCase()
      .split('')
      .filter(c => ALPHABET.includes(c))
      .map(c => this.encryptLetter(c, false))
      .join('');
  }

  decryptMessage(msg) {
    return msg
      .toUpperCase()
      .split('')
      .filter(c => ALPHABET.includes(c))
      .map(c => this.encryptLetter(c, true))
      .join('');
  }
}
