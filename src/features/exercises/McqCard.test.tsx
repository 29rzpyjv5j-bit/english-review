import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McqCard from './McqCard';

vi.mock('../../speech/tts', () => ({ speak: vi.fn() }));
import { speak } from '../../speech/tts';

const ex = { kind: 'mcq', wordId: '1', prompt: 'agenda', answer: '안건', choices: ['안건', '일정', '회의', '고객'], direction: 'en2ko' } as const;

describe('McqCard', () => {
  it('calls onDone(true) when correct choice picked then 다음 clicked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: /안건/ }));
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('calls onDone(false) when wrong choice picked then 다음 clicked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: /일정/ }));
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });

  it('두 번째로 틀리면 다시 풀 기회를 주지 않고 정답을 보여준다', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /일정/ }));
    await user.click(screen.getByRole('button', { name: '다시 선택' }));

    await user.click(screen.getByRole('button', { name: /회의/ }));
    expect(screen.queryByRole('button', { name: '다시 선택' })).toBeNull();
    expect(screen.getByText('정답은 안건')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });

  it('다시 선택해서 맞히면 정답으로 넘어간다', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<McqCard ex={ex} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /일정/ }));
    await user.click(screen.getByRole('button', { name: '다시 선택' }));
    await user.click(screen.getByRole('button', { name: /안건/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('뜻 고르기에서는 한국어 보기를 읽지 않고 영어 단어를 들려준다', async () => {
    const user = userEvent.setup();
    render(<McqCard ex={ex} onDone={vi.fn()} />);
    vi.mocked(speak).mockClear();

    await user.click(screen.getByRole('button', { name: /일정/ }));

    expect(speak).toHaveBeenCalledWith('agenda');
    expect(speak).not.toHaveBeenCalledWith('일정');
  });

  it('영단어 고르기에서는 고른 보기를 읽어준다', async () => {
    const user = userEvent.setup();
    const koEx = {
      kind: 'mcq', wordId: '1', prompt: '안건', answer: 'agenda',
      choices: ['agenda', 'schedule'], direction: 'ko2en',
    } as const;
    render(<McqCard ex={koEx} onDone={vi.fn()} />);
    vi.mocked(speak).mockClear();

    await user.click(screen.getByRole('button', { name: /schedule/ }));

    expect(speak).toHaveBeenCalledWith('schedule');
  });
});
