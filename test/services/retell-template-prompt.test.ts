import { RetellTemplateService } from '../../src/lib/services/retell-template-service';
import type { BusinessContext } from '../../src/lib/services/types/retell-template-types';

// Mock the environment variables
process.env.RETELL_API_KEY = 'test-retell-api-key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.example.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

describe('RetellTemplateService - Structured Prompt Format', () => {
  let templateService: RetellTemplateService;

  beforeAll(() => {
    templateService = new RetellTemplateService();
  });

  describe('generateComprehensivePrompt with new structure', () => {
    test('should generate structured prompt with all sections', () => {
      const businessContext: BusinessContext = {
        businessName: 'Test Dental Clinic',
        businessType: 'dental',
        industry: 'healthcare',
        services: [
          {
            service_name: 'Cleaning',
            service_description: 'Regular dental cleaning',
            price: 150,
          },
          {
            service_name: 'Consultation',
            service_description: 'Initial consultation',
            price: 100,
          },
        ],
        staff: [
          { first_name: 'Dr. John', last_name: 'Smith', job_title: 'Dentist' },
          { first_name: 'Jane', last_name: 'Doe', job_title: 'Hygienist' },
        ],
        locations: [
          {
            location_name: 'Main Office',
            address: '123 Main St',
            phone_number: '555-0123',
          },
        ],
        products: [],
        insuranceProviders: [],
      };

      const config = {
        call_scripts: {
          greeting_script: 'Hello! Thank you for calling Test Dental Clinic.',
          main_script: 'We are here to help with all your dental needs.',
          escalation_script: 'Let me transfer you to our manager.',
          closing_script: 'Thank you for choosing Test Dental Clinic!',
        },
      };

      // Access the private method using any type casting for testing
      const prompt = (templateService as any).generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Test that all structured sections are present
      expect(prompt).toContain('## Identify');
      expect(prompt).toContain(
        'You are a friendly AI assistant for Test Dental Clinic'
      );
      expect(prompt).toContain(', a dental practice');

      expect(prompt).toContain('## Style Guardrails');
      expect(prompt).toContain('Be concise: Keep responses brief');
      expect(prompt).toContain(
        'Be conversational: Use natural, friendly language'
      );
      expect(prompt).toContain('Be professional: Maintain a courteous');
      expect(prompt).toContain('Be empathetic: Show understanding');
      expect(prompt).toContain(
        'Be sensitive: Show extra care when patients mention pain'
      );

      expect(prompt).toContain('## Response Guideline');
      expect(prompt).toContain('Return dates in their spoken forms');
      expect(prompt).toContain('Ask up to one question at a time');
      expect(prompt).toContain('Confirm important details');
      expect(prompt).toContain('Offer alternatives');
      expect(prompt).toContain('Stay in character');
      expect(prompt).toContain('Handle transfers gracefully');

      expect(prompt).toContain('## Task');
      expect(prompt).toContain('1. **Greet the caller warmly**');
      expect(prompt).toContain('2. **Identify the caller and their needs**');
      expect(prompt).toContain('3. **Handle appointment requests**');
      expect(prompt).toContain('4. **Provide information and assistance**');
      expect(prompt).toContain('5. **Handle escalations when needed**');
      expect(prompt).toContain('6. **Close the call professionally**');
    });

    test('should include custom call scripts in tasks', () => {
      const businessContext: BusinessContext = {
        businessName: 'Medical Center',
        businessType: 'medical',
        industry: 'healthcare',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const config = {
        call_scripts: {
          greeting_script: 'Welcome to Medical Center!',
          escalation_script: 'I will connect you with our specialist.',
          closing_script: 'We appreciate your trust in Medical Center.',
        },
      };

      const prompt = (templateService as any).generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Test that custom scripts are included in tasks
      expect(prompt).toContain('Use: "Welcome to Medical Center!"');
      expect(prompt).toContain(
        'Use: "I will connect you with our specialist."'
      );
      expect(prompt).toContain(
        'Use: "We appreciate your trust in Medical Center."'
      );
    });

    test('should adapt style guardrails for different business types', () => {
      const dentalContext: BusinessContext = {
        businessName: 'Dental Clinic',
        businessType: 'dental',
        industry: 'healthcare',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const generalContext: BusinessContext = {
        businessName: 'General Business',
        businessType: 'general',
        industry: 'service',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const config = { call_scripts: { greeting_script: 'Hello!' } };

      const dentalPrompt = (templateService as any).generateComprehensivePrompt(
        dentalContext,
        config,
        'receptionist'
      );

      const generalPrompt = (
        templateService as any
      ).generateComprehensivePrompt(generalContext, config, 'receptionist');

      // Dental should have extra sensitivity guideline
      expect(dentalPrompt).toContain(
        'Be sensitive: Show extra care when patients mention pain'
      );
      expect(generalPrompt).not.toContain(
        'Be sensitive: Show extra care when patients mention pain'
      );

      // Should identify correctly
      expect(dentalPrompt).toContain(', a dental practice');
      expect(generalPrompt).toContain(', a general business');
    });

    test('should provide default greeting when no custom script provided', () => {
      const businessContext: BusinessContext = {
        businessName: 'Test Business',
        businessType: 'service',
        industry: 'service',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const config = {
        call_scripts: {
          // No greeting_script provided
        },
      };

      const prompt = (templateService as any).generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Should use default greeting
      expect(prompt).toContain(
        'Use: "Hello! Thank you for calling Test Business. How may I assist you today?"'
      );
    });

    test('should include additional instructions section when main_script is provided', () => {
      const businessContext: BusinessContext = {
        businessName: 'Test Business',
        businessType: 'service',
        industry: 'service',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const config = {
        call_scripts: {
          greeting_script: 'Hello!',
          main_script:
            'Always be helpful and patient with callers. Remember to ask about their preferred contact method.',
        },
      };

      const prompt = (templateService as any).generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Should include additional instructions section
      expect(prompt).toContain('## Additional Instructions');
      expect(prompt).toContain('Always be helpful and patient with callers');
    });

    test('should include call handling guidelines when call_scripts_prompt is provided', () => {
      const businessContext: BusinessContext = {
        businessName: 'Test Business',
        businessType: 'service',
        industry: 'service',
        services: [],
        staff: [],
        locations: [],
        products: [],
        insuranceProviders: [],
      };

      const config = {
        call_scripts: { greeting_script: 'Hello!' },
        call_scripts_prompt:
          'Follow these special call handling procedures for our business.',
      };

      const prompt = (templateService as any).generateComprehensivePrompt(
        businessContext,
        config,
        'receptionist'
      );

      // Should include call handling guidelines section
      expect(prompt).toContain('## Call Handling Guidelines');
      expect(prompt).toContain('Follow these special call handling procedures');
    });
  });
});
