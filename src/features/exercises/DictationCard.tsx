import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { isCloseEnough } from '../../lib/grading';

export default function DictationCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'dictation' }>; onDone: (c: boolean) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  function check() {
    setResult(isCloseEnough(value, ex.text));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">들리는 문장을 받아쓰세요</p>
      {ex.translation && <p className="text-gray-600">힌트(뜻): {ex.translation}</p>}
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.text)}>🔊 다시 듣기</button>
      <textarea
        className="w-full rounded-lg border p-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={result !== null}
      />
      {result === null ? (
        <button className="w-full rounded-xl bg-green-500 text-white py-2 font-bold" onClick={check}>확인</button>
      ) : (
        <div className="space-y-2">
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '정답이에요! 🎉' : '아쉬워요. 정답:'}
          </p>
          {!result && <p className="rounded-lg bg-gray-50 border p-2">{ex.text}</p>}
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
