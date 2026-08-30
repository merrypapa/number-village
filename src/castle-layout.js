// ===========================================================
//  🏰 성 안의 "뼈대" — 방 크기, 2층 바닥, 계단, 난간, 기둥
//
//  ★ 이 파일은 "어디에 바닥이 있는가"만 정한다.
//    - groundY(x, z, 지금높이) : 그 자리에서 발이 닿는 높이
//      player.js가 매 프레임 물어보고, 계단을 오르내리거나 떨어뜨린다.
//    - buildStructure(scene)   : 2층 바닥판·계단·난간·기둥을 만들어 넣는다
//
//  ★ 장애물에 붙는 y0/y1은 "몇 층에서 부딪히는가"다 (world.js의 pushOut).
//      F1 = 1층에서만  /  F2 = 2층에서만
// ===========================================================
import * as THREE from 'three';
import { C, part } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 성 크기
// -----------------------------------------------------------
export const HALF_X = 34;    // 성 안 가로 절반 (-34 ~ 34)
export const HALF_Z = 42;    // 성 안 세로 절반 (-42 ~ 42)
export const HEIGHT = 19;    // 천장 높이
export const FLOOR2 = 7.5;   // 2층 바닥 높이

// 층마다 부딪히는 범위 (obstacle에 {...F1} 처럼 붙여 쓴다)
export const F1 = { y0: -1, y1: 3.5 };    // 1층 가구 — 2층에서는 통과
export const F2 = { y0: 5, y1: 40 };      // 2층 난간 — 1층에서는 통과

// -----------------------------------------------------------
//  방 배치 (한눈에 보기)
//
//        북(-z)
//    ┌───────────────────────────┐
//    │        👑 왕좌의 방        │  z -42 ~ -18  (2층 없음 · 천장까지 뻥 뚫림)
//    ├────┬─────────────────┬────┤
//    │요정 │                 │ 계단│  z -18 ~ 14
//    │진열 │   🎪 중앙 홀     │ 회랑│  (가운데 홀도 2층까지 뻥 뚫림)
//    │ 대  │                 │    │
//    ├────┴───┬────────┬────┴────┤
//    │ 📚도서관 │ 🚪현관  │ 🍰파티방 │  z 14 ~ 42
//    └────────┴────────┴─────────┘
//        남(+z) — 현관으로 나가면 마을
//
//  2층 = 위 그림의 바깥 "ㄷ자" (서쪽 팔 + 동쪽 팔 + 남쪽 블록)
//    서쪽 팔 : 💎 보물방      동쪽 팔 : 계단 + 발코니
//    남쪽 블록: 🛏 공주 침실 · 🔭 별 전망대
// -----------------------------------------------------------
export const ROOMS = {
  throne:  { x: 0,   z: -30 },   // 왕좌의 방 한가운데
  hall:    { x: 0,   z: -2 },    // 중앙 홀
  library: { x: -21, z: 28 },    // 도서관 (1층)
  party:   { x: 21,  z: 28 },    // 파티방 (1층)
  entry:   { x: 0,   z: 28 },    // 현관 복도 (1층)
  gallery: { x: -25, z: -2 },    // 요정 진열대 회랑 (1층)
  stairs:  { x: 24,  z: 0 },     // 계단 회랑 (1층)
  treasure:{ x: -25, z: -10 },   // 보물방 (2층)
  bedroom: { x: 21,  z: 28 },    // 공주 침실 (2층)
  starRoom:{ x: -21, z: 28 },    // 별 전망대 (2층)
};

// 2층 바닥이 있는 네모들
const SLAB = [
  { x0: -HALF_X, x1: -16, z0: -18, z1: 14 },       // 서쪽 팔
  { x0:  16, x1:  HALF_X, z0: -18, z1: 14 },       // 동쪽 팔
  { x0: -HALF_X, x1: HALF_X, z0: 14, z1: HALF_Z }, // 남쪽 블록
];

// 계단 — 남쪽(z 13, 1층)에서 북쪽(z -9, 2층)으로 올라간다. 동쪽 벽에 붙어 있다
//  steps = 눈에 보이는 계단 칸 수. 많을수록 한 칸이 낮아서 부드럽게 보인다
const STAIR = { x0: 24, x1: HALF_X, zBot: 13, zTop: -9, steps: 24 };
// 계단이 지나가는 자리는 2층 바닥에 구멍을 뚫는다
const HOLE = { x0: 23.4, x1: HALF_X + 1, z0: STAIR.zTop, z1: 14 };

// 🛝 2층 → 1층 미끄럼틀이 지나가는 난간 틈 (여기만 난간이 없다)
export const SLIDE_GAP = { x0: -12.5, x1: -7.5, z: 14 };

function inRect(r, x, z) {
  return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
}

/**
 * 계단 위라면 발이 닿는 높이, 아니면 -1
 *  ★ 칸칸이 뚝뚝 올라가면 화면이 덜컹거려서 어지럽다.
 *    그래서 계단 "모양"은 칸칸이 두고, **발 높이는 비탈처럼 매끄럽게** 잇는다.
 *    (반 칸(0.5/steps)만큼 올려서 널빤지가 계단 코를 스치듯 지나가게 한다)
 */
function stairY(x, z) {
  if (x < STAIR.x0 || x > STAIR.x1) return -1;
  if (z > STAIR.zBot || z < STAIR.zTop) return -1;
  const u = (STAIR.zBot - z) / (STAIR.zBot - STAIR.zTop);      // 0(아래) ~ 1(위)
  return Math.min(1, u + 0.5 / STAIR.steps) * FLOOR2;
}

/** (x, z)가 2층 바닥 위인가 (계단 구멍은 뺀다) */
function onSlab(x, z) {
  if (inRect(HOLE, x, z)) return false;
  for (const s of SLAB) if (inRect(s, x, z)) return true;
  return false;
}

/**
 * ★ 그 자리에서 발이 닿는 바닥 높이.
 *   fromY = 지금 발 높이. 1층에 서 있으면 2층 바닥은 "너무 높아서" 안 고른다.
 *   (그래서 2층 밑을 걸어다녀도 위층으로 순간이동하지 않는다)
 */
export function groundY(x, z, fromY = 0) {
  const REACH = 0.9;                 // 이만큼까지만 올라설 수 있다 (계단 한 칸)
  let y = 0;
  const s = stairY(x, z);
  if (s > y && s <= fromY + REACH) y = s;
  if (FLOOR2 > y && FLOOR2 <= fromY + REACH && onSlab(x, z)) y = FLOOR2;
  return y;
}

// -----------------------------------------------------------
//  🏛 기둥 하나 (2층 바닥을 받친다)
// -----------------------------------------------------------
function pillar(g, x, z, h) {
  g.add(part('box', C.stone,  x, 0.3, z, 2.2, 0.6, 2.2));       // 주춧돌
  g.add(part('cyl', C.cream,  x, h / 2, z, 1.5, h, 1.5));       // 몸통
  g.add(part('cyl', C.gold,   x, h - 0.25, z, 1.9, 0.5, 1.9));  // 머리
  g.add(part('cyl', C.violet, x, 0.75, z, 1.75, 0.3, 1.75));    // 발목 장식
}

// -----------------------------------------------------------
//  🚧 난간 — 2층에서 떨어지지 않게 막아준다 (기둥 + 손잡이)
//     (x0,z0)에서 (x1,z1)까지 한 줄. 가로나 세로 한 방향이어야 한다.
// -----------------------------------------------------------
function railing(g, obstacles, x0, z0, x1, z1) {
  const long = Math.hypot(x1 - x0, z1 - z0);
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const n = Math.max(2, Math.round(long / 2.2));
  const y = FLOOR2;

  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u;
    g.add(part('cyl', C.cream, x, y + 0.7, z, 0.5, 1.4, 0.5));      // 짧은 기둥
    g.add(part('ball', C.pink, x, y + 1.5, z, 0.42));               // 구슬
  }
  // 손잡이 (긴 막대) + 아래쪽 막이
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const sx = alongX ? long : 0.35, sz = alongX ? 0.35 : long;
  g.add(part('box', C.gold,   mx, y + 1.45, mz, sx, 0.3, sz));
  g.add(part('box', C.violet, mx, y + 0.12, mz, sx, 0.24, sz));

  obstacles.push({
    x: mx, z: mz,
    hw: (alongX ? long / 2 : 0.4), hd: (alongX ? 0.4 : long / 2),
    ...F2,
  });
}

// -----------------------------------------------------------
//  🪜 계단 — 칸칸이 쌓아 올린다 (옆에는 난간)
// -----------------------------------------------------------
function stairs(g, obstacles) {
  const w = STAIR.x1 - STAIR.x0;
  const cx = (STAIR.x0 + STAIR.x1) / 2;
  const depth = (STAIR.zBot - STAIR.zTop) / STAIR.steps;

  for (let i = 0; i < STAIR.steps; i++) {
    const h = (i + 1) / STAIR.steps * FLOOR2;              // 이 칸의 윗면 높이
    const z = STAIR.zBot - depth * (i + 0.5);
    g.add(part('box', i % 2 ? C.stone : C.cream, cx, h / 2, z, w, h, depth));
    g.add(part('box', C.red, cx, h + 0.03, z, w - 1.6, 0.1, depth));   // 붉은 융단
  }
  // 계단 옆 난간 (동쪽 벽 쪽은 벽이 막아준다)
  for (let i = 0; i <= STAIR.steps; i += 3) {
    const h = i / STAIR.steps * FLOOR2;
    const z = STAIR.zBot - depth * i;
    g.add(part('cyl', C.cream, STAIR.x0 + 0.4, h + 0.9, z, 0.45, 1.8, 0.45));
    g.add(part('ball', C.gold, STAIR.x0 + 0.4, h + 1.85, z, 0.4));
  }
  // 계단 옆구리 — 여기로는 못 지나간다 (1층에서도 2층에서도)
  obstacles.push({ x: STAIR.x0 - 0.2, z: (STAIR.zBot + STAIR.zTop) / 2,
                   hw: 0.4, hd: (STAIR.zBot - STAIR.zTop) / 2 });
  // 계단 뒤쪽(북쪽) — 1층에서 계단 밑으로 파고들지 못하게. 2층 계단참에서는 통과
  obstacles.push({ x: cx, z: STAIR.zTop - 0.4, hw: w / 2, hd: 0.4, ...F1 });
}

// -----------------------------------------------------------
//  2층 바닥판 + 난간 + 기둥을 전부 만든다
// -----------------------------------------------------------
/**
 * scene에 뼈대를 넣고, 부딪히는 자리 목록을 돌려준다.
 */
export function buildStructure(scene) {
  const g = new THREE.Group();
  const obstacles = [];

  // --- 2층 바닥판 (두께 0.7. 윗면이 FLOOR2) ---
  for (const s of SLAB) {
    const w = s.x1 - s.x0, d = s.z1 - s.z0;
    const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
    if (s.z0 === 14) {
      // 남쪽 블록은 계단 구멍(z 14보다 북쪽)과 상관없이 통째로 깐다
      g.add(part('box', C.stone, cx, FLOOR2 - 0.35, cz, w, 0.7, d));
      continue;
    }
    if (s.x0 === 16) {
      // 동쪽 팔은 계단 구멍(z -9 ~ 14) 위쪽 계단참 + 서쪽 통로만 남는다
      const land = HOLE.z0 - s.z0;                                   // 계단참
      g.add(part('box', C.stone, cx, FLOOR2 - 0.35, s.z0 + land / 2, w, 0.7, land));
      const walk = HOLE.x0 - s.x0;                                   // 발코니 통로
      g.add(part('box', C.stone, s.x0 + walk / 2, FLOOR2 - 0.35,
                 (HOLE.z0 + s.z1) / 2, walk, 0.7, s.z1 - HOLE.z0));
      continue;
    }
    g.add(part('box', C.stone, cx, FLOOR2 - 0.35, cz, w, 0.7, d));
  }

  // --- 2층 바닥을 받치는 기둥 ---
  for (let z = -16; z <= 12; z += 7) {          // 홀 양옆
    pillar(g, -16, z, FLOOR2);
    pillar(g,  16, z, FLOOR2);
  }
  // 남쪽 블록 앞 (현관에서 홀로 들어오는 가운데 길은 비워둔다)
  for (let x = -30; x <= 30; x += 7.5) if (Math.abs(x) > 4) pillar(g, x, 14, FLOOR2);
  for (const x of [-16, 16]) {                  // 왕좌의 방 입구 — 천장까지 큰 기둥
    pillar(g, x, -18, HEIGHT);
    obstacles.push({ x, z: -18, r: 1.2 });
  }
  for (let z = -16; z <= 12; z += 7) {
    obstacles.push({ x: -16, z, r: 1.1, ...F1 });
    obstacles.push({ x:  16, z, r: 1.1, ...F1 });
  }
  for (let x = -30; x <= 30; x += 7.5) {
    if (Math.abs(x) > 4) obstacles.push({ x, z: 14, r: 1.1, ...F1 });
  }

  // --- 계단 ---
  stairs(g, obstacles);

  // --- 2층 난간 (떨어지지 않게) ---
  railing(g, obstacles, -16, -18, -16, 14);        // 서쪽 팔 — 홀 쪽
  railing(g, obstacles,  16, -18,  16, 14);        // 동쪽 팔 — 홀 쪽
  railing(g, obstacles, -HALF_X, -18, -16, -18);   // 서쪽 팔 — 왕좌의 방 쪽
  railing(g, obstacles,  16, -18,  HALF_X, -18);   // 동쪽 팔 — 왕좌의 방 쪽
  //  ★ 미끄럼틀이 지나갈 자리(SLIDE_GAP)만 난간을 비워둔다
  railing(g, obstacles, -16, 14, SLIDE_GAP.x0, 14);   // 남쪽 블록 — 홀 쪽 (왼쪽)
  railing(g, obstacles, SLIDE_GAP.x1, 14, 16, 14);   // 남쪽 블록 — 홀 쪽 (오른쪽)
  railing(g, obstacles, HOLE.x0, HOLE.z0, HOLE.x0, HOLE.z1);   // 계단 구멍 옆
  railing(g, obstacles, HOLE.x0, 14, HALF_X, 14);              // 계단 구멍 아래쪽

  // --- 1층 방 칸막이 (도서관 / 현관 / 파티방) + 2층 칸막이 ---
  //   가운데(z 25~31)는 뚫려 있어서 드나들 수 있다
  for (const sx of [-1, 1]) {
    for (const [z0, z1] of [[16, 25], [31, HALF_Z]]) {
      const cz = (z0 + z1) / 2, d = z1 - z0;
      for (const y of [0, FLOOR2]) {
        g.add(part('box', C.cream,  sx * 8, y + 1.3, cz, 0.6, 2.6, d));
        g.add(part('box', C.violet, sx * 8, y + 2.7, cz, 0.9, 0.3, d));
      }
      obstacles.push({ x: sx * 8, z: cz, hw: 0.5, hd: d / 2, ...F1 });
      obstacles.push({ x: sx * 8, z: cz, hw: 0.5, hd: d / 2, ...F2 });
    }
  }

  scene.add(g);
  return { obstacles };
}

// 미끄럼틀·문 등이 쓰라고 계단 자리도 알려준다
export { STAIR, HOLE };
