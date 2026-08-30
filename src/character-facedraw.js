// ===========================================================
//  얼굴 그리기 (Canvas 2D) — 인형(플러시) 느낌
//  ★ 참고 사진처럼 단순하고 부드럽게.
//    큰 눈 두 개 · 아주 작은 코 · 작게 다문 미소 · 은은한 볼터치.
//    인형은 굴곡이 거의 없으니 명암도 아주 옅게만 넣는다.
//
//  그림은 1024×1024. 512픽셀 = 1라디안이고, 눈높이가 기준선이다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 (그림 위의 픽셀)
// -----------------------------------------------------------
export const W = 1024, H = 1024, CX = 512;

const CY      = 588;   // 눈높이 (내릴수록 이마가 넓어진다)
const EYE_X   = 232;   // 두 눈 사이
const EYE_RX  = 126;   // 눈 가로 반지름
const EYE_RY  = 154;   // 눈 세로 반지름
const NOSE_Y  = 168;   // 눈높이에서 코까지
const MOUTH_Y = 236;   // 눈높이에서 입까지
const GEM_Y   = 274;   // 눈높이에서 이마 보석까지

const LINE   = '#243665';      // 눈 테두리·속눈썹 색
const SHADE  = '232,176,196';  // 얼굴 그늘 색 (아주 옅은 분홍)

// -----------------------------------------------------------
//  도우미
// -----------------------------------------------------------
function ell(ctx, x, y, rx, ry, rot, style) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = style;
  ctx.fill();
}
function hex(n, fallback) {
  return '#' + (n ?? fallback).toString(16).padStart(6, '0');
}
/** 부드럽게 번지는 동그란 빛/그늘 */
function glow(ctx, x, y, r, rgb, alpha) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.6, `rgba(${rgb},${alpha * 0.42})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// -----------------------------------------------------------
//  1) 아주 옅은 명암 (인형이라 굴곡이 거의 없다)
// -----------------------------------------------------------
function drawShading(ctx) {
  // 앞머리가 드리우는 이마 그늘
  let g = ctx.createLinearGradient(0, 100, 0, 380);
  g.addColorStop(0, `rgba(${SHADE},0.20)`);
  g.addColorStop(1, `rgba(${SHADE},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 380);

  // 턱 밑 그늘
  g = ctx.createLinearGradient(0, H, 0, H - 220);
  g.addColorStop(0, `rgba(${SHADE},0.22)`);
  g.addColorStop(1, `rgba(${SHADE},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, H - 220, W, 220);

  // 볼 도톰한 빛
  for (const s of [-1, 1]) glow(ctx, CX + s * 300, CY + 150, 220, '255,255,255', 0.18);
}

// -----------------------------------------------------------
//  2) 볼터치 (은은한 분홍)
// -----------------------------------------------------------
function drawCheeks(ctx, def) {
  const rgb = def.cheek ?? 0xff9fbb;
  const c = `${(rgb >> 16) & 255},${(rgb >> 8) & 255},${rgb & 255}`;
  for (const s of [-1, 1]) glow(ctx, CX + s * 306, CY + 132, 150, c, 0.55);
}

// -----------------------------------------------------------
//  3) 눈 한 쪽 — 단순하고 큰 눈
//     흰자 → 홍채(위 진하고 아래 밝게) → 동공 → 하이라이트 → 테두리 → 속눈썹
// -----------------------------------------------------------
function drawEye(ctx, s, def) {
  const iris = hex(def.eye, 0x2f6fc0);

  ctx.save();
  ctx.translate(CX + s * EYE_X, CY);
  ctx.scale(s, 1);            // 여기서부터 +x = 바깥쪽
  ctx.rotate(0.06);

  // 흰자
  ell(ctx, 0, 0, EYE_RX, EYE_RY, 0, '#ffffff');

  ctx.save();
  ctx.beginPath(); ctx.ellipse(0, 0, EYE_RX, EYE_RY, 0, 0, Math.PI * 2); ctx.clip();

  // 홍채 — 위는 진한 파랑, 아래로 갈수록 맑아진다
  const irx = EYE_RX * 0.84, iry = EYE_RY * 0.86;
  const g = ctx.createLinearGradient(0, -iry, 0, iry);
  g.addColorStop(0.00, '#1b3f86');
  g.addColorStop(0.34, iris);
  g.addColorStop(0.74, '#8cd3ef');
  g.addColorStop(1.00, '#e6faff');
  ell(ctx, 0, 12, irx, iry, 0, g);

  // 동공
  ell(ctx, 0, 16, irx * 0.42, iry * 0.48, 0, '#152343');

  // 하이라이트 두 개 (큰 것 안쪽 위, 작은 것 바깥 아래)
  ell(ctx, -irx * 0.33, -iry * 0.40, 40, 36, 0, '#ffffff');
  ell(ctx,  irx * 0.34,  iry * 0.40, 22, 19, 0, 'rgba(255,255,255,0.95)');
  ctx.restore();

  // 눈 테두리 — 위는 굵고 아래는 가늘게
  ctx.lineWidth = 13;
  ctx.strokeStyle = LINE;
  ctx.beginPath(); ctx.ellipse(0, 0, EYE_RX, EYE_RY, 0, 0, Math.PI * 2); ctx.stroke();

  // 윗 속눈썹 — 눈 위를 덮는 선 (바깥으로 갈수록 두꺼워진다)
  const N = 24, a0 = Math.PI * 1.02, a1 = Math.PI * 2.02;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = a0 + (a1 - a0) * (i / N);
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * EYE_RX, Math.sin(a) * EYE_RY);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    const a = a0 + (a1 - a0) * t;
    const w = 1 + 0.03 + 0.13 * t * t;
    ctx.lineTo(Math.cos(a) * EYE_RX * w, Math.sin(a) * EYE_RY * w);
  }
  ctx.closePath();
  ctx.fillStyle = LINE;
  ctx.fill();

  // 바깥쪽 속눈썹 두 가닥 (짧게)
  for (let i = 0; i < 2; i++) {
    const a = -0.22 - i * 0.32;
    const x0 = Math.cos(a) * EYE_RX * 1.10, y0 = Math.sin(a) * EYE_RY * 1.10;
    const len = 42 - i * 12, wid = 11 - i * 3;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - wid);
    ctx.quadraticCurveTo(x0 + len * 0.8, y0 - len * 0.26, x0 + len, y0 - len * 0.48);
    ctx.quadraticCurveTo(x0 + len * 0.5, y0 - len * 0.06, x0, y0 + wid);
    ctx.closePath();
    ctx.fillStyle = LINE;
    ctx.fill();
  }

  ctx.restore();
}

// -----------------------------------------------------------
//  4) 코 · 입 · 이마 보석
// -----------------------------------------------------------
function drawNose(ctx) {
  ctx.save();
  ctx.translate(CX, CY + NOSE_Y);
  ctx.beginPath();
  ctx.moveTo(-19, -8); ctx.quadraticCurveTo(-10, -22, 0, -10);
  ctx.quadraticCurveTo(10, -22, 19, -8);
  ctx.quadraticCurveTo(10, 16, 0, 24);
  ctx.quadraticCurveTo(-10, 16, -19, -8);
  ctx.fillStyle = '#f0a3b6';
  ctx.fill();
  ctx.restore();
}

/** 입 — 인형처럼 아주 작게 다문 미소 */
function drawMouth(ctx) {
  ctx.save();
  ctx.translate(CX, CY + MOUTH_Y);
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#c96b83';
  ctx.beginPath();
  ctx.moveTo(-34, -6);
  ctx.quadraticCurveTo(0, 22, 34, -6);
  ctx.stroke();
  ctx.restore();
}

function drawGem(ctx, def) {
  ctx.save();
  ctx.translate(CX, CY - GEM_Y);
  glow(ctx, 0, 4, 58, '150,230,255', 0.35);
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.quadraticCurveTo(32, -14, 32, 8);
  ctx.arc(0, 8, 32, 0, Math.PI);
  ctx.quadraticCurveTo(-32, -14, 0, -54);
  const g = ctx.createLinearGradient(0, -54, 0, 40);
  g.addColorStop(0, '#f2fdff');
  g.addColorStop(0.42, hex(def.gem, 0x6fd8e8));
  g.addColorStop(1, '#3f9fd0');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(196,140,180,0.75)';   // 사진처럼 분홍빛 테두리
  ctx.stroke();
  ell(ctx, -11, 2, 8, 12, -0.4, 'rgba(255,255,255,0.92)');
  ctx.restore();
}

// -----------------------------------------------------------
//  얼굴 전체 그리기
// -----------------------------------------------------------
export function paintFace(ctx, def) {
  drawShading(ctx);
  drawCheeks(ctx, def);
  drawGem(ctx, def);
  drawNose(ctx);
  drawMouth(ctx);
  for (const s of [-1, 1]) drawEye(ctx, s, def);
}
