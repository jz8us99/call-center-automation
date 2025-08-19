'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';
import { CheckIcon, EditIcon, PlusIcon } from '@/components/icons';
import { Wand2, RefreshCw } from 'lucide-react';

interface BusinessInfo {
  business_name?: string;
  business_type?: string;
  services?: Array<{ name: string }>;
  staff?: Array<{ first_name: string; last_name: string }>;
  office_hours?: Array<{ day_name: string; formatted_hours?: string }>;
  business_phone?: string;
  business_website?: string;
}

// Helper function to generate enhanced call scripts with customer data collection
function generateEnhancedCallScript(
  agentType: string,
  businessInfo: BusinessInfo | null
) {
  const businessName = businessInfo?.business_name || '[Business Name]';
  const businessType = businessInfo?.business_type || 'business';
  const isHealthcare =
    businessType.toLowerCase().includes('health') ||
    businessType.toLowerCase().includes('medical') ||
    businessType.toLowerCase().includes('dental');

  const services = businessInfo?.services || [];
  const staff = businessInfo?.staff || [];
  const officeHours = businessInfo?.office_hours || [];
  const phone = businessInfo?.business_phone || '';
  // const website = businessInfo?.business_website || '';

  // Generate services list for script
  const servicesText =
    services.length > 0
      ? services
          .slice(0, 5)
          .map(s => s.name)
          .join(', ')
      : 'our services';

  // Generate staff list for script
  const staffText =
    staff.length > 0
      ? staff
          .slice(0, 5)
          .map(s => `${s.first_name} ${s.last_name}`)
          .join(', ')
      : 'our team members';

  // Generate office hours text
  const hoursText =
    officeHours.length > 0
      ? officeHours
          .slice(0, 3)
          .map(h => `${h.day_name} ${h.formatted_hours || 'varies'}`)
          .join(', ')
      : 'standard business hours';

  const scripts = {
    inbound_receptionist: {
      greeting: `Hello! Thank you for calling ${businessName}. I'm your AI receptionist, and I'm here to help you today. How may I assist you?`,

      main: `## Task
You will follow the steps below, do not skip steps, and only ask up to one question in response.
If at any time the user showed anger or wanted a human agent, call handoff_to_agent to transfer to a human representative.

0. Initialize
   - if start speaking, call get_meta_data to load clinic information.
   - if metadata cannot be retrieved, say having technical issue and then call end_call.

1. Begin
   - greet the caller using {{greeting_script}} from metadata.
   - Introduce yourself as Emily from {{practice_name}}.
   - Verify if the current phone number {{user_number}} is the best number to reach them.
     - if user says yes, continue.
     - if user says no, ask for the correct number and update it.

2. Identify the caller
   - if we have a phone number, call lookup_customer.
     - if patient exists, greet them by name and continue.
     - if patient does not exist, ask for first name, last name, email, date of birth${isHealthcare ? ', and insurance' : ''}.
       - after collecting all fields, call upsert_customer.
       - if upsert_customer fails, call end_call.

3. Ask the purpose of the call
   - if patient wants a new appointment, continue to booking flow.
   - if patient wants to reschedule, continue to rescheduling flow.
   - if patient only has a question you cannot answer, call handoff_to_agent.

4. Collect appointment details
   - Ask for the reason of visit. Mention available services from {{services}}: ${servicesText}.
   - Mention which doctor provide the service of reason of visit.
   - now is {{current_time}}
   - Ask if they have a preferred doctor from {{team}}: ${staffText} or first available.
   - Mention available services provided by the doctor they preferred.
   - Ask what day and time works best.
   - Once reason, doctor preference, and date/time service are provided continue to 5.

5. Check availability
   - call find_openings with service, doctor, date, and time.
     - if an opening is found, propose it to the patient.
       - if accepted, continue to step 6.
       - if rejected, offer alternative slots.
     - if find_openings fails, call end_call.

6. Confirm the appointment details
   - First, repeat back the details in natural language:
     > "Let's confirm: Patient {{first_name}} {{last_name}}, reason: {{service}}, with Dr. {{doctor}} on {{date}} at {{time}} at {{location}}. Does everything look correct?"
   - Do **not** call any function until the user responds.
   - if user says **yes / correct / sounds good** → then call book_appointment.
     - if book_appointment success, confirm appointment ID and continue.
     - if book_appointment failure, say sorry and call end_call.
   - if user says **no / change** → go back to step 4 to re-collect details.
   - if user is angry or requests a human → call handoff_to_agent.

7. Wrap up
   - Ask if the patient has any other questions.
     - if yes, answer if possible.
       - if you do not know, say so and ask if they have another question.
       - if questions are complete, continue.
     - if no more questions, read out {{closing_script}} and call end_call to hang up.`,

      closing: `"Great! You're all set with your appointment on [date] at [time] with [staff member]. You'll receive a confirmation email at [email] and a reminder call 24 hours before. Our office is located at [address], and our office hours are ${hoursText}. Is there anything else I can help you with today? Thank you for choosing ${businessName}, and have a wonderful day!"`,

      escalation: `"I understand you'd like to speak with someone directly. Let me transfer you to [staff member/department] right away. Please hold for just a moment, and they'll be right with you."`,
    },

    inbound_customer_support: {
      greeting: `Hi! Thank you for contacting ${businessName}. I'm your customer support assistant, and I'm here to help resolve any questions or concerns. How can I assist you today?`,

      main: `## Task
You will follow the steps below, do not skip steps, and only ask up to one question in response.
If at any time the user showed anger or wanted a human agent, call handoff_to_agent to transfer to a human representative.

0. Initialize
   - if start speaking, call get_meta_data to load business information.
   - if metadata cannot be retrieved, say having technical issue and then call end_call.

1. Begin
   - greet the caller using {{greeting_script}} from metadata.
   - Introduce yourself as support agent from {{practice_name}}.
   - Ask how you can help them today.

2. Issue identification
   - Listen to their concern and acknowledge the issue.
   - Ask for specific details about what's happening.
   - if issue is urgent or emergency, call handoff_to_agent immediately.

3. Customer verification
   - Ask for their first and last name.
   - Ask for the phone number on their account.
   - Ask for their email address.
   - call lookup_customer to verify their information.

4. Issue analysis
   - Based on the issue description, determine if it's:
     - appointment related: continue to step 5
     - billing related: call handoff_to_agent
     - service complaint: continue to step 5
     - general question: provide answer if known, otherwise call handoff_to_agent

5. Resolve or escalate
   - if you can resolve the issue: provide solution and ask if it helps.
     - if resolved: continue to step 6
     - if not resolved: call handoff_to_agent
   - if issue requires human intervention: call handoff_to_agent

6. Wrap up
   - Ask if they have any other questions or concerns.
     - if yes, go back to step 2
     - if no, thank them and call end_call`,

      closing: `"I'm glad I could help resolve your concern today. Is there anything else you need assistance with? Thank you for choosing ${businessName}, and please don't hesitate to call us if you have any other questions!"`,

      escalation: `"I want to make sure you get the most comprehensive help possible. Let me transfer you to [specialized department/manager] who can provide more detailed assistance with your specific concern."`,
    },

    outbound_follow_up: {
      greeting: `Hello! This is your AI assistant calling from ${businessName}. Am I speaking with [First Name]? I hope I'm reaching you at a good time. I'm calling to follow up regarding your recent experience with us.`,

      main: `## Task
You will follow the steps below, do not skip steps, and only ask up to one question in response.
This is an outbound follow-up call, so be polite and respectful of their time.

0. Initialize
   - call get_meta_data to load customer and appointment information.
   - if metadata cannot be retrieved, say having technical issue and then call end_call.

1. Identify and permission
   - Confirm you're speaking with the right person: "Am I speaking with {{customer_name}}?"
   - Introduce yourself from {{practice_name}}.
   - Ask if this is a good time to talk briefly.
     - if no, ask when would be better and call end_call.
     - if yes, continue.

2. State purpose
   - Explain the reason for the call:
     - if appointment confirmation: "I'm calling to confirm your upcoming appointment"
     - if post-service follow-up: "I wanted to check on your recent visit"
     - if routine follow-up: "I'm calling for a routine follow-up"

3. Main follow-up action
   - if appointment confirmation:
     - confirm appointment details: date, time, staff member
     - ask if they need to reschedule
     - if reschedule needed: call find_openings and offer alternatives
   - if post-service follow-up:
     - ask about their experience
     - ask if they have any questions or concerns
     - if concerns: address if possible or offer callback from staff
   - if routine follow-up:
     - ask if they need any services
     - mention upcoming recommended appointments if applicable

4. Wrap up
   - Ask if they have any other questions.
   - Thank them for their time.
   - call end_call to hang up politely.`,

      closing: `"Thank you for your time and for choosing ${businessName}. We appreciate your business and look forward to seeing you ${isHealthcare ? 'at your appointment' : 'again soon'}. Have a wonderful day!"`,

      escalation: `"I'd be happy to connect you directly with [staff member] or our manager to address any specific concerns or special requests you may have."`,
    },

    outbound_marketing: {
      greeting: `Hello! This is your marketing assistant from ${businessName}. Am I speaking with [First Name]? I hope you're having a great day! I'm reaching out because we have some services that might be valuable for you.`,

      main: `## Task
You will follow the steps below, do not skip steps, and only ask up to one question in response.
This is an outbound marketing call, so be respectful and professional. Always respect their choice to decline.

0. Initialize
   - call get_meta_data to load business and service information.
   - if metadata cannot be retrieved, say having technical issue and then call end_call.

1. Introduction and permission
   - Confirm you're speaking with the right person: "Am I speaking with {{prospect_name}}?"
   - Introduce yourself from {{practice_name}}.
   - Ask permission: "Do you have a few minutes to hear about our services?"
     - if no, respect their choice and call end_call politely.
     - if yes, continue.

2. Interest qualification
   - Ask if they're currently looking for ${servicesText}.
   - if not interested at all: thank them and call end_call.
   - if interested or unsure: continue.

3. Needs assessment
   - Ask about their specific needs or concerns.
   - Ask about their timeline for needing these services.
   - Ask what's most important to them in choosing a provider.

4. Service presentation
   - Based on their needs, briefly mention relevant services.
   - Mention qualified staff: ${staffText}.
   - Ask if they'd like to learn more.

5. Next steps
   - if interested: offer to schedule a consultation.
     - call find_openings for consultation availability.
     - if available: offer specific times.
   - if not ready: offer to send information via email.
   - if no interest: thank them and call end_call.

6. Wrap up
   - Confirm next steps (appointment or information sent).
   - Thank them for their time.
   - call end_call.`,

      closing: `"Thank you for your time today! I'll send you detailed information about our services to [email], and feel free to call us at ${phone} if you have any questions. We look forward to helping you with [service need]!"`,

      escalation: `"I'd love to connect you with one of our specialists who can provide more detailed information and answer any specific questions you might have about our services."`,
    },
  };

  return (
    scripts[agentType as keyof typeof scripts] || scripts.inbound_receptionist
  );
}

interface CallScript {
  id: string;
  agent_type: AgentType;
  script_name: string;
  greeting_script: string;
  main_script: string;
  closing_script: string;
  escalation_script: string;
  fallback_responses: string[];
  is_default: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

interface AgentTypeCallScriptsProps {
  agentType: AgentType;
  onSave: (scripts: CallScript[]) => Promise<void>;
  businessInfo?: any;
  initialScripts?: Record<string, unknown>;
  initialPrompt?: string;
}

export function AgentTypeCallScripts({
  agentType,
  onSave,
  businessInfo,
  initialScripts,
  initialPrompt,
}: AgentTypeCallScriptsProps) {
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);

  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  useEffect(() => {
    loadCallScripts();
  }, [agentType, initialScripts, initialPrompt]);

  const loadCallScripts = async () => {
    try {
      setLoading(true);

      // If initial scripts are provided, use them
      if (initialScripts && Object.keys(initialScripts).length > 0) {
        // console.log(
        //   'DEBUG: AgentTypeCallScripts loading initial scripts:',
        //   initialScripts
        // );
        const existingScript: CallScript = {
          id: 'existing-script',
          agent_type: agentType,
          script_name: `${agentType} Script`,
          greeting_script:
            (typeof initialScripts.greeting_script === 'string'
              ? initialScripts.greeting_script
              : '') || '',
          main_script:
            (typeof initialScripts.main_script === 'string'
              ? initialScripts.main_script
              : initialPrompt) || '',
          closing_script:
            (typeof initialScripts.closing_script === 'string'
              ? initialScripts.closing_script
              : '') || '',
          escalation_script:
            (typeof initialScripts.escalation_script === 'string'
              ? initialScripts.escalation_script
              : '') || '',
          fallback_responses: Array.isArray(initialScripts.fallback_responses)
            ? initialScripts.fallback_responses
            : [],
          is_default: true,
          language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // console.log(
        //   'DEBUG: AgentTypeCallScripts created script:',
        //   existingScript
        // );
        setScripts([existingScript]);
        setSelectedScript(existingScript);
      } else {
        // Create default script if no initial data
        const defaultScript = createDefaultScript();
        setScripts([defaultScript]);
        setSelectedScript(defaultScript);
      }
    } catch (error) {
      console.error('Failed to load call scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultScript = (): CallScript => {
    const businessName = businessInfo?.business_name || '[Business Name]';
    const businessPhone = businessInfo?.business_phone || '[Business Phone]';

    const scriptTemplates = {
      [AgentType.INBOUND_RECEPTIONIST]: {
        greeting: `Hello! Thank you for calling ${businessName}. My name is Alex, your AI receptionist. How may I assist you today?`,
        main: `I can help you with scheduling appointments, providing information about our services, directing your call to the right person, or answering general questions. What would you like assistance with?`,
        closing: `Thank you for calling ${businessName}. Is there anything else I can help you with today? Have a wonderful day!`,
        escalation: `I understand you need to speak with someone directly. Let me transfer you to the appropriate team member right away. Please hold for just a moment.`,
      },
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
        greeting: `Hello! You've reached ${businessName} customer support. I'm Alex, your AI support assistant, and I'm here to help resolve any issues or questions you may have.`,
        main: `I can assist with troubleshooting, account questions, service issues, billing inquiries, or general support. Can you tell me what specific issue you're facing today so I can provide the best assistance?`,
        closing: `I'm glad I could help resolve your issue today. Is there anything else you need assistance with? Thank you for choosing ${businessName}!`,
        escalation: `I want to make sure you get the most comprehensive help possible. Let me transfer you to one of our specialized support representatives who can provide more detailed assistance.`,
      },
      [AgentType.OUTBOUND_FOLLOW_UP]: {
        greeting: `Hello! This is Alex calling from ${businessName} at ${businessPhone}. I'm calling to follow up regarding your recent experience with us.`,
        main: `I wanted to check in about [appointment/service details] and see how everything went. Do you have any questions or feedback you'd like to share? I'm also here if you need to schedule any follow-up appointments.`,
        closing: `Thank you for your time and for choosing ${businessName}. We appreciate your business and look forward to serving you again. Have a wonderful day!`,
        escalation: `I'd be happy to connect you with our manager or the specific team member you worked with to address any concerns or special requests you may have.`,
      },
      [AgentType.OUTBOUND_MARKETING]: {
        greeting: `Hello! This is Alex calling from ${businessName}. I hope you're having a great day! I'm reaching out because we have some exciting services that might be valuable for you.`,
        main: `Based on your interests, I thought you'd like to know about [service/promotion details]. This could be a great opportunity to [benefit description]. Would you like to hear more about how this might help you?`,
        closing: `Thank you for your time today! I'll send you some information via email with all the details, and feel free to call us at ${businessPhone} if you have any questions or would like to learn more.`,
        escalation: `I'd love to connect you with one of our specialists who can provide more detailed information about our services and answer any specific questions you might have.`,
      },
    };

    console.log('AgentTypeCallScripts - agentType:', agentType);
    console.log(
      'Available scriptTemplates keys:',
      Object.keys(scriptTemplates)
    );

    const template = scriptTemplates[agentType];

    // Fallback to a default template if the agentType is not found
    const defaultTemplate = {
      greeting: `Hello! Thank you for calling ${businessName}. How may I assist you today?`,
      main: `I can help you with your inquiry. What would you like assistance with?`,
      closing: `Thank you for calling ${businessName}. Have a wonderful day!`,
      escalation: `Let me transfer you to someone who can better assist you. Please hold for just a moment.`,
    };

    const finalTemplate = template || defaultTemplate;

    return {
      id: 'default',
      agent_type: agentType,
      script_name: `Default ${agentConfig?.name || 'Agent'} Script`,
      greeting_script: finalTemplate.greeting,
      main_script: finalTemplate.main,
      closing_script: finalTemplate.closing,
      escalation_script: finalTemplate.escalation,
      fallback_responses: [
        "I apologize, but I didn't quite understand that. Could you please rephrase your request?",
        'I want to make sure I help you properly. Can you provide a bit more detail about what you need?',
        'Let me make sure I understand correctly. Are you asking about [clarification needed]?',
      ],
      is_default: true,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSaveScript = async () => {
    if (!selectedScript) return;

    try {
      const updatedScripts = scripts.map(s =>
        s.id === selectedScript.id ? selectedScript : s
      );
      setScripts(updatedScripts);
      await onSave(updatedScripts);
      setIsEditing(false);
      toast.success('Call scripts saved successfully!');
    } catch (error) {
      console.error('Failed to save script:', error);
      toast.error('Failed to save call scripts. Please try again.');
    }
  };

  const updateScript = (field: keyof CallScript, value: any) => {
    if (!selectedScript) return;
    setSelectedScript({ ...selectedScript, [field]: value });
  };

  const generateAgentSpecificScripts = async () => {
    if (!agentType || !businessInfo) {
      toast.error(
        'Agent type and business information are required to generate scripts'
      );
      return;
    }

    try {
      setGenerating(true);

      // Prepare business context for Retell MCP server
      const businessContext = {
        company_name: businessInfo?.business_name || '',
        business_type: businessInfo?.business_type || '',
        services: businessInfo?.services?.map((s: any) => s.name) || [],
        staff:
          businessInfo?.staff?.map(
            (s: any) => `${s.first_name} ${s.last_name}`
          ) || [],
        office_hours:
          businessInfo?.office_hours?.map(
            (h: any) => `${h.day_name} ${h.formatted_hours || 'varies'}`
          ) || [],
        phone: businessInfo?.business_phone || '',
        website: businessInfo?.business_website || '',
        agent_type: agentType.replace(/_/g, ' ').toLowerCase(),
      };

      // Use Retell MCP server to generate professional voice-ready prompt
      const retellPromptRequest = {
        instruction: `You are a Conversational AI Prompt Engineer. Your job is to take raw business info and generate a voice-ready system prompt for Retell AI.

Step 1 – Extract Key Details
From provided business info, extract and structure:
- Company description: ${businessContext.company_name} (${businessContext.business_type})
- Office hours: ${businessContext.office_hours.join(', ') || 'Not specified'}
- Staff members: ${businessContext.staff.join(', ') || 'Not specified'}
- Services: ${businessContext.services.join(', ') || 'Not specified'}
- Contact: ${businessContext.phone}
- Agent type: ${businessContext.agent_type}

Step 2 – Voice-AI Best Practices
Keep each AI turn 1–2 sentences (<30 words).
Use natural, human-like speech (contractions, pauses, casual flow).
Only one question per turn.
Follow the full Conversation Framework:
- Opening → friendly intro
- Pain → surface prospect's challenge  
- Amplify → show stakes of inaction
- Qualify → gather info (budget, needs, timeline)
- Solve → position service/product
- Proof → credibility, testimonials, benefits
- Close → guide to booking/demo/payment

Step 3 – Generate Scripts
Create greeting, main conversation flow, closing, and escalation scripts optimized for voice AI that:
- Sound natural and conversational
- Handle the specific business type appropriately
- Include proper call flows and function calls
- Are ready for Retell AI implementation

Output only the structured scripts without internal reasoning.`,
        business_data: businessContext,
      };

      // Call Retell MCP server (simulate API call for now)
      const response = await fetch('/api/retell-mcp/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retellPromptRequest),
      });

      if (!response.ok) {
        // Fallback to existing local generation if MCP server unavailable
        console.warn(
          'Retell MCP server unavailable, using fallback generation'
        );
        const enhancedScript = generateEnhancedCallScript(
          agentType,
          businessInfo
        );

        if (selectedScript) {
          const updatedScript: CallScript = {
            ...selectedScript,
            greeting_script: enhancedScript.greeting,
            main_script: enhancedScript.main,
            closing_script: enhancedScript.closing,
            escalation_script: enhancedScript.escalation,
            updated_at: new Date().toISOString(),
          };

          setSelectedScript(updatedScript);
          const updatedScripts = scripts.map(s =>
            s.id === updatedScript.id ? updatedScript : s
          );
          setScripts(updatedScripts);
        }
      } else {
        const generatedPrompt = await response.json();

        // Update the current script with Retell MCP generated content
        if (selectedScript && generatedPrompt.scripts) {
          const updatedScript: CallScript = {
            ...selectedScript,
            greeting_script:
              generatedPrompt.scripts.greeting ||
              selectedScript.greeting_script,
            main_script:
              generatedPrompt.scripts.main || selectedScript.main_script,
            closing_script:
              generatedPrompt.scripts.closing || selectedScript.closing_script,
            escalation_script:
              generatedPrompt.scripts.escalation ||
              selectedScript.escalation_script,
            updated_at: new Date().toISOString(),
          };

          setSelectedScript(updatedScript);
          const updatedScripts = scripts.map(s =>
            s.id === updatedScript.id ? updatedScript : s
          );
          setScripts(updatedScripts);
        }
      }

      toast.success(
        'Professional voice-ready scripts generated using Retell MCP! Click "Save Call Scripts" to save them.'
      );
    } catch (error) {
      console.error('Error generating scripts with Retell MCP:', error);
      // Fallback to existing generation on error
      const enhancedScript = generateEnhancedCallScript(
        agentType,
        businessInfo
      );

      if (selectedScript) {
        const updatedScript: CallScript = {
          ...selectedScript,
          greeting_script: enhancedScript.greeting,
          main_script: enhancedScript.main,
          closing_script: enhancedScript.closing,
          escalation_script: enhancedScript.escalation,
          updated_at: new Date().toISOString(),
        };

        setSelectedScript(updatedScript);
        const updatedScripts = scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        );
        setScripts(updatedScripts);
      }

      toast.success(
        'Scripts generated using fallback method. Click "Save Call Scripts" to save them.'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 dark:bg-gray-800">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <span>{agentConfig?.icon}</span>
                <span>Call Scripts - {agentConfig?.name}</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Customize conversation flows and responses for your{' '}
                {agentType.replace(/_/g, ' ').toLowerCase()} agent
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateAgentSpecificScripts}
                disabled={generating || !businessInfo}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                title="Generate professional voice-ready scripts using Retell MCP server with advanced prompt engineering"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Prompt
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'View Mode' : 'Edit Scripts'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {selectedScript && (
        <div className="grid gap-6">
          {/* Greeting Script */}
          <Card className="dark:bg-gray-800">
            <CardHeader className="dark:bg-gray-800">
              <CardTitle className="text-lg dark:text-gray-100">
                Opening Greeting
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                First message when the call starts
              </CardDescription>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {isEditing ? (
                <Textarea
                  value={selectedScript.greeting_script}
                  onChange={e =>
                    updateScript('greeting_script', e.target.value)
                  }
                  placeholder="Enter opening greeting script..."
                  rows={3}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {selectedScript.greeting_script}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Script */}
          <Card className="dark:bg-gray-800">
            <CardHeader className="dark:bg-gray-800">
              <CardTitle className="text-lg dark:text-gray-100">
                Main Conversation Script
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Primary conversation flow and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {isEditing ? (
                <Textarea
                  value={selectedScript.main_script}
                  onChange={e => updateScript('main_script', e.target.value)}
                  placeholder="Enter main conversation script..."
                  rows={20}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 font-mono text-sm"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {selectedScript.main_script}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closing Script */}
          <Card className="dark:bg-gray-800">
            <CardHeader className="dark:bg-gray-800">
              <CardTitle className="text-lg dark:text-gray-100">
                Call Closing
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                How the agent ends the conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {isEditing ? (
                <Textarea
                  value={selectedScript.closing_script}
                  onChange={e => updateScript('closing_script', e.target.value)}
                  placeholder="Enter closing script..."
                  rows={3}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {selectedScript.closing_script}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation Script */}
          <Card className="dark:bg-gray-800">
            <CardHeader className="dark:bg-gray-800">
              <CardTitle className="text-lg dark:text-gray-100">
                Escalation & Transfer
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                When transferring to human agents
              </CardDescription>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {isEditing ? (
                <Textarea
                  value={selectedScript.escalation_script}
                  onChange={e =>
                    updateScript('escalation_script', e.target.value)
                  }
                  placeholder="Enter escalation script..."
                  rows={3}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {selectedScript.escalation_script}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fallback Responses */}
          <Card className="dark:bg-gray-800">
            <CardHeader className="dark:bg-gray-800">
              <CardTitle className="text-lg dark:text-gray-100">
                Fallback Responses
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                When the agent doesn't understand or needs clarification
              </CardDescription>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="space-y-3">
                {selectedScript.fallback_responses.map((response, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">
                      {index + 1}
                    </Badge>
                    {isEditing ? (
                      <Input
                        value={response}
                        onChange={e => {
                          const newResponses = [
                            ...selectedScript.fallback_responses,
                          ];
                          newResponses[index] = e.target.value;
                          updateScript('fallback_responses', newResponses);
                        }}
                        placeholder="Enter fallback response..."
                        className="flex-1"
                      />
                    ) : (
                      <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newResponses = [
                        ...selectedScript.fallback_responses,
                        '',
                      ];
                      updateScript('fallback_responses', newResponses);
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Fallback Response
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button - Always Visible */}
          <Card className="dark:bg-gray-800">
            <CardContent className="pt-6 dark:bg-gray-800">
              <div className="flex items-center justify-end space-x-3">
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      loadCallScripts(); // Reset changes
                    }}
                  >
                    Cancel Changes
                  </Button>
                )}
                <Button
                  onClick={handleSaveScript}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!selectedScript}
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Call Scripts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
