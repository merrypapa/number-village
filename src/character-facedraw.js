// ===========================================================
//  얼굴 그리기 (Canvas 2D)
//  ★ 눈·코·입만 그리는 게 아니라 "명암"까지 같이 그린다.
//    그래야 동그란 구슬이 아니라 진짜 얼굴처럼 입체로 보인다.
//
//  그림은 1024×1024. 한가운데(512,512)가 얼굴 정중앙이고
//  512픽셀 = 1라디안이다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 (그림 위의 픽셀)
// -----------------------------------------------------------
export const W = 1024, H = 1024, CX = 512;

//  ↓ 눈높이가 얼굴의 기준선이다. 아기 얼굴은 눈이 한가운데쯤 와야 귀엽다.
const CY      = 596;   // 눈높이 (내릴수록 이마가 넓어진다)
const EYE_X   = 238;   // 두 눈 사이
const EYE_RX  = 127;   // 눈 가로 반지름
const EYE_RY  = 163;   // 눈 세로 반지름
const NOSE_Y  = 180;   // 눈높이에서 코까지
const MOUTH_Y = 300;   // 눈높이에서 입까지
const GEM_Y   = 272;   // 눈높이에서 이마 보석까지
const BROW_Y  = 232;   // 눈높이에서 눈썹까지

const LASH   = '#2a3866';   // 속눈썹 색
const SHADE  = '226,158,182';  // 얼굴 그늘 색(분홍빛 그림자)

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
  g.addColorStop(0.6, `rgba(${rgb},${alpha * 0.45})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// -----------------------------------------------------------
//  1) 얼굴 명암 — 이게 있어야 입체로 보인다
// -----------------------------------------------------------
function drawShading(ctx) {
  // 앞머리가 드리우는 이마 그늘 (머리카락이 덮이는 위쪽만 살짝)
  let g = ctx.createLinearGradient(0, 90, 0, 400);
  g.addColorStop(0, `rgba(${SHADE},0.34)`);
  g.addColorStop(1, `rgba(${SHADE},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 400);

  // 양옆(관자놀이~볼 옆) 그늘
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? 0 : W;
    g = ctx.createLinearGradient(x0, 0, CX + s * 300, 0);
    g.addColorStop(0, `rgba(${SHADE},0.26)`);
    g.addColorStop(1, `rgba(${SHADE},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(s < 0 ? 0 : CX + 300, 0, W / 2 - 300, H);
  }

  // 턱 밑 그늘
  g = ctx.createLinearGradient(0, H, 0, H - 260);
  g.addColorStop(0, `rgba(${SHADE},0.30)`);
  g.addColorStop(1, `rgba(${SHADE},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, H - 260, W, 260);

  // 이마 밝은 부분, 볼 도톰한 빛
  glow(ctx, CX, CY - 230, 250, '255,255,255', 0.30);
  for (const s of [-1, 1]) glow(ctx, CX + s * 262, CY + 120, 200, '255,255,255', 0.22);
}

// -----------------------------------------------------------
//  2) 볼터치 + 반짝이
// -----------------------------------------------------------
function drawCheeks(ctx, def) {
  const rgb = def.cheek ?? 0xff8fb0;
  const c = `${(rgb >> 16) & 255},${(rgb >> 8) & 255},${rgb & 255}`;
  for (const s of [-1, 1]) {
    const x = CX + s * 300, y = CY + 158;
    glow(ctx, x, y, 132, c, 0.62);
    // 반짝이 알갱이
    for (let i = 0; i < 7; i++) {
      const a = i * 2.1 + (s + 1);
      const r = 34 + (i % 3) * 30;
      ell(ctx, x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.75,
        3.4 - (i % 3) * 0.7, 3.4 - (i % 3) * 0.7, 0, 'rgba(255,255,255,0.85)');
    }
  }
}

// -----------------------------------------------------------
//  3) 눈 한 쪽 (안쪽이 -x가 되도록 좌우를 뒤집어 그린다)
// -----------------------------------------------------------
function drawEye(ctx, s, def) {
  const iris = hex(def.eye, 0x2a79cc);

  ctx.save();
  ctx.translate(CX + s * EYE_X, CY);
  ctx.scale(s, 1);
  ctx.rotate(0.05);

  // 눈두덩 그늘 (눈이 얼굴에 파묻힌 느낌)
  glow(ctx, 0, 0, EYE_RX * 1.45, SHADE, 0.20);

  // 흰자
  ell(ctx, 0, 0, EYE_RX, EYE_RY, 0, '#ffffff');

  ctx.save();
  ctx.beginPath(); ctx.ellipse(0, 0, EYE_RX, EYE_RY, 0, 0, Math.PI * 2); ctx.clip();
  // 윗눈꺼풀이 눈알에 드리우는 그림자
  let g = ctx.createLinearGradient(0, -EYE_RY, 0, -EYE_RY * 0.1);
  g.addColorStop(0, 'rgba(120,140,180,0.55)');
  g.addColorStop(1, 'rgba(120,140,180,0)');
  ctx.fillStyle = g; ctx.fillRect(-EYE_RX, -EYE_RY, EYE_RX * 2, EYE_RY);

  // 홍채
  const irx = EYE_RX * 0.88, iry = EYE_RY * 0.89;
  g = ctx.createLinearGradient(0, -iry, 0, iry);
  g.addColorStop(0.00, '#0f2f63');
  g.addColorStop(0.28, iris);
  g.addColorStop(0.68, '#6ecdf2');
  g.addColorStop(1.00, '#e2fbff');
  ell(ctx, 0, 10, irx, iry, 0, g);

  // 홍채 속 결 (가는 빛살) — 눈동자가 살아 보인다
  ctx.save();
  ctx.beginPath(); ctx.ellipse(0, 10, irx, iry, 0, 0, Math.PI * 2); ctx.clip();
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.16)' : 'rgba(10,40,90,0.15)';
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * irx * 0.30, 10 + Math.sin(a) * iry * 0.30);
    ctx.lineTo(Math.cos(a) * irx * 0.98, 10 + Math.sin(a) * iry * 0.98);
    ctx.stroke();
  }
  ctx.restore();

  // 아래쪽 밝은 초승달 (빛이 통과한 느낌)
  ell(ctx, 0, 10 + iry * 0.46, irx * 0.72, iry * 0.30, 0, 'rgba(214,250,255,0.75)');

  // 홍채 테두리 (위가 더 진하다)
  ctx.lineWidth = 17;
  g = ctx.createLinearGradient(0, -iry, 0, iry);
  g.addColorStop(0, 'rgba(8,26,64,0.95)');
  g.addColorStop(1, 'rgba(20,80,140,0.55)');
  ctx.strokeStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 10, irx, iry, 0, 0, Math.PI * 2); ctx.stroke();

  // 동공 + 아래쪽 파란 번짐
  ell(ctx, 0, 22, irx * 0.46, iry * 0.54, 0, '#0b1c3d');
  glow(ctx, 0, 22 + iry * 0.30, irx * 0.55, '90,190,240', 0.5);

  // 하이라이트 — 큰 것(안쪽 위) · 작은 것(바깥 아래) · 작은 별빛
  glow(ctx, -irx * 0.34, -iry * 0.44, 54, '255,255,255', 0.95);
  ell(ctx, -irx * 0.34, -iry * 0.44, 33, 29, 0, '#ffffff');
  ell(ctx, irx * 0.36, iry * 0.42, 21, 18, 0, 'rgba(255,255,255,0.95)');
  ell(ctx, irx * 0.04, -iry * 0.05, 11, 10, 0, 'rgba(255,255,255,0.8)');
  ell(ctx, -irx * 0.58, iry * 0.20, 8, 7, 0, 'rgba(255,255,255,0.7)');
  ctx.restore();   // 흰자 클립 끝

  // 눈 전체를 감싸는 옅은 윤곽선
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(120,150,190,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, EYE_RX, EYE_RY, 0, 0, Math.PI * 2); ctx.stroke();

  drawLashes(ctx);
  ctx.restore();
}

/** 속눈썹 — 안쪽은 얇고 바깥쪽은 두꺼운 선 + 뻗은 가닥들 */
function drawLashes(ctx) {
  const N = 26;
  const a0 = Math.PI * 1.00, a1 = Math.PI * 2.06;   // 위쪽을 따라
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {                     // 안쪽 가장자리
    const a = a0 + (a1 - a0) * (i / N);
    const p = i === 0 ? 'moveTo' : 'lineTo';
    ctx[p](Math.cos(a) * EYE_RX, Math.sin(a) * EYE_RY);
  }
  for (let i = N; i >= 0; i--) {                     // 바깥 가장자리 (두께가 변한다)
    const t = i / N;
    const a = a0 + (a1 - a0) * t;
    const w = 1 + 0.035 + 0.16 * t * t;
    ctx.lineTo(Math.cos(a) * EYE_RX * w, Math.sin(a) * EYE_RY * w);
  }
  ctx.closePath();
  ctx.fillStyle = LASH;
  ctx.fill();

  // 바깥으로 뻗은 가닥 3개
  for (let i = 0; i < 2; i++) {
    const a = -0.16 - i * 0.30;
    const x0 = Math.cos(a) * EYE_RX * 1.10, y0 = Math.sin(a) * EYE_RY * 1.10;
    const len = 46 - i * 11, wid = 12 - i * 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - wid);
    ctx.quadraticCurveTo(x0 + len * 0.8, y0 - len * 0.32, x0 + len, y0 - len * 0.55);
    ctx.quadraticCurveTo(x0 + len * 0.55, y0 - len * 0.12, x0, y0 + wid);
    ctx.closePath();
    ctx.fillStyle = LASH;
    ctx.fill();
  }

  // 아래 속눈썹 3개
  for (let i = 0; i < 2; i++) {
    const a = 0.34 + i * 0.28;
    const x0 = Math.cos(a) * EYE_RX, y0 = Math.sin(a) * EYE_RY;
    ctx.beginPath();
    ctx.moveTo(x0 * 0.99, y0 * 0.99 - 5);
    ctx.lineTo(x0 * 1.20, y0 * 1.20);
    ctx.lineTo(x0 * 0.99, y0 * 0.99 + 5);
    ctx.closePath();
    ctx.fillStyle = LASH;
    ctx.fill();
  }
}

/** 눈썹 — 짧고 얇은 하늘색, 끝이 가늘어진다 */
function drawBrow(ctx, s, def) {
  ctx.save();
  ctx.translate(CX + s * EYE_X, CY - BROW_Y);
  ctx.scale(s, 1);
  ctx.beginPath();
  ctx.moveTo(-62, 16);
  ctx.quadraticCurveTo(10, -26, 100, 2);
  ctx.quadraticCurveTo(14, -6, -58, 27);
  ctx.closePath();
  ctx.fillStyle = hex(def.hair, 0xa8e0f5);
  ctx.fill();
  ctx.restore();
}

// -----------------------------------------------------------
//  4) 코 · 입 · 이마 보석
// -----------------------------------------------------------
function drawNose(ctx) {
  ctx.save();
  ctx.translate(CX, CY + NOSE_Y);
  glow(ctx, 0, 14, 34, SHADE, 0.5);
  ctx.beginPath();
  ctx.moveTo(-18, -8); ctx.quadraticCurveTo(-9, -21, 0, -9);
  ctx.quadraticCurveTo(9, -21, 18, -8);
  ctx.quadraticCurveTo(9, 15, 0, 22);
  ctx.quadraticCurveTo(-9, 15, -18, -8);
  ctx.fillStyle = '#ef9db1';
  ctx.fill();
  ctx.restore();
}

function drawMouth(ctx) {
  ctx.save();
  ctx.translate(CX, CY + MOUTH_Y);

  ctx.beginPath();
  ctx.moveTo(-124, -34);
  ctx.quadraticCurveTo(0, -60, 124, -34);
  ctx.quadraticCurveTo(88, 92, 0, 92);
  ctx.quadraticCurveTo(-88, 92, -124, -34);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -30, 0, 78);
  g.addColorStop(0, '#6d1526');
  g.addColorStop(0.55, '#94243a');
  g.addColorStop(1, '#b83549');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(92,16,32,0.85)';
  ctx.stroke();

  ctx.save();
  ctx.clip();
  // 윗니 (가운데가 살짝 갈라진 하얀 띠)
  ctx.beginPath();
  ctx.moveTo(-122, -36);
  ctx.quadraticCurveTo(0, -62, 122, -36);
  ctx.lineTo(122, -6);
  ctx.quadraticCurveTo(64, -18, 10, -15);
  ctx.lineTo(0, -1); ctx.lineTo(-10, -15);
  ctx.quadraticCurveTo(-64, -18, -122, -6);
  ctx.closePath();
  ctx.fillStyle = '#fff8fa';
  ctx.fill();
  // 혀
  ell(ctx, 0, 66, 64, 32, 0, '#e0596f');
  ell(ctx, -17, 56, 21, 10, -0.3, 'rgba(255,255,255,0.35)');
  ctx.restore();
  ctx.restore();
}

function drawGem(ctx, def) {
  ctx.save();
  ctx.translate(CX, CY - GEM_Y);
  glow(ctx, 0, 4, 62, '150,230,255', 0.45);
  ctx.beginPath();
  ctx.moveTo(0, -56);
  ctx.quadraticCurveTo(33, -14, 33, 8);
  ctx.arc(0, 8, 33, 0, Math.PI);
  ctx.quadraticCurveTo(-33, -14, 0, -56);
  const g = ctx.createLinearGradient(0, -56, 0, 42);
  g.addColorStop(0, '#f2fdff');
  g.addColorStop(0.42, hex(def.gem, 0x6fd8e8));
  g.addColorStop(1, '#2b93c6');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(40,120,170,0.55)';
  ctx.stroke();
  ell(ctx, -12, 2, 9, 13, -0.4, 'rgba(255,255,255,0.92)');
  ell(ctx, 11, 16, 5, 7, -0.4, 'rgba(255,255,255,0.6)');
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
  for (const s of [-1, 1]) drawBrow(ctx, s, def);
}
