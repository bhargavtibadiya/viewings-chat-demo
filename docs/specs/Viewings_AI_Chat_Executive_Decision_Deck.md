
# **VIEWINGS AI CHAT ASSISTANT** 

Executive decision deck for development alignment 

### **Meeting objective** 

Agree the production behaviour for the chat assistant: understand the user, answer from verified sources, and move people toward viewing, booking or contact. 

### **Decision required** 

Move from regex-first/LLM-fallback to a hybrid architecture: LLM-led intent + canonical attributes + verified data/tools + CTA rules. 

_This deck uses Kenil’s test pack as evidence, not as a blame document._ 

1/12 

Annotation: Open the meeting with the business goal, not with criticism of the current build. 

## **Testing shows a pattern, not isolated bugs** 

Kenil tested natural phrasing, indirect intent, listing type, unknown data and CTA behaviour. 

###### **What works sometimes** 

Direct listing facts when phrased simply Some availability / move-in date answers Some heating/cooling and remote-work answers Basic friendly tone in parts of the flow 

###### **What fails repeatedly** 

Keyword match replaces intent understanding Facts are sometimes asserted without source Sale vs rental rules are mixed CTA sometimes fires before the question is answered 

###### **What this means** 

Adding more regex will patch examples but increase brittleness 

The right fix is an answer method with grounding + source routing QA must become repeatable, not screenshot-based only 

###### **Evidence categories from Kenil’s pack** 

###### **Intent failures** 

bed → bedrooms; dog → pets; ensuite → room counts 

###### **Grounding failures** 

AI says facts not actually verified 

###### **Listing-type failures** 

rental-style answers on sale listings 

###### **CTA failures** 

viewing slots before answering accessibility 

Annotation: Make it clear this is a systemic pattern. Do not let the discussion become one-off bug fixing. 

2/12 

## **Current system: fast prototype, weak production behaviour** 

Regex-first with LLM fallback is predictable, but brittle when users ask naturally. 

###### **User message** 

“Do I need to buy a bed?” 

###### **Regex / keyword layer** 

Detects “bed” and routes to bedroom count. **→ →** 

###### **Matched?** 

Yes → predefined answer No → LLM fallback **→** 

###### **Response** 

“It has 4 bedrooms.” 

###### **Why developers use this** 

**Quick to build Deterministic for simple cases Lower initial backend effort Natural language has many forms Keywords overlap with different meanings Fallback LLM lacks structured context More regex creates more edge cases** 

###### **Why it breaks** 

3/12 

Annotation: Acknowledge the engineering logic, then show why it cannot carry production UX. 

## **Failure pattern #1: keyword matching misses the real question** 

The assistant must resolve the underlying need before choosing an answer. 

###### **“Do I need to buy a bed?”** 

Current: Wrong route: bedrooms Required: Correct route: furnished / included furniture 

###### **“Can my dog play outside?”** 

Current: Wrong route: pets allowed Required: Correct route: outdoor space + fencing + pet policy 

###### **“Does the bedroom connect to the bathroom?”** 

Current: Wrong route: bedroom/bathroom count Required: Correct route: ensuite / layout 

###### **“Does it stay warm?”** 

Current: Wrong route: air-conditioning Required: Correct route: heating / insulation / heat pump 

**Core fix: map user language to canonical attributes before answering.** 

4/12 

Annotation: Use this slide to stop “we’ll add another regex” thinking. The issue is semantic routing. 

## **Failure pattern #2: ungrounded facts and weak listing-type rules** 

The assistant must never state a fact unless it can point to an approved source. 

###### **Sale vs rental mismatch** 

User asks on a sale listing: “I don’t like pets, is it pet-friendly?” 

Problem: the assistant answered like a rental policy question. 

Required: for sale listings, pet ownership is generally the future owner’s decision, subject to body corporate or restrictions. 

###### **Accessibility overconfidence** 

User asks: “My father uses a wheelchair. Can he visit?” 

Problem: the assistant assumed access and displayed viewing slots before resolving accessibility. 

Required: check accessibility attributes first. If unknown, say so and offer to ask the agent. 

##### **Grounding policy** 

###### **Verified** 

Data exists in listing/backend/approved content → answer confidently 

###### **Limited inference** 

Data supports part of answer → be specific and avoid overclaiming 

###### **Unknown** 

No source → say not specified; offer to ask agent; log the gap 

Annotation: This slide frames the legal/trust risk: confident wrong answers are worse than honest unknowns. 

5/12 

## **Required behaviour: Understand → Verify → Answer → Act** 

This is the behavioural contract the system must enforce on every turn. 



<!-- Start of picture text -->
1 2<br>Understand → Verify<br>Resolve intent, entities and canonical  Retrieve data from the right source or tool.<br>attributes.<br><!-- End of picture text -->

**Understand** Resolve intent, entities and canonical attributes. 

### **3 4 → Answer → Act** Give the direct answer; do not guess. Attach the most relevant CTA only after answering. 

### **Non-negotiable rule** 

Answer the user’s underlying need from a known source — and never state a property fact that cannot be traced to that source. 

6/12 

Annotation: This is the one-sentence standard the developers should build and test against. 

## **Recommended architecture: one orchestrator, multiple verified** 

## **sources** 

The LLM understands language; deterministic systems provide facts and perform actions. 

###### **User message + context** 

property_id listing_type session history surface: listing / agent / global 

##### **LLM orchestrator** 

Intent Attributes Entities Tool selection **→** Response wording 

#### **→** 

#### **→** 

###### **Structured listing data** 

rent, bond, beds, bathrooms, pets, heating, furnishing, parking 

###### **Availability / booking API** 

**→** real slots, booking, cancellation, callback, agent message 

###### **Grounded answer + CTA** 

Direct answer Supporting detail Next best action 

#### **→** 

###### **Approved content / RAG** 

property docs, FAQs, agent services, body corporate rules 

#### **→** 

**Logging + feedback loop** unanswered questions intent failures conversion drop-offs 

7/12 

Annotation: This is the architecture slide: LLM primary for understanding, but never source of truth for facts/actions. 

## **Canonical attributes: the bridge between natural language and data** Different user phrases should map to standard property attributes before any answer is composed. 

###### **User wording** 

###### **Canonical attribute(s)** 

“Will I freeze?” / “Does it stay warm?” **heating** “Does it get hot?” / “Is AC available?” **cooling** “Do I need to buy a bed?” **furnishing** “Bedroom connected to bathroom?” **ensuite / layout** “Can my dog play outside?” **outdoor_space + fencing + pets_policy** “Can I work remotely?” **internet + workspace** “Father uses a wheelchair” **accessibility** “Every Friday, what leaves my bank?” **weekly_rent** 

###### **Key rule** 

One question can require multiple attributes. Do not force “dog” into pets_policy if the real issue is outdoor space or fencing. 

8/12 

Annotation: This makes developer implementation testable: every answer must show the attribute mapping. 

## **Source routing and grounding policy** 

Each question type needs an approved source. Unknowns must be handled honestly. 

|**Question class**|**Source**|**Fallback behaviour**|||
|---|---|---|---|---|
|**Listing facts**|Structured listing felds|Say “not specifed” if absent|||
|**Financials**|Deterministic calculation|Show breakdown; never estimate|||
|**Viewing / booking**|Calendar + booking API|Only confrm after API success|||
|**Attributes**|Canonical felds + approved answers|Ask/fag lister if missing|||
|**Agent services**|Approved agent content / RAG|Ofer contact if unavailable|||
|**Local facts**|Verifed local data|Avoid subjective claims|||
|**Sensitive topics**|Attribute + careful policy|No assumptions, no forced CTA|||
|**Of-topic**|No property source|Decline and redirect|||
|**Source priority when**|**multiple sources exist**<br>**Structured data**|**→**<br>**Approved lister answer**<br>**→**|**Approved document**|**→**<br>**Ask agent**|



9/12 

Annotation: The routing table tells developers where each answer must come from, not just how it should sound. 

## **Response and CTA logic: answer first, then move the user forward** 

The CTA is conditional on the answer and user intent. It is not bolted onto every response. 



<!-- Start of picture text -->
Response formula<br>Direct answer<br>+ useful supporting detail<br>+ one relevant next action<br><!-- End of picture text -->



<!-- Start of picture text -->
CTA decision examples<br>Fact answered → View available times<br>Info unknown → Ask agent<br><!-- End of picture text -->

Viewing asked → Show live slots Slot selected → Confirm booking Human requested → Contact / callback Browsing → Save property 

###### **Bad example** 

User: “Can my dog play outside?” 

###### **Good example** 

The property has a private backyard, and pets are negotiable. The listing does not confirm whether the yard is fully fenced. 

Assistant: “Yes, pets are allowed.” 

Would you like me to ask the agent, or show available viewing times? 

Problem: answers pet permission, not outdoor space. 

Annotation: Use this slide to define the UX standard: answer the question before selling the next step. 

10/12 

## **Acceptance testing: turn Kenil’s examples into a repeatable QA** 

## **matrix** 

Screenshots are evidence; a structured test matrix is how we accept or reject the build. 

###### **Kenil’s 50 categories become test coverage** 

Examples include: rent without saying “rent”, furnished, ensuite, parking, pets, accessibility, relative dates, mixed intent, typos, Hindi-English, Gujarati-English, long context and follow-ups. 

###### **QA matrix structure** 

|**ID**|**User message**|**Expected intent**|**Attributes**|**Source**|**Expected CTA**|**Pass/Fail**|
|---|---|---|---|---|---|---|
|FUR-01|Do I need to buy a bed?|Property Q&A|furnishing|listing feld|View times|—|
|ENS-01|Bedroom connect to bathroom?|Layout|ensuite|attribute/doc|View times|—|
|VIEW-01|Can I see it Friday?|Viewing|date/time|calendar API|Select slot|—|
|CTX-01|What about the deposit?|Follow-up|bond|context + listing|Apply/view|—|
|**Acceptance criteria**||**95%+ correct intent/**|**attribute mapping**||**0 invented property facts**||
|||**100% bookings only**|**after API success**||**Correct CTA in 95%+ conversations**||



11/12 

Annotation: The meeting should end with agreement that acceptance is evidence-based, not demo-based. 

## **Decisions to agree with the development team** 

These are the build decisions needed to move from prototype behaviour to production behaviour. 

**1** 

###### **Demote regex** 

Regex remains only for narrow deterministic hooks: phone, email, STOP, booking refs, validation. 

**2** 

###### **LLM-led extraction** 

Use structured output for intent, entities, attributes and confidence. 

**3** 

###### **Ground facts** 

Every property fact must come from listing data, tools or approved content. 

**4** 

###### **Use backend tools** 

Bookings, cancellations, callbacks and agent questions require actual API success before confirmation. 

**5** 

###### **Maintain state** 

Pass listing type, property ID, surface, session context and recent messages on every turn. 

**6** 

###### **Test formally** 

Kenil’s cases become the QA suite and acceptance gate. 

###### **Proposed next step** 

Ask the developers to respond with their revised architecture, tool contracts, implementation estimate, and how they will prove each acceptance criterion. 

12/12 

Annotation: Close by asking for agreement on the method, then request their revised technical plan. 

