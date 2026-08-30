// ===========================================================
//  캐릭터 데이터 + 3D 만들기 창구
//  ★ 새 캐릭터를 만들려면 아래 CHARACTERS 배열에 한 줄만 추가하세요.
//    캐릭터 선택 화면과 마을 NPC에 자동으로 나타납니다.
// ===========================================================
import { makeBlock } from './character-block.js';
import { makePing } from './character-ping.js';
import { makePrincess } from './character-princess.js';
import { makeModel } from './character-model.js';

// 캐릭터 종류별로 3D를 만드는 함수 (type 값이 열쇠다)
const BUILDERS = {
  block:    makeBlock,      // 숫자블록 친구
  ping:     makePing,       // 요정 친구
  princess: makePrincess,   // 얼음공주 요정 (전용 뼈대)
  model:    makeModel,      // 모델링 툴에서 만든 .glb 파일을 불러오는 친구
};

// -----------------------------------------------------------
//  캐릭터 목록  ← 아이랑 같이 고치는 곳!
//
//  type    : 'model'  = 모델링 툴에서 만든 .glb 파일 (file 값에 파일 이름)  ← 요정 친구들
//            'block'  = 숫자블록 친구 (코드로 큐브를 쌓는다)
//            'ping' / 'princess' = 예전에 코드 도형으로 만들던 방식. 지금은 쓰는 캐릭터가 없지만
//                                  그대로 두었다. 코드 도형 친구를 만들고 싶으면 쓸 수 있다.
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

  // --- 요정 친구 35명 (전부 모델링 툴에서 만든 .glb) ---
  //  ★ 새 친구를 넣으려면: assets/models/ 에 .glb를 넣고 아래에 한 줄 추가.
  //    height = 게임 속 키. 움직임은 character-model.js 맨 위 값에서 바꾼다.
  { id:'sappun',   name:'사뿐핑',   type:'model', file:'sappun.glb',   height:1.90 },
  { id:'diana',    name:'다이아나핑', type:'model', file:'diana.glb',    height:1.90 },
  { id:'longlong', name:'롱롱핑',   type:'model', file:'longlong.glb', height:1.90 },
  { id:'ruru',     name:'루루핑',   type:'model', file:'ruru.glb',     height:1.90 },
  { id:'meo',      name:'머핑',     type:'model', file:'meo.glb',      height:1.75 },
  { id:'bitna',    name:'빛나핑',   type:'model', file:'bitna.glb',    height:1.90 },
  { id:'ppodeuk',  name:'뽀득핑',   type:'model', file:'ppodeuk.glb',  height:1.90 },
  { id:'shasha',   name:'샤샤핑',   type:'model', file:'shasha.glb',   height:1.90 },
  { id:'sora',     name:'소라핑',   type:'model', file:'sora.glb',     height:1.90 },
  { id:'silk',     name:'실크핑',   type:'model', file:'silk.glb',     height:1.90 },
  { id:'aurora',   name:'오로라핑', type:'model', file:'aurora.glb',   height:1.90 },
  { id:'keo',      name:'커핑',     type:'model', file:'keo.glb',      height:1.75 },
  { id:'heartping',name:'Heartping', type:'model', file:'heartping.glb', height:1.90 },

  // --- 나중에 더 만든 친구들 ---
  { id:'kkeokkul',    name:'꺼꿀핑',      type:'model', file:'kkeokkul.glb',        height:1.90 },
  { id:'kkongkkong',  name:'꽁꽁핑',      type:'model', file:'kkongkkong.glb',      height:1.90 },
  { id:'kkurae',      name:'꾸래핑',      type:'model', file:'kkurae.glb',          height:1.90 },
  { id:'nabi',        name:'나비핑',      type:'model', file:'nabi.glb',            height:1.90 },
  { id:'ttakpul',     name:'딱풀핑',      type:'model', file:'ttakpul.glb',         height:1.90 },
  { id:'ttokttak',    name:'똑딱핑',      type:'model', file:'ttokttak.glb',        height:1.90 },
  { id:'ttokttok',    name:'똑똑핑',      type:'model', file:'ttokttok.glb',        height:1.90 },
  { id:'ttukttak',    name:'뚝딱핑',      type:'model', file:'ttukttak.glb',        height:1.90 },
  { id:'rara',        name:'라라핑',      type:'model', file:'rara.glb',            height:1.90 },
  { id:'mideo',       name:'믿어핑',      type:'model', file:'mideo.glb',           height:1.90 },
  { id:'baneul',      name:'바늘핑',      type:'model', file:'baneul.glb',          height:1.90 },
  { id:'ppuppu',      name:'뿌뿌핑',      type:'model', file:'ppuppu.glb',          height:1.90 },
  { id:'shareu',      name:'샤를핑',      type:'model', file:'shareu.glb',          height:1.90 },
  { id:'soljik',      name:'솔직핑',      type:'model', file:'soljik.glb',          height:1.90 },
  { id:'sireo',       name:'싫어핑',      type:'model', file:'sireo.glb',           height:1.90 },
  { id:'aja',         name:'아자핑',      type:'model', file:'aja.glb',             height:1.90 },
  { id:'akdong',      name:'악동핑',      type:'model', file:'akdong.glb',          height:1.90 },
  { id:'jentle',      name:'젠틀핑',      type:'model', file:'jentle.glb',          height:1.90 },
  { id:'jureu',       name:'주르핑',      type:'model', file:'jureu.glb',           height:1.90 },
  { id:'chacha',      name:'차차핑',      type:'model', file:'chacha.glb',          height:1.90 },
  { id:'hae',         name:'해핑',       type:'model', file:'hae.glb',             height:1.90 },
  { id:'hwana',       name:'화나핑',      type:'model', file:'hwana.glb',           height:1.90 },
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
