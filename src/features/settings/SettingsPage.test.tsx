import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import SettingsPage from './SettingsPage';

beforeEach(() => {
  useStore.setState({
    loaded: true, decks: [{ id: 'd1', name: 'Chapter 3', createdAt: 0 }],
    words: [{ id: 'w1', deckId: 'd1', english: 'a', meaning: 'ㄱ', box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 }],
    sentences: [],
    profile: { streakCount: 12, lastStudyDate: '2026-09-10', gems: 340, freezeCount: 2, dailyGoalSessions: 1, history: [] },
  });
});

describe('SettingsPage', () => {
  it('shows collapsed materials list', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    // 기본은 자료가 닫혀있음: 덱 이름이 보이지 않는다.
    expect(screen.queryByText('Chapter 3')).toBeNull();
    expect(screen.getByText('내 자료')).toBeInTheDocument();
  });

  it('toggles materials list', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    // 내 자료를 클릭하면 덱 이름이 보인다.
    await user.click(screen.getByRole('button', { name: /내 자료/ }));
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();

    // 다시 누르면 닫힌다.
    await user.click(screen.getByRole('button', { name: /내 자료/ }));
    expect(screen.queryByText('Chapter 3')).toBeNull();
  });

  it('shows backup section', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(screen.getByText('백업 · 기기 옮기기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내보내기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가져오기' })).toBeInTheDocument();
  });
});
