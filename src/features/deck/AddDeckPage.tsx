import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { parseWords, parseSentences } from '../../lib/parse';
import { extractText } from '../../files/extract';

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

  const fieldCls =
    'mt-1 w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent';

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">자료 추가</h1>

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
