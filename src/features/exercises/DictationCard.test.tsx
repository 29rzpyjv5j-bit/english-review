import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DictationCard from './DictationCard';

// speak 은 jsdom에 없으므로 목킹
vi.mock('../../speech/tts', () => ({ speak: vi.fn().mockResolvedValue(undefined), ttsSupported: () => true }));

const ex = { kind: 'dictation', sentenceId: 's1', text: 'Could you send me the agenda?', translation: '안건 좀 보내주시겠어요?' } as const;

describe('DictationCard', () => {
  it('accepts a correct (normalized) sentence', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<DictationCard ex={ex} onDone={onDone} />);
    await user.type(screen.getByRole('textbox'), 'could you send me the agenda');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText(/정답/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('marks a wrong sentence and reveals answer', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<DictationCard ex={ex} onDone={onDone} />);
    await user.type(screen.getByRole('textbox'), 'totally different');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText(ex.text)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(onDone).toHaveBeenCalledWith(false);
  });
});
