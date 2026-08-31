// ===========================================================
//  🧚 요정 친구 진열대 — 성 서쪽 회랑에 친구들이 마주 보고 서 있다
//
//  친구 앞에 가면 '부르기' 버튼이 나온다. 누르면 그 친구가 깨어나서
//  성 안을 돌아다니기 시작한다. 한 번 더 누르면('보내기') 제자리로 돌아간다.
//
//  ★ characters.js에 요정 친구(type:'model')를 한 줄 추가하면
//    이 진열대에도 자동으로 나타난다. 이 파일은 고치지 않아도 된다.
//
//  ★ 친구가 35명이라 한 줄로 세우면 다닥다닥 붙는다.
//    그래서 **줄 두 개가 복도를 사이에 두고 마주 보게** 세운다.
//    (아이는 가운데 길로 걸어가면서 양옆 친구를 부른다)
//    줄을 더 늘리고 싶으면 ROWS에 한 줄 더 적으면 된다.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, createCharacter } from './characters.js';
import { C, part, makeHeart } from './castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const STAND_H   = 1.02;    // 받침대 높이 (친구는 이 위에 선다)
const REACH     = 2.4;     // 이만큼 가까이 가면 '부르기' 버튼이 나온다

// 어디에 줄을 세울지는 castle-interior.js가 정해준다 (기본값은 아래)
//   gap    : 친구와 친구 사이 간격 ← 다닥다닥 붙으면 이 값을 키운다
//            (친구가 너무 많으면 줄 길이에 맞춰 자동으로 좁아진다)
//   z0, z1 : 줄이 놓일 앞뒤 범위 (벽을 넘지 않게)
//   rows   : 줄 목록. x = 줄이 선 자리, face = 바라보는 쪽(+1이면 +x)
const DEFAULTS = {
  gap: 3.4,
  z0: -36, z1: 14,
  rows: [
    { x: -32.4, face:  1 },   // 서쪽 벽에 붙은 줄 (복도 쪽을 본다)
    { x: -19.5, face: -1 },   // 복도 건너 줄 (마주 본다)
  ],
};

// -----------------------------------------------------------
//  이름표 (Canvas 글씨 → 항상 화면을 바라보는 스프라이트)
// -----------------------------------------------------------
function nameSprite(text) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 38px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeText(text, 128, 32);
  ctx.fillStyle = '#5b3d8f';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.set(1.7, 0.42, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// -----------------------------------------------------------
//  진열대 만들기
// -----------------------------------------------------------
/**
 * playerCharId : 지금 내가 고른 캐릭터 (나 자신은 진열대에서 빼둔다)
 * opts          : { gap, z0, z1, rows } — 줄을 세울 자리와 간격
 * 돌려주는 것 —
 *   group     : 화면에 넣을 3D 덩어리
 *   obstacles : 부딪히는 자리 (받침대)
 *   spots     : 말 걸 수 있는 자리 목록 (main.js가 '부르기'를 처리한다)
 *   update(t) : 매 프레임 — 서 있는 친구들을 둥실둥실 움직인다
 */
export function buildGallery(playerCharId, opts = {}) {
  const { gap: GAP, z0: Z0, z1: Z1, rows: ROWS } = { ...DEFAULTS, ...opts };
  const defs = CHARACTERS.filter(c => c.type === 'model' && c.id !== playerCharId);
  const group = new THREE.Group();
  const obstacles = [];
  const spots = [];
  const statues = [];

  // 줄마다 몇 명씩 설지 — 친구를 줄 수만큼 나눠 세운다
  const perRow = Math.ceil(defs.length / ROWS.length);
  // 간격은 되도록 GAP만큼. 친구가 많아 자리가 모자라면 줄 길이에 맞춰 좁힌다
  const step = perRow > 1 ? Math.min(GAP, (Z1 - Z0) / (perRow - 1)) : 0;
  const zStart = (Z0 + Z1) / 2 - step * (perRow - 1) / 2;

  // 줄 앞에 깔린 붉은 융단
  for (const row of ROWS) {
    const carpet = part('box', C.red, row.x + row.face * 0.8, 0.05, (Z0 + Z1) / 2,
                        5.6, 0.1, step * (perRow - 1) + 4);
    carpet.castShadow = false;
    group.add(carpet);
  }

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const row = ROWS[Math.floor(i / perRow)] || ROWS[ROWS.length - 1];
    const x = row.x;
    const z = zStart + (i % perRow) * step;
    const yaw = row.face * Math.PI / 2;     // 복도 쪽을 바라보게

    // 받침대 (바닥판 + 기둥 + 금색 윗판 + 방석)
    group.add(part('cyl', C.violet, x, 0.12, z, 2.3, 0.24, 2.3));
    group.add(part('cyl', C.stone,  x, 0.5,  z, 1.5, 0.8, 1.5));
    group.add(part('cyl', C.gold,   x, 0.9,  z, 2.0, 0.2, 2.0));
    group.add(part('cyl', C.pink,   x, 1.0,  z, 1.7, 0.08, 1.7));

    // 친구 인형
    const statue = createCharacter(def, 'simple');
    statue.position.set(x, STAND_H, z);
    statue.rotation.y = yaw;
    statue.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
    group.add(statue);
    statues.push(statue);

    // 이름표
    const tag = nameSprite(def.name);
    tag.position.set(x, STAND_H + (def.height ?? 1.9) + 0.5, z);
    group.add(tag);

    // 친구가 놀러 나가고 없을 때 자리에 남는 하트
    const heart = makeHeart(C.pink, 0.75);
    heart.position.set(x, STAND_H + 0.8, z);
    heart.rotation.y = yaw;
    heart.visible = false;
    group.add(heart);

    obstacles.push({ x, z, r: 1.25, y0: -1, y1: 3.5 });      // 1층에서만 막는다

    spots.push({
      kind: 'summon',
      def,
      x: x + row.face * 2.6, z, r: REACH, y: 0,              // 여기 서면 버튼이 나온다
                                                             //  y = 이 자리가 있는 층(1층)
      spawnAt: new THREE.Vector3(x + row.face * 3.4, 0, z),  // 친구가 나와서 서는 자리
      npc: null,                             // 지금 나와서 돌아다니는 친구 (없으면 null)
      /** out = true면 놀러 나간 상태 (인형 대신 하트를 보여준다) */
      setOut(out) { statue.visible = !out; heart.visible = out; },
    });
  }

  /** 서 있는 친구들이 둥실둥실 숨쉬게 한다 */
  function update(t) {
    for (const s of statues) {
      if (s.visible) s.userData.update?.(t, false);
    }
  }

  return { group, obstacles, spots, update };
}
