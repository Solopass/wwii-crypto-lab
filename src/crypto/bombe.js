import { ALPHABET } from './constants.js';
import { EnigmaCore } from './enigma.js';

export class TuringBombe {
  constructor() {
    this.isRunning = false;
    this.currentPosition = [0, 0, 0];
    this.rotorOrder = ['III', 'II', 'I'];
    this.scannedCount = 0;
    this.totalPositions = 26 * 26 * 26; // 17,576
    this.stopFound = null;
    this.animationTimer = null;
  }

  buildMenuGraph(ciphertext, crib) {
    const cleanCipher = ciphertext.replace(/[^A-Z]/g, '');
    const cleanCrib = crib.replace(/[^A-Z]/g, '');
    const edges = [];
    const len = Math.min(cleanCipher.length, cleanCrib.length);

    for (let i = 0; i < len; i++) {
      const c = cleanCipher[i];
      const p = cleanCrib[i];
      if (c !== p) {
        edges.push({ index: i, cipher: c, crib: p });
      }
    }
    return edges;
  }

  /**
   * Tests whether a given rotor position and order produces a consistent
   * Steckerbrett hypothesis without electrical contradiction (Proof by Contradiction).
   */
  testPosition(positions, rotorOrder, ciphertext, crib, reflector = 'B') {
    const e = new EnigmaCore();
    e.rotorTypes = [rotorOrder[0], rotorOrder[1], rotorOrder[2], 'Beta'];
    e.positions = [...positions, 0];
    e.reflectorType = reflector;

    // Fast check: verify if running through Enigma core without plugboard
    // yields a viable partial plugboard involution for the crib/cipher pairs
    const testEnigma = new EnigmaCore();
    testEnigma.rotorTypes = [rotorOrder[0], rotorOrder[1], rotorOrder[2], 'Beta'];
    testEnigma.positions = [...positions, 0];
    testEnigma.reflectorType = reflector;

    const steckerMap = {};
    const len = Math.min(ciphertext.length, crib.length);
    if (len === 0) return false;

    for (let i = 0; i < len; i++) {
      const plainChar = crib[i];
      const cipherChar = ciphertext[i];
      if (plainChar === cipherChar) return false; // Scherbius exclusion flaw

      // Scrambler transformation at step i
      const out = testEnigma.encryptLetter(plainChar).result;

      // In the Bombe, if no plugboard is assumed on this link, out must equal cipherChar
      // Or in the full diagonal board check:
      if (steckerMap[out] && steckerMap[out] !== cipherChar) return false;
      if (steckerMap[cipherChar] && steckerMap[cipherChar] !== out) return false;
      steckerMap[out] = cipherChar;
      steckerMap[cipherChar] = out;
    }

    return true;
  }

  /**
   * Starts an asynchronous scan across rotor permutations with live UI feedback.
   */
  startScan(ciphertext, crib, onProgress, onStopDetected, onComplete) {
    this.isRunning = true;
    this.scannedCount = 0;
    this.stopFound = null;
    let r1 = 0, r2 = 0, r3 = 0;

    const cleanCipher = ciphertext.replace(/[^A-Z]/g, '');
    const cleanCrib = crib.replace(/[^A-Z]/g, '');

    const batchSize = 128; // Process in chunks to maintain 60 FPS

    const stepBatch = () => {
      if (!this.isRunning) return;

      for (let b = 0; b < batchSize; b++) {
        const pos = [r1, r2, r3];
        const isMatch = this.testPosition(pos, this.rotorOrder, cleanCipher, cleanCrib);

        this.scannedCount++;

        if (isMatch) {
          this.isRunning = false;
          this.stopFound = {
            rotors: [...this.rotorOrder],
            positions: [r1, r2, r3],
            positionStr: `${ALPHABET[r3]} - ${ALPHABET[r2]} - ${ALPHABET[r1]}`
          };
          if (onProgress) onProgress(this.scannedCount, this.totalPositions, pos);
          if (onStopDetected) onStopDetected(this.stopFound);
          return;
        }

        r1++;
        if (r1 >= 26) {
          r1 = 0;
          r2++;
          if (r2 >= 26) {
            r2 = 0;
            r3++;
            if (r3 >= 26) {
              // Scan complete without definitive stop
              this.isRunning = false;
              if (onProgress) onProgress(this.scannedCount, this.totalPositions, [25, 25, 25]);
              if (onComplete) onComplete(null);
              return;
            }
          }
        }
      }

      if (onProgress) onProgress(this.scannedCount, this.totalPositions, [r1, r2, r3]);
      this.animationTimer = requestAnimationFrame(stepBatch);
    };

    this.animationTimer = requestAnimationFrame(stepBatch);
  }

  stopScan() {
    this.isRunning = false;
    if (this.animationTimer) {
      cancelAnimationFrame(this.animationTimer);
      this.animationTimer = null;
    }
  }
}
