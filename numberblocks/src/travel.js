// ===========================================================
//  🚪 공간 오가기 — 마을 · 성 안 · 마트 · 친구 집 · 숫자의 집
//  (티니핑 월드 main.js의 문 처리 부분을 떼어 왔다)
//
//  티니핑 월드와 다른 점 —
//    · 요정 친구(집주인·점원·진열대)는 넣지 않는다
//    · 구한 숫자 친구는 '숫자의 집'(numbers) 안을 걸어 다닌다
//    · 낮이 되면 마을에도 나와서 논다
// ===========================================================
import { createNPCs } from '../../src/npcs.js';
import { buildCastleInterior } from '../../src/castle-interior.js';
import { SAME_FLOOR } from '../../src/rides.js';
import { blockOf } from './block-data.js';

/**
 * ctx = { world, envMap, charId, music, player(), toast, rescued: Set }
 */
export function createTravel(ctx) {
  const areas = { village: ctx.world };
  const areaNpcs = {};
  const inHouse = new Set();       // 숫자의 집에 이미 들어간 친구 번호
  const inVillage = new Set();     // 낮에 마을에 나와 노는 친구 번호
  let area = ctx.world;
  let npcs = null;
  const fade = document.getElementById('fade');
  let doorArmed = false, moving = false;

  function getArea(name, door) {
    if (!areas[name]) {
      const c = { envMap: ctx.envMap, charId: ctx.charId, music: ctx.music, count: () => ctx.rescued.size };
      areas[name] = door?.build ? door.build(c) : buildCastleInterior(ctx.envMap, ctx.charId, { gallery: false });
    }
    const a = areas[name];
    //  돌아다니는 친구는 0명으로 만든다 — 요정 친구는 이 월드에 없다
    if (!areaNpcs[name]) areaNpcs[name] = createNPCs(a.scene, ctx.charId, a, 0);
    return a;
  }

  /** 숫자의 집에 구한 친구를 채워 넣는다 (들어갈 때마다 새로 구한 친구만 더한다) */
  function fillHouse(made) {
    for (const n of ctx.rescued) {
      if (inHouse.has(n) || inVillage.has(n)) continue;
      inHouse.add(n);
      made.add(blockOf(n));
    }
  }

  /** ☀️ 낮이 되면 친구들이 마을로 나온다 (많으면 느려지니 일부만) */
  function releaseToVillage(count = 40) {
    npcs = areaNpcs.village ??= createNPCs(ctx.world.scene, ctx.charId, ctx.world, 0);
    const list = [...ctx.rescued].filter(n => !inVillage.has(n));
    for (let i = 0; i < count && list.length; i++) {
      const n = list.splice(Math.floor(Math.random() * list.length), 1)[0];
      inVillage.add(n);
      areaNpcs.village.add(blockOf(n));
    }
  }

  function checkDoors() {
    if (moving) return;
    const player = ctx.player();
    const p = player.model.position;
    let hit = null;
    for (const d of area.doors || []) {
      if (Math.abs(player.footY - (d.y ?? 0)) > SAME_FLOOR) continue;
      if (Math.hypot(p.x - d.x, p.z - d.z) < d.r) { hit = d; break; }
    }
    if (!hit) { doorArmed = true; return; }
    if (!doorArmed) return;
    goThroughDoor(hit);
  }

  function goThroughDoor(door) {
    moving = true;
    doorArmed = false;
    fade.classList.add('on');
    setTimeout(() => {
      const player = ctx.player();
      area.onLeave?.(player);
      area = getArea(door.to, door);
      //  ★ 문 이름은 'art'(그림의 집 자리)지만 안쪽 공간 이름은 'numbers'다 → 공간 이름으로 본다
      if (area.name === 'numbers') fillHouse(areaNpcs[door.to]);
      npcs = areaNpcs[door.to];
      ctx.music.setScene(area.name);
      player.moveTo(area, door.arrive, door.arriveYaw);
      area.onEnter?.(player);
      fade.classList.remove('on');
      moving = false;
      ctx.toast(door.label);
    }, 320);
  }

  return {
    checkDoors, releaseToVillage,
    get area() { return area; },
    get npcs() { return npcs; },
    get inVillage() { return area === ctx.world; },
    /** 마을 NPC 묶음을 만들어 둔다 (처음 시작할 때) */
    initVillage() { npcs = areaNpcs.village = createNPCs(ctx.world.scene, ctx.charId, ctx.world, 0); },
  };
}
