import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/errorReporting";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "@/lib/icons";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

function t(key: string) {
  return i18n.t(key);
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Loading chunk") ||
      error.name === "ChunkLoadError";
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack ?? undefined);
  }

  handleRetry = () => {
    if (this.state.isChunkError) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, isChunkError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

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
            {this.state.isChunkError ? "" : t("errors.description")}
          </p>
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
