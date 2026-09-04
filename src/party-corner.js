// ===========================================================
//  🎂 생일 파티 코너 — 커핑·머핑의 생일 파티 집에 놓인다
//
//  큰 생일 케이크(초 7개) · 선물 상자 · 풍선 · "생일 축하해" 현수막.
//  버튼(후~ 불기)을 누르면 촛불이 꺼지고 색종이가 팡 터진다.
//  촛불은 잠시 뒤에 저절로 다시 켜져서 몇 번이고 다시 불 수 있다.
//
//  ★ 다른 코너처럼 group.userData.press() 로 반응하고,
//    group.userData.tick(t, dt) 로 움직인다 (houses.js가 불러준다).
// ===========================================================
import * as THREE from 'three';
import { C, part, glow, makeBalloons } from './castle-props.js';
import { makeSign } from './mart-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const CANDLES = 7;              // 초 개수 (일곱 살이니까 일곱 개!)
const RELIGHT_AFTER = 8;        // 불을 끄고 몇 초 뒤에 다시 켜질까
const CONFETTI = 70;            // 색종이 조각 수
const CONFETTI_COLORS = [0xff7a9c, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff, 0xffa733];

// 🎁 선물 상자 하나 — 상자 + 리본 + 매듭
function makeGift(color, ribbon, s = 1.4) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, s / 2, 0, s, s, s));
  g.add(part('box', ribbon, 0, s / 2, 0, s * 1.04, s * 1.04, s * 0.22));
  g.add(part('box', ribbon, 0, s / 2, 0, s * 0.22, s * 1.04, s * 1.04));
  g.add(part('ball', ribbon, 0, s + 0.15, 0, s * 0.45, s * 0.3, s * 0.45));
  return g;
}

// 🎉 고깔모자 하나 (탁자 옆에 놓아둔다)
function makeHat(color) {
  const g = new THREE.Group();
  g.add(part('cone', color, 0, 0.7, 0, 1.0, 1.4, 1.0));
  g.add(part('ball', 0xfff6e8, 0, 1.45, 0, 0.3));
  return g;
}

export function makePartyCorner() {
  const g = new THREE.Group();

  // --- 탁자 ---
  g.add(part('cyl', C.wood, 0, 0.9, 0, 0.8, 1.8, 0.8));
  g.add(part('cyl', C.wood, 0, 0.12, 0, 2.4, 0.25, 2.4));
  g.add(part('cyl', C.cream, 0, 1.9, 0, 5.2, 0.3, 5.2));
  g.add(part('cyl', 0xff9ec4, 0, 2.07, 0, 4.8, 0.06, 4.8));    // 분홍 식탁보

  // --- 🎂 3층 생일 케이크 ---
  const TOP = 2.05;
  g.add(part('cyl', C.cream, 0, TOP + 0.55, 0, 3.2, 1.1, 3.2));
  g.add(part('cyl', 0xff7a9c, 0, TOP + 1.15, 0, 3.3, 0.22, 3.3));   // 딸기 크림
  g.add(part('cyl', C.cream, 0, TOP + 1.7, 0, 2.3, 0.9, 2.3));
  g.add(part('cyl', 0xa8e6ff, 0, TOP + 2.2, 0, 2.4, 0.2, 2.4));     // 하늘색 크림
  g.add(part('cyl', C.cream, 0, TOP + 2.65, 0, 1.5, 0.7, 1.5));
  g.add(part('cyl', 0xffd93d, 0, TOP + 3.05, 0, 1.6, 0.16, 1.6));   // 노란 크림
  // 딸기 두 줄
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(part('ball', 0xff5f7a, Math.cos(a) * 1.35, TOP + 1.3, Math.sin(a) * 1.35, 0.3));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    g.add(part('ball', 0xff5f7a, Math.cos(a) * 0.95, TOP + 2.35, Math.sin(a) * 0.95, 0.26));
  }

  // --- 🕯 초 7개 — 불꽃은 따로 모아둔다 (끄고 켜려고) ---
  const flames = [];
  for (let i = 0; i < CANDLES; i++) {
    const a = (i / CANDLES) * Math.PI * 2;
    const x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55;
    const col = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    g.add(part('cyl', col, x, TOP + 3.5, z, 0.14, 0.8, 0.14));
    const f = part('ball', 0xffe08a, x, TOP + 4.05, z, 0.22, 0.36, 0.22, glow(0xffe08a));
    f.castShadow = false;
    g.add(f);
    flames.push(f);
  }
  const glowLight = new THREE.PointLight(0xffc070, 0.9, 10, 2);
  glowLight.position.set(0, TOP + 4.3, 0);
  g.add(glowLight);

  // --- 🎁 선물 · 🎉 고깔 · 🎈 풍선 ---
  const gifts = [[-3.4, 1.6, 0xff7a9c, 0xffd93d, 1.5], [3.4, 1.4, 0x63c8ff, 0xfff6e8, 1.3],
                 [-2.6, 3.0, 0x7ad48f, 0xff7a9c, 1.0], [3.0, 3.0, 0xc9b4ff, 0xffd93d, 1.1]];
  for (const [x, z, c1, c2, s] of gifts) {
    const gift = makeGift(c1, c2, s);
    gift.position.set(x, 0, z);
    gift.rotation.y = Math.random();
    g.add(gift);
  }
  for (const [x, z, c] of [[-4.6, -0.6, 0xffd93d], [4.6, -0.6, 0x63c8ff]]) {
    const hat = makeHat(c);
    hat.position.set(x, 0, z);
    g.add(hat);
  }
  const balloonsL = makeBalloons([0xff7a9c, 0xffd93d, 0x63c8ff]);
  balloonsL.position.set(-5.2, -0.6, -1.0);
  g.add(balloonsL);
  const balloonsR = makeBalloons([0x7ad48f, 0xc9b4ff, 0xffa733]);
  balloonsR.position.set(5.2, -0.6, -1.0);
  g.add(balloonsR);

  // --- 🎀 현수막 (뒤 벽에) ---
  const banner = makeSign('🎂 생일 축하해! 커핑 · 머핑 🎉', 12, 1.5, '#ff7ab0', '#ffffff');
  banner.position.set(0, 6.1, -4.1);
  g.add(banner);
  //  현수막 양끝 리본
  for (const sx of [-1, 1]) {
    g.add(part('box', 0xffd93d, sx * 6.3, 5.3, -4.0, 0.5, 2.2, 0.2));
  }

  // --- 🎊 색종이 (평소엔 숨겨두고, 촛불을 불면 팡 터진다) ---
  const bits = [];
  for (let i = 0; i < CONFETTI; i++) {
    const b = part('box', CONFETTI_COLORS[i % CONFETTI_COLORS.length], 0, -5, 0,
                   0.35, 0.06, 0.25, glow(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    b.castShadow = false;
    b.visible = false;
    g.add(b);
    bits.push({ m: b, vx: 0, vy: 0, vz: 0, spin: 0, life: 0 });
  }

  // --- 상태 ---
  let lit = true;
  let relightIn = 0;
  function setLit(on) {
    lit = on;
    for (const f of flames) f.visible = on;
    glowLight.intensity = on ? 0.9 : 0;
  }

  /** 버튼을 눌렀을 때 — 촛불을 후~ 불어서 끈다. 색종이 팡! */
  g.userData.press = () => {
    if (!lit) { setLit(true); return false; }   // 꺼져 있으면 다시 켠다
    setLit(false);
    relightIn = RELIGHT_AFTER;
    for (const b of bits) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 4;
      b.m.position.set(0, TOP + 3.6, 0);
      b.m.visible = true;
      b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp;
      b.vy = 5 + Math.random() * 5;
      b.spin = (Math.random() - 0.5) * 12;
      b.life = 2.2 + Math.random() * 1.2;
    }
    return true;                                   // "불었다"고 알려준다
  };
  g.userData.isLit = () => lit;

  g.userData.tick = (t, dt) => {
    // 촛불 일렁임
    if (lit) for (let i = 0; i < flames.length; i++) {
      flames[i].scale.y = 0.36 + Math.sin(t * 8 + i) * 0.07;
    }
    // 잠시 뒤 다시 켜진다
    if (!lit && relightIn > 0) { relightIn -= dt; if (relightIn <= 0) setLit(true); }
    // 색종이가 팔랑팔랑 떨어진다
    for (const b of bits) {
      if (!b.m.visible) continue;
      b.vy -= 9 * dt;
      b.m.position.x += b.vx * dt;
      b.m.position.y += b.vy * dt;
      b.m.position.z += b.vz * dt;
      b.vx *= 0.97; b.vz *= 0.97;
      b.m.rotation.x += b.spin * dt;
      b.m.rotation.z += b.spin * 0.7 * dt;
      b.life -= dt;
      if (b.life <= 0 || b.m.position.y < 0.05) b.m.visible = false;
    }
  };
  return g;
}
