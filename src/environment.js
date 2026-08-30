// ===========================================================
//  스튜디오 조명 흉내 (환경맵)
//  ★ 사진 스튜디오처럼 위는 밝고 아래는 은은한 빛을 만들어서
//    반질반질한 재질(초코핑)에 부드러운 반사광이 생기게 한다.
//    그림 파일을 받지 않고 Canvas로 직접 그린다.
// ===========================================================
import * as THREE from 'three';

// ★ 아이랑 같이 바꿔볼 값
const TOP    = '#ffffff';   // 위쪽 빛 색
const MIDDLE = '#dfeeff';   // 가운데 하늘빛
const BOTTOM = '#ffe4ef';   // 아래쪽 분홍빛 반사

function gradientTexture() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, TOP);
  g.addColorStop(0.42, MIDDLE);
  g.addColorStop(1.00, BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);

  // 위쪽에 밝은 조명판 하나 (하이라이트가 생기는 곳)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 16, 40);

  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * 렌더러마다 한 번씩 만들어서 scene.environment에 넣어준다.
 * (three.js에서 이 값은 MeshStandard/Physical 재질에만 영향을 준다.
 *  그래서 만화풍 재질을 쓰는 다른 친구들은 예전 그대로다.)
 */
export function makeStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromEquirectangular(gradientTexture()).texture;
  pmrem.dispose();
  return tex;
}
