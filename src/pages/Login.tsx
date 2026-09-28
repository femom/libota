import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MoonStar,
  Phone,
  SunMedium,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { getFriendlyErrorMessage } from "../lib/errors";
import Logo from "../components/Logo";
import CreateFamilyForm from "../components/auth/CreateFamilyForm";
import JoinFamilyForm from "../components/auth/JoinFamilyForm";

type Mode = "login" | "create" | "join";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>(() => {
    const requested = new URLSearchParams(window.location.search).get("mode");
    return requested === "create" || requested === "join" ? requested : "login";
  });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(getFriendlyErrorMessage(authError.message));
      setGoogleLoading(false);
    }
    // En cas de succès la page redirige vers Google — pas besoin de reset.
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Veuillez renseigner votre numéro (ou email) et votre mot de passe.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: authError } = await signIn(identifier.trim(), password);
      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Identifiants incorrects."
            : getFriendlyErrorMessage(authError.message),
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? getFriendlyErrorMessage(submitError.message)
          : "Erreur de connexion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="icon-btn"
          aria-label={darkMode ? "Passer en thème clair" : "Passer en thème sombre"}
        >
          {darkMode ? <SunMedium size={17} /> : <MoonStar size={17} />}
        </button>
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_1.15fr]">
        <div className="flex items-center justify-center px-4 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 flex items-center gap-3">
              <Logo size={34} className="text-[var(--text)]" />
              <p className="text-sm text-[var(--text-soft)]">Espace familial</p>
            </div>

            {mode === "login" ? (
              <>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Bon retour</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Accédez au tableau de bord de votre famille.
                </p>

                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={googleLoading}
                  className="btn-ghost mt-6 flex w-full items-center justify-center gap-2 border border-[var(--border)]"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.4 35 26.8 36 24 36c-5.4 0-9.9-3.4-11.5-8.2l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C41.5 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
                  </svg>
                  {googleLoading ? "Redirection..." : "Continuer avec Google"}
                </button>

                <div className="mt-4 flex items-center gap-3 text-xs text-[var(--muted)]">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  ou
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-soft)]">
                    Numéro de téléphone ou email
                    <div className="field">
                      <Phone size={15} className="text-[var(--muted)]" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="+242 06 123 4567"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-soft)]">
                    Mot de passe
                    <div className="field">
                      <Lock size={15} className="text-[var(--muted)]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Entrez votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="text-[var(--muted)] hover:text-[var(--text)]"
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>

                  {error ? (
                    <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
                      {error}
                    </div>
                  ) : null}

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    {isSubmitting ? "Connexion..." : "Se connecter"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--muted)]">
                  Nouveau sur Libota ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    Créer ou rejoindre une famille
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  {mode === "create" ? "Créer votre famille" : "Rejoindre une famille"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {mode === "create"
                    ? "Créez votre compte et votre espace familial."
                    : "Utilisez le code d’invitation transmis par un membre."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      mode === "create"
                        ? "bg-[var(--surface)] text-[var(--text)] chip-active"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    <Users size={15} />
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("join")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      mode === "join"
                        ? "bg-[var(--surface)] text-[var(--text)] chip-active"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    <KeyRound size={15} />
                    Rejoindre
                  </button>
                </div>

                <div className="card mt-4 p-4">
                  {mode === "create" ? <CreateFamilyForm /> : <JoinFamilyForm />}
                </div>

                <p className="mt-6 text-center text-sm text-[var(--muted)]">
                  Déjà inscrit ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    Retour à la connexion
                  </button>
                </p>
              </>
            )}
          </motion.div>
        </div>

        <div className="relative hidden items-center justify-center overflow-hidden px-8 py-10 lg:flex">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card glow-panel relative w-full max-w-xl p-6"
          >
            <p className="page-kicker">Vue d’ensemble</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">
              Membres, cotisations et événements au même endroit
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  Membres
                  <Users size={16} className="text-[var(--accent)]" />
                </div>
                <p className="mt-3 text-3xl font-bold">24</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  Cotisations
                  <ArrowRight size={16} className="text-[var(--success)]" />
                </div>
                <p className="mt-3 text-3xl font-bold">82%</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                "Paiement validé",
                "Réunion familiale planifiée",
                "Nouveau membre ajouté",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5"
                >
                  <CheckCircle2 size={16} className="text-[var(--success)]" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
