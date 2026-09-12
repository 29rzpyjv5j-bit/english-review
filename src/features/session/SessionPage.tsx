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
import WriteSentenceCard from '../exercises/WriteSentenceCard';

export default function SessionPage() {
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const recordWord = useStore((s) => s.recordWord);
  const recordSentence = useStore((s) => s.recordSentence);
  const completeSession = useStore((s) => s.completeSession);
  const quiet = useStore((s) => s.quiet);

  const exercises = useMemo<Exercise[]>(
    () => buildSession(words, sentences, todayStr(), { sttSupported: sttSupported(), quiet }),
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
    } else if (ex.kind === 'repeatSentence' || ex.kind === 'dictation' || ex.kind === 'writeSentence') {
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
  // 진행바는 위에 고정하고, 카드는 남은 공간의 세로 중앙에 둔다(폰에서 누르기 쉬운 위치).
  return (
    <div className="max-w-md mx-auto p-4 min-h-[calc(100dvh-env(safe-area-inset-top)-2rem)] flex flex-col gap-6">
      <ProgressBar value={index} max={exercises.length} />
      <div className="flex-1 flex flex-col justify-center pb-8">
        {ex.kind === 'matching' && <MatchingCard key={index} ex={ex} onDone={(c) => handleDone(ex, c)} />}
        {ex.kind === 'mcq' && <McqCard key={index} ex={ex} onDone={(c) => handleDone(ex, c)} />}
        {ex.kind === 'speakWord' && <SpeakWordCard key={index} ex={ex} onDone={(c) => handleDone(ex, c)} />}
        {ex.kind === 'repeatSentence' && <RepeatSentenceCard key={index} ex={ex} onDone={(c) => handleDone(ex, c)} />}
        {ex.kind === 'dictation' && <DictationCard key={index} ex={ex} onDone={(c) => handleDone(ex, c)} />}
        {ex.kind === 'writeSentence' && (
          <WriteSentenceCard key={index} text={ex.text} translation={ex.translation} onDone={(c) => handleDone(ex, c)} />
        )}
      </div>
    </div>
  );
}
