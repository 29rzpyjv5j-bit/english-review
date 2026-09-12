import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { parseWords, parseSentences, splitCombined, type ParsedWord, type ParsedSentence } from '../../lib/parse';
import { extractText } from '../../files/extract';
import { getApiKey, setApiKey } from '../../ai/apiKey';
import { organizeMaterial } from '../../ai/organize';

// AI 정리 결과(ParsedItems)를 입력칸 텍스트 형식으로 되돌린다(사용자가 검토·수정 가능).
function wordsToText(words: ParsedWord[]): string {
  return words.map((w) => `${w.english} = ${w.meaning}`).join('\n');
}
function sentencesToText(sentences: ParsedSentence[]): string {
  return sentences.map((s) => (s.translation ? `${s.text} | ${s.translation}` : s.text)).join('\n');
}

export default function AddDeckPage() {
  const navigate = useNavigate();
  const createDeck = useStore((s) => s.createDeck);
  const [name, setName] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [sentencesText, setSentencesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<'words' | 'sentences'>('words');
  const [fileError, setFileError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 한 번에 붙여넣기 (AI 불필요)
  const [combinedText, setCombinedText] = useState('');

  // AI 자동 정리
  const [rawText, setRawText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [keyDraft, setKeyDraft] = useState('');
  const [editingKey, setEditingKey] = useState(false);

  const parsedWords = useMemo(() => parseWords(wordsText), [wordsText]);
  const parsedSentences = useMemo(() => parseSentences(sentencesText), [sentencesText]);
  const canSave = name.trim().length > 0 && (parsedWords.length + parsedSentences.length) > 0;

  async function onSave() {
    setSaving(true);
    setSaveError('');
    try {
      await createDeck(name.trim(), parsedWords, parsedSentences);
      navigate('/');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했어요. 다시 시도해 주세요.');
      setSaving(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    setExtracting(true);
    try {
      const text = await extractText(file);
      if (target === 'words') setWordsText((prev) => (prev ? prev + '\n' : '') + text);
      else setSentencesText((prev) => (prev ? prev + '\n' : '') + text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : '추출 실패');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  }

  function applyCombined() {
    const { wordsText: w, sentencesText: s } = splitCombined(combinedText);
    if (!w && !s) return;
    setWordsText((prev) => [prev, w].filter(Boolean).join('\n'));
    setSentencesText((prev) => [prev, s].filter(Boolean).join('\n'));
    setCombinedText('');
  }

  function saveKey() {
    const k = keyDraft.trim();
    setApiKey(k);
    setApiKeyState(k);
    setEditingKey(false);
    setKeyDraft('');
  }

  async function onOrganize() {
    if (!apiKey) {
      setEditingKey(true);
      setAiError('먼저 Claude API 키를 입력해 주세요.');
      return;
    }
    if (!rawText.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await organizeMaterial(apiKey, rawText.trim());
      setWordsText(wordsToText(result.words));
      setSentencesText(sentencesToText(result.sentences));
      if (result.words.length + result.sentences.length === 0) {
        setAiError('정리할 단어·문장을 찾지 못했어요. 원문을 확인해 주세요.');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 정리에 실패했어요.');
    } finally {
      setAiLoading(false);
    }
  }

  const fieldCls =
    'mt-1 w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent';

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">자료 추가</h1>

      <div className="rounded-xl border border-line p-3 space-y-2 bg-surface">
        <p className="text-sm font-medium">📋 한 번에 붙여넣기</p>
        <p className="text-xs text-muted">단어·문장 구분 없이 통째로 붙여넣으세요. <span className="text-ink">=</span> 가 있는 줄은 단어칸, 나머지는 문장칸으로 자동 분류돼요.</p>
        <textarea
          aria-label="한 번에 붙여넣기"
          className="w-full rounded-xl border border-line bg-bg p-3 h-28 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          value={combinedText}
          onChange={(e) => setCombinedText(e.target.value)}
          placeholder={'agenda = 안건\nschedule = 일정\nCould you send me the agenda?'}
        />
        <button
          className="w-full rounded-xl bg-accent text-accentInk py-2.5 font-bold disabled:opacity-50"
          disabled={!combinedText.trim()}
          onClick={applyCombined}
        >
          칸에 나눠 담기
        </button>
      </div>

      <div className="rounded-xl border border-accent/40 p-3 space-y-2 bg-accent/5">
        <p className="text-sm font-medium text-accent">✨ AI로 정리 (Claude · 선택, API 키 필요)</p>
        <p className="text-xs text-muted">수업 자료 원문을 그대로 붙여넣으면 AI가 단어·문장으로 정리해 아래 칸을 채워줘요.</p>

        {apiKey && !editingKey ? (
          <p className="text-xs text-muted">
            API 키 저장됨 ✓{' '}
            <button className="text-accent underline" onClick={() => setEditingKey(true)}>변경</button>
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              aria-label="Claude API 키"
              className="flex-1 rounded-lg border border-line bg-surface p-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Claude API 키 (sk-ant-...)"
            />
            <button
              className="rounded-lg bg-accent text-accentInk px-3 text-sm font-bold disabled:opacity-50"
              disabled={!keyDraft.trim()}
              onClick={saveKey}
            >
              키 저장
            </button>
          </div>
        )}

        <textarea
          aria-label="원문 붙여넣기"
          className="w-full rounded-xl border border-line bg-surface p-3 h-28 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={'수업 프린트물 내용을 그대로 붙여넣으세요…'}
        />
        <button
          className="w-full rounded-xl bg-accent text-accentInk py-2.5 font-bold disabled:opacity-50"
          disabled={aiLoading || !rawText.trim()}
          onClick={onOrganize}
        >
          {aiLoading ? 'AI가 정리하는 중…' : 'AI로 정리하기'}
        </button>
        {aiError && <p className="text-xs text-danger">{aiError}</p>}
        <p className="text-xs text-muted">정리 1회에 약 10~30원. 키는 이 브라우저에만 저장돼요.</p>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-2 bg-surface">
        <p className="text-sm font-medium">파일에서 텍스트 가져오기</p>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="target" className="accent-accent" checked={target === 'words'} onChange={() => setTarget('words')} />
            단어칸으로
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="target" className="accent-accent" checked={target === 'sentences'} onChange={() => setTarget('sentences')} />
            문장칸으로
          </label>
        </div>
        <input
          type="file"
          accept=".txt,.docx,.pdf,image/*"
          onChange={onFile}
          disabled={extracting}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface2 file:px-3 file:py-1.5 file:text-ink file:font-medium"
        />
        {extracting && <p className="text-xs text-muted">추출 중… (이미지·PDF는 시간이 걸릴 수 있어요)</p>}
        {fileError && <p className="text-xs text-danger">{fileError}</p>}
        <p className="text-xs text-muted">추출한 뒤 아래에서 형식(영단어 = 뜻)에 맞게 정리하세요.</p>
      </div>

      <label className="block">
        <span className="text-sm text-muted">자료 이름</span>
        <input
          aria-label="자료 이름"
          className={fieldCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: Chapter 3 회의"
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">단어 (영단어 = 뜻)</span>
        <textarea
          aria-label="단어 (영단어 = 뜻)"
          className={`${fieldCls} h-32 font-mono`}
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          placeholder={'schedule = 일정\nagenda = 안건'}
        />
        <span className="text-xs text-muted">단어 {parsedWords.length}개 인식됨</span>
      </label>

      <label className="block">
        <span className="text-sm text-muted">문장</span>
        <textarea
          aria-label="문장"
          className={`${fieldCls} h-32`}
          value={sentencesText}
          onChange={(e) => setSentencesText(e.target.value)}
          placeholder={'Could you send me the agenda?\nSee you tomorrow. | 내일 봐요.'}
        />
        <span className="text-xs text-muted">문장 {parsedSentences.length}개 인식됨</span>
      </label>

      {saveError && <p className="text-sm text-danger">{saveError}</p>}

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-50"
          disabled={!canSave || saving}
          onClick={onSave}
        >
          저장
        </button>
        <button className="flex-1 rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => navigate('/')}>
          취소
        </button>
      </div>
    </div>
  );
}
