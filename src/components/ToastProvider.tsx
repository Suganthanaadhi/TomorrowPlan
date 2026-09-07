"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { Toast } from "primereact/toast";

type NotifySeverity = "success" | "info" | "warn" | "error";
type NotifyFn = (message: string, severity?: NotifySeverity) => void;

const ToastContext = createContext<NotifyFn>(() => {});

export function useNotify() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const notify = useCallback<NotifyFn>((message, severity = "info") => {
    toastRef.current?.show({ severity, summary: message, life: 3000 });
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
}
