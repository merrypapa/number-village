// ===========================================================
//  💗 엄마성 — 10층짜리 키즈카페 성
//
//  층마다 놀거리가 다르다. 층과 층 사이는 🛗 엘리베이터로만 오간다.
//    1층 볼풀장 · 2층 트램폴린 · 3층 미끄럼틀 · 4층 블록 · 5층 씽씽카
//    6층 인형의 집 · 7층 음악방 · 8층 간식 카페 · 9층 이야기 텐트 · 10층 하늘 전망대
//
//  ★ 방 뼈대(바닥·벽·천장·정문)는 src/interior.js가 만들어 준다.
//  ★ 10층 바닥과 엘리베이터는 src/mom-layout.js,  물건 모양은 src/mom-props.js.
//  ★ 어느 층에서도 **떨어지지 않는다** — 층 바닥이 통째로 깔려 있다.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture } from './interior.js';
import {
  FLOORS, FLOOR_H, MOM_W, MOM_D, MOM_H, floorY, FL, SHAFT, LIFT_STAND,
  FLOOR_COLORS, momGroundY, buildMomStructure, makeLift,
} from './mom-layout.js';
import { P } from './mom-props.js';
import { fillFloors } from './mom-floors.js';
import { makeSign } from './mart-props.js';
import { part, glow } from './castle-props.js';
import { buildRainbowBridge, RB_FROM_MOM } from './rainbow-bridge.js';
import { HALF_X, FLOOR2 } from './castle-layout.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const OWNER = 'heartping';        // 엄마성 주인 (characters.js의 id)

// 마을에서 엄마성이 서 있는 자리 (world.js가 이 값을 보고 건물을 놓는다)
export const MOM_SITE = { x: -50, z: -54, hw: 12.5, hd: 10.5, doorZ: -41.5 };

// 층 이름 — 엘리베이터 버튼과 층수판에 그대로 나온다
export const FLOOR_NAMES = [
  '볼풀장 🎈', '트램폴린 🤸', '미끄럼틀 🛝', '블록 놀이 🧱', '씽씽카 🚗',
  '인형의 집 🧸', '음악방 🥁', '간식 카페 🍰', '이야기 텐트 ⛺', '하늘 전망대 🌈',
];

// 🌈 10층 서쪽 벽에 난 무지개 다리 문 자리
const RAINBOW_DOOR = { z: 4 };

export function buildMomCastle(ctx) {
  const room = makeInterior({
    name: 'mom',
    w: MOM_W, d: MOM_D, h: MOM_H,
    envMap: ctx.envMap,
    bg: 0xffe6f4,
    light: 1.15,
    shadow: false,          // ★ 90칸이나 높아서 그림자 지도가 흐려진다 → 끈다
    lampColor: 0xfff0f6,
    skyLight: 0xffffff, floorLight: 0xffd9ec,
    floorTex: (() => { const t = tileTexture('#ffe1ef', '#fff6fb', 8); return t; })(),
    wallColor: 0xfff3f8,
    ceilColor: 0xffd9ec,
    doorFrame: 0xff9ec4,
    exit: { x: MOM_SITE.x, z: MOM_SITE.doorZ + 6.0, yaw: 0 },
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 12, camHeight: 6.5, lookHeight: 3.0,
  });

  // -----------------------------------------------------------
  //  🏗 10층 바닥 + 엘리베이터 통로
  // -----------------------------------------------------------
  const structure = buildMomStructure(room.scene, FLOOR_NAMES);
  room.obstacles.push(...structure.obstacles);
  const lift = makeLift(room.scene, FLOOR_NAMES);
  const rides = [...lift.rides];
  const spots = [];

  /** 층마다 붙는 공통 설정 (놀이기구) */
  function floorRide(i, o) {
    return {
      enterY: floorY(i),
      //  ★ 마을 친구는 안 탄다 (친구가 타고 안 내리면 아이가 못 탄다)
      noNpc: true, duration: 300, autoEnd: false, rider: null,
      camBase: true,                 // 높은 층이라 카메라가 같이 올라가야 한다
      camDist: 12, camHeight: 6, lookHeight: 2.8,
      ...o,
    };
  }

  /** i층 y좌표에 물건을 놓는다 */
  function put(group, i, x, z, ry = 0, hit = null) {
    return room.place(group, x, z, ry, hit ? { ...hit, ...FL(i) } : null, floorY(i));
  }

  /** i층 눈높이에 간판을 건다 (바닥에 눕지 않게 3.4칸 띄운다) */
  function putSign(i, text, x, z, ry, w, h, bg, fg) {
    return room.hang(makeSign(text, w, h, bg, fg), x, floorY(i) + 3.4, z, ry);
  }

  // ===========================================================
  //  1~10층 꾸미기 → src/mom-floors.js
  // ===========================================================
  fillFloors(room, ctx, { put, putSign, floorRide, rides, spots });

  {
    const i = FLOORS - 1, base = floorY(i);
    // 🌈 서쪽 벽에 난 바깥 문 — 여기로 나가면 무지개 다리다 (인하성으로)
    //   ★ 문 그림은 **한쪽만 보이는 판**이다. 두꺼운 문틀을 앞에 두면
    //     들어올 때 카메라가 문 뒤에 서서 앞을 다 가린다
    const rbGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 6.6),
                                  new THREE.MeshBasicMaterial({ color: 0xdff3ff }));
    rbGlow.position.set(-MOM_W / 2 + 0.12, base + 3.3, RAINBOW_DOOR.z);
    rbGlow.rotation.y = Math.PI / 2;
    room.scene.add(rbGlow);
    for (const dz of [-3.2, 3.2]) {
      room.hang(part('box', P.hot, 0, 0, 0, 0.6, 7.0, 0.6),
                -MOM_W / 2 + 0.4, base + 3.3, RAINBOW_DOOR.z + dz, 0);
    }
    room.hang(part('box', P.hot, 0, 0, 0, 0.6, 0.6, 7.0),
              -MOM_W / 2 + 0.4, base + 6.9, RAINBOW_DOOR.z, 0);
    room.hang(makeSign('무지개 다리 🌈 인하성 가는 길', 6.6, 1.1, '#ff9ec4', '#5b3d8f'),
              -MOM_W / 2 + 0.45, base + 8.0, RAINBOW_DOOR.z, Math.PI / 2);
    const rbMat = part('box', P.hot, 0, 0, 0, 2.6, 0.12, 4.2, glow(P.hot));
    rbMat.castShadow = false;
    room.hang(rbMat, -MOM_W / 2 + 1.4, base + 0.08, RAINBOW_DOOR.z, 0);
  }

  // -----------------------------------------------------------
  //  마무리 — 주인 하트핑과 1층에서 노는 친구들
  //   ★ 마을 친구는 1층에서만 논다 (npcs.js는 층을 오르내리지 못한다)
  // -----------------------------------------------------------
  for (const r of rides) room.rides.push(r);
  for (const s of spots) room.addSpot(s);

  return room.finish({
    npcCount: 3,
    wanderZones: [{ x: -14, z: 10, r: 4 }, { x: 14, z: 10, r: 4 }, { x: 0, z: 14, r: 4 }],
    residents: [{ id: OWNER, x: 13, z: -4, yaw: Math.PI * 0.8, stay: true }],
    //  ★ 층이 열 개라 groundY를 넘겨준다 (player.js가 매 프레임 물어본다)
    groundY: momGroundY,
    // 🌈 10층 서쪽 문 — 무지개 다리로 나간다 (인하성 2층으로 이어진다)
    //   y: floorY(9) 를 적어야 아래층에서 이 자리를 지나가도 안 나가진다
    doors: [{
      x: -MOM_W / 2 + 1.4, z: RAINBOW_DOOR.z, r: 1.7, y: floorY(FLOORS - 1),
      to: 'rainbowway',
      label: '무지개 다리! 🌈 인하성으로 가요',
      build: buildRainbowArea,
      arrive: RB_FROM_MOM.pos.clone(), arriveYaw: RB_FROM_MOM.yaw,
    }],
  });
}

// -----------------------------------------------------------
//  🌈 무지개 다리 만들기 — 인하성과 엄마성이 **똑같은 함수**를 쓴다.
//    어느 쪽에서 먼저 건너가든 같은 다리가 나오게 하려고
//    "오갈 때 서는 자리"를 여기 한 곳에만 적어둔다.
// -----------------------------------------------------------
export function buildRainbowArea(ctx) {
  return buildRainbowBridge({
    ...ctx,
    buildMom: buildMomCastle,
    // 무지개 다리 → 엄마성 10층 서쪽 문으로 들어올 때 서는 자리
    //  ★ 도착 자리의 y가 "몇 층"을 뜻한다. 10층 바닥 높이를 적어야 10층에 내려선다
    momArrive: new THREE.Vector3(-MOM_W / 2 + 7.5, floorY(FLOORS - 1), RAINBOW_DOOR.z),
    momYaw: Math.PI / 2,
    // 무지개 다리 → 인하성 2층 서쪽 발코니로 돌아갈 때 서는 자리
    //  ★ 문에서 넉넉히 안쪽에 세운다. 문 바로 앞이면 카메라가 성벽 밖에 선다
    castleArrive: new THREE.Vector3(-HALF_X + 12, FLOOR2, 8),
    castleYaw: Math.PI / 2,
  });
}

export { RB_FROM_CASTLE } from './rainbow-bridge.js';

// 다른 파일이 층 정보를 물어볼 때 쓴다 (무지개 다리·꽃길이 몇 층으로 이어지나)
export { FLOORS, FLOOR_H, floorY, LIFT_STAND, SHAFT, MOM_W, MOM_D, MOM_H, FLOOR_COLORS };
