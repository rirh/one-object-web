import { SweepShine } from "@/components/sweep-shine"

export function RouteLoading() {
  return (
    <main className="fixed inset-0 z-50 flex min-h-svh items-center justify-center bg-background px-6 py-8 text-foreground">
      <section
        aria-busy="true"
        aria-live="polite"
        className="flex w-full max-w-80 flex-col items-center text-center"
      >
        <img
          alt="One Object"
          className="size-16 object-contain"
          draggable={false}
          src="/brand/one-user-mark.png"
        />
        <SweepShine asChild>
          <p className="mt-5 font-heading text-sm/6 font-medium tracking-[-0.01em] text-muted-foreground">
            Loading One User…
          </p>
        </SweepShine>
      </section>
    </main>
  )
}
