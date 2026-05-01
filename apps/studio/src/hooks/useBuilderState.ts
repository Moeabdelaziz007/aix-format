import { useState, useMemo, useRef, useEffect } from "react";
import { Manifest, AgentSkill, McpPrompt } from "@/lib/types";
import { computeManifestChecksum } from "@/lib/utils";
import { validateBuilderField, FieldError } from "@/lib/builder-validation";

/**
 * AIX Builder State Hook
 * Centralized state management for the Agent Manifest Architect.
 */
export function useBuilderState() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Manifest>({
    meta: {
      name: "my-first-agent",
      version: "1.0.0",
      format_version: "1.3",
      author: "Axiom Developer",
      description: "A sovereign AI agent built to assist with general tasks.",
    },
    persona: {
      role: "General Assistant",
      instructions: "Your goal is to provide accurate, helpful, and sovereign assistance to the user while maintaining strict privacy and protocol alignment.",
      tone: "formal",
    },
    skills: [] as AgentSkill[],
    security: {
      checksum: {
        algorithm: "sha256",
        value: "pending"
      }
    },
    identity_layer: {
      id: `did:axiom:axiomid.app:agent-temp`,
      provider: {
        type: 'pi_network',
        name: 'Pi Network',
        authority: 'axiomid.app'
      },
      verification: {
        status: 'unverified',
        trust_level: 0
      },
      issuedAt: new Date().toISOString()
    },
    economics: {
      settlement: {
        layer: 'pi_network',
        network: 'testnet',
        escrow_enabled: false,
        currency: 'PI'
      },
      pricing_model: "free",
      currency: "PI"
    },
    abom: {
      bom_format: "CycloneDX",
      spec_version: "1.6",
      risk_level: "low",
      integrity_hash: "pending",
      capabilities: [] as string[],
      generated_by: "AIX-Studio",
      timestamp: new Date().toISOString(),
      dependencies: [] as string[],
      saas_services: [] as Array<{
        name: string;
        endpoint?: string;
        usage_policy?: string;
        tier?: string;
      }>
    },
    mcp: {
      prompts: [] as McpPrompt[]
    }
  });

  const [errors, setErrors] = useState<Record<string, FieldError | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const liveChecksum = useMemo(() => {
    return computeManifestChecksum(formData);
  }, [formData]);

  const handleFieldChange = (section: keyof Manifest | 'meta' | 'persona', field: string, value: any) => {
    setFormData(prev => {
      if (section === 'meta' || section === 'persona') {
        return {
          ...prev,
          [section]: { ...(prev as any)[section], [field]: value }
        };
      }
      return { ...prev, [section]: value };
    });

    const error = validateBuilderField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const isStepValid = (stepId: number) => {
    switch (stepId) {
      case 1: // Context
        return !!formData.meta.name &&
               !!formData.meta.version &&
               !!formData.meta.author &&
               formData.meta.name.length >= 3 &&
               !errors.name && !errors.version && !errors.author;
      case 2: // Persona
        return !!formData.persona.role && !!formData.persona.instructions && !errors.role && !errors.instructions;
      case 3: // Abilities
        return true;
      case 4: // Economics
        return !!formData.economics.settlement.layer;
      case 5: // Security
        return formData.identity_layer.kyc_tier !== 'unverified';
      case 6: // Finalize
        return true;
      default:
        return false;
    }
  };

  return {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    errors,
    touchedFields,
    liveChecksum,
    handleFieldChange,
    handleBlur,
    isStepValid,
  };
}
