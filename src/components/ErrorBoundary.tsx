import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError, getLastError } from "@/lib/errorReporting";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "@/lib/icons";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  errorMessage: string;
}

function t(key: string) {
  return i18n.t(key);
}

function isChunkLoadError(error: Error) {
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    error.name === "ChunkLoadError" ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("importing a module script failed")
  );
}

const RELOAD_KEY = "vantrex-chunk-reload";

async function clearCachesAndReload() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
      errorMessage: error?.message || String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack ?? undefined);

    if (isChunkLoadError(error)) {
      const already = sessionStorage.getItem(RELOAD_KEY);
      if (!already) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        void clearCachesAndReload();
      }
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem(RELOAD_KEY);
    if (this.state.isChunkError) {
      void clearCachesAndReload();
      return;
    }
    this.setState({ hasError: false, isChunkError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const stored = getLastError();
    const detail = this.state.errorMessage || stored?.message || "";

    return (
      <div className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-void px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-red-500/15 to-red-500/5 ring-1 ring-red-500/25">
            <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient">
            {this.state.isChunkError ? t("errors.chunkLoad") : t("errors.title")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {this.state.isChunkError
              ? t("errors.chunkLoadDesc")
              : t("errors.description")}
          </p>
          {detail ? (
            <p className="mt-3 break-words rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-left text-[11px] text-muted">
              {detail}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={this.handleRetry}>
              {this.state.isChunkError ? t("errors.reload") : t("errors.tryAgain")}
            </Button>
            <Button variant="outline" asChild>
              <a href="/">{t("errors.goHome")}</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
