import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { buildSession, type Exercise } from './buildSession';
import { sttSupported } from '../../speech/stt';
import { todayStr } from '../../lib/dateUtils';
import ProgressBar from '../../components/ProgressBar';
import ResultScreen from './ResultScreen';
import McqCard from '../exercises/McqCard';
import MatchingCard from '../exercises/MatchingCard';
import SpeakWordCard from '../exercises/SpeakWordCard';
import RepeatSentenceCard from '../exercises/RepeatSentenceCard';
import DictationCard from '../exercises/DictationCard';

export default function SessionPage() {
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const recordWord = useStore((s) => s.recordWord);
  const recordSentence = useStore((s) => s.recordSentence);
  const completeSession = useStore((s) => s.completeSession);

  const exercises = useMemo<Exercise[]>(
    () => buildSession(words, sentences, todayStr(), { sttSupported: sttSupported() }),
    // 세션 시작 시 1회만 구성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [gained, setGained] = useState(0);

  if (exercises.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <p>학습할 항목이 없어요. 먼저 자료를 추가해 주세요.</p>
      </div>
    );
  }

  async function handleDone(ex: Exercise, correct: boolean) {
    // record + tallies
    if (correct) setCorrectCount((c) => c + 1);
    if (ex.kind === 'mcq' || ex.kind === 'speakWord') {
      await recordWord(ex.wordId, correct);
      if (!correct) setWrongItems((w) => [...w, ex.kind === 'mcq' ? ex.prompt : ex.english]);
    } else if (ex.kind === 'repeatSentence' || ex.kind === 'dictation') {
      await recordSentence(ex.sentenceId, correct);
      if (!correct) setWrongItems((w) => [...w, ex.text]);
    }
    // matching 카드는 내부에서 개별 record 처리(아래 카드 구현)

    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      const total = exercises.length;
      const result = await completeSession(correctCount + (correct ? 1 : 0), total);
      setGained(result.gained);
      setFinished(true);
    } else {
      setIndex(nextIndex);
    }
  }

  if (finished) {
    return <ResultScreen correct={correctCount} total={exercises.length} gained={gained} wrongItems={wrongItems} />;
  }

  const ex = exercises[index];
  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <ProgressBar value={index} max={exercises.length} />
      {ex.kind === 'matching' && <MatchingCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'mcq' && <McqCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'speakWord' && <SpeakWordCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'repeatSentence' && <RepeatSentenceCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
      {ex.kind === 'dictation' && <DictationCard ex={ex} onDone={(c) => handleDone(ex, c)} />}
    </div>
  );
}
