export const retellTools = [
  {
    name: "lookup_customer",
    description: "Find customer by last name and phone number",
    parameters: {
      type: "object",
      properties: {
        lastName: { 
          type: "string",
          description: "Customer's last name"
        },
        phone: { 
          type: "string", 
          description: "Phone number in E.164 format (e.g., +1234567890)"
        }
      },
      required: ["lastName", "phone"]
    }
  },
  {
    name: "upsert_customer",
    description: "Create or update a customer record",
    parameters: {
      type: "object",
      properties: {
        firstName: { 
          type: "string",
          description: "Customer's first name"
        },
        lastName: { 
          type: "string",
          description: "Customer's last name"
        },
        phone: { 
          type: "string",
          description: "Phone number in E.164 format"
        },
        email: { 
          type: "string",
          description: "Customer's email address"
        }
      },
      required: ["firstName", "lastName", "phone"]
    }
  },
  {
    name: "check_existing_appointment",
    description: "Check if customer has an existing appointment",
    parameters: {
      type: "object",
      properties: {
        customerId: { 
          type: "string",
          description: "Customer ID from lookup_customer"
        }
      },
      required: ["customerId"]
    }
  },
  {
    name: "get_staff_options_for_job_type",
    description: "Get available staff members for a specific job type",
    parameters: {
      type: "object",
      properties: {
        jobType: { 
          type: "string",
          description: "Type of service/job needed"
        }
      },
      required: ["jobType"]
    }
  },
  {
    name: "find_openings",
    description: "Find available appointment slots",
    parameters: {
      type: "object",
      properties: {
        staffId: { 
          type: "string",
          description: "Optional specific staff member ID"
        },
        jobType: { 
          type: "string",
          description: "Type of service/job"
        },
        durationMins: { 
          type: "number",
          description: "Duration in minutes (default: 30)"
        },
        dateFrom: { 
          type: "string",
          description: "Start date for availability search (ISO format)"
        },
        dateTo: { 
          type: "string",
          description: "End date for availability search (ISO format)"
        }
      },
      required: ["jobType"]
    }
  },
  {
    name: "book_appointment",
    description: "Book an appointment slot",
    parameters: {
      type: "object",
      properties: {
        customerId: { 
          type: "string",
          description: "Customer ID"
        },
        staffId: { 
          type: "string",
          description: "Staff member ID"
        },
        jobType: { 
          type: "string",
          description: "Type of service/job"
        },
        startsAt: { 
          type: "string",
          description: "Appointment start time (ISO format)"
        },
        durationMins: {
          type: "number",
          description: "Duration in minutes"
        }
      },
      required: ["customerId", "staffId", "jobType", "startsAt"]
    }
  },
  {
    name: "handoff_to_agent",
    description: "Transfer call to another agent type",
    parameters: {
      type: "object",
      properties: {
        target: { 
          type: "string",
          enum: ["receptionist", "support"],
          description: "Target agent type to transfer to"
        },
        context: {
          type: "object",
          description: "Context data to pass to the target agent"
        }
      },
      required: ["target"]
    }
  }
];

export const routerAgentConfig = {
  name: "Router Agent",
  type: "router",
  systemPrompt: `You are a professional triage and booking assistant. Your role is to:
1. Warmly greet callers and determine their needs
2. Collect and validate contact information (first name, last name, phone, email)
3. Detect if they want to book an appointment or have general questions
4. For appointments: collect job type, staff preference, and preferred time
5. For general questions: route to customer support
6. Always confirm information before proceeding with bookings

Be concise, friendly, and efficient. If the caller switches topics, adapt seamlessly.`,
  tools: retellTools,
  voice: {
    provider: "retell",
    voiceId: "nova",
    speed: 1.0
  }
};

export const receptionistAgentConfig = {
  name: "Receptionist Agent",
  type: "inbound_receptionist",
  systemPrompt: "", // Will be loaded from Step-6 config
  callScript: "", // Will be loaded from Step-6 config
  primaryGoals: [
    "Collect complete contact information",
    "Understand appointment needs",
    "Propose available time slots",
    "Confirm booking details",
    "Provide confirmation number"
  ]
};

export const supportAgentConfig = {
  name: "Customer Support Agent",
  type: "inbound_customer_support",
  systemPrompt: "", // Will be loaded from Step-6 config
  callScript: "", // Will be loaded from Step-6 config
  primaryGoals: [
    "Answer frequently asked questions",
    "Provide business information",
    "Handle general inquiries",
    "Transfer to receptionist if appointment needed"
  ]
};