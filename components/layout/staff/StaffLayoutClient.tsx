import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { StaffHeader } from "./StaffHeader";
import { StaffSidebar } from "./StaffSidebar";

export default function StaffLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <StaffSidebar />
      <SidebarInset>
        <StaffHeader />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
