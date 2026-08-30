// ===========================================================
//  요정 친구 머리카락 · 드레스 · 구두
//  ★ characters.js에서 hair(머리색) / dress(드레스색) 값을 주면
//    이 파일의 부품들이 자동으로 붙는다. 값을 안 주면 아무것도 안 붙는다.
//    그래서 다른 친구들은 예전 모습 그대로다.
// ===========================================================
import * as THREE from 'three';
import { GEO, bodyMat, glowMat, noShadow, shade } from './character-parts.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const FACE_Z    = 0.04;   // 머리카락이 있으면 얼굴 부품을 이만큼 앞으로 민다
const STRAND_SWAY      = 0.13;   // 옆머리가 살랑거리는 크기
const STRAND_SPEED     = 1.6;    // 옆머리가 살랑거리는 속도
const RUFFLE_COUNT     = 9;      // 치마 끝 프릴 개수

// -----------------------------------------------------------
//  도우미 — 도형 하나 만들기
// -----------------------------------------------------------
function piece(geo, mat, pos, scale, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (Array.isArray(scale)) m.scale.set(scale[0], scale[1], scale[2]);
  else m.scale.setScalar(scale);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

// -----------------------------------------------------------
//  얼굴판 — 머리카락 덩어리 앞쪽에 붙는 살구빛 얼굴
//  (머리 전체가 머리카락 색이 되고, 얼굴만 앞으로 볼록 튀어나온다)
// -----------------------------------------------------------
export function makeFacePlate(def) {
  const face = piece(GEO.ball, bodyMat(def.color), [0, -0.03, 0.10], [0.96, 0.92, 0.92]);
  face.castShadow = true;
  return face;
}

// -----------------------------------------------------------
//  머리카락
//  1) 뒷머리 덩어리  2) 앞머리(뾰족뾰족)  3) 길게 늘어진 옆머리 두 갈래
//  옆머리는 살랑거려야 해서 그룹으로 만들어 돌려준다.
// -----------------------------------------------------------
export function addHair(head, def, full) {
  const hairMat = bodyMat(def.hair);
  const tipMat  = bodyMat(def.hairTip ?? shade(def.hair, 0.35));
  const strands = [];

  // --- 뒷머리 (머리 뒤로 봉긋하게) ---
  const back = piece(GEO.ball, hairMat, [0, 0.02, -0.30], [0.95, 0.88, 0.74]);
  back.castShadow = true;
  head.add(back);

  // 뒷머리 끝은 분홍빛으로 (그라데이션 흉내)
  head.add(piece(GEO.blob, tipMat, [0, -0.54, -0.32], [0.52, 0.32, 0.44]));

  // --- 앞머리 — 이마 위에 뾰족한 갈래 4개 (가운데는 보석이 보이게 비운다) ---
  for (const i of [-2, -1, 1, 2]) {
    const x = i * 0.155;
    const bang = piece(GEO.cone, hairMat,
      [x, 0.30 - Math.abs(i) * 0.05, 0.40 - Math.abs(i) * 0.06],
      [0.19, 0.44 - Math.abs(i) * 0.06, 0.14],
      [0.30, 0, Math.PI + i * 0.18]);
    head.add(bang);
  }
  // 앞머리 뿌리 (이마 위를 덮는 띠)
  head.add(piece(GEO.blob, hairMat, [0, 0.44, 0.14], [0.92, 0.42, 0.50]));

  // --- 옆머리 두 갈래 (길게 흘러내린다) ---
  for (const s of [-1, 1]) {
    const strand = new THREE.Group();
    strand.position.set(s * 0.50, 0.18, -0.16);
    strand.userData.side = s;

    strand.add(piece(GEO.blob, hairMat, [s * 0.04, -0.22, 0],     [0.30, 0.52, 0.29]));
    strand.add(piece(GEO.blob, hairMat, [s * 0.08, -0.58, -0.02], [0.26, 0.44, 0.25]));
    strand.add(piece(GEO.blob, tipMat,  [s * 0.12, -0.86, -0.04], [0.21, 0.34, 0.20]));
    if (full) {
      strand.add(piece(GEO.cone, tipMat, [s * 0.15, -1.04, -0.05], [0.13, 0.20, 0.13], [0, 0, Math.PI]));
    }
    strand.traverse(o => { if (o.isMesh) o.castShadow = true; });
    head.add(strand);
    strands.push(strand);
  }

  return strands;
}

/** 옆머리 살랑살랑 (매 프레임 부른다) */
export function swayHair(strands, t) {
  for (const st of strands) {
    st.rotation.z = st.userData.side * Math.sin(t * STRAND_SPEED) * STRAND_SWAY;
    st.rotation.x = Math.sin(t * STRAND_SPEED * 0.7 + 1) * STRAND_SWAY * 0.5;
  }
}

// -----------------------------------------------------------
//  하얀 복슬복슬 귀 (원뿔 대신 동글동글한 귀)
// -----------------------------------------------------------
export function makePuffEar(def, side) {
  const ear = piece(GEO.ball, bodyMat(def.earColor ?? 0xffffff),
    [side * 0.50, 0.30, -0.06], [0.40, 0.46, 0.36], [0, 0, -side * 0.30]);
  ear.castShadow = true;
  return ear;
}

// -----------------------------------------------------------
//  드레스 — 윗옷 + 퍼지는 치마 + 프릴 + 가슴 무늬
//  몸통을 감싸도록 몸통보다 살짝 크게 만든다.
// -----------------------------------------------------------
export function addDress(g, def, full) {
  const topMat   = bodyMat(def.dress);
  const skirtMat = bodyMat(def.skirt ?? shade(def.dress, -0.10));

  // 윗옷 (어깨~허리)
  const top = piece(GEO.ball, topMat, [0, 0.46, 0], [0.64, 0.52, 0.60]);
  top.castShadow = true;
  g.add(top);

  // 치마 (아래로 갈수록 넓어지는 원뿔)
  const skirt = piece(GEO.cone, skirtMat, [0, 0.30, 0], [1.06, 0.52, 1.02]);
  skirt.castShadow = true;
  g.add(skirt);

  // 치마 끝 프릴 — 동글동글한 덩어리를 빙 둘러 붙인다
  if (full) {
    for (let i = 0; i < RUFFLE_COUNT; i++) {
      const a = (i / RUFFLE_COUNT) * Math.PI * 2;
      g.add(piece(GEO.blob, topMat,
        [Math.sin(a) * 0.50, 0.09, Math.cos(a) * 0.48], [0.24, 0.15, 0.20]));
    }
  }

  // 가슴 무늬 (반짝이는 금색 문양)
  const emblemMat = glowMat(def.emblem ?? 0xffc93c);
  g.add(noShadow(piece(GEO.gem, emblemMat, [0, 0.40, 0.34], [0.09, 0.12, 0.05])));
  g.add(noShadow(piece(GEO.ring, emblemMat, [0, 0.40, 0.33], [0.17, 0.17, 0.10]))),
  g.add(noShadow(piece(GEO.blob, emblemMat, [0, 0.28, 0.33], [0.05, 0.05, 0.03])));
}
