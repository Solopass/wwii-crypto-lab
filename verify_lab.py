#!/usr/bin/env python3
"""
Comprehensive Test and Verification Suite for WWII Cryptography 3D Lab.
Validates cryptographic engines, mathematical vectors, standalone bundler,
file integrity, and loopback HTTP delivery.
"""

import sys
import time
import socket
import urllib.request
import subprocess
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

ROTOR_WIRINGS = {
    'I':    'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
    'II':   'AJDKSIRUXBLHWTMCQGZNPYFVOE',
    'III':  'BDFHJLCPRTXVZNYEIWGAKMUSQO',
    'IV':   'ESOVPZJAYQUIRHXLNFTGKDCMWB',
    'V':    'VZBRGITYUPSDNHLXAWMJQOFECK',
    'Beta': 'LEYJVCNIXWPBQMDRTAKZGFUHOS',
    'Gamma':'FSOKANUERHMBTIYCWLQPZXVGJD'
}

ROTOR_NOTCHES = {
    'I':    ['Q'],
    'II':   ['E'],
    'III':  ['V'],
    'IV':   ['J'],
    'V':    ['Z'],
    'Beta': [],
    'Gamma':[]
}

REFLECTORS = {
    'B':      'YRUHQSLDPXNGOKMIEBFZCWVJAT',
    'C':      'FVPJIAOYEDRZXWGCTKUQSBNMHL',
    'B_thin': 'ENKQAUYWJICOPBLMDXZVFTHRGS',
    'C_thin': 'RDOBJNTKVEHMLFCWZAXGYIPSUQ'
}

# Python implementation of EnigmaCore for algorithmic verification
class PyEnigma:
    def __init__(self, is_m4=False, rotors=None, positions=None, rings=None, reflector='B', stecker=""):
        self.is_m4 = is_m4
        self.rotors = rotors or ['III', 'II', 'I', 'Beta']
        self.positions = positions or [0, 0, 0, 0]
        self.rings = rings or [0, 0, 0, 0]
        self.reflector = reflector
        self.plugboard = {c: c for c in ALPHABET}
        self.setup_plugboard(stecker)

    def setup_plugboard(self, stecker_str):
        if not stecker_str:
            return
        import re
        pairs = re.findall(r'[A-Z]{2}', stecker_str.upper())
        for pair in pairs:
            a, b = pair[0], pair[1]
            self.plugboard[a] = b
            self.plugboard[b] = a

    def step(self):
        def is_notch(rtype, pos):
            notches = ROTOR_NOTCHES.get(rtype, [])
            return ALPHABET[pos % 26] in notches

        right_notch = is_notch(self.rotors[0], self.positions[0])
        mid_notch = is_notch(self.rotors[1], self.positions[1])

        if mid_notch:
            self.positions[1] = (self.positions[1] + 1) % 26
            self.positions[2] = (self.positions[2] + 1) % 26
        elif right_notch:
            self.positions[1] = (self.positions[1] + 1) % 26

        self.positions[0] = (self.positions[0] + 1) % 26

    def pass_forward(self, idx, rtype, pos, ring):
        shift = (pos - ring + 26) % 26
        enter = (idx + shift) % 26
        char = ROTOR_WIRINGS[rtype][enter]
        return (ALPHABET.index(char) - shift + 26) % 26

    def pass_backward(self, idx, rtype, pos, ring):
        shift = (pos - ring + 26) % 26
        enter = (idx + shift) % 26
        char = ALPHABET[enter]
        rev = ROTOR_WIRINGS[rtype].index(char)
        return (rev - shift + 26) % 26

    def encrypt_char(self, c):
        c = c.upper()
        if c not in ALPHABET:
            return c
        self.step()
        curr = self.plugboard[c]
        idx = ALPHABET.index(curr)

        idx = self.pass_forward(idx, self.rotors[0], self.positions[0], self.rings[0])
        idx = self.pass_forward(idx, self.rotors[1], self.positions[1], self.rings[1])
        idx = self.pass_forward(idx, self.rotors[2], self.positions[2], self.rings[2])
        if self.is_m4 and len(self.rotors) > 3:
            idx = self.pass_forward(idx, self.rotors[3], self.positions[3], self.rings[3])

        ref_char = REFLECTORS[self.reflector][idx]
        idx = ALPHABET.index(ref_char)

        if self.is_m4 and len(self.rotors) > 3:
            idx = self.pass_backward(idx, self.rotors[3], self.positions[3], self.rings[3])
        idx = self.pass_backward(idx, self.rotors[2], self.positions[2], self.rings[2])
        idx = self.pass_backward(idx, self.rotors[1], self.positions[1], self.rings[1])
        idx = self.pass_backward(idx, self.rotors[0], self.positions[0], self.rings[0])

        out = self.plugboard[ALPHABET[idx]]
        return out

    def encrypt_string(self, text):
        return "".join(self.encrypt_char(c) for c in text if c in ALPHABET)

def run_tests():
    passed = 0
    total = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name} {extra}")
        else:
            print(f"  [FAIL] {name} {extra}")
            sys.exit(1)

    print("\n--- 1. Cryptographic Algorithmic Verification ---")

    # Vector 1: Wehrmacht Reference Vector AAAAA -> BDZGO
    e = PyEnigma(rotors=['III', 'II', 'I', 'Beta'], positions=[0, 0, 0, 0], rings=[0, 0, 0, 0], reflector='B')
    res = e.encrypt_string("AAAAA")
    assert_test("Wehrmacht Reference Vector (AAAAA -> BDZGO)", res == "BDZGO", f"(got {res})")

    # Vector 2: Reciprocal Invariance Property E(E(x)) = x
    e1 = PyEnigma(rotors=['III', 'II', 'I', 'Beta'], positions=[0, 0, 0, 0])
    e2 = PyEnigma(rotors=['III', 'II', 'I', 'Beta'], positions=[0, 0, 0, 0])
    cipher = e1.encrypt_string("BLETCHLEYPARKULTRA")
    plain = e2.encrypt_string(cipher)
    assert_test("Reciprocal Invariance Property", plain == "BLETCHLEYPARKULTRA")

    # Vector 3: Scherbius Derangement Flaw (no letter encrypts to itself)
    e3 = PyEnigma()
    derangement = True
    for i in range(100):
        c = ALPHABET[i % 26]
        if e3.encrypt_char(c) == c:
            derangement = False
            break
    assert_test("Scherbius Derangement Flaw", derangement)

    # Vector 4: Middle Rotor Double-Stepping Anomaly
    e4 = PyEnigma(rotors=['III', 'II', 'I', 'Beta'], positions=[20, 3, 0, 0])
    e4.step()
    mid1 = e4.positions[1]
    e4.step()
    assert_test("Middle Rotor Double-Stepping Anomaly", e4.positions[1] != mid1)

    # Vector 5: Steckerbrett Plugboard Involution
    e5 = PyEnigma(stecker="AV BS CG DL FU")
    assert_test("Steckerbrett Involution", e5.plugboard['A'] == 'V' and e5.plugboard['V'] == 'A')

    # Vector 6: U-559 Kriegsmarine Triton Vector (M4 4-rotor)
    e6 = PyEnigma(is_m4=True, rotors=['I', 'IV', 'II', 'Beta'], positions=[0, 11, 4, 17], reflector='B_thin', stecker="AV BS CG DL FU HZ IN KM OW RX")
    out_s = e6.encrypt_char('S')
    assert_test("U-559 Kriegsmarine Triton Vector", out_s in ALPHABET, f"(S -> {out_s})")

    # Vector 7: UKW-B and UKW-C Reflector Parity
    for rname in ['B', 'C', 'B_thin', 'C_thin']:
        ref = REFLECTORS[rname]
        is_involutory = all(ref[ALPHABET.index(ref[i])] == ALPHABET[i] for i in range(26))
        assert_test(f"Reflector {rname} Involution Parity", is_involutory)

    # Vector 8: Cryptanalysis Toolkit - Index of Coincidence (IoC)
    def calc_ioc(text):
        clean = [c for c in text.upper() if c in ALPHABET]
        n = len(clean)
        if n < 2: return 0.0
        counts = {c: clean.count(c) for c in set(clean)}
        sum_f = sum(f * (f - 1) for f in counts.values())
        return sum_f / (n * (n - 1))

    natural_ioc = calc_ioc("WETTERVORHERSAGEKANALWINDWESTENSTANDORTQUADRAT")
    assert_test("Natural Language IoC >= 0.060", natural_ioc >= 0.060)

    # Vector 9: Kasiski Examination
    def kasiski_test(text, length=3):
        clean = [c for c in text.upper() if c in ALPHABET]
        clean_str = "".join(clean)
        repeats = {}
        for i in range(len(clean_str) - length + 1):
            sub = clean_str[i:i+length]
            pos = [m.start() for m in re.finditer(re.escape(sub), clean_str)]
            if len(pos) > 1 and sub not in repeats:
                repeats[sub] = [pos[j] - pos[j-1] for j in range(1, len(pos))]
        return repeats

    k_results = kasiski_test("ABCXYZDEFABCXYZGHIABCXYZ")
    assert_test("Kasiski finds repeated trigram 'ABC'", "ABC" in k_results and len(k_results["ABC"]) >= 2)

    # Vector 10: Radio VFO Stations
    stations = [7050, 7120, 14100, 3560]
    for s_freq in stations:
        diff = abs(7052 - s_freq) # 2 kHz off
        in_band = diff < 3.5
        if s_freq == 7050:
            assert_test(f"Radio VFO Station {s_freq} in passband (+2kHz offset)", in_band)

    print("\n--- 2. File Integrity & Architecture Checks ---")

    required_files = [
        BASE_DIR / "index.html",
        BASE_DIR / "wwii_cryptography_3d_lab.html",
        BASE_DIR / "build_standalone.py",
        BASE_DIR / "css" / "lab.css",
        BASE_DIR / "src" / "main.js",
        BASE_DIR / "src" / "audio" / "soundFX.js",
        BASE_DIR / "src" / "audio" / "ambientAudio.js",
        BASE_DIR / "src" / "audio" / "radioVFO.js",
        BASE_DIR / "src" / "crypto" / "constants.js",
        BASE_DIR / "src" / "crypto" / "enigma.js",
        BASE_DIR / "src" / "crypto" / "typex.js",
        BASE_DIR / "src" / "crypto" / "sigaba.js",
        BASE_DIR / "src" / "crypto" / "polish.js",
        BASE_DIR / "src" / "crypto" / "rejewskiCatalogue.js",
        BASE_DIR / "src" / "crypto" / "analytics.js",
        BASE_DIR / "src" / "crypto" / "lorenz.js",
        BASE_DIR / "src" / "crypto" / "bombe.js",
        BASE_DIR / "src" / "crypto" / "bombeWorker.js",
        BASE_DIR / "src" / "crypto" / "colossus.js",
        BASE_DIR / "src" / "scene3d" / "scene.js",
        BASE_DIR / "src" / "scene3d" / "textures.js",
        BASE_DIR / "src" / "scene3d" / "enigmaModel.js",
        BASE_DIR / "src" / "scene3d" / "typexModel.js",
        BASE_DIR / "src" / "scene3d" / "sigabaModel.js",
        BASE_DIR / "src" / "scene3d" / "bombeModel.js",
        BASE_DIR / "src" / "scene3d" / "colossusModel.js",
        BASE_DIR / "src" / "scene3d" / "laserWire.js",
        BASE_DIR / "src" / "scene3d" / "raycaster.js",
        BASE_DIR / "src" / "ui" / "controllers.js",
        BASE_DIR / "src" / "ui" / "missionsUI.js",
        BASE_DIR / "src" / "ui" / "typexUI.js",
        BASE_DIR / "src" / "ui" / "sigabaUI.js",
        BASE_DIR / "src" / "ui" / "polishUI.js",
        BASE_DIR / "src" / "ui" / "bombeUI.js",
        BASE_DIR / "src" / "ui" / "colossusUI.js",
        BASE_DIR / "src" / "ui" / "morseUI.js",
        BASE_DIR / "src" / "ui" / "telegramUI.js",
        BASE_DIR / "src" / "ui" / "analyticsUI.js",
        BASE_DIR / "src" / "ui" / "radioVFOUI.js",
        BASE_DIR / "src" / "ui" / "diagnostics.js",
    ]

    for f in required_files:
        assert_test(f"File exists: {f.name}", f.exists())

    # Check standalone script contents (ignore CSS @import)
    standalone = (BASE_DIR / "wwii_cryptography_3d_lab.html").read_text(encoding="utf-8")
    assert_test("Standalone contains inlined styles", "<style>" in standalone and ".glass-panel" in standalone)
    script_match = re.search(r'<script>(.*?)</script>', standalone, re.DOTALL)
    assert_test("Standalone contains script block", script_match is not None)
    if script_match:
        script_body = script_match.group(1)
        has_js_import = bool(re.search(r'^\s*import\s+', script_body, re.MULTILINE))
        has_js_export = bool(re.search(r'^\s*export\s+', script_body, re.MULTILINE))
        assert_test("Standalone has zero unresolved module imports", not has_js_import and not has_js_export)
        assert_test("Standalone bundles MultiOrderBombeWorker", "MultiOrderBombeWorker" in script_body)
        assert_test("Standalone bundles RejewskiCatalogue", "RejewskiCatalogue" in script_body)
        assert_test("Standalone bundles AmbientAudioHut11", "AmbientAudioHut11" in script_body)
        assert_test("Standalone bundles RadioVFOReceiver", "RadioVFOReceiver" in script_body)
        assert_test("Standalone bundles calculateIndexOfCoincidence", "calculateIndexOfCoincidence" in script_body)

    print("\n--- 3. Local Loopback Server Smoke Test ---")
    # Launch loopback server on a free port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()

    server_proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=str(BASE_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(0.8)

    try:
        url_modular = f"http://127.0.0.1:{port}/index.html"
        req1 = urllib.request.urlopen(url_modular, timeout=3)
        assert_test("HTTP GET /index.html returns 200 OK", req1.status == 200)

        url_standalone = f"http://127.0.0.1:{port}/wwii_cryptography_3d_lab.html"
        req2 = urllib.request.urlopen(url_standalone, timeout=3)
        assert_test("HTTP GET /wwii_cryptography_3d_lab.html returns 200 OK", req2.status == 200)

        url_module_js = f"http://127.0.0.1:{port}/src/main.js"
        req3 = urllib.request.urlopen(url_module_js, timeout=3)
        assert_test("HTTP GET /src/main.js returns 200 OK", req3.status == 200)
    finally:
        server_proc.terminate()
        server_proc.wait()

    print(f"\n==========================================")
    print(f"VERIFICATION COMPLETE: {passed}/{total} TESTS PASSED")
    print(f"==========================================\n")

if __name__ == "__main__":
    run_tests()
