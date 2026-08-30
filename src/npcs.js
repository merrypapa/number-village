// ===========================================================
//  NPC 친구들 — 마을을 걸어다니는 친구들
//  이름표, 말풍선, 인사 반응을 담당한다.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, createCharacter } from './characters.js';
import { WORLD_RADIUS } from './world.js';
import { findFreeRide, mountRide, applyRide, dismountRide } from './rides.js';

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

// --- 친구들도 놀이터에서 논다 ---
const RIDE_CHANCE   = 0.4;     // 쉬고 나서 그네·미끄럼틀을 타러 갈 확률 (0이면 안 간다)
const RIDE_REACH    = 50;      // 이 거리 안에 있을 때만 타러 간다 (너무 멀면 안 간다)
const RIDE_GIVEUP   = 25;      // 이만큼 걸었는데도 못 가면 포기한다 (초)

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
  // 공간마다 넓이가 다르다 (마을은 넓고, 성 안은 좁다 → world.wanderRadius)
  const radius = world.wanderRadius ?? WANDER_RADIUS;
  for (let i = 0; i < 15; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * Math.sqrt(Math.random());
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!world.isBlocked(x, z, NPC_RADIUS)) return out.set(x, 0, z);
  }
  return out.copy(world.spawn);   // 못 찾으면 처음 서는 자리로
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/** NPC들을 만들어 마을에 배치한다. playerCharId는 NPC 목록에서 제외할 캐릭터 id. */
export function createNPCs(scene, playerCharId, world, count = NPC_COUNT) {
  // 공간이 npcTypes를 정해두면 그 종류만 돌아다닌다
  //  (성 안은 숫자블록 친구만 — 요정 친구는 진열대에서 불러야 나온다)
  const pool = CHARACTERS.filter(c =>
    c.id !== playerCharId && (!world.npcTypes || world.npcTypes.includes(c.type)));
  const npcs = [];

  /**
   * 친구 한 명을 만들어 세운다.
   * pos를 주면 그 자리에, 안 주면 빈 자리를 아무 데나 골라 세운다.
   * (성 안 진열대에서 친구를 부를 때도 이 함수를 쓴다)
   */
  function addNpc(def, pos) {
    const model = createCharacter(def, 'simple');
    model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
    if (pos) model.position.set(pos.x, 0, pos.z);
    else pickSpot(world, model.position);
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

    const npc = {
      def, model, height,
      target: pickSpot(world, new THREE.Vector3()),
      resting: false,
      restTimer: 0,
      greetTimer: 0,
      stuckTimer: 0,      // 뭔가에 막혀서 못 가고 있는 시간
      ride: null,         // 지금 타고 있는 놀이기구
      rideTime: 0,        // 탄 지 몇 초 됐나
      goingTo: null,      // 타러 걸어가는 중인 놀이기구 (자리를 맡아둔 상태)
      walkTimer: 0,       // 놀이기구까지 걸은 시간 (너무 오래 걸리면 포기)
      exclaim,
    };
    npcs.push(npc);
    return npc;
  }

  /** 친구를 내보낸다 (성 안 진열대로 돌려보낼 때 쓴다) */
  function removeNpc(npc) {
    const i = npcs.indexOf(npc);
    if (i < 0) return;
    npcs.splice(i, 1);
    releaseTrip(npc);                                   // 맡아둔 놀이기구 자리를 놓아준다
    if (npc.ride) { npc.ride.rider = null; npc.ride = null; }
    if (greeted === npc) { bubble.visible = false; greeted = null; }
    scene.remove(npc.model);
  }

  for (let i = 0; i < count; i++) {
    addNpc(pool[Math.floor(Math.random() * pool.length)]);
  }

  // --- 놀이기구 (그네·미끄럼틀) 도우미 ---

  /** 맡아둔 놀이기구 자리를 놓아준다 (딴 데로 가거나 막혔을 때) */
  function releaseTrip(npc) {
    if (!npc.goingTo) return;
    npc.goingTo.rider = null;
    npc.goingTo = null;
  }

  /** 잠깐 쉬었다 간다 */
  function rest(npc) {
    npc.resting = true;
    npc.restTimer = REST_MIN + Math.random() * (REST_MAX - REST_MIN);
  }

  /** 다음엔 어디로 갈까? — 가끔은 놀이터에 놀러 간다 */
  function startNextTrip(npc) {
    const rides = world.rides;
    if (rides && Math.random() < RIDE_CHANCE) {
      const r = findFreeRide(rides, npc.model.position, RIDE_REACH);
      if (r) {
        mountRide(r, npc.model);      // 가는 동안 다른 친구가 못 가져가게 자리를 맡는다
        npc.goingTo = r;
        npc.walkTimer = 0;
        npc.target.set(r.enter.x, 0, r.enter.z);
        return;
      }
    }
    pickSpot(world, npc.target);
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

      // 놀이기구를 타는 중 — 걷지 않고 놀이기구가 자리를 정해준다
      if (npc.ride) {
        npc.rideTime += dt;
        if (applyRide(npc.ride, npc.model, npc.rideTime, t)) {
          dismountRide(npc.ride, npc.model);
          npc.ride = null;
          rest(npc);                     // 다 타고 나면 잠깐 쉬었다가 또 논다
        }
        continue;
      }

      // 너무 멀면 애니메이션(팔다리/통통 튀기) 업데이트만 건너뛴다
      const skipAnim = dist > SKIP_DIST;

      let moving = false;
      if (npc.resting) {
        npc.restTimer -= dt;
        if (npc.restTimer <= 0) {
          npc.resting = false;
          startNextTrip(npc);
        }
      } else {
        _tmpDir.copy(npc.target).sub(npc.model.position);
        _tmpDir.y = 0;
        const d = _tmpDir.length();
        if (d < 0.5) {
          if (npc.goingTo) {              // 놀이기구 앞에 도착했다 — 올라탄다!
            npc.ride = npc.goingTo;
            npc.goingTo = null;
            npc.rideTime = 0;
          } else {
            rest(npc);
          }
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
            releaseTrip(npc);             // 맡아둔 놀이기구가 있으면 다른 친구에게 양보
            pickSpot(world, npc.target);
            npc.stuckTimer = 0;
          }

          // 놀이기구가 너무 멀어서 한참 걸으면 포기하고 딴 데로 간다
          if (npc.goingTo) {
            npc.walkTimer += dt;
            if (npc.walkTimer > RIDE_GIVEUP) {
              releaseTrip(npc);
              pickSpot(world, npc.target);
            }
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

  return { update, greetNearest, add: addNpc, remove: removeNpc };
}
