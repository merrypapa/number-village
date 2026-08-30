// ===========================================================
//  숫자마을 대모험 — 메인
//  Phase 0~1 완료 상태입니다. 다음 작업은 docs/기획안.md 참고.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, createCharacter } from './characters.js';
import { buildWorld } from './world.js';
import { createPlayer } from './player.js';
import { createNPCs } from './npcs.js';
import { makeStudioEnv } from './environment.js';

// -----------------------------------------------------------
//  렌더러 / 씬 / 카메라
// -----------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe8ff);
scene.fog = new THREE.Fog(0xbfe8ff, 120, 220);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);

// 조명 — 밝고 부드럽게
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fe08a, 1.1));
const sun = new THREE.DirectionalLight(0xfff6e0, 1.6);
sun.position.set(40, 70, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;   sun.shadow.camera.bottom = -90;
sun.shadow.camera.far = 200;
scene.add(sun);

// 반질반질한 재질에 스튜디오 반사광을 준다 (만화풍 재질에는 영향 없음)
scene.environment = makeStudioEnv(renderer);

const world = buildWorld(scene);

// -----------------------------------------------------------
//  캐릭터 선택 화면 (작은 별도 씬)
// -----------------------------------------------------------
const stage = document.getElementById('charStage');
const sRenderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true });
sRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const sScene = new THREE.Scene();
sScene.add(new THREE.HemisphereLight(0xffffff, 0xffd6e8, 1.4));
const sLight = new THREE.DirectionalLight(0xffffff, 1.2);
sLight.position.set(3, 6, 5);
sScene.add(sLight);
sScene.environment = makeStudioEnv(sRenderer);
const sCam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);

let pickIndex = 0;
let preview = null;

function showPreview() {
  if (preview) sScene.remove(preview);
  const def = CHARACTERS[pickIndex];
  preview = createCharacter(def);
  sScene.add(preview);
  const h = preview.userData.height || 2;
  sCam.position.set(0, h * 0.55, h * 1.9 + 1.4);
  sCam.lookAt(0, h * 0.52, 0);
  document.getElementById('charName').textContent = def.name;
}
showPreview();

document.getElementById('prev').onclick = () => {
  pickIndex = (pickIndex - 1 + CHARACTERS.length) % CHARACTERS.length; showPreview();
};
document.getElementById('next').onclick = () => {
  pickIndex = (pickIndex + 1) % CHARACTERS.length; showPreview();
};
document.getElementById('playBtn').onclick = () => startGame(CHARACTERS[pickIndex]);

// -----------------------------------------------------------
//  게임 시작
// -----------------------------------------------------------
let player = null;
let npcs = null;
let playing = false;

function startGame(def) {
  const model = createCharacter(def);
  model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
  scene.add(model);
  player = createPlayer(model, camera, world);
  npcs = createNPCs(scene, def.id, world);

  document.getElementById('select').classList.remove('on');
  document.getElementById('hud').classList.add('on');
  playing = true;
  toast(`${def.name}(으)로 놀아요!`);
}

// 화면 가운데 메시지
let toastTimer = 0;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2000);
}

// 인사 버튼 — 가장 가까운 친구가 반응한다
function sayHi() {
  if (!playing || !npcs) return;
  npcs.greetNearest(player.model.position, nameWithParticle => toast(`${nameWithParticle} 만났어요!`));
}
document.getElementById('hi').onclick = sayHi;
addEventListener('keydown', e => { if (e.code === 'Space') sayHi(); });
document.getElementById('bookBtn').onclick = () => toast('친구 도감은 곧 만들 거예요 📖');

// -----------------------------------------------------------
//  루프
// -----------------------------------------------------------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 구름 흐르기, 하늘 고래, 그네·시소 움직이기
  world.update(dt, t);

  if (playing && player) {
    player.update(dt, t);
    npcs?.update(dt, t, player.model.position);
    renderer.render(scene, camera);
  } else {
    preview.rotation.y += dt * 0.7;
    preview.userData.update?.(t, false);
    sRenderer.render(sScene, sCam);
  }
}
loop();

// -----------------------------------------------------------
//  리사이즈
// -----------------------------------------------------------
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  const s = Math.min(stage.clientWidth, stage.clientHeight) || 320;
  sRenderer.setSize(s, s, false);
  sCam.aspect = 1;
  sCam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
