// ===========================================================
//  🎵 배경음악 — 소리를 **코드로 직접 만든다** (Web Audio)
//
//  ★ 음악 파일을 받아 쓰지 않는다 (CLAUDE.md 규칙: 남의 에셋 안 씀).
//    사인파·삼각파를 겹쳐서 그 자리에서 연주한다. 그래서 용량이 0이다.
//  ★ 공간마다 다른 곡이 흐른다 (마을 · 인하성 · 루하성 · 징검다리 · 집안).
//
//  아이랑 같이 바꿔볼 것 — 아래 TUNES의 숫자를 바꾸면 노래가 바뀐다.
//    음 번호는 피아노 건반 번호(MIDI)다. 60 = 도(C4), 62 = 레, 64 = 미 …
//    한 칸 올리면 반음 높아진다. 0은 쉼표.
// ===========================================================

const VOLUME = 0.16;        // 전체 소리 크기 (0이면 조용, 1이면 아주 큼)
const LOOKAHEAD = 0.25;     // 몇 초 앞까지 미리 예약해 둘까 (끊김 방지)

// 음 번호 → 진동수(Hz). 69 = 라(A4) = 440Hz
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// -----------------------------------------------------------
//  ★ 곡 목록 — [음번호, 길이(박)] 로 적는다. 음번호 0은 쉼표
// -----------------------------------------------------------
const TUNES = {
  // 🌳 마을 — 밝고 통통 튀는 걸음걸이
  village: {
    bpm: 112, wave: 'triangle',
    lead: [[72,1],[76,1],[79,1],[76,1], [77,1],[81,1],[79,2],
           [74,1],[77,1],[81,1],[77,1], [79,1],[76,1],[72,2]],
    bass: [[48,2],[55,2], [53,2],[55,2], [50,2],[57,2], [55,2],[48,2]],
  },
  // 🏰 인하성 — 우아한 왈츠
  castle: {
    bpm: 132, wave: 'triangle',
    lead: [[76,1],[79,1],[84,1], [83,1],[81,1],[79,1],
           [77,1],[81,1],[86,1], [84,2],[81,1],
           [76,1],[79,1],[84,1], [83,1],[81,1],[79,1],
           [77,1],[74,1],[71,1], [72,3]],
    bass: [[48,3],[55,3], [53,3],[55,3], [48,3],[55,3], [43,3],[48,3]],
  },
  // 🌙 루하성 — 느리고 꿈결 같은 밤
  ruha: {
    bpm: 76, wave: 'sine',
    lead: [[69,2],[72,1],[76,1], [74,2],[72,2],
           [69,2],[67,1],[69,1], [72,4],
           [76,2],[79,1],[76,1], [74,2],[72,2],
           [69,3],[0,1], [69,4]],
    bass: [[45,4],[41,4], [43,4],[45,4], [40,4],[45,4], [43,4],[45,4]],
  },
  // ☁️ 구름 징검다리 — 넓고 시원한 하늘
  skyway: {
    bpm: 92, wave: 'sine',
    lead: [[79,2],[83,2], [86,2],[83,2], [81,2],[79,2], [76,4],
           [77,2],[81,2], [84,2],[81,2], [79,4], [0,2],[74,2]],
    bass: [[43,4],[48,4], [45,4],[50,4], [41,4],[48,4], [43,4],[43,4]],
  },
  // 🏠 집 안 (마트 · 친구 집 · 그림의 집) — 아늑하고 따뜻하게
  home: {
    bpm: 96, wave: 'triangle',
    lead: [[72,1],[74,1],[76,2], [79,1],[76,1],[74,2],
           [72,1],[69,1],[72,2], [74,4],
           [76,1],[77,1],[79,2], [81,1],[79,1],[77,2],
           [76,1],[72,1],[74,2], [72,4]],
    bass: [[48,4],[53,4], [45,4],[50,4], [48,4],[52,4], [50,4],[43,4]],
  },
};

/** 공간 이름 → 어떤 곡을 틀까 (친구 집은 이름이 house-xxx 라서 앞글자로 본다) */
function tuneFor(name) {
  if (TUNES[name]) return name;
  if (name && name.startsWith('house')) return 'home';
  if (name === 'mart' || name === 'art') return 'home';
  return 'village';
}

export function createMusic() {
  let ctx = null, master = null;
  let scene = 'village';
  let on = true;
  let timer = null;
  let nextTime = 0;          // 다음 음을 울릴 시각
  let bassNext = 0;          // 다음 반주를 울릴 시각
  let leadAt = 0, bassAt = 0;   // 곡의 몇 번째 음까지 연주했나

  // 껐다 켠 것을 기억해 둔다 (다음에 들어와도 그대로)
  try { on = localStorage.getItem('bgm') !== 'off'; } catch { /* 무시 */ }

  /** 음 하나 울리기 — 살살 커졌다 스르륵 사라진다 */
  function note(midi, at, len, wave, gain) {
    if (!midi) return;                       // 0은 쉼표
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = hz(midi);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.04);      // 살살 커진다
    env.gain.exponentialRampToValueAtTime(0.0001, at + len * 0.95); // 스르륵 사라진다
    osc.connect(env); env.connect(master);
    osc.start(at);
    osc.stop(at + len);
  }

  /** 미리 조금씩 예약해 둔다 (한꺼번에 예약하면 소리가 끊긴다) */
  function schedule() {
    if (!ctx || ctx.state !== 'running') return;
    const tune = TUNES[tuneFor(scene)];
    const beat = 60 / tune.bpm;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const [m, len] = tune.lead[leadAt % tune.lead.length];
      note(m, nextTime, len * beat, tune.wave, 0.5);
      // 낮은 반주는 따로 센다 (길이가 달라서)
      const [bm, blen] = tune.bass[bassAt % tune.bass.length];
      if (bassNext <= nextTime + 0.001) {
        note(bm, nextTime, blen * beat, 'sine', 0.34);
        bassNext = nextTime + blen * beat;
        bassAt++;
      }
      nextTime += len * beat;
      leadAt++;
    }
  }

  /** 처음 소리를 켠다 — 브라우저 규칙상 **손가락을 한 번 댄 뒤**에만 된다 */
  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;                          // 소리를 못 내는 기기면 그냥 넘어간다
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = on ? VOLUME : 0;
    master.connect(ctx.destination);
    nextTime = ctx.currentTime + 0.1;
    bassNext = nextTime;
    timer = setInterval(schedule, 40);
  }

  /** 공간이 바뀌면 곡도 바뀐다 */
  function setScene(name) {
    const want = tuneFor(name);
    if (want === tuneFor(scene)) { scene = name; return; }
    scene = name;
    leadAt = 0; bassAt = 0;                   // 새 곡은 처음부터
    if (ctx) { nextTime = ctx.currentTime + 0.05; bassNext = nextTime; }
  }

  /** 🔊 버튼 — 켰다 껐다 */
  function toggle() {
    on = !on;
    try { localStorage.setItem('bgm', on ? 'on' : 'off'); } catch { /* 무시 */ }
    if (!ctx) { if (on) start(); return on; }
    // 뚝 끊기지 않게 0.2초에 걸쳐 줄이거나 키운다
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(on ? VOLUME : 0, ctx.currentTime + 0.2);
    return on;
  }

  function stop() { if (timer) clearInterval(timer); timer = null; }

  return { start, setScene, toggle, stop, get on() { return on; } };
}
