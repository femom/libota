import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Family, Membership, Role } from "../types";
import { TERMS_VERSION } from "../components/legal/TermsContent";
import {
  isEmailLike,
  normalizePhone,
  resolveAuthEmail,
} from "../lib/phoneAuth";

const ACTIVE_FAMILY_STORAGE_KEY = "libota_active_family_id";

type AuthResult = { error: Error | null };
type SignUpResult = AuthResult & {
  data: { user: User | null; session: Session | null } | null;
};
type FamilyResult = { data: Family | null; error: Error | null };
type FamilyRow = Record<string, unknown>;

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  /** Toutes les familles dont l'utilisateur est membre. */
  memberships: Membership[];
  /** Famille actuellement sélectionnée (Family Switcher). */
  activeFamilyId: string | null;
  setActiveFamilyId: (familyId: string) => void;

  /** Alias sur la famille ACTIVE — inchangés pour tout le reste de l'app. */
  role: Role | null;
  isAdmin: boolean;
  familyId: string | null;
  family: Family | null;

  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    options?: {
      fullName?: string;
      role?: Role;
      familyId?: string;
      termsAcceptedAt?: string;
    },
  ) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  /** Crée une famille et bascule dessus. Fonctionne aussi pour un
   *  utilisateur qui a déjà une ou plusieurs familles (ajout d'une
   *  famille supplémentaire, ex. sa propre tontine). */
  createFamily: (name: string, code?: string) => Promise<FamilyResult>;
  joinFamilyWithCode: (code: string) => Promise<FamilyResult>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "member";
}

/** Supports both `families.join_code` and the legacy `families.code` column. */
function toFamily(row: FamilyRow): Family | null {
  if (row.id == null || row.name == null) return null;
  const joinCode = typeof row.join_code === "string" ? row.join_code : "";
  const legacyCode = typeof row.code === "string" ? row.code : "";
  const planType = row.plan_type;
  return {
    id: String(row.id),
    name: String(row.name),
    code: joinCode || legacyCode,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    createdBy: row.created_by ? String(row.created_by) : undefined,
    planType:
      planType === "pro" || planType === "enterprise" ? planType : "free",
    subscriptionStatus:
      typeof row.subscription_status === "string"
        ? row.subscription_status
        : "active",
    maxMembers:
      typeof row.max_members === "number" ? row.max_members : 10,
    subscriptionEndDate: row.subscription_end_date
      ? String(row.subscription_end_date)
      : null,
    billingCustomerId: row.billing_customer_id
      ? String(row.billing_customer_id)
      : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeFamilyId, setActiveFamilyIdState] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const setActiveFamilyId = useCallback((nextId: string) => {
    setActiveFamilyIdState(nextId);
    localStorage.setItem(ACTIVE_FAMILY_STORAGE_KEY, nextId);
  }, []);

  /**
   * Recharge la liste complète des familles dont l'utilisateur est
   * membre (table `members` — source de vérité unique, un utilisateur
   * pouvant appartenir à plusieurs familles) et choisit la famille
   * active : celle mémorisée si elle en fait toujours partie, sinon
   * la première disponible.
   */
  const loadUserData = useCallback(async (authUser: User) => {
    const { data: memberRows, error: memberError } = await supabase
      .from("members")
      .select("family_id, role")
      .eq("user_id", authUser.id);

    if (memberError) {
      console.error(
        "Erreur Supabase lors du chargement des adhésions :",
        memberError.message,
      );
      setMemberships([]);
      setActiveFamilyIdState(null);
      return;
    }

    const familyIds = Array.from(
      new Set(
        (memberRows ?? [])
          .map((row) => row.family_id as string | null)
          .filter((id): id is string => !!id),
      ),
    );

    if (familyIds.length === 0) {
      setMemberships([]);
      setActiveFamilyIdState(null);
      localStorage.removeItem(ACTIVE_FAMILY_STORAGE_KEY);
      return;
    }

    const { data: familyRows, error: familiesError } = await supabase
      .from("families")
      .select("*")
      .in("id", familyIds);

    if (familiesError) {
      console.error(
        "Erreur Supabase lors du chargement des familles :",
        familiesError.message,
      );
    }

    const familiesById = new Map<string, Family>();
    for (const row of familyRows ?? []) {
      const f = toFamily(row as FamilyRow);
      if (f) familiesById.set(f.id, f);
    }

    const nextMemberships: Membership[] = (memberRows ?? [])
      .map((row) => {
        const fid = row.family_id as string | null;
        const fam = fid ? familiesById.get(fid) : undefined;
        if (!fid || !fam) return null;
        return {
          familyId: fid,
          role: isRole(row.role) ? row.role : "member",
          family: fam,
        } as Membership;
      })
      .filter((m): m is Membership => m !== null);

    setMemberships(nextMemberships);

    const storedActiveId = localStorage.getItem(ACTIVE_FAMILY_STORAGE_KEY);
    const stillValid = nextMemberships.find(
      (m) => m.familyId === storedActiveId,
    );
    const nextActiveId = stillValid
      ? storedActiveId
      : (nextMemberships[0]?.familyId ?? null);

    setActiveFamilyIdState(nextActiveId);
    if (nextActiveId) {
      localStorage.setItem(ACTIVE_FAMILY_STORAGE_KEY, nextActiveId);
    } else {
      localStorage.removeItem(ACTIVE_FAMILY_STORAGE_KEY);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [loadUserData, user]);

  const resetAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setMemberships([]);
    setActiveFamilyIdState(null);
    localStorage.removeItem(ACTIVE_FAMILY_STORAGE_KEY);
  }, []);

  useEffect(() => {
    let active = true;

    const finishLoading = () => {
      if (active) setLoading(false);
    };

    const initialise = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error)
          console.error(
            "Erreur Supabase lors de l'initialisation :",
            error.message,
          );

        if (!active) return;

        const nextSession = data.session ?? null;
        const nextUser = nextSession?.user ?? null;

        setSession(nextSession);
        setUser(nextUser);

        if (nextUser) {
          await loadUserData(nextUser);
        } else {
          resetAuthState();
        }
      } catch (error) {
        console.error(
          "Initialisation de l'authentification impossible :",
          error,
        );
        if (active) {
          resetAuthState();
        }
      } finally {
        finishLoading();
      }
    };

    void initialise();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!active) return;

        const nextUser = nextSession?.user ?? null;
        setSession(nextSession);
        setUser(nextUser);

        try {
          if (nextUser) {
            await loadUserData(nextUser);
          } else {
            resetAuthState();
          }
        } catch (error) {
          console.error(
            "Chargement du contexte utilisateur impossible :",
            error,
          );
          resetAuthState();
        } finally {
          finishLoading();
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUserData, resetAuthState]);

  const signIn = async (
    identifier: string,
    password: string,
  ): Promise<AuthResult> => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier)
      return {
        error: new Error("Veuillez renseigner votre email ou votre numéro."),
      };
    if (password.length < 6)
      return {
        error: new Error(
          "Le mot de passe doit comporter au moins 6 caractères.",
        ),
      };

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolveAuthEmail(trimmedIdentifier),
        password,
      });
      if (error) {
        console.error("Erreur Supabase lors de la connexion :", error.message);
        return { error };
      }

      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        await loadUserData(data.user);
      }

      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error : new Error("Connexion impossible."),
      };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error(
        "Erreur Supabase lors de la connexion Google :",
        error.message,
      );
      return { error };
    }
    // La redirection OAuth quitte la page ; la session sera restaurée
    // par `onAuthStateChange` au retour sur l'app (detectSessionInUrl
    // est déjà activé dans lib/supabase.ts).
    return { error: null };
  };

  const signUp = async (
    identifier: string,
    password: string,
    options?: {
      fullName?: string;
      role?: Role;
      familyId?: string;
      termsAcceptedAt?: string;
    },
  ): Promise<SignUpResult> => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier)
      return {
        data: null,
        error: new Error("Veuillez renseigner votre numéro ou votre email."),
      };
    if (password.length < 6)
      return {
        data: null,
        error: new Error(
          "Le mot de passe doit comporter au moins 6 caractères.",
        ),
      };
    if (!options?.termsAcceptedAt)
      return {
        data: null,
        error: new Error(
          "Veuillez accepter les conditions d'utilisation pour continuer.",
        ),
      };

    setLoading(true);

    try {
      const usesPhone = !isEmailLike(trimmedIdentifier);
      const { data, error } = await supabase.auth.signUp({
        email: resolveAuthEmail(trimmedIdentifier),
        password,
        options: {
          data: {
            full_name: options?.fullName?.trim(),
            phone_number: usesPhone
              ? normalizePhone(trimmedIdentifier)
              : undefined,
            terms_accepted_at: options.termsAcceptedAt,
            terms_version: TERMS_VERSION,
          },
        },
      });

      if (error) {
        console.error("Erreur Supabase lors de l'inscription :", error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error("Inscription impossible."),
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur Supabase lors de la déconnexion :", error.message);
      return { error };
    }

    resetAuthState();
    return { error: null };
  };

  const createFamily = async (
    name: string,
    customCode?: string,
  ): Promise<FamilyResult> => {
    const trimmedName = name.trim();
    if (!trimmedName)
      return {
        data: null,
        error: new Error("Le nom de la famille est obligatoire."),
      };

    const currentUser = user ?? (await supabase.auth.getUser()).data.user;
    if (!currentUser)
      return {
        data: null,
        error: new Error("Vous devez être connecté pour créer une famille."),
      };

    const generatedCode =
      customCode?.trim().toUpperCase() ||
      crypto.randomUUID().slice(0, 8).toUpperCase();
    const { data, error } = await supabase
      .from("families")
      .insert({
        name: trimmedName,
        code: generatedCode,
        join_code: generatedCode,
        created_by: currentUser.id,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Erreur Supabase lors de la création de la famille :",
        error.message,
      );
      return { data: null, error };
    }

    const newFamily = toFamily(data as FamilyRow);
    if (!newFamily)
      return {
        data: null,
        error: new Error("La famille créée contient des données invalides."),
      };

    // Le créateur de la famille doit lui-même apparaître comme membre
    // (rôle admin), sans quoi il est absent de la liste des membres.
    // `onConflict: user_id,family_id` : un même utilisateur peut être
    // admin de cette nouvelle famille tout en étant déjà membre
    // d'autres familles par ailleurs.
    const fullName = currentUser.user_metadata?.full_name;
    const nameParts =
      typeof fullName === "string"
        ? fullName.trim().split(/\s+/).filter(Boolean)
        : [];
    const lastName = nameParts.length > 1 ? (nameParts.pop() ?? "") : "";
    const firstName = nameParts.join(" ") || "Admin";

    const { error: memberError } = await supabase.from("members").upsert(
      {
        family_id: newFamily.id,
        created_by: currentUser.id,
        user_id: currentUser.id,
        role: "admin",
        first_name: firstName,
        last_name: lastName,
        relationship: "Créateur",
        phone: (currentUser.user_metadata?.phone_number as string) || currentUser.phone || "",
        terms_accepted_at: currentUser.user_metadata?.terms_accepted_at ?? null,
      },
      { onConflict: "user_id,family_id" },
    );
    if (memberError) {
      console.error(
        "Erreur Supabase lors de l'ajout du créateur comme membre :",
        memberError.message,
      );
      // Non bloquant : la famille existe déjà, l'utilisateur peut continuer.
    }

    await loadUserData(currentUser);
    setActiveFamilyId(newFamily.id);
    return { data: newFamily, error: null };
  };

  const joinFamilyWithCode = async (code: string): Promise<FamilyResult> => {
    const currentUser = user ?? (await supabase.auth.getUser()).data.user;
    if (!currentUser)
      return {
        data: null,
        error: new Error(
          "Vous devez être connecté pour rejoindre une famille.",
        ),
      };

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode)
      return {
        data: null,
        error: new Error("Le code d'invitation est obligatoire."),
      };

    let result = await supabase
      .from("families")
      .select("*")
      .eq("join_code", cleanCode)
      .maybeSingle();
    if (result.error || !result.data) {
      const legacyResult = await supabase
        .from("families")
        .select("*")
        .eq("code", cleanCode)
        .maybeSingle();
      if (legacyResult.error) {
        console.error(
          "Erreur Supabase lors de la recherche du code famille :",
          legacyResult.error.message,
        );
        return { data: null, error: legacyResult.error };
      }
      result = legacyResult;
    }

    if (!result.data)
      return {
        data: null,
        error: new Error("Code de famille invalide ou famille introuvable."),
      };

    const joinedFamily = toFamily(result.data as FamilyRow);
    if (!joinedFamily)
      return {
        data: null,
        error: new Error("La famille trouvée contient des données invalides."),
      };

    const fullName = currentUser.user_metadata?.full_name;
    const nameParts =
      typeof fullName === "string"
        ? fullName.trim().split(/\s+/).filter(Boolean)
        : [];
    const lastName = nameParts.length > 1 ? (nameParts.pop() ?? "") : "";
    const firstName = nameParts.join(" ") || "Membre";

    const { error: memberError } = await supabase.from("members").upsert(
      {
        family_id: joinedFamily.id,
        created_by: currentUser.id,
        user_id: currentUser.id,
        role: "member",
        first_name: firstName,
        last_name: lastName,
        relationship: "Membre",
        phone: (currentUser.user_metadata?.phone_number as string) || currentUser.phone || "",
        terms_accepted_at: currentUser.user_metadata?.terms_accepted_at ?? null,
      },
      { onConflict: "user_id,family_id" },
    );

    if (memberError) {
      console.error(
        "Erreur Supabase lors de l'ajout du membre :",
        memberError.message,
      );
      return { data: null, error: memberError };
    }

    await loadUserData(currentUser);
    setActiveFamilyId(joinedFamily.id);
    return { data: joinedFamily, error: null };
  };

  const activeMembership = useMemo(
    () => memberships.find((m) => m.familyId === activeFamilyId) ?? null,
    [memberships, activeFamilyId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      memberships,
      activeFamilyId,
      setActiveFamilyId,
      role: activeMembership?.role ?? null,
      isAdmin: activeMembership?.role === "admin",
      familyId: activeMembership?.familyId ?? null,
      family: activeMembership?.family ?? null,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      createFamily,
      joinFamilyWithCode,
      refreshUserData,
    }),
    [
      user,
      session,
      loading,
      memberships,
      activeFamilyId,
      activeMembership,
      setActiveFamilyId,
      refreshUserData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider",
    );
  return context;
}
