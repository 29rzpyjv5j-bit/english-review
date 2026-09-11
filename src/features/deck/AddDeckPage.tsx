import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { parseWords, parseSentences } from '../../lib/parse';

export default function AddDeckPage() {
  const navigate = useNavigate();
  const createDeck = useStore((s) => s.createDeck);
  const [name, setName] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [sentencesText, setSentencesText] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedWords = useMemo(() => parseWords(wordsText), [wordsText]);
  const parsedSentences = useMemo(() => parseSentences(sentencesText), [sentencesText]);
  const canSave = name.trim().length > 0 && (parsedWords.length + parsedSentences.length) > 0;

  async function onSave() {
    setSaving(true);
    await createDeck(name.trim(), parsedWords, parsedSentences);
    navigate('/');
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">자료 추가</h1>

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
