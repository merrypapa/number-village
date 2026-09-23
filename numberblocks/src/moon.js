// ===========================================================
//  🌙 달님 — 마을 광장 한가운데(분수 뒤)에 구름을 타고 떠 있다
//  친구 99명을 다 찾기 전에는 "아직 n명 남았어" 하고,
//  다 찾으면 '게임 신청' 버튼이 떠서 팽이치기 대결을 한다.
// ===========================================================
import * as THREE from 'three';
import { canvasTex } from '../../src/castle-props.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const MOON_POS  = { x: 0, z: -13 };   // 광장 어디에 떠 있을까 (분수 바로 뒤)
const FLOAT_Y   = 2.6;                // 떠 있는 높이
const MOON_R    = 2.2;                // 달님 크기
const REACH     = 6;                  // 이만큼 가까이 가면 버튼이 뜬다
const GLOW      = 0xfff3b0;           // 달님 색

function moonFace(sleepy) {
  return canvasTex(256, (g, s) => {
    g.fillStyle = '#fff3b0'; g.fillRect(0, 0, s, s);
    // 크레이터 몇 개
    g.fillStyle = '#f3e08a';
    for (const [x, y, r] of [[60, 60, 18], [200, 90, 14], [70, 200, 12], [190, 200, 20]]) {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // 눈 — 졸린 반달눈 / 놀란 동그란 눈
    g.strokeStyle = '#4a3663'; g.lineWidth = 10; g.lineCap = 'round';
    g.fillStyle = '#4a3663';
    for (const sx of [-1, 1]) {
      const x = s / 2 + sx * 46, y = 108;
      if (sleepy) { g.beginPath(); g.arc(x, y - 8, 22, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill(); }
    }
    // 볼 · 입
    g.fillStyle = '#ffb7c5';
    g.beginPath(); g.arc(s / 2 - 70, 150, 16, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(s / 2 + 70, 150, 16, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(s / 2, 160, 26, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
  });
}

/**
 * world     : 마을 (scene, spots)
 * remaining(): 아직 못 찾은 친구 수
 * onChallenge(): '게임 신청'을 눌렀을 때
 */
export function createMoon(world, remaining, onChallenge) {
  const g = new THREE.Group();
  const faceMat = new THREE.MeshToonMaterial({ map: moonFace(true), emissive: GLOW, emissiveIntensity: 0.55 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 28, 22), faceMat);
  ball.rotation.y = Math.PI * 1.5;      // 얼굴이 남쪽(광장, 아이 오는 쪽)을 본다
  g.add(ball);

  // 구름 방석
  const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  const blob = new THREE.SphereGeometry(1, 12, 10);
  for (const [x, y, z, s] of [[0, -2.2, 0, 1.9], [-1.8, -2.3, 0.3, 1.3], [1.8, -2.3, -0.2, 1.4],
                              [0.6, -2.0, 1.4, 1.1], [-0.7, -2.1, -1.3, 1.0]]) {
    const m = new THREE.Mesh(blob, cloudMat);
    m.position.set(x, y, z); m.scale.setScalar(s);
    g.add(m);
  }
  // 달님이 은은하게 주변을 비춘다
  const light = new THREE.PointLight(GLOW, 50, 22, 1.8);
  light.position.set(0, 1, 2);
  g.add(light);

  g.position.set(MOON_POS.x, FLOAT_Y, MOON_POS.z);
  world.scene.add(g);

  const spot = {
    x: MOON_POS.x, z: MOON_POS.z + 2, r: REACH, y: 0, verb: '달님',
    use(toast) {
      const n = remaining();
      if (n > 0) toast(`달님: 아직 친구 ${n}명이 못 돌아왔어~ 🌙`);
      else onChallenge();
    },
  };
  world.spots.push(spot);

  let awake = false;
  function update(dt, t) {
    g.position.y = FLOAT_Y + Math.sin(t * 1.3) * 0.25;
    g.rotation.y = Math.sin(t * 0.5) * 0.15;
    const all = remaining() === 0;
    spot.verb = all ? '게임 신청' : '달님';
    if (all && !awake) { awake = true; faceMat.map = moonFace(false); faceMat.needsUpdate = true; }
  }

  return { update, group: g, spot };
}
