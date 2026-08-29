// ===========================================================
//  플레이어 조작 + 3인칭 추적 카메라
//  7세 기준: 카메라를 안 만져도 알아서 뒤를 따라온다
// ===========================================================
import * as THREE from 'three';

// --- 아이가 바꿔볼 수 있는 값들 ---
const WALK_SPEED = 12;      // 걷기 속도
const RUN_SPEED  = 20;      // Shift 눌렀을 때
const TURN_SPEED = 10;      // 몸이 도는 속도
const CAM_DIST   = 14;      // 카메라 거리
const CAM_HEIGHT = 7;       // 카메라 높이
const LOOK_HEIGHT = 4;      // 카메라가 바라보는 높이 (키우면 하늘이 더 보인다)
const BODY_R     = 0.8;     // 몸 굵기 (이만큼 물건에서 떨어져 선다)

const _dir = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _look = new THREE.Vector3();

export function createPlayer(model, camera, world) {
  model.position.copy(world.spawn);

  const keys = new Set();
  let camYaw = 0;            // 카메라 좌우 각도
  let dragging = false, lastX = 0;
  const joy = { x: 0, y: 0, active: false };

  addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', e => keys.delete(e.code));

  // 마우스/터치로 카메라 회전
  addEventListener('pointerdown', e => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true; lastX = e.clientX;
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    camYaw -= (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
  });
  addEventListener('pointerup', () => dragging = false);

  function update(dt, t) {
    // 1) 입력 → 방향 벡터
    let ix = 0, iz = 0;
    if (keys.has('ArrowUp')    || keys.has('KeyW')) iz -= 1;
    if (keys.has('ArrowDown')  || keys.has('KeyS')) iz += 1;
    if (keys.has('ArrowLeft')  || keys.has('KeyA')) ix -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
    if (joy.active) { ix += joy.x; iz += joy.y; }

    const moving = ix !== 0 || iz !== 0;

    if (moving) {
      // 카메라가 보는 방향 기준으로 이동
      //   카메라는 플레이어 뒤쪽에 있고, 화면 안쪽(앞)은 (sin, cos) 방향이다.
      //   화면 오른쪽은 (-cos, sin) 방향.  위 화살표는 iz = -1 이므로 부호에 주의!
      const cos = Math.cos(camYaw), sin = Math.sin(camYaw);
      _dir.set(-ix * cos - iz * sin, 0, ix * sin - iz * cos).normalize();

      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
      model.position.addScaledVector(_dir, speed * dt);

      // 나무나 집을 뚫고 지나가지 않게 밀어낸다
      world.collide(model.position, BODY_R);

      // 마을 밖으로 못 나가게
      const r = Math.hypot(model.position.x, model.position.z);
      if (r > 88) {
        model.position.x *= 88 / r;
        model.position.z *= 88 / r;
      }

      // 몸을 이동 방향으로 부드럽게 회전
      const want = Math.atan2(_dir.x, _dir.z);
      let diff = want - model.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      model.rotation.y += diff * Math.min(1, TURN_SPEED * dt);

      // 카메라도 천천히 뒤로 따라 돈다 (아이가 조작 안 해도 되게)
      if (!dragging) camYaw += diff * Math.min(1, 1.5 * dt);
    }

    // 2) 카메라 추적
    _camTarget.set(
      model.position.x - Math.sin(camYaw) * CAM_DIST,
      model.position.y + CAM_HEIGHT,
      model.position.z - Math.cos(camYaw) * CAM_DIST
    );
    camera.position.lerp(_camTarget, Math.min(1, 6 * dt));
    // 조금 위를 보게 해서 하늘(고래)도 보이게 한다
    _look.copy(model.position).y += LOOK_HEIGHT;
    camera.lookAt(_look);

    // 3) 캐릭터 애니메이션
    model.userData.update?.(t, moving);
    return moving;
  }

  return { model, update, joy, keys };
}
