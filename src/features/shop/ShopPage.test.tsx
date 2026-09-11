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
