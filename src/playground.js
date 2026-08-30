// ===========================================================
//  놀이터 — 미끄럼틀, 그네, 시소, 모래밭
//  그네와 시소는 저절로 움직이고,
//  ★ 그네와 미끄럼틀은 캐릭터가 진짜로 탈 수 있다 (src/rides.js).
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  아이가 바꿔볼 수 있는 값들 (색깔과 흔들리는 속도)
// -----------------------------------------------------------
const SAND_RADIUS  = 10;    // 모래밭 크기
const SWING_SPEED  = 1.6;   // 그네가 흔들리는 속도
const SEESAW_SPEED = 1.2;   // 시소가 움직이는 속도

// --- 타는 것과 관련된 값 ---
const SWING_IDLE_AMP = 0.5;   // 아무도 안 탈 때 그네가 흔들리는 크기
const SWING_RIDE_AMP = 1.0;   // 누가 타면 이만큼 크게 흔들린다 (신난다!)
const SWING_WARMUP   = 1.5;   // 크게 흔들리기까지 걸리는 빠르기
const SWING_TIME     = 10;    // 그네를 한 번 타는 시간(초) — 친구들은 이만큼 타고 내린다
const SLIDE_TIME     = 3.6;   // 미끄럼틀을 한 번 타는 시간(초)
const SIT_SINK       = 0.10;  // 의자에 앉을 때 살짝 파묻히는 정도

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

// a에서 b까지 u(0~1)만큼 간 값
function lerp(a, b, u) { return a + (b - a) * u; }

// --- 미끄럼틀 ---
const RAMP_TILT = 0.51;   // 미끄럼판 기울기
const DECK_Y    = 3.35;   // 올라가는 발판(맨 위)의 높이
const RAMP_END_Z = 5.05;  // 미끄럼판이 끝나는 자리 (미끄럼틀 기준 z)
const RAMP_END_Y = 0.45;  // 미끄럼판이 끝나는 높이

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
  //  ★ 지붕이 낮으면 발판 위에 올라선 친구의 머리가 지붕에 박힌다.
  //    가장 큰 친구(열이, 키 3.1)가 서도 닿지 않게 기둥을 길게 세웠다.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(mesh(G.cyl, M.pole, sx * 1.2, 4.95, sz * 1.2, 0.2, 3.3, 0.2));
    }
  }
  const roof = mesh(G.cone, M.roof, 0, 7.7, 0, 4.4, 2.2, 4.4);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  return g;
}

// --- 그네 2개 ---
//  ★ 가로대는 가장 큰 친구(열이, 키 3.1)가 의자 위에 올라서도 머리가 안 닿게 높였다.
//    BAR_Y를 낮추려면 ROPE_LEN도 같이 줄여서 (BAR_Y - ROPE_LEN)이 너무 높아지지 않게 할 것.
const BAR_Y     = 4.6;                 // 가로대 높이
const ROPE_LEN  = 3.35;                // 줄 길이 (길수록 의자가 낮게 내려온다)
const SEAT_DROP = ROPE_LEN - 0.10;     // 가로대에서 의자 앉는 면까지의 거리
const SEAT_GAP  = 4.2;                 // 그네 앞 어디에 서면 탈 수 있나 (흔들리는 의자에 안 맞게 넉넉히)

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
      sw.add(mesh(G.cyl, M.rope, s * 0.45, -ROPE_LEN / 2, 0, 0.07, ROPE_LEN, 0.07));   // 줄
    }
    sw.add(mesh(G.box, i === 0 ? M.seatA : M.seatB, 0, -ROPE_LEN, 0, 1.3, 0.2, 0.7));
    sw.userData.phase = i * 1.4;                   // 두 그네가 엇갈리게 흔들리도록
    sw.userData.amp = SWING_IDLE_AMP;              // 지금 흔들리는 크기
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
//  탈 수 있는 놀이기구 만들기
//  좌표는 전부 "마을 좌표"다 (놀이터 안쪽 좌표가 아니라).
// -----------------------------------------------------------

/** 그네 하나를 타는 방법 */
function makeSwingRide(sw, seatX, swZ) {
  return {
    kind: 'swing',
    label: '그네를 타요! 🎉',
    enter: { x: seatX, z: swZ + SEAT_GAP },   // 그네 앞에 서면 탈 수 있다
    exit:  { x: seatX, z: swZ + SEAT_GAP },
    duration: SWING_TIME,
    autoEnd: false,                          // 내리기 버튼을 누를 때까지 탄다
    rider: null,
    pose(rideTime, out) {
      const a = sw.rotation.x;               // 지금 그네가 기울어진 각도
      out.x = seatX;
      out.y = BAR_Y - SEAT_DROP * Math.cos(a) - SIT_SINK;
      out.z = swZ - SEAT_DROP * Math.sin(a);
      out.yaw = 0;
      out.tilt = a;                          // 몸도 그네를 따라 같이 기운다
      return out;
    },
  };
}

/** 미끄럼틀 타는 방법 — 사다리 오르기 → 발판 건너기 → 슝! → 폴짝 */
function makeSlideRide(slX, slZ) {
  return {
    kind: 'slide',
    label: '미끄럼틀 슝~! 🛝',
    enter: { x: slX, z: slZ - 3.4 },         // 사다리 앞
    exit:  { x: slX, z: slZ + 6.6 },         // 미끄럼판이 끝나는 곳
    duration: SLIDE_TIME,
    autoEnd: true,                           // 다 내려오면 저절로 내린다
    rider: null,
    pose(rideTime, out) {
      out.x = slX;
      out.yaw = 0;        // 늘 +z 쪽(미끄럼판 쪽)을 본다
      out.tilt = 0;

      if (rideTime < 1.1) {                  // ① 사다리를 오른다
        const u = rideTime / 1.1;
        out.z = slZ + lerp(-3.0, -2.4, u);
        out.y = DECK_Y * u;
      } else if (rideTime < 1.7) {           // ② 발판을 건너 미끄럼판 위로
        const u = (rideTime - 1.1) / 0.6;
        out.z = slZ + lerp(-2.4, 0, u);
        out.y = DECK_Y;
      } else if (rideTime < 3.0) {           // ③ 슝~ (점점 빨라진다)
        const u = (rideTime - 1.7) / 1.3;
        const e = u * u;
        out.z = slZ + lerp(0, RAMP_END_Z, e);
        out.y = lerp(DECK_Y, RAMP_END_Y, e);
        out.tilt = -0.30;                    // 뒤로 살짝 기대고 내려간다
      } else {                               // ④ 폴짝 뛰어내린다
        const u = Math.min(1, (rideTime - 3.0) / 0.6);
        out.z = slZ + lerp(RAMP_END_Z, 6.6, u);
        out.y = RAMP_END_Y * (1 - u) + Math.sin(u * Math.PI) * 0.35;
      }
      return out;
    },
  };
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/**
 * 놀이터를 만든다. (x, z)는 마을 안에서 놀이터가 놓일 자리.
 * { group, obstacles, rides, update } 를 돌려준다.
 *   obstacles: 부딪히는 물건 목록 (마을 좌표 기준)
 *   rides    : 탈 수 있는 놀이기구 목록 (src/rides.js가 쓴다)
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

  // --- 탈 수 있는 것들 (그네 2개 + 미끄럼틀 1개) ---
  const rides = [];
  const swX = x + 5.5, swZ = z - 1;
  swings.userData.swings.forEach((sw, i) => {
    const ride = makeSwingRide(sw, swX + (i === 0 ? -1.3 : 1.3), swZ);
    sw.userData.ride = ride;                       // 누가 탔는지 update가 본다
    rides.push(ride);
  });
  rides.push(makeSlideRide(x - 4.5, z - 3));

  function update(dt, t) {
    for (const sw of swings.userData.swings) {
      // 누가 타면 점점 크게, 내리면 점점 작게 흔들린다
      const want = sw.userData.ride.rider ? SWING_RIDE_AMP : SWING_IDLE_AMP;
      sw.userData.amp += (want - sw.userData.amp) * Math.min(1, dt * SWING_WARMUP);
      sw.rotation.x = Math.sin(t * SWING_SPEED + sw.userData.phase) * sw.userData.amp;
    }
    seesaw.userData.plank.rotation.x = Math.sin(t * SEESAW_SPEED) * 0.22;
  }

  return { group, obstacles, rides, update };
}
