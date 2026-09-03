// ===========================================================
//  🌉 성과 성을 잇는 "길" 공통 뼈대
//
//  구름 징검다리(skyway) · 무지개 다리(rainbow) · 꽃길(flower)이 전부 이걸 쓴다.
//  다른 건 **꾸미기**뿐이고, 걷는 규칙은 여기 한 곳에만 있다.
//
//  ★ 떨어지지 않는다. 걸어 다닐 수 있는 곳은 "길(PATH) 둘레"와 양 끝 승강장뿐이고,
//    길 밖으로 나가려 하면 다시 길 위로 밀어준다 (collide).
//  ★ 길은 **부드러운 곡선**이어야 한다. 점을 그냥 직선으로 이으면 모퉁이 바깥에
//    쐐기 같은 틈이 생기고, 거기 끼면 밀어내는 방향이 매 프레임 뒤집혀 **걸음이 멈춘다.**
//    (실제로 겪은 버그다 — docs/진행상황.md 참고)
//  ★ 길은 승강장 **안에서** 시작하고 끝나야 한다. 밖으로 삐져나오면 허공을 걷게 된다.
// ===========================================================
import * as THREE from 'three';
import { buildSky } from './sky.js';
import { part, toon, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 (다리마다 따로 줄 수도 있다)
// -----------------------------------------------------------
const PATH_HALF = 3.4;      // 길의 반 너비 (이만큼까지 걸어도 된다)
const PLAT_R    = 5.8;      // 승강장에서 걸어 다닐 수 있는 반지름
const ARCH_Z    = 5.0;      // 승강장 한가운데에서 아치 문까지 (뒤쪽 끝)
const DOOR_R    = 3.8;      // 문 감지 반지름
                            //  ★ 넓게 준다. 길이 넓어서 한쪽으로 붙어 걸으면
                            //    좁은 문은 그냥 지나쳐 버린다

/**
 * 길 하나를 만든다.
 *   name        : 공간 이름 ('skyway', 'rainbow', 'flower' …)
 *   control     : 길이 지나가는 점들 [{x,z}, …] (부드러운 곡선으로 바뀐다)
 *   platA/platB : 양 끝 승강장 자리 {x,z}.  A는 길의 시작, B는 끝
 *   spawnAt     : 'A' | 'B'   처음 들어오면 어느 쪽에 서나
 *   ends        : [{ at:'A'|'B', to, label, build, arrive, arriveYaw }, …]
 *   decorate(scene, api) : 이 다리만의 꾸미기. api로 길 정보를 받는다
 */
export function makeBridge(cfg) {
  const HALF = cfg.pathHalf ?? PATH_HALF;
  const R = cfg.platR ?? PLAT_R;
  const AZ = cfg.archZ ?? ARCH_Z;
  const A = cfg.platA, B = cfg.platB;

  // --- 부드러운 곡선으로 바꾼 뒤, 촘촘한 점으로 잘라 둔다 ---
  //   점이 촘촘하면 이웃한 두 토막이 거의 일직선이라 모퉁이 쐐기가 생기지 않는다
  const CURVE = new THREE.CatmullRomCurve3(
    cfg.control.map(p => new THREE.Vector3(p.x, 0, p.z))
  );
  const PATH = CURVE.getSpacedPoints(240);

  // --- 길 위의 한 점 찾기 — (x,z)에서 가장 가까운 길 위 자리 ---
  const _near = { x: 0, z: 0, d: 0 };
  function nearestOnPath(x, z) {
    let best = Infinity;
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const len2 = dx * dx + dz * dz;
      if (len2 < 1e-9) continue;
      let u = ((x - a.x) * dx + (z - a.z) * dz) / len2;
      u = Math.max(0, Math.min(1, u));
      const px = a.x + dx * u, pz = a.z + dz * u;
      const d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; _near.x = px; _near.z = pz; }
    }
    _near.d = best;
    return _near;
  }

  /** 길을 따라 gap 간격으로 자리를 뽑는다 (승강장 위는 뺀다) */
  function alongPath(gap, keepOut = 3) {
    const n = Math.max(2, Math.round(CURVE.getLength() / gap));
    return CURVE.getSpacedPoints(n).filter(p =>
      Math.hypot(p.x - A.x, p.z - A.z) > R + keepOut &&
      Math.hypot(p.x - B.x, p.z - B.z) > R + keepOut);
  }

  // -----------------------------------------------------------
  //  화면 만들기 — 하늘·햇빛
  // -----------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(cfg.bg ?? 0x9fd8ff);
  scene.environment = cfg.envMap || null;

  scene.add(new THREE.HemisphereLight(cfg.skyLight ?? 0xffffff,
                                      cfg.floorLight ?? 0xbfe8ff, 1.5));
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.2);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;   sun.shadow.camera.bottom = -50;
  sun.shadow.camera.far = 200;
  sun.shadow.normalBias = 0.5;
  scene.add(sun);

  const sky = cfg.sky === false ? null : buildSky(scene);

  const ticks = [];
  const api = {
    scene, PATH, CURVE, A, B,
    PATH_HALF: HALF, PLAT_R: R, ARCH_Z: AZ,
    alongPath,
    addTick: (fn) => ticks.push(fn),
  };
  cfg.decorate?.(scene, api);

  // -----------------------------------------------------------
  //  걷기 — 길 밖으로 못 나간다 (떨어지지 않게)
  // -----------------------------------------------------------
  /** 여기 서 있어도 되나? (길 둘레 또는 승강장 위) */
  function onSafeGround(x, z, slack = 0) {
    if (Math.hypot(x - A.x, z - A.z) <= R + slack) return true;
    if (Math.hypot(x - B.x, z - B.z) <= R + slack) return true;
    return nearestOnPath(x, z).d <= HALF + slack;
  }

  /** 길 밖으로 나가려 하면 다시 안으로 밀어준다 */
  function collide(pos) {
    if (onSafeGround(pos.x, pos.z)) return;
    // 길·승강장 셋 중 가장 가까운 곳으로 끌어당긴다
    const n = nearestOnPath(pos.x, pos.z);
    let bx = n.x, bz = n.z, keep = HALF, best = n.d - HALF;
    for (const P of [A, B]) {
      const d = Math.hypot(pos.x - P.x, pos.z - P.z);
      if (d - R < best) { best = d - R; bx = P.x; bz = P.z; keep = R; }
    }
    const d = Math.hypot(pos.x - bx, pos.z - bz) || 0.0001;
    const k = keep / d;
    pos.x = bx + (pos.x - bx) * k;
    pos.z = bz + (pos.z - bz) * k;
  }
  function isBlocked(x, z) { return !onSafeGround(x, z, -0.8); }

  function update(dt, t) {
    sky?.update(dt, t);
    for (const fn of ticks) fn(t, dt);
  }

  // -----------------------------------------------------------
  //  🚪 양 끝 문 — 승강장 아치 안쪽에 있다
  //    A쪽 문은 +z 뒤쪽에, B쪽 문은 -z 뒤쪽에 (길은 A → B로 -z 방향이다)
  // -----------------------------------------------------------
  const doors = cfg.ends.map(e => {
    const P = e.at === 'A' ? A : B;
    const back = e.at === 'A' ? AZ - 1.7 : -(AZ - 1.7);
    return {
      x: P.x, z: P.z + back, r: e.r ?? DOOR_R, y: 0,
      to: e.to, label: e.label, build: e.build,
      arrive: e.arrive, arriveYaw: e.arriveYaw,
    };
  });

  //  처음 들어오면 서는 자리 — 아치 **반대쪽**(길 쪽)에 서서 길을 바라본다
  const atB = cfg.spawnAt === 'B';
  const spawnAt = atB ? B : A;
  return {
    name: cfg.name,
    scene,
    spawn: new THREE.Vector3(spawnAt.x, 0, spawnAt.z + (atB ? 2 : -2)),
    yaw: atB ? 0 : Math.PI,
    camDist: cfg.camDist ?? 10,
    camHeight: cfg.camHeight ?? 6,
    lookHeight: cfg.lookHeight ?? 3.0,
    npcCount: 0,
    collide, isBlocked, update,
    rides: [], spots: [],
    doors,
  };
}

// ===========================================================
//  다리들이 함께 쓰는 꾸미기 — 승강장 · 구름 · 무지개
// ===========================================================
// -----------------------------------------------------------
//  ☁️ 아래에 깔리는 구름 (푹신푹신해 보이게 뭉치로)
// -----------------------------------------------------------
export function makeCloudLump(s) {
  const g = new THREE.Group();
  const m = toon(0xffffff);
  for (const [dx, dy, dz, r] of [[0,0,0,1], [0.8,-0.15,0.2,0.75], [-0.75,-0.2,-0.1,0.7],
                                 [0.2,0.25,-0.6,0.6], [-0.2,0.1,0.6,0.62]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), m);
    b.position.set(dx * s, dy * s, dz * s);
    b.scale.setScalar(r * s * 2);
    b.castShadow = false;
    g.add(b);
  }
  return g;
}

// -----------------------------------------------------------
//  🌈 무지개 다리 (길 위를 가로지르는 장식)
// -----------------------------------------------------------
export function makeRainbow(radius) {
  const g = new THREE.Group();
  const cols = [0xff7a9c, 0xffa733, 0xffd93d, 0x7ad48f, 0x63c8ff, 0xc9b4ff];
  for (let i = 0; i < cols.length; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius - i * 1.5, 0.7, 8, 40, Math.PI),
      glow(cols[i])
    );
    band.castShadow = false;
    g.add(band);
  }
  return g;
}

// -----------------------------------------------------------
//  🏰 양 끝 승강장 — 인하성 쪽 / 루하성 쪽
// -----------------------------------------------------------
export function makePlatform(color, label, railColor) {
  const g = new THREE.Group();
  g.add(part('cyl', color, 0, -0.4, 0, 13, 0.8, 13));
  g.add(part('cyl', 0xcfc4e8, 0, -1.6, 0, 11, 1.6, 11));
  const base = part('cone', 0xb9aede, 0, -4.2, 0, 9, 3.6, 9);
  base.rotation.x = Math.PI;
  g.add(base);

  // 성으로 들어가는 아치 문 — 승강장 **뒤쪽 끝**(local +z)에 세운다
  //  ★ 가운데 자리에 세우면, 문으로 들어올 때 카메라가 문 뒤에 서서 앞을 가린다
  const AZ = ARCH_Z;
  //  ★ 아치는 **넓게** 만든다. 문으로 들어오면 카메라가 잠깐 문 뒤에 서는데,
  //    구멍이 좁으면 앞이 답답하게 가린다
  g.add(part('box', railColor, -4.8, 3.4, AZ, 1.0, 6.8, 1.4));
  g.add(part('box', railColor,  4.8, 3.4, AZ, 1.0, 6.8, 1.4));
  g.add(part('box', railColor, 0, 7.1, AZ, 10.6, 1.0, 1.4));

  //  ★ 빛나는 문은 **한쪽만 보이는 판**이다 (길 쪽에서만 보인다).
  //    뒤에서는 비쳐서, 문 뒤에 선 카메라가 캐릭터를 가리지 않는다
  const glowDoor = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 6.6), glow(0xfff3d8));
  glowDoor.position.set(0, 3.3, AZ - 0.75);
  glowDoor.rotation.y = Math.PI;              // 길 쪽(-z)을 바라본다
  glowDoor.userData.noShadow = true;
  g.add(glowDoor);

  const sign = makeSign(label, 6.4, 1.3, '#ffffffdd', '#5b3d8f');
  sign.position.set(0, 8.4, AZ - 0.8);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // 난간 구슬 (문 쪽은 비운다)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = Math.cos(a) * 6, z = Math.sin(a) * 6;
    if (z > 2.5 && Math.abs(x) < 5.2) continue;
    g.add(part('cyl', 0xfff6e8, x, 0.5, z, 0.5, 1.0, 0.5));
    g.add(part('ball', railColor, x, 1.2, z, 0.6));
  }
  return g;
}

export { PATH_HALF, PLAT_R, ARCH_Z, DOOR_R };

