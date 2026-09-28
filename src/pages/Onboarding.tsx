import { useState } from "react";
import { KeyRound, MoonStar, SunMedium, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import Logo from "../components/Logo";
import CreateFamilyForm from "../components/auth/CreateFamilyForm";
import JoinFamilyForm from "../components/auth/JoinFamilyForm";

type Tab = "create" | "join";

export default function Onboarding() {
  const { signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("create");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4 text-[var(--text)]">
      <button
        type="button"
        onClick={toggleTheme}
        className="icon-btn absolute right-4 top-4"
        aria-label={darkMode ? "Passer en thème clair" : "Passer en thème sombre"}
      >
        {darkMode ? <SunMedium size={17} /> : <MoonStar size={17} />}
      </button>
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center justify-center gap-2">
          <Logo size={36} className="text-[var(--text)]" />
          <p className="text-sm text-[var(--text-soft)]">Rejoindre l’espace familial</p>
        </div>

        <div className="card glow-panel overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setTab("create")}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                tab === "create"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Users size={16} />
              Créer
            </button>
            <button
              type="button"
              onClick={() => setTab("join")}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                tab === "join"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <KeyRound size={16} />
              Rejoindre
            </button>
          </div>
          <div className="p-5">
            {tab === "create" ? <CreateFamilyForm /> : <JoinFamilyForm />}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 w-full text-center text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
