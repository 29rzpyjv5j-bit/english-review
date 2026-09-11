import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import AddDeckPage from './AddDeckPage';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

beforeEach(() => {
  navigateMock.mockReset();
  useStore.setState({ decks: [], words: [], sentences: [] });
  vi.spyOn(useStore.getState(), 'createDeck').mockResolvedValue();
});

describe('AddDeckPage', () => {
  it('parses input and calls createDeck then navigates home', async () => {
    const user = userEvent.setup();
    const createDeck = vi.spyOn(useStore.getState(), 'createDeck').mockResolvedValue();
    render(<MemoryRouter><AddDeckPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('자료 이름'), 'Chapter 3');
    await user.type(screen.getByLabelText('단어 (영단어 = 뜻)'), 'agenda = 안건');
    await user.type(screen.getByLabelText('문장'), 'Hello.');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(createDeck).toHaveBeenCalledWith(
      'Chapter 3',
      [{ english: 'agenda', meaning: '안건' }],
      [{ text: 'Hello.' }],
    );
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
