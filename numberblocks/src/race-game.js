// ===========================================================
//  🏁 숫자 구슬 레이스 — 물리 · 경기 진행
//  숫자 친구 1~100 구슬이 위에서 와르르 떨어져 코스를 굴러 내려간다.
//  결승선을 먼저 지나간 순서대로 1등, 2등, 3등 …
//  🌋 용암에 빠지면 탈락! 살아남은 친구만 결승선에 들어간다.
//  게임할 때마다 코스가 새로 바뀐다 (race-track.js · race-sections.js)
//
//  물리 엔진은 Matter.js — 게임을 처음 열 때 CDN에서 읽어온다 (설치 없음).
//  코스는 race-track.js, 그리기는 race-draw.js, 버튼·순위표는 race-ui.js
// ===========================================================
import { MAX_RACERS, MARBLE_R, BOUNCE, SLIP, SPEEDS, COUNTDOWN, LATE_LIMIT, preloadSprites } from './race-data.js';
import { buildTrack, TRACK_W, GATE_Y } from './race-track.js';
import { createCamera, drawRace } from './race-draw.js';
import { createRaceUI } from './race-ui.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const STEP = 1 / 60;          // 물리 한 걸음 (초)
const MAX_SPEED = 20;         // 구슬이 이보다 빨라지지 않는다 (벽을 뚫지 않게)
const STUCK_TIME = 2.5;       // 이 시간(초) 동안 꼼짝 않으면 톡 밀어준다
const MIN_SURVIVORS = 3;      // 🌋 적어도 이만큼은 살아남는다 (그때부터 용암에 빠지면 건져 준다)
const CAM_MODES = ['leader', 'overview', 'friend'];
// Matter.js 를 읽어올 곳 — 앞의 곳이 안 되면 다음 곳에서
const MATTER_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js',
  'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js',
];

let matterLoading = null;
function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  matterLoading ??= MATTER_URLS.reduce((p, url) => p.catch(() => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => (window.Matter ? ok(window.Matter) : fail());
    s.onerror = () => { s.remove(); fail(); };
    document.head.appendChild(s);
  })), Promise.reject());
  matterLoading.catch(() => { matterLoading = null; });     // 실패하면 다음에 다시 시도
  return matterLoading;
}

/** opts = { music, onClose } */
export function createMarbleRace(opts = {}) {
  const screen = document.getElementById('race');
  const cv = document.getElementById('raceCanvas');
  const g = cv.getContext('2d');
  const view = { w: 0, h: 0, dpr: 1 };
  const cam = createCamera();

  let M = null, engine = null, track = null;
  let marbles = [];               // { n, body, done, out, time, still, vt }
  let order = [];                 // 결승선을 지난 순서
  let outOrder = [];              // 🌋 용암에 빠진 순서
  let burns = [];                 // 🔥 탈락 불꽃 { x, y, age }
  let later = [];                 // 물리 계산이 끝난 뒤에 할 일 (몸 빼기 · 옮기기)
  let lava = true, seed = 1;      // 용암 켜기 · 코스 번호
  let state = 'setup';            // setup → count → run → done
  let racers = MAX_RACERS, cheer = null;
  let paused = false, speedAt = 0, simTime = 0, acc = 0, countLeft = 0, countShown = 0, firstAt = null;
  let raf = 0, last = 0, boardTimer = 0, t = 0;

  const ui = createRaceUI({
    onCount(n) { racers = n; if (cheer > n) cheer = null; build(); showSetup(); },
    onCheer(n) { cheer = cheer === n ? null : n; showSetup(); },
    onLava() { lava = !lava; build(); showSetup(); },
    onGo: go,
    onPlay() { if (state === 'setup' || state === 'done') return; paused = !paused; ui.setPlay(paused); },
    onReset() { build(); showSetup(); },
    onSpeed() { speedAt = (speedAt + 1) % SPEEDS.length; ui.setSpeed(SPEEDS[speedAt]); },
    onCam() {
      let i = CAM_MODES.indexOf(cam.mode);
      do i = (i + 1) % CAM_MODES.length; while (CAM_MODES[i] === 'friend' && !cheer);
      cam.mode = CAM_MODES[i];
      ui.setCam(cam.mode);
    },
    onExit: close,
    onAgain() { build(); showSetup(); },
    onDone: close,
  });

  function showSetup() { ui.showSetup(racers, cheer, { lava, seed, plan: track.plan }); }

  // ---------- 코스와 구슬을 새로 만든다 (만들 때마다 코스 번호가 새로 뽑힌다) ----------
  function build() {
    const { Engine, Bodies, Composite, Events } = M;
    engine = Engine.create({ gravity: { x: 0, y: 1 } });
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    seed = 1 + Math.floor(Math.random() * 9999);
    track = buildTrack(M, { seed, lava });
    cam.H = track.H;
    Composite.add(engine.world, [...track.bodies, ...track.constraints]);

    // 출발 상자 안 자리를 섞어서 구슬을 놓는다 (매번 자리가 달라서 결과도 달라진다)
    const COLS = 14, slots = [];
    for (let i = 0; i < racers; i++) slots.push(i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    marbles = slots.map((slot, i) => {
      const x = 62 + (slot % COLS) * 52 + (Math.random() - 0.5) * 6;
      const y = GATE_Y - 26 - Math.floor(slot / COLS) * 38;
      const body = Bodies.circle(x, y, MARBLE_R, {
        label: 'marble', restitution: BOUNCE, friction: SLIP, frictionStatic: 0, frictionAir: 0.002, density: 0.002,
      });
      const m = { n: i + 1, body, done: false, out: false, time: null, still: 0, vt: 0 };
      body.plugin.m = m;
      return m;
    });
    Composite.add(engine.world, marbles.map(m => m.body));
    Events.on(engine, 'collisionStart', onHit);

    order = []; outOrder = []; burns = []; later = []; state = 'setup'; paused = false; simTime = 0; acc = 0; firstAt = null;
    ui.setPlay(false); ui.setClock(0); ui.showCount(''); ui.hideResult(); ui.clearBoard();
    if (cam.mode === 'friend' && !cheer) { cam.mode = 'leader'; ui.setCam(cam.mode); }
    cam.y = 120;
  }

  // ---------- 출발! 3, 2, 1 ----------
  function go() {
    if (state !== 'setup') return;
    ui.hideSetup();
    state = 'count';
    countLeft = COUNTDOWN;
    countShown = 0;
    if (cheer && cam.mode === 'leader') { cam.mode = 'friend'; ui.setCam(cam.mode); }
  }
  function openGate() {
    M.Composite.remove(engine.world, track.gate);
    track.gate.plugin.hidden = true;
    state = 'run';
    ui.showCount('출발! 🏁');
    setTimeout(() => { if (state === 'run') ui.showCount(''); }, 900);
    opts.music?.ping(84);
  }

  // ---------- 부딪힘 — 결승선 · 가속 패드 · 감속 패드 ----------
  function onHit(e) {
    for (const pair of e.pairs) {
      const a = pair.bodyA, b = pair.bodyB;
      const ball = a.label === 'marble' ? a : b.label === 'marble' ? b : null;
      if (!ball) continue;
      const other = (ball === a ? b : a).parent;
      const v = ball.velocity;
      if (other.label === 'finish') finish(ball.plugin.m);
      else if (other.label === 'lava') burn(ball.plugin.m, other);
      else if (other.label === 'boost') {
        const d = other.plugin.dir, P = track.boostPower;
        M.Body.setVelocity(ball, { x: v.x + d.x * P, y: v.y + d.y * P });
      } else if (other.label === 'slow') {
        M.Body.setVelocity(ball, { x: v.x * track.slowKeep, y: v.y * track.slowKeep });
      }
    }
  }

  function finish(m) {
    if (m.done || state !== 'run') return;
    m.done = true;
    m.time = simTime;
    order.push(m);
    if (firstAt === null) firstAt = simTime;
    if (order.length <= 3) opts.music?.ping([84, 79, 76][order.length - 1]);
    if (order.length + outOrder.length === marbles.length) endRace();
  }

  /** 🌋 용암에 빠졌다 — 탈락! (남은 친구가 MIN_SURVIVORS 명이면 건져 준다) */
  function burn(m, lavaBody) {
    if (m.done || m.out || state !== 'run') return;
    const alive = marbles.length - outOrder.length;
    if (alive <= MIN_SURVIVORS) {
      later.push(() => { M.Body.setPosition(m.body, lavaBody.plugin.exit); M.Body.setVelocity(m.body, { x: 0, y: 0 }); });
      return;
    }
    m.out = true;
    m.time = simTime;
    outOrder.push(m);
    burns.push({ x: m.body.position.x, y: m.body.position.y, age: 0 });
    later.push(() => M.Composite.remove(engine.world, m.body));
    opts.music?.ping(40 + (outOrder.length % 5), 'sawtooth');
    if (order.length + outOrder.length === marbles.length) endRace();
  }

  function endRace() {
    if (state === 'done') return;
    state = 'done';
    [72, 76, 79, 84].forEach((n, i) => setTimeout(() => opts.music?.ping(n), i * 160));
    const list = ranking().map(m => ({ n: m.n, time: m.time, out: m.out }));
    const survived = marbles.length - outOrder.length;
    setTimeout(() => { if (state === 'done') ui.showResult(list, cheer, { survived, total: marbles.length, seed }); }, 1200);
  }

  /** 지금 순위 — 들어온 순서 → 아직 달리는 친구(아래로 많이 내려간 순) → 🌋 늦게 탈락한 순 */
  function ranking() {
    const rest = marbles.filter(m => !m.done && !m.out).sort((p, q) => q.body.position.y - p.body.position.y);
    return [...order, ...rest, ...outOrder.slice().reverse()];
  }

  // ---------- 물리 한 걸음 ----------
  function stepSim() {
    const { Body, Engine } = M;
    track.step(STEP);
    const g0 = engine.gravity.scale;                // 중력 세기 (Matter 기본 0.001)
    for (const m of marbles) {
      if (m.out) continue;
      const b = m.body, p = b.position, v = b.velocity;
      // 🌪 소용돌이 — 동그란 방 안에서는 빙글빙글 미는 힘. 시간이 지나면 약해져서 구멍으로 빠진다
      for (const vx of track.vortexes) {
        const dx = p.x - vx.x, dy = p.y - vx.y, d = Math.hypot(dx, dy);
        if (d >= vx.r - 8 || d < 1 || m.done) continue;
        m.vt += STEP;
        const f = Math.max(0, 1 - m.vt / vx.time) * vx.swirl * g0 * b.mass;
        if (f !== 0) Body.applyForce(b, p, { x: -dy / d * f, y: dx / d * f });
      }
      // 너무 빠르면 줄인다
      const sp = Math.hypot(v.x, v.y);
      if (sp > MAX_SPEED) Body.setVelocity(b, { x: v.x / sp * MAX_SPEED, y: v.y / sp * MAX_SPEED });
      // 꼼짝 않고 끼어 있으면 톡
      if (state === 'run' && !m.done) {
        m.still = sp < 0.25 ? m.still + STEP : 0;
        if (m.still > STUCK_TIME) {
          m.still = 0;
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 8, y: -4 });
        }
      }
      // 혹시 코스 밖으로 튀어 나가면 안으로
      if (p.x < 0 || p.x > TRACK_W) Body.setPosition(b, { x: Math.min(TRACK_W - 30, Math.max(30, p.x)), y: p.y });
      // 센서를 건너뛰었어도 결승선 아래면 들어온 것
      if (p.y > track.finishY + 30) finish(m);
    }
    Engine.update(engine, STEP * 1000);
    for (const fn of later) fn();
    later.length = 0;
    if (state === 'run') {
      simTime += STEP;
      if (firstAt !== null && simTime - firstAt > LATE_LIMIT) endRace();
    }
  }

  // ---------- 매 프레임 ----------
  function frame(now) {
    if (!screen.classList.contains('on')) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now; t += dt;
    if (!engine) return;

    if (state === 'count' && !paused) {            // 3 → 2 → 1 → 출발!
      countLeft -= dt;
      const k = Math.ceil(countLeft);
      if (countLeft <= 0) openGate();
      else if (k !== countShown) { countShown = k; ui.showCount(String(k)); opts.music?.ping(72); }
    }
    if (!paused) {
      // 시작 화면에서도 1배로 돌려서 구슬이 문 위에 차곡차곡 앉게 한다
      acc += dt * (state === 'run' || state === 'done' ? SPEEDS[speedAt] : 1);
      let n = 0;
      while (acc >= STEP && n < 12) { stepSim(); acc -= STEP; n++; }
      if (n === 12) acc = 0;                        // 느린 기기에서는 따라잡기를 포기
    }
    ui.setClock(simTime, outOrder.length, marbles.length - outOrder.length);
    for (const b of burns) b.age += dt;
    if (burns.length && burns[0].age > 1.5) burns.shift();

    const rank = ranking();
    boardTimer -= dt;
    if (boardTimer <= 0 && state !== 'setup') {
      boardTimer = 0.2;
      ui.renderBoard(rank.map(m => ({ n: m.n, time: m.time, out: m.out })), cheer);
    }
    // 카메라가 볼 구슬 — 1등 보기는 아직 달리는 구슬 중 맨 앞
    let target = null;
    if (state === 'setup' || state === 'count') target = { x: TRACK_W / 2, y: GATE_Y - 60 };
    else if (cam.mode === 'friend') target = marbles.find(m => m.n === cheer)?.body.position;
    else target = (rank.find(m => !m.done && !m.out) || order[order.length - 1] || rank[0]).body.position;
    cam.update(view, target, dt);

    drawRace(g, view, cam, track, marbles, { t, leader: rank[0]?.n, cheer, burns });
  }

  function resize() {
    view.dpr = Math.min(devicePixelRatio, 2);
    view.w = cv.clientWidth; view.h = cv.clientHeight;
    cv.width = view.w * view.dpr; cv.height = view.h * view.dpr;
  }
  addEventListener('resize', () => { if (screen.classList.contains('on')) resize(); });

  async function open() {
    screen.classList.add('on');
    preloadSprites();
    resize();
    ui.setSpeed(SPEEDS[speedAt]); ui.setCam(cam.mode);
    if (!M) {
      ui.showCount('준비 중… ⏳');
      try { M = await loadMatter(); } catch {
        ui.showCount('물리 엔진을 못 읽었어요 😢 인터넷을 확인해요');
        return;
      }
      ui.showCount('');
    }
    build();
    showSetup();
    cam.snap(view, { x: TRACK_W / 2, y: GATE_Y - 60 });
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function close() {
    screen.classList.remove('on');
    cancelAnimationFrame(raf);
    state = 'setup';
    opts.onClose?.();
  }

  return { open, close, get isOpen() { return screen.classList.contains('on'); },
           // 브라우저 콘솔에서 확인할 때 쓴다
           get debug() { return { state, marbles, order, outOrder, simTime, cam, ranking, track, seed }; },
           /** 콘솔에서 빨리 돌려 보기 — 물리 시간 sec초만큼 한꺼번에 */
           fastForward(sec) { for (let i = 0; i < sec * 60 && state !== 'done'; i++) stepSim(); },
           /** 콘솔에서 숫자 n을 따라가 보기 */
           follow(n) { cheer = n; cam.mode = 'friend'; ui.setCam(cam.mode); } };
}
