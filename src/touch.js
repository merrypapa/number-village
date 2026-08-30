// ===========================================================
//  모바일 조작 (아이패드 · 아이폰 · 안드로이드)
//  왼쪽 아래 동그라미를 손가락으로 밀면 움직이고,
//  오른쪽 버튼으로 점프하고 인사한다.
//
//  ★ 손가락 여러 개를 따로 따로 처리한다.
//    (왼손으로 걸으면서 오른손으로 점프해도 안 엉킨다)
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
const DEAD_ZONE = 0.16;   // 이만큼 살짝 민 건 무시한다 (실수로 툭 건드릴 때)
const KNOB_MAX  = 46;     // 손잡이가 가운데에서 최대로 움직이는 거리(px)

/**
 * 가상 조이스틱과 버튼을 켠다.
 * player : createPlayer가 돌려준 것 (player.joy를 채우고 player.jump를 부른다)
 * onGreet: 인사 버튼을 눌렀을 때 할 일
 */
export function setupTouchControls(player, onGreet) {
  const stick = document.getElementById('stick');
  const knob  = document.getElementById('knob');
  const joy   = player.joy;

  let stickId = null;          // 조이스틱을 잡고 있는 손가락 번호
  let cx = 0, cy = 0;          // 조이스틱 한가운데 화면 좌표

  function reset() {
    stickId = null;
    joy.x = joy.y = joy.mag = 0;
    joy.active = false;
    knob.style.transform = 'translate(0px, 0px)';
  }

  function moveKnob(clientX, clientY) {
    let dx = clientX - cx;
    let dy = clientY - cy;

    // 동그라미 밖으로는 안 나가게 길이를 자른다
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, KNOB_MAX);
    dx = dx / len * clamped;
    dy = dy / len * clamped;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    const mag = clamped / KNOB_MAX;          // 0 ~ 1
    if (mag < DEAD_ZONE) {
      joy.x = joy.y = joy.mag = 0;
      joy.active = false;
      return;
    }
    // 방향은 그대로, 세기는 데드존을 뺀 뒤 다시 0~1로 폈다
    joy.x = dx / clamped;
    joy.y = dy / clamped;                    // 위로 밀면 음수 = 앞으로 (키보드 ↑와 같다)
    joy.mag = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
    joy.active = true;
  }

  stick.addEventListener('pointerdown', e => {
    if (stickId !== null) return;            // 이미 다른 손가락이 잡고 있다
    stickId = e.pointerId;
    stick.setPointerCapture(e.pointerId);    // 손가락이 밖으로 나가도 계속 따라온다
    const r = stick.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
    moveKnob(e.clientX, e.clientY);
    e.preventDefault();
  });

  stick.addEventListener('pointermove', e => {
    if (e.pointerId !== stickId) return;
    moveKnob(e.clientX, e.clientY);
    e.preventDefault();
  });

  const release = e => { if (e.pointerId === stickId) reset(); };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);
  stick.addEventListener('lostpointercapture', release);

  // 게임 화면을 벗어나면(다른 앱으로 갔다가 오면) 손을 뗀 것으로 친다
  addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });

  // -----------------------------------------------------------
  //  버튼 — 터치는 pointerdown이 click보다 빨라서 반응이 좋다
  // -----------------------------------------------------------
  function tapButton(el, run) {
    el.addEventListener('pointerdown', e => { e.preventDefault(); run(); });
    // 마우스·키보드 접근성용 (터치에서는 pointerdown이 이미 처리해서 중복 실행되지 않는다)
    el.addEventListener('click', e => { if (e.detail === 0) run(); });
  }

  tapButton(document.getElementById('jump'), () => player.jump());
  tapButton(document.getElementById('hi'), onGreet);
  // 🅰 행동 버튼 — 놀이기구 옆이나 요정 친구 앞에서만 나타난다 (main.js가 보여준다)
  //  타기 / 내리기 / 부르기 / 보내기 — 무슨 글씨가 쓰일지는 main.js가 정한다
  tapButton(document.getElementById('ride'), () => player.action());

  reset();
}
