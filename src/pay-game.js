// ===========================================================
//  🧮 계산 놀이 — 마트 계산대에서 여는 숫자 게임
//
//  담은 물건마다 값이 있다.  "값 × 개수"를 모두 더한 **전체 금액**을
//  숫자 버튼으로 맞춰야 계산이 끝난다.
//
//  ★ 3D가 아니라 index.html의 <div id="pay">에 글씨와 버튼으로 만든다.
//  ★ 두 번 틀리면 한 줄씩 답(= 6코인)을 보여줘서 포기하지 않게 한다.
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const MAX_DIGITS = 4;      // 몇 자리까지 누를 수 있나
const HELP_AFTER = 2;      // 몇 번 틀리면 힌트를 저절로 켜줄까
const WIN_WAIT   = 1500;   // 맞았을 때 축하 화면을 보여주는 시간(ms)

let game = null;           // 화면은 한 번만 만든다

/**
 * 계산 놀이 화면을 가져온다 (처음 한 번만 만든다).
 *   show({ lines, total, unit, onPaid }) 로 연다.
 *     lines : [{ emoji, name, price, count, sum }]
 *     onPaid: 맞혔을 때 부를 함수
 */
export function getPayGame() {
  if (game) return game;

  const root    = document.getElementById('pay');
  const listEl  = document.getElementById('payList');
  const inputEl = document.getElementById('payInput');
  const msgEl   = document.getElementById('payMsg');
  const keysEl  = document.getElementById('payKeys');
  const hintBtn = document.getElementById('payHint');

  let answer = 0;          // 맞혀야 하는 금액
  let typed = '';          // 지금까지 누른 숫자
  let misses = 0;          // 몇 번 틀렸나
  let done = false;        // 맞혀서 끝났나
  let onPaid = null;
  let unit = '코인';

  // --- 숫자판 만들기 (한 번만) ---
  function key(label, cls, onTap) {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = label;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });
    b.addEventListener('click', onTap);
    keysEl.appendChild(b);
    return b;
  }
  for (const n of ['1','2','3','4','5','6','7','8','9']) key(n, 'pkey', () => digit(n));
  key('지우기', 'pkey erase', () => { typed = typed.slice(0, -1); draw(); });
  key('0', 'pkey', () => digit('0'));
  key('✅', 'pkey ok', () => check());

  function digit(n) {
    if (done) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === '' && n === '0') return;      // 맨 앞에 0은 안 눌린다
    typed += n;
    draw();
  }

  function draw() {
    inputEl.textContent = typed === '' ? '?' : typed;
  }

  /** 계산서를 다시 그린다 */
  function drawList(lines) {
    listEl.innerHTML = '';
    for (const l of lines) {
      const row = document.createElement('div');
      row.className = 'prow';
      row.innerHTML =
        `<span class="pemoji">${l.emoji}</span>` +
        `<span class="pname">${l.name}</span>` +
        `<span class="pcalc">${l.price}${unit} × ${l.count}개</span>` +
        `<span class="psum">= ${l.sum}${unit}</span>`;
      listEl.appendChild(row);
    }
  }

  /** 정답인지 본다 */
  function check() {
    if (done) return;
    if (typed === '') { say('숫자 버튼을 눌러서 얼마인지 알려줘요 🙂'); return; }
    if (Number(typed) === answer) {
      done = true;
      say(`딩동댕! ${answer}${unit} 계산 완료 🎉`, 'good');
      root.classList.add('win');
      setTimeout(() => { close(); onPaid?.(); }, WIN_WAIT);
      return;
    }
    misses++;
    typed = '';
    draw();
    root.classList.add('shake');
    setTimeout(() => root.classList.remove('shake'), 400);
    if (misses >= HELP_AFTER) {
      showHint(true);
      say('한 줄씩 더해 볼까요? 🤔', 'bad');
    } else {
      say('앗, 다시 세어봐요! 🤔', 'bad');
    }
  }

  function say(text, cls = '') {
    msgEl.textContent = text;
    msgEl.className = cls;
  }

  /** 힌트 — 한 줄씩 얼마인지 보여준다 */
  function showHint(on) {
    listEl.classList.toggle('hint', on);
    hintBtn.textContent = on ? '🙈 힌트 끄기' : '💡 힌트';
  }
  hintBtn.addEventListener('click', () => showHint(!listEl.classList.contains('hint')));

  function close() {
    root.classList.remove('on', 'win', 'shake');
    game.open = false;
  }
  document.getElementById('payClose').addEventListener('click', () => close());

  game = {
    open: false,
    show(cfg) {
      unit = cfg.unit ?? '코인';
      answer = cfg.total;
      onPaid = cfg.onPaid;
      typed = ''; misses = 0; done = false;
      drawList(cfg.lines);
      showHint(false);
      draw();
      say(`모두 몇 ${unit}일까요?`);
      document.getElementById('payUnit').textContent = unit;
      root.classList.remove('win', 'shake');
      root.classList.add('on');
      game.open = true;
    },
  };
  return game;
}
