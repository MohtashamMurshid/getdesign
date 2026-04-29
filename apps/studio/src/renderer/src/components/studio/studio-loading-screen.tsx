import { Logo } from "@/components/logo";

export function StudioLoadingScreen() {
  return (
    <main className="flex h-full items-center justify-center bg-background text-foreground">
      <div className="opacity-60">
        <Logo size="md" variant="mark" />
      </div>
    </main>
  );
}
