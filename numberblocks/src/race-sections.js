// ===========================================================
//  🏁 숫자 구슬 레이스 — 코스 구간 모음
//  race-track.js 가 게임할 때마다 이 중에서 골라 섞어 쌓는다.
//  구간 하나 = { title, build(k, y) } — y(위)부터 만들고, 다 만든 아래 y를 돌려준다.
//  k = 코스 도구 (wall · peg · funnel · pad · spinner · seesaw · vortex · lava · rnd · pick)
//
//  ★ 새 구간을 만들려면 SECTIONS에 하나 더 넣고 NORMAL이나 LAVA 목록에 이름을 적는다.
//    약속: 위에서 구슬이 어디로 떨어져도 받을 수 있어야 하고, 맨 위 40px은 비워 둔다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const LAVA_EVERY = 3;        // 🌋 용암 칸: 몇 칸마다 한 칸이 용암인지 (3이면 10칸 중 3~4칸)
const LAVA_GAP   = [56, 60]; // 🌋 징검다리 구멍 너비 (벽 두께 20을 빼면 실제 구멍 — 구슬 지름 32보다 조금 크게, 끼지 않게)
const LAVA_HOLES = 2;        // 🌋 징검다리 내리막 3개 중 구멍 난 길 수
const RAMP_DROP  = 190;      // ⚡ 지그재그 내리막이 한 번에 내려가는 높이 (클수록 가파르고 빠르다)
const RAMP_STEP  = 280;      // 내리막 사이 간격
const SWIRL      = 1.1;      // 🌪 소용돌이가 미는 힘 (중력의 몇 배)
const SWIRL_TIME = 5;        // 🌪 한 구슬이 이 시간(초)만 돌고 구멍으로 떨어진다

const between = (k, [a, b]) => a + k.rnd() * (b - a);

export const SECTIONS = {
  // ---------- 🌲 핀볼 숲 — 못에 통통 튀며 흩어진다 ----------
  pegs: {
    title: '🌲 핀볼 숲',
    build(k, y0) {
      const rows = 6 + Math.floor(k.rnd() * 5);
      const dy = 56 + k.rnd() * 14, dx = k.pick([64, 70, 76]);
      for (let r = 0; r < rows; r++) {
        const y = y0 + 70 + r * dy;
        for (let x = 48 + (r % 2 ? dx / 2 : 0); x <= k.W - 40; x += dx) {
          // 가끔 큰 범퍼
          k.peg(x, y, k.rnd() < 0.07 ? 15 : 7);
        }
      }
      return y0 + 70 + rows * dy;
    },
  },

  // ---------- 🌀 바람개비 — 도는 막대가 구슬을 튕긴다 ----------
  spinners: {
    title: '🌀 바람개비',
    build(k, y0) {
      const sp = () => (k.rnd() < 0.5 ? -1 : 1) * (1.3 + k.rnd() * 0.9);
      const rows = k.rnd() < 0.5 ? [[400], [210, 590]] : [[250, 550], [400]];
      if (k.rnd() < 0.4) rows.push(rows[0]);
      let y = y0 + 170;
      for (const xs of rows) {
        const len = xs.length === 1 ? 240 : 210;
        for (const x of xs) k.spinner(x, y, len, sp());
        // 바람개비 옆 못 몇 개
        if (xs.length === 1) { k.peg(110, y + 30, 10); k.peg(k.W - 110, y + 30, 10); }
        else k.peg(400, y + 20, 12);
        y += 210;
      }
      return y - 30;
    },
  },

  // ---------- ⚖️ 시소 언덕 — 구슬 무게로 기우뚱 ----------
  seesaws: {
    title: '⚖️ 시소 언덕',
    build(k, y0) {
      let y = k.funnel(y0 + 40);
      const tilt = 16 + k.rnd() * 10;
      k.seesaw(400, y + 120, 300 + k.rnd() * 60, tilt);
      const side = 250 + k.rnd() * 40;
      k.seesaw(210, y + 360, side, tilt);
      k.seesaw(590, y + 360, side, tilt);
      return k.funnel(y + 540);
    },
  },

  // ---------- ⚡ 지그재그 길 — 초록 가속 패드 · 보라 감속 패드 ----------
  zigzag: {
    title: '⚡ 지그재그 길',
    build(k, y0) {
      const n = 2 + Math.floor(k.rnd() * 3);
      let left = k.rnd() < 0.5;
      let y = y0 + 40;
      for (let i = 0; i < n; i++) {
        const [x1, x2] = left ? [0, 690] : [k.W, 110];
        k.wall(x1, y, x2, y + RAMP_DROP);
        const pads = 1 + Math.floor(k.rnd() * 2);
        for (let p = 0; p < pads; p++) {
          const a = 0.15 + p * 0.42 + k.rnd() * 0.15;
          k.pad(x1, y, x2, y + RAMP_DROP, a, a + 0.22, k.rnd() < 0.65 ? 'boost' : 'slow');
        }
        left = !left;
        y += RAMP_STEP;
      }
      return y - 60;
    },
  },

  // ---------- 🌪 소용돌이 — 동그란 방에서 빙글빙글, 아래 구멍으로 쏙 ----------
  vortex: {
    title: '🌪 소용돌이',
    build(k, y0) {
      const top = k.funnel(y0 + 40, 70, 110);
      const r = 190 + k.rnd() * 40, x = 400, y = top + 20 + r;
      const N = 40, TOP_OPEN = 24, HOLE = 10;      // 위쪽 입구 · 아래 구멍 (도)
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * 360, a1 = ((i + 1) / N) * 360, mid = (a0 + a1) / 2;
        const off = (deg) => Math.abs(((mid - deg + 540) % 360) - 180);
        if (off(270) < TOP_OPEN || off(90) < HOLE) continue;    // 270° = 위, 90° = 아래 (화면 좌표)
        const p = (deg) => [x + Math.cos(deg * Math.PI / 180) * r, y + Math.sin(deg * Math.PI / 180) * r];
        const [ax, ay] = p(a0), [bx, by] = p(a1);
        k.wall(ax, ay, bx, by, 'vortex', 16);
      }
      k.vortex({ x, y, r, swirl: SWIRL * (k.rnd() < 0.5 ? -1 : 1), time: SWIRL_TIME });
      return y + r + 60;
    },
  },

  // ---------- 🌋 용암 칸 — 못 사이로 떨어져서 아래 10칸 중 용암 칸에 들어가면 탈락! ----------
  lavaSlots: {
    title: '🌋 용암 칸',
    build(k, y0) {
      // 한쪽으로 몰려 오면 그쪽 칸만 걸리니까 → 가운데로 모았다가 못으로 고르게 퍼뜨린다
      const mid = k.funnel(y0 + 40, 80, 110);
      const rows = 7;
      for (let r = 0; r < rows; r++) {
        const y = mid + 60 + r * 56;
        for (let x = 48 + (r % 2 ? 36 : 0); x <= k.W - 40; x += 72) k.peg(x, y, 7);
      }
      const top = mid + 60 + rows * 56, depth = 90, SLOTS = 10, sw = (k.W - 20) / SLOTS;
      // 칸막이
      for (let i = 1; i < SLOTS; i++) k.wall(10 + i * sw, top, 10 + i * sw, top + depth, 'wall', 10);
      // 용암 칸 고르기 (나머지 칸은 바닥이 없어서 아래로 쏙 빠진다)
      //  골고루 — LAVA_EVERY 칸마다 한 칸 (어디서 시작할지는 주사위)
      const start = Math.floor(k.rnd() * LAVA_EVERY);
      const slots = [...Array(SLOTS).keys()].filter(i => i % LAVA_EVERY === start);
      const open = [...Array(SLOTS).keys()].find(i => !slots.includes(i)) ?? 0;
      const exit = { x: 10 + (open + 0.5) * sw, y: top + depth + 40 };
      for (const i of slots) {
        const cx = 10 + (i + 0.5) * sw;
        k.wall(10 + i * sw, top + depth, 10 + (i + 1) * sw, top + depth, 'wall', 14);
        k.lava(cx, top + depth - 22, sw - 10, 30, exit);
      }
      return top + depth + 80;
    },
  },

  // ---------- 🌋 용암 징검다리 — 내리막길 중간에 구멍! 빨리 굴러야 건너뛴다 ----------
  lavaGaps: {
    title: '🌋 용암 징검다리',
    build(k, y0) {
      const n = 3;
      const safe = Math.floor(k.rnd() * n);        // 구멍 없는 길 하나 (LAVA_HOLES = 2 일 때)
      let left = k.rnd() < 0.5;
      let y = y0 + 40;
      for (let i = 0; i < n; i++) {
        const [x1, x2] = left ? [0, 690] : [k.W, 110];
        const y2 = y + RAMP_DROP;
        if (n - LAVA_HOLES > 0 && i === safe) {     // 구멍 없는 보통 내리막
          k.wall(x1, y, x2, y2);
          left = !left; y += RAMP_STEP;
          continue;
        }
        const at = (f) => [x1 + (x2 - x1) * f, y + (y2 - y) * f];
        const f = 0.45 + k.rnd() * 0.25;
        const gap = between(k, LAVA_GAP) / Math.abs(x2 - x1);
        const [ax, ay] = at(f - gap / 2), [bx, by] = at(f + gap / 2);
        k.wall(x1, y, ax, ay);
        k.wall(bx, by, x2, y2);
        k.pad(x1, y, x2, y2, Math.max(0.05, f - 0.38), f - 0.12, 'boost');   // 구멍 앞 가속 — 빠르면 슝 건너뛴다
        // 구멍 아래 용암 웅덩이
        const [lo, loY] = ax < bx ? [ax, ay] : [bx, by], [hi, hiY] = ax < bx ? [bx, by] : [ax, ay];
        const deep = Math.max(ay, by) + 70;
        k.wall(lo, loY + 14, lo, deep, 'wall', 10);
        k.wall(hi, hiY + 14, hi, deep, 'wall', 10);
        k.wall(lo, deep, hi, deep, 'wall', 12);
        k.lava((lo + hi) / 2, deep - 22, hi - lo - 10, 30, { x: x2 + (left ? 40 : -40), y: y2 + 50 });
        left = !left;
        y += RAMP_STEP;
      }
      return y - 40;
    },
  },
};

export const NORMAL = ['pegs', 'spinners', 'seesaws', 'zigzag', 'vortex'];
export const LAVA = ['lavaSlots', 'lavaGaps'];
