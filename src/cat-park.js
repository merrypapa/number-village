// ===========================================================
//  🐱 고양이 놀이터 — 마을 동쪽 끝. 울타리 안에서 고양이 네 마리가 논다
//
//  캣타워 · 고양이 집 · 터널 · 밥그릇 · 깃털 낚싯대 · 큰 방석 · 스크래처 · 털실 공
//
//  ★ 노는 방법
//    고양이 옆에서 `쓰다듬기`  — 골골골 💕 하트가 뜨고, 한동안 아이를 졸졸 따라온다
//    간식통 앞에서 `간식 주기` — 고양이들이 밥그릇으로 우르르 달려와 먹는다
//    낚싯대 앞에서 `낚싯대 흔들기` — 깃털이 흔들리고 고양이들이 폴짝폴짝 뛴다
//    방석에서 `앉기`            — 고양이들이 빙 둘러앉는다
//  ★ 고양이 모양과 마음은 src/cats.js. 이 파일은 놀이터 모양과 버튼(spot)만 만든다.
// ===========================================================
import * as THREE from 'three';
import { part } from './castle-props.js';
import { makeSign } from './mart-props.js';
import { createCats } from './cats.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const PEN_R = 22;            // 울타리 반지름
const POSTS = 52;            // 울타리 기둥 수 (많을수록 촘촘하다 — 사이로 못 빠져나가게 2.7칸 간격)
const GATE_ANGLE = Math.PI;  // 문이 있는 쪽 (π = 서쪽 = 광장 쪽)
const C = {
  grass: 0xcfe8b0, sand: 0xf7e3b0, wood: 0xd9a066, woodDark: 0xb27a4a, rope: 0xe8cfa0,
  pink: 0xff8fc0, mint: 0x7ee0c8, sky: 0x9ad8ff, yellow: 0xffd93d, red: 0xff6b6b,
  white: 0xffffff, cream: 0xfff4e0, purple: 0xc9b4ff,
};
// 놀이터 안 자리 (놀이터 한가운데 기준)
const TOWER   = { x: 8, z: -8 };
const HOUSE   = { x: -9, z: -9 };
const TUNNEL  = { x: -6, z: 8 };
const BOWL    = { x: 11, z: 7 };
const WAND    = { x: 0, z: 14 };
const CUSHION = { x: 0, z: 0 };

// -----------------------------------------------------------
//  🗼 캣타워 — 기둥(스크래처) + 발판 3개 + 꼭대기 방석
// -----------------------------------------------------------
function makeTower() {
  const g = new THREE.Group();
  const post = (x, z, y0, h) => {
    g.add(part('cyl', C.rope, x, y0 + h / 2, z, 0.6, h, 0.6));
    for (let i = 0; i < Math.floor(h / 0.5); i++) g.add(part('cyl', C.woodDark, x, y0 + 0.25 + i * 0.5, z, 0.62, 0.08, 0.62));
  };
  g.add(part('box', C.wood, 0.8, 0.15, 0.3, 5.0, 0.3, 4.0));           // 받침
  post(0, 0, 0.3, 1.5);                    g.add(part('cyl', C.wood, 0, 1.85, 0, 3.4, 0.3, 3.4));
  post(1.6, 0.6, 2.0, 1.4);                g.add(part('cyl', C.wood, 1.6, 3.45, 0.6, 3.2, 0.3, 3.2));
  post(0.2, 1.2, 3.6, 1.4);                g.add(part('cyl', C.wood, 0.2, 5.05, 1.2, 3.0, 0.3, 3.0));
  g.add(part('cyl', C.pink, 0.2, 5.4, 1.2, 2.4, 0.4, 2.4));             // 꼭대기 방석
  g.add(part('ball', C.yellow, -1.4, 2.3, -0.9, 0.5));                  // 매달린 공
  g.add(part('cyl', C.rope, -1.4, 2.7, -0.9, 0.06, 0.8, 0.06));
  return g;
}

// 🏠 고양이 집 — 상자 + 지붕 + 동그란 문
function makeCatHouse() {
  const g = new THREE.Group();
  g.add(part('box', C.cream, 0, 1.3, 0, 3.4, 2.6, 3.2));
  const roof = part('cone', C.red, 0, 3.4, 0, 4.2, 1.6, 4.2);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = part('cyl', 0x5c4630, 0, 1.0, 1.62, 1.6, 0.06, 1.6);
  door.rotation.x = Math.PI / 2;
  g.add(door);
  g.add(part('box', C.pink, 0, 2.5, 1.7, 1.0, 0.25, 0.1));
  return g;
}

// 🛝 터널 — 옆으로 누운 통 (고양이가 지나다닌다)
function makeTunnel() {
  const g = new THREE.Group();
  const tube = part('cyl', C.sky, 0, 1.1, 0, 2.2, 4.6, 2.2);
  tube.rotation.z = Math.PI / 2;
  g.add(tube);
  for (const x of [-1.6, 0, 1.6]) {
    const ring = part('cyl', C.purple, x, 1.1, 0, 2.3, 0.3, 2.3);
    ring.rotation.z = Math.PI / 2;
    g.add(ring);
  }
  return g;
}

// 🍚 밥그릇 3개 + 간식통
function makeBowls() {
  const g = new THREE.Group();
  g.add(part('box', C.mint, 0, 0.04, 0, 4.2, 0.08, 1.8));
  for (const [x, col] of [[-1.3, C.red], [0, C.sky], [1.3, C.yellow]]) {
    g.add(part('cyl', col, x, 0.25, 0, 1.0, 0.5, 1.0));
    g.add(part('cyl', C.cream, x, 0.52, 0, 0.8, 0.06, 0.8));
  }
  g.add(part('ball', 0xff9eb5, 0, 0.62, 0, 0.5, 0.2, 0.3));               // 생선
  const fin = part('cone', 0xff9eb5, -0.5, 0.62, 0, 0.3, 0.4, 0.2);
  fin.rotation.z = Math.PI / 2;                                             // ★ add()는 그룹을 돌려준다 — 먼저 돌리고 넣는다
  g.add(fin);
  // 간식통 (뒤에)
  g.add(part('box', C.purple, 0, 0.9, 2.0, 1.6, 1.8, 1.2));
  g.add(part('box', C.pink, 0, 1.9, 2.0, 1.8, 0.25, 1.4));
  return g;
}

// 🪶 깃털 낚싯대 — 받침대에 꽂힌 막대 끝에 깃털
function makeWand() {
  const g = new THREE.Group();
  g.add(part('cyl', C.woodDark, 0, 0.2, 0, 1.4, 0.4, 1.4));
  const rod = new THREE.Group();
  rod.position.set(0, 0.4, 0);
  rod.add(part('cyl', C.wood, 0, 1.6, 0, 0.12, 3.2, 0.12));
  const tip = new THREE.Group();
  tip.position.set(0, 3.2, 0);
  const string = part('cyl', C.rope, 0, -0.3, 0.5, 0.04, 1.2, 0.04);
  string.rotation.x = -0.6;
  tip.add(string);
  for (const [i, col] of [C.pink, C.yellow, C.mint].entries()) {
    tip.add(part('ball', col, (i - 1) * 0.3, -0.9, 1.0, 0.3, 0.7, 0.15));
  }
  rod.add(tip);
  rod.rotation.x = -0.5;
  g.add(rod);
  g.userData.rod = rod;
  return g;
}

// 🧶 털실 공
function makeYarn(color) {
  const g = new THREE.Group();
  g.add(part('ball', color, 0, 0.5, 0, 1.0));
  const ring = part('torus', color, 0, 0.5, 0, 1.1, 1.1, 1.1);
  ring.rotation.x = 0.6; g.add(ring);
  g.add(part('box', color, 0.8, 0.1, 0.3, 1.6, 0.08, 0.08));
  return g;
}

// -----------------------------------------------------------
//  공개 API — (x, z)는 마을 안에서 놀이터가 놓일 자리
//  { group, obstacles, rides, spots, update(dt, t, playerPos) }
// -----------------------------------------------------------
export function buildCatPark(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const obstacles = [];
  const put = (m, lx, lz, ry = 0, r = 0) => {
    m.position.set(lx, 0, lz); m.rotation.y = ry; group.add(m);
    if (r) obstacles.push({ x: x + lx, z: z + lz, r });
    return m;
  };

  // 바닥 — 연한 잔디 + 가운데 모래길
  const ground = new THREE.Mesh(new THREE.CircleGeometry(PEN_R, 40), new THREE.MeshToonMaterial({ color: C.grass }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.03; ground.receiveShadow = true;
  group.add(ground);
  const path = new THREE.Mesh(new THREE.CircleGeometry(6.5, 28), new THREE.MeshToonMaterial({ color: C.sand }));
  path.rotation.x = -Math.PI / 2; path.position.y = 0.04;
  group.add(path);

  // 🪵 울타리 — 기둥 + 가로대. 서쪽(광장 쪽)에 문이 뚫려 있다
  const gateHalf = Math.PI * 2 / POSTS * 1.2;
  for (let i = 0; i < POSTS; i++) {
    const a = (i / POSTS) * Math.PI * 2;
    let da = a - GATE_ANGLE; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) < gateHalf) continue;                     // 문 자리는 비운다
    const px = Math.cos(a) * PEN_R, pz = Math.sin(a) * PEN_R;
    put(part('box', C.wood, 0, 0.7, 0, 0.3, 1.4, 0.3), px, pz, 0, 0.7);
    const a2 = ((i + 1) / POSTS) * Math.PI * 2;
    let da2 = a2 - GATE_ANGLE; while (da2 > Math.PI) da2 -= Math.PI * 2; while (da2 < -Math.PI) da2 += Math.PI * 2;
    if (Math.abs(da2) < gateHalf) continue;
    const mx = Math.cos((a + a2) / 2) * PEN_R, mz = Math.sin((a + a2) / 2) * PEN_R;
    const len = Math.hypot(Math.cos(a2) - Math.cos(a), Math.sin(a2) - Math.sin(a)) * PEN_R;
    for (const y of [0.5, 1.1]) {
      const rail = part('box', C.woodDark, 0, y, 0, 0.12, 0.14, len);
      rail.position.set(mx, y, mz); rail.rotation.y = -((a + a2) / 2);   // 원 둘레를 따라 눕힌다
      group.add(rail);
    }
  }
  // 🪧 문 위 간판 (문 기둥 두 개 위에)
  const gx = Math.cos(GATE_ANGLE) * PEN_R, gz = Math.sin(GATE_ANGLE) * PEN_R;
  for (const s of [-1, 1]) {
    const px = gx + Math.sin(GATE_ANGLE) * s * 3.2, pz = gz - Math.cos(GATE_ANGLE) * s * 3.2;
    put(part('cyl', C.wood, 0, 2.2, 0, 0.4, 4.4, 0.4), px, pz, 0, 0.5);
  }
  const sign = makeSign('🐱 고양이 놀이터', 7, 1.4, '#ffb8d1', '#5b3d8f');
  sign.position.set(gx, 4.4, gz); sign.rotation.y = GATE_ANGLE + Math.PI / 2;   // 광장 쪽을 본다
  group.add(sign);

  // 놀이 기구들
  put(makeTower(), TOWER.x, TOWER.z, -0.4, 2.4);
  put(makeCatHouse(), HOUSE.x, HOUSE.z, 0.5, 2.2);
  put(makeTunnel(), TUNNEL.x, TUNNEL.z, 0.3);
  obstacles.push({ x: x + TUNNEL.x, z: z + TUNNEL.z, hw: 2.4, hd: 1.3 });
  put(makeBowls(), BOWL.x, BOWL.z, -0.6, 1.4);
  const wand = put(makeWand(), WAND.x, WAND.z, 0, 0.8);
  // 방석 — 아이가 앉는다
  put(part('cyl', C.pink, 0, 0.3, 0, 3.2, 0.6, 3.2), CUSHION.x, CUSHION.z);
  group.add(part('cyl', C.red, CUSHION.x, 0.62, CUSHION.z, 0.5, 0.1, 0.5));
  // 스크래처 · 털실 공 · 꽃
  put(part('cyl', C.rope, 0, 1.2, 0, 0.9, 2.4, 0.9), -14, 1, 0, 0.6);
  group.add(part('cyl', C.wood, -14, 0.1, 1, 2.0, 0.2, 2.0));
  put(makeYarn(C.red), 12, -2, 0.8);
  put(makeYarn(C.sky), -12, 13, 2.1);
  put(makeYarn(C.yellow), 4, -15, 1.4);
  for (const [fx, fz, col] of [[15, 13, C.yellow], [-15, -13, C.pink], [16, -12, C.purple], [-16, 9, C.white],
                                [6, 18, C.red], [-4, -17, C.yellow], [18, 3, C.pink]]) {
    group.add(part('cyl', 0x58c46a, fx, 0.4, fz, 0.1, 0.8, 0.1));
    group.add(part('ball', col, fx, 0.85, fz, 0.5, 0.3, 0.5));
  }

  // -----------------------------------------------------------
  //  🐱 고양이들 — 마을 좌표로 움직인다 (scene에 직접 넣는다 → world.js가 attach(scene)을 불러준다)
  // -----------------------------------------------------------
  const perches = [
    { x: x + TOWER.x, z: z + TOWER.z, y: 2.0 },
    { x: x + TOWER.x + 1.5, z: z + TOWER.z + 0.7, y: 3.6 },
    { x: x + TOWER.x + 0.2, z: z + TOWER.z + 1.2, y: 5.6 },
    { x: x + TUNNEL.x, z: z + TUNNEL.z, y: 0 },
  ];
  let cats = null;              // scene을 알아야 만들 수 있어서 attach()에서 만든다
  let wandTime = 0;

  // 방석 — 앉기 (앉으면 고양이들이 빙 둘러앉는다)
  const cushionRide = {
    kind: 'cushion', label: '방석에 앉아요 🐱 고양이들이 모여요', verb: '앉기', offVerb: '일어나기',
    enter: { x: x + CUSHION.x, z: z + CUSHION.z + 2.6 }, exit: { x: x + CUSHION.x, z: z + CUSHION.z + 2.6 },
    enterY: 0, reach: 3.2, noNpc: true, duration: 600, autoEnd: false, rider: null,
    camDist: 11, camHeight: 6, lookHeight: 1.5,
    onRide(on) { if (on) cats?.gather(x + CUSHION.x, z + CUSHION.z); },
    pose(rt, o) { o.x = x + CUSHION.x; o.z = z + CUSHION.z; o.y = 0.6; o.yaw = 0; o.tilt = 0; return o; },
  };

  const spots = [
    { x: x + BOWL.x, z: z + BOWL.z - 3.0, r: 3.0, y: 0, verb: '간식 주기',
      use(toast) { cats?.treat(); toast('츄르 타임! 🐟 냐옹냐옹 우르르~'); } },
    { x: x + WAND.x, z: z + WAND.z - 2.8, r: 3.0, y: 0, verb: '낚싯대 흔들기',
      use(toast) { cats?.play(x + WAND.x, z + WAND.z); wandTime = 6; toast('살랑살랑 🪶 폴짝폴짝!'); } },
  ];

  /** world.js가 scene을 주면 고양이를 만든다 (고양이는 마을 좌표로 걸어 다닌다) */
  function attach(scene) {
    cats = createCats(scene, { home: { x, z, r: PEN_R }, perches, bowl: { x: x + BOWL.x, z: z + BOWL.z } });
    for (const c of cats.cats) {
      spots.push({
        x: c.m.position.x, z: c.m.position.z, r: 2.8, y: 0, verb: '쓰다듬기', cat: c,
        use(toast) { cats.pet(c); toast(`${c.name}: 야옹~ 골골골 💕 (따라와요)`); },
      });
    }
  }

  function update(dt, t, playerPos) {
    cats?.update(dt, t, playerPos, !!cushionRide.rider);
    for (const s of spots) if (s.cat) { s.x = s.cat.m.position.x; s.z = s.cat.m.position.z; }
    if (wandTime > 0) { wandTime -= dt; wand.userData.rod.rotation.z = Math.sin(t * 9) * 0.6; }
    else wand.userData.rod.rotation.z *= 0.9;
  }

  return { group, obstacles, rides: [cushionRide], spots, attach, update };
}
