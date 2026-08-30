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
  C, part,
  makeThrone, makeFireplace, makeCakeTable, makeBookshelf, makeNook,
  makeCandleStand, makePlant, makeNumberBlocks, makeBalloons, makeRockingHorse,
} from './castle-props.js';
import {
  makeCrown, makeBed, makeTelescope, makeTreasureChest, makeGoldPile,
  makeChandelier, makeBanner, makeArmorStand, makeStarMap, makeCushion,
  makeCastleSlide,
} from './castle-props2.js';
import {
  HALF_X, HALF_Z, HEIGHT, FLOOR2, F1, F2, ROOMS, SLIDE_GAP,
  groundY, buildStructure,
} from './castle-layout.js';
import { buildShell, buildSparkles } from './castle-shell.js';
import { buildGallery } from './castle-gallery.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const THRONE = { x: 0, z: -34 };   // 왕좌가 있는 자리
const SEAT_Y = 2.9;                // 왕좌 방석 높이 (castle-props.js의 왕좌와 맞춘다)
const HORSE  = { x: 27, z: 34 };   // 흔들목마 자리 (파티방)
const HORSE_Y = 2.6;               // 흔들목마 안장 높이

// 🛝 2층 → 1층 미끄럼틀 (남쪽 블록 난간 틈에서 홀로 내려온다)
const SLIDE = { x: (SLIDE_GAP.x0 + SLIDE_GAP.x1) / 2, z: SLIDE_GAP.z, len: 12, bottom: 0.6 };

// -----------------------------------------------------------
//  👑 왕좌에 앉기 — 앉으면 왕관이 머리 위로 내려온다
// -----------------------------------------------------------
function makeThroneRide(x, z, crown) {
  const ride = {
    kind: 'throne', label: '왕좌에 앉았어요! 👑',
    enter: { x, z: z + 6.2 }, exit: { x, z: z + 6.6 },
    duration: 30, autoEnd: false, rider: null,
    pose(t, o) {
      o.x = x; o.z = z - 1.0;
      o.y = SEAT_Y + Math.sin(t * 1.6) * 0.05;
      o.yaw = Math.sin(t * 0.7) * 0.12;
      o.tilt = -0.04;
      return o;
    },
  };
  // 왕관 — 아무도 안 앉으면 등받이 위에서 빙글빙글, 앉으면 머리 위로 내려온다
  ride.crownTick = (t) => {
    if (ride.rider) {
      // 앉은 친구 머리 크기에 맞춰 왕관도 커지고 작아진다
      const h = ride.rider.userData.height || 1.8;
      crown.scale.setScalar(h * 0.42);
      crown.position.set(x, SEAT_Y + h + 0.05 + Math.sin(t * 1.6) * 0.05, z - 1.0);
      crown.rotation.y = ride.rider.rotation.y;
    } else {
      crown.scale.setScalar(1);
      crown.position.set(x, 9.6 + Math.sin(t * 1.2) * 0.15, z - 2.7);
      crown.rotation.y = t * 0.4;
    }
  };
  return ride;
}

// -----------------------------------------------------------
//  🐴 흔들목마 타기
// -----------------------------------------------------------
function makeRockingHorseRide(x, z) {
  return {
    kind: 'rocking', label: '흔들목마를 타요! 🐴',
    enter: { x: x + 3.2, z }, exit: { x: x + 3.6, z },
    duration: 12, autoEnd: false, rider: null,
    pose(t, o) {
      const swing = Math.sin(t * 1.8) * 0.13;      // 목마와 똑같은 각도로 흔들린다
      o.x = x;
      o.z = z + HORSE_Y * Math.sin(swing);
      o.y = HORSE_Y * Math.cos(swing);
      o.yaw = 0;
      o.tilt = swing;
      return o;
    },
  };
}

// -----------------------------------------------------------
//  🛝 2층에서 1층으로 내려오는 미끄럼틀
//     -z 방향으로 내려간다. 다 내려오면 저절로 내린다.
// -----------------------------------------------------------
function makeSlideRide() {
  const DUR = 3.6;
  const top = FLOOR2 + 0.6;
  const slope = Math.atan2(top - SLIDE.bottom, SLIDE.len);
  return {
    kind: 'slide', label: '2층에서 슝~ 내려가요! 🛝',
    enter: { x: SLIDE.x, z: SLIDE.z + 2.4 }, enterY: FLOOR2,   // 2층 난간 틈 앞
    exit:  { x: SLIDE.x, z: SLIDE.z - SLIDE.len - 4.5 },   // 1층 홀에 내려선다
    duration: DUR, autoEnd: true, camBase: true, rider: null,
    pose(t, o) {
      const u = Math.min(1, Math.max(0, (t - 0.45) / (DUR - 1.15)));
      const e = u * u;                             // 점점 빨라진다
      o.x = SLIDE.x;
      o.z = SLIDE.z - SLIDE.len * e;
      o.y = top - (top - SLIDE.bottom) * e;
      o.yaw = Math.PI;                             // 내려가는 쪽(-z)을 본다
      o.tilt = u < 1 ? slope : 0;
      if (u >= 1) {                                // 다 내려와서 폴짝
        const b = Math.max(0, Math.sin((t - (DUR - 0.7)) * 4.5));
        o.z -= 2.6 + b * 1.2;
        o.y = SLIDE.bottom + b * 1.1;
      }
      return o;
    },
  };
}

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
  scene.add(new THREE.HemisphereLight(0xfff0f8, 0x8a6bd0, 1.2));
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
  const gallery = buildGallery(playerCharId, { wallX: -32.4, rowHalf: 14, zCenter: -2 });
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
  place(makePlant(), 19, 10, 0, { r: 1.6, ...F2 }, FLOOR2);
  hang(makeBanner(C.red), HALF_X - 0.4, FLOOR2 + 9.0, -13, -Math.PI / 2);

  // 🛏 공주 침실 (2층 남동)
  place(makeBed(), 22, 28, Math.PI, { hw: 3.4, hd: 4.4, ...F2 }, FLOOR2);
  const bedRug = part('cyl', C.violet, 22, FLOOR2 + 0.05, 21, 7.0, 0.1, 7);
  bedRug.castShadow = false;
  scene.add(bedRug);
  place(makeCushion(C.mint), 14, 20, 0, null, FLOOR2);
  place(makePlant(), 31, 19, 0, { r: 1.6, ...F2 }, FLOOR2);
  place(makeBalloons([C.pink, C.violet, C.mint]), 12, 36, 0, null, FLOOR2);

  // 🔭 별 전망대 (2층 남서)
  place(makeTelescope(), -22, 32, 0, { r: 1.6, ...F2 }, FLOOR2);
  hang(makeStarMap(), -HALF_X + 0.4, FLOOR2 + 4.5, 24, Math.PI / 2);
  for (const [cx, cz] of [[-16, 26], [-20, 24], [-13, 22]]) {
    place(makeCushion(cz % 2 ? C.pink : C.violet), cx, cz, Math.random(), null, FLOOR2);
  }
  place(makePlant(), -31, 19, 0, { r: 1.6, ...F2 }, FLOOR2);

  // 2층 가운데 복도 — 깃발
  hang(makeBanner(C.mint), -8.4, FLOOR2 + 6.4, 34, -Math.PI / 2);
  hang(makeBanner(C.pink),  8.4, FLOOR2 + 6.4, 34, Math.PI / 2);

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

  const throneRide = makeThroneRide(THRONE.x, THRONE.z, crown);
  const rides = [throneRide, makeRockingHorseRide(HORSE.x, HORSE.z), makeSlideRide()];

  function update(dt, t) {
    for (const tick of ticks) tick(t, dt);
    throneRide.crownTick(t);
    gallery.update(t);          // 진열대에 서 있는 친구들이 둥실둥실
    updateSparkles(dt, t);
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
    // 남쪽 문으로 나가면 마을로 돌아간다
    doors: [{
      x: 0, z: HALF_Z - 2.5, r: 3.0, to: 'village',
      label: '마을로 나왔어요! 🌳',
      // 성 문 앞은 카메라가 성벽에 파묻히므로 조금 앞쪽(광장 쪽)에 내려준다
      arrive: new THREE.Vector3(0, 0, -24), arriveYaw: 0,
    }],
  };
}
