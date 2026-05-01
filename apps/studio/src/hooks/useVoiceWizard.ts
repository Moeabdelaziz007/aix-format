import { useState } from 'react';
import { toast } from 'sonner';

/**
 * AIX Voice Wizard Hook
 * Manages the full cycle: Listen (STT) -> Process (LLM) -> Speak (TTS).
 */
export function useVoiceWizard() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [manifest, setManifest] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      body: JSON.stringify({ messages: newMessages }),
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
    
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
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
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      
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
