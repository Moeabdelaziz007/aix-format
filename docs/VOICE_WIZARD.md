# AIX Voice Wizard Protocol (v1.3.0)

The Voice Wizard is a "Zero Cost" conversational architect designed to onboard non-technical users into the AIX Sovereign ecosystem. It transforms verbal intent into production-grade sovereign agent manifests.

## Technical Architecture

The wizard operates as a 4-layer asynchronous pipeline:

1.  **Speech-to-Text (STT)**: 
    - **Engine**: Groq Whisper (whisper-large-v3).
    - **Endpoint**: `/api/voice-wizard/transcribe`.
    - **Function**: Captures user voice and converts it to high-fidelity text.

2.  **Conversational Intelligence (LLM)**:
    - **Engine**: Google Gemini 2.0 Flash.
    - **Endpoint**: `/api/voice-wizard/chat`.
    - **System Prompt**: Enforces a step-by-step data collection flow (Name → Role → Capabilities → Identity → Economics).
    - **Persistence**: Managed via Redis with a 24h session TTL.

3.  **Text-to-Speech (TTS)**:
    - **Engine**: Microsoft Edge TTS (edge-tts).
    - **Endpoint**: `/api/voice-wizard/speak`.
    - **Voices**: `en-US-AriaNeural` (English) and `ar-SA-HamedNeural` (Arabic).

4.  **Manifest Constructor**:
    - **Logic**: Once all data is collected, the LLM emits a `MANIFEST_COMPLETE:` trigger followed by a valid AIX v1.3.0 JSON.
    - **Validation**: Handled via `builder-validation.ts` before deployment.

## Interaction States

- **Idle**: User is presented with the "Setup with Voice" entry point.
- **Listening**: Real-time recording with visual pulse animation.
- **Processing**: AI reasoning (STT + LLM) with a spinning loader.
- **Speaking**: Visualizing wizard feedback via TTS audio stream.
- **Done**: Final manifest preview with a 1-click "Say Yes to Deploy" action.

## Session Management

Sessions are persisted in Redis using the `aix:wizard:session:{sessionId}` namespace. This allows users to resume their setup flow if the browser is closed or refreshed.
