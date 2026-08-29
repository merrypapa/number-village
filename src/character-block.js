// ===========================================================
//  숫자블록 친구 만들기 (큐브를 숫자만큼 쌓는다)
// ===========================================================
import * as THREE from 'three';
import { GEO, MAT_DARK, bodyMat, addSimpleEyes } from './character-parts.js';

// ★ 아이랑 같이 바꿔볼 값
const CUBE = 0.62;   // 큐브 한 변 크기
const RAINBOW = [0xff5a5a, 0xff9f43, 0xffd93d, 0x6ddf6d, 0x63c8ff,
                 0x5a7bff, 0xb072ff, 0xff7ec4, 0x5fe6c8, 0xffb3d9];

export function makeBlock(def) {
  const g = new THREE.Group();
  const n = def.number;
  const S = CUBE;
  const cols = n <= 5 ? 1 : 2;          // 6 이상은 두 줄로 쌓아서 너무 안 길어지게
  const rows = Math.ceil(n / cols);

  let placed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && placed < n; c++, placed++) {
      const color = def.rainbow ? RAINBOW[placed % RAINBOW.length] : def.color;
      const m = new THREE.Mesh(GEO.cube, bodyMat(color));
      m.scale.setScalar(S);
      m.position.set((c - (cols - 1) / 2) * S, S * 0.5 + r * S, 0);
      m.castShadow = true;
      g.add(m);
    }
  }

  const topY = rows * S;
  addSimpleEyes(g, topY - S * 0.35, S * (cols * 0.5) + 0.02, S * 0.22, S * 0.3);

  // 팔다리
  const limbs = [];
  const mat = bodyMat(def.rainbow ? RAINBOW[0] : def.color);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(GEO.limb, mat);
    arm.scale.set(0.09, 0.16, 0.09);
    arm.position.set(s * (cols * S * 0.5 + 0.08), topY - S * 0.5, 0);
    arm.rotation.z = s * 0.35;
    g.add(arm); limbs.push(arm);

    const leg = new THREE.Mesh(GEO.limb, MAT_DARK);
    leg.scale.set(0.09, 0.14, 0.09);
    leg.position.set(s * S * 0.25, -0.1, 0);
    g.add(leg); limbs.push(leg);
  }

  g.userData.height = topY;

  // 걷기 애니메이션: 팔다리 흔들기 + 살짝 위아래
  g.userData.animate = (g_, tt, moving) => {
    const sp = moving ? 9 : 2.2;
    const amp = moving ? 0.7 : 0.12;
    for (let i = 0; i < limbs.length; i++) {
      limbs[i].rotation.x = Math.sin(tt * sp + i * Math.PI) * amp;
    }
    g_.position.y = moving ? Math.abs(Math.sin(tt * sp)) * 0.06 : 0;
  };

  return g;
}
