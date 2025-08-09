import { NextRequest, NextResponse } from 'next/server';

// Mock voice preview functionality - in production this would integrate with Retell AI's TTS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  try {
    const { voiceId } = await params;
    const { searchParams } = new URL(request.url);
    const text =
      searchParams.get('text') ||
      'Hello! This is a preview of my voice. How does this sound for your business?';
    const speed = searchParams.get('speed') || '1.0';
    const pitch = searchParams.get('pitch') || '1.0';

    // Voice samples mapping
    const voiceSamples: Record<string, string> = {
      'sarah-professional':
        'Hello! Thank you for calling our office. How may I assist you today?',
      'emily-friendly':
        "Hi there! Thanks for reaching out to us. I'm here to help with whatever you need!",
      'sophia-warm':
        "Good morning! Thank you for calling. I'd be delighted to assist you today.",
      'isabella-elegant':
        'Hello, and thank you for contacting us. How may I be of service to you?',
      'david-professional':
        'Good day. Thank you for calling our office. How may I direct your call?',
      'james-confident':
        "Hello there! Thanks for calling. I'm here to help you with anything you need.",
      'michael-friendly':
        'Hi! Great to hear from you. What can I help you with today?',
      'alexander-authoritative':
        'Good morning. Thank you for calling. How may I assist you?',
      'dr-patricia-caring':
        'Hello, this is Dr. Patricia. Thank you for calling our practice. How may I help you today?',
      'nurse-maria-compassionate':
        'Hi, this is Maria from the medical office. How can I assist you with your healthcare needs?',
      'jessica-helpful':
        "Hello! Thanks for calling our support line. I'm here to help resolve any questions you have!",
      'robert-supportive':
        'Good day! Thank you for reaching out to our support team. How can I help you today?',
    };

    const previewText = voiceSamples[voiceId] || text;

    // In production, this would call Retell AI's TTS API:
    // const retellResponse = await fetch('https://api.retellai.com/text-to-speech', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     voice_id: voiceId,
    //     text: previewText,
    //     speed: parseFloat(speed),
    //     pitch: parseFloat(pitch)
    //   })
    // });

    // Mock response for development
    return NextResponse.json({
      success: true,
      voice_id: voiceId,
      preview_text: previewText,
      audio_url: `https://api.retellai.com/audio-preview/${voiceId}?text=${encodeURIComponent(previewText)}&speed=${speed}&pitch=${pitch}`,
      duration_ms: Math.floor(previewText.length * 50), // Approximate duration
      settings: {
        speed: parseFloat(speed),
        pitch: parseFloat(pitch),
      },
      message: 'Voice preview generated successfully',
    });
  } catch (error) {
    console.error('Error generating voice preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice preview' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  try {
    const { voiceId } = await params;
    const body = await request.json();
    const { text, speed, pitch, settings } = body;

    // In production, integrate with Retell AI
    const previewText =
      text ||
      'This is a test of the voice settings with your custom parameters.';

    return NextResponse.json({
      success: true,
      voice_id: voiceId,
      preview_text: previewText,
      audio_url: `https://api.retellai.com/audio-preview/${voiceId}`,
      settings: {
        speed: speed || 1.0,
        pitch: pitch || 1.0,
        ...settings,
      },
      message: 'Custom voice preview generated successfully',
    });
  } catch (error) {
    console.error('Error generating custom voice preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom voice preview' },
      { status: 500 }
    );
  }
}
