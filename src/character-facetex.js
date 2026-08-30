// ===========================================================
//  얼굴 그림을 3D 얼굴에 붙이기
//  ★ character-facedraw.js가 그린 그림을, 머리와 똑같은 곡면 조각에 입힌다.
//    곡면이 똑같아서 이어 붙인 티가 나지 않는다.
// ===========================================================
import * as THREE from 'three';
import { petalShape, shapeGeometry, sculptGeometry } from './character-parts.js';
import { paintFace, W, H } from './character-facedraw.js';

const SPAN = 1.0;   // 얼굴 그림이 덮는 범위(라디안)

// -----------------------------------------------------------
//  얼굴 그림 (캐릭터마다 한 번만 그리고 재사용)
// -----------------------------------------------------------
const _texCache = new Map();
export function faceTexture(def) {
  if (_texCache.has(def.id)) return _texCache.get(def.id);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  paintFace(canvas.getContext('2d'), def);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  _texCache.set(def.id, tex);
  return tex;
}

// -----------------------------------------------------------
//  얼굴 덩어리와 그림 조각 (둘 다 똑같이 계란형으로 눌러 만든다)
// -----------------------------------------------------------
export const FACE_GEO  = sculptGeometry(new THREE.SphereGeometry(0.5, 96, 72));
export const PETAL_GEO = shapeGeometry(new THREE.SphereGeometry(0.5, 20, 18), petalShape);

const PATCH = sculptGeometry(new THREE.SphereGeometry(
  0.5 * 1.004, 112, 88,
  Math.PI / 2 - SPAN, SPAN * 2,
  Math.PI / 2 - SPAN, SPAN * 2,
));

const _faceMat = new Map();
export function makeFaceDecal(def) {
  if (!_faceMat.has(def.id)) {
    _faceMat.set(def.id, new THREE.MeshPhysicalMaterial({
      map: faceTexture(def),
      transparent: true, depthWrite: false,
      roughness: 0.36, metalness: 0.0,
      clearcoat: 0.55, clearcoatRoughness: 0.28,
    }));
  }
  const m = new THREE.Mesh(PATCH, _faceMat.get(def.id));
  m.renderOrder = 2;
  m.userData.noShadow = true;
  return m;
}

// -----------------------------------------------------------
//  가슴에 붙는 황금 하프 무늬 (이것도 그림)
// -----------------------------------------------------------
const _emblemCache = new Map();
export function emblemTexture(def) {
  const key = def.emblem ?? 0xffc93c;
  if (_emblemCache.has(key)) return _emblemCache.get(key);

  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const gold = ctx.createLinearGradient(0, 120, 0, 400);
  gold.addColorStop(0, '#ffefb8');
  gold.addColorStop(0.5, '#' + key.toString(16).padStart(6, '0'));
  gold.addColorStop(1, '#cf860f');

  ctx.translate(256, 256);
  ctx.scale(1.15, 1.15);
  ctx.strokeStyle = gold;
  ctx.lineCap = 'round';

  // 무늬를 감싸는 금색 동그라미
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 178, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(-70, 120);
  ctx.bezierCurveTo(-130, 20, -90, -110, 0, -140);
  ctx.bezierCurveTo(90, -110, 130, 20, 70, 120);
  ctx.stroke();

  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-78, 118);
  ctx.quadraticCurveTo(0, 168, 78, 118);
  ctx.stroke();

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

// -----------------------------------------------------------
//  머리카락 결 무늬
//  ★ 하얀 바탕에 옅은 줄무늬. 머리 색 위에 곱해져서 "결"이 파인 것처럼 보인다.
//    vertical=true면 세로줄(머리 덩어리용), false면 가로줄(긴 머리 가닥용).
// -----------------------------------------------------------
const _stripe = new Map();
export function stripeTexture(vertical) {
  if (_stripe.has(vertical)) return _stripe.get(vertical);

  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  if (!vertical) ctx.setTransform(0, 1, 1, 0, 0, 0);   // 눕히기

  // 굵기와 진하기가 조금씩 다른 결 12줄
  for (let i = 0; i < 12; i++) {
    const x = (i + 0.5) * (256 / 12) + Math.sin(i * 2.3) * 4;
    const w = 5 + (i % 3) * 4;
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, 'rgba(120,140,170,0)');
    g.addColorStop(0.5, `rgba(120,140,170,${0.16 + (i % 3) * 0.05})`);
    g.addColorStop(1, 'rgba(120,140,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w, 0, w * 2, 256);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _stripe.set(vertical, tex);
  return tex;
}
