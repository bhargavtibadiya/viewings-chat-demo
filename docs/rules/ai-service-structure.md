# AI Service Structure

Canonical layout and conventions for `server/src/services/ai/`. This is the single source of truth when adding, moving, or reviewing any AI-related code. Complements `backend-folder-structure.md` (services rules) and `comments.md` (comment formats).

> Operational guide for day-to-day work also lives in `server/src/services/ai/README.md`. Keep both in sync when the structure changes.

---

## Purpose

`services/ai/` is shared infrastructure for the property chat agent: provider clients, turn orchestration, LLM tools, session memory, deterministic policies, and domain helpers. Feature modules (`chat`, `lister`, `demo`, …) call this service — they do not own OpenAI/Azure wiring or tool loops.

---

## Canonical Structure

```
server/src/
├── services/ai/
│   ├── README.md                      # How to extend this service (must stay current)
│   ├── index.ts                       # Public barrel — ONLY entry for modules outside AI
│   │
│   ├── client/                        # Provider SDK singletons (no business logic)
│   │   ├── index.ts
│   │   ├── openai.client.ts           # OpenAI today
│   │   └── [provider].client.ts       # e.g. azure.client.ts when added
│   │
│   ├── loop/                          # Turn orchestration (agent loop)
│   │   ├── index.ts
│   │   └── agentLoop.ts
│   │
│   ├── types/                         # Shared AI runtime contracts
│   │   ├── index.ts
│   │   └── ai.types.ts
│   │
│   ├── tools/                         # LLM-callable tools only
│   │   ├── index.ts
│   │   ├── toolDefinitions.ts         # OpenAI/Azure function schemas
│   │   └── toolHandlers.ts            # Execute tools against modules/DB
│   │
│   ├── memory/                        # Session memory read/write + attribute shaping
│   │   ├── index.ts
│   │   ├── sessionMemory.ts
│   │   └── memoryAttributes.ts
│   │
│   ├── policies/                      # Deterministic product / safety rules
│   │   ├── index.ts
│   │   ├── scopeGuard.ts              # Scope, jailbreak, canned replies
│   │   ├── listingTypePolicy.ts       # RENTAL vs SALE filtering
│   │   └── ctaPolicy.ts               # Answer status → CTAs / facts
│   │
│   └── helpers/                       # Pure(ish) domain helpers, grouped by concern
│       ├── index.ts                   # Re-exports public helper APIs
│       ├── lister/                    # Ask-lister flow helpers
│       │   ├── index.ts
│       │   ├── enrichListerQuestion.ts
│       │   ├── openListerQuestions.ts
│       │   ├── parseListerAnswer.ts
│       │   └── knownListingAnswers.ts
│       ├── booking/                   # Availability / book-slot helpers
│       │   ├── index.ts
│       │   ├── bookSlotActions.ts
│       │   └── resolveAvailabilitySlot.ts
│       ├── routing/                   # Deterministic intent → attribute routing
│       │   ├── index.ts
│       │   └── intentRouting.ts
│       └── quality/                   # Post-process assistant text
│           ├── index.ts
│           └── responseQuality.ts
│
└── tests/ai/                          # ALL AI unit tests live here (never under services/ai)
    ├── helpers/
    │   ├── lister/
    │   ├── booking/
    │   ├── routing/
    │   └── quality/
    └── policies/
```

**Hard rules:**

1. **No `.test.ts` files inside `services/ai/`.** Tests belong under `server/src/tests/ai/`, mirroring the source concern path.
2. **No loose files at the AI root** except `index.ts` and `README.md`.
3. **Outside modules import only from `services/ai` (the barrel).** Do not deep-import `services/ai/helpers/...` from `modules/`.
4. **Each concern folder has an `index.ts`** that re-exports its public surface for use inside AI and by the root barrel.

---

## What Goes Where

| Folder | Belongs here | Does NOT belong here |
|--------|--------------|----------------------|
| `client/` | Provider SDK init, model name getters, timeouts | Prompt text, tool execution, policies |
| `loop/` | Multi-step turn orchestration, tool-call loop, short-circuits | HTTP handlers, Prisma CRUD for features |
| `types/` | Shared interfaces used across AI + chat contracts | Module DTOs, Express types |
| `tools/` | Function schemas + handlers the model can call | Session memory CRUD, deterministic helpers |
| `memory/` | Session JSON parse/upsert, memory → attribute shaping | Tool schemas, CTA rules |
| `policies/` | Hard product rules (scope, listing type, CTAs) | Fuzzy NLP helpers, provider clients |
| `helpers/[concern]/` | Stateless transforms for one domain concern | Cross-cutting orchestration |
| `tests/ai/` | Unit tests for policies/helpers (and later tools/loop) | Production source |

### Choosing a helpers subfolder

```
New helper?
  ├── Lister escalation / dedupe / parse answers?     → helpers/lister/
  ├── Slots, booking CTAs, availability matching?     → helpers/booking/
  ├── Phrase → canonical attributes / composition?    → helpers/routing/
  ├── Polish / trim / tone of assistant text?         → helpers/quality/
  ├── Nothing fits and 2+ files share a concern?      → create helpers/[new-concern]/
  └── Single one-off with no pair?                    → place in closest existing concern; extract later
```

### Adding a new LLM provider (e.g. Azure)

1. Add `client/azure.client.ts` (singleton + model getter only).
2. Export from `client/index.ts` and root `index.ts` if modules need it.
3. Keep `loop/agentLoop.ts` provider-agnostic where possible — inject client/model via the client layer.
4. Do **not** duplicate tool definitions per provider unless schemas diverge; prefer one `tools/` surface.

### Adding a new tool

1. Add schema entry in `tools/toolDefinitions.ts`.
2. Implement execution branch in `tools/toolHandlers.ts`.
3. If the tool needs shared parse/upsert logic, put it in `memory/` or `helpers/[concern]/` — not inline in the handler when reused.
4. Document the tool name + purpose in `services/ai/README.md` tool table.

### Adding a new policy

1. Create `policies/[name]Policy.ts` (or `*Guard.ts` for safety gates).
2. Export from `policies/index.ts` and root barrel if modules need constants/helpers.
3. Call from `loop/` or `tools/` — never from Express controllers.
4. Add tests under `src/tests/ai/policies/`.

---

## File Naming

| Kind | Pattern | Example |
|------|---------|---------|
| Provider client | `[provider].client.ts` | `openai.client.ts` |
| Orchestrator | `agentLoop.ts` (or `[name]Loop.ts`) | `agentLoop.ts` |
| Types | `ai.types.ts` or `[area].types.ts` | `ai.types.ts` |
| Tool schemas | `toolDefinitions.ts` | — |
| Tool execution | `toolHandlers.ts` | — |
| Policy | `[topic]Policy.ts` / `scopeGuard.ts` | `ctaPolicy.ts` |
| Helper | descriptive camelCase noun/verb | `intentRouting.ts` |
| Test | `[sourceFile].test.ts` under `tests/ai/...` | `scopeGuard.test.ts` |
| Barrel | `index.ts` | every folder |

---

## Public API (`index.ts`)

The root barrel is the **only** supported import path for `modules/*` and other services:

```ts
// ✅
import { agentLoop, pickOpeningGreeting } from '../../services/ai/index.js';
import type { ChatAction, SessionMemory } from '../../services/ai/index.js';

// ❌ deep import from outside AI
import { enrichListerQuestion } from '../../services/ai/helpers/lister/enrichListerQuestion.js';
```

Inside AI, prefer relative imports to the owning folder (or that folder’s `index.ts`). Avoid circular imports: `helpers` must not import `loop`; `policies` must not import `tools`/`loop`.

**Dependency direction (allowed):**

```
loop → client, tools, memory, policies, helpers, types
tools → memory, policies, helpers, types
memory → types
policies → types
helpers → types (and other helpers within the same or lower concern)
client → (config/env only)
types → (generated Prisma types only)
```

---

## Tests

| Rule | Detail |
|------|--------|
| Location | `server/src/tests/ai/` only |
| Layout | Mirror source: `tests/ai/policies/scopeGuard.test.ts` tests `policies/scopeGuard.ts` |
| Runner | `npm test` → `tsx --test src/**/*.test.ts` (covers `src/tests/**`) |
| Imports | Tests import from `../../../services/ai/...` (deep OK in tests) or the barrel |
| Coverage focus | Policies and helpers first; tools/loop when behavior is deterministic |

---

## Comments

Every AI source file must follow `docs/rules/comments.md`:

| Situation | Format |
|-----------|--------|
| Exported function / class method contract | JSDoc block (`@param`, `@returns`, `@throws` when applicable) |
| Major regions in large files (`agentLoop`, `toolHandlers`) | Section banners |
| Non-obvious decision on one line | `// [WHY]` / `[WARN]` / `[NOTE]` / `[PERF]` / `[SEC]` / `[TODO]` |
| Pre-empting a review objection | `// Q: ... A: ...` |

Do not leave new AI logic uncommented. Do not invent a fifth comment format.

---

## Checklist — New AI Capability

```
□ Decide layer: client | loop | tools | memory | policies | helpers/[concern]
□ Create file in the correct folder (no root loose files)
□ Export from folder index.ts
□ If needed outside AI, export from root index.ts
□ Add JSDoc / banners / tagged comments per comments.md
□ Add unit tests under src/tests/ai/ (mirroring path)
□ Update services/ai/README.md if public surface or tools changed
□ Run npm test from server/
```

---

## What Does NOT Belong in `services/ai`

| Put it elsewhere | Why |
|------------------|-----|
| HTTP routes / controllers | `modules/[feature]/` |
| Feature CRUD as primary owner | Owning module service (`bookings`, `lister`, …) |
| Global Express types | `src/types/` |
| App-wide pure utils unrelated to AI | `utils/helpers/` |
| Unit tests | `src/tests/ai/` |
| Provider secrets | `config/env` + `.env` — never hard-code in AI files |
