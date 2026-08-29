// ===========================================================
//  놀이터 — 미끄럼틀, 그네, 시소, 모래밭
//  그네와 시소는 저절로 움직인다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  아이가 바꿔볼 수 있는 값들 (색깔과 흔들리는 속도)
// -----------------------------------------------------------
const SAND_RADIUS  = 10;    // 모래밭 크기
const SWING_SPEED  = 1.6;   // 그네가 흔들리는 속도
const SEESAW_SPEED = 1.2;   // 시소가 움직이는 속도

const M = {
  sand:  new THREE.MeshToonMaterial({ color: 0xf7e3b0 }),
  pole:  new THREE.MeshToonMaterial({ color: 0xa8e0ff }),
  wood:  new THREE.MeshToonMaterial({ color: 0xd9a066 }),
  slide: new THREE.MeshToonMaterial({ color: 0xffd93d }),
  rail:  new THREE.MeshToonMaterial({ color: 0xff9ec4 }),
  roof:  new THREE.MeshToonMaterial({ color: 0xc3b1f5 }),
  rope:  new THREE.MeshToonMaterial({ color: 0xb5794f }),
  seatA: new THREE.MeshToonMaterial({ color: 0xff8fc0 }),
  seatB: new THREE.MeshToonMaterial({ color: 0x6ddf6d }),
};

const G = {
  box:  new THREE.BoxGeometry(1, 1, 1),
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 12),
  disc: new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
};

function mesh(geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// --- 미끄럼틀 ---
const RAMP_TILT = 0.51;   // 미끄럼판 기울기

function makeSlide() {
  const g = new THREE.Group();

  // 발판을 받치는 기둥 4개
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(mesh(G.cyl, M.pole, sx * 1.2, 1.55, sz * 1.2, 0.35, 3.1, 0.35));
    }
  }
  g.add(mesh(G.box, M.wood, 0, 3.2, 0, 3.2, 0.3, 3.2));      // 올라가는 발판

  // 미끄럼판 (+z 쪽으로 비스듬히 내려간다)
  const ramp = mesh(G.box, M.slide, 0, 1.7, 2.5, 1.7, 0.25, 5.9);
  ramp.rotation.x = RAMP_TILT;
  g.add(ramp);
  for (const s of [-1, 1]) {                                  // 양쪽 난간
    const rail = mesh(G.box, M.rail, s * 0.85, 2.0, 2.5, 0.2, 0.5, 5.9);
    rail.rotation.x = RAMP_TILT;
    g.add(rail);
  }

  // 뒤쪽 사다리
  for (const s of [-1, 1]) {
    g.add(mesh(G.cyl, M.pole, s * 0.7, 1.75, -1.9, 0.18, 3.5, 0.18));
  }
  for (let i = 0; i < 4; i++) {
    g.add(mesh(G.box, M.wood, 0, 0.7 + i * 0.8, -1.9, 1.6, 0.16, 0.3));
  }

  // 알록달록 지붕
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(mesh(G.cyl, M.pole, sx * 1.2, 3.9, sz * 1.2, 0.2, 1.2, 0.2));
    }
  }
  const roof = mesh(G.cone, M.roof, 0, 5.2, 0, 4.2, 1.8, 4.2);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

// --- 그네 2개 ---
const BAR_Y = 3.4;   // 가로대 높이

function makeSwings() {
  const g = new THREE.Group();
  const swings = [];

  for (const s of [-1, 1]) {
    g.add(mesh(G.cyl, M.pole, s * 2.8, BAR_Y / 2, 0, 0.3, BAR_Y, 0.3));
  }
  const bar = mesh(G.cyl, M.pole, 0, BAR_Y, 0, 0.25, 6, 0.25);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);

  for (let i = 0; i < 2; i++) {
    const sw = new THREE.Group();                  // 가로대에 매달린 그네 하나
    sw.position.set(i === 0 ? -1.3 : 1.3, BAR_Y, 0);
    for (const s of [-1, 1]) {
      sw.add(mesh(G.cyl, M.rope, s * 0.45, -1.1, 0, 0.07, 2.2, 0.07));   // 줄
    }
    sw.add(mesh(G.box, i === 0 ? M.seatA : M.seatB, 0, -2.25, 0, 1.3, 0.2, 0.7));
    sw.userData.phase = i * 1.4;                   // 두 그네가 엇갈리게 흔들리도록
    g.add(sw);
    swings.push(sw);
  }

  g.userData.swings = swings;
  return g;
}

// --- 시소 ---
function makeSeesaw() {
  const g = new THREE.Group();
  g.add(mesh(G.cone, M.pole, 0, 0.55, 0, 1.6, 1.1, 1.6));    // 가운데 받침

  const plank = new THREE.Group();                            // 널빤지 (이게 움직인다)
  plank.position.y = 1.15;
  plank.add(mesh(G.box, M.wood, 0, 0, 0, 0.9, 0.22, 6.4));
  for (const s of [-1, 1]) {
    plank.add(mesh(G.box, s < 0 ? M.seatA : M.seatB, 0, 0.26, s * 2.6, 1.0, 0.3, 0.9));
    plank.add(mesh(G.cyl, M.pole, 0, 0.62, s * 1.75, 0.18, 0.9, 0.18));   // 손잡이
  }
  g.add(plank);

  g.userData.plank = plank;
  return g;
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/**
 * 놀이터를 만든다. (x, z)는 마을 안에서 놀이터가 놓일 자리.
 * { group, obstacles, update } 를 돌려준다.
 *   obstacles: 부딪히는 물건 목록 (마을 좌표 기준)
 */
export function buildPlayground(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // 바닥 모래밭
  const sand = mesh(G.disc, M.sand, 0, 0.06, 0, SAND_RADIUS * 2, 0.12, SAND_RADIUS * 2);
  sand.castShadow = false;
  group.add(sand);

  const slide = makeSlide();
  slide.position.set(-4.5, 0, -3);
  group.add(slide);

  const swings = makeSwings();
  swings.position.set(5.5, 0, -1);
  group.add(swings);

  const seesaw = makeSeesaw();
  seesaw.position.set(-1, 0, 6);
  group.add(seesaw);

  // 부딪히는 곳만 골라서 등록 (미끄럼판은 지나갈 수 있게 둔다)
  const obstacles = [
    { x: x - 4.5, z: z - 3, r: 1.9 },              // 미끄럼틀 기둥
    { x: x + 5.5 - 2.8, z: z - 1, r: 0.45 },       // 그네 기둥 왼쪽
    { x: x + 5.5 + 2.8, z: z - 1, r: 0.45 },       // 그네 기둥 오른쪽
    { x: x - 1, z: z + 6, r: 1.1 },                // 시소 받침
  ];

  function update(t) {
    for (const sw of swings.userData.swings) {
      sw.rotation.x = Math.sin(t * SWING_SPEED + sw.userData.phase) * 0.5;
    }
    seesaw.userData.plank.rotation.x = Math.sin(t * SEESAW_SPEED) * 0.22;
  }

  return { group, obstacles, update };
}
