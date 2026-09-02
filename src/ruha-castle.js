// ===========================================================
//  🌙 루하성 — 별과 달의 성
//
//  인하성이 분홍빛 "낮의 성"이라면, 루하성은 남색 "밤의 성"이다.
//  천장에는 별이 반짝이고 큰 달이 떠 있다.
//
//  들어오는 길이 두 개다:
//    1) 마을 남쪽 정문
//    2) 인하성 2층 → ☁️ 구름 징검다리 → 루하성 북쪽 문
//
//  ★ 방 뼈대(바닥·벽·천장·문)는 src/interior.js가 만들어 준다.
//  ★ 물건 모양은 src/ruha-props.js에 있다.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import {
  R, makeStar, makeMoon, makeStarFountain, makeMoonSwing, makeStarCarousel,
  makeWishWell, makeConstellationDome, makeMoonThrone, makeCrystal,
  makeNightCeiling, nightFloorTexture,
  SWING_SEAT, SWING_TOP, CAROUSEL_R, CAROUSEL_SEAT, CAROUSEL_SPD, THRONE_SEAT,
} from './ruha-props.js';
import { makeSeatRide } from './house-props.js';
import { makeCushion } from './castle-props2.js';
import { makeSign } from './mart-props.js';
import { buildSkyway, SKY_FROM_RUHA } from './skyway.js';
import { glow, part } from './castle-props.js';
import { HALF_X, FLOOR2 } from './castle-layout.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const W = 56, D = 48, H = 26;      // 성 안 가로 · 세로 · 천장 (아주 넓고 높다)
const OWNER = 'aurora';            // 루하성 주인 (characters.js의 id) — 오로라핑

// 마을에서 루하성이 서 있는 자리 (world.js가 이 값을 보고 건물을 놓는다)
export const RUHA_SITE = { x: 50, z: -54, hw: 12.5, hd: 10.5, doorZ: -41.5 };

// 물건이 놓이는 자리 — 여기 숫자만 바꾸면 배치가 달라진다
const FOUNTAIN = { x: 0,   z: 2 };     // ✨ 별 분수 (한가운데)
const THRONE   = { x: 0,   z: -19 };   // 👑 달의 옥좌 (북쪽)
const CAROUSEL = { x: -17, z: 6 };     // 🎠 별 회전목마 (서쪽)
const SWING    = { x: 17,  z: 6 };     // 🌙 달 그네 (동쪽)
const WELL     = { x: -17, z: -12 };   // 🌠 소원 우물
const DOME     = { x: 12,  z: -14 };   // 🔭 별자리 돔
//  ☁️ 징검다리로 나가는 북쪽 문.
//  ★ 문 앞(x = SKY_DOOR.x)에서 홀 안쪽으로 이어지는 길은 **비워둔다.**
//    카메라가 캐릭터 뒤(문 쪽)에 서기 때문에, 이 길에 큰 물건이 있으면
//    들어오자마자 그 물건이 화면을 다 가린다
const SKY_DOOR = { x: 21,  z: -D / 2 + 2.4 };

// 별자리 돔에서 나오는 이야기
const STARS_TALK = [
  '북두칠성이에요! 국자 모양이지요 ✨',
  '오리온자리! 허리띠에 별 세 개가 나란히 있어요',
  '카시오페이아는 W 모양이에요',
  '백조자리가 은하수 위를 날아가요 🦢',
  '작은곰자리 끝에 북극성이 있어요 ⭐',
];

export function buildRuhaCastle(ctx) {
  const room = makeInterior({
    name: 'ruha',
    w: W, d: D, h: H,
    envMap: ctx.envMap,
    bg: 0x0e0c2a,
    light: 0.8,                        // 밤이라 조금 어둡게 (0.6쯤이면 더 캄캄하다)
    lampColor: 0xcfd8ff,
    skyLight: 0xbcc8ff, floorLight: 0x2a2760,
    floorTex: (() => { const t = nightFloorTexture(); t.repeat.set(12, 12); return t; })(),
    wallTex: wallpaperTexture('#2c2a6b', '#1b1b45', '#ffe98a'),
    ceilColor: 0x14122f,
    doorFrame: 0x8fa8ff,
    exit: { x: RUHA_SITE.x, z: RUHA_SITE.doorZ + 6.0, yaw: 0 },
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 13, camHeight: 7, lookHeight: 3.4,
  });

  // -----------------------------------------------------------
  //  🌌 밤하늘 천장 + 벽 장식
  // -----------------------------------------------------------
  const sky = makeNightCeiling(W, D, H);
  room.hang(sky, 0, 0, 0);
  room.hang(makeSign('루하성 — 별과 달의 성', 16, 2.2, '#2c2a6b', '#ffe98a'),
            0, H - 3.2, -D / 2 + 0.4, 0);

  // 벽을 따라 빛나는 수정 기둥
  const CRYSTALS = [R.ice, R.rose, R.mint, R.star, R.violet];
  for (let i = 0; i < 8; i++) {
    const s = i < 4 ? -1 : 1;
    const z = -18 + (i % 4) * 12;
    room.place(makeCrystal(CRYSTALS[i % CRYSTALS.length], 4 + (i % 3)),
               s * (W / 2 - 2.6), z, Math.random(), { r: 1.6 });
  }

  // -----------------------------------------------------------
  //  ☁️ 징검다리로 나가는 북쪽 문 (인하성 2층으로 이어진다)
  // -----------------------------------------------------------
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 6.4), glow(0xdfe8ff));
  doorGlow.position.set(SKY_DOOR.x, 3.2, -D / 2 + 0.12);
  doorGlow.userData.noShadow = true;
  room.hang(doorGlow, SKY_DOOR.x, 3.2, -D / 2 + 0.12, 0);
  room.hang(part('box', R.silver, 0, 0, 0, 6.2, 0.6, 0.6), SKY_DOOR.x, 6.6, -D / 2 + 0.3, 0);
  for (const s of [-1, 1]) {
    room.hang(part('box', R.silver, 0, 0, 0, 0.6, 6.6, 0.6),
              SKY_DOOR.x + s * 2.8, 3.3, -D / 2 + 0.3, 0);
  }
  room.hang(makeSign('구름 징검다리 ☁️ 인하성 가는 길', 8, 1.2, '#8fa8ff', '#1b1b45'),
            SKY_DOOR.x, 8.2, -D / 2 + 0.35, 0);

  // -----------------------------------------------------------
  //  ✨ 별 분수 (한가운데) — 문에서 분수까지 빛나는 길이 이어진다
  // -----------------------------------------------------------
  const carpet = part('box', R.violet, 0, 0.04, 0, 7, 0.08, D / 2 - 4, glow(R.violet));
  carpet.castShadow = false;
  room.hang(carpet, 0, 0.04, (D / 2) / 2 + 1);
  const carpet2 = part('box', R.ice, 0, 0.06, 0, 3.2, 0.08, D / 2 - 5, glow(R.ice));
  carpet2.castShadow = false;
  room.hang(carpet2, 0, 0.06, (D / 2) / 2 + 1);
  //  길 양옆에 늘어선 작은 별 등불
  for (let i = 0; i < 5; i++) {
    for (const sx of [-1, 1]) {
      const lamp = new THREE.Group();
      lamp.add(part('cyl', R.silver, 0, 1.6, 0, 0.4, 3.2, 0.4));
      const st = makeStar(R.star, 0.8);
      st.position.y = 3.8;
      lamp.add(st);
      room.place(lamp, sx * 5.4, 20 - i * 4.5, 0, { r: 0.7 });
      const ph = i + (sx > 0 ? 0.5 : 0);
      room.addTick((t) => { st.rotation.y = t * 0.5 + ph; });
    }
  }

  room.place(makeStarFountain(), FOUNTAIN.x, FOUNTAIN.z, 0, { r: 6.2 });
  //  분수 둘레에 앉아 쉬는 자리 (방석)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    room.place(makeCushion(i % 2 ? R.rose : R.ice),
               FOUNTAIN.x + Math.cos(a) * 8.6, FOUNTAIN.z + Math.sin(a) * 8.6, a);
  }

  // -----------------------------------------------------------
  //  👑 달의 옥좌 — 앉으면 별빛을 내려다본다
  // -----------------------------------------------------------
  room.place(makeMoonThrone(), THRONE.x, THRONE.z, 0, { hw: 5.6, hd: 4.2 });
  const throneRide = makeSeatRide(THRONE.x, THRONE.z - 1.0, {
    seatY: THRONE_SEAT, yaw: 0, front: 5.4, reach: 5.0,
    label: '달의 옥좌에 앉았어요! 🌙', verb: '앉기',
  });
  throneRide.camDist = 13;      // 큰 옥좌라 카메라를 멀리 (가까우면 달이 화면을 덮는다)
  throneRide.camHeight = 6.5;
  room.rides.push(throneRide);

  // -----------------------------------------------------------
  //  🎠 별 회전목마 — 타면 빙글빙글 돈다
  // -----------------------------------------------------------
  const carousel = room.place(makeStarCarousel(), CAROUSEL.x, CAROUSEL.z, 0, { r: 5.6 });
  let now = 0;                        // 지금 시각 (회전목마와 박자를 맞추려고 기억해 둔다)
  let boardAngle = 0;                 // 올라탄 자리의 각도
  const carouselRide = {
    kind: 'carousel', label: '별 회전목마가 빙글빙글~ 🎠',
    verb: '타기', offVerb: '내리기',
    // 사방 어디에서 올라타도 된다
    enters: [0, 1, 2, 3].map(i => {
      const a = (i / 4) * Math.PI * 2;
      return { x: CAROUSEL.x + Math.cos(a) * 7.4, z: CAROUSEL.z + Math.sin(a) * 7.4 };
    }),
    enter: { x: CAROUSEL.x + 7.4, z: CAROUSEL.z },
    exit:  { x: CAROUSEL.x + 7.4, z: CAROUSEL.z },
    reach: 3.4, duration: 999, autoEnd: false, rider: null,
    camDist: 14, camHeight: 7,
    onRide(on, model) {
      if (!on) return;
      // 서 있던 쪽에서 그대로 올라탄다 (갑자기 반대편으로 순간이동하지 않게)
      boardAngle = Math.atan2(model.position.z - CAROUSEL.z, model.position.x - CAROUSEL.x)
                   - now * CAROUSEL_SPD;
    },
    tick(t) { now = t; },
    pose(rideTime, o) {
      const a = now * CAROUSEL_SPD + boardAngle;
      o.x = CAROUSEL.x + Math.cos(a) * CAROUSEL_R;
      o.z = CAROUSEL.z + Math.sin(a) * CAROUSEL_R;
      o.y = CAROUSEL_SEAT + Math.sin(now * 2.2) * 0.18;   // 위아래로 살짝
      o.yaw = -a + Math.PI / 2;                           // 도는 방향을 바라본다
      o.tilt = 0;
      void rideTime;
      return o;
    },
  };
  room.rides.push(carouselRide);
  void carousel;

  // -----------------------------------------------------------
  //  🌙 달 그네 — 천장에 매달린 초승달
  // -----------------------------------------------------------
  const swing = makeMoonSwing();
  swing.position.set(SWING.x, SWING_TOP, SWING.z);
  room.scene.add(swing);
  room.addTick(swing.userData.tick);
  const ROPE = SWING_TOP - SWING_SEAT;
  room.rides.push({
    kind: 'moonswing', label: '달 그네를 타요! 🌙',
    verb: '타기', offVerb: '내리기',
    enters: [{ x: SWING.x, z: SWING.z + 4.6 }, { x: SWING.x, z: SWING.z - 4.6 }],
    enter: { x: SWING.x, z: SWING.z + 4.6 }, exit: { x: SWING.x, z: SWING.z + 5.0 },
    reach: 3.4, duration: 999, autoEnd: false, rider: null,
    camDist: 13, camHeight: 6.5,
    tick(t) { now = t; },
    pose(rideTime, o) {
      const ang = swing.userData.swingAt(now);    // 그네와 똑같은 각도로 흔들린다
      o.x = SWING.x;
      o.y = SWING_TOP - ROPE * Math.cos(ang);
      o.z = SWING.z - ROPE * Math.sin(ang);
      o.yaw = Math.PI / 2;
      o.tilt = ang;
      void rideTime;
      return o;
    },
  });

  // -----------------------------------------------------------
  //  🌠 소원 우물 — 누르면 별똥별이 날아간다
  // -----------------------------------------------------------
  const well = room.place(makeWishWell(), WELL.x, WELL.z, 0, { r: 3.6 });
  room.addSpot({
    x: WELL.x, z: WELL.z + 4.6, r: 3.0, y: 0, verb: '소원',
    use(toast) {
      well.userData.wish();
      toast('별똥별이 슝~ 소원이 이루어질 거예요! 🌠');
    },
  });

  // -----------------------------------------------------------
  //  🔭 별자리 돔 — 누를 때마다 다른 별자리 이야기
  // -----------------------------------------------------------
  room.place(makeConstellationDome(), DOME.x, DOME.z, 0, { r: 4.2 });
  let talk = 0;
  room.addSpot({
    x: DOME.x, z: DOME.z + 5.2, r: 3.0, y: 0, verb: '별자리',
    use(toast) { toast(STARS_TALK[talk++ % STARS_TALK.length]); },
  });

  // -----------------------------------------------------------
  //  ⭐ 바닥에 흩뿌린 작은 별과 떠다니는 달
  // -----------------------------------------------------------
  for (let i = 0; i < 14; i++) {
    const st = makeStar(i % 3 ? R.star : R.ice, 0.4 + Math.random() * 0.4);
    const x = (Math.random() - 0.5) * (W - 10);
    const z = (Math.random() - 0.5) * (D - 10);
    st.position.set(x, 1.5 + Math.random() * 6, z);
    room.scene.add(st);
    room.addTick((t) => {
      st.position.y = 1.5 + Math.sin(t * 0.8 + i) * 0.5 + (i % 5);
      st.rotation.y = t * 0.4 + i;
    });
  }
  for (const s of [-1, 1]) {
    const m = makeMoon(1.6);
    m.position.set(s * (W / 2 - 7), 12, -D / 2 + 8);
    m.rotation.z = s * 0.4;
    room.scene.add(m);
  }

  // -----------------------------------------------------------
  //  마무리 — 주인 오로라핑과 놀러 온 친구들
  // -----------------------------------------------------------
  return room.finish({
    npcCount: 4,
    wanderZones: [
      { x: 0, z: 14, r: 8 }, { x: -10, z: -4, r: 6 },
      { x: 10, z: -4, r: 6 }, { x: 0, z: -9, r: 6 },
    ],
    residents: [{ id: OWNER, x: 5.5, z: -13, yaw: Math.PI * 0.9, stay: true }],
    // ☁️ 북쪽 문 — 구름 징검다리로 나간다 (인하성 2층으로 이어진다)
    doors: [{
      x: SKY_DOOR.x, z: -D / 2 + 2.0, r: 2.4, y: 0, to: 'skyway',
      label: '구름 징검다리! ☁️ 인하성으로 가요',
      build: buildSkywayArea,
      arrive: SKY_FROM_RUHA.pos.clone(), arriveYaw: SKY_FROM_RUHA.yaw,
    }],
  });
}

// -----------------------------------------------------------
//  ☁️ 구름 징검다리 만들기 — 두 성이 **똑같은 함수**를 쓴다.
//    어느 쪽에서 먼저 건너가든 같은 징검다리가 나오게 하려고
//    "오갈 때 서는 자리"를 여기 한 곳에만 적어둔다.
//    (인하성 쪽은 castle-interior.js가 이 함수를 그대로 쓴다)
// -----------------------------------------------------------
export function buildSkywayArea(ctx) {
  return buildSkyway({
    ...ctx,
    buildRuha: buildRuhaCastle,
    // 징검다리 → 루하성 북쪽 문으로 들어올 때 서는 자리
    //  ★ 문에서 넉넉히 안쪽에 세운다. 문 바로 앞에 세우면 카메라가
    //    성벽 바깥에 서서 문틀이 화면을 가린다 (건물에서 나올 때와 같은 문제)
    ruhaArrive: new THREE.Vector3(SKY_DOOR.x, 0, -D / 2 + 18),
    ruhaYaw: 0,
    // 징검다리 → 인하성 2층 동쪽 발코니로 돌아갈 때 서는 자리
    //  ★ y에 FLOOR2를 적어야 1층이 아니라 2층에 내려선다 (player.js의 moveTo)
    //  ★ 문에서 넉넉히 안쪽에 세운다. 문 바로 앞에 세우면
    //    카메라가 성벽 바깥에 서서 문틀이 화면을 가린다
    castleArrive: new THREE.Vector3(HALF_X - 12, FLOOR2, -13),
    castleYaw: -Math.PI / 2,
  });
}
