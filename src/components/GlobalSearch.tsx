import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Search, Users, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";

export default function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { members, contributions, events } = useRealtimeFamilyData();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return [
      ...members
        .filter((m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(term),
        )
        .slice(0, 4)
        .map((m) => ({
          label: `${m.firstName} ${m.lastName}`,
          meta: "Membre",
          to: "/membres",
          icon: Users,
        })),
      ...events
        .filter((e) =>
          `${e.title} ${e.location ?? ""}`.toLowerCase().includes(term),
        )
        .slice(0, 4)
        .map((e) => ({
          label: e.title,
          meta: "Événement",
          to: "/evenements",
          icon: CalendarDays,
        })),
      ...contributions
        .filter((c) => c.period.toLowerCase().includes(term))
        .slice(0, 4)
        .map((c) => ({
          label: `${c.amount.toLocaleString()} FCFA`,
          meta: c.period || "Cotisation",
          to: "/cotisations",
          icon: Wallet,
        })),
    ];
  }, [query, members, contributions, events]);

  const select = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          className="fixed inset-0 z-[70] bg-[var(--overlay)] p-4 pt-[12vh]"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="card mx-auto w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search size={17} className="text-[var(--muted)]" />
              <input
                ref={input}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un membre, un événement..."
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-[var(--muted)]"
              />
              <button
                onClick={onClose}
                className="icon-btn h-8 w-8"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!query ? (
                <p className="p-3 text-sm text-[var(--muted)]">
                  Commencez à saisir votre recherche.
                </p>
              ) : results.length ? (
                results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.label}-${index}`}
                      onClick={() => select(result.to)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[var(--surface-2)]"
                    >
                      <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{result.label}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {result.meta}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="p-3 text-sm text-[var(--muted)]">
                  Aucun résultat pour « {query} ».
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
