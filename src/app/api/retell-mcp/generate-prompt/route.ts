import { NextRequest, NextResponse } from 'next/server';

interface BusinessContext {
  company_name: string;
  business_type: string;
  services: string[];
  staff: string[];
  office_hours: string[];
  phone: string;
  website: string;
  agent_type: string;
}

interface RetellPromptRequest {
  instruction: string;
  business_data: BusinessContext;
}

interface GeneratedScripts {
  greeting: string;
  main: string;
  closing: string;
  escalation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetellPromptRequest = await request.json();
    const { instruction, business_data } = body;

    if (!business_data || !business_data.company_name) {
      return NextResponse.json(
        { error: 'Business data is required' },
        { status: 400 }
      );
    }

    // Apply Retell MCP System Instruction for prompt engineering
    const systemPrompt = `You are a Conversational AI Prompt Engineer.
Your job is to take raw website text, business info, and uploaded files, then extract key details and generate a voice-ready system prompt for Retell AI.

Step 1 – Extract Key Details
From provided sources, extract and structure:
Company description
Office hours
Staff members + services/job types each handles
Value Proposition
Business models
Target audiences
Questions & Answers (FAQ)
Policies (e.g., cancellations, payments, guarantees)
Pricing
Any other relevant business details

Step 2 – Populate Prompt Template
Use the provided conversational business prompt template (different per business type).
Replace all placeholders with extracted values.
Preserve all section headers and formatting exactly.

Step 3 – Voice-AI Best Practices
Keep each AI turn 1–2 sentences (<30 words).
Use natural, human-like speech (contractions, pauses, casual flow).
Only one question per turn.
Follow the full Conversation Framework:
Opening → friendly intro
Pain → surface prospect's challenge
Amplify → show stakes of inaction
Qualify → gather info (budget, needs, timeline)
Solve → position service/product
Proof → credibility, testimonials, benefits
Close → guide to booking/demo/payment

Step 4 – Finalize Output
Output only the fully populated markdown system prompt (ready for copy-paste into Retell).
No internal reasoning, no extra notes.
If any required detail is missing or unclear, ask one clarifying question first before generating.

:zap: End goal: Deliver a polished, conversational, ready-to-upload Retell AI prompt that instantly works as a voice script for outreach, qualification, and lead handling.`;

    // Generate voice-ready scripts based on business context and agent type
    const scripts = generateVoiceReadyScripts(business_data);

    return NextResponse.json({
      success: true,
      scripts,
      system_prompt: systemPrompt,
      business_context: business_data,
    });
  } catch (error) {
    console.error('Error in Retell MCP generate-prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}

function generateVoiceReadyScripts(
  businessData: BusinessContext
): GeneratedScripts {
  const {
    company_name,
    business_type,
    services,
    staff,
    office_hours,
    phone,
    agent_type,
  } = businessData;

  // Determine if this is a healthcare business for specialized handling
  const isHealthcare =
    business_type.toLowerCase().includes('health') ||
    business_type.toLowerCase().includes('medical') ||
    business_type.toLowerCase().includes('dental') ||
    business_type.toLowerCase().includes('clinic');

  const servicesText =
    services.length > 0 ? services.slice(0, 5).join(', ') : 'our services';
  const staffText =
    staff.length > 0 ? staff.slice(0, 5).join(', ') : 'our team';
  const hoursText =
    office_hours.length > 0
      ? office_hours.slice(0, 3).join(', ')
      : 'business hours';

  // Generate scripts based on agent type with voice-AI optimizations
  switch (agent_type) {
    case 'inbound receptionist':
      return {
        greeting: `Hi there! Thanks for calling ${company_name}. I'm Emily, your AI receptionist. How can I help you today?`,
        main: `## Voice AI Instructions

**Conversation Framework:**
1. **Opening** - Friendly, professional greeting
2. **Identify** - Get caller name and purpose
3. **Qualify** - Understand their specific needs
4. **Solve** - Direct to appropriate service/staff
5. **Close** - Confirm next steps, thank them

**Voice Guidelines:**
- Keep responses under 30 words
- Use contractions naturally ("I'll", "we're", "can't")
- One question per turn
- Sound warm and helpful

**Available Services:** ${servicesText}
**Team Members:** ${staffText}
**Hours:** ${hoursText}

**Common Flows:**
- Appointment booking → Transfer to scheduling
- General questions → Provide info, offer callback
- Urgent matters → Immediate transfer
- After hours → Take message, confirm callback time

**Key Phrases:**
- "I'd be happy to help with that"
- "Let me connect you right away"
- "Is this the best number to reach you?"`,
        closing: `Perfect! You're all set. We'll see you ${isHealthcare ? 'for your appointment' : 'soon'}. Thanks for choosing ${company_name}!`,
        escalation: `I want to make sure you get the best help. Let me transfer you to ${staff[0] || 'our specialist'} right now.`,
      };

    case 'inbound customer support':
      return {
        greeting: `Hi! You've reached ${company_name} support. I'm here to help resolve any concerns. What's going on?`,
        main: `## Voice AI Support Instructions

**Support Framework:**
1. **Listen** - Acknowledge their concern warmly
2. **Understand** - Ask clarifying questions
3. **Verify** - Confirm account details
4. **Resolve** - Provide solution or escalate
5. **Follow-up** - Ensure satisfaction

**Voice Guidelines:**
- Empathetic tone for frustrated customers
- Short, clear responses
- Avoid technical jargon
- Show you're actively listening

**Escalation Triggers:**
- Billing disputes
- Technical issues beyond basic troubleshooting
- Angry or upset customers
- Complex account problems

**Resolution Steps:**
- Verify customer identity
- Document the issue
- Offer immediate solutions when possible
- Set clear expectations for follow-up`,
        closing: `I'm glad we could resolve that for you! Is there anything else I can help with today? Thanks for choosing ${company_name}!`,
        escalation: `I want to get you the best possible help. Let me connect you with our specialist who can resolve this completely.`,
      };

    case 'outbound follow up':
      return {
        greeting: `Hi! This is Emily from ${company_name}. Is this ${phone ? 'a good time to chat briefly' : 'convenient'}? I'm following up on your recent experience.`,
        main: `## Outbound Follow-up Instructions

**Follow-up Framework:**
1. **Permission** - Respect their time, ask if convenient
2. **Purpose** - Clear reason for calling
3. **Check-in** - How was their experience?
4. **Offer** - Additional services or support
5. **Close** - Thank them, confirm next steps

**Voice Guidelines:**
- Be respectful of their time
- Sound genuinely interested in their feedback
- Keep it brief but personal
- Offer value, not just checking boxes

**Common Purposes:**
- Post-service satisfaction check
- Appointment confirmation
- Routine follow-up for ongoing care
- Introduce new services

**Key Questions:**
- "How did everything go with your visit?"
- "Do you have any questions about next steps?"
- "Is there anything else we can help with?"`,
        closing: `Thanks so much for your time! We really appreciate choosing ${company_name}. Have a wonderful day!`,
        escalation: `I'd love to have our manager personally address any concerns. Can I connect you directly?`,
      };

    case 'outbound marketing':
      return {
        greeting: `Hi! This is Emily from ${company_name}. Do you have a quick minute? I'm reaching out about ${servicesText} that might interest you.`,
        main: `## Outbound Marketing Instructions

**Marketing Framework:**
1. **Permission** - Always ask for their time first
2. **Interest** - Quick value proposition
3. **Qualify** - Are they a good fit?
4. **Present** - Brief benefits, not features
5. **Close** - Clear next step or polite exit

**Voice Guidelines:**
- Respect "no" immediately
- Sound helpful, not pushy
- Focus on their needs, not your services
- Be conversational, not scripted

**Qualification Questions:**
- "Are you currently looking for ${business_type} services?"
- "What's most important to you in choosing a provider?"
- "When would you ideally like to get started?"

**Value Propositions:**
- Expertise: ${staffText}
- Convenience: ${hoursText}
- Quality: Professional ${business_type} services

**Closing Options:**
- Schedule consultation
- Send information packet
- Respectful decline acknowledgment`,
        closing: `Thanks for your time! I'll send those details to your email. Feel free to call us at ${phone} with any questions!`,
        escalation: `I'd love to connect you with our ${business_type} specialist who can answer all your specific questions in detail.`,
      };

    default:
      return {
        greeting: `Hello! Thanks for calling ${company_name}. I'm your AI assistant. How can I help you today?`,
        main: `## General AI Assistant Instructions

**Core Guidelines:**
- Keep responses under 30 words
- Ask one question at a time
- Be helpful and professional
- Transfer when needed

**Available Services:** ${servicesText}
**Team:** ${staffText}
**Hours:** ${hoursText}

**Common Tasks:**
- Answer questions about services
- Schedule appointments
- Transfer to appropriate staff
- Take messages when needed`,
        closing: `Great! Thanks for calling ${company_name}. Is there anything else I can help with today?`,
        escalation: `Let me connect you with someone who can help you better. Please hold for just a moment.`,
      };
  }
}
