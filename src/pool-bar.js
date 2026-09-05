// ===========================================================
//  🍹 수영장 야외 바 — 데크 동쪽에 있다. 펭귄 아저씨가 음료를 만들어 준다
//
//  카운터 앞에 서서 `주문하기`를 누르면 메뉴가 1번부터 차례로 나온다.
//  음료(또는 아이스크림)가 카운터 위에 놓이고, 펭귄이 날개를 흔든다.
//
//  ★ makeBar(bx, bz) → { group, spot, obstacles, tick }
//    bx, bz = 마을 안에서 카운터 한가운데 자리. 바는 서쪽(-x, 수영장 쪽)을 본다.
// ===========================================================
import * as THREE from 'three';
import { part, toon } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { W } from './pool-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 메뉴 (이름 · 색깔 · 모양)
// -----------------------------------------------------------
export const MENU = [
  { name: '오렌지 주스 🍊', color: 0xffa733, kind: 'cup' },
  { name: '딸기 스무디 🍓', color: 0xff6b8a, kind: 'cup' },
  { name: '레모네이드 🍋',  color: 0xfff176, kind: 'cup' },
  { name: '블루 소다 🫧',   color: 0x63c8ff, kind: 'cup' },
  { name: '아이스크림 🍦',  color: 0xfff1f6, kind: 'cone' },
];
const WAVE_TIME = 1.6;          // 주문하면 펭귄이 몇 초 동안 날개를 흔들까

const B = { counter: 0xd9a066, top: 0xfff4e0, straw: 0xf7d7a8, post: 0xb27a4a, stool: 0xff8fc0 };

// 🐧 펭귄 바텐더 — 몸통·배·부리·나비넥타이·날개 두 개
function makePenguin() {
  const g = new THREE.Group();
  g.add(part('ball', 0x2b2f4a, 0, 1.5, 0, 2.0, 2.8, 1.8));                // 몸
  g.add(part('ball', 0xffffff, 0, 1.35, 0.55, 1.4, 2.0, 1.0));            // 하얀 배
  for (const sx of [-1, 1]) g.add(part('ball', 0xffffff, sx * 0.34, 2.35, 0.75, 0.42));   // 눈
  for (const sx of [-1, 1]) g.add(part('ball', 0x111111, sx * 0.34, 2.35, 0.95, 0.18));
  const beak = part('cone', 0xffa733, 0, 2.0, 1.05, 0.5, 0.7, 0.5);
  beak.rotation.x = Math.PI / 2;
  g.add(beak);
  g.add(part('box', 0xff6b6b, 0, 1.75, 0.85, 0.9, 0.35, 0.2));            // 나비넥타이
  g.add(part('ball', 0xff6b6b, 0, 1.75, 0.9, 0.3));
  for (const sx of [-1, 1]) g.add(part('ball', 0xffa733, sx * 0.4, 0.1, 0.2, 0.7, 0.2, 1.0));   // 발
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = part('ball', 0x2b2f4a, 0, -0.6, 0, 0.5, 1.4, 0.7);
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.95, 2.0, 0);
    pivot.rotation.z = sx * 0.25;
    pivot.add(w);
    g.add(pivot);
    wings.push({ pivot, sx });
  }
  g.userData.wings = wings;
  return g;
}

// 🥤 컵 하나 — 투명 컵 + 색깔 음료 + 빨대   /  🍦 콘 아이스크림
function makeCup() {
  const g = new THREE.Group();
  const liquid = part('cyl', 0xffffff, 0, 0.45, 0, 0.7, 0.8, 0.7);
  g.add(liquid);
  const glass = part('cyl', 0xffffff, 0, 0.55, 0, 0.8, 1.1, 0.8,
    new THREE.MeshToonMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.35 }));
  g.add(glass);
  const straw = part('cyl', B.straw, 0.2, 1.1, 0, 0.1, 1.3, 0.1);
  straw.rotation.z = -0.25;
  g.add(straw);
  g.add(part('cyl', 0xffd93d, -0.3, 1.05, 0, 0.45, 0.05, 0.45));         // 레몬 조각
  g.userData.liquid = liquid;
  return g;
}
function makeCone() {
  const g = new THREE.Group();
  const cone = part('cone', 0xe0a458, 0, 0.5, 0, 0.7, 1.0, 0.7);
  cone.rotation.x = Math.PI;                                              // 뾰족한 쪽이 아래
  g.add(cone);
  const scoop = part('ball', 0xffffff, 0, 1.25, 0, 0.9);
  g.add(scoop);
  g.add(part('ball', 0xff6b8a, 0.1, 1.75, 0.1, 0.22));                    // 체리
  g.userData.liquid = scoop;
  return g;
}

/**
 * 바를 만든다. (bx, bz) = 마을 안 카운터 자리. 서쪽(-x)이 손님 쪽이다.
 */
export function makeBar(bx, bz) {
  const group = new THREE.Group();
  group.position.set(bx, 0, bz);

  // 카운터 (남북으로 길다) + 상판
  group.add(part('box', B.counter, 0, 0.6, 0, 2.2, 1.2, 8.0));
  group.add(part('box', B.top, 0, 1.28, 0, 2.6, 0.16, 8.4));
  // 지붕 — 기둥 4개 + 야자잎 지붕 (납작한 원뿔 두 겹)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    group.add(part('cyl', B.post, sx * 2.2, 2.2, sz * 4.4, 0.3, 4.4, 0.3));
  }
  group.add(part('cone', 0xc9a24d, 0, 5.0, 0, 8.0, 1.6, 12.0));
  group.add(part('cone', 0xdcb35c, 0, 5.5, 0, 6.0, 1.2, 9.0));
  // 🪧 지붕 밑 간판 (손님 쪽 = 서쪽을 본다)
  const sign = makeSign('🍹 시원한 음료 바', 7, 1.3, '#ffa733', '#3a2a1a');
  sign.position.set(-2.7, 3.2, 0); sign.rotation.y = -Math.PI / 2;   // 지붕에 안 가리게 지붕보다 낮게
  group.add(sign);
  // 📋 메뉴판 — 번호가 붙어 있다 (숫자마을이니까!)
  const board = new THREE.Group();
  board.position.set(1.4, 2.9, -3.2); board.rotation.y = -Math.PI / 2;
  board.add(part('box', 0x5c4630, 0, 0.0, -0.05, 3.9, 3.6, 0.1));
  MENU.forEach((m, i) => {
    const row = makeSign(`${i + 1}  ${m.name}`, 3.6, 0.55, '#fff6e4', '#3a2a1a');
    row.position.set(0, 1.4 - i * 0.62, 0.02);
    board.add(row);
  });
  group.add(board);
  // 🪑 손님 의자 3개 (서쪽)
  for (const z of [-2.4, 0, 2.4]) {
    group.add(part('cyl', B.stool, -2.4, 0.9, z, 1.1, 0.25, 1.1));
    group.add(part('cyl', B.post, -2.4, 0.4, z, 0.25, 0.8, 0.25));
  }
  // 🐧 펭귄 (카운터 뒤, 손님 쪽을 본다)
  const penguin = makePenguin();
  penguin.position.set(1.5, 0, 0); penguin.rotation.y = -Math.PI / 2;
  group.add(penguin);
  // 카운터 위 장식 — 과일 그릇 · 셰이커
  group.add(part('ball', 0xffa733, 0.3, 1.65, 3.2, 0.6));
  group.add(part('ball', 0xff6b8a, -0.3, 1.65, 3.4, 0.55));
  group.add(part('ball', 0x7ad48f, 0.1, 1.7, 3.7, 0.5));
  group.add(part('cyl', 0xd8dde6, 0.4, 1.9, -3.0, 0.7, 1.2, 0.7));

  // 🥤 주문한 것이 놓이는 자리 (카운터 손님 쪽 가운데)
  const cup = makeCup(), cone = makeCone();
  cup.position.set(-0.6, 1.36, 0); cone.position.set(-0.6, 1.36, 0);
  cup.visible = cone.visible = false;
  group.add(cup); group.add(cone);

  // --- 주문 ---
  let next = 0, waving = 0, served = 0;
  const spot = {
    x: bx - 3.6, z: bz, r: 3.6, y: 0, verb: '주문하기',
    use(toast) {
      const m = MENU[next]; next = (next + 1) % MENU.length; served++;
      const item = m.kind === 'cone' ? cone : cup;
      cup.visible = cone.visible = false;
      item.visible = true;
      item.userData.liquid.material = toon(m.color);        // 같은 색 재질은 다시 쓴다
      waving = WAVE_TIME;
      toast(`🐧 ${next === 0 ? MENU.length : next}번 ${m.name} 나왔어요! 꿀꺽꿀꺽~ (${served}잔째)`);
    },
  };
  const obstacles = [
    { x: bx, z: bz, hw: 1.3, hd: 4.2 },                    // 카운터
    { x: bx + 1.5, z: bz, r: 1.0 },                         // 펭귄
    ...[-2.4, 0, 2.4].map(z => ({ x: bx - 2.4, z: bz + z, r: 0.5 })),   // 의자
    ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => ({ x: bx + sx * 2.2, z: bz + sz * 4.4, r: 0.35 })),
  ];

  function tick(t, dt) {
    if (waving > 0) {
      waving -= dt;
      for (const w of penguin.userData.wings) w.pivot.rotation.z = w.sx * (0.25 + Math.abs(Math.sin(t * 14)) * 1.2);
    } else {
      for (const w of penguin.userData.wings) w.pivot.rotation.z = w.sx * (0.25 + Math.sin(t * 2) * 0.05);
    }
    penguin.position.y = Math.abs(Math.sin(t * 3)) * 0.05;   // 살짝 콩콩
  }

  return { group, spot, obstacles, tick };
}
