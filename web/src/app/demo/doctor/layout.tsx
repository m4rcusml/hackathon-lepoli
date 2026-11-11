import { notFound } from "next/navigation";
import { DoctorProvider } from "@/features/session/provider";
import { Shell } from "@/features/session/shell";
export const dynamic = "force-dynamic";
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.DOCTOR_DEMO_ENABLED !== "true"
  )
    notFound();
  return (
    <DoctorProvider mode="demo">
      <Shell>{children}</Shell>
    </DoctorProvider>
  );
}
