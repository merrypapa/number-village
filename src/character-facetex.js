// ===========================================================
//  요정 얼굴을 "그림"으로 그린다
//  구를 겹쳐서 만든 눈은 아무리 다듬어도 애니 눈처럼 안 생긴다.
//  그래서 Canvas에 직접 그린 뒤 머리 곡면에 붙인다. (그림 파일 다운로드 없음)
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const W = 1024, H = 640;          // 그림판 크기
const EYE_X = 226;                // 두 눈 사이 거리
const EYE_Y = 320;                // 눈 높이
const EYE_W = 136, EYE_H = 176;   // 눈 크기 (키우면 왕눈이가 된다)
const LINE = '#3a2b52';           // 눈매 · 입 선 색

function mix(c, target, t) {
  const a = new THREE.Color(c);
  return '#' + a.lerp(new THREE.Color(target), t).getHexString();
}

// -----------------------------------------------------------
//  눈 모양 (아몬드형) — 바깥쪽 끝이 살짝 올라간 애니 눈
//  s = -1이면 왼쪽 눈, +1이면 오른쪽 눈 (바깥쪽 방향)
// -----------------------------------------------------------
function eyePath(g, w, h, s, closed = true) {
  g.beginPath();
  g.moveTo(-s * w, h * 0.06);                                     // 안쪽 눈꼬리
  g.bezierCurveTo(-s * w * 0.82, -h * 0.72, -s * w * 0.18, -h, s * w * 0.16, -h * 0.97);
  g.bezierCurveTo(s * w * 0.72, -h * 0.88, s * w, -h * 0.52, s * w, -h * 0.14); // 바깥쪽 눈꼬리
  if (!closed) return;                                            // 윗눈꺼풀만 필요할 때
  g.bezierCurveTo(s * w * 0.92, h * 0.58, s * w * 0.42, h, 0, h);
  g.bezierCurveTo(-s * w * 0.56, h, -s * w * 0.96, h * 0.56, -s * w, h * 0.06);
  g.closePath();
}

function drawEye(g, cx, cy, s, eyeColor) {
  const w = EYE_W, h = EYE_H, K = w / 136;
  const dark = mix(eyeColor, 0x120a22, 0.55);
  const light = mix(eyeColor, 0xffffff, 0.55);

  g.save();
  g.translate(cx, cy);

  // 흰자
  eyePath(g, w, h, s);
  g.fillStyle = '#fdfdff';
  g.fill();

  // 홍채 — 눈 모양 안쪽으로만 그린다 (밖으로 삐져나오지 않게)
  g.save();
  eyePath(g, w, h, s);
  g.clip();

  const ir = w * 0.80, iy = h * 0.14;
  const grad = g.createRadialGradient(0, iy + ir * 0.42, ir * 0.12, 0, iy, ir * 1.05);
  grad.addColorStop(0, light);
  grad.addColorStop(0.5, '#' + new THREE.Color(eyeColor).getHexString());
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(0, iy, ir, ir * 1.08, 0, 0, Math.PI * 2);
  g.fill();

  // 윗눈꺼풀 그림자 — 홍채 안쪽에만 둥글게 (흰자까지 덮으면 눈이 탁해진다)
  g.save();
  g.beginPath();
  g.ellipse(0, iy, ir, ir * 1.08, 0, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = mix(eyeColor, 0x140b26, 0.62) + 'cc';
  g.beginPath();
  g.ellipse(0, iy - ir * 0.98, ir * 1.15, ir * 0.78, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 홍채 아래쪽 밝은 반사 — 은은하게
  const low = g.createRadialGradient(0, iy + ir * 0.62, 2, 0, iy + ir * 0.62, ir * 0.62);
  low.addColorStop(0, 'rgba(255,255,255,0.50)');
  low.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = low;
  g.beginPath();
  g.ellipse(0, iy + ir * 0.62, ir * 0.62, ir * 0.34, 0, 0, Math.PI * 2);
  g.fill();

  // 동공
  g.fillStyle = LINE;
  g.beginPath();
  g.ellipse(0, iy, ir * 0.36, ir * 0.48, 0, 0, Math.PI * 2);
  g.fill();

  // 캐치라이트 — 큰 것 하나, 작은 것 하나
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.ellipse(-s * ir * 0.36, iy - ir * 0.48, ir * 0.28, ir * 0.24, -s * 0.4, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(s * ir * 0.38, iy + ir * 0.44, ir * 0.14, ir * 0.12, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 눈매 테두리
  eyePath(g, w, h, s);
  g.strokeStyle = LINE;
  g.lineWidth = 13 * K;
  g.lineJoin = 'round';
  g.stroke();

  // 윗눈꺼풀 (두껍게) — 눈 윤곽과 똑같은 곡선이라 어긋나지 않는다
  eyePath(g, w, h, s, false);
  g.lineWidth = 30 * K;
  g.lineCap = 'round';
  g.stroke();

  // 바깥쪽 속눈썹 — 눈꼬리에서 그대로 이어진다
  g.beginPath();
  g.moveTo(s * w, -h * 0.14);
  g.quadraticCurveTo(s * w * 1.26, -h * 0.56, s * w * 1.44, -h * 0.92);
  g.lineWidth = 20 * K;
  g.stroke();

  // 아래 눈꺼풀 — 바깥쪽에만 얇게
  g.beginPath();
  g.moveTo(s * w * 0.30, h * 0.93);
  g.quadraticCurveTo(s * w * 0.86, h * 0.72, s * w * 0.99, h * 0.18);
  g.lineWidth = 9 * K;
  g.stroke();

  // 눈썹
  g.beginPath();
  g.moveTo(-s * w * 0.66, -h - 46 * K);
  g.quadraticCurveTo(s * w * 0.06, -h - 78 * K, s * w * 0.82, -h - 40 * K);
  g.lineWidth = 12 * K;
  g.stroke();

  g.restore();
}

// -----------------------------------------------------------
//  얼굴 전체
// -----------------------------------------------------------
function drawFace(g, def) {
  const eyeColor = def.eye ?? 0x5a3fa8;
  drawEye(g, W / 2 - EYE_X, EYE_Y, -1, eyeColor);
  drawEye(g, W / 2 + EYE_X, EYE_Y, +1, eyeColor);

  // 볼터치 — 가장자리가 부드럽게 번지도록
  for (const s of [-1, 1]) {
    const bx = W / 2 + s * 386, by = EYE_Y + 178;
    const blush = g.createRadialGradient(bx, by, 4, bx, by, 96);
    blush.addColorStop(0, 'rgba(255,124,164,0.60)');
    blush.addColorStop(1, 'rgba(255,124,164,0)');
    g.fillStyle = blush;
    g.beginPath();
    g.ellipse(bx, by, 96, 66, 0, 0, Math.PI * 2);
    g.fill();
  }

  // 입 — 작게 벌린 웃는 입
  const mx = W / 2, my = EYE_Y + 186;
  g.fillStyle = LINE;
  g.beginPath();
  g.moveTo(mx - 52, my);
  g.quadraticCurveTo(mx, my + 84, mx + 52, my);
  g.quadraticCurveTo(mx, my + 22, mx - 52, my);
  g.fill();

  // 혀
  g.fillStyle = '#ff7ea6';
  g.beginPath();
  g.ellipse(mx, my + 42, 27, 17, 0, 0, Math.PI);
  g.fill();
}

// -----------------------------------------------------------
//  같은 눈 색이면 그림을 다시 그리지 않고 재사용한다
// -----------------------------------------------------------
const _cache = new Map();

export function faceTexture(def) {
  const key = def.eye ?? 0;
  if (_cache.has(key)) return _cache.get(key);

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  drawFace(cv.getContext('2d'), def);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _cache.set(key, tex);
  return tex;
}
