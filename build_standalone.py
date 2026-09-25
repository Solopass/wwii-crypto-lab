#!/usr/bin/env python3
"""
WWII Cryptography 3D Lab - Standalone Bundler
Combines modular CSS and JS into a single, zero-dependency, 100% offline HTML file.
"""

import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

MODULE_ORDER = [
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
    BASE_DIR / "src" / "audio" / "soundFX.js",
    BASE_DIR / "src" / "audio" / "ambientAudio.js",
    BASE_DIR / "src" / "audio" / "radioVFO.js",
    BASE_DIR / "src" / "scene3d" / "textures.js",
    BASE_DIR / "src" / "scene3d" / "scene.js",
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
    BASE_DIR / "src" / "main.js"
]

def clean_module_code(code: str, is_main: bool = False) -> str:
    # Remove multi-line and single-line import blocks
    code = re.sub(r'import\s*\{[^}]*\}\s*from\s*[\'"][^\'"]+[\'"]\s*;?', '', code, flags=re.DOTALL)
    lines = []
    for line in code.splitlines():
        # Remove single line import statements
        if re.match(r'^\s*import\s+', line):
            continue
        # Remove 'export default ' or 'export ' before declarations
        line = re.sub(r'^\s*export\s+default\s+', '', line)
        line = re.sub(r'^\s*export\s+(const|let|var|function|class)\s+', r'\1 ', line)
        line = re.sub(r'^\s*export\s*\{[^}]*\}\s*;?', '', line)
        lines.append(line)
    return "\n".join(lines)

def bundle():
    print("Bundling WWII Cryptography 3D Lab into standalone HTML...")

    # Read base index.html
    index_path = BASE_DIR / "index.html"
    html = index_path.read_text(encoding="utf-8")

    # Inline CSS
    css_path = BASE_DIR / "css" / "lab.css"
    css_content = css_path.read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="css/lab.css">',
        f'<style>\n{css_content}\n</style>'
    )

    # Combine all JS modules in dependency order
    combined_js_parts = []
    combined_js_parts.append("// WWII Cryptography 3D Lab - Bundled Standalone Runtime")
    combined_js_parts.append("(function() {")

    for mod_path in MODULE_ORDER:
        if not mod_path.exists():
            raise FileNotFoundError(f"Module file not found: {mod_path}")
        code = mod_path.read_text(encoding="utf-8")
        is_main = mod_path.name == "main.js"
        cleaned = clean_module_code(code, is_main)
        combined_js_parts.append(f"\n/* --- {mod_path.name} --- */")
        combined_js_parts.append(cleaned)

    combined_js_parts.append("\n})();")
    bundled_js = "\n".join(combined_js_parts)

    # Replace script tag with bundled script
    html = html.replace(
        '<script type="module" src="src/main.js"></script>',
        f'<script>\n{bundled_js}\n</script>'
    )

    # Write standalone output
    out_path = BASE_DIR / "wwii_cryptography_3d_lab.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"Successfully generated standalone bundle: {out_path} ({len(html):,} bytes)")

if __name__ == "__main__":
    bundle()
