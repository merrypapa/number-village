// ===========================================================
//  숫자마을 대모험 — 메인
//  Phase 0~1 완료 상태입니다. 다음 작업은 docs/기획안.md 참고.
// ===========================================================
import * as THREE from 'three';
import { createCharacter } from './characters.js';
import { buildWorld } from './world.js';
import { createPlayer } from './player.js';
import { createNPCs } from './npcs.js';
import { makeStudioEnv } from './environment.js';
import { setupTouchControls } from './touch.js';
import { createSelectScreen } from './select.js';
import { createTitleScreen } from './title.js';
import { buildCastleInterior } from './castle-interior.js';
import { SAME_FLOOR } from './rides.js';

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
sun.shadow.normalBias = 0.6;      // 넓은 지붕에 얼룩(줄무늬)이 생기지 않게
scene.add(sun);

// 반질반질한 재질에 스튜디오 반사광을 준다 (만화풍 재질에는 영향 없음)
const envMap = makeStudioEnv(renderer);
scene.environment = envMap;

const world = buildWorld(scene);

// -----------------------------------------------------------
//  친구 고르기 화면 (격자 + 크게 보기) → src/select.js
// -----------------------------------------------------------
const select = createSelectScreen(def => startGame(def));

// -----------------------------------------------------------
//  오프닝 화면 (Inruha World) → src/title.js
//  성과 친구들은 3D로, 제목과 버튼은 index.html의 #title로 그린다.
//  아무 데나 누르면 친구 고르기로 넘어간다.
// -----------------------------------------------------------
const title = createTitleScreen(renderer, envMap);
let onTitle = true;

/**
 * 화면이 바뀔 때 새 화면의 버튼을 잠깐 막는다.
 *  ★ 손가락을 한 번 눌렀을 뿐인데 두 화면이 연달아 넘어가던 문제를 막는다.
 *    (화면이 바뀐 자리에 새 버튼이 생기면, 손가락을 뗄 때 생기는 click을
 *     그 새 버튼이 받아버리는 기기가 있다)
 *  ★ 시간만 재면 "꾹 누르고 있다가 떼는" 경우에 이미 시간이 지나버린다.
 *    그래서 **손가락을 뗀 다음부터** 다시 ms만큼 더 기다린다.
 */
function blockTaps(el, ms = 450) {
  el.style.pointerEvents = 'none';
  let freed = false;
  const free = () => { if (!freed) { freed = true; el.style.pointerEvents = ''; } };
  const onRelease = () => {
    removeEventListener('pointerup', onRelease);
    removeEventListener('pointercancel', onRelease);
    setTimeout(free, ms);              // 떼고 나서 ms 뒤에 풀어준다
  };
  addEventListener('pointerup', onRelease);
  addEventListener('pointercancel', onRelease);
  setTimeout(onRelease, 2000);         // 혹시 떼는 신호가 안 와도 언젠가는 풀린다
}

function leaveTitle() {
  if (!onTitle) return;
  onTitle = false;
  document.getElementById('title').classList.remove('on');
  const pick = document.getElementById('pick');
  pick.classList.add('on');
  blockTaps(pick);                     // 친구 카드가 곧바로 눌리지 않게
  select.lock();                       // (기기에 따라 위 방법이 안 통할 때를 대비)
}
//  ★ 손가락을 "뗄 때"(pointerup) 넘어간다. 누르는 순간 넘어가면
//    그 다음에 오는 click을 새 화면의 카드가 받아버린다.
document.getElementById('title').addEventListener('pointerup', leaveTitle);
addEventListener('keydown', e => {
  if (onTitle && (e.code === 'Space' || e.code === 'Enter')) leaveTitle();
});


// -----------------------------------------------------------
//  게임 시작
// -----------------------------------------------------------
let player = null;
let playing = false;
let charId = null;

// -----------------------------------------------------------
//  공간(area) — 마을과 성 안. 문으로 오간다.
//  공간 하나는 { scene, spawn, collide, isBlocked, update, rides, doors } 모양이다.
//  성 안처럼 층이 있는 공간은 groundY(x, z, 지금높이)도 있다 (계단·2층).
//  성 안처럼 층이 있는 공간은 groundY(x, z, 지금높이)도 있다 (계단·2층).
//  성 안은 처음 들어갈 때 한 번만 만든다 (처음 로딩을 빠르게).
// -----------------------------------------------------------
const areas = { village: world };
let area = world;                 // 지금 있는 공간
let npcs = null;                  // 지금 공간의 친구들
const areaNpcs = {};              // 공간마다 친구들을 따로 기억해 둔다

function getArea(name) {
  if (!areas[name]) {
    if (name === 'castle') areas[name] = buildCastleInterior(envMap, charId);
  }
  const a = areas[name];
  if (!areaNpcs[name]) {
    areaNpcs[name] = createNPCs(a.scene, charId, a, a.npcCount ?? undefined);
  }
  return a;
}

function startGame(def) {
  charId = def.id;
  const model = createCharacter(def);
  model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
  scene.add(model);
  player = createPlayer(model, camera, world);
  player.onMount = (ride) => toast(ride.label);   // '그네를 타요!' 같은 안내
  player.onSpot = useSpot;                       // 요정 친구 진열대에서 '부르기'
  npcs = areaNpcs.village = createNPCs(scene, def.id, world);
  setupTouchControls(player, sayHi);   // 가상 조이스틱 + 점프·인사·타기 버튼

  document.getElementById('pick').classList.remove('on');
  document.getElementById('preview').classList.remove('on');
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
// 인사 버튼은 touch.js가 연결한다 (터치 반응이 빠르도록)
//  스페이스는 점프라서, 키보드 인사는 엔터로 한다.
addEventListener('keydown', e => { if (e.code === 'Enter') sayHi(); });
document.getElementById('bookBtn').onclick = () => toast('친구 도감은 곧 만들 거예요 📖');

// -----------------------------------------------------------
//  🅰 행동 버튼 — 지금 서 있는 자리에서 할 수 있는 일을 보여준다
//    그네·미끄럼틀 옆 → 타기 / 내리기
//    성 안 요정 친구 앞 → 부르기 / 보내기
// -----------------------------------------------------------
const actionBtn = document.getElementById('ride');
let actionLabel = '';

function updateActionButton() {
  let want = '';                                   // 빈 글씨면 버튼을 숨긴다
  //  놀이기구가 verb / offVerb를 적어두면 그 말을 쓴다 (잠자기·공부하기 등)
  if (player.ride) want = player.ride.autoEnd ? '' : (player.ride.offVerb || '내리기');
  else if (player.nearRide) want = player.nearRide.verb || '타기';
  else if (player.nearSpot) want = player.nearSpot.npc ? '보내기' : '부르기';

  if (want === actionLabel) return;                // 바뀔 때만 손댄다
  actionLabel = want;
  actionBtn.style.display = want ? 'flex' : 'none';
  if (want) {
    actionBtn.textContent = want;
    actionBtn.dataset.len = String(want.length);   // 긴 글씨는 CSS가 작게 줄인다
  }
}

// -----------------------------------------------------------
//  🧚 요정 친구 부르기 — 성 안 진열대에서 버튼을 눌렀을 때
//    부르면 그 친구가 성 안을 돌아다니고, 다시 누르면 제자리로 돌아간다.
// -----------------------------------------------------------
function useSpot(spot) {
  if (spot.kind !== 'summon' || !npcs) return;
  if (spot.npc) {
    npcs.remove(spot.npc);
    spot.npc = null;
    spot.setOut(false);
    toast(`${spot.def.name} 안녕! 또 놀자`);
  } else {
    spot.npc = npcs.add(spot.def, spot.spawnAt);
    spot.setOut(true);
    toast(`${spot.def.name}, 같이 놀자!`);
  }
}

// -----------------------------------------------------------
//  🚪 문 — 성 정문 앞에 서면 성 안으로, 성 안의 문으로 나오면 마을로
//  화면을 잠깐 하얗게 덮었다가(fade) 새 공간을 보여준다.
// -----------------------------------------------------------
const fade = document.getElementById('fade');
let doorArmed = false;      // 문에서 한 번 떨어져야 다시 들어갈 수 있다 (문 앞에서 무한 반복 방지)
let moving = false;         // 지금 화면이 넘어가는 중인가

function checkDoors() {
  if (moving) return;
  const p = player.model.position;
  let hit = null;
  for (const d of area.doors || []) {
    //  ★ 다른 층에 있는 문은 무시한다 (2층에서 1층 문 위를 지나가도 안 나가진다)
    if (Math.abs(player.footY - (d.y ?? 0)) > SAME_FLOOR) continue;
    if (Math.hypot(p.x - d.x, p.z - d.z) < d.r) { hit = d; break; }
  }
  if (!hit) { doorArmed = true; return; }     // 문에서 떨어졌다 → 다음에 또 들어갈 수 있다
  if (!doorArmed) return;
  goThroughDoor(hit);
}

function goThroughDoor(door) {
  moving = true;
  doorArmed = false;
  fade.classList.add('on');
  setTimeout(() => {
    area = getArea(door.to);
    npcs = areaNpcs[door.to];
    player.moveTo(area, door.arrive, door.arriveYaw);
    fade.classList.remove('on');
    moving = false;
    toast(door.label);
  }, 320);
}

// -----------------------------------------------------------
//  루프
// -----------------------------------------------------------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 오프닝 화면 — 성 앞에서 친구들이 노는 장면만 그린다
  if (onTitle) {
    title.update(dt, t);
    renderer.render(title.scene, title.camera);
    return;
  }

  // 지금 있는 공간만 움직인다 (마을: 구름·고래·그네 / 성 안: 불꽃·반짝이·풍선)
  area.update(dt, t);

  if (playing && player) {
    player.update(dt, t);
    npcs?.update(dt, t, player.model.position);
    updateActionButton();
    checkDoors();
    renderer.render(area.scene, camera);
  } else {
    select.update(dt, t);
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
  title.resize();
  select.resize();
}
addEventListener('resize', resize);
resize();
