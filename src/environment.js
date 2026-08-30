// ===========================================================
//  반질반질한 장난감 느낌을 만드는 "주변 환경 빛"
//  실제 사진(HDR 파일) 없이, Canvas에 그린 하늘 그라데이션을
//  반사용 빛으로 바꿔서 쓴다. 이게 있어야 표면에 윤기가 생긴다.
// ===========================================================
import * as THREE from 'three';

// ★ 아이랑 같이 바꿔볼 색 (위에서 아래로)
const SKY    = '#ffffff';   // 위쪽 (제일 밝은 빛)
const MIDDLE = '#e8f2ff';   // 가운데
const GROUND = '#c8b9a8';   // 아래쪽 (바닥에서 반사되는 빛)

function gradientCanvas() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.00, SKY);
  grad.addColorStop(0.45, MIDDLE);
  grad.addColorStop(0.55, MIDDLE);
  grad.addColorStop(1.00, GROUND);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);

  // 위쪽에 밝은 덩어리 하나 — 표면에 도는 하이라이트가 된다
  const spot = g.createRadialGradient(150, 26, 2, 150, 26, 52);
  spot.addColorStop(0, 'rgba(255,255,255,1)');
  spot.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = spot;
  g.fillRect(0, 0, 256, 90);
  return cv;
}

/** 씬에 환경 빛을 입힌다. 렌더러마다 한 번씩 불러야 한다. */
export function applyEnvironment(renderer, scene) {
  const tex = new THREE.CanvasTexture(gradientCanvas());
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;

  pmrem.dispose();
  tex.dispose();
}
