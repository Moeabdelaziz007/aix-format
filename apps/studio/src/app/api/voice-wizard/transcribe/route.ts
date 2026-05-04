import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف صوتي' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn('تنبيه: GROQ_API_KEY غير موجود في ملف .env');
      return NextResponse.json({ error: 'مفتاح API مفقود' }, { status: 500 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'ar'); // يمكن تغييره لدعم لغات متعددة

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`خطأ من Groq API: ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.text });
  } catch (error) {
    console.error('خطأ أثناء تحويل الصوت:', error);
    return NextResponse.json({ error: 'فشلت عملية تحويل الصوت إلى نص' }, { status: 500 });
  }
}