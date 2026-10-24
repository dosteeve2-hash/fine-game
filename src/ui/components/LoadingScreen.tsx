import { Logo } from "./Logo";

export function LoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center" aria-busy="true" role="status" aria-label="FINE Game">
      <Logo size={132} decorative priority className="animate-pulse" />
    </main>
  );
}
