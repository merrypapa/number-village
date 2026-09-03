// ===========================================================
//  🌸 꽃길 — 루하성과 엄마성을 잇는 예쁜 꽃밭 길
//
//  다른 길들이 "구름 위 하늘길"이라면, 여기는 **정원**이다.
//  길 양옆에 꽃밭과 울타리가 있고, 장미 아치 아래로 나비가 날아다닌다.
//
//  ★ 걷는 규칙(길 밖으로 안 나가기)은 src/bridge.js가 맡는다. 여기는 꾸미기만 한다.
//  ★ 울타리를 길 바로 옆에 세운 이유 — 걸을 수 있는 데가 어디까지인지
//    **눈으로 바로 알 수 있게** 하려고. (7세가 답답해하지 않게)
// ===========================================================
import * as THREE from 'three';
import { part, toon, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { makeBridge, makePlatform } from './bridge.js';
import { areaBuilder } from './area-link.js';
import { RUHA_W } from './ruha-layout.js';
import { MOM_W } from './mom-layout.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const PATH_HALF = 4.0;      // 걸어 다닐 수 있는 길의 반 너비
const GRASS_HALF = 9.5;     // 잔디밭의 반 너비 (길보다 넓다)
const FENCE_AT = 8.6;       // 울타리가 서는 자리
const A_PLAT = { x: 0, z: 3.5 };     // 🌙 루하성 쪽 승강장
const B_PLAT = { x: 0, z: -62.5 };   // 💗 엄마성 쪽 승강장
const PLAT_R = 5.8;
const ARCH_Z = 5.0;

// 꽃 색깔 (여기 색을 바꾸면 꽃밭 색이 바뀐다)
const FLOWERS = [0xff7a9c, 0xffd93d, 0xff9ec4, 0xc9b4ff, 0xfff6e8, 0xffa733];
const GRASS = 0x9fe08a;
const HEDGE = 0x69c96b;

// 길이 지나가는 자리 — 루하성에서 엄마성까지. 완만하게 굽어 있다
const CONTROL = [
  { x: 0,   z: 4 },
  { x: 0,   z: -8 },
  { x: -7,  z: -22 },
  { x: -7,  z: -38 },
  { x: 2,   z: -52 },
  { x: 0,   z: -65 },
];

// -----------------------------------------------------------
//  ★ 오갈 때 서는 자리 — 두 성과 이어지는 약속
// -----------------------------------------------------------
/** 루하성에서 꽃길로 나왔을 때 서는 자리 */
export const FP_FROM_RUHA = { pos: new THREE.Vector3(0, 0, 1.5), yaw: Math.PI };
/** 엄마성에서 꽃길로 나왔을 때 서는 자리 */
export const FP_FROM_MOM  = { pos: new THREE.Vector3(0, 0, -60.5), yaw: 0 };

/** 🌸 루하성 1층 **서쪽** 벽에 난 꽃길 문 자리 (루하성도 이 값을 쓴다) */
export const RUHA_FP_DOOR = { z: 2 };
/** 🌸 엄마성 1층 **동쪽** 벽에 난 꽃길 문 자리 (엄마성도 이 값을 쓴다) */
export const MOM_FP_DOOR = { z: 4 };

// 꽃길에서 성으로 **들어갈 때** 서는 자리 (문에서 넉넉히 안쪽)
const RUHA_IN = { pos: new THREE.Vector3(-RUHA_W / 2 + 8, 0, RUHA_FP_DOOR.z),
                  yaw: Math.PI / 2 };
const MOM_IN  = { pos: new THREE.Vector3(MOM_W / 2 - 7.5, 0, MOM_FP_DOOR.z),
                  yaw: -Math.PI / 2 };

// -----------------------------------------------------------
//  🌷 꽃 한 송이 — 줄기 위에 꽃잎 다섯 장
// -----------------------------------------------------------
function makeFlower(color, s = 1) {
  const g = new THREE.Group();
  g.add(part('cyl', 0x5fa855, 0, 0.6 * s, 0, 0.14 * s, 1.2 * s, 0.14 * s));   // 줄기
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part('ball', color, Math.cos(a) * 0.34 * s, 1.3 * s, Math.sin(a) * 0.34 * s,
               0.42 * s));
  }
  g.add(part('ball', 0xffd93d, 0, 1.35 * s, 0, 0.34 * s));                    // 꽃술
  return g;
}

// -----------------------------------------------------------
//  🦋 나비 — 날개를 팔랑팔랑
// -----------------------------------------------------------
function makeButterfly(color) {
  const g = new THREE.Group();
  g.add(part('cyl', 0x6b5a45, 0, 0, 0, 0.16, 0.9, 0.16));
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    w.add(part('ball', color, sx * 0.55, 0.1, 0.1, 1.1, 0.1, 0.8));
    w.add(part('ball', color, sx * 0.42, -0.15, -0.4, 0.85, 0.1, 0.6));
    g.add(w);
    wings.push({ w, sx });
  }
  g.userData.tick = (t) => {
    for (const p of wings) p.w.rotation.z = p.sx * (0.5 + Math.sin(t * 8) * 0.6);
  };
  return g;
}

// -----------------------------------------------------------
//  🌹 장미 아치 — 길 위를 넘어가는 덩굴 문
// -----------------------------------------------------------
function makeRoseArch() {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.34, 8, 24, Math.PI),
                             toon(0xfff6e8));
  bar.position.y = 3.2;
  g.add(bar);
  for (const sx of [-1, 1]) {
    g.add(part('cyl', 0xfff6e8, sx * 5.4, 1.6, 0, 0.7, 3.2, 0.7));
  }
  // 덩굴에 핀 장미
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    const x = Math.cos(a) * 5.4, y = 3.2 + Math.sin(a) * 5.4;
    g.add(part('ball', i % 2 ? 0xff7a9c : 0xffd93d, x, y, 0, 0.7));
    g.add(part('ball', HEDGE, x * 0.94, y - 0.5, 0.3, 0.55));
  }
  return g;
}

// -----------------------------------------------------------
//  꽃길 공간 만들기
// -----------------------------------------------------------
export function buildFlowerArea(ctx) {
  return makeBridge({
    name: 'flowerway',
    envMap: ctx.envMap,
    bg: 0xbfe8ff,
    floorLight: 0x9fe08a,
    control: CONTROL,
    platA: A_PLAT, platB: B_PLAT,
    pathHalf: PATH_HALF, platR: PLAT_R, archZ: ARCH_Z,
    spawnAt: 'A',
    camDist: 11, camHeight: 6.2, lookHeight: 3.0,
    ends: [
      {
        at: 'A', to: 'ruha',
        label: '루하성으로 돌아왔어요 🌙',
        //  ★ 성을 만드는 함수는 **이름표**로 찾는다 (area-link.js)
        build: areaBuilder('ruha'),
        arrive: RUHA_IN.pos.clone(), arriveYaw: RUHA_IN.yaw,
      },
      {
        at: 'B', to: 'mom',
        label: '엄마성에 도착! 💗 10층 놀이터',
        build: areaBuilder('mom'),
        arrive: MOM_IN.pos.clone(), arriveYaw: MOM_IN.yaw,
      },
    ],

    decorate(scene, api) {
      // --- 🌿 잔디밭 + 그 위의 흙길 (길을 따라 쭉) ---
      const pts = api.CURVE.getSpacedPoints(70);   // 너무 잘게 쪼개면 물체가 많아져 느려진다
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z) + 0.3;    // 살짝 겹치게
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        const grass = part('box', GRASS, mx, -0.3, mz, GRASS_HALF * 2, 0.6, len);
        grass.rotation.y = yaw;
        grass.receiveShadow = true;
        scene.add(grass);
        const road = part('box', 0xf3e0c0, mx, 0.03, mz, PATH_HALF * 2, 0.1, len);
        road.rotation.y = yaw;
        road.castShadow = false;
        road.receiveShadow = true;
        scene.add(road);
        // 길 가운데 징검 돌 (몇 칸에 하나씩)
        if (i % 4 === 0) {
          const st = part('cyl', 0xe8e0d0, mx, 0.09, mz, 2.4, 0.1, 2.4);
          st.castShadow = false;
          scene.add(st);
        }
      }

      // --- 🌷 길가 꽃밭 + 🌳 울타리 ---
      const beds = api.alongPath(3.2, 2);
      beds.forEach((p, i) => {
        for (const sx of [-1, 1]) {
          const f = makeFlower(FLOWERS[(i + (sx > 0 ? 3 : 0)) % FLOWERS.length], 1.1);
          f.position.set(p.x + sx * (PATH_HALF + 1.4), 0.1, p.z);
          f.rotation.y = Math.random() * 6;
          scene.add(f);
          // 울타리 (하얀 말뚝)
          if (i % 2 === 0) {
            const post = part('box', 0xfff6e8, p.x + sx * FENCE_AT, 0.9, p.z,
                              0.4, 1.8, 0.4);
            scene.add(post);
            const bar = part('box', 0xfff6e8, p.x + sx * FENCE_AT, 1.3, p.z, 0.3, 0.24, 2.8);
            scene.add(bar);
          }
          // 울타리 뒤 덤불
          if (i % 3 === 0) {
            scene.add(part('ball', HEDGE, p.x + sx * (FENCE_AT - 1.6), 0.5, p.z, 2.2, 1.6, 2.2));
          }
        }
      });

      // --- 🌹 장미 아치 (길 위를 넘어간다) ---
      const arches = api.alongPath(15, 5);
      arches.forEach((p, i) => {
        const arch = makeRoseArch();
        const nxt = arches[i + 1] || p;
        arch.position.set(p.x, 0, p.z);
        //  ★ 아치는 길을 **가로질러** 서야 한다.
        //    길 방향으로 돌리면(+90°) 기둥이 길 한가운데에 서 버린다
        arch.rotation.y = Math.atan2(nxt.x - p.x, nxt.z - p.z);
        scene.add(arch);
      });

      // --- 🦋 나비 ---
      const flyers = api.alongPath(9, 4);
      flyers.forEach((p, i) => {
        const bf = makeButterfly(FLOWERS[i % FLOWERS.length]);
        const bx = p.x + (i % 2 ? 5.5 : -5.5);
        bf.position.set(bx, 2.4, p.z);
        scene.add(bf);
        api.addTick((t, dt) => {
          bf.userData.tick(t, dt);
          bf.position.y = 2.4 + Math.sin(t * 1.4 + i) * 0.7;
          bf.position.x = bx + Math.sin(t * 0.6 + i) * 1.6;
          bf.rotation.y = Math.sin(t * 0.6 + i) * 0.8;
        });
      });

      // --- 양 끝 승강장 ---
      const ruha = makePlatform(0xcfe0ff, '루하성', 0x8fa8ff);
      ruha.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(ruha);
      const mom = makePlatform(0xffe6f4, '엄마성', 0xff6fa5);
      mom.position.set(B_PLAT.x, 0, B_PLAT.z);
      mom.rotation.y = Math.PI;
      scene.add(mom);

      // --- 길 한가운데 이름표 ---
      const sign = makeSign('🌸 꽃 길 🌸', 9, 1.6, '#ff9ec4', '#ffffff');
      sign.position.set(-7, 5.4, -30);
      scene.add(sign);
      const post = part('cyl', 0xfff6e8, -7, 2.6, -30.1, 0.5, 5.2, 0.5);
      scene.add(post);
      // 이름표 옆에 반짝이는 꽃 화분
      for (const sx of [-1, 1]) {
        const pot = part('cyl', 0xffb166, -7 + sx * 3.4, 0.6, -30, 1.8, 1.2, 1.8);
        scene.add(pot);
        const f = makeFlower(sx > 0 ? 0xff7a9c : 0xffd93d, 1.5);
        f.position.set(-7 + sx * 3.4, 1.2, -30);
        scene.add(f);
        const spark = part('ball', 0xfff6c0, -7 + sx * 3.4, 3.6, -30, 0.5,
                           0.5, 0.5, glow(0xfff6c0));
        spark.castShadow = false;
        scene.add(spark);
        api.addTick((t) => { spark.position.y = 3.6 + Math.sin(t * 1.6 + sx) * 0.3; });
      }
    },
  });
}
