// ===========================================================
//  🏰 성 안 — 문으로 들어가면 펼쳐지는 큰 성
//
//  마을(world.js)과 똑같은 모양의 "공간(area)"을 하나 더 만든다.
//    { scene, spawn, yaw, collide, isBlocked, groundY, update, rides, doors }
//  그래서 player.js와 npcs.js를 고치지 않고 그대로 쓴다.
//
//  ★ 방이 여러 개고 2층까지 있다. 방 배치 그림은 castle-layout.js 위쪽에 있다.
//    - 뼈대(2층 바닥·계단·난간·기둥) → src/castle-layout.js
//    - 껍데기(바닥·벽·천장·창문)     → src/castle-shell.js
//    - 물건 모양                     → src/castle-props.js, src/castle-props2.js
//    - 요정 친구 진열대              → src/castle-gallery.js
// ===========================================================
import * as THREE from 'three';
import { createCollider } from './world.js';
import {
  C, part, glow,
  makeThrone, makeFireplace, makeCakeTable, makeBookshelf, makeNook,
  makeCandleStand, makePlant, makeNumberBlocks, makeBalloons, makeRockingHorse,
} from './castle-props.js';
import {
  makeCrown, makeBed, makeDesk, makeTelescope, makeTreasureChest, makeGoldPile,
  makeChandelier, makeBanner, makeArmorStand, makeStarMap, makeCushion,
  makeCastleSlide,
} from './castle-props2.js';
import {
  HALF_X, HALF_Z, HEIGHT, FLOOR2, F1, F2, ROOMS,
  groundY, buildStructure,
} from './castle-layout.js';
import { buildShell, buildSparkles } from './castle-shell.js';
import { buildGallery } from './castle-gallery.js';
import { buildSkywayArea, SKY_FROM_CASTLE } from './skyway.js';
import { buildRainbowArea, RB_FROM_CASTLE, CASTLE_RB_DOOR } from './rainbow-bridge.js';
import { registerArea } from './area-link.js';
import { makeWallDoor } from './castle-door.js';
import { buildTrainWay, TW_FROM_CASTLE, CASTLE_TW_DOOR } from './dad-bridges.js';
import { makeSign } from './mart-props.js';
import {
  SLIDE, makeThroneRide, makeRockingHorseRide, makeSlideRide,
  makeBedRide, makeDeskRide,
} from './castle-rides.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 물건을 놓는 자리
//    (타는 방법·앉는 자세는 src/castle-rides.js에 있다)
// -----------------------------------------------------------
const THRONE = { x: 0,   z: -34 };   // 👑 왕좌
const HORSE  = { x: 27,  z: 34 };    // 🐴 흔들목마 (1층 파티방)
const BED    = { x: 22,  z: 28 };    // 🛏 침대 (2층 공주 침실)
const DESK   = { x: -32.4, z: 31 };  // 📖 책상 (2층 별 전망대 · 책장 옆)
const SHELF2 = { x: -32.8, z: 24 };  // 📚 2층 책장

// ☁️ 2층 동쪽 발코니에 난 바깥 문 — 구름 징검다리를 건너 루하성으로 간다
const SKY_DOOR = { z: -13 };
// 🌈 2층 **서쪽** 발코니에 난 바깥 문 — 무지개 다리를 건너 엄마성으로 간다
//   ★ 보물방(z -17 ~ -5)을 피해서 남쪽에 냈다. 자리는 rainbow-bridge.js가 정한다
const RAINBOW_DOOR = CASTLE_RB_DOOR;
// 🚂 2층 **남쪽** 벽(별 전망대 옆)에 난 바깥 문 — 기차길을 타고 아빠성으로 간다
const TRAIN_DOOR = { x: CASTLE_TW_DOOR.x };

// -----------------------------------------------------------
//  성 안 공간 만들기
// -----------------------------------------------------------
/**
 * envMap       : 반짝이는 재질(.glb 친구들)에 쓸 반사광. main.js가 넘겨준다.
 * playerCharId : 내가 고른 캐릭터 (진열대에서는 빼둔다 — 내가 이미 그 친구니까)
 */
export function buildCastleInterior(envMap, playerCharId) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3b2a5e);
  scene.environment = envMap || null;

  // 조명 — 따뜻하고 아늑하게
  const hemi = new THREE.HemisphereLight(0xfff0f8, 0x8a6bd0, 1.2);
  scene.add(hemi);
  const win = new THREE.DirectionalLight(0xfff2d0, 1.05);
  win.position.set(-40, 44, -18);
  win.castShadow = true;
  win.shadow.mapSize.set(2048, 2048);
  win.shadow.camera.left = -46; win.shadow.camera.right = 46;
  win.shadow.camera.top = 50;   win.shadow.camera.bottom = -50;
  win.shadow.camera.far = 140;
  //  성이 넓어서 그림자 지도가 성기다 → 얼룩(줄무늬)이 생기지 않게 살짝 밀어준다
  win.shadow.normalBias = 0.9;
  win.shadow.bias = -0.0006;
  scene.add(win);

  const shell = buildShell(scene);
  const structure = buildStructure(scene);
  const obstacles = [...shell.obstacles, ...structure.obstacles];
  const ticks = [];

  /**
   * 물건 하나 놓기.
   *   place(모양, x, z, 방향, 부딪히는크기, 높이)
   *   hit에 {...F1}이나 {...F2}를 붙이면 그 층에서만 부딪힌다.
   */
  function place(group, x, z, ry = 0, hit = null, y = 0) {
    group.position.set(x, y, z);
    group.rotation.y = ry;
    scene.add(group);
    if (group.userData.tick) ticks.push(group.userData.tick);
    if (hit) obstacles.push({ x, z, ...hit });
    return group;
  }

  /** 2층 밑(천장이 낮은 방)에 놓을 풍선은 조금 작게 — 천장을 뚫지 않게 */
  function lowBalloons(g) { g.scale.setScalar(0.78); return g; }

  /** 벽에 거는 물건 (깃발·별지도) — 벽 쪽을 향하게 돌려서 붙인다 */
  function hang(group, x, y, z, ry) {
    group.position.set(x, y, z);
    group.rotation.y = ry;
    scene.add(group);
  }

  // ============================================================
  //  1층
  // ============================================================

  // 👑 왕좌의 방 (북쪽) — 천장까지 뻥 뚫려 있다
  place(makeThrone(), THRONE.x, THRONE.z, 0, { hw: 6.2, hd: 4.2, ...F1 });
  const crown = makeCrown(1.3);      // 왕좌 위에 떠 있다가, 앉으면 머리로 내려온다
  scene.add(crown);
  place(makeCandleStand(), -11, -30, 0, { r: 1.0, ...F1 });
  place(makeCandleStand(),  11, -30, 0, { r: 1.0, ...F1 });
  place(makeCandleStand(), -11, -39, 0, { r: 1.0, ...F1 });
  place(makeCandleStand(),  11, -39, 0, { r: 1.0, ...F1 });
  place(makeArmorStand(), -9, -21, 0, { r: 1.1, ...F1 });
  place(makeArmorStand(),  9, -21, 0, { r: 1.1, ...F1 });

  // 🔥 벽난로 (왕좌의 방 서쪽 벽) + 앞에 깔린 양탄자
  place(makeFireplace(), -25, -HALF_Z + 1.0, 0, { hw: 4.3, hd: 1.8, ...F1 });
  const rug = part('cyl', C.red, -25, 0.05, -36, 6.0, 0.1, 6);
  rug.receiveShadow = true; rug.castShadow = false;
  scene.add(rug);

  // 왕좌로 이어지는 붉은 융단
  const carpet = part('box', C.red, 0, 0.04, -22, 8, 0.08, 26);
  carpet.receiveShadow = true; carpet.castShadow = false;
  scene.add(carpet);

  // 🎪 중앙 홀 — 샹들리에, 숫자 블록, 풍선
  place(makeChandelier(HEIGHT, 11), 0, -6, 0, null, 11);
  place(makeChandelier(HEIGHT, 11), 0, 8, 0, null, 11);
  place(makeNumberBlocks(), -9, 9, 0.4, { r: 2.0, ...F1 });
  place(makeBalloons(), 11, -14);
  place(makeBalloons([C.pink, 0xffd45e, 0x8fd0ff]), -11, -14);

  // 🧚 요정 친구 진열대 (서쪽 회랑) — 부르면 깨어나서 돌아다닌다
  //  친구가 35명이라 한 줄이면 다닥다닥 붙는다 → 복도를 사이에 두고 두 줄이 마주 본다
  //  gap = 친구 사이 간격 (자리가 모자라면 자동으로 좁아진다)
  const gallery = buildGallery(playerCharId, {
    gap: 3.4, z0: -36, z1: 14,
    rows: [{ x: -32.4, face: 1 }, { x: -19.5, face: -1 }],
  });
  scene.add(gallery.group);
  obstacles.push(...gallery.obstacles);

  // 🪜 계단 회랑 (동쪽) — 갑옷 기사와 화분
  place(makeArmorStand(), 19, -15, Math.PI, { r: 1.1, ...F1 });
  place(makePlant(), 19, 11, 0, { r: 1.6, ...F1 });
  place(makePlant(), 30, -15, 0, { r: 1.6, ...F1 });

  // 📚 도서관 (남서) — 책장 두 개와 책 읽는 자리
  //  ★ 책장은 원래 8.5칸으로 높아서 2층 바닥(6.8)을 뚫는다 → 조금 줄여서 놓는다
  for (const z of [22, 33]) {
    const shelf = makeBookshelf();
    shelf.scale.setScalar(0.74);
    place(shelf, -HALF_X + 0.8, z, Math.PI / 2, { hw: 1.3, hd: 3.4, ...F1 });
  }
  place(makeNook(), -20, 30);
  place(makePlant(), -12, 18, 0, { r: 1.6, ...F1 });

  // 🍰 파티방 (남동) — 케이크 탁자, 풍선, 흔들목마
  place(makeCakeTable(), 19, 23, 0, { r: 2.6, ...F1 });
  place(lowBalloons(makeBalloons()), 13, 19);
  place(lowBalloons(makeBalloons([C.mint, C.pink, 0xffd45e])), 27, 19);
  place(makeRockingHorse(), HORSE.x, HORSE.z, 0, { r: 2.2, ...F1 });

  // 🚪 현관 복도 (남쪽 가운데) — 나가는 문 양옆에 풍선과 화분
  place(lowBalloons(makeBalloons([C.violet, C.pink, C.mint])), -5, 37);
  place(lowBalloons(makeBalloons()), 5, 37);
  place(makePlant(), -6, 20, 0, { r: 1.6, ...F1 });
  place(makePlant(),  6, 20, 0, { r: 1.6, ...F1 });

  // ============================================================
  //  2층 (높이 FLOOR2)
  // ============================================================

  // 💎 보물방 (서쪽 팔 북쪽)
  place(makeTreasureChest(), -29, -14, 0.3, { r: 2.0, ...F2 }, FLOOR2);
  place(makeTreasureChest(C.woodDark), -23, -13, -0.5, { r: 2.0, ...F2 }, FLOOR2);
  place(makeTreasureChest(), -30, -5, 1.2, { r: 2.0, ...F2 }, FLOOR2);
  place(makeGoldPile(), -25, -8, 0, null, FLOOR2);
  place(makeGoldPile(), -21, -17, 0, null, FLOOR2);
  // 왕관 진열대
  const stand = new THREE.Group();
  stand.add(part('cyl', C.stone, 0, 0.9, 0, 2.0, 1.8, 2.0));
  stand.add(part('cyl', C.gold, 0, 1.85, 0, 2.4, 0.2, 2.4));
  place(stand, -26, -10, 0, { r: 1.3, ...F2 }, FLOOR2);
  const showCrown = makeCrown(1.0);
  showCrown.position.set(-26, FLOOR2 + 2.1, -10);
  scene.add(showCrown);
  ticks.push((t) => { showCrown.rotation.y = t * 0.6; });
  hang(makeBanner(C.violet), -HALF_X + 0.4, FLOOR2 + 9.0, -12, Math.PI / 2);

  // 🪜 계단참 · 발코니 (동쪽 팔) — 깃발과 갑옷
  place(makeArmorStand(), 30, -16, Math.PI, { r: 1.1, ...F2 }, FLOOR2);
  place(makeArmorStand(), 19, -16, Math.PI, { r: 1.1, ...F2 }, FLOOR2);
  //  ★ 발코니 통로 한가운데에는 아무것도 놓지 않는다 (길을 막으면 못 지나간다)
  //  ★ 깃발은 z -13에 있었는데, 거기에 징검다리로 나가는 문을 냈다.
  //    문 앞을 가리지 않게 옆으로 옮긴다
  hang(makeBanner(C.red), HALF_X - 0.4, FLOOR2 + 9.0, -3, -Math.PI / 2);

  // ☁️ 2층 동쪽 발코니의 바깥 문 — 여기로 나가면 구름 징검다리다
  //   (벽이 안쪽만 보이는 판이라, 밝은 판을 붙여서 "뚫린 문"처럼 보이게 한다)
  makeWallDoor(scene, {
    side: 'e', wall: HALF_X, at: SKY_DOOR.z, base: FLOOR2,
    frame: C.gold, light: 0xdff3ff, mat: 0xa8e6ff,
    text: '구름 징검다리 ☁️ 루하성 가는 길', bg: '#a8e6ff', fg: '#2c2a6b',
  });

  //  발코니 양옆에 등불 (여기가 나가는 곳이라고 알려준다)
  for (const dz of [-4.6, 4.6]) {
    place(makeCandleStand(), HALF_X - 2.2, SKY_DOOR.z + dz, 0, { r: 1.0, ...F2 }, FLOOR2);
  }

  // 🌈 2층 서쪽 발코니의 바깥 문 — 여기로 나가면 무지개 다리다 (엄마성으로)
  //   동쪽 징검다리 문과 똑같은 방식. 방향만 반대다(-x 쪽 벽)
  makeWallDoor(scene, {
    side: 'w', wall: -HALF_X, at: RAINBOW_DOOR.z, base: FLOOR2,
    frame: C.gold, light: 0xffe6f4, mat: 0xff9ec4,
    text: '무지개 다리 🌈 엄마성 가는 길', bg: '#ff9ec4', fg: '#5b3d8f',
  });

  for (const dz of [-4.6, 4.6]) {
    place(makeCandleStand(), -HALF_X + 2.2, RAINBOW_DOOR.z + dz, 0, { r: 1.0, ...F2 }, FLOOR2);
  }

  // 🛏 공주 침실 (2층 남동) — 침대 옆에서 '잠자기'를 누르면 누워서 잔다
  const bed = makeBed();
  place(bed, BED.x, BED.z, Math.PI, { hw: 3.4, hd: 4.4, ...F2 }, FLOOR2);
  const bedRug = part('cyl', C.violet, 22, FLOOR2 + 0.05, 21, 7.0, 0.1, 7);
  bedRug.castShadow = false;
  scene.add(bedRug);
  place(makeCushion(C.mint), 14, 20, 0, null, FLOOR2);
  place(makePlant(), 31, 19, 0, { r: 1.6, ...F2 }, FLOOR2);
  place(makeBalloons([C.pink, C.violet, C.mint]), 12, 36, 0, null, FLOOR2);

  // 🔭 별 전망대 · 공부방 (2층 남서) — 책장 옆 책상에서 '공부하기'
  place(makeTelescope(), -22, 34, 0, { r: 1.6, ...F2 }, FLOOR2);
  hang(makeStarMap(), -HALF_X + 0.4, FLOOR2 + 4.6, 37, Math.PI / 2);
  const shelf2 = makeBookshelf();
  shelf2.scale.setScalar(0.8);
  place(shelf2, SHELF2.x, SHELF2.z, Math.PI / 2, { hw: 1.2, hd: 3.4, ...F2 }, FLOOR2);
  const desk = makeDesk();
  place(desk, DESK.x, DESK.z, Math.PI / 2, { hw: 1.5, hd: 2.7, ...F2 }, FLOOR2);
  for (const [cx, cz] of [[-16, 26], [-20, 24], [-13, 22]]) {
    place(makeCushion(cz % 2 ? C.pink : C.violet), cx, cz, Math.random(), null, FLOOR2);
  }
  place(makePlant(), -30, 19, 0, { r: 1.6, ...F2 }, FLOOR2);

  // 2층 가운데 복도 — 깃발
  hang(makeBanner(C.mint), -8.4, FLOOR2 + 6.4, 34, -Math.PI / 2);
  hang(makeBanner(C.pink),  8.4, FLOOR2 + 6.4, 34, Math.PI / 2);

  // 🚂 2층 남쪽 벽의 바깥 문 — 여기로 나가면 기차길이다 (아빠성으로)
  makeWallDoor(scene, {
    side: 's', wall: HALF_Z, at: TRAIN_DOOR.x, base: FLOOR2,
    frame: C.gold, light: 0xffe8c8, mat: 0xffc93d,
    text: '기차길 🚂 아빠성 가는 길', bg: '#ffc93d', fg: '#5b3d24',
  });

  // 🛝 미끄럼틀 — 2층 난간 틈에서 1층 홀로
  const slide = makeCastleSlide(SLIDE.len, FLOOR2 + 0.6, SLIDE.bottom);
  slide.position.set(SLIDE.x, 0, SLIDE.z);
  slide.rotation.y = Math.PI / 2;          // +x로 만든 것을 -z 방향으로 돌린다
  scene.add(slide);

  // ============================================================
  //  마무리 — 부딪히기, 반짝이, 놀이기구
  // ============================================================
  const collider = createCollider(obstacles);
  const updateSparkles = buildSparkles(scene);

  const bedRide = makeBedRide(bed, BED.x, BED.z);
  const rides = [
    makeThroneRide(THRONE.x, THRONE.z, crown),
    makeRockingHorseRide(HORSE.x, HORSE.z),
    makeSlideRide(),
    bedRide,
    makeDeskRide(desk, DESK.x, DESK.z, Math.PI / 2),
  ];
  // 놀이기구가 화면에 넣을 것을 들고 있으면 같이 넣는다 (떠오르는 Z, 숫자)
  for (const r of rides) for (const p of r.parts || []) scene.add(p);

  // 🌙 침대에서 자면 성 안이 스르륵 어두워진다 (bedRide.sleep = 0 → 1)
  const NIGHT = new THREE.Color(0x140d24);
  const DAY = new THREE.Color(0x3b2a5e);
  const moon = new THREE.PointLight(0xbcd8ff, 0, 26, 2);
  moon.position.set(BED.x, FLOOR2 + 7, BED.z);
  scene.add(moon);

  function update(dt, t) {
    for (const tick of ticks) tick(t, dt);
    for (const r of rides) r.tick?.(t, dt);
    gallery.update(t);          // 진열대에 서 있는 친구들이 둥실둥실
    updateSparkles(dt, t);

    const sleep = bedRide.sleep;
    hemi.intensity = 1.2 * (1 - sleep * 0.82);
    win.intensity  = 1.05 * (1 - sleep * 0.9);
    moon.intensity = sleep * 1.5;                  // 자는 친구만 은은하게 비춘다
    scene.background.copy(DAY).lerp(NIGHT, sleep);
  }

  return {
    name: 'castle',
    scene,
    spawn: new THREE.Vector3(0, 0, 33),
    yaw: Math.PI,              // 들어오면 왕좌 쪽(-z)을 바라본다
    camDist: 10,               // 방 안에서는 카메라를 가까이 (가구를 뚫지 않게)
    camHeight: 6,
    lookHeight: 3,
    npcCount: 7,
    npcTypes: ['block'],       // 성 안을 원래 돌아다니는 친구는 숫자블록만
                               // (요정 친구는 서쪽 벽 진열대에서 불러야 나온다)
    // 친구들이 방마다 흩어져서 논다 (npcs.js의 pickSpot)
    wanderZones: [
      { ...ROOMS.hall, r: 11 }, { ...ROOMS.throne, r: 11 },
      { ...ROOMS.gallery, r: 5 }, { ...ROOMS.entry, r: 5 },
      { ...ROOMS.library, r: 8 }, { ...ROOMS.party, r: 8 },
    ],
    collide: collider.collide,
    isBlocked: collider.isBlocked,
    groundY,                   // ★ 계단과 2층 — player.js가 매 프레임 물어본다
    update, rides,
    spots: gallery.spots,      // 말 걸 수 있는 자리 (요정 친구 부르기)
    // 남쪽 문으로 나가면 마을, 2층 동쪽 문으로 나가면 구름 징검다리
    doors: [{
      x: 0, z: HALF_Z - 2.5, r: 3.0, y: 0, to: 'village',
      label: '마을로 나왔어요! 🌳',
      // ★ y = 이 문이 있는 층. 2층에서 이 자리 위를 지나가도 나가지지 않는다
      // 성 문 앞은 카메라가 성벽에 파묻히므로 조금 앞쪽(광장 쪽)에 내려준다
      arrive: new THREE.Vector3(0, 0, -24), arriveYaw: 0,
    }, {
      // ☁️ 2층 동쪽 발코니 → 구름 징검다리 → 루하성
      //  y: FLOOR2 를 적어야 1층에서 이 자리를 지나가도 안 나가진다
      //  ★ 감지 범위를 좁히고 문간에 바짝 붙였다 (예전 x 31.4 · 반지름 2.4).
      //    발코니를 걸어 다니기만 해도 자꾸 징검다리로 넘어갔다
      x: HALF_X - 1.4, z: SKY_DOOR.z, r: 1.7, y: FLOOR2, to: 'skyway',
      label: '구름 징검다리! ☁️ 루하성으로 가요',
      build: buildSkywayArea,
      arrive: SKY_FROM_CASTLE.pos.clone(), arriveYaw: SKY_FROM_CASTLE.yaw,
    }, {
      // 🌈 2층 서쪽 발코니 → 무지개 다리 → 엄마성 10층
      x: -HALF_X + 1.4, z: RAINBOW_DOOR.z, r: 1.7, y: FLOOR2, to: 'rainbowway',
      label: '무지개 다리! 🌈 엄마성으로 가요',
      build: buildRainbowArea,
      arrive: RB_FROM_CASTLE.pos.clone(), arriveYaw: RB_FROM_CASTLE.yaw,
    }, {
      // 🚂 2층 남쪽 벽 → 기차길 → 아빠성 2층
      x: TRAIN_DOOR.x, z: HALF_Z - 1.4, r: 1.7, y: FLOOR2, to: 'trainway',
      label: '기차길! 🚂 아빠성으로 가요',
      build: buildTrainWay,
      arrive: TW_FROM_CASTLE.pos.clone(), arriveYaw: TW_FROM_CASTLE.yaw,
    }],
  };
}

// -----------------------------------------------------------
//  🔗 이름표 붙이기 — 다리들이 "castle"이라는 이름으로 인하성을 찾는다
//    (src/area-link.js — 파일끼리 서로 부르지 않게 하는 방법)
// -----------------------------------------------------------
registerArea('castle', (ctx) => buildCastleInterior(ctx.envMap, ctx.charId));
