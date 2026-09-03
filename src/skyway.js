// ===========================================================
//  ☁️ 구름 징검다리 — 인하성 2층에서 루하성으로 건너가는 하늘길
//
//  인하성 2층 동쪽 발코니로 나오면 여기가 펼쳐진다.
//  구름 위에 놓인 징검다리를 건너면 루하성 문 앞에 닿는다.
//
//  ★ 걷는 규칙(길 밖으로 안 나가기)은 src/bridge.js에 있다. 여기는 **꾸미기**만 한다.
//    무지개 다리·꽃길도 같은 뼈대를 쓴다.
//  ★ 발이 닿는 높이는 그냥 0이다. 돌을 아래로 늘어뜨려서 "높이 떠 있는" 느낌만 낸다.
// ===========================================================
import * as THREE from 'three';
import { C, part, makeHeart } from './castle-props.js';
import { makeBridge, makePlatform, makeCloudLump, makeRainbow } from './bridge.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const PATH_HALF = 3.4;      // 길의 반 너비 (이만큼까지 걸어도 된다)
const STONE_R   = 3.2;      // 징검다리 돌 하나의 크기
const STONE_GAP = 7.0;      // 돌과 돌 사이 간격

// 양 끝 승강장 자리 (여기 위에서는 자유롭게 돌아다닐 수 있다)
const A_PLAT = { x: 0, z: 3.5 };     // 🏰 인하성 쪽
const B_PLAT = { x: 0, z: -77.5 };   // 🌙 루하성 쪽
const PLAT_R = 5.8;                  // 승강장에서 걸어 다닐 수 있는 반지름
const ARCH_Z = 5.0;                  // 승강장 한가운데에서 아치 문까지 (뒤쪽 끝)

// 길이 지나가는 자리 — 인하성에서 루하성까지. 살짝 S자로 휘어 있다
//  ★ 이 점들을 그대로 직선으로 이으면 **꺾이는 모퉁이**가 생긴다.
//    모퉁이 바깥에는 쐐기 같은 틈이 생겨서, 거기 끼면 밀어내는 방향이
//    매 프레임 뒤집히며 **걸음이 멈춘다**. 그래서 아래에서 부드러운 곡선으로 바꾼다.
//  ★ 길은 승강장 안에서 시작하고 끝나야 한다. 승강장 밖까지 이으면
//    그 끝자락(길 반 너비만큼)이 허공에 튀어나와서 아무것도 없는 데를 걷게 된다
const CONTROL = [
  { x: 0,   z: 4 },
  { x: 0,   z: -8 },
  { x: -5,  z: -26 },
  { x: -5,  z: -44 },
  { x: 3,   z: -62 },
  { x: 0,   z: -80 },
];

// -----------------------------------------------------------
//  ★ 오갈 때 서는 자리 — 두 성과 이어지는 약속
// -----------------------------------------------------------
/** 인하성 2층에서 징검다리로 나왔을 때 서는 자리 */
export const SKY_FROM_CASTLE = { pos: new THREE.Vector3(0, 0, 1.5), yaw: Math.PI };
/** 루하성에서 징검다리로 나왔을 때 서는 자리 */
export const SKY_FROM_RUHA   = { pos: new THREE.Vector3(0, 0, -75.5), yaw: 0 };

const STONE_COLORS = [0xa8ead8, 0xffd9e8, 0xc9b4ff, 0xa8e6ff, 0xfff3c8];

// -----------------------------------------------------------
//  🪨 징검다리 돌 하나 — 윗면이 0, 몸통은 아래로 늘어져 있다
// -----------------------------------------------------------
function makeStone(color, r) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, -0.35, 0, r * 2, 0.7, r * 2));          // 윗판
  g.add(part('cyl', 0xcfc4e8, 0, -1.3, 0, r * 1.7, 1.3, r * 1.7));    // 몸통
  const tip = part('cone', 0xb9aede, 0, -2.9, 0, r * 1.5, 2.2, r * 1.5);
  tip.rotation.x = Math.PI;              // 아래로 뾰족하게 (떠 있는 바위처럼)
  g.add(tip);
  // 가장자리 반짝이 구슬
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(part('ball', 0xffffff, Math.cos(a) * r * 0.82, 0.05, Math.sin(a) * r * 0.82, 0.32));
  }
  return g;
}

// -----------------------------------------------------------
//  구름 징검다리 공간 만들기
//    ctx = { envMap, buildRuha, castleArrive/Yaw, ruhaArrive/Yaw }
//          ← 인하성·루하성이 넘겨준다
//  ★ 걷는 규칙은 src/bridge.js가 맡는다. 여기서는 **꾸미기**만 한다.
// -----------------------------------------------------------
export function buildSkyway(ctx) {
  return makeBridge({
    name: 'skyway',
    envMap: ctx.envMap,
    bg: 0x9fd8ff,
    control: CONTROL,
    platA: A_PLAT, platB: B_PLAT,
    pathHalf: PATH_HALF, platR: PLAT_R, archZ: ARCH_Z,
    spawnAt: 'A',
    ends: [
      {
        at: 'A', to: 'castle',
        label: '인하성 2층으로 돌아왔어요 🏰',
        arrive: ctx.castleArrive, arriveYaw: ctx.castleYaw,
      },
      {
        at: 'B', to: 'ruha',
        label: '루하성에 도착! 🌙 별과 달의 성',
        //  ★ 루하성을 만드는 함수는 밖에서 받는다 (파일끼리 서로 부르지 않게)
        build: (c) => ctx.buildRuha(c),
        arrive: ctx.ruhaArrive, arriveYaw: ctx.ruhaYaw,
      },
    ],
    decorate(scene, api) {
      // --- 징검다리 돌 ---
      const stones = api.alongPath(STONE_GAP);
      stones.forEach((p, i) => {
        const stone = makeStone(STONE_COLORS[i % STONE_COLORS.length], STONE_R);
        stone.position.set(p.x, 0, p.z);
        scene.add(stone);
        const phase = i * 0.7;
        api.addTick((t) => { stone.position.y = Math.sin(t * 0.9 + phase) * 0.22; });
      });

      // --- 양 끝 승강장 ---
      const inha = makePlatform(0xffd9e8, '인하성', C.pink);
      inha.position.set(A_PLAT.x, 0, A_PLAT.z);
      scene.add(inha);
      const ruha = makePlatform(0xcfe0ff, '루하성', 0x8fa8ff);
      ruha.position.set(B_PLAT.x, 0, B_PLAT.z);
      ruha.rotation.y = Math.PI;
      scene.add(ruha);

      // --- 아래에 깔린 구름 바다 ---
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 46;
        const lump = makeCloudLump(1.6 + Math.random() * 2.6);
        lump.position.set(Math.cos(a) * r, -12 - Math.random() * 16,
                          -40 + Math.sin(a) * r - Math.random() * 20);
        scene.add(lump);
      }

      // --- 무지개와 떠다니는 하트 ---
      const bow = makeRainbow(20);
      bow.position.set(-6, -1, -26);
      bow.rotation.y = 0.5;
      scene.add(bow);
      const bow2 = makeRainbow(15);
      bow2.position.set(4, -1, -56);
      bow2.rotation.y = -0.4;
      scene.add(bow2);

      for (let i = 0; i < 10 && i < stones.length; i++) {
        const h = makeHeart(i % 2 ? C.pink : 0xa8e6ff, 0.9);
        const p = stones[i];
        h.position.set(p.x + (i % 2 ? 5 : -5), 3 + (i % 3), p.z);
        scene.add(h);
        api.addTick((t) => {
          h.position.y = 3 + (i % 3) + Math.sin(t * 1.2 + i) * 0.4;
          h.rotation.y = t * 0.5;
        });
      }
    },
  });
}
