import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";
import { supabase } from "../lib/supabase";
import { getFriendlyErrorMessage } from "../lib/errors";
import type { Event } from "../types";
import { Calendar, Plus, Trash2, MapPin, Tag } from "lucide-react";
import { ConfirmDialog, useToast } from "../components/Feedback";
import EventCreatedSuccessModal from "../components/EventCreatedSuccessModal";

const typeConfig = {
  reunion: { label: "Réunion" },
  celebration: { label: "Célébration" },
  anniversaire: { label: "Anniversaire" },
  autre: { label: "Autre" },
};

export default function Events() {
  const { isAdmin, familyId, user } = useAuth();
  const { events, contributions, refetch } = useRealtimeFamilyData();
  const [showForm, setShowForm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [createdEventTitle, setCreatedEventTitle] = useState<string | null>(
    null,
  );
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    eventType: "reunion" as Event["eventType"],
    budget: "",
  });

  const handleAdd = async () => {
    if (!familyId || !user?.id || !form.title || !form.eventDate) return;
    const { error } = await supabase.from("events").insert({
      family_id: familyId,
      created_by: user.id,
      title: form.title,
      description: form.description || null,
      event_date: form.eventDate,
      location: form.location || null,
      event_type: form.eventType,
      budget: form.budget ? Number(form.budget) : null,
    });
    if (error) {
      toast(getFriendlyErrorMessage(error.message), "error");
      return;
    }
    setForm({
      title: "",
      description: "",
      eventDate: "",
      location: "",
      eventType: "reunion",
      budget: "",
    });
    setShowForm(false);
    toast("Événement ajouté.");
    setCreatedEventTitle(form.title);
    await refetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast(getFriendlyErrorMessage(error.message), "error");
      return;
    }
    setEventToDelete(null);
    toast("Événement supprimé.");
    await refetch();
  };

  // Gère à la fois "YYYY-MM-DD" (colonne `date`) et un timestamp ISO
  // complet (colonne `timestamptz`) — la concaténation naïve
  // `${date}T00:00:00` cassait sur ce second format et produisait
  // "dans NaN jours".
  const daysUntil = (date: string) => {
    const datePart = date.slice(0, 10);
    const target = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 0;
    return Math.ceil(
      (target.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
    );
  };

  const sorted = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );

  const collectedFor = (eventId: string) =>
    contributions
      .filter((c) => c.eventId === eventId && c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-kicker">Agenda</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="page-title">Événements</h1>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              {events.length}
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={16} />
            Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Nouvel événement</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)] md:col-span-2">
              Titre *
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Réunion mensuelle"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Date *
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) =>
                  setForm({ ...form, eventDate: e.target.value })
                }
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Type
              <select
                value={form.eventType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    eventType: e.target.value as Event["eventType"],
                  })
                }
                className="select-input"
              >
                <option value="reunion">Réunion</option>
                <option value="celebration">Célébration</option>
                <option value="anniversaire">Anniversaire</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Lieu
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input"
                placeholder="Brazzaville"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Budget / objectif (FCFA)
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="input"
                placeholder="Optionnel"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)] md:col-span-2">
              Description
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input"
                placeholder="Optionnel"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Annuler
            </button>
            <button onClick={() => void handleAdd()} className="btn-primary">
              Ajouter
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={eventToDelete !== null}
        title="Supprimer cet événement ?"
        description="Cette action est définitive."
        onCancel={() => setEventToDelete(null)}
        onConfirm={() => eventToDelete && void handleDelete(eventToDelete)}
      />

      {events.length === 0 ? (
        <div className="empty-state card">
          <Calendar size={36} />
          <p className="text-sm">Aucun événement planifié</p>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Créer le premier événement
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((event) => {
            const config = typeConfig[event.eventType];
            const remaining = daysUntil(event.eventDate);
            const collected = collectedFor(event.id);
            const hasBudget = event.budget != null && event.budget > 0;
            const eventProgress = hasBudget
              ? Math.min(100, Math.round((collected / event.budget!) * 100))
              : null;
            return (
              <div
                key={event.id}
                className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="min-w-16 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-center">
                    <p className="text-[10px] uppercase text-[var(--muted)]">
                      {new Date(event.eventDate).toLocaleDateString("fr-FR", {
                        month: "short",
                      })}
                    </p>
                    <p className="text-xl font-bold">
                      {new Date(event.eventDate).getDate()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{event.title}</p>
                      <span className="text-[10px] font-semibold text-[var(--accent)]">
                        {remaining < 0
                          ? "Terminé"
                          : remaining === 0
                            ? "Aujourd’hui"
                            : `Dans ${remaining} jours`}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Tag size={10} /> {config.label}
                      </span>
                    </div>
                    {(collected > 0 || hasBudget) && (
                      <div className="mt-2 max-w-xs">
                        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                          <span>{collected.toLocaleString()} FCFA collectés</span>
                          {hasBudget && (
                            <span>
                              sur {event.budget!.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>
                        {hasBudget && (
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                            <div
                              className="h-full rounded-full bg-[var(--accent-warm)]"
                              style={{ width: `${eventProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setEventToDelete(event.id)}
                    className="icon-btn h-9 w-9 shrink-0 self-start text-[var(--danger)] sm:self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {createdEventTitle && (
        <EventCreatedSuccessModal
          eventTitle={createdEventTitle}
          onClose={() => setCreatedEventTitle(null)}
        />
      )}
    </div>
  );
}
