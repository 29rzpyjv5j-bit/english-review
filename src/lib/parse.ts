export interface ParsedWord {
  english: string;
  meaning: string;
}

export interface ParsedSentence {
  text: string;
  translation?: string;
  keyword?: string;
}

export interface ParsedItems {
  words: ParsedWord[];
  sentences: ParsedSentence[];
}

export function parseWords(text: string): ParsedWord[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('=');
      if (idx === -1) return { english: line, meaning: '' };
      return { english: line.slice(0, idx).trim(), meaning: line.slice(idx + 1).trim() };
    })
    .filter((w) => w.english);
}

export function parseSentences(text: string): ParsedSentence[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('|');
      if (idx === -1) return { text: line };
      const translation = line.slice(idx + 1).trim();
      return { text: line.slice(0, idx).trim(), translation: translation || undefined };
    })
    .filter((s) => s.text);
}

export function parseInput(wordsText: string, sentencesText: string): ParsedItems {
  return { words: parseWords(wordsText), sentences: parseSentences(sentencesText) };
}

// 한 번에 붙여넣은 텍스트를 단어칸/문장칸 텍스트로 나눈다.
// '=' 가 있는 줄 → 단어, 나머지 줄 → 문장.
export function splitCombined(text: string): { wordsText: string; sentencesText: string } {
  const wordLines: string[] = [];
  const sentenceLines: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.includes('=')) wordLines.push(line);
    else sentenceLines.push(line);
  }
  return { wordsText: wordLines.join('\n'), sentencesText: sentenceLines.join('\n') };
}
