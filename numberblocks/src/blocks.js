// ===========================================================
//  🔢 숫자 블록 친구 3D 만들기
//  숫자만큼 블록을 쌓는다. 10이 넘으면 '열 묶음' 기둥을 왼쪽부터 세우고
//  맨 오른쪽에 나머지를 세운다 (23 = 10 · 10 · 3).
//  얼굴은 캔버스에 그려서 맨 위 블록 앞면에 붙인다.
//
//  ★ 기둥 하나 = 메시 하나 (블록 경계선은 텍스처로 그린다).
//    친구 100명이 한꺼번에 나와도 메시가 600개 정도라 폰에서도 돌아간다.
// ===========================================================
import * as THREE from 'three';
import { registerBuilder } from '../../src/characters.js';
import { GEO, MAT_DARK } from '../../src/character-parts.js';
import { columnsOf, hex, RAINBOW, RIM_FILL, UNIT_COLORS } from './block-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const CUBE_MAX   = 0.5;     // 블록 한 변 (작은 숫자)
const HEIGHT_MAX = 2.6;     // 아무리 큰 숫자도 이 키를 넘지 않게 블록을 줄인다
const WIDTH_MAX  = 2.4;     // 기둥이 많아도 이 폭을 넘지 않게
const GAP        = 0.09;    // 블록 사이 어두운 줄 두께 (텍스처 비율)
const EYE_BLINK  = 4.0;     // 몇 초마다 눈을 깜빡일까

/** 숫자 n에 맞는 블록 크기 — 커질수록 블록이 작아진다 */
export function cubeSize(n) {
  const cols = n === 100 ? 10 : Math.ceil(n / 10);
  const rows = Math.min(n, 10);
  return Math.min(CUBE_MAX, HEIGHT_MAX / rows, WIDTH_MAX / cols);
}

// -----------------------------------------------------------
//  재질 — 색·블록 수마다 한 번만 만들어서 나눠 쓴다
// -----------------------------------------------------------
const _sideCache = new Map();   // '색들' → 옆면 재질 (블록 줄무늬)
const _topCache  = new Map();   // 색 → 윗면 재질
const _faceCache = new Map();   // 숫자 → 얼굴 재질

/** 기둥 옆면 — 블록 k개가 쌓인 줄무늬 텍스처. rim 블록은 원작 열 묶음처럼 흰 바탕 + 색 테두리 */
function sideMat(colors, rims) {
  const key = colors.join(',') + '|' + rims.join(',');
  if (_sideCache.has(key)) return _sideCache.get(key);
  const k = colors.length;
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64 * k;
  const g = cv.getContext('2d');
  for (let i = 0; i < k; i++) {
    const y = (k - 1 - i) * 64;                 // 아래 블록이 colors[0]
    g.fillStyle = '#2a2233'; g.fillRect(0, y, 64, 64);   // 경계선
    const p = 64 * GAP;
    g.fillStyle = hex(colors[i]);
    g.fillRect(p, y + p, 64 - p * 2, 64 - p * 2);
    if (rims[i]) {                              // 테두리만 색, 안은 흰색
      g.fillStyle = RIM_FILL;
      g.fillRect(p + 9, y + p + 9, 64 - p * 2 - 18, 64 - p * 2 - 18);
    }
    g.fillStyle = 'rgba(255,255,255,0.22)';     // 윗쪽 살짝 밝게 (입체감)
    g.fillRect(p, y + p, 64 - p * 2, 8);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  const m = new THREE.MeshToonMaterial({ map: tex });
  _sideCache.set(key, m);
  return m;
}
function topMat(color) {
  if (!_topCache.has(color)) _topCache.set(color, new THREE.MeshToonMaterial({ color }));
  return _topCache.get(color);
}

// -----------------------------------------------------------
//  얼굴 — 캔버스 그림 (숫자마다 표정이 조금씩 다르다)
// -----------------------------------------------------------
/**
 * 눈 자리 — 원작처럼 1은 눈 하나(한가운데 크게), 3은 눈 셋(위 하나 아래 둘), 4는 네모 눈, 나머지는 둘
 *   256×256 얼굴 캔버스 기준 [{ x, y, r, square }]
 */
export function eyeLayout(n) {
  if (n === 1) return [{ x: 128, y: 100, r: 46 }];
  if (n === 3) return [{ x: 128, y: 62, r: 26 }, { x: 84, y: 112, r: 26 }, { x: 172, y: 112, r: 26 }];
  const seed = (n * 7919) % 97;
  const r = 34 + (seed % 5) * 2;
  return [{ x: 76, y: 96, r, square: n === 4 }, { x: 180, y: 96, r, square: n === 4 }];
}

function drawFace(g, n, blink) {
  const S = 256;
  g.clearRect(0, 0, S, S);
  const seed = (n * 7919) % 97;
  const eyes = eyeLayout(n);
  // 8 = 옥토블록! 눈 둘레에 슈퍼히어로 가면
  if (n === 8) {
    g.fillStyle = '#5e4b9c';
    g.beginPath(); g.ellipse(S / 2, 96, 118, 58, 0, 0, Math.PI * 2); g.fill();
  }
  // 눈 — 하얀 동그라미(4는 네모) + 까만 눈동자 + 반짝이
  for (const e of eyes) {
    g.fillStyle = '#fff';
    if (blink) { g.fillRect(e.x - e.r, e.y - 4, e.r * 2, 8); continue; }
    if (e.square) g.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
    else { g.beginPath(); g.ellipse(e.x, e.y, e.r, e.r * 1.1, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#1b1430';
    if (e.square) g.fillRect(e.x - e.r * 0.45, e.y - e.r * 0.35, e.r * 0.9, e.r * 0.9);
    else { g.beginPath(); g.arc(e.x, e.y + 6, e.r * 0.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(e.x - e.r * 0.25, e.y - e.r * 0.15, e.r * 0.2, 0, Math.PI * 2); g.fill();
  }
  // 눈썹 — 숫자마다 각도가 다르다. 9는 굵고 처진 눈썹(재채기 직전). 1·3은 눈 배치가 달라서 눈썹 없음
  if (n !== 1 && n !== 3) {
    g.strokeStyle = '#1b1430'; g.lineWidth = n === 9 ? 16 : 9; g.lineCap = 'round';
    const tilt = n === 9 ? -8 : ((seed % 7) - 3) * 3;
    for (const e of eyes) {
      const sx = e.x < S / 2 ? -1 : 1;
      g.beginPath(); g.moveTo(e.x - 26, e.y - 52 + sx * tilt); g.lineTo(e.x + 26, e.y - 52 - sx * tilt); g.stroke();
    }
  }
  // 입 — 웃는 입 / 활짝 벌린 입 / 씩 웃는 입 (1·7은 늘 활짝, 3은 큰 웃음)
  const kind = (n === 7 || n === 1) ? 1 : n === 3 ? 0 : seed % 3;
  const mouthY = n === 1 ? 168 : 150;
  g.fillStyle = '#1b1430';
  if (kind === 0) {
    g.strokeStyle = '#1b1430'; g.lineWidth = 10; g.beginPath(); g.arc(S / 2, mouthY, 40, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else if (kind === 1) {
    g.beginPath(); g.arc(S / 2, mouthY, 46, 0, Math.PI); g.fill();
    g.fillStyle = '#ff6b8a'; g.beginPath(); g.arc(S / 2, mouthY + 28, 20, Math.PI, 0); g.fill();
  } else {
    g.strokeStyle = '#1b1430'; g.lineWidth = 10; g.beginPath(); g.moveTo(S / 2 - 40, mouthY); g.quadraticCurveTo(S / 2 + 10, mouthY + 40, S / 2 + 44, mouthY - 10); g.stroke();
  }
}
function faceMat(n) {
  if (_faceCache.has(n)) return _faceCache.get(n);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  drawFace(g, n, false);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  m.userData = { cv, g, n, blink: false };
  _faceCache.set(n, m);
  return m;
}
/** 얼굴 눈 깜빡임 — 재질 하나를 모두가 쓰니 같은 숫자는 같이 깜빡인다 (귀엽다) */
function setBlink(m, blink) {
  if (m.userData.blink === blink) return;
  m.userData.blink = blink;
  drawFace(m.userData.g, m.userData.n, blink);
  m.map.needsUpdate = true;
}

// -----------------------------------------------------------
//  친구 한 명 만들기
// -----------------------------------------------------------
const FACE_GEO = new THREE.PlaneGeometry(1, 1);

export function makeNumberblock(def) {
  const g = new THREE.Group();
  const n = def.number;
  const S = cubeSize(n);
  const cols = columnsOf(n);
  const totalW = cols.length * S;
  const x0 = -totalW / 2 + S / 2;
  const square = cols.length > 1 && cols.every(c => c.k === cols[0].k);   // 4·9·16… 정사각형

  cols.forEach((col, i) => {
    const side = sideMat(col.colors, col.rim);
    const top = topMat(col.rim[col.k - 1] ? 0xfbfbfb : col.colors[col.k - 1]);
    const bottom = topMat(col.rim[0] ? 0xfbfbfb : col.colors[0]);
    const mesh = new THREE.Mesh(GEO.cube, [side, side, top, bottom, side, side]);
    mesh.scale.set(S * 0.98, S * col.k, S * 0.98);
    mesh.position.set(x0 + i * S, S * col.k / 2, 0);
    mesh.castShadow = true;
    mesh.userData.block = def;                   // 두드렸을 때 누구인지 알려고
    g.add(mesh);
  });

  // 얼굴 — 정사각형은 한가운데 위쪽에 크게, 아니면 맨 오른쪽 기둥(나머지) 꼭대기
  const faceCol = cols.length - 1;
  const faceH = cols[faceCol].k * S;
  const face = new THREE.Mesh(FACE_GEO, faceMat(n));
  const wide = square || (n >= 20 && cols.length >= 2);   // 큰 숫자는 블록이 작아서 얼굴을 두 칸 너비로
  const faceS = square ? Math.min(S * cols.length * 0.8, S * 2.6) : S * (wide ? 1.9 : 0.96);
  face.scale.setScalar(faceS);
  if (square) face.position.set(0, faceH - faceS * 0.62, S / 2 + 0.01);
  else face.position.set(x0 + faceCol * S - (wide ? S / 2 : 0), faceH - S / 2 + (wide ? S * 0.45 : 0), S / 2 + 0.01);
  face.userData.noShadow = true;
  g.add(face);

  // 팔다리 — 원작처럼 가는 팔에 동그란 손, 까만 다리에 동그란 발. 8은 문어처럼 팔 8개, 2는 큰 신발
  const limbs = [];
  const bodyC = n === 100 ? UNIT_COLORS[1] : (n % 10 === 7 || n === 7) ? RAINBOW[0] : UNIT_COLORS[n % 10 || Math.floor(n / 10)];
  const armMat = topMat(bodyC);
  const armCount = n === 8 ? 4 : 1;
  const armY = square ? faceH - S * 0.9 : faceH - S * 0.55;
  for (let a = 0; a < armCount; a++) for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    const bone = new THREE.Mesh(GEO.limb, armMat);
    bone.scale.set(S * 0.13, S * 0.34, S * 0.13);
    bone.position.y = -S * 0.2;
    const hand = new THREE.Mesh(GEO.blob, armMat);
    hand.scale.setScalar(S * 0.3);
    hand.position.y = -S * 0.42;
    arm.add(bone, hand);
    arm.position.set(sx * (totalW / 2 + S * 0.1), armY - a * S * 0.8, 0);
    arm.rotation.z = sx * 0.55;
    g.add(arm); limbs.push(arm);
  }
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    const bone = new THREE.Mesh(GEO.limb, MAT_DARK);
    bone.scale.set(S * 0.13, S * 0.26, S * 0.13);
    const foot = new THREE.Mesh(GEO.blob, n === 2 ? topMat(0xfbe323) : MAT_DARK);
    foot.scale.set(S * (n === 2 ? 0.55 : 0.34), S * 0.2, S * (n === 2 ? 0.7 : 0.42));
    foot.position.set(0, -S * 0.14, S * 0.08);
    leg.add(bone, foot);
    const legX = square ? sx * S * 0.6 * (cols.length / 2) : x0 + faceCol * S + sx * S * 0.25;
    leg.position.set(legX, S * 0.02, 0);
    g.add(leg); limbs.push(leg);
  }

  g.userData.height = Math.max(...cols.map(c => c.k)) * S;
  g.userData.halfW = totalW / 2;               // 몸 너비 절반 (닿았는지 볼 때 쓴다)
  g.userData.faceMat = faceMat(n);

  // 걷기: 팔다리 흔들기 + 통통 / 서 있을 때: 살짝 숨쉬기 + 눈 깜빡임
  g.userData.animate = (g_, tt, moving) => {
    const sp = moving ? 9 : 2.2, amp = moving ? 0.7 : 0.12;
    for (let i = 0; i < limbs.length; i++) limbs[i].rotation.x = Math.sin(tt * sp + i * Math.PI) * amp;
    g_.position.y = moving ? Math.abs(Math.sin(tt * sp)) * 0.06 : 0;
    setBlink(g_.userData.faceMat, (tt % EYE_BLINK) < 0.14);
  };
  return g;
}

// characters.js에 'numberblock' 종류로 등록 → createCharacter(def)로 만들 수 있다
registerBuilder('numberblock', makeNumberblock);
