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
  initialVoiceSettings?: VoiceSettings;
}

export function AgentTypeVoiceSettings({
  agentType,
  onSave,
  businessInfo,
  initialVoiceSettings,
}: AgentTypeVoiceSettingsProps) {
  const [voiceProfile, setVoiceProfile] = useState<AgentVoiceProfile | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<RetellVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);

  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  useEffect(() => {
    loadVoiceProfile();
    loadVoices();
    loadSpeechVoices();
  }, [agentType, initialVoiceSettings]);

  const loadSpeechVoices = () => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setSpeechVoices(voices);
        console.log('Loaded speech synthesis voices:', voices.length);
      };

      // Load voices immediately
      loadVoices();

      // Also listen for voiceschanged event (needed on some browsers)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  };

  const loadVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await fetch('/api/retell-voices');
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.voices || []);
      } else {
        console.error('Failed to load voices from Retell AI');
        // Provide fallback voices if API fails
        setAvailableVoices([
          {
            id: 'sarah-professional',
            name: 'Sarah',
            accent: 'American',
            style: 'Professional',
            gender: 'Female',
            provider: 'ElevenLabs',
          },
          {
            id: 'david-professional',
            name: 'David',
            accent: 'American',
            style: 'Professional',
            gender: 'Male',
            provider: 'ElevenLabs',
          },
        ]);
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

      // If initial voice settings are provided, use them with defaults
      if (
        initialVoiceSettings &&
        Object.keys(initialVoiceSettings).length > 0
      ) {
        const existingProfile: AgentVoiceProfile = {
          id: 'existing-profile',
          agent_type: agentType,
          profile_name: `${agentConfig?.name || 'Agent'} Voice Profile`,
          voice_settings: {
            speed: initialVoiceSettings.speed || 1.0,
            pitch: initialVoiceSettings.pitch || 1.0,
            tone: initialVoiceSettings.tone || 'professional',
            voice_id: initialVoiceSettings.voice_id || 'sarah-professional',
            accent: initialVoiceSettings.accent || 'american',
            gender: initialVoiceSettings.gender || 'female',
          },
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setVoiceProfile(existingProfile);
      } else {
        // Create default profile
        const defaultProfile = createDefaultVoiceProfile();
        setVoiceProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load voice profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultVoiceProfile = (): AgentVoiceProfile => {
    const defaultSettings = agentConfig?.suggested_voice_settings || {};

    return {
      id: 'default',
      agent_type: agentType,
      profile_name: `${agentConfig?.name || 'Agent'} Voice Profile`,
      voice_settings: {
        speed: defaultSettings.speed || 1.0,
        pitch: defaultSettings.pitch || 1.0,
        tone: defaultSettings.tone || 'professional',
        voice_id: defaultSettings.voice_id || 'sarah-professional',
        accent: defaultSettings.accent || 'american',
        gender: defaultSettings.gender || 'female',
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

  const playVoicePreview = async (voiceId: string, customText?: string) => {
    try {
      setIsPlaying(true);

      // Get voice name and characteristics for display
      const selectedVoice = availableVoices.find(v => v.id === voiceId);
      const voiceName =
        selectedVoice?.name ||
        voiceId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

      const testText =
        customText ||
        `Hello! This is ${voiceName} from ${businessInfo?.business_name || 'our business'}. How may I assist you today?`;

      console.log('Playing voice preview with Web Speech API:', {
        voiceId,
        voiceName,
        testText,
      });

      // Check if Web Speech API is supported
      if (!('speechSynthesis' in window)) {
        alert(
          "🔊 Audio Preview Not Available\n\nYour browser doesn't support text-to-speech.\nPlease use Chrome, Edge, Safari, or Firefox for voice previews."
        );
        setIsPlaying(false);
        return;
      }

      // Stop any currently playing speech
      speechSynthesis.cancel();

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(testText);

      // Use loaded speech voices or get them fresh
      const voices =
        speechVoices.length > 0 ? speechVoices : speechSynthesis.getVoices();
      let selectedSpeechVoice = null;

      console.log(
        'Available speech voices:',
        voices.length,
        voices.map(v => v.name)
      );

      // Try to find a voice that matches the characteristics
      if (selectedVoice) {
        // First try to match by gender and accent
        selectedSpeechVoice = voices.find(voice => {
          const isGenderMatch =
            selectedVoice.gender?.toLowerCase() === 'female'
              ? voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('woman') ||
                [
                  'samantha',
                  'victoria',
                  'alex',
                  'karen',
                  'moira',
                  'tessa',
                  'veena',
                  'fiona',
                ].some(name =>
                  voice.name.toLowerCase().includes(name.toLowerCase())
                )
              : selectedVoice.gender?.toLowerCase() === 'male'
                ? voice.name.toLowerCase().includes('male') ||
                  voice.name.toLowerCase().includes('man') ||
                  ['daniel', 'thomas', 'fred', 'jorge', 'aaron', 'albert'].some(
                    name =>
                      voice.name.toLowerCase().includes(name.toLowerCase())
                  )
                : true;

          const isAccentMatch =
            selectedVoice.accent?.toLowerCase() === 'british'
              ? voice.name.toLowerCase().includes('uk') ||
                voice.name.toLowerCase().includes('british') ||
                voice.lang.includes('en-GB')
              : selectedVoice.accent?.toLowerCase() === 'australian'
                ? voice.name.toLowerCase().includes('au') ||
                  voice.name.toLowerCase().includes('australian') ||
                  voice.lang.includes('en-AU')
                : voice.lang.includes('en-US') || voice.lang.includes('en');

          return isGenderMatch && isAccentMatch;
        });

        // Fallback: try to match just gender
        if (!selectedSpeechVoice) {
          selectedSpeechVoice = voices.find(voice => {
            if (selectedVoice.gender?.toLowerCase() === 'female') {
              return (
                voice.name.toLowerCase().includes('female') ||
                [
                  'samantha',
                  'victoria',
                  'alex',
                  'karen',
                  'moira',
                  'tessa',
                  'veena',
                  'fiona',
                  'zira',
                  'hazel',
                ].some(name =>
                  voice.name.toLowerCase().includes(name.toLowerCase())
                )
              );
            } else if (selectedVoice.gender?.toLowerCase() === 'male') {
              return (
                voice.name.toLowerCase().includes('male') ||
                [
                  'daniel',
                  'thomas',
                  'fred',
                  'jorge',
                  'aaron',
                  'albert',
                  'david',
                  'mark',
                  'james',
                ].some(name =>
                  voice.name.toLowerCase().includes(name.toLowerCase())
                )
              );
            }
            return true;
          });
        }
      }

      // Final fallback: use default voice
      if (!selectedSpeechVoice && voices.length > 0) {
        selectedSpeechVoice =
          voices.find(voice => voice.lang.includes('en')) || voices[0];
      }

      if (selectedSpeechVoice) {
        utterance.voice = selectedSpeechVoice;
        console.log(
          'Selected voice:',
          selectedSpeechVoice.name,
          selectedSpeechVoice.lang
        );
      }

      // Apply voice settings
      const speed = Math.max(
        0.1,
        Math.min(3.0, voiceProfile?.voice_settings?.speed || 1.0)
      );
      const pitch = Math.max(
        0.1,
        Math.min(2.0, voiceProfile?.voice_settings?.pitch || 1.0)
      );

      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.volume = 0.8;

      // Set up event handlers
      utterance.onstart = () => {
        console.log('🔊 Voice preview started');
      };

      utterance.onend = () => {
        console.log('✅ Voice preview completed');
        setIsPlaying(false);
      };

      utterance.onerror = event => {
        console.error('❌ Speech synthesis error:', event.error);
        setIsPlaying(false);
        alert(
          `🔊 Voice Preview Error\n\nError: ${event.error}\n\nTrying to play: "${testText.substring(0, 50)}..."\n\nYour browser may not support this voice or text length.`
        );
      };

      // Show preview info
      const previewInfo = `🎵 Playing Voice Preview: ${voiceName}\n\n"${testText.substring(0, 100)}${testText.length > 100 ? '...' : ''}"\n\nSettings:\n• Speed: ${speed}x\n• Pitch: ${pitch}\n• Browser Voice: ${selectedSpeechVoice?.name || 'Default'}\n\n🔊 Audio will play now...`;

      // Show info without blocking (use setTimeout to allow audio to start)
      setTimeout(() => {
        // Optional: You can show a toast notification here instead of alert
        console.log(previewInfo);
      }, 100);

      // Start speech synthesis
      speechSynthesis.speak(utterance);

      // Safety timeout to prevent stuck playing state
      setTimeout(() => {
        if (isPlaying) {
          speechSynthesis.cancel();
          setIsPlaying(false);
          console.log('⚠️ Voice preview timeout - stopped automatically');
        }
      }, 30000); // 30 second max
    } catch (error) {
      console.error('Error in voice preview:', error);
      setIsPlaying(false);
      alert(
        `⚠️ Voice Preview Error\n\nVoice: ${voiceId}\nError: ${error.message || 'Unknown error'}\n\nTry refreshing the page or using a different browser.`
      );
    }
  };

  const stopVoicePreview = () => {
    try {
      // Stop Web Speech API
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        console.log('🛑 Voice preview stopped by user');
      }
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping voice preview:', error);
      setIsPlaying(false);
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
      const selectedVoice = availableVoices.find(
        v => v.id === voiceProfile?.voice_settings.voice_id
      );

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
        console.log(
          'Testing voice with settings:',
          voiceProfile?.voice_settings
        );
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
      [AgentType.INBOUND_RECEPTIONIST]: {
        tone: 'Professional and welcoming',
        speed: 'Moderate pace for clarity',
        style: 'Clear enunciation, friendly but professional',
      },
      [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
        tone: 'Calm and patient',
        speed: 'Slower for technical explanations',
        style: 'Empathetic, clear, and solution-focused',
      },
      [AgentType.OUTBOUND_FOLLOW_UP]: {
        tone: 'Friendly and reassuring',
        speed: 'Slightly slower for comfort',
        style: 'Warm, personal, and accommodating',
      },
      [AgentType.OUTBOUND_MARKETING]: {
        tone: 'Energetic and engaging',
        speed: 'Moderate pace with enthusiasm',
        style: 'Confident, persuasive, and upbeat',
      },
    };
    return (
      recommendations[agentType] ||
      recommendations[AgentType.INBOUND_RECEPTIONIST]
    );
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
                {agentType.replace(/_/g, ' ').toLowerCase()} agent
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  playVoicePreview(
                    voiceProfile?.voice_settings?.voice_id ||
                      'sarah-professional'
                  )
                }
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
                  const selectedVoice = availableVoices.find(
                    v => v.id === value
                  );
                  if (selectedVoice) {
                    updateVoiceSettings('voice_id', value);
                    updateVoiceSettings(
                      'gender',
                      selectedVoice.gender || 'neutral'
                    );
                    updateVoiceSettings(
                      'accent',
                      selectedVoice.accent.toLowerCase()
                    );
                  }
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingVoices ? 'Loading voices...' : 'Select voice'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingVoices ? (
                    <SelectItem value="loading" disabled>
                      Loading voices...
                    </SelectItem>
                  ) : availableVoices.length === 0 ? (
                    <SelectItem value="no-voices" disabled>
                      No voices available
                    </SelectItem>
                  ) : (
                    availableVoices.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            <span className="text-xs text-gray-500">
                              {voice.accent} • {voice.style || voice.gender}
                              {voice.provider && ` • ${voice.provider}`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <PlayIcon className="h-3 w-3" />
                          </Button>
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
                  {(voiceProfile.voice_settings.speed || 1.0).toFixed(1)}x
                </Badge>
              </div>
              <Slider
                value={[voiceProfile.voice_settings.speed || 1.0]}
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
                  {(voiceProfile.voice_settings.pitch || 1.0).toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[voiceProfile.voice_settings.pitch || 1.0]}
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

            {/* Voice Testing Section */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🎵 Voice Testing & Preview
              </label>

              {/* Preview Text */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Test Message
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  Hello! Thank you for calling{' '}
                  {businessInfo?.business_name || '[Your Business]'}. I'm your
                  AI assistant, and I'm here to help you today. How can I assist
                  you?
                </div>
              </div>

              {/* Voice Testing Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    playVoicePreview(
                      voiceProfile.voice_settings.voice_id ||
                        'sarah-professional'
                    )
                  }
                  disabled={isPlaying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <>
                      <StopIcon className="h-3 w-3 mr-1" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-3 w-3 mr-1" />
                      Test Voice
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    playVoicePreview(
                      voiceProfile.voice_settings.voice_id ||
                        'sarah-professional',
                      `I can help you with scheduling appointments, providing information about our services, or answering questions about ${businessInfo?.business_name || 'our business'}.`
                    )
                  }
                  disabled={isPlaying}
                >
                  <PlayIcon className="h-3 w-3 mr-1" />
                  Test Service Script
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    playVoicePreview(
                      voiceProfile.voice_settings.voice_id ||
                        'sarah-professional',
                      'Can I please have your first and last name? What is the best phone number to reach you? Which staff member will you be seeing today?'
                    )
                  }
                  disabled={isPlaying}
                >
                  <PlayIcon className="h-3 w-3 mr-1" />
                  Test Booking Questions
                </Button>

                {isPlaying && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopVoicePreview}
                  >
                    <StopIcon className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Voice previews use your current settings: Speed{' '}
                {(voiceProfile.voice_settings.speed || 1.0).toFixed(1)}x, Pitch{' '}
                {(voiceProfile.voice_settings.pitch || 1.0).toFixed(1)}
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
