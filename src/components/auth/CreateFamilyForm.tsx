import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Phone, User, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import TermsModal from "../legal/TermsModal";

export default function CreateFamilyForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user, signUp, createFamily } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!familyName.trim() || (!user && (!fullName.trim() || !phone.trim() || !password))) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!user && password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!user && !termsAccepted) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setSubmitting(true);
    try {
      // Onboarding after sign-in: do not attempt to register the account again.
      if (user) {
        const famRes = await createFamily(familyName.trim());
        if (famRes.error) setError(famRes.error.message);
        else onSuccess?.();
        return;
      }

      const res = await signUp(phone.trim(), password, {
        fullName: fullName.trim(),
        role: "admin",
        termsAcceptedAt: new Date().toISOString(),
      });

      if (res.error) {
        setError(res.error.message || "Erreur lors de l'inscription.");
        return;
      }

      if (res.data?.session) {
        const famRes = await createFamily(familyName.trim());
        if (famRes.error) {
          setError(famRes.error.message || "Erreur de création de famille.");
        }
      } else {
        setSuccess(
          "Compte créé ! Connectez-vous avec votre numéro et votre mot de passe.",
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {!user && <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-soft)]">
          Nom complet{" "}
        </label>
        <div className="field">
          <User size={16} className="text-[var(--muted)]" />
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex: Ferol EBATA"
            className="w-full py-2 outline-none text-sm bg-transparent"
          />
        </div>
      </div>}

      {!user && <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-soft)]">
          Numéro de téléphone{" "}
        </label>
        <div className="field">
          <Phone size={16} className="text-[var(--muted)]" />
          <input
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+242 06 123 4567"
            className="w-full py-2 outline-none text-sm bg-transparent"
          />
        </div>
      </div>}

      {!user && <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-soft)]">
          Mot de passe{" "}
        </label>
        <div className="field">
          <Lock size={16} className="text-[var(--muted)]" />
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 6 caractères"
            className="w-full py-2 outline-none text-sm bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[var(--muted)] hover:text-[var(--text)]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-soft)]">
          Nom de la famille{" "}
        </label>
        <div className="field">
          <Users size={16} className="text-[var(--muted)]" />
          <input
            required
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Ex: Famille Mombouli"
            className="w-full py-2 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {!user && (
        <label className="flex items-start gap-2 text-xs text-[var(--text-soft)]">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            J'accepte les{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="font-medium text-[var(--accent)] underline underline-offset-2"
            >
              conditions d'utilisation
            </button>
            .
          </span>
        </label>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (!user && !termsAccepted)}
        className="btn-primary mt-1"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? "Création en cours..." : "Créer la famille"}
      </button>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </form>
  );
}
