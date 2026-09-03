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

// 엘리베이터가 움직이는 속도
const LIFT_STOP = 2.6;          // 층마다 멈춰 있는 시간(초)
const LIFT_UP   = 1.6;          // 한 층 오가는 데 걸리는 시간(초)
const LIFT_CYCLE = LIFT_STOP + LIFT_UP;

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
  // 통로 양옆 벽 (위에서 아래까지 통째로)
  for (const x of [sx0 - 0.3, sx1 + 0.3]) {
    g.add(part('box', 0xe8d6ff, x, MOM_H / 2, SHAFT.z, 0.6, MOM_H, SHAFT.hd * 2));
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
  const cab = new THREE.Group();
  cab.add(part('box', 0xfff6e8, 0, -0.15, 0, SHAFT.hw * 2 - 0.5, 0.3, SHAFT.hd * 2 - 0.5));
  cab.add(part('box', 0xffd9ec, 0, 6.0, 0, SHAFT.hw * 2 - 0.5, 0.3, SHAFT.hd * 2 - 0.5));
  cab.add(part('box', 0xffe6f4, 0, 3, -SHAFT.hd + 0.4, SHAFT.hw * 2 - 0.5, 6, 0.3));
  for (const sx of [-1, 1]) {
    cab.add(part('box', 0xffe6f4, sx * (SHAFT.hw - 0.4), 3, 0, 0.3, 6, SHAFT.hd * 2 - 0.5));
  }
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
  const lift = { y: 0, floor: 0 };

  /** 출발 층이 start일 때, k번째로 서는 층 (꼭대기에 닿으면 다시 내려온다) */
  function stopFloor(start, k) {
    const period = (FLOORS - 1) * 2;
    const p = ((start + k) % period + period) % period;
    return p < FLOORS ? p : period - p;
  }

  /** 부드럽게 출발하고 부드럽게 선다 (0~1을 S자로 바꾼다) */
  const ease = (u) => u * u * (3 - 2 * u);

  /** 탄 지 t초 됐을 때 칸의 높이 */
  function liftY(start, t) {
    const k = Math.floor(t / LIFT_CYCLE);
    const ph = t - k * LIFT_CYCLE;
    const a = floorY(stopFloor(start, k));
    if (ph <= LIFT_STOP) return a;
    const b = floorY(stopFloor(start, k + 1));
    return a + (b - a) * ease((ph - LIFT_STOP) / LIFT_UP);
  }

  /** 층마다 하나씩 만드는 "타는 자리" */
  function liftRide(i) {
    let said = -1;                       // 이 층이라고 이미 알려줬나
    return {
      kind: 'lift',
      label: '엘리베이터를 탔어요! 🛗 층마다 멈춰요',
      verb: '엘리베이터',
      //  ★ 버튼 글씨가 지금 층에 따라 바뀐다 ("3층 내리기")
      get offVerb() { return `${lift.floor + 1}층 내리기`; },
      enter: { x: LIFT_STAND.x, z: LIFT_STAND.z },
      exit:  { x: LIFT_STAND.x, z: LIFT_STAND.z },
      enterY: floorY(i),
      reach: 3.8,
      //  ★ 마을 친구는 안 탄다 (친구가 타면 아이가 못 탄다)
      noNpc: true, duration: 600, autoEnd: false, rider: null,
      //  칸이 올라가면 카메라도 같이 올라간다
      camBase: true, camDist: 12, camHeight: 5.6, lookHeight: 2.6,
      say: null,                         // 화면에 띄우고 싶은 말 (main.js가 읽어간다)
      pose(t, o) {
        const y = liftY(i, t);
        lift.y = y;
        //  내릴 층 = 칸 바로 아래 층 (올라가는 중에 내려도 안전하게)
        lift.floor = Math.max(0, Math.min(FLOORS - 1, Math.floor(y / FLOOR_H + 0.001)));
        cab.position.set(SHAFT.x, y, SHAFT.z);
        if (Math.abs(y - floorY(lift.floor)) < 0.01 && said !== lift.floor) {
          said = lift.floor;
          this.say = `${lift.floor + 1}층 ${floorNames[lift.floor]}`;
        }
        o.x = SHAFT.x; o.z = SHAFT.z + 0.3;
        o.y = y + 0.1;
        o.yaw = 0;                        // 문(남쪽)을 바라보고 선다
        o.tilt = 0;
        return o;
      },
    };
  }

  const rides = [];
  for (let i = 0; i < FLOORS; i++) rides.push(liftRide(i));
  return { rides, cab, lift };
}
