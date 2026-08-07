# Viewings AI Chat — What We Are Building

**Purpose:** a short development brief extracted from the v2 product specification. This is the practical description of the product, not the supporting rationale, screenshots, or long-form discussion.

## 1. Product in one sentence

Build one trustworthy AI assistant for a property marketplace. It must understand a user's question, obtain facts from approved data or a successful system action, answer honestly, and then offer the appropriate next action.

It is **not** a general chatbot, a keyword-answer bot, or a system that guesses property information.

## 2. The three product surfaces

| Surface | What the user can do | Required scope |
| --- | --- | --- |
| **Listing Chat** | Ask about one listing, see viewing times, book/cancel a viewing, ask the lister an unknown question. | One `property_id` and its listing type only. |
| **Agent AI + Human Contact** | Ask about an agent's approved public profile/services/listings, or deliberately send the agent a real message/request a callback. | One `agent_id`; AI and human messages must look different. |
| **Global Ask AI** | Search naturally, refine results, compare saved listings, save an alert, and plan viewing routes. | Whole marketplace, but results and availability come from live data. |

## 3. Non-negotiable behaviour

Every request follows this sequence:

1. **Understand** the actual user need, including indirect wording and follow-ups.
2. **Verify** using structured data, an approved answer, or a successful tool result.
3. **Answer** what is known; clearly say what is unknown.
4. **Act** only when relevant, using a real tool. Show zero to two contextual actions after the answer.

Rules:

- Never invent a property, agent, availability, booking, legal, financial, accessibility, or neighbourhood fact.
- Never say a booking, cancellation, message, callback, alert, or saved search succeeded until its tool/API returns success.
- Do not apply rental rules to sale listings.
- Accessibility and pet-suitability questions require verified facts; do not infer suitability.
- Listing facts never leak between listings; agent data never leaks between agents.
- The AI must never pretend to be a human agent.

## 4. Required data and tools

The LLM interprets language. The database and tools determine truth.

| Need | Source/tool required |
| --- | --- |
| Listing details | Structured property fields and verified attributes, with source and last-verified time. |
| Repeated answers | Approved FAQ linked to the source field; invalidated if that source changes. |
| Viewing times | Live availability service with timezone and freshness information. |
| Booking/cancellation | Authenticated booking service with ownership and idempotency protection. |
| Unknown answer | Create a real lister/agent question; collect consent where contact is needed. |
| Agent details | Approved public agent profile, services, availability and permitted listings only. |
| Global search | Structured filters, active listings, and live availability. |
| Compare/route/alerts | Saved listing/search state plus real comparison, routing and alert services. |

## 5. Key examples the system must handle

| User wording | What the system must understand |
| --- | --- |
| “Do I need to buy a bed?” | Furnishing and included furniture, not bedroom count. |
| “Can my dog play outside?” | Outdoor space, fencing, and pet policy; state missing fencing. |
| “Does the bedroom connect to the bathroom?” | Ensuite/layout, not room counts. |
| “Does it stay warm?” | Heating and insulation, not air conditioning alone. |
| “Can my father using a wheelchair visit?” | Verified accessibility only; do not push booking first. |
| “Show sales listings I can view next Saturday.” | Structured sale/location/price/bedroom filters plus live availability. |

## 6. What is already implemented in this repository

The existing application is a **Listing Chat MVP**. It already has:

- authenticated marketplace, listing pages, chat sessions, chat history and demo controls;
- an OpenAI tool-calling listing-chat loop with property scope protection;
- structured listing attributes, approved answers, session memory and lister-question escalation;
- viewing availability, booking, cancellation and booking conflict handling;
- targeted handling/tests for the core semantic failure examples above;
- rate limiting, basic security middleware, manual demo cases, and per-turn debug logs.

This code is a good base for the first surface, but it is not the full three-surface product.

## 7. What is not yet implemented

### Product features

- Agent AI, real direct agent messaging, and callback workflow.
- Global natural-language search, result refinement, comparison, saved-search alerts, and viewing-route planning.
- Production FAQ dependency invalidation and reusable knowledge governance.

### Production controls

- Provider-neutral model routing and a controlled fallback model.
- Token/cost/fallback analytics, dashboards, alerting, and trace IDs.
- Full source provenance (source ID, field, timestamp and scope for every factual claim).
- Formal end-to-end acceptance suite, performance/load tests, accessibility audit, and operational runbooks.
- Defined data-retention, masked-log, notification, and production integration policies.

## 8. Root cause of the current product problem

The original assistant failed because free-text questions were treated as keyword matches. For example, “bed” was read as “bedroom,” and “dog outside” was reduced to a generic pet-policy response. The fix is not a bigger keyword list: it is language understanding plus verified structured attributes and controlled tools.

## 9. Recommended delivery order

1. **Harden Listing Chat:** make the implemented MVP auditable and production-safe: trace IDs, source provenance, token/latency/cost logging, FAQ invalidation, explicit booking confirmation, and end-to-end P0 tests.
2. **Build Agent AI + Human Contact:** public agent data, direct-message/callback workflow, consent and human/AI distinction.
3. **Build Global Ask AI:** validated natural-language search, then refine, compare, alert, and route planning.
4. **Launch hardening:** provider fallback, dashboards, security/accessibility/load testing, runbooks and staged rollout.

## 10. Prototype assessment

The supplied `viewings_ai_chat_full_prototype.html` is a **product-design prototype**, not a connected implementation. It represents approximately **85% of the v2 product behaviour and UX concept**: it covers the three surfaces, key chat examples, FAQ/lister loop, routing principles, booking flow, and analytics concepts.

It represents **0% of live backend integration in that file**. It contains hard-coded scenarios and regex-to-scenario matching; it makes no API requests and its “successful” booking/message/alert actions are simulated UI state. Treat it as a valuable UX and stakeholder-demo reference, then implement it through the real API and source-of-truth tools described above.

## 11. Definition of success

The product is complete only when a user can ask naturally, receive a traceable answer, and take a real next action; an agent receives only genuine unresolved questions; and Viewings can audit source, action result, quality, latency, and cost.
