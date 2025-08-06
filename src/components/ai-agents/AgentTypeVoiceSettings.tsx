'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  AgentType,
  AGENT_TYPE_CONFIGS,
  VoiceSettings,
} from '@/types/ai-agent-types';
import { CheckIcon, PlayIcon, StopIcon, VolumeIcon } from '@/components/icons';

interface AgentVoiceProfile {
  id: string;
  agent_type: AgentType;
  profile_name: string;
  voice_settings: VoiceSettings;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface RetellVoice {
  id: string;
  name: string;
  accent: string;
  style: string;
  gender?: string;
  age?: string;
  provider?: string;
  preview_audio_url?: string;
}

interface AgentTypeVoiceSettingsProps {
  agentType: AgentType;
  onSave: (voiceProfile: AgentVoiceProfile) => Promise<void>;
  businessInfo?: any;
}

export function AgentTypeVoiceSettings({
  agentType,
  onSave,
  businessInfo,
}: AgentTypeVoiceSettingsProps) {
  const [voiceProfile, setVoiceProfile] = useState<AgentVoiceProfile | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<RetellVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  useEffect(() => {
    loadVoiceProfile();
    loadVoices();
  }, [agentType]);

  const loadVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await fetch('/api/retell-voices');
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.voices || []);
      } else {
        console.error('Failed to load voices from Retell AI');
        setAvailableVoices([]);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      setAvailableVoices([]);
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadVoiceProfile = async () => {
    try {
      setLoading(true);
      const defaultProfile = createDefaultVoiceProfile();
      setVoiceProfile(defaultProfile);
    } catch (error) {
      console.error('Failed to load voice profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultVoiceProfile = (): AgentVoiceProfile => {
    const defaultSettings = agentConfig?.suggested_voice_settings || {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
    };

    return {
      id: 'default',
      agent_type: agentType,
      profile_name: `${agentConfig?.name || 'Agent'} Voice Profile`,
      voice_settings: {
        ...defaultSettings,
        voice_id: 'default',
        accent: 'american',
        gender: 'neutral',
      },
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSaveProfile = async () => {
    if (!voiceProfile) return;

    try {
      await onSave(voiceProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save voice profile:', error);
    }
  };

  const updateVoiceSettings = (field: keyof VoiceSettings, value: any) => {
    if (!voiceProfile) return;
    setVoiceProfile({
      ...voiceProfile,
      voice_settings: {
        ...voiceProfile.voice_settings,
        [field]: value,
      },
    });
  };

  const handlePreviewVoice = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      const selectedVoice = availableVoices.find(v => v.id === voiceProfile?.voice_settings.voice_id);
      
      if (selectedVoice?.preview_audio_url) {
        // Play the preview audio from Retell AI
        const audio = new Audio(selectedVoice.preview_audio_url);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          console.error('Error playing preview audio');
          setIsPlaying(false);
        };
        
        await audio.play();
      } else {
        console.log('Testing voice with settings:', voiceProfile?.voice_settings);
        // Fallback to simulation if no preview URL available
        setTimeout(() => setIsPlaying(false), 3000);
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsPlaying(false);
    }
  };

  const getVoiceRecommendation = (agentType: AgentType) => {
    const recommendations = {
      [AgentType.INBOUND_CALL]: {
        tone: 'Professional and welcoming',
        speed: 'Moderate pace for clarity',
        style: 'Clear enunciation, friendly but business-like',
      },
      [AgentType.OUTBOUND_APPOINTMENT]: {
        tone: 'Friendly and reassuring',
        speed: 'Slightly slower for comfort',
        style: 'Warm, personal, and accommodating',
      },
      [AgentType.OUTBOUND_MARKETING]: {
        tone: 'Energetic and engaging',
        speed: 'Slightly faster for enthusiasm',
        style: 'Confident, persuasive, and upbeat',
      },
      [AgentType.CUSTOMER_SUPPORT]: {
        tone: 'Calm and patient',
        speed: 'Slower for technical explanations',
        style: 'Empathetic, clear, and solution-focused',
      },
    };
    return recommendations[agentType];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!voiceProfile) return null;

  const recommendation = getVoiceRecommendation(agentType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <VolumeIcon className="h-5 w-5" />
                <span>Voice Settings - {agentConfig?.name}</span>
              </CardTitle>
              <CardDescription>
                Configure voice characteristics for your{' '}
                {agentType.replace('_', ' ').toLowerCase()} agent
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewVoice}
                disabled={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Playing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'View Mode' : 'Edit Voice'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Voice Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">
            Voice Recommendations for {agentConfig?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Tone</h4>
              <p className="text-sm text-blue-700">{recommendation.tone}</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Speed</h4>
              <p className="text-sm text-blue-700">{recommendation.speed}</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Style</h4>
              <p className="text-sm text-blue-700">{recommendation.style}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Voice Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Selection</CardTitle>
            <CardDescription>
              Choose the base voice and characteristics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retell AI Voice
              </label>
              <Select
                value={voiceProfile.voice_settings.voice_id || ''}
                onValueChange={value => {
                  const selectedVoice = availableVoices.find(v => v.id === value);
                  if (selectedVoice) {
                    updateVoiceSettings('voice_id', value);
                    updateVoiceSettings('gender', selectedVoice.gender || 'neutral');
                    updateVoiceSettings('accent', selectedVoice.accent.toLowerCase());
                  }
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingVoices ? "Loading voices..." : "Select voice"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingVoices ? (
                    <SelectItem value="" disabled>
                      Loading voices...
                    </SelectItem>
                  ) : availableVoices.length === 0 ? (
                    <SelectItem value="" disabled>
                      No voices available
                    </SelectItem>
                  ) : (
                    availableVoices.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex flex-col">
                          <span>{voice.name}</span>
                          <span className="text-xs text-gray-500">
                            {voice.accent} • {voice.style || voice.gender}
                            {voice.provider && ` • ${voice.provider}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Gender
              </label>
              <Select
                value={voiceProfile.voice_settings.gender || 'neutral'}
                onValueChange={value => updateVoiceSettings('gender', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent
              </label>
              <Select
                value={voiceProfile.voice_settings.accent || 'american'}
                onValueChange={value => updateVoiceSettings('accent', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select accent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="american">American English</SelectItem>
                  <SelectItem value="british">British English</SelectItem>
                  <SelectItem value="australian">Australian English</SelectItem>
                  <SelectItem value="canadian">Canadian English</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Tone
              </label>
              <Select
                value={voiceProfile.voice_settings.tone}
                onValueChange={value => updateVoiceSettings('tone', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Voice Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Parameters</CardTitle>
            <CardDescription>
              Fine-tune speed and pitch settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Speaking Speed
                </label>
                <Badge variant="outline">
                  {voiceProfile.voice_settings.speed.toFixed(1)}x
                </Badge>
              </div>
              <Slider
                value={[voiceProfile.voice_settings.speed]}
                onValueChange={value => updateVoiceSettings('speed', value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                disabled={!isEditing}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Fast (2.0x)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Voice Pitch
                </label>
                <Badge variant="outline">
                  {voiceProfile.voice_settings.pitch.toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[voiceProfile.voice_settings.pitch]}
                onValueChange={value => updateVoiceSettings('pitch', value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                disabled={!isEditing}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (0.5)</span>
                <span>Normal (1.0)</span>
                <span>High (2.0)</span>
              </div>
            </div>

            {/* Preview Text */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Text
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                Hello! Thank you for calling{' '}
                {businessInfo?.business_name || '[Your Business]'}. I'm your AI
                assistant, and I'm here to help you today. How can I assist you?
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Voice Configuration</CardTitle>
          <CardDescription>Summary of active voice settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {voiceProfile.voice_settings.gender || 'Neutral'}
              </div>
              <div className="text-sm text-gray-600">Gender</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {voiceProfile.voice_settings.accent || 'American'}
              </div>
              <div className="text-sm text-gray-600">Accent</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {voiceProfile.voice_settings.speed}x
              </div>
              <div className="text-sm text-gray-600">Speed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {voiceProfile.voice_settings.pitch}
              </div>
              <div className="text-sm text-gray-600">Pitch</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadVoiceProfile(); // Reset changes
                }}
              >
                Cancel Changes
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Voice Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
