/**
 * Maps natural user wording to canonical listing attributes before answer composition.
 * Complements LLM understanding with deterministic routing for known failure patterns.
 */

export interface CanonicalIntentRoute {
  /** Primary intent id for logs / debug. */
  intentId: string;
  /** Canonical attributes the answer must cover (order = answer priority). */
  attributes: string[];
  /** Short composition rule injected into the system prompt. */
  compositionHint: string;
  /** Sensitive topics: no viewing/slot CTAs until the attribute question is resolved. */
  suppressViewingCta: boolean;
  /** Human label for debug. */
  label: string;
}

interface RoutePattern {
  id: string;
  label: string;
  patterns: RegExp[];
  attributes: string[];
  compositionHint: string;
  suppressViewingCta?: boolean;
  /** Higher wins when multiple patterns match. */
  priority: number;
}

const ROUTE_PATTERNS: RoutePattern[] = [
  {
    id: 'furnishing_bed',
    label: 'Furnishing / buy a bed',
    priority: 100,
    patterns: [
      /\bbuy\s+a\s+bed\b/i,
      /\bneed\s+(?:to\s+)?(?:buy|bring)\s+a\s+bed\b/i,
      /\b(?:is\s+)?(?:a\s+)?bed\s+included\b/i,
      /\bdo\s+i\s+need\s+(?:to\s+)?(?:buy|bring).{0,20}\bbed\b/i,
      /\bfurnish(?:ed|ing)?\b/i,
      /\bunfurnished\b/i,
      /\bincluded\s+furniture\b/i,
      /\bfurniture\s+included\b/i,
    ],
    attributes: ['furnishing', 'included_furniture'],
    compositionHint:
      'Map to furnishing + included_furniture (NOT bedroom count). Say whether furnished and if a bed/furniture is included. If missing, say not specified and offer to ask the lister.',
  },
  {
    id: 'dog_outdoor',
    label: 'Dog / pet outdoor space',
    priority: 95,
    patterns: [
      /\bdog\b.{0,40}\b(?:outside|outdoors|yard|garden|play)\b/i,
      /\b(?:outside|outdoors|yard|garden)\b.{0,40}\bdog\b/i,
      /\bcan\s+my\s+(?:dog|pet)\s+play\b/i,
      /\bpet(?:s)?\s+play\s+outside\b/i,
    ],
    attributes: ['outdoor_space', 'fencing', 'pets_policy', 'body_corporate_pets'],
    compositionHint:
      'Answer outdoor_space first, then fencing, then pets_policy / body_corporate_pets if relevant. Do not answer only “pets allowed”. If fencing is unknown/not specified, say so clearly.',
  },
  {
    id: 'ensuite_layout',
    label: 'Ensuite / bedroom-bathroom link',
    priority: 90,
    patterns: [
      /\bbedroom\b.{0,40}\b(?:connect|connected|leads?|access|adjoin)\b.{0,40}\bbathroom\b/i,
      /\bbathroom\b.{0,40}\b(?:connect|connected|leads?|access|adjoin)\b.{0,40}\bbedroom\b/i,
      /\bensuite\b|\ben-suite\b|\ben suite\b/i,
      /\bdirect\s+(?:bathroom|bath)\s+access\b/i,
      /\bbedroom\s+connect(?:s|ed)?\s+to\s+(?:the\s+)?bathroom\b/i,
    ],
    attributes: ['ensuite', 'bathroom_layout'],
    compositionHint:
      'Map to ensuite / bathroom_layout (NOT bedroom or bathroom counts). Confirm ensuite/direct access only if listing data supports it; otherwise say not specified.',
  },
  {
    id: 'heating_warm',
    label: 'Heating / stay warm',
    priority: 85,
    patterns: [
      /\bstay\s+warm\b/i,
      /\bwill\s+i\s+freeze\b/i,
      /\bkeep(?:s)?\s+warm\b/i,
      /\bhow\s+(?:is\s+it\s+)?heat(?:ed|ing)\b/i,
      /\bheat(?:ing|ed)?\b/i,
      /\bheat\s*pump\b/i,
      /\binsulation\b/i,
      /\bthermal\b/i,
    ],
    attributes: ['heating', 'insulation', 'heat_pump'],
    compositionHint:
      'Map to heating + insulation (and heat_pump if present). State verified heating features only. Do not claim the home “stays warm” unless evidence supports it. Do not lead with air-conditioning/cooling unless the user asked about cooling/hot weather.',
  },
  {
    id: 'cooling_hot',
    label: 'Cooling / AC',
    priority: 84,
    patterns: [
      /\bair[\s-]?cond(?:ition(?:ing|er)?)?\b/i,
      /\b\bac\b/i,
      /\bcooling\b/i,
      /\bget\s+hot\b/i,
      /\bstay\s+cool\b/i,
    ],
    attributes: ['cooling', 'air_conditioning'],
    compositionHint:
      'Map to cooling / air_conditioning. Answer cooling facts only; do not substitute heating.',
  },
  {
    id: 'accessibility',
    label: 'Wheelchair / accessibility',
    priority: 100,
    patterns: [
      /\bwheelchair\b/i,
      /\bstep[\s-]?free\b/i,
      /\baccessib(?:le|ility)\b/i,
      /\bmobility\b/i,
      /\bdisabled\b/i,
      /\bcan\s+he\s+visit\b/i,
      /\bwide\s+doorways?\b/i,
    ],
    attributes: ['accessibility', 'step_free_access', 'lift'],
    compositionHint:
      'Sensitive: answer only verified accessibility / step_free_access / lift facts. If unknown or not specified, say so and offer to ask the lister. Do NOT present viewing slots or book CTAs on this turn. Do not assume the property is suitable.',
    suppressViewingCta: true,
  },
  {
    id: 'sale_pets',
    label: 'Pets on sale listing',
    priority: 80,
    patterns: [
      /\bpet[\s-]?friendly\b/i,
      /\bdon'?t\s+like\s+pets\b/i,
      /\bare\s+pets?\s+allowed\b/i,
      /\bpets?\s+allowed\b/i,
      /\bcan\s+i\s+(?:have|keep)\s+(?:a\s+)?(?:pet|dog|cat)\b/i,
    ],
    attributes: ['pets_policy', 'body_corporate_pets', 'body_corporate_rules'],
    compositionHint:
      'Apply listing_type: RENTAL uses pets_policy; SALE must not use rental landlord language — explain ownership is generally the buyer’s decision unless verified body_corporate_pets / restrictions exist. Only state verified restrictions.',
  },
  {
    id: 'weekly_rent_phrasing',
    label: 'Weekly rent (natural phrasing)',
    priority: 75,
    patterns: [
      /\bleaves?\s+(?:my\s+)?(?:account|bank)\b/i,
      /\bevery\s+friday\b/i,
      /\bweekly\s+rent\b/i,
      /\bhow\s+much\s+(?:is\s+)?(?:the\s+)?rent\b/i,
    ],
    attributes: ['weekly_rent', 'rentWeekly'],
    compositionHint:
      'Map to weekly rent / rentWeekly for rentals. On sale listings, clarify rent does not apply and use asking price if they meant purchase price.',
  },
  {
    id: 'wfh',
    label: 'Work from home',
    priority: 70,
    patterns: [
      /\bwork(?:ing)?\s+from\s+home\b/i,
      /\bwork\s+remotely\b/i,
      /\bwfh\b/i,
      /\bgood\s+for\s+working\b/i,
    ],
    attributes: ['workspace', 'internet', 'fibre_status'],
    compositionHint:
      'Map to workspace + internet/fibre. Answer only verified listing facts; do not invent lifestyle claims.',
  },
];

/**
 * Resolve the best-matching canonical intent route for a user message.
 * Returns null when no specialised pattern matches (LLM handles with general rules).
 */
export function resolveCanonicalIntent(userMessage: string): CanonicalIntentRoute | null {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return null;
  }

  // Prefer "stay warm" heating over generic cooling if both could fire.
  const matches: Array<RoutePattern & { score: number }> = [];

  for (const route of ROUTE_PATTERNS) {
    if (route.patterns.some((pattern) => pattern.test(trimmed))) {
      matches.push({ ...route, score: route.priority });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Special case: "stay warm" should not also pick cooling.
  const heatingHit = matches.find((match) => match.id === 'heating_warm');
  const coolingHit = matches.find((match) => match.id === 'cooling_hot');
  if (heatingHit && coolingHit && /\bwarm\b|\bfreeze\b|\bheat/i.test(trimmed) && !/\bcool|\bac\b|air[\s-]?cond|hot\b/i.test(trimmed)) {
    matches.splice(matches.indexOf(coolingHit), 1);
  }

  // Special case: "buy a bed" must beat any bedroom noun routing (prompt-level).
  matches.sort((a, b) => b.score - a.score);
  const best = matches[0]!;

  // Merge attributes when dog-outdoor and sale-pets both match → keep dog-outdoor attrs.
  const mergedAttributes = [...best.attributes];
  for (const match of matches.slice(1)) {
    if (match.priority >= best.priority - 15) {
      for (const attr of match.attributes) {
        if (!mergedAttributes.includes(attr)) {
          mergedAttributes.push(attr);
        }
      }
    }
  }

  return {
    intentId: best.id,
    label: best.label,
    attributes: mergedAttributes,
    compositionHint: best.compositionHint,
    suppressViewingCta: matches.some((match) => match.suppressViewingCta),
  };
}

/** Prompt block injected when a specialised route matches. */
export function formatIntentRouteForPrompt(route: CanonicalIntentRoute): string {
  return [
    'INTENT ROUTING (deterministic for this turn - follow exactly):',
    `- Matched intent: ${route.label} (${route.intentId})`,
    `- Canonical attributes to look up via get_property (in order): ${route.attributes.join(', ')}`,
    `- Composition: ${route.compositionHint}`,
    route.suppressViewingCta
      ? '- CTA: Do not call get_availability or offer viewing slots on this turn.'
      : '- CTA: Answer the attribute question first; CTA only after the direct answer.',
  ].join('\n');
}
