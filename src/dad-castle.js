// ===========================================================
//  🛠 아빠성 — 뚝딱 공작소 (2층짜리)
//
//  1층 🔧 공작소 · 기차역 : 작업대, 공구벽, 로봇, 자동차 리프트, **미니 기차**
//  2층 ⛺ 캠핑 데크        : 텐트, 모닥불, 캠핑 의자, 망원경
//
//  길이 세 개나 이어진다 —
//    🚂 기차길   : 2층 북쪽 ↔ 인하성 2층
//    🪨 돌다리   : 1층 동쪽 ↔ 루하성 1층
//    🪢 밧줄 다리 : 2층 서쪽 ↔ 엄마성 5층
//
//  ★ 방 뼈대(바닥·벽·천장·정문)는 src/interior.js가 만들어 준다.
//  ★ 2층 바닥·계단은 src/dad-layout.js,  물건 모양은 src/dad-props.js.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import {
  DAD_W, DAD_D, DAD_H, DAD_F2, DF1, DF2, D, dadGroundY, buildDadStructure,
} from './dad-layout.js';
import {
  makeWorkbench, makeToolWall, makeTrain, makeRailLoop, makeRobot,
  makeCampfire, makeCampChair, makeLantern, makeCrate, makeCarLift,
} from './dad-props.js';
import { makeTent } from './mom-props.js';
import { makeSign } from './mart-props.js';
import { makeTelescope } from './castle-props2.js';
import { part, glow } from './castle-props.js';
import { makeWallDoor } from './castle-door.js';
import { registerArea } from './area-link.js';
import {
  buildTrainWay, buildStoneWay, buildRopeWay,
  TW_FROM_DAD, SW_FROM_DAD, RW_FROM_DAD,
  DAD_TW_DOOR, DAD_SW_DOOR, DAD_RW_DOOR,
} from './dad-bridges.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const OWNER = 'ttukttak';         // 아빠성 주인 (characters.js의 id) — 뚝딱핑

// 마을에서 아빠성이 서 있는 자리 (world.js가 이 값을 보고 건물을 놓는다)
export const DAD_SITE = { x: -62, z: 8, hw: 12.5, hd: 10.5, doorZ: 20.5 };

// 물건이 놓이는 자리
const BENCH  = { x: -14, z: -12 };   // 🔨 작업대 (1층 북서)
const LIFT   = { x: 14,  z: -13 };   // 🚙 자동차 리프트 (1층 북동)
const ROBOT  = { x: -6,  z: 1 };     // 🤖 로봇 친구 (기차 레일 **안쪽**에 둔다)
//  ★★ 레일이 **마을로 나가는 문(z 18.8)을 지나가면 안 된다.**
//     기차를 타고 한 바퀴 돌다가 문에 닿아서 마을로 튕겨 나갔다.
//     레일 남쪽 끝 = z 4 + 10 = 14 → 문에서 4.8칸 떨어져 있다
const RAIL   = { x: 0,   z: 4, r: 10 };   // 🚂 기차 레일 (1층 가운데~남쪽)
const TRAIN_SPD = 0.42;              // 기차가 도는 빠르기
const FIRE   = { x: 0,   z: -11 };   // 🔥 모닥불 (2층)
const TENT   = { x: -13, z: -14 };   // ⛺ 텐트 (2층)

// 🔨 작업대에서 나오는 말
const BENCH_TALK = [
  '뚝딱뚝딱! 나무를 잘라요 🔨',
  '나사를 조여요. 끼익끼익 🔩',
  '못을 탕탕 박아요!',
  '사포로 쓱싹쓱싹 다듬어요',
];
// 🤖 로봇이 하는 말
const ROBOT_TALK = [
  '삐빅— 안녕하세요! 저는 뚝딱 로봇이에요 🤖',
  '삐빅— 오늘도 좋은 하루!',
  '삐빅— 아빠가 저를 만들었어요',
  '삐빅— 같이 기차 탈래요? 🚂',
];
// 🔭 2층 망원경으로 보이는 것
const VIEW_TALK = [
  '별이 정말 많아요 ✨', '저기 엄마성 불빛이 반짝여요 💗',
  '인하성 지붕이 보여요 🏰', '유성이 지나갔어요! 소원 빌어요 🌠',
];

export function buildDadCastle(ctx) {
  const room = makeInterior({
    name: 'dad',
    w: DAD_W, d: DAD_D, h: DAD_H,
    envMap: ctx.envMap,
    bg: 0xdfeaf5,
    light: 0.95,
    lampColor: 0xfff0d8,
    skyLight: 0xf2f6ff, floorLight: 0xd8c8b0,
    floorTex: tileTexture('#cbb79a', '#e0cdb0', 10, '#a98d68'),
    wallTex: wallpaperTexture('#e9dcc8', '#9a6238', '#8d93a8'),
    ceilColor: 0xd8cdbb,
    doorFrame: 0xffc93d,
    exit: { x: DAD_SITE.x, z: DAD_SITE.doorZ + 6.0, yaw: 0 },
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 12, camHeight: 6.5, lookHeight: 3.2,
  });

  // -----------------------------------------------------------
  //  🏗 2층 뼈대 (바닥·계단·난간·기둥)
  // -----------------------------------------------------------
  const structure = buildDadStructure(room.scene);
  room.obstacles.push(...structure.obstacles);
  const rides = [];

  room.hang(makeSign('아빠성 — 뚝딱 공작소 🛠', 16, 2.0, '#8b5a3c', '#ffc93d'),
            0, 6.6, DAD_D / 2 - 0.4, Math.PI);

  // ===========================================================
  //  1층 🔧 공작소
  // ===========================================================
  room.place(makeWorkbench(9), BENCH.x, BENCH.z, 0, { hw: 4.6, hd: 1.6, ...DF1 });
  room.hang(makeToolWall(11, 5.4), BENCH.x, 5.2, -DAD_D / 2 + 0.4, 0);
  room.place(makeCarLift(), LIFT.x, LIFT.z, 0, { hw: 4.2, hd: 2.6, ...DF1 });
  const robot = room.place(makeRobot(), ROBOT.x, ROBOT.z, 0, { r: 1.8, ...DF1 });
  for (const [cx, cz, s] of [[-21, 2, 2.4], [-21, 5, 2.0], [-19.6, 3.4, 1.8], [21, 3, 2.4]]) {
    room.place(makeCrate(s), cx, cz, Math.random(), { r: s * 0.7, ...DF1 });
  }
  room.place(makeLantern(), -21, -6, 0, { r: 0.8, ...DF1 });
  room.place(makeLantern(0xffb166), 21, -6, 0, { r: 0.8, ...DF1 });

  // 🔨 작업대에서 '뚝딱' — 누르면 나무 두드리는 소리가 난다
  let bench = 0;
  room.addSpot({
    x: BENCH.x, z: BENCH.z + 3.0, r: 3.2, y: 0, verb: '뚝딱',
    use(toast) {
      ctx.music?.ping?.(48 + (bench % 3) * 4, 'square');   // 낮고 둔탁한 소리
      toast(BENCH_TALK[bench++ % BENCH_TALK.length]);
    },
  });
  // 🤖 로봇에게 말 걸기
  let rtalk = 0;
  room.addSpot({
    x: ROBOT.x, z: ROBOT.z + 3.0, r: 3.0, y: 0, verb: '로봇',
    use(toast) {
      ctx.music?.ping?.(84, 'square');                      // 삐빅
      toast(ROBOT_TALK[rtalk++ % ROBOT_TALK.length]);
    },
  });

  // ===========================================================
  //  1층 🚂 미니 기차 — 레일을 따라 빙글빙글 돈다
  // ===========================================================
  room.place(makeRailLoop(RAIL.r), RAIL.x, RAIL.z, 0, null);
  const train = makeTrain();
  const A0 = Math.PI / 2;                       // 세워둔 자리 (남쪽)
  train.position.set(RAIL.x + Math.cos(A0) * RAIL.r, 0, RAIL.z + Math.sin(A0) * RAIL.r);
  train.rotation.y = Math.atan2(-Math.sin(A0), Math.cos(A0));
  room.scene.add(train);

  rides.push({
    kind: 'train', label: '칙칙폭폭! 기차 출발 🚂', verb: '타기', offVerb: '내리기',
    enter: { x: RAIL.x, z: RAIL.z + RAIL.r - 4.0 },
    exit:  { x: RAIL.x, z: RAIL.z + RAIL.r - 4.0 },
    enterY: 0, reach: 4.2,
    //  ★ 마을 친구는 안 탄다 (친구가 타고 안 내리면 아이가 못 탄다)
    noNpc: true, duration: 300, autoEnd: false, rider: null,
    camDist: 15, camHeight: 7.5, lookHeight: 2.8,
    pose(t, o) {
      //  ★ 기차 자리와 내 자리를 **같은 각도 하나**로 계산한다
      //    (따로 계산하면 회전목마처럼 서로 따로 돈다)
      const a = A0 + t * TRAIN_SPD;
      const x = RAIL.x + Math.cos(a) * RAIL.r;
      const z = RAIL.z + Math.sin(a) * RAIL.r;
      const yaw = Math.atan2(-Math.sin(a), Math.cos(a));
      train.position.set(x, 0, z);
      train.rotation.y = yaw;
      //  객차(기관차 뒤 2.6칸)에 앉는다
      o.x = x - Math.sin(yaw) * 2.6;
      o.z = z - Math.cos(yaw) * 2.6;
      o.y = 2.0;
      o.yaw = yaw;
      o.tilt = 0;
      return o;
    },
  });

  // ===========================================================
  //  2층 ⛺ 캠핑 데크
  // ===========================================================
  room.place(makeTent(D.green), TENT.x, TENT.z, 0, { r: 3.6, ...DF2 }, DAD_F2);
  const fire = room.place(makeCampfire(), FIRE.x, FIRE.z, 0, { r: 2.4, ...DF2 }, DAD_F2);
  for (const [cx, cz, ry, color] of [[-5.5, -6.5, 0.5, D.red], [5.5, -6.5, -0.5, D.sky],
                                     [6.5, -14, -2.4, D.yellow]]) {
    const chair = room.place(makeCampChair(color), cx, cz, ry, { r: 1.4, ...DF2 }, DAD_F2);
    // 의자에 앉기
    const front = 2.6;
    const ex = cx + Math.sin(ry) * front, ez = cz + Math.cos(ry) * front;
    rides.push({
      kind: 'campchair', label: '모닥불 앞에서 쉬어요 🔥', verb: '앉기', offVerb: '일어나기',
      enter: { x: ex, z: ez }, exit: { x: ex, z: ez },
      enterY: DAD_F2, reach: 3.0,
      noNpc: true, duration: 300, autoEnd: false, rider: null,
      camBase: true, camDist: 10, camHeight: 5.4, lookHeight: 2.4,
      pose(t, o) {
        o.x = cx; o.z = cz;
        o.y = DAD_F2 + 1.2 + Math.sin(t * 1.4) * 0.03;
        o.yaw = ry + Math.sin(t * 0.6) * 0.08;
        o.tilt = -0.06;
        return o;
      },
    });
    void chair;
  }
  room.place(makeTelescope(), 15, -17, 0.4, { r: 1.6, ...DF2 }, DAD_F2);
  room.place(makeLantern(), -20, -6, 0, { r: 0.8, ...DF2 }, DAD_F2);
  room.place(makeLantern(0xffd48a), 20, -8, 0, { r: 0.8, ...DF2 }, DAD_F2);
  room.place(makeCrate(2.0), -20, -17, 0.4, { r: 1.4, ...DF2 }, DAD_F2);

  let vtalk = 0;
  room.addSpot({
    x: 15, z: -13.4, r: 3.2, y: DAD_F2, verb: '망원경',
    use(toast) { toast(VIEW_TALK[vtalk++ % VIEW_TALK.length]); },
  });
  void fire; void robot;

  // ===========================================================
  //  🚪 바깥으로 나가는 문 세 개 (길로 이어진다)
  // ===========================================================
  // 🚂 2층 북쪽 — 기차길 (인하성으로)
  makeWallDoor(room.scene, {
    side: 'n', wall: -DAD_D / 2, at: DAD_TW_DOOR.x, base: DAD_F2,
    frame: D.red, light: 0xffe8c8, mat: D.yellow,
    text: '기차길 🚂 인하성 가는 길', bg: '#ffc93d', fg: '#5b3d24',
  });
  // 🪨 1층 동쪽 — 돌다리 (루하성으로)
  makeWallDoor(room.scene, {
    side: 'e', wall: DAD_W / 2, at: DAD_SW_DOOR.z, base: 0,
    frame: D.iron, light: 0xdfe4ea,
    text: '돌다리 🪨 루하성 가는 길', bg: '#8d93a8', fg: '#ffffff',
  });
  // 🪢 2층 서쪽 — 밧줄 다리 (엄마성으로)
  makeWallDoor(room.scene, {
    side: 'w', wall: -DAD_W / 2, at: DAD_RW_DOOR.z, base: DAD_F2,
    frame: D.wood, light: 0xffe8c8,
    text: '밧줄 다리 🪢 엄마성 가는 길', bg: '#c98a56', fg: '#ffffff',
  });

  // -----------------------------------------------------------
  //  마무리 — 주인 뚝딱핑과 1층에서 노는 친구들
  // -----------------------------------------------------------
  for (const r of rides) room.rides.push(r);

  return room.finish({
    npcCount: 3,
    wanderZones: [{ x: -16, z: 14, r: 4 }, { x: 16, z: 14, r: 4 }, { x: 0, z: -4, r: 5 }],
    residents: [{ id: OWNER, x: BENCH.x + 4.5, z: BENCH.z + 1.5, yaw: Math.PI * 0.8, stay: true }],
    //  ★ 2층이 있으니 groundY를 넘겨준다 (player.js가 매 프레임 물어본다)
    groundY: dadGroundY,
    doors: [
      {
        // 🚂 2층 북쪽 문 → 기차길 → 인하성 2층
        x: DAD_TW_DOOR.x, z: -DAD_D / 2 + 1.7, r: 1.7, y: DAD_F2, to: 'trainway',
        label: '기차길! 🚂 인하성으로 가요',
        build: buildTrainWay,
        arrive: TW_FROM_DAD.pos.clone(), arriveYaw: TW_FROM_DAD.yaw,
      },
      {
        // 🪨 1층 동쪽 문 → 돌다리 → 루하성 1층
        x: DAD_W / 2 - 1.7, z: DAD_SW_DOOR.z, r: 1.7, y: 0, to: 'stoneway',
        label: '돌다리! 🪨 루하성으로 가요',
        build: buildStoneWay,
        arrive: SW_FROM_DAD.pos.clone(), arriveYaw: SW_FROM_DAD.yaw,
      },
      {
        // 🪢 2층 서쪽 문 → 밧줄 다리 → 엄마성 5층
        x: -DAD_W / 2 + 1.7, z: DAD_RW_DOOR.z, r: 1.7, y: DAD_F2, to: 'ropeway',
        label: '밧줄 다리! 🪢 엄마성으로 가요',
        build: buildRopeWay,
        arrive: RW_FROM_DAD.pos.clone(), arriveYaw: RW_FROM_DAD.yaw,
      },
    ],
  });
}

// -----------------------------------------------------------
//  🔗 이름표 붙이기 — 길들이 "dad"라는 이름으로 이 성을 찾는다
// -----------------------------------------------------------
registerArea('dad', buildDadCastle);
