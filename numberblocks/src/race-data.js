// ===========================================================
//  🏁 숫자 구슬 레이스 — 설정 · 구슬 색 · 구슬 그림
//  (Algodoo 마블 레이스처럼 숫자 친구 구슬이 굴러 내려가는 게임)
//  구슬 색은 넘버블럭스처럼 —
//    · 1~9는 자기 색 (1 빨강, 2 주황, 3 노랑 …, 7은 무지개)
//    · 10, 20, 30, 40은 하얀 몸에 십의 자리 색 테두리
//    · 11~41은 일의 자리 색 몸에 십의 자리 색 테두리 (예: 23 = 노랑 몸 + 주황 테두리)
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const MAX_RACERS   = 41;          // 구슬 최대 몇 명
export const RACER_CHOICES = [10, 20, 30, 41];   // 시작 화면의 '몇 명이 달릴까?' 버튼
export const MARBLE_R     = 13;          // 구슬 반지름 (코스 픽셀)
export const BOUNCE       = 0.6;         // 통통 튀는 정도 (0 = 안 튐, 1 = 공처럼)
export const SLIP         = 0.05;        // 미끄러운 정도 (작을수록 잘 미끄러진다)
export const SPEEDS       = [1, 2, 4];   // 빨리 감기 (1x · 2x · 4x)
export const COUNTDOWN    = 3;           // 출발 전 3, 2, 1
export const LATE_LIMIT   = 60;          // 1등이 들어오고 이 시간(초)이 지나면 경기 끝 (꼴찌가 끼어 있을 때)

// 일의 자리 색 (0번 칸 = 10, 20 … 의 하얀 몸)
export const UNIT_FILL = [
  '#ffffff',   // 0 (10·20·30·40) 하양
  '#ff3b30',   // 1 빨강
  '#ff9500',   // 2 주황
  '#ffd60a',   // 3 노랑
  '#34c759',   // 4 초록
  '#32c5ff',   // 5 하늘
  '#5856d6',   // 6 남보라
  'rainbow',   // 7 무지개
  '#ff2d92',   // 8 분홍
  '#8e9aaf',   // 9 회색
];
// 십의 자리 테두리 색 (0번 칸 = 1~9는 자기 몸 색을 조금 진하게)
export const TENS_RING = [null, '#e0201a', '#ff8000', '#f5c400', '#1f9e3f'];
const RAINBOW = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#32c5ff', '#5856d6', '#af52de'];

/** 구슬 n의 대표 색 하나 (순위표 동그라미에 쓴다) */
export function colorOf(n) {
  const f = UNIT_FILL[n % 10];
  return f === 'rainbow' ? '#af52de' : f === '#ffffff' ? TENS_RING[Math.floor(n / 10)] : f;
}

// 원작 숫자 친구 그림 (도감과 같은 파일) — 시상대에 세운다
const SPRITE_DIR = new URL('../../assets/numberblocks/', import.meta.url).href;
export const spriteUrl = (n) => `${SPRITE_DIR}nb${n}.png`;

// -----------------------------------------------------------
//  구슬 그림 — 한 번만 그려서 캔버스에 넣어두고 매 프레임 붙인다
// -----------------------------------------------------------
const S = 96;                        // 그려두는 크기(px). 화면에서 줄여서 쓴다
const cache = {};

function darker(hex, k = 0.72) {
  const v = parseInt(hex.slice(1), 16);
  const r = Math.round((v >> 16 & 255) * k), g = Math.round((v >> 8 & 255) * k), b = Math.round((v & 255) * k);
  return `rgb(${r},${g},${b})`;
}

/** 구슬 n의 그림 (캔버스) */
export function marbleSprite(n) {
  if (cache[n]) return cache[n];
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const c = S / 2, R = S / 2 - 3;
  const unit = n % 10, tens = Math.floor(n / 10);
  const fill = UNIT_FILL[unit];

  // 몸 색
  g.save();
  g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.clip();
  if (fill === 'rainbow') {                       // 7은 무지개 줄무늬
    RAINBOW.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * S / 7, S, S / 7 + 1); });
  } else {
    g.fillStyle = fill; g.fillRect(0, 0, S, S);
  }
  // 둥근 그림자 + 반짝이 — 구슬처럼 보이게
  const shade = g.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
  shade.addColorStop(0, 'rgba(255,255,255,0.55)');
  shade.addColorStop(0.45, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  g.fillStyle = shade; g.fillRect(0, 0, S, S);
  g.restore();

  // 테두리 — 10 이상은 십의 자리 색, 1~9는 자기 색을 진하게
  const ring = tens ? TENS_RING[tens] : (fill === 'rainbow' ? '#7a3fb0' : darker(fill));
  g.lineWidth = tens ? 9 : 5;
  g.strokeStyle = ring;
  g.beginPath(); g.arc(c, c, R - g.lineWidth / 2 + 1, 0, Math.PI * 2); g.stroke();

  // 눈 — 1은 원작처럼 눈 하나
  const eyes = n === 1 ? [0] : [-0.3, 0.3];
  for (const ex of eyes) {
    const x = c + ex * R, y = c - R * 0.28;
    g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, y, R * 0.19, R * 0.23, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#222';
    g.beginPath(); g.arc(x + R * 0.04, y + R * 0.05, R * 0.1, 0, Math.PI * 2); g.fill();
  }

  // 숫자 — 어떤 색 위에서도 잘 보이게 검은 테두리 + 흰 글씨
  g.font = `900 ${n < 10 ? R * 0.9 : R * 0.78}px "Trebuchet MS","Apple SD Gothic Neo",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 7; g.strokeStyle = '#1d1d2b'; g.lineJoin = 'round';
  g.strokeText(String(n), c, c + R * 0.38);
  g.fillStyle = '#fff';
  g.fillText(String(n), c, c + R * 0.38);

  cache[n] = cv;
  return cv;
}
