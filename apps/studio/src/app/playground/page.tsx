'use client';

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/components/shared';
import {
  Play,
  Send,
  Code2,
  Terminal as TerminalIcon,
  Cpu,
  History,
  Zap,
  ShieldCheck,
  ChevronRight,
  Copy,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const API_ENDPOINTS = [
  {
    id: 'create_agent',
    method: 'POST',
    path: '/v1/agents',
    label: 'Create Agent',
    description: 'Create a new sovereign agent by anchoring its manifest to the decentralized registry.',
    defaultRequest: {
      name: "FinanceBot",
      version: "1.0.0",
      persona: {
        role: "Financial Analyst",
        tone: "professional"
      },
      skills: ["web_scraping", "sentiment_analysis"]
    },
    mockResponse: {
      id: "agent_123",
      status: "created",
      did: "did:aix:88x2-99p1-xi01",
      manifest_url: "https://registry.axiom.org/did:aix:88x2..."
    }
  },
  {
    id: 'list_agents',
    method: 'GET',
    path: '/v1/agents',
    label: 'List Agents',
    description: 'Retrieve all sovereign agents owned by the authenticated AxiomID.',
    defaultRequest: null,
    mockResponse: {
      success: true,
      data: [
        { id: "agent_123", name: "FinanceBot", status: "active" },
        { id: "agent_456", name: "SecuritySentinel", status: "paused" }
      ]
    }
  },
  {
    id: 'get_agent',
    method: 'GET',
    path: '/v1/agents/{id}',
    label: 'Get Agent Details',
    description: 'Fetch the full manifest and operational status of a specific agent.',
    defaultRequest: null,
    mockResponse: {
      id: "agent_123",
      name: "FinanceBot",
      manifest: { /* ... */ },
      trust_score: 98
    }
  }
];

export default function PlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [requestPayload, setRequestPayload] = useState(JSON.stringify(selectedEndpoint.defaultRequest, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleEndpointSelect = (endpoint: any) => {
    setSelectedEndpoint(endpoint);
    setRequestPayload(endpoint.defaultRequest ? JSON.stringify(endpoint.defaultRequest, null, 2) : "{}");
    setResponse(null);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setResponse(selectedEndpoint.mockResponse);
      setIsExecuting(false);
    }, 1000);
  };

  const codeSamples = useMemo(() => {
    const { method, path } = selectedEndpoint;
    const body = requestPayload !== '{}' ? requestPayload : '';
    
    return {
      curl: `curl -X ${method} "https://api.aix-format.org${path}" \\
  -H "Authorization: Bearer YOUR_PI_TOKEN" ${body ? `\\
  -H "Content-Type: application/json" \\
  -d '${body.replace(/'/g, "'\\''")}'` : ''}`,
      javascript: `const response = await fetch('https://api.aix-format.org${path}', {
  method: '${method}',
  headers: {
    'Authorization': 'Bearer YOUR_PI_TOKEN',
    'Content-Type': 'application/json'
  }${body ? `,\n  body: JSON.stringify(${body})` : ''}
});
const data = await response.json();`,
      python: `import requests

url = "https://api.aix-format.org${path}"
headers = {
    "Authorization": "Bearer YOUR_PI_TOKEN",
    "Content-Type": "application/json"
}
${body ? `data = ${body}\nresponse = requests.${method.toLowerCase()}(url, json=data, headers=headers)` : `response = requests.${method.toLowerCase()}(url, headers=headers)`}
print(response.json())`,
      go: `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    url := "https://api.aix-format.org${path}"
    req, _ := http.NewRequest("${method}", url, nil)
    req.Header.Add("Authorization", "Bearer YOUR_PI_TOKEN")
    
    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    body, _ := ioutil.ReadAll(res.Body)
    fmt.Println(string(body))
}`
    };
  }, [selectedEndpoint, requestPayload]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col gap-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                 <Typography variant="h1" className="text-4xl font-black text-white italic uppercase tracking-tighter">
                    API Reference
                 </Typography>
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">v1.3.0</Badge>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 {['Endpoints', 'Authentication', 'Errors', 'Webhooks'].map(tab => (
                   <button key={tab} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                      {tab}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sidebar */}
              <div className="lg:col-span-3 card rounded-[2rem] border-white/5 bg-white/[0.01] p-6 space-y-6">
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input 
                      type="text" 
                      placeholder="Search endpoints..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[10px] text-white focus:outline-none focus:border-primary/40 transition-all"
                    />
                 </div>
                 <div className="space-y-1">
                    {API_ENDPOINTS.map(ep => (
                      <button
                        key={ep.id}
                        onClick={() => handleEndpointSelect(ep)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl transition-all border group",
                          selectedEndpoint.id === ep.id 
                            ? "bg-primary/10 border-primary/20" 
                            : "bg-transparent border-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                           <span className={cn(
                             "text-[8px] font-black px-1.5 py-0.5 rounded",
                             ep.method === 'GET' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                           )}>
                             {ep.method}
                           </span>
                           <span className={cn(
                             "text-[10px] font-bold transition-colors",
                             selectedEndpoint.id === ep.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                           )}>
                             {ep.path}
                           </span>
                        </div>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-8">
                 {/* Request Section */}
                 <div className="card rounded-[3rem] border-white/5 bg-[#0a0a0f]/80 p-8 space-y-8">
                    <div className="space-y-4">
                       <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{selectedEndpoint.label}</h2>
                       <p className="text-xs text-zinc-500 leading-relaxed">{selectedEndpoint.description}</p>
                       <div className="flex items-center gap-2 px-4 py-3 bg-black/40 rounded-xl border border-white/5">
                          <span className={cn(
                             "text-[10px] font-black uppercase",
                             selectedEndpoint.method === 'GET' ? "text-emerald-400" : "text-blue-400"
                          )}>{selectedEndpoint.method}</span>
                          <code className="text-[10px] text-zinc-300 font-mono">https://api.aix-format.org{selectedEndpoint.path}</code>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Request Body</label>
                          <Badge variant="outline" className="text-[8px] border-white/5 text-zinc-600">JSON</Badge>
                       </div>
                       <div className="relative font-mono group">
                          <textarea 
                            value={requestPayload}
                            onChange={(e) => setRequestPayload(e.target.value)}
                            disabled={selectedEndpoint.method === 'GET'}
                            className="w-full min-h-[240px] bg-black/60 border border-white/5 rounded-[2rem] p-6 text-[11px] text-zinc-400 focus:outline-none focus:border-primary/40 transition-all resize-none leading-relaxed custom-scrollbar"
                          />
                          {selectedEndpoint.method === 'GET' && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
                               <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">No Body Required</span>
                            </div>
                          )}
                       </div>
                       <button 
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                       >
                         {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                         {isExecuting ? 'Running Request...' : 'Run Request'}
                       </button>
                    </div>

                    {/* Response Area */}
                    <AnimatePresence>
                       {response && (
                         <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="space-y-4 pt-8 border-t border-white/5"
                         >
                            <div className="flex items-center justify-between ml-1">
                               <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Response</label>
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] font-black text-emerald-500 uppercase">200 OK</span>
                               </div>
                            </div>
                            <pre className="bg-black/60 border border-white/5 rounded-[2rem] p-6 text-[11px] text-emerald-400/80 overflow-x-auto custom-scrollbar font-mono leading-relaxed">
                               {JSON.stringify(response, null, 2)}
                            </pre>
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>

                 {/* Code Samples Section */}
                 <div className="card rounded-[3rem] border-white/5 bg-[#0a0a0f]/40 overflow-hidden flex flex-col h-full">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                       <div className="flex gap-6">
                          {['curl', 'javascript', 'python', 'go'].map(lang => (
                            <button
                              key={lang}
                              onClick={() => setActiveLang(lang)}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest transition-all",
                                activeLang === lang ? "text-primary border-b-2 border-primary pb-1" : "text-zinc-600 hover:text-zinc-400"
                              )}
                            >
                              {lang === 'javascript' ? 'JS' : lang}
                            </button>
                          ))}
                       </div>
                       <button 
                         className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                         onClick={() => {
                            navigator.clipboard.writeText((codeSamples as any)[activeLang]);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                         }}
                       >
                          {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                       </button>
                    </div>
                    <div className="flex-1 p-8 font-mono text-[11px] overflow-auto custom-scrollbar bg-black/40 text-zinc-500">
                       <pre className="whitespace-pre leading-relaxed">{(codeSamples as any)[activeLang]}</pre>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
