// ===========================================================
//  🏠 실내 공간 만들기 — 마트·친구 집·그림의 집이 함께 쓰는 뼈대
//
//  마을(world.js)·성 안(castle-interior.js)과 똑같은 모양의
//  "공간(area)"을 쉽게 만들어 주는 도우미다.
//    { scene, spawn, yaw, collide, isBlocked, update, rides, spots, doors }
//
//  쓰는 법 —
//    const room = makeInterior({ name:'mart', w:26, d:20, ... });
//    room.place(makeShelf(), 0, -4, 0, { r: 2 });   // 물건 놓기
//    return room.finish({ residents: [...] });
//
//  ★ 벽·천장은 "안쪽만 보이는 판"이라서 카메라가 밖으로 나가도
//    방 안이 그대로 보인다 (성 안과 같은 방식).
// ===========================================================
import * as THREE from 'three';
import { createCollider } from './collide.js';
import { canvasTex } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const DOOR_W = 4.2;      // 나가는 문 너비
const DOOR_H = 5.4;      // 나가는 문 높이
const WALL_T = 1.0;      // 벽 두께 (벽 뒤로 못 나가게 막는 두께)

// 🚪 나가는 문을 얼마나 예민하게 볼 것인가
//  ★ 이 값이 크면 문 근처에서 놀다가 자꾸 밖으로 튕겨 나간다.
//    그래서 문 감지 자리를 **벽에 바짝 붙이고**(DOOR_BACK) 범위도 좁게(DOOR_R) 둔다.
//    "문간에 들어서야" 나가진다 — 입구 쪽 방 안에서 놀아도 안 나가진다.
const DOOR_R    = 1.7;   // 문 감지 반지름 (예전 2.4 → 자꾸 나가져서 줄임)
const DOOR_BACK = 1.2;   // 남쪽 벽에서 이만큼만 안쪽 (예전 2.2)
const SPAWN_BACK = 5.5;  // 들어왔을 때 서는 자리 (벽에서 이만큼 안쪽)

// -----------------------------------------------------------
//  바닥 무늬 — 네모 두 색이 번갈아 나오는 타일
// -----------------------------------------------------------
export function tileTexture(colorA, colorB, repeat = 10, line = null) {
  const tex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = colorA; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = colorB;
    ctx.fillRect(0, 0, s / 2, s / 2);
    ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, s - 3, s - 3); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

// -----------------------------------------------------------
//  벽지 — 위는 밝은 색, 아래는 굽도리(허리 아래 판자), 사이에 띠
// -----------------------------------------------------------
export function wallpaperTexture(top, bottom, stripe) {
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = top; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = bottom; ctx.fillRect(0, s * 0.68, s, s * 0.32);
    ctx.fillStyle = stripe; ctx.fillRect(0, s * 0.655, s, s * 0.03);
  });
}

/**
 * 실내 공간 하나를 시작한다.
 *   name       : 공간 이름 ('mart', 'house0' …)
 *   w, d, h    : 가로 · 세로 · 천장 높이
 *   floorTex   : 바닥 그림 (tileTexture로 만든다). 없으면 floorColor를 쓴다
 *   wallTex    : 벽 그림 (wallpaperTexture). 없으면 wallColor
 *   ceilColor  : 천장 색
 *   bg         : 창밖(배경) 색
 *   doorX      : 나가는 문이 있는 자리 (남쪽 벽, 기본 0)
 *   exit       : 마을로 나갔을 때 설 자리 { x, z, yaw }
 *   exitLabel  : 나갈 때 화면에 뜨는 말
 */
export function makeInterior(cfg) {
  const W = cfg.w, D = cfg.d, H = cfg.h ?? 9;
  const doorX = cfg.doorX ?? 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(cfg.bg ?? 0xbfe8ff);
  scene.environment = cfg.envMap || null;

  // --- 조명 — 실내라 밝고 그늘이 옅다 ---
  scene.add(new THREE.HemisphereLight(cfg.skyLight ?? 0xffffff, cfg.floorLight ?? 0xe6d8ff, 1.35));
  const lamp = new THREE.DirectionalLight(0xfff4e0, 0.85);
  lamp.position.set(W * 0.4, H * 2.4, D * 0.5);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  const R = Math.max(W, D) * 0.8;
  lamp.shadow.camera.left = -R; lamp.shadow.camera.right = R;
  lamp.shadow.camera.top = R;   lamp.shadow.camera.bottom = -R;
  lamp.shadow.camera.far = H * 6;
  lamp.shadow.normalBias = 0.5;
  scene.add(lamp);

  // --- 바닥 ---
  const floorMat = cfg.floorTex
    ? new THREE.MeshToonMaterial({ map: cfg.floorTex })
    : new THREE.MeshToonMaterial({ color: cfg.floorColor ?? 0xe8e0d0 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 벽 4장 (안쪽만 보이는 판) ---
  const baseWall = cfg.wallTex
    ? new THREE.MeshToonMaterial({ map: cfg.wallTex })
    : new THREE.MeshToonMaterial({ color: cfg.wallColor ?? 0xfff3e6 });
  const walls = [
    { x: 0, z: -D / 2, ry: 0,            len: W },   // 북
    { x: 0, z:  D / 2, ry: Math.PI,      len: W },   // 남 (나가는 문)
    { x: -W / 2, z: 0, ry: Math.PI / 2,  len: D },   // 서
    { x:  W / 2, z: 0, ry: -Math.PI / 2, len: D },   // 동
  ];
  for (const w of walls) {
    const mat = baseWall.clone();
    if (mat.map) {
      mat.map = baseWall.map.clone();
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(w.len / 6, 1);
      mat.map.needsUpdate = true;
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w.len, H), mat);
    m.position.set(w.x, H / 2, w.z);
    m.rotation.y = w.ry;
    m.receiveShadow = true;
    scene.add(m);
  }

  // --- 천장 (아래쪽만 보이는 판) ---
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshToonMaterial({ color: cfg.ceilColor ?? 0xfaf4ff })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);

  // --- 나가는 문 (바깥 햇빛이 들어온다) ---
  const doorway = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, DOOR_H),
    new THREE.MeshBasicMaterial({ color: 0xdff3ff })
  );
  doorway.position.set(doorX, DOOR_H / 2, D / 2 - 0.1);
  doorway.rotation.y = Math.PI;
  scene.add(doorway);
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W + 1.1, DOOR_H + 0.6),
    new THREE.MeshBasicMaterial({ color: cfg.doorFrame ?? 0xffb8d4 })
  );
  frame.position.set(doorX, (DOOR_H + 0.6) / 2 - 0.3, D / 2 - 0.16);
  frame.rotation.y = Math.PI;
  scene.add(frame);

  // --- 문간 발판 — "여기 서면 나간다"고 알려주는 매트 ---
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W - 0.4, DOOR_R * 1.6),
    new THREE.MeshToonMaterial({ color: cfg.doorFrame ?? 0xffb8d4 })
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(doorX, 0.03, D / 2 - DOOR_BACK);
  mat.receiveShadow = true;
  scene.add(mat);

  // --- 벽 뒤로 못 나가게 ---
  const obstacles = [
    { x: 0, z: -D / 2 - WALL_T, hw: W / 2 + WALL_T, hd: WALL_T },
    { x: 0, z:  D / 2 + WALL_T, hw: W / 2 + WALL_T, hd: WALL_T },
    { x: -W / 2 - WALL_T, z: 0, hw: WALL_T, hd: D / 2 + WALL_T },
    { x:  W / 2 + WALL_T, z: 0, hw: WALL_T, hd: D / 2 + WALL_T },
  ];

  const ticks = [];
  const spots = [];
  const rides = [];

  /**
   * 물건 하나 놓기.  place(모양, x, z, 방향, 부딪히는크기, 높이)
   *   hit = { r: 1.5 } 또는 { hw: 2, hd: 1 }. 없으면 뚫고 지나간다.
   */
  function place(group, x, z, ry = 0, hit = null, y = 0) {
    group.position.set(x, y, z);
    group.rotation.y = ry;
    scene.add(group);
    if (group.userData.tick) ticks.push(group.userData.tick);
    if (hit) obstacles.push({ x, z, ...hit });
    return group;
  }

  /** 벽에 거는 물건 (액자·간판) */
  function hang(group, x, y, z, ry = 0) {
    group.position.set(x, y, z);
    group.rotation.y = ry;
    scene.add(group);
    if (group.userData.tick) ticks.push(group.userData.tick);
    return group;
  }

  /**
   * 말 걸 수 있는 자리 하나 (🅰 버튼이 뜬다).
   *   { x, z, r, verb, use(toast) }   ← use는 main.js가 버튼을 누를 때 부른다
   */
  function addSpot(s) { spots.push(s); return s; }

  /** 매 프레임 할 일 하나 더 (움직이는 물건) */
  function addTick(fn) { ticks.push(fn); }

  /**
   * 공간을 완성한다. extra에 적은 것은 그대로 area에 붙는다
   * (residents, wanderZones, npcCount 등).
   */
  function finish(extra = {}) {
    const { tick, ...rest } = extra;
    const collider = createCollider(obstacles);
    // 놀이기구가 화면에 같이 넣을 것을 들고 있으면 넣어준다 (떠오르는 Z 등)
    for (const r of rides) for (const p of r.parts || []) scene.add(p);

    function update(dt, t) {
      for (const fn of ticks) fn(t, dt);
      for (const r of rides) r.tick?.(t, dt);
      tick?.(dt, t);
    }

    return {
      name: cfg.name,
      scene,
      spawn: new THREE.Vector3(doorX, 0, D / 2 - SPAWN_BACK),
      yaw: Math.PI,                    // 들어오면 방 안쪽(-z)을 바라본다
      camDist: cfg.camDist ?? 9,       // 방이 좁으니 카메라를 가까이
      camHeight: cfg.camHeight ?? 5.5,
      lookHeight: cfg.lookHeight ?? 2.8,
      npcCount: 0,                     // 돌아다니는 친구는 residents로 따로 넣는다
      wanderZones: [{ x: 0, z: -1, r: Math.min(W, D) / 2 - 2.5 }],
      collide: collider.collide,
      isBlocked: collider.isBlocked,
      update, rides, spots,
      doors: [{
        x: doorX, z: D / 2 - DOOR_BACK, r: DOOR_R, y: 0, to: 'village',
        label: cfg.exitLabel ?? '마을로 나왔어요! 🌳',
        arrive: new THREE.Vector3(cfg.exit.x, 0, cfg.exit.z),
        arriveYaw: cfg.exit.yaw,
      }],
      ...rest,
    };
  }

  return { scene, obstacles, spots, rides, place, hang, addSpot, addTick, finish, W, D, H };
}
