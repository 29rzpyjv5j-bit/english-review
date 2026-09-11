import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McqCard from './McqCard';

const ex = { kind: 'mcq', wordId: '1', prompt: 'agenda', answer: '안건', choices: ['안건', '일정', '회의', '고객'], direction: 'en2ko' } as const;

describe('McqCard', () => {
  it('calls onDone(true) when correct choice picked then 다음 clicked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: '안건' }));
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('calls onDone(false) when wrong choice picked then 다음 clicked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: '일정' }));
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });
});
