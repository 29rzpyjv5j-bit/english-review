import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(true));
  });

  it('is a pure warm-up: does not record reviews (words are recorded by their own exercises)', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<MatchingCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: 'agenda' }));
    await user.click(screen.getByRole('button', { name: '안건' }));
    await user.click(screen.getByRole('button', { name: 'schedule' }));
    await user.click(screen.getByRole('button', { name: '일정' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(true));
    expect(useStore.getState().recordWord).not.toHaveBeenCalled();
  });
});
