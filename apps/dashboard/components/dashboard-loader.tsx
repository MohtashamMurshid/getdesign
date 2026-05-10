import { DotmSquare3 } from "@/components/ui/dotm-square-3";

export function DashboardLoader({ size = 64 }: { size?: number }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <DotmSquare3 size={size} />
    </div>
  );
}
