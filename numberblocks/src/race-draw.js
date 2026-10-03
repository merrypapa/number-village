// ===========================================================
//  🏁 숫자 구슬 레이스 — 그리기 (2D 캔버스) · 카메라
//  카메라 모드 —
//    'leader'   : 🥇 1등 구슬을 부드럽게 따라간다
//    'overview' : 🗺 코스 전체를 한 화면에
//    'friend'   : ⭐ 내가 응원하는 친구를 따라간다
// ===========================================================
import { TRACK_W } from './race-track.js';
import { MARBLE_R, marbleSprite, colorOf } from './race-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const COLORS = {
  wall: '#5b4b8a', floor: '#5b4b8a', gate: '#ff9f1c', peg: '#ffc300',
  spinner: '#ff5a5f', seesaw: '#1fb5e8', vortex: '#7b5cff',
  boost: 'rgba(52,199,89,0.55)', slow: 'rgba(175,82,222,0.45)', lava: '#ff4d00',
};
const BG = ['#c9ecff', '#e9f7ff', '#fff0f7'];   // 코스 배경 (위 → 아래)
const FOLLOW_VIEW = 480;     // 따라가기 모드에서 화면에 보이는 코스 높이 (작을수록 크게 — 구슬 속 친구가 잘 보이게)
const CAM_SMOOTH  = 4;       // 카메라가 따라가는 빠르기
const BOARD_PX    = 200;     // 오른쪽 순위표 너비 — 자리가 남으면 코스를 왼쪽으로 비켜 준다
const MIN_ZOOM    = 0.95;    // 휴대폰 세로 화면에서도 이만큼은 크게 (그땐 옆으로도 따라간다)
const FONT = '"Apple SD Gothic Neo","Malgun Gothic",sans-serif';

export function createCamera() {
  const cam = { x: TRACK_W / 2, y: 120, scale: 0.5, mode: 'leader', H: 4000 };   // H = 코스 높이 (코스마다 다르다)

  /** view = { w, h } 화면 크기, target = 따라갈 구슬 위치 (없으면 그대로) */
  cam.update = (view, target, dt) => {
    let s, cy, cx = null;
    if (cam.mode === 'overview') {
      s = Math.min(view.w / (TRACK_W + 40), view.h / (cam.H + 340));
      cy = (cam.H - 300) / 2;
    } else {
      const fit = view.h / FOLLOW_VIEW;
      s = Math.max(Math.min(view.w / (TRACK_W + 40), fit), Math.min(MIN_ZOOM, fit));
      const half = view.h / 2 / s;
      cy = target ? target.y + half * 0.25 : cam.y;
      cy = Math.max(-260 + half, Math.min(cam.H + 20 - half, cy));
      // 코스가 화면보다 넓으면 옆으로도 따라간다
      const halfW = view.w / 2 / s;
      if (halfW * 2 < TRACK_W + 40) cx = Math.max(halfW - 20, Math.min(TRACK_W + 20 - halfW, target?.x ?? TRACK_W / 2));
    }
    const k = 1 - Math.exp(-dt * CAM_SMOOTH);
    cam.scale += (s - cam.scale) * k;
    cam.y += (cy - cam.y) * k;
    if (cx === null) {                                     // 코스가 다 보이면 가운데 (순위표 자리만큼 왼쪽으로)
      const room = view.w - TRACK_W * cam.scale;
      cx = TRACK_W / 2 + Math.max(0, Math.min(room / 2, BOARD_PX / 2)) / cam.scale;
    }
    cam.x += (cx - cam.x) * k;
  };
  cam.snap = (view, target) => { cam.update(view, target, 99); };
  return cam;
}

/**
 * 한 장면 그리기
 *   g: 2D 컨텍스트, view: { w, h, dpr }, track: race-track.js 결과
 *   marbles: [{ n, body, done }], info: { t, leader, cheer }
 */
export function drawRace(g, view, cam, track, marbles, info) {
  const { w, h, dpr } = view, s = cam.scale;
  const H = track.H, FINISH_Y = track.finishY;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#2b2350';
  g.fillRect(0, 0, w, h);

  // 코스 좌표로 옮긴다
  g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (w / 2 - cam.x * s), dpr * (h / 2 - cam.y * s));
  const top = cam.y - h / 2 / s - 40, bottom = cam.y + h / 2 / s + 40;

  // 배경
  const bg = g.createLinearGradient(0, -300, 0, H);
  BG.forEach((c, i) => bg.addColorStop(i / (BG.length - 1), c));
  g.fillStyle = bg;
  g.fillRect(0, -300, TRACK_W, H + 300);

  // 구간 이름
  g.font = `900 30px ${FONT}`;
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(60,40,110,0.35)';
  for (const z of track.zones) if (z.y > top && z.y < bottom) g.fillText(z.text, 24, z.y);

  // 🌪 소용돌이 방 바닥 — 빙글빙글 도는 줄무늬
  for (const VORTEX of track.vortexes) {
    if (VORTEX.y + VORTEX.r < top || VORTEX.y - VORTEX.r > bottom) continue;
    g.save();
    g.translate(VORTEX.x, VORTEX.y);
    g.fillStyle = 'rgba(123,92,255,0.12)';
    g.beginPath(); g.arc(0, 0, VORTEX.r, 0, Math.PI * 2); g.fill();
    g.rotate(info.t * 2.2 * Math.sign(VORTEX.swirl));
    g.strokeStyle = 'rgba(123,92,255,0.25)'; g.lineWidth = 8; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      g.rotate(Math.PI * 2 / 5);
      g.beginPath(); g.arc(0, 0, VORTEX.r * (0.35 + i * 0.1), 0, 1.4); g.stroke();
    }
    g.restore();
  }

  // 🏁 결승선 — 체크무늬
  if (FINISH_Y > top && FINISH_Y < bottom) {
    const sq = 24;
    for (let x = 0; x < TRACK_W; x += sq) for (let r = 0; r < 2; r++) {
      g.fillStyle = ((x / sq + r) % 2) ? '#222' : '#fff';
      g.fillRect(x, FINISH_Y - sq + r * sq, Math.min(sq, TRACK_W - x), sq);
    }
  }

  // 벽 · 못 · 바람개비 · 시소 · 패드
  for (const b of track.bodies) {
    if (b.plugin.hidden || b.bounds.max.y < top || b.bounds.min.y > bottom) continue;
    if (b.label === 'finish') continue;
    g.fillStyle = COLORS[b.label] || COLORS.wall;
    for (const p of (b.parts.length > 1 ? b.parts.slice(1) : [b])) shape(g, p);
    if (b.label === 'boost' || b.label === 'slow') padMark(g, b, info.t);
    if (b.label === 'lava') lavaMark(g, b, info.t);
  }
  // 바람개비 가운데 · 시소 받침 핀
  g.fillStyle = '#fff';
  for (const sp of track.spinners) dot(g, sp.body.position.x, sp.body.position.y, 7);
  for (const ss of track.seesaws) dot(g, ss.x, ss.y, 6);

  // 구슬
  const R = MARBLE_R;
  for (const m of marbles) {
    if (m.out) continue;
    const { x, y } = m.body.position;
    if (y < top || y > bottom) continue;
    if (m.n === info.cheer) {                       // ⭐ 응원하는 친구는 반짝 테두리
      g.strokeStyle = `rgba(255,214,10,${0.6 + 0.4 * Math.sin(info.t * 8)})`;
      g.lineWidth = 5;
      g.beginPath(); g.arc(x, y, R + 6, 0, Math.PI * 2); g.stroke();
    }
    g.drawImage(marbleSprite(m.n), x - R, y - R, R * 2, R * 2);
  }
  // 1등 왕관 · 응원 별 (구슬 위에)
  g.font = `24px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
  for (const m of marbles) {
    if (m.out) continue;
    const { x, y } = m.body.position;
    if (m.n === info.leader) g.fillText('👑', x, y - R - 2);
    else if (m.n === info.cheer) g.fillText('⭐', x, y - R - 2);
  }

  // 🔥 용암에 빠진 자리 · 💨 점프한 자리 — 솟았다 사라진다
  g.textBaseline = 'middle';
  for (const b of info.burns || []) {
    g.globalAlpha = Math.max(0, 1 - b.age / 1.5);
    g.font = `${30 + b.age * 30}px ${FONT}`;
    g.fillText(b.emoji || '🔥', b.x, b.y - b.age * 70);
  }
  g.globalAlpha = 1;

  // 화면 왼쪽 — 모두가 코스 어디쯤인지 보여주는 막대 (따라가기 모드일 때)
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (cam.mode !== 'overview') miniBar(g, h, marbles, info, H, FINISH_Y);
}

function shape(g, p) {
  if (p.circleRadius) { dot(g, p.position.x, p.position.y, p.circleRadius); return; }
  const v = p.vertices;
  g.beginPath();
  g.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) g.lineTo(v[i].x, v[i].y);
  g.closePath(); g.fill();
}
function dot(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }

// 가속 패드는 ▶▶▶ 가 흐르고, 감속 패드는 물결 ≈
function padMark(g, b, t) {
  const d = b.plugin.dir;
  g.save();
  g.translate(b.position.x, b.position.y);
  g.rotate(Math.atan2(d.y, d.x));
  g.fillStyle = '#fff'; g.font = `900 20px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const len = b.plugin.len;
  if (b.label === 'boost') {
    const shift = (t * 60) % 40;
    for (let x = -len / 2 + shift; x < len / 2 - 10; x += 40) g.fillText('▶', x, 1);
  } else {
    for (let x = -len / 2 + 20; x < len / 2 - 10; x += 34) g.fillText('≈', x, 1);
  }
  g.restore();
}

// 🌋 용암 — 부글부글 끓는 거품
function lavaMark(g, b, t) {
  const { min, max } = b.bounds, w = max.x - min.x;
  g.fillStyle = '#ffb300';
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.8 + i * 0.37 + b.id * 0.13) % 1;
    g.globalAlpha = 1 - ph;
    dot(g, min.x + w * ((i * 0.27 + b.id * 0.11) % 1), max.y - ph * (max.y - min.y + 10), 4 + ph * 4);
  }
  g.globalAlpha = 1;
}

function miniBar(g, h, marbles, info, H, FINISH_Y) {
  const x = 14, y0 = 70, y1 = h - 24;
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.fillRect(x - 3, y0, 6, y1 - y0);
  g.fillStyle = '#222';
  g.fillRect(x - 8, y0 + (y1 - y0) * (FINISH_Y / H) - 2, 16, 4);    // 결승선 표시
  for (const m of marbles) {
    if (m.out) continue;
    const f = Math.max(0, Math.min(1, m.body.position.y / H));
    g.fillStyle = colorOf(m.n);
    const big = m.n === info.cheer || m.n === info.leader;
    dot(g, x, y0 + (y1 - y0) * f, big ? 7 : 4);
  }
}
