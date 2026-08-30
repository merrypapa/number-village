// ===========================================================
//  3D 모델 파일(.glb)로 만든 캐릭터
//
//  ★ 다른 친구들(block/ping/princess)은 코드로 도형을 쌓아서 만들지만,
//    이 친구는 모델링 툴에서 만든 그림 덩어리(assets/models/*.glb)를 불러온다.
//
//  ★ 뼈대(뼈와 관절)가 없는 모델이라 팔다리를 따로 움직일 수는 없다.
//    대신 몸 전체를 통통 튀기고 살짝 갸웃거리게 해서 살아있는 느낌을 낸다.
// ===========================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
// 모델 파일이 있는 폴더.
//  이 파일(src/character-model.js) 위치를 기준으로 찾는다.
//  그래야 index.html에서 열든 tools/ 안의 도구에서 열든 똑같이 찾아간다.
const MODEL_DIR = new URL('../assets/models/', import.meta.url).href;
const HEIGHT    = 1.90;   // 게임 속 키 (다른 요정 친구들과 비슷하게)
const FLOAT     = 0.07;   // 가만히 있을 때 둥실둥실 뜨는 크기
const FLOAT_SPD = 1.6;    // 둥실둥실 속도
const HOP       = 0.20;   // 걸을 때 통통 튀는 높이
const HOP_SPD   = 8;      // 통통 튀는 속도
const TILT      = 0.10;   // 걸을 때 좌우로 갸웃하는 크기
const LEAN      = 0.06;   // 걸을 때 앞으로 살짝 숙이는 크기

// -----------------------------------------------------------
//  모델 파일 불러오기
//  같은 파일은 딱 한 번만 받아서 여러 캐릭터가 나눠 쓴다.
//  (마을 NPC가 24명이어도 파일은 한 번만 받는다)
// -----------------------------------------------------------
const loader = new GLTFLoader();
const cache = new Map();

function loadOnce(file) {
  if (!cache.has(file)) {
    cache.set(file, loader.loadAsync(MODEL_DIR + file).then(gltf => gltf.scene));
  }
  return cache.get(file);
}

// 재사용 벡터 (매번 새로 만들지 않는다)
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

/**
 * def.file   : 불러올 .glb 파일 이름 (assets/models/ 안에 있어야 한다)
 * def.height : 게임 속 키 (안 쓰면 위의 HEIGHT)
 */
export function makeModel(def) {
  const g = new THREE.Group();

  // 모델이 들어갈 자리. 애니메이션은 이 안쪽만 움직인다.
  // (바깥 g는 플레이어 이동·회전이 쓰기 때문에 건드리면 안 된다)
  const holder = new THREE.Group();
  g.add(holder);

  const height = def.height ?? HEIGHT;
  g.userData.height = height;   // 이름표 높이 — 파일을 받기 전에도 필요하다

  // 파일은 나중에 도착한다. 도착하면 그때 크기를 맞춰서 넣는다.
  loadOnce(def.file).then(src => {
    const m = src.clone(true);   // 도형과 재질은 원본과 공유해서 가볍다

    // 1) 크기 맞추기 — 모델이 얼마나 크든 위에서 정한 키에 맞춘다
    _box.setFromObject(m);
    _box.getSize(_size);
    _box.getCenter(_center);
    const s = height / _size.y;
    m.scale.setScalar(s);

    // 2) 위치 맞추기 — 발이 바닥(y=0)에 닿고, 좌우앞뒤 가운데가 0에 오도록
    m.position.set(-_center.x * s, -_box.min.y * s, -_center.z * s);

    // 3) 그림자 (여기서 직접 켠다. 파일이 늦게 도착해서 바깥에서 못 켜준다)
    m.traverse(o => { if (o.isMesh) o.castShadow = true; });

    holder.add(m);
  }).catch(err => {
    console.error(`모델을 불러오지 못했어요: ${MODEL_DIR}${def.file}`, err);
  });

  // -----------------------------------------------------------
  //  움직임 — 뼈대가 없으니 몸 전체를 움직인다
  // -----------------------------------------------------------
  g.userData.animate = (g_, t, moving) => {
    if (moving) {
      holder.position.y = Math.abs(Math.sin(t * HOP_SPD)) * HOP;   // 통통
      holder.rotation.z = Math.sin(t * HOP_SPD) * TILT;            // 좌우 갸웃
      holder.rotation.x = LEAN;                                    // 앞으로 살짝
    } else {
      holder.position.y = Math.sin(t * FLOAT_SPD) * FLOAT;         // 둥실둥실
      holder.rotation.z = Math.sin(t * FLOAT_SPD * 0.7) * 0.035;
      holder.rotation.x = 0;
    }
  };

  return g;
}
