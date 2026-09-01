// ===========================================================
//  🎨 그림 그리기 놀이 — 손가락으로 진짜 그림을 그린다
//
//  그림의 집(art-house.js)에서 '그리기'를 누르면 이 화면이 열린다.
//  다 그리고 '다 그렸어요'를 누르면 그림이 벽 액자에 걸린다.
//
//  ★ 3D가 아니라 index.html의 <canvas id="drawCanvas">에 2D로 그린다.
//  ★ 도구마다 느낌이 다르다 —
//    연필은 가늘고 진하게, 색연필은 사각사각 결이 생기고,
//    붓은 굵고 부드럽게, 물감은 아주 굵고 뭉게뭉게 번진다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값 — 색깔과 도구
// -----------------------------------------------------------
const COLORS = [
  '#ff4d4d', '#ff8a3d', '#ffd93d', '#7ad48f', '#3ac0a0', '#63c8ff',
  '#5a7bff', '#b072ff', '#ff7ec4', '#8b5a3c', '#3a3a4a', '#ffffff',
];

//  width  : 굵기 (굵기 버튼으로 곱해진다)
//  alpha  : 진하기 (1이면 꽉 찬 색)
//  grain  : 사각사각한 결 (색연필)
//  blob   : 뭉게뭉게 번지는 물감 방울
const TOOLS = {
  pencil: { name:'연필',   ico:'✏️', width: 3,  alpha: 0.95, grain: 0 },
  crayon: { name:'색연필', ico:'🖍', width: 7,  alpha: 0.75, grain: 3 },
  brush:  { name:'붓',     ico:'🖌', width: 18, alpha: 0.55, grain: 0 },
  paint:  { name:'물감',   ico:'🎨', width: 30, alpha: 1.0,  grain: 0, blob: true },
  eraser: { name:'지우개', ico:'🧽', width: 30, alpha: 1.0,  erase: true },
};
const SIZES = [0.6, 1.0, 1.7];      // 얇게 · 보통 · 굵게
const UNDO_MAX = 8;                 // 되돌리기를 몇 번까지 기억할까

let game = null;                    // 화면은 한 번만 만든다

/**
 * 그림 그리기 화면을 만든다 (처음 한 번만).
 *   onFinish(canvas) : '다 그렸어요'를 누르면 그린 그림을 넘겨준다
 */
export function getDrawGame(onFinish) {
  if (game) { game.onFinish = onFinish; return game; }

  const root    = document.getElementById('draw');
  const canvas  = document.getElementById('drawCanvas');
  const ctx     = canvas.getContext('2d', { willReadFrequently: true });
  const toolBar = document.getElementById('drawTools');
  const colorBar= document.getElementById('drawColors');
  const extraBar= document.getElementById('drawExtra');

  let tool = 'crayon';
  let color = COLORS[0];
  let size = 1;                     // SIZES의 몇 번째
  const undo = [];

  // --- 흰 종이로 만들기 ---
  function clearPaper() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    undo.length = 0;
  }
  clearPaper();

  // --- 버튼 만들기 ---
  function button(parent, cls, html, onTap) {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = html;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });
    b.addEventListener('click', onTap);
    parent.appendChild(b);
    return b;
  }
  function highlight(parent, on) {
    for (const b of parent.children) b.classList.toggle('on', b === on);
  }

  for (const key of Object.keys(TOOLS)) {
    const t = TOOLS[key];
    const b = button(toolBar, 'tool', `<span class="ico">${t.ico}</span>${t.name}`,
      () => { tool = key; highlight(toolBar, b); });
    if (key === tool) b.classList.add('on');
  }
  for (const c of COLORS) {
    const b = button(colorBar, 'swatch', '', () => { color = c; highlight(colorBar, b); });
    b.style.background = c;
    if (c === color) b.classList.add('on');
  }
  for (let i = 0; i < SIZES.length; i++) {
    const px = 8 + i * 8;
    const b = button(extraBar, 'size', `<i style="width:${px}px;height:${px}px"></i>`,
      () => { size = i; highlight(extraBar, b); });
    if (i === size) b.classList.add('on');
  }
  button(extraBar, 'tool', '<span class="ico">↩️</span>되돌리기', () => {
    const last = undo.pop();
    if (last) ctx.putImageData(last, 0, 0);
  });
  button(extraBar, 'tool', '<span class="ico">🧻</span>새 종이', () => clearPaper());

  // --- 그리기 ---
  let drawing = false, lastX = 0, lastY = 0, pointer = null;

  /** 화면 좌표 → 종이 좌표 (종이가 화면에 맞춰 줄어들어 있으니 비율을 곱한다) */
  function paperXY(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function saveUndo() {
    undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undo.length > UNDO_MAX) undo.shift();
  }

  /** 점 하나를 (x0,y0)에서 (x1,y1)까지 잇는다 */
  function stroke(x0, y0, x1, y1) {
    const t = TOOLS[tool];
    const w = t.width * SIZES[size];

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = t.alpha;
    ctx.strokeStyle = t.erase ? '#ffffff' : color;
    ctx.fillStyle = t.erase ? '#ffffff' : color;
    ctx.lineWidth = w;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // 색연필 — 옆으로 살짝 빗나간 선을 몇 개 더 그어서 사각사각한 결을 만든다
    if (t.grain) {
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.lineWidth = w * 0.35;
      for (let i = 0; i < t.grain; i++) {
        const dx = (Math.random() - 0.5) * w * 0.9;
        const dy = (Math.random() - 0.5) * w * 0.9;
        ctx.beginPath();
        ctx.moveTo(x0 + dx, y0 + dy);
        ctx.lineTo(x1 + dx, y1 + dy);
        ctx.stroke();
      }
    }
    // 물감 — 뭉게뭉게 방울이 튄다
    if (t.blob) {
      ctx.globalAlpha = t.alpha * 0.55;
      for (let i = 0; i < 2; i++) {
        const r = w * (0.25 + Math.random() * 0.35);
        ctx.beginPath();
        ctx.arc(x1 + (Math.random() - 0.5) * w, y1 + (Math.random() - 0.5) * w, r, 0, 7);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  canvas.addEventListener('pointerdown', e => {
    if (pointer !== null) return;               // 손가락 하나만 받는다
    e.preventDefault();
    pointer = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    saveUndo();
    const p = paperXY(e);
    lastX = p.x; lastY = p.y;
    drawing = true;
    stroke(p.x, p.y, p.x + 0.01, p.y + 0.01);   // 콕 찍어도 점이 남게
  });
  canvas.addEventListener('pointermove', e => {
    if (!drawing || e.pointerId !== pointer) return;
    e.preventDefault();
    const p = paperXY(e);
    stroke(lastX, lastY, p.x, p.y);
    lastX = p.x; lastY = p.y;
  });
  const endStroke = e => {
    if (e.pointerId !== pointer) return;
    drawing = false;
    pointer = null;
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  // --- 열기 / 닫기 ---
  function close() {
    root.classList.remove('on');
    drawing = false; pointer = null;
    game.open = false;
  }
  document.getElementById('drawClose').addEventListener('click', close);
  document.getElementById('drawDone').addEventListener('click', () => {
    // 지금 그림을 사진처럼 한 장 떠서 넘긴다 (종이는 다음에 또 쓰니까)
    const copy = document.createElement('canvas');
    copy.width = canvas.width; copy.height = canvas.height;
    copy.getContext('2d').drawImage(canvas, 0, 0);
    game.onFinish?.(copy);
    close();
  });

  game = {
    open: false,
    onFinish,
    show(fresh = true) {
      if (fresh) clearPaper();
      root.classList.add('on');
      game.open = true;
    },
  };
  return game;
}
