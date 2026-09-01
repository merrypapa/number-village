// ===========================================================
//  한국어 조사 붙이기 — "라면을 / 사과를" 처럼 자연스럽게 말하기
//  받침(마지막 글자의 종성)이 있는지 보고 조사를 고른다.
// ===========================================================

/** 마지막 글자에 받침이 있나? (한글이 아니면 false) */
export function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

/** 라면 → 라면을,  사과 → 사과를 */
export function withObject(name) { return name + (hasBatchim(name) ? '을' : '를'); }

/** 라면 → 라면이,  사과 → 사과가 */
export function withSubject(name) { return name + (hasBatchim(name) ? '이' : '가'); }
