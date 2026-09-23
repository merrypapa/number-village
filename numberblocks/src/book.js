// ===========================================================
//  📖 친구 도감 — 오른쪽 위 책 버튼을 누르면 열린다
//  포켓몬 도감처럼 한 페이지에 10명씩. 구한 친구는 그림·이름·소개말이 보인다.
//  못 찾은 친구는 물음표(?)다. 100은 나라서 처음부터 보인다.
//
//  그림은 3D를 띄우지 않고 캔버스에 블록을 그린다 (100장이어도 가볍다).
// ===========================================================
import { BLOCKS, columnsOf, hex, RIM_FILL } from './block-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const ICON = 160;           // 도감 카드 그림 크기(px)
const PER_PAGE = 10;        // 한 페이지에 몇 명 (1~10, 11~20 …)
const GHOST_FILL = '#d3dbe6'; // 못 찾은 친구 실루엣 색
const GHOST_LINE = '#b9c4d2';
const BIG  = 220;           // 크게 보기 그림 크기(px)

/**
 * 캔버스에 숫자 블록 친구를 그린다 (정면에서 본 모습)
 *   ghost=true 면 아직 못 찾은 친구 — 색 없이 회색 **실루엣**만 그린다 (얼굴 없음)
 */
export function drawBlockIcon(cv, n, ghost = false) {
  const g = cv.getContext('2d');
  const S = cv.width;
  g.clearRect(0, 0, S, S);
  const cols = columnsOf(n);
  const rows = Math.max(...cols.map(c => c.k));
  const unit = Math.floor(Math.min((S - 10) / cols.length, (S - 14) / rows));
  const w = unit * cols.length;
  const x0 = (S - w) / 2, y0 = S - 6;
  cols.forEach((col, i) => {
    for (let j = 0; j < col.k; j++) {
      const x = x0 + i * unit, y = y0 - (j + 1) * unit;
      g.fillStyle = ghost ? GHOST_LINE : '#2a2233'; g.fillRect(x, y, unit, unit);
      g.fillStyle = ghost ? GHOST_FILL : hex(col.colors[j]);
      g.fillRect(x + 1, y + 1, unit - 2, unit - 2);
      if (col.rim[j] && !ghost) {                          // 열 묶음 블록 — 흰 바탕에 색 테두리
        const b = Math.max(2, unit * 0.2);
        g.fillStyle = RIM_FILL; g.fillRect(x + b, y + b, unit - b * 2, unit - b * 2);
      }
    }
  });
  if (ghost) return;                           // 실루엣은 얼굴을 안 그린다
  // 얼굴 — 맨 오른쪽 기둥 꼭대기
  const fc = cols.length - 1;
  const square = cols.length > 1 && cols.every(c => c.k === cols[0].k);
  const fx = square ? S / 2 : x0 + fc * unit + unit / 2;
  const fy = y0 - cols[fc].k * unit + (square ? unit * cols.length * 0.35 : unit / 2);
  const r = Math.max(2, unit * 0.13);
  for (const sx of [-1, 1]) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(fx + sx * unit * 0.2, fy - unit * 0.1, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1430'; g.beginPath(); g.arc(fx + sx * unit * 0.2, fy - unit * 0.08, r * 0.5, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#1b1430'; g.lineWidth = Math.max(1.5, unit * 0.06);
  g.beginPath(); g.arc(fx, fy + unit * 0.1, unit * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
}

/**
 * isFound(n) : 그 친구를 구했는지
 * onReset()  : '처음부터' 버튼 (아빠용)
 *
 * 포켓몬 도감처럼 **한 페이지에 10명**씩 보여준다 (1~10, 11~20, …, 91~100).
 * ◀ ▶ 로 페이지를 넘긴다. 카드마다 그림 · 이름 · 짧은 소개말이 있다.
 */
export function createBook(isFound, onReset) {
  const screen = document.getElementById('book');
  const grid   = document.getElementById('bookGrid');
  const count  = document.getElementById('bookCount');
  const detail = document.getElementById('bookDetail');
  const pageEl = document.getElementById('bookPage');
  const pages = Math.ceil(BLOCKS.length / PER_PAGE);
  let page = 0;
  const cards = [];

  for (let i = 0; i < PER_PAGE; i++) {
    const card = document.createElement('button');
    card.className = 'bcard';
    const cv = document.createElement('canvas');
    cv.width = cv.height = ICON;
    const q = document.createElement('span'); q.className = 'bq'; q.textContent = '?';
    const pic = document.createElement('span'); pic.className = 'pic'; pic.append(cv, q);
    const name = document.createElement('span'); name.className = 'bname';
    const desc = document.createElement('span'); desc.className = 'bdesc';
    card.append(pic, name, desc);
    card.onclick = () => card.def && showDetail(card.def);
    grid.appendChild(card);
    cards.push({ card, cv, name, desc });
  }

  function showDetail(def) {
    const found = def.number === 100 || isFound(def.number);
    const cv = detail.querySelector('canvas');
    cv.width = cv.height = BIG;
    drawBlockIcon(cv, def.number, !found);
    detail.querySelector('.dq').style.display = found ? 'none' : 'flex';
    detail.querySelector('.dname').textContent = found
      ? (def.number === 100 ? '100 — 나!' : `숫자 ${def.name}`) : '???';
    detail.querySelector('.ddesc').textContent = found ? def.desc : '아직 못 찾았어요. 마을을 더 돌아봐요!';
    detail.classList.add('on');
  }

  /** 지금 페이지의 친구 10명을 카드에 채운다 */
  function render() {
    const start = page * PER_PAGE;
    for (let i = 0; i < PER_PAGE; i++) {
      const def = BLOCKS[start + i], c = cards[i];
      c.card.def = def;
      const found = def.number === 100 || isFound(def.number);
      c.card.classList.toggle('found', found);
      drawBlockIcon(c.cv, def.number, !found);      // 못 찾았으면 실루엣 + 물음표
      c.name.textContent = found ? (def.number === 100 ? '100 (나)' : def.name) : `No.${def.number}`;
      c.desc.textContent = found ? def.desc.split(/[!.]/)[0] + (def.desc.match(/[!.]/)?.[0] ?? '') : '아직 못 찾았어요';
    }
    pageEl.textContent = `${start + 1} ~ ${start + PER_PAGE}  (${page + 1}/${pages})`;
    let n = 0;
    for (const d of BLOCKS) if (d.number < 100 && isFound(d.number)) n++;
    count.textContent = `${n} / 99 찾았어요`;
  }
  function go(d) { page = (page + d + pages) % pages; render(); }
  document.getElementById('bookPrev').onclick = () => go(-1);
  document.getElementById('bookNext').onclick = () => go(1);
  addEventListener('keydown', e => {
    if (!screen.classList.contains('on')) return;
    if (e.code === 'ArrowLeft') go(-1);
    if (e.code === 'ArrowRight') go(1);
  });

  document.getElementById('bookClose').onclick = () => screen.classList.remove('on');
  document.getElementById('detailClose').onclick = () => detail.classList.remove('on');
  document.getElementById('bookReset').onclick = () => {
    if (confirm('처음부터 다시 할까요? 구한 친구가 모두 사라져요.')) onReset();
  };

  return {
    open() { render(); screen.classList.add('on'); },
    get isOpen() { return screen.classList.contains('on'); },
  };
}
