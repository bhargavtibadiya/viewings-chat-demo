import type OpenAI from 'openai';

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_property',
      description: 'Get structured facts and attributes for a property',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string', description: 'Property ID' },
        },
        required: ['property_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_listings',
      description: 'Search listings with optional filters',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          listing_type: { type: 'string', enum: ['RENTAL', 'SALE'] },
          suburb: { type: 'string' },
          bedrooms: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_availability',
      description: 'Get bookable viewing slots for a property in NZ time',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          from_iso: { type: 'string' },
          to_iso: { type: 'string' },
        },
        required: ['property_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Book a viewing slot for the authenticated user',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          slot_id: { type: 'string' },
          contact_name: { type: 'string' },
          contact_email: { type: 'string' },
          contact_phone: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['property_id', 'slot_id', 'contact_name', 'contact_email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Cancel an existing booking owned by the user',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string' },
        },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_question_to_lister',
      description: 'Escalate an unanswered question to the property lister',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          question_text: { type: 'string' },
          resolved_intent: { type: 'string' },
          canonical_attributes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['property_id', 'question_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'capture_contact',
      description: 'Capture a contact lead with consent',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          purpose: { type: 'string' },
          consent: { type: 'boolean' },
        },
        required: ['name', 'email', 'purpose', 'consent'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_callback',
      description: 'Request a callback from the lister',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          contact: { type: 'string' },
          preferred_time: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['property_id', 'contact'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_session_memory',
      description: 'Read session context memory and approved answers when get_property is insufficient',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          property_id: { type: 'string' },
        },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_session_memory',
      description: 'Upsert facts into session context memory',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          attribute: { type: 'string' },
          value: { type: 'string' },
          source: { type: 'string' },
          last_topic: { type: 'string' },
        },
        required: ['session_id', 'attribute', 'value', 'source'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_approved_answers',
      description: 'Fetch approved lister answers when get_property and session memory are insufficient',
      parameters: {
        type: 'object',
        properties: {
          property_id: { type: 'string' },
          attributes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['property_id'],
      },
    },
  },
];
