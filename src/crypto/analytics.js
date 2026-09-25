import { ALPHABET } from './constants.js';

export const GERMAN_FREQUENCIES = {
  'E': 16.9, 'N': 10.5, 'I': 8.0, 'R': 7.6, 'S': 7.2, 'T': 6.3,
  'A': 5.6, 'U': 5.0, 'D': 4.8, 'H': 4.5, 'G': 3.5, 'L': 3.4,
  'O': 2.8, 'M': 2.5, 'C': 2.5, 'B': 2.0, 'F': 1.8, 'K': 1.5,
  'W': 1.5, 'P': 1.0, 'V': 0.8, 'Z': 0.6, 'J': 0.3, 'Y': 0.1,
  'X': 0.1, 'Q': 0.1
};

export const ENGLISH_FREQUENCIES = {
  'E': 12.7, 'T': 9.1, 'A': 8.2, 'O': 7.5, 'I': 7.0, 'N': 6.7,
  'S': 6.3, 'H': 6.1, 'R': 6.0, 'D': 4.3, 'L': 4.0, 'C': 2.8,
  'U': 2.8, 'M': 2.4, 'W': 2.4, 'F': 2.2, 'G': 2.0, 'Y': 2.0,
  'P': 1.9, 'B': 1.5, 'V': 1.0, 'K': 0.8, 'J': 0.2, 'X': 0.2,
  'Q': 0.1, 'Z': 0.1
};

/**
 * Computes observed monogram frequencies and percentages.
 */
export function calculateFrequencies(text) {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const counts = {};
  ALPHABET.split('').forEach(ch => { counts[ch] = 0; });

  for (let i = 0; i < clean.length; i++) {
    counts[clean[i]] = (counts[clean[i]] || 0) + 1;
  }

  const percentages = {};
  const total = clean.length;
  ALPHABET.split('').forEach(ch => {
    percentages[ch] = total > 0 ? (counts[ch] / total) * 100 : 0;
  });

  return { counts, percentages, total };
}

/**
 * Computes the Index of Coincidence (IoC).
 * IoC = sum(f_i * (f_i - 1)) / (N * (N - 1))
 * - Random / Polyalphabetic (Enigma/Typex): ~0.0385
 * - German Monolingual: ~0.0762
 * - English Monolingual: ~0.0667
 */
export function calculateIndexOfCoincidence(text) {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const N = clean.length;
  if (N <= 1) return 0;

  const counts = {};
  for (let i = 0; i < N; i++) {
    counts[clean[i]] = (counts[clean[i]] || 0) + 1;
  }

  let numerator = 0;
  Object.values(counts).forEach(f => {
    numerator += f * (f - 1);
  });

  return numerator / (N * (N - 1));
}

/**
 * Kasiski Examination to detect repeated substrings and periodic distances.
 */
export function kasiskiExamination(text, gramLength = 3) {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const positions = {};

  for (let i = 0; i <= clean.length - gramLength; i++) {
    const gram = clean.slice(i, i + gramLength);
    if (!positions[gram]) positions[gram] = [];
    positions[gram].push(i);
  }

  const repeatedGrams = [];
  Object.keys(positions).forEach(gram => {
    if (positions[gram].length > 1) {
      const distances = [];
      for (let j = 0; j < positions[gram].length - 1; j++) {
        distances.push(positions[gram][j + 1] - positions[gram][j]);
      }
      repeatedGrams.push({ gram, occurrences: positions[gram].length, distances });
    }
  });

  repeatedGrams.sort((a, b) => b.occurrences - a.occurrences);
  return repeatedGrams.slice(0, 8);
}
