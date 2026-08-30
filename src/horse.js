// ===========================================================
//  🐴 말 — 타고 진짜로 달릴 수 있다
//
//  ★ 그네나 미끄럼틀은 "정해진 대로 움직이는" 놀이기구지만,
//    말은 내가 조이스틱으로 몬다 (ride.drive = true → src/player.js).
//    말 옆에 가면 🅰 버튼이 '타기'로 바뀐다.
//
//  마구간(buildStable)은 마을(world.js)에 놓는다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const SPEED     = 26;     // 말이 달리는 속도 (걷기 12, 뛰기 20보다 빠르다)
const TURN      = 7;      // 말이 도는 속도
const SCALE     = 0.66;   // 말 크기 (친구들 키가 1.4~1.9라서 조랑말만 하게 줄인다)
const SEAT_Y    = 3.15 * SCALE;   // 안장에 올라탔을 때 발 높이
const BODY_R    = 1.8 * SCALE;    // 말 몸 굵기 (부딪히는 크기)

// 말 세 마리의 색깔과 이름 ← 여기에 한 줄 더하면 말이 늘어난다
export const HORSES = [
  { name: '구름이', body: 0xfff6ec, mane: 0xffb8d4, tack: 0xff7a9c, hoof: 0xd8c2e6 },
  { name: '초코',   body: 0xc08a5a, mane: 0x6b4a2f, tack: 0x8fd0ff, hoof: 0x5b4a3a },
  { name: '별이',   body: 0xc9b4ff, mane: 0xfff0a8, tack: 0xffd45e, hoof: 0x8f7ad0 },
];

// 도형·재질은 만들어서 나눠 쓴다 (말 세 마리가 재질 100개를 갖지 않게)
const G = {
  box:  new THREE.BoxGeometry(1, 1, 1),
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  ball: new THREE.SphereGeometry(0.5, 14, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 12),
};
const _mats = new Map();
function mat(color) {
  if (!_mats.has(color)) _mats.set(color, new THREE.MeshToonMaterial({ color }));
  return _mats.get(color);
}
function part(shape, color, x, y, z, sx, sy = sx, sz = sx) {
  const m = new THREE.Mesh(G[shape], mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// -----------------------------------------------------------
//  말 한 마리 만들기 — 앞쪽(+z)을 바라본다
//  다리 4개는 따로 움직인다 (group.userData.step이 흔들어 준다)
// -----------------------------------------------------------
export function makeHorse(c) {
  const g = new THREE.Group();
  const body = new THREE.Group();          // 몸 전체 (달릴 때 위아래로 통통)
  g.add(body);

  body.add(part('ball', c.body, 0, 2.55, 0, 2.4, 2.2, 4.4));        // 몸통
  body.add(part('ball', c.body, 0, 2.45, -1.5, 2.1, 2.0, 2.2));     // 엉덩이

  // 목 — 앞쪽으로 비스듬히
  const neck = part('cyl', c.body, 0, 3.5, 1.5, 1.25, 2.4, 1.25);
  neck.rotation.x = -0.55;
  body.add(neck);

  // 머리
  const head = new THREE.Group();
  head.position.set(0, 4.35, 2.35);
  head.add(part('ball', c.body, 0, 0, 0, 1.0, 1.0, 1.7));
  head.add(part('ball', c.body, 0, -0.2, 0.85, 0.8, 0.7, 0.9));     // 주둥이
  head.add(part('ball', 0x2b2438, 0, -0.32, 1.28, 0.5, 0.42, 0.4)); // 코끝
  for (const s of [-1, 1]) {
    head.add(part('ball', 0x2b2438, s * 0.42, 0.18, 0.42, 0.22));   // 눈
    head.add(part('ball', 0xffffff, s * 0.46, 0.28, 0.5, 0.09));    // 눈 반짝
    const ear = part('cone', c.body, s * 0.36, 0.75, -0.35, 0.34, 0.7, 0.34);
    ear.rotation.z = s * 0.25;
    head.add(ear);
  }
  head.add(part('box', c.tack, 0, -0.05, 0.75, 1.55, 0.22, 0.22));  // 굴레
  body.add(head);

  // 갈기 — 목을 따라 뭉게뭉게
  for (let i = 0; i < 7; i++) {
    body.add(part('ball', c.mane, 0, 4.5 - i * 0.34, 2.0 - i * 0.28, 0.85, 0.75, 0.6));
  }

  // 꼬리 — 뒤로 늘어진다
  const tail = new THREE.Group();
  tail.position.set(0, 3.0, -2.5);
  for (let i = 0; i < 5; i++) {
    tail.add(part('ball', c.mane, 0, -i * 0.42, -i * 0.16, 0.72 - i * 0.06));
  }
  body.add(tail);

  // 안장 + 등자 (윗면이 SEAT_Y 근처)
  body.add(part('box',  c.tack, 0, 3.05, 0.1, 2.3, 0.5, 2.6));
  body.add(part('ball', c.tack, 0, 3.3, 1.15, 0.45, 0.6, 0.45));     // 앞 손잡이
  for (const s of [-1, 1]) {
    body.add(part('box', c.tack, s * 1.25, 2.55, 0.1, 0.16, 0.9, 1.6));
  }
  // 고삐 (안장 손잡이 → 굴레)
  const rein = part('cyl', c.tack, 0, 3.6, 1.6, 0.09, 2.0, 0.09);
  rein.rotation.x = Math.PI / 2 - 0.5;
  body.add(rein);

  // 다리 4개 — 위쪽(고관절)에서 흔들리도록 그룹으로 만든다
  const legs = [];
  for (const sx of [-1, 1]) {
    for (const sz of [1, -1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * 0.9, 1.9, sz * 1.55);
      leg.add(part('cyl', c.body, 0, -0.55, 0, 0.62, 1.3, 0.62));    // 허벅지
      leg.add(part('cyl', c.body, 0, -1.5, 0, 0.44, 0.9, 0.44));     // 종아리
      leg.add(part('cyl', c.hoof, 0, -1.98, 0, 0.5, 0.35, 0.5));     // 발굽
      leg.userData.phase = (sz > 0 ? 0 : Math.PI) + (sx > 0 ? 0.4 : 0);
      body.add(leg);
      legs.push(leg);
    }
  }

  g.scale.setScalar(SCALE);          // 조랑말 크기로 줄인다

  // 매 프레임 부른다 — moving이면 달리고, 아니면 풀을 뜯는다
  g.userData.bob = 0;
  g.userData.step = (t, moving, power = 1) => {
    if (moving) {
      const w = t * 11;
      for (const leg of legs) leg.rotation.x = Math.sin(w + leg.userData.phase) * 0.75 * power;
      g.userData.bob = Math.abs(Math.sin(w)) * 0.22 * power * SCALE;
      body.position.y = g.userData.bob;
      body.rotation.x = Math.sin(w * 2) * 0.03;
      head.rotation.x = Math.sin(w) * 0.12;
      tail.rotation.x = Math.sin(w * 0.9) * 0.3;
    } else {
      for (const leg of legs) leg.rotation.x *= 0.85;                // 천천히 멈춘다
      g.userData.bob = 0;
      body.position.y = Math.sin(t * 1.4) * 0.06;                    // 숨쉬기
      body.rotation.x = 0;
      head.rotation.x = 0.25 + Math.sin(t * 0.8) * 0.35;             // 풀을 뜯는다
      tail.rotation.z = Math.sin(t * 1.6) * 0.25;
    }
  };
  return g;
}

// -----------------------------------------------------------
//  탈 수 있는 말 하나 (놀이기구 목록에 넣을 모양으로 돌려준다)
// -----------------------------------------------------------
/**
 * x, z  : 처음 서 있는 자리
 * index : HORSES 목록의 몇 번째 말인가
 * 돌려주는 것 — { group, ride, obstacle, update(dt, t) }
 */
export function makeHorseRide(x, z, index = 0, yaw = 0) {
  const c = HORSES[index % HORSES.length];
  const group = makeHorse(c);
  group.position.set(x, 0, z);
  group.rotation.y = yaw;

  // 말은 움직이니까 부딪히는 자리도 같이 따라다닌다 (내가 탈 때는 잠깐 끈다)
  const obstacle = { x, z, r: BODY_R };

  const ride = {
    kind: 'horse',
    label: `${c.name}를 타고 달려요! 🐴`,
    drive: true,                 // ★ 내가 직접 몬다 (player.js의 driveRide)
    noNpc: true,                 // 마을 친구는 안 탄다
    group, speed: SPEED, turn: TURN, seatY: SEAT_Y,
    enter: { x, z },             // 말이 움직이면 player.js가 같이 옮겨준다
    exit:  { x: x + 2.6, z },
    duration: Infinity,
    autoEnd: false,              // 내리기 버튼을 누를 때까지 탄다
    rider: null,
    pose(t, o) {                 // 몰지 않을 때를 대비한 자리 (거의 안 쓴다)
      o.x = group.position.x; o.z = group.position.z;
      o.y = SEAT_Y; o.yaw = group.rotation.y; o.tilt = 0;
      return o;
    },
    onRide(on) { obstacle.off = on; },   // 타는 동안엔 내 말과 부딪히지 않게
  };

  function update(dt, t) {
    if (!ride.rider) group.userData.step(t, false);   // 아무도 안 타면 풀을 뜯는다
    obstacle.x = group.position.x;                    // 부딪히는 자리를 따라 옮긴다
    obstacle.z = group.position.z;
  }

  return { group, ride, obstacle, update };
}

// -----------------------------------------------------------
//  🏚 마구간 — 말들이 사는 집 (지붕 + 여물통 + 건초더미 + 울타리)
// -----------------------------------------------------------
function makeStableBuilding() {
  const g = new THREE.Group();
  const WOOD = 0xc98a56, DARK = 0x9a6238, ROOF = 0xff9ec4;

  g.add(part('box', WOOD, 0, 3.0, -4.0, 16, 6, 0.6));          // 뒷벽
  for (const s of [-1, 1]) {
    g.add(part('box', WOOD, s * 7.7, 3.0, -0.5, 0.6, 6, 7.6));  // 옆벽
    g.add(part('box', DARK, s * 2.6, 3.0, 2.9, 0.5, 6, 0.5));   // 앞 기둥
  }
  g.add(part('box', DARK, 0, 6.2, 2.9, 16, 0.7, 0.7));          // 앞 들보
  // 지붕 — 양쪽으로 기울어진 널빤지 두 장
  for (const s2 of [-1, 1]) {
    const roof = part('box', ROOF, s2 * 4.2, 7.6, -0.5, 9.4, 0.8, 8.6);
    roof.rotation.z = s2 * 0.22;
    g.add(roof);
  }
  g.add(part('box', DARK, 0, 8.5, -0.5, 1.2, 0.6, 8.8));        // 용마루
  g.add(part('cone', ROOF, 0, 9.4, -0.5, 2.4, 1.6, 2.4));       // 지붕 꼭대기 장식

  // 여물통과 건초더미
  g.add(part('box', DARK, -5.5, 0.7, 1.5, 3.0, 1.4, 1.6));
  for (let i = 0; i < 5; i++) {
    g.add(part('ball', 0xffd45e, -5.5 + (i - 2) * 0.5, 1.5, 1.5, 0.7, 0.5, 0.7));
  }
  for (const [hx, hz] of [[5.0, 1.6], [6.4, 0.4]]) {
    g.add(part('cyl', 0xf0d68a, hx, 0.9, hz, 1.8, 1.8, 1.8));
  }
  return g;
}

/**
 * 마구간과 말들을 한꺼번에 만든다.
 * 돌려주는 것 — { group, obstacles, rides, update(dt, t) }
 *   world.js가 이걸 받아서 마을에 넣는다.
 */
export function buildStable(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const building = makeStableBuilding();
  group.add(building);

  // 울타리 (앞마당 양옆)
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const px = s * 9.5, pz = 4 + i * 3.2;
      group.add(part('cyl', 0xc98a56, px, 1.0, pz, 0.35, 2.0, 0.35));
      group.add(part('box', 0xc98a56, px, 1.5, pz + 1.6, 0.25, 0.3, 3.2));
    }
  }

  const obstacles = [
    { x, z: z - 2, hw: 8.2, hd: 4.2 },                 // 마구간 건물
    { x: x - 9.5, z: z + 9, hw: 0.6, hd: 6.5 },        // 울타리 왼쪽
    { x: x + 9.5, z: z + 9, hw: 0.6, hd: 6.5 },        // 울타리 오른쪽
  ];

  // 말 두 마리가 마구간 앞마당에 서 있다
  //  ★ 말은 마을 좌표를 그대로 쓴다 (내가 몰고 멀리 가야 하니까
  //    마구간 group 안에 넣지 않고, 화면(scene)에 따로 넣는다 → world.js)
  const horses = [
    makeHorseRide(x - 4.5, z + 7, 0, 0.3),
    makeHorseRide(x + 4.5, z + 7, 1, -0.3),
  ];

  function update(dt, t) {
    for (const h of horses) h.update(dt, t);
  }

  return {
    group,                                   // 마구간 건물 (마을 화면에 넣는다)
    horses: horses.map(h => h.group),        // 말들 (마을 화면에 따로 넣는다)
    obstacles: [...obstacles, ...horses.map(h => h.obstacle)],
    rides: horses.map(h => h.ride),
    update,
  };
}
