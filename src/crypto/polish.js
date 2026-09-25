import { ALPHABET } from './constants.js';
import { EnigmaCore } from './enigma.js';

export class PolishBiuroEngine {
  /**
   * Decomposes indicator permutations into disjoint cycles.
   * Rejewski proved that the cycle length characteristic is invariant under Steckerbrett substitutions.
   */
  computePermutationCycles(rotorTypes = ['I', 'II', 'III', 'Beta'], basePositions = [0, 0, 0, 0]) {
    const perm = {};

    ALPHABET.split('').forEach(ch => {
      const eCopy = new EnigmaCore();
      eCopy.rotorTypes = [...rotorTypes];
      eCopy.positions = [...basePositions];
      perm[ch] = eCopy.encryptLetter(ch).result;
    });

    const visited = new Set();
    const cycles = [];

    ALPHABET.split('').forEach(ch => {
      if (!visited.has(ch)) {
        let cur = ch;
        const cycle = [];
        while (!visited.has(cur)) {
          visited.add(cur);
          cycle.push(cur);
          cur = perm[cur] || cur;
        }
        if (cycle.length > 0) cycles.push(cycle);
      }
    });

    return cycles;
  }

  getCycleLengths(cycles) {
    return cycles.map(c => c.length).sort((a, b) => b - a);
  }

  /**
   * Evaluates Zygalski perforated sheet light transmission.
   * Returns a 26x26 boolean grid where true represents light shining through.
   */
  computeZygalskiApertures(offsetX = 0, offsetY = 0) {
    const grid = [];
    for (let r = 0; r < 26; r++) {
      const row = [];
      for (let c = 0; c < 26; c++) {
        // Base sheet aperture pattern
        const aperture1 = (r * 7 + c * 3 + 1) % 5 === 0;
        // Shifted second sheet aperture pattern
        const aperture2 = ((r + offsetY) * 5 + (c + offsetX) * 2 + 2) % 5 === 0;
        // True female match occurs when light penetrates both layers
        row.push(aperture1 && aperture2);
      }
      grid.push(row);
    }
    return grid;
  }
}
