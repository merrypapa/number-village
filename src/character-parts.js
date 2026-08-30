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
export const CHEEK_COLOR   = 0xff92b6;   // 볼터치 분홍
export const SPARK_COLOR   = 0xfff3ad;   // 반짝이 별 색

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
};

// -----------------------------------------------------------
//  공용 재료
// -----------------------------------------------------------
export const MAT_WHITE   = new THREE.MeshToonMaterial({ color: 0xffffff });
export const MAT_DARK    = new THREE.MeshToonMaterial({ color: DARK_COLOR });
export const MAT_CHEEK   = new THREE.MeshToonMaterial({ color: CHEEK_COLOR });
export const MAT_OUTLINE = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });
export const MAT_SPARK   = new THREE.MeshBasicMaterial({ color: SPARK_COLOR });
export const MAT_SHINE   = new THREE.MeshBasicMaterial({ color: 0xffffff }); // 눈 하이라이트(빛 안 받고 항상 하얗게)

const _bodyCache = new Map();
/** 몸통용 재료 (같은 색이면 같은 재료를 돌려준다) */
export function bodyMat(color) {
  if (!_bodyCache.has(color)) _bodyCache.set(color, new THREE.MeshToonMaterial({ color }));
  return _bodyCache.get(color);
}

const _glossCache = new Map();
/**
 * 반질반질한 장난감 재질 (사진 같은 3D 인형 느낌)
 * ★ characters.js에서 glossy:true 를 준 친구만 이 재질을 쓴다.
 */
export function glossMat(color) {
  if (!_glossCache.has(color)) {
    _glossCache.set(color, new THREE.MeshPhysicalMaterial({
      color, roughness: 0.40, metalness: 0.0,
      clearcoat: 0.55, clearcoatRoughness: 0.30,
    }));
  }
  return _glossCache.get(color);
}

/** 캐릭터에 맞는 몸 재질을 골라준다 (glossy면 반질반질, 아니면 만화풍) */
export function matOf(def, color) {
  return def.glossy ? glossMat(color) : bodyMat(color);
}

const _glowCache = new Map();
/** 보석·장식용 재료 (스스로 살짝 빛나는 느낌) */
export function glowMat(color) {
  if (!_glowCache.has(color)) {
    _glowCache.set(color, new THREE.MeshToonMaterial({ color, emissive: color, emissiveIntensity: 0.45 }));
  }
  return _glowCache.get(color);
}

const _filmCache = new Map();
/** 날개용 반투명 재료 */
export function filmMat(color) {
  if (!_filmCache.has(color)) {
    _filmCache.set(color, new THREE.MeshToonMaterial({
      color, transparent: true, opacity: 0.82,
      side: THREE.DoubleSide, depthWrite: false,
    }));
  }
  return _filmCache.get(color);
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
