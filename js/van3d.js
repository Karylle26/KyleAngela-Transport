// Interactive 3D luxury MPV (V-Class style), built from simple shapes.
// Auto-rotates; drag (mouse or finger) to spin it.
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";

export function mountVan(container) {
  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 100);
  camera.position.set(7.2, 2.6, 7.2);
  camera.lookAt(0, 0.85, 0);

  // Lights: neutral key + warm gold rim to match the site
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(5, 8, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd6bb8a, 2.2);
  rim.position.set(-6, 3, -5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // ---------- Materials ----------
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x1c1c20, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.02, clearcoat: 1, envMapIntensity: 2.2 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.22 });
  const headlight = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: 2.2 });
  const taillight = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 1.4 });

  const van = new THREE.Group();
  const WIDTH = 1.86;

  // ---------- Body: side profile extruded across the width ----------
  const ARCH_R = 0.47, WHEEL_X = 1.62, WHEEL_Y = 0.37;
  const body = new THREE.Shape();
  body.moveTo(-2.5, 0.36);
  body.lineTo(-2.58, 0.55);
  body.lineTo(-2.56, 1.62);
  body.quadraticCurveTo(-2.54, 1.9, -2.3, 1.92);
  body.lineTo(0.85, 1.93);
  body.quadraticCurveTo(1.05, 1.92, 1.15, 1.84);
  body.lineTo(1.78, 1.24);                       // windscreen
  body.quadraticCurveTo(1.86, 1.16, 2.0, 1.12);
  body.lineTo(2.42, 1.0);                        // short bonnet
  body.quadraticCurveTo(2.6, 0.95, 2.62, 0.78);
  body.lineTo(2.6, 0.45);
  body.quadraticCurveTo(2.58, 0.36, 2.45, 0.36);
  body.lineTo(WHEEL_X + ARCH_R, 0.36);
  body.absarc(WHEEL_X, WHEEL_Y, ARCH_R, 0, Math.PI, false);
  body.lineTo(-WHEEL_X + ARCH_R, 0.36);
  body.absarc(-WHEEL_X, WHEEL_Y, ARCH_R, 0, Math.PI, false);
  body.lineTo(-2.5, 0.36);

  const bevel = 0.09;
  const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: WIDTH - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 32 });
  bodyGeo.translate(0, 0, -(WIDTH - bevel * 2) / 2);
  van.add(new THREE.Mesh(bodyGeo, paint));

  // ---------- Glasshouse: a slightly wider dark band ----------
  const g = new THREE.Shape();
  g.moveTo(-2.42, 1.2);
  g.lineTo(-2.44, 1.66);
  g.quadraticCurveTo(-2.42, 1.8, -2.25, 1.81);
  g.lineTo(0.82, 1.82);
  g.quadraticCurveTo(0.98, 1.81, 1.06, 1.75);
  g.lineTo(1.66, 1.24);
  g.lineTo(1.4, 1.2);
  g.lineTo(-2.42, 1.2);
  const glassGeo = new THREE.ExtrudeGeometry(g, { depth: WIDTH + 0.02, bevelEnabled: false, curveSegments: 16 });
  glassGeo.translate(0, 0, -(WIDTH + 0.02) / 2);
  van.add(new THREE.Mesh(glassGeo, glass));

  // Pillars (body colour) splitting the side windows
  [[0.95, 0.07, -0.42], [-0.15, 0.09, 0], [-1.35, 0.09, 0]].forEach(([x, w, tilt]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.62, WIDTH + 0.05), paint);
    p.position.set(x, 1.51, 0);
    p.rotation.z = tilt;
    van.add(p);
  });

  // Chrome strip under the windows + sliding-door rail
  const strip = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.025, WIDTH + 0.06), chrome);
  strip.position.set(-0.45, 1.2, 0);
  van.add(strip);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, WIDTH + 0.04), plastic);
  rail.position.set(-1.0, 1.3, 0);
  van.add(rail);

  // Door handles
  [0.75, -0.35].forEach(x => {
    [-1, 1].forEach(s => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.03), chrome);
      h.position.set(x, 1.05, s * (WIDTH / 2 + 0.01));
      van.add(h);
    });
  });

  // ---------- Front: grille, lights, bumper ----------
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 1.0), plastic);
  grille.position.set(2.69, 0.78, 0);
  van.add(grille);
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.96), chrome);
    slat.position.set(2.725, 0.68 + i * 0.1, 0);
    van.add(slat);
  }
  const badge = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 12, 40), chrome);
  badge.position.set(2.735, 0.78, 0);
  badge.rotation.y = Math.PI / 2;
  van.add(badge);
  [-1, 1].forEach(s => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.46), headlight);
    hl.position.set(2.6, 0.95, s * 0.62);
    hl.rotation.z = -0.25;
    van.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.12), taillight);
    tl.position.set(-2.665, 1.3, s * 0.78);
    van.add(tl);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.2), paint);
    mirror.position.set(1.55, 1.25, s * (WIDTH / 2 + 0.09));
    van.add(mirror);
  });
  // Rear window and rear bumper
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 1.42), glass);
  rearGlass.position.set(-2.655, 1.5, 0);
  van.add(rearGlass);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 1.7), plastic);
  rearBumper.position.set(-2.64, 0.5, 0);
  van.add(rearBumper);
  const rearHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.3), chrome);
  rearHandle.position.set(-2.675, 1.12, 0);
  van.add(rearHandle);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 1.5), plastic);
  bumper.position.set(2.68, 0.48, 0);
  van.add(bumper);

  // ---------- Wheels ----------
  const tireGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 40);
  const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.27, 40);
  const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.29, 20);
  const spokeGeo = new THREE.BoxGeometry(0.06, 0.03, 0.46);
  [WHEEL_X, -WHEEL_X].forEach(x => {
    [-1, 1].forEach(s => {
      const wheel = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, rubber);
      const rimM = new THREE.Mesh(rimGeo, plastic);
      const hub = new THREE.Mesh(hubGeo, chrome);
      wheel.add(tire, rimM, hub);
      // Spokes lie flat on the outer face of the rim (wheel axis is local Y)
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(spokeGeo, rimMat);
        sp.position.y = 0.13 * s;
        sp.rotation.y = (i / 5) * Math.PI;
        wheel.add(sp);
      }
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, WHEEL_Y, s * (WIDTH / 2 - 0.08));
      van.add(wheel);
    });
  });

  // ---------- Soft ground shadow ----------
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.85)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  scene.add(shadow);

  // Gold ring on the floor (turntable)
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.25, 3.28, 128), new THREE.MeshBasicMaterial({ color: 0xd6bb8a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);

  scene.add(van);
  container.__van = van; // handy for debugging
  van.rotation.y = 0.15;

  // ---------- Interaction: drag to rotate, gentle auto-spin ----------
  let dragging = false, lastX = 0, velocity = 0, idle = 0;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.style.cursor = "grab";
  el.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; });
  el.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    velocity = dx * 0.01;
    van.rotation.y += velocity;
    idle = 0;
  });
  const end = () => { dragging = false; el.style.cursor = "grab"; };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(container);

  function resize() {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    // Pull the camera back on narrow screens so the whole van fits
    const dist = camera.aspect < 1.1 ? 15 : 12;
    camera.position.set(dist * 0.7, dist * 0.26, dist * 0.7);
    camera.lookAt(0, 0.85, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    if (!dragging) {
      velocity *= 0.92;
      van.rotation.y += velocity;
      idle += dt;
      if (!reduceMotion && idle > 1.2) van.rotation.y += dt * 0.35;
    }
    renderer.render(scene, camera);
  });
}
