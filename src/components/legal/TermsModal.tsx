import { X } from "lucide-react";
import TermsContent from "./TermsContent";

type TermsModalProps = {
  onClose: () => void;
};

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="card max-h-[80vh] w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[var(--text)]">
            Conditions d'utilisation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn h-9 w-9"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[calc(80vh-64px)] overflow-y-auto px-5 py-5">
          <TermsContent />
        </div>
      </div>
    </div>
  );
}
