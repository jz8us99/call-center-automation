'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  X,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface DocumentUpload {
  file: File;
  type: 'pricing' | 'policy' | 'hours';
  id: string;
  preview?: string;
}

interface AgentConfig {
  id?: string;
  agent_id?: string;
  agent_name?: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  business_type?: string;
  contact_person_name?: string;
  contact_person_role?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  greeting_message?: string;
  timezone?: string;
  documents?: DocumentUpload[];
  website_url?: string;
  agent_personality?: 'professional' | 'friendly' | 'technical';
}

interface BusinessInformationFormProps {
  agent: AgentConfig | null;
  onSave: (data: AgentConfig) => Promise<void>;
}

export function BusinessInformationForm({
  agent,
  onSave,
}: BusinessInformationFormProps) {
  const [formData, setFormData] = useState<AgentConfig>({
    agent_name: agent?.agent_name || '',
    business_name: agent?.business_name || '',
    business_address: agent?.business_address || '',
    business_phone: agent?.business_phone || '',
    business_email: agent?.business_email || '',
    business_website: agent?.business_website || '',
    business_type: agent?.business_type || 'clinic',
    contact_person_name: agent?.contact_person_name || '',
    contact_person_role: agent?.contact_person_role || '',
    contact_person_phone: agent?.contact_person_phone || '',
    contact_person_email: agent?.contact_person_email || '',
    greeting_message: agent?.greeting_message || '',
    timezone: agent?.timezone || 'America/New_York',
    documents: agent?.documents || [],
    website_url: agent?.website_url || '',
    agent_personality: agent?.agent_personality || 'professional',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [extractingWebsite, setExtractingWebsite] = useState(false);
  const fileInputRefs = {
    pricing: useRef<HTMLInputElement>(null),
    policy: useRef<HTMLInputElement>(null),
    hours: useRef<HTMLInputElement>(null),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Upload documents first if any
      if (formData.documents && formData.documents.length > 0) {
        for (const doc of formData.documents) {
          const formDataObj = new FormData();
          formDataObj.append('file', doc.file);
          formDataObj.append('type', doc.type);
          formDataObj.append('clientId', 'current-user-id'); // You'd get this from auth context

          await fetch('/api/upload-documents', {
            method: 'POST',
            body: formDataObj,
          });
        }
      }

      // Create the agent
      const response = await fetch('/api/create-retell-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'current-user-id', // You'd get this from auth context
          agentName: formData.agent_name,
          businessName: formData.business_name,
          businessType: formData.business_type,
          agentPersonality: formData.agent_personality,
          customPrompt: formData.greeting_message,
          voiceSettings: {
            speed: 1.0,
            pitch: 1.0,
            tone: formData.agent_personality || 'professional',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      const result = await response.json();
      console.log('Agent created successfully:', result);

      await onSave(formData);
    } catch (error) {
      console.error('Error saving business information:', error);
      alert('Error creating agent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AgentConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (
    file: File,
    type: 'pricing' | 'policy' | 'hours'
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, DOC, DOCX, or TXT files only');
      return;
    }

    const fileId = Date.now().toString();
    setUploadingFiles(prev => new Set([...prev, fileId]));

    try {
      const preview = await generateFilePreview(file);
      const newDocument: DocumentUpload = {
        file,
        type,
        id: fileId,
        preview,
      };

      setFormData(prev => ({
        ...prev,
        documents: [
          ...(prev.documents || []).filter(doc => doc.type !== type),
          newDocument,
        ],
      }));
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const generateFilePreview = async (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        resolve(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      };
      reader.readAsText(file);
    });
  };

  const removeDocument = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter(doc => doc.id !== documentId) || [],
    }));
  };

  const handleWebsiteExtraction = async () => {
    if (!formData.website_url) {
      alert('Please enter a website URL first');
      return;
    }

    setExtractingWebsite(true);
    try {
      const response = await fetch('/api/extract-website-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.website_url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract website content');
      }

      const result = await response.json();
      alert('Website content extracted successfully!');
    } catch (error) {
      console.error('Error extracting website:', error);
      alert(
        'Error extracting website content. Please check the URL and try again.'
      );
    } finally {
      setExtractingWebsite(false);
    }
  };

  const getDocumentByType = (type: 'pricing' | 'policy' | 'hours') => {
    return formData.documents?.find(doc => doc.type === type);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agent Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
          <CardDescription>
            Basic information about your AI voice agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <Input
                value={formData.agent_name}
                onChange={e => handleInputChange('agent_name', e.target.value)}
                placeholder="e.g., Downtown Dental Assistant"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Type *
              </label>
              <Select
                value={formData.business_type}
                onValueChange={value =>
                  handleInputChange('business_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Medical Clinic</SelectItem>
                  <SelectItem value="dental">Dental Office</SelectItem>
                  <SelectItem value="veterinary">Veterinary Clinic</SelectItem>
                  <SelectItem value="therapy">Therapy Practice</SelectItem>
                  <SelectItem value="wellness">Wellness Center</SelectItem>
                  <SelectItem value="gardener">Gardener</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                  <SelectItem value="beauty_salon">Beauty Salon</SelectItem>
                  <SelectItem value="daycare">Daycare</SelectItem>
                  <SelectItem value="tutors">Tutors</SelectItem>
                  <SelectItem value="law_office">Law Office</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="notary">Notary</SelectItem>
                  <SelectItem value="repair_shop">Repair Shop</SelectItem>
                  <SelectItem value="financial_advisor">
                    Financial Advisor
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Information about your business that the AI agent will use when
            talking to callers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Name *
            </label>
            <Input
              value={formData.business_name}
              onChange={e => handleInputChange('business_name', e.target.value)}
              placeholder="e.g., Sunshine Medical Clinic"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Address
            </label>
            <Input
              value={formData.business_address}
              onChange={e =>
                handleInputChange('business_address', e.target.value)
              }
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Phone *
              </label>
              <Input
                type="tel"
                value={formData.business_phone}
                onChange={e =>
                  handleInputChange('business_phone', e.target.value)
                }
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Email
              </label>
              <Input
                type="email"
                value={formData.business_email}
                onChange={e =>
                  handleInputChange('business_email', e.target.value)
                }
                placeholder="info@business.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <Input
                type="url"
                value={formData.business_website}
                onChange={e =>
                  handleInputChange('business_website', e.target.value)
                }
                placeholder="https://www.business.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <Select
                value={formData.timezone}
                onValueChange={value => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Person */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Contact Person</CardTitle>
          <CardDescription>
            The main contact person for this business location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Name
              </label>
              <Input
                value={formData.contact_person_name}
                onChange={e =>
                  handleInputChange('contact_person_name', e.target.value)
                }
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role/Title
              </label>
              <Input
                value={formData.contact_person_role}
                onChange={e =>
                  handleInputChange('contact_person_role', e.target.value)
                }
                placeholder="Practice Manager"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone
              </label>
              <Input
                type="tel"
                value={formData.contact_person_phone}
                onChange={e =>
                  handleInputChange('contact_person_phone', e.target.value)
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email
              </label>
              <Input
                type="email"
                value={formData.contact_person_email}
                onChange={e =>
                  handleInputChange('contact_person_email', e.target.value)
                }
                placeholder="contact@business.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Knowledge Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Business Knowledge</CardTitle>
          <CardDescription>
            Upload documents or provide your website URL to help the AI
            understand your business better
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Website URL Option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="h-4 w-4 inline mr-2" />
              Website URL (Alternative to document upload)
            </label>
            <div className="flex space-x-2">
              <Input
                type="url"
                value={formData.website_url}
                onChange={e => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.yourbusiness.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleWebsiteExtraction}
                disabled={extractingWebsite || !formData.website_url}
              >
                {extractingWebsite ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Extracting...</span>
                  </div>
                ) : (
                  'Extract Content'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We'll extract pricing, policies, and hours information from your
              website
            </p>
          </div>

          <div className="border-t dark:border-gray-600 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Or upload specific documents:
            </p>

            {/* Document Upload Sections */}
            {[
              {
                type: 'pricing' as const,
                label: 'Pricing Documents',
                description: 'Service prices, packages, insurance information',
              },
              {
                type: 'policy' as const,
                label: 'Customer Policies',
                description:
                  'Cancellation policy, terms of service, guidelines',
              },
              {
                type: 'hours' as const,
                label: 'Office Hours',
                description: 'Operating hours, holiday schedules, availability',
              },
            ].map(({ type, label, description }) => {
              const document = getDocumentByType(type);
              const isUploading = Array.from(uploadingFiles).some(id =>
                id.includes(type)
              );

              return (
                <div
                  key={type}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {label}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    </div>
                    {document && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>

                  {document ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {document.file.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({(document.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(document.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {document.preview && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">
                          {document.preview}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRefs[type]}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, type);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRefs[type].current?.click()}
                        disabled={isUploading}
                        className="w-full border-dashed"
                      >
                        {isUploading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload {label}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supported: PDF, DOC, DOCX, TXT (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Personality */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Personality</CardTitle>
          <CardDescription>
            Choose how your AI agent should interact with customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.agent_personality}
            onValueChange={value =>
              handleInputChange(
                'agent_personality',
                value as 'professional' | 'friendly' | 'technical'
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select agent personality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">
                Professional - Formal, business-like tone
              </SelectItem>
              <SelectItem value="friendly">
                Friendly - Warm, approachable, conversational
              </SelectItem>
              <SelectItem value="technical">
                Technical - Detail-oriented, precise, informative
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Greeting Message */}
      <Card>
        <CardHeader>
          <CardTitle>Greeting Message</CardTitle>
          <CardDescription>
            The initial message your AI agent will say when answering calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.greeting_message}
            onChange={e =>
              handleInputChange('greeting_message', e.target.value)
            }
            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Hello! Thank you for calling Sunshine Medical Clinic. I'm your AI assistant. How can I help you today?"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Keep it friendly and professional. Mention your business name and
            let callers know they're speaking with an AI assistant.
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t dark:border-gray-600">
        <Button type="submit" disabled={saving} className="min-w-32">
          {saving ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </form>
  );
}
