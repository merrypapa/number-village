// ===========================================================
//  부딪히기 (충돌) — 마을·성 안·마트·집이 똑같이 쓴다
//
//  장애물은 두 가지 모양만 쓴다:
//    동그란 것 { x, z, r }   /   네모난 것 { x, z, hw, hd }
//
//  ★ 층이 있는 곳(성 안 2층)을 위해 두 가지를 더 붙일 수 있다:
//    { y0, y1 } — 발 높이가 이 사이일 때만 부딪힌다.
//                 (1층 가구는 y0:-1 y1:3.5 → 2층에서는 통과)
//    { off:true } — 잠깐 꺼둔다 (지금 내가 타고 있는 말 등)
// ===========================================================

function pushOut(o, pos, radius, y) {
  if (o.off) return;
  if (o.y0 !== undefined && (y < o.y0 || y > o.y1)) return;
  const dx = pos.x - o.x;
  const dz = pos.z - o.z;

  if (o.hw !== undefined) {                       // 네모난 장애물 (성)
    const overlapX = o.hw + radius - Math.abs(dx);
    const overlapZ = o.hd + radius - Math.abs(dz);
    if (overlapX <= 0 || overlapZ <= 0) return;
    // 덜 밀어내도 되는 쪽으로 밀어낸다
    if (overlapX < overlapZ) pos.x += (dx >= 0 ? 1 : -1) * overlapX;
    else                     pos.z += (dz >= 0 ? 1 : -1) * overlapZ;
    return;
  }

  const min = o.r + radius;                       // 동그란 장애물
  const d = Math.hypot(dx, dz);
  if (d >= min) return;
  if (d < 0.001) { pos.x += min; return; }        // 정확히 한가운데면 옆으로 살짝
  pos.x = o.x + (dx / d) * min;
  pos.z = o.z + (dz / d) * min;
}

// -----------------------------------------------------------
//  장애물 목록 하나로 "부딪히기" 함수 두 개를 만든다.
// -----------------------------------------------------------
export function createCollider(obstacles) {
  return {
    /**
     * 장애물을 뚫고 들어갔으면 바깥으로 밀어낸다. pos는 그 자리에서 고쳐진다.
     * y = 지금 발이 있는 높이 (안 주면 1층). 2층 난간은 2층에서만 막는다.
     */
    collide(pos, radius, y = 0) {
      for (const o of obstacles) pushOut(o, pos, radius, y);
    },
    /** (x, z)가 장애물 안이면 true — NPC를 세울 자리를 고를 때 쓴다. */
    isBlocked(x, z, radius, y = 0) {
      for (const o of obstacles) {
        if (o.off) continue;
        if (o.y0 !== undefined && (y < o.y0 || y > o.y1)) continue;
        if (o.hw !== undefined) {
          if (Math.abs(x - o.x) < o.hw + radius && Math.abs(z - o.z) < o.hd + radius) return true;
        } else if (Math.hypot(x - o.x, z - o.z) < o.r + radius) {
          return true;
        }
      }
      return false;
    },
  };
}
