// ===========================================================
//  🏊 야외 수영장 — 마을 남서쪽 끝(외곽)에 있다
//
//  물이 찰랑이는 수영장 · 🛝 워터슬라이드 · 🦆 오리 튜브 · 🌞 선탠 의자
//  파라솔 · 야자수 · 안전요원 의자 · 샤워기 · 비치볼
//
//  ★ 탈 수 있는 것 (src/rides.js가 쓴다)
//    수영 (사다리 앞)      — 레인을 따라 왕복하며 헤엄친다. 내리기를 누를 때까지
//    워터슬라이드 (탑 뒤)  — 계단 → 슝~ → 첨벙! → 사다리까지 헤엄쳐서 저절로 나온다
//    오리 튜브 (동쪽 가장자리) — 튜브에 올라타면 물 위를 둥둥 떠다닌다
//    선탠 의자 (남쪽 데크) — 누워서 쉰다
//  ★ 마을 친구(NPC)는 광장 근처만 돌아다녀서 여기까지 오지 않는다.
//  ★ 모양은 놀이터(playground.js)처럼 (x, z) 자리에 통째로 놓는다.
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { tileTexture } from './interior.js';
//  🌴 야자수·파라솔·의자 같은 장식 모양은 src/pool-props.js에 있다
import { W, makeDuckFloat, makePalm, makeParasol, makeSunbed, makeGuardChair, makeShower } from './pool-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const POOL_W = 24;          // 수영장 가로 (동서)
const POOL_D = 14;          // 수영장 세로 (남북)
const RIM = 1.2;            // 수영장 테두리 두께
const WALL_H = 1.4;         // 테두리 높이 (물은 이보다 조금 아래)
const WATER_Y = 1.1;        // 물 높이
const DECK_R = 19;          // 데크(타일 바닥) 반지름
const SWIM_SPEED = 2.6;     // 헤엄치는 빠르기
const DUCK_SPEED = 0.45;    // 오리 튜브가 도는 빠르기 (라디안/초)
const SLIDE_TOP = 5.0;      // 워터슬라이드 꼭대기 높이


const LANE_X = -7;                      // 수영 레인 · 워터슬라이드가 떨어지는 x
const LADDER_Z = POOL_D / 2 + RIM;      // 사다리가 걸린 남쪽 테두리
const DUCK = { x: 6, z: 0.5, r: 3.0 }; // 오리 튜브가 도는 동그라미
const SLIDE_Z = -POOL_D / 2 - RIM - 3.6;   // 슬라이드 탑 자리 (북쪽 데크)

function lerp(a, b, u) { return a + (b - a) * u; }

// -----------------------------------------------------------
//  🌊 수영장 몸통 — 테두리 4개 + 바닥 + 물 + 레인 줄
// -----------------------------------------------------------
function makePoolBody() {
  const g = new THREE.Group();
  const hw = POOL_W / 2, hd = POOL_D / 2;
  g.add(part('box', W.deep, 0, 0.12, 0, POOL_W, 0.24, POOL_D));            // 파란 바닥
  for (const sz of [-1, 1]) g.add(part('box', W.rim, 0, WALL_H / 2, sz * (hd + RIM / 2), POOL_W + RIM * 2, WALL_H, RIM));
  for (const sx of [-1, 1]) g.add(part('box', W.rim, sx * (hw + RIM / 2), WALL_H / 2, 0, RIM, WALL_H, POOL_D));
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(POOL_W, POOL_D),
    new THREE.MeshToonMaterial({ color: W.water, transparent: true, opacity: 0.78 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  g.add(water);
  // 🪢 레인 줄 — 동그란 부표를 줄줄이 띄운다 (수영 레인과 놀이 구역을 나눈다)
  for (let z = -hd + 1; z < hd; z += 1.2) {
    g.add(part('ball', z % 2.4 < 1.2 ? W.red : W.white, -2.5, WATER_Y + 0.1, z, 0.45));
  }
  // ✨ 물 위 반짝이 (update가 살랑살랑 움직인다)
  const sparkles = [];
  for (let i = 0; i < 14; i++) {
    const s = part('cyl', W.white, lerp(-hw + 1, hw - 1, Math.random()), WATER_Y + 0.03,
                   lerp(-hd + 1, hd - 1, Math.random()), 0.5, 0.04, 0.5, glow(0xeafaff));
    s.castShadow = false;
    g.add(s); sparkles.push(s);
  }
  // 🪜 사다리 (남쪽 테두리, 레인 끝)
  for (const sx of [-1, 1]) {
    g.add(part('cyl', W.pole, LANE_X + sx * 0.6, 1.4, LADDER_Z, 0.16, 2.8, 0.16));
  }
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

// -----------------------------------------------------------
//  탈 것들 — 자리는 마을 좌표(수영장 자리 x, z를 더한 값)로 적는다
// -----------------------------------------------------------
/** 🏊 수영 — 사다리를 오르고, 레인을 따라 남↔북으로 왕복한다 */
function makeSwimRide(px, pz) {
  const lx = px + LANE_X, zS = pz + POOL_D / 2 - 1.6, zN = pz - POOL_D / 2 + 1.8;
  const LAP = (zS - zN) / SWIM_SPEED;            // 한쪽 끝까지 가는 시간
  return {
    kind: 'swim', label: '첨벙! 수영해요 🏊', verb: '수영하기', offVerb: '나오기',
    enter: { x: lx, z: pz + LADDER_Z + 1.3 }, exit: { x: lx, z: pz + LADDER_Z + 1.3 },
    enterY: 0, reach: 3.4, noNpc: true, duration: 600, autoEnd: false, rider: null,
    //  📷 카메라는 남쪽 데크에서 북쪽(수영장 쪽)을 본다 — 헤엄치는 모습이 잘 보인다
    camDist: 12, camHeight: 8, lookHeight: 1.5, camYaw: Math.PI,
    pose(rt, o) {
      o.x = lx; o.tilt = 0;
      if (rt < 0.9) {                                   // ① 사다리를 오른다
        const u = rt / 0.9;
        o.z = pz + LADDER_Z + lerp(1.0, -0.3, u); o.y = WALL_H * u + 0.2; o.yaw = Math.PI;
        return o;
      }
      if (rt < 1.4) {                                   // ② 풍덩!
        const u = (rt - 0.9) / 0.5;
        o.z = pz + LADDER_Z + lerp(-0.3, -1.6, u); o.y = lerp(WALL_H + 0.2, WATER_Y - 0.5, u); o.yaw = Math.PI;
        return o;
      }
      // ③ 레인 왕복 — 북으로 갔다가(yaw π) 남으로 돌아온다(yaw 0). 끝에서 잠깐 몸을 세운다
      const s = rt - 1.4, cyc = LAP * 2 + 1.2, k = s % cyc;
      const north = k < LAP + 0.6;
      const u = north ? Math.min(1, k / LAP) : Math.min(1, (k - LAP - 0.6) / LAP);
      o.z = north ? lerp(zS, zN, u) : lerp(zN, zS, u);
      o.yaw = north ? Math.PI : 0;
      const turning = north ? k > LAP : k > LAP * 2 + 0.6;
      //  ★ tilt는 세상의 x축으로 도는 값이라, 북을 볼 땐 머리가 -z로 가게 부호를 바꾼다
      o.tilt = turning ? 0 : (north ? -1 : 1) * 1.25;
      //  ★ 엎드려 헤엄칠 땐 몸이 물 위로 반쯤 나오게, 돌 땐 가슴까지 물에 잠기게
      o.y = (turning ? WATER_Y - 0.9 : WATER_Y - 0.1) + Math.sin(rt * 5) * 0.07;
      o.x = lx + Math.sin(rt * 3) * 0.12;
      return o;
    },
  };
}

/** 🛝 워터슬라이드 — 계단을 올라 슝~ 첨벙! 사다리까지 헤엄쳐 나온다 (저절로 끝난다) */
function makeSlideRide(px, pz, splash) {
  const sx = px + LANE_X, sz = pz + SLIDE_Z;
  const landZ = pz - POOL_D / 2 + 2.4, ladderZ = pz + POOL_D / 2 - 1.6;
  return {
    kind: 'waterslide', label: '워터슬라이드 슝~ 첨벙! 🛝💦', verb: '타기',
    enter: { x: sx, z: sz - 4.6 }, exit: { x: px + LANE_X, z: pz + LADDER_Z + 1.3 },
    enterY: 0, reach: 3.4, noNpc: true, duration: 8.4, autoEnd: true, rider: null,
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
      } else if (rt < 4.2) {                             // ④ 첨벙! 물속으로 쑥
        const u = (rt - 3.6) / 0.6; o.z = landZ; o.y = WATER_Y - 0.1 - Math.sin(u * Math.PI) * 1.0;
      } else if (rt < 7.4) {                             // ⑤ 사다리까지 헤엄
        const u = (rt - 4.2) / 3.2; o.z = lerp(landZ, ladderZ, u); o.tilt = 1.25;
        o.y = WATER_Y - 0.1 + Math.sin(rt * 5) * 0.07;
      } else {                                           // ⑥ 사다리로 올라와 데크에 선다
        const u = Math.min(1, (rt - 7.4) / 1.0);
        if (u < 0.5) { o.z = lerp(ladderZ, pz + LADDER_Z - 0.3, u * 2); o.y = lerp(WATER_Y - 0.9, WALL_H + 0.2, u * 2); }
        else         { o.z = lerp(pz + LADDER_Z - 0.3, pz + LADDER_Z + 1.3, (u - 0.5) * 2); o.y = lerp(WALL_H + 0.2, 0, (u - 0.5) * 2); }
      }
      return o;
    },
  };
}

/** 🦆 오리 튜브 — 동쪽 테두리에서 올라타면 튜브가 물 위를 빙 돈다 */
function makeDuckRide(px, pz, duck) {
  const rimX = px + POOL_W / 2 + RIM;
  return {
    kind: 'duck', label: '오리 튜브 둥둥~ 🦆', verb: '타기', offVerb: '내리기',
    enter: { x: rimX + 1.3, z: pz + DUCK.z }, exit: { x: rimX + 1.3, z: pz + DUCK.z },
    enterY: 0, reach: 3.4, noNpc: true, duration: 600, autoEnd: false, rider: null,
    camDist: 12, camHeight: 7.5, lookHeight: 1.8,
    //  📷 카메라가 오리 뒤를 따라간다 (앞에서 보면 오리 머리가 아이를 가린다)
    camYawAt: () => duck.rotation.y,
    pose(rt, o) {
      o.tilt = 0;
      const dx = duck.position.x, dz = duck.position.z;
      if (rt < 0.8) {                                    // ① 테두리에 올라선다
        const u = rt / 0.8; o.x = lerp(rimX + 1.0, rimX - 0.2, u); o.z = pz + DUCK.z; o.y = WALL_H * u + 0.2; o.yaw = -Math.PI / 2;
      } else if (rt < 2.2) {                             // ② 튜브까지 헤엄쳐 간다 (튜브가 움직여도 따라간다)
        const u = (rt - 0.8) / 1.4;
        o.x = lerp(rimX - 0.2, dx, u); o.z = lerp(pz + DUCK.z, dz, u);
        o.y = lerp(WALL_H + 0.2, WATER_Y - 0.9, Math.min(1, u * 3)); o.yaw = Math.atan2(dx - o.x, dz - o.z) || 0;   // 가슴까지 잠긴 채 걸어간다
      } else {                                           // ③ 튜브에 앉아 둥둥
        //  튜브 구멍 판(오리 기준 0.58 높이) 위에 선다 — 더 낮추면 튜브 속에 파묻혀 안 보인다
        o.x = dx; o.z = dz; o.y = duck.position.y + 0.15; o.yaw = duck.rotation.y;
      }
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
//  { group, obstacles, rides, update } 를 돌려준다 (놀이터와 같은 모양)
// -----------------------------------------------------------
export function buildPool(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // 🧱 타일 데크
  const deck = new THREE.Mesh(new THREE.CircleGeometry(DECK_R, 40),
    new THREE.MeshToonMaterial({ color: W.tile, map: tileTexture('#ffe9c2', '#fff6e4', 14) }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = 0.03; deck.receiveShadow = true;
  group.add(deck);

  const body = makePoolBody();
  group.add(body);
  const slide = makeWaterSlide();
  slide.position.set(LANE_X, 0, SLIDE_Z);
  group.add(slide);
  const duck = makeDuckFloat();
  group.add(duck);

  const obstacles = [];
  const put = (m, lx, lz, ry = 0, r = 0) => {
    m.position.set(lx, 0, lz); m.rotation.y = ry; group.add(m);
    if (r) obstacles.push({ x: x + lx, z: z + lz, r });
    return m;
  };
  // 🌴 야자수 · ⛱ 파라솔 · 🛋 선탠 의자 · 🪑 안전요원 · 🚿 샤워기 · 🏐 비치볼
  for (const [lx, lz] of [[-15.5, -10], [15.5, -9], [16, 9], [-16.5, 9.5], [2, -15.5]]) put(makePalm(), lx, lz, Math.random() * 6, 0.9);
  put(makeParasol(W.pink), 3.5, 14.2, 0, 0.4);
  put(makeParasol(W.mint), 10.5, 14.2, 0, 0.4);
  put(makeParasol(W.orange), -14.5, 1.0, 0, 0.4);
  put(makeSunbed(W.sky), 6, 12.4, 0, 1.6);
  put(makeSunbed(W.yellow), 11, 12.4, 0, 1.6);
  put(makeGuardChair(), -16.5, -3.0, Math.PI / 2, 1.3);
  put(makeShower(), -2.5, 11.6, Math.PI, 0.5);
  const ball = part('ball', W.red, 2, WATER_Y + 0.5, -4.5, 1.2);
  group.add(ball);
  group.add(part('ball', W.white, 2, WATER_Y + 0.5, -4.5, 1.22, 0.5, 1.22));
  // 🪧 간판 — 광장 쪽(북동)에서 오면 보인다
  const sign = makeSign('🏊 야외 수영장', 10, 2.0, '#5ccfff', '#1b3a5c');
  sign.position.set(10, 4.6, -14.5); sign.rotation.y = 2.5;
  group.add(sign);
  //  간판은 길 위에 문처럼 걸려 있다 (아래로 지나다닌다) — 기둥 두 개만 막는다
  for (const s of [-1, 1]) {
    const px = 10 + Math.cos(2.5) * s * 4.4, pz = -14.5 - Math.sin(2.5) * s * 4.4;
    group.add(part('cyl', W.pole, px, 2.2, pz, 0.3, 4.4, 0.3));
    obstacles.push({ x: x + px, z: z + pz, r: 0.4 });
  }

  // 수영장 테두리 4개 — 아이는 못 넘어가지만 카메라는 물 위를 지날 수 있게 얇게 넷으로 나눴다
  const hw = POOL_W / 2, hd = POOL_D / 2;
  for (const s of [-1, 1]) {
    obstacles.push({ x, z: z + s * (hd + RIM / 2), hw: hw + RIM, hd: RIM / 2 + 0.2 });
    obstacles.push({ x: x + s * (hw + RIM / 2), z, hw: RIM / 2 + 0.2, hd: hd });
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

  //  ★ 오리 타기 pose는 오리의 **마을 좌표**를 읽는다 — 그룹이 (x, z)에 있으니 더한 값을 따로 둔다
  const duckWorld = { position: new THREE.Vector3(), rotation: duck.rotation };
  const duckRide = makeDuckRide(x, z, duckWorld);
  const rides = [makeSwimRide(x, z), makeSlideRide(x, z, splash), duckRide,
                 makeSunbedRide(x + 6, z + 12.4), makeSunbedRide(x + 11, z + 12.4)];
  let duckA = 0;

  function update(dt, t) {
    body.userData.water.position.y = WATER_Y + Math.sin(t * 1.3) * 0.03;
    const sp = body.userData.sparkles;
    for (let i = 0; i < sp.length; i++) sp[i].scale.setScalar(0.5 + Math.sin(t * 2 + i * 1.7) * 0.25);
    ball.position.y = WATER_Y + 0.5 + Math.sin(t * 1.8) * 0.12;
    // 🦆 오리 튜브 — 늘 천천히 돈다 (누가 타면 살짝 더 빨리)
    duckA += dt * DUCK_SPEED * (duckRide.rider ? 1.5 : 1);
    duck.position.set(DUCK.x + Math.cos(duckA) * DUCK.r, WATER_Y + Math.sin(t * 2) * 0.08,
                      DUCK.z + Math.sin(duckA) * DUCK.r);
    duck.rotation.y = Math.atan2(-Math.sin(duckA), Math.cos(duckA));   // 머리(+z)가 가는 쪽을 본다
    duckWorld.position.set(duck.position.x + x, duck.position.y, duck.position.z + z);
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

  return { group, obstacles, rides, update };
}
