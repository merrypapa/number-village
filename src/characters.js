// ===========================================================
//  캐릭터 데이터 + 3D 만들기 창구
//  ★ 새 캐릭터를 만들려면 아래 CHARACTERS 배열에 한 줄만 추가하세요.
//    캐릭터 선택 화면과 마을 NPC에 자동으로 나타납니다.
// ===========================================================
import { makeBlock } from './character-block.js';
import { makePing } from './character-ping.js';

// -----------------------------------------------------------
//  캐릭터 목록  ← 아이랑 같이 고치는 곳!
//
//  type    : 'block'(숫자블록 친구) 또는 'ping'(요정 친구)
//  color   : 몸 색깔
//  deco    : 머리 장식 — star heart drop ribbon leaf crown moon gem flower candy cloud
//  eye     : 눈동자 색     (안 쓰면 보라색)
//  gem     : 이마 보석 색  (안 쓰면 노란색)
//  wing    : 날개 색       (안 쓰면 몸 색을 밝게)
//  accent  : 귀 안쪽·신발 색 (안 쓰면 몸 색을 어둡게)
//  hair    : 머리카락 색  / hairTip : 머리끝 색
//  belly   : 배 무늬 색    (안 쓰면 몸 색을 밝게)
//  frill   : 목 프릴 색    (안 쓰면 몸 색을 아주 밝게)
//  decoColor: 머리 장식 색 (안 쓰면 장식마다 정해진 기본색)
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
  { id:'banjjak', name:'반짝핑', type:'ping', color:0xffb3d9, deco:'star',   eye:0xd6478f, gem:0xffe066, wing:0xffe3f2, accent:0xff8ec8, hair:0xff5c9f, hairTip:0xffd6ea },
  { id:'monggle', name:'몽글핑', type:'ping', color:0xc3b1f5, deco:'heart',  eye:0x6a3fd0, gem:0xe0ccff, wing:0xe6dcff, accent:0xa88fe8, hair:0x7c5be0, hairTip:0xded2ff },
  { id:'bangul',  name:'방울핑', type:'ping', color:0xa8e0ff, deco:'drop',   decoColor:0x4fb0ee, eye:0x2f7fd6, gem:0x8fd6ff, wing:0xdcf3ff, accent:0x7cc6f0, hair:0x3fa9e8, hairTip:0xd6f2ff },
  { id:'choco',   name:'초코핑', type:'ping', color:0xc79a6b, deco:'ribbon', eye:0x6b3f22, gem:0xffd9a8, wing:0xf0dcc2, accent:0xa87a4c, hair:0x8a5a32, hairTip:0xe8c9a4 },
  { id:'sallang', name:'살랑핑', type:'ping', color:0xb9ef9c, deco:'leaf',   eye:0x3f9440, gem:0xd8f79a, wing:0xe4ffd0, accent:0x92d977, hair:0x5fbf4f, hairTip:0xdcf9c6 },
  { id:'ppogeul', name:'뽀글핑', type:'ping', color:0xfff0b8, deco:'crown',  eye:0xd2952a, gem:0xffd95e, wing:0xfff7dd, accent:0xf5d98a, hair:0xf2c04a, hairTip:0xfff6d8 },
  { id:'byeolbam',name:'별밤핑', type:'ping', color:0x9aa8e0, deco:'moon',   eye:0x3a3f8f, gem:0xfff0a8, wing:0xd4dcff, accent:0x7c8ac9, hair:0x4a56b0, hairTip:0xcdd6ff },
  { id:'muji',    name:'무지핑', type:'ping', color:0xffd6f0, deco:'flower', eye:0xa03fb8, gem:0xb0f0ff, wing:0xffe9fb, accent:0xf0aede, hair:0xc05fd8, hairTip:0xffe6f8 },
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
  const g = def.type === 'block' ? makeBlock(def) : makePing(def, detail);
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
