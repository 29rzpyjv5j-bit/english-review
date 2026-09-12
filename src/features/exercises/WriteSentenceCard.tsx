import { useState } from 'react';
import { speak } from '../../speech/tts';
import { isCloseEnough } from '../../lib/grading';
import { Speaker } from '../../components/icons';

// 소리 내어 말하지 않고 문장을 쓰는 카드.
// 번역이 있으면 뜻을 보고 영작하고(소리 불필요), 없으면 들어보며 받아쓴다.
export default function WriteSentenceCard({
  text,
  translation,
  onDone,
}: {
  text: string;
  translation?: string;
  onDone: (c: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  function check() {
    setResult(isCloseEnough(value, text));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {translation ? '뜻을 보고 영어로 써보세요' : '문장을 듣고 받아쓰세요'}
      </p>

      {translation ? (
        <p className="text-xl font-bold leading-snug">{translation}</p>
      ) : (
        <button
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm active:opacity-90"
          onClick={() => speak(text)}
        >
          <Speaker className="w-4 h-4" /> 다시 듣기
        </button>
      )}

      <textarea
        aria-label="문장 쓰기"
        className="w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={result !== null}
        placeholder="영어 문장을 입력하세요"
      />

      {result === null ? (
        <button className="w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90" onClick={check}>
          확인
        </button>
      ) : (
        <div className="space-y-2">
          <p className={result ? 'text-accent font-bold' : 'text-danger font-bold'}>
            {result ? '정답이에요! 🎉' : '아쉬워요. 정답:'}
          </p>
          {!result && <p className="rounded-xl bg-surface2 border border-line p-3">{text}</p>}
          <button
            className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90"
            onClick={() => onDone(result)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
