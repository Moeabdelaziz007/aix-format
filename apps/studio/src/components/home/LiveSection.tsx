"use client";

import { SetupWizard } from "@/components/studio/SetupWizard";
import { AgenticKycSetup } from "@/components/studio/AgenticKycSetup";
import LiveValidator from "@/components/studio/LiveValidator";

export function LiveSection() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-white mb-2">Security & Identity</h2>
        <AgenticKycSetup />
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
        <SetupWizard />
      </div>
      <LiveValidator />
    </div>
  );
}
