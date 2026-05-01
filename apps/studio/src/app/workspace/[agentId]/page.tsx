import { redirect } from "next/navigation";

export default function WorkspaceRoot({ params }: { params: { agentId: string } }) {
  redirect(`/workspace/${params.agentId}/pulse`);
}
