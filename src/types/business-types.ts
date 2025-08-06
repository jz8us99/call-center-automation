export interface BusinessType {
  id: string;
  type_code: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  call_scripts: Record<string, any>;
  voice_settings: Record<string, any>;
  call_routing: Record<string, any>;
  prompt_template?: string;
  configuration_template: Record<string, any>;
}

export interface AgentConfigurationScoped {
  id: string;
  client_id: string;
  agent_type_id: string;
  call_scripts: Record<string, any>;
  voice_settings: Record<string, any>;
  call_routing: Record<string, any>;
  custom_settings: Record<string, any>;
  based_on_template_id?: string;
  created_at: string;
  updated_at: string;
}

export const BUSINESS_TYPE_CONFIGS: Record<
  string,
  { name: string; icon: string; category: string }
> = {
  clinic: { name: 'Medical Clinic', icon: '🏥', category: 'healthcare' },
  dental: { name: 'Dental Office', icon: '🦷', category: 'healthcare' },
  veterinary: { name: 'Veterinary Clinic', icon: '🐾', category: 'healthcare' },
  therapy: { name: 'Therapy Practice', icon: '🧠', category: 'healthcare' },
  wellness: { name: 'Wellness Center', icon: '🌿', category: 'healthcare' },
  gardener: { name: 'Gardener', icon: '🌱', category: 'services' },
  handyman: { name: 'Handyman', icon: '🔧', category: 'services' },
  beauty_salon: { name: 'Beauty Salon', icon: '💇', category: 'services' },
  daycare: { name: 'Daycare', icon: '👶', category: 'services' },
  tutors: { name: 'Tutors', icon: '📚', category: 'education' },
  law_office: { name: 'Law Office', icon: '⚖️', category: 'professional' },
  real_estate: { name: 'Real Estate', icon: '🏠', category: 'professional' },
  notary: { name: 'Notary', icon: '📋', category: 'professional' },
  repair_shop: { name: 'Repair Shop', icon: '🔨', category: 'services' },
  financial_advisor: {
    name: 'Financial Advisor',
    icon: '💰',
    category: 'professional',
  },
  hvac_contractor: {
    name: 'HVAC Contractor',
    icon: '🏠',
    category: 'services',
  },
  other: { name: 'Other', icon: '🏢', category: 'general' },
};
