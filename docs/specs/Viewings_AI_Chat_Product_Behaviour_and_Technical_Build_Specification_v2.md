**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

#### **VIEWINGS.CO.NZ** 

# **AI Chat System** 

## **Product Behaviour, Architecture and Technical Build Specification** 

One assistant. Three surfaces. Verified answers. Real actions. Controlled cost. 

**LISTING CHAT    AGENT AI    GLOBAL SEARCH    BOOKING & LEAD CAPTURE** 

**Document status:** Required production build specification 

**Audience:** Product, BA, UI/UX, frontend, backend, AI engineering, QA and vendor leadership **Owner:** Viewings.co.nz **Version/date:** 2.0 / 6 August 2026 

###### **Decision authority** 

This is not a list of optional suggestions. It defines the required product behaviour and technical direction. Any proposed deviation must be documented, justified with evidence, and approved by Viewings before implementation. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 1 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Document control** 

|**Field**|**Value**|
|---|---|
|**Document purpose**|Remove ambiguity about the intended user experience,<br>system architecture, data ownership, routing, tools, model<br>selection, cost controls and acceptance criteria.|
|**Primary business outcome**|Home seekers get accurate answers and can act<br>immediately; agents spend less time answering repetitive<br>questions and receive better-qualified leads.|
|**Authority**|Approved product requirement. Developers must not replace<br>stated behaviour with cheaper but materially weaker<br>behaviour without written approval.|
|**Related evidence**|Kenil AI Chat Screenshots pack; Viewings AI Chat QA &<br>Acceptance Test Matrix; previous executive decision deck;<br>current platform UI concepts.|
|**Model/vendor status**|Not yet locked. The architecture must remain provider-<br>neutral and support comparative model testing.|
|**Planning cost assumptions**|20% chat start rate; 800 average input tokens per model<br>call; 100 average output tokens; 20 billable calls per full chat<br>session unless production analytics prove otherwise.|



### **Contents** 

- 1. Executive decision 

- 2. Product goals and measurable outcomes 

- 3. What current testing proves 

- 4. Scope: three AI surfaces and human messaging 

- 5. Non-negotiable design principles 

- 6. Target architecture 

- 7. Request routing and model strategy 

- 8. Sources of truth and grounding 

- 9. Structured property and agent data 

- 10. Approved FAQ and learning loop 

- 11. Session memory and conversational context 

- 12. Tools and API contracts 

- 13. Response design and CTA framework 

- 14. Detailed user flows 

- 15. Conversation examples and edge cases 

- 16. Token economics and cost controls 

- 17. Model/provider evaluation 

- 18. Guardrails, privacy and fair treatment 

- 19. Analytics and operational controls 

- 20. Non-functional requirements 

- 21. Acceptance requirements and QA handoff 

- 22. Implementation plan and definition of done 

- 23. Roles, governance and change control 

- 24. Open decisions 

- Appendices: intents, payloads, prohibited behaviours and evidence map 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 2 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **1  Executive decision** 

_The product decision that governs every technical choice._ 

###### **Approved production direction** 

Viewings will use structured property and agent data, deterministic tools, approved FAQs and an LLM for natural-language understanding and concise response composition. Regex or keyword matching will not be the primary method for understanding free-text questions. 

The system must optimise for user trust and action, not merely minimise token usage. Cost control is required, but it must be achieved through better architecture: direct tool paths, structured data, concise prompts, approved FAQ reuse, session-state management and model routing. 

##### **1.1  Priority order** 

**1.** Correct, relevant and context-aware answers for home seekers and agents. 

**2.** Facts and actions that are traceable to Viewings data or a successful system integration. 

**3.** Fast movement from question to useful action: view, book, save, compare, contact or escalate. 

**4.** Reduced repetitive workload for agents without falsely pretending the AI is the agent. 

**5.** Controlled cost, latency and abuse through measured routing and limits. 

##### **1.2  Single governing rule** 

###### **Answer the underlying need from a known source** 

The assistant must understand what the user is actually trying to achieve, retrieve the required facts or perform the required tool action, and never state a property, agent, availability or booking fact that cannot be traced to an approved source or successful system result. 

##### **1.3  Explicit non-goals** 

- Building a hard-coded regex branch for every possible phrasing of a question. 

- Using RAG as a substitute for live listing data, live viewing availability or booking APIs. 

- Allowing a model to invent neighbourhood, legal, financial, accessibility or property facts. 

- Sending every button click and routine action to an LLM. 

- Locking the system to one model provider before comparative QA and cost testing. 

- Using excessive CTAs or booking pressure before the user’s question is answered. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 3 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **2  Product goals and measurable outcomes** 

_What success must look like for home seekers, agents and Viewings._ 

##### **2.1  Home seeker outcomes** 

- Get a useful answer in seconds without reading a long listing or waiting for an agent. 

- Ask naturally, including indirect phrasing, follow-ups, typos, shorthand and mixed-language questions. 

- Find properties by lifestyle, timing, area, budget and viewing availability—not only by rigid filters. 

- Book, cancel, save, compare, route-plan or contact the correct agent without leaving the conversational flow. 

- Know when information is confirmed, unconfirmed, unavailable or sent to a human. 

##### **2.2  Agent outcomes** 

- Reduce repeated answers about price, rent, bond, furnishing, parking, pets, viewing times and basic services. 

- Receive questions only when the platform does not have an approved answer or a human decision is required. 

- Receive better-contextualised leads containing property, user question, contact consent and conversation summary. 

- Keep control over approved listing FAQs, agent profile answers and service information. 

- See which unanswered questions recur so listing data and FAQs can be improved. 

##### **2.3  Primary success metrics** 

|**Metric**|**Definition**|**Initial target / gate**|
|---|---|---|
|**Supported-answer accuracy**|Percentage of factual answers fully backed<br>by an approved source.|100% for property, agent, availability and<br>booking claims.|
|**Intent understanding**|Correct mapping of natural wording to the<br>underlying intent and canonical attributes.|≥95% across the approved benchmark.|
|**Tool correctness**|Correct tool selected, parameters resolved<br>and action confirmed only after success.|≥98%; booking confirmation backed by API<br>= 100%.|
|**Chat-to-action conversion**|Chats resulting in viewing, saved search,<br>callback, agent message or other<br>meaningful action.|Tracked by surface and intent; improvement<br>target set after baseline.|
|**Agent deflection**|Repeat questions answered without agent<br>effort.|Track percentage and estimated hours<br>saved.|
|**Unknown handling**|Unverified information handled honestly and<br>escalated when useful.|0 invented answers.|
|**Cost efficiency**|Average model cost per successful session<br>and per booking.|Measured against Section 16 budget<br>targets.|
|**Latency**|Time to first useful response and total tool<br>completion time.|See non-functional requirements.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 4 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **3  What current testing proves** 

_The present failures are architectural patterns, not isolated wording bugs._ 

Kenil’s evidence shows that the current assistant can sometimes answer straightforward questions, but it repeatedly fails when natural wording requires semantic interpretation, source verification, listing-type policy or correct CTA sequencing. Adding one more regex for each screenshot will create a larger patchwork, not a reliable production assistant. 

##### **3.1  Observed failure patterns** 

|**Evidence case**|**Current behaviour**|**Root problem**|**Required behaviour**|
|---|---|---|---|
|“Do I need to buy a bed?”|Returns bedroom count.|The word “bed” is treated as a<br>bedroom keyword.|Map to furnished status and<br>included furniture.|
|“Can my dog play outside?”|Returns pets allowed.|Dog is mapped only to pet policy;<br>outdoor space and fencing are<br>ignored.|Resolve outdoor space + fencing +<br>pet policy.|
|“Does the bedroom connect to the<br>bathroom?”|Returns bedroom and bathroom<br>counts.|Related facts are retrieved, but the<br>requested layout relationship is<br>missed.|Resolve ensuite / attached<br>bathroom; say unknown if not<br>recorded.|
|“Does it stay warm?”|Uses air conditioning as proof of<br>heating.|Heating, cooling and insulation are<br>conflated.|Retrieve heat<br>pump/heating/insulation attributes.|
|“Is there enough space for my<br>vehicles?”|May state suitability from generic<br>parking facts.|Number/type/vehicle size are not<br>clarified or verified.|State known parking capacity and<br>qualify suitability.|
|Sale listing: “Is it pet friendly?”|Answers as if it were a rental pet<br>policy.|Listing type is not governing policy.|Explain sale context and body-<br>corporate/restriction uncertainty.|
|Wheelchair visitor question|Assumes accessibility and pushes<br>slots.|CTA fires before access is<br>established.|Answer access first; escalate if<br>unconfirmed; then show viewing<br>action.|
|Repeated cooling questions|Returns near-identical templated<br>text.|No variation or relevance control.|Short, context-aware responses<br>with no unnecessary repetition.|



##### **3.2  Why more regex does not solve it** 

|**Capability**|**Regex / keyword rules**|**LLM + structured tools**|
|---|---|---|
|**Exact button or fixed command**|Good fit.|Usually unnecessary.|
|**Natural-language meaning**|Brittle; words overlap across intents.|Maps the underlying need and multiple<br>attributes.|
|**Follow-up context**|Requires growing custom state rules.|Can interpret pronouns and prior intent from<br>compact state.|
|**Typos / mixed language**|Requires many variants.|Handled by a capable language model.|
|**Unknown information**|Often selects the nearest canned answer.|Can express uncertainty, but only after<br>source validation.|
|**Maintenance**|Pattern count and conflicts grow<br>continuously.|Central intent schema, tools and test set are<br>easier to govern.|
|**Cost**|Cheap per matched phrase, expensive in<br>lost UX and maintenance.|Token cost is controllable with routing and<br>direct paths.|



###### **Correct role for regex** 

Regex remains useful for validation, exact commands, IDs, date formats, email/phone detection and narrow deterministic tasks. It must not be the primary semantic routing engine for free-text property conversations. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 5 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

##### **3.3  Evidence map** 

|**Evidence page**|**Pattern**|
|---|---|
|15|Address instruction ignored / bedroom routing issue|
|16|Bond phrasing routes inconsistently|
|17|Parking suitability assumption|
|18|Bed interpreted as bedroom count|
|20|Ensuite/layout misunderstood|
|22|Heating confused with air-conditioning|
|24|Repetitive cooling response|
|25|Dog outdoor-space intent reduced to pets|
|28|Upfront payment / total move-in amount requires deterministic<br>calculation|
|29|Sale listing answered with rental pet logic|
|30–31|Accessibility handling inconsistent|
|33–37|Image extraction, lister FAQ and unanswered-question<br>improvement ideas|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 6 





<!-- Start of picture text -->
Ask Viewings Al<br>Describe the home, timing and lifestyle fit you need<br>Show me 3-bedroom rentals on the North Shore with Saturday morning viewings Search with Al +<br>Pet-friendly under $850 Howick familyhomes | Roomsnear trains _See the full Al search experience —<br><!-- End of picture text -->



<!-- Start of picture text -->
Ask Viewings-Al———. a<br>Property search assistant<br>Reduce driving between my saved viewings<br>| found properties matching the main requirements. |<br>interpreted the request as:<br>Location: Howick/ East Auckland Bedrooms: 5+<br>Bathrooms:2+ Intent: Buy<br>~ "b_| .-Ay ee‘>," A i4¥<br>: e<br>$1,395,000+ $1,095,000<br>7 Takapuna View Road 18 Pohutukawa Road<br>View all properties found (4)<br>Be the first to know<br>Save this interpreted search and receive alerts when suitable homes<br>are listed<br>e<br>Reduce driving between my saved viewings |<br><!-- End of picture text -->

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

These concepts are directionally correct. The technical build must ensure that the natural-language search is converted into structured filters, live listings and live viewing availability. The model must not manually invent the result set. 

##### **4.3  Scope isolation requirements** 

###### **SCOPE-001 — Listing isolation  [P0]** 

**Requirement:** Every listing-chat request must include property_id and listing_type. Retrieval must be restricted to that listing unless the user explicitly asks to compare or search elsewhere. 

**Acceptance:** No answer can contain a fact sourced from another listing. Cross-listing actions require an explicit scope change. 

###### **SCOPE-002 — Agent isolation  [P0]** 

**Requirement:** Agent AI must use only the selected agent’s approved profile, services, availability and permitted listing scope. 

**Acceptance:** The response names the correct agent and never merges information from another profile. 

###### **SCOPE-003 — Human/AI separation  [P0]** 

**Requirement:** The UI and response metadata must show whether content was generated by AI or sent by a human agent. 

**Acceptance:** Users cannot reasonably mistake an AI answer for a direct message from the agent. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 8 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **5  Non-negotiable design principles** 

_Rules that apply to every surface, model and implementation phase._ 

|**Principle**|**Required interpretation**|
|---|---|
|**Understand the underlying need**|Map natural wording to the real intent and required canonical<br>attributes, not isolated words.|
|**Structured truth first**|Databases, approved content, calculations and successful tools<br>determine what is true.|
|**Separate interpretation from action**|The model may propose a tool call; the backend validates and<br>executes it.|
|**Answer before acting**|Resolve the question first, then offer zero to two relevant CTAs.|
|**Unknown is a valid answer**|When information is missing, say so and provide a real<br>escalation route.|
|**Listing type governs policy**|Rental, sale, private listing and agency service contexts require<br>different rules.|
|**Use the cheapest valid route**|Skip the model only when the direct route preserves<br>correctness and context.|
|**Keep memory compact and external**|Store session state outside the model and send only relevant<br>context.|
|**Measure everything**|Every model call, tool call, source, cost and conversion event<br>must be logged.|
|**Human control over reusable answers**|Repeated answers become approved FAQs only after source<br>verification or agent/admin approval.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 9 

###### One assistant, three surfaces. Structured truth first. LLM only where language understanding adds value. 

> 1. USER SURFACES 2. CONTEXT ENVELOPE 3. DETERMINISTIC ROUFERce AA.aba DaceyIERONZERO-LLMcalculationPATH 5. TOOLS / SOURCE OF TRUTH 

> Listingproperty_idchat + listing_type => surfacesession_id = ButtonExact tool/ action?request? —— ReturnNo modelstructured tokens usedresponse ™s get property /:get-agent montagent_idolplotionm-wide-fiiterslobalal Al+sea **r** c'!E approved7 aaatprofile timezoneuser_idproperty_id / agent_id ApprovedKnown= structuredFAQ hit?fact? = 4B. MODEL ROUTER scclauEsalslget_availabilitycreate / ;cancelai a booking: InterpretationNgeédat-cost default model pendimessadenicallback Stronger fallback only if neede: 9 Provider-neutral interface save search / route plan 

6. VALIDATION GATE 7. RESPONSE COMPOSER Every fact traceable AnswerUseful qualification first at ToolCorrectsuccess scope andverifiedlisting type 0-2 contextual CTAs Pll / fair-treatment checks 

SESSION + KNOWLEDGE SYSTEM INTEGRATIONS 0-2 contextual CTAs Redis / session state Viewings database and search index Honest unknown + escalation Approved listing FAQs = Calendar/ availability —————oo Approved agent FAQs Booking service Invalidation on data change Email / SMS / WhatsApp 7 — CRM, analytics and cost dashboard HUMAN ESCALATION Unverified question Complex exception Agent callback / message | Visible response status 

Key rule: the LLM understands and communicates; Viewings data and tools decide what is tre and what actually happened. 





<!-- Start of picture text -->
One assistant. Three surfaces. Always accurate. Always drives to action.<br>1, USER SURFACES (Same assistant) 2. ORCHESTRATOR (LLM) 3. TOOLS / DATA LAYER 4. SYSTEM<br>(Source of Truth) INTEGRATIONS<br>“fobohee- A.86, LISTING Papanui Road PAGE @ Understand(Classify)o i ntent =& get_property(property_id)«Facts about one tit F Aaheadhens  atc<br>TL cso,(Chrat= abouteryrs thisiREE property SS-T= Extractaifi details ®iSS _search- Find matching_listings({ilters)ngs  listingsJ Properties,bookings,Calendar /users agents,<br>B. AGENT PAGE © idees4 sesstodt content =S_SD setpeelavailability(property_id, viewing=  slots 5 dote_ronge) Availabilityive dcdiag aisEngine<br>Mary Smith @ Memory)<br>Property Manager 1 ® create_booking(property_id, slot, contact) Email / SMS /<br>SS  - Book a viewing WhatsApp<br>Chat with Mary ay Choose(Function toolcall) ® get.agent_services(egent.id, query) Confirmationsio | &<br>; ZS ~ agent services, fees, bio (RAG)<br>C. GLOBAL ASK Al @ cRM<br>Ask anything: about @ Generate(With best response CTA) @SS send_message_to_agent(thread_id,- Ask agent a question  msg) @® Leads & follow-ups<br>rentals or agents<br>Ask Al @© capture_contact(contact,santas (tact e source) 212A Analyticsevents, conversion<br>9) 5. GUARDRAILS & POLICY =<br>i} ‘ourOnly usedata co) factsNo made-up. 8 leakageNo Pil 8 (nz)Fair-Treatment © swi n some @ eEs c alatek st thadneal t o<br>SSS EXAMPLES OF DIFFERENT TYPES OF CHATS ——<br>(1) PropertyUser asks about Factsdefails (2) ViewingUser wants Availability to see times 3) BookUser picks a Viewinga timé 4) SearchUser searches & Discoveryfor properties<br>g User 8 User g User g User<br>What'sthe rent for this property? Can| view it on Saturday 10:30 am works for me. Find me a 3 bedroom house<br>morning? in Flat Bush under $700.<br>Al Assistant ‘Al Assistant 1 Nee lal Al Assistant<br>Thethas rent 3 bedrooms, is $650 per1 week.bathroom Yes!viewing Here times are the on available ongeehae Secge |match found your 6 properties search.  that<br>and Sat, 9 Aug 2026: You'll receive a confirmation<br>Pets considered2 car parks . ++ 9:0010:30¥  am am by emailBooking andMf  SMS.Confirmed BEDmy.me) 12Flat Mople Bush Way<br>Sat, 9 Aug 2026 - 10:30 am CR 800-209-200<br>- CTA ie<br>EES « irene<br>Goal: Show real slots from calendar Goal: Confirm & next steps Goal: Surface listings + book<br>(5) QuestionsUser asks about Aboutservices Agent 6) ContactUser wants / Callbacka human response (7) AskUser a needs Questioninfo we to don’t Agenthave 3} Off-topicUser asks something / Guardrailunrelated<br>2%Whatmanagementare your fees? property 2 &Cantomorrow?you have the agent call me 2 waforIs the students?property allowed 2 @‘Whoweekend?will win the rugby this<br>© Al Assistant AlAssistant At Aadatant AlAssistant<br>Ra ee cee ee aay Sure, I'll pass that on. I'm not sure about that. | can help you with questions<br>ygtheepeBhantifindl SYMt Please confirm your contactdetails: theI've agent. sent your Theyquestion will replyto aboutand our properties, agents.  viewings<br>assessments and more. hecetshortty<br>Would you liker the full list? Phone or Email? : Howproperty search can | help with yourtoday?<br>SDQuestionwe notifysent you when.to agent<br>Type. manually<br>oak tatccasll Cora Goch cou tlead ee Goal: Escalate & manage expectation Goal: Stay in scope<br>IY BEHIEUR RUNES CHAT RESPONSE PATTERN SUCCESS METRICS<br>© Always use real data from our systems. ork cceverselionse? cea ecckions<br>©© Never make up pricesor availability. ‘Acknowledge Answer Useful detail Next best action alll Higher % of chats leading to a viewing<br>@ OfferBe short,one helpfulclear next step and friendly. (CTA) every time. 2 + r + ci + @ aee be gle rm<br>RL naea Lower drop-off during booking flow<br><!-- End of picture text -->



<!-- Start of picture text -->
The cheapest path is used only when it preserves-accuracy-and_the intended_user experience.<br>WER eRSPAS OrUs ction<br>Is the intent explicit?, action, exact field request<br>YES NO / AMBIGUOUS<br>(<br>ZERO-LLM ROUTE LANGUAGE ROUTE a<br>ValidateCall tool result/ read anddatabaserender/ useresponseapproved FAQ DefaultRetrieveLLMonlymapsrequiredintentfields+ entities/ tools<br>Examples: “View Saturday times”, slot click, boo IGRMECE:YARDATION TUBER SetonADI aeRalocion? Tool success? outside?”,Examples: mixed-language“Will | need to buyor a multi-partbed?”, “Can questions. my dog play safely<br>fiedbesictichen = 0-2 relevant CTAs<br><!-- End of picture text -->





**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

```
ModelResult {
```

```
  provider, model, intent, entities, tool_request, confidence, usage, latency_ms
}
```

##### **7.3  Fallback rules** 

- Do not rely only on the model’s self-reported confidence; use schema validation, missing required entities, tool mismatch and policy checks. 

- Fallback must not be automatic for every long message. Complexity must be measured by the task, not character count alone. 

- If both models cannot produce a valid grounded route, ask one focused clarification or escalate; do not invent. 

- Fallback rate should be monitored and targeted below 5%, then tightened after benchmark evidence. 

### **8  Sources of truth and grounding** 

_The LLM is not the database and is never the final authority for a real-world action._ 

##### **8.1  Source hierarchy** 

**1.** Live Viewings property, listing and agent database. 

**2.** Live search index and live calendar/availability engine. 

**3.** Successful booking, cancellation, message, callback and alert tool results. 

**4.** Approved listing-specific FAQ or agent/agency FAQ linked to an authoritative source. 

**5.** Approved documents, policies or service content suitable for retrieval. 

**6.** Human agent or administrator confirmation. 

###### **Grounding rule** 

Every factual claim in a property or agent answer must carry internal provenance: source type, source ID/field or tool result, timestamp and scope. The user does not need to see all metadata, but the platform must be able to audit it. 

##### **8.2  Confidence language** 

|**Source status**|**Permitted wording**|**Prohibited wording**|
|---|---|---|
|Verified field / successful tool|“The property has two off-street parking<br>spaces.”|Unnecessary hedging that makes verified<br>information sound uncertain.|
|Partially supported|“The property has an outdoor area, but the<br>listing does not confirm whether it is fully<br>fenced.”|“Your dog will be safe outside.”|
|Unknown|“I could not find confirmed information about<br>wheelchair access. I can send this question<br>to the agent.”|“It should be accessible.”|
|Stale / unavailable tool|“I cannot confirm the current viewing times<br>right now. Please try again or ask the<br>agent.”|Showing cached slots as live.|



##### **8.3  RAG policy** 

Retrieval-augmented generation may be used for approved agent service descriptions, building rules, bodycorporate documents, property information packs or agency FAQs. It must not replace structured fields or live APIs for price, rent, availability, bookings, listing status or contact actions. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 13 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **9  Structured property and agent data** 

_The quality of the chat is limited by the quality and explicitness of the source data._ 

##### **9.1  Canonical property fields** 

|**Domain**|**Canonical fields / examples**|
|---|---|
|**Identity**|property_id, listing_id, listing_type, status, source, updated_at|
|**Location**|address, suburb, city, region, map coordinates|
|**Commercial**|weekly_rent, sale_price, bond_amount, move_in_cost components,<br>available_from|
|**Layout**|bedrooms, bathrooms, ensuite, separate_toilet, floor_area, levels|
|**Parking**|garage_count, carport_count, off_street_spaces, parking_notes|
|**Furnishing**|furnished_status, included_furniture, appliances|
|**Comfort**|heating_type, heat_pump, insulation, ventilation, air_conditioning|
|**Pets / outdoor**|pets_policy, pet_notes, outdoor_space_type, fenced_status,<br>shared_private|
|**Accessibility**|step_free_entry, lift, accessible_bathroom, doorway_notes,<br>verified_status|
|**Viewing**|viewing_event_ids, booking rules, capacity, agent_id, occupant<br>notice requirements|
|**Media / documents**|photos, floorplan, video, documents, extracted_attributes_status|
|**Policy**|body_corporate, covenants, restrictions, sale/rental-specific policy<br>flags|



##### **9.2  Canonical agent fields** 

|**Domain**|**Canonical fields / examples**|
|---|---|
|**Identity**|agent_id, name, role, licence/REA ID where applicable, brand,<br>office|
|**Profile**|approved bio, years/areas of experience, languages,<br>specialties, service areas|
|**Contact**|public phone/email, preferred contact methods, callback rules,<br>consent settings|
|**Availability**|working hours, callback windows, calendar integration,<br>absence/backup agent|
|**Services**|approved fees, services, appraisal, letting, sales and property-<br>management descriptions|
|**Listings**|active listing IDs, permissions, assigned branches and brands|
|**FAQs**|approved agent/agency Q&A with source and review date|
|**Privacy**|fields permitted for public AI response versus internal use only|



##### **9.3  Ingestion and verification** 

- Extract candidate attributes from listing forms, description, documents and images once at ingestion—not on every user question. 

- Mark extracted values as proposed until the lister/agent verifies or edits them. 

- Show agents a missing-data checklist focused on frequently asked attributes such as fencing, furnishings, accessibility and parking details. 

- Retain source and last-verified timestamp for every field that can drive a user-facing claim. 

- Invalidate affected FAQ answers and cached responses when the underlying field changes. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 14 



<!-- Start of picture text -->
Repeated questions reduce future token usage only after the answer is verified.<br><!-- End of picture text -->



<!-- Start of picture text -->
1. Question asked 2. Existing source check 3. New / unresolved pattern<br>Track intent, wording and listing/agent sqope Structured data or approved FAQ? Cluster semantically similar questions<br>6. Serve and measure 5. Approval 4. Proposed answer<br>Return instantly; track hit rate and conversion} Agent/admin verifies or edits answer Generate from known data or ask agent<br>$$_p<br><!-- End of picture text -->

Invalidation rule: when the listing, viewing schedule, agent profile or underlying field changes, dependent FAQs must be revalidated before reuse. 





**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **11  Session memory and conversational context** 

_Keep the conversation coherent without resending the complete transcript._ 

##### **11.1  External session state** 

```
ChatState {
  session_id, user_id, surface,
  property_id, agent_id, listing_type,
  active_search_filters, compared_listing_ids[],
  last_intent, last_entities, unresolved_question,
  selected_viewing_date, selected_slot_id,
  contact_status, consent_status,
  summary, recent_relevant_turns[],
  locale, timezone: "Pacific/Auckland"
}
```

##### **11.2  Context rules** 

|**Situation**|**Required behaviour**|
|---|---|
|**Follow-up pronoun**|Resolve “it”, “that one”, “what about the cat?” from active scope<br>and last relevant intent.|
|**Intent change**|Update state cleanly; do not continue pushing the previous flow.|
|**Global to listing**|When a result card is opened, carry search filters and<br>comparison context into listing chat.|
|**Listing to agent**|Carry property_id and the unresolved question into the agent<br>message/callback flow.|
|**Session resume**|Restore compact state and summary, not the full raw transcript<br>unless audit or support requires it.|
|**Long conversation**|Summarise resolved turns and keep only recent relevant turns,<br>tool results and unresolved state.|



##### **11.3  Token discipline** 

- Stable system instructions and tool schemas must remain consistent to maximise provider caching where supported. 

- Send only the fields required for the current intent; do not send the full listing record by default. 

- Use compact structured state rather than prose summaries where possible. 

- Output should normally be 40–100 tokens; provide more only where the user asks or the task genuinely requires it. 

- The token dashboard must separate uncached input, cached input, output and fallback-model usage. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 16 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **12  Tools and API contracts** 

_The assistant becomes useful only when its actions are real, auditable and correctly confirmed._ 

##### **12.1  Required tool catalogue** 

|**Tool**|**Core inputs**|**Purpose / output**|
|---|---|---|
|get_property|property_id, fields[]|Returns selected verified fields with source and<br>updated timestamp.|
|search_listings|structured filters, sort, pagination|Returns matching active listings and result<br>metadata.|
|get_availability|property_id, exact date range|Returns live slots, timezone and freshness<br>timestamp.|
|create_booking|property_id, slot_id, user/contact, consent|Creates booking; returns booking_id and<br>confirmed status.|
|cancel_booking|booking_id, authenticated user/contact<br>verification|Cancels and returns final status.|
|get_agent|agent_id, public fields[]|Returns approved profile, services and<br>availability.|
|get_agent_listings|agent_id, filters|Returns permitted active listings.|
|send_message_to_agent|agent_id, optional property_id, user/contact,<br>message|Creates real thread/message and delivery<br>status.|
|create_callback_request|agent_id, user/contact, preferred window|Creates CRM/agent task and status.|
|save_search / create_alert|user_id, structured filters, channels|Persists search and optional notifications.|
|calculate_viewing_route|property IDs, date, starting point/constraints|Returns feasible route and conflicts from actual<br>viewing events.|
|calculate_move_in_cost|rent, bond rules, advance rent, fees permitted|Returns deterministic breakdown; never LLM<br>arithmetic.|



##### **12.2  Tool result contract** 

```
ToolResult<T> {
  success: boolean,
  data: T | null,
  error_code: string | null,
  user_safe_message: string | null,
  source_id: string,
  scope: { property_id?, agent_id?, user_id? },
  generated_at, expires_at?, trace_id
}
```

##### **12.3  Booking confirmation rule** 

###### **No tool success, no confirmation** 

The assistant may say “I’m checking that slot” before execution. It may say “You are booked” only after create_booking returns success with a booking ID. The same rule applies to cancellations, messages, callbacks, saved searches and alerts. 

##### **12.4  Error behaviour** 

|**Failure**|**User response**|**System action**|
|---|---|---|
|Slot no longer available|Apologise, show refreshed available slots.|Refresh availability and retain user details<br>securely.|
|Booking service unavailable|State that booking could not be confirmed;<br>offer retry or agent contact.|Do not create a local fake confirmation.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 17 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

|**Failure**|**User response**|**System action**|
|---|---|---|
|Property inactive|State that the listing is no longer active; offer<br>similar active listings.|Remove booking CTA.|
|Message delivery failed|State that the message was not sent and<br>offer retry/contact details.|Log failure; do not show “sent”.|
|Search has no matches|Explain which constraints caused zero<br>results; offer a controlled refinement.|Do not invent near matches without labeling<br>the relaxed constraint.|



### **13  Response design and CTA framework** 

_Useful, concise and action-oriented without becoming pushy._ 

##### **13.1  Default response pattern** 

**Acknowledge only when useful → Answer → Relevant qualification → 0–2 next actions** The answer is the product. The CTA is a continuation of the user’s goal, not a replacement for the answer. 

##### **13.2  CTA decision table** 

|**User signal**|**Primary CTA**|**Optional secondary CTA**|**Do not show**|
|---|---|---|---|
|Asks for viewing availability|Select a live time|Show more times|Generic “Contact agent” before<br>slots.|
|Asks suitability/details|More relevant details or ask agent<br>if unknown|Book a viewing after answer|Multiple unrelated actions.|
|Shows strong interest / selects<br>time|Book viewing|Save property|Repeated search prompts.|
|Asks an unknown fact|Send question to agent|Request callback|A fake confident answer.|
|Global search results|View matches / refine|Save search or plan route|Booking CTA before a property is<br>selected.|
|Agent-service question|View services/listings|Message agent or callback|Implying AI is the agent.|
|Off-topic question|Return to property/search scope|Search properties|Aggressive sales CTA.|



##### **13.3  Writing rules** 

- Lead with the requested answer. Avoid long greetings, repeated listing summaries and unnecessary disclaimers. 

- Use the same language as the user where supported; mixed-language answers may remain simple and clear. 

- Use exact amounts, dates and times when verified. Show timezone where ambiguity matters. 

- Do not say “probably”, “should be fine” or “I think” for unverified property suitability. 

- Do not repeat the address, price or description unless relevant to the current question. 

- Present comparisons consistently using the same verified attributes and clearly label missing data. 

### **14  Detailed user flows** 

_Required end-to-end behaviour for the most important product journeys._ 

###### **14.1 Listing fact or suitability question** 

Open listing chat → attach scope → check explicit field/FAQ → interpret if needed → retrieve only required attributes → validate → answer → contextual CTA. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 18 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **14.2 Viewing availability** 

Resolve exact date in Pacific/Auckland → call live availability → show slots → retain selected date → user chooses slot. 

###### **14.3 Book a viewing** 

Select slot → collect/verify attendee and contact details → show confirmation summary → explicit confirm → create_booking → display booking ID and next steps. 

###### **14.4 Cancel or reschedule** 

Verify booking ownership → cancel or retrieve replacement slots → execute tool → confirm final status → notify agent/occupant systems as configured. 

###### **14.5 Unknown listing question** 

Check fields/docs/approved FAQ → state what is known and unknown → offer to send exact question → capture consent/contact → send_message_to_agent → show delivery status. 

###### **14.6 Agent information** 

Use agent_id → retrieve public approved fields → answer → show listings/services/callback as contextually relevant. 

###### **14.7 Direct agent message** 

Clearly leave AI-answer mode → capture message/contact/consent → send real message → show status and expected response process. 

###### **14.8 Global natural-language search** 

Interpret buy/rent, location, price, attributes, dates and times → deterministic date resolution → search index + availability → render cards and filter chips. 

###### **14.9 Refine and compare** 

Modify active structured filters or selected listing set → retrieve same comparable fields → explain differences and missing data. 

###### **14.10 Save search and alert** 

Show interpreted criteria → user confirms → store search → select channels/frequency → confirm only after save succeeds. 

###### **14.11 Viewing route plan** 

Use booked/saved property IDs and actual viewing events → calculate feasible route and travel buffers → surface conflicts → offer booking changes. 

###### **14.12 Resume and cross-surface context** 

Restore compact state → indicate context naturally → preserve filters/property/question when moving between global, listing and agent flows. 

##### **14.13  Booking flow acceptance sequence** 

|**Step**|**System requirement**|
|---|---|
|**1. Intent**|The system understands the user wants to view/book; no<br>booking is created yet.|
|**2. Availability**|Only live slots from get_availability are shown.|
|**3. Selection**|Selected slot ID and exact Auckland date/time are stored.|
|**4. Identity/contact**|Required contact details and OTP/auth rules are completed.|
|**5. Review**|The user sees property, date, time, attendee/contact summary<br>and any terms.|
|**6. Explicit confirmation**|The user confirms the booking action.|
|**7. Execution**|create_booking is called exactly once with idempotency<br>protection.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 19 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

|**Step**|**System requirement**|
|---|---|
|**8. Confirmation**|Success is shown only with booking_id; notifications/calendar<br>options follow.|
|**9. Failure**|The user receives a truthful failure/refresh path; no phantom<br>booking.|



### **15  Conversation examples and edge cases** 

_Examples are normative: they define intent, source, response behaviour and CTA sequencing._ 

##### **15.1  Listing chat examples** 

###### **Example L-01 — Direct rent question** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / rental|
|**User**|What is the rent?|
|**Required source / action**|get_property(property_id, [weekly_rent])|
|**Expected answer**|The rent is $650 per week.|
|**CTA**|View available times|



###### **Example L-02 — Indirect rent question** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / rental|
|**User**|How much will leave my account every Friday?|
|**Required source / action**|Default model maps wording to weekly_rent; backend retrieves<br>field.|
|**Expected answer**|The rent is $650 per week.|
|**CTA**|View available times|
|**Acceptance note**|Do not ask for clarification when intent is clear.|



###### **Example L-03 — Bed versus bedroom** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / rental|
|**User**|Do I need to buy a bed?|
|**Current failure**|It has 4 bedrooms.|
|**Required source / action**|Map to furnished_status and included_furniture; retrieve verified<br>fields.|
|**Expected answer**|The property is listed as unfurnished, so you would need to<br>provide your own bed. The listing confirms the oven and<br>dishwasher are included.|
|**CTA**|Ask what else is included|
|**Acceptance note**|Answering “4 bedrooms” is a failure.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 20 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **Example L-04 — Dog and outside space** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / rental|
|**User**|Can my dog play safely outside?|
|**Current failure**|Pets are allowed.|
|**Required source / action**|Retrieve pets_policy, outdoor_space_type, fenced_status.|
|**Expected answer**|Pets are negotiable. The property has a private outdoor area,<br>but the listing does not confirm whether it is fully fenced.|
|**CTA**|Ask the agent about fencing|
|**Acceptance note**|Do not promise safety from incomplete data.|



###### **Example L-05 — Ensuite/layout** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Does the bedroom connect to the bathroom?|
|**Current failure**|It has 4 bedrooms and 2 bathrooms.|
|**Required source / action**|Retrieve ensuite/layout field.|
|**Expected answer**|The listing confirms that the main bedroom has an ensuite<br>bathroom.|
|**CTA**|View floor plan or more details|
|**Acceptance note**|If unknown, say so and offer agent escalation.|



###### **Example L-06 — Heating** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Will it stay warm in winter?|
|**Required source / action**|Retrieve heating_type and insulation; qualify without<br>guaranteeing comfort.|
|**Expected answer**|The property has a heat pump and ceiling insulation, which<br>should help with winter heating. The listing does not provide an<br>energy-efficiency rating.|
|**CTA**|View more features|
|**Acceptance note**|Do not use air conditioning alone as proof of winter warmth.|



###### **Example L-07 — Vehicle capacity** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Is there enough space for my two cars and a work van?|
|**Required source / action**|Retrieve parking types/count; do not infer dimensions.|
|**Expected answer**|The listing confirms one garage and two off-street spaces. It<br>does not specify the dimensions, so I cannot confirm whether<br>the work van will fit comfortably.|
|**CTA**|Ask the agent about van clearance|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 21 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **Example L-08 — Sale listing pet context** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / sale|
|**User**|I don’t like pets. Is it a pet-friendly place?|
|**Required source / action**|Apply sale-listing policy; retrieve body_corporate/restrictions if<br>present.|
|**Expected answer**|Because this property is for sale, pet ownership would generally<br>be the future owner’s decision. Any body-corporate or property-<br>specific restrictions would need to be confirmed.|
|**CTA**|Ask the agent about restrictions|
|**Acceptance note**|Do not answer with a rental landlord pet policy.|



###### **Example L-09 — Accessibility unknown** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|My father uses a wheelchair. Can he visit?|
|**Required source / action**|Retrieve accessibility fields; unknown handling.|
|**Expected answer**|The listing does not contain confirmed step-free access<br>information, so I cannot guarantee accessibility. I can send the<br>question to the agent before you book.|
|**CTA**|Ask the agent about access|
|**Acceptance note**|Do not show slots before resolving the question.|



###### **Example L-10 — Multi-part question** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Is it furnished, are cats okay, and can I view it after 5 on<br>Thursday?|
|**Required source / action**|Intent extraction → get_property fields + exact-date resolver +<br>get_availability.|
|**Expected answer**|It is unfurnished. Cats are negotiable with the owner. I found<br>two live Thursday slots after 5 pm: 5:30 and 6:00.|
|**CTA**|5:30 pm / 6:00 pm|



###### **Example L-11 — Follow-up context** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Are pets allowed? → What about a small indoor cat?|
|**Required source / action**|Use last intent=pets and same property scope; retrieve pet<br>notes.|
|**Expected answer**|A small indoor cat may be considered, but final owner approval<br>is required.|
|**CTA**|Ask the agent or book a viewing|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 22 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **Example L-12 — Move-in total** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT / rental|
|**User**|What is the total amount I need before getting the keys?|
|**Required source / action**|calculate_move_in_cost using verified rent and current<br>permitted rules.|
|**Expected answer**|You would need $3,250 in total: $2,600 bond plus $650 rent in<br>advance.|
|**CTA**|View payment breakdown|
|**Acceptance note**|Do not let the LLM perform unverified arithmetic.|



###### **Example L-13 — Live availability** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Can I see it next Saturday morning?|
|**Required source / action**|Deterministic Auckland date resolver + get_availability.|
|**Expected answer**|Next Saturday is 15 August 2026. Available morning times are<br>9:00, 10:30 and 11:30.|
|**CTA**|Show the live slot buttons|



###### **Example L-14 — Booking completion** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|10:30 works for me.|
|**Required source / action**|create_booking must succeed.|
|**Expected answer**|After contact verification and explicit confirmation: “You are<br>booked for Saturday, 15 August 2026 at 10:30 am. Booking<br>reference: V-10482.”|
|**CTA**|Add to calendar / View my bookings|



###### **Example L-15 — API failure** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|LISTING_CHAT|
|**User**|Book 10:30.|
|**Required source / action**|Tool failure result.|
|**Expected answer**|I could not confirm that booking because the booking service is<br>temporarily unavailable. No booking has been created. Please<br>retry or send the request to the agent.|
|**CTA**|Retry / Contact agent|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 23 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

##### **15.2  Agent AI and human-contact examples** 

###### **Example A-01 — Agent profile** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|AGENT_AI / agent_id|
|**User**|How much experience does Mary have?|
|**Required source / action**|get_agent(agent_id, approved profile fields).|
|**Expected answer**|Mary’s approved profile states that she has eight years of<br>property-management experience and works primarily across<br>East Auckland.|
|**CTA**|View Mary’s listings|



###### **Example A-02 — Agent services and fees** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|AGENT_AI|
|**User**|What are your property-management fees?|
|**Required source / action**|Approved agent/agency service data; no unsupported<br>negotiation.|
|**Expected answer**|The approved service profile lists management fees from 6.5%<br>plus GST, with letting and rental-appraisal services also<br>available. Exact pricing depends on the service package.|
|**CTA**|View all services / Request callback|



###### **Example A-03 — Callback** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|AGENT_AI → HUMAN ACTION|
|**User**|Can Mary call me tomorrow afternoon?|
|**Required source / action**|Resolve date/window; verify contact; create_callback_request<br>succeeds.|
|**Expected answer**|Your callback request has been sent to Mary for tomorrow<br>afternoon using the number ending in 482.|
|**CTA**|View request status|



###### **Example A-04 — Direct message distinction** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|AGENT_AI / HUMAN ACTION|
|**User**|Tell Mary I want to discuss the fencing.|
|**Required source / action**|Switch to explicit human-message flow; no claim of agent<br>response yet.|
|**Expected answer**|I can send that as a direct message to Mary. Please confirm the<br>message and your preferred contact details.|
|**CTA**|Confirm and send|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 24 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **Example A-05 — Unknown agent detail** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|AGENT_AI|
|**User**|Does Mary speak Mandarin?|
|**Required source / action**|get_agent language field; unknown handling.|
|**Expected answer**|Mary’s approved profile does not list Mandarin. I can ask the<br>office to confirm.|
|**CTA**|Ask the office|



##### **15.3  Global Viewings AI examples** 

###### **Example G-01 — Natural-language search** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Find me a three-bedroom house in Papatoetoe under $500,000<br>with two bathrooms. I’m free next Saturday from 9 to 2.|
|**Required source / action**|Default model extracts filters → deterministic date resolver →<br>search_listings + availability matching.|
|**Expected answer**|I found matching active listings with viewing times inside your<br>preferred window. Results are returned as cards with the<br>interpreted filters visible.|
|**CTA**|View matches / Save search|



###### **Example G-02 — Time-first search** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|I’m free from 11 to 3 on Sunday. What rentals can I view on the<br>North Shore?|
|**Required source / action**|Date/time resolver + search index + availability.|
|**Expected answer**|Show active rental listings with live Sunday viewings within<br>11:00–15:00; ask for budget only if needed to improve results.|
|**CTA**|Refine by price / Plan route|



###### **Example G-03 — Refinement** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Only show pet-friendly ones under $850.|
|**Required source / action**|Use session search state + search_listings.|
|**Expected answer**|Update active filters; do not restart the search or ask for the<br>location again.|
|**CTA**|Save this search|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 25 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

###### **Example G-04 — No exact matches** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Three bedrooms, two bathrooms, Takapuna, under $500 a<br>week, Saturday morning.|
|**Required source / action**|Search result metadata; never invent matches.|
|**Expected answer**|I found no exact matches. The tightest constraint is the $500<br>weekly budget. I can show options under $650 or include<br>nearby suburbs—choose which constraint to relax.|
|**CTA**|Raise budget / Nearby suburbs|



###### **Example G-05 — Compare** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Which of these is better for two cars and train access?|
|**Required source / action**|get_property selected fields + approved map/travel source.|
|**Expected answer**|Compare verified parking fields and mapped train distance for<br>the selected results; label missing data and avoid declaring a<br>universal “best”.|
|**CTA**|Open comparison / Book a viewing|



###### **Example G-06 — Route planning** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Reduce driving between my saved viewings.|
|**Required source / action**|calculate_viewing_route.|
|**Expected answer**|Create a feasible route using actual viewing times, travel<br>estimates and buffers; show conflicts rather than forcing an<br>impossible schedule.|
|**CTA**|Accept route / Change a viewing|



###### **Example G-07 — Saved alert** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Let me know when something similar is listed.|
|**Required source / action**|save_search + create_alert.|
|**Expected answer**|Show the interpreted criteria and alert channels; create only<br>after confirmation.|
|**CTA**|Confirm alert|



###### **Example G-08 — Fair-treatment request** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Find me a neighbourhood with only people like me.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 26 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

|**Item**|**Required behaviour**|
|---|---|
|**Required source / action**|Fair-treatment policy.|
|**Expected answer**|I cannot filter or recommend housing based on protected<br>personal characteristics. I can help with property features, price,<br>commute, schools, transport or viewing times.|
|**CTA**|Refine by objective criteria|



###### **Example G-09 — Off-topic** 

|**Item**|**Required behaviour**|
|---|---|
|**Surface / scope**|GLOBAL_SEARCH|
|**User**|Who will win the rugby this weekend?|
|**Required source / action**|Scope guardrail.|
|**Expected answer**|I’m here to help with properties, agents and viewings. What are<br>you looking for?|
|**CTA**|Search properties|



### **16  Token economics and cost controls** 

_The agreed planning numbers, realistic stress cases and engineering targets._ 

##### **16.1  Current planning assumptions** 

|**Parameter**|**Planning value**|
|---|---|
|**Percentage of listing viewers starting AI chat**|20%|
|**Average input tokens per model call**|800|
|**Average output tokens per model call**|100|
|**Average billable model calls per full chat session**|20|
|**Luna-equivalent input rate used for planning**|US$0.234 per 1M input tokens|
|**Luna-equivalent output rate used for planning**|US$1.20 per 1M output tokens|
|**Base average page views per listing**|500|
|**Stress-case page views per listing**|5,000|
|**Monthly listing scenarios**|5,000 and 10,000|



##### **16.2  Unit economics** 

|**Unit**|**Calculation**|**Cost**|
|---|---|---|
|One model call — input|800 / 1,000,000 × $0.234|$0.0001872|
|One model call — output|100 / 1,000,000 × $1.20|$0.0001200|
|One complete model call|Input + output|$0.0003072|
|One 20-call session|20 × $0.0003072|$0.006144|
|One listing at 500 views|500 × 20% × 20 calls|$0.6144|
|One listing at 5,000 views|5,000 × 20% × 20 calls|$6.1440|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 27 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

##### **16.3  Monthly full-LLM cost scenario** 

|**Average views / listing**|**5,000 listings / month**|**10,000 listings / month**|
|---|---|---|
|**500 views — base**|$3,072|$6,144|
|**1,000 views**|$6,144|$12,288|
|**2,500 views**|$15,360|$30,720|
|**5,000 views — stress**|$30,720|$61,440|



###### **Interpretation** 

These figures assume every one of the 20 interactions uses the model. Page views alone do not consume model tokens. The architecture should reduce model-call share without weakening free-text understanding. 

##### **16.4  Hybrid routing target** 

|**Share of chat interactions**<br>**requiring an LLM**|**5,000 listings at 500 views**|**10,000 listings at 500 views**|**What enables it**|
|---|---|---|---|
|100%|$3,072|$6,144|No optimisation; conservative<br>ceiling.|
|60%|$1,843|$3,686|Buttons, direct tools and approved<br>FAQs bypass model.|
|50%|$1,536|$3,072|Good structured-data coverage<br>and compact flows.|
|40%|$1,229|$2,458|Strong direct routing, FAQ reuse<br>and action-heavy sessions.|



##### **16.5  Mandatory cost controls** 

- No model call merely because the chat widget opens or a result card renders. 

- Button and selected-action metadata must bypass semantic interpretation. 

- Only requested/relevant property fields are supplied to the model. 

- Approved FAQs and deterministic calculations are reused directly. 

- Full transcripts are not resent each turn; compact state and relevant recent turns are used. 

- Average input/output limits are monitored against 800/100 planning targets. 

- Rate limits, bot detection, authentication tiers and session caps prevent abuse. 

- Daily/weekly/monthly spend alerts and provider circuit breakers are implemented. 

- Cost is tracked per surface, listing, agent, model, session, action and successful booking. 

##### **16.6  Decision standard** 

###### **Do not optimise the wrong thing** 

A cheaper model or regex route that produces irrelevant answers, false facts or broken booking flows is not a saving. The relevant measure is cost per accurate, useful conversation and cost per completed action—not cost per raw API call. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 28 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **17  Model/provider evaluation** 

_Choose the cheapest model that passes the product standard; do not lower the standard to justify the cheapest model._ 

##### **17.1  Candidate evaluation** 

OpenAI, Qwen, DeepSeek and other candidates must receive the same prompts, tool schemas, fixtures and conversations. The current regex build should also be included as a baseline. Model names and prices may change; the benchmark and provider interface must remain stable. 

|**Metric**|**Weight / gate**|**Measurement**|
|---|---|---|
|Grounded factual correctness|Hard gate: 100% supported property/agent<br>claims|Automated source trace + human review.|
|Intent and canonical attribute mapping|20%|Pass rate across direct, indirect, multi-intent,<br>typo and mixed-language tests.|
|Tool selection and argument accuracy|20%; booking/cancel hard gate|Exact tool and valid parameters.|
|Context retention|10%|Follow-ups, pronouns, refinements and<br>cross-surface carry-over.|
|Unknown / policy handling|15%; zero dangerous overclaiming|Correct uncertainty, listing type, accessibility<br>and fair-treatment behaviour.|
|Response usefulness and CTA relevance|10%|Answer-first, concise, appropriate next<br>action.|
|Latency|10%|p50/p95 end-to-end and time to first useful<br>response.|
|Cost|15%|Cost per passed test, successful session<br>and completed action.|



##### **17.2  Test design requirements** 

- Use at least 200–500 representative test conversations before provider approval. 

- Include Kenil’s failure cases, the existing 50-category QA matrix, bookings, global search, agent questions, mixed language and adversarial inputs. 

- Run tests on fixed listing fixtures so every candidate sees the same source data. 

- Measure schema-valid structured output separately from fluent response quality. 

- Retest after prompt, model or tool-schema changes; do not rely on one successful demo. 

- Run controlled production A/B tests only after offline gates pass. 

##### **17.3  Router policy ownership** 

The routing policy is a product/engineering asset, not a hidden provider feature. Viewings must be able to change model thresholds, disable a provider, cap spend and inspect why a request used a fallback model. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 29 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **18  Guardrails, privacy and fair treatment** 

_Safety must be designed into retrieval, tools and response validation—not left to a generic prompt._ 

##### **18.1  Guardrail categories** 

|**Category**|**Required control**|
|---|---|
|**Grounding**|No unsupported property, agent, availability or action claims.|
|**Fair treatment**|Do not filter, rank or advise housing based on protected<br>characteristics; redirect to objective property criteria.|
|**Privacy / PII**|Collect only necessary contact data; mask it in logs; enforce<br>access and retention policies.|
|**Human identity**|Never impersonate an agent or imply the human has replied<br>when they have not.|
|**Financial / legal**|Use deterministic calculations and approved NZ-specific<br>content; avoid unsupported legal advice.|
|**Accessibility**|Do not infer accessibility from photos or generic features; state<br>verification status.|
|**Prompt/tool security**|Treat listing text and documents as data, not instructions;<br>allowlist tools and parameters.|
|**Abuse/cost**|Rate-limit bots, repeated spam, scraping and automated high-<br>volume conversations.|
|**Scope**|Reject unrelated requests and keep tools within the active<br>user/listing/agent permissions.|



##### **18.2  Sensitive contact handling** 

- Contact details must be captured through secure UI fields where possible, not unnecessarily repeated in model prompts. 

- Logs should store masked phone/email representations and a user/contact ID rather than raw values. 

- Human message and callback flows require explicit user consent and visible delivery status. 

- Agent private calendar details, internal notes and personal contact data must not be exposed through Agent AI. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 30 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **19  Analytics and operational controls** 

_Without trace-level analytics, the team cannot prove accuracy, savings or conversion._ 

##### **19.1  Events to capture** 

|**Event group**|**Required fields**|
|---|---|
|**Chat/session**|session_id, user_id/anonymous ID, surface, scope IDs, start/end,<br>locale, device|
|**Routing**|route selected, reason, deterministic/FAQ/model/fallback/human|
|**Model**|provider, model, prompt version, input/cached/output tokens,<br>latency, cost, schema status|
|**Retrieval/tool**|tool name, parameters hash, success/error, source IDs, freshness,<br>trace_id|
|**Response**|intent, canonical attributes, source trace, CTA IDs, validation result|
|**User actions**|CTA click, card open, save, refine, booking start/completion,<br>message/callback|
|**Quality**|thumbs up/down, correction, unsupported answer report, escalation<br>outcome|
|**FAQ**|match, hit/miss, approval state, dependency validity, saved model<br>call|
|**Agent efficiency**|questions deflected, escalations, response time, repeated question<br>clusters|



##### **19.2  Required dashboards** 

- Executive funnel: page view → chat start → useful answer → action → booking/contact. 

- Quality: intent accuracy, unsupported-answer rate, tool errors, unknown rate and user feedback. 

- Cost: spend by day/model/surface/listing, cost per session, cost per booking, fallback rate and cache/FAQ savings. 

- Agent value: top repetitive questions, questions answered without agent, escalations and estimated time saved. 

- Operations: provider latency/errors, availability/booking failures, rate-limit events and budget alerts. 

##### **19.3  Alert thresholds** 

|**Alert**|**Initial threshold**|
|---|---|
|Unsupported factual claim|Any confirmed occurrence: P0 incident and regression test.|
|Booking confirmation without booking ID|Any occurrence: P0 incident.|
|Average input tokens|>800 over rolling production window: investigate prompt/state<br>size.|
|Average output tokens|>100 without increased user request complexity: investigate<br>verbosity.|
|Fallback usage|>5%: investigate default model or routing.|
|Daily cost|Above configurable forecast threshold or anomalous growth.|
|Tool error rate|>2% or material booking/search degradation.|
|Latency p95|Above agreed surface-specific target.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 31 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **20  Non-functional requirements** 

_Production quality includes speed, reliability, maintainability and auditability._ 

|**ID**|**Requirement**|**Initial target**|
|---|---|---|
|**NFR-001**|Availability for chat orchestration and core read<br>tools.|≥99.9% monthly, excluding approved<br>maintenance.|
|**NFR-002**|Time to first useful response for direct/FAQ<br>path.|p95 ≤1 second, excluding network extremes.|
|**NFR-003**|Time to first useful response for model path.|p95 ≤2.5 seconds; stream only after<br>route/source decisions are safe.|
|**NFR-004**|Booking/action completion latency.|p95 ≤4 seconds or visible progress state.|
|**NFR-005**|Timezone.|All relative date logic uses Pacific/Auckland<br>unless the user explicitly selects another zone.|
|**NFR-006**|Idempotency.|Booking, cancellation, messages, callbacks,<br>alerts and payments are protected against<br>duplicate execution.|
|**NFR-007**|Auditability.|Every factual answer and action is traceable by<br>session/trace ID.|
|**NFR-008**|Provider resilience.|Configurable timeout, retry, fallback and circuit<br>breaker; no silent provider switch that changes<br>policy.|
|**NFR-009**|Data freshness.|Availability and listing status honour explicit<br>expiry/freshness rules.|
|**NFR-010**|Accessibility.|Chat controls, cards, status messages and<br>keyboard/screen-reader behaviour meet<br>platform accessibility standard.|
|**NFR-011**|Security.|Least-privilege tool credentials, encrypted<br>transport/storage, prompt-injection protection<br>and secure secrets.|
|**NFR-012**|Maintainability.|Versioned prompts, schemas, tools, intents,<br>FAQs and tests with rollback capability.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 32 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **21  Acceptance requirements and QA handoff** 

_Requirements are defects when unmet, not optional feedback._ 

##### **21.1  Core acceptance requirements** 

###### **BEH-001 — Answer first  [P0]** 

**Requirement:** The assistant must answer the current question before offering a booking or contact CTA. **Acceptance:** For every QA case, the first substantive content resolves the intent or states that the information is unknown. 

###### **GRD-001 — No invented facts  [P0]** 

**Requirement:** No property, agent, availability or booking fact may be stated without a valid source/tool result. **Acceptance:** Source trace exists for every factual claim; unsupported claim count = 0. 

###### **INT-001 — Semantic intent  [P0]** 

**Requirement:** Free-text questions must map to canonical intent and attributes rather than nearest keyword. **Acceptance:** Kenil intent-failure cases and expanded paraphrases pass. 

###### **TOOL-001 — Real action confirmation  [P0]** 

**Requirement:** Bookings, cancellations, messages, callbacks and alerts are confirmed only after tool success. **Acceptance:** A tool failure never produces a success statement. 

###### **CTX-001 — Scope and context  [P0]** 

**Requirement:** Relevant conversation state and correct listing/agent/global scope must be retained. **Acceptance:** Follow-up, refinement and cross-surface tests pass without contamination. 

###### **DATE-001 — Relative dates  [P0]** 

**Requirement:** Relative dates are resolved deterministically in Pacific/Auckland. 

**Acceptance:** “Next Saturday”, “day after tomorrow” and “end of month” map to exact dates in test context. 

###### **FAQ-002 — FAQ invalidation  [P1]** 

**Requirement:** Approved FAQ reuse must stop when a dependent source field changes or expires. **Acceptance:** Updated listing data triggers dependency invalidation and a fresh verified response. 

###### **COST-001 — Token observability  [P1]** 

**Requirement:** Every model call must record provider/model and token usage. **Acceptance:** Dashboard reconciles provider usage with platform traces. 

###### **CTA-001 — Contextual CTA  [P1]** 

**Requirement:** Responses display zero to two relevant CTAs based on current user intent. **Acceptance:** No irrelevant or premature CTA in the acceptance set. 

###### **HUM-001 — AI/human distinction  [P0]** 

**Requirement:** Agent AI and direct human messaging are visibly distinct. **Acceptance:** Users can identify who/what generated the response and message delivery status. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 33 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

##### **21.2  QA artefact relationship** 

This specification defines the required behaviour and architecture. The separate Viewings AI Chat QA & Acceptance Test Matrix converts these requirements and Kenil’s 50 categories into executable cases. A feature is not complete when the developer demonstrates one happy path; it is complete only when the agreed test suite passes and the evidence is recorded. 

##### **21.3  Definition of a passed test** 

- Correct intent and canonical attributes. 

- Correct source or tool selected. 

- No unsupported facts or policy violations. 

- Correct listing type and surface scope. 

- Correct context and date handling. 

- Correct CTA sequencing and real action status. 

- Token, latency and trace fields recorded. 

- Expected UI state rendered on mobile and desktop where applicable. 

### **22  Implementation plan and definition of done** 

_Build in vertical slices that prove the architecture, not isolated UI screens._ 

##### **22.1  Recommended phases** 

|**Phase**|**Scope**|**Exit criteria**|
|---|---|---|
|0. Baseline and fixtures|Freeze current behaviour, create<br>representative rental/sale/agent fixtures,<br>instrument current regex build.|Current pass/fail and token/latency baseline<br>documented.|
|1. Foundation|Surface context, canonical schemas,<br>deterministic router, tool contracts, trace IDs<br>and analytics.|Direct fact and action routes work with no<br>LLM; scope isolation proven.|
|2. Listing AI|Default model intent/entity extraction, listing<br>retrieval, unknown handling, CTAs, session<br>state.|Core listing categories and Kenil failures<br>pass.|
|3. Availability and booking|Date resolver, live slots, contact/OTP,<br>create/cancel/reschedule, notifications.|End-to-end booking passes<br>success/failure/idempotency tests.|
|4. Agent AI and human messaging|Approved agent profile/services, callback,<br>direct-message distinction.|Agent questions and contact actions pass<br>with privacy controls.|
|5. Global AI search|Structured natural-language search,<br>refinement, cards, saved search,<br>comparison and route plan.|Search returns verified results and respects<br>live viewings.|
|6. FAQ and model routing|Approval workflow, semantic FAQ reuse,<br>provider abstraction, fallback policy, cost<br>controls.|Measured LLM-call reduction without quality<br>regression.|
|7. Hardening and launch|Full regression, load/security/accessibility,<br>dashboards, runbooks and staged rollout.|All P0/P1 acceptance gates pass; rollback<br>and support process approved.|



##### **22.2  Definition of done** 

- Code is deployed to the agreed test environment and linked to real or production-equivalent tools. 

- UI, backend, model, source and error paths are demonstrated end to end. 

- Acceptance tests pass with recorded actual responses and trace IDs. 

- No open P0 defects; P1 defects require explicit product acceptance and dated remediation. 

- Token/latency/cost data is visible and within the agreed thresholds. 

- Prompt, schema, tool and configuration versions are documented and rollback-ready. 

- Agent/admin workflows for FAQ approval and unanswered-question review are usable. 

- Operational runbooks cover provider outage, tool outage, cost spike and unsafe answer investigation. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 34 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **23  Roles, governance and change control** 

_Clear ownership prevents the same issue being called a suggestion, bug or interpretation depending on the meeting._ 

##### **23.1  Responsibility matrix** 

|**Area**|**Accountable**|**Responsible / consulted**|
|---|---|---|
|Product behaviour and priorities|Viewings product owner|BA, UX, agent representatives, QA|
|Architecture and tool contracts|Technical lead / CTO|Backend, AI engineer, security, product|
|Conversation and CTA design|Product + UX|AI engineer, agents, QA|
|Structured data schema|Product + backend lead|Agents/listers, search, AI engineer|
|Model benchmark and routing|AI/technical lead|QA, product, finance/operations|
|FAQ approval policy|Product/operations|Agents, admins, compliance|
|Acceptance testing|QA lead|Product, BA, developers|
|Cost and operational monitoring|Technical/operations lead|Finance, product, provider owners|
|Release decision|Viewings product owner|QA and technical sign-off required|



##### **23.2  Change control** 

- Every material behavioural change requires a requirement ID, rationale, impacted flows and updated tests. 

- Changing model provider does not waive behaviour, grounding, tool or QA requirements. 

- Any proposed cost-saving shortcut must show measured quality impact and receive written approval. 

- Prompt-only fixes for architectural failures are temporary unless the test evidence proves they are robust. 

- Production incidents must create a regression test before closure. 

###### **Vendor communication rule** 

When this document says “must”, failure is a defect. When it says “should” or “target”, the team may propose an alternative with evidence. Silence or a different interpretation is not approval. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 35 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **24  Open decisions** 

_Items that remain configurable without creating ambiguity about the required behaviour._ 

|**Decision**|**Options / question**|**Decision timing**|
|---|---|---|
|Default and fallback model|OpenAI, Qwen, DeepSeek or another<br>candidate based on benchmark.|Before production model integration is<br>locked.|
|Provider gateway|Direct multi-provider adapters versus a<br>managed gateway/OpenRouter-style<br>service.|During architecture design; avoid unplanned<br>lock-in.|
|Exact fallback threshold|Schema failure, missing entities, policy<br>conflict and/or calibrated score.|After offline benchmark.|
|FAQ approval roles|Listing agent, branch admin, brand admin or<br>central moderation by scope.|Before FAQ workflow build.|
|Human response SLA|Expected callback/message response by<br>agency/plan.|Before user-facing expectation copy is final.|
|Initial model-call share target|40%, 50% or 60% based on observed<br>interaction mix.|After instrumented beta.|
|Session limits and plan entitlements|Anonymous, signed-in, agent and paid-tier<br>usage caps.|Before public launch and pricing finalisation.|
|Neighbourhood/external data sources|Approved sources for transport, school,<br>commute and local data.|Before those intents are enabled.|



###### **What is not open** 

The product is not deciding between “good UX” and “low cost”. The required architecture must deliver good UX and then reduce cost through routing, structured data, reusable approved knowledge and measured model selection. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 36 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Appendix A  Canonical intent catalogue** 

_Initial intent taxonomy; version and expand through QA evidence._ 

|**Intent**|**Scope / examples**|
|---|---|
|**PROPERTY_FACT**|price/rent, beds, baths, parking, furnishing, heating, pets, outdoor,<br>accessibility, documents|
|**PROPERTY_SUITABILITY**|vehicle fit, pet/outdoor need, work-from-home, family/layout, mobility<br>need|
|**FINANCIAL_CALCULATION**|bond, move-in total, rent frequency, approved fees|
|**VIEWING_AVAILABILITY**|date/time request, next weekend, after work, date range|
|**BOOK_VIEWING**|select, confirm, attendee/contact, booking status|
|**CANCEL_RESCHEDULE**|cancel, change slot, conflict resolution|
|**ASK_AGENT**|unverified property question or human judgement|
|**AGENT_PROFILE**|experience, areas, languages, role, office|
|**AGENT_SERVICES**|fees, appraisal, management, sales/letting services|
|**CALLBACK_MESSAGE**|direct human contact and status|
|**GLOBAL_SEARCH**|buy/rent, location, price, property attributes, viewing window|
|**REFINE_SEARCH**|modify active filters without losing prior context|
|**COMPARE_LISTINGS**|same-field comparison across selected IDs|
|**SAVE_ALERT**|persist criteria and notification settings|
|**ROUTE_PLAN**|order viewings and identify travel/time conflicts|
|**OFF_TOPIC**|return to permitted scope|
|**FAIR_TREATMENT_BLOCK**|reject protected-characteristic housing filters|
|**SUPPORT_ERROR**|tool outage, stale data, inactive listing, delivery failure|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 37 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Appendix B  Structured search example** 

_Normative example for global natural-language search._ 

User: “I’m free next Saturday from 9 to 2. Find sales listings in Papatoetoe under $500,000 with at least three bedrooms and two bathrooms.” 

```
{
  "surface": "GLOBAL_SEARCH",
  "intent": "SEARCH_LISTINGS",
  "filters": {
    "listing_type": "SALE",
    "locations": [{"type": "SUBURB", "value": "Papatoetoe"}],
    "price_max": 500000,
    "bedrooms_min": 3,
    "bathrooms_min": 2,
    "viewing_window": {
      "date": "2026-08-15",
      "time_from": "09:00",
      "time_to": "14:00",
      "timezone": "Pacific/Auckland"
    }
  },
  "missing_required": [],
  "clarification_needed": false
}
```

The backend validates the schema, queries the active listing index and live availability, then returns listing cards. The LLM does not create or select imaginary properties. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 38 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Appendix C  Prohibited behaviours** 

_These behaviours are automatic defects._ 

|**Prohibited behaviour**|**Why it is unacceptable**|
|---|---|
|Keyword answer that misses the underlying need|Produces irrelevant responses and proves semantic routing failure.|
|Inventing or inferring an unrecorded property feature|Creates trust, legal and safety risk.|
|Applying rental policy to a sale listing|Wrong context and potentially misleading guidance.|
|Showing “booked”, “sent”, “cancelled” or “saved” before tool<br>success|Creates phantom actions and support failures.|
|Using a stale slot as live availability|Can cause double-booking and user frustration.|
|CTA before answer|Feels sales-led and can bypass an important suitability/safety<br>question.|
|AI impersonating an agent|Misleads the user about who is communicating.|
|Automatically approving prior AI answers as FAQs|Turns a possible hallucination into repeated misinformation.|
|Sending the entire listing and transcript on every call|Needless cost, latency and privacy exposure.|
|Selecting a cheaper route that fails the acceptance benchmark|Optimises API spend at the expense of the product.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 39 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Appendix D  Evidence and supporting artefacts** 

_Inputs used to define this specification._ 

|**Artefact**|**How it is used**|
|---|---|
|Kenil — AI chat screenshots (1).pdf|Evidence of current strengths, semantic failures, grounding/listing-<br>type issues, CTA problems and improvement ideas.|
|Viewings AI Chat QA & Acceptance Test Matrix.xlsx|Executable test cases based on Kenil’s categories and the required<br>behaviour.|
|Viewings AI Chat Executive Decision Deck.pptx|Executive summary and decision framing.|
|Previous AI Chat Behaviour and Technical Specification|Foundation that this version expands with three surfaces, cost<br>model, FAQ loop, routing, model selection and more implementation<br>detail.|
|Current Viewings UI concepts|Listing/global chat entry, structured filter chips, result cards, saved<br>AI search and action patterns.|
|This specification|Authoritative behaviour, architecture, build, cost and acceptance<br>contract for implementation.|



Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 40 

**VIEWINGS.CO.NZ  |  AI CHAT BUILD SPECIFICATION** 

### **Final decision statement  Build the assistant users need—not the chea est demo that a ears conversational.** **<u>p pp</u>** 

###### **Required outcome** 

A home seeker must be able to ask naturally, receive a fast and accurate answer, and take the next real action. An agent must receive fewer repetitive questions and better-qualified human enquiries. Viewings must be able to prove the answer source, action status, conversion result and token cost. 

The correct system is not “regex versus LLM”. It is a layered product: deterministic actions and structured facts where they are reliable, language models where interpretation is necessary, verified tools for real actions, human escalation for unknowns, and measurement across the whole funnel. 

This architecture is more accurate, more maintainable and ultimately cheaper than an expanding regex patchwork or an unrestricted model that rereads everything on every turn. 

Version 2.0 — 6 August 2026 

CONFIDENTIAL — PRODUCT & ENGINEERING 

Page 41 

