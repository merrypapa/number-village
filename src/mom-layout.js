// ===========================================================
//  💗 엄마성의 "뼈대" — 10층 바닥, 엘리베이터 통로, 엘리베이터 칸
//
//  ★ 이 파일은 "어디에 바닥이 있는가"와 "엘리베이터가 어떻게 움직이는가"만 정한다.
//    각 층을 무엇으로 꾸미는지는 src/mom-castle.js가 정한다.
//
//  위에서 본 그림 (한 층)
//        북(-z)
//    ┌──────┬─────┬──────┐
//    │      │ 🛗  │      │   ← 엘리베이터는 북쪽 벽 한가운데
//    │      └─────┘      │
//    │      놀이 공간      │
//    └───────────────────┘
//        남(+z) — 1층에만 마을로 나가는 정문이 있다
//
//  ★ 층 바닥은 통째로 깔린다. 그래서 **어느 층에서도 떨어지지 않는다** (7세 안전).
//    층과 층 사이를 오가는 길은 엘리베이터 하나뿐이다.
// ===========================================================
import * as THREE from 'three';
import { part, glow, canvasTex } from './castle-props.js';
import { makeSign } from './mart-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const FLOORS  = 10;      // 몇 층짜리 성인가
export const FLOOR_H = 9;       // 한 층 높이
export const MOM_W = 40;        // 성 안 가로
export const MOM_D = 34;        // 성 안 세로
export const MOM_H = FLOORS * FLOOR_H;    // 성 전체 높이 (90)

/** i층(0부터 센다)의 바닥 높이 */
export const floorY = (i) => i * FLOOR_H;

/** i층에서만 부딪히는 물건에 붙인다 (다른 층에서는 통과) */
export const FL = (i) => ({ y0: floorY(i) - 1, y1: floorY(i) + 5 });

// 🛗 엘리베이터 통로 — 북쪽 벽에 딱 붙어 있다
export const SHAFT = { x: 0, z: -MOM_D / 2 + 3.4, hw: 3.6, hd: 3.4 };
/** 엘리베이터 문 앞에 서는 자리 (여기서 '엘리베이터' 버튼이 뜬다) */
export const LIFT_STAND = { x: SHAFT.x, z: SHAFT.z + SHAFT.hd + 2.6 };

// 🛗 엘리베이터가 한 층 오가는 데 걸리는 시간(초). 작게 하면 빨라진다
const LIFT_UP = 1.6;
const LIFT_SPEED = FLOOR_H / LIFT_UP;   // 1초에 몇 칸 움직이나

// 층 색깔 — 층마다 벽 띠와 바닥 융단 색이 다르다
export const FLOOR_COLORS = [
  0xff9ec4, 0xffd45e, 0xa8e6ff, 0xb6e58a, 0xffb3d9,
  0xc9b4ff, 0x8fd0ff, 0xffc98a, 0xa8ead8, 0xffe98a,
];

// -----------------------------------------------------------
//  바닥 높이 — player.js가 매 프레임 물어본다
//   fromY = 지금 발 높이. 위층 바닥은 "너무 높아서" 안 고른다.
//   (그래서 5층에 서 있으면 계속 5층이다)
// -----------------------------------------------------------
export function momGroundY(x, z, fromY = 0) {
  const REACH = 0.9;
  let y = 0;
  for (let i = 1; i < FLOORS; i++) {
    const fy = floorY(i);
    if (fy > y && fy <= fromY + REACH) y = fy;
  }
  return y;
  // x, z는 쓰지 않는다 — 층 바닥이 통째로 깔려 있기 때문이다
}

// -----------------------------------------------------------
//  🚪 엘리베이터 문 그림 (층마다 하나씩 벽에 붙는다)
// -----------------------------------------------------------
function liftDoorTex() {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#e8d6ff'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#c9b4ff'; ctx.fillRect(0, 0, s / 2 - 2, s);
    ctx.fillStyle = '#b79cff'; ctx.fillRect(s / 2 + 2, 0, s / 2 - 2, s);
    ctx.fillStyle = '#fff6e8';
    ctx.fillRect(s / 2 - 3, 0, 6, s);                       // 가운데 틈
  });
}

// -----------------------------------------------------------
//  층수판 — "3" 처럼 큰 숫자 하나가 적힌 판 (층마다 문 위에 붙는다)
// -----------------------------------------------------------
function makeFloorPlate(n, color) {
  const tex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#2b2340'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = color;
    ctx.font = 'bold 84px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(n), s / 2, s * 0.55);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6),
                           new THREE.MeshBasicMaterial({ map: tex }));
  m.userData.noShadow = true;
  return m;
}

// -----------------------------------------------------------
//  🏗 10층 바닥판 + 엘리베이터 통로를 만든다
//    돌려주는 것: 부딪히는 자리 목록
// -----------------------------------------------------------
export function buildMomStructure(scene, floorNames) {
  const g = new THREE.Group();
  const obstacles = [];
  const HW = MOM_W / 2, HD = MOM_D / 2;
  const doorTex = liftDoorTex();

  // --- 층 바닥판 (2층부터 10층까지. 1층은 성 바닥이 그대로 바닥이다) ---
  //   ★ 엘리베이터 통로 자리는 비워둔다 (칸이 그 사이를 오르내린다)
  for (let i = 1; i < FLOORS; i++) {
    const y = floorY(i) - 0.35;
    const c = FLOOR_COLORS[i % FLOOR_COLORS.length];
    // 통로 왼쪽 / 오른쪽 / 남쪽 — 세 조각으로 나눠서 깐다
    const front = SHAFT.z + SHAFT.hd;          // 통로 앞(남쪽) 끝
    const northD = front - (-HD);              // 통로가 있는 띠의 깊이
    const northZ = (-HD + front) / 2;
    const leftW = (SHAFT.x - SHAFT.hw) - (-HW);
    g.add(part('box', 0xfff3f8, -HW + leftW / 2, y, northZ, leftW, 0.7, northD));
    const rightW = HW - (SHAFT.x + SHAFT.hw);
    g.add(part('box', 0xfff3f8, HW - rightW / 2, y, northZ, rightW, 0.7, northD));
    const southD = HD - front;
    g.add(part('box', 0xfff3f8, 0, y, HD - southD / 2, MOM_W, 0.7, southD));
    // 바닥 가장자리에 층 색 띠 (여기가 몇 층인지 눈으로 안다)
    g.add(part('box', c, 0, y + 0.36, HD - 0.6, MOM_W, 0.06, 1.2));
  }

  // --- 층마다 벽 띠 + 창문 (벽이 90칸이나 되어서 밋밋하지 않게) ---
  for (let i = 0; i < FLOORS; i++) {
    const c = FLOOR_COLORS[i % FLOOR_COLORS.length];
    const y = floorY(i);
    for (const [wx, wz, sx, sz] of [
      [0, -HD + 0.3, MOM_W, 0.2], [0, HD - 0.3, MOM_W, 0.2],
      [-HW + 0.3, 0, 0.2, MOM_D], [HW - 0.3, 0, 0.2, MOM_D],
    ]) {
      g.add(part('box', c, wx, y + 1.1, wz, sx, 0.5, sz));       // 허리 띠
    }
    // 동쪽·서쪽 벽 창문 — 바깥 하늘빛이 들어온다
    for (const sx of [-1, 1]) for (const dz of [-8, 0, 8]) {
      const win = part('box', 0xdff3ff, sx * (HW - 0.35), y + 4.4, dz, 0.2, 3.0, 3.4,
                       glow(0xdff3ff));
      win.userData.noShadow = true;
      g.add(win);
    }
  }

  // --- 🛗 엘리베이터 통로 (바닥부터 꼭대기까지 뻥 뚫린 기둥 모양) ---
  const sx0 = SHAFT.x - SHAFT.hw, sx1 = SHAFT.x + SHAFT.hw;
  const front = SHAFT.z + SHAFT.hd;
  // 통로 양옆 벽 — **한쪽만 보이는 판**이다 (바깥쪽에서만 보인다)
  //  ★ 왜? 엘리베이터를 타면 카메라가 칸 뒤(통로 안)에 선다.
  //    벽이 네모 상자면 카메라가 상자 속에 갇혀서 깜깜해진다.
  //    판으로 만들고 바깥을 향하게 하면, 방에서는 벽으로 보이고
  //    칸 안에서는 **그 층 방 안이 훤히 보인다** (성 벽과 같은 방식)
  for (const [x, ry] of [[sx0 - 0.3, -Math.PI / 2], [sx1 + 0.3, Math.PI / 2]]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(SHAFT.hd * 2, MOM_H),
                                new THREE.MeshToonMaterial({ color: 0xe8d6ff }));
    wall.position.set(x, MOM_H / 2, SHAFT.z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    g.add(wall);
    obstacles.push({ x, z: SHAFT.z, hw: 0.5, hd: SHAFT.hd });
  }
  // 통로 앞면 — 층마다 문 그림이 붙는다. 여기로는 걸어 들어갈 수 없다
  obstacles.push({ x: SHAFT.x, z: front + 0.3, hw: SHAFT.hw + 0.6, hd: 0.5 });
  for (let i = 0; i < FLOORS; i++) {
    const y = floorY(i);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(SHAFT.hw * 2 - 0.6, 5.2),
                                new THREE.MeshToonMaterial({ map: doorTex }));
    door.position.set(SHAFT.x, y + 2.6, front + 0.05);
    door.receiveShadow = true;
    g.add(door);
    // 문 기둥 (양옆 · 위)
    g.add(part('box', 0xb79cff, sx0 - 0.1, y + 2.8, front + 0.2, 0.5, 5.6, 0.5));
    g.add(part('box', 0xb79cff, sx1 + 0.1, y + 2.8, front + 0.2, 0.5, 5.6, 0.5));
    g.add(part('box', 0xb79cff, SHAFT.x, y + 5.7, front + 0.2, SHAFT.hw * 2 + 1.0, 0.6, 0.5));
    // 층수판 + 층 이름표
    const plate = makeFloorPlate(i + 1, '#ffe98a');
    plate.position.set(SHAFT.x - 2.9, y + 5.7, front + 0.5);
    g.add(plate);
    const name = makeSign(`${i + 1}층 ${floorNames[i]}`, 6.4, 1.1, '#2b2340', '#ffd9ec');
    name.position.set(SHAFT.x + 1.2, y + 5.7, front + 0.5);
    g.add(name);
    // 문 앞 발판 — 여기 서면 엘리베이터를 탄다고 알려준다
    const mat = part('box', FLOOR_COLORS[i % FLOOR_COLORS.length],
                     LIFT_STAND.x, y + 0.06, LIFT_STAND.z, 6.0, 0.12, 3.2);
    mat.castShadow = false;
    g.add(mat);
  }

  scene.add(g);
  return { obstacles };
}

// -----------------------------------------------------------
//  🛗 엘리베이터 칸 — 층마다 "타는 자리"가 하나씩 있다
//
//  ★ 왜 층마다 따로 만드나: 놀이기구는 "몇 층에 있는지(enterY)"를 하나만
//    가질 수 있다. 10층에서 다 타려면 자리도 10개여야 한다.
//    칸(모양)과 움직임은 열 개가 **똑같은 것 하나**를 나눠 쓴다.
// -----------------------------------------------------------
export function makeLift(scene, floorNames) {
  // --- 칸 모양 ---
  //  ★ 벽 세 장은 **안쪽에서만 보이는 판**이다.
  //    네모 상자로 만들면 칸 뒤에 선 카메라가 상자에 막혀 앞이 안 보인다
  const cab = new THREE.Group();
  const panel = (color, w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
                             new THREE.MeshToonMaterial({ color }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    return m;
  };
  cab.add(part('box', 0xfff6e8, 0, -0.15, 0, SHAFT.hw * 2 - 0.5, 0.3, SHAFT.hd * 2 - 0.5));
  cab.add(part('box', 0xffd9ec, 0, 6.0, 0, SHAFT.hw * 2 - 0.5, 0.3, SHAFT.hd * 2 - 0.5));
  //  뒷벽 (문 쪽 +z를 바라본다) + 양옆 벽 (칸 안쪽을 바라본다)
  cab.add(panel(0xffe6f4, SHAFT.hw * 2 - 0.5, 6, 0, 3, -SHAFT.hd + 0.4, 0));
  cab.add(panel(0xffdff0, SHAFT.hd * 2 - 0.5, 6, -(SHAFT.hw - 0.4), 3, 0, Math.PI / 2));
  cab.add(panel(0xffdff0, SHAFT.hd * 2 - 0.5, 6, SHAFT.hw - 0.4, 3, 0, -Math.PI / 2));
  // 칸 안 전등과 버튼판
  const bulb = part('ball', 0xfff0a8, 0, 5.5, 0, 1.0, 0.6, 1.0, glow(0xfff0a8));
  bulb.userData.noShadow = true;
  cab.add(bulb);
  for (let i = 0; i < 10; i++) {
    const bx = -1.2 + (i % 2) * 0.9, by = 1.6 + Math.floor(i / 2) * 0.7;
    cab.add(part('cyl', i % 3 ? 0xffd45e : 0xff9ec4, SHAFT.hw - 0.55, by, bx,
                 0.28, 0.12, 0.28, glow(i % 3 ? 0xffd45e : 0xff9ec4)));
  }
  scene.add(cab);

  // --- 지금 상태 (열 개의 타는 자리가 같이 본다) ---
  //   y      : 칸이 지금 있는 높이
  //   target : 가려는 층 (▲▼ 버튼이 이 숫자를 바꾼다)
  //   floor  : 지금 보이는 층 (버튼 글씨와 안내에 쓴다)
  const lift = { y: 0, target: 0, floor: 0, moving: false };
  let said = -1;                       // 이 층이라고 이미 알려줬나

  /**
   * 매 프레임 칸을 목표 층 쪽으로 조금씩 움직인다.
   *  ★ 아이가 ▲▼를 눌러야만 움직인다. (예전에는 저절로 오르내렸다)
   */
  function step(dt) {
    const want = floorY(lift.target);
    const d = want - lift.y;
    if (Math.abs(d) <= LIFT_SPEED * dt) { lift.y = want; lift.moving = false; }
    else { lift.y += Math.sign(d) * LIFT_SPEED * dt; lift.moving = true; }
    cab.position.set(SHAFT.x, lift.y, SHAFT.z);
    //  내릴 층 = 칸 바로 아래 층 (움직이는 중에 내려도 안전하게)
    lift.floor = Math.max(0, Math.min(FLOORS - 1, Math.floor(lift.y / FLOOR_H + 0.001)));
  }

  /** ▲▼ 버튼 — 한 번 누르면 한 층 */
  function go(step1) {
    const next = Math.max(0, Math.min(FLOORS - 1, lift.target + step1));
    if (next === lift.target) return;
    lift.target = next;
    said = -1;                          // 새 층에 서면 다시 알려준다
  }

  /** 층마다 하나씩 만드는 "타는 자리" */
  function liftRide(i) {
    return {
      kind: 'lift',
      label: '엘리베이터를 탔어요! 🛗 ▲▼로 층을 골라요',
      verb: '엘리베이터',
      //  ★ 버튼 글씨가 지금 층에 따라 바뀐다 ("3층 내리기")
      get offVerb() { return `${lift.floor + 1}층 내리기`; },
      //  ★ 화면 왼쪽에 뜨는 버튼 두 개 (main.js가 보여준다)
      buttons: [
        { get label() { return lift.target >= FLOORS - 1 ? '▲\n꼭대기' : '▲\n위로'; },
          press() { go(1); } },
        { get label() { return lift.target <= 0 ? '▼\n1층' : '▼\n아래로'; },
          press() { go(-1); } },
      ],
      enter: { x: LIFT_STAND.x, z: LIFT_STAND.z },
      exit:  { x: LIFT_STAND.x, z: LIFT_STAND.z },
      enterY: floorY(i),
      reach: 3.8,
      //  ★ 마을 친구는 안 탄다 (친구가 타면 아이가 못 탄다)
      noNpc: true, duration: 600, autoEnd: false, rider: null,
      //  칸이 올라가면 카메라도 같이 올라간다
      //  ★ 카메라를 너무 멀리 두면 성 밖까지 나가서 위층 물건이 비쳐 보인다
      camBase: true, camDist: 9.5, camHeight: 5.0, lookHeight: 2.4,
      //  ★ 탈 때 카메라를 **칸 뒤쪽**에 둔다 → 문 밖(그 층 방 안)이 훤히 보인다
      //    (통로 벽과 칸 벽이 한쪽만 보이는 판이라 뒤에서 통과해 보인다)
      camYaw: 0,
      say: null,                         // 화면에 띄우고 싶은 말 (main.js가 읽어간다)
      onRide(on) {
        if (!on) return;
        lift.target = i;                 // 탄 층에서 출발한다
        lift.y = floorY(i);
        said = i;
      },
      pose(t, o) {
        if (!lift.moving && said !== lift.floor) {
          said = lift.floor;
          this.say = `${lift.floor + 1}층 ${floorNames[lift.floor]}`;
        }
        o.x = SHAFT.x;
        o.z = SHAFT.z + 1.4;             // 문 쪽에 서서 밖을 본다
        o.y = lift.y + 0.1;
        o.yaw = 0;                        // 문(남쪽)을 바라보고 선다
        o.tilt = 0;
        return o;
      },
    };
  }

  const rides = [];
  for (let i = 0; i < FLOORS; i++) rides.push(liftRide(i));
  //  step은 mom-castle.js가 매 프레임 불러준다 (칸은 아무도 안 타도 제자리를 지킨다)
  return { rides, cab, lift, step };
}
