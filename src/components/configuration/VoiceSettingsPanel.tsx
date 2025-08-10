'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';

interface AgentConfig {
  id?: string;
  agent_id?: string;
}

interface VoiceSettings {
  voice_id: string;
  voice_name: string;
  language: string;
  speed: number;
  pitch: number;
  stability: number;
  clarity: number;
  style: string;
}

interface VoiceSettingsPanelProps {
  agent: AgentConfig | null;
  agentType: AgentType;
  onSave: (data: VoiceSettings) => Promise<void>;
}

const AVAILABLE_VOICES = [
  {
    id: 'voice_1',
    name: 'Sarah - Professional Female',
    accent: 'American',
    style: 'Professional',
  },
  {
    id: 'voice_2',
    name: 'Michael - Friendly Male',
    accent: 'American',
    style: 'Friendly',
  },
  {
    id: 'voice_3',
    name: 'Emma - Warm Female',
    accent: 'British',
    style: 'Warm',
  },
  {
    id: 'voice_4',
    name: 'James - Authoritative Male',
    accent: 'American',
    style: 'Authoritative',
  },
  {
    id: 'voice_5',
    name: 'Sofia - Calm Female',
    accent: 'American',
    style: 'Calm',
  },
  {
    id: 'voice_6',
    name: 'David - Gentle Male',
    accent: 'Australian',
    style: 'Gentle',
  },
];

export function VoiceSettingsPanel({
  agent,
  agentType,
  onSave,
}: VoiceSettingsPanelProps) {
  const agentConfig = AGENT_TYPE_CONFIGS[agentType];
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice_id: 'voice_1',
    voice_name: 'Sarah - Professional Female',
    language: 'en-US',
    speed: agentConfig.suggestedVoiceSettings.speed,
    pitch: agentConfig.suggestedVoiceSettings.pitch,
    stability: 0.75,
    clarity: 0.75,
    style: agentConfig.suggestedVoiceSettings.tone,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleVoiceChange = (voiceId: string) => {
    const selectedVoice = AVAILABLE_VOICES.find(v => v.id === voiceId);
    if (selectedVoice) {
      setVoiceSettings(prev => ({
        ...prev,
        voice_id: voiceId,
        voice_name: selectedVoice.name,
        style: selectedVoice.style.toLowerCase(),
      }));
    }
  };

  const handleSliderChange = (field: keyof VoiceSettings, value: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestVoice = async () => {
    setIsPlaying(true);
    try {
      // TODO: Implement voice testing with Retell API
      console.log('Testing voice with settings:', voiceSettings);

      // Simulate audio playback
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(voiceSettings);
    } catch (error) {
      console.error('Error saving voice settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <span>Voice Selection</span>
            <Badge variant="outline">{agentConfig.name}</Badge>
          </CardTitle>
          <CardDescription>
            Choose the voice that best represents your{' '}
            {agentConfig.name.toLowerCase()}. Optimized for{' '}
            {agentConfig.suggestedVoiceSettings.tone} tone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </label>
            <Select
              value={voiceSettings.voice_id}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_VOICES.map(voice => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-gray-500">
                        {voice.accent} • {voice.style}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <Select
              value={voiceSettings.language}
              onValueChange={value =>
                setVoiceSettings(prev => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="en-AU">English (Australia)</SelectItem>
                <SelectItem value="en-CA">English (Canada)</SelectItem>
                <SelectItem value="es-US">Spanish (US)</SelectItem>
                <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleTestVoice}
              disabled={isPlaying}
              className="flex-1"
            >
              {isPlaying ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Playing...</span>
                </div>
              ) : (
                <>🎵 Test Voice</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Customization */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Customization</CardTitle>
          <CardDescription>
            Fine-tune the voice characteristics to match your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Speed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Speaking Speed
              </label>
              <span className="text-sm text-gray-500">
                {voiceSettings.speed}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speed}
              onChange={e =>
                handleSliderChange('speed', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Voice Pitch
              </label>
              <span className="text-sm text-gray-500">
                {voiceSettings.pitch}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={e =>
                handleSliderChange('pitch', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower</span>
              <span>Normal</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Stability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Voice Stability
              </label>
              <span className="text-sm text-gray-500">
                {Math.round(voiceSettings.stability * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceSettings.stability}
              onChange={e =>
                handleSliderChange('stability', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Variable</span>
              <span>More Consistent</span>
            </div>
          </div>

          {/* Clarity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Voice Clarity
              </label>
              <span className="text-sm text-gray-500">
                {Math.round(voiceSettings.clarity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceSettings.clarity}
              onChange={e =>
                handleSliderChange('clarity', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Natural</span>
              <span>More Clear</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Preview</CardTitle>
          <CardDescription>
            Test how your customized voice sounds with a sample script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Sample Script:
            </p>
            <p className="text-sm text-gray-600 italic">
              `Hello! Thank you for calling Sunshine Medical Clinic. I'm your AI
              assistant, and I'm here to help you today. I can assist you with
              scheduling appointments, providing information about our services,
              or connecting you with our staff. How may I help you today?`
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleTestVoice}
              disabled={isPlaying}
              className="flex-1"
            >
              {isPlaying ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Playing Preview...</span>
                </div>
              ) : (
                <>🎵 Play Full Preview</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Voice Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
