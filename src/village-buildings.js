// ===========================================================
//  🏪 마을의 큰 건물 겉모습 — 마트 · 그림의 집
//
//  ★ 여기는 "바깥에서 보이는 모양"만 만든다.
//    안으로 들어갔을 때 보이는 것은 src/mart.js, src/art-house.js가 만든다.
//  ★ 건물은 전부 +z 쪽(광장 쪽)을 바라본다. 그래야 문을 찾기 쉽다.
// ===========================================================
import * as THREE from 'three';
import { part, toon, glow } from './castle-props.js';
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
