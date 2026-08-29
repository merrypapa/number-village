// ===========================================================
//  마을 만들기 — 바닥, 성, 집, 나무, 분수
//  Phase 3에서 무지개 다리 / 사탕 정원 / 숫자 언덕을 추가할 예정
// ===========================================================
import * as THREE from 'three';

export const WORLD_RADIUS = 90;   // 마을 반지름 (밖으로 못 나감)

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

/** 마을 전체를 만들어 scene에 추가한다. 스폰 위치를 돌려준다. */
export function buildWorld(scene) {
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
  const f = makeFountain();
  scene.add(f);

  // 성 (북쪽)
  const castle = makeCastle();
  castle.position.set(0, 0, -48);
  scene.add(castle);

  // 우리 집 (남쪽) — 아이가 색을 고를 수 있게 roofC
  const home = makeHouse(M.roofC, 7, 4.5, 7);
  home.position.set(0, 0, 34);
  home.userData.isHome = true;
  scene.add(home);

  // 친구들 집 6채 (광장 둘레)
  const roofs = [M.roofA, M.roofB, M.roofC];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    const h = makeHouse(roofs[i % 3]);
    h.position.set(Math.cos(a) * 38, 0, Math.sin(a) * 38);
    h.rotation.y = -a + Math.PI / 2;
    scene.add(h);
  }

  // 나무 40그루
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 26 + Math.random() * (WORLD_RADIUS - 30);
    const t = makeTree(Math.random() < 0.3);
    t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    t.scale.setScalar(0.8 + Math.random() * 0.5);
    t.rotation.y = Math.random() * 6;
    scene.add(t);
  }

  // 구름
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const clouds = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      c.add(mesh(G.ball, cloudMat, j * 4 - 4, Math.random() * 1.5, 0, 5 + Math.random() * 3));
    }
    c.position.set((Math.random() - 0.5) * 220, 40 + Math.random() * 20, (Math.random() - 0.5) * 220);
    clouds.add(c);
  }
  scene.add(clouds);

  return { spawn: new THREE.Vector3(0, 0, 14), clouds, home };
}
