// ===========================================================
//  🛠 아빠성의 "뼈대" — 2층 바닥, 계단, 난간, 기둥
//
//  ★ 이 파일은 "어디에 바닥이 있는가"만 정한다.
//    (인하성 castle-layout.js · 루하성 ruha-layout.js와 같은 역할)
//
//  방 배치 (위에서 본 그림)
//        북(-z)  ← 2층 북쪽 벽에 🚂 기차길 문
//    ┌─────────────────────────────┐
//    │  ▒▒▒▒▒▒ 2층 캠핑 데크 ▒▒▒▒▒▒  │  z -26 ~ -6
//    ├───┬─────────────────────────┤
//    │2층│                         │  z -6 ~ 16
//    │계단│      1층 공작소 · 기차     │  (계단은 벽에서 4칸 떨어져 있다)
//    │   │   (가운데는 천장까지 뻥)    │
//    ├───┴─────────────────────────┤
//    │        1층 기차역 홀          │  z 16 ~ 26
//    └─────────────────────────────┘
//        남(+z) — 마을로 나가는 정문
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
//  ★ 넓게! 처음엔 48×40이었는데 들어서자마자 기차가 코앞이었다
export const DAD_W = 60, DAD_D = 52, DAD_H = 20;   // 성 안 가로 · 세로 · 천장
export const DAD_F2 = 8;                   // 2층 바닥 높이
export const DF1 = { y0: -1, y1: 4 };      // 1층에서만 부딪힌다
export const DF2 = { y0: 5.5, y1: 40 };    // 2층에서만 부딪힌다

// 나무와 쇠 색깔 (아빠성은 나무 + 철제 느낌이다)
export const D = {
  wood:     0xc98a56,
  woodDark: 0x8b5a3c,
  plank:    0xe0b98a,
  iron:     0x8d93a8,
  ironDark: 0x5b6070,
  red:      0xe05a4a,
  yellow:   0xffc93d,
  green:    0x6fbf73,
  sky:      0x7fc4e8,
  cream:    0xfff2df,
};

// 2층 바닥이 있는 네모 (북쪽 캠핑 데크 + 서쪽 계단참)
const SLAB = [
  { x0: -DAD_W / 2, x1: DAD_W / 2, z0: -26, z1: -6 },   // 북쪽 캠핑 데크
  { x0: -DAD_W / 2, x1: -14, z0: -6, z1: 1 },           // 계단이 올라오는 자리(계단참)
];

// 계단 — **서쪽** 벽에 붙어서 남(z 15)에서 북(z 1)으로 올라간다
//  ★ 동쪽 벽에는 🪨 돌다리로 나가는 문이 있어서 계단을 서쪽으로 옮겼다
//  ★★ 계단은 **벽에서 떨어뜨려** 놓고, 양옆을 둘 다 막는다.
//     ① 예전에 x0을 -29로 두었더니 벽(-30)과 계단 사이에 1칸 틈이 생겼고,
//        몸 굵기(0.8)가 그 틈에 빠져서 **계단을 오르다 아래로 떨어졌다.**
//     ② 벽에 딱 붙이면 이번엔 계단을 올라와 그대로 북쪽으로 걸을 때
//        벽에 난 🪢 밧줄 다리 문에 **저절로 들어가 버린다.**
//     → 그래서 벽에서 4칸 떼고, 계단 양옆을 막아 틈을 아예 없앴다.
const STAIR = { x0: -26, x1: -17, zBot: 15, zTop: 1, steps: 22 };

function inRect(r, x, z) { return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1; }

/** 계단 위라면 발이 닿는 높이, 아니면 -1 (비탈처럼 매끄럽게 잇는다) */
function stairY(x, z) {
  if (x < STAIR.x0 || x > STAIR.x1) return -1;
  if (z > STAIR.zBot || z < STAIR.zTop) return -1;
  const u = (STAIR.zBot - z) / (STAIR.zBot - STAIR.zTop);
  return Math.min(1, u + 0.5 / STAIR.steps) * DAD_F2;
}

function onSlab(x, z) {
  for (const s of SLAB) if (inRect(s, x, z)) return true;
  return false;
}

/**
 * 그 자리에서 발이 닿는 바닥 높이.
 *  fromY = 지금 발 높이. 1층에 서 있으면 2층 바닥은 "너무 높아서" 안 고른다.
 */
export function dadGroundY(x, z, fromY = 0) {
  const REACH = 0.9;
  let y = 0;
  const s = stairY(x, z);
  if (s > y && s <= fromY + REACH) y = s;
  if (DAD_F2 > y && DAD_F2 <= fromY + REACH && onSlab(x, z)) y = DAD_F2;
  return y;
}

// -----------------------------------------------------------
//  🏛 기둥 하나 — 아빠성은 나무 기둥에 쇠 띠를 둘렀다
// -----------------------------------------------------------
function pillar(g, x, z, h) {
  g.add(part('box', D.ironDark, x, 0.3, z, 2.2, 0.6, 2.2));
  g.add(part('box', D.wood, x, h / 2, z, 1.5, h, 1.5));
  g.add(part('box', D.iron, x, h - 0.3, z, 1.9, 0.6, 1.9));
  g.add(part('box', D.iron, x, 1.2, z, 1.7, 0.4, 1.7));
}

// -----------------------------------------------------------
//  🚧 난간 — 2층에서 떨어지지 않게. 나무 손잡이 + 쇠 기둥
// -----------------------------------------------------------
function railing(g, obstacles, x0, z0, x1, z1) {
  const long = Math.hypot(x1 - x0, z1 - z0);
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const n = Math.max(2, Math.round(long / 2.4));
  const y = DAD_F2;

  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u;
    g.add(part('cyl', D.iron, x, y + 0.7, z, 0.35, 1.4, 0.35));
  }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const sx = alongX ? long : 0.4, sz = alongX ? 0.4 : long;
  g.add(part('box', D.wood, mx, y + 1.45, mz, sx, 0.34, sz));
  g.add(part('box', D.woodDark, mx, y + 0.75, mz, sx, 0.24, sz));
  g.add(part('box', D.ironDark, mx, y + 0.12, mz, sx, 0.24, sz));

  obstacles.push({
    x: mx, z: mz,
    hw: (alongX ? long / 2 : 0.4), hd: (alongX ? 0.4 : long / 2),
    ...DF2,
  });
}

// -----------------------------------------------------------
//  🪜 계단 — 나무 발판을 칸칸이 쌓는다
// -----------------------------------------------------------
function stairs(g, obstacles) {
  const w = STAIR.x1 - STAIR.x0;
  const cx = (STAIR.x0 + STAIR.x1) / 2;
  const depth = (STAIR.zBot - STAIR.zTop) / STAIR.steps;

  for (let i = 0; i < STAIR.steps; i++) {
    const h = (i + 1) / STAIR.steps * DAD_F2;
    const z = STAIR.zBot - depth * (i + 0.5);
    g.add(part('box', i % 2 ? D.wood : D.plank, cx, h / 2, z, w, h, depth));
    g.add(part('box', D.yellow, cx, h + 0.03, z, w - 2.4, 0.1, depth * 0.5));  // 미끄럼 방지 띠
  }
  // 계단 옆 난간 — **양쪽 다** 세운다 (옆으로 떨어지지 않게)
  for (let i = 0; i <= STAIR.steps; i += 3) {
    const h = i / STAIR.steps * DAD_F2;
    const z = STAIR.zBot - depth * i;
    g.add(part('cyl', D.iron, STAIR.x0 + 0.4, h + 0.9, z, 0.36, 1.8, 0.36));
    g.add(part('cyl', D.iron, STAIR.x1 - 0.4, h + 0.9, z, 0.36, 1.8, 0.36));
  }
  // 계단 옆구리 — 여기로는 못 지나간다 (양옆 모두)
  for (const x of [STAIR.x0 - 0.2, STAIR.x1 + 0.2]) {
    obstacles.push({ x, z: (STAIR.zBot + STAIR.zTop) / 2,
                     hw: 0.4, hd: (STAIR.zBot - STAIR.zTop) / 2 });
  }
  // 계단 뒤(북쪽) — 1층에서 계단 밑으로 파고들지 못하게
  obstacles.push({ x: cx, z: STAIR.zTop - 0.4, hw: w / 2, hd: 0.4, ...DF1 });
}

// -----------------------------------------------------------
//  2층 바닥판 + 난간 + 기둥 + 계단을 전부 만든다
// -----------------------------------------------------------
export function buildDadStructure(scene) {
  const g = new THREE.Group();
  const obstacles = [];

  // --- 2층 바닥판 (두께 0.7. 윗면이 DAD_F2) — 나무 데크 ---
  for (const s of SLAB) {
    const w = s.x1 - s.x0, d = s.z1 - s.z0;
    const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    g.add(part('box', D.woodDark, cx, DAD_F2 - 0.35, cz, w, 0.7, d));
    // 널빤지 무늬 (위에서 보면 줄이 보인다)
    for (let x = s.x0 + 1.5; x < s.x1; x += 3) {
      const pl = part('box', D.plank, x, DAD_F2 - 0.02, cz, 2.4, 0.08, d - 0.4);
      pl.castShadow = false;
      g.add(pl);
    }
  }

  // --- 2층 바닥을 받치는 기둥 (계단 자리는 비운다) ---
  //  ★ 계단(x 15~23, z -1~9) 위에 기둥을 세우면 계단을 오르다 막힌다
  //  ★ 계단(x -29~-21, z 1~15) 위에 기둥을 세우면 계단을 오르다 막힌다
  for (const x of [-22, -8, 8, 22]) {
    pillar(g, x, -21, DAD_F2);
    obstacles.push({ x, z: -21, r: 1.1, ...DF1 });
    pillar(g, x, -9, DAD_F2);
    obstacles.push({ x, z: -9, r: 1.1, ...DF1 });
  }

  // --- 계단 ---
  stairs(g, obstacles);

  // --- 2층 난간 (떨어지지 않게) ---
  railing(g, obstacles, -14, -6, DAD_W / 2, -6);     // 캠핑 데크 남쪽
  railing(g, obstacles, -17, 1, -14, 1);             // 계단참 남쪽 (계단 동쪽 자투리)
  railing(g, obstacles, -DAD_W / 2, 1, -26, 1);      // 계단참 남쪽 (계단 서쪽 자투리)
  railing(g, obstacles, -14, -6, -14, 1);            // 계단참 동쪽
  //  ★ 계단이 올라오는 자리(x -26~-17, z 1)에만 난간을 비워둔다

  // --- 천장에 매달린 작업등 (아빠성다운 장식) ---
  for (const x of [-16, 0, 16]) {
    g.add(part('cyl', D.ironDark, x, DAD_H - 1.2, 12, 0.2, 2.4, 0.2));
    g.add(part('cone', D.iron, x, DAD_H - 2.6, 12, 2.6, 1.2, 2.6));
    const bulb = part('ball', 0xfff0a8, x, DAD_H - 3.2, 12, 0.9, 0.9, 0.9, glow(0xfff0a8));
    bulb.userData.noShadow = true;
    g.add(bulb);
  }

  scene.add(g);
  return { obstacles };
}

export { SLAB, STAIR };
