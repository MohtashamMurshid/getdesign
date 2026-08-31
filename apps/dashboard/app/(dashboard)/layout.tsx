import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { AnalyticsIdentity } from "@/components/analytics-identity";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, impersonator } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider defaultOpen={false}>
      {!impersonator && <AnalyticsIdentity userId={user.id} />}
      <AppSidebar
        user={{
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email,
          email: user.email,
          avatar: user.profilePictureUrl ?? "",
        }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
