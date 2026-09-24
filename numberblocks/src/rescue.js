// ===========================================================
//  🔦 친구 구하기 — 1~99가 밤 마을에 흩어져 있다
//  걸어가서 몸이 닿거나, 화면에서 톡 두드리면 구해진다 (버튼 없음).
//  구한 친구는 localStorage에 적어둬서 게임을 껐다 켜도 남는다.
//
//  ★ 친구가 흩어지는 범위·구할 수 있는 거리는 여기 맨 위에서 바꾼다.
// ===========================================================
import * as THREE from 'three';
import { createCharacter } from '../../src/characters.js';
import { FRIENDS } from './block-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const SPREAD_MIN  = 18;     // 광장 한가운데서 이만큼은 떨어져서
const SPREAD_MAX  = 118;    // 마을 끝(128) 안쪽까지 흩어진다
const TAP_REACH   = 20;     // 이 거리 안에서 두드려야 구해진다 (불빛이 닿는 거리쯤)
const TOUCH_REACH = 2.0;    // 몸이 이만큼 닿으면 저절로 구해진다 (아이템 먹듯이)
const RIDE_REACH  = 3.4;    // 🐴 말을 타고 있을 때는 말 몸집만큼 더 넓게
const NEAR_HINT   = 22;     // 이 거리 안에 친구가 있으면 머리 위 '!' 가 보인다
const JUMP_TIME   = 0.9;    // 구해질 때 폴짝 뛰는 시간 (초)
const SAVE_KEY    = 'nb-rescued';

const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

// '!' 표시 (모두가 같은 그림을 쓴다)
function exclaimMat() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffd93d'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5b3d8f'; g.font = 'bold 44px sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 32, 34);
  return new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false });
}

/** 저장된 '구한 친구' 번호 목록 */
export function loadRescued() {
  try { return new Set(JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')); }
  catch { return new Set(); }
}
export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('nb-day'); } catch {}
}

/**
 * world  : 마을 (scene, isBlocked)
 * camera : 두드린 자리를 3D로 쏘아 보는 데 쓴다
 * onRescue(def, count) : 구할 때마다 불린다
 */
export function createRescue(world, camera, onRescue) {
  const rescued = loadRescued();
  const lost = [];                          // 아직 못 찾은 친구들 { def, model, exclaim, halfW }
  const EXCLAIM = exclaimMat();
  const jumping = [];                       // 지금 폴짝 뛰며 사라지는 중인 친구들 { entry, t }

  // 흩어진 자리 정하기 — 번호를 씨앗으로 써서 껐다 켜도 같은 자리에 있다
  function seeded(n) { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function placeOf(n) {
    for (let k = 0; k < 30; k++) {
      const a = seeded(n * 31 + k) * Math.PI * 2;
      const r = SPREAD_MIN + Math.sqrt(seeded(n * 17 + k * 3)) * (SPREAD_MAX - SPREAD_MIN);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!world.isBlocked(x, z, 1.6)) return { x, z };
    }
    return { x: 0, z: 30 };
  }

  for (const def of FRIENDS) {
    if (rescued.has(def.number)) continue;
    const model = createCharacter(def, 'simple');
    model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
    model.userData.block = def;               // 머리 위 '!'를 두드려도 누구인지 알 수 있게
    const p = placeOf(def.number);
    model.position.set(p.x, 0, p.z);
    model.rotation.y = seeded(def.number) * Math.PI * 2;
    world.scene.add(model);

    const exclaim = new THREE.Sprite(EXCLAIM);
    exclaim.scale.set(0.7, 0.7, 1);
    exclaim.position.y = model.userData.height + 0.9;
    exclaim.visible = false;
    model.add(exclaim);

    lost.push({ def, model, exclaim, halfW: model.userData.halfW || 0.5 });
  }

  function rescue(entry) {
    if (!lost.includes(entry)) return;
    lost.splice(lost.indexOf(entry), 1);
    rescued.add(entry.def.number);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify([...rescued])); } catch {}
    jumping.push({ entry, t: 0 });
    entry.exclaim.visible = false;
    onRescue(entry.def, rescued.size);
  }

  /** 화면을 두드렸을 때 — 친구를 맞혔으면 구한다. 맞혔으면 true */
  function tap(clientX, clientY, playerPos) {
    _ndc.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    _ray.setFromCamera(_ndc, camera);
    const hits = _ray.intersectObjects(lost.map(e => e.model), true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.block) o = o.parent;
      const entry = o && lost.find(e => e.def === o.userData.block);
      if (!entry) continue;
      const q = entry.model.position;
      if (Math.hypot(q.x - playerPos.x, q.z - playerPos.z) > TAP_REACH) return false;
      rescue(entry);
      return true;
    }
    return false;
  }

  /** 가장 가까운 못 찾은 친구 (나침반이 가리킨다) */
  function nearest(playerPos) {
    let best = null, bd = Infinity;
    for (const e of lost) {
      const d = e.model.position.distanceTo(playerPos);
      if (d < bd) { bd = d; best = e; }
    }
    return best ? { entry: best, dist: bd } : null;
  }

  /**
   * playerPos : 내 자리,  riding : 🐴 말을 타고 있으면 true (닿는 거리를 넓힌다)
   *  ★ 거리는 **땅 위(x, z)로만** 잰다 — 말 위에 있거나 점프 중이면 높이가 더해져서
   *    바로 옆 친구도 못 구하던 버그가 있었다
   */
  function update(dt, t, playerPos, riding = false) {
    const reach = riding ? RIDE_REACH : TOUCH_REACH;
    for (const e of lost) {
      const q = e.model.position;
      const d = Math.hypot(q.x - playerPos.x, q.z - playerPos.z);
      e.exclaim.visible = d < NEAR_HINT;
      if (d < 60) e.model.userData.update?.(t, false);
      //  몸이 닿으면 저절로 구해진다 (친구 몸 반쪽 + 여유)
      if (d < e.halfW + reach) rescue(e);
    }
    // 구해진 친구는 폴짝 뛰고 나서 사라진다 (숫자의 집으로 간다)
    //  ★ 여러 명이 한꺼번에 뛰어도 된다 — 옆 친구를 바로 이어서 구할 수 있게
    for (let i = jumping.length - 1; i >= 0; i--) {
      const j = jumping[i];
      j.t += dt;
      const k = j.t / JUMP_TIME, m = j.entry.model;
      m.position.y = Math.sin(Math.min(1, k) * Math.PI) * 2.2;
      m.rotation.y += dt * 12;
      m.scale.setScalar(k < 0.7 ? 1 : Math.max(0.01, 1 - (k - 0.7) / 0.3));
      if (k >= 1) { world.scene.remove(m); jumping.splice(i, 1); }
    }
  }

  return {
    update, tap, nearest, rescued,
    get remaining() { return lost.length; },
    get allFound() { return lost.length === 0 && jumping.length === 0; },
  };
}
