import { InvitationExperience } from "@/features/sharing/invitation";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationExperience token={token} />;
}
