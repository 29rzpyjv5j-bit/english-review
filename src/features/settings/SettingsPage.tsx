import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import StatusBar from '../../components/StatusBar';
import { Chevron } from '../../components/icons';
import { exportData, importData, type BackupData } from '../../db/backup';

export default function SettingsPage() {
  const decks = useStore((s) => s.decks);
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const load = useStore((s) => s.load);
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState('');
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const countFor = (deckId: string) => ({
    w: words.filter((w) => w.deckId === deckId).length,
    s: sentences.filter((s) => s.deckId === deckId).length,
  });

  async function onExport() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `영어복습-백업-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (window.confirm('현재 자료를 이 백업으로 교체할까요? (기존 덱은 삭제되고, 연속·보석은 합쳐집니다)')) {
        await importData(data);
        await load();
        setBackupMsg('가져오기 완료 ✓');
      }
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : '가져오기에 실패했어요.');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5">
      <StatusBar />

      <button
        onClick={() => setMaterialsOpen(!materialsOpen)}
        className="w-full flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-left active:opacity-90"
      >
        <span className="text-sm font-medium">내 자료</span>
        <span className="text-xs text-muted tabular-nums">{decks.length}개</span>
        <Chevron className={`w-4 h-4 ml-auto text-muted transition-transform ${materialsOpen ? 'rotate-90' : ''}`} />
      </button>

      {materialsOpen && (
        <div className="space-y-3 pl-2">
          <ul className="space-y-2">
            {decks.length === 0 && <li className="text-muted text-sm px-1">아직 자료가 없어요.</li>}
            {decks.map((d) => {
              const c = countFor(d.id);
              return (
                <li key={d.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted tabular-nums shrink-0 ml-3">단어 {c.w} · 문장 {c.s}</p>
                </li>
              );
            })}
          </ul>

          <a
            href="/#/add"
            className="block text-center rounded-xl border border-dashed border-line py-3 text-sm text-muted active:opacity-90"
          >
            + 자료 추가
          </a>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">백업 · 기기 옮기기</h3>
        <div className="flex gap-2">
          <button onClick={onExport} className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm active:opacity-90">
            내보내기
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm active:opacity-90">
            가져오기
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        {backupMsg && <p className="text-xs text-accent">{backupMsg}</p>}
        <p className="text-xs text-muted">다른 기기에서 쓰려면: 여기서 내보내기 → 그 기기에서 가져오기.</p>
      </div>
    </div>
  );
}
