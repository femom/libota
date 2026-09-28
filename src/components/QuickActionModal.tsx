import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Loader2, Wallet, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";
import { supabase } from "../lib/supabase";
import { getFriendlyErrorMessage } from "../lib/errors";
import { buildContributionInsertPayload } from "../lib/contributionPayload";
import { useToast } from "./Feedback";

export type QuickAction = "contribution" | "event";

const meta = {
  contribution: {
    title: "Nouvelle cotisation",
    description: "Enregistrez une cotisation pour un membre.",
    icon: Wallet,
  },
  event: {
    title: "Nouvel événement",
    description: "Planifiez un moment important pour votre famille.",
    icon: CalendarDays,
  },
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-[var(--text-soft)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function QuickActionModal({
  action,
  onClose,
}: {
  action: QuickAction | null;
  onClose: () => void;
}) {
  const { familyId, user } = useAuth();
  const { members, events, loading: dataLoading } = useRealtimeFamilyData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    memberId: "",
    amount: "",
    date: "",
    location: "",
    eventId: "",
    paidDate: "",
  });

  if (!action) return null;

  const current = meta[action];
  const Icon = current.icon;
  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!familyId || !user?.id) return;
    setSaving(true);
    try {
      if (action === "contribution") {
        if (!form.memberId || !form.amount) {
          throw new Error("Choisissez un membre et un montant.");
        }
        const payload = buildContributionInsertPayload({
          familyId,
          userId: user.id,
          memberId: form.memberId,
          amount: form.amount,
          period:
            form.title ||
            new Date().toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            }),
          status: "pending",
          eventId: form.eventId || null,
          paidDate: form.paidDate || undefined,
        });
        const { error } = await supabase
          .from("contributions")
          .insert(payload);
        if (error) throw error;
        toast("Cotisation enregistrée.");
      } else {
        if (!form.title || !form.date) {
          throw new Error("Indiquez un titre et une date.");
        }
        const { error } = await supabase.from("events").insert({
          family_id: familyId,
          created_by: user.id,
          title: form.title,
          description: form.content || null,
          event_date: form.date,
          location: form.location || null,
          event_type: "reunion",
        });
        if (error) throw error;
        toast("Événement créé.");
      }
      onClose();
    } catch (error) {
      toast(
        error instanceof Error
          ? getFriendlyErrorMessage(error.message)
          : "Une erreur est survenue.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay)] p-4"
        role="dialog"
        aria-modal="true"
      >
        <motion.form
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onSubmit={submit}
          onMouseDown={(event) => event.stopPropagation()}
          className="card w-full max-w-lg p-5"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon size={17} />
              </div>
              <div>
                <h2 className="font-semibold">{current.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {current.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn h-8 w-8"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {action === "contribution" ? (
              <>
                <Field label="Membre">
                  <select
                    required
                    value={form.memberId}
                    onChange={(e) => update("memberId", e.target.value)}
                    className="select-input"
                    disabled={dataLoading}
                  >
                    <option value="">
                      {dataLoading ? "Chargement..." : "Sélectionner un membre"}
                    </option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Montant (FCFA)">
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    className="input"
                    placeholder="5000"
                  />
                </Field>
                <Field label="Période">
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    className="input"
                    placeholder="Septembre 2026"
                  />
                </Field>
                <Field label="Événement">
                  <select
                    value={form.eventId}
                    onChange={(e) => update("eventId", e.target.value)}
                    className="select-input"
                    disabled={dataLoading}
                  >
                    <option value="">
                      {dataLoading
                        ? "Chargement..."
                        : "Caisse générale / Sans événement"}
                    </option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date précise (jour)">
                  <input
                    type="date"
                    value={form.paidDate}
                    onChange={(e) => update("paidDate", e.target.value)}
                    className="input"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Titre">
                  <input
                    required
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    className="input"
                    placeholder="Réunion mensuelle"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Date">
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => update("date", e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="Lieu">
                    <input
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      className="input"
                      placeholder="Brazzaville"
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea
                    value={form.content}
                    onChange={(e) => update("content", e.target.value)}
                    className="textarea-input min-h-24 resize-y"
                    placeholder="Détails facultatifs"
                  />
                </Field>
              </>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Annuler
            </button>
            <button disabled={saving || dataLoading} className="btn-primary">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
