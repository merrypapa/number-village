// ===========================================================
//  🛒 행복마트 — 마을 편의점 안
//
//  마을(world.js)에서 마트 문 앞에 서면 이 공간으로 들어온다.
//  입구에서 🧺 **장바구니를 들거나 🛒 카트를 끌고**, 진열대에서 물건을 **담고**,
//  계산대에서 **계산**한다 (계산은 숫자 놀이다 — 전체 금액을 맞혀야 한다).
//
//  ★ 방 뼈대(바닥·벽·천장·문)는 src/interior.js가 만들어 준다.
//  ★ 진열대·냉장고·계산대 모양은 src/mart-props.js,
//    라면·과자·물 같은 상품은 src/mart-items.js에 있다 (값도 거기 있다).
//  ★ 들고 다니기·담기는 src/mart-shop.js, 계산 놀이는 src/pay-game.js.
// ===========================================================
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import { makeSign, makeShelf, makeFridge, makeCounter, makeBasketStack,
         makeCart, makeProduceStand, makeFreezer, makeCeilingLight } from './mart-props.js';
import { makePlant } from './castle-props.js';
import { getItem, UNIT } from './mart-items.js';
import { createShop } from './mart-shop.js';
import { getPayGame } from './pay-game.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 마트 크기와 이름
// -----------------------------------------------------------
const W = 36, D = 28, H = 7.5;     // 가로 · 세로 · 천장 높이 (통로가 넓어야 돌아다니기 좋다)
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

  // 🧺 장보기 — 장바구니/카트를 들고 담은 물건을 기억한다 (계산하면 비워진다)
  const shop = createShop();

  /** 값이 적힌 안내 글씨를 만든다 — "물 1 · 우유 3 · 주스 3코인" */
  const priceLabel = (ids) =>
    ids.map(id => `${getItem(id).name} ${getItem(id).price}`).join(' · ') + UNIT;

  // -----------------------------------------------------------
  //  입구 — 장바구니와 카트
  //  ★ 들어오는 문 앞(남쪽 벽)에는 키 큰 물건을 놓지 않는다.
  //    카메라가 문 뒤에서 따라오기 때문에 앞을 가려버린다.
  //    가게 이름표는 맞은편(북쪽 벽)에 붙여서 들어오자마자 보이게 한다.
  // -----------------------------------------------------------
  room.hang(makeSign(MART_NAME, 8, 1.3, '#ff7ab0'), 0, H - 0.75, -D / 2 + 0.4, 0);

  //  ★ 자리는 벽에서 얼마나 떨어졌는지로 적는다. 마트를 키워도 그대로 따라간다
  const STACK = { x: W / 2 - 7.5, z: D / 2 - 4.0 };
  const CART  = { x: W / 2 - 5.0, z: D / 2 - 6.5 };
  room.place(makeBasketStack(), STACK.x, STACK.z, 0.2, { r: 1.0 });
  const spareCart = room.place(makeCart(), CART.x, CART.z, 0.3, { r: 1.2 });
  room.place(makeCart(), W / 2 - 4.6, D / 2 - 9.0, -0.2, { r: 1.2 });
  room.place(makePlant(), -W / 2 + 4.0, D / 2 - 3.0, 0, { r: 1.4 });
  //  ★ 간판은 방 안쪽(-z)에서 봐야 하니까 Math.PI만큼 돌려 세운다
  room.hang(makeSign('🧺 장바구니를 들고 담아요', 6.5, 1.0, '#ff9ec4'),
            W / 2 - 6.5, 4.4, D / 2 - 2.4, Math.PI);

  //  ★ 노란 버튼에 뜰 글씨(verb)를 함수로 만들면 상황에 따라 저절로 바뀐다
  //    (들기 → 내려놓기).  main.js가 매 프레임 이 값을 읽는다.
  room.addSpot({
    x: STACK.x, z: STACK.z + 2.2, r: 2.4, y: 0,
    get verb() { return shop.kind === 'basket' ? '내려놓기' : '바구니'; },
    use(toast, player) {
      shop.take('basket', player, toast);
      spareCart.visible = shop.kind !== 'cart';   // 카트를 두고 바구니로 바꿨을 때
    },
  });
  room.addSpot({
    x: CART.x, z: CART.z + 2.2, r: 2.4, y: 0,
    get verb() { return shop.kind === 'cart' ? '내려놓기' : '카트'; },
    use(toast, player) {
      shop.take('cart', player, toast);
      spareCart.visible = shop.kind !== 'cart';   // 내가 끌고 가면 자리에서는 사라진다
    },
  });

  // -----------------------------------------------------------
  //  💳 계산대 (입구 왼쪽) — 여기서 계산한다
  // -----------------------------------------------------------
  const COUNTER = { x: -W / 2 + 9, z: D / 2 - 6 };
  room.place(makeCounter(5), COUNTER.x, COUNTER.z, 0, { hw: 2.7, hd: 1.0 });
  room.hang(makeSign('계산대', 2.4, 0.8, '#ffd45e', '#7a4a00'),
            COUNTER.x, 4.2, COUNTER.z - 0.2, 0);

  //  💳 계산 — 담은 물건의 "값 × 개수"를 모두 더한 금액을 맞혀야 끝난다
  room.addSpot({
    x: COUNTER.x, z: COUNTER.z + 1.9, r: 2.4, y: 0, verb: '계산',
    use(toast) {
      if (!shop.count) { toast('먼저 진열대에서 물건을 담아요 🧺'); return; }
      const lines = shop.lines();
      const total = shop.total();
      getPayGame().show({
        lines, total, unit: UNIT,
        onPaid() {
          shop.clear();
          toast(`삐빅! ${total}${UNIT} 계산 완료 🧾 고맙습니다!`);
        },
      });
    },
  });

  // -----------------------------------------------------------
  //  🗄 진열대 3줄 (앞뒤로 상품이 놓여 있다)
  // -----------------------------------------------------------
  const AISLE_LEN = 14, AISLE_Z = -3;
  for (const a of AISLES) {
    // 진열대는 가로로 만들어져 있으니 90도 돌려서 앞뒤(z)로 길게 세운다
    room.place(makeShelf(AISLE_LEN, a.front, a.back), a.x, AISLE_Z, Math.PI / 2,
               { hw: 1.0, hd: AISLE_LEN / 2 });
    // 천장에 매단 코너 안내판
    //  ★ 코너 안내판은 가게 이름표(천장 가까이)와 겹치지 않게 조금 낮게 단다
    room.hang(makeSign(a.name, 3.6, 0.9, '#ff9ec4'), a.x, 5.0, AISLE_Z, 0);

    // 진열대 양옆에서 물건을 담을 수 있다
    for (const side of [-1, 1]) {
      room.addSpot({
        x: a.x + side * 2.0, z: AISLE_Z, r: 2.6, y: 0, verb: '담기',
        use: (toast, player) => shop.put(side > 0 ? a.front : a.back, toast, player),
      });
    }
  }

  // -----------------------------------------------------------
  //  🧊 벽면 음료 냉장고 (북쪽 벽) + 🍦 아이스크림 + 🍎 과일 매대
  // -----------------------------------------------------------
  const COLD = ['water', 'milk', 'juice'];
  room.place(makeFridge(15, priceLabel(COLD)), -7.5, -D / 2 + 1.1, 0, { hw: 7.5, hd: 1.3 });
  room.addSpot({
    x: -7.5, z: -D / 2 + 3.2, r: 2.8, y: 0, verb: '담기',
    use: (toast, player) => shop.put(COLD, toast, player),
  });

  room.place(makeFreezer(priceLabel(['ice'])), 10, -D / 2 + 1.6, 0, { hw: 2.3, hd: 1.3 });
  room.addSpot({
    x: 10, z: -D / 2 + 3.6, r: 2.6, y: 0, verb: '담기',
    use: (toast, player) => shop.put(['ice'], toast, player),
  });

  const FRUIT = ['apple', 'orange', 'melon'];
  room.place(makeProduceStand(priceLabel(FRUIT)), W / 2 - 4.4, -2, Math.PI / 2,
             { hw: 1.5, hd: 2.8 });
  room.addSpot({
    x: W / 2 - 7.0, z: -2, r: 2.6, y: 0, verb: '담기',
    use: (toast, player) => shop.put(FRUIT, toast, player),
  });

  // -----------------------------------------------------------
  //  💡 천장 형광등
  // -----------------------------------------------------------
  for (const x of [-12, -6, 0, 6, 12]) {
    room.hang(makeCeilingLight(D - 6), x, H - 0.3, 0, Math.PI / 2);
  }

  // -----------------------------------------------------------
  //  마무리 — 손님 친구 3명이 돌아다니고, 점원 한 명이 계산대를 지킨다
  // -----------------------------------------------------------
  return room.finish({
    //  마을에 나갔다 오면 들고 있던 장바구니를 다시 손에 쥐여준다
    onLeave: () => shop.leave(),
    onEnter: (player) => shop.enter(player),
    npcCount: 3,
    wanderZones: [
      { x: -3, z: -3, r: 6 }, { x: 3, z: -3, r: 6 },
      { x: 12, z: 4, r: 4 },  { x: -14, z: 0, r: 4 },
    ],
    // 계산대 뒤에 서 있는 점원 (걸어 다니지 않는다)
    residents: [{ id: CLERK, x: COUNTER.x, z: COUNTER.z - 1.6, yaw: 0, stay: true }],
  });
}
