import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isReview = searchParams.get('mode') === 'review';

  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const wrongItemsToday = useStore((s) => s.wrongItemsToday);
  const clearWrongItemsToday = useStore((s) => s.clearWrongItemsToday);
  const recordWord = useStore((s) => s.recordWord);
  const recordSentence = useStore((s) => s.recordSentence);
  const completeSession = useStore((s) => s.completeSession);
  const quiet = useStore((s) => s.quiet);

  const exercises = useMemo<Exercise[]>(() => {
    if (isReview && wrongItemsToday.size === 0) {
      return [];
    }

    let reviewWords = words;
    let reviewSentences = sentences;

    // review 모드: 틀린 항목만 필터링
    if (isReview) {
      reviewWords = words.filter((w) => wrongItemsToday.has(w.id));
      reviewSentences = sentences.filter((s) => wrongItemsToday.has(s.id));
    }

    return buildSession(reviewWords, reviewSentences, todayStr(), { sttSupported: sttSupported(), quiet });
    // 세션 시작 시 1회만 구성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReview, words, sentences, wrongItemsToday]);

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<{ id: string; text: string }[]>([]);
  const [finished, setFinished] = useState(false);
  const [gained, setGained] = useState(0);

  if (exercises.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <p>
          {isReview
            ? '복습할 항목이 없어요. 먼저 학습을 진행해 주세요.'
            : '학습할 항목이 없어요. 먼저 자료를 추가해 주세요.'}
        </p>
        <button
          className="mx-auto rounded-xl border border-line bg-surface px-6 py-2 text-sm active:opacity-90"
          onClick={() => navigate('/')}
        >
          홈으로
        </button>
      </div>
    );
  }

  async function handleDone(ex: Exercise, correct: boolean) {
    // record + tallies
    if (correct) setCorrectCount((c) => c + 1);
    if (ex.kind === 'mcq' || ex.kind === 'speakWord') {
      await recordWord(ex.wordId, correct);
      if (!correct) {
        const text = ex.kind === 'mcq' ? ex.prompt : ex.english;
        setWrongItems((w) => [...w, { id: ex.wordId, text }]);
      }
    } else if (ex.kind === 'repeatSentence' || ex.kind === 'dictation' || ex.kind === 'writeSentence') {
      await recordSentence(ex.sentenceId, correct);
      if (!correct) setWrongItems((w) => [...w, { id: ex.sentenceId, text: ex.text }]);
    }
    // matching 카드는 내부에서 개별 record 처리(아래 카드 구현)

    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      const total = exercises.length;
      const result = await completeSession(correctCount + (correct ? 1 : 0), total);
      setGained(result.gained);
      // review 모드에서는 완료 후 wrongItemsToday 초기화
      if (isReview) clearWrongItemsToday();
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
      {isReview && <p className="text-sm font-medium text-muted">틀린 항목 복습</p>}
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
