import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * AIX Voice Wizard Hook
 * Manages the full cycle: Listen (STT) -> Process (LLM) -> Speak (TTS).
 * Now includes Session Persistence (TASK 3 / WIRING).
 */
export function useVoiceWizard() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [manifest, setManifest] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [step, setStep] = useState(0);

  // Initialize Session
  useEffect(() => {
    let sid = localStorage.getItem('aix_wizard_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('aix_wizard_session_id', sid);
    }
    setSessionId(sid);
    loadSession(sid);
  }, []);

  const loadSession = async (sid: string) => {
    try {
      const res = await fetch('/api/voice-wizard/session', {
        headers: { 'x-session-id': sid }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStep(data.step || 0);
        if (data.partialManifest) setManifest(data.partialManifest);
      }
    } catch (err) {
      console.error("Failed to load session", err);
    }
  };

  const saveSession = useCallback(async (msgs: any[], currentStep: number, partial: any) => {
    if (!sessionId) return;
    try {
      await fetch('/api/voice-wizard/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          messages: msgs, 
          step: currentStep, 
          partialManifest: partial 
        }),
      });
    } catch (err) {
      console.error("Failed to save session", err);
    }
  }, [sessionId]);

  // ... (recordAudio, transcribe, chat, speak remain the same but use isProcessing)

  // 1. Record Audio from Microphone
  const recordAudio = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve(blob);
        };
        
        setIsListening(true);
        mediaRecorder.start();
        
        // Auto-stop after 8 seconds or manually via handleVoiceTurn
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsListening(false);
          }
        }, 8000);
      } catch (err) {
        toast.error("Microphone access denied or not available.");
        reject(err);
      }
    });
  };

  // 2. Transcribe via Groq Whisper
  const transcribe = async (audio: Blob): Promise<string> => {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');
    
    const res = await fetch('/api/voice-wizard/transcribe', {
      method: 'POST',
      body: form
    });
    
    if (!res.ok) throw new Error("STT failed");
    const data = await res.json();
    return data.text;
  };

  // 3. Conversational AI via Gemini Flash
  const chat = async (userText: string) => {
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    
    const res = await fetch('/api/voice-wizard/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-session-id': sessionId 
      },
      body: JSON.stringify({ messages: newMessages, sessionId }),
    });
    
    if (!res.ok) throw new Error("LLM failed");
    
    // Process stream or text response
    const reply = await res.text();
    
    // Detect Manifest Completion
    if (reply.includes('MANIFEST_COMPLETE:')) {
      const parts = reply.split('MANIFEST_COMPLETE:');
      const cleanReply = parts[0].trim();
      const jsonStr = parts[1].trim();
      
      try {
        const json = JSON.parse(jsonStr);
        setManifest(json);
        setMessages([...newMessages, { role: 'assistant', content: cleanReply }]);
        return cleanReply;
      } catch (e) {
        console.error("Failed to parse manifest JSON", e);
      }
    }
    
    const finalMessages = [...newMessages, { role: 'assistant', content: reply }];
    setMessages(finalMessages);
    
    // Auto-save session
    const nextStep = reply.includes('MANIFEST_COMPLETE:') ? 5 : step + 1;
    setStep(nextStep);
    saveSession(finalMessages, nextStep, manifest);
    
    return reply;
  };

  // 4. Wizard Voice Output (Edge-TTS)
  const speak = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    
    try {
      const res = await fetch('/api/voice-wizard/speak', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) throw new Error("TTS failed");
      
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);

      const cleanup = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url); // ✅ always release — onended OR onerror
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;
      
      await audio.play();
    } catch (err) {
      console.error("Playback failed", err);
      setIsSpeaking(false);
    }
  };

  // The Full Interaction Loop
  const handleVoiceTurn = async () => {
    try {
      const audio = await recordAudio();
      setIsProcessing(true);
      
      const userText = await transcribe(audio);
      if (!userText) {
        setIsProcessing(false);
        return;
      }
      
      const wizardReply = await chat(userText);
      setIsProcessing(false);
      
      await speak(wizardReply);
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(`Wizard Error: ${err.message}`);
    }
  };

  return { 
    handleVoiceTurn, 
    isListening, 
    isSpeaking, 
    isProcessing,
    manifest, 
    messages,
    setManifest 
  };
}
