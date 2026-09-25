import { ALPHABET, ROTOR_WIRINGS, ROTOR_NOTCHES, REFLECTORS } from './constants.js';

export class EnigmaCore {
  constructor() {
    this.isM4 = false;
    this.rotorTypes = ['III', 'II', 'I', 'Beta'];
    this.positions = [0, 0, 0, 0];       // 0=Right (fast), 1=Mid, 2=Left (slow), 3=Greek (M4)
    this.ringSettings = [0, 0, 0, 0];    // 0-indexed (Ring 1 = 0)
    this.reflectorType = 'B';
    this.plugboard = {};
    this.initPlugboard();
  }

  initPlugboard() {
    this.plugboard = {};
    for (let i = 0; i < 26; i++) {
      this.plugboard[ALPHABET[i]] = ALPHABET[i];
    }
  }

  setupPlugboard(steckerString) {
    this.initPlugboard();
    if (!steckerString) return;
    const pairs = steckerString.toUpperCase().match(/[A-Z]{2}/g) || [];
    const used = new Set();
    for (const pair of pairs) {
      const a = pair[0];
      const b = pair[1];
      if (a !== b && !used.has(a) && !used.has(b)) {
        this.plugboard[a] = b;
        this.plugboard[b] = a;
        used.add(a);
        used.add(b);
      }
    }
  }

  stepRotors() {
    const isNotch = (rType, pos) => {
      const notches = ROTOR_NOTCHES[rType] || [];
      return notches.includes(ALPHABET[(pos || 0) % 26]);
    };

    const rightNotch = isNotch(this.rotorTypes[0], this.positions[0]);
    const midNotch = isNotch(this.rotorTypes[1], this.positions[1]);

    // Middle-rotor double-stepping anomaly
    if (midNotch) {
      this.positions[1] = ((this.positions[1] || 0) + 1) % 26;
      this.positions[2] = ((this.positions[2] || 0) + 1) % 26;
    } else if (rightNotch) {
      this.positions[1] = ((this.positions[1] || 0) + 1) % 26;
    }

    // Right rotor always advances
    this.positions[0] = ((this.positions[0] || 0) + 1) % 26;
  }

  passRotorForward(letterIdx, rType, pos, ring) {
    pos = pos || 0;
    ring = ring || 0;
    const shift = (pos - ring + 26) % 26;
    const enterIdx = (letterIdx + shift) % 26;
    const wiredChar = ROTOR_WIRINGS[rType][enterIdx];
    const wiredIdx = ALPHABET.indexOf(wiredChar);
    return (wiredIdx - shift + 26) % 26;
  }

  passRotorBackward(letterIdx, rType, pos, ring) {
    pos = pos || 0;
    ring = ring || 0;
    const shift = (pos - ring + 26) % 26;
    const enterIdx = (letterIdx + shift) % 26;
    const wiredChar = ALPHABET[enterIdx];
    const revIdx = ROTOR_WIRINGS[rType].indexOf(wiredChar);
    return (revIdx - shift + 26) % 26;
  }

  encryptLetter(char) {
    char = char.toUpperCase();
    if (!ALPHABET.includes(char)) return { result: char, path: [] };

    this.stepRotors();

    const path = [];
    path.push({ stage: 'Key', letter: char });

    let current = this.plugboard[char] || char;
    path.push({ stage: 'Plugboard In', letter: current });

    let currIdx = ALPHABET.indexOf(current);

    // Forward through rotors: Right -> Mid -> Left -> [Greek if M4]
    currIdx = this.passRotorForward(currIdx, this.rotorTypes[0], this.positions[0], this.ringSettings[0]);
    path.push({ stage: `Rotor 1 (${this.rotorTypes[0]})`, letter: ALPHABET[currIdx] });

    currIdx = this.passRotorForward(currIdx, this.rotorTypes[1], this.positions[1], this.ringSettings[1]);
    path.push({ stage: `Rotor 2 (${this.rotorTypes[1]})`, letter: ALPHABET[currIdx] });

    currIdx = this.passRotorForward(currIdx, this.rotorTypes[2], this.positions[2], this.ringSettings[2]);
    path.push({ stage: `Rotor 3 (${this.rotorTypes[2]})`, letter: ALPHABET[currIdx] });

    if (this.isM4 && this.rotorTypes[3]) {
      currIdx = this.passRotorForward(currIdx, this.rotorTypes[3], this.positions[3], this.ringSettings[3]);
      path.push({ stage: `Rotor 4 (${this.rotorTypes[3]})`, letter: ALPHABET[currIdx] });
    }

    // Reflector
    const refWiring = REFLECTORS[this.reflectorType] || REFLECTORS['B'];
    const refChar = refWiring[currIdx];
    currIdx = ALPHABET.indexOf(refChar);
    path.push({ stage: `Reflector (${this.reflectorType})`, letter: refChar });

    // Backward through rotors
    if (this.isM4 && this.rotorTypes[3]) {
      currIdx = this.passRotorBackward(currIdx, this.rotorTypes[3], this.positions[3], this.ringSettings[3]);
      path.push({ stage: 'Rotor 4 Rev', letter: ALPHABET[currIdx] });
    }

    currIdx = this.passRotorBackward(currIdx, this.rotorTypes[2], this.positions[2], this.ringSettings[2]);
    path.push({ stage: 'Rotor 3 Rev', letter: ALPHABET[currIdx] });

    currIdx = this.passRotorBackward(currIdx, this.rotorTypes[1], this.positions[1], this.ringSettings[1]);
    path.push({ stage: 'Rotor 2 Rev', letter: ALPHABET[currIdx] });

    currIdx = this.passRotorBackward(currIdx, this.rotorTypes[0], this.positions[0], this.ringSettings[0]);
    path.push({ stage: 'Rotor 1 Rev', letter: ALPHABET[currIdx] });

    // Plugboard Out to Lampboard
    const outChar = this.plugboard[ALPHABET[currIdx]] || ALPHABET[currIdx];
    path.push({ stage: 'Lampboard', letter: outChar });

    return { result: outChar, path: path };
  }

  encryptMessage(msg) {
    return msg
      .toUpperCase()
      .split('')
      .filter(c => ALPHABET.includes(c))
      .map(c => this.encryptLetter(c).result)
      .join('');
  }

  cloneState() {
    return {
      isM4: this.isM4,
      rotorTypes: [...this.rotorTypes],
      positions: [...this.positions],
      ringSettings: [...this.ringSettings],
      reflectorType: this.reflectorType,
      plugboard: { ...this.plugboard }
    };
  }

  restoreState(state) {
    this.isM4 = state.isM4;
    this.rotorTypes = [...state.rotorTypes];
    this.positions = [...state.positions];
    this.ringSettings = [...state.ringSettings];
    this.reflectorType = state.reflectorType;
    this.plugboard = { ...state.plugboard };
  }
}
