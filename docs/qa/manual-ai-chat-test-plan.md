# Manual AI chat demo checklist

Use this for live demos. These cases match **implemented** behaviour only (property Q&A, greeting/session, multi-intent, memory, booking, cancel, scope, escalation).

**How to run:** open one listing chat → follow each row in order when a step depends on the previous one → tick Pass/Fail.

| # | Feature shown | What you type / do | Expected (pass if…) |
| --- | ---------------- | -------------------- | --------------------- |
| 1 | **Greeting (first open)** | Open a property chat with **no prior messages** (refresh if needed) | A welcome appears automatically (varies by session; often names the listing). Mentions help with details / viewing. |
| 2 | **Greeting (mid-session)** | After some Q&A, send `Hello` again | Short “Hi again…” style ack. Does **not** repeat the full opening greeting. |
| 3 | **Listing fact (beds)** | `How many bedrooms does this property have?` | Correct bedroom count from listing. No lister ask. Key number highlighted (bold). |
| 4 | **Listing fact (rent/price)** | Rental: `What is the weekly rent?` · Sale: `What is the asking price?` | Correct money figure from tools. Money **bold**. No invented amount. |
| 5 | **Unknown → not specified** | Ask something usually missing, e.g. `What is the floor area?` | Says not specified (or equivalent). Does not guess. May offer to ask the lister. |
| 6 | **Multi-intent (one message)** | `How many bedrooms and bathrooms, and is parking included?` | Answers **all** asked parts in one reply (list OK if 3+ items). |
| 7 | **Follow-up / memory** | A: `How many bedrooms?` → B: `And bathrooms?` | B answers bathrooms using conversation context; stays on this property. |
| 8 | **Consistency** | Ask weekly rent (or price) twice | Same verified figure both times. No contradiction. |
| 9 | **Rental vs sale** | On a **sale** listing: `What is the bond?` or `What is the weekly rent?` | Does not apply rental rules; says N/A / not for sale listings / not specified. |
| 10 | **Pets (listing type aware)** | `Are pets allowed?` | Rental: from `pets_policy`. Sale: ownership / body corporate context, not rental tenant rules. |
| 11 | **Ask lister + already asked** | A: unknown topic → B: `ask the lister` → C: same question while still OPEN | B confirms send. C says already asked; will share when lister replies. No duplicate escalation. |
| 12 | **Viewing slots** | `Show me available viewing times` | Live slots (buttons and/or short intro). Real NZ times only. Dates/times *italic* when written. |
| 13 | **Book a viewing** | Pick a slot button (or name a shown time) | Confirmed booking + real reference. Ref underlined when present. Points to My bookings. |
| 14 | **Cancel booking** | After #13: `Cancel my booking` | Cancels the session’s booking (no need to paste id). Confirms cancel or clear failure. |
| 15 | **Another date / empty range** | Ask for a day with no slots, or `What about next Tuesday?` after empty | Says none free in that range; offers / fetches another date. Does not invent slots. |
| 16 | **Off-topic refusal** | `What is the capital of France?` | Short property-only refusal. No general-knowledge answer. |
| 17 | **No code** | `Write a TypeScript function for an API call with fetch.` | Short refusal. **No** code fences or sample code. |
| 18 | **Mixed: property + off-topic** | `How many bedrooms? Also write a Python sort function.` | Answers bedrooms; refuses coding. No code produced. |
| 19 | **Gibberish** | `asdfghjkl` or `fghfggfghfh` | Asks to rephrase a property question. Does not invent facts. |
| 20 | **Formatting check** | Any money / date / booking reply from above | No em dashes (—). Mix of **bold** / *italic* / <u>underline</u> where relevant; chat renders them correctly. |

## Quick demo path (10 minutes)

1 → 3 → 6 → 12 → 13 → 14 → 16 → 2

## Notes

- Contact name/email for booking come from the logged-in profile; you do not need to type them.
- Cancel works from chat after a booking in the same session (session memory holds the booking id).
- CTAs other than live slot buttons may exist server-side but only slot buttons are shown in the UI today.
