// ===========================================================
//  🏠 친구 집 안 — 문으로 들어가면 집주인이 반겨준다
//
//  집 여섯 채가 모두 이 파일 하나로 만들어진다.
//  거실(소파·탁자·TV·러그)과 부엌은 똑같고,
//  **집주인**과 **특별한 코너**(다리미·피아노·장난감…)만 집마다 다르다.
//
//  ★ 집을 하나 더 늘리려면 아래 HOUSES 배열에 한 줄만 추가하면 된다.
//    (마을에 집이 몇 채인지는 world.js가 이 배열을 보고 정한다)
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import {
  makeSofa, makeSeatRide, makeLowTable, makeTv, makeRug, makeKitchen,
  makeHomeFridge, makeDiningSet, makeWindow, makePicture, makeFloorLamp,
  makeWallClock,
} from './house-props.js';
import { CORNERS } from './house-theme.js';
import { makePlant } from './castle-props.js';
import { makeBed } from './castle-props2.js';
import { makeBedRide } from './castle-rides.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 집 크기
// -----------------------------------------------------------
const W = 30, D = 25, H = 7.5;      // 집 안 가로 · 세로 · 천장 (넓어야 뛰어다니기 좋다)

// -----------------------------------------------------------
//  ★ 집 여섯 채 — 집주인과 특별한 코너
//    owner  : characters.js의 id (이 친구가 집에 산다)
//    corner : house-theme.js의 CORNERS 이름
//    verb   : 코너 앞에서 노란 버튼에 뜨는 말
//    say    : 버튼을 눌렀을 때 화면에 뜨는 말
//    wall / floor / sofa : 집 색깔
//    guests : (없어도 된다) 놀러 온 친구들 [{ id, x, z, yaw }]
//    ownerAt: (없어도 된다) 집주인이 서 있는 자리 { x, z, yaw }
//    song   : (없어도 된다) 버튼을 누르면 흘러나오는 노래 (music.js의 melody)
// -----------------------------------------------------------
export const HOUSES = [
  { id:'silk', name:'실크핑네 다리미 집', owner:'silk', corner:'iron',
    verb:'다리미', say:'치익~ 옷이 뽀송뽀송해졌어요! 👕',
    wall:['#fff6ea', '#a8e6ff', '#63c8ff'], floor:['#f5efe6', '#e6ddd0'], sofa:0x8fd0ff },

  { id:'chacha', name:'차차핑네 요리하는 집', owner:'chacha', corner:'cook',
    verb:'요리', say:'보글보글~ 맛있는 냄새가 나요! 🍲',
    wall:['#fff3e6', '#ffd9a8', '#ffa733'], floor:['#f7e9d6', '#e8d3b8'], sofa:0xffa733 },

  { id:'akdong', name:'악동핑네 음악 집', owner:'akdong', corner:'piano',
    verb:'피아노', say:'딩동댕~ 피아노를 쳤어요! 🎹',
    wall:['#f6eeff', '#d8c2f0', '#a880e0'], floor:['#efe6f7', '#ded0ec'], sofa:0xc9b4ff },

  { id:'ttokttok', name:'똑똑핑네 책 읽는 집', owner:'ttokttok', corner:'book',
    verb:'책읽기', say:'재미있는 책을 읽었어요! 📚',
    wall:['#eef7ff', '#bfe0ff', '#63a8e0'], floor:['#e8eef5', '#d5dfe8'], sofa:0x7ad4c0 },

  { id:'kkurae', name:'꾸래핑네 간식 집', owner:'kkurae', corner:'snack',
    verb:'먹기', say:'냠냠! 케이크가 정말 달아요 🍰',
    wall:['#fff0f6', '#ffd0e4', '#ff9ec4'], floor:['#faeef3', '#ecdae3'], sofa:0xff9ec4 },

  { id:'aja', name:'아자핑네 장난감 집', owner:'aja', corner:'toy',
    verb:'놀기', say:'블록으로 높이높이 쌓았어요! 🧸',
    wall:['#f2fff2', '#c4eec4', '#7ad48f'], floor:['#eef7ee', '#dceadc'], sofa:0xffd45e },

  // 🎂 커핑·머핑 생일 파티 집 — 둘이 케이크 옆에 서 있다. 촛불을 후~ 불면 색종이 팡!
  { id:'party', name:'커핑·머핑 생일 파티 집', owner:'keo', corner:'party',
    verb:'후~ 불기', say:'후~! 생일 축하합니다 🎂🎉 커핑 · 머핑!',
    ownerAt:{ x: 4.2, z: -5.6, yaw: Math.PI * 0.75 },
    guests:[{ id:'meo', x: -4.2, z: -5.6, yaw: -Math.PI * 0.75 }],
    song:'birthday', balloons:true,
    wall:['#fff4fb', '#ffd6ea', '#ff7ab0'], floor:['#fff1f6', '#ffe0ec'], sofa:0xffd45e },
];

// -----------------------------------------------------------
//  집 한 채 만들기
//    house = 위 HOUSES 중 하나,  ctx = { envMap, exit:{x,z,yaw} }
// -----------------------------------------------------------
export function buildHouse(house, ctx) {
  const room = makeInterior({
    name: `house-${house.id}`,
    w: W, d: D, h: H,
    envMap: ctx.envMap,
    bg: 0xbfe8ff,
    floorTex: tileTexture(house.floor[0], house.floor[1], 9),
    wallTex: wallpaperTexture(house.wall[0], house.wall[1], house.wall[2]),
    ceilColor: 0xfffaf2,
    doorFrame: 0xc98a56,
    exit: ctx.exit,
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 8, camHeight: 5.4, lookHeight: 2.6,
  });

  // -----------------------------------------------------------
  //  🛋 거실 (동쪽) — 소파에 앉아서 TV를 본다
  // -----------------------------------------------------------
  const SOFA = { x: W / 2 - 6.5, z: 4 };
  room.place(makeRug(house.sofa, 8, 9), SOFA.x, -0.5);
  room.place(makeSofa(house.sofa), SOFA.x, SOFA.z, Math.PI, { hw: 2.4, hd: 1.2 });
  //  ★ 탁자는 소파 앞 "서는 자리"(z 1.4쯤)를 막지 않게 조금 앞으로 놓는다
  room.place(makeLowTable(), SOFA.x, -0.9, 0, { hw: 1.4, hd: 0.9 });
  const tv = room.place(makeTv(), SOFA.x, -7.0, 0, { hw: 2.2, hd: 0.8 });
  room.place(makeFloorLamp(), W / 2 - 2.0, 2.4, 0, { r: 0.9 });
  room.place(makePlant(), W / 2 - 2.2, -5.0, 0, { r: 1.3 });

  //  소파는 -z 쪽(TV 쪽)을 본다 → 앉으면 TV를 바라보게 된다
  room.rides.push(makeSeatRide(SOFA.x, SOFA.z - 0.15, {
    seatY: 1.05, yaw: Math.PI, front: 2.6,
    label: '소파에 앉았어요! 🛋', verb: '앉기',
  }));

  // 📺 TV 켜기 / 끄기
  let tvOn = false;
  tv.userData.setOn(false);
  room.addSpot({
    x: SOFA.x, z: -4.6, r: 2.2, y: 0,
    get verb() { return tvOn ? '끄기' : 'TV켜기'; },
    use(toast) {
      tvOn = !tvOn;
      tv.userData.setOn(tvOn);
      toast(tvOn ? '텔레비전을 켰어요! 📺' : '텔레비전을 껐어요.');
    },
  });

  // -----------------------------------------------------------
  //  🍳 부엌 (북서쪽) — 싱크대 · 냉장고 · 식탁
  // -----------------------------------------------------------
  room.place(makeKitchen(9), -W / 2 + 6.5, -D / 2 + 0.9, 0, { hw: 4.6, hd: 1.0 });
  room.place(makeHomeFridge(), -W / 2 + 1.4, -D / 2 + 1.0, 0, { hw: 1.0, hd: 0.9 });
  room.place(makeDiningSet(), -W / 2 + 6.0, -5.0, 0, { r: 1.9 });

  // -----------------------------------------------------------
  //  🛏 침대 (남서쪽) — 옆에서 '잠자기'를 누르면 누워서 잔다
  //    ★ 침대는 돌리지 않는다. castle-rides.js의 잠자기 규칙이
  //      "머리는 +z 쪽, 타는 자리는 양옆"을 전제로 만들어져 있다
  // -----------------------------------------------------------
  const BED = { x: -W / 2 + 6.6, z: 4.2 }, BED_SCALE = 0.7;
  const bed = room.place(makeBed(), BED.x, BED.z, 0, { hw: 2.4, hd: 3.1 });
  bed.scale.setScalar(BED_SCALE);            // 성 침대를 조금 줄여서 놓는다
  room.rides.push(makeBedRide(bed, BED.x, BED.z, 0, BED_SCALE));

  // -----------------------------------------------------------
  //  ✨ 집마다 다른 특별한 코너 (북쪽 가운데)
  // -----------------------------------------------------------
  const CORNER = { x: 0, z: -D / 2 + 4.5 };
  const make = CORNERS[house.corner];
  const corner = make ? room.place(make(), CORNER.x, CORNER.z, 0, { hw: 2.8, hd: 1.8 }) : null;
  if (corner) {
    room.addSpot({
      x: CORNER.x, z: CORNER.z + 3.4, r: 3.0, y: 0, verb: house.verb,
      use(toast) {
        //  다리미처럼 반응하는 물건이면 신나게 움직인다.
        //  생일 케이크는 "불었으면 true, 다시 켰으면 false"를 돌려준다
        const did = corner.userData.press?.();
        if (did === false) { toast('촛불을 다시 켰어요 🕯'); return; }
        toast(house.say);
        if (house.song) ctx.music?.melody?.(house.song);   // 🎵 생일 축하 노래
      },
    });
  }

  // -----------------------------------------------------------
  //  🪟 창문 · 액자 · 시계 (벽 꾸미기)
  // -----------------------------------------------------------
  room.hang(makeWindow(3.4, 3.0), -W / 2 + 0.2, 3.8, -1.0, Math.PI / 2);
  room.hang(makeWindow(3.4, 3.0),  W / 2 - 0.2, 3.8, -1.0, -Math.PI / 2);
  room.hang(makePicture(0), -4.0, 4.4, -D / 2 + 0.2, 0);
  room.hang(makePicture(1), W / 2 - 0.2, 4.4, 5.0, -Math.PI / 2);
  room.hang(makePicture(2, 1.4, 1.1), -W / 2 + 0.2, 4.6, 8.0, Math.PI / 2);
  room.hang(makeWallClock(), 4.0, 5.4, -D / 2 + 0.25, 0);

  // -----------------------------------------------------------
  //  마무리 — 집주인이 거실에 서서 반겨준다
  // -----------------------------------------------------------
  const owner = house.ownerAt ?? { x: 2.4, z: 2.0, yaw: Math.PI * 0.15 };
  return room.finish({
    residents: [
      { id: house.owner, ...owner, stay: true },
      //  🎉 놀러 온 친구들 (생일 파티 집의 머핑)
      ...(house.guests ?? []).map(gst => ({ ...gst, stay: true })),
    ],
  });
}
