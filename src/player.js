// ===========================================================
//  플레이어 조작 + 3인칭 추적 카메라
//  7세 기준: 카메라를 안 만져도 알아서 뒤를 따라온다
//  키보드(화살표·스페이스)와 터치(가상 조이스틱)를 둘 다 받는다
// ===========================================================
import * as THREE from 'three';
import { findFreeRide, mountRide, applyRide, dismountRide } from './rides.js';

// --- 아이가 바꿔볼 수 있는 값들 ---
const WALK_SPEED = 12;      // 걷기 속도
const RUN_SPEED  = 20;      // Shift 눌렀을 때
const TURN_SPEED = 10;      // 몸이 도는 속도
const CAM_DIST   = 14;      // 카메라 거리 (좁은 곳은 area.camDist로 더 가깝게 한다)
const CAM_HEIGHT = 7;       // 카메라 높이
const LOOK_HEIGHT = 4;      // 카메라가 바라보는 높이 (키우면 하늘이 더 보인다)
const BODY_R     = 0.8;     // 몸 굵기 (이만큼 물건에서 떨어져 선다)

// --- 점프 ---
const JUMP_POWER = 9;       // 점프 힘 (크게 하면 더 높이 뛴다)
const GRAVITY    = 26;      // 중력 (크게 하면 빨리 떨어진다)
const CAM_FOLLOW = 0.25;    // 점프할 때 카메라가 같이 올라가는 정도 (0이면 안 따라감)

// --- 계단 · 2층 ---
//  성 안처럼 층이 있는 곳은 area.groundY(x, z, 지금높이)가 바닥 높이를 알려준다.
const STEP_UP = 0.85;       // 이만큼 낮은 턱(계단 한 칸)은 그냥 오르내린다
                            //  이보다 더 낮으면 낭떠러지 → 떨어진다

// --- 놀이기구 타기 ---
const RIDE_REACH = 3.2;     // 그네·미끄럼틀에 이만큼 가까이 가면 탈 수 있다

// --- 🐴 말 타고 달리기 ---
const HORSE_R    = 1.8;     // 말 몸 굵기 (이만큼 물건에서 떨어진다)

/** 말 걸 수 있는 자리(진열대 앞 등) 중 가장 가까운 것을 찾는다. 없으면 null */
function findNearestSpot(spots, pos) {
  if (!spots) return null;
  let best = null, bestDist = Infinity;
  for (const s of spots) {
    const d = Math.hypot(pos.x - s.x, pos.z - s.z);
    if (d < s.r && d < bestDist) { bestDist = d; best = s; }
  }
  return best;
}

const _dir = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _look = new THREE.Vector3();

export function createPlayer(model, camera, world) {
  // 지금 있는 공간 (마을 / 성 안). moveTo로 갈아끼운다.
  let area = world;
  model.position.copy(area.spawn);

  const keys = new Set();
  let camYaw = 0;            // 카메라 좌우 각도
  let dragId = null, lastX = 0;   // 화면을 끌어서 카메라 돌리기 (손가락 하나만)
  // joy는 src/touch.js의 가상 조이스틱이 채워준다. mag = 얼마나 많이 밀었나(0~1)
  const joy = { x: 0, y: 0, mag: 0, active: false };

  // 위아래 상태 (점프 · 계단 · 2층)
  let footY = 0;             // 발이 딛고 있는 높이 (1층이면 0, 2층이면 7.5)
  let floorRef = 0;          // 마지막으로 땅에 서 있던 바닥 높이 (카메라가 이걸 따라간다)
  let vy = 0;                // 위아래 속도
  let onGround = true;

  /** (x, z)에서 발이 닿는 바닥 높이. 층이 없는 곳(마을)은 그냥 0 */
  function groundAt(x, z, fromY) {
    return area.groundY ? area.groundY(x, z, fromY) : 0;
  }

  // 놀이기구(그네·미끄럼틀) 상태
  let ride = null;           // 지금 타고 있는 놀이기구 (안 타면 null)
  let rideTime = 0;          // 탄 지 몇 초 됐나
  let rideY = 0;             // 놀이기구 때문에 떠 있는 높이 (카메라가 따라간다)
  let nearRide = null;       // 바로 옆에 있는 빈 놀이기구 (🎠 버튼을 띄울지 정한다)
  let nearSpot = null;       // 바로 앞에 있는 말 거는 자리 (요정 친구 진열대 등)

  /** 점프! (땅에 있을 때만 된다 — 공중에서 두 번은 안 뛴다. 타는 중에는 안 된다) */
  function jump() {
    if (ride || !onGround) return;
    vy = JUMP_POWER;
    onGround = false;
  }

  /**
   * 지금 밟고 있는 바닥에 발을 맞춘다 (공간을 옮기거나 놀이기구에서 내렸을 때).
   * fromY = 내려서기 직전 높이. 2층에서 내리면 2층 바닥에, 1층이면 1층 바닥에 선다.
   */
  function settleOnFloor(fromY = 0) {
    footY = groundAt(model.position.x, model.position.z, fromY);
    floorRef = footY;
    vy = 0;
    onGround = true;
  }

  /** 🎠 버튼 / E 키 — 옆에 있는 놀이기구를 타거나, 타고 있으면 내린다 */
  function toggleRide() {
    if (ride) {
      if (!ride.autoEnd) getOff();   // 미끄럼틀은 다 내려올 때까지 못 내린다
      return;
    }
    // 한 프레임 사이에 친구가 먼저 자리를 맡았을 수도 있으니 다시 확인한다
    if (!nearRide || nearRide.rider) { nearRide = null; return; }
    ride = mountRide(nearRide, model);
    rideTime = 0;
    nearRide = null;
    vy = 0; onGround = true;              // 뛰다가 타도 착지한 것으로 친다
    api.onMount?.(ride);             // 화면에 '그네를 타요!' 같은 말을 띄운다
  }

  /**
   * 🅰 행동 버튼 / E 키 — 지금 서 있는 자리에 맞는 일을 한다.
   *   놀이기구 옆이면 타거나 내리고, 요정 친구 앞이면 친구를 부른다.
   */
  function action() {
    if (ride || nearRide) { toggleRide(); return; }
    if (nearSpot) api.onSpot?.(nearSpot);   // 무엇을 할지는 main.js가 정한다
  }

  /** 놀이기구에서 내린다 */
  function getOff() {
    dismountRide(ride, model);
    ride = null;
    rideTime = 0;
    settleOnFloor(rideY);     // 내린 자리의 바닥 높이(2층일 수도 있다)에 발을 붙인다
    rideY = 0;
  }

  /**
   * 카메라가 캐릭터 뒤를 따라간다.
   *   base : 지금 서 있는 바닥 높이 (2층이면 그대로 같이 올라간다)
   *   lift : 바닥에서 얼마나 떠 있는지 (점프·놀이기구 → 조금만 따라 올라간다)
   */
  function followCamera(dt, base, lift) {
    // 성 안처럼 좁은 곳은 카메라를 더 가까이 붙인다 (벽이나 가구를 뚫고 나가지 않게)
    //  놀이기구가 camDist/camHeight를 적어두면 타는 동안 그 값을 쓴다
    //  (침대는 천개(지붕)에 가리지 않게 카메라를 낮춘다)
    const dist = ride?.camDist ?? area.camDist ?? CAM_DIST;
    const height = ride?.camHeight ?? area.camHeight ?? CAM_HEIGHT;
    _camTarget.set(
      model.position.x - Math.sin(camYaw) * dist,
      height + base + lift * CAM_FOLLOW,
      model.position.z - Math.cos(camYaw) * dist
    );
    camera.position.lerp(_camTarget, Math.min(1, 6 * dt));
    // 조금 위를 보게 해서 하늘(고래)도 보이게 한다
    _look.set(model.position.x,
              (ride?.lookHeight ?? area.lookHeight ?? LOOK_HEIGHT) + base + lift * CAM_FOLLOW * 2,
              model.position.z);
    camera.lookAt(_look);
  }

  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); jump(); }
    if (e.code === 'KeyE') action();
  });
  addEventListener('keyup', e => keys.delete(e.code));

  // 화면을 끌어서 카메라 돌리기
  //  버튼이나 조이스틱 위에서 시작한 손가락은 무시한다 (조작이 서로 안 엉키게)
  addEventListener('pointerdown', e => {
    if (dragId !== null) return;                       // 이미 한 손가락이 카메라를 돌리는 중
    if (e.target.closest?.('button, .no-drag')) return;
    dragId = e.pointerId; lastX = e.clientX;
  });
  addEventListener('pointermove', e => {
    if (e.pointerId !== dragId) return;
    camYaw -= (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
  });
  const endDrag = e => { if (e.pointerId === dragId) dragId = null; };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  /**
   * 조이스틱·키보드 입력을 읽어서 "카메라가 보는 방향" 기준 이동 방향을 만든다.
   *   돌려주는 것 : 얼마나 세게 밀었나(0~1). 0이면 가만히 있는 것.
   * 방향은 _dir에 담긴다.
   */
  function readMove() {
    let ix = 0, iz = 0, analog = 1;
    if (keys.has('ArrowUp')    || keys.has('KeyW')) iz -= 1;
    if (keys.has('ArrowDown')  || keys.has('KeyS')) iz += 1;
    if (keys.has('ArrowLeft')  || keys.has('KeyA')) ix -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
    if (joy.active) {
      ix += joy.x; iz += joy.y;
      analog = joy.mag;          // 살살 밀면 천천히, 끝까지 밀면 빠르게
    }
    if (ix === 0 && iz === 0) return 0;

    // 카메라는 플레이어 뒤쪽에 있고, 화면 안쪽(앞)은 (sin, cos) 방향이다.
    // 화면 오른쪽은 (-cos, sin) 방향.  위 화살표는 iz = -1 이므로 부호에 주의!
    const cos = Math.cos(camYaw), sin = Math.sin(camYaw);
    _dir.set(-ix * cos - iz * sin, 0, ix * sin - iz * cos).normalize();
    return analog;
  }

  /** 몸(또는 말)을 가고 싶은 방향으로 부드럽게 돌린다. 돌아간 각도 차이를 돌려준다. */
  function turnToward(obj, speed, dt) {
    const want = Math.atan2(_dir.x, _dir.z);
    let diff = want - obj.rotation.y;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    obj.rotation.y += diff * Math.min(1, speed * dt);
    return diff;
  }

  /** 공간 밖(마을 울타리)으로 못 나가게 붙잡는다 */
  function keepInside(pos) {
    if (!area.bounds) return;                 // 성 안은 벽이 막아준다
    const r = Math.hypot(pos.x, pos.z);
    if (r > area.bounds) {
      pos.x *= area.bounds / r;
      pos.z *= area.bounds / r;
    }
  }

  /**
   * 🐴 말을 타고 달린다 (ride.drive === true)
   *   조이스틱으로 말을 몰고, 나는 안장 위에 앉아서 같이 간다.
   */
  function driveRide(dt, t) {
    const horse = ride.group;
    const analog = readMove();
    const moving = analog > 0;

    if (moving) {
      horse.position.addScaledVector(_dir, ride.speed * analog * dt);
      area.collide(horse.position, HORSE_R, 0);       // 나무·집은 뚫고 못 간다
      keepInside(horse.position);
      const diff = turnToward(horse, ride.turn ?? 6, dt);
      if (dragId === null) camYaw += diff * Math.min(1, 1.5 * dt);
    }
    horse.userData.step?.(t, moving, analog);         // 다리를 움직인다

    // 나는 안장 위 — 말이 달리면 위아래로 통통 튄다
    model.position.set(horse.position.x, 0, horse.position.z);
    model.rotation.y = horse.rotation.y;
    model.userData.update?.(t, false);
    rideY = ride.seatY + (horse.userData.bob ?? 0);
    model.position.y += rideY;
    model.rotation.x = moving ? Math.sin(t * 9) * 0.05 : 0;

    // 말이 움직였으니 "여기서 탄다 / 여기에 내린다" 자리도 같이 옮긴다
    const side = horse.rotation.y + Math.PI / 2;
    ride.enter.x = horse.position.x; ride.enter.z = horse.position.z;
    ride.exit.x = horse.position.x + Math.sin(side) * 2.6;
    ride.exit.z = horse.position.z + Math.cos(side) * 2.6;

    followCamera(dt, rideY, 0);
    return moving;
  }

  function update(dt, t) {
    // 0) 놀이기구를 타는 중이면 조작 대신 놀이기구가 자리와 각도를 정해준다
    if (ride) {
      if (ride.drive) return driveRide(dt, t);        // 말은 내가 몬다
      rideTime += dt;
      const done = applyRide(ride, model, rideTime, t);
      rideY = model.position.y;
      if (done && ride.autoEnd) getOff();     // 미끄럼틀은 다 내려오면 저절로 내린다
      // camBase를 켠 놀이기구(2층 미끄럼틀)는 카메라가 높이를 그대로 따라간다
      if (ride.camBase) followCamera(dt, rideY, 0);
      else              followCamera(dt, 0, rideY);
      return false;
    }

    // 1) 입력 → 걷기
    const analog = readMove();
    const moving = analog > 0;

    if (moving) {
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
      model.position.addScaledVector(_dir, speed * analog * dt);

      // 나무나 집을 뚫고 지나가지 않게 밀어낸다 (2층 난간은 2층에서만 막는다)
      area.collide(model.position, BODY_R, footY);
      keepInside(model.position);

      // 몸을 이동 방향으로 부드럽게 회전
      const diff = turnToward(model, TURN_SPEED, dt);
      // 카메라도 천천히 뒤로 따라 돈다 (아이가 조작 안 해도 되게)
      if (dragId === null) camYaw += diff * Math.min(1, 1.5 * dt);
    }

    // 2) 위아래 — 계단을 오르내리고, 2층 끝에서는 떨어지고, 점프하면 뜬다
    const gy = groundAt(model.position.x, model.position.z, footY);
    if (onGround) {
      if (gy >= footY - STEP_UP) {
        footY = gy;                       // 계단 한 칸 정도는 그냥 오르내린다
        floorRef = footY;
      } else {
        onGround = false; vy = 0;         // 낭떠러지! 아래로 떨어진다
      }
    } else {
      vy -= GRAVITY * dt;
      footY += vy * dt;
      if (footY <= gy) {                  // 착지
        footY = gy; vy = 0; onGround = true;
        floorRef = footY;
      }
    }

    // 3) 카메라 추적
    //   바닥 높이(floorRef)는 그대로 따라가고, 점프한 만큼만 조금 따라 올라간다.
    followCamera(dt, floorRef, footY - floorRef);

    // 3-1) 바로 옆에 빈 그네나 미끄럼틀이 있으면 🎠 버튼을 띄운다
    nearRide = findFreeRide(area.rides, model.position, RIDE_REACH, false, footY);
    // 3-2) 놀이기구가 없으면, 말 걸 수 있는 자리(요정 친구 진열대)를 찾는다
    nearSpot = nearRide ? null : findNearestSpot(area.spots, model.position);

    // 4) 캐릭터 애니메이션
    //  캐릭터 종류에 따라 animate가 위아래로 통통 튀는 값을 직접 쓴다.
    //  그래서 0으로 맞춘 뒤 animate를 부르고, 그 위에 지금 높이를 얹는다.
    model.position.y = 0;
    model.userData.update?.(t, moving);
    model.position.y += footY;

    return moving;
  }

  /**
   * 다른 공간(마을 ↔ 성 안)으로 옮겨간다.
   *   next : 새 공간. pos/yaw를 안 주면 그 공간의 spawn/yaw로 간다.
   * 카메라는 스르륵 따라오지 않고 그 자리에 바로 놓는다 (화면이 휙 날아가지 않게).
   */
  function moveTo(next, pos, yaw) {
    if (ride) getOff();
    area = next;
    model.position.copy(pos || next.spawn);
    model.position.y = 0;
    model.rotation.set(0, yaw ?? next.yaw ?? 0, 0);
    camYaw = yaw ?? next.yaw ?? 0;
    settleOnFloor();                    // 새 공간의 바닥 높이에 발을 맞춘다
    nearRide = null;
    nearSpot = null;
    next.scene.add(model);              // 새 공간의 화면으로 옮긴다
    followCamera(1, footY, 0);          // dt를 크게 줘서 카메라를 바로 붙인다
    camera.position.copy(_camTarget);
  }

  // onMount에 함수를 넣어두면 놀이기구를 탈 때 불러준다 (main.js가 안내 문구를 띄운다)
  const api = {
    model, update, joy, keys, jump, toggleRide, moveTo, action,
    onMount: null,
    onSpot: null,                           // 말 거는 자리에서 버튼을 눌렀을 때 (main.js가 채운다)
    get area()     { return area; },        // 지금 있는 공간
    get nearSpot() { return nearSpot; },    // 바로 앞에 있는 말 거는 자리
    get ride()     { return ride; },       // 지금 타고 있는 놀이기구
    get nearRide() { return nearRide; },   // 바로 옆에 있는 빈 놀이기구
  };
  return api;
}
