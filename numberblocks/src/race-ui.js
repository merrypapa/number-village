// ===========================================================
//  🏁 숫자 구슬 레이스 — 화면 버튼 · 순위표 · 시상대 · 기록 저장
//  (그리기는 race-draw.js, 물리는 race-game.js)
// ===========================================================
import { RACER_CHOICES, marbleSprite, colorOf, spriteUrl } from './race-data.js';

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const BOARD_ROWS = 10;      // 오른쪽 순위표에 몇 등까지 보여줄까
const MEDALS = ['🥇', '🥈', '🥉'];
const CAM_LABEL = { leader: '🥇 1등 보기', overview: '🗺 전체 보기', friend: '⭐ 내 친구' };

const $ = (id) => document.getElementById(id);
/** 구슬 그림을 <img>로 쓸 수 있는 주소 (시상대) */
const iconOf = (n) => marbleSprite(n).toDataURL();
/** 원작 숫자 친구 그림 (고르기 · 순위표) */
const picOf = spriteUrl;
const sec = (t) => `${t.toFixed(2)}초`;

/**
 * h = { onCount(n), onCheer(n), onGo(), onPlay(), onReset(), onSpeed(), onCam(), onExit(), onAgain(), onDone() }
 */
export function createRaceUI(h) {
  const setup = $('raceSetup'), result = $('raceResult'), board = $('raceBoard'), count = $('raceCount');
  let lastBoard = '', results = [];

  $('raceGo').onclick = h.onGo;
  $('racePlay').onclick = h.onPlay;
  $('raceReset').onclick = h.onReset;
  $('raceSpeed').onclick = h.onSpeed;
  $('raceCam').onclick = h.onCam;
  $('raceExit').onclick = h.onExit;
  $('raceAgain').onclick = h.onAgain;
  $('raceDone').onclick = h.onDone;
  $('raceCsv').onclick = () => saveCsv(results);

  /** 시작 화면 — 몇 명이 달릴지, 응원할 친구 고르기 */
  function showSetup(racers, cheer) {
    result.classList.remove('on');
    setup.classList.add('on');
    $('raceNum').innerHTML = RACER_CHOICES.map(n =>
      `<button data-n="${n}" class="${n === racers ? 'on' : ''}">${n}명</button>`).join('');
    $('raceNum').onclick = (e) => { const n = +e.target.dataset.n; if (n) h.onCount(n); };
    let html = '';
    for (let n = 1; n <= racers; n++)
      html += `<button data-n="${n}" class="${n === cheer ? 'on' : ''}"><img src="${picOf(n)}" alt="${n}"><b>${n}</b></button>`;
    $('racePick').innerHTML = html;
    $('racePick').onclick = (e) => {
      const b = e.target.closest('button');
      if (b) h.onCheer(+b.dataset.n);
    };
    $('raceGo').textContent = cheer ? `🏁 출발! (⭐ ${cheer} 응원)` : '🏁 출발!';
  }
  function hideSetup() { setup.classList.remove('on'); }

  /** 3, 2, 1, 출발! — text가 비면 숨긴다 */
  function showCount(text) {
    count.textContent = text || '';
    count.classList.toggle('on', !!text);
  }

  /** 오른쪽 순위표. rows = [{ n, time }] (time이 있으면 들어온 것) */
  function renderBoard(rows, cheer) {
    const top = rows.slice(0, BOARD_ROWS);
    const mine = cheer ? rows.findIndex(r => r.n === cheer) : -1;
    let html = top.map((r, i) => row(i, r, cheer)).join('');
    if (mine >= BOARD_ROWS) html += `<div class="dots">⋯</div>` + row(mine, rows[mine], cheer);
    if (html === lastBoard) return;
    lastBoard = html;
    board.innerHTML = html;
  }
  function row(i, r, cheer) {
    const cls = [r.time != null ? 'done' : '', r.n === cheer ? 'me' : ''].join(' ');
    return `<div class="brow ${cls}"><span class="rk">${MEDALS[i] || i + 1}</span>` +
           `<img src="${picOf(r.n)}"><b>${r.n}</b><span class="tm">${r.time != null ? sec(r.time) : ''}</span></div>`;
  }

  /** 🏆 결과 — 시상대(1·2·3등)와 모든 순위 */
  function showResult(list, cheer) {
    results = list;
    const pod = [1, 0, 2].map(i => list[i]).map((r, k) => {
      if (!r) return '<div class="pod"></div>';
      const place = [2, 1, 3][k];
      return `<div class="pod p${place}">
        <img class="friend" src="${spriteUrl(r.n)}" alt="${r.n}">
        <img class="ball" src="${iconOf(r.n)}">
        <div class="step" style="--c:${colorOf(r.n)}">${MEDALS[place - 1]}<br>${r.n}</div></div>`;
    }).join('');
    $('podium').innerHTML = pod;
    const mine = cheer ? list.findIndex(r => r.n === cheer) : -1;
    $('raceCheerMsg').textContent = mine < 0 ? `🎉 1등은 ${list[0].n}번!`
      : mine === 0 ? `⭐ 내 친구 ${cheer}번이 1등! 최고예요! 🎉`
      : `⭐ 내 친구 ${cheer}번은 ${mine + 1}등! 잘 달렸어요!`;
    $('raceList').innerHTML = list.map((r, i) =>
      `<li class="${r.n === cheer ? 'me' : ''}"><span>${MEDALS[i] || (i + 1) + '등'}</span>` +
      `<img src="${picOf(r.n)}"><b>${r.n}</b><span>${r.time != null ? sec(r.time) : '도착 못 함'}</span></li>`).join('');
    result.classList.add('on');
  }
  function hideResult() { result.classList.remove('on'); }

  return {
    showSetup, hideSetup, showCount, renderBoard, showResult, hideResult,
    setPlay(paused) { $('racePlay').textContent = paused ? '▶️' : '⏸'; },
    setSpeed(x) { $('raceSpeed').textContent = `${x}x`; },
    setCam(mode) { $('raceCam').textContent = CAM_LABEL[mode]; },
    setClock(t) { $('raceClock').textContent = `⏱ ${t.toFixed(1)}초`; },
    clearBoard() { lastBoard = ''; board.innerHTML = ''; },
  };
}

/** 💾 결과를 CSV 파일로 내려받는다 (엑셀에서 열린다) */
function saveCsv(list) {
  if (!list.length) return;
  const lines = ['순위,번호,기록(초)', ...list.map((r, i) => `${i + 1},${r.n},${r.time != null ? r.time.toFixed(2) : ''}`)];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const d = new Date(), p = (v) => String(v).padStart(2, '0');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `marble-race-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
