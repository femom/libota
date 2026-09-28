import { useState } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  initiateSaspayPayment,
  PRO_PLAN_PRICE_FCFA,
  SUPPORTED_COUNTRIES,
  SUPPORTED_OPERATORS,
  type MobileMoneyOperator,
} from "../lib/saspay";

type UpgradeModalProps = {
  onClose: () => void;
};

const proFeatures = [
  "Membres illimités",
  "Historique complet des cotisations",
  "Support prioritaire",
];

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { family } = useAuth();
  const [countryCode, setCountryCode] = useState<string>(SUPPORTED_COUNTRIES[0].code);
  const [operator, setOperator] = useState<MobileMoneyOperator>("mtn");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!family || !phone.trim()) return;
    setLoading(true);
    setError(null);
    const result = await initiateSaspayPayment({
      familyId: family.id,
      countryCode,
      operator,
      phone: phone.trim(),
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPendingMessage(
      result.message ?? "Confirmez le paiement sur votre téléphone.",
    );
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="card glow-panel relative w-full max-w-md overflow-hidden p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="icon-btn absolute right-3 top-3 h-8 w-8"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>

        <p className="page-kicker mx-auto w-fit">Limite atteinte</p>
        <h2 className="font-display mt-2 text-2xl font-bold text-[var(--text)]">
          Passez à Libota Pro
        </h2>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Cette famille a atteint la limite de{" "}
          <strong>{family?.maxMembers ?? 10} membres</strong> du plan gratuit.
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <p className="font-display text-3xl font-bold text-[var(--text)]">
            {PRO_PLAN_PRICE_FCFA.toLocaleString()}{" "}
            <span className="text-base font-medium text-[var(--muted)]">
              FCFA / mois
            </span>
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-[var(--text-soft)]">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check size={15} className="shrink-0 text-[var(--success)]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {pendingMessage ? (
          <div className="mt-5 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-4 text-left text-sm text-[var(--text)]">
            <p className="font-semibold text-[var(--success)]">
              Paiement en cours...
            </p>
            <p className="mt-1 text-[var(--text-soft)]">{pendingMessage}</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2 text-left">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="select-input"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 123 4567"
                className="input"
              />
            </div>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as MobileMoneyOperator)}
              className="select-input mt-2 w-full"
            >
              {SUPPORTED_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-left text-sm text-[var(--danger)]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleUpgrade()}
              disabled={loading || !phone.trim()}
              className="btn-primary mt-4 w-full"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Envoi..." : "Payer par Mobile Money"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
