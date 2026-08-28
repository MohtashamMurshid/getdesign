import { withAuth } from "@workos-inc/authkit-nextjs";
import { UserProfile } from "@workos-inc/widgets";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { WidgetLoadingGate } from "@/components/widget-loading-gate";
import { WorkOsWidgetsProvider } from "@/components/workos-widgets-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getConvexClient } from "@/lib/convex-server";

import { ProviderKeysCard } from "./provider-keys-card";

export default async function AccountPage() {
  const { accessToken, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const keys = await getConvexClient(accessToken).query(
    api.userCredentials.listForUser,
    {},
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
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
        <ProviderKeysCard keys={keys} />
        <WorkOsWidgetsProvider>
          <WidgetLoadingGate>
            <UserProfile authToken={accessToken} />
          </WidgetLoadingGate>
        </WorkOsWidgetsProvider>
      </div>
    </>
  );
}
