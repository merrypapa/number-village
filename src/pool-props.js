// ===========================================================
//  🏊 수영장 장식 모양 — 오리 튜브 · 야자수 · 파라솔 · 선탠 의자 · 안전요원 의자 · 샤워기
//  (수영장 자체와 타는 규칙은 src/pool.js)
// ===========================================================
import * as THREE from 'three';
import { part } from './castle-props.js';

// ★ 수영장 색깔 — 아이랑 같이 바꿔볼 값
export const W = {
  water: 0x5ccfff, deep: 0x2b9be0, rim: 0xfff8ec, tile: 0xffe9c2,
  pole: 0xfff4f4, red: 0xff6b6b, yellow: 0xffd93d, orange: 0xffa733,
  pink: 0xff8fc0, mint: 0x7ee0c8, sky: 0x9ad8ff, trunk: 0xb27a4a, leaf: 0x58c46a,
  wood: 0xd9a066, white: 0xffffff,
};

// -----------------------------------------------------------
//  🦆 오리 튜브 · 🌴 야자수 · ⛱ 파라솔 · 🛋 선탠 의자 · 🪑 안전요원 의자
// -----------------------------------------------------------
export function makeDuckFloat() {
  const g = new THREE.Group();
  g.add(part('cyl', W.yellow, 0, 0.2, 0, 3.6, 0.7, 3.6));          // 튜브 (납작한 원판)
  g.add(part('cyl', W.water, 0, 0.22, 0, 2.0, 0.72, 2.0));         // 가운데 구멍(물 색)
  g.add(part('ball', W.yellow, 0, 1.1, 1.9, 1.3));                 // 머리 (앞쪽 +z)
  const beak = part('cone', W.orange, 0, 1.0, 2.75, 0.6, 0.7, 0.6);
  beak.rotation.x = Math.PI / 2;                                   // ★ add()는 그룹을 돌려주니 먼저 돌리고 넣는다
  g.add(beak);
  for (const sx of [-1, 1]) g.add(part('ball', 0x333333, sx * 0.35, 1.4, 2.45, 0.22));
  return g;
}

export function makePalm() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = part('cyl', W.trunk, i * 0.35, 1.0 + i * 1.9, 0, 0.9 - i * 0.1, 2.1, 0.9 - i * 0.1);
    seg.rotation.z = -0.18;
    g.add(seg);
  }
  //  잎 7장 — 꼭대기에서 사방으로 뻗고 끝이 아래로 처진다
  for (let i = 0; i < 7; i++) {
    const pivot = new THREE.Group();
    pivot.position.set(1.4, 8.2, 0);
    pivot.rotation.y = (i / 7) * Math.PI * 2;
    const leaf = part('box', W.leaf, 0, 0, 2.0, 0.9, 0.08, 4.6);
    leaf.rotation.x = 0.35;
    pivot.add(leaf);
    g.add(pivot);
  }
  g.add(part('ball', W.trunk, 1.4, 7.9, 0, 0.9));
  return g;
}

export function makeParasol(color) {
  const g = new THREE.Group();
  g.add(part('cyl', W.pole, 0, 2.0, 0, 0.16, 4.0, 0.16));
  g.add(part('cone', color, 0, 4.4, 0, 5.0, 1.4, 5.0));
  g.add(part('cone', W.white, 0, 4.9, 0, 3.0, 0.9, 3.0));
  return g;
}

export function makeSunbed(color) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 0.75, 0, 2.2, 0.3, 4.4));            // 눕는 판 (앞쪽 -z 가 발)
  const back = part('box', color, 0, 1.55, 1.9, 2.2, 0.28, 2.0);    // 등받이 (뒤로 젖혀 있다)
  back.rotation.x = -1.05;
  g.add(back);
  for (const sx of [-1, 1]) for (const sz of [-1.6, 1.6]) g.add(part('cyl', W.pole, sx * 0.9, 0.3, sz, 0.16, 0.6, 0.16));
  return g;
}

export function makeGuardChair() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(part('cyl', W.white, sx * 0.9, 1.9, sz * 0.9, 0.2, 3.8, 0.2));
  g.add(part('box', W.red, 0, 3.9, 0, 2.4, 0.3, 2.4));
  g.add(part('box', W.red, 0, 4.9, -1.05, 2.4, 1.8, 0.3));
  g.add(part('cyl', W.pole, 0, 5.5, 0, 0.14, 4.0, 0.14));
  g.add(part('cone', W.red, 0, 7.8, 0, 4.2, 1.2, 4.2));
  const buoy = part('torus', W.orange, 0, 4.7, 1.1, 1.8, 1.8, 1.8);
  g.add(buoy);
  return g;
}

export function makeShower() {
  const g = new THREE.Group();
  g.add(part('cyl', W.pole, 0, 2.0, 0, 0.18, 4.0, 0.18));
  g.add(part('cyl', W.sky, 0, 3.9, 0.7, 1.2, 0.2, 1.2));
  g.add(part('box', W.pole, 0, 3.9, 0.35, 0.16, 0.16, 0.7));
  g.add(part('cyl', W.sky, 0, 0.06, 0, 2.6, 0.12, 2.6));
  return g;
}

