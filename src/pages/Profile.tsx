import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Download, Loader2, LogOut, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { supabase } from "../lib/supabase";
import { getFriendlyErrorMessage } from "../lib/errors";
import { useToast } from "../components/Feedback";

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
};

const emptyForm: ProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  relationship: "",
};

export default function Profile() {
  const { user, familyId, role, signOut } = useAuth();
  const { canPromptInstall, isIos, isStandalone, promptInstall } =
    useInstallPrompt();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      const { data, error: loadError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (loadError) {
        // "PGRST116" = aucune ligne trouvée : ce n'est pas une vraie
        // erreur ici (l'utilisateur n'a simplement pas encore de fiche
        // membre), donc on ne l'affiche pas en rouge — le formulaire
        // vide ci-dessous suffit à l'inviter à le compléter.
        if (loadError.code !== "PGRST116") {
          console.error(
            "Erreur de chargement du profil :",
            loadError.message,
          );
          setError(getFriendlyErrorMessage(loadError.message));
        }
      } else if (data) {
        setForm({
          firstName: typeof data.first_name === "string" ? data.first_name : "",
          lastName: typeof data.last_name === "string" ? data.last_name : "",
          phone: typeof data.phone === "string" ? data.phone : "",
          relationship:
            typeof data.relationship === "string" ? data.relationship : "",
        });
      } else {
        const fullName = user.user_metadata?.full_name;
        const nameParts =
          typeof fullName === "string"
            ? fullName.trim().split(/\s+/).filter(Boolean)
            : [];
        setForm({
          firstName:
            nameParts.length > 1
              ? nameParts.slice(0, -1).join(" ")
              : (nameParts[0] ?? ""),
          lastName: nameParts.length > 1 ? (nameParts.at(-1) ?? "") : "",
          phone: user.phone ?? "",
          relationship: "Membre",
        });
      }
      setLoading(false);
    };

    void loadProfile();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const memberData = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone: form.phone.trim(),
      relationship: form.relationship.trim(),
    };
    // upsert plutôt que insert/update séparés : évite de créer une
    // fiche membre en double si la ligne existait déjà mais n'avait
    // pas été détectée (ex. plusieurs lignes trouvées au chargement).
    const { error: updateError } = await supabase.from("members").upsert(
      {
        ...memberData,
        family_id: familyId,
        created_by: user.id,
        user_id: user.id,
        role: role ?? "member",
      },
      { onConflict: "user_id" },
    );

    if (updateError) {
      console.error(
        "Erreur d'enregistrement du profil :",
        updateError.message,
      );
      setError(getFriendlyErrorMessage(updateError.message));
    } else {
      await supabase.auth.updateUser({
        data: {
          full_name: `${memberData.first_name} ${memberData.last_name}`.trim(),
        },
      });
      toast("Profil mis à jour.");
    }
    setSubmitting(false);
  };

  const initials =
    `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-4 text-sm text-[var(--muted)]">
        <Loader2 size={17} className="animate-spin" />
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-24 bg-[var(--accent-soft)]" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[var(--surface)] bg-[var(--surface-2)] text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="page-title">
                {form.firstName || "Utilisateur"} {form.lastName}
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {role === "admin" ? "Administrateur" : "Membre"} · {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
        <p className="page-kicker">Informations</p>
        <h2 className="mt-1 text-lg font-semibold">Votre fiche</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            Prénom
            <input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            Nom
            <input
              required
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            Téléphone
            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            Lien de parenté
            <input
              value={form.relationship}
              onChange={(event) =>
                setForm({ ...form, relationship: event.target.value })
              }
              className="input"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-sm text-[var(--danger)]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer
          </button>
        </div>
      </form>

      {!isStandalone && (canPromptInstall || isIos) && (
        <div className="card mt-4 p-4">
          <p className="page-kicker">Application</p>
          {canPromptInstall ? (
            <>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Installez Libota sur votre téléphone pour y accéder comme
                une application, depuis l'écran d'accueil.
              </p>
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="btn-primary mt-3"
              >
                <Download size={16} />
                Installer l'application
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pour installer Libota sur votre téléphone : appuyez sur{" "}
              <strong>Partager</strong> puis{" "}
              <strong>Sur l'écran d'accueil</strong>.
            </p>
          )}
        </div>
      )}

      <div className="card mt-4 p-4">
        <p className="page-kicker">Session</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connecté en tant que {user?.email}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-red-500/10"
          >
            <LogOut size={17} />
            Se déconnecter
          </button>
          <Link
            to="/conditions"
            className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--text)] hover:underline"
          >
            Conditions d'utilisation
          </Link>
        </div>
      </div>
    </div>
  );
}
