// ===========================================================
//  요정 친구 얼굴 붙이기
//  얼굴 그림(character-facetex.js)을 머리 곡면에 딱 맞는
//  "구의 한 조각"에 입혀서 붙인다. 눈·볼·입이 전부 그림 한 장이다.
// ===========================================================
import * as THREE from 'three';
import { GEO, MAT_GLOSS, glowMat, noShadow } from './character-parts.js';
import { faceTexture } from './character-facetex.js';

// ★ 아이랑 같이 바꿔볼 값
const HEAD_R = [0.56, 0.53, 0.52];   // 머리 반지름 (가로, 세로, 앞뒤)
const FACE_W = 2.00;                 // 얼굴 그림이 감싸는 좌우 폭 (라디안)
const FACE_H = 1.25;                 // 얼굴 그림의 위아래 높이 (라디안)
const FACE_TOP = 1.00;               // 얼굴 그림이 시작하는 높이 (작을수록 위로)

// 머리 곡면에 딱 붙는 얼굴판 — 모든 캐릭터가 같은 도형을 나눠 쓴다
const FACE_GEO = new THREE.SphereGeometry(
  0.5, 48, 28,
  Math.PI / 2 - FACE_W / 2, FACE_W,   // 정면(+z)을 가운데 두고 좌우로
  FACE_TOP, FACE_H,
);

const _faceMat = new Map();
function faceMaterial(def) {
  const key = def.eye ?? 0;
  if (!_faceMat.has(key)) {
    _faceMat.set(key, new THREE.MeshBasicMaterial({
      map: faceTexture(def), transparent: true, depthWrite: false,
    }));
  }
  return _faceMat.get(key);
}

// -----------------------------------------------------------
//  머리 표면의 한 점 구하기
//  az: 정면에서 좌우로 돌아간 각도, el: 위아래 각도 (둘 다 도 단위)
// -----------------------------------------------------------
function surfacePoint(azDeg, elDeg) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  return new THREE.Vector3(
    HEAD_R[0] * Math.cos(el) * Math.sin(az),
    HEAD_R[1] * Math.sin(el),
    HEAD_R[2] * Math.cos(el) * Math.cos(az),
  );
}

/** 부품을 머리 표면에 납작하게 눕혀서 붙인다 (얼굴 곡면을 따라간다) */
export function attach(head, geo, mat, azDeg, elDeg, scale, sink = 0.55) {
  const pos = surfacePoint(azDeg, elDeg);
  const holder = new THREE.Object3D();
  holder.lookAt(pos);                     // 바깥쪽을 바라보게 돌린다
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.position.z = pos.length() - scale[2] * sink;
  holder.add(m);
  head.add(holder);
  return m;
}

// 머리 광택 — 애니 특유의 반들반들한 하이라이트
function addHeadShine(head) {
  noShadow(attach(head, GEO.blob, MAT_GLOSS, -18, 52, [0.34, 0.13, 0.09], 0.2));
  noShadow(attach(head, GEO.blob, MAT_GLOSS, 6, 44, [0.11, 0.09, 0.07], 0.2));
}

// -----------------------------------------------------------
//  얼굴 전체
// -----------------------------------------------------------
export function addFace(head, def, full) {
  // 얼굴 그림판 (머리보다 아주 살짝 크게 해서 머리에 파묻히지 않게)
  const face = new THREE.Mesh(FACE_GEO, faceMaterial(def));
  face.scale.set(HEAD_R[0] * 2.03, HEAD_R[1] * 2.03, HEAD_R[2] * 2.03);
  face.renderOrder = 2;
  head.add(noShadow(face));

  // 이마 보석 (이건 입체가 예뻐서 그대로 3D)
  const gem = new THREE.Mesh(GEO.gem, glowMat(def.gem ?? 0xfff0a0));
  gem.scale.set(0.21, 0.31, 0.15);
  gem.position.set(0, 0.345, 0.355);
  head.add(noShadow(gem));

  if (full) addHeadShine(head);
}
