**VIEWINGS AI CHAT ASSISTANT**

**Evidence Appendix**

Screenshots, observed responses, root-cause notes and required behaviour

**Purpose  
**This appendix records representative evidence from the existing chat build. It is designed to support the executive decision deck and technical specification by showing what the assistant currently does, why the behaviour fails, and what a production response should do instead.

**Important reading rule  
**Treat each record as evidence of a repeatable behaviour pattern, not as a request to add another one-off keyword rule. The acceptance question is: would the proposed system handle this class of question reliably across many different phrasings?

Prepared for development alignment • Existing build review

# How to use this appendix

The evidence is grouped into five failure families: **intent understanding, grounding, listing-type awareness, conversation/CTA behaviour, and consistency.** Positive examples are also included so the revised implementation preserves what already works.

| **01** | **Observed evidence <br>**The user wording and current assistant response are captured as a readable transcript. The original testing pack remains the visual source of record. |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **02** | **Interpretation <br>**Each case states the underlying user need and the canonical attribute(s) the system should resolve. |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |

| **03** | **Grounding <br>**Each case identifies the source that must support the answer: structured listing data, deterministic calculation, live tool/API, approved lister answer, or approved document/RAG. |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **04** | **Required behaviour <br>**Each case defines what the assistant should do, including whether a CTA is appropriate. |
| ------ | ------------------------------------------------------------------------------------------------------------------ |

| **05** | **Engineering implication <br>**Each case is tied to a root cause so the team fixes the mechanism, not the wording. |
| ------ | ------------------------------------------------------------------------------------------------------------------- |

# Evidence index

| **ID**   | **Evidence**                                                   | **Severity** | **Failure family**           |
| -------- | -------------------------------------------------------------- | ------------ | ---------------------------- |
| **E-01** | Generic/repetitive opening behaviour                           | High         | Conversation UX              |
| **E-02** | Bed question routed to bedroom count                           | High         | Intent / canonical attribute |
| **E-03** | Dog outside question routed to pet permission                  | High         | Multi-attribute intent       |
| **E-04** | Connected bathroom question routed to room counts              | High         | Layout / ensuite intent      |
| **E-05** | Warmth question answered with cooling information              | High         | Attribute mismatch           |
| **E-06** | Wheelchair question answered with overconfidence and early CTA | Critical     | Accessibility / grounding    |
| **E-07** | Rental pet-policy logic applied to a sale listing              | Critical     | Listing-type policy          |
| **E-08** | Same/similar question receives inconsistent handling           | High         | Routing consistency          |
| **E-09** | CTA is triggered before the user need is resolved              | High         | Conversion / CTA ordering    |
| **E-10** | Unknown information needs a verified escalation loop           | High         | Unknown / feedback loop      |
| **E-11** | Positive cases worth preserving                                | Pass         | Baseline capability          |
| **E-12** | Current regex-first architecture explains the failure pattern  | Architecture | Root cause                   |

**E-01 HIGH | Conversation UX**

# **Generic, repetitive and contradictory replies**

| **OBSERVED CHAT EXCERPT <br>User <br>"Hello / simple opening and follow-up messages" <br><br/>Current assistant <br>**"Multiple variations of "How can I help?"; the assistant also says it is the main point of contact and later says the lister will respond." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**A single contextual greeting followed by a useful next step, while maintaining a consistent role. <br><br/>**SOURCE REQUIRED <br>**Conversation state + listing context + assistant role policy. <br><br/>**EXPECTED BEHAVIOUR <br>**Respond once, acknowledge the user, use the property context, and ask one useful intent question only if the user has not already expressed a need. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**Generic fallback behaviour and weak conversation state allow repeated restart-style responses. | **Implementation implication <br>**Maintain session state and recent messages. The LLM should know whether intent is already known and should not re-open the conversation. |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**Opening message should be short. Once intent is known, the next CTA must match it rather than returning to "How can I help?"

**E-02 HIGH | Intent / canonical attribute**

# **Keyword "bed" is mistaken for bedroom count**

| **OBSERVED CHAT EXCERPT <br>User <br>"Do I need to buy a bed?" <br><br/>Current assistant <br>**"It has four bedrooms." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Whether the property is furnished and whether a bed is included. <br><br/>**SOURCE REQUIRED <br>**furnishing_status + included_furniture / approved lister answer. <br><br/>**EXPECTED BEHAVIOUR <br>**If furnished information exists, answer it directly. If the listing does not confirm beds/furniture, say it is not specified and offer to ask the lister. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**Keyword matching associates "bed" with bedrooms rather than resolving the user's underlying furnishing question. | **Implementation implication <br>**LLM-led intent extraction should map this wording to the canonical attribute furnishing, not bedrooms. |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**After a grounded answer, a soft "View available times" CTA is appropriate.

**E-03 HIGH | Multi-attribute intent**

# **Dog/outdoor question is reduced to pet permission**

| **OBSERVED CHAT EXCERPT <br>User <br>"Can my dog play outside?" <br><br/>Current assistant <br>**"Pets are allowed." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Whether there is usable outdoor space, whether it is fenced, and whether the pet policy permits the dog. <br><br/>**SOURCE REQUIRED <br>**outdoor_space + fencing + pets_policy. <br><br/>**EXPECTED BEHAVIOUR <br>**Answer the outdoor-space question first. Combine pet policy only if it is relevant and verified. If fencing is unknown, state that clearly. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**Single-keyword routing maps "dog" to pets_policy and ignores the rest of the sentence. | **Implementation implication <br>**Allow one message to map to multiple canonical attributes. Route each attribute to its verified source before composing one answer. |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**If the answer is grounded, offer viewing times. If fencing is unknown, offer "Ask the agent" first, then a softer viewing option.

**E-04 HIGH | Layout / ensuite intent**

# **Layout question is answered with room counts**

| **OBSERVED CHAT EXCERPT <br>User <br>"Does the bedroom connect to the bathroom?" <br><br/>Current assistant <br>**"The property has four bedrooms and two bathrooms." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Whether a bedroom has an ensuite or direct bathroom access. <br><br/>**SOURCE REQUIRED <br>**ensuite / floorplan / approved listing layout data. <br><br/>**EXPECTED BEHAVIOUR <br>**Confirm the ensuite/direct-access fact only if the listing or approved layout data supports it. Otherwise state that the listing does not specify it. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**The system detects bedroom and bathroom keywords but does not infer the relational meaning "connects to". | **Implementation implication <br>**Intent resolution must identify layout relationship, not only nouns. Canonical attributes should include ensuite and bedroom-bathroom access. |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**If answered, offer "View available times" or "Book viewing to inspect the layout".

**E-05 HIGH | Attribute mismatch**

# **Warmth question is routed to the wrong environmental attribute**

| **OBSERVED CHAT EXCERPT <br>User <br>"Does it stay warm?" <br><br/>Current assistant <br>**"The property has air-conditioning." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**How the home is heated and, where available, insulation/thermal comfort information. <br><br/>**SOURCE REQUIRED <br>**heating + insulation + heat_pump; cooling only if separately relevant. <br><br/>**EXPECTED BEHAVIOUR <br>**State the verified heating features. Do not claim the whole property "stays warm" unless the evidence supports that conclusion. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**Loose semantic/keyword association treats climate-control features as interchangeable. | **Implementation implication <br>**Use canonical heating and cooling attributes separately. Composition must distinguish verified features from broader comfort conclusions. |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**After answering, a viewing CTA is appropriate; do not overclaim energy performance.

**E-06 CRITICAL | Accessibility / grounding**

# **Accessibility question is answered with unsupported confidence**

| **OBSERVED CHAT EXCERPT <br>User <br>"My father uses a wheelchair. Can he visit?" <br><br/>Current assistant <br>**"The assistant indicates accessibility and immediately presents viewing slots." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Whether the route into and through the property is actually suitable for a wheelchair. <br><br/>**SOURCE REQUIRED <br>**accessibility attributes, step-free access, doorway/lift details, approved lister answer. <br><br/>**EXPECTED BEHAVIOUR <br>**Answer only verified accessibility facts. If the listing does not confirm accessibility, say so and offer to ask the agent/lister. Do not infer access from photos or general property type. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**No grounding gate on a sensitive question, combined with CTA logic that fires before the user's need is resolved. | **Implementation implication <br>**Sensitive intents require stricter source validation. The response engine must distinguish verified / limited / unknown before composing. |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**Do not auto-dump viewing slots. Resolve the accessibility question first; only then offer a gentle viewing CTA if useful.

**E-07 CRITICAL | Listing-type policy**

# **Rental-style pet policy is applied to a sale listing**

| **OBSERVED CHAT EXCERPT <br>User <br>"I don't like pets - is it pet-friendly? (on a sale listing)" <br><br/>Current assistant <br>**"A rental-style "pets are allowed" answer." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Whether there are property/body-corporate restrictions relevant to future ownership, not a landlord permission policy. <br><br/>**SOURCE REQUIRED <br>**listing_type + body corporate / covenant / approved sale-listing data. <br><br/>**EXPECTED BEHAVIOUR <br>**For a sale, explain that future pet ownership is generally the buyer's decision unless there are property or body-corporate restrictions. Only state restrictions that are verified. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**The answer pipeline does not gate policy language by listing type. | **Implementation implication <br>**Pass listing_type on every turn and apply deterministic rental/sale policy before response generation. |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**The next CTA should be "View property" / "Contact agent", not a rental viewing/application flow.

**E-08 HIGH | Routing consistency**

# **Similar questions can take different routes**

| **OBSERVED CHAT EXCERPT <br>User <br>"A repeated/similar wheelchair-accessibility question" <br><br/>Current assistant <br>**"One test gives an overconfident answer and slots; another gives a more cautious response." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**Consistent handling of the same underlying intent regardless of phrasing or session path. <br><br/>**SOURCE REQUIRED <br>**Same canonical attribute + same grounding policy + same source priority. <br><br/>**EXPECTED BEHAVIOUR <br>**Equivalent intent should produce equivalent factual behaviour. Wording can vary, but the source, confidence and action policy should remain stable. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**Different routing paths (regex match vs fallback LLM) create different behaviour for semantically similar messages. | **Implementation implication <br>**Use one primary semantic interpretation path and expose structured logs: intent, attributes, source, confidence, action. |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**CTA policy should be driven by answer status, not by whichever branch happened to respond.

**E-09 HIGH | CTA ordering**

# **Conversion logic fires before the answer is complete**

| **OBSERVED CHAT EXCERPT <br>User <br>"Can my father visit in a wheelchair?" <br><br/>Current assistant <br>**"Viewing options are shown before accessibility is properly established." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**A trustworthy answer to the question first; conversion comes second. <br><br/>**SOURCE REQUIRED <br>**Answer status + business CTA rules. <br><br/>**EXPECTED BEHAVIOUR <br>**Follow the sequence: direct answer → useful detail → one contextual CTA. Unknown or sensitive questions may need no CTA or a softer one. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **Root cause <br>**CTA is bolted onto responses independently of whether the user's actual need has been resolved. | **Implementation implication <br>**CTA selection should occur after grounding and answer-status classification. The model can word the CTA, but deterministic rules should choose the action. |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**Grounded answer → confident viewing CTA. Unknown answer → Ask agent. Sensitive unknown → no aggressive CTA.

**E-10 HIGH | Unknown / feedback loop**

# **Unknown questions need a closed feedback loop**

| **OBSERVED CHAT EXCERPT <br>User <br>"Why is the owner moving? / similar information not present in the listing" <br><br/>Current assistant <br>**"The current assistant may guess, give a generic answer, or fail to convert the missing information into reusable knowledge." <br><br/>_Note: excerpt is transcribed from the supplied testing material for readability._ | **WHAT THE USER ACTUALLY NEEDS <br>**An honest unknown response and an easy path to get the answer from the lister. <br><br/>**SOURCE REQUIRED <br>**Approved lister FAQ / property knowledge store. <br><br/>**EXPECTED BEHAVIOUR <br>**If no approved answer exists, say it is not specified. Offer to send the question to the lister. Once the lister provides an approved answer, reuse it for future matching questions. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| **Root cause <br>**Missing-information handling is not treated as a product feedback signal. | **Implementation implication <br>**Log unanswered intents by property, cluster similar questions, let the lister approve answers, and feed them back into the approved knowledge layer. |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**CTA rule  
**Only say "I sent this to the lister" after the send-question tool succeeds. Otherwise ask permission to send.

# E-11 - Positive behaviour worth preserving

**Why include passes?  
**The redesign should not replace useful behaviour unnecessarily. The test pack showed that the current system can sometimes interpret natural phrasing correctly. Those capabilities should become consistent rather than disappear.

| **1** | **Weekly-payment phrasing <br>**Questions such as "what leaves my account every Friday?" can be interpreted as weekly rent when the listing is a rental. |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **2** | **Move-in date phrasing <br>**Natural questions about moving in before Christmas can be resolved against the available date. |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |

| **3** | **Heating/cooling questions <br>**Some direct climate-control questions receive relevant property-feature answers. |
| ----- | ------------------------------------------------------------------------------------------------------------------ |

| **4** | **Remote-work suitability <br>**The assistant can sometimes combine property information with a sensible response about working from home. |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |

| **5** | **Outdoor use / barbecue <br>**Some lifestyle-style questions are handled naturally when the underlying property data is clear. |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- |

# E-12 - Architecture evidence from the current implementation discussion

The development explanation describes a **regex-first approach with the LLM as fallback.** That approach explains why similar language can produce different routes: a regex match returns one deterministic response, while an unmatched phrase falls through to a general model response.

| **CURRENT MECHANISM <br>**User message → regex / keyword rules → matched predefined response → otherwise LLM fallback. | **RECOMMENDED MECHANISM <br>**User message + context → LLM intent/attribute extraction → verified source/tool → grounding/business rules → answer → contextual CTA. |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**What should remain from regex  
**Regex still has a useful role for narrow deterministic tasks: phone/email extraction, STOP/unsubscribe, booking-reference validation, spam/profanity hooks and input validation. It should not be responsible for interpreting open-ended property questions.

# Failure-family summary for developers

| **Failure family**         | **Evidence**           | **Required engineering change**                                         |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| **Intent understanding**   | E-02, E-03, E-04, E-05 | Resolve meaning and canonical attributes before answering.              |
| **Grounding**              | E-06, E-10             | No source = no factual assertion. Unknowns must be explicit.            |
| **Listing-type awareness** | E-07                   | Rental/sale policy must gate the answer before composition.             |
| **Consistency / state**    | E-01, E-08             | One semantic path, session context and recent conversation history.     |
| **CTA logic**              | E-06, E-09             | Answer first. CTA comes after answer status is known.                   |
| **Feedback loop**          | E-10                   | Log misses, cluster them, obtain approved lister answers, reuse safely. |

**Acceptance principle  
**Do not accept the revised build because one screenshot looks better. Accept it when the same test family passes across multiple phrasings, with the correct intent, attributes, source, answer status and CTA logged for each turn.

# Developer actions requested from this evidence

**01\.** Replace regex-first semantic routing with structured LLM intent/entity/canonical-attribute extraction.

**02\.** Pass property ID, listing type, agent ID, chat surface and session context on every turn.

**03\.** Create a canonical property-attribute schema and allow one message to resolve to multiple attributes.

**04\.** Define source priority and grounding rules for each question class.

**05\.** Use live tools/APIs for availability, booking, cancellation, callbacks and agent-question actions.

**06\.** Add deterministic sale-vs-rental policy gating before response composition.

**07\.** Move CTA selection after grounding; attach only the most relevant next action.

**08\.** Log intent, attributes, source, answer status, tool result and CTA for QA.

**09\.** Create an unanswered-question queue that can be resolved by approved lister answers.

**10\.** Run the revised system against Kenil's expanded QA matrix before UAT approval.

**End state  
**The target assistant should understand natural language, retrieve only verified facts, execute real actions through backend tools, maintain conversation context and guide the user toward a viewing or agent contact without becoming robotic or unsafe.