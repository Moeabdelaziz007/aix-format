"use client";

import { useState } from "react";

export function MetaForm() {
  const [formData, setFormData] = useState({
    name: "",
    version: "1.0.0",
    author: "",
    description: "",
    license: "MIT",
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="agent-name">Agent Name</label>
          <input 
            id="agent-name"
            placeholder="e.g. Nexus Prime"
            className="input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agent-version">Version</label>
          <input 
            id="agent-version"
            placeholder="1.0.0"
            className="input"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="agent-author">Author (DID or Username)</label>
        <input 
          id="agent-author"
          placeholder="did:web:axiom.studio"
          className="input"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="agent-desc">Description</label>
        <textarea 
          id="agent-desc"
          placeholder="What does this agent do?"
          className="input min-h-[100px] resize-none py-3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="agent-license">License</label>
        <select 
          id="agent-license"
          className="input bg-[var(--color-surface)]"
          value={formData.license}
          onChange={(e) => setFormData({ ...formData, license: e.target.value })}
        >
          <option value="MIT">MIT</option>
          <option value="Apache-2.0">Apache 2.0</option>
          <option value="GPL-3.0">GPL v3</option>
          <option value="Proprietary">Proprietary</option>
        </select>
      </div>
    </div>
  );
}
