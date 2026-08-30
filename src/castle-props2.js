// ===========================================================
//  🏰 성 안 물건 2 — 2층과 새 방에 놓을 것들
//    (1층 물건은 castle-props.js에 있다. 한 파일이 너무 길어져서 나눴다)
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 castle-interior.js가 정한다.
//  ★ 움직이는 물건은 group.userData.tick = (t) => {…} 에 적어둔다.
// ===========================================================
import * as THREE from 'three';
import { C, part, glow, toon, canvasTex, makeHeart } from './castle-props.js';

// -----------------------------------------------------------
//  👑 왕관 — 왕좌에 앉으면 머리 위로 내려온다
// -----------------------------------------------------------
export function makeCrown(s = 1) {
  const g = new THREE.Group();
  g.add(part('cyl', C.gold, 0, 0, 0, 1.5 * s, 0.5 * s, 1.5 * s));       // 테
  g.add(part('cyl', C.red,  0, 0.28 * s, 0, 1.55 * s, 0.16 * s, 1.55 * s));
  for (let i = 0; i < 5; i++) {                                        // 뾰족한 산 5개
    const a = (i / 5) * Math.PI * 2;
    const x = Math.cos(a) * 0.62 * s, z = Math.sin(a) * 0.62 * s;
    g.add(part('cone', C.gold, x, 0.55 * s, z, 0.5 * s, 1.0 * s, 0.5 * s));
    g.add(part('ball', C.pink, x, 1.05 * s, z, 0.3 * s));
  }
  g.add(part('ball', 0x8fd0ff, 0, 0.15 * s, 0.76 * s, 0.38 * s));      // 앞쪽 보석
  return g;
}

// -----------------------------------------------------------
//  🛏 공주 침대 — 기둥 네 개에 하늘하늘한 천이 덮인 침대
// -----------------------------------------------------------
export function makeBed() {
  const g = new THREE.Group();
  g.add(part('box', C.wood,  0, 0.5, 0, 6.4, 1.0, 8.4));          // 침대 틀
  g.add(part('box', C.cream, 0, 1.25, 0, 6.0, 0.6, 8.0));         // 매트리스
  const quilt = part('box', C.pink, 0, 1.6, 0.7, 6.1, 0.3, 6.4);  // 이불 (베개 쪽까지 덮는다)
  g.add(quilt);
  for (const s of [-1, 1]) {
    g.add(part('box', C.cream, s * 1.5, 1.75, -2.9, 2.4, 0.5, 1.6));   // 베개
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {           // 기둥 네 개
    g.add(part('cyl', C.goldDark, sx * 2.9, 3.0, sz * 3.9, 0.5, 6.0, 0.5));
    g.add(part('ball', C.gold, sx * 2.9, 6.2, sz * 3.9, 0.7));
  }
  g.add(part('box', C.violet, 0, 6.2, 0, 6.6, 0.4, 8.6));         // 지붕 천
  for (const sx of [-1, 1]) {                                     // 늘어진 커튼
    g.add(part('box', C.pink, sx * 3.0, 4.4, -3.0, 0.3, 3.4, 1.6));
  }
  const heart = makeHeart(C.red, 0.9);
  heart.position.set(0, 6.9, 0);
  g.add(heart);
  g.userData.quilt = quilt;      // 잠잘 때 이불을 끌어올린다 (castle-rides.js)
  return g;
}

// -----------------------------------------------------------
//  📖 책상과 의자 — 앉아서 공부한다
//     +z 쪽에 의자가 있다. 앉으면 책상(-z)을 바라본다.
//     의자 방석 높이 = CHAIR_Y, 의자 자리 = 책상에서 +z로 CHAIR_Z
// -----------------------------------------------------------
export const CHAIR_Y = 1.15;
export const CHAIR_Z = 1.9;

export function makeDesk() {
  const g = new THREE.Group();

  // 책상
  g.add(part('box', C.wood, 0, 1.5, 0, 5.2, 0.3, 2.6));            // 상판
  g.add(part('box', C.woodDark, 0, 1.62, 0, 5.4, 0.1, 2.8));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('cyl', C.woodDark, sx * 2.2, 0.68, sz * 0.95, 0.34, 1.35, 0.34));
  }
  g.add(part('box', C.wood, 1.5, 1.05, 0, 1.9, 0.7, 2.2));         // 서랍
  g.add(part('ball', C.gold, 1.5, 1.05, 1.15, 0.28));              // 손잡이

  // 펼쳐진 공책 두 장
  for (const sx of [-1, 1]) {
    const page = part('box', C.cream, -0.7 + sx * 0.62, 1.68, 0.15, 1.2, 0.06, 1.5);
    page.rotation.z = sx * -0.06;
    g.add(page);
  }
  for (let i = 0; i < 3; i++) {                                    // 공책 줄
    g.add(part('box', 0xb9a4e8, -0.7, 1.72, -0.3 + i * 0.35, 2.2, 0.02, 0.06));
  }

  // 연필꽂이와 연필
  g.add(part('cyl', C.mint, 1.75, 1.95, -0.7, 0.7, 0.7, 0.7));
  const pencils = [0xffd45e, 0xff7a9c, 0x8fd0ff];
  for (let i = 0; i < 3; i++) {
    const pen = part('cyl', pencils[i], 1.75 + (i - 1) * 0.18, 2.5, -0.7, 0.14, 1.5, 0.14);
    pen.rotation.z = (i - 1) * 0.12;
    g.add(pen);
  }

  // 책상 램프 (공부할 때 밝아진다)
  g.add(part('cyl', C.goldDark, -1.9, 1.75, -0.8, 0.8, 0.2, 0.8));
  const pole = part('cyl', C.goldDark, -1.9, 2.4, -0.75, 0.16, 1.4, 0.16);
  pole.rotation.x = 0.2;
  g.add(pole);
  const shade = part('cone', C.mint, -1.9, 3.1, -0.55, 1.3, 1.0, 1.3);
  shade.rotation.x = Math.PI + 0.35;
  g.add(shade);
  const bulb = part('ball', 0xfff3c8, -1.9, 2.85, -0.45, 0.55, 0.45, 0.55, glow(0xfff3c8));
  bulb.castShadow = false;
  g.add(bulb);

  // 의자
  const chair = new THREE.Group();
  chair.position.z = CHAIR_Z;
  chair.add(part('box', C.pink, 0, CHAIR_Y - 0.1, 0, 2.0, 0.3, 1.9));   // 방석
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    chair.add(part('cyl', C.wood, sx * 0.75, 0.5, sz * 0.7, 0.3, 1.0, 0.3));
  }
  chair.add(part('box', C.wood, 0, 2.0, 0.9, 2.0, 2.0, 0.25));          // 등받이
  chair.add(part('ball', C.gold, 0, 3.05, 0.9, 0.45));
  g.add(chair);

  g.userData.bulb = bulb;     // 공부할 때 밝아진다 (castle-rides.js가 움직인다)
  return g;
}

// -----------------------------------------------------------
//  ✨ 두둥실 떠오르는 글자 (잠잘 때 Z, 공부할 때 숫자)
//     userData.play(t, 켤까?) 로 켜고 끈다
// -----------------------------------------------------------
export function makeFloaters(texts, color = '#fff6c0', size = 1.2) {
  const g = new THREE.Group();
  const items = [];
  for (let i = 0; i < texts.length; i++) {
    const tex = canvasTex(128, (ctx, s) => {
      ctx.font = 'bold 96px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(60,40,90,0.55)';
      ctx.strokeText(texts[i], s / 2, s / 2);
      ctx.fillStyle = color;
      ctx.fillText(texts[i], s / 2, s / 2);
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    sp.renderOrder = 12;
    g.add(sp);
    items.push(sp);
  }
  g.visible = false;

  g.userData.play = (t, on) => {
    g.visible = on;
    if (!on) return;
    for (let i = 0; i < items.length; i++) {
      const u = (t * 0.4 + i / items.length) % 1;          // 0 → 1을 되풀이
      items[i].position.set(Math.sin((u + i) * 2.6) * 0.6, u * 2.8, 0);
      items[i].material.opacity = Math.sin(u * Math.PI) * 0.95;
      const k = size * (0.55 + u * 0.8);
      items[i].scale.set(k, k, 1);
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🔭 별 보는 망원경 — 천천히 하늘을 훑는다
// -----------------------------------------------------------
export function makeTelescope() {
  const g = new THREE.Group();
  g.add(part('cyl', C.woodDark, 0, 0.15, 0, 3.2, 0.3, 3.2));      // 받침
  for (let i = 0; i < 3; i++) {                                   // 삼각대
    const a = (i / 3) * Math.PI * 2;
    const leg = part('cyl', C.woodDark, Math.cos(a) * 0.55, 1.2, Math.sin(a) * 0.55,
                     0.3, 2.4, 0.3);
    leg.rotation.z = -Math.cos(a) * 0.22;
    leg.rotation.x = Math.sin(a) * 0.22;
    g.add(leg);
  }
  g.add(part('ball', C.goldDark, 0, 2.4, 0, 1.0));

  const arm = new THREE.Group();                                  // 망원경 몸통
  arm.position.set(0, 2.5, 0);
  const tube = part('cyl', C.gold, 0, 0, 0, 0.7, 5.0, 0.7);
  tube.rotation.x = Math.PI / 2;
  arm.add(tube);
  arm.add(part('cyl', C.violet, 0, 0, 1.9, 1.05, 0.5, 1.05));
  arm.add(part('cyl', 0x8fd0ff, 0, 0, 2.2, 0.95, 0.12, 0.95));    // 렌즈
  arm.add(part('cyl', C.violet, 0, 0, -2.0, 0.6, 0.6, 0.6));
  arm.rotation.x = -0.5;
  g.add(arm);

  g.userData.tick = (t) => {
    arm.rotation.y = Math.sin(t * 0.25) * 0.6;
    arm.rotation.x = -0.5 + Math.sin(t * 0.17) * 0.15;
  };
  return g;
}

// -----------------------------------------------------------
//  💎 보물상자 — 뚜껑이 열려 있고 금화가 반짝인다
// -----------------------------------------------------------
export function makeTreasureChest(color = C.wood) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 0.9, 0, 3.4, 1.8, 2.4));
  g.add(part('box', C.gold, 0, 0.9, 0, 3.5, 0.3, 2.5));           // 금색 띠
  const lid = new THREE.Group();                                  // 뚜껑
  lid.position.set(0, 1.8, -1.2);
  lid.add(part('box', color, 0, 0.25, 1.2, 3.4, 0.5, 2.4));
  lid.add(part('box', C.gold, 0, 0.45, 1.2, 3.5, 0.2, 2.5));
  lid.rotation.x = -1.0;
  g.add(lid);

  const coins = [];
  for (let i = 0; i < 9; i++) {                                   // 넘치는 금화
    const c = part('cyl', C.gold, (Math.random() - 0.5) * 2.4, 1.85 + Math.random() * 0.5,
                   (Math.random() - 0.5) * 1.6, 0.55, 0.12, 0.55);
    c.rotation.x = Math.random();
    c.rotation.z = Math.random();
    g.add(c); coins.push(c);
  }
  g.userData.tick = (t) => {
    for (let i = 0; i < coins.length; i++) {
      coins[i].position.y = 1.85 + Math.abs(Math.sin(t * 1.2 + i)) * 0.18;
    }
  };
  return g;
}

/** 바닥에 쌓인 금화 더미 */
export function makeGoldPile() {
  const g = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 1.8;
    const c = part('cyl', i % 4 ? C.gold : C.pink, Math.cos(a) * r,
                   0.08 + Math.random() * 0.4, Math.sin(a) * r, 0.5, 0.12, 0.5);
    c.rotation.z = (Math.random() - 0.5) * 0.6;
    g.add(c);
  }
  return g;
}

// -----------------------------------------------------------
//  🕯 샹들리에 — 천장에 매달려 살랑살랑 흔들린다
// -----------------------------------------------------------
/** hangFrom = 천장 높이, y = 샹들리에가 걸릴 높이 (place로 y를 넣어준다) */
export function makeChandelier(hangFrom = 19, y = 11) {
  const g = new THREE.Group();
  g.add(part('cyl', C.goldDark, 0, (hangFrom - y) / 2, 0, 0.2, hangFrom - y, 0.2));
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.22, 8, 28), toon(C.gold)
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 2.6, z = Math.sin(a) * 2.6;
    g.add(part('cyl', C.cream, x, 0.6, z, 0.34, 1.2, 0.34));       // 초
    const f = part('cone', 0xffd45e, x, 1.5, z, 0.4, 0.8, 0.4, glow(0xffe9a8));
    f.castShadow = false;
    g.add(f);
    g.add(part('ball', 0xffffff, x * 0.7, -0.9, z * 0.7, 0.3));    // 유리 구슬
  }
  g.userData.tick = (t) => {
    g.rotation.z = Math.sin(t * 0.6) * 0.03;
    g.rotation.y = t * 0.08;
  };
  return g;
}

// -----------------------------------------------------------
//  🚩 벽에 거는 깃발 — 성마다 하나씩 있는 그것
// -----------------------------------------------------------
export function makeBanner(color = C.red) {
  const g = new THREE.Group();
  g.add(part('box', C.goldDark, 0, 0, 0, 3.2, 0.3, 0.3));         // 가로 막대
  g.add(part('box', color, 0, -2.6, 0, 2.6, 5.2, 0.15));          // 천
  const tip = part('cone', color, 0, -5.6, 0, 2.6, 1.2, 0.15);
  tip.rotation.x = Math.PI;
  g.add(tip);
  const heart = makeHeart(C.gold, 0.8);
  heart.position.set(0, -2.4, 0.15);
  g.add(heart);
  return g;
}

// -----------------------------------------------------------
//  🛡 갑옷 기사 — 방 앞을 지킨다 (움직이지 않는다)
// -----------------------------------------------------------
export function makeArmorStand() {
  const g = new THREE.Group();
  g.add(part('cyl', C.stone,  0, 0.2, 0, 2.0, 0.4, 2.0));
  g.add(part('box', 0xc9d4e6, 0, 1.9, 0, 1.9, 2.6, 1.2));         // 몸통
  g.add(part('ball', 0xc9d4e6, 0, 3.5, 0, 1.2, 1.3, 1.2));        // 투구
  g.add(part('box', 0x2b2438, 0, 3.5, 0.55, 0.9, 0.35, 0.2));     // 눈구멍
  g.add(part('cone', C.pink,  0, 4.4, 0, 0.5, 1.0, 0.5));         // 깃털 장식
  for (const s of [-1, 1]) {
    g.add(part('cyl', 0xc9d4e6, s * 1.2, 1.9, 0, 0.55, 2.2, 0.55));
  }
  g.add(part('cyl', C.goldDark, 1.5, 1.6, 0.4, 0.25, 3.4, 0.25)); // 창
  g.add(part('cone', 0xe6eef8, 1.5, 3.6, 0.4, 0.45, 0.9, 0.45));
  return g;
}

// -----------------------------------------------------------
//  🌟 별 지도 (벽에 거는 그림) + 방석
// -----------------------------------------------------------
export function makeStarMap() {
  const g = new THREE.Group();
  g.add(part('box', C.gold,   0, 0, -0.1, 5.7, 4.3, 0.1));      // 금색 액자 (뒤)
  g.add(part('box', 0x3b2a5e, 0, 0, 0.02, 5.4, 4.0, 0.2));      // 밤하늘 (앞)
  for (let i = 0; i < 16; i++) {                                // 별
    const s = part('oct', 0xfff0a8, (Math.random() - 0.5) * 4.6,
                   (Math.random() - 0.5) * 3.2, 0.18, 0.16 + Math.random() * 0.22);
    s.castShadow = false;
    g.add(s);
  }
  // 별자리를 잇는 선 세 개
  for (let i = 0; i < 3; i++) {
    const line = part('box', 0x8fd0ff, (i - 1) * 1.2, (i % 2 ? 0.6 : -0.7), 0.16,
                      2.0, 0.08, 0.05);
    line.rotation.z = i % 2 ? 0.5 : -0.4;
    line.castShadow = false;
    g.add(line);
  }
  return g;
}

export function makeCushion(color = C.pink) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 0.3, 0, 2.2, 0.6, 2.2));
  g.add(part('ball', C.gold, 0, 0.62, 0, 0.3));
  return g;
}

// -----------------------------------------------------------
//  🛝 성 안 미끄럼틀 — 2층 발코니에서 1층 홀로 슝!
//     +x 방향으로 내려간다. (0, top)에서 (length, bottom)까지.
// -----------------------------------------------------------
export function makeCastleSlide(length, top, bottom) {
  const g = new THREE.Group();
  const drop = top - bottom;
  const slope = Math.atan2(drop, length);
  const long = Math.hypot(length, drop);

  // 미끄럼판
  const board = part('box', 0x8fd0ff, length / 2, (top + bottom) / 2 + 0.2, 0,
                     long, 0.35, 3.4);
  board.rotation.z = -slope;
  g.add(board);
  // 양옆 턱
  for (const s of [-1, 1]) {
    const rail = part('box', C.violet, length / 2, (top + bottom) / 2 + 0.75, s * 1.75,
                      long, 0.9, 0.35);
    rail.rotation.z = -slope;
    g.add(rail);
  }
  // 받침 기둥
  for (let i = 1; i < 4; i++) {
    const u = i / 4;
    const h = top - drop * u;
    g.add(part('cyl', C.cream, length * u, h / 2, 0, 0.5, h, 0.5));
  }
  // 도착 지점 쿠션
  g.add(part('cyl', C.pink, length + 1.4, 0.35, 0, 5.0, 0.7, 5.0));
  return g;
}
