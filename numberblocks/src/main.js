// ===========================================================
//  넘버블럭스 월드 — 메인 (Phase 0: 무대 준비)
//  아직은 숫자 블록 탑 10개가 서 있는 들판뿐이다.
//  탑을 누르면 몇 개짜리인지 말해준다. 다음 Phase는 docs/넘버블럭스-진행상황.md 참고.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const TOWER_COUNT = 10;          // 블록 탑 몇 개 (1부터 이 숫자까지)
const BLOCK_SIZE  = 1;           // 블록 한 개 크기
const SPIN_SPEED  = 0.12;        // 카메라가 도는 속도
// 숫자마다 블록 색 (1번 탑 = 첫 번째 색)
const COLORS = [0xff6b6b, 0xffa94d, 0xffd93d, 0x69db7c, 0x4dabf7,
                0x9775fa, 0xf783ac, 0x38d9a9, 0xffc078, 0xffffff];

// -----------------------------------------------------------
//  렌더러 / 씬 / 카메라
// -----------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe8ff);
scene.fog = new THREE.Fog(0xbfe8ff, 40, 90);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);

// 조명 — 밝고 부드럽게
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fe08a, 1.2));
const sun = new THREE.DirectionalLight(0xfff6e0, 1.5);
sun.position.set(15, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 });
scene.add(sun);

// 들판
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48),
  new THREE.MeshLambertMaterial({ color: 0x9fe08a }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// -----------------------------------------------------------
//  숫자 블록 탑 — 숫자 N이면 블록 N개를 쌓는다
//  ★ geometry 한 개, 색마다 material 한 개만 만들어서 재사용한다
// -----------------------------------------------------------
const blockGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.96, BLOCK_SIZE * 0.96, BLOCK_SIZE * 0.96);
const blockMats = COLORS.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));

/** 캔버스에 숫자를 그려서 탑 위에 띄울 팻말을 만든다 */
function makeNumberSign(n) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a78b0';
  g.font = 'bold 76px sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv) }));
  sp.scale.set(1.2, 1.2, 1);
  return sp;
}

const towers = [];
for (let n = 1; n <= TOWER_COUNT; n++) {
  const tower = new THREE.Group();
  const mat = blockMats[(n - 1) % blockMats.length];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(blockGeo, mat);
    b.position.y = BLOCK_SIZE * (i + 0.5);
    b.castShadow = true;
    tower.add(b);
  }
  const sign = makeNumberSign(n);
  sign.position.y = BLOCK_SIZE * n + 0.9;
  tower.add(sign);
  // 둥글게 늘어놓는다
  const a = (n - 1) / TOWER_COUNT * Math.PI * 2;
  tower.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 9);
  tower.userData.n = n;
  scene.add(tower);
  towers.push(tower);
}

// -----------------------------------------------------------
//  탑을 누르면 숫자를 말해준다
// -----------------------------------------------------------
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const sayEl = document.getElementById('say');
let sayTimer = 0;
let bounce = null;                       // 방금 누른 탑 (통통 튄다)
let bounceT = 0;

renderer.domElement.addEventListener('pointerup', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(towers, true)[0];
  if (!hit) return;
  let o = hit.object;
  while (o.parent && !o.userData.n) o = o.parent;
  sayEl.textContent = `블록 ${o.userData.n}개! 숫자 ${o.userData.n}!`;
  sayEl.classList.add('on');
  sayTimer = 2;
  bounce = o; bounceT = 0;
});

// -----------------------------------------------------------
//  루프
// -----------------------------------------------------------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 카메라가 들판을 천천히 빙 돈다
  const a = t * SPIN_SPEED;
  camera.position.set(Math.cos(a) * 22, 11, Math.sin(a) * 22);
  camera.lookAt(0, 3, 0);

  if (bounce) {
    bounceT += dt;
    bounce.position.y = Math.max(0, Math.sin(bounceT * 10) * 0.6 * (1 - bounceT / 0.8));
    if (bounceT > 0.8) { bounce.position.y = 0; bounce = null; }
  }
  if (sayTimer > 0 && (sayTimer -= dt) <= 0) sayEl.classList.remove('on');

  renderer.render(scene, camera);
}
loop();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
