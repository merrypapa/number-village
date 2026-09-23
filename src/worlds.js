// ===========================================================
//  월드 고르기 화면 — "어떤 게임을 할까?"
//  오프닝에서 '시작하기'를 누르면 나온다.
//  뒤쪽에는 오프닝의 성과 친구들이 계속 보인다 (배경을 깔지 않는다).
//
//  ★ 월드를 하나 더 만들고 싶으면 WORLDS 배열에 한 줄 추가하면 된다.
//     url 이 있으면  → 그 폴더의 다른 게임으로 넘어간다
//     url 이 없으면  → 지금 게임(티니핑 월드)의 친구 고르기로 간다
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const WORLDS = [
  { id: 'ping',   name: '티니핑 월드',     emoji: '🧚', desc: '요정 친구들과 마을 놀이',
    color: '#ff8fc0', shadow: '#e0518f' },
  { id: 'blocks', name: '넘버블럭스 월드', emoji: '🔢', desc: '숫자 블록 나라 (만드는 중!)',
    color: '#7ad4ff', shadow: '#3aa9e0', url: './numberblocks/' },
];

/**
 * onLocal() : url 이 없는 월드(지금 게임)를 골랐을 때 불린다.
 * 반환값의 show() 를 부르면 화면이 나타난다.
 */
export function createWorldPicker(onLocal) {
  const screen = document.getElementById('worlds');
  const list   = document.getElementById('worldList');

  // 방금 '시작하기'를 누른 손가락이 월드 카드까지 누르지 않게 잠깐 막는다
  let lockUntil = 0;

  for (const w of WORLDS) {
    const btn = document.createElement('button');
    btn.className = 'world';
    btn.style.setProperty('--c', w.color);
    btn.style.setProperty('--s', w.shadow);
    btn.innerHTML = `<span class="wEmoji">${w.emoji}</span>` +
      `<span class="wName">${w.name}</span><span class="wDesc">${w.desc}</span>`;
    btn.onclick = () => {
      if (performance.now() < lockUntil) return;
      if (w.url) { location.href = w.url; return; }
      screen.classList.remove('on');
      onLocal(w);
    };
    list.appendChild(btn);
  }

  function show() {
    lockUntil = performance.now() + 450;
    screen.classList.add('on');
  }
  return { show };
}
