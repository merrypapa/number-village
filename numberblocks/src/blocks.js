// ===========================================================
//  🔢 숫자 블록 친구 3D 만들기 — 원작 표에서 잘라낸 그림(스프라이트)
//  assets/numberblocks/nb1.png … nb100.png 를 종이 인형처럼 세운다.
//  스프라이트는 언제나 카메라를 바라봐서 어디서 봐도 원작 그림 그대로 보인다.
//
//  ★ 그림을 바꾸고 싶으면 같은 이름의 png만 바꿔 넣으면 된다 (코드 수정 없음).
//  ★ 키(크기)는 아래 HEIGHT_MIN / HEIGHT_MAX 로 정한다 — 1이 제일 작고 100이 제일 크다.
// ===========================================================
import * as THREE from 'three';
import { registerBuilder } from '../../src/characters.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const HEIGHT_MIN = 1.1;     // 1의 키
const HEIGHT_MAX = 2.7;     // 100의 키
const SHADOW_ALPHA = 0.22;  // 발밑 그림자 진하기

const SPRITE_DIR = new URL('../../assets/numberblocks/', import.meta.url).href;

/** 숫자 n의 키 — 큰 숫자일수록 조금씩 커진다 */
export function heightOf(n) {
  return HEIGHT_MIN + (HEIGHT_MAX - HEIGHT_MIN) * Math.sqrt((n - 1) / 99);
}

// -----------------------------------------------------------
//  그림 재질 — 숫자마다 한 번만 읽어서 모두가 나눠 쓴다
// -----------------------------------------------------------
const _loader = new THREE.TextureLoader();
const _matCache = new Map();     // n → { mat, aspect(가로/세로), users }
function spriteMat(n) {
  if (_matCache.has(n)) return _matCache.get(n);
  const entry = { mat: null, aspect: 0.8, users: [] };
  const tex = _loader.load(`${SPRITE_DIR}nb${n}.png`, (t) => {
    entry.aspect = t.image.width / t.image.height;
    for (const fit of entry.users) fit(entry.aspect);   // 이미 만들어진 친구들의 가로폭을 맞춘다
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  entry.mat = new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.15 });
  _matCache.set(n, entry);
  return entry;
}

const SHADOW_GEO = new THREE.CircleGeometry(0.5, 20);
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true,
  opacity: SHADOW_ALPHA, depthWrite: false });

// -----------------------------------------------------------
//  친구 한 명 만들기
// -----------------------------------------------------------
export function makeNumberblock(def) {
  const g = new THREE.Group();
  const n = def.number;
  const H = heightOf(n);
  const entry = spriteMat(n);

  const sprite = new THREE.Sprite(entry.mat);
  sprite.center.set(0.5, 0);               // 발이 바닥(y=0)에 닿게
  sprite.userData.block = def;             // 두드렸을 때 누구인지 알려고
  g.add(sprite);

  // 발밑 그림자
  const shadow = new THREE.Mesh(SHADOW_GEO, SHADOW_MAT);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.userData.noShadow = true;
  g.add(shadow);

  const fit = (aspect) => {
    sprite.scale.set(H * aspect, H, 1);
    shadow.scale.set(H * aspect * 0.9, H * aspect * 0.5, 1);
    g.userData.halfW = H * aspect / 2;       // 몸 너비 절반 (닿았는지 볼 때 쓴다)
  };
  fit(entry.aspect);
  entry.users.push(fit);                     // 그림이 다 읽히면 진짜 가로폭으로 다시 맞춘다

  g.userData.height = H;

  // 걸을 때 통통, 서 있을 때 살짝 숨쉬기
  g.userData.animate = (g_, tt, moving) => {
    const sp = moving ? 9 : 2.2;
    g_.position.y = moving ? Math.abs(Math.sin(tt * sp)) * 0.08 : 0;
    sprite.scale.y = H * (1 + (moving ? 0 : Math.sin(tt * sp) * 0.012));
  };
  return g;
}

// characters.js에 'numberblock' 종류로 등록 → createCharacter(def)로 만들 수 있다
registerBuilder('numberblock', makeNumberblock);
