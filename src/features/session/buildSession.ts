import type { Word, Sentence, Direction } from '../../types';
import { selectSessionItems, type SessionCandidate } from '../../lib/leitner';

export type ExerciseKind =
  | 'matching'
  | 'mcq'
  | 'speakWord'
  | 'repeatSentence'
  | 'dictation'
  | 'writeSentence';

export type Exercise =
  | { kind: 'matching'; pairs: { id: string; english: string; meaning: string }[] }
  | { kind: 'mcq'; wordId: string; prompt: string; answer: string; choices: string[]; direction: Direction }
  | { kind: 'speakWord'; wordId: string; english: string; meaning: string }
  | { kind: 'repeatSentence'; sentenceId: string; text: string; translation?: string }
  | { kind: 'dictation'; sentenceId: string; text: string; translation?: string }
  // 뜻을 보고 영어 문장을 타이핑한다(소리 불필요 — 무음 학습용).
  | { kind: 'writeSentence'; sentenceId: string; text: string; translation: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcqFor(word: Word, allWords: Word[], direction: Direction): Extract<Exercise, { kind: 'mcq' }> {
  const others = allWords.filter((x) => x.id !== word.id);
  const distractors = shuffle(others).slice(0, 3);
  if (direction === 'en2ko') {
    const answer = word.meaning || word.english;
    const choices = shuffle([answer, ...distractors.map((d) => d.meaning || d.english)]);
    return { kind: 'mcq', wordId: word.id, prompt: word.english, answer, choices, direction };
  }
  const answer = word.english;
  const choices = shuffle([answer, ...distractors.map((d) => d.english)]);
  return { kind: 'mcq', wordId: word.id, prompt: word.meaning || word.english, answer, choices, direction };
}

export function buildSession(
  words: Word[],
  sentences: Sentence[],
  today: string,
  opts: { size?: number; sttSupported?: boolean; quiet?: boolean } = {},
): Exercise[] {
  const size = opts.size ?? 12;
  const quiet = opts.quiet ?? false;
  // 무음 학습이면 말하기 문제를 내지 않는다.
  const stt = (opts.sttSupported ?? false) && !quiet;

  const candidates: SessionCandidate[] = [
    ...words.map((w) => ({ id: w.id, box: w.box, dueDate: w.dueDate, kind: 'word' as const })),
    ...sentences.map((s) => ({ id: s.id, box: s.box, dueDate: s.dueDate, kind: 'sentence' as const })),
  ];
  // 우선순위(복습일·박스)가 같은 항목들 사이의 순서를 섞는다. 섞지 않으면 목록 순서상
  // 단어가 항상 문장보다 앞서서, 단어가 많을 때 문장이 한 번도 출제되지 않는다.
  const chosen = selectSessionItems(shuffle(candidates), today, size);

  const wordById = new Map(words.map((w) => [w.id, w]));
  const sentById = new Map(sentences.map((s) => [s.id, s]));
  const chosenWords = chosen
    .filter((c) => c.kind === 'word')
    .map((c) => wordById.get(c.id))
    .filter((w): w is Word => Boolean(w));

  const exercises: Exercise[] = [];

  if (chosenWords.length >= 4) {
    exercises.push({
      kind: 'matching',
      pairs: chosenWords.slice(0, 4).map((w) => ({ id: w.id, english: w.english, meaning: w.meaning || w.english })),
    });
  }

  chosen.forEach((c, index) => {
    if (c.kind === 'word') {
      const word = wordById.get(c.id);
      if (!word) return;
      if (stt && index % 3 === 0) {
        exercises.push({ kind: 'speakWord', wordId: word.id, english: word.english, meaning: word.meaning || word.english });
      } else {
        const direction: Direction = index % 2 === 0 ? 'en2ko' : 'ko2en';
        exercises.push(mcqFor(word, words, direction));
      }
    } else {
      const sentence = sentById.get(c.id);
      if (!sentence) return;
      if (stt) {
        exercises.push({
          kind: 'repeatSentence',
          sentenceId: sentence.id,
          text: sentence.text,
          translation: sentence.translation,
        });
      } else if (quiet && sentence.translation) {
        // 무음 학습: 번역이 있으면 뜻을 보고 영작(소리 불필요), 없으면 받아쓰기.
        exercises.push({
          kind: 'writeSentence',
          sentenceId: sentence.id,
          text: sentence.text,
          translation: sentence.translation,
        });
      } else {
        exercises.push({ kind: 'dictation', sentenceId: sentence.id, text: sentence.text, translation: sentence.translation });
      }
    }
  });

  return exercises;
}
