import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RepeatSentenceCard from './RepeatSentenceCard';

vi.mock('../../speech/tts', () => ({ speak: vi.fn() }));
vi.mock('../../speech/stt', () => ({
  sttSupported: () => true,
  listen: vi.fn(),
}));

import { listen } from '../../speech/stt';

const ex = {
  kind: 'repeatSentence',
  sentenceId: 's1',
  text: 'Let us touch base next week.',
  translation: '다음 주에 한번 상황을 공유해요.',
  keyword: 'touch base',
} as const;

beforeEach(() => {
  vi.mocked(listen).mockReset();
});

describe('RepeatSentenceCard', () => {
  it('제출 전에는 키워드와 뜻을 보여주지 않는다', () => {
    render(<RepeatSentenceCard ex={ex} onDone={vi.fn()} />);
    expect(screen.queryByText(ex.keyword)).toBeNull();
    expect(screen.queryByText(ex.translation)).toBeNull();
  });

  it('제출하면 키워드와 뜻이 나타난다', async () => {
    const user = userEvent.setup();
    vi.mocked(listen).mockResolvedValue(ex.text);
    render(<RepeatSentenceCard ex={ex} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /따라 말하기/ }));

    expect(screen.getByText(ex.keyword)).toBeTruthy();
    expect(screen.getByText(ex.translation)).toBeTruthy();
  });

  it('틀려도 제출했으면 키워드와 뜻이 나타난다', async () => {
    const user = userEvent.setup();
    vi.mocked(listen).mockResolvedValue('something else entirely');
    render(<RepeatSentenceCard ex={ex} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /따라 말하기/ }));

    expect(screen.getByText(ex.keyword)).toBeTruthy();
    expect(screen.getByText(ex.translation)).toBeTruthy();
  });

  it('두 번째로 틀리면 다시 말할 기회를 주지 않는다', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    vi.mocked(listen).mockResolvedValue('something else entirely');
    render(<RepeatSentenceCard ex={ex} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /따라 말하기/ }));
    await user.click(screen.getByRole('button', { name: '다시 말하기' }));
    await user.click(screen.getByRole('button', { name: /따라 말하기/ }));

    expect(screen.queryByRole('button', { name: '다시 말하기' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });
});
