# 영어 학습 복습 앱 (1단계) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회사 영어 수업 자료를 넣으면 듀오링고처럼 5종 연습·복습엔진·스트릭/보석/프리즈로 반복 복습하는, 서버 없는 브라우저 웹앱(1단계, AI 키 불필요)을 만든다.

**Architecture:** Vite + React + TypeScript 단일 페이지 앱. 순수 클라이언트 사이드로 IndexedDB에 로컬 저장하며 네트워크 요청이 없다. 도메인 로직(채점·라이트너 복습엔진·스트릭/프리즈·보석·파서)은 순수 함수로 분리해 Vitest로 TDD하고, UI는 그 위에 얹는다. 음성은 브라우저 Web Speech API, 파일 텍스트 추출은 브라우저 내 라이브러리(mammoth/pdf.js/tesseract.js)로 처리한다.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Zustand, React Router, idb(IndexedDB), Vitest + @testing-library/react + jsdom + fake-indexeddb, mammoth, pdfjs-dist, tesseract.js.

## Global Constraints

- 서버·백엔드·외부 네트워크 요청 없음. 모든 데이터는 브라우저 IndexedDB에 저장.
- LLM/AI API 키 불필요(1단계). 음성은 Web Speech API만 사용.
- 주 대상 브라우저는 Chrome/Edge. `SpeechRecognition` 미지원 시 말하기 유형은 쓰기/선택으로 폴백.
- 날짜는 로컬 기준 `'YYYY-MM-DD'` 문자열로 다룬다.
- 연습 방향은 영→한 / 한→영 양방향을 섞는다.
- 스트릭 "하루 완료" 기준 = 학습 세션 1개 완료.
- 라이트너 박스: 1~5, 정답 시 간격(일) = `[0,1,2,4,7]`(box 1~5 도달 시).
- 프리즈 비용 50 보석, 최대 보유 3개.
- 언어: 프로덕트 UI 문구는 한국어.
- 모든 작업은 각 Task 끝에서 커밋한다.

---

## File Structure

```
package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js
index.html
vitest.config.ts, src/test/setup.ts
src/
  main.tsx, App.tsx, index.css
  types.ts                      도메인 타입
  lib/
    id.ts                       id 생성
    dateUtils.ts                todayStr/addDays/daysBetween
    normalize.ts                채점용 텍스트 정규화
    grading.ts                  정답 비교(정확/근사)
    leitner.ts                  박스 갱신 + 세션 항목 선택
    streak.ts                   스트릭 + 프리즈 계산
    gems.ts                     보상 계산 + 상수
    parse.ts                    입력 텍스트 파서
  db/db.ts                      IndexedDB CRUD
  store/useStore.ts             Zustand 스토어(db + 로직 연결)
  speech/tts.ts, speech/stt.ts  Web Speech 래퍼
  files/extract.ts              파일 텍스트 추출
  features/
    session/buildSession.ts     세션 구성
    home/HomePage.tsx
    deck/AddDeckPage.tsx
    session/SessionPage.tsx
    session/ResultScreen.tsx
    shop/ShopPage.tsx
    exercises/MatchingCard.tsx
    exercises/McqCard.tsx
    exercises/SpeakWordCard.tsx
    exercises/RepeatSentenceCard.tsx
    exercises/DictationCard.tsx
  components/StatusBar.tsx, components/ProgressBar.tsx
```

---

## Task 1: 프로젝트 스캐폴드 & 툴링

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `src/test/setup.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 실행 가능한 Vite 앱(`npm run dev`), 동작하는 Vitest 러너(`npm test`), Tailwind 적용.

- [ ] **Step 1: 프로젝트 생성 및 의존성 설치**

Run:
```bash
cd "/Users/eunjin/dev/영어 학습"
npm create vite@latest . -- --template react-ts
npm install
npm install zustand react-router-dom idb mammoth pdfjs-dist tesseract.js
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
npx tailwindcss init -p
```
Note: `npm create vite . ` 가 기존 파일과 충돌하면(예: docs 폴더) 프롬프트에서 "Ignore files and continue" 를 선택한다. 생성 후 `docs/` 는 그대로 유지되어야 한다.

- [ ] **Step 2: Tailwind/PostCSS 설정 작성**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`src/index.css` (기존 내용 대체):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Vitest 설정 작성**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
```

`package.json` 의 `scripts` 에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 최소 App 셸 작성**

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-6 text-2xl font-bold">영어 복습</div>;
}
```

`src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 테스트 및 빌드 검증**

Run: `npm test`
Expected: PASS (smoke 1건)

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite React TS app with Tailwind and Vitest"
```
(이미 git 저장소면 `git init` 생략)

---

## Task 2: 도메인 타입 + 날짜 유틸

**Files:**
- Create: `src/types.ts`, `src/lib/id.ts`, `src/lib/dateUtils.ts`
- Test: `src/lib/dateUtils.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `Direction`, `Deck`, `Word`, `Sentence`, `Profile`
  - `id.ts`: `newId(): string`
  - `dateUtils.ts`: `todayStr(now?: Date): string`, `addDays(dateStr: string, n: number): string`, `daysBetween(a: string, b: string): number` (b−a, 일 단위 정수)

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/dateUtils.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { todayStr, addDays, daysBetween } from './dateUtils';

describe('dateUtils', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 8, 11))).toBe('2026-09-11');
  });
  it('adds days across month boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });
  it('subtracts days', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('computes difference in days', () => {
    expect(daysBetween('2026-09-10', '2026-09-11')).toBe(1);
    expect(daysBetween('2026-09-11', '2026-09-10')).toBe(-1);
    expect(daysBetween('2026-09-11', '2026-09-11')).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/dateUtils.test.ts`
Expected: FAIL ("Cannot find module './dateUtils'")

- [ ] **Step 3: 구현**

`src/lib/dateUtils.ts`:
```ts
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((db - da) / 86400000);
}
```

`src/lib/id.ts`:
```ts
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```

`src/types.ts`:
```ts
export type Direction = 'en2ko' | 'ko2en';

export interface Deck {
  id: string;
  name: string;
  createdAt: number;
}

export interface Word {
  id: string;
  deckId: string;
  english: string;
  meaning: string;
  box: number; // 1..5
  dueDate: string; // 'YYYY-MM-DD'
  seen: number;
  correct: number;
  wrong: number;
}

export interface Sentence {
  id: string;
  deckId: string;
  text: string;
  translation?: string;
  box: number;
  dueDate: string;
  seen: number;
  correct: number;
  wrong: number;
}

export interface Profile {
  streakCount: number;
  lastStudyDate: string | null;
  gems: number;
  freezeCount: number;
  dailyGoalSessions: number;
  history: { date: string; completed: boolean }[];
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/dateUtils.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: 커밋**

```bash
git add src/types.ts src/lib/id.ts src/lib/dateUtils.ts src/lib/dateUtils.test.ts
git commit -m "feat: add domain types, id and date utils"
```

---

## Task 3: 텍스트 정규화 + 채점 로직

**Files:**
- Create: `src/lib/normalize.ts`, `src/lib/grading.ts`
- Test: `src/lib/grading.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `normalize.ts`: `normalize(s: string): string`
  - `grading.ts`: `isCorrectText(input: string, answer: string): boolean`, `similarity(a: string, b: string): number` (0~1), `isCloseEnough(input: string, answer: string, threshold?: number): boolean`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/grading.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isCorrectText, similarity, isCloseEnough } from './grading';

describe('grading', () => {
  it('matches ignoring case, punctuation, extra spaces', () => {
    expect(isCorrectText('  Hello, World! ', 'hello world')).toBe(true);
  });
  it('rejects different words', () => {
    expect(isCorrectText('cat', 'dog')).toBe(false);
  });
  it('similarity is 1 for same tokens', () => {
    expect(similarity('send the agenda', 'Send the agenda.')).toBe(1);
  });
  it('similarity is partial for overlapping tokens', () => {
    expect(similarity('send the agenda now', 'send the agenda')).toBeCloseTo(0.75, 2);
  });
  it('isCloseEnough passes near-miss speech under threshold', () => {
    expect(isCloseEnough('could you send the agenda', 'could you send me the agenda', 0.8)).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/grading.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/normalize.ts`:
```ts
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,!?;:'"“”‘’()\[\]{}\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

`src/lib/grading.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/grading.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/normalize.ts src/lib/grading.ts src/lib/grading.test.ts
git commit -m "feat: add text normalization and answer grading"
```

---

## Task 4: 라이트너 복습 엔진

**Files:**
- Create: `src/lib/leitner.ts`
- Test: `src/lib/leitner.test.ts`

**Interfaces:**
- Consumes: `dateUtils.addDays`, `dateUtils.daysBetween`
- Produces:
  - `INTERVALS: number[]` = `[0,1,2,4,7]`
  - `interface Reviewable { box: number; dueDate: string }`
  - `applyResult<T extends Reviewable>(item: T, correct: boolean, today: string): T`
  - `interface SessionCandidate { id: string; box: number; dueDate: string; kind: 'word' | 'sentence' }`
  - `selectSessionItems(items: SessionCandidate[], today: string, size: number): SessionCandidate[]`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/leitner.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { applyResult, selectSessionItems, type SessionCandidate } from './leitner';

describe('applyResult', () => {
  it('increments box and pushes dueDate on correct', () => {
    const r = applyResult({ box: 1, dueDate: '2026-09-11' }, true, '2026-09-11');
    expect(r.box).toBe(2);
    expect(r.dueDate).toBe('2026-09-12'); // INTERVALS[1] = 1
  });
  it('caps box at 5', () => {
    const r = applyResult({ box: 5, dueDate: '2026-09-11' }, true, '2026-09-11');
    expect(r.box).toBe(5);
    expect(r.dueDate).toBe('2026-09-18'); // INTERVALS[4] = 7
  });
  it('resets to box 1 due today on wrong', () => {
    const r = applyResult({ box: 4, dueDate: '2026-09-20' }, false, '2026-09-11');
    expect(r.box).toBe(1);
    expect(r.dueDate).toBe('2026-09-11');
  });
});

describe('selectSessionItems', () => {
  const items: SessionCandidate[] = [
    { id: 'a', box: 3, dueDate: '2026-09-11', kind: 'word' },     // due, higher box
    { id: 'b', box: 1, dueDate: '2026-09-10', kind: 'word' },     // due, low box, overdue
    { id: 'c', box: 2, dueDate: '2026-09-20', kind: 'sentence' }, // not due
    { id: 'd', box: 1, dueDate: '2026-09-11', kind: 'sentence' }, // due, low box
  ];
  it('prioritizes due items by low box then oldest due', () => {
    const sel = selectSessionItems(items, '2026-09-11', 2);
    expect(sel.map((s) => s.id)).toEqual(['b', 'd']);
  });
  it('fills remaining slots with soonest upcoming when not enough due', () => {
    const sel = selectSessionItems(items, '2026-09-11', 4);
    expect(sel.map((s) => s.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/leitner.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/leitner.ts`:
```ts
import { addDays, daysBetween } from './dateUtils';

export const INTERVALS = [0, 1, 2, 4, 7];

export interface Reviewable {
  box: number;
  dueDate: string;
}

export function applyResult<T extends Reviewable>(item: T, correct: boolean, today: string): T {
  const box = correct ? Math.min(5, item.box + 1) : 1;
  const interval = INTERVALS[box - 1];
  return { ...item, box, dueDate: addDays(today, interval) };
}

export interface SessionCandidate {
  id: string;
  box: number;
  dueDate: string;
  kind: 'word' | 'sentence';
}

export function selectSessionItems(
  items: SessionCandidate[],
  today: string,
  size: number,
): SessionCandidate[] {
  const due = items.filter((i) => daysBetween(i.dueDate, today) >= 0);
  const notDue = items.filter((i) => daysBetween(i.dueDate, today) < 0);
  due.sort((a, b) => a.box - b.box || a.dueDate.localeCompare(b.dueDate));
  const selected = due.slice(0, size);
  if (selected.length < size) {
    notDue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    selected.push(...notDue.slice(0, size - selected.length));
  }
  return selected;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/leitner.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/leitner.ts src/lib/leitner.test.ts
git commit -m "feat: add Leitner review engine (box update + session selection)"
```

---

## Task 5: 스트릭 + 프리즈 로직

**Files:**
- Create: `src/lib/streak.ts`
- Test: `src/lib/streak.test.ts`

**Interfaces:**
- Consumes: `dateUtils.daysBetween`
- Produces:
  - `interface StreakInput { streakCount: number; lastStudyDate: string | null; freezeCount: number }`
  - `interface StreakResult { streakCount: number; freezeCount: number; lastStudyDate: string; changed: boolean }`
  - `applyStudyDay(p: StreakInput, today: string): StreakResult`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/streak.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { applyStudyDay } from './streak';

describe('applyStudyDay', () => {
  it('starts streak at 1 on first study', () => {
    const r = applyStudyDay({ streakCount: 0, lastStudyDate: null, freezeCount: 0 }, '2026-09-11');
    expect(r.streakCount).toBe(1);
    expect(r.changed).toBe(true);
  });
  it('does nothing if already studied today', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-11', freezeCount: 2 }, '2026-09-11');
    expect(r.streakCount).toBe(5);
    expect(r.freezeCount).toBe(2);
    expect(r.changed).toBe(false);
  });
  it('increments on consecutive day', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-10', freezeCount: 0 }, '2026-09-11');
    expect(r.streakCount).toBe(6);
  });
  it('consumes freezes to cover missed days and continues', () => {
    // last studied 09-08, today 09-11 => gap 3 => missed 2 days
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-08', freezeCount: 2 }, '2026-09-11');
    expect(r.streakCount).toBe(6);
    expect(r.freezeCount).toBe(0);
  });
  it('resets to 1 when not enough freezes', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-08', freezeCount: 1 }, '2026-09-11');
    expect(r.streakCount).toBe(1);
    expect(r.freezeCount).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/streak.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/streak.ts`:
```ts
import { daysBetween } from './dateUtils';

export interface StreakInput {
  streakCount: number;
  lastStudyDate: string | null;
  freezeCount: number;
}

export interface StreakResult {
  streakCount: number;
  freezeCount: number;
  lastStudyDate: string;
  changed: boolean;
}

export function applyStudyDay(p: StreakInput, today: string): StreakResult {
  if (p.lastStudyDate === today) {
    return { streakCount: p.streakCount, freezeCount: p.freezeCount, lastStudyDate: today, changed: false };
  }
  if (p.lastStudyDate === null) {
    return { streakCount: 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
  }
  const gap = daysBetween(p.lastStudyDate, today);
  if (gap === 1) {
    return { streakCount: p.streakCount + 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
  }
  const missed = gap - 1;
  if (p.freezeCount >= missed) {
    return {
      streakCount: p.streakCount + 1,
      freezeCount: p.freezeCount - missed,
      lastStudyDate: today,
      changed: true,
    };
  }
  return { streakCount: 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/streak.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/streak.ts src/lib/streak.test.ts
git commit -m "feat: add streak and freeze logic"
```

---

## Task 6: 보석/보상 로직

**Files:**
- Create: `src/lib/gems.ts`
- Test: `src/lib/gems.test.ts`

**Interfaces:**
- Produces:
  - `FREEZE_COST = 50`, `FREEZE_MAX = 3`
  - `sessionReward(correct: number, total: number, streakCount: number): number`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/gems.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sessionReward, FREEZE_COST, FREEZE_MAX } from './gems';

describe('sessionReward', () => {
  it('gives base 10 for a completed session', () => {
    expect(sessionReward(3, 5, 1)).toBe(10);
  });
  it('adds perfect bonus when all correct', () => {
    expect(sessionReward(5, 5, 1)).toBe(15);
  });
  it('adds milestone bonus every 7th streak day', () => {
    expect(sessionReward(3, 5, 7)).toBe(30); // 10 + 20
    expect(sessionReward(5, 5, 14)).toBe(35); // 10 + 5 + 20
  });
});

describe('constants', () => {
  it('exposes freeze cost and max', () => {
    expect(FREEZE_COST).toBe(50);
    expect(FREEZE_MAX).toBe(3);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/gems.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/gems.ts`:
```ts
export const FREEZE_COST = 50;
export const FREEZE_MAX = 3;

export function sessionReward(correct: number, total: number, streakCount: number): number {
  let gems = 10;
  if (total > 0 && correct === total) gems += 5;
  if (streakCount > 0 && streakCount % 7 === 0) gems += 20;
  return gems;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/gems.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/gems.ts src/lib/gems.test.ts
git commit -m "feat: add gem reward calculation and shop constants"
```

---

## Task 7: 입력 텍스트 파서

**Files:**
- Create: `src/lib/parse.ts`
- Test: `src/lib/parse.test.ts`

**Interfaces:**
- Produces:
  - `interface ParsedWord { english: string; meaning: string }`
  - `interface ParsedSentence { text: string; translation?: string }`
  - `interface ParsedItems { words: ParsedWord[]; sentences: ParsedSentence[] }`
  - `parseWords(text: string): ParsedWord[]` — 한 줄에 `english = meaning`
  - `parseSentences(text: string): ParsedSentence[]` — 한 줄에 문장, 선택적 `english | 번역`
  - `parseInput(wordsText: string, sentencesText: string): ParsedItems`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/parse.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseWords, parseSentences, parseInput } from './parse';

describe('parseWords', () => {
  it('splits english and meaning by =', () => {
    expect(parseWords('schedule = 일정\nagenda = 안건')).toEqual([
      { english: 'schedule', meaning: '일정' },
      { english: 'agenda', meaning: '안건' },
    ]);
  });
  it('keeps english with empty meaning if no =', () => {
    expect(parseWords('meeting')).toEqual([{ english: 'meeting', meaning: '' }]);
  });
  it('ignores blank lines', () => {
    expect(parseWords('schedule = 일정\n\n  \n')).toEqual([{ english: 'schedule', meaning: '일정' }]);
  });
});

describe('parseSentences', () => {
  it('reads plain sentence lines', () => {
    expect(parseSentences('Could you send me the agenda?')).toEqual([
      { text: 'Could you send me the agenda?' },
    ]);
  });
  it('splits translation by |', () => {
    expect(parseSentences('See you tomorrow. | 내일 봐요.')).toEqual([
      { text: 'See you tomorrow.', translation: '내일 봐요.' },
    ]);
  });
});

describe('parseInput', () => {
  it('combines words and sentences', () => {
    const r = parseInput('agenda = 안건', 'Hello.');
    expect(r.words).toHaveLength(1);
    expect(r.sentences).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/parse.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/parse.ts`:
```ts
export interface ParsedWord {
  english: string;
  meaning: string;
}
export interface ParsedSentence {
  text: string;
  translation?: string;
}
export interface ParsedItems {
  words: ParsedWord[];
  sentences: ParsedSentence[];
}

export function parseWords(text: string): ParsedWord[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('=');
      if (idx === -1) return { english: line, meaning: '' };
      return { english: line.slice(0, idx).trim(), meaning: line.slice(idx + 1).trim() };
    })
    .filter((w) => w.english);
}

export function parseSentences(text: string): ParsedSentence[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('|');
      if (idx === -1) return { text: line };
      const translation = line.slice(idx + 1).trim();
      return { text: line.slice(0, idx).trim(), translation: translation || undefined };
    })
    .filter((s) => s.text);
}

export function parseInput(wordsText: string, sentencesText: string): ParsedItems {
  return { words: parseWords(wordsText), sentences: parseSentences(sentencesText) };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/parse.test.ts`
Expected: PASS (6건)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/parse.ts src/lib/parse.test.ts
git commit -m "feat: add input text parser for words and sentences"
```

---

## Task 8: IndexedDB 저장 계층

**Files:**
- Create: `src/db/db.ts`
- Test: `src/db/db.test.ts`

**Interfaces:**
- Consumes: `types.*`, `id.newId`, `dateUtils.todayStr`
- Produces (모두 async):
  - `getDB()`
  - `addDeck(name: string): Promise<Deck>`
  - `listDecks(): Promise<Deck[]>`
  - `addWords(deckId: string, items: { english: string; meaning: string }[]): Promise<Word[]>`
  - `addSentences(deckId: string, items: { text: string; translation?: string }[]): Promise<Sentence[]>`
  - `listWords(deckId?: string): Promise<Word[]>`
  - `listSentences(deckId?: string): Promise<Sentence[]>`
  - `updateWord(w: Word): Promise<void>`
  - `updateSentence(s: Sentence): Promise<void>`
  - `getProfile(): Promise<Profile>`
  - `saveProfile(p: Profile): Promise<void>`

- [ ] **Step 1: 실패 테스트 작성**

`src/db/db.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import {
  addDeck, listDecks, addWords, listWords, updateWord,
  addSentences, listSentences, getProfile, saveProfile,
} from './db';

beforeEach(async () => {
  await deleteDB('english-review');
});

describe('db', () => {
  it('adds and lists decks', async () => {
    const d = await addDeck('Chapter 3');
    expect(d.name).toBe('Chapter 3');
    const decks = await listDecks();
    expect(decks).toHaveLength(1);
  });

  it('adds words with default review fields and lists by deck', async () => {
    const d = await addDeck('D');
    const words = await addWords(d.id, [{ english: 'agenda', meaning: '안건' }]);
    expect(words[0].box).toBe(1);
    expect(words[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const listed = await listWords(d.id);
    expect(listed).toHaveLength(1);
  });

  it('updates a word', async () => {
    const d = await addDeck('D');
    const [w] = await addWords(d.id, [{ english: 'agenda', meaning: '안건' }]);
    await updateWord({ ...w, box: 3, correct: 2 });
    const [updated] = await listWords(d.id);
    expect(updated.box).toBe(3);
    expect(updated.correct).toBe(2);
  });

  it('adds and lists sentences', async () => {
    const d = await addDeck('D');
    await addSentences(d.id, [{ text: 'Hello.', translation: '안녕.' }]);
    const listed = await listSentences(d.id);
    expect(listed[0].text).toBe('Hello.');
  });

  it('returns default profile then persists changes', async () => {
    const p = await getProfile();
    expect(p.gems).toBe(0);
    expect(p.streakCount).toBe(0);
    await saveProfile({ ...p, gems: 40, streakCount: 3 });
    const p2 = await getProfile();
    expect(p2.gems).toBe(40);
    expect(p2.streakCount).toBe(3);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/db/db.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/db/db.ts`:
```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Deck, Word, Sentence, Profile } from '../types';
import { newId } from '../lib/id';
import { todayStr } from '../lib/dateUtils';

interface AppDB extends DBSchema {
  decks: { key: string; value: Deck };
  words: { key: string; value: Word; indexes: { byDeck: string } };
  sentences: { key: string; value: Sentence; indexes: { byDeck: string } };
  profile: { key: string; value: Profile };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('english-review', 1, {
      upgrade(db) {
        db.createObjectStore('decks', { keyPath: 'id' });
        const w = db.createObjectStore('words', { keyPath: 'id' });
        w.createIndex('byDeck', 'deckId');
        const s = db.createObjectStore('sentences', { keyPath: 'id' });
        s.createIndex('byDeck', 'deckId');
        db.createObjectStore('profile');
      },
    });
  }
  return dbPromise;
}

const DEFAULT_PROFILE: Profile = {
  streakCount: 0,
  lastStudyDate: null,
  gems: 0,
  freezeCount: 0,
  dailyGoalSessions: 1,
  history: [],
};

export async function addDeck(name: string): Promise<Deck> {
  const db = await getDB();
  const deck: Deck = { id: newId(), name, createdAt: Date.now() };
  await db.put('decks', deck);
  return deck;
}

export async function listDecks(): Promise<Deck[]> {
  return (await getDB()).getAll('decks');
}

export async function addWords(
  deckId: string,
  items: { english: string; meaning: string }[],
): Promise<Word[]> {
  const db = await getDB();
  const today = todayStr();
  const words: Word[] = items.map((it) => ({
    id: newId(), deckId, english: it.english, meaning: it.meaning,
    box: 1, dueDate: today, seen: 0, correct: 0, wrong: 0,
  }));
  const tx = db.transaction('words', 'readwrite');
  await Promise.all(words.map((w) => tx.store.put(w)));
  await tx.done;
  return words;
}

export async function addSentences(
  deckId: string,
  items: { text: string; translation?: string }[],
): Promise<Sentence[]> {
  const db = await getDB();
  const today = todayStr();
  const sentences: Sentence[] = items.map((it) => ({
    id: newId(), deckId, text: it.text, translation: it.translation,
    box: 1, dueDate: today, seen: 0, correct: 0, wrong: 0,
  }));
  const tx = db.transaction('sentences', 'readwrite');
  await Promise.all(sentences.map((s) => tx.store.put(s)));
  await tx.done;
  return sentences;
}

export async function listWords(deckId?: string): Promise<Word[]> {
  const db = await getDB();
  return deckId ? db.getAllFromIndex('words', 'byDeck', deckId) : db.getAll('words');
}

export async function listSentences(deckId?: string): Promise<Sentence[]> {
  const db = await getDB();
  return deckId ? db.getAllFromIndex('sentences', 'byDeck', deckId) : db.getAll('sentences');
}

export async function updateWord(w: Word): Promise<void> {
  await (await getDB()).put('words', w);
}

export async function updateSentence(s: Sentence): Promise<void> {
  await (await getDB()).put('sentences', s);
}

export async function getProfile(): Promise<Profile> {
  const db = await getDB();
  return (await db.get('profile', 'me')) ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(p: Profile): Promise<void> {
  await (await getDB()).put('profile', p, 'me');
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/db/db.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: 커밋**

```bash
git add src/db/db.ts src/db/db.test.ts
git commit -m "feat: add IndexedDB storage layer for decks, items, profile"
```

---

## Task 9: Zustand 스토어 (DB + 로직 연결)

**Files:**
- Create: `src/store/useStore.ts`
- Test: `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: `db.*`, `leitner.applyResult`, `streak.applyStudyDay`, `gems.sessionReward/FREEZE_COST/FREEZE_MAX`, `dateUtils.todayStr`, `types.*`
- Produces: `useStore` (Zustand). State:
  - `loaded: boolean`, `decks: Deck[]`, `words: Word[]`, `sentences: Sentence[]`, `profile: Profile`
  - Actions:
    - `load(): Promise<void>`
    - `createDeck(name: string, words: ParsedWord[], sentences: ParsedSentence[]): Promise<void>`
    - `recordWord(id: string, correct: boolean): Promise<void>`
    - `recordSentence(id: string, correct: boolean): Promise<void>`
    - `completeSession(correct: number, total: number): Promise<{ gained: number }>`
    - `buyFreeze(): Promise<boolean>`

- [ ] **Step 1: 실패 테스트 작성**

`src/store/useStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import { useStore } from './useStore';

beforeEach(async () => {
  await deleteDB('english-review');
  useStore.setState({
    loaded: false, decks: [], words: [], sentences: [],
    profile: { streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [] },
  });
});

describe('useStore', () => {
  it('creates a deck with words and sentences', async () => {
    await useStore.getState().createDeck('D', [{ english: 'agenda', meaning: '안건' }], [{ text: 'Hi.' }]);
    const s = useStore.getState();
    expect(s.decks).toHaveLength(1);
    expect(s.words).toHaveLength(1);
    expect(s.sentences).toHaveLength(1);
  });

  it('records a correct word answer and advances its box', async () => {
    await useStore.getState().createDeck('D', [{ english: 'agenda', meaning: '안건' }], []);
    const id = useStore.getState().words[0].id;
    await useStore.getState().recordWord(id, true);
    const w = useStore.getState().words.find((x) => x.id === id)!;
    expect(w.box).toBe(2);
    expect(w.correct).toBe(1);
    expect(w.seen).toBe(1);
  });

  it('completeSession awards gems and updates streak', async () => {
    const { gained } = await useStore.getState().completeSession(5, 5);
    const p = useStore.getState().profile;
    expect(gained).toBe(15); // perfect
    expect(p.gems).toBe(15);
    expect(p.streakCount).toBe(1);
  });

  it('buyFreeze spends gems when affordable', async () => {
    useStore.setState((s) => ({ profile: { ...s.profile, gems: 60 } }));
    const ok = await useStore.getState().buyFreeze();
    expect(ok).toBe(true);
    const p = useStore.getState().profile;
    expect(p.gems).toBe(10);
    expect(p.freezeCount).toBe(1);
  });

  it('buyFreeze fails when too few gems', async () => {
    useStore.setState((s) => ({ profile: { ...s.profile, gems: 10 } }));
    const ok = await useStore.getState().buyFreeze();
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/store/useStore.ts`:
```ts
import { create } from 'zustand';
import type { Deck, Word, Sentence, Profile } from '../types';
import type { ParsedWord, ParsedSentence } from '../lib/parse';
import * as db from '../db/db';
import { applyResult } from '../lib/leitner';
import { applyStudyDay } from '../lib/streak';
import { sessionReward, FREEZE_COST, FREEZE_MAX } from '../lib/gems';
import { todayStr } from '../lib/dateUtils';

interface State {
  loaded: boolean;
  decks: Deck[];
  words: Word[];
  sentences: Sentence[];
  profile: Profile;
  load: () => Promise<void>;
  createDeck: (name: string, words: ParsedWord[], sentences: ParsedSentence[]) => Promise<void>;
  recordWord: (id: string, correct: boolean) => Promise<void>;
  recordSentence: (id: string, correct: boolean) => Promise<void>;
  completeSession: (correct: number, total: number) => Promise<{ gained: number }>;
  buyFreeze: () => Promise<boolean>;
}

const EMPTY_PROFILE: Profile = {
  streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [],
};

export const useStore = create<State>((set, get) => ({
  loaded: false,
  decks: [],
  words: [],
  sentences: [],
  profile: EMPTY_PROFILE,

  async load() {
    const [decks, words, sentences, profile] = await Promise.all([
      db.listDecks(), db.listWords(), db.listSentences(), db.getProfile(),
    ]);
    set({ decks, words, sentences, profile, loaded: true });
  },

  async createDeck(name, words, sentences) {
    const deck = await db.addDeck(name);
    const newWords = await db.addWords(deck.id, words);
    const newSentences = await db.addSentences(deck.id, sentences);
    set((s) => ({
      decks: [...s.decks, deck],
      words: [...s.words, ...newWords],
      sentences: [...s.sentences, ...newSentences],
    }));
  },

  async recordWord(id, correct) {
    const today = todayStr();
    const word = get().words.find((w) => w.id === id);
    if (!word) return;
    const advanced = applyResult(word, correct, today);
    const updated: Word = {
      ...advanced,
      seen: word.seen + 1,
      correct: word.correct + (correct ? 1 : 0),
      wrong: word.wrong + (correct ? 0 : 1),
    };
    await db.updateWord(updated);
    set((s) => ({ words: s.words.map((w) => (w.id === id ? updated : w)) }));
  },

  async recordSentence(id, correct) {
    const today = todayStr();
    const sentence = get().sentences.find((x) => x.id === id);
    if (!sentence) return;
    const advanced = applyResult(sentence, correct, today);
    const updated: Sentence = {
      ...advanced,
      seen: sentence.seen + 1,
      correct: sentence.correct + (correct ? 1 : 0),
      wrong: sentence.wrong + (correct ? 0 : 1),
    };
    await db.updateSentence(updated);
    set((s) => ({ sentences: s.sentences.map((x) => (x.id === id ? updated : x)) }));
  },

  async completeSession(correct, total) {
    const today = todayStr();
    const p = get().profile;
    const streak = applyStudyDay(
      { streakCount: p.streakCount, lastStudyDate: p.lastStudyDate, freezeCount: p.freezeCount },
      today,
    );
    const gained = sessionReward(correct, total, streak.streakCount);
    const history = p.history.some((h) => h.date === today)
      ? p.history
      : [...p.history, { date: today, completed: true }];
    const profile: Profile = {
      ...p,
      streakCount: streak.streakCount,
      freezeCount: streak.freezeCount,
      lastStudyDate: streak.lastStudyDate,
      gems: p.gems + gained,
      history,
    };
    await db.saveProfile(profile);
    set({ profile });
    return { gained };
  },

  async buyFreeze() {
    const p = get().profile;
    if (p.gems < FREEZE_COST || p.freezeCount >= FREEZE_MAX) return false;
    const profile: Profile = { ...p, gems: p.gems - FREEZE_COST, freezeCount: p.freezeCount + 1 };
    await db.saveProfile(profile);
    set({ profile });
    return true;
  },
}));
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: 커밋**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat: add Zustand store wiring db and domain logic"
```

---

## Task 10: 음성 래퍼 (TTS/STT) + 지원 감지

**Files:**
- Create: `src/speech/tts.ts`, `src/speech/stt.ts`
- Test: `src/speech/support.test.ts`

**Interfaces:**
- Produces:
  - `tts.ts`: `ttsSupported(): boolean`, `speak(text: string, lang?: string): Promise<void>`
  - `stt.ts`: `sttSupported(): boolean`, `listen(lang?: string): Promise<string>`

Note: 실제 음성 재생/인식은 브라우저 통합 검증(Task 18 이후 수동)으로 확인한다. 여기서는 지원 감지 함수만 단위 테스트한다.

- [ ] **Step 1: 실패 테스트 작성**

`src/speech/support.test.ts`:
```ts
import { describe, it, expect, afterEach } from 'vitest';
import { ttsSupported } from './tts';
import { sttSupported } from './stt';

afterEach(() => {
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).speechSynthesis;
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).SpeechRecognition;
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).webkitSpeechRecognition;
});

describe('speech support detection', () => {
  it('detects TTS when speechSynthesis exists', () => {
    (globalThis as any).speechSynthesis = {};
    expect(ttsSupported()).toBe(true);
  });
  it('reports no TTS when absent', () => {
    expect(ttsSupported()).toBe(false);
  });
  it('detects STT via webkitSpeechRecognition', () => {
    (globalThis as any).webkitSpeechRecognition = function () {};
    expect(sttSupported()).toBe(true);
  });
  it('reports no STT when absent', () => {
    expect(sttSupported()).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/speech/support.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/speech/tts.ts`:
```ts
export function ttsSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'speechSynthesis' in globalThis;
}

export function speak(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) {
      resolve();
      return;
    }
    const synth = (globalThis as any).speechSynthesis as SpeechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}
```

`src/speech/stt.ts`:
```ts
function getRecognitionCtor(): any {
  const g = globalThis as any;
  return g.SpeechRecognition || g.webkitSpeechRecognition || null;
}

export function sttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function listen(lang = 'en-US'): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error('SpeechRecognition not supported'));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let settled = false;
    recognition.onresult = (event: any) => {
      settled = true;
      resolve(event.results[0][0].transcript as string);
    };
    recognition.onerror = (event: any) => {
      if (!settled) reject(new Error(event.error || 'recognition error'));
    };
    recognition.onend = () => {
      if (!settled) resolve('');
    };
    recognition.start();
  });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/speech/support.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: 커밋**

```bash
git add src/speech/tts.ts src/speech/stt.ts src/speech/support.test.ts
git commit -m "feat: add Web Speech TTS/STT wrappers with support detection"
```

---

## Task 11: 파일 텍스트 추출

**Files:**
- Create: `src/files/extract.ts`
- Test: `src/files/extract.test.ts`

**Interfaces:**
- Produces: `extractText(file: File): Promise<string>` — 확장자/타입에 따라 txt/docx/pdf/image 처리. 미지원 형식은 `throw new Error('지원하지 않는 파일 형식')`.

Note: docx/pdf/image 경로는 바이너리 라이브러리에 의존하므로 자동 테스트는 txt 경로만 검증하고, 나머지는 Task 14 수동 검증에서 확인한다.

- [ ] **Step 1: 실패 테스트 작성**

`src/files/extract.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { extractText } from './extract';

describe('extractText', () => {
  it('reads plain text files', async () => {
    const file = new File(['schedule = 일정'], 'notes.txt', { type: 'text/plain' });
    expect(await extractText(file)).toBe('schedule = 일정');
  });
  it('throws on unsupported types', async () => {
    const file = new File(['x'], 'a.xyz', { type: 'application/octet-stream' });
    await expect(extractText(file)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/files/extract.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/files/extract.ts`:
```ts
function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Vite: worker as URL
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl;
  const data = await file.arrayBuffer();
  const pdf = await (pdfjs as any).getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return text.trim();
}

async function extractImage(file: File): Promise<string> {
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(file, 'eng+kor');
  return data.text;
}

export async function extractText(file: File): Promise<string> {
  const e = ext(file.name);
  if (e === 'txt' || file.type === 'text/plain') return (await file.text()).trim();
  if (e === 'docx') return extractDocx(file);
  if (e === 'pdf') return extractPdf(file);
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(e) || file.type.startsWith('image/')) {
    return extractImage(file);
  }
  throw new Error('지원하지 않는 파일 형식');
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/files/extract.test.ts`
Expected: PASS (2건)

- [ ] **Step 5: 커밋**

```bash
git add src/files/extract.ts src/files/extract.test.ts
git commit -m "feat: add file text extraction (txt/docx/pdf/image)"
```

---

## Task 12: 앱 셸 + 라우팅 + StatusBar + HomePage

**Files:**
- Create: `src/components/StatusBar.tsx`, `src/features/home/HomePage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/features/home/HomePage.test.tsx`

**Interfaces:**
- Consumes: `useStore`
- Produces: 라우트 `/`(Home), `/add`(AddDeck), `/session`(Session), `/shop`(Shop). Home은 스트릭/보석/프리즈, 덱 목록, 시작/복습/추가/상점 네비게이션을 렌더한다.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/home/HomePage.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import HomePage from './HomePage';

beforeEach(() => {
  useStore.setState({
    loaded: true, decks: [{ id: 'd1', name: 'Chapter 3', createdAt: 0 }],
    words: [{ id: 'w1', deckId: 'd1', english: 'a', meaning: 'ㄱ', box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 }],
    sentences: [],
    profile: { streakCount: 12, lastStudyDate: '2026-09-10', gems: 340, freezeCount: 2, dailyGoalSessions: 1, history: [] },
  });
});

describe('HomePage', () => {
  it('shows streak, gems, freeze and deck name', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/home/HomePage.test.tsx`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/components/StatusBar.tsx`:
```tsx
import { useStore } from '../store/useStore';

export default function StatusBar() {
  const { streakCount, gems, freezeCount } = useStore((s) => s.profile);
  return (
    <div className="flex gap-4 justify-center py-3 text-lg font-bold">
      <span title="연속 학습">🔥 {streakCount}</span>
      <span title="보석">💎 {gems}</span>
      <span title="프리즈">🧊 {freezeCount}</span>
    </div>
  );
}
```

`src/features/home/HomePage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import StatusBar from '../../components/StatusBar';

export default function HomePage() {
  const decks = useStore((s) => s.decks);
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);

  const countFor = (deckId: string) => ({
    w: words.filter((w) => w.deckId === deckId).length,
    s: sentences.filter((s) => s.deckId === deckId).length,
  });

  return (
    <div className="max-w-md mx-auto p-4">
      <StatusBar />
      <div className="rounded-2xl bg-green-50 p-6 text-center mb-4">
        <p className="text-gray-600 mb-3">오늘의 학습</p>
        <Link to="/session" className="inline-block rounded-full bg-green-500 text-white px-6 py-3 font-bold">
          오늘의 학습 시작 ▶
        </Link>
      </div>
      <Link to="/session?mode=review" className="block text-center text-blue-600 mb-6">
        🔁 복습하기
      </Link>

      <h2 className="font-bold mb-2">내 자료</h2>
      <ul className="space-y-2 mb-4">
        {decks.length === 0 && <li className="text-gray-400">아직 자료가 없어요.</li>}
        {decks.map((d) => {
          const c = countFor(d.id);
          return (
            <li key={d.id} className="rounded-xl border p-3 flex justify-between">
              <span>{d.name}</span>
              <span className="text-gray-500 text-sm">단어 {c.w} · 문장 {c.s}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <Link to="/add" className="flex-1 text-center rounded-xl border py-2">+ 자료 추가</Link>
        <Link to="/shop" className="flex-1 text-center rounded-xl border py-2">🛒 상점</Link>
      </div>
    </div>
  );
}
```

`src/App.tsx`:
```tsx
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import HomePage from './features/home/HomePage';
import AddDeckPage from './features/deck/AddDeckPage';
import SessionPage from './features/session/SessionPage';
import ShopPage from './features/shop/ShopPage';

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  useEffect(() => { load(); }, [load]);
  if (!loaded) return <div className="p-6 text-center text-gray-400">불러오는 중…</div>;
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add" element={<AddDeckPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/shop" element={<ShopPage />} />
    </Routes>
  );
}
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

Note: 이 시점에 `AddDeckPage`, `SessionPage`, `ShopPage` 는 아직 없다. 컴파일을 위해 각 파일에 임시 스텁을 만든다(다음 Task들에서 대체):
```tsx
// src/features/deck/AddDeckPage.tsx
export default function AddDeckPage() { return <div className="p-4">준비 중</div>; }
// src/features/session/SessionPage.tsx
export default function SessionPage() { return <div className="p-4">준비 중</div>; }
// src/features/shop/ShopPage.tsx
export default function ShopPage() { return <div className="p-4">준비 중</div>; }
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/home/HomePage.test.tsx`
Expected: PASS (1건)

Run: `npm run build`
Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx src/main.tsx src/components/StatusBar.tsx src/features
git commit -m "feat: add app shell, routing, status bar and home page"
```

---

## Task 13: 자료 추가 — 타이핑 입력 + 미리보기 + 저장

**Files:**
- Modify: `src/features/deck/AddDeckPage.tsx`
- Test: `src/features/deck/AddDeckPage.test.tsx`

**Interfaces:**
- Consumes: `useStore.createDeck`, `parse.parseWords/parseSentences`
- Produces: 덱 이름 + 단어 textarea(`english = meaning`) + 문장 textarea 입력, 미리보기 개수 표시, 저장 시 스토어에 반영 후 홈으로 이동.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/deck/AddDeckPage.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import AddDeckPage from './AddDeckPage';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

beforeEach(() => {
  navigateMock.mockReset();
  useStore.setState({ decks: [], words: [], sentences: [] });
  vi.spyOn(useStore.getState(), 'createDeck').mockResolvedValue();
});

describe('AddDeckPage', () => {
  it('parses input and calls createDeck then navigates home', async () => {
    const user = userEvent.setup();
    const createDeck = vi.spyOn(useStore.getState(), 'createDeck').mockResolvedValue();
    render(<MemoryRouter><AddDeckPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('자료 이름'), 'Chapter 3');
    await user.type(screen.getByLabelText('단어 (영단어 = 뜻)'), 'agenda = 안건');
    await user.type(screen.getByLabelText('문장'), 'Hello.');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(createDeck).toHaveBeenCalledWith(
      'Chapter 3',
      [{ english: 'agenda', meaning: '안건' }],
      [{ text: 'Hello.' }],
    );
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/deck/AddDeckPage.test.tsx`
Expected: FAIL (스텁이라 입력/버튼 없음)

- [ ] **Step 3: 구현**

`src/features/deck/AddDeckPage.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { parseWords, parseSentences } from '../../lib/parse';

export default function AddDeckPage() {
  const navigate = useNavigate();
  const createDeck = useStore((s) => s.createDeck);
  const [name, setName] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [sentencesText, setSentencesText] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedWords = useMemo(() => parseWords(wordsText), [wordsText]);
  const parsedSentences = useMemo(() => parseSentences(sentencesText), [sentencesText]);
  const canSave = name.trim().length > 0 && (parsedWords.length + parsedSentences.length) > 0;

  async function onSave() {
    setSaving(true);
    await createDeck(name.trim(), parsedWords, parsedSentences);
    navigate('/');
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">자료 추가</h1>

      <label className="block">
        <span className="text-sm text-gray-600">자료 이름</span>
        <input
          aria-label="자료 이름"
          className="mt-1 w-full rounded-lg border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: Chapter 3 회의"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">단어 (영단어 = 뜻)</span>
        <textarea
          aria-label="단어 (영단어 = 뜻)"
          className="mt-1 w-full rounded-lg border p-2 h-32 font-mono text-sm"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          placeholder={'schedule = 일정\nagenda = 안건'}
        />
        <span className="text-xs text-gray-400">단어 {parsedWords.length}개 인식됨</span>
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">문장</span>
        <textarea
          aria-label="문장"
          className="mt-1 w-full rounded-lg border p-2 h-32 text-sm"
          value={sentencesText}
          onChange={(e) => setSentencesText(e.target.value)}
          placeholder={'Could you send me the agenda?\nSee you tomorrow. | 내일 봐요.'}
        />
        <span className="text-xs text-gray-400">문장 {parsedSentences.length}개 인식됨</span>
      </label>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl bg-green-500 text-white py-2 font-bold disabled:bg-gray-300"
          disabled={!canSave || saving}
          onClick={onSave}
        >
          저장
        </button>
        <button className="flex-1 rounded-xl border py-2" onClick={() => navigate('/')}>
          취소
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/deck/AddDeckPage.test.tsx`
Expected: PASS (1건)

- [ ] **Step 5: 커밋**

```bash
git add src/features/deck/AddDeckPage.tsx src/features/deck/AddDeckPage.test.tsx
git commit -m "feat: add deck creation via typed input with preview"
```

---

## Task 14: 자료 추가 — 파일 업로드 탭

**Files:**
- Modify: `src/features/deck/AddDeckPage.tsx`
- Test: (수동 검증)

**Interfaces:**
- Consumes: `files/extract.extractText`
- Produces: 파일 선택 → 추출된 텍스트를 단어/문장 textarea 중 사용자가 고른 곳에 채움. 추출 실패 시 오류 메시지 표시.

- [ ] **Step 1: 파일 업로드 UI 추가**

`AddDeckPage.tsx` 의 단어 textarea 위에 파일 입력 블록을 추가한다. 상단 import에 추가:
```tsx
import { extractText } from '../../files/extract';
```
컴포넌트 상태에 추가:
```tsx
const [target, setTarget] = useState<'words' | 'sentences'>('words');
const [fileError, setFileError] = useState('');
const [extracting, setExtracting] = useState(false);

async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setFileError('');
  setExtracting(true);
  try {
    const text = await extractText(file);
    if (target === 'words') setWordsText((prev) => (prev ? prev + '\n' : '') + text);
    else setSentencesText((prev) => (prev ? prev + '\n' : '') + text);
  } catch (err) {
    setFileError(err instanceof Error ? err.message : '추출 실패');
  } finally {
    setExtracting(false);
    e.target.value = '';
  }
}
```
`<h1>자료 추가</h1>` 아래에 UI 삽입:
```tsx
<div className="rounded-lg border p-3 space-y-2 bg-gray-50">
  <p className="text-sm font-medium">파일에서 텍스트 가져오기</p>
  <div className="flex gap-3 text-sm">
    <label className="flex items-center gap-1">
      <input type="radio" name="target" checked={target === 'words'} onChange={() => setTarget('words')} />
      단어칸으로
    </label>
    <label className="flex items-center gap-1">
      <input type="radio" name="target" checked={target === 'sentences'} onChange={() => setTarget('sentences')} />
      문장칸으로
    </label>
  </div>
  <input type="file" accept=".txt,.docx,.pdf,image/*" onChange={onFile} disabled={extracting} />
  {extracting && <p className="text-xs text-gray-500">추출 중… (이미지·PDF는 시간이 걸릴 수 있어요)</p>}
  {fileError && <p className="text-xs text-red-500">{fileError}</p>}
  <p className="text-xs text-gray-400">추출한 뒤 아래에서 형식(영단어 = 뜻)에 맞게 정리하세요.</p>
</div>
```

- [ ] **Step 2: 기존 테스트 회귀 확인**

Run: `npx vitest run src/features/deck/AddDeckPage.test.tsx`
Expected: PASS (기존 1건 유지)

- [ ] **Step 3: 수동 검증**

Run: `npm run dev`
브라우저(Chrome)에서 `/add` 로 이동 → `.txt` 파일 업로드 → 텍스트가 선택한 칸에 채워지는지 확인 → `.docx`/이미지도 확인.
Expected: 각 형식에서 텍스트가 채워짐. 이미지·PDF는 지연 후 채워짐.

- [ ] **Step 4: 커밋**

```bash
git add src/features/deck/AddDeckPage.tsx
git commit -m "feat: add file upload tab to deck creation"
```

---

## Task 15: 세션 구성기 (buildSession)

**Files:**
- Create: `src/features/session/buildSession.ts`
- Test: `src/features/session/buildSession.test.ts`

**Interfaces:**
- Consumes: `leitner.selectSessionItems`, `types.Word/Sentence`
- Produces:
  - `type ExerciseKind = 'matching' | 'mcq' | 'speakWord' | 'repeatSentence' | 'dictation'`
  - `interface Exercise` (판별 유니온):
    - `{ kind: 'matching'; pairs: { id: string; english: string; meaning: string }[] }`
    - `{ kind: 'mcq'; wordId: string; prompt: string; answer: string; choices: string[]; direction: Direction }`
    - `{ kind: 'speakWord'; wordId: string; english: string; meaning: string }`
    - `{ kind: 'repeatSentence'; sentenceId: string; text: string }`
    - `{ kind: 'dictation'; sentenceId: string; text: string; translation?: string }`
  - `buildSession(words: Word[], sentences: Sentence[], today: string, opts?: { size?: number; sttSupported?: boolean }): Exercise[]`

동작 규칙:
- `selectSessionItems` 로 단어+문장 후보에서 우선순위대로 최대 `size`(기본 12)개 선택.
- 단어 항목 → `mcq`(방향 랜덤 대신 결정적으로 index 짝수=en2ko, 홀수=ko2en) 또는 `speakWord`(sttSupported일 때만, 3의 배수 index) 로 변환.
- 문장 항목 → `repeatSentence`(sttSupported일 때) 또는 `dictation`.
- 선택된 단어가 4개 이상이면 세션 맨 앞에 `matching` 카드 1개(단어 4개 묶음) 추가.
- mcq 선택지: 정답 + 다른 단어 3개(부족하면 있는 만큼)에서 뜻/영단어 추출.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/session/buildSession.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildSession } from './buildSession';
import type { Word, Sentence } from '../../types';

function w(id: string, english: string, meaning: string): Word {
  return { id, deckId: 'd', english, meaning, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}
function s(id: string, text: string): Sentence {
  return { id, deckId: 'd', text, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}

describe('buildSession', () => {
  const words = [w('1', 'agenda', '안건'), w('2', 'schedule', '일정'), w('3', 'meeting', '회의'), w('4', 'client', '고객')];
  const sentences = [s('s1', 'Could you send me the agenda?')];

  it('returns exercises with a leading matching card when >=4 words', () => {
    const ex = buildSession(words, sentences, '2026-09-11', { sttSupported: false });
    expect(ex[0].kind).toBe('matching');
    expect(ex.length).toBeGreaterThan(1);
  });

  it('uses dictation (not repeatSentence) when STT unsupported', () => {
    const ex = buildSession(words, sentences, '2026-09-11', { sttSupported: false });
    expect(ex.some((e) => e.kind === 'repeatSentence')).toBe(false);
    expect(ex.some((e) => e.kind === 'dictation')).toBe(true);
  });

  it('mcq choices include the correct answer', () => {
    const ex = buildSession(words, [], '2026-09-11', { sttSupported: false });
    const mcq = ex.find((e) => e.kind === 'mcq');
    expect(mcq).toBeTruthy();
    if (mcq && mcq.kind === 'mcq') {
      expect(mcq.choices).toContain(mcq.answer);
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/session/buildSession.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/features/session/buildSession.ts`:
```ts
import type { Word, Sentence, Direction } from '../../types';
import { selectSessionItems, type SessionCandidate } from '../../lib/leitner';

export type ExerciseKind = 'matching' | 'mcq' | 'speakWord' | 'repeatSentence' | 'dictation';

export type Exercise =
  | { kind: 'matching'; pairs: { id: string; english: string; meaning: string }[] }
  | { kind: 'mcq'; wordId: string; prompt: string; answer: string; choices: string[]; direction: Direction }
  | { kind: 'speakWord'; wordId: string; english: string; meaning: string }
  | { kind: 'repeatSentence'; sentenceId: string; text: string }
  | { kind: 'dictation'; sentenceId: string; text: string; translation?: string };

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
  opts: { size?: number; sttSupported?: boolean } = {},
): Exercise[] {
  const size = opts.size ?? 12;
  const stt = opts.sttSupported ?? false;

  const candidates: SessionCandidate[] = [
    ...words.map((w) => ({ id: w.id, box: w.box, dueDate: w.dueDate, kind: 'word' as const })),
    ...sentences.map((s) => ({ id: s.id, box: s.box, dueDate: s.dueDate, kind: 'sentence' as const })),
  ];
  const chosen = selectSessionItems(candidates, today, size);

  const wordById = new Map(words.map((w) => [w.id, w]));
  const sentById = new Map(sentences.map((s) => [s.id, s]));
  const chosenWords = chosen.filter((c) => c.kind === 'word').map((c) => wordById.get(c.id)!).filter(Boolean);

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
        exercises.push({ kind: 'repeatSentence', sentenceId: sentence.id, text: sentence.text });
      } else {
        exercises.push({ kind: 'dictation', sentenceId: sentence.id, text: sentence.text, translation: sentence.translation });
      }
    }
  });

  return exercises;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/session/buildSession.test.ts`
Expected: PASS (3건)

- [ ] **Step 5: 커밋**

```bash
git add src/features/session/buildSession.ts src/features/session/buildSession.test.ts
git commit -m "feat: add session builder mixing exercise types"
```

---

## Task 16: 세션 화면 셸 + 진행바 + 결과 + 스트릭/보석 반영

**Files:**
- Create: `src/components/ProgressBar.tsx`, `src/features/session/ResultScreen.tsx`
- Modify: `src/features/session/SessionPage.tsx`
- Test: `src/features/session/SessionPage.test.tsx`

**Interfaces:**
- Consumes: `useStore` (words, sentences, recordWord, recordSentence, completeSession), `buildSession`, `stt.sttSupported`
- Produces: `SessionPage` — 세션 카드 시퀀스를 렌더하고, 각 카드가 `onDone(correct: boolean)` 를 호출하면 진행. 정답 시 해당 항목 record 후 다음 카드로. 마지막에 `completeSession` 호출 → `ResultScreen`.
- 각 Exercise 카드 컴포넌트 공통 prop: `onDone(correct: boolean): void`.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/session/SessionPage.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import SessionPage from './SessionPage';

beforeEach(() => {
  useStore.setState({
    loaded: true, decks: [{ id: 'd', name: 'D', createdAt: 0 }],
    words: [
      { id: '1', deckId: 'd', english: 'agenda', meaning: '안건', box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 },
      { id: '2', deckId: 'd', english: 'schedule', meaning: '일정', box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 },
    ],
    sentences: [],
    profile: { streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [] },
  });
});

describe('SessionPage', () => {
  it('shows a result screen after finishing all cards', async () => {
    const user = userEvent.setup();
    const complete = vi.spyOn(useStore.getState(), 'completeSession');
    render(<MemoryRouter><SessionPage /></MemoryRouter>);

    // 카드가 소진될 때까지 첫 번째 선택지/버튼을 계속 누른다.
    for (let i = 0; i < 20; i++) {
      const buttons = screen.queryAllByRole('button');
      const done = screen.queryByText(/학습 완료/);
      if (done) break;
      // '다음' 이 있으면 다음, 아니면 첫 상호작용 버튼
      const next = buttons.find((b) => b.textContent === '다음');
      await user.click(next ?? buttons[0]);
    }
    expect(screen.getByText(/학습 완료/)).toBeInTheDocument();
    expect(complete).toHaveBeenCalled();
  });
});
```

Note: 이 테스트는 Task 17에서 mcq 카드가 실제 구현된 뒤 안정적으로 통과한다. Task 16 구현 직후에는 카드 렌더 스텁으로 인해 실패할 수 있으므로, Task 16에서는 mcq 카드의 최소 렌더(선택지 버튼 + onDone)를 함께 넣어 통과시킨다(아래 Step 3 참고).

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/session/SessionPage.test.tsx`
Expected: FAIL (SessionPage 스텁)

- [ ] **Step 3: 구현**

`src/components/ProgressBar.tsx`:
```tsx
export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
```

`src/features/session/ResultScreen.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';

export default function ResultScreen({
  correct, total, gained, wrongItems,
}: { correct: number; total: number; gained: number; wrongItems: string[] }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold">🎉 학습 완료!</h1>
      <p className="text-lg">정답 {correct} / {total}</p>
      <p className="text-lg">💎 +{gained}</p>
      {wrongItems.length > 0 && (
        <div className="text-left rounded-xl border p-3">
          <p className="font-medium mb-1">복습이 필요한 항목</p>
          <ul className="text-sm text-gray-600 list-disc pl-5">
            {wrongItems.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
      <button className="rounded-xl bg-green-500 text-white px-6 py-3 font-bold" onClick={() => navigate('/')}>
        홈으로
      </button>
    </div>
  );
}
```

`src/features/session/SessionPage.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { buildSession, type Exercise } from './buildSession';
import { sttSupported } from '../../speech/stt';
import { todayStr } from '../../lib/dateUtils';
import ProgressBar from '../../components/ProgressBar';
import ResultScreen from './ResultScreen';
import McqCard from '../exercises/McqCard';
import MatchingCard from '../exercises/MatchingCard';
import SpeakWordCard from '../exercises/SpeakWordCard';
import RepeatSentenceCard from '../exercises/RepeatSentenceCard';
import DictationCard from '../exercises/DictationCard';

export default function SessionPage() {
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const recordWord = useStore((s) => s.recordWord);
  const recordSentence = useStore((s) => s.recordSentence);
  const completeSession = useStore((s) => s.completeSession);

  const exercises = useMemo<Exercise[]>(
    () => buildSession(words, sentences, todayStr(), { sttSupported: sttSupported() }),
    // 세션 시작 시 1회만 구성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [gained, setGained] = useState(0);

  if (exercises.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <p>학습할 항목이 없어요. 먼저 자료를 추가해 주세요.</p>
      </div>
    );
  }

  async function handleDone(ex: Exercise, correct: boolean) {
    // record + tallies
    if (correct) setCorrectCount((c) => c + 1);
    if (ex.kind === 'mcq' || ex.kind === 'speakWord') {
      await recordWord(ex.wordId, correct);
      if (!correct) setWrongItems((w) => [...w, ex.kind === 'mcq' ? ex.prompt : ex.english]);
    } else if (ex.kind === 'repeatSentence' || ex.kind === 'dictation') {
      await recordSentence(ex.sentenceId, correct);
      if (!correct) setWrongItems((w) => [...w, ex.text]);
    }
    // matching 카드는 내부에서 개별 record 처리(아래 카드 구현)

    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      const total = exercises.length;
      const result = await completeSession(correctCount + (correct ? 1 : 0), total);
      setGained(result.gained);
      setFinished(true);
    } else {
      setIndex(nextIndex);
    }
  }

  if (finished) {
    return <ResultScreen correct={correctCount} total={exercises.length} gained={gained} wrongItems={wrongItems} />;
  }

  const ex = exercises[index];
  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <ProgressBar value={index} max={exercises.length} />
      {ex.kind === 'matching' && <MatchingCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'mcq' && <McqCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'speakWord' && <SpeakWordCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'repeatSentence' && <RepeatSentenceCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'dictation' && <DictationCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
    </div>
  );
}
```

Note: matching 카드는 자체적으로 각 짝 정답을 `recordWord` 하도록 Task 17에서 구현하고, 여기 `handleDone` 의 matching 분기는 세션 정답 집계에만 사용한다.

이 Task에서는 다음 카드들의 **최소 동작 스텁**을 먼저 만들어 컴파일/테스트를 통과시킨다(Task 17에서 완성):
```tsx
// src/features/exercises/McqCard.tsx
import type { Exercise } from '../session/buildSession';
export default function McqCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'mcq' }>; onDone: (c: boolean) => void }) {
  return (
    <div>
      <p className="text-xl font-bold mb-4">{ex.prompt}</p>
      <div className="space-y-2">
        {ex.choices.map((c) => (
          <button key={c} className="block w-full rounded-xl border py-2" onClick={() => onDone(c === ex.answer)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
```
```tsx
// src/features/exercises/MatchingCard.tsx
import type { Exercise } from '../session/buildSession';
export default function MatchingCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'matching' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
```
```tsx
// src/features/exercises/SpeakWordCard.tsx
import type { Exercise } from '../session/buildSession';
export default function SpeakWordCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'speakWord' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
```
```tsx
// src/features/exercises/RepeatSentenceCard.tsx
import type { Exercise } from '../session/buildSession';
export default function RepeatSentenceCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'repeatSentence' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
```
```tsx
// src/features/exercises/DictationCard.tsx
import type { Exercise } from '../session/buildSession';
export default function DictationCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'dictation' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/session/SessionPage.test.tsx`
Expected: PASS (1건)

Run: `npm run build`
Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/components/ProgressBar.tsx src/features/session src/features/exercises
git commit -m "feat: add session flow, progress bar, result screen and card stubs"
```

---

## Task 17: 연습 카드 — 단어 짝짓기 + 4지선다

**Files:**
- Modify: `src/features/exercises/MatchingCard.tsx`, `src/features/exercises/McqCard.tsx`
- Test: `src/features/exercises/MatchingCard.test.tsx`, `src/features/exercises/McqCard.test.tsx`

**Interfaces:**
- Consumes: `useStore.recordWord`, `buildSession.Exercise`
- Produces: 완성된 MatchingCard(영단어↔뜻 짝짓기, 각 짝 맞출 때 `recordWord(true)`, 다 맞추면 `onDone(true)`) 와 McqCard(오답 시 정답 강조 후 `onDone(false)`).

- [ ] **Step 1: 실패 테스트 작성**

`src/features/exercises/McqCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McqCard from './McqCard';

const ex = { kind: 'mcq', wordId: '1', prompt: 'agenda', answer: '안건', choices: ['안건', '일정', '회의', '고객'], direction: 'en2ko' } as const;

describe('McqCard', () => {
  it('calls onDone(true) when correct choice picked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: '안건' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });
  it('calls onDone(false) when wrong choice picked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: '일정' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });
});
```

`src/features/exercises/MatchingCard.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../store/useStore';
import MatchingCard from './MatchingCard';

const ex = {
  kind: 'matching',
  pairs: [
    { id: '1', english: 'agenda', meaning: '안건' },
    { id: '2', english: 'schedule', meaning: '일정' },
  ],
} as const;

beforeEach(() => {
  vi.spyOn(useStore.getState(), 'recordWord').mockResolvedValue();
});

describe('MatchingCard', () => {
  it('completes when all pairs are matched', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<MatchingCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: 'agenda' }));
    await user.click(screen.getByRole('button', { name: '안건' }));
    await user.click(screen.getByRole('button', { name: 'schedule' }));
    await user.click(screen.getByRole('button', { name: '일정' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/exercises/McqCard.test.tsx src/features/exercises/MatchingCard.test.tsx`
Expected: FAIL (스텁은 짝짓기/정오답 처리 없음)

- [ ] **Step 3: 구현**

`src/features/exercises/McqCard.tsx`:
```tsx
import { useState } from 'react';
import type { Exercise } from '../session/buildSession';

export default function McqCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'mcq' }>; onDone: (c: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  function choose(choice: string) {
    if (picked) return;
    setPicked(choice);
    const correct = choice === ex.answer;
    setTimeout(() => onDone(correct), 700);
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{ex.direction === 'en2ko' ? '뜻을 고르세요' : '영단어를 고르세요'}</p>
      <p className="text-2xl font-bold mb-4">{ex.prompt}</p>
      <div className="space-y-2">
        {ex.choices.map((c) => {
          const state = !picked ? '' : c === ex.answer ? 'bg-green-100 border-green-400'
            : c === picked ? 'bg-red-100 border-red-400' : '';
          return (
            <button
              key={c}
              className={`block w-full rounded-xl border py-3 ${state}`}
              onClick={() => choose(c)}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

`src/features/exercises/MatchingCard.tsx`:
```tsx
import { useMemo, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { useStore } from '../../store/useStore';

type Token = { id: string; label: string; side: 'en' | 'ko' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchingCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'matching' }>; onDone: (c: boolean) => void }) {
  const recordWord = useStore((s) => s.recordWord);
  const left = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.english, side: 'en' as const }))), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.meaning, side: 'ko' as const }))), [ex]);

  const [selected, setSelected] = useState<Token | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);

  function pick(token: Token) {
    if (matched.has(token.id)) return;
    if (!selected) {
      setSelected(token);
      return;
    }
    if (selected.side === token.side) {
      setSelected(token);
      return;
    }
    if (selected.id === token.id) {
      const next = new Set(matched).add(token.id);
      setMatched(next);
      setSelected(null);
      recordWord(token.id, true);
      if (next.size === ex.pairs.length) setTimeout(() => onDone(true), 400);
    } else {
      setWrongPair(token.id);
      setTimeout(() => setWrongPair(null), 500);
      setSelected(null);
    }
  }

  function cls(token: Token) {
    if (matched.has(token.id)) return 'opacity-30';
    if (selected?.id === token.id && selected.side === token.side) return 'bg-blue-100 border-blue-400';
    if (wrongPair === token.id) return 'bg-red-100 border-red-400';
    return '';
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">같은 뜻끼리 연결하세요</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((t) => (
            <button key={`en-${t.id}`} className={`block w-full rounded-xl border py-3 ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((t) => (
            <button key={`ko-${t.id}`} className={`block w-full rounded-xl border py-3 ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/exercises/McqCard.test.tsx src/features/exercises/MatchingCard.test.tsx`
Expected: PASS (3건)

Run: `npx vitest run src/features/session/SessionPage.test.tsx`
Expected: PASS (회귀 없음)

- [ ] **Step 5: 커밋**

```bash
git add src/features/exercises/McqCard.tsx src/features/exercises/MatchingCard.tsx src/features/exercises/McqCard.test.tsx src/features/exercises/MatchingCard.test.tsx
git commit -m "feat: implement matching and multiple-choice exercise cards"
```

---

## Task 18: 연습 카드 — 단어 말하기 + 문장 따라하기 + 받아쓰기

**Files:**
- Modify: `src/features/exercises/SpeakWordCard.tsx`, `src/features/exercises/RepeatSentenceCard.tsx`, `src/features/exercises/DictationCard.tsx`
- Test: `src/features/exercises/DictationCard.test.tsx`

**Interfaces:**
- Consumes: `speech/tts.speak`, `speech/stt.listen`, `grading.isCloseEnough`, `grading.isCorrectText`
- Produces: 완성된 3종 카드. 말하기/따라하기는 `listen()` 결과를 `isCloseEnough` 로 채점, 받아쓰기는 입력값을 `isCorrectText`(문장은 `isCloseEnough`) 로 채점. 각 카드 하단에 "정답 보기/건너뛰기" 제공.

Note: DictationCard만 자동 테스트(음성 불필요). SpeakWord/RepeatSentence는 마이크가 필요하므로 Task 19 이후 브라우저 수동 검증.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/exercises/DictationCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DictationCard from './DictationCard';

// speak 은 jsdom에 없으므로 목킹
vi.mock('../../speech/tts', () => ({ speak: vi.fn().mockResolvedValue(undefined), ttsSupported: () => true }));

const ex = { kind: 'dictation', sentenceId: 's1', text: 'Could you send me the agenda?', translation: '안건 좀 보내주시겠어요?' } as const;

describe('DictationCard', () => {
  it('accepts a correct (normalized) sentence', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<DictationCard ex={ex} onDone={onDone} />);
    await user.type(screen.getByRole('textbox'), 'could you send me the agenda');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText(/정답/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('marks a wrong sentence and reveals answer', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<DictationCard ex={ex} onDone={onDone} />);
    await user.type(screen.getByRole('textbox'), 'totally different');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText(ex.text)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/exercises/DictationCard.test.tsx`
Expected: FAIL (스텁)

- [ ] **Step 3: 구현**

`src/features/exercises/DictationCard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { isCloseEnough } from '../../lib/grading';

export default function DictationCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'dictation' }>; onDone: (c: boolean) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  function check() {
    setResult(isCloseEnough(value, ex.text));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">들리는 문장을 받아쓰세요</p>
      {ex.translation && <p className="text-gray-600">힌트(뜻): {ex.translation}</p>}
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.text)}>🔊 다시 듣기</button>
      <textarea
        className="w-full rounded-lg border p-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={result !== null}
      />
      {result === null ? (
        <button className="w-full rounded-xl bg-green-500 text-white py-2 font-bold" onClick={check}>확인</button>
      ) : (
        <div className="space-y-2">
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '정답이에요! 🎉' : '아쉬워요. 정답:'}
          </p>
          {!result && <p className="rounded-lg bg-gray-50 border p-2">{ex.text}</p>}
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
```

`src/features/exercises/SpeakWordCard.tsx`:
```tsx
import { useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';

export default function SpeakWordCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'speakWord' }>; onDone: (c: boolean) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  async function record() {
    if (!sttSupported()) { onDone(true); return; }
    setStatus('listening');
    try {
      const transcript = await listen('en-US');
      setHeard(transcript);
      const ok = isCloseEnough(transcript, ex.english, 0.7);
      setResult(ok);
    } catch {
      setResult(false);
    } finally {
      setStatus('done');
    }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-gray-500">이 단어를 소리 내어 말하세요</p>
      <p className="text-3xl font-bold">{ex.english}</p>
      <p className="text-gray-500">{ex.meaning}</p>
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.english)}>🔊 발음 듣기</button>
      {result === null ? (
        <button
          className="w-full rounded-xl bg-green-500 text-white py-3 font-bold"
          onClick={record}
          disabled={status === 'listening'}
        >
          {status === 'listening' ? '🎤 듣는 중…' : '🎤 말하기'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '좋아요! 🎉' : '다시 연습해요'}
          </p>
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
```

`src/features/exercises/RepeatSentenceCard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';

export default function RepeatSentenceCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'repeatSentence' }>; onDone: (c: boolean) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  async function record() {
    if (!sttSupported()) { onDone(true); return; }
    setStatus('listening');
    try {
      const transcript = await listen('en-US');
      setHeard(transcript);
      setResult(isCloseEnough(transcript, ex.text, 0.7));
    } catch {
      setResult(false);
    } finally {
      setStatus('done');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">듣고 따라 말하세요</p>
      <p className="text-xl font-bold">{ex.text}</p>
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.text)}>🔊 다시 듣기</button>
      {result === null ? (
        <button
          className="w-full rounded-xl bg-green-500 text-white py-3 font-bold"
          onClick={record}
          disabled={status === 'listening'}
        >
          {status === 'listening' ? '🎤 듣는 중…' : '🎤 따라 말하기'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '훌륭해요! 🎉' : '한 번 더 연습해요'}
          </p>
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/exercises/DictationCard.test.tsx`
Expected: PASS (2건)

Run: `npm run build`
Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add src/features/exercises/SpeakWordCard.tsx src/features/exercises/RepeatSentenceCard.tsx src/features/exercises/DictationCard.tsx src/features/exercises/DictationCard.test.tsx
git commit -m "feat: implement speaking, repeat and dictation exercise cards"
```

---

## Task 19: 상점 (프리즈 구매) + 전체 통합 수동 검증

**Files:**
- Modify: `src/features/shop/ShopPage.tsx`
- Test: `src/features/shop/ShopPage.test.tsx`

**Interfaces:**
- Consumes: `useStore.buyFreeze`, `gems.FREEZE_COST/FREEZE_MAX`, `StatusBar`
- Produces: 보석 잔액/프리즈 개수 표시, 프리즈 구매 버튼(보석 부족 또는 최대치면 비활성), 홈으로 돌아가기.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/shop/ShopPage.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import ShopPage from './ShopPage';

beforeEach(() => {
  useStore.setState({
    profile: { streakCount: 0, lastStudyDate: null, gems: 60, freezeCount: 0, dailyGoalSessions: 1, history: [] },
  });
});

describe('ShopPage', () => {
  it('buys a freeze when affordable', async () => {
    const user = userEvent.setup();
    const buy = vi.spyOn(useStore.getState(), 'buyFreeze').mockResolvedValue(true);
    render(<MemoryRouter><ShopPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /구매/ }));
    expect(buy).toHaveBeenCalled();
  });

  it('disables buy when gems are insufficient', () => {
    useStore.setState((s) => ({ profile: { ...s.profile, gems: 10 } }));
    render(<MemoryRouter><ShopPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /구매/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/shop/ShopPage.test.tsx`
Expected: FAIL (스텁)

- [ ] **Step 3: 구현**

`src/features/shop/ShopPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FREEZE_COST, FREEZE_MAX } from '../../lib/gems';
import StatusBar from '../../components/StatusBar';

export default function ShopPage() {
  const gems = useStore((s) => s.profile.gems);
  const freezeCount = useStore((s) => s.profile.freezeCount);
  const buyFreeze = useStore((s) => s.buyFreeze);

  const atMax = freezeCount >= FREEZE_MAX;
  const tooPoor = gems < FREEZE_COST;
  const disabled = atMax || tooPoor;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <StatusBar />
      <h1 className="text-xl font-bold">상점</h1>

      <div className="rounded-2xl border p-4 space-y-2">
        <div className="flex items-center gap-2 text-lg font-bold">🧊 스트릭 프리즈</div>
        <p className="text-sm text-gray-600">
          하루 빠져도 연속 학습이 깨지지 않게 지켜줘요. 가진 개수만큼 빠진 날을 메웁니다. (최대 {FREEZE_MAX}개)
        </p>
        <p className="text-sm">보유: 🧊 {freezeCount} / {FREEZE_MAX}</p>
        <button
          className="w-full rounded-xl bg-green-500 text-white py-2 font-bold disabled:bg-gray-300"
          disabled={disabled}
          onClick={() => buyFreeze()}
        >
          💎 {FREEZE_COST}로 구매
        </button>
        {atMax && <p className="text-xs text-gray-400">이미 최대치예요.</p>}
        {!atMax && tooPoor && <p className="text-xs text-gray-400">보석이 부족해요.</p>}
      </div>

      <Link to="/" className="block text-center rounded-xl border py-2">홈으로</Link>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/shop/ShopPage.test.tsx`
Expected: PASS (2건)

Run: `npm test`
Expected: 전체 테스트 PASS

- [ ] **Step 5: 전체 통합 수동 검증 (Chrome)**

Run: `npm run dev`
Chrome에서 순서대로 확인:
1. `/add` 에서 단어 5개(`영단어 = 뜻`) + 문장 2개 입력 → 저장 → 홈에 덱과 개수 표시.
2. "오늘의 학습 시작" → 짝짓기 → 4지선다 → (마이크 허용 시) 말하기/따라하기 → 받아쓰기 진행.
3. 세션 완료 후 결과 화면(정답 수, 💎 획득) → 홈에서 🔥 스트릭 1, 💎 증가 확인.
4. 새로고침 후에도 데이터 유지(IndexedDB) 확인.
5. 오답 낸 항목이 다시 학습 시 재출제되는지 확인(같은 세션/다음 세션).
6. 상점에서 💎로 🧊 구매 → 보석 차감·프리즈 증가 확인.
7. `.txt`/`.docx`/이미지 파일 업로드로 텍스트 추출 확인(Task 14).

Expected: 위 흐름이 오류 없이 동작. 콘솔 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/features/shop/ShopPage.tsx src/features/shop/ShopPage.test.tsx
git commit -m "feat: add shop with streak freeze purchase"
```

---

## Self-Review (작성자 점검 결과)

**Spec coverage:**
- 자료 입력(타이핑/파일) → Task 13, 14 ✅
- 단어 짝짓기 → Task 17 ✅
- 단어 게임(4지선다) → Task 17 ✅ (제한시간 게임은 1단계 범위에서 4지선다로 대표; 타이머형은 이후 확장)
- 단어 말하기 → Task 18 ✅
- 문장 따라하기 → Task 18 ✅
- 문장 쓰기(받아쓰기) → Task 18 ✅
- 복습엔진(라이트너, 오답 반복) → Task 4, 9, 15 ✅
- 양방향 출제 → Task 15 (mcq direction) ✅
- 스트릭/프리즈 → Task 5, 9, 19 ✅
- 보석 → Task 6, 9 ✅
- IndexedDB 영속 → Task 8 ✅
- Chrome 음성/폴백 → Task 10, 18 ✅

**Note on scope:** "단어 게임"은 1단계에서 4지선다(McqCard)로 구현한다. 제한시간·미니게임형은 명시적으로 이후 확장으로 남긴다(스펙의 YAGNI 준수).

**Placeholder scan:** 남은 TODO/모호 스텁 없음. Task 16의 카드 스텁은 Task 17/18에서 전부 실제 구현으로 대체됨.

**Type consistency:** `Exercise` 유니온, `onDone(correct: boolean)`, `recordWord/recordSentence`, `applyResult`, `selectSessionItems`, `applyStudyDay`, `sessionReward` 시그니처가 정의 Task와 소비 Task 간 일치함.
