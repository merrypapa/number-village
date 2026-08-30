// ===========================================================
//  오프닝(타이틀) 화면 — "Inruha World"
//  크고 아름다운 성 앞에서 친구들이 신나게 뛰노는 표지 그림이다.
//  글씨(제목·시작 버튼)는 index.html의 #title 안에 있고,
//  이 파일은 그 뒤에서 도는 3D 장면만 만든다.
// ===========================================================
import * as THREE from 'three';
import { CHARACTERS, getCharacter, createCharacter } from './characters.js';
import { buildTitleCastle } from './title-castle.js';
import { buildSky } from './sky.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
// 오프닝에 나올 친구들 (characters.js의 id를 적는다. 순서대로 왼쪽 → 오른쪽)
//  ※ 요정 친구는 .glb 파일을 받아야 해서, 너무 많이 넣으면 첫 화면이 늦게 뜬다. 8명쯤이 좋다.
const CAST = [
  'nabi', 'sappun', 'aurora', 'ten', 'ruru', 'heartping', 'bitna', 'shasha',
];

const FRIEND_HEIGHT = 4.3;   // 표지에서 친구 키 (성이 아주 커서 친구를 좀 키워 놓았다)
// 친구들은 카메라를 둥글게 감싸고 선다 (그래야 다 같은 크기로 보인다)
const ARC_RADIUS   = 32;     // 카메라에서 친구까지 거리 (크면 친구가 작아진다)
const ARC_CENTER_Z = 48;     // 그 원의 한가운데 (카메라 바로 앞)
const ARC_SPREAD   = 0.50;   // 좌우로 얼마나 넓게 퍼질지 (라디안)
const ARC_GAP      = 0.24;   // 한가운데를 얼마나 비울지 — 성 정문과 '시작하기' 버튼 자리

// 세로로 긴 폰에서는 좌우가 잘려서 친구가 화면 밖으로 나간다 → 카메라를 뒤로 빼서 다 담는다
const CAM_REF_ASPECT = 1.6;  // 기준 화면 비율 (가로 ÷ 세로)
const CAM_MAX_PULL   = 1.3;   // 뒤로 뺄 수 있는 최대 배수 (너무 빼면 성이 작아진다)
const CAM_LOOK_LIFT  = 7.0;   // 세로 화면에서 카메라가 위를 더 보게 (앞쪽 빈 잔디를 줄인다)

const SPIN        = 0.025;  // 카메라가 좌우로 아주 천천히 흔들리는 정도
const CASTLE_Z    = -26;     // 성이 뒤로 물러난 거리 (크면 성이 작게 보인다)

// 구도(시안) 3가지 — 주소 뒤에 ?layout=side 를 붙이면 바로 바꿔 볼 수 있다.
//  grand : 정면에서 성을 통째로 담는 웅장한 구도  ← 기본
//  side  : 비스듬히 보는 구도. 성이 왼쪽, 친구들이 오른쪽 앞
//  close : 친구들을 크게 잡은 구도. 성은 배경
const LAYOUTS = {
  grand: { cam: [0, 7, 50],    look: [0, 12.5, -26], fov: 44 },
  side:  { cam: [26, 8.5, 44], look: [-6, 12.5, -26], fov: 44 },
  close: { cam: [0, 5.5, 34],  look: [0, 9.5, -26],  fov: 48 },
};
const LAYOUT = new URLSearchParams(location.search).get('layout') || 'grand';

// 친구가 추는 춤 세 가지
const DANCES = ['hop', 'spin', 'wave'];

const _camPos = new THREE.Vector3();

// -----------------------------------------------------------
//  들판에 심는 나무 (성 양옆을 채운다)
// -----------------------------------------------------------
const TREE_G = {
  cyl:  new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  ball: new THREE.SphereGeometry(0.5, 12, 10),
};
function makeTree(pink) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(TREE_G.cyl, new THREE.MeshToonMaterial({ color: 0xa9744f }));
  trunk.scale.set(0.8, 3.4, 0.8);
  trunk.position.y = 1.7;
  g.add(trunk);
  const leaf = new THREE.MeshToonMaterial({ color: pink ? 0xffb3d9 : 0x69c96b });
  for (const [x, y, z, s] of [[0, 4.4, 0, 3.6], [1.3, 3.6, 0.6, 2.3], [-1.2, 3.8, -0.5, 2.1]]) {
    const b = new THREE.Mesh(TREE_G.ball, leaf);
    b.position.set(x, y, z);
    b.scale.setScalar(s);
    b.castShadow = true;
    g.add(b);
  }
  return g;
}

// -----------------------------------------------------------
//  공개 API
//  renderer : main.js가 쓰는 렌더러를 같이 쓴다 (화면 전체에 그린다)
//  envMap   : 반질반질한 재질용 반사광
// -----------------------------------------------------------
export function createTitleScreen(renderer, envMap) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8ff);
  scene.fog = new THREE.Fog(0xd8f0ff, 110, 230);
  scene.environment = envMap;

  // --- 조명 (마을과 같은 느낌으로 밝게) ---
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fe08a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.5);
  sun.position.set(30, 60, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;   sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 160;
  scene.add(sun);

  // --- 바닥 ---
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(150, 48),
    new THREE.MeshToonMaterial({ color: 0x9fe08a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- 성 ---
  const castle = buildTitleCastle();
  castle.group.position.z = CASTLE_Z;
  scene.add(castle.group);

  // --- 나무 (성 양옆으로 늘어선다) ---
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const t = makeTree(i % 3 === 0);
    t.position.set(side * (26 + Math.random() * 26), 0, -34 + Math.random() * 62);
    t.scale.setScalar(0.9 + Math.random() * 0.6);
    t.rotation.y = Math.random() * 6;
    scene.add(t);
  }

  // --- 꽃 (앞쪽 들판을 조금 알록달록하게) ---
  const flowerGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const flowerColors = [0xffd93d, 0xff8fc0, 0xffffff, 0xc3b1f5];
  for (let i = 0; i < 60; i++) {
    const f = new THREE.Mesh(flowerGeo,
      new THREE.MeshToonMaterial({ color: flowerColors[i % flowerColors.length] }));
    f.position.set((Math.random() - 0.5) * 90, 0.25, -20 + Math.random() * 60);
    f.scale.setScalar(0.5 + Math.random() * 0.35);
    scene.add(f);
  }

  // --- 하늘 (구름 + 하늘 고래) ---
  const sky = buildSky(scene);

  // --- 카메라 ---
  const L = LAYOUTS[LAYOUT] || LAYOUTS.grand;
  const camera = new THREE.PerspectiveCamera(L.fov, innerWidth / innerHeight, 0.1, 500);
  const look = new THREE.Vector3(...L.look);       // 카메라가 바라보는 곳
  const lookAt = look.clone();                     // 세로 화면에서는 여기서 조금 위를 본다
  // 바라보는 곳에서 카메라까지의 거리·방향. 화면이 좁으면 이 방향으로 더 물러난다.
  const camBase = new THREE.Vector3(...L.cam).sub(look);
  let camPull = 1;
  camera.position.set(...L.cam);
  camera.lookAt(lookAt);

  // -----------------------------------------------------------
  //  친구들 — 성 앞에 반원으로 늘어서서 신나게 논다
  // -----------------------------------------------------------
  // 카메라가 바라보는 방향 (친구들을 그 앞에 세우려고 쓴다)
  const camYaw = Math.atan2(L.look[0] - L.cam[0], L.look[2] - L.cam[2]);

  const friends = [];
  CAST.forEach((id, i) => {
    const def = getCharacter(id);
    const model = createCharacter(def);
    model.traverse(o => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });

    // 자리 잡기 — 친구들은 카메라를 둥글게 감싸고 선다.
    //  왼쪽 절반과 오른쪽 절반으로 나눠 서고, 한가운데(ARC_GAP)는 비워 둔다.
    //  → 성 정문과 '시작하기' 버튼이 친구들에게 가리지 않는다.
    const half = Math.ceil(CAST.length / 2);
    const right = i >= half;
    const k = right ? i - half : i;
    const n = right ? CAST.length - half : half;
    const u = n === 1 ? 0.5 : k / (n - 1);
    const a = (right ? 1 : -1) * (ARC_GAP + (ARC_SPREAD - ARC_GAP) * (right ? u : 1 - u));

    // 카메라가 보는 방향에서 a만큼 돌아간 자리에, 카메라에서 ARC_RADIUS만큼 떨어져 선다
    const dir = camYaw + a;
    const x = L.cam[0] + Math.sin(dir) * ARC_RADIUS;
    const z = L.cam[2] + Math.cos(dir) * ARC_RADIUS;
    model.position.set(x, 0, z);
    model.rotation.y = dir + Math.PI;                 // 카메라를 바라본다

    // 캐릭터마다 원래 키가 달라서(숫자블록은 길쭉하다) 표지에서는 키를 맞춘다
    model.scale.setScalar(FRIEND_HEIGHT / (model.userData.height || 2));
    scene.add(model);

    friends.push({
      model,
      yaw: model.rotation.y,
      dance: DANCES[i % DANCES.length],
      phase: i * 0.7 + Math.random(),
      speed: 2.4 + Math.random() * 1.4,
      hop: 0.5 + Math.random() * 0.7,
    });
  });

  // -----------------------------------------------------------
  //  매 프레임
  // -----------------------------------------------------------
  function update(dt, t) {
    castle.update(dt, t);
    sky.update(dt, t);

    for (const f of friends) {
      // 캐릭터마다 정해진 걷기 동작을 먼저 돌리고 (여기서 y를 건드린다)
      f.model.userData.update?.(t + f.phase, true);
      // 그 위에 표지용 춤을 얹는다
      const p = t * f.speed + f.phase;
      if (f.dance === 'hop') {
        f.model.position.y = Math.abs(Math.sin(p)) * f.hop;
        f.model.rotation.y = f.yaw + Math.sin(p * 0.5) * 0.25;
      } else if (f.dance === 'spin') {
        f.model.position.y = Math.abs(Math.sin(p * 0.5)) * f.hop * 0.6;
        f.model.rotation.y = f.yaw + t * 0.9;
      } else {
        f.model.position.y = Math.abs(Math.sin(p * 0.7)) * f.hop * 0.4;
        f.model.rotation.y = f.yaw + Math.sin(p) * 0.5;
        f.model.rotation.z = Math.sin(p) * 0.1;
      }
    }

    // 카메라가 아주 천천히 좌우로 흔들린다 (살아있는 표지 느낌)
    _camPos.copy(camBase).multiplyScalar(camPull).add(look);
    camera.position.set(
      _camPos.x + Math.sin(t * 0.15) * SPIN * 40,
      _camPos.y + Math.sin(t * 0.21) * 0.6,
      _camPos.z
    );
    camera.lookAt(lookAt);
  }

  function resize() {
    const aspect = innerWidth / innerHeight;
    camera.aspect = aspect;
    // 화면이 세로로 길수록 (폰) 카메라를 뒤로 빼고, 위쪽을 더 본다.
    //  뒤로 빼면 좌우가 다 들어오고, 위를 보면 앞쪽 빈 잔디가 줄어든다.
    const portrait = Math.min(Math.max(CAM_REF_ASPECT / aspect - 1, 0), 1.2);
    camPull = Math.min(1 + portrait, CAM_MAX_PULL);
    lookAt.set(look.x, look.y + CAM_LOOK_LIFT * (portrait / 1.2), look.z);
    camera.updateProjectionMatrix();
  }
  resize();

  return { scene, camera, update, resize };
}

// 친구 수 — index.html의 "친구 45명이 기다려요!" 문구에 쓴다
export const FRIEND_COUNT = CHARACTERS.length;
