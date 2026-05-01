"use client";

import Link from "next/link";
import { Badge } from "@/components/shared";
import { Github, Twitter, MessageSquare, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-20 border-t border-white/5 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                <span className="text-primary-dark font-black text-xl italic">A</span>
              </div>
              <span className="text-2xl font-black text-white uppercase italic tracking-tighter">
                AIX<span className="text-primary">Studio</span>
              </span>
            </Link>
            <p className="text-foreground/40 text-sm leading-relaxed mb-8 max-w-xs">
              The world's first trust infrastructure for sovereign AI agents. Standardizing the future of machine intelligence.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary hover:text-primary-dark transition-all">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary hover:text-primary-dark transition-all">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary hover:text-primary-dark transition-all">
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-white font-bold uppercase italic tracking-widest text-xs mb-8">Platform</h4>
            <ul className="space-y-4">
              {["Agent Builder", "Marketplace", "Verification", "MCP Registry"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase italic tracking-widest text-xs mb-8">Protocol</h4>
            <ul className="space-y-4">
              {["Documentation", "AIX Spec v1.2.0", "ABOM Schema", "DID Implementation"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-foreground/50 hover:text-primary transition-colors text-sm font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase italic tracking-widest text-xs mb-8">Community</h4>
            <ul className="space-y-4">
              {["Discord Server", "GitHub Discussions", "Developer Blog", "Status Page"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-foreground/50 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2 group">
                    {item}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-foreground/30 text-xs font-medium">
            &copy; {currentYear} AIX Studio. All rights reserved.
          </p>
          
          <div className="flex items-center gap-8">
            <Link href="#" className="text-foreground/30 hover:text-white transition-colors text-xs font-medium">Privacy Policy</Link>
            <Link href="#" className="text-foreground/30 hover:text-white transition-colors text-xs font-medium">Terms of Service</Link>
            <Link href="#" className="text-foreground/30 hover:text-white transition-colors text-xs font-medium">Cookie Policy</Link>
          </div>

          <Badge variant="outline" className="opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
            v1.2.0-STABLE
          </Badge>
        </div>
      </div>
    </footer>
  );
}
