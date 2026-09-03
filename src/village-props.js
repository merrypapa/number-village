// ===========================================================
//  🏡 마을에 서 있는 것들의 "겉모습" — 집 · 인하성 · 나무 · 분수 · 성 입구
//
//  ★ 여기는 모양만 만든다. **어디에 놓을지는 src/world.js**가 정한다.
//    (마트·그림의 집·루하성·엄마성·아빠성 모양은 src/village-buildings.js)
//  ★ 색을 바꾸고 싶으면 아래 M(재질) 표의 색 숫자만 고치면 된다.
// ===========================================================
import * as THREE from 'three';
import { makeSign } from './mart-props.js';

export const M = {
  grass:  new THREE.MeshToonMaterial({ color: 0x9fe08a }),
  path:   new THREE.MeshToonMaterial({ color: 0xf3e0c0 }),
  wall:   new THREE.MeshToonMaterial({ color: 0xfff3f8 }),
  roofA:  new THREE.MeshToonMaterial({ color: 0xff9ec4 }),
  roofB:  new THREE.MeshToonMaterial({ color: 0x8fd0ff }),
  roofC:  new THREE.MeshToonMaterial({ color: 0xc3b1f5 }),
  door:   new THREE.MeshToonMaterial({ color: 0xb5794f }),
  win:    new THREE.MeshToonMaterial({ color: 0xa8e6ff }),
  trunk:  new THREE.MeshToonMaterial({ color: 0xa9744f }),
  leafA:  new THREE.MeshToonMaterial({ color: 0x69c96b }),
  leafB:  new THREE.MeshToonMaterial({ color: 0xffb3d9 }),
  water:  new THREE.MeshToonMaterial({ color: 0x7fd4ff }),
  flag:   new THREE.MeshToonMaterial({ color: 0xffd93d }),
};

const G = {
  box:  new THREE.BoxGeometry(1, 1, 1),
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cone: new THREE.ConeGeometry(0.5, 1, 16),
  ball: new THREE.SphereGeometry(0.5, 14, 12),
};

function mesh(geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// --- 집 한 채 (문은 +z 쪽에 있다. 들어갈 수 있는 집은 문이 환하게 빛난다) ---
export function makeHouse(roofMat, w = 8, h = 5, d = 8, label = null) {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wall, 0, h / 2, 0, w, h, d));
  const roof = mesh(G.cone, roofMat, 0, h + 2.0, 0, w * 0.95, 4.0, d * 0.95);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // 현관 — 안이 환하게 비친다 (여기로 들어간다고 알려준다)
  const light = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0),
    new THREE.MeshBasicMaterial({ color: 0xfff0d8 }));
  light.position.set(0, 1.5, d / 2 + 0.07);
  light.userData.noShadow = true;
  g.add(light);
  g.add(mesh(G.box, M.door, 0, 1.6, d / 2 + 0.1, 2.5, 3.4, 0.22));
  g.add(mesh(G.box, M.roofA, 0, 3.6, d / 2 + 0.7, 3.4, 0.3, 1.6));      // 현관 차양

  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.win, s * w * 0.3, h * 0.66, d / 2 + 0.05, 1.6, 1.6, 0.2));
    g.add(mesh(G.box, M.wall, s * w * 0.3, h * 0.66, d / 2 + 0.09, 1.9, 0.2, 0.2));
  }
  if (label) {                                    // 문 위에 붙은 이름표
    const sign = makeSign(label, 5.2, 1.0, '#fff6e8', '#7a4fb0');
    sign.position.set(0, h + 0.7, d / 2 + 0.15);
    g.add(sign);
  }
  return g;
}

// --- 성 ---
export function makeCastle() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wall, 0, 6, 0, 20, 12, 14));            // 본체
  const mainRoof = mesh(G.cone, M.roofA, 0, 15, 0, 16, 7, 12);
  mainRoof.rotation.y = Math.PI / 4;
  g.add(mainRoof);

  // 탑 4개
  const towers = [[-11, -8], [11, -8], [-11, 8], [11, 8]];
  for (const [x, z] of towers) {
    g.add(mesh(G.cyl, M.wall, x, 8, z, 5, 16, 5));
    g.add(mesh(G.cone, M.roofB, x, 19, z, 6.4, 7, 6.4));
    g.add(mesh(G.cyl, M.wall, x, 22.6, z, 0.3, 3, 0.3));      // 깃대
    g.add(mesh(G.box, M.flag, x + 0.9, 23.4, z, 1.8, 1.1, 0.1)); // 깃발
  }

  // 정문
  g.add(mesh(G.box, M.door, 0, 3, 7.1, 4.5, 6, 0.4));
  return g;
}

// --- 나무 ---
export function makeTree(pink = false) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.trunk, 0, 1.6, 0, 0.7, 3.2, 0.7));
  const leafMat = pink ? M.leafB : M.leafA;
  g.add(mesh(G.ball, leafMat, 0, 4.2, 0, 3.4));
  g.add(mesh(G.ball, leafMat, 1.2, 3.4, 0.6, 2.2));
  g.add(mesh(G.ball, leafMat, -1.1, 3.6, -0.5, 2.0));
  return g;
}

// --- 분수 ---
export function makeFountain() {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.wall, 0, 0.5, 0, 8, 1, 8));
  g.add(mesh(G.cyl, M.water, 0, 1.05, 0, 7.2, 0.2, 7.2));
  g.add(mesh(G.cyl, M.wall, 0, 2, 0, 1.2, 3, 1.2));
  g.add(mesh(G.ball, M.water, 0, 3.8, 0, 1.8));
  return g;
}

// --- 성 입구 표시 — 여기로 들어가면 된다고 알려주는 융단과 등불 ---
export function makeCastleEntrance(z) {
  const g = new THREE.Group();

  // 문 앞까지 이어지는 분홍 융단
  const carpet = mesh(G.box, M.roofA, 0, 0.06, z + 1.5, 7, 0.12, 13);
  carpet.castShadow = false;
  g.add(carpet);
  g.add(mesh(G.box, M.flag, 0, 0.1, z + 1.5, 4.2, 0.12, 11.6));   // 가운데 금색 길

  // 양쪽 등불 기둥 (밤이 아니어도 반짝반짝 보이게 밝은 재질)
  //  ★ 성에서 나올 때 카메라를 가리지 않도록 융단 바깥쪽(x = ±5)에 세운다
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff0a8 });
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const x = sx * 5, lz = z + 1 + i * 6;
      g.add(mesh(G.cyl, M.wall, x, 1.6, lz, 0.5, 3.2, 0.5));
      const bulb = new THREE.Mesh(G.ball, lampMat);
      bulb.position.set(x, 3.6, lz);
      bulb.scale.setScalar(1.1);
      g.add(bulb);
      g.add(mesh(G.cone, M.roofB, x, 4.4, lz, 1.4, 1.1, 1.4));
    }
  }

  // 성 문 위에 붙은 하트 세 개 (여기가 입구라고 알려준다)
  for (let i = 0; i < 3; i++) {
    g.add(mesh(G.ball, M.roofA, (i - 1) * 2.2, 9 - Math.abs(i - 1) * 0.8, -40.5, 0.9));
  }
  return g;
}

