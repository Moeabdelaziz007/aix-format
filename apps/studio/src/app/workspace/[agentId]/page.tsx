"use client";
import React from 'react';
import { redirect } from "next/navigation";

function WorkspaceRoot({ params }: { params: { agentId: string } }) {
  redirect(`/workspace/${params.agentId}/pulse`);
}

export default React.memo(WorkspaceRoot);

WorkspaceRoot.displayName = 'WorkspaceRoot';
