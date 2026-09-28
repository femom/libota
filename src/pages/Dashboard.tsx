import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle,
  Clock3,
  Copy,
  Users,
  Wallet,
} from "lucide-react";
import QuickActionModal, {
  type QuickAction,
} from "../components/QuickActionModal";
import Gauge from "../components/ui/Gauge";

export default function Dashboard() {
  const { isAdmin, family, user } = useAuth();
  const { members, contributions, events } = useRealtimeFamilyData();
  const [copied, setCopied] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);

  const paid = contributions.filter((c) => c.status === "paid").length;
  const pending = contributions.filter((c) => c.status === "pending").length;
  const overdue = contributions.filter((c) => c.status === "overdue").length;
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    "vous";

  const upcoming = [...events]
    .filter((e) => new Date(e.eventDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    )
    .slice(0, 3);

  const stats = [
    {
      label: "Membres",
      value: members.length,
      icon: Users,
      to: "/membres",
      color: "text-[var(--accent)] bg-[var(--accent-soft)]",
    },
    {
      label: "Payées",
      value: paid,
      icon: CheckCircle,
      to: "/cotisations",
      color: "text-[var(--success)] bg-emerald-500/10",
    },
    {
      label: "En attente",
      value: pending,
      icon: Clock3,
      to: "/cotisations",
      color: "text-[var(--warning)] bg-amber-500/10",
    },
    {
      label: "Retards",
      value: overdue,
      icon: AlertCircle,
      to: "/cotisations",
      color: "text-[var(--danger)] bg-red-500/10",
    },
  ];

  const totalAmount = contributions.reduce((sum, item) => sum + item.amount, 0);
  const budgetProgress = contributions.length
    ? Math.min(100, Math.round((paid / contributions.length) * 100))
    : 0;

  const recentContributions = [...contributions]
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .slice(0, 4);

  const activityStatus = {
    paid: { label: "Payé", dot: "bg-[var(--success)]", text: "text-[var(--success)]" },
    pending: {
      label: "En attente",
      dot: "bg-[var(--warning)]",
      text: "text-[var(--warning)]",
    },
    overdue: {
      label: "En retard",
      dot: "bg-[var(--danger)]",
      text: "text-[var(--danger)]",
    },
  };

  const handleCopyCode = () => {
    if (!family?.code) return;
    void navigator.clipboard.writeText(family.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-kicker">Tableau de bord</p>
            <h1 className="page-title mt-2">Bonjour, {firstName}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {family?.name
                ? `Famille ${family.name.replace(/^\s*famille\s+/i, "")}`
                : "Vue d’ensemble de votre famille"}
            </p>
          </div>

          {isAdmin && family?.code && (
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--border) bg-(--accent-soft) px-4 py-2.5 text-sm font-medium text-(--accent)"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Code copié" : `Code : ${family.code}`}
            </button>
          )}
        </div>
      </motion.div>

      <QuickActionModal
        action={quickAction}
        onClose={() => setQuickAction(null)}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_320px] xl:items-stretch">
        <div className="flex flex-col gap-4">
          {isAdmin && (
            <div className="card p-4">
              <p className="page-kicker">Actions</p>
              <h2 className="mt-1 text-lg font-semibold">Ajouter rapidement</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setQuickAction("contribution")}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-left hover:border-[var(--accent)]"
                >
                  <Wallet size={18} className="text-[var(--accent)]" />
                  <p className="mt-2 font-medium">Cotisation</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Enregistrer un paiement
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAction("event")}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-left hover:border-[var(--accent)]"
                >
                  <CalendarDays size={18} className="text-[var(--accent)]" />
                  <p className="mt-2 font-medium">Événement</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Planifier un rendez-vous
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="card p-4 transition hover:border-(--accent)"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-xl font-bold">{stat.value}</span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {stat.label}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="card flex-1 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="page-kicker">Activité récente</p>
              <Link
                to="/cotisations"
                className="text-xs font-medium text-[var(--accent)]"
              >
                Voir tout
              </Link>
            </div>
            {recentContributions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Aucune cotisation enregistrée pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {recentContributions.map((c) => {
                  const member = members.find((m) => m.id === c.memberId);
                  const config = activityStatus[c.status];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member
                              ? `${member.firstName} ${member.lastName}`.trim()
                              : "Membre"}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {c.period}
                            {c.paidDate
                              ? ` · ${new Date(c.paidDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {c.amount.toLocaleString()} FCFA
                        </p>
                        <p className={`text-xs ${config.text}`}>
                          {config.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="page-kicker">Événements</p>
              <Link
                to="/evenements"
                className="text-xs font-medium text-[var(--accent)]"
              >
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Aucun événement à venir.
                </p>
              ) : (
                upcoming.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(event.eventDate).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-4">
            <p className="page-kicker">Budget</p>
            <div className="mt-3 flex items-center justify-center">
              <Gauge value={budgetProgress} />
            </div>
            <p className="-mt-1 text-center text-xs text-[var(--muted)]">
              {totalAmount.toLocaleString()} FCFA collectés
            </p>
            <div className="mt-4 flex justify-between text-xs text-[var(--muted)]">
              <span>{paid} payées</span>
              <span>{pending} en attente</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
