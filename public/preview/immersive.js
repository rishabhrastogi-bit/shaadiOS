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
const helpGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 })); scene.add(helpGlow);

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
const captions = document.querySelector('.captions'), reveal = document.querySelector('.logo-reveal'),  logo = document.querySelector('.brand img');
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
  const fly = smooth(0.08, 0.17, p);
  const away = 1 - intro, spin = away * 3.2;
  start.a.position.set(-0.6 - 5.5 * away, 0.6 * away, -2 * away); start.b.position.set(0.6 + 5.5 * away, -0.6 * away, -2 * away);
  start.a.rotation.set(spin * 0.4, spin, 0); start.b.rotation.set(Math.PI / 2 + spin * 0.3, -spin, 0);
  start.g.rotation.set((1 - fly) * 0.2, (1 - fly) * (0.42 + Math.sin(t * 0.25) * 0.05) * intro, 0);
  start.g.position.y = lerp(restY, 0, smooth(0.08, 0.13, p));

  // ---- 3. ending: help glow -> sphere -> rings glide in -> logo
  const dawn = smooth(0.675, 0.685, p), join = smooth(0.735, 0.805, p), morph = smooth(0.8, 0.87, p);
  const grow = smooth(0.875, 0.91, p), settle = smooth(0.905, 0.935, p), logoIn = smooth(0.95, 0.985, p);   // the help arrives only once the rings are together
  const endD = fitDistance(lerp(3.8, 5.3, morph), lerp(3.1, 3.3, morph), 0.62, lerp(0.42, 0.34, settle));                 // rings fit below the captions
  const endY = screenYToWorld(endD, lerp(0.6, 0.47, settle));
  fin.g.position.y = endY;
  fin.g.rotation.set((1 - morph) * 0.16, (1 - morph) * (0.4 + Math.sin(t * 0.3) * 0.05), 0);
  fin.a.position.set(lerp(-4.2, lerp(-0.6, -1.0, morph), join), 0, lerp(0, 0.05, morph));
  fin.b.position.set(lerp(4.2, lerp(0.6, 1.0, morph), join), 0, lerp(0, -0.05, morph));
  fin.b.rotation.x = lerp(Math.PI / 2, 0.14, morph);            // slight opposite tilts give the logo's over-under weave
  fin.a.rotation.x = lerp(0, -0.14, morph);
  fin.a.morphTargetInfluences[0] = fin.b.morphTargetInfluences[0] = morph;
  fin.a.material.color.copy(PLAT).lerp(ROSE, morph); fin.b.material.color.copy(PLAT).lerp(SAGE, morph);
  // shiny platinum -> the logo's flat, matte colour
  const flat = smooth(0.84, 0.92, p);
  key.intensity = lerp(2.2, 0.7, flat);
  [[fin.a.material, ROSE], [fin.b.material, SAGE]].forEach(([m, c]) => {
    m.metalness = lerp(1, 0, morph); m.roughness = lerp(0.17, 0.85, morph); m.clearcoat = lerp(0.6, 0, morph);
    m.envMapIntensity = lerp(1, 0.15, flat); m.emissive.copy(c).multiplyScalar(0.7 * flat);
  });
  fin.g.visible = join > 0.001;
  help.position.set(0, endY, -40);
  help.scale.setScalar(lerp(0.2, 1, grow));
  help.position.z = -40 + 0.2;                                   // just in front of the ring overlap
  helpMat.opacity = grow;
  helpGlow.position.set(0, endY, -40.2);
  helpGlow.scale.setScalar(lerp(0.6, 1.5, grow) + Math.sin(t * 2) * 0.04);
  helpGlow.material.opacity = grow * 0.85;

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
  renderer.toneMappingExposure = 1 + Math.exp(-Math.pow((p - 0.15) / 0.015, 2)) * 0.6;
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
  const leave = frozenBeyond ? 1 : smooth(storyRange() - innerHeight * 0.1, storyRange() + innerHeight * 0.4, scrollPos);
  captions.style.opacity = (1 - leave).toFixed(3);
  const zNow = camera.position.z;
  caps.forEach((c) => {
    let o, dy;
    if (c.p !== null) { o = 1 - Math.abs(p - c.p) / c.pspan; if (c.hold && p >= c.p) o = 1; dy = (p - c.p) * -400; }
    else { o = 1 - Math.abs(zNow - c.z) / c.span; if (c.hero) o = 1 - smooth(0.04, 0.085, p); dy = (zNow - c.z) * 10; if (p > ROAD0) o = 0; }
    c.el.style.opacity = clamp(o).toFixed(3); c.el.style.setProperty('--dy', dy.toFixed(1) + 'px');
  });
  ending(p);
  reveal.style.opacity = logoIn.toFixed(3);

  // ---- header colours
  const light = open > 0.5 || bar.classList.contains('solid');
  const want = light ? 'logo-horizontal.svg' : 'logo-horizontal-cream.svg';
  if (!logo.src.endsWith(want)) logo.src = want;
  bar.style.color = light ? '#2F2622' : '';
  fin.g.visible = false; help.visible = false; helpGlow.visible = false;
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

// ---------- the ending, drawn with the real logo artwork (no 3D intersections)
const markBox = document.querySelector('.mark-anim');
let markParts = null;
fetch('mark.svg').then((r) => r.text()).then((txt) => {
  markBox.innerHTML = txt;
  const svg = markBox.querySelector('svg'); svg.removeAttribute('width'); svg.removeAttribute('height');
  const paths = [...svg.querySelectorAll('path')];
  const by = (c) => paths.filter((x) => (x.getAttribute('fill') || '').toUpperCase() === c);
  const g = (list) => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'g'); list.forEach((x) => e.appendChild(x)); svg.appendChild(e); return e; };
  const sage = g(by('#9CAF88')), rose = g(by('#D98A94').slice(0, 1)), gold = g(by('#C9A24B')), arc = g(by('#D98A94').slice(1));
  // keep the logo's drawing order: sage, rose, gold, rose arc over sage
  [sage, rose, gold, arc].forEach((e) => svg.appendChild(e));
  const NS = 'http://www.w3.org/2000/svg';
  const ring = (cx) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', cx); c.setAttribute('cy', 1044); c.setAttribute('r', 732); c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', 432); return c; };
  const full = document.createElementNS(NS, 'g'), fs = ring(2148), fr = ring(1040);
  full.append(fs, fr); svg.insertBefore(full, sage);
  const woven = document.createElementNS(NS, 'g'); [sage, rose, arc].forEach((e) => woven.appendChild(e)); svg.insertBefore(woven, gold);
  markParts = { sage, rose, gold, arc, full, fs, fr, woven };
});
const mix = (c1, c2, t) => '#' + [0, 2, 4].map((i) => Math.round(lerp(parseInt(c1.substr(i + 1, 2), 16), parseInt(c2.substr(i + 1, 2), 16), t)).toString(16).padStart(2, '0')).join('');
function ending(p) {
  const appear = smooth(0.72, 0.75, p), join = smooth(0.735, 0.83, p), tint = smooth(0.78, 0.86, p);
  const gold = smooth(0.88, 0.91, p);
  markBox.style.opacity = appear.toFixed(3);
  if (!markParts) return;
  const off = (1 - join) * 900;                              // svg units (mark is 3184 wide)
  markParts.fr.setAttribute('transform', `translate(${-off} 0)`);
  markParts.fs.setAttribute('transform', `translate(${off} 0)`);
  const weave = p >= 0.83 ? 1 : 0;                            // the logo's over-under weave forms once locked
  markParts.full.style.opacity = (1 - weave).toFixed(3); markParts.woven.style.opacity = weave.toFixed(3);
  const plat = '#CFCAC4';
  markParts.rose.querySelectorAll('path').forEach((x) => x.setAttribute('fill', mix(plat, '#D98A94', tint)));
  markParts.arc.querySelectorAll('path').forEach((x) => x.setAttribute('fill', mix(plat, '#D98A94', tint)));
  markParts.sage.querySelectorAll('path').forEach((x) => x.setAttribute('fill', mix('#BDB8B2', '#9CAF88', tint)));
  markParts.fr.setAttribute('stroke', mix(plat, '#D98A94', tint)); markParts.fs.setAttribute('stroke', mix('#BDB8B2', '#9CAF88', tint));
  markParts.gold.style.opacity = gold.toFixed(3);
  markParts.gold.style.transformOrigin = '50% 50%'; markParts.gold.style.transformBox = 'fill-box';
  markParts.gold.style.transform = `scale(${lerp(0.4, 1, gold)})`;
}

frame();
