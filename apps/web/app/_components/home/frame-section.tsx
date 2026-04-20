import type { ReactNode } from "react";

type FrameSectionProps = {
  children: ReactNode;
  id?: string;
  fullHeight?: boolean;
};

export function FrameSection({
  children,
  id,
  fullHeight,
}: FrameSectionProps) {
  return (
    <section
      id={id}
      className={
        fullHeight
          ? "dashed-bottom flex min-h-[calc(100vh-56px)] items-center px-6 py-12"
          : "dashed-bottom px-6 py-16 sm:py-20"
      }
    >
      <div className={fullHeight ? "w-full" : undefined}>{children}</div>
    </section>
  );
}
