// ===========================================================
//  🏊 야외 수영장 — 마을 남서쪽 끝(외곽)에 있다
//
//  물이 찰랑이는 큰 수영장 · 🛝 워터슬라이드 · 🦆 오리배 · 🌞 선탠 의자 · 🍹 음료 바
//  파라솔 · 야자수 · 안전요원 의자 · 샤워기 · 비치볼
//
//  ★ 노는 방법 (src/rides.js가 쓴다)
//    수영하기 (남쪽 사다리 앞) — 물에 들어가서 **조이스틱/방향키로 직접 헤엄친다**. `나오기`를
//                              누르면 가장 가까운 테두리로 올라온다
//    오리배 타기               — 헤엄치다 🦆 오리배 옆에 가면 버튼이 바뀐다. 타면 둥둥 떠다니고,
//                              `내리기`를 누르면 그 자리에서 다시 헤엄친다
//    워터슬라이드 (북쪽 탑)     — 계단 → 슝~ → 💦 첨벙! → 그대로 헤엄치기가 된다
//    선탠 의자 (남쪽 데크)      — 누워서 쉰다
//    🍹 바 (동쪽 데크)          — `주문하기`를 누르면 펭귄이 음료를 만들어 준다 (src/pool-bar.js)
//  ★ 마을 친구(NPC)는 광장 근처만 돌아다녀서 여기까지 오지 않는다.
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { tileTexture } from './interior.js';
//  🌴 야자수·파라솔·의자 같은 장식 모양은 src/pool-props.js, 🍹 바는 src/pool-bar.js
import { W, makeDuckFloat, makePalm, makeParasol, makeSunbed, makeGuardChair, makeShower } from './pool-props.js';
import { makeBar } from './pool-bar.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const POOL_W = 34;          // 수영장 가로 (동서)
const POOL_D = 22;          // 수영장 세로 (남북)
const RIM = 1.2;            // 수영장 테두리 두께
const WALL_H = 1.4;         // 테두리 높이 (물은 이보다 조금 아래)
const WATER_Y = 1.1;        // 물 높이
const DECK_R = 28;          // 데크(타일 바닥) 반지름
const SWIM_SPEED = 5.5;     // 헤엄치는 빠르기 (조이스틱을 끝까지 밀었을 때)
const SWIM_TURN = 5;        // 헤엄칠 때 몸을 돌리는 빠르기
const DUCK_SPEED = 0.35;    // 오리배가 도는 빠르기 (라디안/초)
const SLIDE_TOP = 5.0;      // 워터슬라이드 꼭대기 높이

const HW = POOL_W / 2, HD = POOL_D / 2;
const LANE_X = -8;                          // 사다리 · 워터슬라이드가 있는 x
const LADDER_Z = HD + RIM;                  // 사다리가 걸린 남쪽 테두리
const DUCK = { x: 8, z: 1, r: 4.5 };        // 오리배가 도는 동그라미
const SLIDE_Z = -HD - RIM - 3.6;            // 슬라이드 탑 자리 (북쪽 데크)
const BAR = { x: HW + RIM + 6.0, z: 0 };    // 🍹 바 카운터 자리 (동쪽 데크)

function lerp(a, b, u) { return a + (b - a) * u; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// -----------------------------------------------------------
//  🌊 수영장 몸통 — 테두리 4개 + 바닥 + 물 + 사다리
// -----------------------------------------------------------
function makePoolBody() {
  const g = new THREE.Group();
  g.add(part('box', W.deep, 0, 0.12, 0, POOL_W, 0.24, POOL_D));            // 파란 바닥
  for (const sz of [-1, 1]) g.add(part('box', W.rim, 0, WALL_H / 2, sz * (HD + RIM / 2), POOL_W + RIM * 2, WALL_H, RIM));
  for (const sx of [-1, 1]) g.add(part('box', W.rim, sx * (HW + RIM / 2), WALL_H / 2, 0, RIM, WALL_H, POOL_D));
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(POOL_W, POOL_D),
    new THREE.MeshToonMaterial({ color: W.water, transparent: true, opacity: 0.78 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  g.add(water);
  // ✨ 물 위 반짝이 (update가 살랑살랑 움직인다)
  const sparkles = [];
  for (let i = 0; i < 24; i++) {
    const s = part('cyl', W.white, lerp(-HW + 1, HW - 1, Math.random()), WATER_Y + 0.03,
                   lerp(-HD + 1, HD - 1, Math.random()), 0.5, 0.04, 0.5, glow(0xeafaff));
    s.castShadow = false;
    g.add(s); sparkles.push(s);
  }
  // 🪜 사다리 (남쪽 테두리)
  for (const sx of [-1, 1]) g.add(part('cyl', W.pole, LANE_X + sx * 0.6, 1.4, LADDER_Z, 0.16, 2.8, 0.16));
  for (let i = 0; i < 3; i++) g.add(part('box', W.pole, LANE_X, 0.6 + i * 0.7, LADDER_Z, 1.2, 0.12, 0.3));
  g.userData.water = water; g.userData.sparkles = sparkles;
  return g;
}

// -----------------------------------------------------------
//  🛝 워터슬라이드 — 탑 + 계단 + 물로 떨어지는 미끄럼판
// -----------------------------------------------------------
function makeWaterSlide() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', W.pole, sx * 1.1, SLIDE_TOP / 2, sz * 1.1, 0.3, SLIDE_TOP, 0.3));
  }
  g.add(part('box', W.sky, 0, SLIDE_TOP - 0.1, 0, 3.0, 0.3, 3.0));                 // 꼭대기 발판
  for (let i = 0; i < 6; i++) {                                                     // 북쪽 계단
    g.add(part('box', W.wood, 0, 0.5 + i * 0.75, -1.6 - (5 - i) * 0.45, 1.8, 0.16, 0.5));
  }
  for (const sx of [-1, 1]) g.add(part('cyl', W.pole, sx * 0.85, SLIDE_TOP / 2, -3.5, 0.14, SLIDE_TOP, 0.14));
  // 미끄럼판 — 남쪽(+z)으로 비스듬히 물까지 (색 띠를 번갈아 칠했다)
  const len = Math.hypot(SLIDE_TOP - WATER_Y + 0.4, 8.0);
  const tilt = Math.atan2(SLIDE_TOP - WATER_Y + 0.4, 8.0);
  const ramp = new THREE.Group();
  ramp.position.set(0, (SLIDE_TOP + WATER_Y - 0.4) / 2, 1.5 + 4.0);
  ramp.rotation.x = tilt;
  const bands = [W.sky, W.yellow, W.pink, W.mint];
  for (let i = 0; i < 6; i++) {
    ramp.add(part('box', bands[i % bands.length], 0, 0, -len / 2 + (i + 0.5) * (len / 6), 1.8, 0.28, len / 6));
  }
  for (const sx of [-1, 1]) ramp.add(part('box', W.white, sx * 0.95, 0.35, 0, 0.16, 0.6, len));
  g.add(ramp);
  return g;
}

// 🌊 헤엄치는 자리 표시 — 아이 발밑에서 물결 고리가 퍼진다 (player.js가 이 그룹을 몰고 다닌다)
function makeSwimmer() {
  const g = new THREE.Group();
  const ring = part('torus', W.white, 0, WATER_Y + 0.05, 0, 3.0, 3.0, 3.0, glow(0xf4fcff));
  ring.rotation.x = Math.PI / 2; ring.castShadow = false;
  g.add(ring);
  g.visible = false;
  g.userData.step = (t, moving) => {
    const s = moving ? 1 + Math.sin(t * 7) * 0.2 : 1 + Math.sin(t * 2) * 0.06;
    ring.scale.set(3.0 * s, 3.0 * s, 3.0);
  };
  return g;
}

// -----------------------------------------------------------
//  탈 것들 — 자리는 마을 좌표(수영장 자리 x, z를 더한 값)로 적는다
// -----------------------------------------------------------
/** 🏊 수영 — 물에 들어가 조이스틱으로 직접 헤엄친다 (말처럼 drive) */
function makeSwimRide(px, pz, swimmer) {
  const ladder = { x: px + LANE_X, z: pz + LADDER_Z + 1.3 };
  const inside = (p) => Math.abs(p.x - px) < HW && Math.abs(p.z - pz) < HD;
  const r = {
    kind: 'swim', drive: true, group: swimmer, speed: SWIM_SPEED, turn: SWIM_TURN,
    seatY: WATER_Y - 0.6,           // 허리까지 물에 잠긴다 (더 낮추면 작은 친구는 안 보인다)
    bodyR: 1.0,                     // 테두리 벽에 이만큼 가까이까지 간다
    label: '첨벙! 조이스틱으로 헤엄쳐요 🏊', verb: '수영하기', offVerb: '나오기',
    enter: { ...ladder }, exit: { ...ladder },
    enterY: 0, reach: 3.4, noNpc: true, duration: 600, autoEnd: false, rider: null,
    camDist: 12, camHeight: 7, lookHeight: 1.5,
    transfers: [],                  // 🦆 오리배 (buildPool이 넣는다)
    onRide(on, model) {
      swimmer.visible = on;
      if (!on) return;
      if (inside(model.position)) {           // 오리배·슬라이드에서 그 자리 그대로 헤엄친다
        swimmer.position.set(model.position.x, 0, model.position.z);
        swimmer.rotation.y = model.rotation.y;
      } else {                                // 사다리에서 들어오면 안쪽에서 북쪽을 보고 시작
        swimmer.position.set(px + LANE_X, 0, pz + HD - 2.2);
        swimmer.rotation.y = Math.PI;
      }
    },
    //  헤엄쳐 다닌 뒤: 타는 자리는 사다리 그대로, 내리는 자리는 **가장 가까운 테두리 바깥**
    track(pos) {
      const dx = pos.x - px, dz = pos.z - pz;
      if (Math.abs(dx) / HW > Math.abs(dz) / HD) {
        r.exit.x = px + Math.sign(dx || 1) * (HW + RIM + 1.7);
        r.exit.z = clamp(pos.z, pz - HD + 1, pz + HD - 1);
      } else {
        r.exit.z = pz + Math.sign(dz || 1) * (HD + RIM + 1.7);
        r.exit.x = clamp(pos.x, px - HW + 1, px + HW - 1);
      }
    },
    pose(t, o) {          // (drive라 안 쓰지만 모양을 맞춰 둔다)
      o.x = swimmer.position.x; o.z = swimmer.position.z; o.y = WATER_Y - 0.6;
      o.yaw = swimmer.rotation.y; o.tilt = 0; return o;
    },
  };
  return r;
}

/** 🛝 워터슬라이드 — 계단을 올라 슝~ 첨벙! 그 뒤엔 바로 헤엄치기가 된다 (offTo) */
function makeSlideRide(px, pz, splash) {
  const sx = px + LANE_X, sz = pz + SLIDE_Z;
  const landZ = pz - HD + 2.6;
  return {
    kind: 'waterslide', label: '워터슬라이드 슝~ 첨벙! 🛝💦', verb: '타기',
    enter: { x: sx, z: sz - 4.6 }, exit: { x: px + LANE_X, z: pz + LADDER_Z + 1.3 },
    enterY: 0, reach: 3.4, noNpc: true, duration: 4.4, autoEnd: true, rider: null,
    //  📷 카메라는 북쪽에서 미끄럼판을 따라 내려다본다. 탑에 오르면 카메라도 같이 오른다(camBase)
    camDist: 13, camHeight: 10, lookHeight: 1.0, camYaw: 0, camBase: true,
    pose(rt, o) {
      o.x = sx; o.yaw = 0; o.tilt = 0;
      if (rt < 1.6) {                                    // ① 계단을 오른다
        const u = rt / 1.6; o.z = sz + lerp(-4.0, -1.4, u); o.y = SLIDE_TOP * u;
      } else if (rt < 2.2) {                             // ② 발판을 건너
        const u = (rt - 1.6) / 0.6; o.z = sz + lerp(-1.4, 1.2, u); o.y = SLIDE_TOP + 0.1;
      } else if (rt < 3.6) {                             // ③ 슝~ (점점 빨라진다)
        const u = (rt - 2.2) / 1.4, e = u * u;
        //  미끄럼판(탑 기준 z 1.5→9.5, 높이 4.9→0.8) 위를 타고 물(landZ)까지
        o.z = sz + lerp(1.2, landZ - sz, e); o.y = lerp(SLIDE_TOP + 0.2, WATER_Y - 0.2, e); o.tilt = -0.35;
        if (u > 0.97) splash(sx, landZ);
      } else {                                           // ④ 첨벙! 물속으로 쑥 — 그 다음은 헤엄
        const u = Math.min(1, (rt - 3.6) / 0.6); o.z = landZ; o.y = WATER_Y - 0.1 - Math.sin(u * Math.PI) * 1.0;
      }
      return o;
    },
  };
}

/** 🦆 오리배 — 헤엄치다 옆에 가면 올라탄다. 내리면 그 자리에서 다시 헤엄친다 (offTo) */
function makeDuckRide(px, pz, duck) {
  return {
    kind: 'duck', label: '오리배 둥둥~ 🦆 내리면 다시 헤엄쳐요', verb: '오리배 타기', offVerb: '내리기',
    enter: { x: 0, z: 0 },                    // 오리배가 움직이니 update가 매 프레임 채운다
    exit: { x: px + LANE_X, z: pz + LADDER_Z + 1.3 },
    enterY: 0, reach: 3.6, noNpc: true, duration: 600, autoEnd: false, rider: null,
    camDist: 12, camHeight: 7.5, lookHeight: 1.8,
    //  📷 카메라가 오리 뒤를 따라간다 (앞에서 보면 오리 머리가 아이를 가린다)
    camYawAt: () => duck.rotation.y,
    pose(rt, o) {
      //  튜브 구멍 판(오리 기준 0.58 높이) 위에 선다 — 더 낮추면 튜브 속에 파묻혀 안 보인다
      o.x = duck.position.x; o.z = duck.position.z; o.y = duck.position.y + 0.15;
      o.yaw = duck.rotation.y; o.tilt = 0;
      return o;
    },
  };
}

/** 🌞 선탠 의자 — 누워서 쉰다 (발이 앞(-z), 머리가 등받이 쪽(+z)) */
function makeSunbedRide(cx, cz) {
  return {
    kind: 'sunbed', label: '햇볕 쬐며 쉬어요 🌞', verb: '눕기', offVerb: '일어나기',
    enter: { x: cx, z: cz - 3.0 }, exit: { x: cx, z: cz - 3.0 },
    enterY: 0, reach: 3.0, duration: 12, autoEnd: false, rider: null,
    camDist: 11, camHeight: 6, lookHeight: 1.5,
    pose(rt, o) {
      o.x = cx; o.z = cz - 1.1; o.y = 0.95; o.yaw = Math.PI; o.tilt = 1.05;   // 북쪽을 보고 뒤로 눕는다
      return o;
    },
  };
}

// -----------------------------------------------------------
//  공개 API — (x, z)는 마을 안에서 수영장이 놓일 자리
//  { group, loose, obstacles, rides, spots, update } 를 돌려준다
//    loose = 마을 좌표로 움직여야 해서 scene에 따로 넣을 것 (헤엄 표시)
// -----------------------------------------------------------
export function buildPool(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // 🧱 타일 데크
  const deck = new THREE.Mesh(new THREE.CircleGeometry(DECK_R, 48),
    new THREE.MeshToonMaterial({ color: W.tile, map: tileTexture('#ffe9c2', '#fff6e4', 20) }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = 0.03; deck.receiveShadow = true;
  group.add(deck);

  const body = makePoolBody();
  group.add(body);
  const slide = makeWaterSlide();
  slide.position.set(LANE_X, 0, SLIDE_Z);
  group.add(slide);
  const duck = makeDuckFloat();
  group.add(duck);
  const swimmer = makeSwimmer();

  const obstacles = [];
  const put = (m, lx, lz, ry = 0, r = 0) => {
    m.position.set(lx, 0, lz); m.rotation.y = ry; group.add(m);
    if (r) obstacles.push({ x: x + lx, z: z + lz, r });
    return m;
  };
  // 🌴 야자수 · ⛱ 파라솔 · 🛋 선탠 의자 · 🪑 안전요원 · 🚿 샤워기 · 🏐 비치볼
  for (const [lx, lz] of [[-22, -15], [22, -14], [-24, 12], [20, 18], [4, -23], [-11, 23]]) put(makePalm(), lx, lz, Math.random() * 6, 0.9);
  put(makeParasol(W.pink), -4.5, 19.6, 0, 0.4);
  put(makeParasol(W.mint), 5.5, 19.6, 0, 0.4);
  put(makeParasol(W.orange), -21, 6, 0, 0.4);
  put(makeSunbed(W.sky), -2, 17.5, 0, 1.6);
  put(makeSunbed(W.yellow), 3, 17.5, 0, 1.6);
  put(makeGuardChair(), -22, -4, Math.PI / 2, 1.3);
  put(makeShower(), -13, 16.5, Math.PI, 0.5);
  const ball = part('ball', W.red, -2, WATER_Y + 0.5, -5, 1.2);
  group.add(ball);
  group.add(part('ball', W.white, -2, WATER_Y + 0.5, -5, 1.22, 0.5, 1.22));
  // 🍹 바 (동쪽 데크) — 펭귄이 음료를 만들어 준다
  const bar = makeBar(x + BAR.x, z + BAR.z);
  group.add(bar.group);
  bar.group.position.set(BAR.x, 0, BAR.z);      // 그룹 안 좌표로 다시 놓는다
  obstacles.push(...bar.obstacles);
  // 🪧 간판 — 광장 쪽(북동)에서 오면 보인다. 길 위에 문처럼 걸려 있다 (아래로 지나다닌다)
  const sign = makeSign('🏊 야외 수영장', 10, 2.0, '#5ccfff', '#1b3a5c');
  sign.position.set(15, 4.6, -20); sign.rotation.y = 2.5;
  group.add(sign);
  for (const s of [-1, 1]) {
    const px = 15 + Math.cos(2.5) * s * 4.4, pz = -20 - Math.sin(2.5) * s * 4.4;
    group.add(part('cyl', W.pole, px, 2.2, pz, 0.3, 4.4, 0.3));
    obstacles.push({ x: x + px, z: z + pz, r: 0.4 });
  }
  // 수영장 테두리 4개 — 아이는 못 넘어가지만 카메라는 물 위를 지날 수 있게 얇게 넷으로 나눴다
  //  ★ 헤엄칠 때도 이 벽이 아이를 물 안에 붙잡아 둔다
  for (const s of [-1, 1]) {
    obstacles.push({ x, z: z + s * (HD + RIM / 2), hw: HW + RIM, hd: RIM / 2 + 0.2 });
    obstacles.push({ x: x + s * (HW + RIM / 2), z, hw: RIM / 2 + 0.2, hd: HD });
  }
  obstacles.push({ x: x + LANE_X, z: z + SLIDE_Z, r: 1.7 });     // 슬라이드 탑

  // 💦 첨벙 물방울 — 슬라이드 끝에서 튄다
  const drops = [];
  for (let i = 0; i < 16; i++) {
    const d = part('ball', W.white, 0, -5, 0, 0.36, 0.36, 0.36, glow(0xeafaff));
    d.castShadow = false; d.visible = false; group.add(d);
    drops.push({ m: d, vx: 0, vy: 0, vz: 0 });
  }
  let splashAt = -9;
  function splash(wx, wz) {
    if (splashAt >= 0 && splashAt < 1.0) return;           // 이미 튀는 중
    splashAt = 0;
    for (const d of drops) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      d.m.position.set(wx - x, WATER_Y, wz - z); d.m.visible = true;
      d.vx = Math.cos(a) * sp; d.vz = Math.sin(a) * sp; d.vy = 4 + Math.random() * 4;
    }
  }

  //  ★ 오리배 pose는 오리의 **마을 좌표**를 읽는다 — 그룹이 (x, z)에 있으니 더한 값을 따로 둔다
  const duckWorld = { position: new THREE.Vector3(), rotation: duck.rotation };
  const swimRide = makeSwimRide(x, z, swimmer);
  const duckRide = makeDuckRide(x, z, duckWorld);
  const slideRide = makeSlideRide(x, z, splash);
  swimRide.transfers.push(duckRide);    // 헤엄치다 오리배 옆 → 오리배 타기
  duckRide.offTo = swimRide;            // 오리배에서 내리면 → 다시 헤엄
  slideRide.offTo = swimRide;           // 슬라이드로 첨벙 → 바로 헤엄
  const rides = [swimRide, slideRide, duckRide,
                 makeSunbedRide(x - 2, z + 17.5), makeSunbedRide(x + 3, z + 17.5)];
  let duckA = 0;

  function update(dt, t) {
    body.userData.water.position.y = WATER_Y + Math.sin(t * 1.3) * 0.03;
    const sp = body.userData.sparkles;
    for (let i = 0; i < sp.length; i++) sp[i].scale.setScalar(0.5 + Math.sin(t * 2 + i * 1.7) * 0.25);
    ball.position.y = WATER_Y + 0.5 + Math.sin(t * 1.8) * 0.12;
    // 🦆 오리배 — 늘 천천히 돈다 (누가 타면 살짝 더 빨리)
    duckA += dt * DUCK_SPEED * (duckRide.rider ? 1.5 : 1);
    duck.position.set(DUCK.x + Math.cos(duckA) * DUCK.r, WATER_Y + Math.sin(t * 2) * 0.08,
                      DUCK.z + Math.sin(duckA) * DUCK.r);
    duck.rotation.y = Math.atan2(-Math.sin(duckA), Math.cos(duckA));   // 머리(+z)가 가는 쪽을 본다
    duckWorld.position.set(duck.position.x + x, duck.position.y, duck.position.z + z);
    duckRide.enter.x = duckWorld.position.x; duckRide.enter.z = duckWorld.position.z;
    bar.tick(t, dt);
    // 💦 물방울
    if (splashAt >= 0) {
      splashAt += dt;
      for (const d of drops) {
        if (!d.m.visible) continue;
        d.vy -= 12 * dt;
        d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
        if (d.m.position.y < WATER_Y - 0.2) d.m.visible = false;
      }
    }
  }
  update(0, 0);

  return { group, loose: [swimmer], obstacles, rides, spots: [bar.spot], update };
}
