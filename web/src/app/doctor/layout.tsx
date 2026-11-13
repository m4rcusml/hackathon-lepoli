import { DoctorProvider } from "@/features/session/provider";
import { Shell } from "@/features/session/shell";
export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DoctorProvider mode="real">
      <Shell>{children}</Shell>
    </DoctorProvider>
  );
}
