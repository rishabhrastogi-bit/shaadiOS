// "Two rings" v2: platinum rings lock together, the camera flies through one ring,
// and the page opens into two pastel perspectives of the same day.
// Scroll progress p (0..1) drives everything; ?p=0.5 freezes the story at a point (for previews).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 700;
const NIGHT = new THREE.Color(0x0B0A0C), CREAM = new THREE.Color(0xF6F0EA), WHITE = new THREE.Color(0xFFFDF9);

// ---------- renderer, scene, camera
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(NIGHT.clone(), 10, 26);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const camera = new THREE.PerspectiveCamera(small ? 52 : 38, innerWidth / innerHeight, 0.05, 100);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 5, 6); scene.add(key);
const cool = new THREE.PointLight(0xbfd4ff, 18, 20); cool.position.set(-5, 2, 3); scene.add(cool);
const warm = new THREE.PointLight(0xffd9b0, 14, 20); warm.position.set(5, -2, 2); scene.add(warm);

// ---------- platinum rings (interlocked when in place: perpendicular planes, centres 1.2 apart)
const R = 1.25, TUBE = 0.19;
const geo = new THREE.TorusGeometry(R, TUBE, 96, 260);
const platinum = () => new THREE.MeshPhysicalMaterial({ color: 0xE6E4E1, metalness: 1, roughness: 0.17, clearcoat: 0.6, clearcoatRoughness: 0.1 });
const ringA = new THREE.Mesh(geo, platinum());                 // vertical ring; the camera flies through it
const ringB = new THREE.Mesh(geo, platinum());
const rings = new THREE.Group(); rings.add(ringA, ringB); scene.add(rings);
const A_HOME = new THREE.Vector3(-0.6, 0, 0), B_HOME = new THREE.Vector3(0.6, 0, 0);

// glint where the rings cross
const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(glint);

// ---------- floating motes: faint dust in the dark, soft pastel bokeh in the light
const N = small ? 500 : 1000;
const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
const PASTEL = [new THREE.Color(0xE9B7BE), new THREE.Color(0xC9D8BE), new THREE.Color(0xE8D4A8)];
for (let i = 0; i < N; i++) {
  pos[i*3] = (Math.random() - .5) * 24; pos[i*3+1] = (Math.random() - .5) * 14; pos[i*3+2] = -Math.random() * 40 + 6;
  const c = PASTEL[i % 3]; col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
moteGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false }));
scene.add(motes);

// ---------- helpers
function starTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,248,235,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- scroll -> progress
let target = 0, p = 0, frozen = false;
const bar = document.querySelector('.progress span');
function readScroll() {
  if (frozen) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  target = max > 0 ? clamp(scrollY / max) : 0;
  bar.style.width = (target * 100).toFixed(1) + '%';
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); readScroll();
});
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.35 });
document.querySelectorAll('.copy').forEach((el) => io.observe(el));

// ---------- DOM bits driven by progress
const split = document.querySelector('.split'), vignette = document.querySelector('.vignette');
const sides = document.querySelectorAll('.side'), steps = [...document.querySelectorAll('.split [data-at]')];
const logo = document.querySelector('.brand img'), pill = document.querySelector('.pill');
let light = false;
function setLight(on) {
  if (on === light) return; light = on;
  document.body.classList.toggle('light', on);
  logo.src = on ? 'logo-horizontal.svg' : 'logo-horizontal-cream.svg';
  pill.style.background = on ? '#2F2622' : ''; pill.style.color = on ? '#F6F0EA' : '';
}

// ---------- timeline
//   intro (time)  rings glide in from either side and lock
//   0.00-0.18     the locked rings turn slowly, camera eases in
//   0.18-0.46     the camera flies through the left ring; night fades to cream
//   0.44-0.86     two perspectives: each side's day unfolds line by line
//   0.86-1.00     perspectives fade; preview note
const introLen = reduce ? 0.001 : 2.8;
const look = new THREE.Vector3(), bg = new THREE.Color(), off = new THREE.Vector3();
function update(p, t) {
  const intro = ease(clamp(t / introLen));
  const fly = seg(p, 0.18, 0.46), dawn = seg(p, 0.30, 0.33), out = seg(p, 0.86, 0.93);

  // rings: glide in, lock, then hold still for the fly-through
  const away = 1 - intro, spin = away * 3.2;
  ringA.position.copy(A_HOME).add(off.set(-5.5 * away, 0.6 * away, -2 * away));
  ringB.position.copy(B_HOME).add(off.set(5.5 * away, -0.6 * away, -2 * away));
  ringA.rotation.set(spin * 0.4, spin, 0);
  ringB.rotation.set(Math.PI / 2 + spin * 0.3, -spin, 0);
  rings.rotation.y = (1 - fly) * (0.35 + Math.sin(t * 0.25) * 0.12) * intro;
  rings.rotation.x = (1 - fly) * 0.12;

  const lockedGlow = clamp((intro - 0.85) / 0.15) * (1 - fly);
  glint.position.copy(A_HOME).add(off.set(0.62, 0.05, 0.3)).applyEuler(rings.rotation);
  glint.material.opacity = lockedGlow * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.3)));
  glint.scale.setScalar(0.9 + 0.5 * Math.abs(Math.sin(t * 1.3)));

  // camera: drift in, then fly through ring A's centre (slightly above ring B's tube)
  const idleZ = lerp(9, 6.6, seg(p, 0, 0.18));
  camera.position.set(lerp(0.3, A_HOME.x, fly), lerp(0.35, 0.42, fly), lerp(idleZ, -7, fly));
  look.set(lerp(0, A_HOME.x, fly), lerp(0, 0.42, fly), lerp(0, -30, fly));
  rings.position.y = lerp(small ? -1.6 : -1.15, 0, seg(p, 0, 0.16));     // rest below the headline, rise to meet us
  camera.lookAt(look);

  // light: a bright flash as we pass through the ring, then night melts into cream
  const pass = Math.exp(-Math.pow((p - 0.317) / 0.02, 2));
  renderer.toneMappingExposure = 1.0 + pass * 1.2 + dawn * 0.1;
  bg.copy(NIGHT).lerp(CREAM, dawn).lerp(WHITE, pass * 0.9);
  renderer.setClearColor(bg); scene.fog.color.copy(bg);
  vignette.style.opacity = (1 - dawn).toFixed(3);
  motes.material.size = lerp(0.05, 0.35, dawn);
  motes.material.opacity = lerp(0.45, 0.55, dawn) * (1 - out * 0.4);
  motes.position.z = -fly * 8;
  motes.rotation.z = t * 0.01;
  setLight(dawn > 0.6);

  // perspectives
  const show = seg(p, 0.34, 0.40) * (1 - out);
  split.style.opacity = show.toFixed(3);
  const part = seg(p, 0.8, 0.86) * 8;                         // a gentle gap opens: "same house, two days"
  sides[0].style.transform = `translateX(${-part}px)`; sides[1].style.transform = `translateX(${part}px)`;
  steps.forEach((el) => el.classList.toggle('on', p >= +el.dataset.at));
}

// ---------- loop
const clock = new THREE.Clock();
const q = new URLSearchParams(location.search).get('p');
readScroll(); p = target;
if (q !== null) {
  frozen = true; document.documentElement.classList.add('frozen');
  const max = document.documentElement.scrollHeight - innerHeight;
  document.getElementById('story').style.transform = `translateY(${-max * +q}px)`;
  target = p = +q; bar.style.width = (+q * 100) + '%';
  document.querySelectorAll('.copy').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15) el.classList.add('in');
  });
}
function frame() {
  const t = reduce ? 10 : clock.getElapsedTime();
  p += (target - p) * (reduce ? 1 : 0.07);
  update(p, t);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
