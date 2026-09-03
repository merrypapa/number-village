// ===========================================================
//  🛠 아빠성(뚝딱 공작소)에 놓을 물건들 — 작업대·공구벽·기차·로봇·모닥불
//
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 src/dad-castle.js가 정한다.
//  ★ 움직이는 물건은 group.userData.tick = (t, dt) => {…} 에 적어둔다.
// ===========================================================
import * as THREE from 'three';
import { part, toon, glow } from './castle-props.js';
import { D } from './dad-layout.js';

// -----------------------------------------------------------
//  🔨 작업대 — 위에 망치·톱·나사가 놓여 있다
// -----------------------------------------------------------
export function makeWorkbench(len = 8) {
  const g = new THREE.Group();
  g.add(part('box', D.wood, 0, 1.5, 0, len, 0.4, 3.0));               // 상판
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(part('box', D.ironDark, sx * (len / 2 - 0.6), 0.75, sz * 1.2, 0.4, 1.5, 0.4));
  }
  g.add(part('box', D.woodDark, 0, 0.6, 0, len - 1.4, 0.3, 2.2));     // 아래 선반
  // 바이스(만력) — 상판 끝에 물려 있다
  g.add(part('box', D.iron, -len / 2 + 0.8, 1.95, 1.2, 1.4, 0.7, 1.0));
  g.add(part('cyl', D.ironDark, -len / 2 + 0.8, 1.95, 2.0, 0.3, 1.2, 0.3));
  // 망치
  g.add(part('cyl', D.wood, 1.4, 1.8, -0.4, 0.24, 1.8, 0.24));
  g.add(part('box', D.ironDark, 1.4, 2.7, -0.4, 1.2, 0.6, 0.6));
  // 나사와 못
  for (let i = 0; i < 6; i++) {
    g.add(part('cyl', D.iron, -2 + i * 0.6, 1.78, 0.8, 0.16, 0.16, 0.16));
  }
  return g;
}

// -----------------------------------------------------------
//  🧰 공구벽 — 벽에 거는 판. 톱·렌치·드라이버가 걸려 있다
// -----------------------------------------------------------
export function makeToolWall(w = 10, h = 5) {
  const g = new THREE.Group();
  g.add(part('box', D.plank, 0, 0, 0, w, h, 0.3));
  // 구멍 무늬
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
    const dot = part('cyl', D.woodDark, -w / 2 + 1 + i * (w - 2) / 7, h / 2 - 0.8 - j * 1.1,
                     0.18, 0.18, 0.1, 0.18);
    dot.rotation.x = Math.PI / 2;
    dot.castShadow = false;
    g.add(dot);
  }
  // 톱
  g.add(part('box', D.iron, -w / 2 + 2.2, 1.2, 0.35, 3.6, 1.0, 0.16));
  g.add(part('box', D.red, -w / 2 + 0.6, 1.2, 0.4, 1.0, 0.6, 0.4));
  // 렌치 세 개
  for (let i = 0; i < 3; i++) {
    g.add(part('box', D.iron, 0.5 + i * 1.3, 1.0, 0.35, 0.35, 2.2, 0.16));
    g.add(part('box', D.iron, 0.5 + i * 1.3, 2.1, 0.35, 0.8, 0.5, 0.16));
  }
  // 드라이버 네 개
  for (let i = 0; i < 4; i++) {
    g.add(part('cyl', D.yellow, -2.6 + i * 1.0, -1.3, 0.35, 0.34, 1.0, 0.34));
    g.add(part('cyl', D.iron, -2.6 + i * 1.0, -2.2, 0.35, 0.16, 1.0, 0.16));
  }
  return g;
}

// -----------------------------------------------------------
//  🚂 미니 기차 — 앞칸(기관차) + 객차. 아이가 탄다
// -----------------------------------------------------------
export function makeTrain() {
  const g = new THREE.Group();
  // 기관차
  g.add(part('box', D.red, 0, 1.3, -1.2, 3.0, 1.8, 4.6));
  g.add(part('cyl', D.red, 0, 2.4, -2.6, 2.0, 2.2, 2.0));           // 보일러
  g.add(part('cyl', D.ironDark, 0, 3.9, -3.4, 1.0, 1.6, 1.0));      // 굴뚝
  g.add(part('box', D.cream, 0, 3.0, -0.2, 2.6, 1.8, 1.8));         // 운전실
  g.add(part('ball', D.yellow, 0, 2.5, -4.4, 0.8, 0.8, 0.6, glow(D.yellow)));  // 전조등
  // 객차 (뒤에 붙어 있다 — 여기 앉는다)
  g.add(part('box', D.yellow, 0, 1.2, 2.6, 3.0, 1.4, 3.6));
  g.add(part('box', D.woodDark, 0, 2.1, 3.9, 3.0, 1.4, 0.4));       // 등받이
  g.add(part('box', D.ironDark, 0, 0.5, 1.0, 0.6, 0.4, 1.6));       // 연결기
  // 바퀴
  for (const sx of [-1, 1]) for (const sz of [-2.8, -0.6, 2.0, 3.6]) {
    const w = part('cyl', D.ironDark, sx * 1.6, 0.55, sz, 1.1, 0.4, 1.1);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  return g;
}

/** 🛤 기차 레일 — 동그랗게 놓인 선로 */
export function makeRailLoop(r = 12) {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.RingGeometry(r - 2.4, r + 2.4, 44), toon(0xbfae94));
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = 0.04;
  bed.receiveShadow = true;
  g.add(bed);
  // 침목
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    //  ★ 침목은 바퀴 방향과 **직각**으로 놓여야 한다.
    //    -a로 돌리면 오히려 레일을 따라 길게 누워서 그냥 갈색 띠로 보인다
    const s = part('box', D.woodDark, Math.cos(a) * r, 0.12, Math.sin(a) * r, 1.0, 0.24, 4.2);
    s.rotation.y = Math.PI / 2 - a;
    s.castShadow = false;
    g.add(s);
  }
  // 레일 두 줄
  for (const off of [-1.5, 1.5]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(r + off, 0.16, 6, 60), toon(D.iron));
    rail.rotation.x = -Math.PI / 2;
    rail.position.y = 0.3;
    rail.castShadow = false;
    g.add(rail);
  }
  return g;
}

// -----------------------------------------------------------
//  🤖 로봇 친구 — 아빠가 만든 깡통 로봇 (고개를 두리번거린다)
// -----------------------------------------------------------
export function makeRobot(color = D.sky) {
  const g = new THREE.Group();
  g.add(part('box', D.ironDark, 0, 0.25, 0, 3.0, 0.5, 2.4));         // 받침
  g.add(part('box', color, 0, 2.2, 0, 2.6, 3.4, 2.0));               // 몸통
  g.add(part('box', D.iron, 0, 2.6, 1.05, 1.6, 1.0, 0.2));           // 가슴판
  for (const [dx, c] of [[-0.4, D.red], [0.4, D.green]]) {
    g.add(part('ball', c, dx, 2.6, 1.2, 0.34, 0.34, 0.2, glow(c)));  // 불빛 단추
  }
  const head = new THREE.Group();
  head.add(part('box', D.cream, 0, 0, 0, 2.0, 1.6, 1.6));
  head.add(part('ball', 0x2b2340, -0.45, 0.15, 0.85, 0.4));
  head.add(part('ball', 0x2b2340, 0.45, 0.15, 0.85, 0.4));
  head.add(part('box', D.iron, 0, -0.5, 0.85, 1.2, 0.2, 0.2));       // 입
  head.add(part('cyl', D.iron, 0, 1.0, 0, 0.16, 0.9, 0.16));         // 안테나
  head.add(part('ball', D.red, 0, 1.5, 0, 0.4, 0.4, 0.4, glow(D.red)));
  head.position.set(0, 4.6, 0);
  g.add(head);
  for (const sx of [-1, 1]) {                                        // 팔
    g.add(part('cyl', D.iron, sx * 1.7, 2.4, 0, 0.5, 2.6, 0.5));
    g.add(part('ball', color, sx * 1.7, 1.0, 0, 0.7));
  }
  g.userData.tick = (t) => { head.rotation.y = Math.sin(t * 0.8) * 0.6; };
  return g;
}

// -----------------------------------------------------------
//  🔥 모닥불 — 장작 위에 불꽃이 일렁인다
// -----------------------------------------------------------
export function makeCampfire() {
  const g = new THREE.Group();
  // 돌 둘레
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.add(part('ball', 0xb9b2a8, Math.cos(a) * 2.2, 0.25, Math.sin(a) * 2.2, 0.9, 0.7, 0.9));
  }
  // 장작
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    const log = part('cyl', D.woodDark, 0, 0.5, 0, 0.5, 3.0, 0.5);
    log.rotation.z = Math.PI / 2 - 0.3;
    log.rotation.y = a;
    g.add(log);
  }
  // 불꽃 (세 겹) — 크기가 일렁일렁 커졌다 작아졌다 한다
  const flames = [];
  for (const [c, w, h, y] of [[0xff7a4a, 2.2, 2.0, 1.0],
                              [0xffa733, 1.6, 2.6, 1.4],
                              [0xffd93d, 1.0, 2.2, 1.9]]) {
    const f = part('cone', c, 0, y, 0, w, h, w, glow(c));
    f.userData.noShadow = true;
    f.castShadow = false;
    g.add(f);
    flames.push({ m: f, h });
  }
  const light = new THREE.PointLight(0xffa040, 1.4, 18, 2);
  light.position.y = 1.6;
  g.add(light);
  g.userData.tick = (t) => {
    flames.forEach((f, i) => {
      f.m.scale.y = f.h * (1 + Math.sin(t * 6 + i * 2) * 0.16);
      f.m.rotation.y = t * (1 + i * 0.5);
    });
    light.intensity = 1.4 + Math.sin(t * 7) * 0.3;
  };
  return g;
}

// -----------------------------------------------------------
//  🪑 접이식 캠핑 의자
// -----------------------------------------------------------
export function makeCampChair(color = D.green) {
  const g = new THREE.Group();
  g.add(part('box', color, 0, 1.05, 0, 2.4, 0.22, 2.2));             // 앉는 천
  g.add(part('box', color, 0, 1.9, -1.0, 2.4, 1.8, 0.22));           // 등받이
  for (const sx of [-1, 1]) {
    const a = part('cyl', D.iron, sx * 1.1, 0.55, 0.7, 0.24, 1.5, 0.24);
    a.rotation.x = 0.3;
    g.add(a);
    const b = part('cyl', D.iron, sx * 1.1, 0.55, -0.8, 0.24, 1.6, 0.24);
    b.rotation.x = -0.3;
    g.add(b);
    g.add(part('cyl', D.ironDark, sx * 1.1, 1.35, 0.4, 0.2, 1.0, 0.2));   // 팔걸이
  }
  return g;
}

// -----------------------------------------------------------
//  🏮 등불 — 나무 기둥에 걸린 캠핑 랜턴
// -----------------------------------------------------------
export function makeLantern(color = 0xffd48a) {
  const g = new THREE.Group();
  g.add(part('cyl', D.wood, 0, 2.0, 0, 0.4, 4.0, 0.4));
  g.add(part('box', D.wood, 0.5, 3.9, 0, 1.4, 0.24, 0.24));
  g.add(part('box', D.ironDark, 1.1, 3.4, 0, 0.7, 0.9, 0.7));
  const bulb = part('ball', color, 1.1, 3.0, 0, 0.9, 1.0, 0.9, glow(color));
  bulb.userData.noShadow = true;
  g.add(bulb);
  g.userData.tick = (t) => { bulb.scale.setScalar(0.9 + Math.sin(t * 3) * 0.06); };
  return g;
}

// -----------------------------------------------------------
//  📦 나무 상자 (쌓아두면 창고 느낌)
// -----------------------------------------------------------
export function makeCrate(s = 2.4) {
  const g = new THREE.Group();
  g.add(part('box', D.wood, 0, s / 2, 0, s, s, s));
  for (const sz of [-1, 1]) {
    g.add(part('box', D.woodDark, 0, s / 2, sz * s / 2, s * 1.02, 0.3, 0.1));
    g.add(part('box', D.woodDark, 0, s * 0.9, sz * s / 2, s * 1.02, 0.3, 0.1));
  }
  return g;
}

// -----------------------------------------------------------
//  🚙 자동차 리프트 — 아빠가 차를 고치는 곳
// -----------------------------------------------------------
export function makeCarLift() {
  const g = new THREE.Group();
  g.add(part('box', D.ironDark, 0, 0.2, 0, 8.0, 0.4, 5.0));
  g.add(part('cyl', D.iron, 0, 1.4, 0, 1.4, 2.4, 1.4));              // 기둥
  g.add(part('box', D.iron, 0, 2.6, 0, 7.0, 0.5, 3.4));              // 받침판
  // 올라가 있는 자동차
  const car = new THREE.Group();
  car.add(part('box', D.sky, 0, 1.0, 0, 3.4, 1.2, 6.0));
  car.add(part('box', D.cream, 0, 2.0, -0.4, 3.0, 1.0, 3.0));
  for (const sx of [-1, 1]) for (const sz of [-1.9, 1.9]) {
    const w = part('cyl', 0x3a3540, sx * 1.7, 0.6, sz, 1.2, 0.5, 1.2);
    w.rotation.z = Math.PI / 2;
    car.add(w);
  }
  car.position.y = 3.0;
  g.add(car);
  g.userData.tick = (t) => { car.position.y = 3.0 + Math.sin(t * 0.5) * 0.25; };
  return g;
}
