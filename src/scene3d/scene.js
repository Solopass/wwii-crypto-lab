export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060912);
scene.fog = new THREE.FogExp2(0x060912, 0.012);

const canvas = document.getElementById('webgl-canvas');
const canvasContainer = document.getElementById('canvas-container');

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 18, 20);

export const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 4;
controls.maxDistance = 140;

export const cameraTargetPos = new THREE.Vector3(0, 18, 20);
export const controlsTargetPos = new THREE.Vector3(0, 1, 0);

// Lighting
export const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.45);
scene.add(ambientLight);

export const bunkerDeskLamp = new THREE.DirectionalLight(0xffecd1, 1.25);
bunkerDeskLamp.position.set(16, 32, 22);
bunkerDeskLamp.castShadow = true;
bunkerDeskLamp.shadow.mapSize.width = 2048;
bunkerDeskLamp.shadow.mapSize.height = 2048;
scene.add(bunkerDeskLamp);

export const coolRimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
coolRimLight.position.set(-25, 16, -18);
scene.add(coolRimLight);

export const lampLight = new THREE.PointLight(0xf59e0b, 0, 16, 2);
lampLight.position.set(0, 3, 0);
scene.add(lampLight);

export function resizeRenderer() {
  const w = canvasContainer.clientWidth || window.innerWidth;
  const h = canvasContainer.clientHeight || window.innerHeight;
  if (w > 0 && h > 0) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
}
window.addEventListener('resize', resizeRenderer);
if (window.ResizeObserver) {
  new ResizeObserver(resizeRenderer).observe(canvasContainer);
}

// Atmospheric dust particles
const dustCount = 200;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i += 3) {
  dustPos[i] = (Math.random() - 0.5) * 60;
  dustPos[i + 1] = Math.random() * 30;
  dustPos[i + 2] = (Math.random() - 0.5) * 60;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ color: 0xfef08a, size: 0.15, transparent: true, opacity: 0.35 });
export const dustParticles = new THREE.Points(dustGeo, dustMat);
scene.add(dustParticles);

// Render loop hooks
const animationCallbacks = [];
export function registerAnimationCallback(cb) {
  animationCallbacks.push(cb);
}

let lastTime = performance.now();
let frameCount = 0;

export function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    const fpsEl = document.getElementById('telemetry-fps');
    const drawsEl = document.getElementById('telemetry-draws');
    const geosEl = document.getElementById('telemetry-geos');
    if (fpsEl) fpsEl.textContent = frameCount;
    if (drawsEl) drawsEl.textContent = renderer.info.render.calls;
    if (geosEl) geosEl.textContent = renderer.info.memory.geometries;
    frameCount = 0;
    lastTime = now;
  }

  camera.position.lerp(cameraTargetPos, 0.08);
  controls.target.lerp(controlsTargetPos, 0.08);

  // Animate dust particles
  const positions = dustGeo.attributes.position.array;
  for (let i = 1; i < dustCount * 3; i += 3) {
    positions[i] -= 0.02;
    if (positions[i] < 0) positions[i] = 30;
  }
  dustGeo.attributes.position.needsUpdate = true;

  // Execute registered model animations
  animationCallbacks.forEach(cb => cb());

  controls.update();
  renderer.render(scene, camera);
}
