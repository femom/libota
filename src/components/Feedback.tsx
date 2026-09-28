import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      3500,
    );
  }, []);
  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = {
    success: "text-[var(--success)]",
    error: "text-[var(--danger)]",
    info: "text-[var(--accent)]",
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = icons[item.kind];
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 16 }}
                key={item.id}
                role="status"
                className="card flex items-center gap-3 p-4"
              >
                <Icon size={18} className={colors[item.kind]} />
                <p className="flex-1 text-sm">{item.message}</p>
                <button
                  onClick={() =>
                    setToasts((current) =>
                      current.filter((toastItem) => toastItem.id !== item.id),
                    )
                  }
                  className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)]"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé dans ToastProvider");
  return context;
}

export function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay)] p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-sm p-5"
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
