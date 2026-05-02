import { useState, useRef, useCallback } from 'react';
import { VoiceState } from '../components/studio/VoiceOrb';

export function useVoiceWizard() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      // طلب صلاحية الميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        setState('processing');
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setState('listening');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('تعذر الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.');
      setState('idle');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorder.current && state === 'listening') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [state]);

  // دالة للتبديل بين التسجيل والإيقاف (تُربط بضغطة الكرة)
  const toggleRecording = useCallback(() => {
    if (state === 'idle' || state === 'done') {
      startListening();
    } else if (state === 'listening') {
      stopListening();
    }
  }, [state, startListening, stopListening]);

  return {
    state,
    transcript,
    error,
    toggleRecording
  };
}