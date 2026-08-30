// ===========================================================
//  캐릭터 데이터 + 3D 만들기 창구
//  ★ 새 캐릭터를 만들려면 아래 CHARACTERS 배열에 한 줄만 추가하세요.
//    캐릭터 선택 화면과 마을 NPC에 자동으로 나타납니다.
// ===========================================================
import { makeBlock } from './character-block.js';
import { makePing } from './character-ping.js';
import { makePrincess } from './character-princess.js';

// 캐릭터 종류별로 3D를 만드는 함수 (type 값이 열쇠다)
const BUILDERS = {
  block:    makeBlock,      // 숫자블록 친구
  ping:     makePing,       // 요정 친구
  princess: makePrincess,   // 얼음공주 요정 (전용 뼈대)
};

// -----------------------------------------------------------
//  캐릭터 목록  ← 아이랑 같이 고치는 곳!
//
//  type    : 'block'(숫자블록) · 'ping'(요정) · 'princess'(얼음공주 요정)
//  color   : 몸 색깔
//  deco    : 머리 장식 — star heart drop ribbon leaf crown tiara moon gem flower candy cloud
//  eye     : 눈동자 색     (안 쓰면 보라색)
//  gem     : 이마 보석 색  (안 쓰면 노란색)
//  wing    : 날개 색       (안 쓰면 몸 색을 밝게)
//  accent  : 귀 안쪽 색    (안 쓰면 몸 색을 어둡게)
//  decoColor: 머리 장식 색 (안 쓰면 장식마다 정해진 기본색)
//
//  ↓ 아래 값은 "안 쓰면 안 생기는" 꾸미기다. 주면 자동으로 붙는다.
//  hair    : 머리카락 색 (주면 긴 머리와 앞머리가 생긴다)
//  hairTip : 머리카락 끝 색 (안 쓰면 hair를 밝게)
//  earColor: 귀 색 (hair가 있을 때 동글동글 하얀 귀가 된다)
//  dress   : 드레스 윗옷 색, skirt: 치마 색, emblem: 가슴 무늬 색
//  shoe    : 구두 색
//  glossy  : true면 반질반질한 3D 인형 재질 (테두리 없음)
//  face    : 'doll'이면 자세한 인형 얼굴 (큰 눈·코·웃는 입)
//  eyeSize : 눈 크기 배수 (1.35쯤이 그림 속 요정 느낌)
//  headScale/bodyScale : 머리·몸 크기 배수 (머리를 크게 하면 더 아기 같다)
//  cheek   : 볼터치 색
// -----------------------------------------------------------
export const CHARACTERS = [
  // --- 숫자블록 친구 10명 ---
  { id:'one',   name:'하나',   type:'block', number:1,  color:0xff5a5a },
  { id:'two',   name:'두리',   type:'block', number:2,  color:0xff9f43 },
  { id:'three', name:'세모',   type:'block', number:3,  color:0xffd93d },
  { id:'four',  name:'네모',   type:'block', number:4,  color:0x6ddf6d },
  { id:'five',  name:'오공',   type:'block', number:5,  color:0x63c8ff },
  { id:'six',   name:'육이',   type:'block', number:6,  color:0x5a7bff },
  { id:'seven', name:'칠보',   type:'block', number:7,  color:0xb072ff },
  { id:'eight', name:'팔팔',   type:'block', number:8,  color:0xff7ec4 },
  { id:'nine',  name:'구름',   type:'block', number:9,  color:0x5fe6c8 },
  { id:'ten',   name:'열이',   type:'block', number:10, color:0xffffff, rainbow:true },

  // --- 요정 친구 8명 ---
  { id:'banjjak', name:'반짝핑', type:'ping', color:0xffb3d9, deco:'star',   eye:0xd6478f, gem:0xffe066, wing:0xffe3f2, accent:0xff8ec8 },
  { id:'monggle', name:'몽글핑', type:'ping', color:0xc3b1f5, deco:'heart',  eye:0x6a3fd0, gem:0xe0ccff, wing:0xe6dcff, accent:0xa88fe8 },
  { id:'bangul',  name:'방울핑', type:'ping', color:0xa8e0ff, deco:'drop',   decoColor:0x4fb0ee, eye:0x2f7fd6, gem:0x8fd6ff, wing:0xdcf3ff, accent:0x7cc6f0 },
  // 초코핑 — imaes/char1.png 그림을 보고 만든 얼음공주 요정 (전용 뼈대 princess)
  { id:'choco',   name:'초코핑', type:'princess',
    color:0xfff2f5,                                   // 아주 창백한 살구빛 얼굴·팔다리
    hair:0xa9dcf0, hairTip:0xd8b4e4, earColor:0xfdfdff,
    eye:0x2f6fc0, gem:0x6fd8e8, cheek:0xff9fbb,
    deco:'tiara', decoColor:0xf0b8d8,
    dress:0xfdfdff, skirt:0xd4ebf8, emblem:0xf0b830, shoe:0xd6d8f5 },
  { id:'sallang', name:'살랑핑', type:'ping', color:0xb9ef9c, deco:'leaf',   eye:0x3f9440, gem:0xd8f79a, wing:0xe4ffd0, accent:0x92d977 },
  { id:'ppogeul', name:'뽀글핑', type:'ping', color:0xfff0b8, deco:'crown',  eye:0xd2952a, gem:0xffd95e, wing:0xfff7dd, accent:0xf5d98a },
  { id:'byeolbam',name:'별밤핑', type:'ping', color:0x9aa8e0, deco:'moon',   eye:0x3a3f8f, gem:0xfff0a8, wing:0xd4dcff, accent:0x7c8ac9 },
  { id:'muji',    name:'무지핑', type:'ping', color:0xffd6f0, deco:'flower', eye:0xa03fb8, gem:0xb0f0ff, wing:0xffe9fb, accent:0xf0aede },
];

// -----------------------------------------------------------
//  공개 API
// -----------------------------------------------------------
/**
 * 캐릭터 정의로 3D 그룹을 만든다.
 * detail: 'full'  = 플레이어·선택 화면용 (테두리, 속눈썹, 반짝이까지 전부)
 *         'simple'= 마을 NPC용 (조금 가볍게 — 24명이 동시에 나와도 안 느리게)
 * 만든 뒤 group.userData.update(t, moving)을 매 프레임 부르면 움직인다.
 */
export function createCharacter(def, detail = 'full') {
  const build = BUILDERS[def.type] ?? makePing;
  const g = build(def, detail);
  g.name = def.name;
  g.userData.def = def;

  const animate = g.userData.animate;
  const phase = Math.random() * 10;   // 캐릭터마다 애니메이션 시작 시점을 다르게
  g.userData.update = (t, moving) => animate(g, t + phase, moving);

  return g;
}

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
