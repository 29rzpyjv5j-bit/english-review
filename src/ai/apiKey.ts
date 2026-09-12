// Claude API 키는 이 브라우저의 localStorage 에만 저장한다(서버로 보내지 않음).
const STORAGE_KEY = 'claude_api_key';

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setApiKey(value: string): void {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage 사용 불가 환경에서는 무시 */
  }
}
