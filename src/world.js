// ===========================================================
//  마을 만들기 — 바닥, 성, 집, 나무, 분수, 놀이터
//  부딪히는 물건(장애물)도 여기서 같이 등록한다.
// ===========================================================
import * as THREE from 'three';
import { buildSky } from './sky.js';
import { buildPlayground } from './playground.js';

export const WORLD_RADIUS = 90;   // 마을 반지름 (밖으로 못 나감)

// 놀이터가 놓일 자리 ← 아이가 옮기고 싶으면 여기 숫자만 바꾸면 된다
const PLAYGROUND_POS = { x: 42, z: 40 };

const M = {
  grass:  new THREE.MeshToonMaterial({ color: 0x9fe08a }),
  path:   new THREE.MeshToonMaterial({ color: 0xf3e0c0 }),
  wall:   new THREE.MeshToonMaterial({ color: 0xfff3f8 }),
  roofA:  new THREE.MeshToonMaterial({ color: 0xff9ec4 }),
  roofB:  new THREE.MeshToonMaterial({ color: 0x8fd0ff }),
  roofC:  new THREE.MeshToonMaterial({ color: 0xc3b1f5 }),
  door:   new THREE.MeshToonMaterial({ color: 0xb5794f }),
  win:    new THREE.MeshToonMaterial({ color: 0xa8e6ff }),
  trunk:  new THREE.MeshToonMaterial({ color: 0xa9744f }),
  leafA:  new THREE.MeshToonMaterial({ color: 0x69c96b }),
  leafB:  new THREE.MeshToonMaterial({ color: 0xffb3d9 }),
  water:  new THREE.MeshToonMaterial({ color: 0x7fd4ff }),
  flag:   new THREE.MeshToonMaterial({ color: 0xffd93d }),
};

const G = {
  box:  new THREE.BoxGeometry(1, 1, 1),
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cone: new THREE.ConeGeometry(0.5, 1, 16),
  ball: new THREE.SphereGeometry(0.5, 14, 12),
};

function mesh(geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// --- 집 한 채 ---
function makeHouse(roofMat, w = 6, h = 4, d = 6) {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wall, 0, h / 2, 0, w, h, d));
  const roof = mesh(G.cone, roofMat, 0, h + 1.6, 0, w * 0.95, 3.2, d * 0.95);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(mesh(G.box, M.door, 0, 1.1, d / 2 + 0.05, 1.4, 2.2, 0.2));
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.win, s * w * 0.28, h * 0.65, d / 2 + 0.05, 1.2, 1.2, 0.2));
  }
  return g;
}

// --- 성 ---
function makeCastle() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wall, 0, 6, 0, 20, 12, 14));            // 본체
  const mainRoof = mesh(G.cone, M.roofA, 0, 15, 0, 16, 7, 12);
  mainRoof.rotation.y = Math.PI / 4;
  g.add(mainRoof);

  // 탑 4개
  const towers = [[-11, -8], [11, -8], [-11, 8], [11, 8]];
  for (const [x, z] of towers) {
    g.add(mesh(G.cyl, M.wall, x, 8, z, 5, 16, 5));
    g.add(mesh(G.cone, M.roofB, x, 19, z, 6.4, 7, 6.4));
    g.add(mesh(G.cyl, M.wall, x, 22.6, z, 0.3, 3, 0.3));      // 깃대
    g.add(mesh(G.box, M.flag, x + 0.9, 23.4, z, 1.8, 1.1, 0.1)); // 깃발
  }

  // 정문
  g.add(mesh(G.box, M.door, 0, 3, 7.1, 4.5, 6, 0.4));
  return g;
}

// --- 나무 ---
function makeTree(pink = false) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.trunk, 0, 1.6, 0, 0.7, 3.2, 0.7));
  const leafMat = pink ? M.leafB : M.leafA;
  g.add(mesh(G.ball, leafMat, 0, 4.2, 0, 3.4));
  g.add(mesh(G.ball, leafMat, 1.2, 3.4, 0.6, 2.2));
  g.add(mesh(G.ball, leafMat, -1.1, 3.6, -0.5, 2.0));
  return g;
}

// --- 분수 ---
function makeFountain() {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.wall, 0, 0.5, 0, 8, 1, 8));
  g.add(mesh(G.cyl, M.water, 0, 1.05, 0, 7.2, 0.2, 7.2));
  g.add(mesh(G.cyl, M.wall, 0, 2, 0, 1.2, 3, 1.2));
  g.add(mesh(G.ball, M.water, 0, 3.8, 0, 1.8));
  return g;
}

// -----------------------------------------------------------
//  부딪히기 (충돌)
//  장애물은 두 가지 모양만 쓴다:
//    동그란 것 { x, z, r }   /   네모난 것 { x, z, hw, hd }
// -----------------------------------------------------------
function pushOut(o, pos, radius) {
  const dx = pos.x - o.x;
  const dz = pos.z - o.z;

  if (o.hw !== undefined) {                       // 네모난 장애물 (성)
    const overlapX = o.hw + radius - Math.abs(dx);
    const overlapZ = o.hd + radius - Math.abs(dz);
    if (overlapX <= 0 || overlapZ <= 0) return;
    // 덜 밀어내도 되는 쪽으로 밀어낸다
    if (overlapX < overlapZ) pos.x += (dx >= 0 ? 1 : -1) * overlapX;
    else                     pos.z += (dz >= 0 ? 1 : -1) * overlapZ;
    return;
  }

  const min = o.r + radius;                       // 동그란 장애물
  const d = Math.hypot(dx, dz);
  if (d >= min) return;
  if (d < 0.001) { pos.x += min; return; }        // 정확히 한가운데면 옆으로 살짝
  pos.x = o.x + (dx / d) * min;
  pos.z = o.z + (dz / d) * min;
}

// -----------------------------------------------------------
//  마을 전체 만들기
// -----------------------------------------------------------
/** 마을을 만들어 scene에 추가한다. 스폰 위치와 부딪힘 함수를 돌려준다. */
export function buildWorld(scene) {
  const obstacles = [];        // 부딪히는 물건 목록
  const reserved = [];         // 나무를 심으면 안 되는 자리

  // 바닥
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 8, 48), M.grass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 중앙 광장(길)
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(22, 40), M.path);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // 분수
  scene.add(makeFountain());
  obstacles.push({ x: 0, z: 0, r: 4.2 });
  reserved.push({ x: 0, z: 0, r: 14 });

  // 성 (북쪽) — 탑까지 덮는 네모로 막는다
  const castle = makeCastle();
  castle.position.set(0, 0, -48);
  scene.add(castle);
  obstacles.push({ x: 0, z: -48, hw: 13.5, hd: 10.5 });
  reserved.push({ x: 0, z: -48, r: 22 });

  // 우리 집 (남쪽) — 아이가 색을 고를 수 있게 roofC
  const home = makeHouse(M.roofC, 7, 4.5, 7);
  home.position.set(0, 0, 34);
  home.userData.isHome = true;
  scene.add(home);
  obstacles.push({ x: 0, z: 34, r: 4.7 });
  reserved.push({ x: 0, z: 34, r: 10 });

  // 친구들 집 6채 (광장 둘레)
  const roofs = [M.roofA, M.roofB, M.roofC];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    const h = makeHouse(roofs[i % 3]);
    const hx = Math.cos(a) * 38, hz = Math.sin(a) * 38;
    h.position.set(hx, 0, hz);
    h.rotation.y = -a + Math.PI / 2;
    scene.add(h);
    obstacles.push({ x: hx, z: hz, r: 4.1 });
    reserved.push({ x: hx, z: hz, r: 9 });
  }

  // 놀이터
  const playground = buildPlayground(PLAYGROUND_POS.x, PLAYGROUND_POS.z);
  scene.add(playground.group);
  obstacles.push(...playground.obstacles);
  reserved.push({ x: PLAYGROUND_POS.x, z: PLAYGROUND_POS.z, r: 15 });

  // 나무 40그루 — 건물이나 놀이터 위에는 심지 않는다
  for (let i = 0; i < 40; i++) {
    let x = 0, z = 0, ok = false;
    for (let tryCount = 0; tryCount < 20 && !ok; tryCount++) {
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * (WORLD_RADIUS - 30);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      ok = reserved.every(s => Math.hypot(x - s.x, z - s.z) > s.r);
    }
    if (!ok) continue;

    const t = makeTree(Math.random() < 0.3);
    const s = 0.8 + Math.random() * 0.5;
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = Math.random() * 6;
    scene.add(t);
    obstacles.push({ x, z, r: 1.0 * s });
  }

  // 하늘 (구름 + 고래)
  const sky = buildSky(scene);

  /** 장애물을 뚫고 들어갔으면 바깥으로 밀어낸다. pos는 그 자리에서 고쳐진다. */
  function collide(pos, radius) {
    for (const o of obstacles) pushOut(o, pos, radius);
  }

  /** (x, z)가 장애물 안이면 true — NPC를 세울 자리를 고를 때 쓴다. */
  function isBlocked(x, z, radius) {
    for (const o of obstacles) {
      if (o.hw !== undefined) {
        if (Math.abs(x - o.x) < o.hw + radius && Math.abs(z - o.z) < o.hd + radius) return true;
      } else if (Math.hypot(x - o.x, z - o.z) < o.r + radius) {
        return true;
      }
    }
    return false;
  }

  /** 매 프레임 움직이는 것들 (구름, 고래, 그네, 시소) */
  function update(dt, t) {
    sky.update(dt, t);
    playground.update(t);
  }

  return { spawn: new THREE.Vector3(0, 0, 14), home, collide, isBlocked, update };
}
