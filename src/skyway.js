// ===========================================================
//  ☁️ 구름 징검다리 — 인하성 2층에서 루하성으로 건너가는 하늘길
//
//  인하성 2층 동쪽 발코니로 나오면 여기가 펼쳐진다.
//  구름 위에 놓인 징검다리를 건너면 루하성 문 앞에 닿는다.
//
//  ★ 떨어지지 않는다. 걸어 다닐 수 있는 곳은 "길(PATH) 둘레"뿐이고,
//    길 밖으로 나가려 하면 다시 길 위로 밀어준다 (collide).
//    7세가 무서워하지 않게 일부러 안전하게 만들었다.
//  ★ 발이 닿는 높이는 그냥 0이다. 돌을 아래로 늘어뜨려서 "높이 떠 있는" 느낌만 낸다.
// ===========================================================
import * as THREE from 'three';
import { C, part, toon, glow, makeHeart } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { buildSky } from './sky.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const PATH_HALF = 2.6;      // 길의 반 너비 (이만큼까지 걸어도 된다)
const STONE_R   = 3.2;      // 징검다리 돌 하나의 크기
const STONE_GAP = 7.0;      // 돌과 돌 사이 간격

// 양 끝 승강장 자리 (여기 위에서는 자유롭게 돌아다닐 수 있다)
const A_PLAT = { x: 0, z: 3.5 };     // 🏰 인하성 쪽
const B_PLAT = { x: 0, z: -77.5 };   // 🌙 루하성 쪽
const PLAT_R = 5.8;                  // 승강장에서 걸어 다닐 수 있는 반지름
const ARCH_Z = 5.0;                  // 승강장 한가운데에서 아치 문까지 (뒤쪽 끝)

// 길 — 인하성에서 루하성까지. 살짝 S자로 휘어 있어서 걷는 맛이 있다
const PATH = [
  { x: 0,   z: 8 },
  { x: 0,   z: -10 },
  { x: -5,  z: -20 },
  { x: -7,  z: -30 },
  { x: -3,  z: -40 },
  { x: 4,   z: -50 },
  { x: 4,   z: -62 },
  { x: 0,   z: -82 },
];

// -----------------------------------------------------------
//  ★ 오갈 때 서는 자리 — 두 성과 이어지는 약속
// -----------------------------------------------------------
/** 인하성 2층에서 징검다리로 나왔을 때 서는 자리 */
export const SKY_FROM_CASTLE = { pos: new THREE.Vector3(0, 0, 2.5), yaw: Math.PI };
/** 루하성에서 징검다리로 나왔을 때 서는 자리 */
export const SKY_FROM_RUHA   = { pos: new THREE.Vector3(0, 0, -76.5), yaw: 0 };

const STONE_COLORS = [0xa8ead8, 0xffd9e8, 0xc9b4ff, 0xa8e6ff, 0xfff3c8];

// -----------------------------------------------------------
//  길 위의 한 점 찾기 — (x,z)에서 가장 가까운 길 위 자리
//    돌려주는 것 { x, z, d } : 길 위 자리와 거기까지의 거리
// -----------------------------------------------------------
const _near = { x: 0, z: 0, d: 0 };
function nearestOnPath(x, z) {
  let best = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    let u = ((x - a.x) * dx + (z - a.z) * dz) / len2;
    u = Math.max(0, Math.min(1, u));
    const px = a.x + dx * u, pz = a.z + dz * u;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) { best = d; _near.x = px; _near.z = pz; }
  }
  _near.d = best;
  return _near;
}

/** 길을 따라 STONE_GAP 간격으로 돌 놓을 자리를 뽑는다 (승강장 위는 뺀다) */
function stoneSpots() {
  const spots = [];
  let carry = 0;
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let t = carry; t < len; t += STONE_GAP) {
      const u = t / len;
      spots.push({ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u });
      carry = t + STONE_GAP - len;
    }
  }
  return spots.filter(p =>
    Math.hypot(p.x - A_PLAT.x, p.z - A_PLAT.z) > PLAT_R + 3 &&
    Math.hypot(p.x - B_PLAT.x, p.z - B_PLAT.z) > PLAT_R + 3);
}

// -----------------------------------------------------------
//  🪨 징검다리 돌 하나 — 윗면이 0, 몸통은 아래로 늘어져 있다
// -----------------------------------------------------------
function makeStone(color, r) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, -0.35, 0, r * 2, 0.7, r * 2));          // 윗판
  g.add(part('cyl', 0xcfc4e8, 0, -1.3, 0, r * 1.7, 1.3, r * 1.7));    // 몸통
  const tip = part('cone', 0xb9aede, 0, -2.9, 0, r * 1.5, 2.2, r * 1.5);
  tip.rotation.x = Math.PI;              // 아래로 뾰족하게 (떠 있는 바위처럼)
  g.add(tip);
  // 가장자리 반짝이 구슬
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(part('ball', 0xffffff, Math.cos(a) * r * 0.82, 0.05, Math.sin(a) * r * 0.82, 0.32));
  }
  return g;
}

// -----------------------------------------------------------
//  ☁️ 아래에 깔리는 구름 (푹신푹신해 보이게 뭉치로)
// -----------------------------------------------------------
function makeCloudLump(s) {
  const g = new THREE.Group();
  const m = toon(0xffffff);
  for (const [dx, dy, dz, r] of [[0,0,0,1], [0.8,-0.15,0.2,0.75], [-0.75,-0.2,-0.1,0.7],
                                 [0.2,0.25,-0.6,0.6], [-0.2,0.1,0.6,0.62]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), m);
    b.position.set(dx * s, dy * s, dz * s);
    b.scale.setScalar(r * s * 2);
    b.castShadow = false;
    g.add(b);
  }
  return g;
}

// -----------------------------------------------------------
//  🌈 무지개 다리 (길 위를 가로지르는 장식)
// -----------------------------------------------------------
function makeRainbow(radius) {
  const g = new THREE.Group();
  const cols = [0xff7a9c, 0xffa733, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff];
  for (let i = 0; i < cols.length; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius - i * 1.5, 0.7, 8, 40, Math.PI),
      glow(cols[i])
    );
    band.castShadow = false;
    g.add(band);
  }
  return g;
}

// -----------------------------------------------------------
//  🏰 양 끝 승강장 — 인하성 쪽 / 루하성 쪽
// -----------------------------------------------------------
function makePlatform(color, label, railColor) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, -0.4, 0, 13, 0.8, 13));
  g.add(part('cyl', 0xcfc4e8, 0, -1.6, 0, 11, 1.6, 11));
  const base = part('cone', 0xb9aede, 0, -4.2, 0, 9, 3.6, 9);
  base.rotation.x = Math.PI;
  g.add(base);

  // 성으로 들어가는 아치 문 — 승강장 **뒤쪽 끝**(local +z)에 세운다
  //  ★ 가운데 자리에 세우면, 문으로 들어올 때 카메라가 문 뒤에 서서 앞을 가린다
  const AZ = ARCH_Z;
  //  ★ 아치는 **넓게** 만든다. 문으로 들어오면 카메라가 잠깐 문 뒤에 서는데,
  //    구멍이 좁으면 앞이 답답하게 가린다
  g.add(part('box', railColor, -4.8, 3.4, AZ, 1.0, 6.8, 1.4));
  g.add(part('box', railColor,  4.8, 3.4, AZ, 1.0, 6.8, 1.4));
  g.add(part('box', railColor, 0, 7.1, AZ, 10.6, 1.0, 1.4));

  //  ★ 빛나는 문은 **한쪽만 보이는 판**이다 (길 쪽에서만 보인다).
  //    뒤에서는 비쳐서, 문 뒤에 선 카메라가 캐릭터를 가리지 않는다
  const glowDoor = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 6.6), glow(0xfff3d8));
  glowDoor.position.set(0, 3.3, AZ - 0.75);
  glowDoor.rotation.y = Math.PI;              // 길 쪽(-z)을 바라본다
  glowDoor.userData.noShadow = true;
  g.add(glowDoor);

  const sign = makeSign(label, 6.4, 1.3, '#ffffffdd', '#5b3d8f');
  sign.position.set(0, 8.4, AZ - 0.8);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // 난간 구슬 (문 쪽은 비운다)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = Math.cos(a) * 6, z = Math.sin(a) * 6;
    if (z > 2.5 && Math.abs(x) < 5.2) continue;
    g.add(part('cyl', 0xfff6e8, x, 0.5, z, 0.5, 1.0, 0.5));
    g.add(part('ball', railColor, x, 1.2, z, 0.6));
  }
  return g;
}

// -----------------------------------------------------------
//  구름 징검다리 공간 만들기
//    ctx = { envMap, backTo, backArrive, backYaw }  ← world/castle이 넘겨준다
// -----------------------------------------------------------
export function buildSkyway(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd8ff);
  scene.environment = ctx.envMap || null;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfe8ff, 1.5));
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.2);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;   sun.shadow.camera.bottom = -50;
  sun.shadow.camera.far = 200;
  sun.shadow.normalBias = 0.5;
  scene.add(sun);

  // 하늘 (구름 + 고래) — 마을과 같은 것을 쓴다
  const sky = buildSky(scene);

  const ticks = [];

  // --- 징검다리 돌 ---
  const spots = stoneSpots();
  spots.forEach((p, i) => {
    const stone = makeStone(STONE_COLORS[i % STONE_COLORS.length], STONE_R);
    stone.position.set(p.x, 0, p.z);
    scene.add(stone);
    const phase = i * 0.7;
    ticks.push((t) => { stone.position.y = Math.sin(t * 0.9 + phase) * 0.22; });
  });

  // --- 양 끝 승강장 ---
  const inha = makePlatform(0xffd9e8, '인하성', C.pink);
  inha.position.set(A_PLAT.x, 0, A_PLAT.z);
  scene.add(inha);
  const ruha = makePlatform(0xcfe0ff, '루하성', 0x8fa8ff);
  ruha.position.set(B_PLAT.x, 0, B_PLAT.z);
  ruha.rotation.y = Math.PI;
  scene.add(ruha);

  // --- 아래에 깔린 구름 바다 ---
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 46;
    const lump = makeCloudLump(1.6 + Math.random() * 2.6);
    lump.position.set(Math.cos(a) * r, -12 - Math.random() * 16,
                      -40 + Math.sin(a) * r - Math.random() * 20);
    scene.add(lump);
  }

  // --- 무지개와 떠다니는 하트 ---
  const bow = makeRainbow(20);
  bow.position.set(-6, -1, -26);
  bow.rotation.y = 0.5;
  scene.add(bow);
  const bow2 = makeRainbow(15);
  bow2.position.set(4, -1, -56);
  bow2.rotation.y = -0.4;
  scene.add(bow2);

  for (let i = 0; i < 10 && i < spots.length; i++) {
    const h = makeHeart(i % 2 ? C.pink : 0xa8e6ff, 0.9);
    const p = spots[i];
    h.position.set(p.x + (i % 2 ? 5 : -5), 3 + (i % 3), p.z);
    scene.add(h);
    ticks.push((t) => { h.position.y = 3 + (i % 3) + Math.sin(t * 1.2 + i) * 0.4; h.rotation.y = t * 0.5; });
  }

  // -----------------------------------------------------------
  //  걷기 — 길 밖으로 못 나간다 (떨어지지 않게)
  // -----------------------------------------------------------
  /** 여기 서 있어도 되나? (길 둘레 또는 승강장 위) */
  function onSafeGround(x, z, slack = 0) {
    if (Math.hypot(x - A_PLAT.x, z - A_PLAT.z) <= PLAT_R + slack) return true;
    if (Math.hypot(x - B_PLAT.x, z - B_PLAT.z) <= PLAT_R + slack) return true;
    return nearestOnPath(x, z).d <= PATH_HALF + slack;
  }

  /** 길 밖으로 나가려 하면 다시 안으로 밀어준다 (떨어지지 않게) */
  function collide(pos, radius) {
    if (onSafeGround(pos.x, pos.z)) return;
    // 길·승강장 셋 중 가장 가까운 곳으로 끌어당긴다
    const n = nearestOnPath(pos.x, pos.z);
    let bx = n.x, bz = n.z, keep = PATH_HALF, best = n.d - PATH_HALF;
    for (const P of [A_PLAT, B_PLAT]) {
      const d = Math.hypot(pos.x - P.x, pos.z - P.z);
      if (d - PLAT_R < best) { best = d - PLAT_R; bx = P.x; bz = P.z; keep = PLAT_R; }
    }
    const d = Math.hypot(pos.x - bx, pos.z - bz) || 0.0001;
    const k = keep / d;
    pos.x = bx + (pos.x - bx) * k;
    pos.z = bz + (pos.z - bz) * k;
    void radius;
  }
  function isBlocked(x, z) { return !onSafeGround(x, z, -0.8); }

  function update(dt, t) {
    sky.update(dt, t);
    for (const fn of ticks) fn(t, dt);
  }

  return {
    name: 'skyway',
    scene,
    spawn: SKY_FROM_CASTLE.pos.clone(),
    yaw: Math.PI,                 // 들어오면 루하성 쪽(-z)을 바라본다
    camDist: 10, camHeight: 6, lookHeight: 3.0,
    npcCount: 0,
    collide, isBlocked, update,
    rides: [], spots: [],
    doors: [
      {
        // 뒤로 돌아가기 — 인하성 2층 발코니 (승강장 아치 안쪽)
        x: A_PLAT.x, z: A_PLAT.z + ARCH_Z - 1.7, r: 2.2, y: 0, to: 'castle',
        label: '인하성 2층으로 돌아왔어요 🏰',
        arrive: ctx.castleArrive, arriveYaw: ctx.castleYaw,
      },
      {
        // 앞으로 — 루하성
        x: B_PLAT.x, z: B_PLAT.z - ARCH_Z + 1.7, r: 2.2, y: 0, to: 'ruha',
        label: '루하성에 도착! 🌙 별과 달의 성',
        //  ★ 루하성을 만드는 함수는 밖에서 받는다 (파일끼리 서로 부르지 않게)
        build: (c) => ctx.buildRuha(c),
        arrive: ctx.ruhaArrive, arriveYaw: ctx.ruhaYaw,
      },
    ],
  };
}
