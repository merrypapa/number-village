// ===========================================================
//  📖 친구 도감 — 오른쪽 위 책 버튼을 누르면 열린다
//  포켓몬 도감처럼 한 페이지에 10명씩. 구한 친구는 그림·이름·소개말이 보인다.
//  못 찾은 친구는 물음표(?)다. 100은 나라서 처음부터 보인다.
//
//  그림은 원작 표에서 잘라낸 png를 그대로 쓴다. 못 찾은 친구는 그 모양의 회색 실루엣.
// ===========================================================
import { BLOCKS } from './block-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const ICON = 160;           // 도감 카드 그림 크기(px)
const PER_PAGE = 10;        // 한 페이지에 몇 명 (1~10, 11~20 …)
const GHOST_FILL = '#c9d3df'; // 못 찾은 친구 실루엣 색
const BIG  = 220;           // 크게 보기 그림 크기(px)

// 원작 표에서 잘라낸 그림 (blocks.js와 같은 파일)
const SPRITE_DIR = new URL('../../assets/numberblocks/', import.meta.url).href;
const IMGS = {};                    // n → Image
let onLoaded = null;                // 그림이 다 읽히면 도감을 다시 그린다
function imageOf(n) {
  if (!IMGS[n]) {
    const im = new Image();
    im.onload = () => onLoaded?.();
    im.src = `${SPRITE_DIR}nb${n}.png`;
    IMGS[n] = im;
  }
  return IMGS[n];
}

/**
 * 캔버스에 숫자 블록 친구 그림을 그린다 (칸 안에 꽉 차게, 비율 유지)
 *   ghost=true 면 아직 못 찾은 친구 — 회색 **실루엣**만
 */
export function drawBlockIcon(cv, n, ghost = false) {
  const g = cv.getContext('2d');
  const S = cv.width;
  g.clearRect(0, 0, S, S);
  const im = imageOf(n);
  if (!im.complete || !im.naturalWidth) return;
  const k = Math.min((S - 8) / im.naturalWidth, (S - 8) / im.naturalHeight);
  const w = im.naturalWidth * k, h = im.naturalHeight * k;
  g.drawImage(im, (S - w) / 2, S - 4 - h, w, h);
  if (ghost) {                                   // 그림 모양 그대로 회색으로 덮는다
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = GHOST_FILL; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'source-over';
  }
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
  onLoaded = () => { if (screen.classList.contains('on')) render(); };
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
