export function initTelegramUI() {
  document.getElementById('btn-export-dispatch')?.addEventListener('click', () => {
    const cipher = document.getElementById('output-ciphertext')?.textContent || 'BDZGO';
    const plain = document.getElementById('input-plaintext')?.value || 'WETTERVORHERSAGE';
    const cipherBody = document.getElementById('dispatch-cipher-body');
    const plainBody = document.getElementById('dispatch-plain-body');

    if (cipherBody) cipherBody.textContent = cipher;
    if (plainBody) plainBody.textContent = plain || 'DISPATCH RECOVERED UNDER DAILY KEY';
    document.getElementById('modal-telegram-export')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-telegram')?.addEventListener('click', () => {
    document.getElementById('modal-telegram-export')?.classList.add('hidden');
  });

  document.getElementById('btn-print-dispatch')?.addEventListener('click', () => {
    const content = document.getElementById('dispatch-parchment-sheet')?.outerHTML;
    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>Funkspruch Dispatch</title>
            <style>
              body { font-family: monospace; background: #fff; padding: 20px; }
              .parchment-sheet { border: 2px solid #000; padding: 20px; }
              .stamp-red { border: 2px solid red; color: red; font-weight: bold; float: right; padding: 5px; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWin.document.close();
      printWin.print();
    }
  });

  document.getElementById('btn-copy-dispatch')?.addEventListener('click', () => {
    const date = document.getElementById('dispatch-date')?.textContent || '06.06.1944';
    const time = document.getElementById('dispatch-time')?.textContent || '04:15 MEZ';
    const station = document.getElementById('dispatch-station')?.textContent || 'KLA';
    const cipher = document.getElementById('dispatch-cipher-body')?.textContent || '';
    const plain = document.getElementById('dispatch-plain-body')?.textContent || '';

    const text = `
========================================
OBERKOMMANDO DER WEHRMACHT / KRIEGSMARINE
FUNKSPRUCH / SCHLÜSSELZETTEL
DATUM: ${date} | ZEIT: ${time} | STATION: ${station}
----------------------------------------
CHIFFRIERTE FUNKNACHRICHT:
${cipher}
----------------------------------------
ULTRA DECRYPTION INTELLIGENCE:
${plain}
========================================
    `.trim();

    navigator.clipboard?.writeText(text).catch(() => {});
    const copyBtn = document.getElementById('btn-copy-dispatch');
    if (copyBtn) {
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    }
  });
}
