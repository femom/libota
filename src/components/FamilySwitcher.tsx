import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CreateFamilyForm from "./auth/CreateFamilyForm";

type FamilySwitcherProps = {
  /** Rendu compact pour le header mobile (une seule ligne, pas de cadre). */
  compact?: boolean;
};

export default function FamilySwitcher({ compact = false }: FamilySwitcherProps) {
  const { memberships, activeFamilyId, setActiveFamilyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = memberships.find((m) => m.familyId === activeFamilyId);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Un utilisateur avec une seule famille n'a pas besoin d'un sélecteur —
  // on affiche juste le nom, sobrement, comme avant.
  if (memberships.length <= 1 && !compact) {
    return (
      <div className="mx-3 mt-4 rounded-xl bg-[var(--accent-soft)] px-3 py-3">
        <p className="page-kicker text-[var(--accent)]">Famille</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
          {active?.family.name || "Ma famille"}
        </p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${compact ? "" : "mx-3 mt-4"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? "flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]"
            : "flex w-full items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-3 text-left transition hover:brightness-105"
        }
      >
        <span className="min-w-0">
          {!compact && <p className="page-kicker text-[var(--accent)]">Famille</p>}
          <span className={`block truncate ${compact ? "" : "mt-1 text-sm font-semibold text-[var(--text)]"}`}>
            {active?.family.name || "Ma famille"}
          </span>
        </span>
        <ChevronDown
          size={compact ? 14 : 16}
          className={`shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="max-h-64 overflow-y-auto p-1.5">
            {memberships.map((m) => (
              <button
                key={m.familyId}
                type="button"
                onClick={() => {
                  setActiveFamilyId(m.familyId);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-[var(--surface-2)]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {m.familyId === activeFamilyId && (
                    <Check size={14} className="shrink-0 text-[var(--accent)]" />
                  )}
                  <span
                    className={`truncate ${m.familyId === activeFamilyId ? "font-semibold text-[var(--text)]" : "text-[var(--text-soft)]"}`}
                  >
                    {m.family.name}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    m.role === "admin"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {m.role === "admin" ? "Admin" : "Membre"}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--border)] p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowCreate(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--surface-2)]"
            >
              <Plus size={15} />
              Créer une nouvelle famille
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--overlay)] p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[var(--text)]">
                Nouvelle famille
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="icon-btn h-9 w-9"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <CreateFamilyForm onSuccess={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
