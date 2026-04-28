"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, UploadCloud, ServerCog, Globe } from "lucide-react";
import { KycSignatureModal } from "./KycSignatureModal";

const steps = [
  { id: "create", label: "Create Agent", icon: ServerCog },
  { id: "kyc", label: "KYC Verification", icon: CheckCircle2 },
  { id: "deploy", label: "Deploy to Nexus", icon: Globe },
];

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [authData, setAuthData] = useState<any>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 0) {
        setIsModalOpen(true);
      } else {
        setCurrentStep((p) => p + 1);
      }
    }
  };

  const handleSign = async (result: any) => {
    setIsSigning(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAuthData(result);
    setIsSigning(false);
    setIsModalOpen(false);
    setCurrentStep(1); // Move to deployment
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white mb-2">Setup Wizard</h2>

      <div className="bg-[rgba(20,20,30,0.4)] rounded-2xl border border-[var(--color-border)] backdrop-blur-xl p-8 relative overflow-hidden">
        {/* Progress Tracker */}
        <div className="flex justify-between relative mb-12">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-800 -z-10 -translate-y-1/2"></div>
          <motion.div
            className="absolute top-1/2 left-0 h-[2px] bg-indigo-500 -z-10 -translate-y-1/2"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          ></motion.div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor: isActive ? "#4f46e5" : isCompleted ? "#10b981" : "#1f2937",
                    borderColor: isActive ? "#818cf8" : isCompleted ? "#34d399" : "#374151",
                  }}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-white"
                >
                  <Icon size={18} />
                </motion.div>
                <span className={`text-xs font-medium ${isActive || isCompleted ? "text-white" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center h-full"
            >
              {currentStep === 0 && (
                <div className="space-y-6 w-full">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                    <UploadCloud className="text-indigo-400 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Generate Agent Payload</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Use the Voice Orb to configure your agent, or upload an existing <code className="bg-gray-800 px-1 py-0.5 rounded text-indigo-300">.aix</code> file.
                  </p>
                  <button
                    onClick={handleNext}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    Proceed to KYC Binding <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 w-full">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <CheckCircle2 className="text-emerald-400 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">KYC Verified</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Identity verified successfully. The agent&apos;s cryptographic signature has been generated.
                  </p>
                  {authData && (
                     <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-left max-w-xs mx-auto">
                         <p className="text-xs text-gray-500">Signer: <span className="text-gray-300">{authData.user.username}</span></p>
                         <p className="text-xs text-gray-500 truncate">Token: <span className="text-gray-300 font-mono">{authData.accessToken}</span></p>
                     </div>
                  )}
                  <button
                    onClick={handleNext}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    Deploy to Network <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 w-full">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <Globe className="text-blue-400 w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Agent Deployed!</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Your sovereign agent is now live on the AIX Nexus. It can begin processing tasks and earning Pi.
                  </p>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="mt-4 border border-gray-600 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    Create Another Agent
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <KycSignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSign={handleSign}
        isSigning={isSigning}
        agentName="Custom Agent"
      />
    </div>
  );
}
