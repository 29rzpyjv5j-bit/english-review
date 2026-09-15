import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { buildSession, type Exercise } from './buildSession';
import { loadProgress, saveProgress, clearProgress } from './progress';
import { sttSupported } from '../../speech/stt';
import { stopSpeaking } from '../../speech/tts';
import { inReview } from '../../lib/review';
import { mostStudiedDeck } from '../../lib/friends';
import { publishStudy } from '../../cloud/social';
import { cloudConfigured } from '../../cloud/client';
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

  const decks = useStore((s) => s.decks);
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const recordWord = useStore((s) => s.recordWord);
  const recordSentence = useStore((s) => s.recordSentence);
  const completeSession = useStore((s) => s.completeSession);
  const quiet = useStore((s) => s.quiet);

  const today = todayStr();
  const mode = isReview ? 'review' : 'normal';
  // 세션 시작 시 1회만 읽는다. 이후 저장으로 이 값이 바뀌어도 문제 구성은 그대로 둔다.
  const [restored] = useState(() => loadProgress(today, mode));

  // 문제 구성은 세션을 시작할 때 한 번만 정한다. 답할 때마다 단어 기록이 바뀌므로
  // 그 기록에 맞춰 다시 만들면 풀던 도중에 문제 순서가 뒤바뀐다.
  const [exercises] = useState<Exercise[]>(() => {
    if (restored) return restored.exercises;
    const pool = isReview
      ? { words: words.filter(inReview), sentences: sentences.filter(inReview) }
      : { words, sentences };
    return buildSession(pool.words, pool.sentences, today, { sttSupported: sttSupported(), quiet });
  });

  const [index, setIndex] = useState(restored?.index ?? 0);
  // 문제를 넘기기 전에 앞 문제의 음성을 끊는다. 카드마다 스스로 읽어주지는 않아서
  // (보기를 고르는 문제, 짝 맞추기 등) 그대로 두면 앞 문장이 다음 화면에서 계속 들린다.
  // 이 정리는 다음 카드가 읽기 시작하기 전에 실행된다.
  useEffect(() => () => stopSpeaking(), [index]);
  const [correctCount, setCorrectCount] = useState(restored?.correctCount ?? 0);
  const [wrongItems, setWrongItems] = useState<{ id: string; text: string }[]>(restored?.wrongItems ?? []);
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
    const nextCorrect = correctCount + (correct ? 1 : 0);
    let nextWrong = wrongItems;
    if (ex.kind === 'mcq' || ex.kind === 'speakWord') {
      await recordWord(ex.wordId, correct, isReview);
      if (!correct) {
        const text = ex.kind === 'mcq' ? ex.prompt : ex.english;
        nextWrong = [...wrongItems, { id: ex.wordId, text }];
      }
    } else if (ex.kind === 'repeatSentence' || ex.kind === 'dictation' || ex.kind === 'writeSentence') {
      await recordSentence(ex.sentenceId, correct, isReview);
      if (!correct) nextWrong = [...wrongItems, { id: ex.sentenceId, text: ex.text }];
    }
    // matching 카드는 내부에서 개별 record 처리(아래 카드 구현)
    setCorrectCount(nextCorrect);
    setWrongItems(nextWrong);

    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      const result = await completeSession(nextCorrect, exercises.length);
      setGained(result.gained);
      if (cloudConfigured()) {
        const { streakCount, lastStudyDate } = useStore.getState().profile;
        // 기다리지 않는다. 결과 화면은 인터넷과 상관없이 바로 떠야 한다.
        void publishStudy({ streakCount, lastStudyDate, studying: mostStudiedDeck(exercises, words, sentences, decks) });
      }
      clearProgress();
      setFinished(true);
    } else {
      setIndex(nextIndex);
      saveProgress({ date: today, mode, exercises, index: nextIndex, correctCount: nextCorrect, wrongItems: nextWrong });
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
