import { InvitationExperience } from "@/features/sharing/invitation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return <InvitationExperience view={view} />;
}
