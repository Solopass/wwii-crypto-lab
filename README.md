# WWII Cryptography 3D Lab

An interactive 3D lab for the cipher machines of the Second World War. The machines are real
implementations, not animations: you work them by clicking keys and turning rotors, and they
encrypt and decrypt the way the originals did.

## What's in it

- **Enigma** — rotors I–V plus the naval Beta/Gamma, ring settings, plugboard, and a wired lampboard.
- **Typex** and **SIGABA** — the British and American machines that were never broken in the war.
- **Lorenz** and **Colossus** — the teleprinter cipher behind the German high command, and the machine built to attack it.
- **The Bombe** — searches 60 rotor orders for a crib in a Web Worker, so the page stays responsive while it runs.
- **Polish methods** — Rejewski's characteristic catalogue and the analysis tools that came before the Bombe.
- **Missions** — set pieces that put you in the codebreakers' position instead of just describing it.
- **Radio and Morse** — an HF receiver with a tuning dial, a Morse key, and telegram output.

## Running it

Open `index.html` through any local web server (the modules won't load from `file://`):

```
python -m http.server 8000
```

then visit <http://127.0.0.1:8000/>.

`wwii_cryptography_3d_lab.html` is a single-file build of the same app. Regenerate it after
changing anything in `src/` or `css/`:

```
python build_standalone.py
```

Both versions load Three.js and Tailwind from public CDNs, so they need an internet connection.

## Tests

```
python verify_lab.py
```

67 checks: the cipher engines against known rotor wirings and test vectors, the standalone build,
file integrity, and serving the pages over a loopback HTTP server.

## Layout

| Folder | What |
|---|---|
| `src/crypto/` | the machines and attacks: Enigma, Typex, SIGABA, Lorenz, Colossus, Bombe, Polish methods, analytics |
| `src/scene3d/` | the 3D models, scene, and click-to-press raycasting |
| `src/ui/` | panels for each machine, missions, Morse, radio, telegrams |
| `src/audio/` | sound effects, ambience, and the radio dial |
| `css/` | styles |

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE.md) — free for personal, educational and other
noncommercial use. Copyright Solopass.
