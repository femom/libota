// ── Rôles ─────────────────────────────────────────────────────
export type Role = "admin" | "member";

// ── Plan / abonnement ────────────────────────────────────────
export type PlanType = "free" | "pro" | "enterprise";

// ── Famille ───────────────────────────────────────────────────
export type Family = {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  createdBy?: string;
  planType: PlanType;
  subscriptionStatus: string;
  maxMembers: number;
  subscriptionEndDate?: string | null;
  billingCustomerId?: string | null;
};

// ── Appartenance d'un utilisateur à une famille ─────────────────
export type Membership = {
  familyId: string;
  role: Role;
  family: Family;
};

// ── Membre de la famille ───────────────────────────────────────
export type Member = {
  id: string;
  familyId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string; // "parent", "enfant", "frère", "sœur"...
  role?: Role;
  isActive: boolean;
  createdAt: string; // date sous forme de texte "2026-05-09"
};

// ── Cotisation ─────────────────────────────────────────────────
export type Contribution = {
  id: string;
  familyId?: string;
  memberId: string; // relie la cotisation à un membre
  eventId?: string | null; // optionnel — relie la cotisation à un événement
  amount: number; // montant en FCFA
  period: string; // ex: "Mai 2026"
  status: "paid" | "pending" | "overdue";
  paidDate?: string; // optionnel — seulement si payé
  notes?: string; // optionnel — remarque éventuelle
};

// ── Événement ─────────────────────────────────────────────────
export type Event = {
  id: string;
  familyId?: string;
  title: string;
  description?: string; // optionnel
  eventDate: string;
  location?: string; // optionnel
  eventType: "reunion" | "celebration" | "anniversaire" | "autre";
  budget?: number | null; // optionnel — objectif de collecte pour l'événement
};

// ── Utilisateur connecté ───────────────────────────────────────
export type AuthUser = {
  role: Role;
  familyId?: string;
};
