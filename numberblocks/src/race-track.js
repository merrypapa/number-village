// ===========================================================
//  🏁 숫자 구슬 레이스 — 코스 만들기 (Matter.js 물리 몸통)
//  위에서 아래로 —
//    ① 출발 상자 (문이 열리면 와르르)
//    ② 🌲 핀볼 숲 — 못(페그)에 통통 튀면서 흩어진다
//    ③ 🌀 바람개비 — 빙글빙글 도는 막대가 구슬을 튕긴다
//    ④ ⚖️ 시소 언덕 — 구슬 무게로 기우뚱
//    ⑤ ⚡ 지그재그 길 — 초록 가속 패드(슝!) · 보라 감속 패드(끈적)
//    ⑥ 🌪 소용돌이 — 동그란 방에서 빙글빙글 돌다가 아래 구멍으로 쏙
//    ⑦ 🏁 결승선
//  코스 크기는 가로 TRACK_W, 세로 TRACK_H (픽셀 단위, 화면에서는 줄이거나 늘려 보여준다)
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const TRACK_W = 800;
export const TRACK_H = 4680;
export const GATE_Y  = 230;          // 출발 문 높이
export const FINISH_Y = 4440;        // 결승선 높이
const WALL_T      = 20;              // 벽 두께
const PEG_R       = 7;               // 핀볼 못 크기
const PEG_ROWS    = 12;              // 핀볼 숲 줄 수
const SPIN_SPEED  = 1.7;             // 바람개비 도는 빠르기 (1초에 몇 라디안)
const SEESAW_TILT = 20;              // 시소가 기우는 최대 각도 (도)
const BOOST_POWER = 7;               // 가속 패드가 밀어주는 힘
const SLOW_KEEP   = 0.35;            // 감속 패드를 밟으면 빠르기를 이만큼만 남긴다
export const VORTEX = { x: 400, y: 3780, r: 230,
                        swirl: 1.1,    // 빙글빙글 미는 힘 (중력의 몇 배)
                        time: 5 };     // 한 구슬이 이 시간(초) 동안만 돌고, 그 뒤엔 구멍으로 떨어진다

// 코스 구간 이름 — 화면 왼쪽에 적힌다
export const ZONES = [
  { y: 290,  text: '🌲 핀볼 숲' },
  { y: 1190, text: '🌀 바람개비' },
  { y: 1780, text: '⚖️ 시소 언덕' },
  { y: 2440, text: '⚡ 지그재그 길' },
  { y: 3460, text: '🌪 소용돌이' },
  { y: 4080, text: '🏁 마지막 길' },
];

/**
 * 코스를 만든다. M = Matter (CDN에서 읽어온 물리 엔진)
 * 돌려주는 것: { bodies, constraints, spinners, seesaws, gate, step(dtSec) }
 *   몸통마다 label로 종류를 적어둔다 — wall · peg · spinner · seesaw · boost · slow · finish · gate
 */
export function buildTrack(M) {
  const { Bodies, Body, Constraint } = M;
  const bodies = [], constraints = [], spinners = [], seesaws = [];
  //  frictionStatic 0 — 완만한 경사로에서 구슬이 '딱 붙어' 멈추지 않게
  const base = (label, extra = {}) => ({ isStatic: true, friction: 0.05, frictionStatic: 0, restitution: 0.4, label, ...extra });

  // 두 점을 잇는 벽 (끝이 둥글어서 이음매에 안 걸린다)
  function wall(x1, y1, x2, y2, label = 'wall', th = WALL_T) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const b = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, len + th, th,
      base(label, { angle: Math.atan2(y2 - y1, x2 - x1), chamfer: { radius: th / 2 - 1 } }));
    bodies.push(b);
    return b;
  }
  function peg(x, y, r = PEG_R) {
    const b = Bodies.circle(x, y, r, base('peg', { restitution: 0.7 }));
    bodies.push(b);
    return b;
  }
  // 경사로 위에 까는 패드 (from~to = 경사로의 몇 % 부분)
  function pad(x1, y1, x2, y2, from, to, label) {
    const ax = x1 + (x2 - x1) * from, ay = y1 + (y2 - y1) * from;
    const bx = x1 + (x2 - x1) * to,   by = y1 + (y2 - y1) * to;
    const len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
    let nx = Math.sin(ang), ny = -Math.cos(ang);             // 경사로 윗면 쪽
    if (ny > 0) { nx = -nx; ny = -ny; }                      // 왼쪽으로 내려가는 길이면 뒤집는다
    const lift = WALL_T / 2 + 13;
    const b = Bodies.rectangle((ax + bx) / 2 + nx * lift, (ay + by) / 2 + ny * lift, len, 26,
      base(label, { isSensor: true, angle: ang }));
    // 내리막 방향 (가속 패드가 이쪽으로 민다)
    const down = by > ay ? 1 : -1;
    b.plugin.dir = { x: Math.cos(ang) * down, y: Math.sin(ang) * down };
    b.plugin.len = len;
    bodies.push(b);
  }

  // ---------- 바깥 벽 · 천장 · 바닥 ----------
  wall(0, -300, 0, TRACK_H);
  wall(TRACK_W, -300, TRACK_W, TRACK_H);
  wall(0, -300, TRACK_W, -300);
  wall(0, TRACK_H, TRACK_W, TRACK_H, 'floor');

  // ---------- ① 출발 문 ----------
  const gate = wall(0, GATE_Y, TRACK_W, GATE_Y, 'gate', 14);

  // ---------- ② 🌲 핀볼 숲 ----------
  for (let r = 0; r < PEG_ROWS; r++) {
    const y = 320 + r * 58;
    for (let x = 48 + (r % 2 ? 32 : 0); x <= TRACK_W - 40; x += 64) peg(x, y);
  }

  // ---------- ③ 🌀 바람개비 ----------
  wall(0, 1010, 330, 1170);
  wall(TRACK_W, 1010, 470, 1170);
  function spinner(x, y, len, speed) {
    const a = Bodies.rectangle(x, y, len, 14, { chamfer: { radius: 6 } });
    const b = Bodies.rectangle(x, y, 14, len, { chamfer: { radius: 6 } });
    const body = Body.create({ parts: [a, b], label: 'spinner', friction: 0.05, frictionStatic: 0, restitution: 0.5 });
    Body.setStatic(body, true);           // 조각을 다 붙인 다음에 '안 움직이는 몸'으로
    bodies.push(body);
    spinners.push({ body, w: speed });
  }
  spinner(400, 1300, 240, SPIN_SPEED);
  spinner(210, 1500, 220, -SPIN_SPEED);
  spinner(590, 1500, 220, SPIN_SPEED);
  peg(400, 1500, 12);
  peg(110, 1330, 10); peg(690, 1330, 10);
  peg(300, 1620, 9); peg(500, 1620, 9);

  // ---------- ④ ⚖️ 시소 언덕 ----------
  wall(0, 1650, 340, 1760);
  wall(TRACK_W, 1650, 460, 1760);
  function seesaw(x, y, len) {
    const plank = Bodies.rectangle(x, y, len, 14, {
      label: 'seesaw', density: 0.004, friction: 0.05, frictionStatic: 0, restitution: 0.3, frictionAir: 0.03,
      chamfer: { radius: 6 },
    });
    const pin = Constraint.create({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 });
    bodies.push(plank); constraints.push(pin);
    seesaws.push({ body: plank, x, y });
    // 시소가 너무 많이 기울지 않게 아래에 받침 두 개
    const d = len * 0.36, s = Math.sin(SEESAW_TILT * Math.PI / 180);
    peg(x - d, y + d * s + 14, 7);
    peg(x + d, y + d * s + 14, 7);
  }
  seesaw(400, 1880, 320);
  seesaw(210, 2120, 280);
  seesaw(590, 2120, 280);
  wall(0, 2300, 340, 2420);
  wall(TRACK_W, 2300, 460, 2420);

  // ---------- ⑤ ⚡ 지그재그 길 (가속 · 감속 패드) ----------
  const ramps = [
    [0, 2480, 690, 2620, [['boost', 0.5, 0.75]]],
    [TRACK_W, 2720, 110, 2860, [['slow', 0.3, 0.5], ['boost', 0.62, 0.85]]],
    [0, 2960, 690, 3100, [['boost', 0.4, 0.65]]],
    [TRACK_W, 3200, 110, 3340, [['boost', 0.2, 0.42], ['slow', 0.62, 0.82]]],
  ];
  for (const [x1, y1, x2, y2, pads] of ramps) {
    wall(x1, y1, x2, y2);
    for (const [kind, a, b] of pads) pad(x1, y1, x2, y2, a, b, kind);
  }

  // ---------- ⑥ 🌪 소용돌이 방 ----------
  wall(0, 3420, 330, 3530);
  wall(TRACK_W, 3420, 470, 3530);
  {
    const { x, y, r } = VORTEX, N = 40;
    const TOP_OPEN = 22, HOLE = 9;                // 위쪽 입구 · 아래 구멍 (도)
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 360, a1 = ((i + 1) / N) * 360, mid = (a0 + a1) / 2;
      const off = (deg) => Math.abs(((mid - deg + 540) % 360) - 180);
      if (off(270) < TOP_OPEN || off(90) < HOLE) continue;    // 270° = 위, 90° = 아래 (화면 좌표)
      const p = (deg) => [x + Math.cos(deg * Math.PI / 180) * r, y + Math.sin(deg * Math.PI / 180) * r];
      const [ax, ay] = p(a0), [bx, by] = p(a1);
      wall(ax, ay, bx, by, 'vortex', 16);
    }
  }

  // ---------- ⑦ 🏁 마지막 길 · 결승선 ----------
  for (let r = 0; r < 3; r++) {
    const y = 4120 + r * 80;
    for (let x = 100 + (r % 2 ? 50 : 0); x <= TRACK_W - 90; x += 100) peg(x, y, 9);
  }
  bodies.push(Bodies.rectangle(TRACK_W / 2, FINISH_Y, TRACK_W, 24, base('finish', { isSensor: true })));

  /** 매 걸음 — 바람개비를 돌린다 (dt = 한 걸음 초) */
  function step(dt) {
    for (const s of spinners) Body.setAngle(s.body, s.body.angle + s.w * dt, true);
  }

  return { bodies, constraints, spinners, seesaws, gate, step,
           boostPower: BOOST_POWER, slowKeep: SLOW_KEEP };
}
