import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// HashRouter: 정적 호스팅(GitHub Pages)에서 새로고침·딥링크가 404 없이 동작한다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

// 홈 화면 앱은 껐다 켜도 새 주소로 이동하지 않아, 서비스워커가 새 버전을 확인할 일이
// 없다. 앱을 열 때와 다시 앞으로 가져올 때 직접 확인시킨다(autoUpdate 가 나머지를 한다).
function checkForUpdate() {
  navigator.serviceWorker?.getRegistration().then((r) => r?.update());
}
checkForUpdate();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});
