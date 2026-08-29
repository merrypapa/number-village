// ===========================================================
//  하늘 — 흘러가는 구름과 하늘을 헤엄치는 고래
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  아이가 바꿔볼 수 있는 값들
// -----------------------------------------------------------
const CLOUD_COUNT   = 14;      // 구름 개수
const CLOUD_SPEED   = 0.008;   // 구름이 도는 속도

const WHALE_COUNT   = 3;       // 하늘 고래 마리 수
const WHALE_COLORS  = [0x8fd0ff, 0xc3b1f5, 0xffb3d9];  // 고래 색깔
const WHALE_SIZE    = 2.2;     // 고래 크기
const WHALE_HEIGHT  = 22;      // 고래가 나는 높이 (높이면 화면 위로 벗어난다)
const WHALE_RADIUS  = 105;     // 고래가 마을을 도는 거리
const WHALE_SPEED   = 0.05;    // 고래가 마을을 도는 속도

// -----------------------------------------------------------
//  공용 지오메트리/머티리얼 (성능: 새로 만들지 않고 나눠 쓴다)
// -----------------------------------------------------------
const G = {
  ball: new THREE.SphereGeometry(0.5, 16, 12),
};
const M_WHITE = new THREE.MeshToonMaterial({ color: 0xffffff });
const M_EYE   = new THREE.MeshToonMaterial({ color: 0x2b2140 });
const M_BELLY = new THREE.MeshToonMaterial({ color: 0xf2fbff });
const M_CLOUD = new THREE.MeshBasicMaterial({ color: 0xffffff });

const _matCache = new Map();
function toonMat(color) {
  if (!_matCache.has(color)) _matCache.set(color, new THREE.MeshToonMaterial({ color }));
  return _matCache.get(color);
}

function ball(mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(G.ball, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  return m;
}

// -----------------------------------------------------------
//  고래 한 마리 (머리가 +z 방향을 본다)
// -----------------------------------------------------------
function makeWhale(color) {
  const g = new THREE.Group();
  const mat = toonMat(color);

  g.add(ball(mat, 0, 0, 0, 4.4, 3.6, 9));            // 몸통
  g.add(ball(M_BELLY, 0, -0.7, 0.2, 3.7, 2.4, 8));   // 하얀 배

  // 꼬리지느러미 (뒤쪽)
  for (const s of [-1, 1]) {
    const fin = ball(mat, s * 1.5, 0.5, -5.2, 3.2, 0.5, 2.4);
    fin.rotation.z = s * 0.5;
    g.add(fin);
  }
  // 가슴지느러미 (양옆)
  for (const s of [-1, 1]) {
    const fin = ball(mat, s * 2.1, -0.5, 1.2, 2.8, 0.45, 1.8);
    fin.rotation.z = -s * 0.35;
    g.add(fin);
    g.add(ball(M_EYE, s * 1.6, 0.4, 3.4, 0.42));     // 눈
  }
  // 입 (살짝 웃는 선처럼 납작한 공)
  g.add(ball(M_BELLY, 0, -0.9, 4.0, 1.6, 0.3, 0.6));

  // 머리 위로 뿜는 물줄기
  const spout = new THREE.Group();
  spout.position.set(0, 1.7, 2.2);
  for (let i = 0; i < 3; i++) {
    spout.add(ball(M_WHITE, (i - 1) * 0.5, 0.9 + i * 0.9, 0, 0.9 - i * 0.15));
  }
  g.add(spout);
  g.userData.spout = spout;

  g.scale.setScalar(WHALE_SIZE);
  return g;
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/** 하늘(구름 + 고래)을 만들어 씬에 넣는다. update(dt, t)로 움직인다. */
export function buildSky(scene) {
  // --- 구름 ---
  const clouds = new THREE.Group();
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      c.add(ball(M_CLOUD, j * 4 - 4, Math.random() * 1.5, 0, 5 + Math.random() * 3));
    }
    c.position.set((Math.random() - 0.5) * 220, 40 + Math.random() * 20, (Math.random() - 0.5) * 220);
    clouds.add(c);
  }
  scene.add(clouds);

  // --- 고래 ---
  const whales = [];
  for (let i = 0; i < WHALE_COUNT; i++) {
    const model = makeWhale(WHALE_COLORS[i % WHALE_COLORS.length]);
    scene.add(model);
    whales.push({
      model,
      // 마리마다 조금씩 다른 거리·높이·속도로 돈다.
      // 높이와 거리의 비율은 비슷하게 유지해야 화면 위로 벗어나지 않는다.
      radius: WHALE_RADIUS + i * 15,
      height: WHALE_HEIGHT + i * 3,
      angle: (i / WHALE_COUNT) * Math.PI * 2,    // 지금 어디쯤 있는지
      speed: WHALE_SPEED * (1 - i * 0.15),
      phase: i * 2.1,
    });
  }

  function update(dt, t) {
    clouds.rotation.y += dt * CLOUD_SPEED;

    for (const w of whales) {
      w.angle += w.speed * dt;
      const a = w.angle;
      w.model.position.set(
        Math.cos(a) * w.radius,
        w.height + Math.sin(t * 0.5 + w.phase) * 2.5,   // 위아래로 둥실둥실
        Math.sin(a) * w.radius
      );
      // 나아가는 방향을 바라본다
      w.model.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
      w.model.rotation.z = Math.sin(t * 0.5 + w.phase) * 0.12;  // 살짝 기우뚱
      // 물줄기가 뿜었다 줄었다
      const s = 0.7 + Math.abs(Math.sin(t * 0.8 + w.phase)) * 0.6;
      w.model.userData.spout.scale.set(s, s, s);
    }
  }

  return { update };
}
