// ===========================================================
//  얼굴을 "그림"으로 그려서 붙이기 (Canvas 텍스처)
//  ★ 눈·속눈썹·눈썹·코·입·볼터치·이마 보석을 도형이 아니라 2D로 그린다.
//    도형으로는 낼 수 없는 눈동자 그라데이션과 가는 속눈썹이 나온다.
//
//  좌표 규칙: 그림 한가운데(512,512)가 얼굴 정중앙이다.
//  512픽셀 = 1라디안. 즉 얼굴 위에서 각도만큼 떨어진 곳에 그려진다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 (전부 그림 위의 픽셀 단위)
// -----------------------------------------------------------
const W = 1024, H = 1024;   // 그림 크기
const CX = 512, CY = 512;   // 얼굴 한가운데
const SPAN = 1.0;           // 얼굴판에서 그림이 덮는 범위(라디안)

const EYE_X  = 222;   // 두 눈 사이 (클수록 눈이 벌어진다)
const EYE_RX = 111;   // 눈 가로 반지름
const EYE_RY = 141;   // 눈 세로 반지름
const NOSE_Y = 166;   // 눈높이에서 코까지
const MOUTH_Y= 272;   // 눈높이에서 입까지
const GEM_Y  = 236;   // 눈높이에서 이마 보석까지
const BROW_Y = 198;   // 눈높이에서 눈썹까지

// -----------------------------------------------------------
//  그리기 도우미
// -----------------------------------------------------------
function ell(ctx, x, y, rx, ry, rot, style) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = style;
  ctx.fill();
}

/** 눈 한 쪽 (s = -1 왼쪽 / +1 오른쪽). 안쪽이 -x가 되도록 좌우를 뒤집어서 그린다 */
function drawEye(ctx, s, def) {
  const eye  = '#' + (def.eye ?? 0x2a79cc).toString(16).padStart(6, '0');
  const lash = '#1e2b52';

  ctx.save();
  ctx.translate(CX + s * EYE_X, CY);
  ctx.scale(s, 1);              // 여기서부터 +x = 바깥쪽
  ctx.rotate(0.05);

  // 흰자
  ell(ctx, 0, 0, EYE_RX, EYE_RY, 0, '#ffffff');
  ell(ctx, 0, -EYE_RY * 0.55, EYE_RX * 0.92, EYE_RY * 0.42, 0, '#e8eef8');

  // 홍채 — 위는 진한 남색, 아래는 밝은 하늘색
  const irx = EYE_RX * 0.87, iry = EYE_RY * 0.88;
  const g = ctx.createLinearGradient(0, -iry, 0, iry);
  g.addColorStop(0.00, '#12376f');
  g.addColorStop(0.30, eye);
  g.addColorStop(0.70, '#6cc9ef');
  g.addColorStop(1.00, '#d8f6ff');
  ell(ctx, 0, 8, irx, iry, 0, g);

  // 홍채 테두리
  ctx.lineWidth = 15;
  ctx.strokeStyle = 'rgba(10,32,78,0.85)';
  ctx.beginPath(); ctx.ellipse(0, 8, irx, iry, 0, 0, Math.PI * 2); ctx.stroke();

  // 동공 둘레 밝은 고리 + 동공
  ell(ctx, 0, 20, irx * 0.60, iry * 0.66, 0, 'rgba(120,205,240,0.55)');
  ell(ctx, 0, 20, irx * 0.44, iry * 0.52, 0, '#0d1f42');

  // 하이라이트 — 큰 것(안쪽 위) + 작은 것(바깥 아래) + 작은 별빛
  ell(ctx, -irx * 0.34, -iry * 0.44, 35, 31, 0, '#ffffff');
  ell(ctx,  irx * 0.36,  iry * 0.44, 20, 17, 0, 'rgba(255,255,255,0.92)');
  ell(ctx,  irx * 0.05, -iry * 0.06, 11, 10, 0, 'rgba(255,255,255,0.8)');
  ell(ctx, -irx * 0.55,  iry * 0.18,  8,  7, 0, 'rgba(255,255,255,0.7)');

  // 윗 속눈썹 (눈 위를 덮는 굵은 선)
  ctx.lineCap = 'round';
  ctx.lineWidth = 33;
  ctx.strokeStyle = lash;
  ctx.beginPath();
  ctx.ellipse(0, 0, EYE_RX, EYE_RY, 0, Math.PI * 1.03, Math.PI * 2.03);
  ctx.stroke();

  // 바깥쪽으로 뻗은 속눈썹 세 가닥
  for (let i = 0; i < 3; i++) {
    const a = -0.42 - i * 0.30;
    const x0 = Math.cos(a) * EYE_RX, y0 = Math.sin(a) * EYE_RY;
    ctx.lineWidth = 16 - i * 3;
    ctx.beginPath();
    ctx.moveTo(x0 * 0.96, y0 * 0.96);
    ctx.quadraticCurveTo(x0 * 1.26, y0 * 1.22, x0 * 1.42 + 12, y0 * 1.42 - 8);
    ctx.stroke();
  }

  // 아래 속눈썹 세 개 (바깥쪽 아래)
  ctx.lineWidth = 9;
  for (let i = 0; i < 3; i++) {
    const a = 0.30 + i * 0.26;
    const x0 = Math.cos(a) * EYE_RX, y0 = Math.sin(a) * EYE_RY;
    ctx.beginPath();
    ctx.moveTo(x0 * 0.98, y0 * 0.98);
    ctx.lineTo(x0 * 1.16, y0 * 1.16);
    ctx.stroke();
  }

  // 눈썹 — 짧고 얇은 하늘색 곡선
  ctx.lineWidth = 17;
  ctx.strokeStyle = '#' + (def.hair ?? 0xa8e0f5).toString(16).padStart(6, '0');
  ctx.beginPath();
  ctx.moveTo(-58, -BROW_Y + 18);
  ctx.quadraticCurveTo(18, -BROW_Y - 26, 96, -BROW_Y + 4);
  ctx.stroke();

  ctx.restore();
}

/** 입 — 벌리고 웃는 입 (윗니 + 혀) */
function drawMouth(ctx) {
  ctx.save();
  ctx.translate(CX, CY + MOUTH_Y);

  ctx.beginPath();
  ctx.moveTo(-100, -28);
  ctx.quadraticCurveTo(0, -50, 100, -28);
  ctx.quadraticCurveTo(70, 74, 0, 74);
  ctx.quadraticCurveTo(-70, 74, -100, -28);
  ctx.closePath();
  ctx.fillStyle = '#8d1f31';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#5d1020';
  ctx.stroke();

  // 윗니 (가운데가 살짝 갈라진 하얀 띠)
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-98, -30);
  ctx.quadraticCurveTo(0, -52, 98, -30);
  ctx.lineTo(98, -6);
  ctx.quadraticCurveTo(52, -15, 9, -13);
  ctx.lineTo(0, -2); ctx.lineTo(-9, -13);
  ctx.quadraticCurveTo(-52, -15, -98, -6);
  ctx.closePath();
  ctx.fillStyle = '#fff8fa';
  ctx.fill();

  // 혀
  ell(ctx, 0, 52, 52, 26, 0, '#e0596f');
  ctx.restore();
  ctx.restore();
}

/** 코 · 볼터치 · 이마 보석 */
function drawFaceMarks(ctx, def) {
  // 코 — 아주 작은 분홍 하트
  ctx.save();
  ctx.translate(CX, CY + NOSE_Y);
  ctx.beginPath();
  ctx.moveTo(-17, -7);
  ctx.quadraticCurveTo(-9, -19, 0, -8);
  ctx.quadraticCurveTo(9, -19, 17, -7);
  ctx.quadraticCurveTo(9, 14, 0, 20);
  ctx.quadraticCurveTo(-9, 14, -17, -7);
  ctx.fillStyle = '#ef9db1';
  ctx.fill();
  ctx.restore();

  // 볼터치 — 부드럽게 번지는 분홍
  const cheek = '#' + (def.cheek ?? 0xff8fb0).toString(16).padStart(6, '0');
  for (const s of [-1, 1]) {
    const x = CX + s * 292, y = CY + 150;
    const g = ctx.createRadialGradient(x, y, 4, x, y, 118);
    g.addColorStop(0, cheek + 'b0');
    g.addColorStop(0.55, cheek + '55');
    g.addColorStop(1, cheek + '00');
    ctx.fillStyle = g;
    ctx.fillRect(x - 130, y - 100, 260, 200);
  }

  // 이마 물방울 보석
  ctx.save();
  ctx.translate(CX, CY - GEM_Y);
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.quadraticCurveTo(31, -12, 31, 8);
  ctx.arc(0, 8, 31, 0, Math.PI);
  ctx.quadraticCurveTo(-31, -12, 0, -52);
  const gg = ctx.createLinearGradient(0, -52, 0, 40);
  gg.addColorStop(0, '#e8fbff');
  gg.addColorStop(0.45, '#7fd8f2');
  gg.addColorStop(1, '#2f9fd0');
  ctx.fillStyle = gg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(40,120,170,0.5)';
  ctx.stroke();
  ell(ctx, -11, 2, 8, 12, -0.4, 'rgba(255,255,255,0.9)');
  ctx.restore();
}

// -----------------------------------------------------------
//  얼굴 그림 만들기 (캐릭터마다 한 번만 그리고 재사용)
// -----------------------------------------------------------
const _texCache = new Map();
export function faceTexture(def) {
  if (_texCache.has(def.id)) return _texCache.get(def.id);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 볼 쪽으로 갈수록 발그레해지는 바탕
  const skin = '#' + (def.color ?? 0xffe8ee).toString(16).padStart(6, '0');
  const bg = ctx.createRadialGradient(CX, CY - 40, 120, CX, CY, 620);
  bg.addColorStop(0, skin + '00');
  bg.addColorStop(0.72, skin + '00');
  bg.addColorStop(1, '#ffb9cd66');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawFaceMarks(ctx, def);
  drawMouth(ctx);
  for (const s of [-1, 1]) drawEye(ctx, s, def);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  _texCache.set(def.id, tex);
  return tex;
}

// -----------------------------------------------------------
//  얼굴판 위에 얹는 "얼굴 그림 조각"
//  머리와 똑같은 구면이라 이어붙인 티가 안 난다.
// -----------------------------------------------------------
const PATCH = new THREE.SphereGeometry(
  0.5 * 1.004, 72, 56,
  Math.PI / 2 - SPAN, SPAN * 2,
  Math.PI / 2 - SPAN, SPAN * 2,
);

const _faceMat = new Map();
export function makeFaceDecal(def) {
  if (!_faceMat.has(def.id)) {
    _faceMat.set(def.id, new THREE.MeshPhysicalMaterial({
      map: faceTexture(def),
      transparent: true, depthWrite: false,
      roughness: 0.34, metalness: 0.0,
      clearcoat: 0.6, clearcoatRoughness: 0.25,
    }));
  }
  const m = new THREE.Mesh(PATCH, _faceMat.get(def.id));
  m.renderOrder = 2;
  m.userData.noShadow = true;
  return m;
}

// -----------------------------------------------------------
//  가슴에 붙는 황금 무늬 (하프 모양) — 이것도 그림으로 그린다
// -----------------------------------------------------------
const _emblemCache = new Map();
export function emblemTexture(def) {
  const key = def.emblem ?? 0xffc93c;
  if (_emblemCache.has(key)) return _emblemCache.get(key);

  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const gold = ctx.createLinearGradient(0, 120, 0, 400);
  gold.addColorStop(0, '#ffe9a0');
  gold.addColorStop(0.5, '#' + key.toString(16).padStart(6, '0'));
  gold.addColorStop(1, '#d98f14');

  ctx.translate(256, 262);
  ctx.scale(1.32, 1.32);
  ctx.strokeStyle = gold;
  ctx.lineCap = 'round';

  // 하프 몸통 (바깥으로 휘어진 두 팔)
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(-70, 120);
  ctx.bezierCurveTo(-130, 20, -90, -110, 0, -140);
  ctx.bezierCurveTo(90, -110, 130, 20, 70, 120);
  ctx.stroke();

  // 아래 받침
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-78, 118);
  ctx.quadraticCurveTo(0, 168, 78, 118);
  ctx.stroke();

  // 줄 3개
  ctx.lineWidth = 11;
  for (const x of [-38, 0, 38]) {
    ctx.beginPath();
    ctx.moveTo(x, -108 + Math.abs(x) * 0.35);
    ctx.lineTo(x, 128 - Math.abs(x) * 0.18);
    ctx.stroke();
  }

  // 가운데 불꽃 보석
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.quadraticCurveTo(34, 20, 0, 76);
  ctx.quadraticCurveTo(-34, 20, 0, -20);
  const flame = ctx.createLinearGradient(0, -20, 0, 76);
  flame.addColorStop(0, '#fff3b0');
  flame.addColorStop(0.55, '#ffb03a');
  flame.addColorStop(1, '#ef5f4a');
  ctx.fillStyle = flame;
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _emblemCache.set(key, tex);
  return tex;
}

const EM_SPAN = 0.85;
const EM_PATCH = new THREE.SphereGeometry(
  0.5 * 1.006, 40, 32,
  Math.PI / 2 - EM_SPAN, EM_SPAN * 2,
  Math.PI / 2 - EM_SPAN, EM_SPAN * 2,
);

const _emblemMat = new Map();
export function makeEmblemDecal(def) {
  const key = def.emblem ?? 0xffc93c;
  if (!_emblemMat.has(key)) {
    _emblemMat.set(key, new THREE.MeshPhysicalMaterial({
      map: emblemTexture(def), transparent: true, depthWrite: false,
      roughness: 0.3, metalness: 0.15, clearcoat: 0.7,
    }));
  }
  const m = new THREE.Mesh(EM_PATCH, _emblemMat.get(key));
  m.renderOrder = 2;
  m.userData.noShadow = true;
  return m;
}
