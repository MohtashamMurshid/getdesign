import { withAuth } from "@workos-inc/authkit-nextjs";
import { UserProfile } from "@workos-inc/widgets";

import { WidgetLoadingGate } from "@/components/widget-loading-gate";
import { WorkOsWidgetsProvider } from "@/components/workos-widgets-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function AccountPage() {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Account</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <WorkOsWidgetsProvider>
          <WidgetLoadingGate>
            <UserProfile authToken={accessToken} />
          </WidgetLoadingGate>
        </WorkOsWidgetsProvider>
      </div>
    </>
  );
}
