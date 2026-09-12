import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('shows streak and gems', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
  });

  it('shows deck list in settings modal', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    // 기본은 설정이 닫힘: 덱 이름이 보이지 않는다.
    expect(screen.queryByText('Chapter 3')).toBeNull();

    // 설정 버튼을 클릭하면 내 자료와 덱 이름이 보인다.
    await user.click(screen.getByRole('button', { name: /설정/ }));
    expect(screen.getByText('내 자료')).toBeInTheDocument();
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();

    // 내 자료 버튼을 다시 누르면 설정이 닫힌다.
    await user.click(screen.getByRole('button', { name: /내 자료/ }));
    expect(screen.queryByText('Chapter 3')).toBeNull();
  });
});
