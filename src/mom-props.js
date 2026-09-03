// ===========================================================
//  💗 엄마성(키즈카페)에 놓을 물건들 — 볼풀·트램폴린·블록·씽씽카·인형집…
//
//  ★ 여기는 "모양"만 만든다. 어느 층에 놓을지는 src/mom-castle.js가 정한다.
//  ★ 움직이는 물건은 group.userData.tick = (t, dt) => {…} 에 적어둔다.
// ===========================================================
import * as THREE from 'three';
import { part, glow, toon } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 색깔
// -----------------------------------------------------------
export const P = {
  pink:    0xff9ec4,
  hot:     0xff6fa5,
  cream:   0xfff6e8,
  yellow:  0xffd45e,
  sky:     0xa8e6ff,
  mint:    0xa8ead8,
  violet:  0xc9b4ff,
  lime:    0xb6e58a,
  orange:  0xffb166,
  wood:    0xc98a56,
  gray:    0xd8d2e8,
};

// 볼풀 공 색깔 (여기 색을 바꾸면 공 색이 바뀐다)
const BALL_COLORS = [P.pink, P.yellow, P.sky, P.lime, P.violet, P.orange];

// -----------------------------------------------------------
//  🎈 볼풀장 — 폭신한 벽 안에 색색 공이 가득
//    w, d = 볼풀 크기.  돌려주는 group.userData.tick이 공을 흔들어 준다
// -----------------------------------------------------------
export function makeBallPit(w = 14, d = 12, count = 110) {
  const g = new THREE.Group();
  // 폭신한 테두리 (네 면)
  for (const [x, z, sx, sz] of [
    [0, -d / 2, w + 1.6, 1.6], [0, d / 2, w + 1.6, 1.6],
    [-w / 2, 0, 1.6, d], [w / 2, 0, 1.6, d],
  ]) {
    g.add(part('box', P.hot, x, 0.7, z, sx, 1.4, sz));
    g.add(part('box', P.cream, x, 1.5, z, sx * 0.98, 0.4, sz * 0.98));   // 위 덮개
  }
  g.add(part('box', P.cream, 0, 0.06, 0, w, 0.12, d));                   // 바닥 매트

  // 공 — 같은 도형을 나눠 쓰고, 색깔은 여섯 가지만 쓴다
  const balls = [];
  for (let i = 0; i < count; i++) {
    const c = BALL_COLORS[i % BALL_COLORS.length];
    const b = part('ball', c, (Math.random() - 0.5) * (w - 1.6), 0.5,
                   (Math.random() - 0.5) * (d - 1.6), 0.9);
    b.castShadow = false;
    g.add(b);
    balls.push({ m: b, base: 0.35 + Math.random() * 0.4, ph: Math.random() * 6 });
  }
  g.userData.balls = balls;
  //  splash를 켜면(아이가 볼풀에 들어가면) 공이 마구 튄다
  g.userData.splash = false;
  g.userData.tick = (t) => {
    const s = g.userData.splash ? 1 : 0;
    for (const b of balls) {
      b.m.position.y = b.base + Math.sin(t * (1.4 + s * 3.4) + b.ph) * (0.12 + s * 0.7);
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🤸 트램폴린 — 통통 뛰는 곳
// -----------------------------------------------------------
export function makeTrampoline(r = 4.2) {
  const g = new THREE.Group();
  g.add(part('cyl', P.violet, 0, 0.5, 0, r * 2 + 1.0, 1.0, r * 2 + 1.0));   // 테두리
  const mat = part('cyl', 0x3a3560, 0, 1.05, 0, r * 2, 0.2, r * 2);          // 뛰는 천
  mat.receiveShadow = true;
  g.add(mat);
  // 안전 기둥 4개 + 그물 느낌의 띠
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(part('cyl', P.cream, x, 2.4, z, 0.4, 4.8, 0.4));
    g.add(part('ball', P.hot, x, 4.9, z, 0.6));
  }
  g.userData.tick = (t) => { mat.position.y = 1.05 + Math.sin(t * 2.2) * 0.05; };
  return g;
}

// -----------------------------------------------------------
//  🛝 무지개 미끄럼틀 — 계단으로 올라가서 주르륵 내려온다
//    len = 미끄러지는 길이, top = 꼭대기 높이
// -----------------------------------------------------------
export function makeRainbowSlide(len = 12, top = 5.4) {
  const g = new THREE.Group();
  const RAINBOW = [0xff8a8a, 0xffb166, 0xffd45e, 0xb6e58a, 0xa8e6ff, 0xc9b4ff];

  // 미끄러지는 널빤지 (+z 쪽으로 내려간다)
  const slope = Math.atan2(top - 0.5, len);
  const board = part('box', P.cream, 0, (top + 0.5) / 2, len / 2,
                     3.4, 0.3, Math.hypot(len, top - 0.5));
  board.rotation.x = -slope;
  g.add(board);
  // 무지개 줄무늬
  for (let i = 0; i < RAINBOW.length; i++) {
    const s = part('box', RAINBOW[i], -1.4 + i * 0.56, (top + 0.5) / 2 + 0.2, len / 2,
                   0.5, 0.1, Math.hypot(len, top - 0.5));
    s.rotation.x = -slope;
    s.castShadow = false;
    g.add(s);
  }
  // 양옆 난간
  for (const sx of [-1, 1]) {
    const rail = part('box', P.hot, sx * 1.9, (top + 0.5) / 2 + 0.6, len / 2,
                      0.3, 1.0, Math.hypot(len, top - 0.5));
    rail.rotation.x = -slope;
    g.add(rail);
  }
  // 꼭대기 발판 + 올라가는 계단 (-z 쪽)
  g.add(part('box', P.violet, 0, top - 0.2, -1.2, 4.0, 0.4, 3.0));
  for (let i = 0; i < 6; i++) {
    const h = (i + 1) / 6 * top;
    g.add(part('box', i % 2 ? P.yellow : P.sky, 0, h / 2, -2.8 - i * 1.1, 3.6, h, 1.1));
  }
  return g;
}

// -----------------------------------------------------------
//  🧱 큰 블록 — 쌓기 놀이용. 숫자가 적혀 있다
// -----------------------------------------------------------
export function makeBlockPile() {
  const g = new THREE.Group();
  const cols = [P.pink, P.yellow, P.sky, P.lime, P.violet, P.orange];
  const spots = [[-2.4, -1.2], [0, -1.4], [2.4, -1.0], [-1.2, 1.2], [1.4, 1.4], [3.4, 0.6]];
  spots.forEach(([x, z], i) => {
    const b = part('box', cols[i % cols.length], x, 0.85, z, 1.7, 1.7, 1.7);
    b.rotation.y = Math.random();
    g.add(b);
  });
  // 벌써 쌓아둔 탑 하나
  for (let i = 0; i < 4; i++) {
    g.add(part('box', cols[i], -4.6, 0.85 + i * 1.7, 2.2, 1.7, 1.7, 1.7));
  }
  return g;
}

/** 🧱 블록 하나 (쌓기 놀이에서 한 개씩 올라간다) */
export function makeOneBlock(color) {
  return part('box', color, 0, 0, 0, 1.7, 1.7, 1.7);
}

// -----------------------------------------------------------
//  🚗 씽씽카 — 앉아서 발로 미는 자동차
// -----------------------------------------------------------
export function makeToyCar(color = P.hot) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 0.85, 0, 2.2, 0.9, 3.4));            // 몸통
  g.add(part('box', P.cream, 0, 1.5, -0.5, 1.7, 0.5, 1.2));        // 등받이
  g.add(part('cyl', P.gray, 0, 1.7, 0.9, 1.0, 0.16, 1.0));         // 핸들
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = part('cyl', 0x4a4458, sx * 1.15, 0.5, sz * 1.2, 1.0, 0.4, 1.0);
    wheel.rotation.z = Math.PI / 2;
    g.add(wheel);
  }
  g.add(part('ball', P.yellow, 0, 1.4, 1.75, 0.5, 0.5, 0.4, glow(P.yellow)));  // 앞 전등
  return g;
}

/** 🛣 씽씽카가 도는 길 (바닥에 그린 동그란 트랙) */
export function makeCarTrack(r = 10) {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.RingGeometry(r - 2.2, r + 2.2, 40),
                              toon(0x6f6a86));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.05;
  road.receiveShadow = true;
  g.add(road);
  // 가운데 점선
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const d = part('box', P.cream, Math.cos(a) * r, 0.09, Math.sin(a) * r, 1.2, 0.04, 0.4);
    d.rotation.y = -a;
    d.castShadow = false;
    g.add(d);
  }
  // 길가 고깔
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    g.add(part('cone', P.orange, Math.cos(a) * (r + 3.4), 0.5, Math.sin(a) * (r + 3.4),
               1.0, 1.2, 1.0));
  }
  return g;
}

// -----------------------------------------------------------
//  🧸 인형의 집 — 앞이 뚫려 있어서 방 안이 보인다
// -----------------------------------------------------------
export function makeDollHouse() {
  const g = new THREE.Group();
  g.add(part('box', P.cream, 0, 3.0, -1.2, 7.0, 6.0, 0.5));         // 뒷벽
  g.add(part('box', P.cream, -3.4, 3.0, 0, 0.5, 6.0, 2.4));         // 옆벽
  g.add(part('box', P.cream, 3.4, 3.0, 0, 0.5, 6.0, 2.4));
  g.add(part('box', P.wood, 0, 3.0, 0, 6.8, 0.3, 2.4));             // 2층 바닥
  const roof = part('cone', P.hot, 0, 7.0, -0.2, 8.4, 2.6, 4.2);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // 작은 가구
  g.add(part('box', P.pink, -2.0, 0.6, -0.2, 2.0, 1.2, 1.4));       // 침대
  g.add(part('box', P.sky, 1.8, 0.5, -0.2, 1.6, 1.0, 1.2));         // 탁자
  g.add(part('box', P.violet, -1.8, 3.7, -0.2, 1.6, 1.2, 1.2));     // 2층 소파
  g.add(part('box', P.yellow, 1.8, 3.6, -0.2, 1.2, 1.0, 1.0));
  // 인형 둘 (동글동글하게)
  for (const [x, y, c] of [[-1.0, 1.5, P.yellow], [1.2, 4.4, P.mint]]) {
    g.add(part('ball', c, x, y, 0.2, 0.9));
    g.add(part('ball', P.cream, x, y + 0.8, 0.2, 0.7));
  }
  return g;
}

// -----------------------------------------------------------
//  🥁 실로폰 — 두드리면 소리가 난다 (도레미파솔라시)
//    userData.hit(i) 를 부르면 그 판이 통 하고 눌렸다 올라온다
// -----------------------------------------------------------
export const XYLO_NOTES = [60, 62, 64, 65, 67, 69, 71, 72];       // 도레미파솔라시도
const XYLO_COLORS = [0xff8a8a, 0xffb166, 0xffd45e, 0xb6e58a, 0xa8e6ff, 0x8fb6ff, 0xc9b4ff, 0xffa8d8];

export function makeXylophone() {
  const g = new THREE.Group();
  g.add(part('box', P.wood, 0, 0.35, 0, 9.6, 0.7, 3.6));           // 받침
  const bars = [];
  for (let i = 0; i < XYLO_NOTES.length; i++) {
    const w = 3.2 - i * 0.16;
    const b = part('box', XYLO_COLORS[i], -4.2 + i * 1.2, 0.85, 0, 1.0, 0.3, w);
    g.add(b);
    bars.push(b);
  }
  // 채 두 개
  for (const sx of [-1, 1]) {
    g.add(part('cyl', P.cream, sx * 2.2, 1.2, 2.2, 0.16, 2.2, 0.16));
    g.add(part('ball', P.hot, sx * 2.2, 2.3, 2.2, 0.5));
  }
  const hits = bars.map(() => 0);
  g.userData.hit = (i) => { hits[i % bars.length] = 1; };
  g.userData.tick = (t, dt) => {
    for (let i = 0; i < bars.length; i++) {
      if (hits[i] > 0) hits[i] = Math.max(0, hits[i] - dt * 3);
      bars[i].position.y = 0.85 - hits[i] * 0.18;
    }
  };
  return g;
}

/** 🥁 북 — 옆에 놓고 같이 두드린다 */
export function makeDrum(color = P.hot, r = 1.6) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, r * 0.7, 0, r * 2, r * 1.4, r * 2));
  g.add(part('cyl', P.cream, 0, r * 1.42, 0, r * 2.1, 0.16, r * 2.1));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(part('box', P.yellow, Math.cos(a) * r, r * 0.7, Math.sin(a) * r, 0.2, r * 1.3, 0.2));
  }
  return g;
}

// -----------------------------------------------------------
//  🍰 간식 코너 — 케이크와 주스가 놓인 카운터
// -----------------------------------------------------------
export function makeSnackBar(len = 8) {
  const g = new THREE.Group();
  g.add(part('box', P.cream, 0, 1.1, 0, len, 2.2, 2.0));
  g.add(part('box', P.hot, 0, 2.3, 0, len + 0.4, 0.3, 2.4));       // 상판 테두리
  // 케이크 세 조각
  for (let i = 0; i < 3; i++) {
    const x = -len / 3 + i * (len / 3);
    g.add(part('cyl', P.cream, x, 2.6, 0, 1.4, 0.5, 1.4));
    g.add(part('cyl', i % 2 ? P.pink : P.yellow, x, 2.95, 0, 1.4, 0.24, 1.4));
    g.add(part('ball', 0xff5a7a, x, 3.2, 0, 0.36));
  }
  // 주스 컵 두 개
  for (const sx of [-1, 1]) {
    g.add(part('cyl', 0xffd9a8, sx * (len / 2 - 0.8), 2.85, 0.6, 0.7, 1.0, 0.7));
    g.add(part('cyl', P.lime, sx * (len / 2 - 0.8), 3.6, 0.6, 0.12, 1.4, 0.12));
  }
  return g;
}

// -----------------------------------------------------------
//  ⛺ 이야기 텐트 — 안에 방석이 있어서 앉아 쉰다
// -----------------------------------------------------------
export function makeTent(color = P.sky) {
  const g = new THREE.Group();
  const roof = part('cone', color, 0, 3.0, 0, 8.0, 6.0, 8.0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(part('cyl', P.cream, 0, 6.2, 0, 0.3, 1.2, 0.3));
  g.add(part('ball', P.yellow, 0, 7.0, 0, 0.8, 0.8, 0.8, glow(P.yellow)));
  // 입구 천 (앞쪽만 열려 있다)
  for (const sx of [-1, 1]) {
    const flap = part('box', P.cream, sx * 1.5, 1.6, 2.7, 1.2, 3.2, 0.2);
    flap.rotation.z = sx * 0.12;
    g.add(flap);
  }
  g.add(part('cyl', P.violet, 0, 0.2, 0, 5.4, 0.3, 5.4));          // 깔개
  return g;
}

// -----------------------------------------------------------
//  ☁️ 폭신한 구름 (10층 전망대 장식)
// -----------------------------------------------------------
export function makeFluffyCloud(s = 1) {
  const g = new THREE.Group();
  const M = new THREE.MeshToonMaterial({ color: 0xffffff });
  for (const [x, y, z, r] of [[0, 0, 0, 2.0], [1.6, -0.3, 0.3, 1.4],
                              [-1.5, -0.2, -0.2, 1.5], [0.5, 0.6, -0.4, 1.2]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), M);
    b.position.set(x * s, y * s, z * s);
    b.scale.setScalar(r * 2 * s);
    b.castShadow = false;
    g.add(b);
  }
  return g;
}

// -----------------------------------------------------------
//  🎀 층마다 붙는 큰 리본 장식
// -----------------------------------------------------------
export function makeRibbon(color = P.hot, s = 1) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const w = part('box', color, sx * 1.1 * s, 0, 0, 1.8 * s, 1.2 * s, 0.3 * s);
    w.rotation.z = sx * 0.35;
    g.add(w);
  }
  g.add(part('ball', color, 0, 0, 0, 0.9 * s));
  return g;
}
