// ===========================================================
//  🛠 아빠성으로 가는 길 세 가지 — 아빠가 직접 놓은 다리들
//
//    🚂 기차길   : 인하성 2층 남서  ↔ 아빠성 2층 북쪽
//    🪨 돌다리   : 루하성 1층 북쪽  ↔ 아빠성 1층 동쪽
//    🪢 밧줄 다리 : 엄마성 5층 서쪽  ↔ 아빠성 2층 서쪽
//
//  ★ 걷는 규칙(길 밖으로 안 나가기)은 src/bridge.js가 맡는다. 여기는 꾸미기만 한다.
//  ★ 세 다리가 생김새만 다르고 뼈대는 똑같아서 한 파일에 모았다.
// ===========================================================
import * as THREE from 'three';
import { part, toon, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { makeBridge, makePlatform, makeCloudLump } from './bridge.js';
import { areaBuilder } from './area-link.js';
import { HALF_X, HALF_Z, FLOOR2 } from './castle-layout.js';
import { RUHA_D } from './ruha-layout.js';
import { MOM_W, floorY } from './mom-layout.js';
import { DAD_W, DAD_D, DAD_F2, D } from './dad-layout.js';

// -----------------------------------------------------------
//  ★ 성마다 어느 벽에 문이 나는지 (성 파일도 이 값을 가져다 쓴다)
// -----------------------------------------------------------
/** 🚂 인하성 2층 남서쪽 벽 (별 전망대 옆) */
export const CASTLE_TW_DOOR = { x: -21 };
/** 🚂 아빠성 2층 북쪽 벽 */
export const DAD_TW_DOOR = { x: 0 };
/** 🪨 루하성 1층 북쪽 벽 */
export const RUHA_SW_DOOR = { x: -18 };
/** 🪨 아빠성 1층 동쪽 벽 */
export const DAD_SW_DOOR = { z: 10 };
/** 🪢 엄마성 5층 서쪽 벽 */
export const MOM_RW_DOOR = { z: 12, floor: 4 };
/** 🪢 아빠성 2층 서쪽 벽 */
export const DAD_RW_DOOR = { z: -12 };

// -----------------------------------------------------------
//  ★ 길에서 성으로 **들어갈 때** 서는 자리 (문에서 넉넉히 안쪽)
// -----------------------------------------------------------
const CASTLE_IN = { pos: new THREE.Vector3(CASTLE_TW_DOOR.x, FLOOR2, HALF_Z - 8),
                    yaw: Math.PI };
const DAD_TW_IN = { pos: new THREE.Vector3(DAD_TW_DOOR.x, DAD_F2, -DAD_D / 2 + 7),
                    yaw: 0 };
const RUHA_IN   = { pos: new THREE.Vector3(RUHA_SW_DOOR.x, 0, -RUHA_D / 2 + 7),
                    yaw: 0 };
const DAD_SW_IN = { pos: new THREE.Vector3(DAD_W / 2 - 7.5, 0, DAD_SW_DOOR.z),
                    yaw: -Math.PI / 2 };
const MOM_IN    = { pos: new THREE.Vector3(-MOM_W / 2 + 7.5, floorY(MOM_RW_DOOR.floor),
                                           MOM_RW_DOOR.z), yaw: Math.PI / 2 };
const DAD_RW_IN = { pos: new THREE.Vector3(-DAD_W / 2 + 7.5, DAD_F2, DAD_RW_DOOR.z),
                    yaw: Math.PI / 2 };

// -----------------------------------------------------------
//  ★ 길로 나왔을 때 서는 자리 (성 파일이 가져다 쓴다)
//    A쪽은 승강장 조금 앞, B쪽도 마찬가지
// -----------------------------------------------------------
const A_PLAT = { x: 0, z: 3.5 };
const A_OUT = new THREE.Vector3(0, 0, 1.5);

/** 🚂 인하성에서 기차길로 나왔을 때 */
export const TW_FROM_CASTLE = { pos: A_OUT.clone(), yaw: Math.PI };
/** 🚂 아빠성에서 기차길로 나왔을 때 */
export const TW_FROM_DAD    = { pos: new THREE.Vector3(0, 0, -56.5), yaw: 0 };
/** 🪨 루하성에서 돌다리로 나왔을 때 */
export const SW_FROM_RUHA   = { pos: A_OUT.clone(), yaw: Math.PI };
/** 🪨 아빠성에서 돌다리로 나왔을 때 */
export const SW_FROM_DAD    = { pos: new THREE.Vector3(0, 0, -46.5), yaw: 0 };
/** 🪢 엄마성에서 밧줄 다리로 나왔을 때 */
export const RW_FROM_MOM    = { pos: A_OUT.clone(), yaw: Math.PI };
/** 🪢 아빠성에서 밧줄 다리로 나왔을 때 */
export const RW_FROM_DAD    = { pos: new THREE.Vector3(0, 0, -50.5), yaw: 0 };

// -----------------------------------------------------------
//  길 바닥 깔기 — 길을 따라 널빤지를 쭉 놓는다 (세 다리가 같이 쓴다)
//    deck(scene, api, { 색, 두께, 무늬 })
// -----------------------------------------------------------
function layDeck(scene, api, opt) {
  const pts = api.CURVE.getSpacedPoints(opt.pieces ?? 80);
  const half = opt.half;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z) + 0.3;     // 살짝 겹치게
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    const deck = part('box', opt.color, mx, -0.25, mz, half * 2, 0.5, len);
    deck.rotation.y = yaw;
    deck.receiveShadow = true;
    scene.add(deck);
    if (opt.stripe && i % 2 === 0) {
      const st = part('box', opt.stripe, mx, 0.03, mz, half * 2 - 0.5, 0.1, len * 0.8);
      st.rotation.y = yaw;
      st.castShadow = false;
      scene.add(st);
    }
    out.push({ x: mx, z: mz, yaw });
  }
  return out;
}

/** 아래에 구름 바다 (세 다리가 같이 쓴다) */
function cloudSea(scene, n, zMid) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 42;
    const lump = makeCloudLump(1.6 + Math.random() * 2.4);
    lump.position.set(Math.cos(a) * r, -11 - Math.random() * 16,
                      zMid + Math.sin(a) * r - Math.random() * 18);
    scene.add(lump);
  }
}

// ===========================================================
//  🚂 기차길 — 인하성 2층 ↔ 아빠성 2층
//    침목과 레일이 깔린 하늘 철길. 신호등과 작은 역이 있다
// ===========================================================
const TW_CONTROL = [
  { x: 0, z: 4 }, { x: 0, z: -10 }, { x: 5, z: -26 },
  { x: 5, z: -40 }, { x: 0, z: -52 }, { x: 0, z: -59 },
];
const TW_PLAT_B = { x: 0, z: -58.5 };

export function buildTrainWay(ctx) {
  return makeBridge({
    name: 'trainway',
    envMap: ctx.envMap,
    bg: 0xbfe0f5,
    control: TW_CONTROL,
    platA: A_PLAT, platB: TW_PLAT_B,
    pathHalf: 3.6,
    spawnAt: 'A',
    camDist: 11, camHeight: 6.4,
    ends: [
      { at: 'A', to: 'castle', label: '인하성 2층으로 돌아왔어요 🏰',
        build: areaBuilder('castle'),
        arrive: CASTLE_IN.pos.clone(), arriveYaw: CASTLE_IN.yaw },
      { at: 'B', to: 'dad', label: '아빠성에 도착! 🛠 뚝딱 공작소',
        build: areaBuilder('dad'),
        arrive: DAD_TW_IN.pos.clone(), arriveYaw: DAD_TW_IN.yaw },
    ],
    decorate(scene, api) {
      // 자갈길 + 침목
      const seg = layDeck(scene, api, { color: 0xbfae94, half: 3.6, pieces: 80 });
      seg.forEach((s, i) => {
        if (i % 2) return;
        //  ★ 침목은 이미 "가로 6.0 × 세로 1.0"으로 만들었다.
        //    여기에 +90°를 더하면 오히려 길을 **따라** 눕는다 (장미 아치와 같은 실수)
        const tie = part('box', D.woodDark, s.x, 0.12, s.z, 6.0, 0.26, 1.0);
        tie.rotation.y = s.yaw;
        tie.castShadow = false;
        scene.add(tie);
      });
      // 레일 두 줄 (길을 따라 이어 붙인다)
      for (const off of [-1.5, 1.5]) {
        seg.forEach((s) => {
          const rail = part('box', D.iron, s.x + Math.cos(s.yaw) * off, 0.34,
                            s.z - Math.sin(s.yaw) * off, 0.35, 0.3, 1.4);
          rail.rotation.y = s.yaw;
          rail.castShadow = false;
          scene.add(rail);
        });
      }
      // 신호등 (길가에 서 있다)
      api.alongPath(16, 4).forEach((p, i) => {
        const g = new THREE.Group();
        g.add(part('cyl', D.ironDark, 0, 2.4, 0, 0.4, 4.8, 0.4));
        g.add(part('box', D.ironDark, 0, 4.8, 0, 1.2, 2.4, 0.8));
        g.add(part('ball', i % 2 ? D.red : D.green, 0, 5.4, 0.5, 0.6, 0.6, 0.4,
                   glow(i % 2 ? D.red : D.green)));
        g.position.set(p.x + (i % 2 ? 5.4 : -5.4), 0, p.z);
        scene.add(g);
      });
      // 구름 바다 + 승강장
      cloudSea(scene, 30, -28);
      const inha = makePlatform(0xffd9e8, '인하성', 0xffb8d4);
      inha.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(inha);
      const dad = makePlatform(0xe0cdb0, '아빠성', 0xffc93d);
      dad.position.set(TW_PLAT_B.x, 0, TW_PLAT_B.z);
      dad.rotation.y = Math.PI;
      scene.add(dad);
      // 길가에 세워둔 작은 역 간판
      //  ★ 간판은 길에서 넉넉히 떨어뜨리고 높이 단다.
      //    길가에 바짝 세우면 지나갈 때 화면을 다 가린다
      const sign = makeSign('🚂 기 차 길', 6, 1.3, '#e05a4a', '#ffffff');
      sign.position.set(10.5, 6.6, -30);
      sign.rotation.y = -0.6;
      scene.add(sign);
      scene.add(part('cyl', D.wood, 10.5, 3.2, -30.1, 0.5, 6.4, 0.5));
    },
  });
}

// ===========================================================
//  🪨 돌다리 — 루하성 1층 ↔ 아빠성 1층
//    두꺼운 돌판을 이어 붙인 튼튼한 다리. 등불이 죽 늘어서 있다
// ===========================================================
const SW_CONTROL = [
  { x: 0, z: 4 }, { x: 0, z: -10 }, { x: -6, z: -24 },
  { x: -4, z: -36 }, { x: 0, z: -48 },
];
const SW_PLAT_B = { x: 0, z: -48.5 };

export function buildStoneWay(ctx) {
  return makeBridge({
    name: 'stoneway',
    envMap: ctx.envMap,
    bg: 0xa8c8e8,
    control: SW_CONTROL,
    platA: A_PLAT, platB: SW_PLAT_B,
    pathHalf: 3.8,
    spawnAt: 'A',
    camDist: 11, camHeight: 6.4,
    ends: [
      { at: 'A', to: 'ruha', label: '루하성으로 돌아왔어요 🌙',
        build: areaBuilder('ruha'),
        arrive: RUHA_IN.pos.clone(), arriveYaw: RUHA_IN.yaw },
      { at: 'B', to: 'dad', label: '아빠성에 도착! 🛠 뚝딱 공작소',
        build: areaBuilder('dad'),
        arrive: DAD_SW_IN.pos.clone(), arriveYaw: DAD_SW_IN.yaw },
    ],
    decorate(scene, api) {
      const seg = layDeck(scene, api, { color: 0xb9b2a8, half: 3.8, pieces: 70,
                                        stripe: 0xd4cec4 });
      // 다리 양옆 돌난간
      seg.forEach((s, i) => {
        if (i % 2) return;
        for (const sx of [-1, 1]) {
          const px = s.x + Math.cos(s.yaw) * sx * 4.0;
          const pz = s.z - Math.sin(s.yaw) * sx * 4.0;
          const post = part('box', 0xd4cec4, px, 0.6, pz, 0.7, 1.2, 1.6);
          post.rotation.y = s.yaw;
          scene.add(post);
        }
      });
      // 등불
      api.alongPath(9, 3).forEach((p, i) => {
        const g = new THREE.Group();
        g.add(part('cyl', 0x8d93a8, 0, 1.8, 0, 0.5, 3.6, 0.5));
        g.add(part('box', 0x5b6070, 0, 3.9, 0, 1.4, 0.9, 1.4));
        const bulb = part('ball', 0xffd48a, 0, 3.9, 0, 1.0, 1.0, 1.0, glow(0xffd48a));
        bulb.userData.noShadow = true;
        g.add(bulb);
        g.add(part('cone', 0x5b6070, 0, 4.7, 0, 1.8, 0.9, 1.8));
        g.position.set(p.x + (i % 2 ? 5.6 : -5.6), 0, p.z);
        scene.add(g);
        api.addTick((t) => { bulb.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08); });
      });
      // 다리 아래를 받치는 아치 (튼튼해 보이게)
      api.alongPath(14, 4).forEach((p) => {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(6, 0.9, 6, 18, Math.PI),
                                    toon(0xa9a49a));
        arch.rotation.z = Math.PI;                // 아래로 볼록하게
        arch.position.set(p.x, -0.6, p.z);
        arch.castShadow = false;
        scene.add(arch);
      });
      cloudSea(scene, 26, -24);
      const ruha = makePlatform(0xcfe0ff, '루하성', 0x8fa8ff);
      ruha.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(ruha);
      const dad = makePlatform(0xe0cdb0, '아빠성', 0xffc93d);
      dad.position.set(SW_PLAT_B.x, 0, SW_PLAT_B.z);
      dad.rotation.y = Math.PI;
      scene.add(dad);
    },
  });
}

// ===========================================================
//  🪢 밧줄 다리 — 엄마성 5층 ↔ 아빠성 2층
//    널빤지를 밧줄로 엮은 흔들다리. 알록달록 깃발이 걸려 있다
// ===========================================================
const RW_CONTROL = [
  { x: 0, z: 4 }, { x: 0, z: -10 }, { x: 6, z: -24 },
  { x: 4, z: -38 }, { x: 0, z: -52 },
];
const RW_PLAT_B = { x: 0, z: -52.5 };
const FLAGS = [0xff7a9c, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff];

export function buildRopeWay(ctx) {
  return makeBridge({
    name: 'ropeway',
    envMap: ctx.envMap,
    bg: 0xcfe8ff,
    control: RW_CONTROL,
    platA: A_PLAT, platB: RW_PLAT_B,
    pathHalf: 3.4,
    spawnAt: 'A',
    camDist: 11, camHeight: 6.4,
    ends: [
      { at: 'A', to: 'mom', label: '엄마성 5층으로 돌아왔어요 💗',
        build: areaBuilder('mom'),
        arrive: MOM_IN.pos.clone(), arriveYaw: MOM_IN.yaw },
      { at: 'B', to: 'dad', label: '아빠성에 도착! 🛠 뚝딱 공작소',
        build: areaBuilder('dad'),
        arrive: DAD_RW_IN.pos.clone(), arriveYaw: DAD_RW_IN.yaw },
    ],
    decorate(scene, api) {
      // 널빤지 바닥 (한 장씩 색이 조금씩 다르다)
      const seg = layDeck(scene, api, { color: D.plank, half: 3.4, pieces: 90,
                                        stripe: D.wood });
      // 양옆 밧줄 + 기둥
      seg.forEach((s, i) => {
        for (const sx of [-1, 1]) {
          const px = s.x + Math.cos(s.yaw) * sx * 3.6;
          const pz = s.z - Math.sin(s.yaw) * sx * 3.6;
          // 밧줄 (허리 높이로 이어진다)
          const rope = part('box', 0xd8b47a, px, 1.9, pz, 0.24, 0.24, 1.6);
          rope.rotation.y = s.yaw;
          rope.castShadow = false;
          scene.add(rope);
          if (i % 6 === 0) {                       // 기둥은 가끔씩
            scene.add(part('cyl', D.woodDark, px, 1.1, pz, 0.5, 2.2, 0.5));
          }
        }
      });
      // 알록달록 깃발
      //  ★ 깃발은 **머리 위**에 매단다. 눈높이에 두면 앞을 가려서 길이 안 보인다
      api.alongPath(6, 3).forEach((p, i) => {
        const f = part('box', FLAGS[i % FLAGS.length], p.x, 5.4, p.z, 1.4, 1.0, 0.1);
        f.castShadow = false;
        scene.add(f);
        api.addTick((t) => {
          f.position.y = 5.4 + Math.sin(t * 2 + i) * 0.16;
          f.rotation.z = Math.sin(t * 2.4 + i) * 0.2;
        });
      });
      cloudSea(scene, 30, -26);
      const mom = makePlatform(0xffe6f4, '엄마성', 0xff6fa5);
      mom.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(mom);
      const dad = makePlatform(0xe0cdb0, '아빠성', 0xffc93d);
      dad.position.set(RW_PLAT_B.x, 0, RW_PLAT_B.z);
      dad.rotation.y = Math.PI;
      scene.add(dad);
      const sign = makeSign('🪢 흔들흔들 밧줄 다리', 8, 1.4, '#c98a56', '#ffffff');
      sign.position.set(-10.5, 6.6, -30);
      sign.rotation.y = 0.6;
      scene.add(sign);
      scene.add(part('cyl', D.wood, -10.5, 3.2, -30.1, 0.5, 6.4, 0.5));
    },
  });
}

export { HALF_X };
