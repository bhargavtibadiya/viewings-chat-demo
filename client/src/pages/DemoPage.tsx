import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Loader, Skeleton } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getTurnLogsThunk } from '@/store/demo/demo.thunk';
import { setActiveSessionId } from '@/store/demo/demo.slice';
import { getPropertiesThunk } from '@/store/properties/properties.thunk';
import { EVIDENCE_PROMPTS } from '@/utils/helpers/evidencePrompts';
import { findPropertyByFixtureKey } from '@/utils/helpers/propertyFormatters';
import type { ITurnToolCall } from '@/store/types';

export function DemoPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const turnLogs = useAppSelector((state) => state.demo.turnLogs);
  const activeSessionId = useAppSelector((state) => state.demo.activeSessionId);
  const loading = useAppSelector((state) => state.demo.getTurnLogsLoading);
  const properties = useAppSelector((state) => state.properties.properties);
  const hasRequestedProperties = useAppSelector((state) => state.properties.hasRequestedProperties);

  useEffect(() => {
    if (hasRequestedProperties) return;
    dispatch(getPropertiesThunk());
  }, [dispatch, hasRequestedProperties]);

  useEffect(() => {
    if (!activeSessionId) return;
    dispatch(getTurnLogsThunk({ sessionId: activeSessionId }));
  }, [activeSessionId, dispatch]);

  if (user?.role !== 'DEMO_ADMIN') {
    return (
      <Card>
        <p className="font-display text-2xl">Demo admin only</p>
        <p className="mt-2">Sign in as admin@viewings.demo to inspect turn logs and fixture jumps.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-[var(--color-text-muted)]">Demo control panel</p>
        <h1 className="mt-3">Turn logs and fixtures</h1>
        <p className="mt-2 max-w-3xl">
          Inspect the latest assistant turn metadata after chatting. Active session id comes from the most recent chat page visit.
        </p>
      </div>

      <Card className="space-y-3">
        <p className="section-label">Session</p>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          Active session: {activeSessionId ?? 'Open a chat page to set the active session'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!activeSessionId}
            onClick={() => {
              if (activeSessionId) {
                dispatch(getTurnLogsThunk({ sessionId: activeSessionId }));
              }
            }}
          >
            Refresh turn logs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(setActiveSessionId(null))}
          >
            Clear active session
          </Button>
        </div>
      </Card>

      <Card>
        <p className="section-label">Fixture jumps</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {EVIDENCE_PROMPTS.filter((prompt) => prompt.fixtureKey !== null).map((prompt) => {
            const property = findPropertyByFixtureKey(properties, prompt.fixtureKey);
            return (
              <div
                key={prompt.id}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] p-4"
              >
                <Badge variant="ghost" status="neutral" size="sm">
                  {prompt.id}
                </Badge>
                <p className="mt-2 text-[var(--color-text-primary)]">{prompt.label}</p>
                <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
                  Fixture: {prompt.fixtureKey}
                </p>
                {property ? (
                  <Link
                    to={`/chat/${property.id}`}
                    className="mt-3 inline-block text-[var(--text-sm)] font-semibold uppercase tracking-[0.08em] no-underline"
                  >
                    Open chat
                  </Link>
                ) : (
                  <p className="mt-3 text-[var(--text-sm)] text-[var(--color-warning)]">
                    Matching property not loaded yet
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="section-label">Latest turn logs</p>
        {loading && <Skeleton lines={3} />}
        {!loading && turnLogs.length === 0 && (
          <p className="text-[var(--color-text-muted)]">No turn logs returned for the active session.</p>
        )}
        {!loading && turnLogs.length > 0 && (
          <div className="space-y-3">
            {turnLogs.map((turn) => (
              <div
                key={turn.id}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solid" status="info" size="sm">
                    {turn.answerStatus}
                  </Badge>
                  <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                    {turn.latencyMs} ms
                  </span>
                </div>
                <p className="mt-2 text-[var(--text-sm)]">
                  Intents: {turn.intents.join(', ') || 'None'}
                </p>
                <p className="text-[var(--text-sm)]">
                  Attributes: {turn.attributes.join(', ') || 'None'}
                </p>
                <p className="text-[var(--text-sm)]">
                  Tools: {formatTurnTools(turn.toolsCalled)}
                </p>
                <p className="text-[var(--text-sm)]">CTA: {turn.cta ?? 'None'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {loading && <Loader label="Loading turn logs" />}
    </div>
  );
}

function formatTurnTools(tools: ITurnToolCall[]): string {
  if (tools.length === 0) {
    return 'None';
  }
  return tools.map((tool) => tool.name).join(', ');
}
