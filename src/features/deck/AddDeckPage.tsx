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

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">자료 추가</h1>

      <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
        <p className="text-sm font-medium">파일에서 텍스트 가져오기</p>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" name="target" checked={target === 'words'} onChange={() => setTarget('words')} />
            단어칸으로
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="target" checked={target === 'sentences'} onChange={() => setTarget('sentences')} />
            문장칸으로
          </label>
        </div>
        <input type="file" accept=".txt,.docx,.pdf,image/*" onChange={onFile} disabled={extracting} />
        {extracting && <p className="text-xs text-gray-500">추출 중… (이미지·PDF는 시간이 걸릴 수 있어요)</p>}
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}
        <p className="text-xs text-gray-400">추출한 뒤 아래에서 형식(영단어 = 뜻)에 맞게 정리하세요.</p>
      </div>

      <label className="block">
        <span className="text-sm text-gray-600">자료 이름</span>
        <input
          aria-label="자료 이름"
          className="mt-1 w-full rounded-lg border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: Chapter 3 회의"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">단어 (영단어 = 뜻)</span>
        <textarea
          aria-label="단어 (영단어 = 뜻)"
          className="mt-1 w-full rounded-lg border p-2 h-32 font-mono text-sm"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          placeholder={'schedule = 일정\nagenda = 안건'}
        />
        <span className="text-xs text-gray-400">단어 {parsedWords.length}개 인식됨</span>
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">문장</span>
        <textarea
          aria-label="문장"
          className="mt-1 w-full rounded-lg border p-2 h-32 text-sm"
          value={sentencesText}
          onChange={(e) => setSentencesText(e.target.value)}
          placeholder={'Could you send me the agenda?\nSee you tomorrow. | 내일 봐요.'}
        />
        <span className="text-xs text-gray-400">문장 {parsedSentences.length}개 인식됨</span>
      </label>

      {saveError && <p className="text-sm text-red-500">{saveError}</p>}

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl bg-green-500 text-white py-2 font-bold disabled:bg-gray-300"
          disabled={!canSave || saving}
          onClick={onSave}
        >
          저장
        </button>
        <button className="flex-1 rounded-xl border py-2" onClick={() => navigate('/')}>
          취소
        </button>
      </div>
    </div>
  );
}
