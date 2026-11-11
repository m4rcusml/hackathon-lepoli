import { Workspace } from "@/features/workspace/workspace";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { patientId } = await params;
  const { section } = await searchParams;
  return <Workspace key={patientId} patientId={patientId} initialSection={section} />;
}
