// ===========================================================
//  놀이기구 타기 — 그네와 미끄럼틀에 올라타는 규칙
//
//  ★ 놀이기구의 "생김새"는 playground.js가 만들고,
//    "어떻게 타는지"는 이 파일이 맡는다.
//    플레이어도 마을 친구(NPC)도 똑같이 이 함수들을 쓴다.
//
//  놀이기구 하나는 이렇게 생겼다 (playground.js가 만들어 준다):
//    kind      : 'swing' | 'slide'   어떤 기구인지
//    label     : 탈 때 화면에 띄울 말 ('그네를 타요!')
//    enter     : {x, z}   타려고 걸어가는 자리
//    exit      : {x, z}   다 타고 내려서 서는 자리
//    duration  : 한 번 타는 데 걸리는 시간(초)
//    autoEnd   : true면 시간이 다 되면 저절로 내린다 (미끄럼틀)
//                false면 내리기 버튼을 누를 때까지 계속 탄다 (그네)
//    rider     : 지금 타고 있는(또는 타러 오는 중인) 캐릭터. 비었으면 null
//    pose(t,o) : t초 동안 탔을 때 몸이 있어야 할 자리와 기울기
// ===========================================================

// 매 프레임 새로 만들지 않고 이 하나를 돌려 쓴다
const _pose = { x: 0, y: 0, z: 0, yaw: 0, tilt: 0 };

/**
 * pos에서 maxDist 안에 있는 "빈" 놀이기구 중 가장 가까운 것을 찾는다.
 * 없으면 null.
 */
export function findFreeRide(rides, pos, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const ride of rides) {
    if (ride.rider) continue;                     // 이미 누가 타고 있다
    const d = Math.hypot(pos.x - ride.enter.x, pos.z - ride.enter.z);
    if (d < bestDist) { bestDist = d; best = ride; }
  }
  return best;
}

/** 자리를 맡는다. 다른 친구가 끼어들지 못하게 rider에 이름을 적어둔다. */
export function mountRide(ride, model) {
  ride.rider = model;
  return ride;
}

/**
 * 타고 있는 동안 매 프레임 부른다. 놀이기구가 캐릭터의 자리를 정해준다.
 * 다 탔으면 true를 돌려준다.
 *
 * ★ 순서가 중요하다 —
 *   캐릭터마다 animate가 위아래로 통통 튀는 값(position.y)을 직접 쓰기 때문에,
 *   y를 0으로 맞추고 → animate를 부르고 → 그 위에 놀이기구 높이를 얹는다.
 *   (player.js의 점프 처리와 똑같은 순서다)
 */
export function applyRide(ride, model, rideTime, t) {
  const p = ride.pose(rideTime, _pose);
  model.position.set(p.x, 0, p.z);
  model.rotation.y = p.yaw;
  model.userData.update?.(t, false);
  model.position.y += p.y;
  model.rotation.x = p.tilt;                      // 그네·미끄럼틀을 따라 몸이 기운다
  return rideTime >= ride.duration;
}

/** 내린다. 놀이기구 옆(exit)에 똑바로 세워주고 자리를 비운다. */
export function dismountRide(ride, model) {
  model.position.set(ride.exit.x, 0, ride.exit.z);
  model.rotation.x = 0;                           // 기울였던 몸을 다시 세운다
  ride.rider = null;
}
