import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

type SurfacePageShellProps = {
  title: string;
  description: string;
  demo: ReactNode;
  children: ReactNode;
};

export function SurfacePageShell({
  title,
  description,
  demo,
  children,
}: SurfacePageShellProps) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-0">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="min-w-0">{demo}</div>
          <div className="flex min-w-0 flex-col gap-5">{children}</div>
        </div>
      </div>
    </>
  );
}
