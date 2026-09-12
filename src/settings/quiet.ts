// 무음 학습(말하기 대신 쓰기) 설정. 기기별 취향이라 이 브라우저의 localStorage에만 둔다.
const STORAGE_KEY = 'quiet_mode';

export function getQuietMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setQuietMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage 사용 불가 환경에서는 무시 */
  }
}
