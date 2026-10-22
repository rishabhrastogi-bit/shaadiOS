// "Inside the ring": platinum rings lock, the camera flies through one ring into a dark tunnel of
// moments. Photos drain from warm colour to grey as the relationship drifts; the tunnel ends in a
// glowing ring that opens into warm light, where the rings lock again. Scroll drives the camera.
// ?p=0.5 freezes the story at a point; ?p=1.5 shows the content half a screen below the story (previews).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = innerWidth < 860, small = Math.min(innerWidth, innerHeight) < 700;
const NIGHT = new THREE.Color(0x0B0A0C), CREAM = new THREE.Color(0xF6F0EA);

// ---------- renderer, scene, camera
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(NIGHT);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(NIGHT.clone(), 6, 24);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const camera = new THREE.PerspectiveCamera(narrow ? 58 : 40, innerWidth / innerHeight, 0.05, 120);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 5, 6); scene.add(key);
const lamp = new THREE.PointLight(0xffe2c0, 30, 16, 1.6); scene.add(lamp);          // travels with the camera

// ---------- platinum rings
const R = 1.25, TUBE = 0.19;
const ringGeo = new THREE.TorusGeometry(R, TUBE, 96, 260);
const platinum = () => new THREE.MeshPhysicalMaterial({ color: 0xE6E4E1, metalness: 1, roughness: 0.17, clearcoat: 0.6, clearcoatRoughness: 0.1 });
function ringPair() {
  const a = new THREE.Mesh(ringGeo, platinum()), b = new THREE.Mesh(ringGeo, platinum());
  b.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(a, b); scene.add(g); return { g, a, b };
}
const start = ringPair();                         // the opening pair (camera flies through ring a)
const finale = ringPair();                        // the pair waiting in the light at the end
finale.g.position.set(0, narrow ? -1.5 : -1.15, -79); finale.a.position.x = -0.6; finale.b.position.x = 0.6;
const A_HOME = new THREE.Vector3(-0.6, 0, 0), B_HOME = new THREE.Vector3(0.6, 0, 0);

const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(true), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(glint);

// ---------- the tunnel: thin platinum hoops, gold dust, photo stations
const hoopGeo = new THREE.TorusGeometry(3.4, 0.018, 12, 220);
const hoops = [];
for (let i = 0; i < 11; i++) {
  const m = new THREE.Mesh(hoopGeo, new THREE.MeshStandardMaterial({ color: 0xdcd6cf, metalness: 1, roughness: 0.3, emissive: 0x6b5a45, emissiveIntensity: 0.4 }));
  m.position.set(0, 0, -4.5 - 7 * i); m.rotation.z = i * 0.3; scene.add(m); hoops.push(m);
}
const portal = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.09, 24, 260), new THREE.MeshBasicMaterial({ color: 0xFFE6C4 }));
portal.position.set(0, 0, -71.5); scene.add(portal);
const portalGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(false), color: 0xFFE2BC, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
portalGlow.position.set(0, 0, -72); portalGlow.scale.set(14, 14, 1); scene.add(portalGlow);

const N = small ? 700 : 1400, pos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 3.6;
  pos[i*3] = Math.cos(a) * r; pos[i*3+1] = Math.sin(a) * r; pos[i*3+2] = 8 - Math.random() * 90;
}
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.03, color: 0xE8C875, map: glowTexture(false), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

// photo stations, z every 7 units; colour drains as the relationship drifts
const STATIONS = [
  { img: 'promise',      side: -1, sat: 1.00 },
  { img: 'married',      side: +1, sat: 0.85 },
  { img: 'apart',        side: -1, sat: 0.62 },
  { img: 'overwhelmed',  side: +1, sat: 0.45 },
  { img: 'thinking',     side: -1, sat: 0.30 },
  null,                                              // statistic
  { img: 'alone',        side: +1, sat: 0.16 },
  null,                                              // statistic
  { img: 'coparent-dad', side: -1, sat: 0.08 },
];
const photoVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const photoFrag = `
  uniform sampler2D map; uniform float sat, opacity, aspect, warmth; varying vec2 vUv;
  float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main(){
    vec4 c = texture2D(map, vUv);
    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    vec3 g = mix(vec3(l), c.rgb, sat);
    g *= mix(vec3(0.86, 0.93, 1.08), vec3(1.07, 0.99, 0.9), warmth);
    float v = smoothstep(0.95, 0.25, distance(vUv, vec2(0.5)));
    g *= mix(0.5, 1.0, v);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    float a = 1.0 - smoothstep(0.0, 0.006, rbox(p, vec2(aspect * 0.5, 0.5), 0.05));
    gl_FragColor = vec4(g, opacity * a);
    #include <colorspace_fragment>
  }`;
const loader = new THREE.TextureLoader();
const photos = [];
STATIONS.forEach((s, i) => {
  if (!s) return;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, sat: { value: s.sat }, opacity: { value: 0 }, aspect: { value: 1.5 }, warmth: { value: s.sat } },
    vertexShader: photoVert, fragmentShader: photoFrag, transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const tex = loader.load(`img/${s.img}.jpg`, (t) => {
    const aspect = t.image.width / t.image.height, h = narrow ? 1.7 : 2.0;
    mesh.scale.set(h * aspect, h, 1); mat.uniforms.aspect.value = aspect;
  });
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; mat.uniforms.map.value = tex;
  const z = -8 - 7 * i;
  mesh.userData = { z, seed: i };
  mesh.position.set(narrow ? 0 : s.side * 1.75, narrow ? 0.75 : 0.1, z);
  mesh.rotation.y = narrow ? 0 : -s.side * 0.32;
  scene.add(mesh); photos.push(mesh);
});

// ---------- helpers
function glowTexture(star) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(star ? 0.12 : 0.35, 'rgba(255,245,230,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  if (star) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- scroll
const story = document.getElementById('story'), wrap = document.getElementById('wrap'), bar = document.querySelector('.bar');
const prog = document.querySelector('.progress span'), vignette = document.querySelector('.vignette');
let target = 0, p = 0, frozen = false, scrollPos = 0;
const storyRange = () => story.offsetHeight - innerHeight;
function readScroll() {
  if (frozen) return;
  scrollPos = scrollY; target = clamp(scrollPos / storyRange());
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (clamp(scrollPos / max) * 100).toFixed(1) + '%';
  bar.classList.toggle('solid', scrollPos > storyRange() - 40);
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); readScroll(); });

// ---------- captions (fixed overlay, faded by camera distance)
const caps = [...document.querySelectorAll('.cap')].map((el) => ({ el, z: +el.dataset.z, span: +(el.dataset.span || 3), hero: el.classList.contains('hero') }));
const logo = document.querySelector('.brand img'), captions = document.querySelector('.captions');
let frozenBeyond = false;

// ---------- timeline: camera z runs 7 -> -73.5 over the story
const Z0 = 7, Z1 = -73.5, look = new THREE.Vector3(), bg = new THREE.Color(), off = new THREE.Vector3();
const camZ = (p) => lerp(Z0, Z1, p);
function update(p, t) {
  const z = camZ(p), intro = ease(clamp(t / (reduce ? 0.001 : 2.8)));

  // opening rings glide in and lock; they rest low so the headline breathes, then rise to meet us
  const away = 1 - intro, spin = away * 3.2;
  start.a.position.copy(A_HOME).add(off.set(-5.5 * away, 0.6 * away, -2 * away));
  start.b.position.copy(B_HOME).add(off.set(5.5 * away, -0.6 * away, -2 * away));
  start.a.rotation.set(spin * 0.4, spin, 0); start.b.rotation.set(Math.PI / 2 + spin * 0.3, -spin, 0);
  const approach = smooth(7, 1.5, z);
  start.g.rotation.y = (1 - approach) * (0.35 + Math.sin(t * 0.25) * 0.12) * intro;
  start.g.rotation.x = (1 - approach) * 0.12;
  start.g.position.y = lerp(narrow ? -1.85 : -1.0, 0, approach);
  glint.position.copy(start.a.position).add(off.set(0.62, 0.05, 0.3)).applyEuler(start.g.rotation).add(start.g.position);
  glint.material.opacity = clamp((intro - 0.85) / 0.15) * (1 - approach) * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.3)));

  // camera: line up with ring a's centre (above ring b's tube), pass through, settle mid-tunnel
  const lineUp = smooth(7, 2, z), settle = smooth(-3, -9, z);
  const cx = lerp(lerp(0.3, A_HOME.x, lineUp), 0, settle), cy = lerp(lerp(0.35, 0.42, lineUp), 0, settle);
  camera.position.set(cx + Math.sin(t * 0.3) * 0.03, cy + Math.cos(t * 0.25) * 0.03, z);
  look.set(cx, cy, z - 10);
  if (lineUp < 1) look.lerp(new THREE.Vector3(0, start.g.position.y, 0), 1 - lineUp);
  camera.lookAt(look);
  lamp.position.set(0, 0.6, z - 2);

  // tunnel: photos rise out of the dark, float, and fade as we pass
  photos.forEach((m) => {
    const d = z - m.userData.z;
    m.material.uniforms.opacity.value = smooth(10.5, 7.5, d) * smooth(2.2, 4.2, d);
    m.position.y = (narrow ? 0.75 : 0.1) + Math.sin(t * 0.5 + m.userData.seed) * 0.05;
  });
  hoops.forEach((h, i) => { h.rotation.z = i * 0.3 + t * 0.04 * (i % 2 ? 1 : -1); });
  dust.rotation.z = t * 0.02;

  // the light at the end: the portal brightens as we approach, then night melts into cream
  const near = smooth(-60, -71, z), dawn = smooth(-71, -72.6, z);
  portalGlow.material.opacity = 0.25 + near * 0.75;
  portalGlow.scale.setScalar(10 + near * 10);
  const pass0 = Math.exp(-Math.pow(z / 0.7, 2));
  renderer.toneMappingExposure = 1.0 + pass0 * 0.8 + near * 0.3;
  bg.copy(NIGHT).lerp(CREAM, dawn); renderer.setClearColor(bg); scene.fog.color.copy(bg);
  scene.fog.far = lerp(24, 60, dawn);
  vignette.style.opacity = (1 - dawn).toFixed(3);
  portal.visible = portalGlow.visible = dawn < 0.99;
  finale.g.rotation.y = 0.35 + Math.sin(t * 0.3) * 0.12; finale.g.rotation.x = 0.12;
  const light = dawn > 0.5 || bar.classList.contains('solid');
  const want = light ? 'logo-horizontal.svg' : 'logo-horizontal-cream.svg';
  if (!logo.src.endsWith(want)) logo.src = want;
  bar.style.color = light ? '#2F2622' : '';

  // captions (fade away as the content slides up over the story)
  const leave = frozenBeyond ? 1 : smooth(storyRange() - innerHeight * 0.1, storyRange() + innerHeight * 0.4, scrollPos);
  captions.style.opacity = (1 - leave).toFixed(3);
  caps.forEach((c) => {
    let o = 1 - Math.abs(z - c.z) / c.span;
    if (c.hero && z >= c.z) o = 1;
    c.el.style.opacity = clamp(o).toFixed(3);
    c.el.style.setProperty('--dy', ((z - c.z) * 10).toFixed(1) + 'px');
  });
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
  target = p = Math.min(v, 1); bar.classList.toggle('solid', v > 1); frozenBeyond = v > 1;
}
function frame() {
  const t = reduce ? 10 : clock.getElapsedTime();
  p += (target - p) * (reduce ? 1 : 0.08);
  if (frozen || scrollPos < storyRange() + innerHeight) { update(p, t); renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}
frame();
