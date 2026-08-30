// ===========================================================
//  🏰 성 안의 껍데기 — 바닥 · 벽 · 천장 · 창문 · 나가는 문
//
//  ★ 그림(무늬)은 전부 Canvas로 그린다. 인터넷에서 받아오지 않는다.
//  ★ 벽·천장은 "안쪽만 보이는 판"이라서, 카메라가 방 밖으로 나가도
//    벽에 가려지지 않고 방 안이 그대로 보인다.
// ===========================================================
import * as THREE from 'three';
import { C, part, canvasTex, makeHeart } from './castle-props.js';
import { HALF_X, HALF_Z, HEIGHT, FLOOR2 } from './castle-layout.js';

// -----------------------------------------------------------
//  바닥 무늬 — 분홍·크림 체크
// -----------------------------------------------------------
function floorTexture(repeat) {
  const tex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#fdf3ea'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#e9d6f0'; ctx.fillRect(0, 0, s / 2, s / 2);
    ctx.fillStyle = '#e9d6f0'; ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
    ctx.strokeStyle = '#d8c2e6'; ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, s - 3, s - 3);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

// -----------------------------------------------------------
//  벽지 — 위는 크림색, 아래는 분홍 줄무늬, 사이에 금색 띠
// -----------------------------------------------------------
function wallTexture() {
  const tex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#fff4e6'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#ffd9e8'; ctx.fillRect(0, s * 0.62, s, s);
    ctx.fillStyle = '#ffb8d4'; ctx.fillRect(0, s * 0.60, s, s * 0.03);
    ctx.fillStyle = '#ffd45e'; ctx.fillRect(0, s * 0.575, s, s * 0.02);
    ctx.fillStyle = '#ffc6dd';
    for (let i = 0; i < 8; i++) ctx.fillRect(i * s / 8 + 6, s * 0.66, 10, s * 0.3);
    ctx.fillStyle = '#ffe3ef';
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 40, y = 40 + (i % 2) * 50;
      ctx.beginPath(); ctx.arc(x - 7, y, 8, 0, 7); ctx.arc(x + 7, y, 8, 0, 7);
      ctx.moveTo(x - 15, y + 3); ctx.lineTo(x, y + 22); ctx.lineTo(x + 15, y + 3);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** 스테인드글라스 — 꽃잎 모양 유리창 그림 */
function glassTexture() {
  return canvasTex(256, (ctx, s) => {
    const c = s / 2;
    ctx.fillStyle = '#7fd4ff'; ctx.fillRect(0, 0, s, s);
    const petals = ['#ff9ec4', '#ffd45e', '#a8ead8', '#c9b4ff', '#ff7a9c', '#8fd0ff'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = petals[i];
      ctx.beginPath();
      const a = (i / 6) * Math.PI * 2;
      ctx.ellipse(c + Math.cos(a) * 62, c + Math.sin(a) * 62, 52, 34, a, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#fff6c0';
    ctx.beginPath(); ctx.arc(c, c, 38, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5b3d8f'; ctx.lineWidth = 7;
    ctx.strokeRect(4, 4, s - 8, s - 8);
    ctx.beginPath(); ctx.arc(c, c, 38, 0, 7); ctx.stroke();
  });
}

/** 반짝이 한 알 그림 */
export function sparkleTexture() {
  return canvasTex(64, (ctx, s) => {
    const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,235,180,0.8)');
    grd.addColorStop(1, 'rgba(255,200,240,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
  });
}

// -----------------------------------------------------------
//  껍데기 만들기
// -----------------------------------------------------------
/** 성 안의 바닥·벽·천장·창문·문을 만들어 scene에 넣는다. 벽 장애물을 돌려준다. */
export function buildShell(scene) {
  const obstacles = [];

  // --- 1층 바닥 ---
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2),
    new THREE.MeshToonMaterial({ map: floorTexture(HALF_X) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 벽 4장 (안쪽만 보이는 판) ---
  const wallMat = new THREE.MeshToonMaterial({ map: wallTexture() });
  const walls = [
    { x: 0, z: -HALF_Z, ry: 0,            w: HALF_X * 2 },   // 북 (왕좌)
    { x: 0, z:  HALF_Z, ry: Math.PI,      w: HALF_X * 2 },   // 남 (나가는 문)
    { x: -HALF_X, z: 0, ry: Math.PI / 2,  w: HALF_Z * 2 },   // 서
    { x:  HALF_X, z: 0, ry: -Math.PI / 2, w: HALF_Z * 2 },   // 동
  ];
  for (const w of walls) {
    const mat = wallMat.clone();
    mat.map = wallMat.map.clone();
    mat.map.repeat.set(w.w / 10, HEIGHT / 10);
    mat.map.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, HEIGHT), mat);
    m.position.set(w.x, HEIGHT / 2, w.z);
    m.rotation.y = w.ry;
    m.receiveShadow = true;
    scene.add(m);
  }

  // --- 천장 (아래쪽만 보이는 판) + 금색 별 ---
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2),
    new THREE.MeshToonMaterial({ color: 0xb9a4e8 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = HEIGHT;
  scene.add(ceil);
  for (let i = 0; i < 26; i++) {
    const s = part('oct', C.gold, (Math.random() - 0.5) * HALF_X * 1.8, HEIGHT - 0.6,
                   (Math.random() - 0.5) * HALF_Z * 1.8, 0.6 + Math.random() * 0.5);
    s.castShadow = false;
    scene.add(s);
  }

  // --- 스테인드글라스 창문 ---
  //   1층 창과 2층 창을 같이 낸다 (2층에서 창밖을 볼 수 있다)
  const glassMat = new THREE.MeshBasicMaterial({ map: glassTexture() });
  const winGeo = new THREE.PlaneGeometry(5, 7);
  for (const s of [-1, 1]) {
    for (const z of [-30, -6, 18, 34]) {
      for (const y of [4.6, 12.6]) {
        const w = new THREE.Mesh(winGeo, glassMat);
        w.position.set(s * (HALF_X - 0.15), y, z);
        w.rotation.y = s * -Math.PI / 2;
        scene.add(w);
      }
    }
  }
  // 왕좌 뒤 큰 장미창
  const rose = new THREE.Mesh(new THREE.CircleGeometry(6.5, 32), glassMat);
  rose.position.set(0, 12.5, -HALF_Z + 0.15);
  scene.add(rose);

  // --- 창문에서 들어오는 빛기둥 ---
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xfff3c8, transparent: true, opacity: 0.14, depthWrite: false,
  });
  for (const s of [-1, 1]) {
    for (const z of [-30, -6]) {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(5, 20), shaftMat);
      shaft.position.set(s * (HALF_X - 6), 8, z);
      shaft.rotation.y = s * -Math.PI / 2;
      shaft.rotation.x = 0.5;
      scene.add(shaft);
    }
  }

  // --- 남쪽 벽의 나가는 문 (바깥 햇빛이 들어온다) ---
  const doorway = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 8.5),
    new THREE.MeshBasicMaterial({ color: 0xdff3ff })
  );
  doorway.position.set(0, 4.2, HALF_Z - 0.12);
  doorway.rotation.y = Math.PI;
  scene.add(doorway);
  const arch = new THREE.Mesh(
    new THREE.RingGeometry(3.0, 3.9, 24, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: C.gold, side: THREE.DoubleSide })
  );
  arch.position.set(0, 8.4, HALF_Z - 0.1);
  arch.rotation.y = Math.PI;
  scene.add(arch);
  const heart = makeHeart(C.red, 1.1);
  heart.position.set(0, 10.4, HALF_Z - 0.3);
  heart.rotation.y = Math.PI;
  scene.add(heart);

  // --- 벽 뒤로 못 나가게 ---
  obstacles.push({ x: 0, z: -HALF_Z - 1, hw: HALF_X + 2, hd: 1 });
  obstacles.push({ x: 0, z:  HALF_Z + 1, hw: HALF_X + 2, hd: 1 });
  obstacles.push({ x: -HALF_X - 1, z: 0, hw: 1, hd: HALF_Z + 2 });
  obstacles.push({ x:  HALF_X + 1, z: 0, hw: 1, hd: HALF_Z + 2 });

  return { obstacles };
}

// -----------------------------------------------------------
//  ✨ 공중에 떠다니는 반짝이
// -----------------------------------------------------------
export function buildSparkles(scene, count = 140) {
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * HALF_X * 1.9;
    pos[i * 3 + 1] = Math.random() * HEIGHT;
    pos[i * 3 + 2] = (Math.random() - 0.5) * HALF_Z * 1.9;
    speed[i] = 0.3 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    map: sparkleTexture(), size: 0.42, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })));

  return (dt, t) => {
    const a = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = a.array[i * 3 + 1] + speed[i] * dt;
      if (y > HEIGHT) y = 0;
      a.array[i * 3 + 1] = y;
      a.array[i * 3] += Math.sin(t * 0.6 + i) * dt * 0.3;
    }
    a.needsUpdate = true;
  };
}

// FLOOR2는 다른 파일이 쓰라고 그대로 다시 내보낸다
export { FLOOR2 };
