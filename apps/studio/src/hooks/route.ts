import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { transcript } = await request.json();

        if (!transcript) {
            return NextResponse.json({ error: 'النص مفقود' }, { status: 400 });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.warn('تنبيه: GEMINI_API_KEY غير موجود في ملف .env');
            return NextResponse.json({ error: 'مفتاح API الخاص بـ Gemini مفقود' }, { status: 500 });
        }

        // هندسة الـ Prompt لتوليد الوكيل بناءً على بروتوكول AIX v1.3
        const systemPrompt = `
    أنت مهندس سيادي لبروتوكول AIX. قم بتحليل النص التالي من المستخدم واستخراج بيانات الوكيل الذكي.
    قم بإرجاع النتيجة كـ JSON فقط بالهيكل التالي المتوافق مع AIX Format:
    {
      "meta": { "name": "string (kebab-case)", "description": "string", "type": "persona" },
      "persona": { "role": "string", "instructions": "string (detailed)", "tone": "string" }
    }
    النص: "${transcript}"
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json", // نضمن عودة JSON نقي بدون Markdown
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`خطأ من Gemini API: ${errorData}`);
        }

        const data = await response.json();
        const geminiResponseText = data.candidates[0].content.parts[0].text;

        // تحويل النص المسترجع إلى كائن JSON
        const agentData = JSON.parse(geminiResponseText);

        return NextResponse.json({ agent: agentData });
    } catch (error) {
        console.error('خطأ أثناء توليد الوكيل بـ Gemini:', error);
        return NextResponse.json({ error: 'فشلت عملية التحليل وتوليد الوكيل' }, { status: 500 });
    }
}