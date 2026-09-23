// ===========================================================
//  🔢 숫자의 집 — 구한 숫자 친구들이 모여 사는 넓은 집
//  (티니핑 월드의 그림의 집 자리에 선다)
//  구한 친구는 main.js가 이 방 안에 걸어 다니는 친구로 넣어준다.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from '../../src/interior.js';
import { makeSign } from '../../src/mart-props.js';
import { makePlant, makeNumberBlocks, makeBookshelf } from '../../src/castle-props.js';
import { makeCushion } from '../../src/castle-props2.js';
import { UNIT_COLORS, hex } from './block-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const W = 52, D = 44, H = 10;     // 방 크기 — 친구 99명이 돌아다녀도 넉넉하게
const RUG_R = 9;                  // 가운데 둥근 깔개

/**
 * ctx.count() : 지금까지 구한 친구 수 (안내판 버튼이 말해준다)
 */
export function buildNumberHouse(ctx) {
  const room = makeInterior({
    name: 'numbers',
    w: W, d: D, h: H,
    envMap: ctx.envMap,
    bg: 0xbfe8ff,
    floorTex: tileTexture('#fff8e8', '#ffeccc', 14),
    wallTex: wallpaperTexture('#f4fbff', '#dbf1ff', '#7ad4ff'),
    ceilColor: 0xffffff,
    doorFrame: 0x7ad4ff,
    exit: ctx.exit,
    exitLabel: '마을로 나왔어요! 🌙',
    camDist: 11, camHeight: 6.5, lookHeight: 3,
  });

  // 🪧 벽 간판
  room.hang(makeSign('숫자 친구들의 집', 9, 1.4, '#7ad4ff', '#1b4a70'), 0, H - 1.6, -D / 2 + 0.3, 0);

  // 🧮 벽에 1~10 색 띠 — 어떤 숫자가 무슨 색인지 한눈에
  for (let n = 1; n <= 9; n++) {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshToonMaterial({ color: UNIT_COLORS[n] }));
    room.hang(tile, -18 + (n - 1) * 4.5, 4.6, -D / 2 + 0.2, 0);
    const label = makeSign(String(n), 1.6, 1.0, hex(UNIT_COLORS[n]), n === 3 ? '#5b3d1a' : '#ffffff');
    room.hang(label, -18 + (n - 1) * 4.5, 7.2, -D / 2 + 0.3, 0);
  }

  // 🟡 가운데 둥근 깔개 — 친구들이 모이는 자리
  const rug = new THREE.Mesh(new THREE.CircleGeometry(RUG_R, 40),
    new THREE.MeshToonMaterial({ color: 0xffe08a }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.03, -2);
  rug.receiveShadow = true;
  room.scene.add(rug);

  // 🧱 구석마다 숫자 블록 더미 · 화분 · 책장 · 방석
  for (const [x, z] of [[-W / 2 + 5, -D / 2 + 5], [W / 2 - 5, -D / 2 + 5],
                        [-W / 2 + 5, D / 2 - 7], [W / 2 - 5, D / 2 - 7]]) {
    room.place(makeNumberBlocks(), x, z, 0, { r: 2.2 });
  }
  room.place(makePlant(), -W / 2 + 2, 0, 0, { r: 1.3 });
  room.place(makePlant(),  W / 2 - 2, 0, 0, { r: 1.3 });
  room.place(makeBookshelf(), -W / 2 + 2.2, -D / 2 + 14, Math.PI / 2, { hw: 1.2, hd: 3 });
  room.place(makeBookshelf(),  W / 2 - 2.2, -D / 2 + 14, -Math.PI / 2, { hw: 1.2, hd: 3 });
  const CUSHIONS = [0xff9ec4, 0xa8e6ff, 0xffd45e, 0x7ad48f, 0xc9b4ff, 0xffb27a];
  for (let i = 0; i < CUSHIONS.length; i++) {
    const a = (i / CUSHIONS.length) * Math.PI * 2;
    room.place(makeCushion(CUSHIONS[i]), Math.cos(a) * (RUG_R + 2.5), -2 + Math.sin(a) * (RUG_R + 2.5));
  }

  // 📋 안내판 — 몇 명이 돌아왔는지 알려준다
  room.hang(makeSign('친구가 몇 명 왔을까?', 7, 1.1, '#ffd93d', '#5b3d1a'), 0, 4.2, D / 2 - 0.4, Math.PI);
  room.addSpot({
    x: 0, z: D / 2 - 4, r: 3, y: 0, verb: '세기',
    use(toast) {
      const n = ctx.count();
      toast(n === 0 ? '아직 아무도 안 왔어요. 친구를 찾으러 가요! 🔦'
                    : n >= 99 ? '99명 모두 돌아왔어요! 🎉 달님에게 가요'
                    : `지금 ${n}명이 돌아왔어요! 앞으로 ${99 - n}명`);
    },
  });

  return room.finish({
    // 친구들은 깔개 근처와 방 곳곳을 돌아다닌다
    wanderZones: [{ x: 0, z: -2, r: RUG_R + 4 }, { x: -14, z: 6, r: 8 }, { x: 14, z: 6, r: 8 },
                  { x: 0, z: -14, r: 8 }],
  });
}
