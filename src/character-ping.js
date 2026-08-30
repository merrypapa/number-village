// ===========================================================
//  요정 친구 만들기 (~핑)
//  2등신 비율 · 커다란 반짝 눈 · 요정 날개 · 이마 보석 · 애니 테두리
//
//  좌표 규칙: 모든 도형의 반지름이 0.5라서, scale 값의 절반이 실제 크기다.
//  (예: scale 1.12 → 실제 반지름 0.56)
// ===========================================================
import * as THREE from 'three';
import {
  GEO, MAT_WHITE, MAT_DARK, MAT_CHEEK, MAT_SHINE, MAT_SPARK,
  bodyMat, glowMat, filmMat, makeOutline, noShadow, shade,
} from './character-parts.js';
import { makeDeco, makeTailCharm } from './character-deco.js';
import { addHair, addDress, makeFacePlate, makePuffEar, swayHair, FACE_Z } from './character-hair.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEAD_Y      = 1.05;   // 머리 높이
const EYE_SIZE    = 1.00;   // 눈 크기 (1.2로 하면 눈이 더 커진다)
const WING_FLAP   = 14;     // 날개 퍼덕이는 속도
const SPARK_COUNT = 3;      // 주변에 도는 반짝이 개수
const HOP_HEIGHT  = 0.30;   // 걸을 때 통통 튀는 높이
const HEIGHT      = 1.85;   // 이름표를 띄울 키

// -----------------------------------------------------------
//  얼굴: 크고 반짝이는 눈
// -----------------------------------------------------------
function addFairyEyes(head, def, full, fz = 0) {
  const irisMat = glowMat(def.eye ?? 0x5a3fa8);
  const E = EYE_SIZE;

  for (const s of [-1, 1]) {
    const x = s * 0.255;

    // 흰자 (세로로 긴 타원 = 애니 눈)
    const white = new THREE.Mesh(GEO.eye, MAT_WHITE);
    white.scale.set(0.29 * E, 0.37 * E, 0.16);
    white.position.set(x, 0, 0.40 + fz);
    head.add(white);

    // 홍채
    const iris = new THREE.Mesh(GEO.eye, irisMat);
    iris.scale.set(0.21 * E, 0.27 * E, 0.15);
    iris.position.set(x, -0.012, 0.435 + fz);
    head.add(iris);

    // 동공
    const pupil = new THREE.Mesh(GEO.blob, MAT_DARK);
    pupil.scale.set(0.11 * E, 0.14 * E, 0.13);
    pupil.position.set(x, -0.02, 0.462 + fz);
    head.add(pupil);

    // 하이라이트 — 이게 있어야 눈이 "반짝" 한다
    const hi = new THREE.Mesh(GEO.blob, MAT_SHINE);
    hi.scale.setScalar(0.10 * E);
    hi.position.set(x + s * 0.048, 0.078, 0.482 + fz);
    head.add(noShadow(hi));

    if (full) {
      const hi2 = new THREE.Mesh(GEO.blob, MAT_SHINE);
      hi2.scale.setScalar(0.056 * E);
      hi2.position.set(x - s * 0.052, -0.082, 0.472 + fz);
      head.add(noShadow(hi2));

      // 속눈썹
      const lash = new THREE.Mesh(GEO.blob, MAT_DARK);
      lash.scale.set(0.31 * E, 0.058, 0.17);
      lash.position.set(x, 0.158 * E, 0.385 + fz);
      lash.rotation.z = -s * 0.16;
      head.add(lash);

      const tip = new THREE.Mesh(GEO.cone, MAT_DARK);
      tip.scale.set(0.07, 0.19, 0.07);
      tip.position.set(x + s * 0.145, 0.168 * E, 0.345 + fz);
      tip.rotation.z = -s * 1.15;
      head.add(tip);
    }
  }
}

// -----------------------------------------------------------
//  머리 (얼굴 + 귀 + 보석 + 장식이 전부 여기 들어간다)
// -----------------------------------------------------------
function makeHead(def, full) {
  const head = new THREE.Group();
  head.position.y = HEAD_Y;

  const mat = bodyMat(def.color);
  const accent = def.accent ?? shade(def.color, -0.18);

  // 머리카락이 있는 친구는 머리통이 머리카락 색이 되고,
  // 얼굴만 앞으로 볼록 튀어나온다. (얼굴 부품도 그만큼 앞으로 민다)
  const hairy = !!def.hair;
  const fz = hairy ? FACE_Z : 0;

  const skull = new THREE.Mesh(GEO.ball, hairy ? bodyMat(def.hair) : mat);
  skull.scale.set(1.12, 1.06, 1.04);
  skull.castShadow = true;
  head.add(skull);

  if (hairy) {
    // 얼굴판이 머리통보다 앞으로 나오므로 테두리도 얼굴판에 두른다
    const face = makeFacePlate(def);
    head.add(face);
    if (full) head.add(makeOutline(face));
    head.userData.strands = addHair(head, def, full);
  } else if (full) {
    head.add(makeOutline(skull));
  }

  // 귀 — 머리카락 친구는 하얗고 동글동글한 귀
  for (const s of [-1, 1]) {
    if (hairy) {
      head.add(makePuffEar(def, s));
      continue;
    }
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

  addFairyEyes(head, def, full, fz);

  // 볼터치
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(GEO.blob, MAT_CHEEK);
    cheek.scale.set(0.19, 0.13, 0.08);
    cheek.position.set(s * 0.40, -0.16, 0.30 + fz);
    head.add(noShadow(cheek));
  }

  // 입
  const mouth = new THREE.Mesh(GEO.blob, MAT_DARK);
  mouth.scale.set(0.14, 0.085, 0.06);
  mouth.position.set(0, -0.215, 0.45 + fz);
  head.add(noShadow(mouth));

  // 이마 보석
  const gem = new THREE.Mesh(GEO.gem, glowMat(def.gem ?? 0xfff0a0));
  gem.scale.set(0.21, 0.31, 0.15);
  gem.position.set(0, 0.27, 0.395 + fz);
  head.add(noShadow(gem));

  // 머리 장식
  const deco = makeDeco(def.deco, def.decoColor);
  if (hairy) {
    // 머리카락 친구는 장식이 머리 위에 얹혀야 해서 살짝 앞으로 눕힌다
    deco.position.set(0, 0.46, 0.26);
    deco.rotation.x = -0.26;
    deco.scale.setScalar(1.2);
  } else {
    deco.position.y = 0.66;
    deco.scale.setScalar(1.3);
  }
  head.add(deco);

  return head;
}

// -----------------------------------------------------------
//  날개 (좌우 한 쌍씩, 반투명)
// -----------------------------------------------------------
function makeWings(def, full) {
  const mat = filmMat(def.wing ?? shade(def.color, 0.72));
  const pivots = [];

  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.10, 0.92, -0.32);
    pivot.userData.side = s;

    const up = new THREE.Mesh(GEO.blob, mat);
    up.scale.set(0.38, 0.74, 0.03);
    up.position.set(s * 0.32, 0.34, 0);
    up.rotation.z = -s * 0.42;
    pivot.add(noShadow(up));

    if (full) {
      const down = new THREE.Mesh(GEO.blob, mat);
      down.scale.set(0.28, 0.46, 0.03);
      down.position.set(s * 0.29, -0.12, -0.01);
      down.rotation.z = -s * 0.18;
      pivot.add(noShadow(down));
    }
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
    m.scale.setScalar(0.085);
    m.position.set(Math.cos(a) * 0.85, Math.sin(a * 1.7) * 0.25, Math.sin(a) * 0.85);
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

  // 몸통 (머리보다 작아야 2등신이 된다)
  const body = new THREE.Mesh(GEO.ball, mat);
  body.scale.set(0.60, 0.54, 0.56);
  body.position.y = 0.48;
  body.castShadow = true;
  g.add(body);
  if (full) g.add(makeOutline(body, 0.028));

  // 팔
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(GEO.limb, mat);
    arm.scale.set(0.15, 0.13, 0.15);
    arm.position.set(s * 0.31, 0.55, 0.02);
    arm.rotation.z = s * 0.8;
    arm.castShadow = true;
    g.add(arm);
  }

  // 발 (shoe 색을 주면 구두를 신는다)
  const footMat = def.shoe ? bodyMat(def.shoe) : mat;
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(GEO.blob, footMat);
    foot.scale.set(0.23, 0.15, 0.31);
    foot.position.set(s * 0.16, 0.115, 0.06);
    foot.castShadow = true;
    g.add(foot);
  }

  // 드레스 (dress 색을 주면 입는다)
  if (def.dress) addDress(g, def, full);

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

  // 날개
  const wings = makeWings(def, full);
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
    for (const w of wings) w.rotation.y = w.userData.side * (0.30 + flap * 0.40);

    head.rotation.z = Math.sin(tt * 1.7) * 0.06;
    if (head.userData.strands) swayHair(head.userData.strands, tt);
    head.position.y = HEAD_Y + Math.sin(tt * 2.6) * 0.018;
    tail.rotation.x = Math.sin(tt * 3.1) * 0.18;

    if (sparkles) {
      sparkles.rotation.y = tt * 1.4;
      sparkles.position.y = 1.0 + Math.sin(tt * 2) * 0.08;
    }
  };

  return g;
}
