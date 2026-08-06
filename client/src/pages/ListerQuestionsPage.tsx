import { type FormEvent, useEffect, useState } from 'react';
import { Badge, Button, Card, Loader, Skeleton, Textarea } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { answerQuestionThunk, getQuestionsThunk } from '@/store/lister/lister.thunk';
import { useToast } from '@/components/ui';
import type { IListerQuestion } from '@/store/types';

/**
 * Lists escalated questions for listers and demo administrators.
 *
 * @returns The lister-question route content or an access notice
 */
export function ListerQuestionsPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const questions = useAppSelector((state) => state.lister.questions);
  const loading = useAppSelector((state) => state.lister.getQuestionsLoading);
  const hasRequested = useAppSelector((state) => state.lister.hasRequestedQuestions);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    // [WHY] avoid duplicating the inbox request while its cached result remains current.
    if (hasRequested || loading) return;
    dispatch(getQuestionsThunk());
  }, [dispatch, hasRequested, loading]);

  if (user?.role !== 'LISTER' && user?.role !== 'DEMO_ADMIN') {
    return (
      <Card>
        <p className="font-display text-2xl">Lister access only</p>
        <p className="mt-2">Sign in as lister@viewings.demo to answer escalated questions.</p>
      </Card>
    );
  }

  const openQuestions = questions.filter((question) => question.status === 'OPEN');
  const answeredQuestions = questions.filter((question) => question.status === 'ANSWERED');

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-[var(--color-text-muted)]">Lister inbox</p>
        <h1 className="mt-3">Unanswered questions</h1>
        <p className="mt-2 max-w-2xl">
          Review seeker questions the assistant could not ground, then publish approved answers.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton variant="custom" height="120px" />
          <Skeleton variant="custom" height="120px" />
        </div>
      )}

      {!loading && questions.length === 0 && (
        <Card>
          <p>No questions in the inbox yet.</p>
          <Button className="mt-4" onClick={() => dispatch(getQuestionsThunk())}>
            Refresh
          </Button>
        </Card>
      )}

      {openQuestions.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl not-italic">Open</h2>
          {openQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </section>
      )}

      {answeredQuestions.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl not-italic">Answered</h2>
          {answeredQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} readOnly />
          ))}
        </section>
      )}

      {loading && hasRequested && <Loader label="Loading inbox" />}
    </div>
  );
}

interface QuestionCardProps {
  question: IListerQuestion;
  readOnly?: boolean;
}

/**
 * Renders an escalated question and, when editable, publishes an approved answer.
 *
 * @param props - Question data and whether its answer is read-only
 * @returns The question card
 */
function QuestionCard({ question, readOnly = false }: QuestionCardProps): React.ReactElement {
  const dispatch = useAppDispatch();
  const answerLoading = useAppSelector((state) => state.lister.answerQuestionLoading);
  const { show } = useToast();
  const [answerText, setAnswerText] = useState('');

  /**
   * Publishes the trimmed answer and clears the form after success.
   *
   * @param event - Native form submission event
   * @returns A promise that settles after the answer request completes
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = await dispatch(
      answerQuestionThunk({ questionId: question.id, answerText: answerText.trim() }),
    );
    if (answerQuestionThunk.fulfilled.match(result)) {
      show({
        title: 'Answer published',
        description: 'Session memory and approved answers will update on the next chat turn.',
        variant: 'success',
      });
      setAnswerText('');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="solid" status={question.status === 'OPEN' ? 'warning' : 'success'}>
          {question.status}
        </Badge>
        <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
          {question.property?.title ?? question.propertyId}
        </span>
      </div>
      <p className="font-display text-xl not-italic text-[var(--color-text-primary)]">
        {question.questionText}
      </p>
      {readOnly && question.answerText && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Approved answer
          </p>
          <p className="mt-2">{question.answerText}</p>
        </div>
      )}
      {!readOnly && (
        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <Textarea
            label="Your answer"
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="Write a grounded answer seekers can reuse..."
            required
          />
          <Button type="submit" loading={answerLoading} disabled={answerText.trim().length === 0}>
            Publish answer
          </Button>
        </form>
      )}
    </Card>
  );
}
