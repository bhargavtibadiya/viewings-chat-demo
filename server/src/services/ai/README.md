# AI Service (`services/ai`)

Shared infrastructure for the property chat agent: provider clients, turn loop, LLM tools, session memory, policies, and helpers.

**Canonical rules:** [`docs/rules/ai-service-structure.md`](../../../../docs/rules/ai-service-structure.md)  
**Comments:** [`docs/rules/comments.md`](../../../../docs/rules/comments.md)

Outside this folder, import **only** from the root barrel:

```ts
import { agentLoop, pickOpeningGreeting } from '../../services/ai/index.js';
import type { ChatAction, SessionMemory } from '../../services/ai/index.js';
```

---

## Folder map

```
ai/
├── index.ts                 Public API for modules (chat, lister, demo, …)
├── client/                  Provider SDKs (OpenAI now; Azure later as azure.client.ts)
├── loop/                    Agent turn orchestration
├── types/                   Shared AI contracts
├── tools/                   LLM tool schemas + handlers
├── memory/                  Session memory + attribute shaping
├── policies/                Deterministic product / safety rules
└── helpers/
    ├── lister/              Ask-lister enrichment, dedupe, parse, known answers
    ├── booking/             Slot resolution + book-slot CTAs
    ├── routing/             Phrase → canonical attributes
    └── quality/             Assistant text polish
```

Unit tests live **outside** this tree: `server/src/tests/ai/` (mirrors concerns above).

---

## Layer cheat sheet

| Need to… | Put it in… |
|----------|------------|
| Init OpenAI / Azure / model name | `client/[provider].client.ts` |
| Orchestrate a chat turn (tools, short-circuits) | `loop/agentLoop.ts` |
| Add a model-callable function | `tools/toolDefinitions.ts` + `tools/toolHandlers.ts` |
| Read/write session JSON memory | `memory/sessionMemory.ts` |
| Shape memory/approved answers into tool attrs | `memory/memoryAttributes.ts` |
| Scope / jailbreak / canned replies | `policies/scopeGuard.ts` |
| RENTAL vs SALE attribute rules | `policies/listingTypePolicy.ts` |
| Answer status → CTA buttons | `policies/ctaPolicy.ts` |
| Lister question helpers | `helpers/lister/` |
| Availability / booking UI actions | `helpers/booking/` |
| Deterministic intent routing | `helpers/routing/` |
| Post-process assistant prose | `helpers/quality/` |
| Shared interfaces | `types/ai.types.ts` |
| Unit test | `src/tests/ai/...` — never under `services/ai/` |

Dependency direction: `loop → tools/memory/policies/helpers/client/types`. Helpers and policies must not import `loop`.

---

## Current tools

| Tool | Purpose |
|------|---------|
| `get_property` | Structured listing facts/attributes |
| `search_listings` | Filtered listing search |
| `get_availability` | Bookable viewing slots (NZ time) |
| `create_booking` / `cancel_booking` | Viewing booking lifecycle |
| `send_question_to_lister` / `get_open_lister_questions` | Lister escalation |
| `capture_contact` / `request_callback` | Lead capture |
| `read_session_memory` / `write_session_memory` | Per-session prefs/facts |
| `get_approved_answers` | Published lister answers |

---

## Adding something new

1. Pick the layer from the cheat sheet (do not invent a new root folder without updating `docs/rules/ai-service-structure.md`).
2. Add the file; export from the folder `index.ts`.
3. If modules outside AI need it, export from root `index.ts`.
4. Comment per `docs/rules/comments.md` (JSDoc on exports, banners in large files, `[TAG]` for non-obvious lines).
5. Add tests under `src/tests/ai/` mirroring the path.
6. Update this README if tools or public surface changed.

### New provider (e.g. Azure)

```
client/azure.client.ts  →  client/index.ts  →  root index.ts (if needed)
```

Keep `loop/` talking to clients via getters; avoid duplicating tool schemas per provider unless required.

### New helper concern

If two or more files share a domain that is not lister/booking/routing/quality, create `helpers/[concern]/` with its own `index.ts`, then re-export from `helpers/index.ts`.

---

## File standards

| Kind | Pattern |
|------|---------|
| Client | `[provider].client.ts` |
| Policy | `[topic]Policy.ts` or `scopeGuard.ts` |
| Helper | descriptive camelCase (e.g. `intentRouting.ts`) |
| Types | `ai.types.ts` |
| Barrel | `index.ts` in every folder |
| Test | `[name].test.ts` under `src/tests/ai/` |

No loose production files at the AI root except `index.ts` and this README.
