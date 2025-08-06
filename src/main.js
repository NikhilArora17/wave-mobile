import * as THREE from 'three';
import { Noise } from 'noisejs';

const noise = new Noise();

let scene, camera, renderer;
const lines = [];
const lineCount = 50;
const segmentCount = 200;
const width = window.innerWidth;
const height = window.innerHeight;

const sharedLeftX = -width / 1.5;
const sharedRightX = width / 1.5;

// 🛠️ Control parameters
const bendStrength = 0.08;
const maxDist = width / 0.5;

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
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff);

  const material = new THREE.LineBasicMaterial({
    color: 0x6C6F7C,
    transparent: true,
    opacity: 0.3,
  });

  for (let i = 0; i < lineCount; i++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(segmentCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Line(geometry, material.clone());
    line.userData.index = i;
    lines.push(line);
    scene.add(line);
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.00035;

  lines.forEach((line, lineIndex) => {
    const geometry = line.geometry;
    const positions = geometry.attributes.position.array;

    const baseY = 0;
    const amplitude = 170 + lineIndex * 32;

    const verticalOffset = Math.sin(t + lineIndex * 1.2) * 10;
    const freqOffset = 0.4 + lineIndex * 0.05;
    const timeOffset = lineIndex * 0.07;

    const p0 = new THREE.Vector3(sharedLeftX, baseY + verticalOffset, 0);
    const p4 = new THREE.Vector3(sharedRightX, baseY + verticalOffset, 0);

    const midPoints = [];
    for (let j = 0; j < 3; j++) {
      let x = sharedLeftX + ((j + 1) / 3) * (sharedRightX - sharedLeftX);
      let y = baseY + verticalOffset + noise.perlin2(j * freqOffset, t + timeOffset) * amplitude;

      // Warp x inward toward center
     x *= (2 - bendStrength);


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

    // Fade line opacity based on distance of center segment to middle (halo effect)
    const centerIndex = Math.floor(segmentCount / 2);
    const cx = curvePoints[centerIndex].x;
    const distToCenter = Math.abs(cx);
    const fade = 1.0 - Math.min(distToCenter / maxDist, 1);

    line.material.opacity = 0.1 + 0.35 * Math.sin(t * 4 + lineIndex * 0.4) * fade;
  });

  renderer.render(scene, camera);
}