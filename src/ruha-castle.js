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
  SWING_SEAT, SWING_TOP, CAROUSEL_R, CAROUSEL_SEAT, CAROUSEL_SPD, CAROUSEL_OUT,
  THRONE_SEAT,
} from './ruha-props.js';
import { makeSeatRide } from './house-props.js';
import { makeCushion } from './castle-props2.js';
import { makeSign } from './mart-props.js';
import { buildSkywayArea, SKY_FROM_RUHA } from './skyway.js';
import { registerArea } from './area-link.js';
import { buildFlowerArea, FP_FROM_RUHA, RUHA_FP_DOOR } from './flower-path.js';
import { RUHA_W, RUHA_D, RUHA_H, RUHA_F2, RF1, RF2,
         ruhaGroundY, buildRuhaStructure } from './ruha-layout.js';
import { makeTelescope } from './castle-props2.js';
import { glow, part } from './castle-props.js';
import { HALF_X, FLOOR2 } from './castle-layout.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
//  성 크기는 뼈대 파일(ruha-layout.js)에 적어두었다.
//  다리 파일들이 "루하성 어디로 들어가나"를 알아야 하는데,
//  성 파일을 직접 import 하면 서로 부르는 모양이 되기 때문이다
const W = RUHA_W, D = RUHA_D, H = RUHA_H;
const OWNER = 'aurora';            // 루하성 주인 (characters.js의 id) — 오로라핑

// 마을에서 루하성이 서 있는 자리 (world.js가 이 값을 보고 건물을 놓는다)
export const RUHA_SITE = { x: 50, z: -54, hw: 12.5, hd: 10.5, doorZ: -41.5 };

// 물건이 놓이는 자리 — 여기 숫자만 바꾸면 배치가 달라진다
//  ★ 키 큰 것(분수·회전목마·옥좌·그네)은 **가운데 뻥 뚫린 곳**에 놓는다.
//    2층 바닥(북쪽 발코니 z -24~-16, 양옆 회랑 |x| 19~28) 아래·위에 걸리면 안 된다
const FOUNTAIN = { x: 0,   z: 4 };     // ✨ 별 분수 (한가운데)
const THRONE   = { x: 0,   z: -13 };   // 👑 달의 옥좌 (가운데 북쪽)
const CAROUSEL = { x: -11, z: -6 };    // 🎠 별 회전목마
const SWING    = { x: 11,  z: -6 };    // 🌙 달 그네
const WELL     = { x: -15, z: 14 };    // 🌠 소원 우물 (입구 홀)
const DOME     = { x: 15,  z: 14 };    // 🔭 별자리 돔 (입구 홀)
//  ☁️ 징검다리로 나가는 문 — **2층 북쪽 발코니 한가운데**에 있다.
//  ★ 문 앞에서 홀 안쪽으로 이어지는 길은 **비워둔다.**
//    카메라가 캐릭터 뒤(문 쪽)에 서기 때문에, 이 길에 큰 물건이 있으면
//    들어오자마자 그 물건이 화면을 다 가린다
const SKY_DOOR = { x: 0, z: -D / 2 + 2.0 };

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
  //  🏛 2층 뼈대 (바닥·계단·난간·기둥) — src/ruha-layout.js
  // -----------------------------------------------------------
  const structure = buildRuhaStructure(room.scene);
  room.obstacles.push(...structure.obstacles);

  // -----------------------------------------------------------
  //  🌌 밤하늘 천장 + 벽 장식
  // -----------------------------------------------------------
  const sky = makeNightCeiling(W, D, H);
  room.hang(sky, 0, 0, 0);
  room.hang(makeSign('루하성 — 별과 달의 성', 16, 2.2, '#2c2a6b', '#ffe98a'),
            0, H - 3.2, -D / 2 + 0.4, 0);

  // 벽을 따라 빛나는 수정 기둥
  //  ★ 수정 기둥은 **1층 입구 홀(z 12~22)**에만 세운다.
  //    양옆 회랑(|x| 19~28) 밑은 천장이 낮아서(9칸) 키 큰 것을 못 놓는다
  const CRYSTALS = [R.ice, R.rose, R.mint, R.star, R.violet];
  for (let i = 0; i < 6; i++) {
    const sx = i % 2 ? 1 : -1;
    const z = 12 + Math.floor(i / 2) * 5;
    room.place(makeCrystal(CRYSTALS[i % CRYSTALS.length], 4 + (i % 3)),
               sx * (W / 2 - 2.6), z, Math.random(), { r: 1.6, ...RF1 });
  }

  // -----------------------------------------------------------
  //  ☁️ 2층 북쪽 발코니 — 징검다리로 나가는 문
  //   ★ 문 그림은 **한쪽만 보이는 판**이다. 문틀을 두껍게 두면
  //     들어올 때 카메라가 문 뒤에 서서 앞을 다 가린다
  // -----------------------------------------------------------
  const DOOR_Y = RUHA_F2 + 3.4;
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.8), glow(0xdfe8ff));
  doorGlow.userData.noShadow = true;
  room.hang(doorGlow, SKY_DOOR.x, DOOR_Y, -D / 2 + 0.12, 0);
  room.hang(makeSign('구름 징검다리 ☁️ 인하성 가는 길', 9, 1.3, '#8fa8ff', '#1b1b45'),
            SKY_DOOR.x, DOOR_Y + 4.6, -D / 2 + 0.3, 0);
  //  문간 발판 — 여기 서면 나간다고 눈으로 알려준다
  const skyMat = part('box', R.ice, 0, 0, 0, 5.0, 0.12, 3.0, glow(R.ice));
  skyMat.castShadow = false;
  room.hang(skyMat, SKY_DOOR.x, RUHA_F2 + 0.08, -D / 2 + 2.0, 0);

  // -----------------------------------------------------------
  //  🌙 2층 꾸미기 — 발코니 등불 · 방석 · 수정 전시 · 별 망원경
  // -----------------------------------------------------------
  for (const sx of [-1, 1]) {
    const lamp = new THREE.Group();
    lamp.add(part('cyl', R.silver, 0, 1.8, 0, 0.5, 3.6, 0.5));
    const st = makeStar(R.star, 1.0);
    st.position.y = 4.3;
    lamp.add(st);
    room.place(lamp, sx * 4.6, -D / 2 + 3.0, 0, { r: 0.8, ...RF2 }, RUHA_F2);
    room.addTick((t) => { st.rotation.y = t * 0.5 + sx; });
  }
  for (const [x, z] of [[-8, -19], [8, -19], [0, -17]]) {
    room.place(makeCushion(x < 0 ? R.rose : R.ice), x, z, Math.random(), null, RUHA_F2);
  }
  //  서쪽 회랑 — 빛나는 수정 전시대
  for (let i = 0; i < 3; i++) {
    const stand = new THREE.Group();
    stand.add(part('cyl', R.deep, 0, 0.6, 0, 2.2, 1.2, 2.2));
    stand.add(part('cyl', R.violet, 0, 1.28, 0, 2.6, 0.2, 2.6));
    const cry = makeCrystal([R.ice, R.rose, R.mint][i], 2.2);
    cry.position.y = 1.3;
    cry.scale.setScalar(0.7);
    stand.add(cry);
    room.place(stand, -23.5, -13 + i * 8, 0, { r: 1.4, ...RF2 }, RUHA_F2);
  }
  //  동쪽 회랑 — 별을 보는 망원경
  const scope = makeTelescope();
  room.place(scope, 23.5, -13, -0.6, { r: 1.6, ...RF2 }, RUHA_F2);

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
      room.place(lamp, sx * 5.4, 20 - i * 4.5, 0, { r: 0.7, ...RF1 });
      const ph = i + (sx > 0 ? 0.5 : 0);
      room.addTick((t) => { st.rotation.y = t * 0.5 + ph; });
    }
  }

  room.place(makeStarFountain(), FOUNTAIN.x, FOUNTAIN.z, 0, { r: 6.2, ...RF1 });
  //  분수 둘레에 앉아 쉬는 자리 (방석)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    room.place(makeCushion(i % 2 ? R.rose : R.ice),
               FOUNTAIN.x + Math.cos(a) * 8.6, FOUNTAIN.z + Math.sin(a) * 8.6, a);
  }

  // -----------------------------------------------------------
  //  👑 달의 옥좌 — 앉으면 별빛을 내려다본다
  // -----------------------------------------------------------
  room.place(makeMoonThrone(), THRONE.x, THRONE.z, 0, { hw: 5.6, hd: 4.2, ...RF1 });
  const throneRide = makeSeatRide(THRONE.x, THRONE.z - 1.0, {
    //  reach를 5.0에서 줄였다. 너무 넓으면 옆 회전목마 앞에서도 '앉기'가 떠버린다
    seatY: THRONE_SEAT, yaw: 0, front: 5.4, reach: 4.0,
    label: '달의 옥좌에 앉았어요! 🌙', verb: '앉기',
  });
  throneRide.camDist = 13;      // 큰 옥좌라 카메라를 멀리 (가까우면 달이 화면을 덮는다)
  throneRide.camHeight = 6.5;
  room.rides.push(throneRide);

  // -----------------------------------------------------------
  //  🎠 별 회전목마 — 타면 빙글빙글 돈다
  // -----------------------------------------------------------
  const carousel = room.place(makeStarCarousel(), CAROUSEL.x, CAROUSEL.z, 0, { r: 5.6, ...RF1 });
  let now = 0;                        // 지금 시각 (회전목마와 박자를 맞추려고 기억해 둔다)
  let boardAngle = 0;                 // 올라탄 자리의 각도
  const carouselRide = {
    kind: 'carousel', label: '별 회전목마가 빙글빙글~ 🎠',
    verb: '타기', offVerb: '내리기',
    //  ★ 둘레 어디에 서도 '타기'가 나오게 자리를 촘촘히 둔다.
    //    자리가 4곳뿐이었을 때는 그 사이(모서리)에 서면 버튼이 안 떴다.
    //    12곳이면 이웃한 자리 사이가 3.8칸이라 reach(4.2) 안에 늘 들어온다
    enters: Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { x: CAROUSEL.x + Math.cos(a) * 7.2, z: CAROUSEL.z + Math.sin(a) * 7.2 };
    }),
    enter: { x: CAROUSEL.x + 7.2, z: CAROUSEL.z },
    exit:  { x: CAROUSEL.x + 7.2, z: CAROUSEL.z },
    //  ★ noNpc = 마을 친구는 안 탄다. **아이 자리다.**
    //    이걸 안 붙이면 친구가 올라타서 안 내리고, 아이는 '타기' 버튼이 영영 안 뜬다
    //    (duration이 길면 친구가 내리지 않는다 — npcs.js는 duration이 지나야 내린다)
    //  ★ duration은 넉넉하되 무한이 아니게. autoEnd가 false라 **아이는 계속 탄다**
    reach: 4.2, duration: 60, autoEnd: false, rider: null, noNpc: true,
    //  탈 때 카메라 — 조금 가까이, 그리고 **캐릭터 높이**를 본다
    //  (기본값은 하늘도 보이게 위를 봐서, 앉은 캐릭터가 화면 아래로 처진다)
    camDist: 12, camHeight: 6.5, lookHeight: 3.0,
    onRide(on, model) {
      if (!on) return;
      // 서 있던 쪽에서 그대로 올라탄다 (갑자기 반대편으로 순간이동하지 않게)
      boardAngle = Math.atan2(model.position.z - CAROUSEL.z, model.position.x - CAROUSEL.x)
                   - now * CAROUSEL_SPD;
    },
    tick(t) { now = t; },
    //  ★ 카메라를 늘 회전목마 **바깥쪽**에 둔다.
    //    안 그러면 가운데 기둥과 매다는 봉이 계속 앞을 가린다
    camYawAt() {
      const a = now * CAROUSEL_SPD + boardAngle;
      return Math.atan2(-Math.cos(a), -Math.sin(a));
    },
    //  ★ a = 지금 내가 있는 각도. 회전목마 자리와 **똑같은 식**으로 돌아야
    //    말과 캐릭터가 따로 놀지 않는다 (ruha-props.js의 spin.rotation.y 참고)
    pose(rideTime, o) {
      const a = now * CAROUSEL_SPD + boardAngle;
      const rr = CAROUSEL_R + CAROUSEL_OUT;   // 자리보다 조금 바깥에 앉는다
      o.x = CAROUSEL.x + Math.cos(a) * rr;
      o.z = CAROUSEL.z + Math.sin(a) * rr;
      o.y = CAROUSEL_SEAT + Math.sin(now * 2.2) * 0.18;   // 위아래로 살짝
      o.yaw = -a;                                         // 자리와 같은 쪽을 바라본다
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
    //  ★ 회전목마와 같은 이유로 아이 자리다 (위 설명 참고)
    reach: 3.4, duration: 60, autoEnd: false, rider: null, noNpc: true,
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
  const well = room.place(makeWishWell(), WELL.x, WELL.z, 0, { r: 3.6, ...RF1 });
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
  room.place(makeConstellationDome(), DOME.x, DOME.z, 0, { r: 4.2, ...RF1 });
  let talk = 0;
  room.addSpot({
    x: DOME.x, z: DOME.z + 5.2, r: 3.0, y: 0, verb: '별자리',
    use(toast) { toast(STARS_TALK[talk++ % STARS_TALK.length]); },
  });

  // -----------------------------------------------------------
  //  🌸 1층 서쪽 벽의 바깥 문 — 여기로 나가면 꽃길이다 (엄마성으로)
  //   ★ 문 그림은 한쪽만 보이는 판. 두꺼운 문틀을 앞에 두면 카메라가 가린다
  // -----------------------------------------------------------
  const fpGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 6.6), glow(0xd8f5c8));
  fpGlow.position.set(-W / 2 + 0.12, 3.3, RUHA_FP_DOOR.z);
  fpGlow.rotation.y = Math.PI / 2;
  fpGlow.userData.noShadow = true;
  room.scene.add(fpGlow);
  for (const dz of [-3.2, 3.2]) {
    room.hang(part('box', R.silver, 0, 0, 0, 0.6, 7.0, 0.6),
              -W / 2 + 0.4, 3.3, RUHA_FP_DOOR.z + dz, 0);
  }
  room.hang(part('box', R.silver, 0, 0, 0, 0.6, 0.6, 7.0),
            -W / 2 + 0.4, 6.9, RUHA_FP_DOOR.z, 0);
  room.hang(makeSign('꽃길 🌸 엄마성 가는 길', 6.6, 1.1, '#9fe08a', '#1b1b45'),
            -W / 2 + 0.45, 8.0, RUHA_FP_DOOR.z, Math.PI / 2);
  const fpMat = part('box', 0x9fe08a, 0, 0, 0, 2.6, 0.12, 4.2, glow(0x9fe08a));
  fpMat.castShadow = false;
  room.hang(fpMat, -W / 2 + 1.4, 0.08, RUHA_FP_DOOR.z, 0);

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
    //  ★ 계단·2층이 있는 공간이라 groundY를 넘겨준다 (player.js가 매 프레임 물어본다)
    groundY: ruhaGroundY,
    // ☁️ 2층 북쪽 문 — 구름 징검다리로 나간다 (인하성 2층으로 이어진다)
    //   y: RUHA_F2 를 적어야 1층에서 이 자리 밑을 지나가도 안 나가진다
    doors: [{
      x: SKY_DOOR.x, z: -D / 2 + 2.0, r: 2.2, y: RUHA_F2, to: 'skyway',
      label: '구름 징검다리! ☁️ 인하성으로 가요',
      build: buildSkywayArea,
      arrive: SKY_FROM_RUHA.pos.clone(), arriveYaw: SKY_FROM_RUHA.yaw,
    }, {
      // 🌸 1층 서쪽 문 — 꽃길로 나간다 (엄마성으로 이어진다)
      x: -W / 2 + 1.4, z: RUHA_FP_DOOR.z, r: 1.7, y: 0, to: 'flowerway',
      label: '꽃길! 🌸 엄마성으로 가요',
      build: buildFlowerArea,
      arrive: FP_FROM_RUHA.pos.clone(), arriveYaw: FP_FROM_RUHA.yaw,
    }],
  });
}

// -----------------------------------------------------------
//  🔗 이름표 붙이기 — 다리들이 "ruha"라는 이름으로 이 성을 찾는다
//    (src/area-link.js — 파일끼리 서로 부르지 않게 하는 방법)
// -----------------------------------------------------------
registerArea('ruha', buildRuhaCastle);
