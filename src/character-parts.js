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
      // 가장자리가 은은하게 빛나서 피부가 말랑해 보인다
      sheen: 0.8, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffc9dc),
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

const _glossVertexCache = new Map();
/** 정점마다 색이 다른 반질반질 재질 (머리카락 그라데이션용). map을 주면 결 무늬가 들어간다 */
export function glossVertexMat(map = null) {
  if (!_glossVertexCache.has(map)) {
    _glossVertexCache.set(map, new THREE.MeshPhysicalMaterial({
      vertexColors: true, map, roughness: 0.38, metalness: 0.0,
      clearcoat: 0.6, clearcoatRoughness: 0.26,
    }));
  }
  return _glossVertexCache.get(map);
}

const _glossMapCache = new Map();
/** 무늬가 들어간 반질반질 재질 */
export function glossMapMat(color, map) {
  const key = color + ':' + map.uuid;
  if (!_glossMapCache.has(key)) {
    _glossMapCache.set(key, new THREE.MeshPhysicalMaterial({
      color, map, roughness: 0.38, metalness: 0.0,
      clearcoat: 0.6, clearcoatRoughness: 0.26,
    }));
  }
  return _glossMapCache.get(key);
}

/**
 * 머리카락 한 가닥 만들기 — 점들을 이은 부드러운 곡선을 따라 굵기가 변하는 관.
 *  points  : [[x,y,z], ...] 곡선이 지나갈 점들
 *  rStart  : 뿌리 굵기, rEnd: 끝 굵기 (rEnd를 크게 하면 끝이 퍼진다)
 *  colorA  : 뿌리 색, colorB: 끝 색 (사이는 자연스럽게 섞인다)
 */
export function makeStrand(points, rStart, rEnd, colorA, colorB, seg = 40, rad = 10, map = null) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(colorA), cB = new THREE.Color(colorB), c = new THREE.Color();
  const center = new THREE.Vector3();

  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    curve.getPointAt(t, center);
    // 굵기: 끝으로 갈수록 오히려 조금 퍼지고, 맨 끝만 동그랗게 닫힌다 (뭉툭한 머리끝)
    const cap = t > 0.86 ? Math.sqrt(Math.max(0, 1 - ((t - 0.86) / 0.14) ** 2)) : 1;
    const r = (rStart + (rEnd - rStart) * t) * cap;
    // 색은 중간부터 서서히 끝 색으로
    const m = Math.min(1, Math.max(0, (t - 0.58) / 0.34));
    c.copy(cA).lerp(cB, m * m * (3 - 2 * m));

    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      pos.setXYZ(k,
        center.x + (pos.getX(k) - center.x) * r,
        center.y + (pos.getY(k) - center.y) * r,
        center.z + (pos.getZ(k) - center.z) * r);
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const m = new THREE.Mesh(geo, glossVertexMat(map));
  m.castShadow = true;
  return m;
}

// -----------------------------------------------------------
//  얼굴 모양 만들기
//  구(공)를 그대로 쓰면 얼굴이 동그란 구슬처럼 보인다.
//  광대는 살짝 넓히고 턱은 좁혀서 계란형 얼굴을 만든다.
// -----------------------------------------------------------
/** y(-0.5 ~ 0.5) 높이에서 가로로 얼마나 넓힐지 */
export function faceShape(y) {
  const t = y + 0.5;                                   // 0(턱) ~ 1(정수리)
  const cheek = 1 + 0.09 * Math.exp(-(((t - 0.52) / 0.30) ** 2));
  const chin  = t < 0.42 ? 1 - 0.44 * ((0.42 - t) / 0.42) ** 1.6 : 1;
  return cheek * chin;
}

/** 도형의 점들을 모양 함수대로 밀어서 계란형으로 바꾼다 */
export function shapeGeometry(geo, fn) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = fn(pos.getY(i));
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** 꽃잎 모양 — 위아래로 갈수록 뾰족해지는 나뭇잎 형태 (하얀 귀에 쓴다) */
export function petalShape(y) {
  const t = y + 0.5;
  return Math.pow(Math.sin(Math.max(0, Math.min(1, t)) * Math.PI), 0.55);
}
