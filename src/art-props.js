// ===========================================================
//  🎨 그림의 집에 놓을 것들 — 이젤 · 색연필 · 연필 · 붓 · 물감 · 액자
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 src/art-house.js가 정한다.
//  ★ 액자(makeWallFrame)에는 아이가 그린 그림을 걸 수 있다.
//    frame.userData.setArt(canvas) 를 부르면 그림이 들어간다.
// ===========================================================
import * as THREE from 'three';
import { C, part, toon, canvasTex } from './castle-props.js';

const WOOD = 0xd9a566, WOOD_D = 0xa9744f, STEEL = 0xdfe3ea;

// ★ 아이랑 같이 바꿔볼 색 — 색연필·물감 색깔
export const ART_COLORS = [
  0xff4d4d, 0xff8a3d, 0xffd93d, 0x7ad48f, 0x3ac0a0,
  0x63c8ff, 0x5a7bff, 0xb072ff, 0xff7ec4, 0xffffff,
  0x8b5a3c, 0x3a3a4a,
];

// -----------------------------------------------------------
//  🖼 이젤 — 세 다리 위에 화판이 올라가 있다
//     art에 색을 주면 그 색 그림이 올라간다
// -----------------------------------------------------------
export function makeEasel(art = null) {
  const g = new THREE.Group();

  // 다리 세 개 (앞 두 개 + 뒤 하나)
  for (const s of [-1, 1]) {
    const leg = part('box', WOOD, s * 1.0, 1.7, 0.3, 0.22, 3.6, 0.22);
    leg.rotation.z = -s * 0.13;
    g.add(leg);
  }
  const back = part('box', WOOD, 0, 1.7, -1.0, 0.22, 3.6, 0.22);
  back.rotation.x = 0.3;
  g.add(back);
  g.add(part('box', WOOD_D, 0, 1.35, 0.28, 2.6, 0.22, 0.5));      // 받침 턱

  // 화판 + 종이
  const board = part('box', 0xe8d8c0, 0, 2.6, 0.1, 2.8, 2.4, 0.16);
  board.rotation.x = -0.12;
  g.add(board);
  const paper = part('box', 0xffffff, 0, 2.6, 0.22, 2.4, 2.0, 0.06);
  paper.rotation.x = -0.12;
  g.add(paper);

  if (art !== null) {                                              // 그려둔 그림
    const drawn = part('box', art, 0, 2.6, 0.27, 2.0, 1.6, 0.04);
    drawn.rotation.x = -0.12;
    g.add(drawn);
  }
  g.userData.paper = paper;
  return g;
}

// -----------------------------------------------------------
//  ✏️ 연필 통 · 🖍 색연필 통 · 🖌 붓 통
//     통 하나에 자루가 여러 개 꽂혀 있다
// -----------------------------------------------------------
function cup(color) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, 0.5, 0, 1.1, 1.0, 1.1));
  g.add(part('cyl', 0xffffff, 0, 1.0, 0, 1.0, 0.1, 1.0));
  return g;
}

/** 자루 하나를 통 안에 비스듬히 꽂는다 */
function stick(g, i, n, len, make) {
  const a = (i / n) * Math.PI * 2;
  const r = 0.3;
  const item = make();
  item.position.set(Math.cos(a) * r, 1.0, Math.sin(a) * r);
  item.rotation.z = Math.cos(a) * 0.18;
  item.rotation.x = -Math.sin(a) * 0.18;
  g.add(item);
  return item;
}

/** 🖍 색연필 통 — 색깔마다 한 자루씩 */
export function makeColorPencils(colors = ART_COLORS) {
  const g = cup(0xffd45e);
  for (let i = 0; i < colors.length; i++) {
    stick(g, i, colors.length, 2, () => {
      const p = new THREE.Group();
      p.add(part('cyl', colors[i], 0, 1.0, 0, 0.22, 2.0, 0.22));
      const tip = part('cone', 0xf2d3a0, 0, 2.15, 0, 0.24, 0.35, 0.24);
      p.add(tip);
      p.add(part('cone', colors[i], 0, 2.32, 0, 0.12, 0.14, 0.12));
      return p;
    });
  }
  return g;
}

/** ✏️ 연필 통 — 노란 연필과 분홍 지우개 */
export function makePencils(n = 7) {
  const g = cup(0x8fd0ff);
  for (let i = 0; i < n; i++) {
    stick(g, i, n, 2.2, () => {
      const p = new THREE.Group();
      p.add(part('cyl', 0xffd93d, 0, 1.1, 0, 0.22, 2.2, 0.22));
      p.add(part('cyl', 0xff9ec4, 0, 2.28, 0, 0.24, 0.3, 0.24));    // 지우개
      p.add(part('cyl', STEEL, 0, 2.1, 0, 0.25, 0.14, 0.25));
      const tip = part('cone', 0xf2d3a0, 0, -0.1, 0, 0.24, 0.4, 0.24);
      tip.rotation.z = Math.PI;
      p.add(tip);
      return p;
    });
  }
  return g;
}

/** 🖌 붓 통 — 굵기가 다른 붓들 */
export function makeBrushes(n = 6) {
  const g = cup(0xa8ead8);
  for (let i = 0; i < n; i++) {
    stick(g, i, n, 2.4, () => {
      const b = new THREE.Group();
      const w = 0.18 + (i % 3) * 0.05;
      b.add(part('cyl', [0x8b5a3c, 0x3a3a4a, 0xff7ec4][i % 3], 0, 1.2, 0, w, 2.4, w));
      b.add(part('cyl', STEEL, 0, 2.45, 0, w + 0.06, 0.3, w + 0.06));
      b.add(part('cone', 0x2a2a35, 0, 2.85, 0, w + 0.1, 0.7, w + 0.1));
      return b;
    });
  }
  return g;
}

// -----------------------------------------------------------
//  🎨 물감 — 튜브가 담긴 상자
// -----------------------------------------------------------
export function makePaintTubes(colors = ART_COLORS) {
  const g = new THREE.Group();
  g.add(part('box', 0xfff6e8, 0, 0.25, 0, 4.0, 0.5, 2.2));
  g.add(part('box', 0xdfe3ea, 0, 0.55, -1.0, 4.0, 0.6, 0.2));
  for (let i = 0; i < 8; i++) {
    const x = -1.7 + (i % 4) * 1.15, z = i < 4 ? -0.4 : 0.5;
    const t = new THREE.Group();
    t.add(part('cyl', colors[i % colors.length], 0, 0.4, 0, 0.4, 1.3, 0.4));
    t.add(part('cyl', 0xdfe3ea, 0, 1.12, 0, 0.22, 0.3, 0.22));      // 뚜껑
    t.add(part('box', 0xdfe3ea, 0, -0.16, 0, 0.42, 0.16, 0.42));
    t.position.set(x, 0.5, z);
    t.rotation.z = Math.PI / 2;                                     // 눕혀 놓는다
    t.rotation.y = (i % 2) * 0.3;
    g.add(t);
  }
  return g;
}

/** 🎨 팔레트 — 물감을 짜놓은 판 */
export function makePalette(colors = ART_COLORS) {
  const g = new THREE.Group();
  g.add(part('cyl', 0xf2d3a0, 0, 0.1, 0, 3.4, 0.2, 2.8));
  g.add(part('cyl', 0xe8c48a, 0.9, 0.16, 0.7, 0.8, 0.22, 0.8));     // 엄지 구멍
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(part('cyl', colors[i % colors.length],
      Math.cos(a) * 1.1, 0.24, Math.sin(a) * 0.9, 0.55, 0.14, 0.55));
  }
  return g;
}

/** 🥤 물통 — 붓이 담겨 있고 물이 찰랑거린다 */
export function makeWaterJar() {
  const g = new THREE.Group();
  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.4,
                                     roughness: 0.05 })
  );
  jar.scale.set(1.5, 1.8, 1.5);
  jar.position.y = 0.9;
  jar.userData.noShadow = true;
  g.add(jar);
  const water = part('cyl', 0x7ad4c0, 0, 0.7, 0, 1.35, 1.1, 1.35);
  g.add(water);
  const brush = part('cyl', 0x8b5a3c, 0.25, 1.5, 0, 0.18, 2.6, 0.18);
  brush.rotation.z = 0.22;
  g.add(brush);
  g.userData.tick = (t) => { water.scale.y = 1.1 + Math.sin(t * 2) * 0.04; };
  return g;
}

// -----------------------------------------------------------
//  🪑 그림 그리는 큰 책상 — 스케치북과 크레용이 널려 있다
// -----------------------------------------------------------
export function makeArtTable(len = 7) {
  const g = new THREE.Group();
  g.add(part('box', WOOD, 0, 1.15, 0, len, 0.22, 3.0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', WOOD_D, sx * (len / 2 - 0.6), 0.57, sz * 1.1, 0.26, 1.15, 0.26));
  }
  // 스케치북 세 권
  for (let i = 0; i < 3; i++) {
    const bk = part('box', 0xffffff, -len / 2 + 1.4 + i * 0.25, 1.32 + i * 0.12, 0.4,
                    2.0, 0.14, 1.5);
    bk.rotation.y = (i - 1) * 0.14;
    g.add(bk);
  }
  // 널려 있는 크레용
  for (let i = 0; i < 6; i++) {
    const cr = part('cyl', ART_COLORS[i * 2 % ART_COLORS.length],
      0.4 + (i % 3) * 0.7, 1.32, (i < 3 ? -0.7 : 0.6), 0.2, 1.2, 0.2);
    cr.rotation.z = Math.PI / 2;
    cr.rotation.y = i * 0.4;
    g.add(cr);
  }
  return g;
}

/** 🖍 크레용 상자 (바닥에 놓는다) */
export function makeCrayonBox(colors = ART_COLORS) {
  const g = new THREE.Group();
  g.add(part('box', 0xff7ab0, 0, 0.4, 0, 3.0, 0.8, 1.4));
  g.add(part('box', 0xffd45e, 0, 0.85, -0.5, 3.0, 0.2, 0.5));
  for (let i = 0; i < 8; i++) {
    g.add(part('cyl', colors[i % colors.length], -1.2 + i * 0.34, 1.0, 0.2, 0.26, 1.4, 0.26));
  }
  return g;
}

/** 🎨 바닥에 튄 물감 자국 (장식) */
export function makeSplat(color) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * 7, r = Math.random() * 1.2;
    const s = part('cyl', color, Math.cos(a) * r, 0.03, Math.sin(a) * r,
                   0.4 + Math.random() * 0.8, 0.06, 0.4 + Math.random() * 0.8);
    s.castShadow = false;
    g.add(s);
  }
  return g;
}

// -----------------------------------------------------------
//  🖼 벽 액자 — 여기에 아이가 그린 그림을 건다
//     frame.userData.setArt(canvas) 를 부르면 그림이 들어간다
// -----------------------------------------------------------
export function makeWallFrame(w = 3.0, h = 2.4, frameColor = WOOD_D) {
  const g = new THREE.Group();

  // 비어 있을 때 보이는 그림 (연한 격자 + 안내 글씨)
  const empty = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#fdf7ee'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * s / 4, 0); ctx.lineTo(i * s / 4, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s / 4); ctx.lineTo(s, i * s / 4); ctx.stroke();
    }
    ctx.fillStyle = '#d8c8b0';
    ctx.font = `bold ${s * 0.13}px "Apple SD Gothic Neo",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('그림을', s / 2, s * 0.44);
    ctx.fillText('걸어요', s / 2, s * 0.6);
  });
  //  ★ 앞뒤 순서가 중요하다 — 그림이 맨 앞(z=0)에 오고,
  //    흰 여백과 나무 테두리는 그 뒤에 숨는다.
  //    (테두리가 그림보다 앞에 있으면 그림이 안 보인다!)
  const mat = new THREE.MeshBasicMaterial({ map: empty });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  g.add(pic);

  g.add(part('box', 0xfff6e8, 0, 0, -0.07, w + 0.16, h + 0.16, 0.1));      // 흰 여백
  g.add(part('box', frameColor, 0, 0, -0.13, w + 0.44, h + 0.44, 0.16));   // 나무 테두리
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });

  /** 아이가 그린 그림(canvas)을 액자에 넣는다 */
  g.userData.setArt = (canvas) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map?.dispose?.();
    mat.map = tex;
    mat.needsUpdate = true;
  };
  g.userData.hasArt = false;
  return g;
}
