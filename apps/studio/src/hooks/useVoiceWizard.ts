import { useState, useRef, useCallback } from 'react';
import { VoiceState } from '../components/studio/VoiceOrb';

/**
 * 🛰️ [TOPOLOGICAL_ORCHESTRATOR]: useVoiceWizard
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Central Voice Controller",
 *   "behavior": "Coordinates between Recording and Playback layers.",
 *   "ripples": ["VoiceOrb.tsx", "useVoiceRecording.ts"]
 * }
 */
export function useVoiceWizard() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { startRecording, stopRecording, isRecording } = useVoiceRecording((blob) => {
    setState('processing');
    processAudio(blob).then(t => {
       setTranscript(t);
       setState('done');
    });
  });

  const toggleRecording = useCallback(() => {
    if (state === 'idle' || state === 'done') {
      startRecording();
      setState('listening');
    } else if (state === 'listening') {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  return { state, transcript, error, toggleRecording };
}

/**
 * 🛰️ [TOPOLOGICAL_HELPER]: useVoiceRecording
 * Purpose: Strictly manages MediaRecorder lifecycle.
 */
function useVoiceRecording(onStop: (blob: Blob) => void) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => onStop(new Blob(chunks.current, { type: 'audio/webm' }));
    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
  };

  return { startRecording, stopRecording, isRecording: !!mediaRecorder.current };
}

async function processAudio(blob: Blob): Promise<string> {
    // [HIDDEN_PATTERN]: Real audio processing would go here
    return "Real Sovereign Audio Processed";
}