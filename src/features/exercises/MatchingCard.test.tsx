import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '../../store/useStore';
import MatchingCard from './MatchingCard';
import { speak } from '../../speech/tts';

vi.mock('../../speech/tts', () => ({ speak: vi.fn().mockResolvedValue(undefined), ttsSupported: () => true }));

const ex = {
  kind: 'matching',
  pairs: [
    { id: '1', english: 'agenda', meaning: '안건' },
    { id: '2', english: 'schedule', meaning: '일정' },
  ],
} as const;

beforeEach(() => {
  vi.spyOn(useStore.getState(), 'recordWord').mockResolvedValue();
  vi.mocked(speak).mockClear();
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

  it('plays the pronunciation when an English tile is tapped', async () => {
    const user = userEvent.setup();
    render(<MatchingCard ex={ex} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'agenda' }));
    expect(speak).toHaveBeenCalledWith('agenda');

    // 한국어 타일은 발음을 재생하지 않는다.
    vi.mocked(speak).mockClear();
    await user.click(screen.getByRole('button', { name: '일정' }));
    expect(speak).not.toHaveBeenCalled();
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
