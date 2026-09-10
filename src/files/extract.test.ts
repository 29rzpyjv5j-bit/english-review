import { describe, it, expect } from 'vitest';
import { extractText } from './extract';

describe('extractText', () => {
  it('reads plain text files', async () => {
    const file = new File(['schedule = 일정'], 'notes.txt', { type: 'text/plain' });
    expect(await extractText(file)).toBe('schedule = 일정');
  });
  it('throws on unsupported types', async () => {
    const file = new File(['x'], 'a.xyz', { type: 'application/octet-stream' });
    await expect(extractText(file)).rejects.toThrow();
  });
});
