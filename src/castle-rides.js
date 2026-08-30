// ===========================================================
//  🏰 성 안에서 할 수 있는 것들 — 앉기 · 타기 · 잠자기 · 공부하기
//
//  ★ 놀이기구 한 개의 생김새는 src/rides.js 맨 위에 설명이 있다.
//    여기서는 "어디에 서면 되는지(enter)"와
//    "타는 동안 몸이 어디에 있어야 하는지(pose)"만 정한다.
//
//  ★ 몇몇은 tick(t, dt)이 있다. castle-interior.js가 매 프레임 불러준다.
//    (왕관 내려오기 · 이불 덮기 · 떠오르는 글자)
// ===========================================================
import { FLOOR2, SLIDE_GAP } from './castle-layout.js';
import { makeFloaters, CHAIR_Y, CHAIR_Z } from './castle-props2.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const SEAT_Y  = 2.9;    // 왕좌 방석 높이 (castle-props.js의 왕좌와 맞춘다)
const HORSE_Y = 2.6;    // 흔들목마 안장 높이
const BED_Y   = 2.05;   // 침대에 누웠을 때 몸 높이 (2층 바닥 기준)

// 🛝 2층 → 1층 미끄럼틀 (남쪽 블록 난간 틈에서 홀로 내려온다)
export const SLIDE = {
  x: (SLIDE_GAP.x0 + SLIDE_GAP.x1) / 2, z: SLIDE_GAP.z, len: 12, bottom: 0.6,
};

// -----------------------------------------------------------
//  👑 왕좌에 앉기 — 앉으면 왕관이 머리 위로 내려온다
// -----------------------------------------------------------
export function makeThroneRide(x, z, crown) {
  const ride = {
    kind: 'throne', label: '왕좌에 앉았어요! 👑',
    verb: '앉기', offVerb: '일어나기',
    enter: { x, z: z + 6.2 }, exit: { x, z: z + 6.6 },
    duration: 30, autoEnd: false, rider: null,
    pose(t, o) {
      o.x = x; o.z = z - 1.0;
      o.y = SEAT_Y + Math.sin(t * 1.6) * 0.05;
      o.yaw = Math.sin(t * 0.7) * 0.12;
      o.tilt = -0.04;
      return o;
    },
    // 왕관 — 아무도 안 앉으면 등받이 위에서 빙글빙글, 앉으면 머리 위로 내려온다
    tick(t) {
      if (ride.rider) {
        const h = ride.rider.userData.height || 1.8;
        crown.scale.setScalar(h * 0.42);      // 앉은 친구 머리 크기에 맞춘다
        crown.position.set(x, SEAT_Y + h + 0.05 + Math.sin(t * 1.6) * 0.05, z - 1.0);
        crown.rotation.y = ride.rider.rotation.y;
      } else {
        crown.scale.setScalar(1);
        crown.position.set(x, 9.6 + Math.sin(t * 1.2) * 0.15, z - 2.7);
        crown.rotation.y = t * 0.4;
      }
    },
  };
  return ride;
}

// -----------------------------------------------------------
//  🐴 흔들목마 타기
// -----------------------------------------------------------
export function makeRockingHorseRide(x, z) {
  return {
    kind: 'rocking', label: '흔들목마를 타요! 🐴',
    enter: { x: x + 3.2, z }, exit: { x: x + 3.6, z },
    duration: 12, autoEnd: false, rider: null,
    pose(t, o) {
      const swing = Math.sin(t * 1.8) * 0.13;      // 목마와 똑같은 각도로 흔들린다
      o.x = x;
      o.z = z + HORSE_Y * Math.sin(swing);
      o.y = HORSE_Y * Math.cos(swing);
      o.yaw = 0;
      o.tilt = swing;
      return o;
    },
  };
}

// -----------------------------------------------------------
//  🛝 2층에서 1층으로 내려오는 미끄럼틀
//     -z 방향으로 내려간다. 다 내려오면 저절로 내린다.
// -----------------------------------------------------------
export function makeSlideRide() {
  const DUR = 3.6;
  const top = FLOOR2 + 0.6;
  const slope = Math.atan2(top - SLIDE.bottom, SLIDE.len);
  return {
    kind: 'slide', label: '2층에서 슝~ 내려가요! 🛝',
    enter: { x: SLIDE.x, z: SLIDE.z + 2.4 }, enterY: FLOOR2,   // 2층 난간 틈 앞
    exit:  { x: SLIDE.x, z: SLIDE.z - SLIDE.len - 4.5 },       // 1층 홀에 내려선다
    duration: DUR, autoEnd: true, camBase: true, rider: null,
    pose(t, o) {
      const u = Math.min(1, Math.max(0, (t - 0.45) / (DUR - 1.15)));
      const e = u * u;                             // 점점 빨라진다
      o.x = SLIDE.x;
      o.z = SLIDE.z - SLIDE.len * e;
      o.y = top - (top - SLIDE.bottom) * e;
      o.yaw = Math.PI;                             // 내려가는 쪽(-z)을 본다
      o.tilt = u < 1 ? slope : 0;
      if (u >= 1) {                                // 다 내려와서 폴짝
        const b = Math.max(0, Math.sin((t - (DUR - 0.7)) * 4.5));
        o.z -= 2.6 + b * 1.2;
        o.y = SLIDE.bottom + b * 1.1;
      }
      return o;
    },
  };
}

// -----------------------------------------------------------
//  🛏 잠자기 — 침대에 누워 이불을 덮으면 성 안이 캄캄해진다
//
//  ★ 침대는 ry = Math.PI 로 놓는다 (베개가 +z 쪽).
//    ride.sleep 이 0 → 1 로 바뀌면 castle-interior.js가 불을 어둡게 한다.
// -----------------------------------------------------------
export function makeBedRide(bed, x, z) {
  const HEAD_Z = z + 2.6;                    // 베개 자리
  const quilt = bed.userData.quilt;          // 이불 (누우면 끌어올린다)
  const quiltY = quilt.position.y;

  const zzz = makeFloaters(['Z', 'Z', 'Z'], '#eaf6ff', 1.4);
  zzz.position.set(x - 2.2, FLOOR2 + 3.0, HEAD_Z);

  const ride = {
    kind: 'bed', label: '잘 자요… 💤',
    verb: '잠자기', offVerb: '일어나기',
    enter: { x: x + 4.9, z }, exit: { x: x + 5.4, z }, enterY: FLOOR2,
    duration: 600, autoEnd: false, camBase: true, rider: null,
    // 천개(침대 지붕)에 가리지 않게 카메라를 낮춰서 옆에서 본다
    camDist: 10, camHeight: 2.6, lookHeight: 1.6,
    sleep: 0,                                // 0 = 깨어 있음, 1 = 푹 잠
    parts: [zzz],                            // 화면에 같이 넣을 것 (castle-interior)
    pose(t, o) {
      const h = ride.rider?.userData.height || 1.5;
      o.x = x;
      o.z = HEAD_Z - h;                      // 머리가 베개에 오도록 발끝 자리를 잡는다
      o.y = FLOOR2 + BED_Y + Math.sin(t * 0.9) * 0.05;   // 새근새근
      o.yaw = Math.PI;
      o.tilt = Math.PI / 2;                  // 반듯이 눕는다
      return o;
    },
    tick(t, dt) {
      const want = ride.rider ? 1 : 0;
      ride.sleep += (want - ride.sleep) * Math.min(1, dt * 2.2);
      // 이불은 몸 "절반 높이"까지만 올라온다 (얼굴은 보여야 자는 모습이 보인다)
      quilt.position.y = quiltY + ride.sleep * 0.42 + Math.sin(t * 0.9) * 0.03;
      zzz.userData.play(t, ride.sleep > 0.45);
    },
  };
  return ride;
}

// -----------------------------------------------------------
//  📖 공부하기 — 의자에 앉아 책상을 보고 공부한다
//     책상은 +z 쪽에 의자가 있다. ry로 돌려 놓으면 자리도 같이 돈다.
// -----------------------------------------------------------
export function makeDeskRide(desk, x, z, ry = 0) {
  const sin = Math.sin(ry), cos = Math.cos(ry);
  const seatX = x + sin * CHAIR_Z, seatZ = z + cos * CHAIR_Z;   // 의자 자리
  const face  = ry + Math.PI;                                   // 책상 쪽을 본다
  const bulb  = desk.userData.bulb;

  const numbers = makeFloaters(['1', '2', '3', '가'], '#fff3c8', 1.1);
  numbers.position.set(x, FLOOR2 + 2.4, z);

  const ride = {
    kind: 'desk', label: '공부 시작! 📖',
    verb: '공부하기', offVerb: '그만하기',
    enter: { x: x + sin * (CHAIR_Z + 2.3), z: z + cos * (CHAIR_Z + 2.3) },
    exit:  { x: x + sin * (CHAIR_Z + 2.7), z: z + cos * (CHAIR_Z + 2.7) },
    enterY: FLOOR2,
    duration: 600, autoEnd: false, camBase: true, rider: null,
    study: 0,
    parts: [numbers],
    pose(t, o) {
      o.x = seatX; o.z = seatZ;
      o.y = FLOOR2 + CHAIR_Y + Math.abs(Math.sin(t * 1.1)) * 0.07;   // 끄덕끄덕
      o.yaw = face + Math.sin(t * 0.8) * 0.13;                       // 공책을 훑어본다
      o.tilt = 0;
      return o;
    },
    tick(t, dt) {
      const want = ride.rider ? 1 : 0;
      ride.study += (want - ride.study) * Math.min(1, dt * 3);
      // 공부하면 스탠드 불이 조금 더 밝아 보인다 (전구가 커진다)
      bulb.scale.setScalar(0.5 + ride.study * 0.3 + Math.sin(t * 6) * 0.02);
      numbers.userData.play(t, ride.study > 0.5);
    },
  };
  return ride;
}
