import { useState } from 'react';
import { signIn, signUp } from '../../cloud/social';

const fieldCls =
  'w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent';
const primaryCls = 'w-full rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-50 active:opacity-90';

// 이메일과 비밀번호로 로그인한다. 메일 링크 방식은 아이폰 홈 화면 앱에서 Safari 쪽에만
// 로그인이 되어 쓸 수 없고, 6자리 코드는 메일 발송 서버를 따로 연결해야 보낼 수 있다.
export default function LoginPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordOk = password.length >= 6;
  const signingUp = mode === 'signUp';

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await (signingUp ? signUp(email, password) : signIn(email, password));
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제가 생겼어요. 다시 시도해 주세요.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
      <p className="text-lg font-bold">친구와 함께 공부하기</p>
      <p className="text-sm text-muted">
        같이 공부하는 사람들과 연속 일수와 공부 중인 자료를 서로 볼 수 있어요. 학습 자료와 진도는 올라가지 않아요.
      </p>

      <input
        aria-label="이메일"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        className={fieldCls}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@example.com"
      />
      <input
        aria-label="비밀번호"
        type="password"
        autoComplete={signingUp ? 'new-password' : 'current-password'}
        className={fieldCls}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={signingUp ? '비밀번호 (6자 이상)' : '비밀번호'}
      />

      <button className={primaryCls} disabled={!emailOk || !passwordOk || busy} onClick={submit}>
        {busy ? '잠시만요…' : signingUp ? '가입하고 시작하기' : '로그인'}
      </button>

      <button
        className="w-full text-sm text-muted underline"
        onClick={() => { setMode(signingUp ? 'signIn' : 'signUp'); setError(''); }}
      >
        {signingUp ? '이미 계정이 있어요' : '처음이에요 · 가입하기'}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}
      {signingUp && (
        <p className="text-xs text-muted">
          비밀번호를 잊으면 스스로 찾을 수 없으니, 쓰던 것 중 기억하기 쉬운 걸로 정하세요.
        </p>
      )}
    </div>
  );
}
