import { ALPHABET } from '../crypto/constants.js';

export function createMahoganyTexture() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#220e06'; cx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * 512;
    const h = Math.random() * 4 + 1;
    cx.fillStyle = Math.random() > 0.5 ? 'rgba(56, 22, 10, 0.45)' : 'rgba(15, 6, 2, 0.5)';
    cx.fillRect(0, y, 512, h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createKnurledRotorTexture() {
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 256;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#111827'; cx.fillRect(0, 0, 2048, 256);
  cx.fillStyle = '#030712'; cx.fillRect(0, 48, 2048, 160);
  cx.font = 'bold 80px Courier Prime, monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (let i = 0; i < 26; i++) {
    const x = (i + 0.5) * (2048 / 26);
    cx.fillStyle = '#f8fafc'; cx.fillText(ALPHABET[i], x, 128);
    cx.fillStyle = '#ef4444'; cx.beginPath(); cx.arc(x, 48, 4, 0, Math.PI * 2); cx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createKeycapTexture(char) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#0f172a'; cx.beginPath(); cx.arc(128, 128, 124, 0, Math.PI * 2); cx.fill();
  cx.strokeStyle = '#94a3b8'; cx.lineWidth = 6; cx.stroke();
  cx.fillStyle = '#ffffff'; cx.font = 'bold 130px Courier Prime, monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(char, 128, 134);
  return new THREE.CanvasTexture(cv);
}

export function createLampTexture(char) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const cx = cv.getContext('2d');
  const grad = cx.createRadialGradient(128, 128, 20, 128, 128, 120);
  grad.addColorStop(0, '#451a03'); grad.addColorStop(1, '#1c0c02');
  cx.fillStyle = grad; cx.beginPath(); cx.arc(128, 128, 124, 0, Math.PI * 2); cx.fill();
  cx.strokeStyle = '#d97706'; cx.lineWidth = 4; cx.stroke();
  cx.fillStyle = '#fef08a'; cx.font = 'bold 130px Courier Prime, monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(char, 128, 134);
  return new THREE.CanvasTexture(cv);
}
