// ===========================================================
//  🏰 성 안 — 문으로 들어가면 펼쳐지는 새로운 공간
//
//  마을(world.js)과 똑같은 모양의 "공간(area)"을 하나 더 만든다.
//    { scene, spawn, yaw, collide, isBlocked, update, rides, doors }
//  그래서 player.js와 npcs.js를 고치지 않고 그대로 쓸 수 있다.
//
//  ★ 벽·천장은 "안쪽만 보이는 판"이라서, 카메라가 방 밖으로 나가도
//    벽에 가려지지 않고 방 안이 그대로 보인다.
// ===========================================================
import * as THREE from 'three';
import { createCollider } from './world.js';
import {
  C, toon, glow, part, canvasTex, makeHeart,
  makeThrone, makeFireplace, makeCakeTable, makeBookshelf, makeNook,
  makeCandleStand, makePlant, makeNumberBlocks, makeBalloons, makeRockingHorse,
} from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HALF_X   = 20;    // 방의 가로 절반 (넓히고 싶으면 키운다)
const HALF_Z   = 20;    // 방의 세로 절반
const HEIGHT   = 15;    // 천장 높이
const SPARKLES = 90;    // 공중에 떠다니는 반짝이 개수

const SEAT_Y   = 2.9;   // 왕좌 방석 높이 (castle-props.js의 왕좌와 맞춰야 한다)
const HORSE_Y  = 2.6;   // 흔들목마 안장 높이

// -----------------------------------------------------------
//  바닥·벽지·스테인드글라스 그림 (전부 Canvas로 그린다)
// -----------------------------------------------------------
function floorTexture() {
  const tex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#fdf3ea'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#e9d6f0'; ctx.fillRect(0, 0, s / 2, s / 2);
    ctx.fillStyle = '#e9d6f0'; ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
    ctx.strokeStyle = '#d8c2e6'; ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, s - 3, s - 3);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(HALF_X, HALF_Z);
  return tex;
}

function wallTexture() {
  const tex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#fff4e6'; ctx.fillRect(0, 0, s, s);       // 위쪽 벽
    ctx.fillStyle = '#ffd9e8'; ctx.fillRect(0, s * 0.62, s, s); // 아래쪽 분홍 벽
    ctx.fillStyle = '#ffb8d4'; ctx.fillRect(0, s * 0.60, s, s * 0.03);
    ctx.fillStyle = '#ffd45e'; ctx.fillRect(0, s * 0.575, s, s * 0.02);
    // 아래쪽 벽에 세로 줄무늬
    ctx.fillStyle = '#ffc6dd';
    for (let i = 0; i < 8; i++) ctx.fillRect(i * s / 8 + 6, s * 0.66, 10, s * 0.3);
    // 위쪽 벽에 작은 하트 무늬
    ctx.fillStyle = '#ffe3ef';
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 40, y = 40 + (i % 2) * 50;
      ctx.beginPath(); ctx.arc(x - 7, y, 8, 0, 7); ctx.arc(x + 7, y, 8, 0, 7);
      ctx.moveTo(x - 15, y + 3); ctx.lineTo(x, y + 22); ctx.lineTo(x + 15, y + 3);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** 스테인드글라스 — 꽃잎 모양 유리창 그림 */
function glassTexture() {
  return canvasTex(256, (ctx, s) => {
    const c = s / 2;
    ctx.fillStyle = '#7fd4ff'; ctx.fillRect(0, 0, s, s);
    const petals = ['#ff9ec4', '#ffd45e', '#a8ead8', '#c9b4ff', '#ff7a9c', '#8fd0ff'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = petals[i];
      ctx.beginPath();
      const a = (i / 6) * Math.PI * 2;
      ctx.ellipse(c + Math.cos(a) * 62, c + Math.sin(a) * 62, 52, 34, a, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#fff6c0';
    ctx.beginPath(); ctx.arc(c, c, 38, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5b3d8f'; ctx.lineWidth = 7;
    ctx.strokeRect(4, 4, s - 8, s - 8);
    ctx.beginPath(); ctx.arc(c, c, 38, 0, 7); ctx.stroke();
  });
}

/** 반짝이 한 알 그림 */
function sparkleTexture() {
  return canvasTex(64, (ctx, s) => {
    const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,235,180,0.8)');
    grd.addColorStop(1, 'rgba(255,200,240,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
  });
}

// -----------------------------------------------------------
//  방 만들기 — 바닥 / 벽 4개 / 천장 / 창문 / 나가는 문
// -----------------------------------------------------------
function buildRoom(scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2),
    new THREE.MeshToonMaterial({ map: floorTexture() })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 벽 — 안쪽만 보이는 판 4장
  const wallMat = new THREE.MeshToonMaterial({ map: wallTexture() });
  const walls = [
    { x: 0, z: -HALF_Z, ry: 0,            w: HALF_X * 2 },   // 북(왕좌 쪽)
    { x: 0, z:  HALF_Z, ry: Math.PI,      w: HALF_X * 2 },   // 남(나가는 문)
    { x: -HALF_X, z: 0, ry: Math.PI / 2,  w: HALF_Z * 2 },   // 서(벽난로)
    { x:  HALF_X, z: 0, ry: -Math.PI / 2, w: HALF_Z * 2 },   // 동(책장)
  ];
  for (const w of walls) {
    const mat = wallMat.clone();
    mat.map = wallMat.map.clone();
    mat.map.repeat.set(w.w / 10, HEIGHT / 10);
    mat.map.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, HEIGHT), mat);
    m.position.set(w.x, HEIGHT / 2, w.z);
    m.rotation.y = w.ry;
    m.receiveShadow = true;
    scene.add(m);
  }

  // 천장 — 아래쪽만 보이는 판 + 금색 별
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2),
    new THREE.MeshToonMaterial({ color: 0xb9a4e8 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = HEIGHT;
  scene.add(ceil);
  for (let i = 0; i < 16; i++) {
    const s = part('oct', C.gold, (Math.random() - 0.5) * 34, HEIGHT - 0.5,
                   (Math.random() - 0.5) * 34, 0.5 + Math.random() * 0.4);
    s.castShadow = false;
    scene.add(s);
  }

  // 창문 (스테인드글라스) — 양쪽 벽에 2개씩 + 왕좌 뒤 큰 창 1개
  const glassMat = new THREE.MeshBasicMaterial({ map: glassTexture() });
  const winGeo = new THREE.PlaneGeometry(5, 7);
  for (const s of [-1, 1]) {
    for (const z of [-8, 6]) {
      const w = new THREE.Mesh(winGeo, glassMat);
      w.position.set(s * (HALF_X - 0.15), 8.6, z);
      w.rotation.y = s * -Math.PI / 2;
      scene.add(w);
    }
  }
  const rose = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), glassMat);
  rose.position.set(0, 10.5, -HALF_Z + 0.15);
  scene.add(rose);

  // 창문에서 들어오는 빛기둥 (반투명 판)
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xfff3c8, transparent: true, opacity: 0.16, depthWrite: false,
  });
  for (const s of [-1, 1]) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(5, 16), shaftMat);
    shaft.position.set(s * (HALF_X - 5), 5.5, -1);
    shaft.rotation.y = s * -Math.PI / 2;
    shaft.rotation.x = 0.55;
    scene.add(shaft);
  }

  // 남쪽 벽의 나가는 문 — 바깥 햇빛이 들어온다
  const doorway = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 8.5),
    new THREE.MeshBasicMaterial({ color: 0xdff3ff })
  );
  doorway.position.set(0, 4.2, HALF_Z - 0.12);
  doorway.rotation.y = Math.PI;
  scene.add(doorway);
  const arch = new THREE.Mesh(
    new THREE.RingGeometry(3.0, 3.9, 24, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: C.gold, side: THREE.DoubleSide })
  );
  arch.position.set(0, 8.4, HALF_Z - 0.1);
  arch.rotation.y = Math.PI;
  scene.add(arch);
  const heart = makeHeart(C.red, 1.1);
  heart.position.set(0, 10.4, HALF_Z - 0.3);
  heart.rotation.y = Math.PI;
  scene.add(heart);
}

// -----------------------------------------------------------
//  놀이기구 — 왕좌에 앉기 / 흔들목마 타기
//  (rides.js가 쓰는 모양 그대로 만든다)
// -----------------------------------------------------------
function makeThroneRide(x, z) {
  return {
    kind: 'throne', label: '왕좌에 앉았어요! 👑',
    enter: { x, z: z + 6.2 }, exit: { x, z: z + 6.6 },
    duration: 14, autoEnd: false, rider: null,
    pose(t, o) {
      o.x = x; o.z = z - 1.0;
      o.y = SEAT_Y + Math.sin(t * 1.6) * 0.05;
      o.yaw = Math.sin(t * 0.7) * 0.12;
      o.tilt = -0.04;
      return o;
    },
  };
}

function makeHorseRide(x, z) {
  return {
    kind: 'horse', label: '흔들목마를 타요! 🐴',
    enter: { x: x + 3.2, z }, exit: { x: x + 3.6, z },
    duration: 12, autoEnd: false, rider: null,
    pose(t, o) {
      // 목마와 똑같은 각도로 흔들린다 (castle-props.js의 tick과 같은 식)
      const swing = Math.sin(t * 1.8) * 0.13;
      o.x = x;
      o.z = z + HORSE_Y * Math.sin(swing);        // 앞뒤로 같이 움직이고
      o.y = HORSE_Y * Math.cos(swing);            // 살짝 오르내린다
      o.yaw = 0;                                  // 목마 머리 쪽(+z)을 본다
      o.tilt = swing;                             // 몸도 같이 기운다
      return o;
    },
  };
}

// -----------------------------------------------------------
//  ✨ 공중에 떠다니는 반짝이
// -----------------------------------------------------------
function buildSparkles(scene) {
  const pos = new Float32Array(SPARKLES * 3);
  const speed = new Float32Array(SPARKLES);
  for (let i = 0; i < SPARKLES; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * HALF_X * 1.9;
    pos[i * 3 + 1] = Math.random() * HEIGHT;
    pos[i * 3 + 2] = (Math.random() - 0.5) * HALF_Z * 1.9;
    speed[i] = 0.3 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    map: sparkleTexture(), size: 0.42, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(points);

  return (dt, t) => {
    const a = geo.attributes.position;
    for (let i = 0; i < SPARKLES; i++) {
      let y = a.array[i * 3 + 1] + speed[i] * dt;
      if (y > HEIGHT) y = 0;
      a.array[i * 3 + 1] = y;
      a.array[i * 3] += Math.sin(t * 0.6 + i) * dt * 0.3;
    }
    a.needsUpdate = true;
  };
}

// -----------------------------------------------------------
//  성 안 공간 만들기
// -----------------------------------------------------------
/** envMap: 반짝이는 재질(.glb 친구들)에 쓸 반사광. main.js가 넘겨준다. */
export function buildCastleInterior(envMap) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3b2a5e);
  scene.environment = envMap || null;

  // 조명 — 따뜻하고 아늑하게
  scene.add(new THREE.HemisphereLight(0xfff0f8, 0x8a6bd0, 1.15));
  const win = new THREE.DirectionalLight(0xfff2d0, 1.1);
  win.position.set(-24, 26, -10);
  win.castShadow = true;
  win.shadow.mapSize.set(1024, 1024);
  win.shadow.camera.left = -26; win.shadow.camera.right = 26;
  win.shadow.camera.top = 26;   win.shadow.camera.bottom = -26;
  win.shadow.camera.far = 90;
  scene.add(win);

  buildRoom(scene);

  const obstacles = [];
  const ticks = [];

  /** 물건 하나 놓기. hit를 주면 부딪히는 물건이 된다 */
  function place(group, x, z, ry = 0, hit = null) {
    group.position.set(x, 0, z);
    group.rotation.y = ry;
    scene.add(group);
    if (group.userData.tick) ticks.push(group.userData.tick);
    if (hit) obstacles.push({ x, z, ...hit });
    return group;
  }

  // 👑 왕좌 (북쪽)
  place(makeThrone(), 0, -15, 0, { hw: 6.2, hd: 4.2 });
  place(makeCandleStand(), -8.5, -13.5, 0, { r: 1.0 });
  place(makeCandleStand(),  8.5, -13.5, 0, { r: 1.0 });

  // 🔥 벽난로 (서쪽 벽) — 앞에 폭신한 양탄자
  place(makeFireplace(), -HALF_X + 1.0, -3, Math.PI / 2, { hw: 1.8, hd: 4.4 });
  const rug = part('cyl', C.red, -13.5, 0.05, -3, 7, 0.1, 5.4);
  rug.receiveShadow = true; rug.castShadow = false;
  scene.add(rug);

  // 📚 책장 + 🧸 책 읽는 자리 (동쪽)
  place(makeBookshelf(), HALF_X - 0.9, -6, -Math.PI / 2, { hw: 1.6, hd: 4.4 });
  place(makeNook(), 12.5, 4);

  // 🍰 케이크 탁자 (서남쪽)
  place(makeCakeTable(), -11, 7, 0, { r: 2.6 });

  // 🔢 숫자 블록 장난감
  place(makeNumberBlocks(), -4.5, 13, 0.4, { r: 2.0 });

  // 🎈 풍선 (문 양옆)
  place(makeBalloons(), -8, 16.5);
  place(makeBalloons([C.pink, 0xffd45e, 0x8fd0ff]), 8, 16.5);

  // 🪴 화분 (네 귀퉁이)
  for (const [x, z] of [[-17, -17], [17, -17], [-17, 16], [17, 16]]) {
    place(makePlant(), x, z, Math.random() * 6, { r: 1.6 });
  }

  // 🐴 흔들목마 (앞쪽을 보게 그대로 놓는다 — 흔들리는 방향과 타는 자세를 맞추려고)
  place(makeRockingHorse(), 13, -11, 0, { r: 2.2 });

  // 벽 — 밖으로 못 나가게 (판은 눈에만 보이고, 부딪히는 건 여기서 만든다)
  obstacles.push({ x: 0, z: -HALF_Z - 1, hw: HALF_X + 2, hd: 1 });
  obstacles.push({ x: 0, z:  HALF_Z + 1, hw: HALF_X + 2, hd: 1 });
  obstacles.push({ x: -HALF_X - 1, z: 0, hw: 1, hd: HALF_Z + 2 });
  obstacles.push({ x:  HALF_X + 1, z: 0, hw: 1, hd: HALF_Z + 2 });

  const collider = createCollider(obstacles);
  const updateSparkles = buildSparkles(scene);

  const rides = [makeThroneRide(0, -15), makeHorseRide(13, -11)];

  function update(dt, t) {
    for (const tick of ticks) tick(t, dt);
    updateSparkles(dt, t);
  }

  return {
    name: 'castle',
    scene,
    spawn: new THREE.Vector3(0, 0, 10),
    yaw: Math.PI,              // 들어오면 왕좌 쪽(-z)을 바라본다
    camDist: 9,                // 방 안에서는 카메라를 가까이 (가구를 뚫지 않게)
    camHeight: 5.5,
    lookHeight: 2.6,
    wanderRadius: 14,          // 성 안 친구들이 돌아다니는 범위
    npcCount: 5,
    collide: collider.collide,
    isBlocked: collider.isBlocked,
    update, rides,
    // 남쪽 문으로 나가면 마을로 돌아간다
    doors: [{
      x: 0, z: HALF_Z - 2.5, r: 3.0, to: 'village',
      label: '마을로 나왔어요! 🌳',
      // 성 문 앞은 카메라가 성벽에 파묻히므로 조금 앞쪽(광장 쪽)에 내려준다
      arrive: new THREE.Vector3(0, 0, -24), arriveYaw: 0,
    }],
  };
}
