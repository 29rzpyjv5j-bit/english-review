import { useState } from 'react';
import { sendLoginCode, verifyLoginCode } from '../../cloud/social';

const fieldCls =
  'w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent';
const primaryCls = 'w-full rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-50 active:opacity-90';

// 메일의 링크 대신 6자리 코드를 앱 안에서 입력한다. 아이폰 홈 화면 앱은 Safari 와 저장소가
// 달라서, 링크를 누르면 로그인이 Safari 쪽에만 되고 앱에는 남지 않는다.
export default function LoginPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제가 생겼어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
      <p className="text-lg font-bold">친구와 함께 공부하기</p>
      <p className="text-sm text-muted">
        같이 공부하는 사람들과 연속 일수와 공부 중인 자료를 서로 볼 수 있어요. 학습 자료와 진도는 올라가지 않아요.
      </p>

      {!sent ? (
        <>
          <input
            aria-label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={fieldCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <button
            className={primaryCls}
            disabled={!emailOk || busy}
            onClick={() => run(async () => { await sendLoginCode(email); setSent(true); })}
          >
            {busy ? '보내는 중…' : '로그인 코드 받기'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm">
            <span className="font-medium">{email.trim()}</span> 로 보낸 6자리 코드를 입력하세요.
          </p>
          <input
            aria-label="로그인 코드"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${fieldCls} text-center text-2xl tracking-[0.4em] tabular-nums`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
          />
          <button
            className={primaryCls}
            disabled={code.length !== 6 || busy}
            onClick={() => run(async () => { await verifyLoginCode(email, code); onSignedIn(); })}
          >
            {busy ? '확인 중…' : '로그인'}
          </button>
          <div className="flex justify-between text-sm">
            <button className="text-muted underline" onClick={() => { setSent(false); setCode(''); setError(''); }}>
              이메일 바꾸기
            </button>
            <button className="text-accent underline" disabled={busy} onClick={() => run(() => sendLoginCode(email))}>
              코드 다시 받기
            </button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
