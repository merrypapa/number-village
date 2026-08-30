// ===========================================================
//  친구 고르기 화면
//  1) 격자 화면 — 친구 얼굴을 한 번에 쭉 보여준다 (친구가 많아도 금방 찾는다)
//  2) 크게 보기 화면 — 고른 친구를 3D로 빙글빙글 돌려 보고 "놀기"를 누른다
//
//  ★ 격자에는 3D를 띄우지 않고 작은 사진(assets/thumbs/*.jpg)만 쓴다.
//    친구가 45명이어도 폰이 안 느려지는 이유가 이것이다.
//    사진이 없는 친구는 이름표 카드로 자동으로 바뀌니, 사진이 없어도 잘 돌아간다.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, createCharacter } from './characters.js';
import { makeStudioEnv } from './environment.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
// 작은 사진이 있는 곳 (이 파일 위치 기준 — character-model.js와 같은 방식)
const THUMB_DIR = new URL('../assets/thumbs/', import.meta.url).href;
const SPIN_SPEED = 0.7;                 // 크게 보기에서 도는 속도

/** 이름으로 파스텔 색을 만든다 (사진이 없을 때 카드 색으로 쓴다) */
function tintOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 84%)`;
}

/**
 * onPlay(def) : "이 친구로 놀기!"를 누르면 불린다.
 * 반환값의 update(dt, t)를 매 프레임 불러주면 크게 보기 화면이 돌아간다.
 */
export function createSelectScreen(onPlay) {
  const pickScreen = document.getElementById('pick');
  const prevScreen = document.getElementById('preview');
  const grid       = document.getElementById('grid');
  const nameEl     = document.getElementById('charName');

  // --- 크게 보기용 작은 3D 무대 ---
  const stage = document.getElementById('charStage');

  // -----------------------------------------------------------
  //  화면이 막 바뀐 뒤 0.4초 동안은 버튼을 못 누르게 한다.
  //  ★ 한 번 눌렀을 뿐인데 두 화면이 연달아 넘어가던 문제를 막는다.
  //    (누르는 순간 화면이 바뀌면, 손가락을 뗄 때 생기는 click을
  //     그 자리에 새로 나타난 버튼이 받아버리는 기기가 있다)
  // -----------------------------------------------------------
  const LOCK_MS = 450;
  let lockUntil = 0;
  const lock = (ms = LOCK_MS) => { lockUntil = performance.now() + ms; };
  const locked = () => performance.now() < lockUntil;
  const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffd6e8, 1.4));
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(3, 6, 5);
  scene.add(light);
  scene.environment = makeStudioEnv(renderer);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);

  let pickIndex = 0;
  let model = null;

  // -----------------------------------------------------------
  //  1) 격자 만들기 — 친구 한 명이 카드 한 장
  // -----------------------------------------------------------
  CHARACTERS.forEach((def, i) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.style.setProperty('--tint', tintOf(def.id));

    const img = document.createElement('img');
    img.src = `${THUMB_DIR}${def.id}.jpg`;
    img.alt = def.name;
    img.loading = 'lazy';        // 화면에 보일 때만 받는다
    img.decoding = 'async';
    // 사진이 아직 없는 친구는 색 카드로 (첫 글자를 크게 보여준다)
    img.onerror = () => {
      img.remove();
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = def.name.trim()[0] || '?';
      card.prepend(letter);
    };

    const label = document.createElement('span');
    label.className = 'cardName';
    label.textContent = def.name;

    card.append(img, label);
    card.onclick = () => { if (!locked()) showPreview(i); };
    grid.append(card);
  });

  // -----------------------------------------------------------
  //  2) 크게 보기
  // -----------------------------------------------------------
  function showPreview(i) {
    lock();                       // 방금 누른 손가락이 다음 화면 버튼까지 누르지 않게
    pickIndex = (i + CHARACTERS.length) % CHARACTERS.length;
    const def = CHARACTERS[pickIndex];

    if (model) scene.remove(model);
    model = createCharacter(def);
    scene.add(model);

    const h = model.userData.height || 2;
    cam.position.set(0, h * 0.55, h * 1.9 + 1.4);
    cam.lookAt(0, h * 0.52, 0);
    nameEl.textContent = def.name;

    pickScreen.classList.remove('on');
    prevScreen.classList.add('on');
    resize();
  }

  function backToGrid() {
    lock();
    prevScreen.classList.remove('on');
    pickScreen.classList.add('on');
  }

  document.getElementById('back').onclick = backToGrid;
  document.getElementById('prev').onclick = () => showPreview(pickIndex - 1);
  document.getElementById('next').onclick = () => showPreview(pickIndex + 1);
  document.getElementById('playBtn').onclick = () => {
    if (locked()) return;
    pickScreen.classList.remove('on');
    prevScreen.classList.remove('on');
    onPlay(CHARACTERS[pickIndex]);
  };

  // -----------------------------------------------------------
  //  매 프레임 (크게 보기 화면이 켜져 있을 때만 그린다)
  // -----------------------------------------------------------
  function update(dt, t) {
    if (!prevScreen.classList.contains('on') || !model) return;
    model.rotation.y += dt * SPIN_SPEED;
    model.userData.update?.(t, false);
    renderer.render(scene, cam);
  }

  function resize() {
    const s = Math.min(stage.clientWidth, stage.clientHeight) || 320;
    renderer.setSize(s, s, false);
    cam.aspect = 1;
    cam.updateProjectionMatrix();
  }

  resize();
  return { update, resize, backToGrid, lock };
}
