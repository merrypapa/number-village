// ===========================================================
//  🎮 게임 코너 — 숫자의 집 안 오락기
//  오락기 앞에서 '게임하기'를 누르면 "어떤 게임을 할까요?" 화면이 열린다.
//
//  ★ 게임을 더 넣고 싶으면 아래 GAMES 에 한 줄 추가한다.
//    { id, icon, name, desc } + createGameCorner 안의 OPENERS 에 여는 방법 한 줄.
// ===========================================================
import * as THREE from 'three';
import { createMarbleRace } from './race-game.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const GAMES = [
  { id: 'race', icon: '🏁', name: '숫자 구슬 레이스',
    desc: '1부터 41까지 숫자 친구 구슬이 와르르! 핀볼 숲·바람개비·시소·소용돌이를 지나 누가 1등일까?' },
];
const CABINET_COLORS = [0xff5a8a, 0x4fa8ff];   // 오락기 색 (왼쪽, 오른쪽)

/** opts = { music, toast } — 돌려주는 것: { open(), busy } */
export function createGameCorner(opts = {}) {
  const box = document.getElementById('arcade');
  const list = document.getElementById('arcadeList');
  const race = createMarbleRace({ music: opts.music, onClose: () => opts.toast?.('🎮 또 놀러 와요!') });
  const OPENERS = { race: () => race.open() };

  list.innerHTML = GAMES.map(gm => `
    <button class="agame" data-id="${gm.id}">
      <span class="aicon">${gm.icon}</span>
      <span class="atext"><b>${gm.name}</b><small>${gm.desc}</small></span>
    </button>`).join('');
  list.onclick = (e) => {
    const b = e.target.closest('.agame');
    if (!b) return;
    box.classList.remove('on');
    OPENERS[b.dataset.id]?.();
  };
  document.getElementById('arcadeClose').onclick = () => box.classList.remove('on');

  return {
    open() { box.classList.add('on'); },
    /** 게임 화면이 열려 있으면 true — 그동안 3D 마을은 쉰다 */
    get busy() { return box.classList.contains('on') || race.isOpen; },
    race,
  };
}

// -----------------------------------------------------------
//  🕹 오락기 한 대 (3D) — 상자 몸통 + 화면 + 조이스틱 + 버튼
// -----------------------------------------------------------
let screenTex = null;
function makeScreenTexture() {
  if (screenTex) return screenTex;
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 192;
  const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 192);
  bg.addColorStop(0, '#1b1446'); bg.addColorStop(1, '#3b2a8a');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 192);
  // 구슬이 굴러 내려가는 그림
  const cols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#32c5ff', '#ff2d92'];
  g.strokeStyle = '#ffc300'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(20, 70); g.lineTo(200, 100); g.moveTo(236, 130); g.lineTo(60, 165); g.stroke();
  cols.forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath(); g.arc(40 + i * 28, 58 + i * 5, 10, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = '#fff'; g.font = '900 34px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  g.textAlign = 'center'; g.fillText('GAME 🏁', 128, 38);
  screenTex = new THREE.CanvasTexture(cv);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  return screenTex;
}

export function makeArcadeCabinet(color = CABINET_COLORS[0]) {
  const grp = new THREE.Group();
  const body = new THREE.MeshToonMaterial({ color });
  const dark = new THREE.MeshToonMaterial({ color: 0x2b2350 });
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.x = rx;
    m.castShadow = true;
    grp.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(2.2, 2.0, 1.6), body, 0, 1.0, 0);            // 아래 몸통
  add(new THREE.BoxGeometry(2.2, 2.0, 1.0), body, 0, 3.0, -0.3);         // 위 몸통 (화면)
  add(new THREE.BoxGeometry(2.3, 0.5, 1.2), dark, 0, 4.2, -0.2);         // 꼭대기 간판 자리
  add(new THREE.BoxGeometry(2.2, 0.25, 0.9), dark, 0, 2.05, 0.4, -0.25); // 조작판
  const scr = add(new THREE.PlaneGeometry(1.8, 1.35),
    new THREE.MeshBasicMaterial({ map: makeScreenTexture() }), 0, 3.05, 0.21);
  scr.castShadow = false;
  // 조이스틱 · 버튼
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.4), dark, -0.5, 2.35, 0.45);
  add(new THREE.SphereGeometry(0.14), new THREE.MeshToonMaterial({ color: 0xff3b30 }), -0.5, 2.55, 0.45);
  const btn = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16);
  [[0.25, 0xffd60a], [0.55, 0x34c759], [0.85, 0x32c5ff]].forEach(([x, c]) =>
    add(btn, new THREE.MeshToonMaterial({ color: c }), x, 2.2, 0.42, -0.25));
  return grp;
}
export { CABINET_COLORS };
