import { NextRequest, NextResponse } from 'next/server';

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

// Mock Retell AI voices data - replace with actual Retell AI API call
const RETELL_VOICES: RetellVoice[] = [
  // Female Voices
  {
    id: 'sarah-professional',
    name: 'Sarah',
    accent: 'American',
    style: 'Professional',
    gender: 'Female',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/sarah-professional',
  },
  {
    id: 'emily-friendly',
    name: 'Emily',
    accent: 'American',
    style: 'Friendly',
    gender: 'Female',
    age: 'Young Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/emily-friendly',
  },
  {
    id: 'sophia-warm',
    name: 'Sophia',
    accent: 'British',
    style: 'Warm',
    gender: 'Female',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/sophia-warm',
  },
  {
    id: 'isabella-elegant',
    name: 'Isabella',
    accent: 'American',
    style: 'Elegant',
    gender: 'Female',
    age: 'Adult',
    provider: 'OpenAI',
    preview_audio_url: '/api/voice-preview/isabella-elegant',
  },

  // Male Voices
  {
    id: 'david-professional',
    name: 'David',
    accent: 'American',
    style: 'Professional',
    gender: 'Male',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/david-professional',
  },
  {
    id: 'james-confident',
    name: 'James',
    accent: 'British',
    style: 'Confident',
    gender: 'Male',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/james-confident',
  },
  {
    id: 'michael-friendly',
    name: 'Michael',
    accent: 'American',
    style: 'Friendly',
    gender: 'Male',
    age: 'Young Adult',
    provider: 'OpenAI',
    preview_audio_url: '/api/voice-preview/michael-friendly',
  },
  {
    id: 'alexander-authoritative',
    name: 'Alexander',
    accent: 'American',
    style: 'Authoritative',
    gender: 'Male',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/alexander-authoritative',
  },

  // Specialized Healthcare Voices
  {
    id: 'dr-patricia-caring',
    name: 'Dr. Patricia',
    accent: 'American',
    style: 'Caring Professional',
    gender: 'Female',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/dr-patricia-caring',
  },
  {
    id: 'nurse-maria-compassionate',
    name: 'Maria',
    accent: 'American',
    style: 'Compassionate',
    gender: 'Female',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/nurse-maria-compassionate',
  },

  // Customer Service Voices
  {
    id: 'jessica-helpful',
    name: 'Jessica',
    accent: 'American',
    style: 'Helpful',
    gender: 'Female',
    age: 'Young Adult',
    provider: 'OpenAI',
    preview_audio_url: '/api/voice-preview/jessica-helpful',
  },
  {
    id: 'robert-supportive',
    name: 'Robert',
    accent: 'American',
    style: 'Supportive',
    gender: 'Male',
    age: 'Adult',
    provider: 'ElevenLabs',
    preview_audio_url: '/api/voice-preview/robert-supportive',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterGender = searchParams.get('gender');
    const filterStyle = searchParams.get('style');
    const filterAccent = searchParams.get('accent');

    let filteredVoices = RETELL_VOICES;

    // Apply filters
    if (filterGender) {
      filteredVoices = filteredVoices.filter(
        voice => voice.gender?.toLowerCase() === filterGender.toLowerCase()
      );
    }

    if (filterStyle) {
      filteredVoices = filteredVoices.filter(voice =>
        voice.style.toLowerCase().includes(filterStyle.toLowerCase())
      );
    }

    if (filterAccent) {
      filteredVoices = filteredVoices.filter(
        voice => voice.accent.toLowerCase() === filterAccent.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      voices: filteredVoices,
      total: filteredVoices.length,
    });
  } catch (error) {
    console.error('Error fetching Retell voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}

// POST endpoint for future Retell AI integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, voice_id, settings } = body;

    // Future integration with actual Retell AI API
    // const retellResponse = await fetch('https://api.retellai.com/voices', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ voice_id, settings })
    // });

    return NextResponse.json({
      success: true,
      message: 'Voice settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating voice settings:', error);
    return NextResponse.json(
      { error: 'Failed to update voice settings' },
      { status: 500 }
    );
  }
}
