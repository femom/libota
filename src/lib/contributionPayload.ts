export type ContributionInsertInput = {
  familyId: string;
  userId: string;
  memberId: string;
  amount: number | string;
  period: string;
  status?: "paid" | "pending" | "overdue";
  paidDate?: string;
  notes?: string;
  /** Optionnel — associe la cotisation à un événement précis. */
  eventId?: string | null;
};

/** Construit le payload d'insertion Supabase pour une cotisation. */
export function buildContributionInsertPayload({
  familyId,
  userId,
  memberId,
  amount,
  period,
  status = "pending",
  paidDate,
  notes,
  eventId,
}: ContributionInsertInput) {
  if (!familyId) {
    throw new Error("familyId is required");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  return {
    family_id: familyId,
    created_by: userId,
    member_id: memberId,
    amount: Number(amount),
    period,
    status,
    event_id: eventId || null,
    ...(paidDate ? { paid_date: paidDate } : {}),
    ...(notes ? { notes } : {}),
  };
}
