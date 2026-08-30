// ===========================================================
//  오프닝 화면에 나오는 "크고 아름다운 성"
//  마을에 있는 작은 성(world.js)과 달리, 이 성은 사진 찍히는 게 일이라서
//  탑도 많고 무지개 다리·풍선·반짝이까지 잔뜩 달려 있다.
//  ※ 게임 안으로 들어가는 성이 아니라 표지 그림용이다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 (색만 바꿔도 완전히 다른 성이 된다)
// -----------------------------------------------------------
const WALL_COLOR  = 0xfff6fb;   // 성벽 색
const ROOF_MAIN   = 0xff9ec4;   // 가운데 큰 지붕 색
const ROOF_SIDE   = 0x8fd0ff;   // 앞 탑 지붕 색
const ROOF_TALL   = 0xc3b1f5;   // 뒤 높은 탑 지붕 색
const GOLD        = 0xffd93d;   // 금색 장식
const FLAG_COLORS = [0xff5a5a, 0x63c8ff, 0xffd93d, 0x6ddf6d, 0xb072ff, 0xff7ec4];
const RAINBOW     = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc];
const BALLOON_COLORS = [0xff8fc0, 0x8fd0ff, 0xffd93d, 0xa0f0c8, 0xc3b1f5];

const SPARKLE_COUNT = 90;       // 하늘에 떠다니는 반짝이 개수

// -----------------------------------------------------------
//  공용 도형·재질 (성능: 만들어 놓고 나눠 쓴다)
// -----------------------------------------------------------
const G = {
  box:  new THREE.BoxGeometry(1, 1, 1),
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  cone: new THREE.ConeGeometry(0.5, 1, 20),
  ball: new THREE.SphereGeometry(0.5, 16, 12),
  half: new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1, false, 0, Math.PI), // 반달 창문
};

const _mats = new Map();
function toon(color) {
  if (!_mats.has(color)) _mats.set(color, new THREE.MeshToonMaterial({ color }));
  return _mats.get(color);
}

function mesh(geo, color, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, toon(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// -----------------------------------------------------------
//  탑 한 채 — 기둥 + 원뿔 지붕 + 깃대 + 깃발
//  깃발은 나중에 흔들리게 update가 잡아준다.
// -----------------------------------------------------------
function makeTower(g, flags, { x, z, r, h, roof, flag }) {
  const base = 2.4;                                  // 성 받침 높이
  g.add(mesh(G.cyl, WALL_COLOR, x, base + h / 2, z, r * 2, h, r * 2));
  g.add(mesh(G.cyl, GOLD,       x, base + h,     z, r * 2.3, 0.5, r * 2.3));  // 지붕 밑 금테
  g.add(mesh(G.cone, roof,      x, base + h + 3.6, z, r * 2.7, 7.2, r * 2.7));
  g.add(mesh(G.ball, GOLD,      x, base + h + 7.6, z, 0.8));                  // 지붕 꼭대기 구슬
  g.add(mesh(G.cyl, WALL_COLOR, x, base + h + 9.4, z, 0.22, 3.2, 0.22));      // 깃대

  const f = mesh(G.box, flag, x + 1.0, base + h + 10.6, z, 2.0, 1.2, 0.12);
  g.add(f);
  flags.push({ mesh: f, x0: x, phase: Math.random() * 6 });

  // 탑 창문 두 개
  for (let i = 0; i < 2; i++) {
    const wy = base + h * (0.45 + i * 0.3);
    addWindow(g, x, wy, z + r + 0.02, 0.75);
  }
}

// -----------------------------------------------------------
//  아치창 하나 — 금테를 두른 하늘색 창문
// -----------------------------------------------------------
function addWindow(g, x, y, z, s = 1) {
  g.add(mesh(G.box,  GOLD,     x, y, z, 1.9 * s, 3.4 * s, 0.18));
  g.add(mesh(G.ball, GOLD,     x, y + 1.7 * s, z, 1.9 * s, 1.9 * s, 0.36));
  g.add(mesh(G.box,  0x9fdcff, x, y, z + 0.12, 1.35 * s, 3.0 * s, 0.12));
  g.add(mesh(G.ball, 0x9fdcff, x, y + 1.55 * s, z + 0.12, 1.35 * s, 1.35 * s, 0.24));
}

// -----------------------------------------------------------
//  무지개 다리 — 성 앞에 걸린 반원 무지개
// -----------------------------------------------------------
function makeRainbow(z, radius) {
  const g = new THREE.Group();
  for (let i = 0; i < RAINBOW.length; i++) {
    const r = radius - i * 2.0;
    const geo = new THREE.TorusGeometry(r, 1.0, 8, 44, Math.PI);
    const m = new THREE.Mesh(geo, toon(RAINBOW[i]));
    m.position.set(0, 0, z - i * 0.02);
    g.add(m);
  }
  return g;
}

// -----------------------------------------------------------
//  풍선 다발 — 둥실둥실 떠 있다
// -----------------------------------------------------------
function makeBalloons(x, z, count = 5) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  // 풍선을 묶어 놓은 말뚝
  g.add(mesh(G.cyl, 0xb5794f, 0, 1.3, 0, 0.4, 2.6, 0.4));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const bx = Math.cos(a) * 1.3, bz = Math.sin(a) * 1.3;
    const y = 6.5 + Math.random() * 2.5;
    const b = mesh(G.ball, BALLOON_COLORS[i % BALLOON_COLORS.length], bx, y, bz, 1.5, 1.8, 1.5);
    b.castShadow = false;
    g.add(b);
    const str = mesh(G.cyl, 0xfff3f8, bx * 0.7, (y + 2.6) / 2, bz * 0.7, 0.05, y - 2.6, 0.05);
    str.castShadow = false;
    g.add(str);
  }
  return g;
}

// -----------------------------------------------------------
//  하늘에 떠다니는 반짝이 (점 하나하나가 작은 별)
// -----------------------------------------------------------
function makeSparkles() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  const grd = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.35, '#fff6b0');
  grd.addColorStop(1, '#fff6b000');
  c.fillStyle = grd;
  c.fillRect(0, 0, 64, 64);

  const pos = new Float32Array(SPARKLE_COUNT * 3);
  const speed = new Float32Array(SPARKLE_COUNT);
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = Math.random() * 34;
    pos[i * 3 + 2] = -10 + Math.random() * 46;
    speed[i] = 1.2 + Math.random() * 2.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.8, map: new THREE.CanvasTexture(cv), transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));

  points.userData.update = (dt) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      p[i * 3 + 1] += speed[i] * dt;
      if (p[i * 3 + 1] > 34) p[i * 3 + 1] = 0;      // 위로 올라가면 다시 아래에서
    }
    geo.attributes.position.needsUpdate = true;
  };
  return points;
}

// -----------------------------------------------------------
//  공개 API — 성 + 정원 + 무지개 + 풍선을 통째로 만든다
// -----------------------------------------------------------
export function buildTitleCastle() {
  const g = new THREE.Group();
  const flags = [];
  const base = 2.4;               // 받침 위 = 성이 서는 바닥 높이

  // --- 받침(계단 2단) ---
  g.add(mesh(G.box, 0xf3e0c0, 0, 0.6, 0, 44, 1.2, 30));
  g.add(mesh(G.box, WALL_COLOR, 0, 1.8, 0, 38, 1.2, 25));

  // --- 본채 ---
  g.add(mesh(G.box, WALL_COLOR, 0, base + 7, 0, 18, 14, 13));
  g.add(mesh(G.box, GOLD,       0, base + 14.2, 0, 19, 0.7, 14));      // 처마 금테
  // 성벽 위 톱니(총안) — 성처럼 보이게 하는 결정적인 장식
  for (let i = 0; i < 7; i++) {
    g.add(mesh(G.box, WALL_COLOR, (i - 3) * 2.6, base + 15.4, 6.4, 1.6, 1.8, 1.0));
  }
  const roof = mesh(G.cone, ROOF_MAIN, 0, base + 18.4, -0.5, 15, 8.5, 11);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // --- 가운데 뾰족탑 (제일 높은 곳) ---
  g.add(mesh(G.cyl, WALL_COLOR, 0, base + 22, 0, 3.4, 4.5, 3.4));
  g.add(mesh(G.cone, ROOF_MAIN, 0, base + 27, 0, 4.6, 6.5, 4.6));
  g.add(mesh(G.ball, GOLD,      0, base + 30.6, 0, 1.2));
  // 꼭대기 별 (원뿔 두 개를 위아래로 붙여서 다이아몬드처럼)
  const star = mesh(G.cone, GOLD, 0, base + 32.4, 0, 2.0, 2.2, 2.0);
  g.add(star);
  const star2 = mesh(G.cone, GOLD, 0, base + 31.1, 0, 2.0, 2.2, 2.0);
  star2.rotation.z = Math.PI;
  g.add(star2);

  // --- 정문(아치) + 계단 ---
  g.add(mesh(G.box, 0xffe9f3, 0, base + 4.2, 6.7, 8, 9.4, 0.6));        // 문을 감싼 흰 테두리
  g.add(mesh(G.box, 0xb5794f, 0, base + 3.2, 7.0, 5.4, 6.6, 0.5));      // 문짝
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.6, 8, 24, Math.PI), toon(GOLD));
  arch.position.set(0, base + 6.5, 7.1);
  g.add(arch);
  for (const sx of [-1, 1]) g.add(mesh(G.ball, GOLD, sx * 2.6, base + 2, 7.2, 0.8));
  // 계단 3단
  for (let i = 0; i < 3; i++) {
    g.add(mesh(G.box, 0xfff1f6, 0, base - 0.4 - i * 0.8, 8.6 + i * 1.6, 11 + i * 1.6, 0.8, 2.0));
  }
  g.add(mesh(G.box, 0xff9ec4, 0, 0.1, 18, 6.5, 0.2, 18));               // 분홍 융단

  // --- 본채 창문 (문 양옆에 2개씩) + 문 위 둥근 창 ---
  for (const sx of [-1, 1]) {
    addWindow(g, sx * 4.2, base + 5.4, 6.6);
    addWindow(g, sx * 7.4, base + 5.4, 6.6, 0.8);
    addWindow(g, sx * 4.2, base + 11, 6.6, 0.8);
  }
  g.add(mesh(G.ball, GOLD,     0, base + 11.4, 6.6, 3.4, 3.4, 0.4));    // 둥근 창(금테)
  g.add(mesh(G.ball, 0x9fdcff, 0, base + 11.4, 6.8, 2.7, 2.7, 0.4));

  // --- 하트 세 개 (문 위) ---
  for (let i = 0; i < 3; i++) {
    g.add(mesh(G.ball, 0xff5a86, (i - 1) * 2.6, base + 8.6 - Math.abs(i - 1) * 0.9, 7.4, 1.0));
  }

  // --- 탑 6채 (앞 2 · 옆 2 · 뒤 2) ---
  makeTower(g, flags, { x: -13.0, z:  7.0, r: 3.2, h: 18, roof: ROOF_SIDE, flag: FLAG_COLORS[0] });
  makeTower(g, flags, { x:  13.0, z:  7.0, r: 3.2, h: 18, roof: ROOF_SIDE, flag: FLAG_COLORS[1] });
  makeTower(g, flags, { x: -17.0, z: -4.0, r: 3.8, h: 25, roof: ROOF_TALL, flag: FLAG_COLORS[2] });
  makeTower(g, flags, { x:  17.0, z: -4.0, r: 3.8, h: 25, roof: ROOF_TALL, flag: FLAG_COLORS[3] });
  makeTower(g, flags, { x:  -9.5, z: -10.0, r: 2.8, h: 21, roof: ROOF_SIDE, flag: FLAG_COLORS[4] });
  makeTower(g, flags, { x:   9.5, z: -10.0, r: 2.8, h: 21, roof: ROOF_SIDE, flag: FLAG_COLORS[5] });

  // --- 무지개 (성 뒤에 크게 걸린다) ---
  g.add(makeRainbow(-34, 42));

  // --- 풍선 다발 ---
  const balloons = [makeBalloons(-24, 12), makeBalloons(24, 12)];
  for (const b of balloons) g.add(b);

  // --- 반짝이 ---
  const sparkles = makeSparkles();
  g.add(sparkles);

  /** 매 프레임 — 깃발이 펄럭이고 풍선이 둥실거리고 반짝이가 올라간다 */
  function update(dt, t) {
    for (const f of flags) {
      f.mesh.rotation.y = Math.sin(t * 2.5 + f.phase) * 0.5;
      f.mesh.position.x = f.x0 + 1.0 + Math.sin(t * 2.5 + f.phase) * 0.15;
    }
    for (let i = 0; i < balloons.length; i++) {
      balloons[i].position.y = Math.sin(t * 0.9 + i * 1.7) * 0.7;
      balloons[i].rotation.y = Math.sin(t * 0.5 + i) * 0.25;
    }
    sparkles.userData.update(dt);
  }

  return { group: g, update };
}
