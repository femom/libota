import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";
import { supabase } from "../lib/supabase";
import { getFriendlyErrorMessage } from "../lib/errors";
import { buildContributionInsertPayload } from "../lib/contributionPayload";
import type { Contribution } from "../types";
import {
  Wallet,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { ConfirmDialog, useToast } from "../components/Feedback";
import { generateWhatsAppReminderLink } from "../lib/whatsapp";

const statusConfig = {
  paid: { label: "Payé", icon: CheckCircle, color: "text-[var(--success)]" },
  pending: { label: "En attente", icon: Clock, color: "text-[var(--warning)]" },
  overdue: {
    label: "En retard",
    icon: AlertCircle,
    color: "text-[var(--danger)]",
  },
};

export default function Contributions() {
  const { isAdmin, familyId, user } = useAuth();
  const { members, events, contributions, refetch } = useRealtimeFamilyData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Contribution["status"]
  >("all");
  const [eventFilter, setEventFilter] = useState<"all" | "none" | string>(
    "all",
  );
  const [contributionToDelete, setContributionToDelete] = useState<
    string | null
  >(null);
  const { toast } = useToast();
  const [form, setForm] = useState({
    memberId: "",
    amount: "",
    period: "",
    status: "pending" as Contribution["status"],
    eventId: "",
    paidDate: "",
  });

  const handleAdd = async () => {
    if (
      !familyId ||
      !user?.id ||
      !form.memberId ||
      !form.amount ||
      !form.period
    )
      return;
    const payload = buildContributionInsertPayload({
      familyId,
      userId: user.id,
      memberId: form.memberId,
      amount: form.amount,
      period: form.period,
      status: form.status,
      eventId: form.eventId || null,
      paidDate: form.paidDate || undefined,
    });
    const { error } = await supabase.from("contributions").insert(payload);
    if (error) {
      toast(getFriendlyErrorMessage(error.message), "error");
      return;
    }
    toast("Cotisation ajoutée.");
    setForm({
      memberId: "",
      amount: "",
      period: "",
      status: "pending",
      eventId: "",
      paidDate: "",
    });
    setShowForm(false);
    await refetch();
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}`.trim() : "Inconnu";
  };

  const getEventTitle = (eventId?: string | null) => {
    if (!eventId) return null;
    return events.find((e) => e.id === eventId)?.title ?? null;
  };

  const total = contributions.length;
  const paid = contributions.filter((c) => c.status === "paid").length;
  const pending = contributions.filter((c) => c.status === "pending").length;
  const overdue = contributions.filter((c) => c.status === "overdue").length;
  const progress = total ? Math.round((paid / total) * 100) : 0;
  const normalizedSearch = search.trim().toLowerCase();
  const visibleContributions = contributions.filter((contribution) => {
    const memberName = getMemberName(contribution.memberId).toLowerCase();
    const statusLabel = statusConfig[contribution.status].label.toLowerCase();
    const period = contribution.period.toLowerCase();
    const matchesStatus =
      statusFilter === "all" || contribution.status === statusFilter;
    const matchesEvent =
      eventFilter === "all" ||
      (eventFilter === "none" ? !contribution.eventId : contribution.eventId === eventFilter);
    const matchesSearch =
      !normalizedSearch ||
      memberName.includes(normalizedSearch) ||
      statusLabel.includes(normalizedSearch) ||
      period.includes(normalizedSearch);

    return matchesStatus && matchesEvent && matchesSearch;
  });

  const removeContribution = async () => {
    if (!contributionToDelete) return;
    const { error } = await supabase
      .from("contributions")
      .delete()
      .eq("id", contributionToDelete);
    if (error) {
      toast(getFriendlyErrorMessage(error.message), "error");
      return;
    }
    setContributionToDelete(null);
    toast("Cotisation supprimée.");
    await refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-kicker">Finances</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="page-title">Cotisations</h1>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              {total}
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

      <div className="card p-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-semibold">Progression collective</p>
            <p className="text-xs text-[var(--muted)]">
              {paid} réglée{paid > 1 ? "s" : ""} sur {total}
            </p>
          </div>
          <span className="text-2xl font-bold text-[var(--accent)]">
            {progress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Payées", value: paid, color: "text-[var(--success)]" },
          {
            label: "En attente",
            value: pending,
            color: "text-[var(--warning)]",
          },
          { label: "En retard", value: overdue, color: "text-[var(--danger)]" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-[var(--muted)]">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Nouvelle cotisation</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Membre *
              <select
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="select-input"
              >
                <option value="">Sélectionner un membre</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Montant (FCFA) *
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
                placeholder="5000"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Période *
              <input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="input"
                placeholder="Mai 2026"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Statut
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Contribution["status"],
                  })
                }
                className="select-input"
              >
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="overdue">En retard</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Date précise (jour)
              <input
                type="date"
                value={form.paidDate}
                onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)] md:col-span-2">
              Événement
              <select
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                className="select-input"
              >
                <option value="">Caisse générale / Sans événement</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="field h-11 flex-1 sm:max-w-xs">
          <Search size={16} className="text-[var(--muted)] shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un membre"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as "all" | Contribution["status"],
            )
          }
          className="select-input h-11 sm:w-44"
        >
          <option value="all">Toutes</option>
          <option value="paid">Payées</option>
          <option value="pending">En attente</option>
          <option value="overdue">En retard</option>
        </select>
        <select
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className="select-input h-11 sm:w-56"
        >
          <option value="all">Tous les événements</option>
          <option value="none">Caisse générale / Sans événement</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
      </div>

      <ConfirmDialog
        open={contributionToDelete !== null}
        title="Supprimer cette cotisation ?"
        description="Cette action est définitive."
        onCancel={() => setContributionToDelete(null)}
        onConfirm={() => void removeContribution()}
      />

      {contributions.length === 0 ? (
        <div className="empty-state card">
          <Wallet size={36} />
          <p className="text-sm">Aucune cotisation pour le moment</p>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Créer la première cotisation
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleContributions.map((c) => {
            const config = statusConfig[c.status];
            const Icon = config.icon;
            return (
              <div
                key={c.id}
                className="card flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-[var(--surface-2)] p-2">
                    <Icon size={18} className={config.color} />
                  </div>
                  <div>
                    <p className="font-semibold">{getMemberName(c.memberId)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {c.period}
                      {getEventTitle(c.eventId) ? ` · ${getEventTitle(c.eventId)}` : ""}
                      {c.paidDate
                        ? ` · ${new Date(c.paidDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="font-bold">{c.amount.toLocaleString()} FCFA</p>
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {isAdmin && c.status !== "paid" && (
                    <a
                      href={generateWhatsAppReminderLink({
                        phone: members.find((m) => m.id === c.memberId)?.phone || "",
                        firstName:
                          members.find((m) => m.id === c.memberId)?.firstName ||
                          "",
                        eventName: getEventTitle(c.eventId) || c.period,
                        amount: c.amount,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn h-9 w-9 text-[var(--success)]"
                      title="Envoyer un rappel WhatsApp"
                      aria-label="Envoyer un rappel WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setContributionToDelete(c.id)}
                      className="icon-btn h-9 w-9 text-[var(--danger)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {visibleContributions.length === 0 && (
            <div className="card p-8 text-center text-sm text-[var(--muted)]">
              Aucune cotisation ne correspond à ces filtres.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
