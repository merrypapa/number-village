// ===========================================================
//  🔢 넘버블럭스 월드 — 메인
//  티니핑 월드의 마을(../../src/world.js)을 그대로 쓰되,
//    · 밤이다 (night.js) — 나(100) 주변만 환하다
//    · 숫자 친구 1~99가 흩어져 있다 (rescue.js) — 두드리면 구한다
//    · 구한 친구는 숫자의 집(number-house.js)에 산다, 도감(book.js)에 적힌다
//    · 다 찾으면 광장 달님(moon.js)과 팽이치기(top-game.js) → 이기면 낮
//  ★ 요정 친구는 이 월드에 나오지 않는다.
// ===========================================================
import * as THREE from 'three';
import { createCharacter } from '../../src/characters.js';
import { buildWorld } from '../../src/world.js';
import { createPlayer } from '../../src/player.js';
import { makeStudioEnv } from '../../src/environment.js';
import { setupTouchControls } from '../../src/touch.js';
import { createMusic } from '../../src/music.js';
import { ART } from '../../src/village-sites.js';
import './blocks.js';                                   // 'numberblock' 캐릭터 종류 등록
import { ME } from './block-data.js';
import { createNight } from './night.js';
import { createRescue, clearSave } from './rescue.js';
import { createBook } from './book.js';
import { buildNumberHouse } from './number-house.js';
import { createMoon } from './moon.js';
import { createTopGame } from './top-game.js';
import { createTravel } from './travel.js';
import { toast, createActionButton, createRideButtons, setupMusicButton, createCompass } from './hud.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const TAP_MOVE = 14;      // 손가락이 이보다 덜 움직였으면 '두드림'으로 본다 (px)
const TAP_TIME = 450;     // 이보다 짧게 눌렀다 떼면 '두드림' (ms)
const DAY_KEY  = 'nb-day';
const ADMIN_PW = '0000';  // 관리자 모드 비밀번호

// -----------------------------------------------------------
//  렌더러 / 씬 / 카메라 / 조명 (티니핑 월드와 같다)
// -----------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const hemi = new THREE.HemisphereLight(0xffffff, 0x9fe08a, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6e0, 1.6);
sun.position.set(40, 70, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
sun.shadow.camera.top = 140;   sun.shadow.camera.bottom = -140;
sun.shadow.camera.far = 280;
sun.shadow.normalBias = 0.6;
scene.add(sun);
const envMap = makeStudioEnv(renderer);
scene.environment = envMap;

// 🏘 마을 — 그림의 집 자리에 🔢 숫자의 집
const world = buildWorld(scene, {
  artHouse: { variant: 'numbers', label: '숫자의 집! 🔢 구한 친구들이 여기 살아요', build: buildNumberHouse },
});
const night = createNight(scene, hemi, sun);
//  🔢 숫자의 집은 밤에도 불이 켜져 있어서 멀리서도 보인다 (집 겉모습 창문 옆 + 문 앞)
night.addHouseLight(ART.x, ART.doorZ, 0xffe9a8);
night.addHouseLight(ART.x - 5, ART.z + 7, 0x7ad4ff);
night.addHouseLight(ART.x + 5, ART.z + 7, 0x7ad4ff);
const music = createMusic();

// -----------------------------------------------------------
//  게임 시작 — 나는 숫자 100
// -----------------------------------------------------------
let player = null, rescue = null, moon = null, book = null, topGame = null, travel = null;
let updateAction = null, updateRideBtns = null, updateCompass = null;
let playing = false;

function startGame() {
  const model = createCharacter(ME);
  model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
  scene.add(model);
  player = createPlayer(model, camera, world);
  player.onMount = (ride) => toast(ride.label);
  player.onSpot = (spot) => spot.use?.(toast, player);
  setupTouchControls(player, toggleRun);       // 🏃 오른쪽 아래 버튼 = 달리기 켜기/끄기
  updateAction = createActionButton(player);
  updateRideBtns = createRideButtons(player);
  updateCompass = createCompass(camera, player);

  rescue = createRescue(world, camera, onRescue);
  travel = createTravel({ world, envMap, charId: ME.id, music, player: () => player, toast,
                          rescued: rescue.rescued });
  //  관리자 모드면 달님이 처음부터 '게임 신청'을 받아준다
  moon = createMoon(world, () => (admin ? 0 : rescue.remaining), challenge);
  book = createBook(n => rescue.rescued.has(n), () => { clearSave(); location.reload(); });
  topGame = createTopGame(onTopEnd);
  travel.initVillage();

  // 이미 달님을 이긴 적이 있으면 낮에서 시작한다
  let won = false;
  try { won = localStorage.getItem(DAY_KEY) === '1'; } catch {}
  if (won) { night.setDay(true); travel.releaseToVillage(); }

  document.getElementById('story').classList.remove('on');
  document.getElementById('hud').classList.add('on');
  playing = true;
  music.start();
  music.setScene('village');
  //  브라우저 콘솔에서 확인할 때 쓴다 (F12). 게임 동작에는 영향이 없다
  window.__player = player;
  window.__nb = { rescue, night, travel, topGame, book, moon, onTopEnd };
  toast(won ? '☀️ 밝은 마을에서 친구들과 놀아요!' : `🔦 친구 ${rescue.remaining}명을 찾아요!`, 3000);
}
function onRescue(def, count) {
  music.ping(72 + (def.number % 12));
  if (count >= 99) toast('🎉 99명을 모두 찾았어요! 광장 달님에게 가요', 3500);
  else toast(`숫자 ${def.name}을(를) 구했어요! (${count} / 99)`);
}

// 🏃 달리기 — 버튼을 한 번 누르면 계속 빨리 달리고, 다시 누르면 걷는다
//  (player.js는 Shift 키가 눌린 것으로 알아듣는다)
let running = false;
function toggleRun() {
  if (!playing) return;
  running = !running;
  if (running) player.keys.add('ShiftLeft'); else player.keys.delete('ShiftLeft');
  document.getElementById('hi').classList.toggle('on', running);
  toast(running ? '🏃 빨리 달려요!' : '🚶 천천히 걸어요');
}
// 엔터 = 인사 (키보드용). 가장 가까운 친구가 반응한다
addEventListener('keydown', e => {
  if (e.code === 'Enter' && playing && travel.npcs)
    travel.npcs.greetNearest(player.model.position, name => toast(`${name} 만났어요!`));
});
document.getElementById('bookBtn').onclick = () => book?.open();
setupMusicButton(music);

// 🌙 달님과 팽이치기
function challenge() {
  if (!admin && !rescue.allFound) return;
  toast('달님: 좋아, 팽이치기로 겨루자! 🌀');
  topGame.open();
}
function onTopEnd(won) {
  if (!won) { toast('달님: 다음에 또 도전해~ 🌙'); return; }
  try { localStorage.setItem(DAY_KEY, '1'); } catch {}
  night.setDay();
  travel.releaseToVillage();
  music.melody('birthday');
  toast('☀️ 이겼다! 마을이 환해지고 친구들이 나와요!', 4000);
}

// -----------------------------------------------------------
//  두드리기 — 화면을 톡 치면 그 자리의 친구를 구한다
//  (끌면 카메라가 도는 것이니, 조금만 움직이고 짧게 뗀 것만 두드림으로 본다)
// -----------------------------------------------------------
let tapStart = null;
renderer.domElement.addEventListener('pointerdown', e => {
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
});
renderer.domElement.addEventListener('pointerup', e => {
  if (!tapStart || e.pointerId !== tapStart.id) return;
  const moved = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y);
  const held = performance.now() - tapStart.t;
  tapStart = null;
  if (!playing || !travel.inVillage || moved > TAP_MOVE || held > TAP_TIME) return;
  rescue.tap(e.clientX, e.clientY, player.model.position);
});

// -----------------------------------------------------------
//  스토리 화면 → 시작
// -----------------------------------------------------------
document.getElementById('storyBtn').onclick = startGame;
//  🔧 관리자 모드 (아빠용) — 비밀번호를 맞히면 친구를 안 찾아도 달님이 깨어 있고 팽이치기 버튼이 바로 뜬다
let admin = false;
document.getElementById('adminBtn').onclick = () => {
  if (prompt('관리자 비밀번호') !== ADMIN_PW) return;
  admin = true;
  document.getElementById('topBtn').style.display = 'block';
  startGame();
  toast('🔧 관리자 모드 — 달님이 바로 게임을 받아줘요', 3500);
};
document.getElementById('topBtn').onclick = () => { if (admin) topGame.open(); };
addEventListener('keydown', e => { if (!playing && (e.code === 'Space' || e.code === 'Enter')) startGame(); });

// -----------------------------------------------------------
//  루프
// -----------------------------------------------------------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (!playing) {                          // 스토리 화면 뒤에서 마을이 천천히 돈다
    world.update(dt, t, null);
    night.update(dt, null);
    camera.position.set(Math.sin(t * 0.08) * 30, 12, Math.cos(t * 0.08) * 30);
    camera.lookAt(0, 3, 0);
    renderer.render(scene, camera);
    return;
  }

  const area = travel.area;
  area.update(dt, t, player.model.position);
  player.update(dt, t);
  travel.npcs?.update(dt, t, player.model.position);
  if (travel.inVillage) {
    rescue.update(dt, t, player.model.position, !!player.ride);   // 🐴 말 타는 중이면 더 넓게 닿는다
    moon.update(dt, t);
    night.update(dt, player.model.position);
    updateCompass(night.isDay || book.isOpen ? null : rescue.nearest(player.model.position));
  } else {
    updateCompass(null);
  }
  updateAction();
  updateRideBtns();
  if (player.ride?.say) { toast(player.ride.say); player.ride.say = null; }
  travel.checkDoors();
  renderer.render(area.scene, camera);
}
loop();

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
resize();
