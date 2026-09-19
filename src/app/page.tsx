import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          DropResume
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          Share one link and every resume submitted through it lands in a single
          filterable list with AI-extracted fields.
        </p>
      </div>
      <div>
        <Button disabled>New role</Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Scaffold only. The dashboard, auth, and the public submission form are
        built in the next steps.
      </p>
    </main>
  );
}
