// ===========================================================
//  🔗 공간끼리 잇기 — "이름표"로 서로를 부른다
//
//  ★ 왜 필요한가
//    성이 네 채가 되면서 서로 길로 이어졌다.
//    루하성 ↔ 엄마성처럼 **서로를 부르는 사이**가 되면,
//    파일끼리도 서로를 import 하게 되어 뱅뱅 도는 모양이 된다 (순환 참조).
//
//  ★ 어떻게 푸는가
//    성은 자기 이름을 여기에 **적어두기만** 한다 (registerArea).
//    길(다리)은 "루하성" 같은 **이름표**만 들고 있다가,
//    아이가 문에 들어설 때 그때 진짜 함수를 찾아서 부른다 (areaBuilder).
//    → 길은 성 파일을 import 하지 않는다. 서로 부르는 일이 없어진다.
//
//  쓰는 법 —
//    // 성 쪽 (파일 맨 아래에서 한 줄)
//    registerArea('ruha', buildRuhaCastle);
//    // 길 쪽 (문에 붙일 때)
//    { to: 'ruha', build: areaBuilder('ruha'), … }
// ===========================================================

const builders = {};

/** 공간 하나를 이름표와 함께 적어둔다 (성 파일이 부른다) */
export function registerArea(name, build) {
  builders[name] = build;
}

/**
 * 이름표로 "그 공간을 만드는 함수"를 돌려준다.
 *  ★ 지금 찾지 않고, **부를 때** 찾는다. 그래서 아직 안 읽힌 파일이어도 괜찮다.
 */
export function areaBuilder(name) {
  return (ctx) => {
    const fn = builders[name];
    if (!fn) throw new Error(`아직 등록되지 않은 공간이에요: ${name}`);
    return fn(ctx);
  };
}
