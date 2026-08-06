import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PanelRightOpen, Send } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ChatLoadingSkeleton } from '@/components/chat/ChatLoadingSkeleton';
import { ChatThread } from '@/components/chat/ChatThread';
import { EvidencePicker, EvidenceSheet } from '@/components/chat/EvidenceSidebar';
import { useAppDispatch, useAppSelector } from '@/store/store';
import {
  getMessagesThunk,
  getSessionThunk,
  sendMessageThunk,
  bookSlotThunk,
} from '@/store/chat/chat.thunk';
import {
  clearChatState,
  hydrateMessagesFromCache,
} from '@/store/chat/chat.slice';
import { getPropertiesThunk } from '@/store/properties/properties.thunk';
import { getPropertyByIdThunk } from '@/store/properties/properties.thunk';
import { formatListingPrice, formatListingType } from '@/utils/helpers/propertyFormatters';
import type { EvidencePrompt } from '@/utils/helpers/evidencePrompts';
import { setActiveSessionId } from '@/store/demo/demo.slice';
import {
  CHAT_MESSAGES_DEFAULT_LIMIT,
  CHAT_MESSAGES_FETCH_INITIAL_KEY,
} from '@/store/chat/chat.types';

/**
 * Hosts a property's AI chat session, message history, and evidence prompts.
 *
 * @returns The property-chat route content
 */
export function ChatPage(): React.ReactElement {
  const { propertyId = '' } = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pendingHandledRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const session = useAppSelector((state) => state.chat.session);
  const messages = useAppSelector((state) => state.chat.messages);
  const messagesPagination = useAppSelector((state) => state.chat.messagesPagination);
  const sessionMessagesCache = useAppSelector((state) => state.chat.sessionMessagesCache);
  const lastTurn = useAppSelector((state) => state.chat.lastTurn);
  const sendLoading = useAppSelector((state) => state.chat.sendMessageLoading);
  const askListerLoading = useAppSelector((state) => state.chat.askListerLoading);
  const bookSlotLoading = useAppSelector((state) => state.chat.bookSlotLoading);
  const bookSlotId = useAppSelector((state) => state.chat.bookSlotId);
  const sendMessageError = useAppSelector((state) => state.chat.sendMessageError);
  const askListerError = useAppSelector((state) => state.chat.askListerError);
  const bookSlotError = useAppSelector((state) => state.chat.bookSlotError);
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

  // ============================================================================
  // CHAT SESSION LIFECYCLE
  // Loads and clears property-specific state as the active route changes
  // ============================================================================

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
    const cachedHasMessages = (cached?.messages?.length ?? 0) > 0;

    // [WHY] a populated initial cache can render immediately without another network request.
    if (hasInitialCache && cachedHasMessages) {
      dispatch(hydrateMessagesFromCache({ sessionId: session.id }));
      dispatch(setActiveSessionId(session.id));
      return;
    }

    if (hasRequestedMessages || messagesLoading) return;

    dispatch(
      getMessagesThunk({
        sessionId: session.id,
        limit: CHAT_MESSAGES_DEFAULT_LIMIT,
        skipCache: !cachedHasMessages && hasInitialCache,
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

  // ============================================================================
  // CHAT INTERACTIONS
  // Coordinates sending, pagination, booking, and draft input behavior
  // ============================================================================

  /**
   * Sends a non-empty message to the session for the property in the current route.
   *
   * @param content - Draft or prompt text to submit
   * @returns A promise that settles after the message request or session refresh completes
   */
  const handleSend = useCallback(
    async (content: string): Promise<void> => {
      if (!session || content.trim().length === 0) return;
      if (session.propertyId !== propertyId) {
        // [WARN] never send through a session that belongs to a previously viewed property.
        await dispatch(getSessionThunk({ propertyId }));
        return;
      }
      setDraft('');
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = '';
          textareaRef.current.focus();
        }
      });
      await dispatch(sendMessageThunk({ sessionId: session.id, content: content.trim() }));
      textareaRef.current?.focus();
    },
    [dispatch, propertyId, session],
  );

  /**
   * Requests the next older page when the loaded history exposes a cursor.
   *
   * @returns No value; dispatches only when an older page is available
   */
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

  /**
   * Books a suggested slot unless another turn or booking request is active.
   *
   * @param slotId - Availability slot selected by the user
   * @param label - Human-readable slot label retained with the booking action
   * @returns No value; dispatches only when the session is ready
   */
  const handleBookSlot = useCallback(
    (slotId: string, label: string): void => {
      if (!session || bookSlotLoading || sendLoading || askListerLoading) return;
      void dispatch(
        bookSlotThunk({
          sessionId: session.id,
          slotId,
          label,
        }),
      );
    },
    [askListerLoading, bookSlotLoading, dispatch, sendLoading, session],
  );

  /**
   * Prevents native form navigation and submits the current draft.
   *
   * @param event - Native chat form submission event
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleSend(draft);
  };

  const isChatLoading = sessionLoading || messagesLoading;
  const isBusy = sendLoading || askListerLoading || bookSlotLoading;

  /**
   * Sends on Enter while preserving Shift+Enter for multiline drafts.
   *
   * @param event - Keyboard event from the message textarea
   */
  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim().length > 0 && !isBusy && !isChatLoading) {
        void handleSend(draft);
      }
    }
  };

  /**
   * Submits an evidence prompt as a normal message for the active property.
   *
   * @param prompt - Prompt selected from the evidence controls
   */
  const handlePromptSelect = (prompt: EvidencePrompt): void => {
    // [WHY] fixture keys only support the demo panel; chat sends the prompt text unchanged.
    if (!prompt.message.trim()) return;
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
            aria-label="Open demo cases"
          >
            <PanelRightOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
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
              isThinking={isBusy}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              onLoadOlder={handleLoadOlder}
              bookingSlotId={bookSlotId}
              onBookSlot={handleBookSlot}
            />
          )}

          {(getSessionError || getMessagesError || sendMessageError || askListerError || bookSlotError) && (
            <div className="border-t border-[var(--color-border-light)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-error)]">
              {bookSlotError ?? askListerError ?? sendMessageError ?? getMessagesError ?? getSessionError}
            </div>
          )}

          <form
            className="flex items-end gap-2 border-t border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2.5"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                const el = event.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
              }}
              onKeyDown={handleDraftKeyDown}
              placeholder="Ask about this listing… (Shift+Enter for new line)"
              rows={2}
              disabled={isChatLoading}
              className="min-h-[52px] max-h-36 flex-1 resize-none overflow-y-auto rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3 py-2 text-[var(--text-sm)] leading-5 text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-input-focus)]"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              iconOnly
              disabled={draft.trim().length === 0 || isBusy || isChatLoading}
              aria-label="Send message"
              className="mb-0.5 shrink-0"
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

interface DebugBlockProps {
  title: string;
  value: string;
}

/**
 * Renders one value in the optional chat debug strip.
 *
 * @param props - Debug label and its rendered value
 * @returns A compact debug summary block
 */
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

/**
 * Extracts a route-carried draft message only when it has the expected shape.
 *
 * @param state - Untrusted router location state
 * @returns A pending message, or null when route state does not provide one
 */
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
