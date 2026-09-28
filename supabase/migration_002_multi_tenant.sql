-- ============================================================
-- Libota — Migration 002 : passage Multi-Tenant (multi-familles)
-- À exécuter APRÈS migration.sql, dans le SQL Editor Supabase.
-- Idempotent : peut être ré-exécutée sans erreur.
-- ============================================================


-- ------------------------------------------------------------
-- 1. TABLE families — champs de facturation / plan
-- ------------------------------------------------------------

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS billing_customer_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'families_plan_type_check'
  ) THEN
    ALTER TABLE public.families
      ADD CONSTRAINT families_plan_type_check
      CHECK (plan_type IN ('free', 'pro', 'enterprise'));
  END IF;
END $$;


-- ------------------------------------------------------------
-- 2. TABLE members — un utilisateur peut appartenir à PLUSIEURS
--    familles, avec un rôle propre à chacune.
--
-- On retire l'unicité sur `user_id` seul (posée en migration.sql,
-- section 3ter, pour l'ancien modèle "une famille par personne")
-- et on la remplace par l'unicité sur le couple (user_id,
-- family_id) : un même utilisateur ne peut avoir qu'UNE fiche par
-- famille, mais peut désormais appartenir à plusieurs familles.
-- ------------------------------------------------------------

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_user_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_family_id_key'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_user_id_family_id_key UNIQUE (user_id, family_id);
  END IF;
END $$;

-- NB : `user_id` reste nullable (un Admin peut ajouter un membre
-- "papier" sans compte Libota) — Postgres ne considère jamais deux
-- NULL comme égaux pour une contrainte UNIQUE, donc plusieurs
-- membres sans compte dans la même famille restent possibles.


-- ------------------------------------------------------------
-- 3. FONCTIONS D'APPARTENANCE — évitent de répéter la même
--    sous-requête dans chaque policy, et découplent proprement
--    la vérification RLS de la table `members` elle-même
--    (SECURITY DEFINER : la fonction s'exécute avec les droits de
--    son propriétaire, pas soumise à la RLS qu'elle sert à vérifier).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE family_id = target_family_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE family_id = target_family_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 4. RLS MULTI-TENANT — remplace les policies permissives
--    (`USING (true)`) de migration.sql par une isolation réelle
--    par famille. Un utilisateur ne voit et ne modifie que les
--    données des familles dont il est membre ; seul un Admin de
--    cette famille peut créer/modifier/supprimer événements,
--    cotisations et membres (même règle que déjà appliquée côté
--    interface — ceci l'impose aussi côté base).
-- ------------------------------------------------------------

-- families
DROP POLICY IF EXISTS "families_authenticated_all" ON public.families;

DROP POLICY IF EXISTS "families_select_own" ON public.families;
CREATE POLICY "families_select_own" ON public.families
  FOR SELECT TO authenticated
  USING (public.is_family_member(id));

DROP POLICY IF EXISTS "families_insert_any" ON public.families;
CREATE POLICY "families_insert_any" ON public.families
  FOR INSERT TO authenticated
  WITH CHECK (true); -- création libre ; l'utilisateur devient admin via l'insert dans `members` qui suit

DROP POLICY IF EXISTS "families_update_admin" ON public.families;
CREATE POLICY "families_update_admin" ON public.families
  FOR UPDATE TO authenticated
  USING (public.is_family_admin(id))
  WITH CHECK (public.is_family_admin(id));

DROP POLICY IF EXISTS "families_delete_admin" ON public.families;
CREATE POLICY "families_delete_admin" ON public.families
  FOR DELETE TO authenticated
  USING (public.is_family_admin(id));

-- members
DROP POLICY IF EXISTS "members_authenticated_all" ON public.members;

DROP POLICY IF EXISTS "members_select_same_family" ON public.members;
CREATE POLICY "members_select_same_family" ON public.members
  FOR SELECT TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "members_insert_self_or_admin" ON public.members;
CREATE POLICY "members_insert_self_or_admin" ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_family_admin(family_id));

DROP POLICY IF EXISTS "members_update_self_or_admin" ON public.members;
CREATE POLICY "members_update_self_or_admin" ON public.members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_family_admin(family_id))
  WITH CHECK (user_id = auth.uid() OR public.is_family_admin(family_id));

DROP POLICY IF EXISTS "members_delete_self_or_admin" ON public.members;
CREATE POLICY "members_delete_self_or_admin" ON public.members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_family_admin(family_id));

-- events
DROP POLICY IF EXISTS "events_authenticated_all" ON public.events;

DROP POLICY IF EXISTS "events_select_same_family" ON public.events;
CREATE POLICY "events_select_same_family" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "events_write_admin" ON public.events;
CREATE POLICY "events_write_admin" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "events_update_admin" ON public.events;
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_family_admin(family_id));

-- contributions
DROP POLICY IF EXISTS "contributions_authenticated_all" ON public.contributions;

DROP POLICY IF EXISTS "contributions_select_same_family" ON public.contributions;
CREATE POLICY "contributions_select_same_family" ON public.contributions
  FOR SELECT TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "contributions_insert_admin" ON public.contributions;
CREATE POLICY "contributions_insert_admin" ON public.contributions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "contributions_update_admin" ON public.contributions;
CREATE POLICY "contributions_update_admin" ON public.contributions
  FOR UPDATE TO authenticated
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "contributions_delete_admin" ON public.contributions;
CREATE POLICY "contributions_delete_admin" ON public.contributions
  FOR DELETE TO authenticated
  USING (public.is_family_admin(family_id));


-- ------------------------------------------------------------
-- 5. Note sur le webhook Paystack
--
-- La Supabase Edge Function paystack-webhook doit utiliser la
-- SERVICE_ROLE_KEY pour mettre à jour `families.plan_type` — cette
-- clé contourne intégralement la RLS ci-dessus (comportement
-- normal et voulu : le webhook n'agit pas "en tant qu'un
-- utilisateur", il agit avec les pleins droits du serveur).
-- ------------------------------------------------------------
