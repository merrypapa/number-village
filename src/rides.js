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
//
//  ★ 몇 가지는 없어도 된다 (있으면 다르게 동작한다):
//    drive   : true면 "몰고 다니는 탈것"이다 (말). pose 대신 player.js가
//              조이스틱으로 직접 움직인다. 마을 친구는 못 탄다.
//    noNpc   : true면 마을 친구(NPC)가 타지 않는다. 아이만 탄다.
//    enterY  : 타는 자리의 바닥 높이 (성 2층 미끄럼틀은 7.5). 안 적으면 1층.
//    enters  : 타는 자리가 여러 곳일 때 [{x,z}, …] (침대는 왼쪽·오른쪽 둘 다).
//              가장 가까운 자리가 enter/exit가 된다.
//    reach   : 이만큼 가까이 가면 버튼이 나온다 (안 적으면 3.2칸).
//              왕좌처럼 큰 물건은 넉넉하게 준다.
//    camBase : true면 카메라가 높이를 그대로 따라간다 (2층 미끄럼틀).
// ===========================================================

// 매 프레임 새로 만들지 않고 이 하나를 돌려 쓴다
const _pose = { x: 0, y: 0, z: 0, yaw: 0, tilt: 0 };

/**
 * pos에서 maxDist 안에 있는 "빈" 놀이기구 중 가장 가까운 것을 찾는다.
 * forNpc = true면 마을 친구가 탈 수 있는 것만 고른다.
 * y = 지금 서 있는 바닥 높이 (2층 미끄럼틀을 1층에서 붙잡지 않게). 없으면 null.
 */
export function findFreeRide(rides, pos, maxDist, forNpc = false, y = 0) {
  let best = null;
  let bestDist = Infinity;
  let bestSpot = null;
  for (const ride of rides) {
    if (ride.rider) continue;                     // 이미 누가 타고 있다
    if (forNpc && (ride.noNpc || ride.drive)) continue;   // 말은 아이만 탄다
    if (Math.abs(y - (ride.enterY ?? 0)) > 2.5) continue; // 다른 층에 있는 것

    // 타는 자리가 여러 곳일 수 있다 (침대 왼쪽·오른쪽, 왕좌 앞·양옆)
    const spots = ride.enters || [ride.enter];
    let d = Infinity, spot = null;
    for (const e of spots) {
      const dd = Math.hypot(pos.x - e.x, pos.z - e.z);
      if (dd < d) { d = dd; spot = e; }
    }
    if (d < (ride.reach ?? maxDist) && d < bestDist) {
      bestDist = d; best = ride; bestSpot = spot;
    }
  }
  // 여러 자리 중 내가 서 있는 쪽에서 타고, 내릴 때도 그 자리로 내린다
  if (best && best.enters) { best.enter = bestSpot; best.exit = bestSpot; }
  return best;
}

/** 자리를 맡는다. 다른 친구가 끼어들지 못하게 rider에 이름을 적어둔다. */
export function mountRide(ride, model) {
  ride.rider = model;
  ride.onRide?.(true, model);        // 말처럼 탈 때 준비할 게 있으면 알려준다
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
  ride.onRide?.(false, model);
}
