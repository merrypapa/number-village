// ===========================================================
//  🏠 친구 집 안에 놓는 가구들 — 소파 · 탁자 · TV · 부엌 · 창문 · 액자
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 src/houses.js가 정한다.
//  ★ 집마다 다른 특별한 물건(다리미·피아노·장난감)은 src/house-theme.js에 있다.
// ===========================================================
import * as THREE from 'three';
import { C, part, toon, glow, canvasTex } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const SOFA_SEAT = 1.05;    // 소파에 앉았을 때 엉덩이 높이
const WOOD = 0xc98a56, WOOD_D = 0x9a6238;

// -----------------------------------------------------------
//  🛋 소파 — 앉는 자리는 +z 쪽을 바라본다
// -----------------------------------------------------------
export function makeSofa(color = 0xff9ec4, len = 4.4) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 0.45, 0, len, 0.9, 2.0));                 // 받침
  g.add(part('box', 0xffffff, 0, 1.0, 0.15, len - 0.7, 0.35, 1.6));     // 방석
  g.add(part('box', color, 0, 1.35, -0.9, len, 1.8, 0.5));              // 등받이
  for (const s of [-1, 1]) {
    g.add(part('box', color, s * (len / 2 - 0.25), 1.1, 0, 0.5, 1.2, 2.0));  // 팔걸이
  }
  // 쿠션 두 개
  for (const s of [-1, 1]) {
    const c = part('box', 0xfff6e8, s * len * 0.22, 1.5, -0.55, 0.9, 0.9, 0.3);
    c.rotation.z = s * 0.2;
    g.add(c);
  }
  // 다리
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', WOOD_D, sx * (len / 2 - 0.4), 0.1, sz * 0.75, 0.2, 0.25, 0.2));
  }
  return g;
}

/** 🪑 앉는 자리 하나 — 소파·의자에 앉는 규칙 (rides.js가 쓴다) */
export function makeSeatRide(x, z, opt = {}) {
  const seatY = opt.seatY ?? SOFA_SEAT;
  const yaw = opt.yaw ?? 0;
  const front = opt.front ?? 2.4;      // 앉으러 다가서는 자리까지의 거리
  const ex = x + Math.sin(yaw) * front, ez = z + Math.cos(yaw) * front;
  return {
    kind: 'seat',
    label: opt.label ?? '푹신푹신 앉았어요! 🛋',
    verb: opt.verb ?? '앉기', offVerb: '일어나기',
    enter: { x: ex, z: ez }, exit: { x: ex, z: ez },
    reach: opt.reach ?? 3.0,
    noNpc: true, duration: 999, autoEnd: false, rider: null,
    camDist: 8, camHeight: 5,
    pose(t, o) {
      o.x = x; o.z = z;
      o.y = seatY + Math.sin(t * 1.6) * 0.04;
      o.yaw = yaw + Math.sin(t * 0.7) * 0.1;
      o.tilt = -0.05;
      return o;
    },
  };
}

// -----------------------------------------------------------
//  🪵 거실 탁자 — 위에 컵과 과일 접시가 놓여 있다
// -----------------------------------------------------------
export function makeLowTable() {
  const g = new THREE.Group();
  g.add(part('box', WOOD, 0, 0.75, 0, 2.6, 0.16, 1.6));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', WOOD_D, sx * 1.05, 0.37, sz * 0.6, 0.2, 0.75, 0.2));
  }
  g.add(part('cyl', 0xfff6e8, -0.7, 0.93, 0.2, 0.44, 0.2, 0.44));   // 접시
  for (let i = 0; i < 3; i++) {
    g.add(part('ball', [0xff5a5a, 0xffd93d, 0x7ad48f][i], -0.7 + (i - 1) * 0.16, 1.08, 0.2, 0.26));
  }
  g.add(part('cyl', 0xa8e6ff, 0.8, 1.03, -0.1, 0.32, 0.4, 0.32));   // 컵
  return g;
}

// -----------------------------------------------------------
//  📺 TV — 켜면 화면에 알록달록한 그림이 나온다
//     userData.setOn(true/false)로 껐다 켰다 한다
// -----------------------------------------------------------
export function makeTv() {
  const g = new THREE.Group();
  g.add(part('box', WOOD, 0, 0.5, 0, 4.0, 1.0, 1.2));               // 받침장
  g.add(part('box', 0x3a4050, 0, 1.15, 0, 0.6, 0.3, 0.6));          // 목
  g.add(part('box', 0x2a3040, 0, 2.3, 0, 4.4, 2.5, 0.3));           // 몸통

  const onTex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#9fe08a'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(0, 0, s, s * 0.55);
    ctx.fillStyle = '#ffd93d'; ctx.beginPath(); ctx.arc(s * 0.78, s * 0.2, s * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9ec4'; ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.55); ctx.lineTo(s * 0.4, s * 0.2); ctx.lineTo(s * 0.6, s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${s * 0.16}px sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText('TV', s / 2, s * 0.86);
  });
  const onMat = new THREE.MeshBasicMaterial({ map: onTex });
  const offMat = toon(0x1a1f2a);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.1), offMat);
  screen.position.set(0, 2.3, 0.17);
  g.add(screen);

  g.userData.setOn = (on) => { screen.material = on ? onMat : offMat; };
  return g;
}

// -----------------------------------------------------------
//  🧶 바닥 깔개 (러그)
// -----------------------------------------------------------
export function makeRug(color = 0xffd45e, w = 5, d = 4) {
  const g = new THREE.Group();
  const r = part('box', color, 0, 0.04, 0, w, 0.08, d);
  r.castShadow = false; r.receiveShadow = true;
  g.add(r);
  const inner = part('box', 0xfff6e8, 0, 0.06, 0, w - 0.8, 0.08, d - 0.8);
  inner.castShadow = false;
  g.add(inner);
  const core = part('box', color, 0, 0.08, 0, w - 1.8, 0.08, d - 1.8);
  core.castShadow = false;
  g.add(core);
  return g;
}

// -----------------------------------------------------------
//  🍳 부엌 — 싱크대 · 수도꼭지 · 가스레인지 · 냄비 · 위쪽 찬장
//     (+z 쪽을 바라본다. 벽에 등을 붙여 놓는다)
// -----------------------------------------------------------
export function makeKitchen(len = 6) {
  const g = new THREE.Group();
  g.add(part('box', 0xfff6e8, 0, 0.55, 0, len, 1.1, 1.4));           // 아래장
  g.add(part('box', 0xdfe3ea, 0, 1.16, 0, len + 0.1, 0.14, 1.5));    // 상판
  for (let i = 0; i < Math.floor(len / 1.5); i++) {                   // 서랍 손잡이
    g.add(part('box', 0xb9c2d0, -len / 2 + 0.75 + i * 1.5, 0.72, 0.72, 0.7, 0.1, 0.08));
  }

  // 싱크대(개수대) + 수도꼭지
  g.add(part('box', 0xb9c2d0, -len * 0.25, 1.16, 0, 1.6, 0.22, 1.0));
  g.add(part('cyl', 0xdfe3ea, -len * 0.25, 1.5, -0.5, 0.14, 0.7, 0.14));
  g.add(part('box', 0xdfe3ea, -len * 0.25, 1.82, -0.25, 0.12, 0.12, 0.6));

  // 가스레인지 + 냄비
  g.add(part('box', 0x3a4050, len * 0.25, 1.25, 0, 1.6, 0.12, 1.1));
  for (const sx of [-1, 1]) {
    g.add(part('cyl', 0x2a3040, len * 0.25 + sx * 0.42, 1.32, 0, 0.6, 0.08, 0.6));
  }
  const pot = part('cyl', 0xff5a5a, len * 0.25 - 0.42, 1.62, 0, 0.8, 0.6, 0.8);
  g.add(pot);
  g.add(part('cyl', 0xdfe3ea, len * 0.25 - 0.42, 1.95, 0, 0.86, 0.1, 0.86));

  // 위쪽 찬장
  g.add(part('box', 0xffe3ef, 0, 3.3, -0.35, len, 1.4, 0.8));
  for (let i = 0; i < Math.floor(len / 2); i++) {
    g.add(part('box', 0xb9c2d0, -len / 2 + 1 + i * 2, 3.3, 0.1, 0.1, 0.6, 0.1));
  }
  return g;
}

/** 🧊 집 냉장고 — 문 두 짝에 자석 그림이 붙어 있다 */
export function makeHomeFridge(color = 0xf2f5f8) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 2.0, 0, 1.8, 4.0, 1.5));
  g.add(part('box', 0xdfe3ea, 0, 2.72, 0.02, 1.84, 0.1, 1.54));      // 문 사이 틈
  for (const y of [1.2, 3.3]) g.add(part('box', 0xb9c2d0, 0.6, y, 0.78, 0.12, 0.9, 0.1));
  for (let i = 0; i < 3; i++) {                                       // 자석
    g.add(part('box', [0xff5a5a, 0xffd93d, 0x63c8ff][i], -0.35 + i * 0.32, 3.0, 0.78,
               0.22, 0.22, 0.05));
  }
  return g;
}

/** 🍽 식탁과 의자 두 개 */
export function makeDiningSet() {
  const g = new THREE.Group();
  g.add(part('cyl', 0xfff6e8, 0, 1.3, 0, 2.8, 0.16, 2.8));
  g.add(part('cyl', WOOD_D, 0, 0.65, 0, 0.4, 1.3, 0.4));
  g.add(part('cyl', WOOD_D, 0, 0.1, 0, 1.6, 0.2, 1.6));
  for (const sz of [-1, 1]) {
    const ch = new THREE.Group();
    ch.add(part('box', WOOD, 0, 0.8, 0, 1.0, 0.14, 1.0));
    ch.add(part('box', WOOD, 0, 1.35, sz * 0.45, 1.0, 1.1, 0.14));
    for (const ax of [-1, 1]) for (const az of [-1, 1]) {
      ch.add(part('cyl', WOOD_D, ax * 0.38, 0.4, az * 0.38, 0.14, 0.8, 0.14));
    }
    ch.position.set(0, 0, sz * 2.2);
    g.add(ch);
  }
  for (const sx of [-1, 1]) {
    g.add(part('cyl', 0xffffff, sx * 0.7, 1.42, 0, 0.7, 0.1, 0.7));   // 접시
  }
  return g;
}

/**
 * 벽에 붙이는 것(창문·액자·시계)은 그림자를 만들지 않게 한다.
 *  ★ 벽에 딱 붙은 납작한 물건이 스스로 그림자를 드리우면
 *    비스듬한 얼룩(줄무늬)이 생겨서 그림이 지저분해 보인다.
 */
function flat(group) {
  group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return group;
}

// -----------------------------------------------------------
//  🪟 창문 — 밖에 하늘과 잔디, 해가 보인다 (Canvas 그림)
// -----------------------------------------------------------
export function makeWindow(w = 3.4, h = 3.0) {
  const g = new THREE.Group();
  const view = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#9fe08a'; ctx.fillRect(0, s * 0.68, s, s * 0.32);
    ctx.fillStyle = '#fff6c0';
    ctx.beginPath(); ctx.arc(s * 0.78, s * 0.2, s * 0.11, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [cx, cy, r] of [[0.25, 0.25, 0.09], [0.36, 0.27, 0.07], [0.15, 0.3, 0.06]]) {
      ctx.beginPath(); ctx.arc(s * cx, s * cy, s * r, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#69c96b';
    for (const cx of [0.2, 0.55, 0.85]) {
      ctx.beginPath(); ctx.arc(s * cx, s * 0.63, s * 0.1, 0, 7); ctx.fill();
    }
  });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: view }));
  g.add(pane);
  g.add(part('box', 0xfff6e8, 0, 0, -0.06, w + 0.5, h + 0.5, 0.14));      // 창틀
  g.add(part('box', 0xfff6e8, 0, 0, 0.04, 0.14, h, 0.1));                 // 십자 창살
  g.add(part('box', 0xfff6e8, 0, 0, 0.04, w, 0.14, 0.1));
  for (const s of [-1, 1]) {                                              // 커튼
    g.add(part('box', 0xffb8d4, s * (w / 2 + 0.15), 0.1, 0.16, 0.8, h + 0.4, 0.16));
  }
  return flat(g);
}

/** 🖼 벽에 거는 액자 — 안에 그림이 그려져 있다 */
export function makePicture(kind = 0, w = 1.8, h = 1.4) {
  const art = canvasTex(96, (ctx, s) => {
    const skies = ['#ffe8f4', '#e8f4ff', '#fff6e0'];
    ctx.fillStyle = skies[kind % 3]; ctx.fillRect(0, 0, s, s);
    if (kind % 3 === 0) {            // 하트
      ctx.fillStyle = '#ff7a9c';
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.42, s * 0.14, 0, 7);
      ctx.arc(s * 0.6, s * 0.42, s * 0.14, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.27, s * 0.5); ctx.lineTo(s * 0.5, s * 0.82);
      ctx.lineTo(s * 0.73, s * 0.5); ctx.fill();
    } else if (kind % 3 === 1) {     // 무지개
      const cols = ['#ff7a9c', '#ffa733', '#ffd93d', '#7ad48f', '#63c8ff'];
      for (let i = 0; i < cols.length; i++) {
        ctx.strokeStyle = cols[i]; ctx.lineWidth = s * 0.07;
        ctx.beginPath(); ctx.arc(s / 2, s * 0.85, s * (0.15 + i * 0.08), Math.PI, 0); ctx.stroke();
      }
    } else {                         // 별과 달
      ctx.fillStyle = '#ffd45e';
      for (const [x, y, r] of [[0.3, 0.3, 0.07], [0.7, 0.25, 0.05], [0.55, 0.6, 0.06]]) {
        ctx.beginPath(); ctx.arc(s * x, s * y, s * r, 0, 7); ctx.fill();
      }
    }
  });
  const g = new THREE.Group();
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: art }));
  g.add(pic);
  g.add(part('box', WOOD, 0, 0, -0.06, w + 0.3, h + 0.3, 0.12));
  return flat(g);
}

/** 💡 서 있는 등 (불이 켜져 있다) */
export function makeFloorLamp(color = 0xfff0a8) {
  const g = new THREE.Group();
  g.add(part('cyl', 0xb9c2d0, 0, 0.08, 0, 1.0, 0.16, 1.0));
  g.add(part('cyl', 0xdfe3ea, 0, 1.4, 0, 0.14, 2.8, 0.14));
  const shade = part('cone', 0xfff3d0, 0, 3.1, 0, 1.6, 1.1, 1.6);
  shade.rotation.x = Math.PI;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), glow(color));
  bulb.scale.setScalar(0.5);
  bulb.position.y = 2.75;
  bulb.userData.noShadow = true;
  g.add(bulb);
  return g;
}

/** 🕐 벽시계 — 초바늘이 돈다 */
export function makeWallClock() {
  const g = new THREE.Group();
  const body = part('cyl', 0xfff6e8, 0, 0, 0, 1.4, 0.18, 1.4);   // 눕힌 원통 = 동그란 시계
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const face = part('cyl', 0xffffff, 0, 0, 0.1, 1.2, 0.06, 1.2);
  face.rotation.x = Math.PI / 2;
  g.add(face);
  const hand = part('box', 0x5b3d8f, 0, 0.2, 0.16, 0.06, 0.45, 0.06);
  const pivot = new THREE.Group();
  pivot.add(hand);
  pivot.position.z = 0;
  g.add(pivot);
  g.userData.tick = (t) => { pivot.rotation.z = -t * 0.5; };
  return flat(g);
}
