"use client";

import { useEffect, useState } from "react";

type ToastType = "error" | "success" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

export const TOAST_EVENT = "finflow:toast";

export function showToast(message: string, type: ToastType = "error") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<{ message?: string; type?: ToastType }>).detail;
      if (!detail?.message) return;

      const id = Date.now() + Math.random();
      setToasts((current) => [
        ...current,
        { id, message: detail.message!, type: detail.type ?? "error" },
      ]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4000);
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-[9999] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-lg shadow-black/10"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
