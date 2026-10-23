// "Help, before it's too late" (v5).
//  1. Opening (3D): platinum rings lock; the camera flies into one ring.
//  2. The road (HTML): full-screen photo chapters, promise -> argument -> silence -> family -> lawyer
//     -> court, colour draining away; a slim road marker shows help waiting at the very end.
//  3. Ending (3D): a soft gold glow (the help) stays centre-screen as night turns to light, grows into
//     the gold sphere, the rings glide in around it, move into the logo arrangement, and the wordmark
//     appears. Every size is fitted to the viewport so text and rings never overlap.
// ?p=0.5 freezes the story at a point; ?p=1.5 shows the content half a screen below the story.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NIGHT = new THREE.Color(0x0B0A0C), CREAM = new THREE.Color(0xF6F0EA);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ---------- renderer, scene, camera
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, Math.min(innerWidth, innerHeight) < 700 ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
const FOV = 40;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 100);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 5, 6); scene.add(key);

// ---------- rings
const R = 1.25, TUBE = 0.19;
const ringGeo = new THREE.TorusGeometry(R, TUBE, 96, 260);
// morph target: the same ring with the logo's band thickness (tube = 0.31 x radius, measured from the logo)
const thick = new THREE.TorusGeometry(R, R * 0.31, 96, 260);
ringGeo.morphAttributes.position = [thick.attributes.position];
ringGeo.morphAttributes.normal = [thick.attributes.normal];
const platinum = () => new THREE.MeshPhysicalMaterial({ color: 0xE6E4E1, metalness: 1, roughness: 0.17, clearcoat: 0.6, clearcoatRoughness: 0.1 });
function ringPair(z) {
  const a = new THREE.Mesh(ringGeo, platinum()), b = new THREE.Mesh(ringGeo, platinum());
  b.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(a, b); g.position.z = z; scene.add(g); return { g, a, b };
}
const start = ringPair(0);          // opening pair, the camera flies through ring a
const fin = ringPair(-40);          // ending pair, far away from the opening
// Ending layers, drawn back to front with depth cleared between them, like the logo artwork:
// rose, (cream gap) sage, then rose again over the top half. Rings can never cut into each other.
const haloGeo = new THREE.TorusGeometry(R, TUBE + 0.07, 64, 220);
const haloThick = new THREE.TorusGeometry(R, R * 0.31 + 0.07, 64, 220);
haloGeo.morphAttributes.position = [haloThick.attributes.position];
// the logo's weave: rose crosses over at the top and lower-right, sage at the bottom and upper-left
const WN = new THREE.Vector3(0, 1, 0);
const topClip = new THREE.Plane(WN.clone(), 0), topClip2 = new THREE.Plane(WN.clone(), 0), botClip = new THREE.Plane(WN.clone().negate(), 0);
const creamMat = (clip) => new THREE.MeshBasicMaterial({ color: 0xF6F0EA, toneMapped: false, transparent: true, opacity: 0, clippingPlanes: [clip] });
const sageHalo = new THREE.Mesh(haloGeo, creamMat(botClip)), roseHalo = new THREE.Mesh(haloGeo, creamMat(topClip));
const roseTop = new THREE.Mesh(ringGeo, fin.a.material.clone()); roseTop.material.clippingPlanes = [topClip2];   // a hair lower than the gap layer, so no seam line
fin.g.add(sageHalo, roseHalo, roseTop);
const layers = [fin.a, sageHalo, fin.b, roseHalo, roseTop];

// ---------- the help, from the start: a small cluster of champagne-gold crystals suspended between the rings
function diamondGeo(r) {
  // a brilliant-cut silhouette: table, crown, girdle, pavilion; few segments so facets catch the light
  const pts = [[0, -1.0], [0.98, -0.05], [1.0, 0], [0.62, 0.38], [0, 0.38]].map(([x, y]) => new THREE.Vector2(x * r, y * r));
  const g = new THREE.LatheGeometry(pts, 8); g.computeVertexNormals(); return g;
}
const starTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,245,220,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,.9)';
  g.beginPath(); g.moveTo(64, 4); g.lineTo(67, 61); g.lineTo(124, 64); g.lineTo(67, 67); g.lineTo(64, 124); g.lineTo(61, 67); g.lineTo(4, 64); g.lineTo(61, 61); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function crystals() {
  // one round crystal: clear glass with a warm gold heart, like the dot in the logo
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xF7F8FA, metalness: 0.85, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: 0.25, iridescenceIOR: 1.4, envMapIntensity: 2.4, emissive: 0xFFFFFF, emissiveIntensity: 0.12 });   // silver-white, polished
  const main = new THREE.Mesh(new THREE.SphereGeometry(0.15, 64, 64), mat); g.add(main);
  const orbit = new THREE.Group(); g.add(orbit);
  const sparks = [0].map(() => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); g.add(sp); return sp; });
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }));
  spark.scale.setScalar(0.7); spark.material.color.set(0xFFFFFF); g.add(spark);
  g.userData = { mat, spark, main, orbit, sparks }; return g;
}
function animateGems(g, t) {
  const u = g.userData;
  u.main.rotation.y = t * 0.5; u.orbit.rotation.z = t * 0.25; u.orbit.rotation.y = Math.sin(t * 0.3) * 0.4;
  u.sparks.forEach((sp, k) => {
    const ph = (t * 0.45 + k / 3) % 1, a = k * 2.1 + Math.floor(t * 0.45 + k / 3) * 1.3;   // each twinkle appears at a new facet
    sp.position.set(-0.05, 0.06, 0.16);                    // a highlight glint on the sphere
    sp.material.opacity = Math.pow(Math.sin(ph * Math.PI), 6); sp.material.rotation = t * 0.6;
    sp.scale.setScalar(0.12 + 0.16 * Math.sin(ph * Math.PI));
  });
}
const ROSE = new THREE.Color(0xD98A94), SAGE = new THREE.Color(0x9CAF88), PLAT = new THREE.Color(0xE6E4E1);

const box = new THREE.Box3(), corner = new THREE.Vector3();

// the help: gold sphere plus a soft additive glow
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,236,190,1)'); gr.addColorStop(0.35, 'rgba(255,220,150,.35)'); gr.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const helpMat = new THREE.MeshPhysicalMaterial({ color: 0xC9A24B, metalness: 0.85, roughness: 0.25, emissive: 0xC9A24B, emissiveIntensity: 0.55, transparent: true, opacity: 0 });
const help = new THREE.Mesh(new THREE.SphereGeometry(0.4, 48, 48), helpMat); scene.add(help);
help.renderOrder = 20; help.onBeforeRender = (rd) => rd.clearDepth();
const helpGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 })); scene.add(helpGlow);
const gemStart = crystals(); start.g.add(gemStart);
const gemEnd = crystals(); fin.g.add(gemEnd);


// faint dust for the opening
const N = 600, pos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { pos[i*3] = (Math.random() - .5) * 20; pos[i*3+1] = (Math.random() - .5) * 12; pos[i*3+2] = 6 - Math.random() * 16; }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.03, color: 0xE8C875, map: glowTex, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

// ---------- viewport fitting: distance at which an object of size (w, h) fills (fw, fh) of the screen
const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
function fitDistance(w, h, fw, fh) { return Math.max(h / (2 * tanH * fh), w / (2 * tanH * camera.aspect * fw)); }
function screenYToWorld(dist, frac) { return (0.5 - frac) * 2 * dist * tanH; }        // frac: 0 = top, 1 = bottom

// ---------- DOM
const story = document.getElementById('story'), wrap = document.getElementById('wrap'), bar = document.querySelector('.bar');
const prog = document.querySelector('.progress span'), vignette = document.querySelector('.vignette');
const road = document.querySelector('.road-scenes'), scenes = [...road.querySelectorAll('.scene')], marks = [...road.querySelectorAll('.road li')];
const captions = document.querySelector('.captions'), reveal = document.querySelector('.logo-reveal'), markImg = document.querySelector('.mark-reveal'),  logo = document.querySelector('.brand img');
const caps = [...document.querySelectorAll('.cap')].map((el) => ({ el,
  z: el.dataset.z !== undefined ? +el.dataset.z : null, span: +(el.dataset.span || 3),
  p: el.dataset.p !== undefined ? +el.dataset.p : null, pspan: +(el.dataset.pspan || 0.05),
  hold: el.hasAttribute('data-hold'), hero: el.classList.contains('hero') }));

// ---------- scroll
let target = 0, p = 0, frozen = false, frozenBeyond = false, scrollPos = 0;
const storyRange = () => story.offsetHeight - innerHeight;
function readScroll() {
  if (frozen) return;
  scrollPos = scrollY; target = clamp(scrollPos / storyRange());
  prog.style.width = (clamp(scrollPos / (document.documentElement.scrollHeight - innerHeight)) * 100).toFixed(1) + '%';
  bar.classList.toggle('solid', scrollPos > storyRange() - 40);
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); readScroll(); });

// ---------- timeline
const ROAD0 = 0.17, ROAD1 = 0.69;                         // the photo chapters
const W = (ROAD1 - ROAD0) / scenes.length;
const tmp = new THREE.Vector3();
function update(p, t) {
  const intro = ease(clamp(t / (reduce ? 0.001 : 2.8)));

  // ---- 1. opening: rings rest under the headline, then the camera flies into ring a
  const tallScreen = camera.aspect < 0.8;
  const restD = fitDistance(3.8, 3.1, tallScreen ? 0.8 : 0.55, tallScreen ? 0.3 : 0.42), restY = screenYToWorld(restD, tallScreen ? 0.7 : 0.66);
  const fly = smooth(0.085, 0.17, p);
  const lock = reduce ? 1 : ease(smooth(0.0, 0.07, p));          // the first scroll brings the rings together
  const halfW = restD * tanH * camera.aspect, apart = 1 - lock;
  const tallO = camera.aspect < 0.8;
  const sx = apart * Math.max(Math.min(halfW * 0.52 - 0.6, halfW - 1.5), 0.35), float = Math.sin(t * 0.6) * 0.08 * apart;
  const spin = apart * (0.75 + Math.sin(t * 0.35) * 0.35) * intro + (1 - intro) * 3;   // gentle sway, faces stay visible
  start.a.position.set(-0.6 - sx - (1 - intro) * 4, float + (tallO ? 0.15 : 0.25) * apart, -0.6 * apart);
  start.b.position.set(0.6 + sx + (1 - intro) * 4, -float - (tallO ? 1.7 : 0.25) * apart, -0.6 * apart);
  start.a.rotation.set(spin * 0.35, spin, 0); start.b.rotation.set(Math.PI / 2 + spin * 0.3, -spin * 0.9, 0);
  start.g.rotation.set((1 - fly) * 0.2, (1 - fly) * (0.42 + Math.sin(t * 0.25) * 0.05) * intro, 0);
  start.g.position.y = lerp(restY, 0, smooth(0.08, 0.13, p));
  gemStart.position.set((start.a.position.x + start.b.position.x) / 2, (start.a.position.y + start.b.position.y) / 2 + Math.sin(t * 1.1) * 0.02, 0);
  gemStart.rotation.set(0, 0, 0); animateGems(gemStart, t); gemStart.scale.setScalar(intro * (1.5 + 0.4 * (1 - lock)));
  gemStart.userData.spark.material.opacity = 0.35 + 0.25 * Math.abs(Math.sin(t * 1.7)) + 0.4 * Math.exp(-Math.pow((p - 0.068) / 0.01, 2));

  // ---- 3. ending: the same locked platinum rings dissolve into light; the real logo emerges from it
  const dawn = smooth(0.675, 0.685, p);
  const front = smooth(0.76, 0.85, p);
  const bloom = smooth(0.85, 0.875, p) * (1 - smooth(0.875, 0.905, p));   // light rises, then settles
  const gone = p > 0.875;                                    // rings vanish at the peak of the light
  const real = smooth(0.875, 0.905, p);
  // rings fitted to the logo's on-screen size (CSS: width min(380px, 62vw, 52vh), centred at 46%)
  const logoW = Math.min(380, innerWidth * 0.62, innerHeight * 0.52) * (3004 / 3184);
  const endD = (4.08 / (logoW / innerWidth)) / (2 * tanH * camera.aspect), endY = screenYToWorld(endD, 0.46);
  fin.g.position.y = endY;
  fin.g.rotation.set(lerp(0.2, 0.32, front), lerp(0.42 + Math.sin(t * 0.3) * 0.05, 0.18, front), 0);   // keep a tilt so the centre stays visible
  fin.a.position.set(-0.6, 0, 0); fin.b.position.set(0.6, 0, 0);
  fin.a.rotation.set(0, 0, 0); fin.b.rotation.set(Math.PI / 2, 0, 0);
  fin.g.scale.setScalar(1 + bloom * 0.04);
  gemEnd.position.set(0, Math.sin(t * 1.1) * 0.02, 0); gemEnd.scale.setScalar(1.5); animateGems(gemEnd, t);
  gemEnd.userData.mat.emissiveIntensity = 0.35 + smooth(0.84, 0.875, p) * 2.2;          // the crystals glow into the logo's gold
  gemEnd.userData.spark.material.opacity = 0.3 + smooth(0.84, 0.875, p) * 0.7;
  gemEnd.userData.spark.scale.setScalar(0.9 + smooth(0.84, 0.875, p) * 0.8);
  const melt = smooth(0.85, 0.875, p);                       // platinum glows into the light it sits in
  for (const m of [fin.a.material, fin.b.material]) {
    m.emissive.set(0xF6F0EA).multiplyScalar(melt * 1.1); m.color.copy(PLAT).multiplyScalar(1 - melt);
    m.envMapIntensity = 1 - melt; m.clearcoat = 0.6 * (1 - melt); m.toneMapped = melt < 0.5;
  }
  for (const m of [sageHalo, roseHalo, roseTop]) m.visible = false;
  fin.g.visible = p > 0.6 && !gone;
  help.visible = false;
  helpGlow.visible = bloom > 0.001;
  helpGlow.position.set(0, endY, -39.5);
  helpGlow.scale.setScalar(lerp(2, 9, bloom));
  helpGlow.material.opacity = bloom; helpGlow.material.color.set(0xFFFBF2);
  markImg.style.opacity = real.toFixed(3);
  markImg.style.transform = `translate(-50%, -50%) scale(${lerp(0.94, 1, real).toFixed(4)})`;
  const logoIn = smooth(0.95, 0.985, p);

  // ---- camera: opening path, then a fixed, fitted view of the ending
  if (p < 0.5) {
    const z = lerp(restD, -2.5, fly);
    camera.position.set(lerp(0, -0.6, fly), lerp(0, 0.42, fly), z);
    tmp.set(lerp(0, -0.6, fly), lerp(start.g.position.y * 0.3, 0.42, fly), z - 8); camera.lookAt(tmp);
  } else {
    camera.position.set(0, 0, -40 + endD); camera.lookAt(0, 0, -40);
  }

  // ---- background + overlays
  const bg = NIGHT.clone().lerp(CREAM, dawn); renderer.setClearColor(bg);
  renderer.toneMappingExposure = 1 + smooth(0.85, 0.875, p) * (1 - smooth(0.875, 0.9, p)) * 0.9 + Math.exp(-Math.pow((p - 0.15) / 0.015, 2)) * 0.6 + Math.exp(-Math.pow((p - 0.068) / 0.01, 2)) * 0.45 * (1 - fly);
  vignette.style.opacity = (1 - dawn).toFixed(3);
  dust.material.opacity = 0.6 * (1 - dawn);

  // ---- 2. the road (photo chapters)
  const roadOn = smooth(0.145, 0.17, p);
  road.style.opacity = roadOn.toFixed(3);
  const open = smooth(0.69, 0.73, p);                    // light opens from the centre of the screen
  if (open > 0) { const r0 = open * 120, m = `radial-gradient(circle at 50% 50%, transparent ${r0}%, #000 ${r0 + 18}%)`; road.style.maskImage = road.style.webkitMaskImage = m; }
  else road.style.maskImage = road.style.webkitMaskImage = '';
  road.style.visibility = open >= 1 ? 'hidden' : '';
  let active = -1;
  scenes.forEach((s, k) => {
    const c = ROAD0 + (k + 0.5) * W;
    const o = k === 0 ? (1 - smooth(c + W * 0.3, c + W * 0.75, p)) : smooth(c - W * 0.75, c - W * 0.3, p) * (k === scenes.length - 1 ? 1 : 1 - smooth(c + W * 0.3, c + W * 0.75, p));
    s.style.opacity = o.toFixed(3);
    const img = s.querySelector('img');
    if (img) {
      const sat = +s.dataset.sat;
      img.style.setProperty('--zoom', lerp(1.12, 1.0, clamp((p - (c - W)) / (2 * W))).toFixed(4));
      img.style.filter = `saturate(${sat}) brightness(${lerp(1, 0.78, 1 - sat)}) contrast(${lerp(1, 1.06, 1 - sat)})`;
    }
    const cap = s.querySelector('figcaption'); if (cap) cap.style.setProperty('--dy', ((c - p) * 600).toFixed(1) + 'px');
    if (p >= c - W * 0.5) active = k;
  });
  marks.forEach((m, k) => m.classList.toggle('on', k <= Math.min(active, 5)));

  // ---- captions
  const leave = frozenBeyond ? 0 : smooth(storyRange() + innerHeight * 0.9, storyRange() + innerHeight * 1.0, scrollPos);   // content slides up over the logo
  captions.style.opacity = (1 - leave).toFixed(3);
  const stay = 1 - leave;
  const zNow = camera.position.z;
  caps.forEach((c) => {
    let o, dy;
    if (c.p !== null) { o = 1 - Math.abs(p - c.p) / c.pspan; if (c.hold && p >= c.p) o = 1; dy = (p - c.p) * -400; }
    else { o = 1 - Math.abs(zNow - c.z) / c.span; if (c.hero) o = 1 - smooth(0.04, 0.085, p); dy = (zNow - c.z) * 10; if (p > ROAD0) o = 0; }
    c.el.style.opacity = clamp(o).toFixed(3); c.el.style.setProperty('--dy', dy.toFixed(1) + 'px');
  });
  reveal.style.opacity = (logoIn * stay).toFixed(3); markImg.style.opacity = (real * stay).toFixed(3);

  // ---- header colours
  const light = open > 0.5 || bar.classList.contains('solid');
  const want = light ? 'logo-horizontal.svg' : 'logo-horizontal-cream.svg';
  if (!logo.src.endsWith(want)) logo.src = want;
  bar.style.color = light ? '#2F2622' : '';
  return roadOn > 0.999 && open === 0;                                    // the photos fully cover the canvas
}

// ---------- waitlist form (posts to the Google Sheet, then the thank-you page)
document.querySelectorAll('form[data-waitlist]').forEach((f) => f.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Joining…';
  f.querySelector('input[name=page]').value = '/preview/';
  fetch(f.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(f)) })
    .then(() => { location.href = 'https://shaadios.app/thanks'; }).catch(() => f.submit());
}));

// ---------- loop
const clock = new THREE.Clock();
const q = new URLSearchParams(location.search).get('p');
readScroll(); p = target;
if (q !== null) {
  frozen = true;
  const v = +q, shift = v <= 1 ? storyRange() * v : storyRange() + (v - 1) * innerHeight;
  wrap.style.transform = `translateY(${-shift}px)`;
  target = p = Math.min(v, 1); frozenBeyond = v > 1; bar.classList.toggle('solid', v > 1);
}
function frame() {
  const t = reduce ? 10 : clock.getElapsedTime();
  p += (target - p) * (reduce ? 1 : 0.09);
  if (frozen || scrollPos < storyRange() + innerHeight) { const covered = update(p, t); if (!covered) renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}

frame();
