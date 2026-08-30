// ===========================================================
//  요정 머리카락
//  가닥을 하나하나 만들지 않고, 큰 덩어리 몇 개로 실루엣을 만든다.
//  (참고한 장난감 렌더들도 실제로는 큰 덩어리 몇 개다)
// ===========================================================
import * as THREE from 'three';
import { GEO, bodyMat, noShadow, shade } from './character-parts.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 머리 덩어리 위치와 크기
//     [x, y, z, 가로, 세로, 앞뒤, 끝색섞기(0~1)]
//     x가 양수면 오른쪽. mirror:true면 왼쪽에도 똑같이 하나 더 만든다.
// -----------------------------------------------------------
const LOCKS = [
  // 정수리 볼륨
  { p: [0, 0.44, -0.04], s: [0.86, 0.50, 0.80], tip: 0.0, mirror: false },
  // 얼굴 옆으로 내려오는 머리
  { p: [0.58, -0.06, -0.26], s: [0.32, 0.94, 0.42], tip: 0.18, mirror: true },
  // 뒤로 길게 흐르는 머리 (3덩어리로 갈수록 가늘고 밝게)
  { p: [0.34, -0.16, -0.40], s: [0.54, 0.76, 0.58], tip: 0.10, mirror: true },
  { p: [0.42, -0.58, -0.60], s: [0.44, 0.58, 0.48], tip: 0.35, mirror: true },
  { p: [0.48, -0.92, -0.62], s: [0.32, 0.42, 0.36], tip: 0.62, mirror: true },
];

/**
 * 머리카락을 머리 그룹에 붙인다.
 * def.hair 로 색을 정할 수 있고, 없으면 몸 색을 진하게 쓴다.
 * def.hairTip 은 머리끝 색 (없으면 흰색 쪽으로 밝아진다).
 */
export function addHair(head, def) {
  const base = def.hair ?? shade(def.color, -0.22);
  const tipColor = def.hairTip ?? shade(def.color, 0.72);

  for (const lock of LOCKS) {
    const sides = lock.mirror ? [-1, 1] : [0];
    for (const s of sides) {
      const dir = s === 0 ? 1 : s;
      const m = new THREE.Mesh(GEO.ball, bodyMat(shade2(base, tipColor, lock.tip)));
      m.position.set(lock.p[0] * dir, lock.p[1], lock.p[2]);
      m.scale.set(lock.s[0], lock.s[1], lock.s[2]);
      m.castShadow = true;
      head.add(m);
    }
  }
}

/** 두 색을 섞는다 (머리끝으로 갈수록 밝아지게) */
function shade2(a, b, t) {
  if (t <= 0) return a;
  const c = new THREE.Color(a);
  return c.lerp(new THREE.Color(b), t).getHex();
}
