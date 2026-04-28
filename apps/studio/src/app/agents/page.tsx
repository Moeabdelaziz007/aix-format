"use client";

import Link from "next/link";
import { useAgentStore } from "@/store/agents";
import { AgentCard } from "@/components/aix/AgentCard";

export default function AgentsPage() {
  const agents = useAgentStore((s) => s.agents);
  const activeId = useAgentStore((s) => s.activeId);
  const setActive = useAgentStore((s) => s.setActive);

  return (
    <div className="h-full overflow-auto">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">الوكلاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {agents.length} وكيل محمّل · اضغط لتفقد الحمض النووي.
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            لم تُحمَّل أي وكلاء بعد. استخدم لوحة الرفع جانباً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <Link
              key={a.manifest.meta.id}
              href={`/agents/${a.manifest.meta.id}`}
              onClick={() => setActive(a.manifest.meta.id)}
              className="block"
            >
              <AgentCard agent={a} active={activeId === a.manifest.meta.id} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
