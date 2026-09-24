// ===========================================================
//  🔢 숫자 블록 친구 3D 만들기 — 원작 표에서 잘라낸 그림으로 **두툼한 블록**을 만든다
//  assets/numberblocks/nb1.png … nb100.png 를 앞면·뒷면에 붙이고,
//  그림을 보고 잰 몸통 범위만큼 상자를 넣어 옆에서 봐도 두께가 있다.
//  걸으면 몸이 도는 진짜 3D 물체다 (스프라이트 아님).
//
//  ★ 그림을 바꾸고 싶으면 같은 이름의 png만 바꿔 넣으면 된다 (코드 수정 없음).
//  ★ 키(크기)는 아래 HEIGHT_MIN / HEIGHT_MAX 로 정한다 — 1이 제일 작고 100이 제일 크다.
// ===========================================================
import * as THREE from 'three';
import { registerBuilder } from '../../src/characters.js';
import { makeHundred } from './block-100.js';

// 진짜 3D 모델이 따로 있는 숫자 — 여기 적힌 숫자는 그림 대신 그 모델을 쓴다
const REAL_3D = { 100: makeHundred };

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
//  그림 읽기 — 숫자마다 한 번만. 그림을 보고 **몸통이 어디까지인지**와 몸 색도 알아낸다
//    body : 팔·모자를 뺀 블록 몸통의 범위 (0~1, 왼쪽/오른쪽/아래/위)
//    color: 몸통 평균 색 → 옆면·윗면 색으로 쓴다
// -----------------------------------------------------------
const _loader = new THREE.TextureLoader();
const _cache = new Map();     // n → entry
function measure(img) {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  const W = cv.width, H = cv.height;
  // 세로줄마다 불투명 픽셀 수 — 몸통은 위아래로 길게 차 있고, 팔은 짧다
  const colFill = new Array(W).fill(0), rowFill = new Array(H).fill(0);
  let r = 0, gg = 0, b = 0, cnt = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] < 100) continue;
    colFill[x]++; rowFill[y]++;
    r += d[i]; gg += d[i + 1]; b += d[i + 2]; cnt++;
  }
  const maxCol = Math.max(...colFill), maxRow = Math.max(...rowFill);
  let x0 = 0; while (x0 < W && colFill[x0] < maxCol * 0.55) x0++;
  let x1 = W - 1; while (x1 > 0 && colFill[x1] < maxCol * 0.55) x1--;
  let y0 = 0; while (y0 < H && rowFill[y0] < maxRow * 0.55) y0++;
  let y1 = H - 1; while (y1 > 0 && rowFill[y1] < maxRow * 0.55) y1--;
  const color = cnt ? ((Math.round(r / cnt) << 16) | (Math.round(gg / cnt) << 8) | Math.round(b / cnt)) : 0xcccccc;
  //  y는 그림 좌표(위가 0) → 아래가 0인 비율로 바꾼다
  return { aspect: W / H, color, bx0: x0 / W, bx1: (x1 + 1) / W, by0: 1 - (y1 + 1) / H, by1: 1 - y0 / H };
}
function spriteMat(n) {
  if (_cache.has(n)) return _cache.get(n);
  const entry = { front: null, back: null, side: null, users: [],
                  aspect: 0.8, color: 0xcccccc, bx0: 0.15, bx1: 0.85, by0: 0.08, by1: 0.92 };
  const tex = _loader.load(`${SPRITE_DIR}nb${n}.png`, (t) => {
    Object.assign(entry, measure(t.image));
    entry.side.color.setHex(entry.color);
    for (const fit of entry.users) fit();          // 이미 만들어진 친구들의 크기를 다시 맞춘다
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const back = tex.clone();                        // 뒷면은 좌우를 뒤집은 같은 그림
  back.repeat.x = -1; back.offset.x = 1;
  const opts = { transparent: true, alphaTest: 0.15, side: THREE.FrontSide };
  entry.front = new THREE.MeshLambertMaterial({ map: tex, ...opts });
  entry.back  = new THREE.MeshLambertMaterial({ map: back, ...opts });
  entry.side  = new THREE.MeshToonMaterial({ color: entry.color });
  _cache.set(n, entry);
  return entry;
}

const PLANE = new THREE.PlaneGeometry(1, 1);
const BOX   = new THREE.BoxGeometry(1, 1, 1);
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 20);
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true,
  opacity: SHADOW_ALPHA, depthWrite: false });

// -----------------------------------------------------------
//  친구 한 명 만들기 — 앞면 그림 + 두툼한 몸통 상자 + 뒷면 그림(거울)
//   ★ 두께 = 몸통 폭 ÷ 한 줄 블록 수(≈√n). 1은 정육면체, 100은 얇은 판이 된다
// -----------------------------------------------------------
export function makeNumberblock(def) {
  if (REAL_3D[def.number]) return REAL_3D[def.number](def);   // 🔴 100처럼 진짜 3D 모델이 있으면 그걸로
  const g = new THREE.Group();
  const n = def.number;
  const H = heightOf(n);
  const entry = spriteMat(n);

  const front = new THREE.Mesh(PLANE, entry.front);
  const back  = new THREE.Mesh(PLANE, entry.back);
  back.rotation.y = Math.PI;
  const body  = new THREE.Mesh(BOX, entry.side);
  body.castShadow = true;
  body.userData.block = def;                 // 두드렸을 때 누구인지 알려고
  front.userData.block = back.userData.block = def;
  front.userData.noShadow = back.userData.noShadow = true;
  g.add(front, back, body);

  // 발밑 그림자
  const shadow = new THREE.Mesh(SHADOW_GEO, SHADOW_MAT);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.userData.noShadow = true;
  g.add(shadow);

  let depth = 0.3;
  const fit = () => {
    const W = H * entry.aspect;
    const bw = (entry.bx1 - entry.bx0) * W, bh = (entry.by1 - entry.by0) * H;
    depth = Math.max(0.12, bw / Math.max(1, Math.round(Math.sqrt(n))));
    front.scale.set(W, H, 1); back.scale.set(W, H, 1);
    front.position.set(0, H / 2, depth / 2 + 0.004);
    back.position.set(0, H / 2, -depth / 2 - 0.004);
    body.scale.set(bw, bh, depth);
    body.position.set((entry.bx0 + entry.bx1 - 1) / 2 * W, entry.by0 * H + bh / 2, 0);
    shadow.scale.set(W * 0.9, Math.max(depth, W * 0.4), 1);
    g.userData.halfW = W / 2;                // 몸 너비 절반 (닿았는지 볼 때 쓴다)
  };
  fit();
  entry.users.push(fit);                     // 그림이 다 읽히면 진짜 비율로 다시 맞춘다

  g.userData.height = H;

  // 걸을 때 통통 + 살짝 갸우뚱, 서 있을 때 숨쉬기
  g.userData.animate = (g_, tt, moving) => {
    const sp = moving ? 9 : 2.2;
    g_.position.y = moving ? Math.abs(Math.sin(tt * sp)) * 0.08 : 0;
    g_.rotation.z = moving ? Math.sin(tt * sp * 0.5) * 0.06 : 0;
    const sy = 1 + (moving ? 0 : Math.sin(tt * sp) * 0.012);
    front.scale.y = back.scale.y = H * sy;
  };
  return g;
}

// characters.js에 'numberblock' 종류로 등록 → createCharacter(def)로 만들 수 있다
registerBuilder('numberblock', makeNumberblock);
