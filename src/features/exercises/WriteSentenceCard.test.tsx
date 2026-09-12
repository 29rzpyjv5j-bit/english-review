import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WriteSentenceCard from './WriteSentenceCard';

vi.mock('../../speech/tts', () => ({ speak: vi.fn().mockResolvedValue(undefined), ttsSupported: () => true }));

describe('WriteSentenceCard', () => {
  it('shows the translation as the prompt and accepts a correct sentence', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<WriteSentenceCard text="Could you send me the agenda?" translation="안건 좀 보내주시겠어요?" onDone={onDone} />);

    expect(screen.getByText('안건 좀 보내주시겠어요?')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'could you send me the agenda');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText(/정답이에요/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('reveals the answer when wrong', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<WriteSentenceCard text="See you tomorrow." translation="내일 봐요." onDone={onDone} />);

    await user.type(screen.getByRole('textbox'), 'totally different');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText('See you tomorrow.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });

  it('offers a replay button instead of a prompt when there is no translation', () => {
    render(<WriteSentenceCard text="Hello there." onDone={vi.fn()} />);
    expect(screen.getByRole('button', { name: /다시 듣기/ })).toBeInTheDocument();
    expect(screen.getByText('문장을 듣고 받아쓰세요')).toBeInTheDocument();
  });
});
