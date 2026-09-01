// ===========================================================
//  🛒 마트 안에 놓을 것들 — 진열대 · 냉장고 · 계산대 · 장바구니 · 매대
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 mart.js가 정한다.
//  ★ 상품(라면·과자·물…)은 src/mart-items.js가 만든다.
// ===========================================================
import * as THREE from 'three';
import { C, part, toon, glow } from './castle-props.js';
import { fillShelf, makeItem, makeBanana, makeStrawberry, getItem, UNIT } from './mart-items.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const SHELF_H  = 3.0;    // 진열대 높이
const LEVELS   = [0.45, 1.28, 2.12];   // 선반 세 칸의 높이
const M = {
  steel:  0xd8dee8,      // 진열대 철판
  steel2: 0xb9c2d0,
  wood:   0xd9a566,      // 매대 나무
  glass:  0xbfe8ff,      // 유리
  red:    0xff5a7a,
  mint:   0x7ad4c0,
};

/** 반투명 유리판 (냉장고 문 · 자동문) */
function glassPane(w, h, d = 0.1) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhysicalMaterial({
      color: M.glass, transparent: true, opacity: 0.32,
      roughness: 0.05, metalness: 0, transmission: 0.6,
    })
  );
  m.scale.set(w, h, d);
  m.userData.noShadow = true;
  return m;
}

/**
 * 글씨가 적힌 간판 (Canvas로 글씨를 그린다)
 *  ★ 그림판을 간판과 **같은 가로세로 비율**로 만든다.
 *    네모난 그림판을 길쭉한 판에 붙이면 글씨가 납작하게 눌려서 안 읽힌다.
 */
export function makeSign(text, w = 4, h = 1, bgColor = '#ff7ab0', fgColor = '#ffffff') {
  const cw = 512, ch = Math.max(64, Math.round(512 * h / w));
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#ffffff40'; ctx.fillRect(0, 0, cw, ch * 0.18);   // 위쪽 반짝임

  ctx.fillStyle = fgColor;
  const font = px => `bold ${px}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
  let size = Math.round(ch * 0.62);
  ctx.font = font(size);
  while (ctx.measureText(text).width > cw * 0.9 && size > 10) {     // 길면 줄인다
    size -= 2;
    ctx.font = font(size);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cw / 2, ch * 0.55);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })));
  const back = part('box', 0xffffff, 0, 0, -0.06, w + 0.12, h + 0.12, 0.1);
  back.castShadow = false; back.receiveShadow = false;
  g.add(back);
  return g;
}

// -----------------------------------------------------------
//  🏷 가격표 띠 — 선반 앞에 붙는 길쭉한 판. "라면 3코인"이 줄지어 적힌다
//    ★ 값은 mart-items.js의 price에서 그대로 가져온다.
//      상품 값을 바꾸면 진열대 가격표도 저절로 바뀐다.
// -----------------------------------------------------------
export function makePriceStrip(ids, len, h = 0.22) {
  //  ★ 그림판을 판과 **같은 가로세로 비율**로 만든다.
  //    (네모난 그림판을 길쭉한 판에 붙이면 글씨가 납작하게 눌려서 안 읽힌다 — makeSign과 같은 이유)
  const ch = 32, cw = Math.min(2048, Math.round(ch * len / h));
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff3d0'; c.fillRect(0, 0, cw, ch);
  c.fillStyle = '#ffd45e'; c.fillRect(0, ch - 3, cw, 3);

  const list = (ids && ids.length) ? ids : ['candy'];
  const slots = Math.max(2, Math.round(len / 2.4));      // 몇 칸으로 나눠 적을까
  const w = cw / slots;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < slots; i++) {
    const def = getItem(list[i % list.length]);
    c.fillStyle = '#e0518f'; c.fillRect(i * w + 1, 2, w - 2, ch - 6);
    c.fillStyle = '#ffffff';
    c.font = `bold ${Math.round(ch * 0.62)}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
    c.fillText(`${def.name} ${def.price}${UNIT}`, i * w + w / 2, ch * 0.5);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h),
                           new THREE.MeshBasicMaterial({ map: tex }));
  m.userData.noShadow = true;
  return m;
}

// -----------------------------------------------------------
//  🧺 손에 드는 장바구니 — 마트에서 이걸 들고 다니면서 물건을 담는다
//    (mart-shop.js가 캐릭터 손 옆에 붙여준다)
// -----------------------------------------------------------
export function makeHandBasket(color = M.red) {
  const g = new THREE.Group();
  const w = 0.95, d = 0.72, hh = 0.5;
  g.add(part('box', color, 0, 0.04, 0, w, 0.08, d));                    // 바닥
  g.add(part('box', color, 0, hh / 2,  d / 2, w, hh, 0.07));            // 앞뒤 벽
  g.add(part('box', color, 0, hh / 2, -d / 2, w, hh, 0.07));
  g.add(part('box', color, -w / 2, hh / 2, 0, 0.07, hh, d));            // 옆 벽
  g.add(part('box', color,  w / 2, hh / 2, 0, 0.07, hh, d));
  g.add(part('box', 0xfff0f6, 0, hh + 0.02, 0, w + 0.08, 0.07, d + 0.08));  // 테두리

  // 손잡이 — 기둥 두 개에 가로대 하나
  for (const s of [-1, 1]) {
    g.add(part('cyl', 0x9aa4b4, s * (w / 2 - 0.12), hh + 0.22, 0, 0.07, 0.44, 0.07));
  }
  const bar = part('cyl', 0x9aa4b4, 0, hh + 0.42, 0, 0.07, w - 0.2, 0.07);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  return g;
}

// -----------------------------------------------------------
//  🗄 진열대(곤돌라) — 앞뒤 양쪽에 상품이 놓인다
//    front / back : 아래 칸부터 위 칸까지 놓을 상품 [['ramen'], ['snack'], …]
// -----------------------------------------------------------
export function makeShelf(len, front, back) {
  const g = new THREE.Group();

  // 받침과 가운데 등판
  g.add(part('box', M.steel2, 0, 0.16, 0, len, 0.32, 1.9));
  g.add(part('box', M.steel,  0, SHELF_H / 2, 0, len, SHELF_H, 0.22));

  // 옆 기둥
  for (const s of [-1, 1]) {
    g.add(part('box', M.steel2, s * (len / 2 - 0.1), SHELF_H / 2, 0, 0.2, SHELF_H, 1.9));
  }

  // 선반 판 + 상품 (앞면은 +z, 뒷면은 돌려서 붙인다)
  for (const [side, list] of [[1, front], [-1, back]]) {
    const face = new THREE.Group();
    face.rotation.y = side > 0 ? 0 : Math.PI;
    for (let i = 0; i < LEVELS.length; i++) {
      const y = LEVELS[i];
      face.add(part('box', M.steel, 0, y - 0.05, 0.48, len - 0.3, 0.1, 0.9));
      const ids = list?.[i];
      if (ids) fillShelf(face, ids, len - 0.4, y, 0.72, 2);
      // 선반 앞 가격표 띠 — 상품 이름과 값이 적혀 있다 (아이가 읽고 계산한다)
      if (ids) {
        const tag = makePriceStrip(ids, len - 0.4, 0.22);
        tag.position.set(0, y + 0.09, 0.95);
        face.add(tag);
      }
    }
    g.add(face);
  }
  return g;
}

// -----------------------------------------------------------
//  🧊 벽면 음료 냉장고 — 유리문 안에 물·우유·주스가 줄지어 있다
// -----------------------------------------------------------
export function makeFridge(len, label = '음료 · 물') {
  const g = new THREE.Group();
  const H = 5.2;

  g.add(part('box', M.steel2, 0, H / 2, -0.55, len, H, 1.1));      // 몸통(뒤쪽)
  g.add(part('box', M.steel,  0, 0.2, 0.2, len, 0.4, 1.6));        // 받침
  g.add(part('box', M.steel,  0, H - 0.25, 0.2, len, 0.5, 1.6));   // 윗칸

  // 안쪽 선반 + 음료
  const rows = ['water', 'water', 'milk', 'juice', 'soda'];
  for (let i = 0; i < 4; i++) {
    const y = 0.55 + i * 1.05;
    g.add(part('box', M.steel, 0, y - 0.06, -0.35, len - 0.4, 0.1, 1.1));
    fillShelf(g, [rows[i % rows.length]], len - 0.6, y, 0.05, 2);
  }

  // 유리문 (문마다 손잡이)
  const doors = Math.max(1, Math.round(len / 2.4));
  const dw = len / doors;
  for (let i = 0; i < doors; i++) {
    const x = -len / 2 + dw * (i + 0.5);
    const pane = glassPane(dw - 0.12, H - 1.0, 0.08);
    pane.position.set(x, H / 2 - 0.1, 0.5);
    g.add(pane);
    g.add(part('box', M.steel2, x - dw / 2 + 0.06, H / 2 - 0.1, 0.56, 0.12, H - 1.0, 0.16));
    g.add(part('cyl', 0xf0f4ff, x + dw / 2 - 0.3, H / 2 - 0.1, 0.62, 0.12, 1.4, 0.12));
  }

  const sign = makeSign(label, len * 0.8, 0.9, '#3aa9e0');
  sign.position.set(0, H + 0.7, 0.4);
  g.add(sign);
  return g;
}

// -----------------------------------------------------------
//  💳 계산대 — 카운터 · 계산기 · 바코드 스캐너 · 봉투 · 사탕 진열
//    (+z 쪽에서 손님이 선다)
// -----------------------------------------------------------
export function makeCounter(len = 5) {
  const g = new THREE.Group();

  g.add(part('box', 0xfff0f6, 0, 0.55, 0, len, 1.1, 1.5));          // 카운터 몸통
  g.add(part('box', C.pink,   0, 1.14, 0, len + 0.2, 0.14, 1.7));   // 상판 테두리
  g.add(part('box', 0xffd9e8, 0, 0.55, 0.78, len, 1.1, 0.12));      // 앞판

  // 계산기(포스) — 모니터와 자판
  g.add(part('box', 0x4a4f60, -len / 2 + 1.1, 1.35, -0.25, 0.9, 0.3, 0.7));
  const screen = part('box', 0x2a3040, -len / 2 + 1.1, 1.95, -0.45, 1.1, 0.9, 0.12);
  g.add(screen);
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), glow(0x7ad4ff));
  lit.position.set(-len / 2 + 1.1, 1.95, -0.37);
  lit.userData.noShadow = true;
  g.add(lit);

  // 바코드 스캐너 (빨간 빛이 깜빡인다)
  g.add(part('box', 0x3a4050, 0, 1.3, 0.1, 0.7, 0.24, 0.5));
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), glow(0xff5a5a));
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(0, 1.43, 0.1);
  beam.userData.noShadow = true;
  g.add(beam);

  // 봉투 더미
  for (let i = 0; i < 3; i++) {
    g.add(part('box', 0xfff6e0, len / 2 - 0.9, 1.28 + i * 0.09, 0.2, 1.0, 0.08, 0.8));
  }

  // 계산대 옆 사탕·껌 진열
  const rack = new THREE.Group();
  rack.add(part('box', 0xffffff, 0, 0.8, 0, 1.2, 1.6, 0.5));
  for (let i = 0; i < 3; i++) {
    fillShelf(rack, ['candy'], 1.1, 0.45 + i * 0.45, 0.2, 1);
  }
  rack.position.set(len / 2 + 0.9, 0, 0.3);
  g.add(rack);

  g.userData.tick = (t) => {
    beam.material = t % 1.2 < 0.6 ? glow(0xff5a5a) : glow(0xffb0b0);
  };
  return g;
}

// -----------------------------------------------------------
//  🧺 장바구니 더미 (입구에 쌓여 있다)
// -----------------------------------------------------------
export function makeBasketStack(color = M.red) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const b = part('box', i % 2 ? color : 0xff8fb0, 0, 0.28 + i * 0.22, 0, 1.1, 0.4, 0.8);
    b.rotation.y = (Math.random() - 0.5) * 0.12;
    g.add(b);
  }
  g.add(part('box', 0xdfe3ea, 0, 0.08, 0, 1.3, 0.16, 1.0));
  return g;
}

// -----------------------------------------------------------
//  🛒 카트 — 바구니 + 손잡이 + 바퀴 네 개
// -----------------------------------------------------------
export function makeCart() {
  const g = new THREE.Group();
  g.add(part('box', M.steel, 0, 1.0, 0, 1.3, 0.9, 1.9));         // 바구니
  g.add(part('box', 0x9aa4b4, 0, 0.55, 0, 1.1, 0.12, 1.7));      // 아래 선반
  const handle = part('cyl', 0x9aa4b4, 0, 1.6, 0.9, 0.1, 1.2, 0.1);   // 손잡이 (가로로 눕힌다)
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = part('cyl', 0x4a4f60, sx * 0.5, 0.18, sz * 0.75, 0.34, 0.16, 0.34);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  return g;
}

// -----------------------------------------------------------
//  🍎 과일·채소 매대 — 비스듬한 나무 상자에 과일이 담겨 있다
// -----------------------------------------------------------
export function makeProduceStand(label = '과일 · 채소') {
  const g = new THREE.Group();
  g.add(part('box', M.wood, 0, 0.5, 0, 5.4, 1.0, 2.6));
  g.add(part('box', 0xb5794f, 0, 1.05, 0, 5.6, 0.16, 2.8));

  // 칸 세 개 — 사과 · 귤 · 딸기
  const bins = [
    { x: -1.8, id: 'apple' },
    { x: 0,    id: 'orange' },
    { x: 1.8,  id: 'melon' },
  ];
  for (const bin of bins) {
    g.add(part('box', 0xe8c48a, bin.x, 1.35, 0, 1.6, 0.5, 2.2));
    for (let i = 0; i < 7; i++) {
      const f = makeItem(bin.id);
      f.position.set(bin.x + (Math.random() - 0.5) * 1.0, 1.62 + f.position.y * 0.6,
                     (Math.random() - 0.5) * 1.4);
      f.scale.multiplyScalar(bin.id === 'melon' ? 0.6 : 1);
      g.add(f);
    }
  }

  // 바나나 송이와 딸기 바구니를 위에 얹는다
  for (let i = 0; i < 3; i++) {
    const b = makeBanana();
    b.position.set(-2.4 + i * 0.5, 1.6, 0.9);
    b.rotation.y = Math.random() * 3;
    g.add(b);
  }
  for (let i = 0; i < 5; i++) {
    const s = makeStrawberry();
    s.position.set(2.2 + (Math.random() - 0.5) * 0.8, 1.6, (Math.random() - 0.5) * 1.2);
    g.add(s);
  }

  const sign = makeSign(label, 3.2, 0.8, '#4fbf5f');
  sign.position.set(0, 2.6, -0.1);
  g.add(sign);
  return g;
}

// -----------------------------------------------------------
//  🍦 아이스크림 냉동고 — 뚜껑이 열린 통 안에 아이스크림이 가득
// -----------------------------------------------------------
export function makeFreezer(label = '아이스크림') {
  const g = new THREE.Group();
  g.add(part('box', 0xe8f4ff, 0, 0.8, 0, 4.2, 1.6, 2.2));
  g.add(part('box', 0x8fd0ff, 0, 1.62, 0, 4.0, 0.12, 2.0));       // 안쪽 얼음
  g.add(part('box', 0xd8e8f5, 0, 0.2, 0, 4.4, 0.4, 2.4));

  const colors = [0xff9ec4, 0xffd45e, 0x8fd0ff, 0xa8ead8, 0xc9b4ff];
  for (let i = 0; i < 16; i++) {
    const bar = part('box', colors[i % colors.length],
      (Math.random() - 0.5) * 3.4, 1.78, (Math.random() - 0.5) * 1.5, 0.34, 0.18, 0.8);
    bar.rotation.y = Math.random() * 3;
    g.add(bar);
  }
  const sign = makeSign(label, 2.6, 0.7, '#63c8ff');
  sign.position.set(0, 2.5, -1.05);
  g.add(sign);
  return g;
}

// -----------------------------------------------------------
//  💡 천장 형광등 (길쭉한 빛나는 판)
// -----------------------------------------------------------
export function makeCeilingLight(len = 6) {
  const g = new THREE.Group();
  const bar = part('box', 0xffffff, 0, 0, 0, len, 0.18, 0.6, glow(0xfffbe8));
  bar.castShadow = false;
  g.add(bar);
  g.add(part('box', 0xdfe3ea, 0, 0.16, 0, len + 0.2, 0.16, 0.8));
  return g;
}
