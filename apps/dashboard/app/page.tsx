import { Button } from "@/components/ui/button";
import { withAuth, signOut } from "@workos-inc/authkit-nextjs";
import Link from "next/link";

export default async function Page() {
  const { user } = await withAuth();

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        {user ? (
          <>
            <div>
              <h1 className="font-medium">Welcome, {user.firstName || user.email}!</h1>
              <p>You are signed in.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/80"
              >
                Go to Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="font-medium">Welcome to the Dashboard</h1>
              <p>Please sign in to continue.</p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/80"
            >
              Sign in
            </Link>
          </>
        )}
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
