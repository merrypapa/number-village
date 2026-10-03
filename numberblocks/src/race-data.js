// ===========================================================
//  🏁 숫자 구슬 레이스 — 설정 · 구슬 색 · 구슬 그림
//  (Algodoo 마블 레이스처럼 숫자 친구 구슬이 굴러 내려가는 게임)
//  구슬 = 투명한 유리구슬 안에 **원작 숫자 친구 그림**(assets/numberblocks/nbN.png) + 아래 번호표
//  테두리 색은 넘버블럭스처럼 일의 자리 색 (10·20·30·40은 십의 자리 색, 7은 무지개)
// ===========================================================

// -----------------------------------------------------------
//  ★ 아이랑 같이 바꿔볼 값
// -----------------------------------------------------------
export const MAX_RACERS   = 100;         // 구슬 최대 몇 명 (1 ~ 100)
export const RACER_CHOICES = [10, 30, 50, 100];  // 시작 화면의 '몇 명이 달릴까?' 버튼
export const MARBLE_R     = 16;          // 구슬 반지름 (코스 픽셀) — 안에 숫자 친구 그림이 들어간다
export const BOUNCE       = 0.6;         // 통통 튀는 정도 (0 = 안 튐, 1 = 공처럼)
export const SLIP         = 0.05;        // 미끄러운 정도 (작을수록 잘 미끄러진다)
export const SPEEDS       = [1, 2, 4];   // 빨리 감기 (1x · 2x · 4x)
export const COUNTDOWN    = 3;           // 출발 전 3, 2, 1
export const LATE_LIMIT   = 90;          // 1등이 들어오고 이 시간(초)이 지나면 경기 끝 (꼴찌가 끼어 있을 때)

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
export const TENS_RING = [null, '#e0201a', '#ff8000', '#f5c400', '#1f9e3f', '#1aa6e0',
                          '#4a48c0', '#9b3fd0', '#e0207a', '#6f7a90', '#e0201a'];   // 10 ~ 100
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
//  구슬 그림 — 투명한 비눗방울 구슬 안에 **원작 숫자 친구 그림**(nbN.png)이 들어 있다.
//  한 번만 그려서 캔버스에 넣어두고 매 프레임 붙인다. 그림이 아직 안 읽혔으면 색 구슬로 대신한다.
// -----------------------------------------------------------
const S = 128;                       // 그려두는 크기(px). 화면에서 줄여서 쓴다
const cache = {};
const IMGS = {};

function imageOf(n) {
  if (!IMGS[n]) {
    const im = new Image();
    im.onload = () => { delete cache[n]; };      // 그림이 오면 구슬을 새로 그린다
    im.src = spriteUrl(n);
    IMGS[n] = im;
  }
  return IMGS[n];
}
/** 경기 전에 그림을 미리 읽어 둔다 */
export function preloadSprites(count = MAX_RACERS) { for (let n = 1; n <= count; n++) imageOf(n); }

/** 구슬 n의 그림 (캔버스) */
export function marbleSprite(n) {
  if (cache[n]) return cache[n];
  const im = imageOf(n);
  const ready = im.complete && im.naturalWidth > 0;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const c = S / 2, R = S / 2 - 3;
  const col = colorOf(n);

  g.save();
  g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.clip();
  // 구슬 속 — 하얀 바탕에 친구 색이 살짝
  const bg = g.createRadialGradient(c, c, R * 0.2, c, c, R);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, col + '66');
  g.fillStyle = ready ? bg : col;
  g.fillRect(0, 0, S, S);
  // 원작 숫자 친구 그림 — 구슬 안에 꽉 차게 (비율 그대로)
  if (ready) {
    const box = R * 1.62;
    const k = Math.min(box / im.naturalWidth, box / im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    g.drawImage(im, c - w / 2, c - h / 2 - R * 0.04, w, h);
  }
  // 반짝이 — 유리구슬처럼
  const gloss = g.createRadialGradient(c - R * 0.45, c - R * 0.5, 0, c - R * 0.45, c - R * 0.5, R * 0.6);
  gloss.addColorStop(0, 'rgba(255,255,255,0.7)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gloss; g.fillRect(0, 0, S, S);
  g.restore();

  // 테두리 — 친구 대표 색 (7은 무지개)
  g.lineWidth = 8;
  if (UNIT_FILL[n % 10] === 'rainbow') {
    const lg = g.createLinearGradient(0, 0, S, S);
    RAINBOW.forEach((cc, i) => lg.addColorStop(i / (RAINBOW.length - 1), cc));
    g.strokeStyle = lg;
  } else g.strokeStyle = col;
  g.beginPath(); g.arc(c, c, R - 3, 0, Math.PI * 2); g.stroke();

  // 숫자 꼬리표 — 아래쪽 작은 동그라미
  g.font = `900 ${R * 0.42}px "Trebuchet MS","Apple SD Gothic Neo",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = Math.max(R * 0.5, g.measureText(String(n)).width + R * 0.22), ty = c + R * 0.74;
  g.fillStyle = '#1d1d2b';
  g.beginPath(); g.roundRect(c - tw / 2, ty - R * 0.24, tw, R * 0.48, R * 0.24); g.fill();
  g.fillStyle = '#fff';
  g.fillText(String(n), c, ty + 1);

  if (ready) cache[n] = cv;            // 그림이 들어간 것만 저장 (아니면 다음에 다시 그린다)
  return cv;
}
