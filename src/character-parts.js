// ===========================================================
//  캐릭터 공용 부품 창고
//  ★ 도형과 색(재료)을 여기서 한 번만 만들어서 모두가 나눠 쓴다.
//    캐릭터가 100마리여도 재료는 몇 개뿐이라 게임이 안 느려진다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const OUTLINE_COLOR = 0x4a3663;   // 애니 느낌 검은 테두리 색
export const OUTLINE_WIDTH = 0.032;      // 테두리 두께 (0이면 테두리 없음)
export const DARK_COLOR    = 0x3a2b52;   // 눈동자·속눈썹 같은 어두운 부분
export const SPARK_COLOR   = 0xfff3ad;   // 반짝이 별 색
const TOON_STEPS = [0.70, 1.0];    // 그림자 단계 (애니처럼 뚝뚝 끊기는 명암)

// -----------------------------------------------------------
//  셀 셰이딩용 그라데이션 — 그림자가 부드럽게 번지지 않고
//  애니처럼 딱딱 끊어지게 만들어 준다. (그림 파일 없이 코드로 생성)
// -----------------------------------------------------------
function makeToonGradient(steps) {
  const data = new Uint8Array(steps.map(v => Math.round(v * 255)));
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
const GRADIENT = makeToonGradient(TOON_STEPS);

// -----------------------------------------------------------
//  공용 도형 (한 번만 만들고 계속 재사용)
// -----------------------------------------------------------
export const GEO = {
  cube:     new THREE.BoxGeometry(1, 1, 1),
  ball:     new THREE.SphereGeometry(0.5, 20, 16),   // 큰 덩어리용 (매끈)
  blob:     new THREE.SphereGeometry(0.5, 12, 10),   // 작은 부품용 (가벼움)
  eye:      new THREE.SphereGeometry(0.5, 14, 12),
  limb:     new THREE.CapsuleGeometry(0.5, 1, 4, 8),
  cone:     new THREE.ConeGeometry(0.5, 1, 12),
  cyl:      new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  ring:     new THREE.TorusGeometry(0.4, 0.14, 8, 16),
  crescent: new THREE.TorusGeometry(0.36, 0.13, 8, 16, Math.PI * 1.25), // 초승달
  gem:      new THREE.OctahedronGeometry(0.5),        // 보석
  skirt:    new THREE.CylinderGeometry(0.24, 0.48, 0.32, 24, 1, true),  // 치마 (아래가 넓은 통)
};

// -----------------------------------------------------------
//  공용 재료
// -----------------------------------------------------------
export const MAT_WHITE   = new THREE.MeshBasicMaterial({ color: 0xfdfdff });  // 흰자는 그늘지면 안 예쁘다
export const MAT_DARK    = new THREE.MeshBasicMaterial({ color: DARK_COLOR }); // 눈동자·속눈썹도 항상 또렷하게
export const MAT_OUTLINE = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });
export const MAT_SPARK   = new THREE.MeshBasicMaterial({ color: SPARK_COLOR });
export const MAT_GLOSS   = new THREE.MeshBasicMaterial({           // 머리·몸의 반들반들한 광택
  color: 0xffffff, transparent: true, opacity: 0.24, depthWrite: false,
});

const _bodyCache = new Map();
/** 몸통용 재료 (같은 색이면 같은 재료를 돌려준다) */
export function bodyMat(color) {
  if (!_bodyCache.has(color)) {
    _bodyCache.set(color, new THREE.MeshPhysicalMaterial({
      color, roughness: 0.42, metalness: 0,
      clearcoat: 0.9, clearcoatRoughness: 0.14,   // 겉에 한 겹 코팅한 것처럼 (장난감 느낌)
      envMapIntensity: 1.0,
    }));
  }
  return _bodyCache.get(color);
}

const _glowCache = new Map();
/** 보석·장식용 재료 (스스로 살짝 빛나는 느낌) */
export function glowMat(color) {
  if (!_glowCache.has(color)) {
    _glowCache.set(color, new THREE.MeshPhysicalMaterial({
      color, roughness: 0.30, metalness: 0,
      clearcoat: 1.0, clearcoatRoughness: 0.08,
      emissive: color, emissiveIntensity: 0.22,
      envMapIntensity: 1.2,
    }));
  }
  return _glowCache.get(color);
}

// -----------------------------------------------------------
//  도우미
// -----------------------------------------------------------
/** 그림자를 만들지 않을 부품으로 표시한다 (테두리·날개·반짝이) */
export function noShadow(obj) {
  obj.userData.noShadow = true;
  obj.castShadow = false;
  return obj;
}

/** 메시를 살짝 키워 뒤집어 붙인 "애니 테두리"를 만든다 */
export function makeOutline(mesh, width = OUTLINE_WIDTH) {
  const o = new THREE.Mesh(mesh.geometry, MAT_OUTLINE);
  o.position.copy(mesh.position);
  o.rotation.copy(mesh.rotation);
  o.scale.set(mesh.scale.x + width, mesh.scale.y + width, mesh.scale.z + width);
  o.renderOrder = -1;
  return noShadow(o);
}

/** 색을 조금 밝게/어둡게 (0보다 크면 밝게) */
export function shade(color, amount) {
  const c = new THREE.Color(color);
  if (amount >= 0) c.lerp(new THREE.Color(0xffffff), amount);
  else c.lerp(new THREE.Color(0x000000), -amount);
  return c.getHex();
}

/** 간단한 눈 두 개 (숫자블록 친구용) */
export function addSimpleEyes(parent, y, z, spread, size) {
  for (const s of [-1, 1]) {
    const white = new THREE.Mesh(GEO.eye, MAT_WHITE);
    white.scale.setScalar(size);
    white.position.set(s * spread, y, z);
    parent.add(white);
    const pupil = new THREE.Mesh(GEO.eye, MAT_DARK);
    pupil.scale.setScalar(size * 0.5);
    pupil.position.set(s * spread, y, z + size * 0.42);
    parent.add(pupil);
  }
}
