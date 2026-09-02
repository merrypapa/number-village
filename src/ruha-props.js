// ===========================================================
//  🌙 루하성에 놓을 것들 — 별 분수 · 달 그네 · 별 회전목마 · 소원 우물 · 별자리 돔
//
//  루하성은 **밤하늘과 별의 성**이다. (인하성은 분홍빛 낮의 성)
//  ★ 여기는 "모양"만 만든다. 어디에 놓을지는 src/ruha-castle.js가 정한다.
//  ★ 움직이는 것은 group.userData.tick = (t, dt) => {…} 에 적어둔다.
// ===========================================================
import * as THREE from 'three';
import { C, part, toon, glow, canvasTex, makeHeart } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 색 — 루하성 밤하늘 색
// -----------------------------------------------------------
export const R = {
  night:   0x1b1b45,   // 밤하늘
  deep:    0x2c2a6b,   // 진한 남색 (벽 아래)
  violet:  0x6a5acd,
  moon:    0xfff3c0,   // 달빛
  star:    0xffe98a,   // 별빛
  ice:     0xa8e6ff,   // 얼음빛
  rose:    0xff9ec4,
  mint:    0x8ff0d8,
  silver:  0xdfe3ff,
};

/** ⭐ 별 하나 (팔각형 두 개를 겹쳐서 반짝이게) */
export function makeStar(color = R.star, s = 1) {
  const g = new THREE.Group();
  const a = part('oct', color, 0, 0, 0, s, s * 1.7, s);
  const b = part('oct', color, 0, 0, 0, s * 1.7, s, s);
  a.material = glow(color); b.material = glow(color);
  a.castShadow = b.castShadow = false;
  g.add(a); g.add(b);
  return g;
}

/** 🌙 초승달 하나 — 고리를 한 바퀴 다 안 그리고 잘라서 만든다 */
export function makeMoon(s = 1, color = R.moon) {
  const g = new THREE.Group();
  const ARC = Math.PI * 1.3;                 // 얼마나 그릴까 (한 바퀴는 2π)
  const inner = new THREE.Group();
  inner.rotation.z = -ARC / 2 + Math.PI / 2; // 초승달이 위를 보게 돌린다
  g.add(inner);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.42, 10, 30, ARC), glow(color));
  ring.castShadow = false;
  inner.add(ring);
  for (const a of [0, ARC]) {                // 양 끝을 동그랗게 막는다
    const cap = part('ball', color, Math.cos(a), Math.sin(a), 0, 0.84);
    cap.material = glow(color);
    cap.castShadow = false;
    inner.add(cap);
  }
  g.scale.setScalar(s);
  return g;
}

// -----------------------------------------------------------
//  ✨ 별 분수 — 물 대신 별빛이 솟는다
// -----------------------------------------------------------
export function makeStarFountain() {
  const g = new THREE.Group();
  g.add(part('cyl', R.deep,   0, 0.5, 0, 11, 1.0, 11));
  g.add(part('cyl', R.violet, 0, 1.05, 0, 10, 0.3, 10));
  g.add(part('cyl', R.ice,    0, 1.2, 0, 9.4, 0.2, 9.4, glow(R.ice)));
  g.add(part('cyl', R.silver, 0, 2.2, 0, 2.2, 3.0, 2.2));
  g.add(part('cyl', R.violet, 0, 3.9, 0, 5.0, 0.4, 5.0));
  g.add(part('cyl', R.silver, 0, 5.0, 0, 1.2, 2.2, 1.2));

  const top = makeStar(R.star, 1.6);
  top.position.y = 6.6;
  g.add(top);

  // 둘레를 도는 작은 별들
  const orbit = [];
  for (let i = 0; i < 10; i++) {
    const st = makeStar(i % 2 ? R.moon : R.ice, 0.55);
    g.add(st);
    orbit.push(st);
  }
  g.userData.tick = (t) => {
    top.rotation.y = t * 0.8;
    top.position.y = 6.6 + Math.sin(t * 1.2) * 0.2;
    for (let i = 0; i < orbit.length; i++) {
      const a = t * 0.5 + (i / orbit.length) * Math.PI * 2;
      const r = 4.2 + Math.sin(t + i) * 0.4;
      orbit[i].position.set(Math.cos(a) * r, 2.4 + Math.sin(t * 1.4 + i) * 1.1, Math.sin(a) * r);
      orbit[i].rotation.z = t + i;
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🌙 달 그네 — 천장에 매달린 초승달에 앉아서 흔들흔들
//     앉는 자리 높이 = SWING_SEAT, 앞뒤로 흔들린다
// -----------------------------------------------------------
export const SWING_SEAT = 2.6;
export const SWING_TOP  = 15;      // 줄이 매달린 높이

export function makeMoonSwing() {
  const g = new THREE.Group();
  const arm = new THREE.Group();          // 이 그룹째로 흔들린다
  g.add(arm);

  for (const s of [-1, 1]) {
    const rope = part('cyl', R.silver, s * 2.2, -(SWING_TOP - SWING_SEAT) / 2, 0,
                      0.22, SWING_TOP - SWING_SEAT, 0.22);
    arm.add(rope);
  }
  const seat = new THREE.Group();
  seat.position.y = -(SWING_TOP - SWING_SEAT);
  const moon = makeMoon(2.6);
  moon.rotation.z = Math.PI * 0.5;
  seat.add(moon);
  seat.add(part('box', R.moon, 0, -0.3, 0, 4.4, 0.4, 2.2, glow(R.moon)));
  for (let i = 0; i < 3; i++) {
    const st = makeStar(R.star, 0.5);
    st.position.set((i - 1) * 1.4, 1.9, 0);
    seat.add(st);
  }
  arm.add(seat);

  g.position.y = SWING_TOP;               // 천장 쪽에 매단다
  g.userData.swingAt = (t) => Math.sin(t * 1.1) * 0.42;
  g.userData.tick = (t) => { arm.rotation.x = g.userData.swingAt(t); };
  return g;
}

// -----------------------------------------------------------
//  🎠 별 회전목마 — 별·달·구름 자리에 앉으면 빙글빙글 돈다
// -----------------------------------------------------------
export const CAROUSEL_R    = 5.2;    // 자리가 놓인 반지름
export const CAROUSEL_SEAT = 2.4;    // 앉는 높이
export const CAROUSEL_SPD  = 0.55;   // 도는 빠르기 (라디안/초)

export function makeStarCarousel() {
  const g = new THREE.Group();
  g.add(part('cyl', R.deep,   0, 0.12, 0, 15, 0.25, 15));          // 낮은 바닥판
  g.add(part('cyl', R.violet, 0, 0.27, 0, 14, 0.1, 14));

  const spin = new THREE.Group();                                   // 이 그룹이 돈다
  g.add(spin);
  spin.add(part('cyl', R.silver, 0, 8, 0, 1.4, 16, 1.4));           // 가운데 기둥

  // 지붕 (고깔) + 술 장식
  const roof = part('cone', R.rose, 0, 17.5, 0, 15, 5, 15);
  spin.add(roof);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    spin.add(part('ball', i % 2 ? R.star : R.ice,
                  Math.cos(a) * 7.2, 15.2, Math.sin(a) * 7.2, 0.7));
  }
  const topStar = makeStar(R.star, 2.0);
  topStar.position.y = 20.6;
  spin.add(topStar);

  // 자리 네 개 (별 · 달 · 구름 · 하트)
  const SEATS = 4;
  for (let i = 0; i < SEATS; i++) {
    const a = (i / SEATS) * Math.PI * 2;
    const x = Math.cos(a) * CAROUSEL_R, z = Math.sin(a) * CAROUSEL_R;
    spin.add(part('cyl', R.silver, x, 9, z, 0.3, 14, 0.3));         // 매다는 봉

    const seat = new THREE.Group();
    seat.position.set(x, CAROUSEL_SEAT - 0.7, z);
    seat.rotation.y = -a;
    if (i === 0) { const m = makeMoon(1.7); m.rotation.z = Math.PI * 0.5; seat.add(m); }
    else if (i === 1) { const s = makeStar(R.star, 1.7); seat.add(s); }
    else if (i === 2) { const h = makeHeart(R.rose, 1.7); seat.add(h); }
    else {
      for (const [dx, dy, r] of [[0,0,1.4], [1,-0.1,1.0], [-1,-0.1,1.0]]) {
        seat.add(part('ball', 0xffffff, dx, dy, 0, r));
      }
    }
    seat.add(part('box', R.moon, 0, 0.6, 0, 2.6, 0.35, 1.8, glow(R.moon)));  // 방석
    spin.add(seat);
  }

  g.userData.spin = spin;
  g.userData.tick = (t) => {
    spin.rotation.y = t * CAROUSEL_SPD;
    topStar.rotation.y = -t * 1.6;
  };
  return g;
}

// -----------------------------------------------------------
//  🌠 소원 우물 — 들여다보면 별빛이 찰랑거린다
//     userData.wish() 를 부르면 별똥별이 하늘로 날아간다
// -----------------------------------------------------------
export function makeWishWell() {
  const g = new THREE.Group();
  g.add(part('cyl', R.deep, 0, 1.0, 0, 6.4, 2.0, 6.4));
  g.add(part('cyl', R.violet, 0, 2.1, 0, 6.8, 0.4, 6.8));
  const water = part('cyl', R.ice, 0, 1.9, 0, 5.4, 0.2, 5.4, glow(R.ice));
  g.add(water);
  // 지붕
  for (const s of [-1, 1]) g.add(part('cyl', R.silver, s * 2.6, 4.4, 0, 0.4, 4.8, 0.4));
  const roof = part('cone', R.rose, 0, 7.6, 0, 8, 2.6, 8);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(part('cyl', R.silver, 0, 6.5, 0, 0.25, 0.25, 5.6));       // 두레박 봉

  // 별똥별 하나 (평소엔 숨어 있다)
  const shoot = makeStar(R.star, 1.1);
  shoot.visible = false;
  g.add(shoot);
  let fly = -1;

  g.userData.wish = () => { fly = 0; };
  g.userData.tick = (t, dt) => {
    water.position.y = 1.9 + Math.sin(t * 1.6) * 0.06;
    if (fly >= 0) {
      fly += dt * 0.6;
      if (fly >= 1) { fly = -1; shoot.visible = false; return; }
      shoot.visible = true;
      shoot.position.set(fly * 14, 2.4 + fly * 16, -fly * 6);
      shoot.scale.setScalar(1 - fly * 0.4);
      shoot.rotation.z = fly * 6;
    }
  };
  return g;
}

// -----------------------------------------------------------
//  🔭 별자리 돔 — 고리 세 개가 서로 다르게 돌아간다 (혼천의)
// -----------------------------------------------------------
export function makeConstellationDome() {
  const g = new THREE.Group();
  g.add(part('cyl', R.deep, 0, 0.6, 0, 8, 1.2, 8));
  g.add(part('cyl', R.violet, 0, 1.3, 0, 7, 0.3, 7));
  g.add(part('cyl', R.silver, 0, 3.0, 0, 1.0, 3.4, 1.0));

  const core = makeStar(R.moon, 1.5);
  core.position.y = 7.4;
  g.add(core);

  const rings = [];
  const cols = [R.star, R.ice, R.rose];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6 - i * 0.9, 0.22, 8, 40), glow(cols[i]));
    ring.position.y = 7.4;
    ring.rotation.x = Math.PI / 2 * (i === 0 ? 1 : 0.3 * i);
    ring.rotation.z = i * 0.7;
    ring.castShadow = false;
    g.add(ring);
    // 고리 위의 작은 별
    const st = makeStar(cols[i], 0.5);
    g.add(st);
    rings.push({ ring, st, r: 4.6 - i * 0.9, spd: 0.4 + i * 0.25 });
  }
  g.userData.tick = (t) => {
    core.rotation.y = t * 0.7;
    for (let i = 0; i < rings.length; i++) {
      const o = rings[i];
      o.ring.rotation.y = t * o.spd;
      const a = t * o.spd * 1.6 + i;
      o.st.position.set(Math.cos(a) * o.r, 7.4 + Math.sin(a) * o.r * 0.3, Math.sin(a) * o.r);
    }
  };
  return g;
}

// -----------------------------------------------------------
//  👑 달의 옥좌 — 초승달에 기대앉는 자리 (방석 윗면 = 2.4)
// -----------------------------------------------------------
export const THRONE_SEAT = 2.4;

export function makeMoonThrone() {
  const g = new THREE.Group();
  g.add(part('box', R.deep,   0, 0.35, 0, 11, 0.7, 8));            // 단상
  g.add(part('box', R.violet, 0, 0.9, -0.4, 9, 0.6, 6.6));
  g.add(part('box', R.ice,    0, 1.25, 1.0, 4.2, 0.1, 5.2, glow(R.ice)));  // 빛나는 길

  g.add(part('box', R.silver, 0, 1.9, -1.0, 4.4, 1.0, 3.4));       // 의자 받침
  g.add(part('box', R.moon,   0, 2.25, -1.0, 4.6, 0.6, 3.6, glow(R.moon))); // 방석
  const back = makeMoon(2.5);       // 등받이 초승달 (너무 크면 화면을 다 덮는다)
  back.position.set(0, 5.0, -2.6);
  g.add(back);
  for (const s of [-1, 1]) {
    g.add(part('box', R.silver, s * 2.2, 3.0, -1.0, 0.5, 0.5, 3.2));
    g.add(part('ball', R.ice, s * 2.2, 3.3, 0.6, 0.7));
  }
  const crown = makeStar(R.star, 1.2);
  crown.position.set(0, 7.6, -2.6);
  g.add(crown);
  g.userData.tick = (t) => { crown.rotation.y = t * 0.6; crown.position.y = 7.6 + Math.sin(t) * 0.2; };
  return g;
}

// -----------------------------------------------------------
//  💎 빛나는 수정 기둥 (바닥 장식)
// -----------------------------------------------------------
export function makeCrystal(color = R.ice, h = 4) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const s = 1 - i * 0.28;
    const c = part('cone', color, (i - 1) * 0.7, h * s / 2, (i % 2) * 0.5, 1.2 * s, h * s, 1.2 * s);
    c.material = glow(color);
    g.add(c);
  }
  g.add(part('cyl', R.deep, 0, 0.2, 0.2, 3.0, 0.4, 3.0));
  return g;
}

// -----------------------------------------------------------
//  🌌 밤하늘 천장 — 별이 반짝이고 큰 달이 떠 있다
// -----------------------------------------------------------
export function makeNightCeiling(w, d, h) {
  const g = new THREE.Group();
  const stars = [];
  for (let i = 0; i < 90; i++) {
    const st = makeStar(i % 5 === 0 ? R.ice : R.star, 0.22 + Math.random() * 0.28);
    st.position.set((Math.random() - 0.5) * w * 0.94, h - 0.6 - Math.random() * 4,
                    (Math.random() - 0.5) * d * 0.94);
    g.add(st);
    stars.push({ st, phase: Math.random() * 7, base: st.scale.x });
  }
  const moon = makeMoon(4.5);
  moon.position.set(w * 0.28, h - 5.5, -d * 0.28);
  moon.rotation.z = 0.4;
  g.add(moon);

  g.userData.tick = (t) => {
    for (const o of stars) {
      const k = o.base * (0.75 + Math.sin(t * 1.6 + o.phase) * 0.25);
      o.st.scale.setScalar(k);
    }
    moon.position.y = h - 5.5 + Math.sin(t * 0.5) * 0.3;
  };
  return g;
}

/** 밤하늘 바닥 무늬 (별이 박힌 대리석) */
export function nightFloorTexture() {
  const tex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#2a2760'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#332f72'; ctx.fillRect(0, 0, s / 2, s / 2);
    ctx.fillStyle = '#332f72'; ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
    ctx.strokeStyle = '#4a4595'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, s - 3, s - 3);
    ctx.fillStyle = '#ffe98a';
    for (const [x, y, r] of [[0.25, 0.3, 3], [0.72, 0.2, 2], [0.6, 0.75, 3], [0.15, 0.8, 2]]) {
      ctx.beginPath(); ctx.arc(s * x, s * y, r, 0, 7); ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
