// ===========================================================
//  요정 날개를 "그림"으로 그린다
//  납작한 구를 겹치면 구름 덩어리처럼 보인다.
//  Canvas에 날개 모양을 그려서 판에 붙이면 실루엣이 또렷해진다.
// ===========================================================
import * as THREE from 'three';

// ★ 아이랑 같이 바꿔볼 값
const S = 512;                 // 그림판 크기
const ROOT = [72, 452];        // 날개가 몸에 붙는 자리 (그림판 좌표)

function css(c) { return '#' + new THREE.Color(c).getHexString(); }
function mix(c, target, t) {
  return '#' + new THREE.Color(c).lerp(new THREE.Color(target), t).getHexString();
}

/** 날개 한 장의 윤곽 */
function wingPath(g, pts) {
  const [rx, ry] = ROOT;
  g.beginPath();
  g.moveTo(rx, ry);
  g.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);   // 바깥쪽으로 뻗는 선
  g.bezierCurveTo(pts[6], pts[7], pts[8], pts[9], rx, ry);           // 돌아오는 선
  g.closePath();
}

function drawWing(g, color) {
  const edge = mix(color, 0x6a4a80, 0.42);

  // 위 날개 (크고 길게) / 아래 날개 (작고 둥글게)
  const shapes = [
    [130, 210, 190, 24, 330, 46,  456, 130, 342, 336],
    [150, 430, 250, 372, 336, 396, 392, 432, 250, 486],
  ];

  for (const pts of shapes) {
    const grad = g.createLinearGradient(ROOT[0], ROOT[1], 400, 60);
    grad.addColorStop(0, css(color) + 'cc');
    grad.addColorStop(0.55, mix(color, 0xffffff, 0.55) + 'e6');
    grad.addColorStop(1, '#ffffffcc');
    wingPath(g, pts);
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = edge + 'aa';
    g.lineWidth = 9;
    g.lineJoin = 'round';
    g.stroke();
  }

  // 날개맥 — 얇은 선 몇 개
  g.strokeStyle = edge + '66';
  g.lineWidth = 5;
  for (const [ex, ey] of [[300, 120], [370, 210], [300, 400]]) {
    g.beginPath();
    g.moveTo(ROOT[0] + 14, ROOT[1] - 10);
    g.quadraticCurveTo((ROOT[0] + ex) / 2, (ROOT[1] + ey) / 2 - 40, ex, ey);
    g.stroke();
  }

  // 반짝이 몇 점
  g.fillStyle = '#ffffffcc';
  for (const [sx, sy, sr] of [[268, 150, 15], [352, 250, 10], [222, 300, 8]]) {
    g.beginPath();
    g.ellipse(sx, sy, sr, sr, 0, 0, Math.PI * 2);
    g.fill();
  }
}

const _cache = new Map();

export function wingTexture(color) {
  if (_cache.has(color)) return _cache.get(color);
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  drawWing(cv.getContext('2d'), color);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _cache.set(color, tex);
  return tex;
}
