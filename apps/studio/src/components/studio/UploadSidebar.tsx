"use client";

import { useState } from "react";
import { UploadCloud, FileJson, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceOrb } from "./VoiceOrb";
import { KycSignatureModal } from "./KycSignatureModal";

export function UploadSidebar() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.aix')) {
        setFile(droppedFile);
      } else {
        alert("Please upload a valid .aix file.");
      }
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    setVoiceCommand(transcript);
    setIsProcessingVoice(true);

    // Simulate AI parsing the voice command to configure an agent
    setTimeout(() => {
      setIsProcessingVoice(false);
      if (transcript.toLowerCase().includes("deploy") || transcript.toLowerCase().includes("create")) {
        // Mock creating an AIX payload from voice
        const blob = new Blob(['{"aix_version": "1.0", "identity": {"name": "Voice-Generated Agent"}}'], { type: 'application/json' });
        const mockFile = new File([blob], "voice-agent.aix", { type: "application/json" });
        setFile(mockFile);
      }
    }, 2000);
  };

  const handleSign = () => {
    setIsKycModalOpen(false);
    alert(`Successfully signed and deployed ${file?.name} to Pi Network!`);
    setFile(null);
  };

  return (
    <>
      <aside className="w-full lg:w-[400px] flex-shrink-0 glass-panel rounded-3xl p-6 flex flex-col h-[calc(100vh-120px)] sticky top-24">
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-white">Deploy Sovereign Agent</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
            Upload your .aix payload or use voice orchestration to configure a new agent on the fly.
          </p>
        </div>

        {/* Voice First Interface */}
        <div className="mb-10 py-6 bg-[var(--color-surface-container-low)] rounded-2xl border border-[var(--color-glass-border)]">
          <VoiceOrb onTranscript={handleVoiceCommand} isProcessing={isProcessingVoice} />
          {voiceCommand && !isProcessingVoice && (
            <div className="mt-4 px-6 text-center">
              <p className="text-xs text-[var(--color-primary)] italic">"{voiceCommand}"</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-[var(--color-glass-border)]" />
          <span className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">OR MANUAL UPLOAD</span>
          <div className="h-[1px] flex-1 bg-[var(--color-glass-border)]" />
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={cn(
            "flex-1 relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 p-6 text-center",
            dragActive
              ? "border-[var(--color-primary)] bg-[rgba(0,219,233,0.05)]"
              : "border-[var(--color-glass-border)] hover:border-[var(--color-on-surface-variant)]",
            file && "border-solid border-[var(--color-secondary)] bg-[rgba(210,187,255,0.05)]"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center">
                <FileJson className="w-6 h-6 text-[var(--color-secondary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">Ready for signature</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <UploadCloud className="w-10 h-10 text-[var(--color-on-surface-variant)]" />
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Drag & Drop your <span className="text-white font-medium">.aix</span> file here
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            disabled={!file}
            onClick={() => setIsKycModalOpen(true)}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2",
              file
                ? "bg-gradient-primary text-white shadow-[0_0_20px_rgba(0,219,233,0.2)] hover:opacity-90"
                : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] cursor-not-allowed"
            )}
          >
            {file ? <CheckCircle2 className="w-5 h-5" /> : null}
            Upload & Sign via Pi KYC
          </button>
        </div>
      </aside>

      <KycSignatureModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onSign={handleSign}
        agentName={file?.name.replace('.aix', '') || "Agent Payload"}
      />
    </>
  );
}
