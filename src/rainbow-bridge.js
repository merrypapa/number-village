// ===========================================================
//  🌈 무지개 다리 — 인하성 2층 서쪽에서 엄마성 꼭대기(10층)로 가는 길
//
//  구름 징검다리는 "돌"을 밟고 건너지만, 여기는 **무지개 길**이 쭉 이어져 있다.
//  길 위에 색색 띠가 깔려 있고, 하늘에는 무지개 아치와 새들이 있다.
//
//  ★ 걷는 규칙(길 밖으로 안 나가기)은 src/bridge.js가 맡는다. 여기는 꾸미기만 한다.
// ===========================================================
import * as THREE from 'three';
import { part, glow, makeHeart } from './castle-props.js';
import { makeBridge, makePlatform, makeCloudLump, makeRainbow } from './bridge.js';
import { areaBuilder } from './area-link.js';
import { HALF_X, FLOOR2 } from './castle-layout.js';
import { MOM_W, FLOORS, floorY } from './mom-layout.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const PATH_HALF = 3.6;      // 길의 반 너비 (징검다리보다 조금 넓다)
const A_PLAT = { x: 0, z: 3.5 };     // 🏰 인하성 쪽 승강장
const B_PLAT = { x: 0, z: -68.5 };   // 💗 엄마성 쪽 승강장
const PLAT_R = 5.8;
const ARCH_Z = 5.0;

// 무지개 색 (길에 깔리는 순서)
const RAINBOW = [0xff7a9c, 0xffa733, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff];

// 길이 지나가는 자리 — 인하성에서 엄마성까지. 반대쪽으로 휘어 있다
//  ★ 부드러운 곡선으로 바뀐다 (bridge.js). 모퉁이가 지면 걸음이 멈춘다
const CONTROL = [
  { x: 0,   z: 4 },
  { x: 0,   z: -8 },
  { x: 6,   z: -24 },
  { x: 7,   z: -40 },
  { x: -2,  z: -55 },
  { x: 0,   z: -71 },
];

// -----------------------------------------------------------
//  ★ 오갈 때 서는 자리 — 두 성과 이어지는 약속
// -----------------------------------------------------------
/** 인하성 2층 서쪽 발코니에서 무지개 다리로 나왔을 때 서는 자리 */
export const RB_FROM_CASTLE = { pos: new THREE.Vector3(0, 0, 1.5), yaw: Math.PI };
/** 엄마성 10층에서 무지개 다리로 나왔을 때 서는 자리 */
export const RB_FROM_MOM    = { pos: new THREE.Vector3(0, 0, -66.5), yaw: 0 };

/** 🌈 엄마성 10층 서쪽 벽에 난 문 자리 (엄마성도 이 값을 쓴다) */
export const MOM_RB_DOOR = { z: 4 };
/** 🌈 인하성 2층 서쪽 발코니에 난 문 자리 (인하성도 이 값을 쓴다) */
export const CASTLE_RB_DOOR = { z: 8 };

// 다리에서 성으로 **들어갈 때** 서는 자리 (문에서 넉넉히 안쪽)
const CASTLE_IN = { pos: new THREE.Vector3(-HALF_X + 12, FLOOR2, CASTLE_RB_DOOR.z),
                    yaw: Math.PI / 2 };
const MOM_IN = { pos: new THREE.Vector3(-MOM_W / 2 + 7.5, floorY(FLOORS - 1), MOM_RB_DOOR.z),
                 yaw: Math.PI / 2 };

// -----------------------------------------------------------
//  🐦 하늘을 나는 새 — 날개를 팔랑팔랑
// -----------------------------------------------------------
function makeBird(color = 0xfff6e8) {
  const g = new THREE.Group();
  g.add(part('ball', color, 0, 0, 0, 1.0, 0.8, 1.4));
  g.add(part('cone', 0xffb166, 0, 0, 0.9, 0.3, 0.6, 0.3));       // 부리
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = part('box', color, sx * 0.9, 0.2, 0, 1.6, 0.12, 0.9);
    g.add(w);
    wings.push({ m: w, sx });
  }
  g.userData.tick = (t) => {
    for (const w of wings) w.m.rotation.z = w.sx * Math.sin(t * 6) * 0.6;
  };
  return g;
}

// -----------------------------------------------------------
//  무지개 다리 공간 만들기
//    ctx = { envMap, buildMom, castleArrive/Yaw, momArrive/Yaw }
// -----------------------------------------------------------
export function buildRainbowArea(ctx) {
  return makeBridge({
    name: 'rainbowway',
    envMap: ctx.envMap,
    bg: 0xb8ecff,
    control: CONTROL,
    platA: A_PLAT, platB: B_PLAT,
    pathHalf: PATH_HALF, platR: PLAT_R, archZ: ARCH_Z,
    spawnAt: 'A',
    camDist: 11, camHeight: 6.4, lookHeight: 3.0,
    ends: [
      {
        at: 'A', to: 'castle',
        label: '인하성 2층으로 돌아왔어요 🏰',
        //  ★ 성을 만드는 함수는 **이름표**로 찾는다 (area-link.js)
        build: areaBuilder('castle'),
        arrive: CASTLE_IN.pos.clone(), arriveYaw: CASTLE_IN.yaw,
      },
      {
        at: 'B', to: 'mom',
        label: '엄마성 10층 하늘 전망대! 💗',
        build: areaBuilder('mom'),
        arrive: MOM_IN.pos.clone(), arriveYaw: MOM_IN.yaw,
      },
    ],

    decorate(scene, api) {
      // --- 🌈 무지개 길 — 길을 따라 색 띠를 쭉 깐다 ---
      const pts = api.CURVE.getSpacedPoints(120);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z) + 0.25;   // 살짝 겹치게
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        // 바닥판 (하얀 구름 길)
        const deck = part('box', 0xfff6fb, mx, -0.25, mz, PATH_HALF * 2, 0.5, len);
        deck.rotation.y = yaw;
        deck.receiveShadow = true;
        scene.add(deck);
        // 그 위에 무지개 띠 (여섯 색이 차례로)
        const band = part('box', RAINBOW[i % RAINBOW.length], mx, 0.03, mz,
                          PATH_HALF * 2 - 0.6, 0.1, len, glow(RAINBOW[i % RAINBOW.length]));
        band.rotation.y = yaw;
        band.castShadow = false;
        scene.add(band);
      }

      // --- 길가 난간 구슬 (떨어질 것 같지 않게 눈으로 알려준다) ---
      const edge = api.alongPath(4.5, 2);
      edge.forEach((p, i) => {
        for (const sx of [-1, 1]) {
          const b = part('ball', i % 2 ? 0xffffff : 0xffe98a,
                         p.x + sx * (PATH_HALF + 0.3), 0.5, p.z, 0.7,
                         0.7, 0.7, glow(i % 2 ? 0xffffff : 0xffe98a));
          b.castShadow = false;
          scene.add(b);
        }
      });

      // --- 양 끝 승강장 ---
      const inha = makePlatform(0xffd9e8, '인하성', 0xffb8d4);
      inha.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(inha);
      const mom = makePlatform(0xffe6f4, '엄마성', 0xff6fa5);
      mom.position.set(B_PLAT.x, 0, B_PLAT.z);
      mom.rotation.y = Math.PI;
      scene.add(mom);

      // --- 아래에 깔린 구름 바다 ---
      for (let i = 0; i < 36; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 44;
        const lump = makeCloudLump(1.6 + Math.random() * 2.4);
        lump.position.set(Math.cos(a) * r, -11 - Math.random() * 16,
                          -34 + Math.sin(a) * r - Math.random() * 20);
        scene.add(lump);
      }

      // --- 길 위를 가로지르는 큰 무지개 아치 세 개 ---
      for (const [z, r, ry] of [[-18, 17, 0.3], [-38, 20, -0.25], [-56, 15, 0.4]]) {
        const bow = makeRainbow(r);
        bow.position.set(2, -1, z);
        bow.rotation.y = ry;
        scene.add(bow);
      }

      // --- 🐦 새와 💗 하트가 둥실둥실 ---
      const flyers = api.alongPath(11, 4);
      flyers.forEach((p, i) => {
        const bird = makeBird(i % 2 ? 0xfff6e8 : 0xffe6f4);
        const bx = p.x + (i % 2 ? 7 : -7);
        bird.position.set(bx, 5 + (i % 3), p.z);
        bird.rotation.y = i % 2 ? -0.5 : 0.5;
        scene.add(bird);
        api.addTick((t, dt) => {
          bird.userData.tick(t, dt);
          bird.position.y = 5 + (i % 3) + Math.sin(t * 0.9 + i) * 0.6;
        });

        const h = makeHeart(i % 2 ? 0xff6fa5 : 0xffd45e, 0.9);
        h.position.set(p.x + (i % 2 ? -5 : 5), 3.4 + (i % 2), p.z + 3);
        scene.add(h);
        api.addTick((t) => {
          h.position.y = 3.4 + (i % 2) + Math.sin(t * 1.2 + i) * 0.4;
          h.rotation.y = t * 0.5;
        });
      });
    },
  });
}
