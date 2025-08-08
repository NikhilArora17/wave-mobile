import * as THREE from 'three';
import { Noise } from 'noisejs';

const noise = new Noise();

let scene, camera, renderer;
const lines = [];
let lineCount = 50;
let segmentCount = 300;

let width = window.innerWidth;
let height = window.innerHeight;

let sharedLeftX = -width / 1.5;
let sharedRightX = width / 1.5;
let maxDist = width / 0.5;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.OrthographicCamera(
    -width / 2, width / 2,
    height / 2, -height / 2,
    1, 1000
  );
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: true
  });
  renderer.setSize(width, height);
  renderer.autoClearColor = false;
  renderer.setClearColor(0xffffff, 0.05);

  const material = new THREE.PointsMaterial({
    color: 0x6C6F7C,
    size: 2.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    map: createCircleTexture(),
    alphaTest: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < lineCount; i++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(segmentCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, material.clone());
    points.userData.index = i;
    lines.push(points);
    scene.add(points);
  }

  window.addEventListener('resize', onWindowResize);
}

function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function onWindowResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  sharedLeftX = -width / 1.5;
  sharedRightX = width / 1.5;
  maxDist = width / 0.5;

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.00032;

  renderer.clearColor();

  lines.forEach((points, lineIndex) => {
    const geometry = points.geometry;
    const positions = geometry.attributes.position.array;

    const baseY = 0;
    const amplitude = 150 + lineIndex * 30;

    const phaseShift = lineIndex * 0.2;
    const verticalOffset = Math.sin(t * 2 + phaseShift) * 12;
    const horizontalJitter = Math.sin(t * 1.5 + phaseShift) * 5;

    const p0 = new THREE.Vector3(sharedLeftX + horizontalJitter, baseY + verticalOffset, 0);
    const p4 = new THREE.Vector3(sharedRightX + horizontalJitter, baseY + verticalOffset, 0);

    const midPoints = [];
    for (let j = 0; j < 3; j++) {
      let x = sharedLeftX + ((j + 1) / 4) * (sharedRightX - sharedLeftX) + horizontalJitter;
      let y = baseY + verticalOffset + noise.perlin2(j * (0.4 + lineIndex * 0.05), t + lineIndex * 0.07) * amplitude;
      midPoints.push(new THREE.Vector3(x, y, 0));
    }

    const curve = new THREE.CatmullRomCurve3([p0, ...midPoints, p4]);
    const curvePoints = curve.getPoints(segmentCount - 1);

    for (let j = 0; j < segmentCount; j++) {
      const p = curvePoints[j];
      const idx = j * 3;
      positions[idx] = p.x;
      positions[idx + 1] = p.y;
      positions[idx + 2] = 0;
    }

    geometry.attributes.position.needsUpdate = true;

    const centerIndex = Math.floor(segmentCount / 2);
    const cx = curvePoints[centerIndex].x;
    const distToCenter = Math.abs(cx);
    const fade = 1.0 - Math.min(distToCenter / maxDist, 1);

    points.material.opacity = 0.25 + 0.35 * Math.sin(t * 4 + lineIndex * 0.4) * fade;
  });

  renderer.render(scene, camera);
}
