// ===========================================================
//  🔦 친구 구하기 — 1~99가 밤 마을과 성 안에 흩어져 있다
//  걸어가서 몸이 닿거나, 화면에서 톡 두드리면 구해진다 (버튼 없음).
//  구한 친구는 localStorage에 적어둬서 게임을 껐다 켜도 남는다.
//
//  ★ 자리는 게임을 켤 때마다 새로 뽑는다 (매번 다른 곳에 숨어 있다).
//  ★ 일부는 🏰 성 안(인하성·루하성·엄마성·아빠성)에 숨는다. 성 안은 처음 들어갈 때
//    만들어지므로, travel.js가 attachArea()로 알려주면 그때 그 친구들을 세운다.
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
//  🏰 성 안에 숨는 친구 — 어느 성에, 몇 명씩 (문 이름 = world.doors의 to)
const INSIDE = { castle: 7, ruha: 5, mom: 5, dad: 5 };
const INSIDE_LABEL = { castle: '인하성', ruha: '루하성', mom: '엄마성', dad: '아빠성' };

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
 * world  : 마을 (scene, isBlocked, doors)
 * camera : 두드린 자리를 3D로 쏘아 보는 데 쓴다
 * onRescue(def, count) : 구할 때마다 불린다
 */
export function createRescue(world, camera, onRescue) {
  const rescued = loadRescued();
  const lost = [];                 // 아직 못 찾은 친구들 { def, area, model, exclaim, halfW }
  const EXCLAIM = exclaimMat();
  const jumping = [];              // 지금 폴짝 뛰며 사라지는 중인 친구들 { entry, t }
  const areas = { village: world };
  let current = 'village';         // 아이가 지금 있는 공간 이름

  // 🎲 게임을 켤 때마다 다른 자리 — 씨앗을 매번 새로 뽑는다
  const seed = Math.random() * 1e6;
  function rnd(k) { const x = Math.sin(seed + k * 9301) * 233280; return x - Math.floor(x); }

  /** 마을 자리 — 광장에서 떨어진 곳, 건물·나무 위는 피한다 */
  function villageSpot(n) {
    for (let k = 0; k < 30; k++) {
      const a = rnd(n * 31 + k) * Math.PI * 2;
      const r = SPREAD_MIN + Math.sqrt(rnd(n * 17 + k * 3)) * (SPREAD_MAX - SPREAD_MIN);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!world.isBlocked(x, z, 1.6)) return { x, z };
    }
    return { x: 0, z: 30 };
  }
  /** 성 안 자리 — 그 공간이 친구들 노는 곳으로 적어둔 방(wanderZones, 1층만) 안에서 */
  function insideSpot(area, n) {
    const zones = (area.wanderZones || [{ x: area.spawn.x, z: area.spawn.z - 6, r: 6 }]).filter(z => !z.y);
    for (let k = 0; k < 30; k++) {
      const zone = zones[Math.floor(rnd(n * 13 + k) * zones.length)];
      const a = rnd(n * 7 + k * 5) * Math.PI * 2;
      const r = zone.r * Math.sqrt(rnd(n * 3 + k * 11));
      const x = zone.x + Math.cos(a) * r, z = zone.z + Math.sin(a) * r;
      if (!area.isBlocked(x, z, 1.2)) return { x, z };
    }
    return { x: area.spawn.x, z: area.spawn.z - 4 };
  }

  /** 친구를 어느 공간에 숨길지 나눈다 — INSIDE 만큼은 성 안, 나머지는 마을 */
  const shuffled = FRIENDS.filter(d => !rescued.has(d.number))
    .map((d, i) => ({ d, k: rnd(1000 + i) })).sort((a, b) => a.k - b.k).map(o => o.d);
  let at = 0;
  for (const [name, count] of Object.entries(INSIDE)) {
    for (let i = 0; i < count && at < shuffled.length; i++, at++) lost.push({ def: shuffled[at], area: name, model: null });
  }
  for (; at < shuffled.length; at++) lost.push({ def: shuffled[at], area: 'village', model: null });

  /** 친구 한 명을 그 공간에 세운다 */
  function place(entry, area, p) {
    const model = createCharacter(entry.def, 'simple');
    model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
    model.userData.block = entry.def;         // 머리 위 '!'를 두드려도 누구인지 알 수 있게
    model.position.set(p.x, 0, p.z);
    model.rotation.y = rnd(entry.def.number) * Math.PI * 2;
    area.scene.add(model);
    const exclaim = new THREE.Sprite(EXCLAIM);
    exclaim.scale.set(0.7, 0.7, 1);
    exclaim.position.y = model.userData.height + 0.9;
    exclaim.visible = false;
    model.add(exclaim);
    Object.assign(entry, { model, exclaim, halfW: model.userData.halfW || 0.5 });
  }
  for (const e of lost) if (e.area === 'village') place(e, world, villageSpot(e.def.number));

  /** 성 안 공간이 만들어졌을 때 — 거기 숨은 친구들을 세운다 (travel.js가 부른다) */
  function attachArea(name, area) {
    if (areas[name]) return;
    areas[name] = area;
    for (const e of lost) if (e.area === name && !e.model) place(e, area, insideSpot(area, e.def.number));
  }
  function setArea(name) { current = name; }

  function rescue(entry) {
    if (!lost.includes(entry)) return;
    lost.splice(lost.indexOf(entry), 1);
    rescued.add(entry.def.number);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify([...rescued])); } catch {}
    jumping.push({ entry, t: 0 });
    entry.exclaim.visible = false;
    onRescue(entry.def, rescued.size);
  }

  const here = () => lost.filter(e => e.area === current && e.model);

  /** 화면을 두드렸을 때 — 친구를 맞혔으면 구한다. 맞혔으면 true */
  function tap(clientX, clientY, playerPos) {
    _ndc.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    _ray.setFromCamera(_ndc, camera);
    const list = here();
    const hits = _ray.intersectObjects(list.map(e => e.model), true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.block) o = o.parent;
      const entry = o && list.find(e => e.def === o.userData.block);
      if (!entry) continue;
      const q = entry.model.position;
      if (Math.hypot(q.x - playerPos.x, q.z - playerPos.z) > TAP_REACH) return false;
      rescue(entry);
      return true;
    }
    return false;
  }

  /**
   * 🧭 나침반이 가리킬 곳 — { x, z, dist, label }
   *   지금 공간에 친구가 남았으면 가장 가까운 친구, 없으면 친구가 남은 성의 문 (마을) / 나가는 문 (성 안)
   */
  function nearest(playerPos) {
    let best = null, bd = Infinity;
    for (const e of here()) {
      const d = Math.hypot(e.model.position.x - playerPos.x, e.model.position.z - playerPos.z);
      if (d < bd) { bd = d; best = { x: e.model.position.x, z: e.model.position.z, dist: d, label: '' }; }
    }
    if (best) return best;
    if (current === 'village') {
      for (const name of Object.keys(INSIDE)) {
        if (!lost.some(e => e.area === name)) continue;
        const door = world.doors.find(d => d.to === name);
        if (!door) continue;
        const d = Math.hypot(door.x - playerPos.x, door.z - playerPos.z);
        if (d < bd) { bd = d; best = { x: door.x, z: door.z, dist: d, label: `${INSIDE_LABEL[name]} 안에!` }; }
      }
      return best;
    }
    const exit = areas[current]?.doors?.[0];                  // 성 안: 나가는 문
    return exit && lost.length ? { x: exit.x, z: exit.z, dist: Math.hypot(exit.x - playerPos.x, exit.z - playerPos.z), label: '밖으로!' } : null;
  }

  /**
   * playerPos : 내 자리,  riding : 🐴 말을 타고 있으면 true (닿는 거리를 넓힌다)
   *  ★ 거리는 **땅 위(x, z)로만** 잰다 — 말 위에 있거나 점프 중이면 높이가 더해져서
   *    바로 옆 친구도 못 구하던 버그가 있었다
   */
  function update(dt, t, playerPos, riding = false) {
    const reach = riding ? RIDE_REACH : TOUCH_REACH;
    for (const e of here()) {
      const q = e.model.position;
      const d = Math.hypot(q.x - playerPos.x, q.z - playerPos.z);
      e.exclaim.visible = d < NEAR_HINT;
      if (d < 60) e.model.userData.update?.(t, false);
      if (d < e.halfW + reach) rescue(e);      // 몸이 닿으면 저절로 구해진다
    }
    // 구해진 친구는 폴짝 뛰고 나서 사라진다 (숫자의 집으로 간다). 여러 명이 한꺼번에 뛰어도 된다
    for (let i = jumping.length - 1; i >= 0; i--) {
      const j = jumping[i];
      j.t += dt;
      const k = j.t / JUMP_TIME, m = j.entry.model;
      m.position.y = Math.sin(Math.min(1, k) * Math.PI) * 2.2;
      m.rotation.y += dt * 12;
      m.scale.setScalar(k < 0.7 ? 1 : Math.max(0.01, 1 - (k - 0.7) / 0.3));
      if (k >= 1) { m.parent?.remove(m); jumping.splice(i, 1); }
    }
  }

  return {
    update, tap, nearest, rescued, attachArea, setArea,
    get remaining() { return lost.length; },
    get allFound() { return lost.length === 0 && jumping.length === 0; },
  };
}
