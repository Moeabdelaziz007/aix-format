"use client";
import React from 'react';
import { redirect } from 'next/navigation';

interface Params {
  id: string;
}

/**
 * DEBT-M1: Legacy Agent Route Redirect
 * Agent pages have moved to the workspace architecture in AIX v1.3.0.
 */
function OldAgentPage({ params }: { params: Params }) {
  redirect(`/workspace/${params.id}`);
}

export default React.memo(OldAgentPage);

OldAgentPage.displayName = 'OldAgentPage';
