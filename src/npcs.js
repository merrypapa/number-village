// ===========================================================
//  NPC 친구들 — 마을을 걸어다니는 친구들
//  이름표, 말풍선, 인사 반응을 담당한다.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, createCharacter } from './characters.js';
import { WORLD_RADIUS } from './world.js';

// --- 아이가 바꿔볼 수 있는 값들 ---
const NPC_COUNT     = 24;      // 마을에 돌아다니는 친구 수
const WALK_SPEED    = 2.4;     // NPC 걷기 속도 (천천히)
const REST_MIN      = 1;       // 도착 후 쉬는 시간 (최소, 초)
const REST_MAX      = 3;       // 도착 후 쉬는 시간 (최대, 초)
const WANDER_RADIUS = WORLD_RADIUS - 8;  // NPC가 돌아다니는 반경
const NEAR_DIST     = 6;       // 이 거리 안이면 '!' 표시
const SKIP_DIST     = 45;      // 이 거리보다 멀면 애니메이션 업데이트 생략
const NPC_RADIUS    = 0.7;     // NPC 몸 굵기 (물건에 부딪히는 크기)
const BUBBLE_TIME   = 3;       // 말풍선 유지 시간 (초)
const GREET_REACT   = 1.0;     // 인사할 때 폴짝/흔들기 반응 시간 (초)

// 인사할 때 나오는 대사 (8개 이상)
const PHRASES = [
  '안녕!', '같이 놀자~', '오늘 날씨 좋다!', '반가워!',
  '너 오늘 멋지다!', '우리 친구 하자!', '심심했는데 잘 왔다!', '다음에 또 놀자!',
];

const _tmpDir = new THREE.Vector3();

// 받침 유무에 따라 '을/를' 조사를 골라 붙인다 (예: 구름 → 구름을, 하나 → 하나를)
function withObjectParticle(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return name + (hasBatchim ? '을' : '를');
}

// -----------------------------------------------------------
//  이름표 (Canvas → Sprite), 이름이 같으면 재사용
// -----------------------------------------------------------
const _nameMatCache = new Map();
function nameSpriteMaterial(text) {
  if (_nameMatCache.has(text)) return _nameMatCache.get(text);
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 40px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeText(text, 128, 32);
  ctx.fillStyle = '#5b3d8f';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  _nameMatCache.set(text, mat);
  return mat;
}

// -----------------------------------------------------------
//  '!' 표시 — 모든 NPC가 같은 그림을 공유한다
// -----------------------------------------------------------
const EXCLAIM_MAT = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 7; ctx.strokeStyle = '#fff';
  ctx.strokeText('!', 32, 34);
  ctx.fillStyle = '#ff5a5a';
  ctx.fillText('!', 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
})();

// -----------------------------------------------------------
//  말풍선 — 화면에 하나만 만들어서 인사한 친구 위로 옮겨 다닌다
// -----------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeBubbleSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 140;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.6, 1.14, 1);
  sprite.renderOrder = 20;
  sprite.visible = false;

  sprite.userData.setText = (text) => {
    const w = canvas.width, h = canvas.height - 20;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5b3d8f';
    ctx.lineWidth = 6;
    roundRect(ctx, 8, 8, w - 16, h - 16, 26);
    ctx.fill(); ctx.stroke();
    // 꼬리
    ctx.beginPath();
    ctx.moveTo(w / 2 - 16, h - 10);
    ctx.lineTo(w / 2, h + 16);
    ctx.lineTo(w / 2 + 16, h - 10);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill(); ctx.stroke();

    // 긴 대사도 말풍선 밖으로 넘치지 않게 글자 크기를 줄인다
    ctx.fillStyle = '#3a2a55';
    let size = 34;
    const font = (px) => `bold ${px}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
    ctx.font = font(size);
    while (ctx.measureText(text).width > w - 56 && size > 16) {
      size -= 2;
      ctx.font = font(size);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 - 6);
    tex.needsUpdate = true;
  };
  return sprite;
}

// -----------------------------------------------------------
//  마을 안 랜덤 지점 (원형 지역 안에서 고르게 분포)
//  나무나 집 안쪽은 피해서 고른다. out 벡터에 담아준다.
// -----------------------------------------------------------
function pickSpot(world, out) {
  for (let i = 0; i < 15; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = WANDER_RADIUS * Math.sqrt(Math.random());
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!world.isBlocked(x, z, NPC_RADIUS)) return out.set(x, 0, z);
  }
  return out.set(0, 0, 18);   // 못 찾으면 광장 근처로
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/** NPC들을 만들어 마을에 배치한다. playerCharId는 NPC 목록에서 제외할 캐릭터 id. */
export function createNPCs(scene, playerCharId, world, count = NPC_COUNT) {
  const pool = CHARACTERS.filter(c => c.id !== playerCharId);
  const npcs = [];

  for (let i = 0; i < count; i++) {
    const def = pool[Math.floor(Math.random() * pool.length)];
    const model = createCharacter(def);
    model.traverse(o => { if (o.isMesh) o.castShadow = true; });
    pickSpot(world, model.position);
    scene.add(model);

    const height = model.userData.height || 1.4;

    const nameTag = new THREE.Sprite(nameSpriteMaterial(def.name));
    nameTag.scale.set(1.5, 0.38, 1);
    nameTag.position.y = height + 0.7;
    nameTag.renderOrder = 10;
    model.add(nameTag);

    const exclaim = new THREE.Sprite(EXCLAIM_MAT);
    exclaim.scale.set(0.5, 0.5, 1);
    exclaim.position.y = height + 1.25;
    exclaim.renderOrder = 10;
    exclaim.visible = false;
    model.add(exclaim);

    npcs.push({
      def, model, height,
      target: pickSpot(world, new THREE.Vector3()),
      resting: false,
      restTimer: 0,
      greetTimer: 0,
      stuckTimer: 0,      // 뭔가에 막혀서 못 가고 있는 시간
      exclaim,
    });
  }

  const bubble = makeBubbleSprite();
  scene.add(bubble);
  let greeted = null;      // 현재 말풍선을 띄우고 있는 NPC
  let bubbleTimer = 0;

  function update(dt, t, playerPos) {
    let nearest = null, nearestDist = Infinity;

    for (const npc of npcs) {
      const dist = npc.model.position.distanceTo(playerPos);
      if (dist < nearestDist) { nearestDist = dist; nearest = npc; }

      npc.exclaim.visible = dist < NEAR_DIST && npc !== greeted;

      if (npc.greetTimer > 0) npc.greetTimer -= dt;

      // 너무 멀면 애니메이션(팔다리/통통 튀기) 업데이트만 건너뛴다
      const skipAnim = dist > SKIP_DIST;

      let moving = false;
      if (npc.resting) {
        npc.restTimer -= dt;
        if (npc.restTimer <= 0) {
          pickSpot(world, npc.target);
          npc.resting = false;
        }
      } else {
        _tmpDir.copy(npc.target).sub(npc.model.position);
        _tmpDir.y = 0;
        const d = _tmpDir.length();
        if (d < 0.4) {
          npc.resting = true;
          npc.restTimer = REST_MIN + Math.random() * (REST_MAX - REST_MIN);
        } else {
          const fromX = npc.model.position.x, fromZ = npc.model.position.z;
          _tmpDir.normalize();
          npc.model.position.addScaledVector(_tmpDir, WALK_SPEED * dt);
          world.collide(npc.model.position, NPC_RADIUS);   // 물건은 뚫고 가지 않는다

          const want = Math.atan2(_tmpDir.x, _tmpDir.z);
          let diff = want - npc.model.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          npc.model.rotation.y += diff * Math.min(1, 6 * dt);
          moving = true;

          // 뭔가에 막혀 제자리걸음이면 잠시 뒤 다른 곳으로 목적지를 바꾼다
          const gone = Math.hypot(npc.model.position.x - fromX, npc.model.position.z - fromZ);
          npc.stuckTimer = gone < WALK_SPEED * dt * 0.3 ? npc.stuckTimer + dt : 0;
          if (npc.stuckTimer > 0.8) {
            pickSpot(world, npc.target);
            npc.stuckTimer = 0;
          }
        }
      }

      if (!skipAnim) {
        npc.model.userData.update?.(t, moving || npc.greetTimer > 0);
      }
    }

    if (greeted) {
      bubbleTimer -= dt;
      bubble.position.copy(greeted.model.position);
      bubble.position.y += greeted.height + 1.3;
      if (bubbleTimer <= 0) {
        bubble.visible = false;
        greeted = null;
      }
    }

    return nearest;
  }

  /** 가장 가까운 NPC에게 인사한다. 말풍선 + 반응 + 토스트를 보여준다. */
  function greetNearest(playerPos, onMeet) {
    if (npcs.length === 0) return;
    let nearest = npcs[0], nearestDist = Infinity;
    for (const npc of npcs) {
      const dist = npc.model.position.distanceTo(playerPos);
      if (dist < nearestDist) { nearestDist = dist; nearest = npc; }
    }

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    bubble.userData.setText(phrase);
    bubble.visible = true;
    bubbleTimer = BUBBLE_TIME;
    greeted = nearest;
    nearest.exclaim.visible = false;
    nearest.greetTimer = GREET_REACT;

    onMeet?.(withObjectParticle(nearest.def.name));
  }

  return { update, greetNearest };
}
