// ===========================================================
//  🎨 그림의 집 — 그림을 그리고, 그린 그림을 벽에 거는 집
//
//  이젤 앞에 서서 노란 **그리기** 버튼을 누르면
//  화면 가득 흰 종이가 펼쳐진다 (src/draw-game.js).
//  손가락으로 그리고 '다 그렸어요'를 누르면
//  그림이 **벽 액자에 걸린다**. 액자 6개를 다 채우면 처음 액자부터 바뀐다.
// ===========================================================
import * as THREE from 'three';
import { makeInterior, tileTexture, wallpaperTexture } from './interior.js';
import {
  ART_COLORS, makeEasel, makeColorPencils, makePencils, makeBrushes,
  makePaintTubes, makePalette, makeWaterJar, makeArtTable, makeCrayonBox,
  makeSplat, makeWallFrame,
} from './art-props.js';
import { makeSign } from './mart-props.js';
import { makePlant } from './castle-props.js';
import { makeCushion } from './castle-props2.js';
import { getDrawGame } from './draw-game.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const W = 26, D = 20, H = 8.5;     // 방 크기
const PAINTER = 'nabi';            // 여기 사는 화가 친구 (characters.js의 id)
const FRAMES = 6;                  // 벽에 걸 수 있는 그림 수

export function buildArtHouse(ctx) {
  const room = makeInterior({
    name: 'art',
    w: W, d: D, h: H,
    envMap: ctx.envMap,
    bg: 0xbfe8ff,
    floorTex: tileTexture('#fdf6ec', '#f2e6d6', 11),
    wallTex: wallpaperTexture('#fffaf2', '#ffe0f0', '#ff9ec4'),
    ceilColor: 0xfff6fb,
    doorFrame: 0xc9b4ff,
    exit: ctx.exit,
    exitLabel: '마을로 나왔어요! 🌳',
    camDist: 9, camHeight: 5.6, lookHeight: 2.8,
  });

  // -----------------------------------------------------------
  //  🖼 전시 벽 (북쪽) — 그린 그림이 여기 걸린다
  // -----------------------------------------------------------
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const x = -8.5 + (i % 3) * 8.5;
    const y = i < 3 ? 6.0 : 3.2;
    const f = makeWallFrame(3.2, 2.4);
    room.hang(f, x, y, -D / 2 + 0.25, 0);
    frames.push(f);
  }
  room.hang(makeSign('우리 그림 전시회', 7, 1.2, '#ff9ec4'), 0, 7.9, -D / 2 + 0.3, 0);

  let nextFrame = 0;
  /** 아이가 그린 그림을 다음 빈 액자에 건다 */
  function hangDrawing(canvas) {
    const f = frames[nextFrame % frames.length];
    f.userData.setArt(canvas);
    nextFrame++;
    return nextFrame;
  }

  // -----------------------------------------------------------
  //  🖼 이젤 세 대 — 가운데 이젤 앞에서 그림을 그린다
  // -----------------------------------------------------------
  room.place(makeEasel(0xffe8f0), -7, -3.5, 0.35, { r: 1.6 });
  room.place(makeEasel(), 0, -4.0, 0, { r: 1.6 });
  room.place(makeEasel(0xe8f4ff), 7, -3.5, -0.35, { r: 1.6 });

  //  ★ 그리기 버튼 — 가운데 이젤 바로 앞
  const draw = { spot: null };
  room.addSpot({
    x: 0, z: -0.6, r: 3.2, y: 0, verb: '그리기',
    use(toast) {
      const g = getDrawGame((canvas) => {
        const n = hangDrawing(canvas);
        toast(`멋져요! 그림을 벽에 걸었어요 🖼 (${n}번째)`);
      });
      g.show(true);                     // 새 흰 종이로 시작한다
      toast('손가락으로 그려 봐요! ✏️');
    },
  });

  // -----------------------------------------------------------
  //  🖍 미술 도구 책상 (남쪽) — 색연필 · 연필 · 붓 · 물감 · 팔레트 · 물통
  // -----------------------------------------------------------
  const TABLE = { x: 0, z: 5.0 };
  room.place(makeArtTable(9), TABLE.x, TABLE.z, 0, { hw: 4.6, hd: 1.7 });
  const TOP = 1.26;                    // 책상 윗면 높이
  const SMALL = 0.5;                   // ★ 통·붓·연필은 손에 쥐는 물건이라 작게 놓는다

  /** 책상 위에 작은 도구 하나 놓기 */
  function onTable(g, x, dz, ry = 0) {
    g.scale.setScalar(SMALL);
    return room.place(g, x, TABLE.z + dz, ry, null, TOP);
  }
  onTable(makeColorPencils(), -3.0, -0.5);
  onTable(makePencils(),      -1.7,  0.5);
  onTable(makeBrushes(),      -0.4, -0.5);
  onTable(makeWaterJar(),      0.9,  0.5);
  onTable(makePalette(),       2.6, -0.4, 0.4);

  const tubes = makePaintTubes(); tubes.scale.setScalar(0.6);
  room.place(tubes, -9.5, 3.0, 0.3, { hw: 1.4, hd: 0.8 });
  const crayons = makeCrayonBox(); crayons.scale.setScalar(0.7);
  room.place(crayons, 9.4, 3.2, -0.3, { hw: 1.2, hd: 0.7 });

  // 도구 이름표 (여기가 무엇인지 알려준다)
  room.hang(makeSign('색연필 · 연필 · 붓 · 물감', 6.4, 1.0, '#c9b4ff', '#4a2a7a'),
            0, 4.6, D / 2 - 0.4, Math.PI);

  // 도구 구경하기 — 눌러보면 무엇이 있는지 알려준다
  room.addSpot({
    x: TABLE.x, z: TABLE.z - 2.6, r: 2.6, y: 0, verb: '구경',
    use(toast) { toast('색연필 · 연필 · 붓 · 물감이 다 있어요! 🖍'); },
  });

  // -----------------------------------------------------------
  //  🪑 앉아서 구경하는 자리 · 화분 · 바닥 물감 자국
  // -----------------------------------------------------------
  for (const [x, z, c] of [[-10, -1, 0xff9ec4], [10, -1, 0xa8e6ff], [-4, 8, 0xffd45e]]) {
    const cu = makeCushion(c);
    room.place(cu, x, z);
  }
  room.place(makePlant(), -11.5, -7.5, 0, { r: 1.4 });
  room.place(makePlant(),  11.5, -7.5, 0, { r: 1.4 });
  for (let i = 0; i < 7; i++) {
    room.place(makeSplat(ART_COLORS[i * 2 % ART_COLORS.length]),
               (Math.random() - 0.5) * 20, -2 + (Math.random() - 0.5) * 10);
  }

  // -----------------------------------------------------------
  //  마무리 — 화가 친구가 이젤 옆에서 기다린다
  // -----------------------------------------------------------
  return room.finish({
    residents: [{ id: PAINTER, x: 4.2, z: -0.5, yaw: Math.PI * 0.85, stay: true }],
  });
}
