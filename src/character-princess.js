// ===========================================================
//  얼음공주 요정 만들기 (그림 char1.png 전용 뼈대)
//  ★ 다른 친구들(block/ping)과 뼈대가 완전히 다르다.
//    - 아주 큰 머리 + 작은 몸 (그림의 비율)
//    - 머리카락은 곡선을 따라 뽑은 관. 끝이 뾰족하지 않고 뭉툭하게 퍼진다
//    - 얼굴은 도형이 아니라 Canvas로 그린 그림 (character-facetex.js)
// ===========================================================
import * as THREE from 'three';
import { GEO, glossMat, makeStrand, shade } from './character-parts.js';
import { makeDeco } from './character-deco.js';
import { makeFaceDecal, makeEmblemDecal, FACE_GEO } from './character-facetex.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEAD_Y      = 1.28;   // 머리(얼굴 가운데) 높이
const HEIGHT      = 2.10;   // 이름표를 띄울 키
const FACE        = [1.17, 1.05, 1.06];   // 얼굴판 크기 (동글동글 아기 얼굴)
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
  const hair = glossMat(def.hair);
  const tipC = def.hairTip ?? shade(def.hair, 0.30);
  const tip  = glossMat(tipC);
  const flows = [];

  // 머리 덩어리 (매끈한 인형 머리)
  head.add(solid(part(GEO.ball, hair, [0, 0.06, -0.16], [1.40, 1.34, 1.34])));

  // 앞머리 — 이마 위를 덮는 매끈한 한 덩어리 + 가운데 가르마
  head.add(solid(part(GEO.ball, hair, [0, 0.50, 0.16], [1.34, 0.70, 0.92])));
  head.add(solid(part(GEO.ball, hair, [0, 0.40, 0.34], [0.80, 0.44, 0.44])));   // 가운데 앞머리
  for (const s of [-1, 1]) {
    // 관자놀이에서 자연스럽게 이어지는 옆머리 (한 덩어리로 보이게 크게 겹친다)
    head.add(solid(part(GEO.ball, hair, [s * 0.46, 0.30, 0.24], [0.72, 0.72, 0.52], [0, 0, -s * 0.22])));
    head.add(solid(part(GEO.ball, hair, [s * 0.66, 0.02, -0.06], [0.62, 1.14, 0.88])));
  }

  // 길게 늘어진 머리 — 사진처럼 굵고 둥글며 끝이 뭉툭하다
  const LOCKS = [
    { pts: [[0.56, 0.24, 0.14], [0.63, -0.14, 0.12], [0.64, -0.54, 0.06], [0.60, -0.92, 0.00]], r0: 0.24, r1: 0.30 },
    { pts: [[0.44, 0.28, -0.20], [0.60, -0.10, -0.24], [0.65, -0.50, -0.24], [0.61, -0.86, -0.20]], r0: 0.28, r1: 0.34 },
  ];
  for (const s of [-1, 1]) {
    const flow = new THREE.Group();
    flow.userData.side = s;
    for (const L of LOCKS) {
      const pts = L.pts.map(p => [p[0] * s, p[1], p[2]]);
      flow.add(makeStrand(pts, L.r0, L.r1, def.hair, tipC, full ? 36 : 16, full ? 14 : 8));
      const e = pts[pts.length - 1];
      flow.add(solid(part(GEO.ball, tip, [e[0], e[1] + 0.02, e[2]], L.r1 * 1.04)));
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
    const earMat = glossMat(def.earColor ?? 0xfdfdff);
    head.add(solid(part(GEO.ball, earMat, [s * 0.78, 0.56, -0.02], [0.32, 0.38, 0.32])));
    head.add(solid(part(GEO.ball, earMat, [s * 0.60, 0.76, -0.06], [0.28, 0.32, 0.28])));
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
  const blue = glossMat(def.skirt ?? shade(def.dress, -0.10));

  // 사진처럼 매끈하게 퍼지는 치마 (층을 아주 얕게 두 겹만)
  g.add(solid(part(GEO.cone, blue, [0, 0.52, 0], [0.84, 0.46, 0.82])));
  g.add(solid(part(GEO.cone, blue, [0, 0.39, 0], [0.96, 0.32, 0.94])));
  // 치마 끝을 둥글게 마감
  if (full) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.add(part(GEO.blob, blue,
        [Math.sin(a) * 0.45, 0.245, Math.cos(a) * 0.44], [0.20, 0.032, 0.10], [0, -a, 0]));
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

  g.add(solid(part(GEO.ball, white, [0, 0.72, 0], [0.48, 0.46, 0.44])));
  g.add(part(GEO.blob, skin, [0, 0.86, 0.02], [0.28, 0.18, 0.26]));

  // 팔
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.19, 0.80, 0);
    arm.userData.side = s;
    arm.add(solid(part(GEO.limb, skin, [s * 0.15, -0.06, 0], [0.15, 0.13, 0.15], [0, 0, s * 1.15])));
    arm.add(solid(part(GEO.ball, skin, [s * 0.30, -0.12, 0.02], 0.16)));
    arm.rotation.z = -s * 0.10;
    arm.rotation.x = 0.10;
    g.add(arm);
    arms.push(arm);
  }

  // 가슴 무늬 (금색 문양)
  const emblem = makeEmblemDecal(def);
  emblem.position.set(0, 0.72, 0);
  emblem.scale.set(0.48, 0.46, 0.44);
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
