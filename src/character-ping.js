// ===========================================================
//  요정 친구 만들기 (~핑)
//  2등신 비율 · 반짝이는 큰 눈 · 앞머리 · 요정 날개 · 이마 보석
//
//  좌표 규칙: 모든 도형의 반지름이 0.5라서, scale 값의 절반이 실제 크기다.
//  (예: scale 1.12 → 실제 반지름 0.56)
// ===========================================================
import * as THREE from 'three';
import {
  GEO, MAT_SPARK, MAT_GLOSS, bodyMat, glowMat, makeOutline, noShadow, shade,
} from './character-parts.js';
import { addFace } from './character-face.js';
import { makeDeco, makeTailCharm } from './character-deco.js';
import { wingTexture } from './character-wingtex.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEAD_Y      = 1.05;   // 머리 높이
const WING_FLAP   = 14;     // 날개 퍼덕이는 속도
const SPARK_COUNT = 4;      // 주변에 도는 반짝이 개수
const HOP_HEIGHT  = 0.30;   // 걸을 때 통통 튀는 높이
const HEIGHT      = 1.85;   // 이름표를 띄울 키

// -----------------------------------------------------------
//  머리 (얼굴 + 귀 + 장식이 전부 여기 들어간다)
// -----------------------------------------------------------
function makeHead(def, full) {
  const head = new THREE.Group();
  head.position.y = HEAD_Y;

  const mat = bodyMat(def.color);
  const accent = def.accent ?? shade(def.color, -0.18);

  const skull = new THREE.Mesh(GEO.ball, mat);
  skull.scale.set(1.12, 1.06, 1.04);
  skull.castShadow = true;
  head.add(skull);
  if (full) head.add(makeOutline(skull));

  // 귀
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(GEO.cone, mat);
    ear.scale.set(0.42, 0.68, 0.38);
    ear.position.set(s * 0.38, 0.38, -0.05);
    ear.rotation.z = -s * 0.36;
    ear.castShadow = true;
    head.add(ear);

    if (full) {
      const inner = new THREE.Mesh(GEO.cone, glowMat(accent));
      inner.scale.set(0.22, 0.42, 0.22);
      inner.position.set(s * 0.375, 0.39, 0.03);
      inner.rotation.z = -s * 0.36;
      head.add(noShadow(inner));
    }
  }

  addFace(head, def, full);

  const deco = makeDeco(def.deco, def.decoColor);
  deco.position.y = 0.74;
  deco.scale.setScalar(1.45);
  head.add(deco);

  return head;
}

// -----------------------------------------------------------
//  날개 — Canvas에 그린 날개 그림을 판에 붙인다
// -----------------------------------------------------------
const WING_GEO = new THREE.PlaneGeometry(1, 1);
const _wingMat = new Map();

function wingMaterial(color) {
  if (!_wingMat.has(color)) {
    _wingMat.set(color, new THREE.MeshBasicMaterial({
      map: wingTexture(color), transparent: true, depthWrite: false,
      side: THREE.DoubleSide, opacity: 0.92,
    }));
  }
  return _wingMat.get(color);
}

function makeWings(def) {
  const mat = wingMaterial(def.wing ?? shade(def.color, 0.72));
  const pivots = [];

  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.09, 0.60, -0.30);
    pivot.userData.side = s;

    const w = new THREE.Mesh(WING_GEO, mat);
    w.scale.set(s * 1.15, 1.15, 1);      // s를 곱해서 반대쪽은 좌우를 뒤집는다
    w.position.set(s * 0.52, 0.52, 0);
    w.renderOrder = 1;
    pivot.add(noShadow(w));

    pivots.push(pivot);
  }
  return pivots;
}

// -----------------------------------------------------------
//  주변을 도는 반짝이
// -----------------------------------------------------------
function makeSparkles() {
  const g = new THREE.Group();
  g.position.y = 1.0;
  for (let i = 0; i < SPARK_COUNT; i++) {
    const a = (i / SPARK_COUNT) * Math.PI * 2;
    const m = new THREE.Mesh(GEO.gem, MAT_SPARK);
    m.scale.set(0.06, 0.11, 0.06);
    m.position.set(Math.cos(a) * 0.88, Math.sin(a * 1.7) * 0.28, Math.sin(a) * 0.88);
    g.add(noShadow(m));
  }
  return g;
}

// -----------------------------------------------------------
//  요정 한 마리 완성
// -----------------------------------------------------------
export function makePing(def, detail = 'full') {
  const full = detail === 'full';
  const g = new THREE.Group();
  const mat = bodyMat(def.color);
  const accent = def.accent ?? shade(def.color, -0.18);

  // 몸통 (머리보다 작아야 2등신이 된다)
  const body = new THREE.Mesh(GEO.ball, mat);
  body.scale.set(0.60, 0.54, 0.56);
  body.position.y = 0.48;
  body.castShadow = true;
  g.add(body);
  if (full) g.add(makeOutline(body, 0.028));

  // 배 무늬 (몸보다 밝은 색이라 배가 도톰해 보인다)
  const belly = new THREE.Mesh(GEO.blob, bodyMat(def.belly ?? shade(def.color, 0.34)));
  belly.scale.set(0.36, 0.34, 0.30);
  belly.position.set(0, 0.42, 0.19);
  g.add(noShadow(belly));

  // 몸 광택
  if (full) {
    const gloss = new THREE.Mesh(GEO.blob, MAT_GLOSS);
    gloss.scale.set(0.22, 0.13, 0.10);
    gloss.position.set(-0.16, 0.62, 0.22);
    gloss.rotation.z = 0.5;
    g.add(noShadow(gloss));
  }

  // 목 프릴 — 동글동글한 옷깃
  if (full) {
    const frill = new THREE.Group();
    frill.position.y = 0.60;
    const fMat = glowMat(def.frill ?? shade(def.color, 0.62));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const b = new THREE.Mesh(GEO.blob, fMat);
      b.scale.setScalar(0.185);
      b.position.set(Math.sin(a) * 0.345, 0, Math.cos(a) * 0.32);
      frill.add(noShadow(b));
    }
    g.add(frill);
  }

  // 가슴 무늬 (머리 장식과 같은 모양을 작게)
  if (full) {
    const chest = makeTailCharm(def.deco, def.decoColor);
    chest.scale.setScalar(0.40);
    chest.position.set(0, 0.46, 0.26);
    g.add(chest);
  }

  // 팔 + 손
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(GEO.limb, mat);
    arm.scale.set(0.15, 0.13, 0.15);
    arm.position.set(s * 0.31, 0.55, 0.02);
    arm.rotation.z = s * 0.8;
    arm.castShadow = true;
    g.add(arm);

    const hand = new THREE.Mesh(GEO.blob, mat);
    hand.scale.setScalar(0.17);
    hand.position.set(s * 0.40, 0.44, 0.03);
    g.add(noShadow(hand));
  }

  // 발 (몸과 다른 색이라 신발처럼 보인다)
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(GEO.blob, glowMat(accent));
    foot.scale.set(0.23, 0.16, 0.31);
    foot.position.set(s * 0.21, 0.115, 0.05);
    foot.castShadow = true;
    g.add(foot);
  }

  // 꼬리
  const tail = new THREE.Group();
  tail.position.set(0, 0.52, -0.32);
  const tailBall = new THREE.Mesh(GEO.blob, mat);
  tailBall.scale.set(0.22, 0.22, 0.26);
  tail.add(tailBall);
  if (full) {
    const charm = makeTailCharm(def.deco, def.decoColor);
    charm.position.set(0, 0.19, -0.18);
    tail.add(charm);
  }
  g.add(tail);

  const wings = makeWings(def);
  for (const w of wings) g.add(w);

  const head = makeHead(def, full);
  g.add(head);

  const sparkles = full ? makeSparkles() : null;
  if (sparkles) g.add(sparkles);

  g.userData.height = HEIGHT;

  // 애니메이션: 통통 튀기 + 날개 퍼덕 + 고개 갸웃 + 반짝이 공전
  g.userData.animate = (g_, tt, moving) => {
    g_.position.y = moving
      ? Math.abs(Math.sin(tt * 7)) * HOP_HEIGHT
      : Math.abs(Math.sin(tt * 2.2)) * (HOP_HEIGHT * 0.24);

    const flap = Math.sin(tt * WING_FLAP);
    for (const w of wings) w.rotation.y = w.userData.side * (0.62 + flap * 0.30);

    head.rotation.z = Math.sin(tt * 1.7) * 0.06;
    head.position.y = HEAD_Y + Math.sin(tt * 2.6) * 0.018;
    tail.rotation.x = Math.sin(tt * 3.1) * 0.18;

    if (sparkles) {
      sparkles.rotation.y = tt * 1.4;
      sparkles.position.y = 1.0 + Math.sin(tt * 2) * 0.08;
      for (const s of sparkles.children) s.rotation.y = tt * 3;
    }
  };

  return g;
}
