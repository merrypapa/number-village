// ===========================================================
//  HUD — 화면에 떠 있는 글씨와 버튼 (티니핑 월드 main.js에서 떼어 왔다)
//    toast          : 화면 가운데 메시지
//    action button  : 지금 자리에서 할 수 있는 일 (구하기 · 타기 · 세기 …)
//    ride buttons   : 엘리베이터 ▲▼ 처럼 놀이기구가 들고 있는 버튼
//    compass        : 가장 가까운 못 찾은 친구 쪽을 가리키는 화살표
// ===========================================================

let toastTimer = 0;
/** 화면 가운데 메시지 */
export function toast(text, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/**
 * 🅰 행동 버튼 — 서 있는 자리에서 할 수 있는 일을 보여준다
 *    놀이기구 옆 → 타기 / 내리기,  말 거는 자리 → 그 자리의 verb (구하기 · 달님 · 세기)
 */
export function createActionButton(player) {
  const btn = document.getElementById('ride');
  let label = '';
  return function update() {
    let want = '';
    if (player.ride && player.nearRide) want = player.nearRide.verb || '타기';
    else if (player.ride) want = player.ride.autoEnd ? '' : (player.ride.offVerb || '내리기');
    else if (player.nearRide) want = player.nearRide.verb || '타기';
    else if (player.nearSpot) want = player.nearSpot.verb || '부르기';
    if (want === label) return;
    label = want;
    btn.style.display = want ? 'flex' : 'none';
    if (want) { btn.textContent = want; btn.dataset.len = String(want.length); }
  };
}

/** 🛗 놀이기구가 들고 있는 버튼 두 개 (엄마성 엘리베이터 ▲▼) */
export function createRideButtons(player) {
  const els = [document.getElementById('liftUp'), document.getElementById('liftDn')];
  let shown = '';
  addEventListener('keydown', (e) => {
    const list = player.ride?.buttons;
    if (!list) return;
    if (e.code === 'ArrowUp')   list[0]?.press();
    if (e.code === 'ArrowDown') list[1]?.press();
  });
  return function update() {
    const list = player.ride?.buttons || [];
    const key = list.map(b => b.label).join('|');
    if (key === shown) return;
    shown = key;
    els.forEach((el, i) => {
      el.style.display = list[i] ? 'flex' : 'none';
      if (list[i] && el.textContent !== list[i].label) el.textContent = list[i].label;
    });
  };
}

/** 🎵 음악 켜기/끄기 버튼 */
export function setupMusicButton(music) {
  const btn = document.getElementById('musicBtn');
  btn.classList.toggle('off', !music.on);
  btn.onclick = () => {
    const on = music.toggle();
    btn.classList.toggle('off', !on);
    toast(on ? '음악을 켰어요 🎵' : '음악을 꺼요 🔇');
  };
}

/**
 * 🧭 나침반 — 가장 가까운 못 찾은 친구가 어느 쪽인지 화살표로 알려준다
 *    (밤 마을이 넓어서 이게 없으면 한참 헤맨다)
 */
export function createCompass(camera, player) {
  const el = document.getElementById('compass');
  const arrow = el.querySelector('.arrow');
  const dist = el.querySelector('.dist');
  return function update(target) {
    if (!target) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const p = player.model.position, q = target;      // target = { x, z, dist, label }
    // 카메라가 보는 방향을 기준으로 화살표를 돌린다 (앞 = 위)
    const camYaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    const toYaw = Math.atan2(q.x - p.x, q.z - p.z);
    const rel = toYaw - camYaw + Math.PI;
    arrow.style.transform = `rotate(${-rel}rad)`;
    dist.textContent = target.label ? `${target.label} ${Math.round(target.dist)}m` : `${Math.round(target.dist)}m`;
  };
}
