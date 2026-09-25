export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ROTOR_WIRINGS = {
  'I':    'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
  'II':   'AJDKSIRUXBLHWTMCQGZNPYFVOE',
  'III':  'BDFHJLCPRTXVZNYEIWGAKMUSQO',
  'IV':   'ESOVPZJAYQUIRHXLNFTGKDCMWB',
  'V':    'VZBRGITYUPSDNHLXAWMJQOFECK',
  'Beta': 'LEYJVCNIXWPBQMDRTAKZGFUHOS',
  'Gamma':'FSOKANUERHMBTIYCWLQPZXVGJD'
};

export const ROTOR_NOTCHES = {
  'I':    ['Q'],
  'II':   ['E'],
  'III':  ['V'],
  'IV':   ['J'],
  'V':    ['Z'],
  'Beta': [],
  'Gamma':[]
};

export const REFLECTORS = {
  'B':      'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  'C':      'FVPJIAOYEDRZXWGCTKUQSBNMHL',
  'B_thin': 'ENKQAUYWJICOPBLMDXZVFTHRGS',
  'C_thin': 'RDOBJNTKVEHMLFCWZAXGYIPSUQ'
};

export const BAUDOT_TABLE = {
  'A': '11000', 'B': '10011', 'C': '01110', 'D': '10010', 'E': '10000',
  'F': '10110', 'G': '01011', 'H': '00101', 'I': '01100', 'J': '11010',
  'K': '11110', 'L': '01001', 'M': '00111', 'N': '00110', 'O': '00011',
  'P': '01101', 'Q': '11101', 'R': '01010', 'S': '10100', 'T': '00001',
  'U': '11100', 'V': '01111', 'W': '11001', 'X': '10111', 'Y': '10101',
  'Z': '10001', ' ': '00100'
};

export const REVERSE_BAUDOT = {};
Object.keys(BAUDOT_TABLE).forEach(k => {
  REVERSE_BAUDOT[BAUDOT_TABLE[k]] = k;
});

export const LORENZ_WHEEL_SIZES = {
  'chi1': 41, 'chi2': 31, 'chi3': 29, 'chi4': 26, 'chi5': 23,
  'mu37': 37, 'mu61': 61,
  'psi1': 43, 'psi2': 47, 'psi3': 51, 'psi4': 53, 'psi5': 59
};

export const MORSE_CODE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
  'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
  'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

export const REVERSE_MORSE = {};
Object.keys(MORSE_CODE_MAP).forEach(k => {
  REVERSE_MORSE[MORSE_CODE_MAP[k]] = k;
});
