// ===========================================================
//  🏁 숫자 구슬 레이스 — 코스 만들기 (Matter.js 물리 몸통)
//  ★ 게임할 때마다 코스가 바뀐다!
//    코스 번호(seed)로 race-sections.js 의 구간들을 골라 섞어서 위에서 아래로 쌓는다.
//    같은 코스 번호면 늘 같은 코스가 나온다.
//
//    맨 위: 출발 상자 (문이 열리면 와르르)
//    가운데: 🌲 핀볼 숲 · 🌀 바람개비 · ⚖️ 시소 · ⚡ 지그재그 · 🌪 소용돌이
//            🌋 용암 칸 · 🌋 용암 징검다리 (용암에 빠지면 탈락!)
//    맨 아래: 🏁 결승선
// ===========================================================
import { SECTIONS, NORMAL, LAVA } from './race-sections.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const TRACK_W = 800;
export const GATE_Y  = 230;          // 출발 문 높이
const WALL_T      = 20;              // 벽 두께
const PEG_R       = 7;               // 핀볼 못 크기
const NORMAL_COUNT = 4;              // 보통 구간 몇 개
const LAVA_COUNT   = 2;              // 🌋 용암 구간 몇 개 (용암을 켰을 때)
const BOOST_POWER = 7;               // 가속 패드가 밀어주는 힘
const SLOW_KEEP   = 0.35;            // 감속 패드를 밟으면 빠르기를 이만큼만 남긴다

/** 코스 번호로 늘 같은 순서가 나오는 주사위 (0~1) */
export function dice(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 코스를 만든다. M = Matter, opts = { seed, lava }
 * 돌려주는 것: { bodies, constraints, spinners, seesaws, vortexes, zones, gate, H, finishY, plan, step(dt) }
 *   몸통마다 label로 종류를 적어둔다 — wall · peg · spinner · seesaw · boost · slow · lava · finish · gate
 */
export function buildTrack(M, opts = {}) {
  const { Bodies, Body, Constraint } = M;
  const rnd = dice(opts.seed ?? 1);
  const bodies = [], constraints = [], spinners = [], seesaws = [], vortexes = [], zones = [];
  //  frictionStatic 0 — 완만한 경사로에서 구슬이 '딱 붙어' 멈추지 않게
  const base = (label, extra = {}) => ({ isStatic: true, friction: 0.05, frictionStatic: 0, restitution: 0.4, label, ...extra });

  // ---------- 코스 도구 (구간들이 이걸로 만든다) ----------
  const kit = {
    W: TRACK_W,
    /** 두 점을 잇는 벽 (끝이 둥글어서 이음매에 안 걸린다) */
    wall(x1, y1, x2, y2, label = 'wall', th = WALL_T) {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const b = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, len + th, th,
        base(label, { angle: Math.atan2(y2 - y1, x2 - x1), chamfer: { radius: th / 2 - 1 } }));
      bodies.push(b);
      return b;
    },
    peg(x, y, r = PEG_R) {
      const b = Bodies.circle(x, y, r, base('peg', { restitution: 0.7 }));
      bodies.push(b);
      return b;
    },
    /** 양쪽 벽에서 가운데로 모으는 깔때기 (가운데 틈 = half*2) */
    funnel(y, half = 70, drop = 110) {
      kit.wall(0, y, TRACK_W / 2 - half, y + drop);
      kit.wall(TRACK_W, y, TRACK_W / 2 + half, y + drop);
      return y + drop;
    },
    /** 경사로 위에 까는 패드 (from~to = 경사로의 몇 % 부분) */
    pad(x1, y1, x2, y2, from, to, label) {
      const ax = x1 + (x2 - x1) * from, ay = y1 + (y2 - y1) * from;
      const bx = x1 + (x2 - x1) * to,   by = y1 + (y2 - y1) * to;
      const len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
      let nx = Math.sin(ang), ny = -Math.cos(ang);             // 경사로 윗면 쪽
      if (ny > 0) { nx = -nx; ny = -ny; }                      // 왼쪽으로 내려가는 길이면 뒤집는다
      const lift = WALL_T / 2 + 13;
      const b = Bodies.rectangle((ax + bx) / 2 + nx * lift, (ay + by) / 2 + ny * lift, len, 26,
        base(label, { isSensor: true, angle: ang }));
      const down = by > ay ? 1 : -1;                           // 내리막 방향 (가속 패드가 이쪽으로 민다)
      b.plugin.dir = { x: Math.cos(ang) * down, y: Math.sin(ang) * down };
      b.plugin.len = len;
      bodies.push(b);
    },
    /** 🌀 빙글빙글 바람개비 (십자 막대) */
    spinner(x, y, len, speed) {
      const a = Bodies.rectangle(x, y, len, 14, { chamfer: { radius: 6 } });
      const b = Bodies.rectangle(x, y, 14, len, { chamfer: { radius: 6 } });
      const body = Body.create({ parts: [a, b], label: 'spinner', friction: 0.05, frictionStatic: 0, restitution: 0.5 });
      Body.setStatic(body, true);           // 조각을 다 붙인 다음에 '안 움직이는 몸'으로
      bodies.push(body);
      spinners.push({ body, w: speed });
    },
    /** ⚖️ 시소 — 가운데 핀에 꽂힌 판. 기울기 받침 두 개 */
    seesaw(x, y, len, tilt = 20) {
      const plank = Bodies.rectangle(x, y, len, 14, {
        label: 'seesaw', density: 0.004, friction: 0.05, frictionStatic: 0, restitution: 0.3, frictionAir: 0.03,
        chamfer: { radius: 6 },
      });
      constraints.push(Constraint.create({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 }));
      bodies.push(plank);
      seesaws.push({ body: plank, x, y });
      const d = len * 0.36, s = Math.sin(tilt * Math.PI / 180);
      kit.peg(x - d, y + d * s + 14, 7);
      kit.peg(x + d, y + d * s + 14, 7);
    },
    /** 🌪 소용돌이 방 기록 (힘은 race-game.js가 준다) */
    vortex(v) { vortexes.push(v); },
    /** 🌋 용암 — 닿으면 탈락. exit = 탈락이 멈췄을 때(마지막 몇 명) 건져 올려 줄 자리 */
    lava(x, y, w, h, exit) {
      const b = Bodies.rectangle(x, y, w, h, base('lava', { isSensor: true }));
      b.plugin.exit = exit;
      bodies.push(b);
    },
    zone(y, text) { zones.push({ y, text }); },
    rnd,
    pick: (arr) => arr[Math.floor(rnd() * arr.length)],
  };

  // ---------- 출발 문 ----------
  const gate = kit.wall(0, GATE_Y, TRACK_W, GATE_Y, 'gate', 14);

  // ---------- 오늘의 코스 고르기 ----------
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const plan = shuffle([...NORMAL]).slice(0, NORMAL_COUNT);
  if (opts.lava) {
    const lavas = shuffle([...LAVA]);
    for (let i = 0; i < LAVA_COUNT; i++) {
      // 용암은 맨 처음이 아닌 자리에 끼워 넣는다 (먼저 조금 섞이고 나서)
      plan.splice(1 + Math.floor(rnd() * plan.length), 0, lavas[i % lavas.length]);
    }
  }

  let y = GATE_Y + 50;
  for (const name of plan) {
    const sec = SECTIONS[name];
    kit.zone(y + 20, sec.title);
    y = sec.build(kit, y) + 40;
  }

  // ---------- 🏁 마지막 길 · 결승선 ----------
  kit.zone(y + 20, '🏁 마지막 길');
  for (let r = 0; r < 3; r++) {
    const py = y + 80 + r * 80;
    for (let x = 100 + (r % 2 ? 50 : 0); x <= TRACK_W - 90; x += 100) kit.peg(x, py, 9);
  }
  const finishY = y + 400;
  bodies.push(Bodies.rectangle(TRACK_W / 2, finishY, TRACK_W, 24, base('finish', { isSensor: true })));
  const H = finishY + 260;                 // 결승선 아래 바구니 (100명이 다 들어가게)

  // ---------- 바깥 벽 · 천장 · 바닥 ----------
  kit.wall(0, -400, 0, H);
  kit.wall(TRACK_W, -400, TRACK_W, H);
  kit.wall(0, -400, TRACK_W, -400);
  kit.wall(0, H, TRACK_W, H, 'floor');

  /** 매 걸음 — 바람개비를 돌린다 (dt = 한 걸음 초) */
  function step(dt) {
    for (const s of spinners) Body.setAngle(s.body, s.body.angle + s.w * dt, true);
  }

  return { bodies, constraints, spinners, seesaws, vortexes, zones, gate, H, finishY, step,
           plan: plan.map(n => SECTIONS[n].title),
           boostPower: BOOST_POWER, slowKeep: SLOW_KEEP };
}
