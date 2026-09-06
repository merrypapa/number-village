// ===========================================================
//  🐱 고양이 — 모양(makeCat)과 마음(createCats: 돌아다니고, 따라오고, 먹고, 폴짝)
//
//  고양이는 놀이터(src/cat-park.js) 울타리 안에서 산다.
//    wander : 아무 데나 슬슬 걸어가서 앉는다 (가끔 캣타워 위로 올라간다)
//    sleep  : 엎드려서 잔다
//    follow : 쓰다듬어 주면 한동안 아이를 졸졸 따라온다 (울타리 밖 마을까지도!)
//    eat    : 간식을 주면 밥그릇으로 달려가 먹는다
//    play   : 낚싯대를 흔들면 그 옆에서 폴짝폴짝 뛴다
//    gather : 아이가 방석에 앉으면 빙 둘러앉는다
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 고양이 종류 (이름 · 털색 · 배색 · 무늬)
// -----------------------------------------------------------
export const CAT_KINDS = [
  { name: '치즈',   body: 0xffa64d, belly: 0xfff1d6, stripes: 0xe07d1c },
  { name: '회색이', body: 0x9aa3b2, belly: 0xe6e9ef, stripes: 0x6f7889 },
  { name: '턱시도', body: 0x33353f, belly: 0xffffff, face: 0xffffff },
  { name: '삼색이', body: 0xfff0d6, belly: 0xfff8ec, patches: [0xffa64d, 0x33353f] },
];
const CAT_SCALE = 0.45;       // 고양이 크기 (1이면 아이보다 크다 — 아기 고양이만 하게 줄인다)
const WALK_SPEED = 3.6;       // 슬슬 걷는 빠르기
const RUN_SPEED  = 7.0;       // 간식 줄 때 달려오는 빠르기
const FOLLOW_TIME = 20;       // 쓰다듬으면 이만큼(초) 따라온다
const FOLLOW_GAP  = 1.6;      // 따라올 때 아이와 이만큼 떨어져 선다

const _d = new THREE.Vector3();

// -----------------------------------------------------------
//  🐱 고양이 모양 하나
// -----------------------------------------------------------
export function makeCat(k) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  body.add(part('ball', k.body, 0, 0.78, 0, 1.3, 1.0, 2.2));                    // 몸통
  body.add(part('ball', k.belly, 0, 0.62, 0.25, 1.0, 0.72, 1.6));               // 배
  if (k.stripes) for (let i = 0; i < 3; i++) {
    body.add(part('box', k.stripes, 0, 1.24, -0.55 + i * 0.45, 0.9, 0.08, 0.18));   // 등 줄무늬
  }
  if (k.patches) {
    body.add(part('ball', k.patches[0], -0.35, 1.1, -0.3, 0.7, 0.4, 0.9));      // 얼룩
    body.add(part('ball', k.patches[1], 0.4, 1.0, 0.45, 0.6, 0.4, 0.7));
  }

  // 머리
  const head = new THREE.Group();
  head.position.set(0, 1.28, 1.1);
  head.add(part('ball', k.body, 0, 0, 0, 1.15, 1.0, 1.05));
  head.add(part('ball', k.face ?? k.belly, 0, -0.18, 0.4, 0.82, 0.55, 0.5));    // 주둥이
  head.add(part('ball', 0xff9eb5, 0, -0.06, 0.66, 0.2, 0.15, 0.12));            // 코
  for (const s of [-1, 1]) {
    head.add(part('ball', 0x2b2438, s * 0.3, 0.14, 0.44, 0.2, 0.27, 0.12));     // 눈
    head.add(part('ball', 0xffffff, s * 0.34, 0.22, 0.5, 0.07));                // 눈 반짝
    const ear = part('cone', k.body, s * 0.42, 0.58, -0.1, 0.38, 0.55, 0.3);
    ear.rotation.z = s * 0.3;
    head.add(ear);
    const inner = part('cone', 0xff9eb5, s * 0.42, 0.56, -0.04, 0.2, 0.32, 0.16);
    inner.rotation.z = s * 0.3;
    head.add(inner);
    for (let i = 0; i < 2; i++) {                                                 // 수염
      const w = part('box', 0xffffff, s * 0.62, -0.12 + i * 0.1, 0.42, 0.7, 0.025, 0.025);
      w.rotation.z = s * (0.15 - i * 0.3);
      head.add(w);
    }
  }
  body.add(head);

  // 꼬리 — 위로 살랑 (동그라미 4개)
  const tail = new THREE.Group();
  tail.position.set(0, 0.95, -1.05);
  for (let i = 0; i < 4; i++) tail.add(part('ball', k.body, 0, i * 0.3, -i * 0.22, 0.32 - i * 0.04));
  if (k.stripes) tail.add(part('ball', k.stripes, 0, 1.05, -0.75, 0.2));
  body.add(tail);

  // 다리 4개
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = part('cyl', k.body, sx * 0.42, 0.36, sz * 0.7, 0.34, 0.72, 0.34);
    body.add(leg);
    legs.push(leg);
  }

  g.userData.name = k.name;
  g.userData.body = body; g.userData.head = head; g.userData.tail = tail; g.userData.legs = legs;
  /** 매 프레임 — 걷기·앉기·자기·먹기 자세 */
  g.userData.anim = (t, moving, state, phase) => {
    const s = t * 10 + phase;
    for (let i = 0; i < 4; i++) legs[i].rotation.x = moving ? Math.sin(s + (i % 2 ? Math.PI : 0)) * 0.55 : 0;
    body.position.y = moving ? Math.abs(Math.sin(s)) * 0.08 : 0;
    body.scale.y = state === 'sleep' ? 0.72 : 1;
    body.rotation.x = state === 'sit' || state === 'gather' ? -0.3 : 0;   // 앉으면 앞을 들고
    head.rotation.x = state === 'sleep' ? 0.45 : state === 'eat' ? 0.5 + Math.sin(t * 7 + phase) * 0.25 : 0;
    const wag = state === 'sleep' ? 0.1 : state === 'purr' ? 1.6 : 0.4;
    tail.rotation.z = Math.sin(t * 3 + phase) * wag;
    tail.rotation.x = state === 'sleep' ? 0.9 : 0;
  };
  return g;
}

// -----------------------------------------------------------
//  🐾 고양이들의 마음 — 놀이터 안에서 알아서 논다
//   home  : { x, z, r }  울타리 안 (마을 좌표)
//   perches : [{x,z,y}]  올라가 앉을 자리 (캣타워)
//   bowl  : { x, z }     밥그릇
// -----------------------------------------------------------
export function createCats(scene, { home, perches = [], bowl }) {
  const cats = [];
  CAT_KINDS.forEach((k, i) => {
    const m = makeCat(k);
    const a = (i / CAT_KINDS.length) * Math.PI * 2;
    m.position.set(home.x + Math.cos(a) * home.r * 0.5, 0, home.z + Math.sin(a) * home.r * 0.5);
    m.rotation.y = Math.random() * 6;
    m.scale.setScalar(CAT_SCALE);
    m.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(m);
    cats.push({
      m, name: k.name, state: 'sit', timer: 1 + Math.random() * 3,
      tx: m.position.x, tz: m.position.z, ty: 0, phase: Math.random() * 6,
      speed: WALK_SPEED, follow: 0,
    });
  });

  // 💕 하트 — 쓰다듬으면 머리 위로 떠오른다 (미리 만들어 두고 돌려 쓴다)
  const hearts = [];
  for (let i = 0; i < 6; i++) {
    const h = part('ball', 0xff6b9c, 0, -9, 0, 0.5, 0.45, 0.3, glow(0xff6b9c));
    h.castShadow = false; h.visible = false;
    scene.add(h);
    hearts.push({ m: h, life: 0, vx: 0 });
  }
  function popHearts(x, y, z) {
    for (const h of hearts) {
      h.m.position.set(x + (Math.random() - 0.5) * 1.2, y, z + (Math.random() - 0.5) * 1.2);
      h.m.visible = true; h.life = 1.4 + Math.random() * 0.6; h.vx = (Math.random() - 0.5) * 0.8;
    }
  }

  function wanderTarget(c) {
    if (perches.length && Math.random() < 0.3) {          // 가끔 캣타워로
      const p = perches[Math.floor(Math.random() * perches.length)];
      c.tx = p.x; c.tz = p.z; c.ty = p.y;
    } else {
      const a = Math.random() * Math.PI * 2, r = Math.random() * (home.r - 3);
      c.tx = home.x + Math.cos(a) * r; c.tz = home.z + Math.sin(a) * r; c.ty = 0;
    }
    c.state = 'wander'; c.speed = WALK_SPEED;
  }

  /** 목표 자리로 한 걸음. 도착하면 true */
  function stepTo(c, dt, gap = 0.3) {
    _d.set(c.tx - c.m.position.x, 0, c.tz - c.m.position.z);
    const d = _d.length();
    if (d < gap) return true;
    _d.multiplyScalar(1 / d);
    c.m.position.addScaledVector(_d, Math.min(d, c.speed * dt));
    const want = Math.atan2(_d.x, _d.z);
    let diff = want - c.m.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.m.rotation.y += diff * Math.min(1, 8 * dt);
    return false;
  }

  function update(dt, t, playerPos, seated) {
    for (const c of cats) {
      let moving = false;
      c.timer -= dt;
      switch (c.state) {
        case 'wander':
          if (stepTo(c, dt)) { c.state = Math.random() < 0.3 ? 'sleep' : 'sit'; c.timer = 3 + Math.random() * 5; }
          else moving = true;
          break;
        case 'sit': case 'sleep':
          if (c.timer <= 0) wanderTarget(c);
          break;
        case 'purr':                                   // 골골골 하고 나면 따라온다
          if (c.timer <= 0) c.state = 'follow';
          break;
        case 'follow':
          //  ★ 시간은 dt로 센다 (t는 진짜 시계라 느린 기기에서 dt와 어긋난다)
          c.follow -= dt;
          if (!playerPos || c.follow <= 0 || playerPos.distanceTo(c.m.position) > 30) { wanderTarget(c); break; }
          c.tx = playerPos.x; c.tz = playerPos.z; c.ty = 0; c.speed = WALK_SPEED * 1.4;
          moving = !stepTo(c, dt, FOLLOW_GAP);
          break;
        case 'eat':
          if (!stepTo(c, dt, 0.4)) moving = true;
          else if (c.timer <= 0) wanderTarget(c);
          break;
        case 'play':
          if (c.timer <= 0) { wanderTarget(c); c.m.position.y = 0; break; }
          if (!stepTo(c, dt, 0.5)) moving = true;
          c.m.position.y = Math.abs(Math.sin(t * 6 + c.phase)) * 1.3;   // 폴짝폴짝
          break;
        case 'gather':
          if (!seated) { wanderTarget(c); break; }
          if (!stepTo(c, dt, 0.4)) moving = true;
          break;
      }
      // 캣타워 위로 오르내리기 — 목표 자리 가까이 가면 높이가 따라간다
      //  울타리(home.r)를 지날 땐 폴짝 뛰어넘는다 (고양이는 울타리가 못 막는다)
      if (c.state !== 'play') {
        const near = Math.hypot(c.tx - c.m.position.x, c.tz - c.m.position.z) < 1.6;
        const fence = Math.abs(Math.hypot(c.m.position.x - home.x, c.m.position.z - home.z) - home.r);
        const wantY = fence < 1.3 ? 1.7 * (1 - fence / 1.3) : (near ? c.ty : 0);
        c.m.position.y += (wantY - c.m.position.y) * Math.min(1, 6 * dt);
      }
      c.m.userData.anim(t, moving, c.state, c.phase);
    }
    for (const h of hearts) {
      if (!h.m.visible) continue;
      h.life -= dt;
      h.m.position.y += 1.6 * dt; h.m.position.x += h.vx * dt;
      h.m.rotation.y += 3 * dt;
      if (h.life <= 0) h.m.visible = false;
    }
  }

  return {
    cats, update,
    /** 쓰다듬기 — 골골골 + 하트, 한동안 따라온다 */
    pet(c) {
      c.state = 'purr'; c.timer = 2.0;
      popHearts(c.m.position.x, c.m.position.y + 1.3, c.m.position.z);
      c.follow = FOLLOW_TIME;
    },
    /** 간식 주기 — 모두 밥그릇으로 달려온다 */
    treat() {
      cats.forEach((c, i) => {
        const a = (i / cats.length) * Math.PI * 2;
        c.tx = bowl.x + Math.cos(a) * 1.6; c.tz = bowl.z + Math.sin(a) * 1.6; c.ty = 0;
        c.state = 'eat'; c.speed = RUN_SPEED; c.timer = 7;
      });
    },
    /** 낚싯대 흔들기 — 근처 고양이가 폴짝폴짝 */
    play(x, z) {
      cats.forEach((c, i) => {
        const a = (i / cats.length) * Math.PI * 2 + 0.7;
        c.tx = x + Math.cos(a) * 2.2; c.tz = z + Math.sin(a) * 2.2; c.ty = 0;
        c.state = 'play'; c.speed = RUN_SPEED; c.timer = 6;
      });
    },
    /** 아이가 방석에 앉으면 빙 둘러앉는다 */
    gather(x, z) {
      cats.forEach((c, i) => {
        const a = (i / cats.length) * Math.PI * 2;
        c.tx = x + Math.cos(a) * 2.6; c.tz = z + Math.sin(a) * 2.6; c.ty = 0;
        c.state = 'gather'; c.speed = WALK_SPEED; c.timer = 99;
      });
    },
  };
}
