export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,!?;:'"""''()\[\]{}\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
