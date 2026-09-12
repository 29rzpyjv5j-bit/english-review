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
});
