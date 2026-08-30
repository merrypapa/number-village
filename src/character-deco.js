// ===========================================================
//  요정 친구 머리 장식
//  ★ 새 장식을 만들려면 아래 DECO 객체에 함수 하나만 추가하면 된다.
//    그리고 characters.js에서 deco:'이름' 으로 쓰면 끝.
// ===========================================================
import * as THREE from 'three';
import { GEO, glowMat, glossMat, noShadow } from './character-parts.js';

// ★ 아이랑 같이 바꿔볼 색
const GOLD  = 0xffd95e;
const PINK  = 0xff7ab8;
const WATER = 0x8fd6ff;
const GREEN = 0x7ed957;
const CREAM = 0xfff4d6;

/** 작은 부품 하나 만들기 (도형, 색, 위치, 크기, 회전) */
function part(geo, color, pos, scale, rot) {
  const m = new THREE.Mesh(geo, glowMat(color));
  m.position.set(pos[0], pos[1], pos[2]);
  if (Array.isArray(scale)) m.scale.set(scale[0], scale[1], scale[2]);
  else m.scale.setScalar(scale);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

// -----------------------------------------------------------
//  장식 종류들
// -----------------------------------------------------------
export const DECO = {
  // 별 — 얇은 원뿔 5개를 빙 둘러 뾰족하게
  star(color = GOLD) {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = part(GEO.cone, color, [Math.sin(a) * 0.11, Math.cos(a) * 0.11, 0], [0.10, 0.24, 0.07]);
      spike.rotation.z = -a;
      g.add(spike);
    }
    g.add(part(GEO.blob, color, [0, 0, 0], [0.17, 0.17, 0.08]));
    return g;
  },

  // 하트 — 위에 동그라미 두 개, 아래에 뒤집은 원뿔
  heart(color = PINK) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) g.add(part(GEO.blob, color, [s * 0.09, 0.09, 0], [0.13, 0.13, 0.08]));
    g.add(part(GEO.cone, color, [0, -0.05, 0], [0.25, 0.26, 0.15], [0, 0, Math.PI]));
    return g;
  },

  // 물방울
  drop(color = WATER) {
    const g = new THREE.Group();
    g.add(part(GEO.blob, color, [0, -0.03, 0], [0.21, 0.19, 0.19]));
    g.add(part(GEO.cone, color, [0, 0.14, 0], [0.19, 0.26, 0.19]));
    return g;
  },

  // 리본
  ribbon(color = PINK) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      g.add(part(GEO.cone, color, [s * 0.17, 0, 0], [0.17, 0.24, 0.13], [0, 0, s * Math.PI / 2]));
    }
    g.add(part(GEO.blob, color, [0, 0, 0], 0.13));
    return g;
  },

  // 잎사귀
  leaf(color = GREEN) {
    const g = new THREE.Group();
    const l = part(GEO.blob, color, [0.12, 0.05, 0], [0.13, 0.06, 0.30]);
    l.rotation.z = 0.55;
    g.add(l);
    g.add(part(GEO.cyl, 0x9c7a4a, [0, -0.06, 0], [0.025, 0.16, 0.025]));
    return g;
  },

  // 왕관 — 고리 위에 뾰족뾰족
  crown(color = GOLD) {
    const g = new THREE.Group();
    const ring = part(GEO.ring, color, [0, 0, 0], 0.5, [Math.PI / 2, 0, 0]);
    g.add(ring);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.add(part(GEO.cone, color, [Math.sin(a) * 0.19, 0.10, Math.cos(a) * 0.19], [0.09, 0.20, 0.09]));
    }
    return g;
  },

  // 티아라 — 구슬을 이어 붙여 만든 공주님 왕관
  //  (이마 띠 + 구슬 아치 3개 + 가운데 물방울 보석)
  tiara(color = 0xf0b8d8) {
    const g = new THREE.Group();
    const silver = 0xfff2fa;

    // 이마를 감싸는 띠 — 구슬을 완만한 곡선으로 늘어놓는다
    for (let i = 0; i <= 16; i++) {
      const t = i / 16 - 0.5;                 // -0.5 ~ 0.5
      g.add(part(GEO.blob, i % 2 ? silver : color,
        [t * 0.62, -0.04 - t * t * 0.46, 0], 0.060));
    }

    // 구슬 아치 3개 (가운데가 제일 크다)
    const arches = [[0, 0.17], [-0.185, 0.105], [0.185, 0.105]];
    for (const [cx, h] of arches) {
      for (let i = 0; i <= 7; i++) {
        const a = Math.PI * (i / 7);
        g.add(part(GEO.blob, color,
          [cx + Math.cos(a) * (h * 0.68), -0.03 + Math.sin(a) * h, 0], 0.055));
      }
    }

    // 아치 꼭대기 작은 보석
    g.add(part(GEO.gem, 0x9fe6ff, [-0.185, 0.105, 0.01], [0.055, 0.075, 0.04]));
    g.add(part(GEO.gem, 0x9fe6ff, [ 0.185, 0.105, 0.01], [0.055, 0.075, 0.04]));

    // 가운데 물방울 보석
    g.add(part(GEO.blob, 0x8be3ff, [0, 0.16, 0.03], [0.105, 0.105, 0.07]));
    g.add(part(GEO.cone, 0x8be3ff, [0, 0.235, 0.03], [0.085, 0.125, 0.055]));
    return g;
  },

  // 초승달
  moon(color = 0xfff0a8) {
    const g = new THREE.Group();
    const m = part(GEO.crescent, color, [0, 0.02, 0], 0.34);
    m.rotation.set(0, 0, -0.6);
    g.add(m);
    return g;
  },

  // 보석
  gem(color = 0x8be3ff) {
    const g = new THREE.Group();
    g.add(part(GEO.gem, color, [0, 0.03, 0], [0.18, 0.28, 0.18]));
    return g;
  },

  // 꽃
  flower(color = 0xffc2e8) {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(part(GEO.blob, color, [Math.sin(a) * 0.14, Math.cos(a) * 0.14, 0], [0.11, 0.11, 0.06]));
    }
    g.add(part(GEO.blob, GOLD, [0, 0, 0.03], [0.09, 0.09, 0.06]));
    return g;
  },

  // 사탕
  candy(color = 0xff9ec4) {
    const g = new THREE.Group();
    g.add(part(GEO.blob, color, [0, 0, 0], 0.20));
    for (const s of [-1, 1]) {
      g.add(part(GEO.cone, CREAM, [s * 0.18, 0, 0], [0.11, 0.14, 0.11], [0, 0, s * Math.PI / 2]));
    }
    return g;
  },

  // 구름
  cloud(color = 0xffffff) {
    const g = new THREE.Group();
    g.add(part(GEO.blob, color, [0, 0, 0], [0.20, 0.15, 0.15]));
    for (const s of [-1, 1]) g.add(part(GEO.blob, color, [s * 0.14, -0.03, 0], [0.13, 0.11, 0.12]));
    return g;
  },
};

/**
 * 머리 장식을 만든다.
 * kind: DECO의 이름 중 하나, color: 없으면 장식마다 정해진 기본색
 */
export function makeDeco(kind, color, glossy = false) {
  const build = DECO[kind];
  const g = build ? build(color) : new THREE.Group();
  g.traverse(o => {
    if (!o.isMesh) return;
    noShadow(o);
    // 반질반질한 친구는 장식도 반질반질하게
    if (glossy) o.material = glossMat(o.material.color.getHex());
  });
  return g;
}

/** 꼬리 끝에 다는 작은 장식 (머리 장식을 작게 줄여서 재활용) */
export function makeTailCharm(kind, color, glossy = false) {
  const g = makeDeco(kind, color, glossy);
  g.scale.setScalar(0.55);
  return g;
}
