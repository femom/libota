import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Member, Contribution, Event } from "../types";

// Utilitaires de conversion des lignes Postgres vers les types TypeScript
export function mapMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id ?? ""),
    familyId: (row.family_id as string) || (row.familyId as string),
    firstName: (row.first_name as string) ?? (row.firstName as string) ?? "",
    lastName: (row.last_name as string) ?? (row.lastName as string) ?? "",
    phone: (row.phone as string) ?? "",
    relationship: (row.relationship as string) ?? "",
    role: row.role === "admin" || row.role === "member" ? row.role : undefined,
    isActive: (row.is_active as boolean) ?? (row.isActive as boolean) ?? true,
    createdAt: row.created_at
      ? new Date(String(row.created_at)).toLocaleDateString("fr-FR")
      : (row.createdAt as string) || new Date().toLocaleDateString("fr-FR"),
  };
}

export function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: String(row.id ?? ""),
    familyId: (row.family_id as string) || (row.familyId as string),
    memberId: String(row.member_id ?? row.memberId ?? ""),
    eventId: (row.event_id as string) ?? (row.eventId as string) ?? null,
    amount: Number(row.amount ?? 0),
    period: (row.period as string) ?? "",
    status: (row.status as Contribution["status"]) ?? "pending",
    paidDate:
      (row.paid_date as string) ?? (row.paidDate as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
  };
}

export function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: String(row.id ?? ""),
    familyId: (row.family_id as string) || (row.familyId as string),
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? undefined,
    eventDate: (row.event_date as string) ?? (row.eventDate as string) ?? "",
    location: (row.location as string) ?? undefined,
    eventType:
      (row.event_type as Event["eventType"]) ??
      (row.eventType as Event["eventType"]) ??
      "reunion",
    budget:
      row.budget != null
        ? Number(row.budget)
        : row.objective != null
          ? Number(row.objective)
          : null,
  };
}

export function useRealtimeFamilyData(customFamilyId?: string | null) {
  const { familyId: authFamilyId, user } = useAuth();
  const familyId = customFamilyId ?? authFamilyId;

  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de rechargement manuel
  const refetch = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      setContributions([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [membersRes, contribsRes, eventsRes] = await Promise.all([
        supabase
          .from("members")
          .select("*")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("contributions")
          .select("*")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("*")
          .eq("family_id", familyId)
          .order("event_date", { ascending: true }),
      ]);

      if (membersRes.data) {
        setMembers(
          membersRes.data.map((item) =>
            mapMember(item as Record<string, unknown>),
          ),
        );
      }
      if (contribsRes.data) {
        setContributions(
          contribsRes.data.map((item) =>
            mapContribution(item as Record<string, unknown>),
          ),
        );
      }
      if (eventsRes.data) {
        setEvents(
          eventsRes.data.map((item) =>
            mapEvent(item as Record<string, unknown>),
          ),
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Synchronisation et écoute temps réel
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!familyId) {
        if (isMounted) {
          setMembers([]);
          setContributions([]);
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const [membersRes, contribsRes, eventsRes] = await Promise.all([
          supabase
            .from("members")
            .select("*")
            .eq("family_id", familyId)
            .order("created_at", { ascending: false }),
          supabase
            .from("contributions")
            .select("*")
            .eq("family_id", familyId)
            .order("created_at", { ascending: false }),
          supabase
            .from("events")
            .select("*")
            .eq("family_id", familyId)
            .order("event_date", { ascending: true }),
        ]);

        if (!isMounted) return;

        if (membersRes.data) {
          setMembers(
            membersRes.data.map((item) =>
              mapMember(item as Record<string, unknown>),
            ),
          );
        }
        if (contribsRes.data) {
          setContributions(
            contribsRes.data.map((item) =>
              mapContribution(item as Record<string, unknown>),
            ),
          );
        }
        if (eventsRes.data) {
          setEvents(
            eventsRes.data.map((item) =>
              mapEvent(item as Record<string, unknown>),
            ),
          );
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadInitialData();

    if (!familyId) return;

    // Canal temps réel Supabase.
    // NB: en développement (React StrictMode), les effets sont montés,
    // nettoyés puis remontés immédiatement. `removeChannel` est asynchrone
    // (il attend `unsubscribe()`), donc le nettoyage précédent peut ne pas
    // être terminé quand cet effet est relancé : `supabase.channel(topic)`
    // renverrait alors le même canal déjà abonné, et y rattacher `.on()`
    // lève "cannot add postgres_changes callbacks ... after subscribe()".
    // On réutilise donc un canal existant pour ce topic au lieu d'en
    // recréer un et d'y rattacher des listeners en double.
    const topic = `realtime-family-${familyId}`;
    const existingChannel = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${topic}`);

    const channel =
      existingChannel ??
      supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "members",
            filter: `family_id=eq.${familyId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newMember = mapMember(
                payload.new as Record<string, unknown>,
              );
              setMembers((prev) => {
                if (prev.some((m) => m.id === newMember.id)) return prev;
                return [newMember, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedMember = mapMember(
                payload.new as Record<string, unknown>,
              );
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === updatedMember.id ? updatedMember : m,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              const deletedId = String(payload.old.id);
              setMembers((prev) => prev.filter((m) => m.id !== deletedId));
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contributions",
            filter: `family_id=eq.${familyId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newContrib = mapContribution(
                payload.new as Record<string, unknown>,
              );
              setContributions((prev) => {
                if (prev.some((c) => c.id === newContrib.id)) return prev;
                return [newContrib, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedContrib = mapContribution(
                payload.new as Record<string, unknown>,
              );
              setContributions((prev) =>
                prev.map((c) =>
                  c.id === updatedContrib.id ? updatedContrib : c,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              const deletedId = String(payload.old.id);
              setContributions((prev) =>
                prev.filter((c) => c.id !== deletedId),
              );
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "events",
            filter: `family_id=eq.${familyId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newEvent = mapEvent(payload.new as Record<string, unknown>);
              setEvents((prev) => {
                if (prev.some((e) => e.id === newEvent.id)) return prev;
                return [...prev, newEvent].sort(
                  (a, b) =>
                    new Date(a.eventDate).getTime() -
                    new Date(b.eventDate).getTime(),
                );
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedEvent = mapEvent(
                payload.new as Record<string, unknown>,
              );
              setEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)),
              );
            } else if (payload.eventType === "DELETE") {
              const deletedId = String(payload.old.id);
              setEvents((prev) => prev.filter((e) => e.id !== deletedId));
            }
          },
        )
        .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  // Ajouter un membre
  const addMember = async (memberData: {
    firstName: string;
    lastName: string;
    phone?: string;
    relationship?: string;
    isActive?: boolean;
  }) => {
    if (!familyId) throw new Error("Aucune famille sélectionnée.");

    const currentUserId =
      user?.id ?? (await supabase.auth.getUser()).data.user?.id;

    let { data, error: insertError } = await supabase
      .from("members")
      .insert([
        {
          family_id: familyId,
          created_by: currentUserId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone || "",
          relationship: memberData.relationship || "",
          is_active: memberData.isActive ?? true,
        },
      ])
      .select()
      .single();

    if (insertError && insertError.message.includes("column")) {
      const retry = await supabase
        .from("members")
        .insert([
          {
            family_id: familyId,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            phone: memberData.phone || "",
            relationship: memberData.relationship || "",
            isActive: memberData.isActive ?? true,
          },
        ])
        .select()
        .single();
      data = retry.data;
      insertError = retry.error;
    }

    if (insertError) throw insertError;
    const newMember = mapMember(data as Record<string, unknown>);
    setMembers((prev) => {
      if (prev.some((m) => m.id === newMember.id)) return prev;
      return [newMember, ...prev];
    });
    return newMember;
  };

  // Mettre à jour un membre
  const updateMember = async (
    id: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      relationship?: string;
      isActive?: boolean;
    },
  ) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.firstName !== undefined)
      dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.relationship !== undefined)
      dbUpdates.relationship = updates.relationship;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    let { data, error: updateError } = await supabase
      .from("members")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (updateError && updateError.message.includes("column")) {
      const retry = await supabase
        .from("members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      data = retry.data;
      updateError = retry.error;
    }

    if (updateError) throw updateError;
    const updated = mapMember(data as Record<string, unknown>);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  // Supprimer un membre
  const deleteMember = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("members")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    members,
    contributions,
    events,
    loading,
    error,
    familyId,
    addMember,
    updateMember,
    deleteMember,
    refetch,
  };
}
