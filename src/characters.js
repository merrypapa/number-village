// ===========================================================
//  캐릭터 데이터 + 3D 생성 팩토리
//  ★ 새 캐릭터를 만들려면 아래 CHARACTERS 배열에 한 줄만 추가하세요.
//    캐릭터 선택 화면과 마을 NPC에 자동으로 나타납니다.
// ===========================================================
import * as THREE from 'three';

// -----------------------------------------------------------
//  캐릭터 목록  ← 아이랑 같이 고치는 곳!
//  type: 'block' (숫자블록 친구) 또는 'ping' (요정 친구)
// -----------------------------------------------------------
export const CHARACTERS = [
  // --- 숫자블록 친구 10명 ---
  { id:'one',   name:'하나',   type:'block', number:1,  color:0xff5a5a },
  { id:'two',   name:'두리',   type:'block', number:2,  color:0xff9f43 },
  { id:'three', name:'세모',   type:'block', number:3,  color:0xffd93d },
  { id:'four',  name:'네모',   type:'block', number:4,  color:0x6ddf6d },
  { id:'five',  name:'오공',   type:'block', number:5,  color:0x63c8ff },
  { id:'six',   name:'육이',   type:'block', number:6,  color:0x5a7bff },
  { id:'seven', name:'칠보',   type:'block', number:7,  color:0xb072ff },
  { id:'eight', name:'팔팔',   type:'block', number:8,  color:0xff7ec4 },
  { id:'nine',  name:'구름',   type:'block', number:9,  color:0x5fe6c8 },
  { id:'ten',   name:'열이',   type:'block', number:10, color:0xffffff, rainbow:true },

  // --- 요정 친구 8명 ---  deco: 'star' | 'heart' | 'drop' | 'ribbon' | 'leaf' | 'crown' | 'moon'
  { id:'banjjak', name:'반짝핑', type:'ping', color:0xffb3d9, deco:'star'   },
  { id:'monggle', name:'몽글핑', type:'ping', color:0xc3b1f5, deco:'heart'  },
  { id:'bangul',  name:'방울핑', type:'ping', color:0xa8e0ff, deco:'drop'   },
  { id:'choco',   name:'초코핑', type:'ping', color:0xc79a6b, deco:'ribbon' },
  { id:'sallang', name:'살랑핑', type:'ping', color:0xb9ef9c, deco:'leaf'   },
  { id:'ppogeul', name:'뽀글핑', type:'ping', color:0xfff0b8, deco:'crown'  },
  { id:'byeolbam',name:'별밤핑', type:'ping', color:0x8f9fd6, deco:'moon'   },
  { id:'muji',    name:'무지핑', type:'ping', color:0xffd6f0, deco:'star'   },
];

// -----------------------------------------------------------
//  공용 지오메트리/머티리얼 (성능: 캐릭터마다 새로 만들지 않는다)
// -----------------------------------------------------------
const GEO = {
  cube:  new THREE.BoxGeometry(1, 1, 1),
  ball:  new THREE.SphereGeometry(0.5, 20, 16),
  eye:   new THREE.SphereGeometry(0.5, 14, 12),
  limb:  new THREE.CapsuleGeometry(0.5, 1, 4, 8),
  cone:  new THREE.ConeGeometry(0.5, 1, 12),
  ring:  new THREE.TorusGeometry(0.4, 0.14, 8, 16),
};
const MAT_WHITE = new THREE.MeshToonMaterial({ color: 0xffffff });
const MAT_BLACK = new THREE.MeshToonMaterial({ color: 0x2b2140 });
const MAT_CHEEK = new THREE.MeshToonMaterial({ color: 0xff8fb0 });

const _matCache = new Map();
function bodyMat(color) {
  if (!_matCache.has(color)) _matCache.set(color, new THREE.MeshToonMaterial({ color }));
  return _matCache.get(color);
}

const RAINBOW = [0xff5a5a,0xff9f43,0xffd93d,0x6ddf6d,0x63c8ff,0x5a7bff,0xb072ff,0xff7ec4,0x5fe6c8,0xffb3d9];

// 눈 두 개 붙이기 (얼굴 앞면 z 방향)
function addEyes(parent, y, z, spread, size) {
  for (const s of [-1, 1]) {
    const white = new THREE.Mesh(GEO.eye, MAT_WHITE);
    white.scale.setScalar(size);
    white.position.set(s * spread, y, z);
    parent.add(white);
    const pupil = new THREE.Mesh(GEO.eye, MAT_BLACK);
    pupil.scale.setScalar(size * 0.5);
    pupil.position.set(s * spread, y, z + size * 0.42);
    parent.add(pupil);
  }
}

// -----------------------------------------------------------
//  숫자블록 친구: 큐브를 number개 쌓는다
// -----------------------------------------------------------
function makeBlock(def) {
  const g = new THREE.Group();
  const n = def.number;
  const S = 0.62;                       // 큐브 한 변
  const cols = n <= 5 ? 1 : 2;          // 6 이상은 두 줄로 쌓아서 너무 안 길어지게
  const rows = Math.ceil(n / cols);
  const parts = [];

  let placed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && placed < n; c++, placed++) {
      const color = def.rainbow ? RAINBOW[placed % RAINBOW.length] : def.color;
      const m = new THREE.Mesh(GEO.cube, bodyMat(color));
      m.scale.setScalar(S);
      m.position.set((c - (cols - 1) / 2) * S, S * 0.5 + r * S, 0);
      m.castShadow = true;
      g.add(m);
      parts.push(m);
    }
  }

  const topY = rows * S;
  addEyes(g, topY - S * 0.35, S * (cols * 0.5) + 0.02, S * 0.22, S * 0.3);

  // 팔다리
  const limbs = [];
  const mat = bodyMat(def.rainbow ? RAINBOW[0] : def.color);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(GEO.limb, mat);
    arm.scale.set(0.09, 0.16, 0.09);
    arm.position.set(s * (cols * S * 0.5 + 0.08), topY - S * 0.5, 0);
    arm.rotation.z = s * 0.35;
    g.add(arm); limbs.push(arm);

    const leg = new THREE.Mesh(GEO.limb, MAT_BLACK);
    leg.scale.set(0.09, 0.14, 0.09);
    leg.position.set(s * S * 0.25, -0.1, 0);
    g.add(leg); limbs.push(leg);
  }

  g.userData.height = topY;
  g.userData.limbs = limbs;
  g.userData.style = 'walk';
  return g;
}

// -----------------------------------------------------------
//  요정 친구: 둥근 몸 + 귀 + 꼬리 + 머리 장식
// -----------------------------------------------------------
function makePing(def) {
  const g = new THREE.Group();
  const mat = bodyMat(def.color);

  const body = new THREE.Mesh(GEO.ball, mat);
  body.scale.set(0.9, 0.8, 0.9);
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);

  addEyes(g, 0.68, 0.44, 0.16, 0.26);

  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(GEO.eye, MAT_CHEEK);
    cheek.scale.set(0.13, 0.09, 0.06);
    cheek.position.set(s * 0.3, 0.53, 0.36);
    g.add(cheek);

    const ear = new THREE.Mesh(GEO.cone, mat);
    ear.scale.set(0.28, 0.42, 0.28);
    ear.position.set(s * 0.3, 1.05, -0.02);
    ear.rotation.z = s * 0.4;
    g.add(ear);

    const foot = new THREE.Mesh(GEO.ball, mat);
    foot.scale.set(0.22, 0.14, 0.28);
    foot.position.set(s * 0.2, 0.12, 0.06);
    g.add(foot);
  }

  const tail = new THREE.Mesh(GEO.ball, mat);
  tail.scale.set(0.3, 0.3, 0.3);
  tail.position.set(0, 0.55, -0.48);
  g.add(tail);

  g.add(makeDeco(def.deco));

  g.userData.height = 1.3;
  g.userData.limbs = [];
  g.userData.style = 'hop';
  return g;
}

// 머리 장식
function makeDeco(kind) {
  const gold = bodyMat(0xffe066);
  const pink = bodyMat(0xff7ab8);
  const d = new THREE.Group();
  d.position.set(0, 1.18, 0);

  if (kind === 'star' || kind === 'moon') {
    const m = new THREE.Mesh(GEO.cone, gold);
    m.scale.set(0.2, 0.3, 0.2);
    d.add(m);
    if (kind === 'moon') m.rotation.z = 0.6;
  } else if (kind === 'heart') {
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(GEO.ball, pink);
      b.scale.setScalar(0.24);
      b.position.set(s * 0.09, 0.06, 0);
      d.add(b);
    }
  } else if (kind === 'drop') {
    const m = new THREE.Mesh(GEO.cone, bodyMat(0x8fd6ff));
    m.scale.set(0.18, 0.3, 0.18);
    m.rotation.x = Math.PI;
    d.add(m);
  } else if (kind === 'ribbon') {
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(GEO.cone, pink);
      b.scale.set(0.16, 0.22, 0.12);
      b.position.x = s * 0.16;
      b.rotation.z = s * Math.PI / 2;
      d.add(b);
    }
  } else if (kind === 'leaf') {
    const m = new THREE.Mesh(GEO.ball, bodyMat(0x7ed957));
    m.scale.set(0.1, 0.06, 0.22);
    m.position.set(0.08, 0, 0);
    m.rotation.z = 0.5;
    d.add(m);
  } else if (kind === 'crown') {
    const m = new THREE.Mesh(GEO.ring, gold);
    m.scale.setScalar(0.55);
    m.rotation.x = Math.PI / 2;
    d.add(m);
  }
  return d;
}

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/** 캐릭터 정의로부터 3D 그룹을 만든다. group.userData.update(t, moving) 호출로 애니메이션. */
export function createCharacter(def) {
  const g = def.type === 'block' ? makeBlock(def) : makePing(def);
  g.name = def.name;
  g.userData.def = def;

  const baseY = 0;
  const style = g.userData.style;
  const limbs = g.userData.limbs;
  const phase = Math.random() * 10;     // 캐릭터마다 애니메이션 시작 시점을 다르게

  g.userData.update = (t, moving) => {
    const tt = t + phase;
    if (style === 'hop') {
      // 요정: 통통 튀기
      const h = moving ? Math.abs(Math.sin(tt * 7)) * 0.28 : Math.abs(Math.sin(tt * 2.2)) * 0.07;
      g.position.y = baseY + h;
    } else {
      // 숫자블록: 팔다리 흔들기 + 살짝 상하
      const sp = moving ? 9 : 2.2;
      const amp = moving ? 0.7 : 0.12;
      for (let i = 0; i < limbs.length; i++) {
        limbs[i].rotation.x = Math.sin(tt * sp + i * Math.PI) * amp;
      }
      g.position.y = baseY + (moving ? Math.abs(Math.sin(tt * sp)) * 0.06 : 0);
    }
  };

  return g;
}

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
