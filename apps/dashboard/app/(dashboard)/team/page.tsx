import { withAuth } from "@workos-inc/authkit-nextjs";
import { UsersManagement } from "@workos-inc/widgets";
import { redirect } from "next/navigation";

import { WidgetLoadingGate } from "@/components/widget-loading-gate";
import { WorkOsWidgetsProvider } from "@/components/workos-widgets-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default async function TeamPage() {
  const { accessToken, organizationId, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Team</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {organizationId ? (
          <WorkOsWidgetsProvider>
            <WidgetLoadingGate>
              <UsersManagement authToken={accessToken} />
            </WidgetLoadingGate>
          </WorkOsWidgetsProvider>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
            You need to be signed in to an organization to manage team members.
          </div>
        )}
      </div>
    </>
  );
}
