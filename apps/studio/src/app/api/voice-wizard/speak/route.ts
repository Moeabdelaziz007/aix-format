// import { EdgeTTS } from 'edge-tts';
const EdgeTTS = null;
import { NextRequest, NextResponse } from 'next/server';

/**
 * AIX Voice Wizard - Speak Route
 * Generates high-quality Microsoft Neural speech using edge-tts.
 * Supports English and Arabic for a globally accessible builder experience.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // High-quality neural voices
    const voices = {
      en: 'en-US-AriaNeural',    // Natural female English voice
      ar: 'ar-SA-HamedNeural',   // Natural Arabic voice
    };
    
    const tts = new EdgeTTS();
    const audioBuffer = await tts.synthesize(text, {
      voice: voices[lang as keyof typeof voices] || voices.en,
      rate: '-5%',   // Slightly slower for better clarity
      pitch: '+0Hz',
    });
    
    return new Response(audioBuffer, {
      headers: { 
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error: any) {
    console.error("[Voice TTS] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
