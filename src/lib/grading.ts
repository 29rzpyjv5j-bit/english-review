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
