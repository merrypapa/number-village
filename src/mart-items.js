// ===========================================================
//  🛒 마트 상품들 — 라면 · 과자 · 우유 · 물 · 통조림 · 과일…
//
//  ★ 포장 그림은 전부 Canvas로 그린다 (인터넷에서 받지 않는다).
//  ★ 같은 상품은 재질을 딱 하나만 만들어서 나눠 쓴다.
//    (진열대에 200개가 놓여도 재질은 10개쯤이다)
//
//  새 상품을 넣으려면 아래 ITEMS 배열에 한 줄만 추가하면 된다.
// ===========================================================
import * as THREE from 'three';
import { canvasTex, toon } from './castle-props.js';

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  ball: new THREE.SphereGeometry(0.5, 10, 8),
};

// --- 그림 그리기 도우미 (짧게 쓰려고 만든 것들) ---
const fill = (c, s, col) => { c.fillStyle = col; c.fillRect(0, 0, s, s); };
const band = (c, s, col, y, h) => { c.fillStyle = col; c.fillRect(0, s * y, s, s * h); };
const dot  = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
function word(c, s, text, col = '#3a2a55', size = 0.2, y = 0.5) {
  c.fillStyle = col;
  c.font = `bold ${Math.round(s * size)}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, s / 2, s * y);
}

// -----------------------------------------------------------
//  ★ 상품 목록 — 아이랑 같이 늘려보는 곳!
//    shape : 'box'(상자·봉지) 'cyl'(캔·병) 'ball'(과일)
//    size  : [가로, 세로, 깊이]  (1 = 1칸)
//    draw  : 포장에 그릴 그림
// -----------------------------------------------------------
export const ITEMS = [
  { id:'ramen',  name:'라면',   shape:'box', size:[0.72, 0.62, 0.5],
    draw:(c,s)=>{ fill(c,s,'#e4453c'); band(c,s,'#ffd45e',0.06,0.16);
                  dot(c,s/2,s*0.52,s*0.22,'#fff3d8'); dot(c,s/2,s*0.52,s*0.14,'#f0a83c');
                  word(c,s,'라면','#fff',0.2,0.87); } },
  { id:'snack',  name:'과자',   shape:'box', size:[0.56, 0.78, 0.32],
    draw:(c,s)=>{ fill(c,s,'#ffc93c'); band(c,s,'#ff7a4d',0.0,0.22);
                  for(let i=0;i<6;i++) dot(c,(i%3)*s/3+s/6,(i<3?0.55:0.78)*s,s*0.07,'#8b5a3c');
                  word(c,s,'과자','#7a3d00',0.22,0.36); } },
  { id:'cookie', name:'쿠키',   shape:'box', size:[0.62, 0.5, 0.42],
    draw:(c,s)=>{ fill(c,s,'#8fd0ff'); band(c,s,'#fff',0.34,0.32);
                  dot(c,s*0.5,s*0.5,s*0.13,'#b5794f'); word(c,s,'쿠키','#2a5b8f',0.18,0.14); } },
  { id:'milk',   name:'우유',   shape:'box', size:[0.4, 0.78, 0.4],
    draw:(c,s)=>{ fill(c,s,'#fdfdff'); band(c,s,'#4a9be0',0.0,0.2); band(c,s,'#4a9be0',0.86,0.14);
                  dot(c,s*0.5,s*0.55,s*0.16,'#dbe8f5'); word(c,s,'우유','#2a5b8f',0.2,0.55); } },
  { id:'juice',  name:'주스',   shape:'box', size:[0.38, 0.7, 0.38],
    draw:(c,s)=>{ fill(c,s,'#ffa733'); band(c,s,'#fff0c0',0.42,0.24);
                  dot(c,s*0.5,s*0.54,s*0.1,'#ff7a4d'); word(c,s,'주스','#7a3d00',0.18,0.2); } },
  { id:'water',  name:'물',     shape:'cyl', size:[0.34, 0.9, 0.34],
    draw:(c,s)=>{ fill(c,s,'#bfe8ff'); band(c,s,'#3aa9e0',0.4,0.24);
                  word(c,s,'물','#fff',0.22,0.52); } },
  { id:'soda',   name:'음료수', shape:'cyl', size:[0.34, 0.5, 0.34],
    draw:(c,s)=>{ fill(c,s,'#7ad4a0'); band(c,s,'#fff',0.44,0.16);
                  word(c,s,'톡톡','#1f7a52',0.17,0.52); } },
  { id:'can',    name:'통조림', shape:'cyl', size:[0.4, 0.42, 0.4],
    draw:(c,s)=>{ fill(c,s,'#dfe3ea'); band(c,s,'#ff7a9c',0.3,0.4);
                  word(c,s,'콩','#fff',0.2,0.5); } },
  { id:'egg',    name:'계란',   shape:'box', size:[0.78, 0.28, 0.5],
    draw:(c,s)=>{ fill(c,s,'#fff0d8');
                  for(let i=0;i<5;i++) dot(c,(i+0.5)*s/5,s*0.5,s*0.075,'#f2d3a0');
                  word(c,s,'계란','#8a6a3a',0.16,0.14); } },
  { id:'bread',  name:'빵',     shape:'box', size:[0.7, 0.42, 0.44],
    draw:(c,s)=>{ fill(c,s,'#ffe6b8'); band(c,s,'#d99a4e',0.0,0.28);
                  dot(c,s*0.5,s*0.62,s*0.16,'#c98a56'); word(c,s,'빵','#7a4a00',0.2,0.16); } },
  { id:'candy',  name:'사탕',   shape:'box', size:[0.36, 0.34, 0.28],
    draw:(c,s)=>{ fill(c,s,'#ff9ec4');
                  for(let i=0;i<4;i++){ c.fillStyle='#fff'; c.fillRect(i*s/4,0,s/8,s); }
                  word(c,s,'♥','#e0518f',0.4,0.5); } },
  { id:'apple',  name:'사과',   shape:'ball', size:[0.42, 0.42, 0.42], color:0xff5a5a },
  { id:'orange', name:'귤',     shape:'ball', size:[0.36, 0.36, 0.36], color:0xffa733 },
  { id:'melon',  name:'수박',   shape:'ball', size:[0.9, 0.9, 0.9],    color:0x4fbf5f },
];

// -----------------------------------------------------------
//  재질 만들기 (같은 상품은 하나만 만들어서 나눠 쓴다)
// -----------------------------------------------------------
const _mats = new Map();
function itemMaterial(def) {
  if (_mats.has(def.id)) return _mats.get(def.id);
  const mat = def.draw
    ? new THREE.MeshToonMaterial({ map: canvasTex(64, def.draw) })
    : toon(def.color);
  _mats.set(def.id, mat);
  return mat;
}

const _byId = new Map(ITEMS.map(d => [d.id, d]));
export function getItem(id) { return _byId.get(id) ?? ITEMS[0]; }

/** 상품 하나를 만든다. 바닥(y=0)에 놓았을 때 딱 서 있게 높이를 맞춰준다. */
export function makeItem(id) {
  const def = getItem(id);
  const [w, h, d] = def.size;
  const m = new THREE.Mesh(G[def.shape], itemMaterial(def));
  m.scale.set(w, h, d);
  m.position.y = h / 2;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * 선반 한 칸을 상품으로 채운다.
 *   parent : 넣을 그룹
 *   ids    : 놓을 상품 [ 'ramen', 'snack' … ] — 번갈아 가며 놓는다
 *   len    : 선반 가로 길이,  y : 선반 윗면 높이,  z : 앞뒤 자리
 *   rows   : 앞뒤로 몇 줄 놓을까 (기본 2줄 — 뒤쪽에도 차 있어야 진짜 같다)
 */
export function fillShelf(parent, ids, len, y, z, rows = 2) {
  if (!ids.length) return;
  const first = getItem(ids[0]);
  const step = first.size[0] + 0.14;
  const n = Math.max(1, Math.floor((len - 0.4) / step));
  const x0 = -((n - 1) * step) / 2;

  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n; i++) {
      const item = makeItem(ids[(i + r) % ids.length]);
      item.position.set(x0 + i * step, y + item.position.y, z - r * 0.42);
      item.rotation.y = (Math.random() - 0.5) * 0.2;
      parent.add(item);
    }
  }
}

/** 🍌 바나나 한 송이 (도형을 휘어서 만든다) */
export function makeBanana() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(G.cyl, toon(0xffd93d));
    b.scale.set(0.16, 0.62, 0.16);
    b.position.set((i - 1.5) * 0.13, 0.3, 0);
    b.rotation.z = (i - 1.5) * 0.14;
    b.rotation.x = 0.35;
    b.castShadow = true;
    g.add(b);
  }
  const stem = new THREE.Mesh(G.cyl, toon(0x8b5a3c));
  stem.scale.set(0.12, 0.2, 0.12);
  stem.position.y = 0.62;
  g.add(stem);
  return g;
}

/** 🍓 딸기 한 알 */
export function makeStrawberry() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 10), toon(0xff5a7a));
  body.scale.set(0.34, 0.4, 0.34);
  body.rotation.z = Math.PI;
  body.position.y = 0.2;
  body.castShadow = true;
  g.add(body);
  const leaf = new THREE.Mesh(G.ball, toon(0x4fbf5f));
  leaf.scale.set(0.3, 0.08, 0.3);
  leaf.position.y = 0.4;
  g.add(leaf);
  return g;
}
