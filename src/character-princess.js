// ===========================================================
//  얼음공주 요정 만들기 (그림 char1.png 전용 뼈대)
//  ★ 다른 친구들(block/ping)과 뼈대가 완전히 다르다.
//    - 아주 큰 머리 + 작은 몸 (그림의 비율)
//    - 머리카락은 곡선을 따라 뽑은 관. 끝이 뾰족하지 않고 뭉툭하게 퍼진다
//    - 얼굴은 도형이 아니라 Canvas로 그린 그림 (character-facetex.js)
// ===========================================================
import * as THREE from 'three';
import { GEO, glossMat, glossMapMat, makeStrand, shade } from './character-parts.js';
import { makeDeco } from './character-deco.js';
import { makeFaceDecal, makeEmblemDecal, FACE_GEO, PETAL_GEO, stripeTexture } from './character-facetex.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEAD_Y      = 1.28;   // 머리(얼굴 가운데) 높이
const HEIGHT      = 2.10;   // 이름표를 띄울 키
const FACE        = [1.20, 0.99, 1.02];   // 얼굴판 크기 (가로로 넓적한 얼굴)
const FACE_POS    = [0, -0.03, 0.14];
const HAIR_SWAY   = 0.08;   // 머리카락이 흩날리는 크기
const SKIRT_TIERS = 3;      // 치마 층수
const HOP_HEIGHT  = 0.26;   // 걸을 때 통통 튀는 높이
const FLOAT       = 0.05;   // 가만히 있을 때 둥실둥실 뜨는 크기

/** 부품 하나 만들기 (도형, 재료, 위치, 크기, 회전) */
function part(geo, mat, pos, scale, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (Array.isArray(scale)) m.scale.set(scale[0], scale[1], scale[2]);
  else m.scale.setScalar(scale);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}
function solid(m) { m.castShadow = true; return m; }

// -----------------------------------------------------------
//  머리카락
//  1) 머리를 덮는 큰 덩어리 2) 이마를 덮는 앞머리
//  3) 좌우로 길게 흘러내리는 머리 — 곡선을 따라 뽑고 끝은 뭉툭하게 퍼진다
// -----------------------------------------------------------
function addHair(head, def, full) {
  const grooveV = stripeTexture(true);    // 세로 결 (머리 덩어리)
  const grooveH = stripeTexture(false);   // 가로 결 (긴 머리 가닥)
  const hair = glossMapMat(def.hair, grooveV);
  const tipC = def.hairTip ?? shade(def.hair, 0.30);
  const tip  = glossMat(tipC);
  const flows = [];

  // 머리 덩어리 (결이 파인 매끈한 덩어리)
  head.add(solid(part(GEO.ball, hair, [0, 0.06, -0.16], [1.40, 1.34, 1.34])));

  // 앞머리 — 이마 위쪽만 덮는다 (이마가 넓어야 아기 얼굴이 된다)
  //  덩어리들이 서로 충분히 겹쳐야 매끈한 한 덩어리로 보인다
  head.add(solid(part(GEO.ball, hair, [0, 0.52, 0.20], [1.24, 0.58, 0.80])));
  head.add(solid(part(GEO.ball, hair, [0, 0.36, 0.40], [0.40, 0.36, 0.26])));   // 가운데 뾰족한 부분
  for (const s of [-1, 1]) {
    head.add(solid(part(GEO.ball, hair, [s * 0.40, 0.40, 0.34], [0.58, 0.46, 0.34], [0, 0, -s * 0.30])));
    // 관자놀이~볼 옆을 감싸며 내려오는 앞머리
    head.add(solid(part(GEO.ball, hair, [s * 0.64, 0.10, 0.18], [0.40, 0.78, 0.44], [0, 0, s * 0.12])));
    // 얼굴 옆을 폭신하게 감싸는 덩어리 (가닥들이 이 위에 얹힌다)
    head.add(solid(part(GEO.ball, hair, [s * 0.62, -0.10, -0.16], [0.66, 1.10, 0.90])));
  }

  // 좌우로 흘러내리는 긴 머리 — 세 가닥이 겹쳐 한 덩어리가 된다
  const LOCKS = [
    { pts: [[0.60, 0.34, 0.16], [0.70, 0.02, 0.14], [0.70, -0.32, 0.08], [0.64, -0.64, 0.02]], r0: 0.15, r1: 0.20 },
    { pts: [[0.46, 0.38, -0.02], [0.68, 0.10, -0.06], [0.74, -0.26, -0.08], [0.70, -0.64, -0.06]], r0: 0.19, r1: 0.25 },
    { pts: [[0.38, 0.36, -0.24], [0.68, 0.12, -0.28], [0.80, -0.24, -0.28], [0.76, -0.62, -0.24]], r0: 0.22, r1: 0.29 },
  ];
  for (const s of [-1, 1]) {
    const flow = new THREE.Group();
    flow.userData.side = s;
    for (const L of LOCKS) {
      const pts = L.pts.map(p => [p[0] * s, p[1], p[2]]);
      flow.add(makeStrand(pts, L.r0, L.r1, def.hair, tipC,
        full ? 40 : 18, full ? 12 : 7, grooveH));
      // 끝을 동그랗게 막아 뭉툭하게
      const e = pts[pts.length - 1];
      flow.add(solid(part(GEO.ball, tip, [e[0], e[1] + 0.02, e[2]], L.r1 * 1.02)));
    }
    // 머리끝 반짝이
    if (full) {
      for (let i = 0; i < 4; i++) {
        const a = i * 1.9;
        head.add(part(GEO.gem, glossMat(0xffffff),
          [s * (0.60 + Math.cos(a) * 0.16), -0.52 + Math.sin(a) * 0.16, -0.10 + Math.sin(a * 2) * 0.14], 0.035));
      }
    }
    head.add(flow);
    flows.push(flow);
  }

  return flows;
}

// -----------------------------------------------------------
//  머리 (머리카락 + 하얀 꽃잎 귀 + 얼굴 그림 + 티아라)
// -----------------------------------------------------------
function makeHead(def, full) {
  const head = new THREE.Group();
  head.position.y = HEAD_Y;

  // 얼굴판 (살구빛) + 그 위에 딱 맞는 얼굴 그림
  head.add(solid(part(FACE_GEO, glossMat(def.color), FACE_POS, FACE)));
  const face = makeFaceDecal(def);
  face.position.set(FACE_POS[0], FACE_POS[1], FACE_POS[2]);
  face.scale.set(FACE[0], FACE[1], FACE[2]);
  head.add(face);

  head.userData.hair = addHair(head, def, full);

  // 하얀 꽃잎 모양 귀
  for (const s of [-1, 1]) {
    head.add(solid(part(PETAL_GEO, glossMat(def.earColor ?? 0xfdfdff),
      [s * 0.76, 0.44, 0.10], [0.44, 0.70, 0.30], [0.24, -s * 0.30, -s * 0.60])));
  }

  // 티아라
  const deco = makeDeco(def.deco, def.decoColor, true);
  deco.position.set(0, 0.80, 0.14);
  deco.rotation.x = -0.26;
  deco.scale.setScalar(1.25);
  head.add(deco);

  return head;
}

// -----------------------------------------------------------
//  층층이 겹친 튜튜 치마 (아래로 갈수록 넓어지고 끝은 물결무늬)
// -----------------------------------------------------------
function addSkirt(g, def, full) {
  const white = glossMat(def.dress);
  const blue  = glossMat(def.skirt ?? shade(def.dress, -0.10));

  for (let t = 0; t < SKIRT_TIERS; t++) {
    const mat  = t === 0 ? white : blue;
    const wide = 0.56 + t * 0.16;
    const y    = 0.58 - t * 0.070;
    g.add(solid(part(GEO.cone, mat, [0, y, 0], [wide, 0.28, wide * 0.96])));

    if (!full) continue;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.2;
      g.add(part(GEO.blob, mat,
        [Math.sin(a) * wide * 0.45, y - 0.132, Math.cos(a) * wide * 0.435],
        [0.30, 0.026, 0.15], [0, -a, 0]));
    }
  }
}

// -----------------------------------------------------------
//  작은 몸 (윗옷 · 팔 · 다리 · 구두 · 가슴 무늬)
// -----------------------------------------------------------
function makeBody(g, def, full) {
  const skin  = glossMat(def.color);
  const white = glossMat(def.dress);
  const arms  = [];

  g.add(solid(part(GEO.ball, white, [0, 0.72, 0], [0.42, 0.42, 0.40])));
  g.add(part(GEO.blob, skin, [0, 0.86, 0.02], [0.28, 0.18, 0.26]));

  // 팔
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.19, 0.80, 0);
    arm.userData.side = s;
    arm.add(solid(part(GEO.limb, skin, [s * 0.13, -0.13, 0], [0.12, 0.15, 0.12], [0, 0, s * 0.9])));
    arm.add(part(GEO.blob, skin, [s * 0.25, -0.26, 0.02], 0.105));
    // 한쪽 팔은 위로, 한쪽은 아래로 (비대칭 자세)
    arm.rotation.z = -s * 0.30 + (s > 0 ? -0.45 : 0.12);
    arm.rotation.x = s * 0.22;
    g.add(arm);
    arms.push(arm);
  }

  // 가슴 무늬 (금색 문양)
  const emblem = makeEmblemDecal(def);
  emblem.position.set(0, 0.72, 0);
  emblem.scale.set(0.42, 0.42, 0.40);
  g.add(emblem);

  addSkirt(g, def, full);

  // 다리 + 구두
  const shoe = glossMat(def.shoe ?? 0xd6d8f5);
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.13, 0.28, 0);
    leg.userData.side = s;
    leg.rotation.x = s > 0 ? -0.22 : 0.10;   // 한 다리는 살짝 앞으로
    leg.add(solid(part(GEO.limb, skin, [0, -0.09, 0], [0.11, 0.09, 0.11])));
    leg.add(solid(part(GEO.blob, shoe, [0, -0.21, 0.04], [0.18, 0.14, 0.25])));
    g.add(leg);
    legs.push(leg);
  }

  return { arms, legs };
}

// -----------------------------------------------------------
//  얼음공주 요정 한 마리 완성
// -----------------------------------------------------------
export function makePrincess(def, detail = 'full') {
  const full = detail === 'full';
  const g = new THREE.Group();

  const { arms, legs } = makeBody(g, def, full);
  const head = makeHead(def, full);
  g.add(head);

  g.userData.height = HEIGHT;

  g.userData.animate = (g_, tt, moving) => {
    g_.position.y = moving
      ? Math.abs(Math.sin(tt * 6.5)) * HOP_HEIGHT
      : Math.sin(tt * 1.8) * FLOAT;

    head.rotation.z = Math.sin(tt * 1.5) * 0.05;
    head.position.y = HEAD_Y + Math.sin(tt * 2.4) * 0.02;

    // 머리카락은 움직일 때 더 크게 흩날린다
    const k = moving ? 2.2 : 1;
    for (const f of head.userData.hair) {
      f.rotation.z = f.userData.side * (0.05 + Math.sin(tt * 2.1) * HAIR_SWAY * k);
      f.rotation.y = Math.sin(tt * 1.6 + 1) * HAIR_SWAY * 0.8 * k;
    }

    const swing = moving ? Math.sin(tt * 6.5) : Math.sin(tt * 1.8) * 0.25;
    for (const a of arms) a.rotation.x = a.userData.side * 0.22 + swing * a.userData.side * 0.5;
    for (const l of legs) l.rotation.x = moving ? -swing * l.userData.side * 0.6 : 0;
  };

  return g;
}
