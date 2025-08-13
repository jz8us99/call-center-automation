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
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/ai-agent-types';
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

      main: `**CUSTOMER INFORMATION COLLECTION FLOW:**

**1. INITIAL RESPONSE & PURPOSE:**
- "I'd be happy to help you with that. Let me gather some information to assist you better."
- Listen to their request (appointment, question, etc.)

**2. CUSTOMER DETAILS COLLECTION:**
"Can I please have your first and last name?"
- Wait for response, confirm spelling if needed
- "Thank you, [First Name]. What's the best phone number for us to reach you?"
- "And may I have your email address for our records?"

**3. STAFF & SERVICE SELECTION:**
- "Which staff member will you be seeing today? We have ${staffText} available."
- If they don't know: "What type of service do you need? We offer ${servicesText}."
- "Do you currently have an appointment with [staff member], or would you like to schedule one?"

**4. EXISTING APPOINTMENT CHECK:**
- If they say yes: "Let me look that up for you. What date was your appointment scheduled for?"
- If they say no: "I'll be happy to help you schedule an appointment."

${
  isHealthcare
    ? `**5. INSURANCE INFORMATION (New Clients Only):**
- "Are you a new client with us?"
- If yes: "Do you have insurance coverage you'd like us to verify? What's your insurance provider?"
- "We'll verify your benefits before your appointment."`
    : ''
}

**6. APPOINTMENT SCHEDULING (if needed):**
- "Let me check our availability with [staff member]."
- "I have [available times] open. Which works best for you?"
- "Perfect! I'll schedule you for [date] at [time] with [staff member]."

**7. CONFIRMATION:**
- "Let me confirm your details:"
- "Name: [First Last], Phone: [phone], Email: [email]"
- "Appointment: [date] at [time] with [staff member]"
- "Is all of this correct?"

**RETELL AI FUNCTION CALLS:**
Use these functions during the conversation:
- collect_customer_information(first_name, last_name, phone, email, reason_for_call)
- identify_service_and_staff(requested_staff_name, requested_job_type, preferred_date, preferred_time)
- manage_booking_action(booking_action, assigned_staff_id, service_type_id, new_appointment_date, new_appointment_time)
${isHealthcare ? '- collect_insurance_info(insurance_provider, is_new_client)' : ''}`,

      closing: `"Great! You're all set with your appointment on [date] at [time] with [staff member]. You'll receive a confirmation email at [email] and a reminder call 24 hours before. Our office is located at [address], and our office hours are ${hoursText}. Is there anything else I can help you with today? Thank you for choosing ${businessName}, and have a wonderful day!"`,

      escalation: `"I understand you'd like to speak with someone directly. Let me transfer you to [staff member/department] right away. Please hold for just a moment, and they'll be right with you."`,
    },

    inbound_customer_support: {
      greeting: `Hi! Thank you for contacting ${businessName}. I'm your customer support assistant, and I'm here to help resolve any questions or concerns. How can I assist you today?`,

      main: `**SUPPORT ISSUE RESOLUTION FLOW:**

**1. ISSUE IDENTIFICATION:**
- "I'm sorry to hear you're experiencing [issue]. Let me help you resolve this right away."
- "Can you tell me more details about what's happening?"

**2. CUSTOMER VERIFICATION:**
"To better assist you, can I please have:"
- "Your first and last name?"
- "The phone number on your account?"
- "And your email address?"

**3. ACCOUNT/APPOINTMENT LOOKUP:**
- "Let me look up your information in our system."
- "I see you've been working with [staff member]. Is this regarding your recent appointment?"
- "Do you have an upcoming appointment that this relates to?"

**4. ISSUE TROUBLESHOOTING:**
- "Based on what you've told me, here's what I can do to help..."
- "Let me walk you through the solution step by step."
- "Does this resolve your concern, or do you need additional assistance?"

**5. FOLLOW-UP ARRANGEMENTS:**
- If unresolved: "I'd like to connect you directly with [staff member] who can provide specialized help."
- "Would you prefer a callback or to schedule a follow-up appointment?"

**RETELL AI FUNCTION CALLS:**
- collect_customer_information(first_name, last_name, phone, email, reason_for_call)
- lookup_existing_appointment(customer_phone, staff_name)
- create_support_ticket(issue_type, customer_details, resolution_status)`,

      closing: `"I'm glad I could help resolve your concern today. Is there anything else you need assistance with? Thank you for choosing ${businessName}, and please don't hesitate to call us if you have any other questions!"`,

      escalation: `"I want to make sure you get the most comprehensive help possible. Let me transfer you to [specialized department/manager] who can provide more detailed assistance with your specific concern."`,
    },

    outbound_follow_up: {
      greeting: `Hello! This is your AI assistant calling from ${businessName}. Am I speaking with [First Name]? I hope I'm reaching you at a good time. I'm calling to follow up regarding your recent experience with us.`,

      main: `**FOLLOW-UP CALL FLOW:**

**1. APPOINTMENT CONFIRMATION (if applicable):**
- "I'm calling to confirm your upcoming appointment with [staff member] on [date] at [time]."
- "Does this time still work for your schedule?"

**2. CONTACT INFORMATION UPDATE:**
- "I want to make sure we have your current information."
- "Is [phone number] still the best number to reach you?"
- "And [email] is still your preferred email?"

**3. APPOINTMENT CHANGES (if needed):**
- "If you need to reschedule, I can help you find another time that works better."
- "Let me check [staff member]'s availability for you."

**4. POST-SERVICE FOLLOW-UP:**
- "I wanted to check how your recent [service/appointment] with [staff member] went."
- "Do you have any questions or concerns about your experience?"
- "Is there anything else we can help you with?"

**5. FUTURE SCHEDULING:**
- "Based on your service history, you might be due for [follow-up service] in [timeframe]."
- "Would you like me to schedule that for you now?"

**RETELL AI FUNCTION CALLS:**
- verify_customer_information(first_name, last_name, phone, email)
- confirm_existing_appointment(appointment_id, staff_id, appointment_date)
- reschedule_appointment(old_appointment_id, new_date, new_time)
- schedule_future_appointment(staff_id, service_type, preferred_date)`,

      closing: `"Thank you for your time and for choosing ${businessName}. We appreciate your business and look forward to seeing you ${isHealthcare ? 'at your appointment' : 'again soon'}. Have a wonderful day!"`,

      escalation: `"I'd be happy to connect you directly with [staff member] or our manager to address any specific concerns or special requests you may have."`,
    },

    outbound_marketing: {
      greeting: `Hello! This is your marketing assistant from ${businessName}. Am I speaking with [First Name]? I hope you're having a great day! I'm reaching out because we have some services that might be valuable for you.`,

      main: `**MARKETING CALL FLOW:**

**1. INTRODUCTION & PERMISSION:**
- "Do you have a few minutes to hear about [specific service/promotion]?"
- "I noticed you might be interested in ${servicesText} based on [reason]."

**2. CONTACT VERIFICATION:**
- "To make sure I have the right information, is this still [phone number]?"
- "And what's the best email to send you additional information?"

**3. NEEDS ASSESSMENT:**
- "Are you currently looking for [service type]?"
- "Have you worked with a [business type] before?"
- "What's most important to you when choosing a [service provider]?"

**4. SERVICE PRESENTATION:**
- "Based on what you've told me, our [service] could be a great fit because..."
- "We have [staff member] who specializes in exactly what you're looking for."

**5. APPOINTMENT SCHEDULING:**
- "Would you like to schedule a consultation to learn more?"
- "I can set you up with [staff member] who has availability on [dates]."
- "What day and time works best for you?"

${
  isHealthcare
    ? `**6. INSURANCE VERIFICATION:**
- "Do you have insurance coverage for this type of service?"
- "We accept most major insurance providers."`
    : ''
}

**RETELL AI FUNCTION CALLS:**
- collect_prospect_information(first_name, last_name, phone, email, interest_level)
- assess_service_needs(service_interest, budget_range, timeline)
- schedule_consultation(staff_id, service_type, preferred_date, preferred_time)`,

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
    } catch (error) {
      console.error('Failed to save script:', error);
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

      // Gather comprehensive business context (available for future use)

      // Generate enhanced call scripts with customer data collection
      const enhancedScript = generateEnhancedCallScript(
        agentType,
        businessInfo
      );

      // Update the current script with generated content
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

        // Also update in the scripts array
        const updatedScripts = scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        );
        setScripts(updatedScripts);

        // Auto-save the generated scripts
        await onSave(updatedScripts);

        toast.success(
          'Agent-specific call scripts have been generated and saved successfully!'
        );
      }
    } catch (error) {
      console.error('Error generating agent-specific scripts:', error);
      toast.error(
        'Failed to generate scripts. Please ensure your business information is complete and try again.'
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
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Scripts
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
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedScript.greeting_script}
                  </p>
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
                  rows={4}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedScript.main_script}
                  </p>
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
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedScript.closing_script}
                  </p>
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
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedScript.escalation_script}
                  </p>
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

          {isEditing && (
            <Card className="dark:bg-gray-800">
              <CardContent className="pt-6 dark:bg-gray-800">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      loadCallScripts(); // Reset changes
                    }}
                  >
                    Cancel Changes
                  </Button>
                  <Button
                    onClick={handleSaveScript}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Call Scripts
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
