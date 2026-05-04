"use client";

import { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-md hover:bg-white/10 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/50" />}
    </button>
  );
}

export function ScrollSpySidebar({ links }: { links: { id: string, label: string }[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observers = new Map();
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, {
      rootMargin: "-10% 0px -80% 0px",
      threshold: 0.1
    });

    links.forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) {
        observer.observe(element);
        observers.set(link.id, element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [links]);

  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={cn(
            "block py-2 px-4 rounded-lg text-sm transition-all border-l-2",
            activeId === link.id 
              ? "text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary-dim)] font-medium"
              : "text-[var(--color-on-surface-variant)] border-transparent hover:text-white hover:bg-white/5"
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
