import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical, PanelRightOpen, Send } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ChatLoadingSkeleton } from '@/components/chat/ChatLoadingSkeleton';
import { ChatThread } from '@/components/chat/ChatThread';
import { EvidencePicker, EvidenceSheet } from '@/components/chat/EvidenceSidebar';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getMessagesThunk, getSessionThunk, sendMessageThunk, askListerThunk } from '@/store/chat/chat.thunk';
import {
  clearChatState,
  hydrateMessagesFromCache,
  toggleDebugStrip,
} from '@/store/chat/chat.slice';
import { getPropertiesThunk } from '@/store/properties/properties.thunk';
import { getPropertyByIdThunk } from '@/store/properties/properties.thunk';
import { findPropertyByFixtureKey, formatListingPrice, formatListingType } from '@/utils/helpers/propertyFormatters';
import type { EvidencePrompt } from '@/utils/helpers/evidencePrompts';
import type { IChatAction } from '@/store/types';
import { setActiveSessionId } from '@/store/demo/demo.slice';
import {
  CHAT_MESSAGES_DEFAULT_LIMIT,
  CHAT_MESSAGES_FETCH_INITIAL_KEY,
} from '@/store/chat/chat.types';

export function ChatPage(): React.ReactElement {
  const { propertyId = '' } = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pendingHandledRef = useRef(false);
  const session = useAppSelector((state) => state.chat.session);
  const messages = useAppSelector((state) => state.chat.messages);
  const messagesPagination = useAppSelector((state) => state.chat.messagesPagination);
  const sessionMessagesCache = useAppSelector((state) => state.chat.sessionMessagesCache);
  const lastTurn = useAppSelector((state) => state.chat.lastTurn);
  const sendLoading = useAppSelector((state) => state.chat.sendMessageLoading);
  const askListerLoading = useAppSelector((state) => state.chat.askListerLoading);
  const sendMessageError = useAppSelector((state) => state.chat.sendMessageError);
  const askListerError = useAppSelector((state) => state.chat.askListerError);
  const user = useAppSelector((state) => state.auth.user);
  const sessionLoading = useAppSelector((state) => state.chat.getSessionLoading);
  const messagesLoading = useAppSelector((state) => state.chat.getMessagesLoading);
  const loadingOlder = useAppSelector((state) => state.chat.getOlderMessagesLoading);
  const getSessionError = useAppSelector((state) => state.chat.getSessionError);
  const getMessagesError = useAppSelector((state) => state.chat.getMessagesError);
  const hasRequestedMessages = useAppSelector((state) => state.chat.hasRequestedMessages);
  const showDebugStrip = useAppSelector((state) => state.chat.showDebugStrip);
  const property = useAppSelector((state) => state.properties.property);
  const properties = useAppSelector((state) => state.properties.properties);
  const [draft, setDraft] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (propertyId.length === 0) return undefined;
    if (user?.role === 'LISTER') {
      navigate('/lister/questions', { replace: true });
      return undefined;
    }
    dispatch(clearChatState());
    dispatch(getPropertyByIdThunk({ propertyId }));
    dispatch(getSessionThunk({ propertyId }));
    if (properties.length === 0) {
      dispatch(getPropertiesThunk());
    }
    return () => {
      dispatch(clearChatState());
    };
  }, [dispatch, navigate, propertyId, properties.length, user?.role]);

  useEffect(() => {
    if (!session) return;

    const cached = sessionMessagesCache[session.id];
    const hasInitialCache = cached?.fetchedKeys.includes(CHAT_MESSAGES_FETCH_INITIAL_KEY);

    if (hasInitialCache) {
      dispatch(hydrateMessagesFromCache({ sessionId: session.id }));
      dispatch(setActiveSessionId(session.id));
      return;
    }

    if (hasRequestedMessages || messagesLoading) return;

    dispatch(
      getMessagesThunk({
        sessionId: session.id,
        limit: CHAT_MESSAGES_DEFAULT_LIMIT,
      }),
    );
    dispatch(setActiveSessionId(session.id));
  }, [
    dispatch,
    hasRequestedMessages,
    messagesLoading,
    session,
    sessionMessagesCache,
  ]);

  useEffect(() => {
    if (!session) return undefined;

    const refreshMessages = (): void => {
      dispatch(
        getMessagesThunk({
          sessionId: session.id,
          limit: CHAT_MESSAGES_DEFAULT_LIMIT,
          skipCache: true,
        }),
      );
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        refreshMessages();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dispatch, session]);

  const handleSend = useCallback(
    async (content: string): Promise<void> => {
      if (!session || content.trim().length === 0) return;
      setDraft('');
      await dispatch(sendMessageThunk({ sessionId: session.id, content: content.trim() }));
    },
    [dispatch, session],
  );

  const handleAskLister = useCallback(
    async (action: IChatAction): Promise<void> => {
      if (!session) return;

      const payloadQuestion =
        typeof action.payload?.questionText === 'string' ? action.payload.questionText : undefined;
      const lastUserMessage = [...messages].reverse().find((message) => message.role === 'USER');
      const questionText = payloadQuestion ?? lastUserMessage?.content ?? action.label;

      const attributesRaw = action.payload?.canonicalAttributes;
      const canonicalAttributes =
        typeof attributesRaw === 'string'
          ? attributesRaw.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
          : undefined;

      await dispatch(
        askListerThunk({
          sessionId: session.id,
          questionText,
          canonicalAttributes,
        }),
      );
    },
    [dispatch, messages, session],
  );

  const handleAction = useCallback(
    async (action: IChatAction): Promise<void> => {
      if (action.type === 'ask_lister') {
        await handleAskLister(action);
        return;
      }
      await handleSend(action.label);
    },
    [handleAskLister, handleSend],
  );

  const handleLoadOlder = useCallback(() => {
    if (!session || !messagesPagination?.oldestMessageId || loadingOlder) return;

    dispatch(
      getMessagesThunk({
        sessionId: session.id,
        before: messagesPagination.oldestMessageId,
        limit: CHAT_MESSAGES_DEFAULT_LIMIT,
      }),
    );
  }, [dispatch, loadingOlder, messagesPagination?.oldestMessageId, session]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleSend(draft);
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim().length > 0 && !sendLoading && !askListerLoading && !isChatLoading) {
        void handleSend(draft);
      }
    }
  };

  const handlePromptSelect = (prompt: EvidencePrompt): void => {
    const targetProperty = findPropertyByFixtureKey(properties, prompt.fixtureKey);
    if (targetProperty && targetProperty.id !== propertyId) {
      navigate(`/chat/${targetProperty.id}`, {
        state: { pendingMessage: prompt.message },
      });
      return;
    }
    void handleSend(prompt.message);
  };

  useEffect(() => {
    pendingHandledRef.current = false;
  }, [propertyId]);

  useEffect(() => {
    if (!session || sendLoading || pendingHandledRef.current) return;

    const pendingMessage = getPendingMessage(location.state);
    if (!pendingMessage) return;

    pendingHandledRef.current = true;
    void handleSend(pendingMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [handleSend, location.pathname, location.state, navigate, sendLoading, session]);

  const actionButtons = lastTurn?.actions ?? [];
  const isChatLoading = sessionLoading || messagesLoading;
  const hasMoreOlder = messagesPagination?.hasMoreOlder ?? false;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-light)] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to={property ? `/properties/${property.id}` : '/'}
            aria-label="Back to property"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] no-underline transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)] hover:no-underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          {property && (
            <h1 className="page-title-lg truncate">{property.title}</h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {property && (
            <>
              <Badge variant="ghost" status="neutral" size="xs">
                {formatListingType(property.listingType)}
              </Badge>
              <span className="text-[var(--text-md)] font-bold text-[var(--color-primary)]">
                {formatListingPrice(property)}
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
            aria-label="Try evidence prompt"
          >
            <PanelRightOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => dispatch(toggleDebugStrip())}
            aria-label="Toggle debug"
          >
            <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div
          className="flex min-h-[min(520px,calc(100vh-11rem))] max-h-[min(640px,calc(100vh-9rem))] flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-card)]"
        >
          {isChatLoading ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <ChatLoadingSkeleton />
            </div>
          ) : (
            <ChatThread
              messages={messages}
              isThinking={sendLoading || askListerLoading}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              onLoadOlder={handleLoadOlder}
            />
          )}

          {(getSessionError || getMessagesError || sendMessageError || askListerError) && (
            <div className="border-t border-[var(--color-border-light)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-error)]">
              {askListerError ?? sendMessageError ?? getMessagesError ?? getSessionError}
            </div>
          )}

          {actionButtons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-border-light)] px-3 py-2">
              {actionButtons.map((action) => (
                <ChatActionButton
                  key={`${action.type}-${action.label}`}
                  action={action}
                  disabled={sendLoading || askListerLoading}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2.5"
            onSubmit={handleSubmit}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Ask about this listing…"
              rows={1}
              disabled={isChatLoading || sendLoading}
              className="min-h-[36px] max-h-24 flex-1 resize-none rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-input-focus)]"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              iconOnly
              disabled={draft.trim().length === 0 || sendLoading || askListerLoading || isChatLoading}
              aria-label="Send message"
              className="shrink-0"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </form>
        </div>

        <aside className="hidden lg:block">
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-3 shadow-[var(--shadow-card)]">
            <EvidencePicker onSelectPrompt={handlePromptSelect} />
          </div>
        </aside>
      </div>

      {showDebugStrip && lastTurn && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-3">
          <p className="section-label !mb-2 !pb-2">Debug</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <DebugBlock title="Answer status" value={lastTurn.answer_status} />
            <DebugBlock title="Intents" value={lastTurn.debug.intents.join(', ') || 'None'} />
            <DebugBlock title="Attributes" value={lastTurn.debug.attributes.join(', ') || 'None'} />
            <DebugBlock title="Tools" value={lastTurn.debug.tools.join(', ') || 'None'} />
          </div>
        </div>
      )}

      <EvidenceSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSelectPrompt={handlePromptSelect} />
    </div>
  );
}

interface ChatActionButtonProps {
  action: IChatAction;
  disabled?: boolean;
  onAction: (action: IChatAction) => Promise<void>;
}

function ChatActionButton({ action, disabled = false, onAction }: ChatActionButtonProps): React.ReactElement {
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => {
        void onAction(action);
      }}
    >
      {action.label}
    </Button>
  );
}

interface DebugBlockProps {
  title: string;
  value: string;
}

function DebugBlock({ title, value }: DebugBlockProps): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] px-2.5 py-2">
      <p className="text-[var(--text-2xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {title}
      </p>
      <p className="mt-0.5 text-[var(--text-sm)] text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function getPendingMessage(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('pendingMessage' in state)) {
    return null;
  }
  const pendingMessage = state.pendingMessage;
  if (typeof pendingMessage !== 'string' || pendingMessage.length === 0) {
    return null;
  }
  return pendingMessage;
}
