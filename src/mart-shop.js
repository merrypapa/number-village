// ===========================================================
//  🧺 마트 장보기 — 장바구니(또는 카트)를 들고 물건을 담는다
//
//  마트(mart.js)에서 쓴다.
//    1) 입구에서 **장바구니를 들거나 카트를 끈다**
//    2) 진열대 앞에서 **담기** → 물건이 진짜로 바구니에 쌓인다
//    3) 계산대에서 **계산** → 계산 놀이(pay-game.js)가 열린다
//
//  ★ 들고 있는 바구니는 캐릭터(player.model)의 자식으로 붙인다.
//    그래서 걸으면 같이 가고, 돌면 같이 돈다.
//  ★ 캐릭터마다 키가 다르니(1.4~3.1) 키에 맞춰 크기와 자리를 맞춘다.
// ===========================================================
import * as THREE from 'three';
import { makeItem, getItem, UNIT } from './mart-items.js';
import { makeHandBasket, makeCart } from './mart-props.js';
import { withObject } from './korean.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 어떻게 들고 다닐까
//    x·y·z 는 "키 1.9인 친구" 기준 자리다. 키가 다르면 알아서 늘어난다.
// -----------------------------------------------------------
const REF_H = 1.9;
const HOLD = {
  basket: { name:'장바구니', icon:'🧺',
            x: 0.62, y: 0.46, z: 0.34, scale: 0.9,  binY: 0.30, gap: 0.26, max: 12 },
  cart:   { name:'카트',     icon:'🛒',
            x: 0.75, y: 0.00, z: 1.75, scale: 0.9,  binY: 0.80, gap: 0.40, max: 18 },
};

/**
 * 장보기 상태 하나를 만든다 (마트 한 곳에 하나).
 *   담은 물건은 계산이 끝날 때까지 그대로 남는다.
 *   마을에 나갔다 와도 들고 있던 것과 담은 것을 기억한다.
 */
export function createShop() {
  let kind = null;            // null · 'basket' · 'cart'  ← 지금 들고 있는 것
  let held = null;            // 손에 든 3D 그룹 (캐릭터의 자식)
  let bin  = null;            // 담은 물건이 쌓이는 자리
  let owner = null;           // 지금 들고 있는 캐릭터(player)
  let shown = 0;              // 바구니에 눈으로 보이게 쌓인 개수
  const counts = new Map();   // 상품 id → 담은 개수

  // ---------------------------------------------------------
  //  손에 붙이기 / 떼기
  // ---------------------------------------------------------
  function attach(player) {
    if (!kind || !player) return;
    detach();
    const model = player.model;
    const h = (model.userData.height || REF_H) / REF_H;
    const cfg = HOLD[kind];

    held = new THREE.Group();
    held.add(kind === 'basket' ? makeHandBasket() : makeCart());
    held.scale.setScalar(cfg.scale * h);
    held.position.set(cfg.x * h, cfg.y * h, cfg.z * h);

    bin = new THREE.Group();          // 물건은 이 안에 쌓인다 (바구니 안쪽)
    bin.position.y = cfg.binY;
    held.add(bin);

    model.add(held);
    owner = player;
    refill();                          // 이미 담아둔 물건을 다시 쌓아준다
  }

  /** 손에서 뗀다 (담은 물건 목록은 그대로 남는다) */
  function detach() {
    if (held && owner) owner.model.remove(held);
    held = null; bin = null; owner = null; shown = 0;
  }

  /** 담아둔 물건을 바구니 안에 다시 쌓는다 (장바구니 ↔ 카트를 바꿀 때) */
  function refill() {
    shown = 0;
    for (const [id, n] of counts) for (let i = 0; i < n; i++) stack(id);
  }

  /** 물건 하나를 바구니 안에 쌓는다 */
  function stack(id) {
    if (!bin) return;
    const cfg = HOLD[kind];
    if (shown >= cfg.max) { shown++; return; }   // 너무 많으면 그리지만 않는다
    const m = makeItem(id);
    m.scale.multiplyScalar(0.55);
    m.position.multiplyScalar(0.55);
    const i = shown++;
    const col = i % 3, row = Math.floor(i / 3) % 2, level = Math.floor(i / 6);
    m.position.x += (col - 1) * cfg.gap;
    m.position.z += (row - 0.5) * cfg.gap;
    m.position.y += level * 0.26;
    m.rotation.y = Math.random() * 3;
    bin.add(m);
  }

  // ---------------------------------------------------------
  //  바깥에서 쓰는 것들
  // ---------------------------------------------------------
  const api = {
    get kind()  { return kind; },                       // 지금 들고 있는 것
    get count() { let n = 0; for (const v of counts.values()) n += v; return n; },

    /** 계산서 한 줄씩 — [{ id, name, emoji, price, count, sum }] */
    lines() {
      const out = [];
      for (const [id, n] of counts) {
        const d = getItem(id);
        out.push({ id, name: d.name, emoji: d.emoji ?? '🛍', price: d.price ?? 1,
                   count: n, sum: (d.price ?? 1) * n });
      }
      return out;
    },

    /** 전부 얼마인가 (개수 × 값을 모두 더한 값) */
    total() { return api.lines().reduce((s, l) => s + l.sum, 0); },

    /**
     * 🧺 장바구니 / 🛒 카트를 든다.  같은 걸 또 누르면 내려놓는다.
     * 다른 걸 누르면 담은 물건을 그대로 옮겨 담는다.
     */
    take(want, player, toast) {
      if (kind === want) {
        detach(); kind = null;
        toast(`${HOLD[want].icon} ${HOLD[want].name}를 내려놨어요`);
        return;
      }
      const moving = kind !== null;
      kind = want;
      attach(player);
      toast(moving
        ? `${HOLD[want].icon} ${HOLD[want].name}로 옮겨 담았어요!`
        : `${HOLD[want].icon} ${HOLD[want].name}를 들었어요! 이제 물건을 담아요`);
    },

    /** 진열대에서 물건 하나를 담는다 (여러 개면 그중 하나가 뽑힌다) */
    put(ids, toast, player) {
      if (!kind) {
        toast('먼저 입구에서 🧺 장바구니를 들어요!');
        return;
      }
      if (owner !== player) attach(player);        // 다른 친구로 바뀌었을 때를 대비
      const flat = ids.flat();
      const id = flat[Math.floor(Math.random() * flat.length)];
      const d = getItem(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
      stack(id);
      toast(`${d.emoji} ${withObject(d.name)} 담았어요! ${d.price}${UNIT}`);
    },

    /** 계산이 끝났다 — 바구니를 비운다 */
    clear() {
      counts.clear();
      if (bin) { bin.clear(); shown = 0; }
    },

    /** 마트를 나갈 때 (손에 든 걸 잠깐 떼어둔다) */
    leave() { detach(); },

    /** 마트에 다시 들어왔을 때 (들고 있던 걸 다시 준다) */
    enter(player) { if (kind) attach(player); },
  };
  return api;
}
