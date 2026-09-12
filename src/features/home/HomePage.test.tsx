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

  it('keeps the deck list collapsed until 내 자료 is tapped', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    // 기본은 접힘: 덱 이름이 보이지 않는다.
    expect(screen.queryByText('Chapter 3')).toBeNull();

    await user.click(screen.getByRole('button', { name: /내 자료/ }));
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();

    // 다시 누르면 접힌다.
    await user.click(screen.getByRole('button', { name: /내 자료/ }));
    expect(screen.queryByText('Chapter 3')).toBeNull();
  });
});
