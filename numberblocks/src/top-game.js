// ===========================================================
//  🪀 달님과 팽이치기 — 손가락으로 슥슥 그으면 줄로 팽이를 쳐서 돌린다
//  '팽이 돌리기!'를 누르면 두 팽이가 돌기 시작한다.
//  화면을 빠르게 그을수록 내 팽이가 힘을 받고, 달님 팽이는 혼자 친다.
//  먼저 멈추는 쪽이 진다.
//
//  화면 위: 2D 캔버스에 그린다 (3D 아님). 아이패드 손가락에 맞춰 만들었다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const START_SPEED = 0.6;     // 처음 도는 힘 (0~1.4)
const MAX_SPEED   = 1.4;
const DECAY       = 0.085;   // 1초에 줄어드는 힘 — 크면 금방 멈춘다
const WHIP_GAIN   = 0.00075; // 손가락 1px 당 받는 힘 — 크면 조금만 그어도 세게 돈다
const WHIP_CAP    = 0.07;    // 한 번 움직임에 최대로 받는 힘
const MOON_EVERY  = [0.8, 1.5]; // 달님이 팽이를 치는 간격 (초) [빠르면, 느리면]
const MOON_POWER  = [0.05, 0.10]; // 달님이 한 번에 주는 힘 (줄어드는 힘보다 조금 약해서 30초쯤이면 멈춘다)
const MAX_TIME    = 45;      // 이 시간이 지나면 더 빠른 쪽이 이긴다 (초)
const MY_COLORS   = ['#ffffff', '#e8412c'];   // 내 팽이 (100 = 하양·빨강)
const MOON_COLORS = ['#fff3b0', '#5e4b9c'];   // 달님 팽이 (달빛·남색)

export function createTopGame(onEnd) {
  const screen  = document.getElementById('top');
  const cv      = document.getElementById('topCanvas');
  const startBt = document.getElementById('topStart');
  const msg     = document.getElementById('topMsg');
  const result  = document.getElementById('topResult');
  const g = cv.getContext('2d');

  let state = 'idle';            // idle → spin → done
  let me, moon, t = 0, moonTimer = 0;
  const strokes = [];            // 줄 자국 { pts:[{x,y}], age }
  const sparks = [];             // 찰싹 불꽃 { x, y, vx, vy, age }
  let stroke = null, lastPt = null, lastTime = 0;
  let W = 0, H = 0, raf = 0;

  function resize() {
    const r = Math.min(devicePixelRatio, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * r; cv.height = H * r;
    g.setTransform(r, 0, 0, r, 0, 0);
  }

  function newTop(x, colors) { return { x, y: 0, speed: 0, angle: 0, fallen: 0, colors }; }

  function start() {
    resize();
    me = newTop(W * 0.28, MY_COLORS); moon = newTop(W * 0.72, MOON_COLORS);
    me.speed = moon.speed = START_SPEED;
    t = 0; moonTimer = 1.2; strokes.length = 0; sparks.length = 0;
    state = 'spin';
    startBt.style.display = 'none';
    result.classList.remove('on');
    msg.textContent = '손가락으로 슥슥 그어서 내 팽이를 쳐요! 🌀';
  }

  // --- 손가락으로 줄 치기 ---
  cv.addEventListener('pointerdown', e => {
    if (state !== 'spin') return;
    cv.setPointerCapture(e.pointerId);
    stroke = { pts: [{ x: e.clientX, y: e.clientY }], age: 0 };
    strokes.push(stroke);
    lastPt = stroke.pts[0]; lastTime = performance.now();
  });
  cv.addEventListener('pointermove', e => {
    if (!stroke || state !== 'spin') return;
    const p = { x: e.clientX, y: e.clientY };
    const d = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
    if (d < 4) return;
    stroke.pts.push(p); if (stroke.pts.length > 40) stroke.pts.shift();
    const gain = Math.min(WHIP_CAP, d * WHIP_GAIN);
    me.speed = Math.min(MAX_SPEED, me.speed + gain);
    if (gain > 0.02) burst(me.x, me.y, 4);        // 세게 치면 불꽃이 튄다
    lastPt = p; lastTime = performance.now();
  });
  const endStroke = () => { stroke = null; };
  cv.addEventListener('pointerup', endStroke);
  cv.addEventListener('pointercancel', endStroke);

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, age: 0 });
    }
  }

  // --- 매 프레임 ---
  function step(dt) {
    t += dt;
    if (!me) return;                         // 아직 '팽이 돌리기!'를 안 눌렀다
    if (state === 'spin') {
      me.speed = Math.max(0, me.speed - DECAY * dt);
      moon.speed = Math.max(0, moon.speed - DECAY * dt);
      moonTimer -= dt;
      if (moonTimer <= 0) {                    // 달님이 팽이를 친다
        moonTimer = MOON_EVERY[0] + Math.random() * (MOON_EVERY[1] - MOON_EVERY[0]);
        moon.speed = Math.min(MAX_SPEED, moon.speed + MOON_POWER[0] + Math.random() * (MOON_POWER[1] - MOON_POWER[0]));
        strokes.push({ pts: [{ x: moon.x + 90, y: moon.y - 140 }, { x: moon.x + 20, y: moon.y - 40 }, { x: moon.x - 60, y: moon.y + 10 }], age: 0 });
        burst(moon.x, moon.y, 4);
      }
      const meOut = me.speed <= 0, moonOut = moon.speed <= 0;
      if (meOut || moonOut || t > MAX_TIME) finish(meOut ? false : moonOut ? true : me.speed >= moon.speed);
    }
    for (const top of [me, moon]) {
      top.y = H * 0.56;
      top.angle += top.speed * 22 * dt;
      if (top.speed <= 0) top.fallen = Math.min(1, top.fallen + dt * 2);
    }
    for (const s of strokes) s.age += dt;
    for (let i = strokes.length - 1; i >= 0; i--) if (strokes[i].age > 0.6 && strokes[i] !== stroke) strokes.splice(i, 1);
    for (const p of sparks) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].age > 0.5) sparks.splice(i, 1);
  }

  function finish(won) {
    state = 'done';
    msg.textContent = won ? '이겼다! 🎉 달님 팽이가 먼저 멈췄어요' : '달님 팽이가 더 오래 돌았어요…';
    result.querySelector('.rtitle').textContent = won ? '🏆 숫자 100 승리!' : '🌙 달님 승리';
    result.querySelector('.rsub').textContent = won ? '마을이 환하게 밝아져요!' : '한 번 더 해볼까요?';
    document.getElementById('topAgain').style.display = won ? 'none' : '';
    result.classList.add('on');
    result.dataset.won = won ? '1' : '0';
  }

  // --- 그리기 ---
  function drawTop(top) {
    const R = Math.min(W, H) * 0.13;
    const wob = (1 - Math.min(1, top.speed)) * 0.35 * Math.sin(t * 24) + top.fallen * 1.2;
    g.save();
    g.translate(top.x, top.y);
    // 그림자
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath(); g.ellipse(0, R * 1.05, R * 0.9, R * 0.25, 0, 0, Math.PI * 2); g.fill();
    g.rotate(wob);
    // 몸통 — 색 조각이 돌아간다
    const seg = 8;
    for (let i = 0; i < seg; i++) {
      g.fillStyle = top.colors[i % 2];
      g.beginPath(); g.moveTo(0, 0);
      g.arc(0, 0, R, top.angle + i / seg * Math.PI * 2, top.angle + (i + 1) / seg * Math.PI * 2);
      g.closePath(); g.fill();
    }
    g.strokeStyle = '#4a3663'; g.lineWidth = 5;
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
    // 아래 뾰족한 끝 · 위 손잡이
    g.fillStyle = '#4a3663';
    g.beginPath(); g.moveTo(-R * 0.55, R * 0.45); g.lineTo(R * 0.55, R * 0.45); g.lineTo(0, R * 1.05); g.closePath(); g.fill();
    g.fillRect(-R * 0.1, -R * 1.35, R * 0.2, R * 0.5);
    g.restore();
    // 힘 게이지
    const bw = R * 2.4, bx = top.x - bw / 2, by = top.y - R * 1.9;
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(bx, by, bw, 14);
    g.fillStyle = top === me ? '#e8412c' : '#5e4b9c';
    g.fillRect(bx, by, bw * Math.min(1, top.speed / MAX_SPEED), 14);
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    // 이름표
    g.font = 'bold 22px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    g.textAlign = 'center'; g.fillStyle = '#5b3d8f';
    if (me) { g.fillText('나 (100)', me.x, me.y - Math.min(W, H) * 0.13 * 2.1); g.fillText('달님', moon.x, moon.y - Math.min(W, H) * 0.13 * 2.1); }
    if (me) { drawTop(me); drawTop(moon); }
    // 줄 자국 — 하얀 줄이 스르륵 사라진다
    for (const s of strokes) {
      const a = Math.max(0, 1 - s.age / 0.6);
      g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
      g.shadowColor = 'rgba(255,220,120,0.9)'; g.shadowBlur = 16;
      g.beginPath();
      s.pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
      g.stroke();
      g.shadowBlur = 0;
      g.strokeStyle = `rgba(212,160,90,${a})`; g.lineWidth = 4; g.stroke();
    }
    // 불꽃
    for (const p of sparks) {
      g.fillStyle = `rgba(255,${200 + Math.floor(55 * (1 - p.age))},80,${1 - p.age * 2})`;
      g.beginPath(); g.arc(p.x, p.y, 5, 0, Math.PI * 2); g.fill();
    }
  }

  let last = 0;
  function loop(now) {
    if (!screen.classList.contains('on')) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    step(dt); draw();
  }

  startBt.onclick = start;
  document.getElementById('topAgain').onclick = start;
  document.getElementById('topDone').onclick = () => { close(); onEnd(result.dataset.won === '1'); };
  document.getElementById('topClose').onclick = () => { close(); onEnd(false); };
  addEventListener('resize', () => { if (screen.classList.contains('on')) resize(); });

  function open() {
    screen.classList.add('on');
    state = 'idle'; me = null; moon = null;
    startBt.style.display = '';
    result.classList.remove('on');
    msg.textContent = '달님: 팽이치기로 겨루자! 준비되면 버튼을 눌러 🌙';
    resize();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  function close() { screen.classList.remove('on'); cancelAnimationFrame(raf); }

  return { open, get isOpen() { return screen.classList.contains('on'); } };
}
