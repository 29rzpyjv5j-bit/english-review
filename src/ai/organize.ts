import type { ParsedWord, ParsedSentence, ParsedItems } from '../lib/parse';

// AI가 반환한(스키마 검증된) 원시 결과 형태.
export interface RawItems {
  words?: { english?: string; meaning?: string }[];
  sentences?: { text?: string; translation?: string }[];
}

// AI 결과를 앱의 ParsedItems 로 정규화: 공백 제거, 빈 항목 제거, 빈 번역은 undefined.
export function normalizeAiResult(raw: RawItems): ParsedItems {
  const words: ParsedWord[] = (raw.words ?? [])
    .map((w) => ({ english: (w.english ?? '').trim(), meaning: (w.meaning ?? '').trim() }))
    .filter((w) => w.english.length > 0);

  const sentences: ParsedSentence[] = (raw.sentences ?? [])
    .map((s) => {
      const text = (s.text ?? '').trim();
      const translation = (s.translation ?? '').trim();
      return translation ? { text, translation } : { text };
    })
    .filter((s) => s.text.length > 0);

  return { words, sentences };
}

const SYSTEM_PROMPT = `You help a Korean learner turn raw English-class material into structured study data.
The input may be messy: mixed Korean and English, OCR text, bullet lists, or a handout dump.
Extract two things and return them ONLY via the save_items tool:
1) words: English vocabulary words or short phrases, each with a concise Korean meaning (뜻).
2) sentences: full English example sentences worth practicing. If a Korean translation is present or obvious, include it; otherwise use an empty string.
Only include items that actually appear in (or are clearly implied by) the material. Do not invent unrelated content. Keep Korean meanings short.`;

const SAVE_TOOL = {
  name: 'save_items',
  description: '추출한 영어 단어와 예문을 저장한다.',
  input_schema: {
    type: 'object',
    properties: {
      words: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            english: { type: 'string' },
            meaning: { type: 'string' },
          },
          required: ['english', 'meaning'],
          additionalProperties: false,
        },
      },
      sentences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            translation: { type: 'string' },
          },
          required: ['text', 'translation'],
          additionalProperties: false,
        },
      },
    },
    required: ['words', 'sentences'],
    additionalProperties: false,
  },
  strict: true,
};

// 원문을 Claude Haiku 로 보내 구조화된 단어/문장으로 정리한다.
// 브라우저에서 직접 Anthropic API 를 호출한다(BYOK). 키는 이 함수 밖으로 나가지 않는다.
export async function organizeMaterial(apiKey: string, raw: string): Promise<ParsedItems> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: raw }],
      tools: [SAVE_TOOL],
      tool_choice: { type: 'tool', name: 'save_items' },
    }),
  });

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    if (res.status === 401) message = 'API 키가 올바르지 않아요. 키를 확인해 주세요.';
    else if (res.status === 429) message = '요청 한도에 걸렸어요. 잠시 후 다시 시도해 주세요.';
    else {
      try {
        const body = await res.json();
        if (body?.error?.message) message = body.error.message;
      } catch {
        /* 응답 파싱 실패는 무시하고 기본 메시지 사용 */
      }
    }
    throw new Error(message);
  }

  const data = await res.json();
  const block = (data.content ?? []).find(
    (b: { type?: string; name?: string }) => b.type === 'tool_use' && b.name === 'save_items',
  );
  if (!block) throw new Error('AI 응답을 해석하지 못했어요. 다시 시도해 주세요.');
  return normalizeAiResult(block.input as RawItems);
}
