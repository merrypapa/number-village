// ===========================================================
//  인형 얼굴 (그림 속 요정 공주 얼굴)
//  ★ characters.js에서 face:'doll' 을 준 친구만 이 얼굴을 쓴다.
//    커다랗고 반짝이는 눈 · 작은 코 · 웃는 입 · 볼터치 · 물방울 보석
// ===========================================================
import * as THREE from 'three';
import { GEO, MAT_WHITE, MAT_SHINE, glossMat, glowMat, noShadow, shade } from './character-parts.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const EYE_SIZE  = 1.15;   // 눈 크기 (크게 할수록 더 아기 같다)
const EYE_X     = 0.272;  // 두 눈 사이 벌어진 정도
const EYE_Y     = -0.045; // 눈 높이 (내릴수록 이마가 넓어진다)
const LASH      = 0x2a3358;  // 속눈썹 색 (진한 남색)
const NOSE      = 0xf09aae;  // 코 색
const MOUTH_IN  = 0x8e2b3d;  // 입 안쪽 색
const TONGUE    = 0xe4677f;  // 혀 색

/** 부품 하나 만들기 */
function bit(geo, mat, pos, scale, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (Array.isArray(scale)) m.scale.set(scale[0], scale[1], scale[2]);
  else m.scale.setScalar(scale);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return noShadow(m);
}

// -----------------------------------------------------------
//  눈 한 쪽 (흰자 → 홍채 → 아랫쪽 밝은 빛 → 동공 → 하이라이트 → 속눈썹)
// -----------------------------------------------------------
function addEye(head, def, s, fz, full) {
  const E    = def.eyeSize ?? EYE_SIZE;
  const iris = def.eye ?? 0x2f7fd0;
  const irisMat  = glossMat(iris);
  const brightMat= glossMat(shade(iris, 0.42));       // 홍채 아래쪽 밝은 부분
  const deepMat  = glossMat(shade(iris, -0.30));      // 홍채 위쪽 어두운 부분
  const pupilMat = glossMat(shade(iris, -0.62));
  const lashMat  = glossMat(LASH);

  const x = s * EYE_X;
  const y = EYE_Y;
  const z = 0.40 + fz;

  // 흰자 — 큼직한 세로 타원
  head.add(bit(GEO.eye, MAT_WHITE, [x, y, z], [0.30 * E, 0.40 * E, 0.16]));

  // 홍채 — 흰자를 거의 채운다 (그래서 눈이 커 보인다)
  head.add(bit(GEO.eye, irisMat, [x, y - 0.010, z + 0.030], [0.215 * E, 0.315 * E, 0.15]));
  // 위는 살짝 어둡게, 아래는 밝게 → 눈동자에 그라데이션이 생긴다
  head.add(bit(GEO.blob, deepMat,   [x, y + 0.100 * E, z + 0.046], [0.185 * E, 0.085 * E, 0.07]));
  head.add(bit(GEO.blob, brightMat, [x, y - 0.100 * E, z + 0.048], [0.165 * E, 0.080 * E, 0.07]));

  // 동공
  head.add(bit(GEO.blob, pupilMat, [x, y - 0.005, z + 0.068], [0.105 * E, 0.145 * E, 0.09]));

  // 하이라이트 — 큰 것 하나 + 작은 것들. 이게 있어야 "반짝" 한다
  head.add(bit(GEO.blob, MAT_SHINE, [x - s * 0.070 * E, y + 0.115 * E, z + 0.092], [0.072 * E, 0.082 * E, 0.05]));
  head.add(bit(GEO.blob, MAT_SHINE, [x + s * 0.080 * E, y - 0.105 * E, z + 0.088], [0.042 * E, 0.048 * E, 0.04]));
  if (full) {
    head.add(bit(GEO.blob, MAT_SHINE, [x + s * 0.030, y + 0.030 * E, z + 0.086], [0.026 * E, 0.030 * E, 0.03]));
  }

  // 위 속눈썹 — 눈 위를 덮는 얇은 선
  const lash = bit(GEO.blob, lashMat, [x, y + 0.170 * E, z + 0.015], [0.325 * E, 0.055 * E, 0.175]);
  lash.rotation.z = -s * 0.16;
  head.add(lash);

  if (full) {
    // 바깥쪽으로 뻗은 속눈썹 두 가닥
    for (let i = 0; i < 2; i++) {
      const sp = bit(GEO.cone, lashMat,
        [x + s * (0.150 + i * 0.042) * E, y + (0.165 - i * 0.050) * E, z - 0.015],
        [0.030, 0.105 - i * 0.02, 0.030],
        [0, 0, -s * (1.05 + i * 0.25)]);
      head.add(sp);
    }
    // 눈썹 — 얇고 옅은 하늘색
    const brow = bit(GEO.blob, glowMat(shade(def.hair ?? 0x9fd8f2, -0.10)),
      [x, y + 0.285 * E, z - 0.030], [0.175 * E, 0.024, 0.075]);
    brow.rotation.z = -s * 0.24;
    head.add(brow);
  }
}

// -----------------------------------------------------------
//  얼굴 전체 (눈 + 코 + 입 + 볼터치 + 이마 보석)
// -----------------------------------------------------------
export function addDollFace(head, def, fz, full) {
  for (const s of [-1, 1]) addEye(head, def, s, fz, full);

  // 코 — 아주 작은 분홍 점
  head.add(bit(GEO.blob, glossMat(NOSE), [0, -0.150, 0.50 + fz], [0.052, 0.038, 0.042]));

  // 입 — 웃으며 벌린 입 (안쪽 + 윗니 + 혀)
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.275, 0.45 + fz);
  mouth.add(bit(GEO.blob, glossMat(MOUTH_IN), [0, 0, 0], [0.165, 0.115, 0.09]));
  mouth.add(bit(GEO.blob, glossMat(TONGUE), [0, -0.042, 0.028], [0.095, 0.048, 0.05]));
  head.add(mouth);

  // 볼터치 — 크고 부드럽게
  for (const s of [-1, 1]) {
    head.add(bit(GEO.blob, glowMat(def.cheek ?? 0xff9dba),
      [s * 0.330, -0.295, 0.27 + fz], [0.165, 0.110, 0.08]));
  }

  // 이마 물방울 보석 (동그란 아래 + 뾰족한 위 + 하얀 반짝임)
  const gemColor = def.gem ?? 0x6fd8e8;
  const gem = new THREE.Group();
  gem.position.set(0, 0.245, 0.44 + fz);
  gem.add(bit(GEO.blob, glowMat(gemColor), [0, -0.015, 0],   [0.115, 0.105, 0.08]));
  gem.add(bit(GEO.cone, glowMat(gemColor), [0, 0.065, 0],    [0.098, 0.145, 0.07]));
  gem.add(bit(GEO.blob, MAT_SHINE,         [-0.025, 0.0, 0.05], [0.026, 0.034, 0.02]));
  head.add(gem);
}
