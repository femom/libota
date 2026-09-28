import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { error: Error | null };

/** Keeps a runtime rendering error from becoming an empty application shell. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur de rendu Libota", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-5 text-[var(--text)]">
        <section className="card w-full max-w-md p-5">
          <p className="page-kicker">Libota</p>
          <h1 className="mt-2 text-xl font-semibold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">La page n’a pas pu s’afficher. Vous pouvez la recharger pour réessayer.</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-5">Recharger l’application</button>
        </section>
      </main>
    );
  }
}
