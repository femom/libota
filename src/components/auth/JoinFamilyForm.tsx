import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Phone, User, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import TermsModal from "../legal/TermsModal";

export default function JoinFamilyForm() {
  const { user, signUp, joinFamilyWithCode } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (user) {
      if (!inviteCode.trim()) {
        setError("Veuillez renseigner le code d'invitation.");
        return;
      }
      setLoading(true);
      try {
        const joinRes = await joinFamilyWithCode(inviteCode.trim());
        if (joinRes.error) setError(joinRes.error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!fullName.trim() || !phone.trim() || !password || !inviteCode.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!termsAccepted) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(phone.trim(), password, {
        fullName: fullName.trim(),
        role: "member",
        termsAcceptedAt: new Date().toISOString(),
      });

      if (res.error) {
        setError(res.error.message || "Erreur lors de l'inscription.");
        return;
      }

      if (res.data?.session) {
        const joinRes = await joinFamilyWithCode(inviteCode.trim());
        if (joinRes.error) {
          setError(joinRes.error.message || "Code d'invitation invalide.");
        }
      } else {
        setSuccess("Compte créé ! Connectez-vous avec votre numéro et votre mot de passe.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {!user && <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-soft)]">Nom complet </label>
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
        <label className="text-sm font-medium text-[var(--text-soft)]">Numéro de téléphone </label>
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
        <label className="text-sm font-medium text-[var(--text-soft)]">Mot de passe </label>
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
        <label className="text-sm font-medium text-[var(--text-soft)]">Code d'invitation </label>
        <div className="field">
          <KeyRound size={16} className="text-[var(--muted)]" />
          <input
            required
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Ex: LIB-1234"
            className="w-full py-2 outline-none text-sm uppercase tracking-wider bg-transparent"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">{success}</div>}

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

      <button
        type="submit"
        disabled={loading || (!user && !termsAccepted)}
        className="btn-primary mt-1"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Adhésion en cours..." : "Rejoindre la famille"}
      </button>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </form>
  );
}
