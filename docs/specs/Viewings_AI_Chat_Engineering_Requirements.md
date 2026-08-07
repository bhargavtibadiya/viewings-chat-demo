# Viewings AI Chat — Engineering Requirements

**Source:** `Viewings_AI_Chat_Product_Behaviour_and_Technical_Build_Specification_v2` (version 2.0, 6 August 2026)  
**Purpose:** Developer-facing implementation, QA, and release baseline.  
**Status:** Derived requirements. Source specification remains the product authority.

## 1. What must be built

Build one provider-neutral AI-assisted property platform that uses the same conversational system across three explicitly scoped surfaces:

| Surface | Required context | User outcome | Main actions |
|---|---|---|---|
| Listing AI | `property_id`, `listing_type`, `agent_id` | Get verified answers about one listing and take listing actions | View times, book/cancel, save, ask agent, enquire/apply |
| Agent AI | `agent_id`, office/brand scope | Get approved information about a selected agent or their services | View listings, view services, callback, message |
| Global Viewings AI | Search scope and session preferences | Find, refine, compare, save, and plan viewings | Search, refine, compare, save alert, route-plan, open listing |
| Human messaging | `agent_id`, optional `property_id`, `thread_id` | Send a real request to a human | Send message, submit callback, view delivery status |

This is **not** a generic chatbot. It is a grounded assistant for property discovery, listing questions, viewing actions, agent information, and human escalation.

### Product intent

Home seekers must be able to ask naturally, receive fast, accurate and appropriately qualified answers, then take a real next action. Agents must receive fewer repetitive questions and better-contextualised human enquiries. Viewings must be able to audit the answer source, action result, conversion, latency, and cost.

### Mandatory design outcome

The system must combine:

1. Structured listing and agent data as factual truth.
2. Deterministic APIs/tools for live data and real actions.
3. An LLM for language understanding, follow-up interpretation, and concise response composition only where needed.
4. Approved reusable FAQs, with source dependencies and expiry.
5. Human escalation when a verified answer is unavailable or human judgement is needed.
6. Trace-level analytics, spend controls, and provider-neutral model routing.

## 2. Product rules that override implementation convenience

### P0 rules

- Do not state any property, agent, availability, or action fact unless it is backed by an approved source or successful tool result.
- Do not confirm a booking, cancellation, message, callback, save, or alert until the corresponding tool reports success.
- Answer the user’s current question before showing a CTA. Show at most two relevant CTAs.
- Use semantic intent/attribute extraction for free text; do not treat regex or keyword matching as the primary natural-language engine.
- Keep listing, agent, user, and surface scope isolated. Do not leak or merge data across listings or agents.
- Treat an unknown fact as a valid outcome. State what is known, what is not confirmed, and offer a real escalation route when useful.
- Apply listing type before answering policy-related questions. Rental rules must not be applied to sale listings.
- Make AI-generated content and messages from a human agent visibly distinct in UI and response metadata.
- Resolve relative dates deterministically in `Pacific/Auckland`, unless the user explicitly selects another timezone.
- Never let the LLM directly execute an action or perform authoritative financial arithmetic.

### Explicit non-goals

- A regex branch for every wording variation.
- RAG as a substitute for live price, listing status, availability, booking, or contact APIs.
- Inventing neighbourhood, legal, financial, accessibility, suitability, or property facts.
- Calling an LLM for chat-open events, card rendering, button clicks, selected slots, or other already explicit actions.
- Locking to a model provider before comparative QA and cost testing.
- Using aggressive booking/contact CTAs before resolving a suitability or safety question.

## 3. Required architecture

```text
User surface
  -> Context envelope (surface, IDs, timezone, session, UI action metadata)
  -> Deterministic router
       -> Direct facts / approved FAQ / calculation / action tool (zero LLM), or
       -> Model router -> LLM intent extraction -> validated tool calls
  -> Source/tool layer
  -> Validation gate
  -> Response composer (answer + 0–2 contextual CTAs)
  -> UI + trace/analytics

External session state and approved FAQs support all steps.
Human escalation is an explicit outcome, not a failed response.
```

### Component requirements

| Component | Must do | Must not do |
|---|---|---|
| Frontend/context envelope | Send surface, scope IDs, session ID, timezone, user state, and explicit UI action metadata; render statuses and CTAs | Guess facts, locally confirm actions, omit scope IDs |
| Deterministic router | Detect buttons, selected slots, fixed commands, direct fields, calculations, and valid FAQ hits | Use keyword matching as the primary free-text semantic router |
| Session/FAQ store | Maintain compact conversation state and approved answers; invalidate on data changes | Promote previous model output to truth automatically |
| Model router | Choose default or fallback model based on validated complexity/policy rules | Send every request to the largest/most expensive model |
| LLM orchestrator | Extract intent/entities, propose permitted tool calls, compose grounded concise copy | Invent facts, bypass validation, execute actions, expand scope |
| Tool/source layer | Return verified, scoped, time-stamped facts and action outcomes | Return stale or cross-scope data without identifiers/freshness |
| Validation gate | Validate schema, scope, listing type, source traces, action success, privacy, and policy | Permit a fluent response to bypass factual checks |
| Analytics/cost layer | Log routes, tools, sources, tokens, latency, errors, CTAs, actions, conversion | Aggregate away data needed to investigate bad answers or high cost |

## 4. Context, scope, and data contracts

### Required request context

Every server request must carry a validated context envelope. Minimum fields:

```ts
type ChatContext = {
  session_id: string;
  user_id?: string;
  surface: "LISTING" | "AGENT" | "GLOBAL" | "HUMAN_MESSAGE";
  property_id?: string;
  agent_id?: string;
  listing_type?: "RENTAL" | "SALE" | "PRIVATE";
  timezone: string; // default Pacific/Auckland
  locale?: string;
  action_metadata?: { type: string; value?: string }; // signed/validated UI action
  trace_id: string;
};
```

### Scope requirements

- **SCOPE-001 (P0):** Every Listing AI request includes `property_id` and `listing_type`; retrieval is restricted to that property unless the user explicitly initiates comparison/search elsewhere.
- **SCOPE-002 (P0):** Agent AI uses only the selected agent’s approved profile, public services, availability, and permitted listings.
- **SCOPE-003 (P0):** UI and metadata identify whether content was produced by AI or delivered by a human.
- All tool results must include scope identifiers; the caller must reject mismatches.
- Cross-surface moves must deliberately carry only relevant context: e.g. global search filters into Listing AI, or a listing ID plus unresolved question into the human-message flow.

### External session state

Persist compact state outside the LLM. Do not resend full transcripts by default.

```ts
type ChatState = {
  session_id: string;
  user_id?: string;
  surface: "LISTING" | "AGENT" | "GLOBAL";
  property_id?: string;
  agent_id?: string;
  listing_type?: string;
  active_search_filters?: object;
  compared_listing_ids: string[];
  last_intent?: string;
  last_entities?: object;
  unresolved_question?: string;
  selected_viewing_date?: string;
  selected_slot_id?: string;
  contact_status?: string;
  consent_status?: string;
  summary?: string;
  recent_relevant_turns: object[];
  locale?: string;
  timezone: "Pacific/Auckland";
};
```

Context behaviours:

- Resolve pronouns such as “it”, “that one”, and “what about the cat?” from the active scope and latest relevant intent.
- On intent change, stop pushing the prior flow.
- Preserve active search filters during refinement; do not ask again for facts already in state.
- Summarise resolved long conversations and retain only relevant recent turns, tool results, and unresolved state.

### Canonical factual data

At minimum, implement and govern these listing fields:

- Identity/status: property/listing ID, listing type, active status, source, `updated_at`.
- Location: address, suburb/city/region, coordinates.
- Commercial: weekly rent/sale price, bond, move-in-cost components, available-from.
- Layout: bedrooms, bathrooms, ensuite, separate toilet, floor area, levels.
- Parking: garage/carport/off-street counts and notes.
- Furnishing: furnished status, included furniture, appliances.
- Comfort: heating, heat pump, insulation, ventilation, air conditioning.
- Pets/outdoor: pet policy/notes, outdoor-space type, fenced status, private/shared status.
- Accessibility: step-free entry, lift, accessible bathroom, doorway notes, verified status.
- Viewing: event IDs, booking rules, capacity, agent, occupant-notice requirements.
- Media/documents: photos, floorplans, video, documents, extracted-attribute verification status.
- Policy: body corporate, covenants/restrictions, sale/rental policy flags.

Agent records require approved identity/profile, public contact preferences, availability/callback policy, approved service/fee content, listing permissions, approved FAQs, and an explicit public-vs-internal data classification.

### Ingestion and freshness

- Extract candidate attributes from forms, description, documents, and images at ingestion; do not re-extract on each user question.
- Candidate/extracted attributes remain **proposed** until a lister/agent verifies or edits them.
- Retain source reference and last-verified timestamp for every user-facing field.
- Provide agents with a missing-data checklist focused on fencing, furnishings, accessibility, and parking detail.
- When any source field, listing state, viewing schedule, or agent profile changes, invalidate dependent caches/FAQs before reuse.

## 5. Routing and model requirements

| Route | When to use | Examples | Requirement |
|---|---|---|---|
| Route 0: deterministic / zero-LLM | Intent/action is explicit or an approved answer can be safely served | Button click, slot selection, known rent field, move-in calculation, valid FAQ | Validate inputs and return directly; no model token use |
| Route 1: default model | Free text needs semantic understanding, entity extraction, follow-up resolution, or response composition | “Will I need to buy a bed?”, mixed language, multi-part query, natural-language search | Model returns schema-valid intent/entities/tool request; backend retrieves truth |
| Route 2: stronger fallback | Validated default result is incomplete, schema-invalid, complex, or policy-conflicted | Complex comparison, unusual language, structured-output failure | Use only after measurable rule; log reason; target fallback below 5% |
| Route 3: human escalation | Facts are absent, verification/human judgement is required, or policy requires handoff | Fencing/accessibility unknown, negotiation, agent-specific exception | State limitation and create a real escalation only with consent/contact where required |

Fallback cannot be triggered merely because a message is long or because the first model reports low confidence. Include schema validity, missing required entities, tool mismatch, scope/policy validation, and complexity signals.

Example model boundary:

```ts
type ModelRequest = {
  task: "INTENT_EXTRACT" | "RESPONSE_COMPOSE" | "FALLBACK";
  surface: "LISTING" | "AGENT" | "GLOBAL";
  schema_version: "v1";
  input: { message: string; compact_state: object; permitted_tools: string[] };
  limits: { max_input_tokens: number; max_output_tokens: number; timeout_ms: number };
};

type ModelResult = {
  provider: string; model: string; intent: string; entities: object;
  tool_request?: object; confidence?: number; usage: object; latency_ms: number;
};
```

The backend validates every proposed tool and parameter. Model/provider names remain configurable through a provider-neutral interface.

## 6. Sources of truth, grounding, and response policy

### Source priority

1. Live Viewings property/listing/agent database.
2. Live search index and calendar/availability engine.
3. Successful booking, cancellation, message, callback, and alert tool results.
4. Approved listing-specific or agent/agency FAQ linked to authoritative sources.
5. Approved documents/policies/service content appropriate for retrieval.
6. Human agent or administrator confirmation.

Each factual claim requires internal provenance: source type, source ID/field or tool result, timestamp, and listing/agent/user scope. Provenance must be auditable even if not displayed to the user.

### Required uncertainty language

- Verified: state the fact plainly.
- Partially supported: state the known fact and missing constraint (e.g. outdoor area exists but fencing is not confirmed).
- Unknown: say it cannot be confirmed; do not say “probably”, “should be fine”, or infer suitability.
- Stale/unavailable live tool: say current information cannot be confirmed; do not show cached slots as live.

### RAG limits

RAG may support approved agent services, building/body-corporate documents, property packs, and agency FAQs. It must never substitute for structured/live sources for price, rent, listing status, availability, bookings, or contact actions.

### Response and CTA rules

Response pattern: **answer first → relevant qualification → zero to two next actions**.

- Lead with the requested answer; avoid repeated greetings, addresses, listing summaries, and disclaimers.
- Use the user’s language where supported; keep mixed-language responses clear.
- Use exact verified amounts/dates/times; show timezone when ambiguity matters.
- Comparisons must use the same verified fields and label missing data.
- Do not show booking before a user’s suitability/safety question is resolved.
- Do not offer generic contact ahead of live slots when the user asks availability.
- For unknown facts, offer message/callback; never fabricate confidence.
- For off-topic requests, redirect to property/agent/viewing scope without an aggressive CTA.

## 7. Tool and action requirements

### Required tool catalogue

| Tool | Minimum inputs | Must return / enforce |
|---|---|---|
| `get_property` | `property_id`, requested fields | Verified selected fields, source, update timestamp |
| `search_listings` | validated filters, sort, pagination | Active matching listings and result metadata |
| `get_availability` | `property_id`, exact date range | Live slots, timezone, freshness timestamp |
| `create_booking` | property, slot, verified user/contact, consent, idempotency key | Booking ID and final confirmed status |
| `cancel_booking` | booking ID, authenticated ownership | Final cancellation status |
| `get_agent` | agent ID, public fields | Approved public profile/services/availability |
| `get_agent_listings` | agent ID, filters | Permitted active listings only |
| `send_message_to_agent` | agent, optional property, user/contact, message, consent | Real thread/message and delivery status |
| `create_callback_request` | agent, user/contact, preferred window, consent | CRM/agent task and status |
| `save_search` / `create_alert` | user, filters, channel/frequency | Persisted search/alert confirmation |
| `calculate_viewing_route` | listing IDs, date, start/constraints | Feasible route and conflicts based on actual events |
| `calculate_move_in_cost` | verified rent/bond/rules/fees | Deterministic breakdown; never model arithmetic |

All tools return a common envelope:

```ts
type ToolResult<T> = {
  success: boolean;
  data: T | null;
  error_code: string | null;
  user_safe_message: string | null;
  source_id: string;
  scope: { property_id?: string; agent_id?: string; user_id?: string };
  generated_at: string;
  expires_at?: string;
  trace_id: string;
};
```

### Action correctness

- A pre-action progress message is permitted (“I’m checking that slot”). A success statement is permitted only after the tool returns `success: true` with the resulting identifier.
- Booking/cancel/message/callback/save/alert tools require idempotency protection.
- Tool failure must produce truthful failure copy and no local/phantom success state.
- For a slot race, refresh availability and preserve appropriate already-provided details securely.
- For inactive listings, remove booking CTA and offer similar active listings.
- For no-result search, explain constraints and offer controlled relaxation; label any relaxed constraint.

### Booking flow: required sequence

1. Identify viewing/book intent; do not create a booking.
2. Resolve the exact date in Auckland time and show only live availability.
3. Persist selected `slot_id` and date/time.
4. Collect/verify required attendee/contact and authentication/OTP state.
5. Present property, date, time, attendee/contact, and applicable terms for review.
6. Obtain explicit confirmation.
7. Call `create_booking` exactly once using an idempotency key.
8. Show success only with `booking_id`, then offer calendar/booking-management actions.
9. On failure, state no booking was created and give retry/contact options.

## 8. Functional requirements and acceptance criteria

### Listing AI

| ID | Requirement | Acceptance evidence |
|---|---|---|
| LST-001 | Answer direct facts from selected verified fields | Rent query calls/reuses `weekly_rent`; no unrelated listing facts |
| LST-002 | Interpret indirect/suitability wording semantically | “Need to buy a bed?” retrieves furnishing/furniture, not bedroom count |
| LST-003 | Combine all necessary attributes for compound needs | Dog outdoors query checks pet policy + outdoor space + fence state |
| LST-004 | Preserve relationship semantics | Ensuite query reads ensuite/layout, not bed/bath counts |
| LST-005 | Qualify comfort/suitability without inference | Winter warmth uses heating/insulation; air-conditioning alone is insufficient |
| LST-006 | State capacity but not unrecorded dimensions | Vehicle query shows parking count/types and marks van fit unknown if dimensions absent |
| LST-007 | Apply listing-type rules | Sale pet question describes ownership/restriction uncertainty, never rental landlord policy |
| LST-008 | Resolve accessibility before booking CTA | Missing step-free evidence triggers an escalation option, not slots first |
| LST-009 | Support multi-intent questions | Furnishing + cats + Thursday-after-5 response retrieves fields and live slots in one scoped response |
| LST-010 | Use follow-up state | “What about a small indoor cat?” uses same listing/pet context |
| LST-011 | Use deterministic financial calculation | Move-in total uses `calculate_move_in_cost` and displays breakdown |

### Agent AI and human messaging

| ID | Requirement | Acceptance evidence |
|---|---|---|
| AGT-001 | Use public approved profile/service fields only | Experience/language/service answer carries agent source trace |
| AGT-002 | Protect private/internal data | Private calendar notes and personal contact details are unavailable through AI |
| AGT-003 | Distinguish AI from human communication | “Ask AI about Mary” and “Message Mary” have different labels, statuses, and flows |
| AGT-004 | Make callback a real action | Date/window and contact are verified; success shown only after callback tool succeeds |
| AGT-005 | Handle unknown profile facts honestly | Unlisted Mandarin ability is stated as unconfirmed, with office escalation option |

### Global AI search

| ID | Requirement | Acceptance evidence |
|---|---|---|
| GLS-001 | Convert natural language into validated structured filters | Buy/rent, location, price, attributes, and viewing window are represented in visible filter chips |
| GLS-002 | Resolve time constraints deterministically | “Next Saturday 9–2” becomes an exact Auckland date/time window before search |
| GLS-003 | Search live listing and availability data | Results are real active cards; LLM never invents/selects result set |
| GLS-004 | Refine existing state | “Only pet-friendly under $850” updates filters without re-asking location |
| GLS-005 | Handle no exact match transparently | Identify tight constraint and offer user-controlled relaxation |
| GLS-006 | Compare like for like | Same attributes across selected listings; missing data and non-universal recommendation are clear |
| GLS-007 | Route-plan actual events | Detect travel/time conflicts rather than force impossible itineraries |
| GLS-008 | Save alerts only after review/confirmation | Show interpreted criteria and chosen channel/frequency before tool execution |

### Core acceptance IDs from source

| ID | Priority | Definition of acceptance |
|---|---|---|
| BEH-001 | P0 | First substantive response answers the question or says it is unknown before CTA |
| GRD-001 | P0 | Every factual claim has a valid source trace; unsupported claims = 0 |
| INT-001 | P0 | Semantic benchmark/paraphrases, including observed failures, pass |
| TOOL-001 | P0 | Tool failure never produces a success statement |
| CTX-001 | P0 | Follow-up, refinement, and cross-surface context pass without contamination |
| DATE-001 | P0 | Relative-date test inputs resolve to exact Auckland dates |
| HUM-001 | P0 | Users can identify AI vs direct human response and delivery state |
| FAQ-002 | P1 | Dependent field update/expiry invalidates FAQ reuse |
| COST-001 | P1 | Provider/model/token usage reconciles from dashboard to platform traces |
| CTA-001 | P1 | Zero to two contextually relevant CTAs; no premature/irrelevant CTA in suite |

## 9. FAQ and learning-loop requirements

An FAQ is controlled reusable knowledge, not a cache of prior chatbot messages.

```ts
type ApprovedFAQ = {
  faq_id: string;
  scope_type: string;
  property_id?: string; agent_id?: string; agency_id?: string;
  canonical_intent: string;
  canonical_attributes: string[];
  approved_question: string;
  approved_answer: string;
  example_phrasings: string[];
  source_refs: string[];
  status: "DRAFT" | "APPROVED" | "EXPIRED";
  approved_by?: string; approved_at?: string; review_due_at?: string;
  dependency_fields: string[];
  last_used_at?: string; hit_count: number;
};
```

- **FAQ-001 (P0):** Serve a repeated answer without model generation only when it has active approval/current source references and passes dependency validity checks.
- Match semantically, not only exact text.
- Return directly only when the FAQ fully answers the request. For broader/different questions, retrieve fields and compose a new grounded answer.
- Log unanswered or frequently escalated questions into an agent/admin improvement queue.
- Never auto-approve an FAQ because the system generated the same answer repeatedly.

## 10. Security, privacy, fairness, and safety

- Treat listing descriptions and uploaded documents as data, not executable instructions; use tool and parameter allowlists.
- Collect only required contact details. Prefer secure UI fields; do not unnecessarily repeat raw PII in model prompts.
- Store masked phone/email values and internal contact/user IDs in logs. Enforce retention and access policies.
- Require explicit consent before creating agent messages/callbacks; display actual delivery status.
- Enforce least-privilege tool credentials, encrypted transport/storage, secure secrets, and authentication/ownership checks.
- Do not filter, rank, or advise housing based on protected personal characteristics. Redirect to objective criteria such as price, property features, commute, transport, schools, or viewing times.
- Do not infer accessibility from photographs or generic features. Use verified accessibility fields and state uncertainty.
- Use approved NZ-specific content/deterministic calculations for financial/legal-adjacent matters; avoid unsupported legal advice.
- Rate-limit bots, scraping, spam, and high-volume automated usage; support authentication tiers and session caps.
- Reject off-topic requests and any tool execution outside active scope/permissions.

## 11. Quality attributes and operational targets

| ID | Target |
|---|---|
| NFR-001 | Chat orchestration and core read tools: >=99.9% monthly availability, excluding approved maintenance |
| NFR-002 | Direct/FAQ first useful response p95 <=1 second (network extremes excluded) |
| NFR-003 | Model-path first useful response p95 <=2.5 seconds; stream only after routing/source decisions are safe |
| NFR-004 | Booking/action completion p95 <=4 seconds or show visible progress |
| NFR-005 | Relative-date logic defaults to `Pacific/Auckland` |
| NFR-006 | Booking, cancel, messages, callbacks, alerts, and payments are idempotent |
| NFR-007 | Every answer/action is traceable by session and trace ID |
| NFR-008 | Configurable timeout, retry, fallback, and circuit breaker; no silent policy-changing provider switch |
| NFR-009 | Listing status/availability honour explicit freshness/expiry rules |
| NFR-010 | Chat controls, cards, and statuses meet platform accessibility standard, including keyboard/screen-reader support |
| NFR-011 | Least privilege, encrypted storage/transport, injection resistance, and secrets management |
| NFR-012 | Version prompts, schemas, tools, intents, FAQs, and tests; support rollback |

### Cost controls

- No model call on widget open or result-card render.
- Button/selected action metadata bypasses semantic interpretation.
- Send only fields relevant to the current intent; full listing and transcript are prohibited by default.
- Use compact state and stable prompt/tool schemas to improve caching where providers support it.
- Planning targets: average model call input/output <=800/100 tokens; normal output 40–100 tokens.
- Monitor LLM call share; 40–60% of interactions is the intended hybrid-routing range after evidence, not an excuse to reduce correctness.
- Record cost per surface, listing, agent, model, session, action, successful booking, FAQ hit, and fallback.
- Implement daily/weekly/monthly spend alerts and provider circuit breakers.

## 12. Required analytics and alerts

Capture at minimum:

- Session: session/anonymous/user ID, surface, scope IDs, start/end, locale, device.
- Routing: selected route and reason; deterministic/FAQ/model/fallback/human.
- Model: provider/model, prompt version, input/cached/output tokens, latency, cost, schema validity.
- Tools: tool name, parameter hash, result/error, source IDs, freshness, trace ID.
- Response: intent, canonical attributes, source trace, CTA IDs, validation result.
- User actions: CTA click, card open, save/refine, booking start/completion, message/callback.
- Quality: feedback, correction, unsupported-answer report, escalation result.
- FAQ: match/hit/miss, approval/dependency state, saved model call.
- Agent value: deflection, recurring clusters, escalation response time.

Initial alerts:

| Alert | Trigger | Required response |
|---|---|---|
| Unsupported factual claim | Any confirmed occurrence | P0 incident; add regression test before close |
| Booking confirmation without booking ID | Any occurrence | P0 incident |
| Input/output token drift | Rolling average >800 / >100 without justified complexity | Investigate prompt, state, or verbosity |
| Fallback usage | >5% | Investigate model/routing policy |
| Tool errors | >2% or material booking/search degradation | Incident investigation and safe UI degradation |
| Cost anomaly | Above forecast/configured threshold | Enforce budget/runbook action |
| p95 latency | Above agreed surface target | Investigate provider/tool/UI path |

Required dashboards: executive funnel, quality/grounding, cost, agent value, and operations/reliability.

## 13. Test strategy and test cases

### Test gate

Before provider approval, run **200–500 representative conversations** using fixed rental, sale, and agent fixtures. Every candidate provider and the legacy regex baseline must receive the same prompts, schemas, tool fixtures, and conversations. Evaluate structured-output correctness separately from prose fluency.

A passing test requires: correct intent/attributes; correct source/tool; no unsupported/policy-violating content; correct scope/listing type/context/date; correct CTA/action state; recorded token/latency/trace fields; correct mobile and desktop UI state where applicable.

### Minimum automated cases

| Area | Test | Expected result |
|---|---|---|
| Semantic intent | “Do I need to buy a bed?” | Furniture fields, not bedroom count |
| Compound intent | “Can my dog play safely outside?” | Pet policy + outdoor space + fence; no safety promise if fence unknown |
| Relationship | “Does the bedroom connect to the bathroom?” | Ensuite/layout field; unknown if absent |
| Comfort | “Will it stay warm in winter?” | Heating + insulation; do not equate AC to heating |
| Suitability | Two cars and work van | State confirmed spaces; dimensions/fit unknown unless recorded |
| Listing type | Sale listing pet-friendly question | Sale/body-corporate context, no rental rule |
| Accessibility | Wheelchair visitor | Verified access result or escalation; no slots first when unknown |
| Multi-intent | Furnished + cats + Thursday after 5 | Correct fields plus live exact-date availability |
| Follow-up | Pets allowed → small indoor cat | Same listing and pet context retained |
| Financial | Move-in total | Deterministic tool result and breakdown |
| Dates | Next Saturday / day after tomorrow / end of month | Exact Auckland date asserted in fixture |
| Booking happy path | Slot selection through confirmation | One tool call, idempotency key, booking ID after success |
| Booking race/outage | Slot gone/service unavailable | No phantom booking; refresh/retry/escalate |
| Cancellation | Wrong user vs owner; double submission | Ownership rejected; idempotency prevents duplicate effect |
| Agent AI | Profile/fees/language query | Only approved public source, honest unknowns |
| Human messaging | “Tell Mary…” | AI/human mode change, consent/contact, status only after success |
| Global search | Natural-language location/price/beds/baths/time | Validated filters, active cards, visible interpretation |
| Refinement | “Only pet-friendly under $850” | Existing filters retained and modified |
| No results | Tight budget/no matches | Exact no-match explanation and labeled relaxation options |
| Compare | Parking/train access | Same verified attributes; no universal unsupported “best” |
| Route plan | Saved viewings | Actual event times/buffers and conflicts shown |
| FAQ invalidation | Change source `fenced_status` | Dependent FAQ cannot be reused until revalidated |
| Cross-scope isolation | Two listings/two agents concurrent | No data contamination in source trace or rendered response |
| Prompt injection | Malicious listing/document text | No instruction following or unauthorized tool action |
| Privacy | Contact logging/model prompt | Masked logs; no unnecessary raw PII exposure |
| Fair treatment | Protected-characteristic neighbourhood request | Refusal plus objective alternatives |
| Off-topic | Sports question | Redirect to permitted property/agent/viewing scope |
| Accessibility UI | Keyboard and screen reader action/status flow | Controls and dynamic status are accessible |
| Load/resilience | Provider/tool timeout/circuit breaker | Safe error state, no false claims/actions, trace logged |

### Regression requirements

- Every production incident results in a regression test before closure.
- Retest after any model, prompt, schema, tool contract, router rule, or policy change.
- Controlled production A/B tests are allowed only after offline hard gates pass.

## 14. Delivery plan and release gates

| Phase | Deliver | Exit gate |
|---|---|---|
| 0. Baseline/fixtures | Current behaviour baseline; representative rental/sale/agent fixtures; legacy instrumentation | Current pass/fail, token, and latency baseline documented |
| 1. Foundation | Context envelope, canonical schemas, deterministic router, tool contracts, traces, analytics | Direct facts/actions work without LLM; scope isolation proven |
| 2. Listing AI | Intent/entity extraction, scoped retrieval, unknown handling, CTAs, session state | Core listing categories and known semantic failures pass |
| 3. Availability/booking | Date resolver, live slots, identity/contact/OTP, create/cancel/reschedule, notifications | End-to-end booking success/failure/idempotency suite passes |
| 4. Agent/human | Approved profiles/services, message/callback flows, privacy controls | Agent and human-contact tests pass |
| 5. Global search | Structured search, refine, cards, save, compare, route plan | Live verified search/viewing results pass |
| 6. FAQ/model routing | FAQ approval/invalidation, provider abstraction, fallback/cost controls | Lower model-call share with no quality regression |
| 7. Hardening/launch | Full regression, load/security/accessibility, dashboards, runbooks, staged rollout | All P0/P1 gates pass; rollback and support approved |

### Definition of done

- Deployed to the agreed test environment with real or production-equivalent tools.
- UI, backend, model, source, and failure paths demonstrated end to end.
- Acceptance suite passes with saved responses and trace IDs.
- No P0 defects. P1 defects require explicit product approval and dated remediation.
- Token, latency, cost, and quality data are visible and within agreed thresholds.
- Prompts, schemas, tools, configurations, and intents are versioned and rollback-ready.
- Agent/admin FAQ approval and unanswered-question workflows are usable.
- Runbooks cover provider outage, tool outage, cost spike, and unsafe-answer investigation.

## 15. Known current shortcomings to prevent from shipping

- “Bed” is interpreted as bedroom count instead of furnishing/included furniture.
- Dog/outdoor questions are reduced to pet policy while ignoring outdoor area and fencing.
- Ensuite/layout questions are reduced to bed/bath counts.
- Air conditioning is used as proof of heating/winter warmth.
- Generic parking facts are used to assert vehicle suitability.
- Sale listing questions receive rental-policy answers.
- Accessibility is assumed and booking slots are pushed before access is established.
- Repeated questions return templated/repetitive copy.
- Address/intent and bond phrases route inconsistently.
- Move-in total may lack deterministic calculation.
- Image extraction, lister FAQs, and unanswered-question feedback are not yet a controlled verification loop.

These are architectural/acceptance failures, not isolated copy defects. They must be addressed by schemas, routing, source validation, tool contracts, tests, and human escalation—not prompt wording alone.

## 16. Decisions still required before public launch

- Default and fallback model(s), selected from comparable benchmark results.
- Direct multi-provider adapters vs managed provider gateway.
- Exact fallback thresholds after calibration.
- FAQ approval roles by listing/branch/brand/central administration.
- Human response SLA and user-facing expectation copy.
- Target model-call share after beta instrumentation.
- Anonymous/signed-in/agent/paid-tier session limits and entitlements.
- Approved external data sources for transport, schools, commute, and neighbourhood information before enabling those intents.

## 17. Change control

- A material behaviour change requires a requirement ID, rationale, impacted flows, and updated tests.
- A model-provider change does not waive behavioural, grounding, tool, security, or QA requirements.
- Any proposed cost-saving shortcut must include measured quality impact and receive written approval.
- Prompt-only fixes for architectural failures are temporary unless regression evidence proves robustness.
- “Must” means a defect if unmet. “Should”/“target” may be replaced only with evidence-backed approval.
