import { normalize } from './normalize';

export function isCorrectText(input: string, answer: string): boolean {
  return normalize(input) === normalize(answer);
}

export function similarity(a: string, b: string): number {
  const ta = normalize(a).split(' ').filter(Boolean);
  const tb = normalize(b).split(' ').filter(Boolean);
  if (ta.length === 0 && tb.length === 0) return 1;
  const setB = new Set(tb);
  const matches = ta.filter((t) => setB.has(t)).length;
  return matches / Math.max(ta.length, tb.length);
}

export function isCloseEnough(input: string, answer: string, threshold = 0.8): boolean {
  return isCorrectText(input, answer) || similarity(input, answer) >= threshold;
}

// 수업 자료 표제어에는 대안을 슬래시로 묶은 것("barely/seldom/hardly")과 자리표시자가
// 든 것("keep sb in the loop")이 있다. 둘 다 적힌 그대로 말할 수 없으므로, 표제어가
// 허용하는 범위 안에서 말했으면 맞은 것으로 본다.
const PLACEHOLDERS = new Set(['sb', 'sth', 'v', 'someone', 'somebody', 'something']);

export function isSpokenMatch(input: string, answer: string): boolean {
  if (isCloseEnough(input, answer)) return true;

  const said = normalize(input).split(' ').filter(Boolean);
  if (said.length === 0) return false;

  const answerTokens = normalize(answer.replace(/\//g, ' ')).split(' ').filter(Boolean);

  if (answer.includes('/')) {
    // 어느 대안을 골라 말하든 통과시키되, 표제어의 일부만 내뱉는 것은 막는다.
    const allowed = new Set(answerTokens);
    const slashCount = (answer.match(/\//g) ?? []).length;
    const minLength = Math.ceil(answerTokens.length / (slashCount + 1));
    return said.length >= minLength && said.every((t) => allowed.has(t));
  }

  const required = answerTokens.filter((t) => !PLACEHOLDERS.has(t));
  if (required.length === answerTokens.length) return false;
  // 자리표시자 자리에 무엇을 넣든, 나머지를 모두 말했으면 통과.
  return required.every((t) => said.includes(t));
}
