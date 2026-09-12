import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import SessionPage from './SessionPage';

vi.mock('../../speech/tts', () => ({ speak: vi.fn().mockResolvedValue(undefined), ttsSupported: () => true }));
vi.mock('../../speech/stt', () => ({ listen: vi.fn().mockResolvedValue('test'), sttSupported: () => false }));

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

    // 카드가 소진될 때까지 계속 진행한다.
    for (let i = 0; i < 20; i++) {
      const buttons = screen.queryAllByRole('button');
      const done = screen.queryByText(/학습 완료/);
      if (done) break;
      // '다음' 이 있으면 다음
      const next = buttons.find((b) => b.textContent === '다음');
      if (next) {
        await user.click(next);
      } else {
        // '다음'이 없으면 MCQ 선택지(text-left)나 말하기 버튼 찾기
        const choice = buttons.find((b) => b.classList.contains('text-left'));
        const speak = buttons.find((b) => b.textContent.includes('말하기') || b.textContent.includes('확인'));
        await user.click(choice ?? speak ?? buttons[0]);
      }
    }
    expect(screen.getByText(/학습 완료/)).toBeInTheDocument();
    expect(complete).toHaveBeenCalled();
  });

  it('resets card state between consecutive same-kind cards (no leaked selection)', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SessionPage /></MemoryRouter>);

    // 첫 mcq 카드: 아직 선택 전이라 '다음' 버튼이 없어야 한다.
    expect(screen.queryByText('다음')).toBeNull();

    // MCQ 선택지를 고르면 '다음' 버튼이 나타난다.
    const firstCardButtons = screen.getAllByRole('button');
    const choice = firstCardButtons.find((b) => b.classList.contains('text-left'));
    await user.click(choice || firstCardButtons[0]);
    expect(screen.getByText('다음')).toBeInTheDocument();

    // 다음 카드로 이동한다. 이동은 복습 기록(DB 쓰기)을 await 한 뒤 일어나므로 기다린다.
    await user.click(screen.getByText('다음'));

    // 두 번째 카드는 새 인스턴스여야 한다: 선택 전이므로 '다음'이 다시 없어야 한다.
    // (key 없이 인스턴스가 재사용되면 이전 카드의 선택 상태가 새어나와 실패한다.)
    await waitFor(() => expect(screen.queryByText('다음')).toBeNull());
  });
});
