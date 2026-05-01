"use client";

/**
 * useGlobalVoice — thin re-export of VoiceCommandProvider context.
 *
 * Previously this hook owned its own SpeechRecognition instance,
 * which caused a crash when both this hook AND VoiceCommandProvider
 * tried to open the mic simultaneously (only one recognition session
 * is allowed per browser tab).
 *
 * Now it simply delegates to the singleton VoiceCommandProvider so
 * there is exactly ONE recognition instance in the entire app.
 */
export { useVoiceCommandCtx as useGlobalVoice } from "@/components/providers/VoiceCommandProvider";
