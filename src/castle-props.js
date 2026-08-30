// ===========================================================
//  성 안에 놓을 물건들 — 왕좌, 벽난로, 케이크 탁자, 책장, 숫자 블록…
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 castle-interior.js가 정한다.
//  ★ 움직이는 물건은 group.userData.tick = (t) => {…} 에 적어둔다.
//    castle-interior.js가 매 프레임 대신 불러준다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 색깔
// -----------------------------------------------------------
export const C = {
  gold:     0xffd45e,   // 금색 (왕좌·샹들리에)
  goldDark: 0xe0a92c,
  red:      0xff7a9c,   // 왕좌 방석
  pink:     0xffb8d4,
  violet:   0xc9b4ff,
  mint:     0xa8ead8,
  cream:    0xfff6e8,
  wood:     0xc98a56,
  woodDark: 0x9a6238,
  stone:    0xdcd2ea,
  fire:     0xffa733,
  leaf:     0x74cf82,
  choco:    0x8b5a3c,
};

// 도형과 재질은 한 번만 만들어서 모두가 나눠 쓴다 (친구 100명이 재질 100개를 갖지 않게)
const G = {
  box:   new THREE.BoxGeometry(1, 1, 1),
  cyl:   new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cone:  new THREE.ConeGeometry(0.5, 1, 16),
  ball:  new THREE.SphereGeometry(0.5, 16, 12),
  half:  new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  torus: new THREE.TorusGeometry(0.5, 0.06, 8, 24),
  oct:   new THREE.OctahedronGeometry(0.5),
  plane: new THREE.PlaneGeometry(1, 1),
};

const _toon = new Map();
/** 만화풍 재질 (같은 색이면 재사용) */
export function toon(color) {
  if (!_toon.has(color)) _toon.set(color, new THREE.MeshToonMaterial({ color }));
  return _toon.get(color);
}

const _glow = new Map();
/** 스스로 빛나 보이는 재질 — 촛불, 창문, 램프 (같은 색이면 재사용) */
export function glow(color) {
  if (!_glow.has(color)) _glow.set(color, new THREE.MeshBasicMaterial({ color }));
  return _glow.get(color);
}

/** 도형 하나 만들기 — part('box', 색, x,y,z, 가로,세로,깊이) */
export function part(shape, color, x, y, z, sx, sy = sx, sz = sx, mat) {
  const m = new THREE.Mesh(G[shape], mat || toon(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Canvas에 그림을 그려서 텍스처로 만든다 (성 바닥·벽지·스테인드글라스에 쓴다) */
export function canvasTex(size, draw) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 하트 한 개 (공 두 개 + 아래로 뒤집은 고깔) */
export function makeHeart(color, s = 1) {
  const g = new THREE.Group();
  g.add(part('ball', color, -0.28 * s, 0.28 * s, 0, 0.62 * s));
  g.add(part('ball', color,  0.28 * s, 0.28 * s, 0, 0.62 * s));
  const tip = part('cone', color, 0, -0.28 * s, 0, 1.1 * s, 1.1 * s, 0.62 * s);
  tip.rotation.z = Math.PI;
  g.add(tip);
  return g;
}

// -----------------------------------------------------------
//  👑 왕좌 — 계단이 있는 단상 위에 앉는 자리
//     방석 윗면 높이 = 2.9 (castle-interior.js의 타기 자세와 맞춰야 한다)
// -----------------------------------------------------------
export function makeThrone() {
  const g = new THREE.Group();

  // 단상 2층 + 앞 계단
  g.add(part('box', C.violet, 0, 0.3, 0, 12, 0.6, 8));
  g.add(part('box', C.stone,  0, 0.9, -0.5, 9.5, 0.6, 6.6));
  g.add(part('box', C.stone,  0, 0.15, 4.6, 5.5, 0.3, 1.4));
  g.add(part('box', C.red,    0, 1.22, 1.2, 4, 0.06, 5.6));   // 붉은 융단

  const y = 1.2;                                   // 단상 윗면
  g.add(part('box', C.gold, 0, y + 0.5, -1.0, 4.2, 1.0, 3.4));      // 의자 받침
  g.add(part('box', C.red,  0, y + 1.35, -1.0, 4.4, 0.7, 3.6));     // 방석 (윗면 2.9)
  g.add(part('box', C.gold, 0, y + 3.2, -2.7, 4.4, 4.6, 0.6));      // 등받이
  g.add(part('box', C.red,  0, y + 3.2, -2.35, 3.2, 3.6, 0.15));    // 등받이 천

  for (const s of [-1, 1]) {                       // 팔걸이
    g.add(part('box',  C.gold, s * 2.1, y + 2.0, -1.0, 0.5, 0.5, 3.2));
    g.add(part('ball', C.pink, s * 2.1, y + 2.3, 0.6, 0.75));
    g.add(part('ball', C.gold, s * 2.0, y + 5.6, -2.7, 0.5));       // 등받이 위 구슬
  }

  const heart = makeHeart(C.red, 1.5);             // 등받이 꼭대기 하트
  heart.position.set(0, y + 6.0, -2.7);
  g.add(heart);
  return g;
}

// -----------------------------------------------------------
//  🔥 벽난로 — 불이 살랑살랑 흔들린다 (+z 쪽을 바라본다)
// -----------------------------------------------------------
export function makeFireplace() {
  const g = new THREE.Group();
  g.add(part('box', C.stone, 0, 3.2, -0.8, 7.5, 6.4, 1.6));         // 몸통
  g.add(part('box', 0x4a3550, 0, 1.7, -0.15, 3.8, 3.4, 0.5));       // 아궁이 (어두운 안쪽)
  g.add(part('box', C.gold,  0, 6.6, -0.6, 8.6, 0.45, 2.4));        // 선반
  g.add(part('box', C.woodDark, 0, 0.35, -0.2, 3.4, 0.3, 1.4));     // 장작 받침

  for (const s of [-1, 1]) {                                        // 장작
    const log = part('cyl', C.woodDark, s * 0.5, 0.75, -0.2, 0.5, 2.6, 0.5);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = s * 0.2;
    g.add(log);
  }

  // 불꽃 3개 — tick에서 위아래로 늘였다 줄였다 한다
  const flames = [
    part('cone', C.fire,   0,    1.5, -0.2, 1.5, 2.0, 1.0, glow(C.fire)),
    part('cone', 0xffd45e, -0.6, 1.3, -0.1, 0.9, 1.4, 0.7, glow(0xffd45e)),
    part('cone', 0xffd45e,  0.6, 1.3, -0.3, 0.9, 1.3, 0.7, glow(0xffd45e)),
  ];
  for (const f of flames) { f.castShadow = false; g.add(f); }

  // 불빛 (따뜻한 주황빛이 방을 비춘다)
  const light = new THREE.PointLight(0xff9a4d, 1.4, 26, 2);
  light.position.set(0, 2.0, 1.2);
  g.add(light);

  // 선반 위 장식 — 작은 화분과 촛불
  g.add(part('cyl', C.mint, -2.6, 7.15, -0.6, 0.9, 0.8, 0.9));
  g.add(part('ball', C.leaf, -2.6, 7.9, -0.6, 1.1, 0.9, 1.1));
  g.add(part('cyl', C.cream, 2.6, 7.3, -0.6, 0.5, 1.1, 0.5));
  g.add(part('ball', 0xffe08a, 2.6, 8.05, -0.6, 0.35, 0.55, 0.35, glow(0xffe08a)));

  g.userData.tick = (t) => {
    for (let i = 0; i < flames.length; i++) {
      const s = 1 + Math.sin(t * 7 + i * 2) * 0.16 + Math.sin(t * 13 + i) * 0.07;
      flames[i].scale.y = (i === 0 ? 2.0 : 1.35) * s;
      flames[i].scale.x = (i === 0 ? 1.5 : 0.9) * (2 - s);
    }
    light.intensity = 1.3 + Math.sin(t * 9) * 0.25;
  };
  return g;
}

// -----------------------------------------------------------
//  🍰 케이크 탁자 — 딸기 케이크, 컵케이크, 주전자
// -----------------------------------------------------------
export function makeCakeTable() {
  const g = new THREE.Group();
  g.add(part('cyl', C.wood,  0, 0.9, 0, 0.7, 1.8, 0.7));            // 다리
  g.add(part('cyl', C.wood,  0, 0.12, 0, 2.0, 0.25, 2.0));          // 받침
  g.add(part('cyl', C.cream, 0, 1.9, 0, 4.4, 0.3, 4.4));            // 상판
  g.add(part('cyl', C.pink,  0, 2.07, 0, 4.0, 0.06, 4.0));          // 식탁보

  // 가운데 케이크 (2층 + 딸기)
  g.add(part('cyl', C.cream, 0, 2.5, 0, 2.2, 0.9, 2.2));
  g.add(part('cyl', C.pink,  0, 3.05, 0, 2.3, 0.25, 2.3));
  g.add(part('cyl', C.cream, 0, 3.45, 0, 1.4, 0.65, 1.4));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part('ball', 0xff5f7a, Math.cos(a) * 0.5, 3.9, Math.sin(a) * 0.5, 0.34));
  }
  const candle = part('cyl', C.cream, 0, 4.1, 0, 0.16, 0.7, 0.16);
  const flame  = part('ball', 0xffe08a, 0, 4.55, 0, 0.22, 0.34, 0.22, glow(0xffe08a));
  flame.castShadow = false;
  g.add(candle, flame);

  // 컵케이크 3개와 주전자·컵
  const cupColors = [C.mint, C.violet, C.pink];
  for (let i = 0; i < 3; i++) {
    const a = 2.1 + i * 0.75;
    const x = Math.cos(a) * 1.6, z = Math.sin(a) * 1.6;
    g.add(part('cyl', C.choco, x, 2.28, z, 0.5, 0.35, 0.5));
    g.add(part('ball', cupColors[i], x, 2.6, z, 0.55, 0.5, 0.55));
    g.add(part('ball', 0xff5f7a, x, 2.85, z, 0.18));
  }
  g.add(part('ball', C.mint, -1.5, 2.45, -0.4, 0.9, 0.8, 0.9));     // 주전자
  g.add(part('cyl', C.mint, -1.5, 2.85, -0.4, 0.3, 0.3, 0.3));
  g.add(part('cyl', C.cream, 1.4, 2.3, -1.0, 0.45, 0.4, 0.45));     // 컵

  g.userData.tick = (t) => {
    flame.scale.y = 0.34 + Math.sin(t * 8) * 0.06;
  };
  g.scale.setScalar(0.85);      // 작은 친구도 케이크가 보이도록 조금 낮춘다
  return g;
}

// -----------------------------------------------------------
//  📚 책장 — 알록달록한 책이 꽂혀 있다 (+z 쪽을 바라본다)
// -----------------------------------------------------------
export function makeBookshelf() {
  const g = new THREE.Group();
  g.add(part('box', C.wood, 0, 4, -0.7, 8, 8, 1.4));                // 뒷판
  const bookColors = [C.red, C.mint, C.violet, C.pink, 0xffd45e, 0x8fd0ff];

  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 1.2 + shelf * 2.4;
    g.add(part('box', C.woodDark, 0, y, -0.2, 7.6, 0.25, 1.4));     // 선반 널빤지
    let x = -3.3;
    while (x < 3.2) {
      const w = 0.3 + Math.random() * 0.25;
      const h = 1.2 + Math.random() * 0.7;
      const c = bookColors[Math.floor(Math.random() * bookColors.length)];
      const b = part('box', c, x + w / 2, y + 0.12 + h / 2, -0.2, w, h, 1.0);
      b.rotation.z = Math.random() < 0.12 ? 0.22 : 0;                // 가끔 삐딱하게
      g.add(b);
      x += w + 0.06;
    }
  }
  g.add(part('box', C.gold, 0, 8.3, -0.5, 8.6, 0.4, 1.8));          // 윗 장식
  return g;
}

// -----------------------------------------------------------
//  🧸 책 읽는 자리 — 동그란 양탄자 + 쿠션 + 곰인형
// -----------------------------------------------------------
export function makeNook() {
  const g = new THREE.Group();
  g.add(part('cyl', C.pink,  0, 0.04, 0, 8, 0.08, 8));              // 양탄자
  g.add(part('cyl', C.cream, 0, 0.09, 0, 6, 0.06, 6));

  const cushions = [[-1.8, 0.4, C.violet], [1.6, -1.2, C.mint], [0.6, 1.8, C.red]];
  for (const [x, z, c] of cushions) {
    g.add(part('box', c, x, 0.35, z, 1.8, 0.55, 1.8));
    g.add(part('ball', c, x, 0.45, z, 1.9, 0.5, 1.9));
  }

  // 곰인형 (쿠션 위에 앉아 있다)
  const bear = new THREE.Group();
  bear.add(part('ball', C.wood, 0, 0.55, 0, 1.1, 1.0, 0.9));
  bear.add(part('ball', C.wood, 0, 1.45, 0.05, 1.0));
  for (const s of [-1, 1]) {
    bear.add(part('ball', C.wood, s * 0.42, 1.95, 0, 0.42));        // 귀
    bear.add(part('ball', 0x2b2438, s * 0.22, 1.5, 0.45, 0.16));    // 눈
  }
  bear.add(part('ball', C.cream, 0, 1.3, 0.45, 0.5, 0.4, 0.4));     // 주둥이
  bear.position.set(-1.8, 0.55, 0.4);
  bear.rotation.y = 0.5;
  g.add(bear);

  // 펼쳐진 그림책
  const bookL = part('box', C.cream, 1.5, 0.72, 0.3, 1.3, 0.08, 1.7);
  const bookR = part('box', C.cream, 2.8, 0.72, 0.3, 1.3, 0.08, 1.7);
  bookL.rotation.z = 0.12; bookR.rotation.z = -0.12;
  g.add(bookL, bookR);

  g.userData.tick = (t) => { bear.rotation.z = Math.sin(t * 1.3) * 0.06; };
  return g;
}

// -----------------------------------------------------------
//  🕯️ 촛대 — 불꽃이 흔들린다
// -----------------------------------------------------------
export function makeCandleStand() {
  const g = new THREE.Group();
  g.add(part('cyl', C.gold, 0, 0.15, 0, 1.6, 0.3, 1.6));
  g.add(part('cyl', C.gold, 0, 1.6, 0, 0.35, 3.0, 0.35));
  g.add(part('ball', C.gold, 0, 3.15, 0, 0.9, 0.5, 0.9));
  g.add(part('cyl', C.cream, 0, 3.7, 0, 0.5, 1.1, 0.5));
  const flame = part('ball', 0xffe08a, 0, 4.45, 0, 0.35, 0.6, 0.35, glow(0xffe08a));
  flame.castShadow = false;
  g.add(flame);
  const light = new THREE.PointLight(0xffd08a, 0.5, 12, 2);
  light.position.y = 4.5;
  g.add(light);
  g.userData.tick = (t) => {
    flame.scale.y = 0.6 + Math.sin(t * 9 + g.position.x) * 0.12;
    light.intensity = 0.5 + Math.sin(t * 11 + g.position.z) * 0.12;
  };
  return g;
}

// -----------------------------------------------------------
//  🪴 화분
// -----------------------------------------------------------
export function makePlant() {
  const g = new THREE.Group();
  g.add(part('cyl', 0xe08a6a, 0, 0.7, 0, 1.7, 1.4, 1.7));
  g.add(part('cyl', 0xf0a080, 0, 1.45, 0, 1.9, 0.3, 1.9));
  g.add(part('ball', C.leaf, 0, 2.7, 0, 2.4, 2.2, 2.4));
  g.add(part('ball', C.leaf, 0.8, 3.5, 0.3, 1.5));
  g.add(part('ball', C.leaf, -0.7, 3.3, -0.4, 1.3));
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6;
    g.add(part('ball', C.pink, Math.cos(a) * 1.4, 3.1 + i * 0.25, Math.sin(a) * 1.4, 0.45));
  }
  return g;
}

// -----------------------------------------------------------
//  🔢 숫자 블록 장난감 — 숫자마을이니까 성 안에도 숫자가 있다
// -----------------------------------------------------------
const BLOCK_COLORS = [0xff8fb0, 0x8fd0ff, 0xffd45e, 0xa8ead8, 0xc9b4ff, 0xffa07a];
export function makeNumberBlocks() {
  const g = new THREE.Group();
  const spots = [[-1.1, 0.7, 0], [1.1, 0.7, 0.2], [0, 2.1, 0.1], [0.4, 0.7, -1.6]];
  for (let i = 0; i < spots.length; i++) {
    const [x, y, z] = spots[i];
    const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
    const tex = canvasTex(128, (ctx, s) => {
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 92px "Apple SD Gothic Neo",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), s / 2, s / 2 + 6);
    });
    const cube = new THREE.Mesh(G.box, new THREE.MeshToonMaterial({ map: tex }));
    cube.position.set(x, y, z);
    cube.scale.setScalar(1.4);
    cube.rotation.y = (Math.random() - 0.5) * 0.6;
    cube.castShadow = true; cube.receiveShadow = true;
    g.add(cube);
  }
  return g;
}

// -----------------------------------------------------------
//  🎈 풍선 다발 — 둥실둥실 떠 있다
// -----------------------------------------------------------
export function makeBalloons(colors = [C.red, C.mint, C.violet]) {
  const g = new THREE.Group();
  const balloons = [];
  for (let i = 0; i < colors.length; i++) {
    const b = new THREE.Group();
    const x = (i - (colors.length - 1) / 2) * 1.3;
    b.add(part('ball', colors[i], 0, 0, 0, 1.1, 1.35, 1.1));
    b.add(part('cone', colors[i], 0, -0.75, 0, 0.4, 0.5, 0.4));
    const str = part('cyl', C.cream, 0, -2.4, 0, 0.06, 3.4, 0.06);
    str.castShadow = false;
    b.add(str);
    b.position.set(x, 5.4 + i * 0.4, 0);
    g.add(b);
    balloons.push(b);
  }
  g.userData.tick = (t) => {
    for (let i = 0; i < balloons.length; i++) {
      balloons[i].position.y = 5.4 + i * 0.4 + Math.sin(t * 1.1 + i) * 0.28;
      balloons[i].rotation.z = Math.sin(t * 0.8 + i) * 0.1;
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🐴 흔들목마 — 성 안에서도 탈 수 있다 (castle-interior.js가 타기로 만든다)
//     앞쪽(+z)을 바라본다. 안장 높이 = 2.4
// -----------------------------------------------------------
export function makeRockingHorse() {
  const g = new THREE.Group();
  const body = new THREE.Group();

  body.add(part('ball', C.cream, 0, 1.8, 0, 1.6, 1.5, 3.2));          // 몸통
  const neck = part('cyl', C.cream, 0, 2.7, 1.1, 0.95, 2.0, 0.95);    // 목
  neck.rotation.x = -0.5;
  body.add(neck);
  body.add(part('ball', C.cream, 0, 3.7, 1.7, 0.95, 1.0, 1.3));       // 머리
  body.add(part('ball', C.pink,  0, 3.45, 2.4, 0.7, 0.6, 0.8));       // 코
  for (const s of [-1, 1]) {
    body.add(part('ball', 0x2b2438, s * 0.38, 3.9, 2.05, 0.2));       // 눈
    const ear = part('cone', C.pink, s * 0.35, 4.35, 1.5, 0.4, 0.7, 0.4);
    ear.rotation.z = s * 0.2;
    body.add(ear);
    body.add(part('cyl', C.cream, s * 0.75, 0.9, 1.0, 0.45, 1.9, 0.45));   // 앞다리
    body.add(part('cyl', C.cream, s * 0.75, 0.9, -1.1, 0.45, 1.9, 0.45));  // 뒷다리
  }
  for (let i = 0; i < 6; i++) {                                       // 갈기
    body.add(part('ball', C.pink, 0, 4.1 - i * 0.32, 1.4 - i * 0.28, 0.6));
  }
  body.add(part('ball', C.pink, 0, 2.2, -1.7, 0.55, 1.2, 0.55));      // 꼬리
  body.add(part('box', C.red, 0, 2.35, 0.1, 1.9, 0.4, 2.2));          // 안장 (윗면 2.55)
  g.add(body);

  for (const s of [-1, 1]) {                                          // 흔들 받침
    g.add(part('box', C.wood, s * 1.0, 0.2, 0, 0.35, 0.4, 5.6));
  }
  g.userData.tick = (t) => { g.rotation.x = Math.sin(t * 1.8) * 0.13; };
  return g;
}
