// ===========================================================
//  얼음공주 요정 만들기 (그림 char1.png 를 보고 만든 전용 구조)
//  ★ 다른 친구들(block/ping)과 뼈대가 다르다.
//    커다란 머리 + 옆으로 흩날리는 긴 머리카락 + 작은 몸 + 층층이 튜튜 치마
//
//  좌표 규칙: 모든 도형의 반지름이 0.5라서 scale 값의 절반이 실제 크기다.
// ===========================================================
import * as THREE from 'three';
import { GEO, glossMat, glowMat, noShadow, shade } from './character-parts.js';
import { makeDeco } from './character-deco.js';
import { addDollFace } from './character-face.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEAD_Y      = 1.30;   // 머리(얼굴 가운데) 높이
const HEIGHT      = 2.05;   // 이름표를 띄울 키
const HAIR_SWAY   = 0.09;   // 머리카락이 흩날리는 크기
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

/** 그림자를 만드는 부품 */
function solid(m) { m.castShadow = true; return m; }

// -----------------------------------------------------------
//  머리카락
//  1) 머리 전체를 덮는 덩어리  2) 이마를 덮는 앞머리
//  3) 좌우로 길게 흩날리는 머리 (끝은 분홍) — 이게 그림의 가장 큰 특징이다
// -----------------------------------------------------------
function addHair(head, def, full) {
  const hair = glossMat(def.hair);
  const tip  = glossMat(def.hairTip ?? shade(def.hair, 0.30));
  const wings = [];   // 좌우로 흩날리는 머리 (살랑살랑 움직인다)

  // 머리 덩어리 (얼굴보다 크고 뒤로 봉긋)
  head.add(solid(part(GEO.ball, hair, [0, 0.06, -0.12], [1.24, 1.20, 1.20])));

  // 앞머리 — 이마를 덮는 넓은 띠 + 아래로 내려오는 둥근 갈래
  head.add(solid(part(GEO.blob, hair, [0, 0.40, 0.20], [1.00, 0.50, 0.62])));
  for (const i of [-2, -1, 1, 2]) {
    head.add(part(GEO.blob, hair,
      [i * 0.175, 0.27 - Math.abs(i) * 0.06, 0.36 - Math.abs(i) * 0.05],
      [0.18, 0.26 - Math.abs(i) * 0.03, 0.14], [0, 0, -i * 0.22]));
  }
  // 얼굴 옆을 감싸는 갈래
  for (const s of [-1, 1]) {
    head.add(part(GEO.blob, hair, [s * 0.50, 0.02, 0.06], [0.22, 0.66, 0.34], [0, 0, s * 0.12]));
  }

  // 좌우로 흩날리는 긴 머리 — 덩어리를 밖으로 갈수록 작게 이어 붙인다
  for (const s of [-1, 1]) {
    const flow = new THREE.Group();
    flow.position.set(s * 0.32, 0.06, -0.16);
    flow.userData.side = s;

    flow.add(solid(part(GEO.ball, hair, [s * 0.14, -0.06, -0.02], [0.72, 0.92, 0.80])));
    flow.add(solid(part(GEO.ball, hair, [s * 0.30, -0.38, -0.06], [0.58, 0.76, 0.64])));
    flow.add(solid(part(GEO.ball, tip,  [s * 0.42, -0.66, -0.10], [0.44, 0.58, 0.48])));
    if (full) {
      flow.add(part(GEO.blob, tip, [s * 0.50, -0.90, -0.12], [0.30, 0.38, 0.33]));
      flow.add(part(GEO.cone, tip, [s * 0.56, -1.08, -0.13], [0.19, 0.26, 0.19], [0, 0, Math.PI + s * 0.35]));
    }
    head.add(flow);
    wings.push(flow);
  }

  return wings;
}

// -----------------------------------------------------------
//  머리 (머리카락 + 하얀 복슬 귀 + 얼굴 + 티아라)
// -----------------------------------------------------------
function makeHead(def, full) {
  const head = new THREE.Group();
  head.position.y = HEAD_Y;

  // 얼굴판 — 머리카락 덩어리 앞으로 볼록 튀어나온 살구빛 얼굴
  head.add(solid(part(GEO.ball, glossMat(def.color), [0, -0.03, 0.16], [1.03, 0.93, 0.90])));

  head.userData.hair = addHair(head, def, full);

  // 하얀 복슬복슬 귀
  for (const s of [-1, 1]) {
    head.add(solid(part(GEO.ball, glossMat(def.earColor ?? 0xfdfdff),
      [s * 0.48, 0.40, -0.02], [0.36, 0.44, 0.36], [0, 0, -s * 0.28])));
  }

  // 얼굴 (눈·코·입·볼터치·이마 보석)
  addDollFace(head, def, 0.06, full);

  // 티아라
  const deco = makeDeco(def.deco, def.decoColor, true);
  deco.position.set(0, 0.62, 0.16);
  deco.rotation.x = -0.28;
  deco.scale.setScalar(1.15);
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
    const mat   = t === 0 ? white : blue;
    const wide  = 0.68 + t * 0.15;      // 아래층일수록 넓게
    const y     = 0.60 - t * 0.10;
    g.add(solid(part(GEO.cone, mat, [0, y, 0], [wide, 0.30, wide * 0.96])));

    // 층 끝의 물결무늬 (프릴)
    if (!full) continue;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.22;
      g.add(part(GEO.blob, mat,
        [Math.sin(a) * wide * 0.47, y - 0.150, Math.cos(a) * wide * 0.45],
        [0.095, 0.055, 0.075]));
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

  // 윗옷 (아주 작다 — 그래서 머리가 커 보인다)
  g.add(solid(part(GEO.ball, white, [0, 0.80, 0], [0.46, 0.46, 0.44])));
  // 어깨 위로 살짝 드러난 목·어깨
  g.add(part(GEO.blob, skin, [0, 0.94, 0.02], [0.30, 0.20, 0.28]));

  // 팔 — 한쪽은 앞으로, 한쪽은 옆으로 (그림처럼 춤추는 자세)
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.21, 0.88, 0);
    arm.userData.side = s;
    arm.add(solid(part(GEO.limb, skin, [s * 0.14, -0.14, 0], [0.13, 0.16, 0.13], [0, 0, s * 0.9])));
    arm.add(part(GEO.blob, skin, [s * 0.27, -0.28, 0.02], 0.115));   // 손
    arm.rotation.z = -s * 0.35;
    arm.rotation.x = s * 0.25;
    g.add(arm);
    arms.push(arm);
  }

  // 가슴 무늬 (금색 문양)
  const gold = glowMat(def.emblem ?? 0xffc93c);
  g.add(noShadow(part(GEO.ring, gold, [0, 0.74, 0.21], [0.20, 0.20, 0.10])));
  g.add(noShadow(part(GEO.gem,  gold, [0, 0.74, 0.23], [0.085, 0.12, 0.05])));
  if (full) g.add(noShadow(part(GEO.cone, gold, [0, 0.82, 0.22], [0.055, 0.085, 0.04])));

  // 치마
  addSkirt(g, def, full);

  // 다리 + 구두
  const shoe = glossMat(def.shoe ?? 0xd6d8f5);
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.15, 0.34, 0);
    leg.userData.side = s;
    leg.add(solid(part(GEO.limb, skin, [0, -0.11, 0], [0.12, 0.10, 0.12])));
    leg.add(solid(part(GEO.blob, shoe, [0, -0.25, 0.04], [0.20, 0.15, 0.27])));
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

  // 애니메이션 — 둥실둥실 + 머리카락 살랑 + 팔다리 흔들기
  g.userData.animate = (g_, tt, moving) => {
    g_.position.y = moving
      ? Math.abs(Math.sin(tt * 6.5)) * HOP_HEIGHT
      : Math.sin(tt * 1.8) * FLOAT;

    head.rotation.z = Math.sin(tt * 1.5) * 0.05;
    head.position.y = HEAD_Y + Math.sin(tt * 2.4) * 0.02;

    // 머리카락은 몸이 움직일 때 더 크게 흩날린다
    const k = moving ? 2.2 : 1;
    for (const f of head.userData.hair) {
      f.rotation.z = f.userData.side * (0.06 + Math.sin(tt * 2.1) * HAIR_SWAY * k);
      f.rotation.y = Math.sin(tt * 1.6 + 1) * HAIR_SWAY * 0.8 * k;
    }

    const swing = moving ? Math.sin(tt * 6.5) : Math.sin(tt * 1.8) * 0.25;
    for (const a of arms) a.rotation.x = a.userData.side * 0.25 + swing * a.userData.side * 0.5;
    for (const l of legs) l.rotation.x = moving ? -swing * l.userData.side * 0.6 : 0;
  };

  return g;
}
