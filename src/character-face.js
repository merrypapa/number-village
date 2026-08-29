// ===========================================================
//  요정 친구 얼굴 만들기 — 눈, 볼, 입, 앞머리
//  머리(구)의 표면에 부품을 "붙이는" 방식으로 만든다.
// ===========================================================
import * as THREE from 'three';
import {
  GEO, MAT_WHITE, MAT_DARK, MAT_CHEEK, MAT_SHINE,
  glowMat, noShadow, shade, MAT_GLOSS,
} from './character-parts.js';

// ★ 아이랑 같이 바꿔볼 값
export const EYE_SIZE = 1.0;      // 눈 크기 (1.2로 하면 왕눈이가 된다)
const HEAD_R = [0.56, 0.53, 0.52]; // 머리 반지름 (가로, 세로, 앞뒤)

// -----------------------------------------------------------
//  머리 표면의 한 점 구하기
//  az: 정면에서 좌우로 돌아간 각도, el: 위아래 각도 (둘 다 도 단위)
// -----------------------------------------------------------
function surfacePoint(azDeg, elDeg, r = 1) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  return new THREE.Vector3(
    HEAD_R[0] * r * Math.cos(el) * Math.sin(az),
    HEAD_R[1] * r * Math.sin(el),
    HEAD_R[2] * r * Math.cos(el) * Math.cos(az),
  );
}

/** 부품을 머리 표면에 "납작하게 눕혀서" 붙인다 (얼굴 곡면을 따라간다) */
export function attach(head, geo, mat, azDeg, elDeg, scale, sink = 0.55) {
  const pos = surfacePoint(azDeg, elDeg);
  const holder = new THREE.Object3D();
  holder.lookAt(pos);                     // 바깥쪽을 바라보게 돌린다
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.position.z = pos.length() - scale[2] * sink;   // 표면에 살짝 박히게
  holder.add(m);
  head.add(holder);
  return m;
}

// -----------------------------------------------------------
//  눈 한 쌍 — 테두리 + 흰자 + 2톤 홍채 + 동공 + 하이라이트 + 속눈썹
// -----------------------------------------------------------
function addEyes(head, def, full) {
  const E = EYE_SIZE;
  const base = def.eye ?? 0x5a3fa8;
  const irisMat = glowMat(base);
  const irisLo = glowMat(shade(base, 0.26));   // 아래쪽은 밝게 (눈이 맑아 보인다)

  for (const s of [-1, 1]) {
    const x = s * 0.255;

    const white = new THREE.Mesh(GEO.eye, MAT_WHITE);
    white.scale.set(0.29 * E, 0.37 * E, 0.16);
    white.position.set(x, 0, 0.40);
    head.add(noShadow(white));

    // 홍채 (위는 진하게)
    const iris = new THREE.Mesh(GEO.eye, irisMat);
    iris.scale.set(0.215 * E, 0.275 * E, 0.15);
    iris.position.set(x, -0.012, 0.432);
    head.add(noShadow(iris));

    // 홍채 아래쪽 밝은 부분
    const lo = new THREE.Mesh(GEO.eye, irisLo);
    lo.scale.set(0.155 * E, 0.10 * E, 0.15);
    lo.position.set(x, -0.086, 0.442);
    head.add(noShadow(lo));

    const pupil = new THREE.Mesh(GEO.blob, MAT_DARK);
    pupil.scale.set(0.105 * E, 0.135 * E, 0.13);
    pupil.position.set(x, -0.018, 0.462);
    head.add(noShadow(pupil));

    // 하이라이트 — 이게 있어야 눈이 "반짝" 한다
    const hi = new THREE.Mesh(GEO.blob, MAT_SHINE);
    hi.scale.setScalar(0.072 * E);
    hi.position.set(x + s * 0.062, 0.088, 0.482);
    head.add(noShadow(hi));

    if (full) {
      const hi2 = new THREE.Mesh(GEO.blob, MAT_SHINE);
      hi2.scale.setScalar(0.040 * E);
      hi2.position.set(x - s * 0.062, -0.090, 0.472);
      head.add(noShadow(hi2));

      // 눈 속 작은 별 하나
      const star = new THREE.Mesh(GEO.gem, MAT_SHINE);
      star.scale.set(0.05, 0.075, 0.04);
      star.position.set(x - s * 0.075, 0.035, 0.474);
      star.rotation.z = s * 0.3;
      head.add(noShadow(star));
    }

    // 위 눈꺼풀 라인 (속눈썹)
    const lash = new THREE.Mesh(GEO.blob, MAT_DARK);
    lash.scale.set(0.315 * E, 0.056, 0.17);
    lash.position.set(x, 0.168 * E, 0.383);
    lash.rotation.z = -s * 0.17;
    head.add(noShadow(lash));

    if (full) {
      const tip = new THREE.Mesh(GEO.cone, MAT_DARK);
      tip.scale.set(0.068, 0.185, 0.068);
      tip.position.set(x + s * 0.150, 0.175 * E, 0.345);
      tip.rotation.z = -s * 1.1;
      head.add(noShadow(tip));
    }
  }
}

// -----------------------------------------------------------
//  얼굴 전체
// -----------------------------------------------------------
function addHeadShine(head) {
  const shine = attach(head, GEO.blob, MAT_GLOSS, -18, 52, [0.34, 0.13, 0.09], 0.2);
  noShadow(shine);
  const small = attach(head, GEO.blob, MAT_GLOSS, 6, 44, [0.11, 0.09, 0.07], 0.2);
  noShadow(small);
}

export function addFace(head, def, full) {
  if (full) addHeadShine(head);
  addEyes(head, def, full);

  // 볼터치
  for (const s of [-1, 1]) attach(head, GEO.blob, MAT_CHEEK, s * 46, -17, [0.19, 0.13, 0.09]);

  // 입
  const mouth = new THREE.Mesh(GEO.blob, MAT_DARK);
  mouth.scale.set(0.145, 0.09, 0.06);
  mouth.position.set(0, -0.215, 0.45);
  head.add(noShadow(mouth));

  // 이마 보석
  const gem = new THREE.Mesh(GEO.gem, glowMat(def.gem ?? 0xfff0a0));
  gem.scale.set(0.21, 0.31, 0.15);
  gem.position.set(0, 0.28, 0.385);
  head.add(noShadow(gem));
}
