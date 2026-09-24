// ===========================================================
//  🔴 숫자 100 — 진짜 3D 모델 (샘플)
//  원작 표의 100을 보고 만들었다: 빨간 블록 10×10, 어두운 빨간 격자선,
//  하얀 네모 큰 눈 하나(빨간 테두리), 씩 웃는 입, 옆에 작은 팔, 아래 짧은 다리.
//
//  블록 100개를 메시 100개로 만들지 않고 **상자 하나에 격자 무늬 텍스처**를 입힌다
//  (앞·뒤·옆·위 모두 블록 무늬가 보인다). 얼굴은 캔버스에 그려 앞면에 붙인다.
//  ★ 다른 숫자도 이렇게 만들려면 이 파일을 복사해서 색·칸 수·얼굴만 바꾸면 된다.
// ===========================================================
import * as THREE from 'three';
import { GEO } from '../../src/character-parts.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const COLS = 10, ROWS = 10;       // 블록 칸 수 (가로 × 세로)
const HEIGHT = 2.7;               // 키 (blocks.js의 100 키와 같다)
const BODY   = '#ef5350';         // 블록 색
const LINE   = '#b7262b';         // 격자선 색
const SHINE  = 'rgba(255,255,255,0.16)';   // 블록 윗쪽 하이라이트
const EYE_OUTLINE = '#c62828';    // 눈 테두리
const LIMB   = 0xd94a45;          // 팔 색
const LEG    = 0x8e1c1c;          // 다리 색
const FOOT   = 0xef8a86;          // 발 색

// -----------------------------------------------------------
//  블록 격자 무늬 텍스처 — 칸 수만 다르게 해서 앞면(10×10)·옆면(1×10)·윗면(10×1)에 쓴다
// -----------------------------------------------------------
const _texCache = new Map();
function gridTex(cols, rows) {
  const key = `${cols}x${rows}`;
  if (_texCache.has(key)) return _texCache.get(key);
  const cell = 48;
  const cv = document.createElement('canvas');
  cv.width = cols * cell; cv.height = rows * cell;
  const g = cv.getContext('2d');
  g.fillStyle = LINE; g.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * cell, y = r * cell, p = 3;
    g.fillStyle = BODY; g.fillRect(x + p, y + p, cell - p * 2, cell - p * 2);
    g.fillStyle = SHINE; g.fillRect(x + p, y + p, cell - p * 2, 7);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, tex);
  return tex;
}

// -----------------------------------------------------------
//  얼굴 — 원작처럼 큰 눈 하나(하얀 네모, 빨간 테두리, 까만 눈동자) + 씩 웃는 입
// -----------------------------------------------------------
function faceTex() {
  const S = 512;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  // 눈 — 위쪽 가운데. 둥근 네모
  const ex = S / 2, ey = S * 0.30, ew = S * 0.30, eh = S * 0.28;
  g.fillStyle = EYE_OUTLINE;
  g.beginPath(); g.roundRect(ex - ew / 2 - 14, ey - eh / 2 - 14, ew + 28, eh + 28, 40); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.roundRect(ex - ew / 2, ey - eh / 2, ew, eh, 30); g.fill();
  g.fillStyle = '#1b1430';
  g.beginPath(); g.ellipse(ex, ey + 8, S * 0.06, S * 0.07, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(ex - 12, ey - 6, 9, 0, Math.PI * 2); g.fill();
  // 입 — 눈 아래 씩 웃는 선
  g.strokeStyle = EYE_OUTLINE; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(S * 0.40, S * 0.56); g.quadraticCurveTo(S * 0.52, S * 0.66, S * 0.62, S * 0.55); g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _faceMat = null;
const FACE_GEO = new THREE.PlaneGeometry(1, 1);

// -----------------------------------------------------------
//  만들기
// -----------------------------------------------------------
export function makeHundred(def) {
  const g = new THREE.Group();
  const S = HEIGHT / ROWS;                  // 블록 한 칸
  const W = S * COLS, H = S * ROWS, D = S;  // 두께는 블록 한 칸 (원작처럼 얇은 판)

  // 몸통 — 면마다 칸 수가 다른 격자 무늬
  const side = new THREE.MeshToonMaterial({ map: gridTex(1, ROWS) });
  const top  = new THREE.MeshToonMaterial({ map: gridTex(COLS, 1) });
  const face = new THREE.MeshToonMaterial({ map: gridTex(COLS, ROWS) });
  const body = new THREE.Mesh(GEO.cube, [side, side, top, top, face, face]);
  body.scale.set(W, H, D);
  body.position.y = H / 2;
  body.castShadow = true;
  body.userData.block = def;
  g.add(body);

  // 얼굴 — 앞면 위쪽에 붙인다 (원작처럼 눈이 위 가운데, 크게)
  _faceMat ??= new THREE.MeshBasicMaterial({ map: faceTex(), transparent: true, depthWrite: false });
  const faceMesh = new THREE.Mesh(FACE_GEO, _faceMat);
  faceMesh.scale.set(W * 0.95, W * 0.95, 1);
  faceMesh.position.set(0, H * 0.58, D / 2 + 0.01);
  faceMesh.userData.noShadow = true;
  g.add(faceMesh);

  // 팔 — 옆구리 가운데쯤에 짧게, 끝에 동그란 손
  const limbs = [];
  const armMat = new THREE.MeshToonMaterial({ color: LIMB });
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    const bone = new THREE.Mesh(GEO.limb, armMat);
    bone.scale.set(S * 0.35, S * 0.9, S * 0.35);
    bone.position.y = -S * 0.5;
    const hand = new THREE.Mesh(GEO.blob, armMat);
    hand.scale.setScalar(S * 0.8);
    hand.position.y = -S * 1.1;
    arm.add(bone, hand);
    arm.position.set(sx * (W / 2 + S * 0.15), H * 0.45, 0);
    arm.rotation.z = sx * 0.35;
    g.add(arm); limbs.push(arm);
  }
  // 다리 — 아래 양쪽, 짧고 어두운 빨강. 끝에 분홍 발
  const legMat = new THREE.MeshToonMaterial({ color: LEG });
  const footMat = new THREE.MeshToonMaterial({ color: FOOT });
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    const bone = new THREE.Mesh(GEO.limb, legMat);
    bone.scale.set(S * 0.35, S * 0.6, S * 0.35);
    const foot = new THREE.Mesh(GEO.blob, footMat);
    foot.scale.set(S * 0.9, S * 0.4, S * 1.1);
    foot.position.set(0, -S * 0.35, S * 0.15);
    leg.add(bone, foot);
    leg.position.set(sx * W * 0.3, S * 0.15, 0);
    g.add(leg); limbs.push(leg);
  }

  g.userData.height = H;
  g.userData.halfW = W / 2;

  // 걷기: 팔다리 흔들기 + 통통 / 서 있을 때: 살짝 숨쉬기
  g.userData.animate = (g_, tt, moving) => {
    const sp = moving ? 9 : 2.2, amp = moving ? 0.6 : 0.1;
    for (let i = 0; i < limbs.length; i++) limbs[i].rotation.x = Math.sin(tt * sp + i * Math.PI) * amp;
    g_.position.y = moving ? Math.abs(Math.sin(tt * sp)) * 0.08 : 0;
  };
  return g;
}
