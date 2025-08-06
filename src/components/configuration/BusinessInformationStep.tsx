'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  FileText,
  X,
  Globe,
  CheckCircle,
  AlertCircle,
  Building,
  Plus as PlusIcon,
} from 'lucide-react';
import { BUSINESS_TYPE_CONFIGS } from '@/types/business-types';

interface DocumentUpload {
  file: File;
  type: 'document' | 'image';
  id: string;
  preview?: string;
}

interface DocumentSection {
  id: string;
  category:
    | 'products_pricing'
    | 'services_pricing'
    | 'return_policy'
    | 'faq'
    | 'general_business'
    | 'policies';
  title: string;
  contentType: 'text' | 'file';
  content?: string;
  files?: DocumentUpload[];
  placeholder?: string;
}

const DOCUMENT_CATEGORIES = {
  products_pricing: {
    title: 'Products & Pricing',
    description: 'Product catalogs, price lists, service packages',
    placeholder: 'Enter your products and pricing information here...',
  },
  services_pricing: {
    title: 'Services & Pricing',
    description: 'Service descriptions, pricing structures, packages',
    placeholder: 'Describe your services and pricing...',
  },
  return_policy: {
    title: 'Return & Refund Policy',
    description: 'Return policies, refund procedures, terms',
    placeholder: 'Enter your return and refund policy...',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Common questions and answers about your business',
    placeholder: 'Add frequently asked questions and answers...',
  },
  general_business: {
    title: 'General Business Information',
    description: 'Company history, mission, values, additional info',
    placeholder: 'Add general business information...',
  },
  policies: {
    title: 'Business Policies',
    description: 'Terms of service, privacy policy, other policies',
    placeholder: 'Enter your business policies...',
  },
};

interface BusinessProfile {
  id?: string;
  user_id: string;
  business_name: string;
  business_type: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  contact_person_name?: string;
  contact_person_role?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  support_content?: string;
  timezone?: string;
  business_description?: string;
  years_in_business?: number;
  number_of_employees?: number;
  business_documents?: DocumentUpload[];
  document_sections?: DocumentSection[];
}

interface BusinessInformationStepProps {
  user: User;
  onBusinessProfileUpdate: (hasBusinessInfo: boolean) => void;
  initialData?: BusinessProfile | null;
}

export function BusinessInformationStep({
  user,
  onBusinessProfileUpdate,
  initialData = null,
}: BusinessInformationStepProps) {
  const [formData, setFormData] = useState<BusinessProfile>({
    user_id: user.id,
    business_name: initialData?.business_name || '',
    business_type: initialData?.business_type || '',
    business_address: initialData?.business_address || '',
    business_phone: initialData?.business_phone || '',
    business_email: initialData?.business_email || user.email || '',
    business_website: initialData?.business_website || '',
    contact_person_name: initialData?.contact_person_name || '',
    contact_person_role: initialData?.contact_person_role || '',
    contact_person_phone: initialData?.contact_person_phone || '',
    contact_person_email: initialData?.contact_person_email || user.email || '',
    support_content: initialData?.support_content || '',
    timezone: initialData?.timezone || 'America/New_York',
    business_description: initialData?.business_description || '',
    years_in_business: initialData?.years_in_business || undefined,
    number_of_employees: initialData?.number_of_employees || undefined,
    business_documents: initialData?.business_documents || [],
    document_sections: initialData?.document_sections || [],
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [extractingWebsite, setExtractingWebsite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing business profile data
  useEffect(() => {
    const loadBusinessProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/business-profile?user_id=${user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            const profile = data.profile;
            setFormData({
              user_id: user.id,
              business_name: profile.business_name || '',
              business_type: profile.business_type || '',
              business_address: profile.business_address || '',
              business_phone: profile.contact_phone || '',
              business_email: profile.contact_email || user.email || '',
              business_website: profile.business_website || '',
              contact_person_name: profile.contact_person_name || '',
              contact_person_role: profile.contact_person_role || '',
              contact_person_phone: profile.contact_person_phone || '',
              contact_person_email:
                profile.contact_person_email || user.email || '',
              support_content: profile.support_content || '',
              timezone: profile.timezone || 'America/New_York',
              business_description: profile.business_description || '',
              years_in_business: profile.years_in_business || undefined,
              number_of_employees: profile.number_of_employees || undefined,
              business_documents: profile.business_documents || [],
              document_sections: profile.document_sections || [],
            });

            // Notify parent that business info is already completed
            onBusinessProfileUpdate(true);
          } else {
            // No existing profile, set up default values
            setFormData(prev => ({
              ...prev,
              contact_person_email: user.email || prev.contact_person_email,
              business_email: user.email || prev.business_email,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading business profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !initialData) {
      loadBusinessProfile();
    } else if (initialData) {
      setLoading(false);
    }
  }, [user, initialData, onBusinessProfileUpdate]);

  // Notify parent when form data changes
  useEffect(() => {
    const hasRequiredInfo = formData.business_name && formData.business_type;
    onBusinessProfileUpdate(!!hasRequiredInfo);
  }, [formData.business_name, formData.business_type, onBusinessProfileUpdate]);

  const handleInputChange = (
    field: keyof BusinessProfile,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      const uploadId = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;

      setUploadingFiles(prev => new Set([...prev, uploadId]));

      try {
        // Get the current session token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No authentication token available');
        }

        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append(
          'type',
          file.type.startsWith('image/') ? 'image' : 'document'
        );
        formDataObj.append('clientId', user.id);

        const response = await fetch('/api/upload-business-files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formDataObj,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Upload failed with status ${response.status}`
          );
        }

        const result = await response.json();

        const newUpload: DocumentUpload = {
          file,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          id: uploadId,
          preview: result.file?.extractedContent || file.name,
        };

        setFormData(prev => ({
          ...prev,
          business_documents: [...(prev.business_documents || []), newUpload],
        }));

        // Show success message briefly
        console.log(`File "${file.name}" uploaded successfully!`);
      } catch (error) {
        console.error('File upload failed:', error);
        alert(`Failed to upload file: ${error.message || 'Please try again.'}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(uploadId);
          return newSet;
        });
      }
    }
  };

  const handleRemoveDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      business_documents:
        prev.business_documents?.filter(doc => doc.id !== id) || [],
    }));
  };

  // Document section management
  const addDocumentSection = (category: keyof typeof DOCUMENT_CATEGORIES) => {
    const newSection: DocumentSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      title: DOCUMENT_CATEGORIES[category].title,
      contentType: 'text',
      content: '',
      files: [],
      placeholder: DOCUMENT_CATEGORIES[category].placeholder,
    };

    setFormData(prev => ({
      ...prev,
      document_sections: [...(prev.document_sections || []), newSection],
    }));
  };

  const removeDocumentSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      document_sections:
        prev.document_sections?.filter(section => section.id !== sectionId) ||
        [],
    }));
  };

  const updateDocumentSection = (
    sectionId: string,
    updates: Partial<DocumentSection>
  ) => {
    setFormData(prev => ({
      ...prev,
      document_sections:
        prev.document_sections?.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        ) || [],
    }));
  };

  const handleSectionFileUpload = async (
    sectionId: string,
    files: FileList | null
  ) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      const uploadId = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;

      setUploadingFiles(prev => new Set([...prev, uploadId]));

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No authentication token available');
        }

        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append(
          'type',
          file.type.startsWith('image/') ? 'image' : 'document'
        );
        formDataObj.append('clientId', user.id);

        const response = await fetch('/api/upload-business-files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formDataObj,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Upload failed with status ${response.status}`
          );
        }

        const result = await response.json();

        const newUpload: DocumentUpload = {
          file,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          id: uploadId,
          preview: result.file?.extractedContent || file.name,
        };

        updateDocumentSection(sectionId, {
          files: [
            ...(formData.document_sections?.find(s => s.id === sectionId)
              ?.files || []),
            newUpload,
          ],
        });

        console.log(`File "${file.name}" uploaded successfully to section!`);
      } catch (error) {
        console.error('File upload failed:', error);
        alert(`Failed to upload file: ${error.message || 'Please try again.'}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(uploadId);
          return newSet;
        });
      }
    }
  };

  const removeSectionFile = (sectionId: string, fileId: string) => {
    const section = formData.document_sections?.find(s => s.id === sectionId);
    if (section) {
      updateDocumentSection(sectionId, {
        files: section.files?.filter(file => file.id !== fileId) || [],
      });
    }
  };

  const handleExtractWebsite = async () => {
    if (!formData.business_website) return;

    setExtractingWebsite(true);
    try {
      const response = await fetch('/api/extract-website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.business_website }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          support_content: prev.support_content
            ? `${prev.support_content}\n\nWebsite Content:\n${data.content}`
            : `Website Content:\n${data.content}`,
        }));
      }
    } catch (error) {
      console.error('Website extraction failed:', error);
    } finally {
      setExtractingWebsite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');

    try {
      // Save business profile to database
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_address: formData.business_address,
          business_phone: formData.business_phone,
          business_email: formData.business_email,
          business_website: formData.business_website,
          timezone: formData.timezone,
          contact_person_name: formData.contact_person_name,
          contact_person_role: formData.contact_person_role,
          contact_person_phone: formData.contact_person_phone,
          contact_person_email: formData.contact_person_email,
          support_content: formData.support_content,
          business_description: formData.business_description,
          years_in_business: formData.years_in_business,
          number_of_employees: formData.number_of_employees,
          business_documents: formData.business_documents,
          document_sections: formData.document_sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Failed to save business information'
        );
      }

      const result = await response.json();
      console.log('Business profile saved successfully:', result);

      setSaveStatus('success');
      onBusinessProfileUpdate(true);

      // Auto-scroll to show success message
      setTimeout(() => {
        document.querySelector('[data-save-status]')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    } catch (error) {
      console.error('Error saving business information:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const businessTypeCategories = {
    healthcare: 'Healthcare',
    professional: 'Professional Services',
    services: 'General Services',
    education: 'Education',
    general: 'Other',
  };

  // Show loading state while fetching existing data
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your business information...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Business Information
            </CardTitle>
            <CardDescription>
              Provide essential information about your business that will be
              used throughout your AI agent configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  value={formData.business_name}
                  onChange={e =>
                    handleInputChange('business_name', e.target.value)
                  }
                  placeholder="Your Business Name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="business-type">Business Type *</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={value =>
                    handleInputChange('business_type', value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(businessTypeCategories).map(
                      ([category, label]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-500">
                            {label}
                          </div>
                          {Object.entries(BUSINESS_TYPE_CONFIGS)
                            .filter(
                              ([_, config]) => config.category === category
                            )
                            .map(([typeCode, config]) => (
                              <SelectItem key={typeCode} value={typeCode}>
                                <div className="flex items-center gap-2">
                                  <span>{config.icon}</span>
                                  <span>{config.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="business-description">Business Description</Label>
              <Textarea
                id="business-description"
                value={formData.business_description}
                onChange={e =>
                  handleInputChange('business_description', e.target.value)
                }
                placeholder="Brief description of your business and services..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="years-business">Years in Business</Label>
                <Input
                  id="years-business"
                  type="number"
                  min="0"
                  value={formData.years_in_business || ''}
                  onChange={e =>
                    handleInputChange(
                      'years_in_business',
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="num-employees">Number of Employees</Label>
                <Input
                  id="num-employees"
                  type="number"
                  min="1"
                  value={formData.number_of_employees || ''}
                  onChange={e =>
                    handleInputChange(
                      'number_of_employees',
                      parseInt(e.target.value) || 1
                    )
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={value => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Business contact details and primary contact person information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-phone">Business Phone</Label>
                <Input
                  id="business-phone"
                  type="tel"
                  value={formData.business_phone}
                  onChange={e =>
                    handleInputChange('business_phone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="business-email">Business Email</Label>
                <Input
                  id="business-email"
                  type="email"
                  value={formData.business_email}
                  onChange={e =>
                    handleInputChange('business_email', e.target.value)
                  }
                  placeholder="info@yourbusiness.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea
                id="business-address"
                value={formData.business_address}
                onChange={e =>
                  handleInputChange('business_address', e.target.value)
                }
                placeholder="123 Main Street, City, State, ZIP"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">Primary Contact Name</Label>
                <Input
                  id="contact-name"
                  value={formData.contact_person_name}
                  onChange={e =>
                    handleInputChange('contact_person_name', e.target.value)
                  }
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="contact-role">Contact Role</Label>
                <Input
                  id="contact-role"
                  value={formData.contact_person_role}
                  onChange={e =>
                    handleInputChange('contact_person_role', e.target.value)
                  }
                  placeholder="Office Manager"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formData.contact_person_phone}
                  onChange={e =>
                    handleInputChange('contact_person_phone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={e =>
                    handleInputChange('contact_person_email', e.target.value)
                  }
                  placeholder="john@yourbusiness.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website and Content */}
        <Card>
          <CardHeader>
            <CardTitle>Website and Content</CardTitle>
            <CardDescription>
              Help train your AI by providing your website and additional
              business content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business-website">Business Website</Label>
              <div className="flex gap-2">
                <Input
                  id="business-website"
                  type="url"
                  value={formData.business_website}
                  onChange={e =>
                    handleInputChange('business_website', e.target.value)
                  }
                  placeholder="https://yourbusiness.com"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtractWebsite}
                  disabled={!formData.business_website || extractingWebsite}
                >
                  {extractingWebsite ? (
                    <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Extract
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="support-content">
                Additional Business Information
              </Label>
              <Textarea
                id="support-content"
                value={formData.support_content}
                onChange={e =>
                  handleInputChange('support_content', e.target.value)
                }
                placeholder="Any additional information about your business, services, policies, etc. that would help the AI agent..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Documentation Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Documentation</CardTitle>
                <CardDescription>
                  Organize your business information into categories. Each
                  section can contain text content or uploaded files to help
                  train your AI agent effectively.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DOCUMENT_CATEGORIES).map(
                  ([category, config]) => (
                    <Button
                      key={category}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addDocumentSection(
                          category as keyof typeof DOCUMENT_CATEGORIES
                        )
                      }
                      className="text-xs"
                      disabled={formData.document_sections?.some(
                        section => section.category === category
                      )}
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      {config.title}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {formData.document_sections &&
            formData.document_sections.length > 0 ? (
              <div className="space-y-6">
                {formData.document_sections.map(section => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {section.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {DOCUMENT_CATEGORIES[section.category].description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex border rounded-md">
                          <button
                            type="button"
                            onClick={() =>
                              updateDocumentSection(section.id, {
                                contentType: 'text',
                              })
                            }
                            className={`px-3 py-1 text-xs font-medium rounded-l-md ${
                              section.contentType === 'text'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Text
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateDocumentSection(section.id, {
                                contentType: 'file',
                              })
                            }
                            className={`px-3 py-1 text-xs font-medium rounded-r-md ${
                              section.contentType === 'file'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Files
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentSection(section.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {section.contentType === 'text' ? (
                      <Textarea
                        value={section.content || ''}
                        onChange={e =>
                          updateDocumentSection(section.id, {
                            content: e.target.value,
                          })
                        }
                        placeholder={section.placeholder}
                        rows={6}
                        className="w-full"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                            onChange={e =>
                              handleSectionFileUpload(
                                section.id,
                                e.target.files
                              )
                            }
                            className="hidden"
                            id={`file-input-${section.id}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById(`file-input-${section.id}`)
                                ?.click()
                            }
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files for {section.title}
                          </Button>
                        </div>

                        {section.files && section.files.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                {section.files.length} file(s) in{' '}
                                {section.title}
                              </span>
                            </div>
                            {section.files.map(file => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-green-900">
                                      {file.file.name}
                                    </p>
                                    <p className="text-xs text-green-700">
                                      {(file.file.size / 1024).toFixed(1)} KB •{' '}
                                      {file.type}
                                    </p>
                                    {file.preview && (
                                      <p className="text-xs text-green-600 mt-1">
                                        Preview: {file.preview.substring(0, 80)}
                                        ...
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeSectionFile(section.id, file.id)
                                  }
                                  className="text-green-700 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Add Business Documentation
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create organized sections for different types of business
                  information to help train your AI agent more effectively.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(DOCUMENT_CATEGORIES)
                    .slice(0, 3)
                    .map(([category, config]) => (
                      <Button
                        key={category}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          addDocumentSection(
                            category as keyof typeof DOCUMENT_CATEGORIES
                          )
                        }
                        className="text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        {config.title}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {uploadingFiles.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading {uploadingFiles.size} file(s)...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Summary */}
        {(!formData.business_name || !formData.business_type) && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Required Information Missing
                  </h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    Please complete the following required fields to save your
                    business information:
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {!formData.business_name && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Business Name
                      </li>
                    )}
                    {!formData.business_type && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                        Business Type
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Card
          className={`${
            saveStatus === 'success'
              ? 'bg-green-50 border-green-200'
              : saveStatus === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-orange-50 border-orange-200'
          }`}
          data-save-status
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={`font-semibold ${
                    saveStatus === 'success'
                      ? 'text-green-900'
                      : saveStatus === 'error'
                        ? 'text-red-900'
                        : 'text-orange-900'
                  }`}
                >
                  {saveStatus === 'success'
                    ? 'Business Information Saved Successfully!'
                    : saveStatus === 'error'
                      ? 'Error Saving Business Information'
                      : 'Complete Business Information'}
                </h3>
                <p
                  className={`text-sm ${
                    saveStatus === 'success'
                      ? 'text-green-700'
                      : saveStatus === 'error'
                        ? 'text-red-700'
                        : 'text-orange-700'
                  }`}
                >
                  {saveStatus === 'success'
                    ? 'You can now proceed to Staff Management. Your information will be used across all AI agents.'
                    : saveStatus === 'error'
                      ? 'There was an error saving your information. Please try again.'
                      : !formData.business_name || !formData.business_type
                        ? 'Please fill in the required fields above to enable saving.'
                        : 'This information will be used across all your AI agents and can be updated anytime.'}
                </p>
              </div>
              <Button
                type="submit"
                disabled={
                  saving || !formData.business_name || !formData.business_type
                }
                className={`${
                  saving || !formData.business_name || !formData.business_type
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveStatus === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : saveStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved Successfully
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                ) : !formData.business_name || !formData.business_type ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Complete Required Fields
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Business Information
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
