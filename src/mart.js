// ===========================================================
//  🛒 행복마트 — 마을 편의점 안
//
//  마을(world.js)에서 마트 문 앞에 서면 이 공간으로 들어온다.
//  진열대 사이를 돌아다니면서 물건을 **담고**, 계산대에서 **계산**한다.
//
//  ★ 방 뼈대(바닥·벽·천장·문)는 src/interior.js가 만들어 준다.
//  ★ 진열대·냉장고·계산대 모양은 src/mart-props.js,
//    라면·과자·물 같은 상품은 src/mart-items.js에 있다.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import { makeSign, makeShelf, makeFridge, makeCounter, makeBasketStack,
         makeCart, makeProduceStand, makeFreezer, makeCeilingLight } from './mart-props.js';
import { makePlant } from './castle-props.js';
import { withObject } from './korean.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 마트 크기와 이름
// -----------------------------------------------------------
const W = 30, D = 22, H = 7.5;     // 가로 · 세로 · 천장 높이
const MART_NAME = '행복마트';
const CLERK = 'ppodeuk';           // 계산대에 서 있는 친구 (characters.js의 id)

// 진열대 3줄에 놓을 상품 — [아래칸, 가운데칸, 위칸]
//  앞면(front)과 뒷면(back)에 서로 다른 걸 놓으면 돌아다닐 맛이 난다
const AISLES = [
  { x: -6, name: '라면 · 통조림',
    front: [['ramen'], ['ramen', 'can'], ['can']],
    back:  [['bread'], ['egg'], ['bread', 'egg']] },
  { x: 0,  name: '과자 · 사탕',
    front: [['snack'], ['snack', 'cookie'], ['cookie']],
    back:  [['candy'], ['cookie'], ['candy', 'snack']] },
  { x: 6,  name: '음료 · 주스',
    front: [['juice'], ['soda'], ['soda', 'juice']],
    back:  [['water'], ['milk'], ['water']] },
];

/**
 * 마트 안 공간을 만든다.
 *   ctx = { envMap, exit:{x, z, yaw} }   ← world.js의 문이 넘겨준다
 */
export function buildMart(ctx) {
  const room = makeInterior({
    name: 'mart',
    w: W, d: D, h: H,
    envMap: ctx.envMap,
    bg: 0xbfe8ff,
    floorTex: tileTexture('#f2f5f8', '#dfe7f0', 14),
    wallTex: wallpaperTexture('#fff6ea', '#8fd0ff', '#3aa9e0'),
    ceilColor: 0xf0f4fa,
    doorFrame: 0x63c8ff,
    exit: ctx.exit,
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 8, camHeight: 5.6, lookHeight: 2.8,
  });

  // 🧺 지금까지 담은 물건들 (계산하면 비워진다)
  const basket = [];

  // -----------------------------------------------------------
  //  입구 — 장바구니와 카트
  //  ★ 들어오는 문 앞(남쪽 벽)에는 키 큰 물건을 놓지 않는다.
  //    카메라가 문 뒤에서 따라오기 때문에 앞을 가려버린다.
  //    가게 이름표는 맞은편(북쪽 벽)에 붙여서 들어오자마자 보이게 한다.
  // -----------------------------------------------------------
  room.hang(makeSign(MART_NAME, 8, 1.6, '#ff7ab0'), 0, H - 1.0, -D / 2 + 0.4, 0);

  room.place(makeBasketStack(), 10.5, 8.6, 0.2, { r: 1.0 });
  room.place(makeCart(), 12.6, 5.6, 0.3, { r: 1.2 });
  room.place(makeCart(), 13.0, 2.8, -0.2, { r: 1.2 });
  room.place(makePlant(), -13.4, 9.4, 0, { r: 1.4 });

  // -----------------------------------------------------------
  //  💳 계산대 (입구 왼쪽) — 여기서 계산한다
  // -----------------------------------------------------------
  const COUNTER = { x: -9, z: 7 };
  room.place(makeCounter(5), COUNTER.x, COUNTER.z, 0, { hw: 2.7, hd: 1.0 });
  room.hang(makeSign('계산대', 2.4, 0.8, '#ffd45e', '#7a4a00'),
            COUNTER.x, 4.2, COUNTER.z - 0.2, 0);

  room.addSpot({
    x: COUNTER.x, z: COUNTER.z + 1.9, r: 2.4, y: 0, verb: '계산',
    use(toast) {
      if (!basket.length) { toast('먼저 진열대에서 물건을 담아요 🧺'); return; }
      const n = basket.length;
      const last = basket[n - 1];
      basket.length = 0;
      toast(`삐빅! ${last} 등 ${n}개 계산 완료 🧾`);
    },
  });

  // -----------------------------------------------------------
  //  🗄 진열대 3줄 (앞뒤로 상품이 놓여 있다)
  // -----------------------------------------------------------
  const AISLE_LEN = 12, AISLE_Z = -2;
  for (const a of AISLES) {
    // 진열대는 가로로 만들어져 있으니 90도 돌려서 앞뒤(z)로 길게 세운다
    room.place(makeShelf(AISLE_LEN, a.front, a.back), a.x, AISLE_Z, Math.PI / 2,
               { hw: 1.0, hd: AISLE_LEN / 2 });
    // 천장에 매단 코너 안내판
    room.hang(makeSign(a.name, 3.6, 0.9, '#ff9ec4'), a.x, 5.8, AISLE_Z, 0);

    // 진열대 양옆에서 물건을 담을 수 있다
    for (const side of [-1, 1]) {
      room.addSpot({
        x: a.x + side * 2.0, z: AISLE_Z, r: 2.6, y: 0, verb: '담기',
        use: (toast) => pick(toast, side > 0 ? a.front : a.back),
      });
    }
  }

  /** 선반에서 아무거나 하나 골라 바구니에 담는다 */
  function pick(toast, levels) {
    const names = { ramen:'라면', can:'통조림', bread:'빵', egg:'계란', snack:'과자',
                    cookie:'쿠키', candy:'사탕', juice:'주스', soda:'음료수',
                    water:'물', milk:'우유', apple:'사과', orange:'귤',
                    melon:'수박', ice:'아이스크림' };
    const flat = levels.flat();
    const id = flat[Math.floor(Math.random() * flat.length)];
    const name = names[id] ?? id;
    basket.push(name);
    toast(`${withObject(name)} 담았어요! 🧺 ${basket.length}개`);
  }

  // -----------------------------------------------------------
  //  🧊 벽면 음료 냉장고 (북쪽 벽) + 🍦 아이스크림 + 🍎 과일 매대
  // -----------------------------------------------------------
  room.place(makeFridge(13), -6.5, -D / 2 + 1.1, 0, { hw: 6.5, hd: 1.3 });
  room.addSpot({
    x: -6.5, z: -D / 2 + 3.2, r: 2.8, y: 0, verb: '담기',
    use: (toast) => pick(toast, [['water'], ['milk'], ['juice']]),
  });

  room.place(makeFreezer(), 9, -D / 2 + 1.6, 0, { hw: 2.3, hd: 1.3 });
  room.addSpot({
    x: 9, z: -D / 2 + 3.6, r: 2.6, y: 0, verb: '담기',
    use: (toast) => pick(toast, [['ice']]),
  });

  room.place(makeProduceStand(), 11.6, -1, Math.PI / 2, { hw: 1.5, hd: 2.8 });
  room.addSpot({
    x: 9.0, z: -1, r: 2.6, y: 0, verb: '담기',
    use: (toast) => pick(toast, [['apple'], ['orange'], ['melon']]),
  });

  // -----------------------------------------------------------
  //  💡 천장 형광등
  // -----------------------------------------------------------
  for (const x of [-9, -3, 3, 9]) {
    room.hang(makeCeilingLight(14), x, H - 0.3, 0, Math.PI / 2);
  }

  // -----------------------------------------------------------
  //  마무리 — 손님 친구 3명이 돌아다니고, 점원 한 명이 계산대를 지킨다
  // -----------------------------------------------------------
  return room.finish({
    npcCount: 3,
    wanderZones: [
      { x: -3, z: -2, r: 5 }, { x: 3, z: -2, r: 5 },
      { x: 10, z: 5, r: 3 },  { x: -12, z: 0, r: 3 },
    ],
    // 계산대 뒤에 서 있는 점원 (걸어 다니지 않는다)
    residents: [{ id: CLERK, x: COUNTER.x, z: COUNTER.z - 1.6, yaw: 0, stay: true }],
  });
}
