// ===========================================================
//  🌙 밤 — 마을이 깜깜해지고, 나(100) 주변만 환하게 보인다
//  달님을 이기면 setDay()로 아침이 밝아온다 (몇 초에 걸쳐 스르륵).
//
//  ★ 조명 세기 · 안개 거리 · 불빛 색은 여기 맨 위에서 바꾼다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const NIGHT_BG    = 0x0b0f2a;   // 밤하늘 색
const DAY_BG      = 0xbfe8ff;   // 낮 하늘 색 (티니핑 월드와 같다)
const NIGHT_FOG   = [14, 46];   // 밤에는 이만큼만 보인다 [가까이, 멀리]
const DAY_FOG     = [190, 340];
const NIGHT_HEMI  = 0.22;       // 밤 전체 밝기 (0이면 완전히 깜깜)
const DAY_HEMI    = 1.1;
const NIGHT_SUN   = 0.08;       // 밤 달빛 (그림자용)
const DAY_SUN     = 1.6;
const LAMP_COLOR  = 0xfff0c2;   // 나를 감싸는 불빛 색
const LAMP_POWER  = 70;         // 불빛 세기
const LAMP_RANGE  = 26;         // 불빛이 닿는 거리 — 이 안에 있는 친구가 보인다
const LAMP_HEIGHT = 6;          // 불빛이 떠 있는 높이
const DAWN_TIME   = 7;          // 아침이 밝아오는 데 걸리는 시간 (초)
const STAR_COUNT  = 500;

const _c = new THREE.Color();

/**
 * scene / hemi / sun : main.js가 만든 마을 조명
 * 돌려주는 것 — { update(dt, playerPos), setDay(), isDay, lamp }
 */
export function createNight(scene, hemi, sun) {
  let day = 0;             // 0 = 한밤, 1 = 낮
  let target = 0;

  // 별 — 점 500개를 하늘에 뿌린다 (낮에는 사라진다)
  const pos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.3;
    const r = 300;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: true,
    transparent: true, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // 🌕 하늘의 큰 달 — 스스로 빛나서 안개에 가리지 않는다
  const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false }));
  moon.position.set(-120, 150, -200);
  scene.add(moon);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.18, fog: false }));
  halo.position.copy(moon.position);
  scene.add(halo);

  // 💡 나를 따라다니는 불빛
  const lamp = new THREE.PointLight(LAMP_COLOR, LAMP_POWER, LAMP_RANGE, 1.6);
  scene.add(lamp);

  scene.background = new THREE.Color(NIGHT_BG);
  scene.fog = new THREE.Fog(NIGHT_BG, NIGHT_FOG[0], NIGHT_FOG[1]);

  function apply() {
    const k = day;
    hemi.intensity = NIGHT_HEMI + (DAY_HEMI - NIGHT_HEMI) * k;
    sun.intensity = NIGHT_SUN + (DAY_SUN - NIGHT_SUN) * k;
    sun.color.setHex(0xfff6e0).lerp(_c.setHex(0x8fa8ff), 1 - k);
    scene.background.setHex(NIGHT_BG).lerp(_c.setHex(DAY_BG), k);
    scene.fog.color.copy(scene.background);
    scene.fog.near = NIGHT_FOG[0] + (DAY_FOG[0] - NIGHT_FOG[0]) * k;
    scene.fog.far = NIGHT_FOG[1] + (DAY_FOG[1] - NIGHT_FOG[1]) * k;
    lamp.intensity = LAMP_POWER * (1 - k);
    starMat.opacity = 1 - k;
    moon.material.opacity = 1;
    moon.visible = halo.visible = k < 0.95;
  }
  apply();

  function update(dt, playerPos) {
    if (playerPos) lamp.position.set(playerPos.x, playerPos.y + LAMP_HEIGHT, playerPos.z);
    if (day !== target) {
      day += Math.sign(target - day) * dt / DAWN_TIME;
      day = Math.max(0, Math.min(1, day));
      apply();
    }
  }

  return {
    update,
    /** 아침을 부른다 (instant=true면 바로 낮) */
    setDay(instant = false) { target = 1; if (instant) { day = 1; apply(); } },
    get isDay() { return day >= 1; },
    get progress() { return day; },
    lampRange: LAMP_RANGE,
  };
}
