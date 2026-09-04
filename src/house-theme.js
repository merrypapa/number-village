// ===========================================================
//  🏠 집마다 다른 특별한 코너 — 다리미 · 피아노 · 장난감 · 간식 · 책 · 요리
//
//  ★ 집 여섯 채가 똑같으면 심심하다. 집주인마다 좋아하는 것이 다르다.
//  ★ 새 코너를 만들려면 아래처럼 함수 하나를 만들고
//    src/houses.js의 HOUSES에서 이름을 적어주면 된다.
//
//  움직이는 물건은 group.userData.tick = (t, dt) => {…} 에 적어둔다.
// ===========================================================
import * as THREE from 'three';
import { C, part, makeBookshelf, makeCakeTable, makePlant } from './castle-props.js';
import { makeCushion } from './castle-props2.js';
import { makePartyCorner } from './party-corner.js';   // 🎂 생일 파티 (파일이 길어서 따로)

const WOOD = 0xc98a56, WOOD_D = 0x9a6238, STEEL = 0xdfe3ea;

// -----------------------------------------------------------
//  👕 다리미 코너 — 다리미판 · 다리미 · 빨래 바구니 · 옷걸이 · 세탁기
//
//  다리미는 판 위를 혼자 왔다 갔다 하고, 김(수증기)이 폭폭 올라온다.
//  group.userData.press() 를 부르면 신나게 빨라진다 (버튼을 눌렀을 때)
// -----------------------------------------------------------
export function makeIroningCorner() {
  const g = new THREE.Group();

  // --- 다리미판 (가로로 긴 판 + X자 다리) ---
  const board = new THREE.Group();
  board.add(part('box', 0xfff0f6, 0, 1.3, 0, 4.2, 0.18, 1.3));       // 판
  board.add(part('box', 0xffd9e8, 0, 1.4, 0, 4.0, 0.06, 1.1));       // 덮개 천
  board.add(part('cyl', 0xfff0f6, 2.3, 1.3, 0, 1.3, 0.18, 1.3));     // 둥근 끝
  for (const s of [-1, 1]) {
    const leg = part('cyl', STEEL, s * 0.9, 0.65, 0, 0.16, 1.4, 0.16);
    leg.rotation.x = s * 0.34;
    board.add(leg);
    const leg2 = part('cyl', STEEL, s * 0.9, 0.65, 0, 0.16, 1.4, 0.16);
    leg2.rotation.x = -s * 0.34;
    board.add(leg2);
  }
  g.add(board);

  // --- 다리미 본체 ---
  const iron = new THREE.Group();
  const body = part('box', 0x63c8ff, 0, 0.22, 0, 1.0, 0.34, 0.62);
  iron.add(body);
  const nose = part('cone', 0x63c8ff, 0.62, 0.2, 0, 0.62, 0.9, 0.62);
  nose.rotation.z = -Math.PI / 2;
  iron.add(nose);
  iron.add(part('box', STEEL, 0, 0.05, 0, 1.3, 0.12, 0.66));         // 바닥판
  iron.add(part('box', 0x2a3040, -0.1, 0.55, 0, 0.9, 0.16, 0.24));   // 손잡이
  for (const s of [-1, 1]) iron.add(part('box', 0x2a3040, s * 0.4, 0.42, 0, 0.16, 0.3, 0.22));
  iron.add(part('cyl', 0xffd45e, -0.62, 0.3, 0, 0.14, 0.5, 0.14));   // 전선 꼭지
  iron.position.set(-1.0, 1.42, 0);
  g.add(iron);

  // --- 김(수증기) 세 덩이 ---
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    p.userData.noShadow = true;
    p.scale.setScalar(0.4);
    g.add(p);
    steam.push(p);
  }

  // --- 빨래 바구니 + 갠 옷 ---
  const basket = new THREE.Group();
  basket.add(part('box', 0xffd45e, 0, 0.5, 0, 1.8, 1.0, 1.4));
  basket.add(part('box', 0xfff6e8, 0, 1.05, 0, 1.6, 0.2, 1.2));
  for (let i = 0; i < 3; i++) {
    basket.add(part('box', [0xff9ec4, 0xa8e6ff, 0xc9b4ff][i], 0, 1.2 + i * 0.22, 0,
                    1.5 - i * 0.1, 0.2, 1.1));
  }
  basket.position.set(3.4, 0, 1.6);
  g.add(basket);

  // --- 옷걸이 행거 (옷이 걸려 있다) ---
  const rack = new THREE.Group();
  for (const s of [-1, 1]) {
    rack.add(part('cyl', STEEL, s * 1.6, 1.6, 0, 0.14, 3.2, 0.14));
    rack.add(part('box', STEEL, s * 1.6, 0.06, 0, 0.2, 0.12, 1.4));
  }
  const bar = part('cyl', STEEL, 0, 3.15, 0, 0.14, 3.4, 0.14);
  bar.rotation.z = Math.PI / 2;
  rack.add(bar);
  const shirts = [0xff9ec4, 0xa8e6ff, 0xfff6a8, 0xc9b4ff];
  for (let i = 0; i < shirts.length; i++) {
    const x = -1.1 + i * 0.75;
    rack.add(part('cyl', STEEL, x, 3.0, 0, 0.5, 0.08, 0.5));         // 옷걸이 고리
    rack.add(part('box', shirts[i], x, 2.2, 0, 1.0, 1.5, 0.3));      // 옷
    rack.add(part('box', shirts[i], x, 2.75, 0, 1.6, 0.3, 0.28));    // 어깨
  }
  rack.position.set(-3.6, 0, -1.4);
  g.add(rack);

  // --- 세탁기 (동그란 창이 돈다) ---
  const washer = new THREE.Group();
  washer.add(part('box', 0xf2f5f8, 0, 1.3, 0, 2.4, 2.6, 2.2));
  washer.add(part('box', 0xdfe3ea, 0, 2.7, 0, 2.4, 0.2, 2.2));
  const glass = part('cyl', 0x8fd0ff, 0, 1.3, 1.12, 1.4, 0.16, 1.4);
  glass.rotation.x = Math.PI / 2;
  washer.add(glass);
  const drum = part('box', 0xffffff, 0, 1.3, 1.2, 0.9, 0.18, 0.1);
  washer.add(drum);
  for (let i = 0; i < 3; i++) {                                       // 세탁기 버튼 세 개
    washer.add(part('cyl', [0xff5a5a, 0x63c8ff, 0xffd93d][i], -0.7 + i * 0.7, 2.5, 1.05,
                    0.3, 0.3, 0.14));
  }
  washer.position.set(3.6, 0, -1.8);
  g.add(washer);

  // --- 움직임 ---
  let boost = 0;                     // 버튼을 누르면 잠깐 신나게 움직인다
  g.userData.tick = (t, dt) => {
    if (boost > 0) boost = Math.max(0, boost - dt);
    const speed = boost > 0 ? 3.4 : 1.1;
    const u = Math.sin(t * speed);
    iron.position.x = u * 1.3;
    iron.rotation.z = Math.cos(t * speed) * 0.06;
    drum.rotation.z = t * (boost > 0 ? 5 : 1.5);

    for (let i = 0; i < steam.length; i++) {
      const life = ((t * 0.9 + i * 0.33) % 1);
      steam[i].position.set(iron.position.x + 0.7, 1.75 + life * 1.6, (i - 1) * 0.16);
      steam[i].scale.setScalar(0.3 + life * 0.55);
      steam[i].material.opacity = (boost > 0 ? 0.75 : 0.45) * (1 - life);
    }
  };
  g.userData.press = () => { boost = 2.5; };
  return g;
}

// -----------------------------------------------------------
//  🎹 피아노 코너 — 건반이 눌리고 음표가 떠오른다
// -----------------------------------------------------------
export function makePianoCorner() {
  const g = new THREE.Group();
  g.add(part('box', 0x3a2a20, 0, 1.6, 0, 4.4, 3.2, 1.4));            // 몸통
  g.add(part('box', 0x2a1d15, 0, 3.3, 0, 4.6, 0.3, 1.6));            // 뚜껑
  g.add(part('box', 0xfff6e8, 0, 1.5, 0.85, 4.2, 0.3, 0.9));         // 건반판

  const keys = [];
  for (let i = 0; i < 14; i++) {
    const k = part('box', 0xffffff, -1.95 + i * 0.3, 1.68, 1.05, 0.26, 0.12, 0.7);
    g.add(k); keys.push(k);
    if ([0, 1, 3, 4, 5].includes(i % 7)) {
      g.add(part('box', 0x1a1a1a, -1.8 + i * 0.3, 1.78, 0.9, 0.14, 0.14, 0.42));
    }
  }
  // 의자
  const bench = new THREE.Group();
  bench.add(part('box', 0x8b5a3c, 0, 1.0, 0, 2.0, 0.2, 0.9));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    bench.add(part('cyl', WOOD_D, sx * 0.8, 0.5, sz * 0.32, 0.16, 1.0, 0.16));
  }
  bench.position.set(0, 0, 2.4);
  g.add(bench);
  // 악보
  g.add(part('box', 0xfff6e8, 0, 3.7, -0.1, 1.6, 1.2, 0.08));

  g.userData.tick = (t) => {
    for (let i = 0; i < keys.length; i++) {
      const on = Math.sin(t * 3 + i * 1.7) > 0.93;
      keys[i].position.y = 1.68 - (on ? 0.06 : 0);
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🧸 장난감 코너 — 장난감 상자 · 블록 탑 · 공 · 곰인형
// -----------------------------------------------------------
export function makeToyCorner() {
  const g = new THREE.Group();
  g.add(part('box', 0xffd45e, 0, 0.7, 0, 3.0, 1.4, 1.8));            // 상자
  g.add(part('box', 0xff9ec4, 0, 1.45, -0.6, 3.1, 0.2, 0.7));        // 열린 뚜껑

  const cols = [0xff5a5a, 0x63c8ff, 0x7ad48f, 0xc9b4ff, 0xffd93d];
  for (let i = 0; i < 6; i++) {                                       // 블록 탑
    g.add(part('box', cols[i % cols.length], 2.4, 0.3 + i * 0.55, 0.4,
               0.9 - i * 0.05, 0.55, 0.9 - i * 0.05));
  }
  for (let i = 0; i < 4; i++) {                                       // 공
    g.add(part('ball', cols[(i + 2) % cols.length], -2.2 - i * 0.1, 0.4,
               1.4 - i * 0.7, 0.8));
  }
  // 곰인형
  const bear = new THREE.Group();
  bear.add(part('ball', 0xd9a566, 0, 0.55, 0, 1.1, 1.2, 1.0));
  bear.add(part('ball', 0xd9a566, 0, 1.35, 0, 1.0));
  for (const s of [-1, 1]) {
    bear.add(part('ball', 0xd9a566, s * 0.38, 1.75, 0, 0.42));
    bear.add(part('ball', 0xc98a56, s * 0.4, 0.6, 0.35, 0.42));
  }
  bear.add(part('ball', 0x3a2a20, 0, 1.3, 0.45, 0.2));
  bear.position.set(-2.2, 0, -0.9);
  g.add(bear);
  g.userData.tick = (t) => { bear.rotation.y = Math.sin(t * 0.8) * 0.3; };
  return g;
}

// -----------------------------------------------------------
//  🍰 간식 코너 (성 파티방의 케이크 탁자를 그대로 쓴다)
// -----------------------------------------------------------
export function makeSnackCorner() {
  const g = new THREE.Group();
  const table = makeCakeTable();
  table.scale.setScalar(0.85);
  g.add(table);
  for (const s of [-1, 1]) {
    const c = makeCushion(s > 0 ? C.pink : C.mint);
    c.position.set(s * 3.2, 0, 1.4);
    g.add(c);
  }
  return g;
}

// -----------------------------------------------------------
//  📚 책 코너 — 책장 두 개와 푹신한 방석
// -----------------------------------------------------------
export function makeBookCorner() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const sh = makeBookshelf();
    sh.scale.setScalar(0.6);
    sh.position.set(sx * 2.1, 0, 0);
    g.add(sh);
  }
  for (const [x, z] of [[-1.2, 2.2], [1.2, 2.6], [0, 3.4]]) {
    const c = makeCushion(0xffd45e);
    c.position.set(x, 0, z);
    g.add(c);
  }
  return g;
}

// -----------------------------------------------------------
//  🍲 요리 코너 — 큰 냄비와 도마, 썰어놓은 채소
// -----------------------------------------------------------
export function makeCookCorner() {
  const g = new THREE.Group();
  g.add(part('box', WOOD, 0, 0.9, 0, 3.4, 0.2, 1.8));                // 조리대
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', WOOD_D, sx * 1.4, 0.45, sz * 0.7, 0.22, 0.9, 0.22));
  }
  const pot = part('cyl', 0xff5a5a, -0.9, 1.4, 0, 1.4, 0.9, 1.4);
  g.add(pot);
  g.add(part('cyl', STEEL, -0.9, 1.9, 0, 1.5, 0.12, 1.5));
  g.add(part('box', WOOD_D, 1.0, 1.05, 0, 1.4, 0.12, 1.0));          // 도마
  const veg = [0xff5a5a, 0x7ad48f, 0xffa733, 0xffd93d];
  for (let i = 0; i < 6; i++) {
    g.add(part('cyl', veg[i % veg.length], 0.6 + (i % 3) * 0.35, 1.16,
               (i < 3 ? -0.2 : 0.2), 0.3, 0.1, 0.3));
  }
  const plant = makePlant();
  plant.scale.setScalar(0.7);
  plant.position.set(2.6, 0, 0.4);
  g.add(plant);

  // 냄비에서 김이 폭폭
  const puff = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
  );
  puff.userData.noShadow = true;
  g.add(puff);
  g.userData.tick = (t) => {
    const life = (t * 0.7) % 1;
    puff.position.set(-0.9, 2.0 + life * 1.4, 0);
    puff.scale.setScalar(0.35 + life * 0.6);
    puff.material.opacity = 0.45 * (1 - life);
  };
  return g;
}

// -----------------------------------------------------------
//  코너 이름 → 만드는 함수 (houses.js가 이 표를 본다)
// -----------------------------------------------------------
export const CORNERS = {
  iron:  makeIroningCorner,
  piano: makePianoCorner,
  toy:   makeToyCorner,
  snack: makeSnackCorner,
  book:  makeBookCorner,
  cook:  makeCookCorner,
  party: makePartyCorner,    // 🎂 커핑·머핑 생일 파티
};
