// ===========================================================
//  💗 엄마성의 층별 꾸미기 — 1층부터 10층까지 무엇을 놓을지
//
//  ★ 성의 뼈대(바닥·엘리베이터)는 src/mom-layout.js,
//    물건 모양은 src/mom-props.js,  전체 조립은 src/mom-castle.js가 한다.
//  ★ 여기서 쓰는 도우미(put·putSign·floorRide)는 mom-castle.js가 넘겨준다.
//     put(모양, 층, x, z, 방향, 부딪히는크기)
//     putSign(층, 글, x, z, 방향, 가로, 세로, 바탕색, 글자색)
//     floorRide(층, {…})  ← 층에 맞는 공통 설정을 붙여준다
// ===========================================================
import * as THREE from 'three';
import { MOM_W, MOM_D, floorY, FL } from './mom-layout.js';
import {
  P, makeBallPit, makeTrampoline, makeRainbowSlide, makeBlockPile, makeOneBlock,
  makeToyCar, makeCarTrack, makeDollHouse, makeXylophone, XYLO_NOTES, makeDrum,
  makeSnackBar, makeTent, makeFluffyCloud, makeRibbon,
} from './mom-props.js';
import { makeSeatRide } from './house-props.js';
import { makeSign } from './mart-props.js';
import { makeTelescope } from './castle-props2.js';
import { makePlant, makeBalloons } from './castle-props.js';

// 실로폰 음 이름 (누를 때마다 화면에 뜬다)
const DO_RE_MI = ['도', '레', '미', '파', '솔', '라', '시', '높은 도'];

// 인형이 해주는 말
const DOLL_TALK = [
  '인형 친구가 "안녕!" 하고 인사해요 🧸',
  '작은 침대에서 인형이 쿨쿨 자고 있어요 💤',
  '인형의 집에 손님이 놀러 왔대요 🍪',
  '2층 소파에서 그림책을 읽고 있어요 📖',
];
// 간식 카페에서 나오는 말
const SNACK_TALK = [
  '딸기 케이크 한 조각! 🍰', '시원한 주스도 마셔요 🥤',
  '쿠키가 갓 구워졌어요 🍪', '오늘 간식은 무엇일까요? 😋',
];
// 10층 망원경으로 보이는 것
const VIEW_TALK = [
  '저 멀리 인하성이 보여요 🏰', '루하성 위로 별이 반짝여요 🌙',
  '마을 광장에 분수가 콸콸! ⛲', '구름이 코앞에 있어요 ☁️',
];

/**
 * 1층부터 10층까지 전부 꾸민다.
 *   room = interior.js가 만든 방,  ctx = { envMap, music … }
 *   api  = { put, putSign, floorRide, rides, spots }
 */
export function fillFloors(room, ctx, api) {
  const { put, putSign, floorRide, rides, spots } = api;

  // ===========================================================
  //  1층 🎈 볼풀장 — 공이 가득한 곳에 풍덩
  // ===========================================================
  {
    const i = 0, base = floorY(i);
    const PIT = { x: 0, z: 2 };
    const pit = makeBallPit(16, 11, 110);
    put(pit, i, PIT.x, PIT.z);
    //  ★ 볼풀 테두리에만 부딪힌다 (안에는 들어갈 수 있다)
    for (const [ox, oz, hw, hd] of [[0, -5.5, 9, 0.9], [0, 5.5, 9, 0.9],
                                    [-8, 0, 0.9, 5.5], [8, 0, 0.9, 5.5]]) {
      room.obstacles.push({ x: PIT.x + ox, z: PIT.z + oz, hw, hd, ...FL(i) });
    }
    put(makeRibbon(P.hot, 1.4), i, -15, 12, 0);
    put(makePlant(), i, 16, 13, 0, { r: 1.4 });
    room.hang(makeSign('엄마성 — 신나는 놀이터 💗', 16, 2.0, '#ff6fa5', '#fff6e8'),
              0, 6.6, MOM_D / 2 - 0.4, Math.PI);

    rides.push(floorRide(i, {
      kind: 'ballpit', label: '볼풀에 풍덩! 🎈', verb: '놀기', offVerb: '나오기',
      enter: { x: PIT.x, z: PIT.z + 7.4 }, exit: { x: PIT.x, z: PIT.z + 7.4 },
      reach: 4.0,
      onRide(on) { pit.userData.splash = on; },
      pose(t, o) {
        o.x = PIT.x; o.z = PIT.z;
        o.y = base + 0.4 + Math.abs(Math.sin(t * 2.4)) * 1.3;   // 통통 튄다
        o.yaw = Math.sin(t * 0.8) * 0.6;
        o.tilt = 0;
        return o;
      },
    }));
  }

  // ===========================================================
  //  2층 🤸 트램폴린 — 높이높이 뛴다
  // ===========================================================
  {
    const i = 1, base = floorY(i);
    const TR = { x: 0, z: 4 };
    put(makeTrampoline(5.4), i, TR.x, TR.z, 0, { r: 5.8 });
    put(makeBalloons([P.pink, P.sky, P.yellow]), i, -14, 12, 0);
    put(makeBalloons([P.violet, P.lime, P.hot]), i, 14, 12, 0);

    rides.push(floorRide(i, {
      kind: 'tramp', label: '통통! 트램폴린 🤸', verb: '뛰기', offVerb: '그만 뛰기',
      enter: { x: TR.x, z: TR.z + 7.6 }, exit: { x: TR.x, z: TR.z + 7.6 },
      reach: 4.2, camDist: 14, camHeight: 7,
      pose(t, o) {
        o.x = TR.x; o.z = TR.z;
        o.y = base + 1.2 + Math.abs(Math.sin(t * 2.2)) * 4.2;
        o.yaw = t * 0.6;
        o.tilt = 0;
        return o;
      },
    }));
  }

  // ===========================================================
  //  3층 🛝 무지개 미끄럼틀 — 계단으로 올라가서 주르륵
  // ===========================================================
  {
    const i = 2, base = floorY(i);
    //  ★ 계단이 엘리베이터 문 앞(x 0, z -7.6)을 막지 않게 동쪽으로 비켜 놓는다
    const SL = { x: 8, z: -1, len: 13, top: 5.6 };
    put(makeRainbowSlide(SL.len, SL.top), i, SL.x, SL.z, 0, null);
    room.obstacles.push({ x: SL.x, z: SL.z + SL.len / 2, hw: 2.2, hd: SL.len / 2, ...FL(i) });
    put(makePlant(), i, -16, 12, 0, { r: 1.4 });
    put(makeRibbon(P.sky, 1.2), i, 15, -6, 0);

    const DUR = 3.4;
    rides.push(floorRide(i, {
      kind: 'momslide', label: '주르륵~ 미끄럼틀! 🛝', verb: '타기',
      enter: { x: SL.x, z: SL.z - 5.6 },              // 계단 앞
      exit:  { x: SL.x, z: SL.z + SL.len + 3.4 },     // 다 내려온 자리
      reach: 3.6, duration: DUR, autoEnd: true,
      pose(t, o) {
        const u = Math.min(1, Math.max(0, (t - 0.6) / (DUR - 1.1)));
        const e = u * u;                              // 점점 빨라진다
        o.x = SL.x;
        o.z = SL.z + (SL.len + 1.5) * e;
        o.y = base + SL.top - (SL.top - 0.5) * e;
        o.yaw = 0;
        o.tilt = u > 0 && u < 1 ? -0.5 : 0;
        return o;
      },
    }));
  }

  // ===========================================================
  //  4층 🧱 블록 놀이 — 누를 때마다 블록이 한 개씩 쌓인다
  // ===========================================================
  {
    const i = 3, base = floorY(i);
    const BL = { x: -4, z: 4 };
    put(makeBlockPile(), i, BL.x, BL.z, 0, { r: 3.4 });
    const TOWER = { x: 4.5, z: 4 };
    putSign(i, '블록을 쌓아 봐요! 🧱', 0, -MOM_D / 2 + 0.4, 0, 9, 1.5, '#b6e58a', '#2b2340');

    const stacked = [];
    const COLORS = [P.pink, P.yellow, P.sky, P.lime, P.violet, P.orange, P.hot, P.mint];
    spots.push({
      x: TOWER.x, z: TOWER.z + 3.0, r: 3.0, y: base, verb: '쌓기',
      use(toast) {
        if (stacked.length >= 8) {                    // 여덟 개면 와르르
          for (const b of stacked) room.scene.remove(b);
          stacked.length = 0;
          toast('와르르! 다시 쌓아요 🧱');
          return;
        }
        const b = makeOneBlock(COLORS[stacked.length % COLORS.length]);
        b.position.set(TOWER.x, base + 0.85 + stacked.length * 1.7, TOWER.z);
        b.rotation.y = (Math.random() - 0.5) * 0.3;
        room.scene.add(b);
        stacked.push(b);
        toast(`블록 ${stacked.length}개! 🧱`);
      },
    });
  }

  // ===========================================================
  //  5층 🚗 씽씽카 — 동그란 길을 빙글빙글 달린다
  // ===========================================================
  {
    const i = 4, base = floorY(i);
    const TRACK = { x: 0, z: 5, r: 8.5 };
    const SPD = 0.5;                                  // 도는 빠르기
    put(makeCarTrack(TRACK.r), i, TRACK.x, TRACK.z);
    const car = makeToyCar(P.hot);
    const A0 = Math.PI / 2;                           // 세워둔 자리 (남쪽)
    car.position.set(TRACK.x + Math.cos(A0) * TRACK.r, base,
                     TRACK.z + Math.sin(A0) * TRACK.r);
    car.rotation.y = Math.atan2(-Math.sin(A0), Math.cos(A0));
    room.scene.add(car);
    putSign(i, '씽씽 달려요! 🚗', 0, MOM_D / 2 - 0.4, Math.PI, 9, 1.5, '#ffb166', '#2b2340');

    rides.push(floorRide(i, {
      kind: 'car', label: '씽씽카를 타요! 🚗', verb: '타기', offVerb: '내리기',
      enter: { x: TRACK.x, z: TRACK.z + TRACK.r - 3.4 },
      exit:  { x: TRACK.x, z: TRACK.z + TRACK.r - 3.4 },
      reach: 3.8, camDist: 14, camHeight: 7, lookHeight: 2.6,
      pose(t, o) {
        //  ★ 자동차 자리와 내 자리를 **같은 각도 하나**로 계산한다.
        //    (따로 계산하면 회전목마처럼 서로 따로 돈다)
        const a = A0 + t * SPD;
        const x = TRACK.x + Math.cos(a) * TRACK.r;
        const z = TRACK.z + Math.sin(a) * TRACK.r;
        const yaw = Math.atan2(-Math.sin(a), Math.cos(a));
        car.position.set(x, base, z);
        car.rotation.y = yaw;
        o.x = x; o.z = z; o.y = base + 1.35; o.yaw = yaw; o.tilt = 0;
        return o;
      },
    }));
  }

  // ===========================================================
  //  6층 🧸 인형의 집 — 인형들이 이야기를 들려준다
  // ===========================================================
  {
    const i = 5, base = floorY(i);
    put(makeDollHouse(), i, -6, -2, 0, { hw: 4.2, hd: 2.0 });
    put(makeDollHouse(), i, 7, -2, 0, { hw: 4.2, hd: 2.0 });
    put(makeTent(P.violet), i, 0, 10, 0, { r: 3.6 });
    let talk = 0;
    spots.push({
      x: 0, z: 2.6, r: 4.2, y: base, verb: '인형',
      use(toast) { toast(DOLL_TALK[talk++ % DOLL_TALK.length]); },
    });
  }

  // ===========================================================
  //  7층 🥁 음악방 — 실로폰을 두드리면 소리가 난다
  // ===========================================================
  {
    const i = 6, base = floorY(i);
    const xylo = makeXylophone();
    put(xylo, i, 0, 2, 0, { hw: 5.0, hd: 2.0 });
    put(makeDrum(P.hot, 1.8), i, -9, 4, 0, { r: 2.0 });
    put(makeDrum(P.sky, 1.5), i, 9, 4, 0, { r: 1.8 });
    putSign(i, '두드려 봐요! 🥁 도레미파솔라시도', 0, MOM_D / 2 - 0.4, Math.PI,
            13, 1.6, '#c9b4ff', '#2b2340');

    let k = 0;
    spots.push({
      x: 0, z: 5.6, r: 3.6, y: base, verb: '실로폰',
      use(toast) {
        const n = k % XYLO_NOTES.length;
        xylo.userData.hit(n);
        ctx.music?.ping?.(XYLO_NOTES[n]);        // 진짜 소리가 난다 (music.js)
        toast(`${DO_RE_MI[n]} 🎵`);
        k++;
      },
    });
  }

  // ===========================================================
  //  8층 🍰 간식 카페
  // ===========================================================
  {
    const i = 7, base = floorY(i);
    put(makeSnackBar(10), i, 0, -4, 0, { hw: 5.2, hd: 1.2 });
    put(makeTent(P.yellow), i, -10, 8, 0, { r: 3.6 });
    put(makeTent(P.mint), i, 10, 8, 0, { r: 3.6 });
    let talk = 0;
    spots.push({
      x: 0, z: -1.4, r: 3.4, y: base, verb: '간식',
      use(toast) { toast(SNACK_TALK[talk++ % SNACK_TALK.length]); },
    });
  }

  // ===========================================================
  //  9층 ⛺ 이야기 텐트 — 방석에 앉아서 쉰다
  // ===========================================================
  {
    const i = 8, base = floorY(i);
    const TENT = { x: 0, z: 4 };
    put(makeTent(P.sky), i, TENT.x, TENT.z, 0, null);
    put(makePlant(), i, -13, 10, 0, { r: 1.4 });
    put(makePlant(), i, 13, 10, 0, { r: 1.4 });
    putSign(i, '책 읽고 쉬어가요 📖', 0, MOM_D / 2 - 0.4, Math.PI, 10, 1.5, '#a8e6ff', '#2b2340');

    const seat = makeSeatRide(TENT.x, TENT.z, {
      seatY: base + 0.6, yaw: 0, front: 4.6, reach: 3.8,
      label: '텐트에서 쉬어요 ⛺', verb: '앉기',
    });
    seat.enterY = base;
    seat.camBase = true;                    // 높은 층이라 카메라도 같이 올라간다
    seat.camDist = 11; seat.camHeight = 5.4; seat.lookHeight = 2.4;
    rides.push(seat);
  }

  // ===========================================================
  //  10층 🌈 하늘 전망대 — 망원경으로 마을을 내려다본다
  //    (서쪽 벽에 🌈 무지개 다리로 나가는 문이 있다 → mom-castle.js)
  // ===========================================================
  {
    const i = 9, base = floorY(i);
    put(makeTelescope(), i, -8, -4, 0.6, { r: 1.6 });
    put(makeTelescope(), i, 8, -4, -0.6, { r: 1.6 });
    putSign(i, '하늘 전망대 🌈', 0, MOM_D / 2 - 0.4, Math.PI, 12, 2.0, '#ffe98a', '#2b2340');
    // 폭신한 구름 장식 (둥실둥실)
    //  ★ 천장 가까이(+8칸)에만 띄운다. 눈높이에 두면 **카메라가 구름 속에 들어가서**
    //    화면이 온통 하얘진다 (10층에서 실제로 그랬다)
    const CLOUD_AT = [[-15, 4], [15, 4], [-15, 12], [15, 12]];
    CLOUD_AT.forEach(([cx, cz], k) => {
      const c = makeFluffyCloud(0.5);
      c.position.set(cx, base + 8.0, cz);
      room.scene.add(c);
      room.addTick((t) => { c.position.y = base + 8.0 + Math.sin(t * 0.6 + k) * 0.3; });
    });
    let talk = 0;
    spots.push({
      x: 0, z: -2.0, r: 4.6, y: base, verb: '망원경',
      use(toast) { toast(VIEW_TALK[talk++ % VIEW_TALK.length]); },
    });
  }
  //  🌈 10층 서쪽 무지개 다리 문은 mom-castle.js가 붙인다 (문 자리를 거기서 정한다)
}
