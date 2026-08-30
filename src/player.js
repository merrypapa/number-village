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

// --- 놀이기구 타기 ---
const RIDE_REACH = 3.2;     // 그네·미끄럼틀에 이만큼 가까이 가면 탈 수 있다

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

  // 점프 상태
  let jumpY = 0;             // 지금 얼마나 떠 있나
  let vy = 0;                // 위아래 속도
  let onGround = true;

  // 놀이기구(그네·미끄럼틀) 상태
  let ride = null;           // 지금 타고 있는 놀이기구 (안 타면 null)
  let rideTime = 0;          // 탄 지 몇 초 됐나
  let rideY = 0;             // 놀이기구 때문에 떠 있는 높이 (카메라가 따라간다)
  let nearRide = null;       // 바로 옆에 있는 빈 놀이기구 (🎠 버튼을 띄울지 정한다)

  /** 점프! (땅에 있을 때만 된다 — 공중에서 두 번은 안 뛴다. 타는 중에는 안 된다) */
  function jump() {
    if (ride || !onGround) return;
    vy = JUMP_POWER;
    onGround = false;
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
    jumpY = 0; vy = 0; onGround = true;   // 뛰다가 타도 착지한 것으로 친다
    api.onMount?.(ride);             // 화면에 '그네를 타요!' 같은 말을 띄운다
  }

  /** 놀이기구에서 내린다 */
  function getOff() {
    dismountRide(ride, model);
    ride = null;
    rideTime = 0;
    rideY = 0;
  }

  /** 카메라가 캐릭터 뒤를 따라간다. lift는 지금 얼마나 떠 있는지(점프·놀이기구). */
  function followCamera(dt, lift) {
    // 성 안처럼 좁은 곳은 카메라를 더 가까이 붙인다 (벽이나 가구를 뚫고 나가지 않게)
    const dist = area.camDist ?? CAM_DIST;
    const height = area.camHeight ?? CAM_HEIGHT;
    _camTarget.set(
      model.position.x - Math.sin(camYaw) * dist,
      height + lift * CAM_FOLLOW,
      model.position.z - Math.cos(camYaw) * dist
    );
    camera.position.lerp(_camTarget, Math.min(1, 6 * dt));
    // 조금 위를 보게 해서 하늘(고래)도 보이게 한다
    _look.set(model.position.x, (area.lookHeight ?? LOOK_HEIGHT) + lift * CAM_FOLLOW * 2,
              model.position.z);
    camera.lookAt(_look);
  }

  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); jump(); }
    if (e.code === 'KeyE') toggleRide();
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

  function update(dt, t) {
    // 0) 놀이기구를 타는 중이면 조작 대신 놀이기구가 자리와 각도를 정해준다
    if (ride) {
      rideTime += dt;
      const done = applyRide(ride, model, rideTime, t);
      rideY = model.position.y;
      if (done && ride.autoEnd) getOff();     // 미끄럼틀은 다 내려오면 저절로 내린다
      followCamera(dt, rideY);
      return false;
    }

    // 1) 입력 → 방향 벡터
    let ix = 0, iz = 0, analog = 1;
    if (keys.has('ArrowUp')    || keys.has('KeyW')) iz -= 1;
    if (keys.has('ArrowDown')  || keys.has('KeyS')) iz += 1;
    if (keys.has('ArrowLeft')  || keys.has('KeyA')) ix -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
    if (joy.active) {
      ix += joy.x; iz += joy.y;
      analog = joy.mag;          // 살살 밀면 천천히, 끝까지 밀면 빠르게
    }

    const moving = ix !== 0 || iz !== 0;

    if (moving) {
      // 카메라가 보는 방향 기준으로 이동
      //   카메라는 플레이어 뒤쪽에 있고, 화면 안쪽(앞)은 (sin, cos) 방향이다.
      //   화면 오른쪽은 (-cos, sin) 방향.  위 화살표는 iz = -1 이므로 부호에 주의!
      const cos = Math.cos(camYaw), sin = Math.sin(camYaw);
      _dir.set(-ix * cos - iz * sin, 0, ix * sin - iz * cos).normalize();

      const base = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
      model.position.addScaledVector(_dir, base * analog * dt);

      // 나무나 집을 뚫고 지나가지 않게 밀어낸다
      area.collide(model.position, BODY_R);

      // 공간 밖으로 못 나가게 (성 안은 벽이 막아주므로 bounds가 없다)
      if (area.bounds) {
        const r = Math.hypot(model.position.x, model.position.z);
        if (r > area.bounds) {
          model.position.x *= area.bounds / r;
          model.position.z *= area.bounds / r;
        }
      }

      // 몸을 이동 방향으로 부드럽게 회전
      const want = Math.atan2(_dir.x, _dir.z);
      let diff = want - model.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      model.rotation.y += diff * Math.min(1, TURN_SPEED * dt);

      // 카메라도 천천히 뒤로 따라 돈다 (아이가 조작 안 해도 되게)
      if (dragId === null) camYaw += diff * Math.min(1, 1.5 * dt);
    }

    // 2) 점프 — 공중에 있으면 중력으로 떨어진다
    if (!onGround) {
      vy -= GRAVITY * dt;
      jumpY += vy * dt;
      if (jumpY <= 0) { jumpY = 0; vy = 0; onGround = true; }
    }

    // 3) 카메라 추적 (점프할 때 화면이 크게 출렁이지 않게 조금만 따라 올라간다)
    followCamera(dt, jumpY);

    // 3-1) 바로 옆에 빈 그네나 미끄럼틀이 있으면 🎠 버튼을 띄운다
    nearRide = findFreeRide(area.rides, model.position, RIDE_REACH);

    // 4) 캐릭터 애니메이션
    //  캐릭터 종류에 따라 animate가 위아래로 통통 튀는 값을 직접 쓴다.
    //  그래서 0으로 맞춘 뒤 animate를 부르고, 그 위에 점프 높이를 얹는다.
    model.position.y = 0;
    model.userData.update?.(t, moving);
    model.position.y += jumpY;

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
    jumpY = 0; vy = 0; onGround = true;
    nearRide = null;
    next.scene.add(model);              // 새 공간의 화면으로 옮긴다
    followCamera(1, 0);                 // dt를 크게 줘서 카메라를 바로 붙인다
    camera.position.copy(_camTarget);
  }

  // onMount에 함수를 넣어두면 놀이기구를 탈 때 불러준다 (main.js가 안내 문구를 띄운다)
  const api = {
    model, update, joy, keys, jump, toggleRide, moveTo,
    onMount: null,
    get area()     { return area; },        // 지금 있는 공간
    get ride()     { return ride; },       // 지금 타고 있는 놀이기구
    get nearRide() { return nearRide; },   // 바로 옆에 있는 빈 놀이기구
  };
  return api;
}
