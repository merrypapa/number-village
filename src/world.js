// ===========================================================
//  마을 만들기 — 바닥, 성, 집, 나무, 분수, 놀이터
//  부딪히는 물건(장애물)도 여기서 같이 등록한다.
// ===========================================================
import * as THREE from 'three';
import { buildSky } from './sky.js';
import { buildPlayground } from './playground.js';
import { buildStable, makeHorseRide } from './horse.js';
import { createCollider } from './collide.js';
import { makeMartBuilding, makeMartCarts, makeArtHouseBuilding } from './village-buildings.js';
import { buildMart } from './mart.js';
import { HOUSES, buildHouse } from './houses.js';
import { buildArtHouse } from './art-house.js';
import { makeSign } from './mart-props.js';

export const WORLD_RADIUS = 90;   // 마을 반지름 (밖으로 못 나감)

// 놀이터가 놓일 자리 ← 아이가 옮기고 싶으면 여기 숫자만 바꾸면 된다
const PLAYGROUND_POS = { x: 42, z: 40 };

// 🐴 마구간이 놓일 자리 (성으로 가는 길 옆). 말을 타고 마을을 달릴 수 있다
const STABLE_POS = { x: 34, z: -34 };

// 🏰 성 정문 앞 — 여기에 서면 성 안으로 들어간다 (castle-interior.js가 안쪽을 만든다)
const CASTLE_DOOR = { z: -35.5 };

// 🛒 마트가 놓일 자리 (광장 북서쪽). 문은 +z 쪽(광장 쪽)을 바라본다
//   half = 건물 절반 크기 (부딪히는 네모),  door = 문 앞에 서는 자리
const MART = { x: -19, z: -17, hw: 7.7, hd: 5.7, doorZ: -9.6 };

// 🎨 그림의 집이 놓일 자리 (광장 북동쪽). 여기서 그림을 그린다
const ART = { x: 16, z: -19, hw: 6.2, hd: 5.2, doorZ: -11.6 };

// 친구들 집이 서는 방향(라디안)과 거리
//  ★ 북쪽(성 입구, 약 4.7)과 남쪽(우리 집, 약 1.6)은 비워둔다
//  ★ 집 개수는 src/houses.js의 HOUSES가 정한다. 이 각도 목록도 같은 개수여야 한다
const FRIEND_HOUSES = [0.4, 1.0, 2.5, 3.2, 3.9, 5.9];
const FRIEND_DIST = 38;
const HOUSE_DOOR = 7.6;     // 집 한가운데에서 문 앞 자리까지의 거리

const M = {
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
function makeHouse(roofMat, w = 8, h = 5, d = 8, label = null) {
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
function makeCastle() {
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
function makeTree(pink = false) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.trunk, 0, 1.6, 0, 0.7, 3.2, 0.7));
  const leafMat = pink ? M.leafB : M.leafA;
  g.add(mesh(G.ball, leafMat, 0, 4.2, 0, 3.4));
  g.add(mesh(G.ball, leafMat, 1.2, 3.4, 0.6, 2.2));
  g.add(mesh(G.ball, leafMat, -1.1, 3.6, -0.5, 2.0));
  return g;
}

// --- 분수 ---
function makeFountain() {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.wall, 0, 0.5, 0, 8, 1, 8));
  g.add(mesh(G.cyl, M.water, 0, 1.05, 0, 7.2, 0.2, 7.2));
  g.add(mesh(G.cyl, M.wall, 0, 2, 0, 1.2, 3, 1.2));
  g.add(mesh(G.ball, M.water, 0, 3.8, 0, 1.8));
  return g;
}

// --- 성 입구 표시 — 여기로 들어가면 된다고 알려주는 융단과 등불 ---
function makeCastleEntrance(z) {
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

// -----------------------------------------------------------
//  부딪히기(충돌)는 src/collide.js로 옮겼다.
//  성 안·마트·집도 똑같은 것을 쓰기 때문이다.
//  예전처럼 world.js에서 가져다 쓰던 파일이 있어서 그대로 다시 내보낸다.
// -----------------------------------------------------------
export { createCollider };

// -----------------------------------------------------------
//  마을 전체 만들기
// -----------------------------------------------------------
/** 마을을 만들어 scene에 추가한다. 스폰 위치와 부딪힘 함수를 돌려준다. */
export function buildWorld(scene) {
  const obstacles = [];        // 부딪히는 물건 목록
  const reserved = [];         // 나무를 심으면 안 되는 자리

  // 바닥
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 8, 48), M.grass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 중앙 광장(길)
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(22, 40), M.path);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // 분수
  scene.add(makeFountain());
  obstacles.push({ x: 0, z: 0, r: 4.2 });
  reserved.push({ x: 0, z: 0, r: 14 });

  // 성 (북쪽) — 탑까지 덮는 네모로 막는다
  const castle = makeCastle();
  castle.position.set(0, 0, -48);
  scene.add(castle);
  obstacles.push({ x: 0, z: -48, hw: 13.5, hd: 10.5 });
  reserved.push({ x: 0, z: -48, r: 22 });

  // 성 입구 (융단 + 등불) — 여기 서면 성 안으로 들어간다
  scene.add(makeCastleEntrance(CASTLE_DOOR.z));
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
    obstacles.push({ x: sx * 5, z: CASTLE_DOOR.z + 1 + i * 6, r: 0.7 });   // 등불 기둥
  }

  // 🛒 마트 (편의점) — 문 앞에 서면 마트 안으로 들어간다
  const mart = makeMartBuilding();
  mart.position.set(MART.x, 0, MART.z);
  scene.add(mart);
  obstacles.push({ x: MART.x, z: MART.z, hw: MART.hw, hd: MART.hd });
  reserved.push({ x: MART.x, z: MART.z, r: 17 });   // 문 앞 길까지 나무를 안 심는다
  //  마트 앞에 세워둔 카트 (장식)
  scene.add(makeMartCarts(MART.x + 4.5, MART.z + 6.6));
  obstacles.push({ x: MART.x + 6.0, z: MART.z + 7.1, r: 1.8 });

  // 🎨 그림의 집 — 문 앞에 서면 안으로 들어간다
  const artHouse = makeArtHouseBuilding();
  artHouse.position.set(ART.x, 0, ART.z);
  scene.add(artHouse);
  obstacles.push({ x: ART.x, z: ART.z, hw: ART.hw, hd: ART.hd });
  reserved.push({ x: ART.x, z: ART.z, r: 17 });   // 문 앞 길까지 나무를 안 심는다

  // 우리 집 (남쪽) — 아이가 색을 고를 수 있게 roofC
  const home = makeHouse(M.roofC, 7, 4.5, 7);
  home.position.set(0, 0, 34);
  home.userData.isHome = true;
  scene.add(home);
  obstacles.push({ x: 0, z: 34, r: 4.7 });
  reserved.push({ x: 0, z: 34, r: 10 });

  // 친구들 집 (광장 둘레) — 문 앞에 서면 그 집 안으로 들어간다
  //  ★ 집은 전부 광장(가운데) 쪽을 바라본다. 그래야 아이가 문을 찾기 쉽다
  const roofs = [M.roofA, M.roofB, M.roofC];
  const houseDoors = [];
  for (let i = 0; i < HOUSES.length; i++) {
    const house = HOUSES[i];
    const a = FRIEND_HOUSES[i % FRIEND_HOUSES.length];
    const hx = Math.cos(a) * FRIEND_DIST, hz = Math.sin(a) * FRIEND_DIST;
    // 집 앞(광장 쪽) 방향
    const fx = -Math.cos(a), fz = -Math.sin(a);
    const h = makeHouse(roofs[i % 3], 8, 5, 8, house.name);
    h.position.set(hx, 0, hz);
    h.rotation.y = Math.atan2(fx, fz);        // 앞면(+z)이 광장을 보게 돌린다
    scene.add(h);
    obstacles.push({ x: hx, z: hz, r: 5.4 });
    reserved.push({ x: hx, z: hz, r: 11 });
    //  ★ 문 앞 길에는 나무를 심지 않는다.
    //    집에서 나오면 여기에 서는데, 나무가 있으면 화면을 가린다
    reserved.push({ x: hx + fx * 12, z: hz + fz * 12, r: 8.5 });

    houseDoors.push({
      x: hx + fx * HOUSE_DOOR, z: hz + fz * HOUSE_DOOR, r: 2.8,
      to: `house-${house.id}`,
      label: `${house.name}에 놀러 왔어요!`,
      //  ★ 나올 때는 문에서 넉넉히 떨어뜨려 세운다.
      //    - 문 반경(2.8) 안에 서 있으면 다시 들어가려 할 때 한 번 멀어져야 해서 답답하다
      //    - 카메라가 캐릭터 뒤에 서므로, 너무 가까우면 카메라가 집 안에 파묻힌다
      build: (ctx) => buildHouse(house, { ...ctx, exit: {
        x: hx + fx * (HOUSE_DOOR + 6.0), z: hz + fz * (HOUSE_DOOR + 6.0),
        yaw: Math.atan2(fx, fz),
      } }),
    });
  }

  // 놀이터
  const playground = buildPlayground(PLAYGROUND_POS.x, PLAYGROUND_POS.z);
  scene.add(playground.group);
  obstacles.push(...playground.obstacles);
  reserved.push({ x: PLAYGROUND_POS.x, z: PLAYGROUND_POS.z, r: 15 });

  // 🐴 마구간과 말들 (말은 마을 좌표를 그대로 쓰므로 화면에 따로 넣는다)
  const stable = buildStable(STABLE_POS.x, STABLE_POS.z);
  scene.add(stable.group);
  for (const h of stable.horses) scene.add(h);
  obstacles.push(...stable.obstacles);
  reserved.push({ x: STABLE_POS.x, z: STABLE_POS.z, r: 18 });

  // 광장 옆에도 말 한 마리 — 바로 눈에 띄어서 타보게 된다
  const plazaHorse = makeHorseRide(16, 6, 2, -2.2);
  scene.add(plazaHorse.group);
  obstacles.push(plazaHorse.obstacle);
  reserved.push({ x: 16, z: 6, r: 8 });

  // 나무 40그루 — 건물이나 놀이터 위에는 심지 않는다
  for (let i = 0; i < 40; i++) {
    let x = 0, z = 0, ok = false;
    for (let tryCount = 0; tryCount < 20 && !ok; tryCount++) {
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * (WORLD_RADIUS - 30);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      ok = reserved.every(s => Math.hypot(x - s.x, z - s.z) > s.r);
    }
    if (!ok) continue;

    const t = makeTree(Math.random() < 0.3);
    const s = 0.8 + Math.random() * 0.5;
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = Math.random() * 6;
    scene.add(t);
    obstacles.push({ x, z, r: 1.0 * s });
  }

  // 하늘 (구름 + 고래)
  const sky = buildSky(scene);

  const { collide, isBlocked } = createCollider(obstacles);

  /** 매 프레임 움직이는 것들 (구름, 고래, 그네, 시소, 말) */
  function update(dt, t) {
    sky.update(dt, t);
    playground.update(dt, t);
    stable.update(dt, t);
    plazaHorse.update(dt, t);
  }

  // rides = 캐릭터가 탈 수 있는 놀이기구 목록 (그네 2개 + 미끄럼틀). src/rides.js가 쓴다.
  return {
    name: 'village',
    scene,
    spawn: new THREE.Vector3(0, 0, 14),
    yaw: 0,
    bounds: 88,                // 마을 밖으로 못 나가는 원의 반지름
    home, collide, isBlocked, update,
    // 📷 마을에서는 카메라가 건물·나무 속에 파묻히면 캐릭터 쪽으로 당긴다.
    //   (집에서 막 나왔을 때 건물에 가려서 캐릭터가 안 보이던 문제)
    //   실내는 벽이 안쪽만 보이는 판이라 밖에 있어도 잘 보이므로 켜지 않는다
    camCollide: true,
    // 탈 수 있는 것 — 그네·미끄럼틀·시소 + 🐴 말 세 마리
    rides: [...playground.rides, ...stable.rides, plazaHorse.ride],
    // 🚪 문 — 건물 앞에 서면 그 건물 안으로 들어간다 (main.js가 확인한다)
    //   build(ctx) = 안쪽 공간을 만드는 함수. ctx.exit = 나올 때 설 자리
    doors: [
      {
        x: 0, z: CASTLE_DOOR.z, r: 4.5, to: 'castle',
        label: '성 안! 👑 안쪽 끝에 왕좌가 있어요',
      },
      {
        x: MART.x, z: MART.doorZ, r: 2.8, to: 'mart',
        label: '어서 오세요! 🛒 행복마트',
        build: (ctx) => buildMart({ ...ctx,
          exit: { x: MART.x, z: MART.doorZ + 6.0, yaw: 0 } }),
      },
      {
        x: ART.x, z: ART.doorZ, r: 2.8, to: 'art',
        label: '그림의 집! 🎨 이젤 앞에서 그리기를 눌러요',
        build: (ctx) => buildArtHouse({ ...ctx,
          exit: { x: ART.x, z: ART.doorZ + 6.0, yaw: 0 } }),
      },
      ...houseDoors,        // 🏠 친구 집 (src/houses.js의 HOUSES 개수만큼)
    ],
  };
}
