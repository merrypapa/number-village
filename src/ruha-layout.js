// ===========================================================
//  🌙 루하성의 "뼈대" — 2층 바닥, 계단, 난간, 기둥
//
//  ★ 이 파일은 "어디에 바닥이 있는가"만 정한다. (인하성의 castle-layout.js와 같은 역할)
//    - ruhaGroundY(x, z, 지금높이) : 그 자리에서 발이 닿는 높이
//    - buildRuhaStructure(scene)   : 2층 바닥판·계단·난간·기둥을 만들어 넣는다
//
//  방 배치 (위에서 본 그림)
//        북(-z)  ← 여기 2층에 ☁️ 징검다리로 나가는 문이 있다
//    ┌─────────────────────────────┐
//    │  ▒▒▒▒▒ 2층 북쪽 발코니 ▒▒▒▒▒  │  z -24 ~ -16
//    ├────┬───────────────────┬────┤
//    │2층 │                   │2층 │  z -16 ~ 10
//    │서쪽│   ✨ 가운데는 뻥    │동쪽│  (가운데는 천장까지 뚫려 있다)
//    │회랑│   뚫려 있다        │계단│
//    ├────┴───────────────────┴────┤
//    │        1층 입구 홀           │  z 10 ~ 24
//    └─────────────────────────────┘
//        남(+z) — 마을로 나가는 정문
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';
import { R } from './ruha-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const RUHA_F2 = 9;                  // 2층 바닥 높이
export const RF1 = { y0: -1, y1: 4.5 };    // 1층에서만 부딪힌다
export const RF2 = { y0: 6, y1: 40 };      // 2층에서만 부딪힌다

// 2층 바닥이 있는 네모들 (성 크기 W=56, D=48 기준)
const SLAB = [
  { x0: -28, x1: 28,  z0: -24, z1: -16 },   // 북쪽 발코니 (징검다리 문이 여기 있다)
  { x0: -28, x1: -19, z0: -16, z1: 10 },    // 서쪽 회랑
  { x0:  19, x1: 28,  z0: -16, z1: 10 },    // 동쪽 회랑 (계단이 올라온다)
];

// 계단 — 동쪽 회랑에서 남(z 9)에서 북(z -5)으로 올라간다
const STAIR = { x0: 19.5, x1: 27.5, zBot: 9, zTop: -5, steps: 22 };
// 계단이 지나가는 자리는 2층 바닥에 구멍을 뚫는다
const HOLE = { x0: 19, x1: 29, z0: STAIR.zTop, z1: 11 };

function inRect(r, x, z) { return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1; }

/** 계단 위라면 발이 닿는 높이, 아니면 -1 (인하성과 같은 방식: 비탈처럼 매끄럽게) */
function stairY(x, z) {
  if (x < STAIR.x0 || x > STAIR.x1) return -1;
  if (z > STAIR.zBot || z < STAIR.zTop) return -1;
  const u = (STAIR.zBot - z) / (STAIR.zBot - STAIR.zTop);
  return Math.min(1, u + 0.5 / STAIR.steps) * RUHA_F2;
}

function onSlab(x, z) {
  if (inRect(HOLE, x, z)) return false;
  for (const s of SLAB) if (inRect(s, x, z)) return true;
  return false;
}

/**
 * 그 자리에서 발이 닿는 바닥 높이.
 *  fromY = 지금 발 높이. 1층에 서 있으면 2층 바닥은 "너무 높아서" 안 고른다.
 */
export function ruhaGroundY(x, z, fromY = 0) {
  const REACH = 0.9;                 // 이만큼까지만 올라설 수 있다 (계단 한 칸)
  let y = 0;
  const s = stairY(x, z);
  if (s > y && s <= fromY + REACH) y = s;
  if (RUHA_F2 > y && RUHA_F2 <= fromY + REACH && onSlab(x, z)) y = RUHA_F2;
  return y;
}

// -----------------------------------------------------------
//  🏛 기둥 하나 (2층 바닥을 받친다)
// -----------------------------------------------------------
function pillar(g, x, z, h) {
  g.add(part('box', R.deep,   x, 0.3, z, 2.2, 0.6, 2.2));
  g.add(part('cyl', R.silver, x, h / 2, z, 1.4, h, 1.4));
  g.add(part('cyl', R.violet, x, h - 0.25, z, 1.8, 0.5, 1.8));
  g.add(part('cyl', R.star,   x, 0.75, z, 1.65, 0.3, 1.65, glow(R.star)));
}

// -----------------------------------------------------------
//  🚧 난간 — 2층에서 떨어지지 않게 막아준다 (별 구슬이 달려 있다)
// -----------------------------------------------------------
function railing(g, obstacles, x0, z0, x1, z1) {
  const long = Math.hypot(x1 - x0, z1 - z0);
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const n = Math.max(2, Math.round(long / 2.4));
  const y = RUHA_F2;

  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u;
    g.add(part('cyl', R.silver, x, y + 0.7, z, 0.45, 1.4, 0.45));
    g.add(part('ball', i % 2 ? R.star : R.ice, x, y + 1.5, z, 0.42, 0.42, 0.42,
               glow(i % 2 ? R.star : R.ice)));
  }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const sx = alongX ? long : 0.35, sz = alongX ? 0.35 : long;
  g.add(part('box', R.violet, mx, y + 1.45, mz, sx, 0.3, sz));
  g.add(part('box', R.deep,   mx, y + 0.12, mz, sx, 0.24, sz));

  obstacles.push({
    x: mx, z: mz,
    hw: (alongX ? long / 2 : 0.4), hd: (alongX ? 0.4 : long / 2),
    ...RF2,
  });
}

// -----------------------------------------------------------
//  🪜 계단 — 칸칸이 쌓아 올린다 (밟는 자리가 빛난다)
// -----------------------------------------------------------
function stairs(g, obstacles) {
  const w = STAIR.x1 - STAIR.x0;
  const cx = (STAIR.x0 + STAIR.x1) / 2;
  const depth = (STAIR.zBot - STAIR.zTop) / STAIR.steps;

  for (let i = 0; i < STAIR.steps; i++) {
    const h = (i + 1) / STAIR.steps * RUHA_F2;
    const z = STAIR.zBot - depth * (i + 0.5);
    g.add(part('box', i % 2 ? R.deep : R.violet, cx, h / 2, z, w, h, depth));
    g.add(part('box', R.ice, cx, h + 0.03, z, w - 1.8, 0.1, depth, glow(R.ice)));
  }
  // 계단 옆 난간 기둥
  for (let i = 0; i <= STAIR.steps; i += 3) {
    const h = i / STAIR.steps * RUHA_F2;
    const z = STAIR.zBot - depth * i;
    g.add(part('cyl', R.silver, STAIR.x0 + 0.4, h + 0.9, z, 0.4, 1.8, 0.4));
    g.add(part('ball', R.star, STAIR.x0 + 0.4, h + 1.85, z, 0.4, 0.4, 0.4, glow(R.star)));
  }
  // 계단 옆구리 — 여기로는 못 지나간다
  obstacles.push({ x: STAIR.x0 - 0.2, z: (STAIR.zBot + STAIR.zTop) / 2,
                   hw: 0.4, hd: (STAIR.zBot - STAIR.zTop) / 2 });
  // 계단 뒤쪽(북쪽) — 1층에서 계단 밑으로 파고들지 못하게
  obstacles.push({ x: cx, z: STAIR.zTop - 0.4, hw: w / 2, hd: 0.4, ...RF1 });
}

// -----------------------------------------------------------
//  2층 바닥판 + 난간 + 기둥 + 계단을 전부 만든다
// -----------------------------------------------------------
export function buildRuhaStructure(scene) {
  const g = new THREE.Group();
  const obstacles = [];

  // --- 2층 바닥판 (두께 0.7. 윗면이 RUHA_F2) ---
  for (const s of SLAB) {
    const w = s.x1 - s.x0, d = s.z1 - s.z0;
    const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    if (s.x0 === 19) {
      // 동쪽 회랑은 계단 구멍(z -5 ~ 11)을 빼고 깐다
      const keep = HOLE.z0 - s.z0;                       // 북쪽 계단참
      g.add(part('box', R.deep, cx, RUHA_F2 - 0.35, s.z0 + keep / 2, w, 0.7, keep));
      continue;
    }
    g.add(part('box', R.deep, cx, RUHA_F2 - 0.35, cz, w, 0.7, d));
  }

  // --- 2층 바닥을 받치는 기둥 ---
  //  ★ 동쪽은 **계단이 지나가는 자리(z -5 ~ 9)를 비워둔다.**
  //    거기에 기둥을 세우면 계단을 오르다 막힌다
  const WEST_Z = [-10, -2, 6];      // 서쪽 회랑 기둥
  const EAST_Z = [-14, -8];         // 동쪽 회랑 기둥 (계단 위쪽만)
  for (const x of [-24, -12, 0, 12, 24]) {
    pillar(g, x, -20, RUHA_F2);
    obstacles.push({ x, z: -20, r: 1.1, ...RF1 });
  }
  for (const z of WEST_Z) {
    pillar(g, -23.5, z, RUHA_F2);
    obstacles.push({ x: -23.5, z, r: 1.1, ...RF1 });
  }
  for (const z of EAST_Z) {
    pillar(g, 23.5, z, RUHA_F2);
    obstacles.push({ x: 23.5, z, r: 1.1, ...RF1 });
  }

  // --- 계단 ---
  stairs(g, obstacles);

  // --- 2층 난간 (떨어지지 않게) ---
  railing(g, obstacles, -19, -16, -19, 10);       // 서쪽 회랑 — 가운데 쪽
  railing(g, obstacles,  19, -16,  19, -5);       // 동쪽 회랑 — 가운데 쪽
  railing(g, obstacles, -19, 10, -28, 10);        // 서쪽 회랑 남쪽 끝
  railing(g, obstacles, -19, -16, 19, -16);       // 북쪽 발코니 — 가운데 쪽
  //  ★ 동쪽 z -5 에는 난간을 두지 않는다. 계단이 올라오는 입구다

  scene.add(g);
  return { obstacles };
}

export { SLAB, STAIR, HOLE };
