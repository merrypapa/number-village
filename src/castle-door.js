// ===========================================================
//  🚪 성 벽에 "바깥으로 나가는 문"을 그린다 — 네 성이 함께 쓴다
//
//  인하성·루하성·엄마성·아빠성에 길로 나가는 문이 여덟 개나 생겼다.
//  모양 만드는 코드가 똑같아서 여기 한 곳에 모았다.
//
//  ★ 문 그림은 **한쪽만 보이는 판**이다. 두꺼운 문틀(네모 상자)을 판 앞에 두면
//    판을 다 가려서 그냥 색깔 네모로 보이고, 들어올 때 카메라도 가린다.
//    그래서 문틀은 **기둥 두 개 + 위 가로대**로만 만든다.
// ===========================================================
import * as THREE from 'three';
import { part, glow } from './castle-props.js';
import { makeSign } from './mart-props.js';

/**
 * 벽에 문 하나를 그린다. (부딪히기·문 판정은 성 파일이 따로 적는다)
 *   scene : 넣을 화면
 *   side  : 'n' 북 / 's' 남 / 'e' 동 / 'w' 서   ← 어느 벽인가
 *   wall  : 그 벽의 좌표 (북/남이면 z, 동/서면 x)
 *   at    : 벽을 따라 어디쯤인가 (북/남이면 x, 동/서면 z)
 *   base  : 그 문이 있는 층의 바닥 높이 (1층 0, 2층 7.5 …)
 *   frame : 문틀 색,  light : 문 안쪽 빛 색,  mat : 문간 발판 색(없으면 문틀 색)
 *   text/bg/fg : 문 위에 붙는 이름표
 *   h     : 문 높이 (천장이 낮은 곳은 6.0쯤으로 줄인다)
 */
export function makeWallDoor(scene, o) {
  const { side, wall, at, base = 0, h = 6.6 } = o;
  //  벽에서 방 안쪽으로 향하는 방향 (n은 +z, s는 -z, e는 -x, w는 +x)
  const nx = side === 'e' ? -1 : side === 'w' ? 1 : 0;
  const nz = side === 'n' ? 1 : side === 's' ? -1 : 0;
  //  벽이 뻗어 있는 방향 (문 기둥 두 개가 이쪽으로 벌어진다)
  const dx = nz === 0 ? 0 : 1, dz = nx === 0 ? 0 : 1;
  const ry = side === 'n' ? 0 : side === 's' ? Math.PI
           : side === 'e' ? -Math.PI / 2 : Math.PI / 2;
  const x = nz === 0 ? wall : at;
  const z = nz === 0 ? at : wall;

  // 문 안쪽에서 새어 나오는 빛 (한쪽만 보이는 판)
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(5.4, h),
                            new THREE.MeshBasicMaterial({ color: o.light ?? 0xdff3ff }));
  gl.position.set(x + nx * 0.12, base + h / 2, z + nz * 0.12);
  gl.rotation.y = ry;
  gl.userData.noShadow = true;
  scene.add(gl);

  // 문틀 — 기둥 둘 + 위 가로대
  for (const s of [-1, 1]) {
    scene.add(part('box', o.frame, x + dx * s * 3.2 + nx * 0.4, base + h / 2,
                   z + dz * s * 3.2 + nz * 0.4, 0.6, h + 0.4, 0.6));
  }
  scene.add(part('box', o.frame, x + nx * 0.4, base + h + 0.3, z + nz * 0.4,
                 dx ? 7.0 : 0.6, 0.6, dz ? 7.0 : 0.6));

  // 이름표
  if (o.text) {
    const sign = makeSign(o.text, 6.6, 1.1, o.bg ?? '#ffffff', o.fg ?? '#333333');
    sign.position.set(x + nx * 0.45, base + h + 1.4, z + nz * 0.45);
    sign.rotation.y = ry;
    scene.add(sign);
  }

  // 문간 발판 — "여기 서면 나간다"고 눈으로 알려준다
  const matColor = o.mat ?? o.frame;
  const mat = part('box', matColor, x + nx * 1.4, base + 0.08, z + nz * 1.4,
                   dx ? 4.2 : 2.6, 0.12, dz ? 4.2 : 2.6, glow(matColor));
  mat.castShadow = false;
  scene.add(mat);
  return gl;
}
