// ===========================================================
//  🏪 마을의 큰 건물 겉모습 — 마트 · 그림의 집
//
//  ★ 여기는 "바깥에서 보이는 모양"만 만든다.
//    안으로 들어갔을 때 보이는 것은 src/mart.js, src/art-house.js가 만든다.
//  ★ 건물은 전부 +z 쪽(광장 쪽)을 바라본다. 그래야 문을 찾기 쉽다.
// ===========================================================
import * as THREE from 'three';
import { part, toon, glow, makeHeart } from './castle-props.js';
import { makeStar, makeMoon, R } from './ruha-props.js';
import { makeSign, makeCart } from './mart-props.js';

/** 줄무늬 차양(천막) — 빨강·하양 줄무늬 */
function awning(w, color = 0xff5a7a) {
  const g = new THREE.Group();
  const n = Math.round(w / 1.1);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * (w / n);
    const s = part('box', i % 2 ? color : 0xfff6e8, x, 0, 0, w / n, 0.3, 2.2);
    s.rotation.x = -0.32;
    g.add(s);
  }
  g.add(part('box', 0xdfe3ea, 0, 0.35, -0.9, w + 0.3, 0.3, 0.3));
  return g;
}

// -----------------------------------------------------------
//  🛒 마트 (편의점) — 큰 유리창과 자동문, 지붕 위에 간판
//     문은 +z 쪽 한가운데에 있다
// -----------------------------------------------------------
export function makeMartBuilding(name = '행복마트') {
  const g = new THREE.Group();
  const W = 15, H = 5.2, D = 11;

  // 몸통 + 옥상 난간
  g.add(part('box', 0xfff6ea, 0, H / 2, 0, W, H, D));
  g.add(part('box', 0x63c8ff, 0, H + 0.35, 0, W + 0.6, 0.7, D + 0.6));
  g.add(part('box', 0xdfe3ea, 0, H + 0.85, 0, W + 0.2, 0.3, D + 0.2));

  // 앞쪽 유리창 (안이 환하게 비치도록 밝은 재질)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfeeff, transparent: true, opacity: 0.55, roughness: 0.06,
  });
  for (const sx of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), glassMat);
    pane.scale.set(4.4, 3.6, 0.16);
    pane.position.set(sx * 4.6, 2.1, D / 2 + 0.05);
    pane.userData.noShadow = true;
    g.add(pane);
    g.add(part('box', 0xdfe3ea, sx * 4.6, 0.2, D / 2 + 0.06, 4.8, 0.4, 0.3));
    g.add(part('box', 0xdfe3ea, sx * 2.35, 2.1, D / 2 + 0.06, 0.3, 3.8, 0.3));
  }

  // 가운데 자동문 (안쪽이 환하다)
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.0), glow(0xfff6d8));
  doorLight.position.set(0, 2.0, D / 2 + 0.08);
  doorLight.userData.noShadow = true;
  g.add(doorLight);
  g.add(part('box', 0xb9c2d0, 0, 2.0, D / 2 + 0.12, 0.24, 4.0, 0.24));
  g.add(part('box', 0xb9c2d0, 0, 4.1, D / 2 + 0.12, 4.6, 0.3, 0.3));

  // 차양 + 간판
  const aw = awning(W - 0.6);
  aw.position.set(0, 4.5, D / 2 + 0.9);
  g.add(aw);
  const sign = makeSign(name, W - 2, 1.9, '#ff7ab0');
  sign.position.set(0, H + 1.6, D / 2 + 0.1);
  g.add(sign);

  // 문 옆 작은 안내판과 카트 자리
  const open = makeSign('열려 있어요', 2.4, 0.7, '#4fbf5f');
  open.position.set(5.2, 0.9, D / 2 + 0.15);
  g.add(open);

  // 지붕 위 환기통 두 개 (마트처럼 보이게)
  for (const sx of [-1, 1]) {
    g.add(part('cyl', 0xb9c2d0, sx * 4, H + 1.4, -2.5, 1.6, 1.2, 1.6));
  }
  return g;
}

// -----------------------------------------------------------
//  🛒 마트 앞에 세워둔 카트 세 대 (장식)
// -----------------------------------------------------------
export function makeMartCarts(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = makeCart();
    c.position.set(i * 1.5, 0, i * 0.5);
    c.rotation.y = 0.1 + i * 0.06;
    g.add(c);
  }
  g.position.set(x, 0, z);
  return g;
}

// -----------------------------------------------------------
//  🎨 그림의 집 — 지붕이 알록달록하고 앞에 큰 붓과 팔레트가 서 있다
//     문은 +z 쪽 한가운데에 있다
// -----------------------------------------------------------
export function makeArtHouseBuilding() {
  const g = new THREE.Group();
  const W = 12, H = 5, D = 10;

  g.add(part('box', 0xfff3f8, 0, H / 2, 0, W, H, D));

  // 무지개 지붕 (색깔 판을 여러 장 겹쳐 쌓는다)
  const RAINBOW = [0xff7a9c, 0xffa733, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff];
  for (let i = 0; i < RAINBOW.length; i++) {
    const w = W + 1.2 - i * 1.5;
    g.add(part('box', RAINBOW[i], 0, H + 0.35 + i * 0.55, 0, w, 0.55, D + 1.2 - i * 1.2));
  }

  // 문과 창문
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.6), glow(0xfff0f8));
  doorLight.position.set(0, 1.8, D / 2 + 0.07);
  doorLight.userData.noShadow = true;
  g.add(doorLight);
  g.add(part('box', 0xc98a56, 0, 1.8, D / 2 + 0.1, 3.5, 4.0, 0.25));
  for (const sx of [-1, 1]) {
    g.add(part('box', 0xa8e6ff, sx * 3.8, 2.8, D / 2 + 0.06, 2.2, 2.2, 0.2));
    g.add(part('box', 0xfff6e8, sx * 3.8, 2.8, D / 2 + 0.1, 2.6, 0.25, 0.25));
  }

  // 앞마당에 세운 커다란 붓과 팔레트 (여기가 그림의 집이라고 알려준다)
  const brush = new THREE.Group();
  brush.add(part('cyl', 0xd9a566, 0, 2.0, 0, 0.5, 4.0, 0.5));
  brush.add(part('cyl', 0xb9c2d0, 0, 4.15, 0, 0.62, 0.5, 0.62));
  const tip = part('cone', 0xff5a7a, 0, 4.9, 0, 0.8, 1.4, 0.8);
  brush.add(tip);
  brush.position.set(-6.5, 0, D / 2 + 2.2);
  brush.rotation.z = 0.2;
  g.add(brush);

  const palette = new THREE.Group();
  palette.add(part('cyl', 0xf2d3a0, 0, 0, 0, 3.6, 0.35, 3.0));
  const spots = [0xff5a5a, 0xffd93d, 0x63c8ff, 0x7ad48f, 0xc9b4ff];
  for (let i = 0; i < spots.length; i++) {
    const a = (i / spots.length) * Math.PI * 2;
    palette.add(part('cyl', spots[i], Math.cos(a) * 1.0, 0.2, Math.sin(a) * 0.85, 0.8, 0.16, 0.8));
  }
  palette.position.set(6.4, 2.6, D / 2 + 1.6);
  palette.rotation.x = -0.5;
  g.add(palette);
  g.add(part('cyl', 0xd9a566, 6.4, 1.3, D / 2 + 1.8, 0.35, 2.6, 0.35));

  const sign = makeSign('그림의 집', 6.4, 1.5, '#c9b4ff', '#4a2a7a');
  sign.position.set(0, H + 3.9, D / 2 - 0.4);
  g.add(sign);
  return g;
}

// -----------------------------------------------------------
//  🌙 루하성 — 별과 달의 성 (인하성 옆에 서 있다)
//     문은 +z 쪽(마을 쪽)에 있다
// -----------------------------------------------------------
export function makeRuhaCastle() {
  const g = new THREE.Group();

  // 본체 — 남색 성벽에 은빛 띠
  g.add(part('box', R.deep,   0, 6, 0, 19, 12, 13));
  g.add(part('box', R.violet, 0, 12.4, 0, 20, 1.0, 14));
  const roof = part('cone', R.night, 0, 16, 0, 16, 7, 12);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // 탑 네 개 — 인하성보다 가늘고 높다
  for (const [x, z] of [[-10.5, -7.5], [10.5, -7.5], [-10.5, 7.5], [10.5, 7.5]]) {
    g.add(part('cyl', R.deep,   x, 9, z, 4.4, 18, 4.4));
    g.add(part('cyl', R.violet, x, 18.4, z, 5.0, 0.8, 5.0));
    g.add(part('cone', R.night, x, 22, z, 5.6, 7, 5.6));
    // 꼭대기 초승달
    const m = makeMoon(1.5);
    m.position.set(x, 27.5, z);
    m.rotation.z = 0.35;
    g.add(m);
    // 창문에서 새어 나오는 별빛
    for (const y of [5, 10, 15]) {
      g.add(part('box', R.star, x, y, z + 2.3, 1.0, 1.8, 0.25, glow(R.star)));
    }
  }

  // 정문 — 안이 은은하게 빛난다
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 7.0), glow(0xcfd8ff));
  doorLight.position.set(0, 3.5, 6.6);
  doorLight.userData.noShadow = true;
  g.add(doorLight);
  g.add(part('box', R.silver, 0, 3.5, 6.75, 5.8, 7.6, 0.4));
  g.add(part('box', R.violet, 0, 7.6, 6.8, 7.0, 0.8, 0.6));

  // 문 위의 큰 별
  const star = makeStar(R.star, 2.2);
  star.position.set(0, 10.4, 6.9);
  g.add(star);
  g.userData.tick = (t) => { star.rotation.z = t * 0.4; };

  // 성벽에 박힌 작은 별들
  for (let i = 0; i < 10; i++) {
    const st = makeStar(i % 2 ? R.ice : R.star, 0.55);
    st.position.set(-8 + (i % 5) * 4, i < 5 ? 8.5 : 4.5, 6.6);
    g.add(st);
  }
  return g;
}

/** 두 성 사이에 걸린 하늘 다리 그림자 — 마을에서 올려다보면 보인다 (장식) */
export function makeSkyBridgeHint(fromX, fromZ, toX, toZ) {
  const g = new THREE.Group();
  const n = 9;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const x = fromX + (toX - fromX) * u;
    const z = fromZ + (toZ - fromZ) * u;
    const y = 26 + Math.sin(u * Math.PI) * 7;
    const stone = part('cyl', 0xe8e0ff, x, y, z, 3.4, 0.7, 3.4);
    stone.castShadow = false;
    g.add(stone);
    const h = makeHeart(i % 2 ? 0xff9ec4 : 0xa8e6ff, 0.7);
    h.position.set(x, y + 2.2, z);
    g.add(h);
  }
  return g;
}

// -----------------------------------------------------------
//  💗 엄마성 — 10층짜리 분홍 탑 (키즈카페 성)
//     층마다 창문 띠가 하나씩. 아이가 세어볼 수 있다
// -----------------------------------------------------------
export function makeMomCastle() {
  const g = new THREE.Group();
  const PINK = 0xff9ec4, HOT = 0xff6fa5, CREAM = 0xffe6f4;
  const FLOORS = 10, FH = 3.6;              // 겉에서 보이는 한 층 높이
  const H = FLOORS * FH;                    // 탑 높이 (36)

  // 본체 — 층마다 색 띠와 창문
  g.add(part('box', CREAM, 0, H / 2, 0, 17, H, 12));
  for (let i = 0; i < FLOORS; i++) {
    const y = i * FH;
    g.add(part('box', i % 2 ? PINK : HOT, 0, y + 0.35, 0, 17.4, 0.6, 12.4));   // 층 띠
    for (const x of [-5.5, 0, 5.5]) {                                          // 창문
      g.add(part('box', 0xdff3ff, x, y + 2.0, 6.15, 2.4, 1.8, 0.3, glow(0xdff3ff)));
    }
    for (const sx of [-1, 1]) {
      g.add(part('box', 0xdff3ff, sx * 8.65, y + 2.0, 0, 0.3, 1.8, 5.0, glow(0xdff3ff)));
    }
  }

  // 꼭대기 — 하늘 전망대(10층)라서 지붕이 뾰족하지 않고 난간이 있다
  g.add(part('box', PINK, 0, H + 0.5, 0, 19, 1.0, 14));
  for (let i = 0; i < 10; i++) {
    const x = -8.4 + i * 1.87;
    g.add(part('box', CREAM, x, H + 1.8, 6.6, 0.5, 1.6, 0.5));
    g.add(part('box', CREAM, x, H + 1.8, -6.6, 0.5, 1.6, 0.5));
  }
  const cap = part('cone', HOT, 0, H + 5.0, 0, 9, 5.4, 9);
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  const top = makeHeart(HOT, 2.0);
  top.position.set(0, H + 9.0, 0);
  g.add(top);
  g.userData.tick = (t) => { top.rotation.y = t * 0.5; };

  // 양옆 작은 탑
  for (const sx of [-1, 1]) {
    g.add(part('cyl', CREAM, sx * 9.6, H * 0.42, 4.0, 4.0, H * 0.84, 4.0));
    g.add(part('cone', PINK, sx * 9.6, H * 0.9, 4.0, 5.0, 5.0, 5.0));
    for (let i = 0; i < 4; i++) {
      g.add(part('box', 0xdff3ff, sx * 9.6, 3 + i * 6, 6.0, 1.4, 1.6, 0.3, glow(0xdff3ff)));
    }
  }

  // 정문 — 안이 환하게 빛난다
  //  ★ 문틀을 **빛나는 판보다 앞에** 두면 판을 다 가려서 그냥 분홍 네모로 보인다.
  //    그래서 문틀은 기둥 두 개 + 위 가로대로만 만든다
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 6.4), glow(0xfff0d8));
  doorLight.position.set(0, 3.2, 6.15);
  doorLight.userData.noShadow = true;
  g.add(doorLight);
  for (const sx of [-1, 1]) g.add(part('box', HOT, sx * 2.9, 3.2, 6.2, 0.8, 7.0, 0.5));
  g.add(part('box', HOT, 0, 6.6, 6.2, 6.6, 0.8, 0.5));
  g.add(part('box', PINK, 0, 7.4, 6.5, 7.6, 0.7, 1.6));        // 현관 차양
  g.add(part('box', HOT, 0, 0.08, 8.5, 6.0, 0.16, 5.0));       // 현관 앞 융단
  // 문 위의 하트 세 개
  for (let i = 0; i < 3; i++) {
    const h = makeHeart(i % 2 ? PINK : HOT, 0.9);
    h.position.set((i - 1) * 2.4, 9.0, 6.4);
    g.add(h);
  }
  return g;
}

// -----------------------------------------------------------
//  🛠 아빠성 — 뚝딱 공작소 (2층짜리 나무·벽돌 성)
//     큰 차고 문과 굴뚝, 지붕 위에는 바람개비가 돈다
// -----------------------------------------------------------
export function makeDadCastle() {
  const g = new THREE.Group();
  const WOOD = 0xc98a56, DARK = 0x8b5a3c, IRON = 0x8d93a8, CREAM = 0xf2e4cd;
  const YELLOW = 0xffc93d, RED = 0xe05a4a;

  // 본체 (2층) — 아래는 벽돌, 위는 나무
  g.add(part('box', CREAM, 0, 3.5, 0, 20, 7, 14));
  g.add(part('box', DARK, 0, 7.4, 0, 20.6, 1.0, 14.6));      // 층 사이 띠
  g.add(part('box', WOOD, 0, 11, 0, 19, 6, 13));
  // 나무 골조 무늬 (2층)
  for (const x of [-7, 0, 7]) g.add(part('box', DARK, x, 11, 6.6, 0.7, 6, 0.3));
  g.add(part('box', DARK, 0, 11, 6.6, 19, 0.7, 0.3));
  // 지붕 — 네모뿔 하나로 덮는다
  //  ★ 처음에는 널빤지 두 장을 기울여 맞댔는데 꼭대기에 틈이 생겼다.
  //    다른 건물처럼 뿔(cone) 하나로 덮으니 깔끔하다
  const roof = part('cone', RED, 0, 17.6, 0, 23, 7.0, 16);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(part('box', DARK, 0, 14.2, 0, 20.4, 0.8, 14.6));      // 처마
  // 굴뚝 + 연기
  g.add(part('box', 0xb06a5a, -6.5, 17.0, -3, 2.6, 6.0, 2.6));
  for (let i = 0; i < 3; i++) {
    const puff = part('ball', 0xf0f0f0, -6.5, 21.0 + i * 1.8, -3 + i * 0.6, 1.4 + i * 0.4);
    puff.castShadow = false;
    g.add(puff);
  }
  // 바람개비 (지붕 꼭대기에서 돈다)
  const vane = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = part('box', YELLOW, 1.4, 0, 0, 2.8, 1.6, 0.2);
    b.rotation.z = (i / 4) * Math.PI * 2;
    b.position.set(Math.cos((i / 4) * Math.PI * 2) * 1.6,
                   Math.sin((i / 4) * Math.PI * 2) * 1.6, 0);
    vane.add(b);
  }
  vane.position.set(0, 24.0, 0);
  g.add(vane);
  g.add(part('cyl', IRON, 0, 22.0, 0, 0.4, 4.0, 0.4));
  g.userData.tick = (t) => { vane.rotation.z = t * 1.4; };

  // 창문
  for (const sx of [-1, 1]) {
    g.add(part('box', 0xdff3ff, sx * 6.5, 4.4, 7.05, 3.0, 2.4, 0.3, glow(0xdff3ff)));
    g.add(part('box', DARK, sx * 6.5, 4.4, 7.15, 3.4, 0.3, 0.3));
    g.add(part('box', 0xdff3ff, sx * 6.0, 11.0, 6.6, 2.6, 2.4, 0.3, glow(0xdff3ff)));
  }

  // 정문 — 차고처럼 큰 문. 안이 환하게 빛난다
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.0), glow(0xfff0d8));
  doorLight.position.set(0, 3.0, 7.05);
  doorLight.userData.noShadow = true;
  g.add(doorLight);
  for (const sx of [-1, 1]) g.add(part('box', IRON, sx * 3.6, 3.0, 7.1, 0.8, 6.4, 0.5));
  g.add(part('box', IRON, 0, 6.4, 7.1, 8.0, 0.8, 0.5));
  g.add(part('box', YELLOW, 0, 7.4, 7.4, 9.0, 0.7, 1.6));     // 차양
  g.add(part('box', DARK, 0, 0.08, 10.0, 7.0, 0.16, 6.0));    // 문 앞 나무 발판

  // 문 옆에 세워둔 공구 (여기가 공작소라고 알려준다)
  g.add(part('box', DARK, -8.5, 1.2, 8.0, 1.2, 2.4, 1.2));    // 나무 상자
  g.add(part('cyl', WOOD, -8.5, 3.4, 8.0, 0.3, 2.4, 0.3));    // 삽 자루
  g.add(part('box', IRON, -8.5, 4.7, 8.0, 1.0, 1.2, 0.3));
  g.add(part('cyl', RED, 8.5, 1.0, 8.0, 2.0, 2.0, 2.0));      // 기름통
  g.add(part('cyl', IRON, 8.5, 2.2, 8.0, 0.5, 0.6, 0.5));
  return g;
}
