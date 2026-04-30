import { AgentRecord } from './types';

export const mockAgents: AgentRecord[] = [
  { 
    id: "featured-001", 
    name: "Research Analyst Pro", 
    role: "Data Scientist", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "online", 
    kyc_tier: "verified", 
    color: "#6366f1", 
    successRate: 98,
    tasksCompleted: 1247,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["research", "summarization"],
      integrity_hash: "sha256:mock1",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: "featured-002", 
    name: "Customer Support Bot", 
    role: "Support Specialist", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "online", 
    kyc_tier: "verified", 
    color: "#8b5cf6", 
    successRate: 94,
    tasksCompleted: 3420,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["support", "nlp"],
      integrity_hash: "sha256:mock2",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: "featured-003", 
    name: "Code Review Agent", 
    role: "Senior Engineer", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "online", 
    kyc_tier: "verified", 
    color: "#06b6d4", 
    successRate: 96,
    tasksCompleted: 890,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["coding", "security"],
      integrity_hash: "sha256:mock3",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: "featured-004", 
    name: "Robotics Controller", 
    role: "VLA Agent", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "offline", 
    kyc_tier: "verified", 
    color: "#f59e0b", 
    successRate: 92,
    tasksCompleted: 410,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["robotics", "openpi"],
      integrity_hash: "sha256:mock4",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: "featured-005", 
    name: "Finance Forecaster", 
    role: "Quant Analyst", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "online", 
    kyc_tier: "verified", 
    color: "#10b981", 
    successRate: 90,
    tasksCompleted: 2120,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["finance", "ml"],
      integrity_hash: "sha256:mock5",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
  { 
    id: "featured-006", 
    name: "Content Generator", 
    role: "Creative Writer", 
    createdAt: new Date().toISOString(),
    yaml: "",
    status: "online", 
    kyc_tier: "unverified", 
    color: "#ec4899", 
    successRate: 88,
    tasksCompleted: 5670,
    abom: {
      bom_format: 'AIX-NATIVE',
      spec_version: '1.0',
      risk_level: 'low',
      capabilities: ["content", "creative"],
      integrity_hash: "sha256:mock6",
      dependencies: [],
      generated_by: "AIX Studio",
      timestamp: new Date().toISOString()
    }
  },
];
