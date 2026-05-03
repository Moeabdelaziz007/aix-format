import AgentInvokePanel from '@/components/studio/AgentInvokePanel';

export const metadata = {
  title: 'Agent Invoke · AIX Studio',
  description: 'Surgical, monochromatic invocation panel for AIX agents.',
};

export default function InvokePage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-8"
      style={{ background: '#09090B' }}
    >
      <div className="w-full max-w-[1280px]">
        <AgentInvokePanel />
      </div>
    </main>
  );
}
