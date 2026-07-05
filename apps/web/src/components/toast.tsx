"use client";

/** Lightweight toast store — no deps. Used for tx status + errors. */

import { useSyncExternalStore, useCallback } from "react";

export type ToastKind = "info" | "success" | "error";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let counter = 0;
const listeners = new Set<() => void>();
let state: Toast[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export function pushToast(kind: ToastKind, message: string) {
  const id = ++counter;
  state = [...state, { id, kind, message }];
  emit();
  setTimeout(() => dismissToast(id), 6000);
}

export function dismissToast(id: number) {
  state = state.filter((t) => t.id !== id);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function ToastViewport() {
  const toasts = useToasts();
  const dismiss = useCallback((id: number) => dismissToast(id), []);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
            t.kind === "success"
              ? "border-brand-500/40 bg-brand-950/80 text-brand-100"
              : t.kind === "error"
                ? "border-red-500/40 bg-red-950/80 text-red-100"
                : "border-slate-600 bg-slate-900/90 text-slate-100",
          ].join(" ")}
        >
          <span>{t.message}</span>
          <button
            className="text-xs text-slate-400 hover:text-white"
            onClick={() => dismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
