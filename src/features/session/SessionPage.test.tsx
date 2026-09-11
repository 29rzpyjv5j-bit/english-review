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
