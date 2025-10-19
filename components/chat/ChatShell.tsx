"use client";

import { ReactNode } from "react";

interface ChatShellProps {
  children: ReactNode;
  progress?: { current: number; total: number };
  onClear?: () => void;
}

export default function ChatShell({
  children,
  progress,
  onClear,
}: ChatShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-af-sky/10 via-af-lilac/5 to-af-pink/10 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-af-lilac/20 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-af-ink">
              Amor Fati Chatbox
            </h1>
            {progress && progress.total > 0 && (
              <span className="px-3 py-1 rounded-full bg-af-lilac/20 text-af-ink text-sm font-medium">
                {progress.current}/{progress.total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onClear && (
              <button
                onClick={onClear}
                className="text-sm text-af-ink/60 hover:text-af-ink transition"
                aria-label="Clear conversation"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

