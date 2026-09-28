-- ============================================================
-- Libota — Migration Supabase
-- À exécuter dans le SQL Editor de Supabase (Project > SQL Editor).
-- Ce script est idempotent : il peut être exécuté plusieurs fois
-- sans erreur si certaines colonnes/policies existent déjà.
-- ============================================================


-- ------------------------------------------------------------
-- 1. COLONNES `created_by`
-- ------------------------------------------------------------

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 2. COTISATIONS LIÉES À UN ÉVÉNEMENT (`event_id`)
-- ------------------------------------------------------------

ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contributions_event_id_idx
  ON public.contributions (event_id);

-- Budget / objectif optionnel d'un événement, utilisé pour la barre
-- de progression de la collecte associée.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS budget numeric;


-- ------------------------------------------------------------
-- 3. RÔLES — uniquement 'admin' (créateur / trésorier) et 'member'
-- ------------------------------------------------------------

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS role text;

-- Normalise les valeurs existantes (ex. ancien libellé français
-- "membre", ou valeurs nulles) avant d'appliquer la contrainte.
UPDATE public.members
  SET role = 'member'
  WHERE role IS NULL OR role NOT IN ('admin', 'member');

ALTER TABLE public.members
  ALTER COLUMN role SET DEFAULT 'member',
  ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_role_check'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_role_check CHECK (role IN ('admin', 'member'));
  END IF;
END $$;


-- ------------------------------------------------------------
-- 3bis. NETTOYAGE DES MEMBRES EN DOUBLE + CONTRAINTE D'UNICITÉ
--
-- Un même utilisateur (user_id) ne doit avoir qu'UNE seule fiche
-- membre. Si des doublons existent (créés avant la correction du
-- code applicatif), on garde une seule ligne par user_id — en
-- priorité celle avec le rôle 'admin', sinon la plus ancienne — et
-- on supprime les autres. Sans cette étape, `.maybeSingle()` côté
-- application échoue avec "JSON object requested, multiple (or no)
-- rows returned" dès qu'un utilisateur a plusieurs fiches.
-- ------------------------------------------------------------

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY (role = 'admin') DESC, created_at ASC, id ASC
    ) AS rn
  FROM public.members
  WHERE user_id IS NOT NULL
)
DELETE FROM public.members
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_key'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_user_id_key UNIQUE (user_id);
  END IF;
END $$;


-- ------------------------------------------------------------
-- 3ter. NOM/PRÉNOM FUSIONNÉS (ex. first_name = "Ferol EBATA",
-- last_name = "")
--
-- Répare les fiches existantes créées avant la correction du code
-- applicatif (qui découpait mal le "Nom complet" saisi à
-- l'inscription). Ne touche que les lignes encore dans cet état ;
-- sans effet si déjà correct.
-- ------------------------------------------------------------

UPDATE public.members
SET
  last_name = trim(substring(first_name from position(' ' in first_name) + 1)),
  first_name = trim(substring(first_name from 1 for position(' ' in first_name) - 1))
WHERE (last_name IS NULL OR last_name = '')
  AND first_name LIKE '% %';


-- ------------------------------------------------------------
-- 3quater. PREUVE D'ACCEPTATION DES CONDITIONS D'UTILISATION
--
-- Horodatage de l'acceptation des CGU par chaque membre, en plus
-- de la copie déjà conservée dans les métadonnées auth.users.
-- ------------------------------------------------------------

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;


-- ------------------------------------------------------------
-- 4. RLS — policies permissives pour les utilisateurs authentifiés
--
-- NB (recommandation) : `USING (true) WITH CHECK (true)` autorise
-- tout utilisateur authentifié à lire/écrire toutes les lignes de
-- ces tables, sans isolation par famille. C'est ce qui a été
-- demandé pour débloquer rapidement l'app ; pour une isolation
-- stricte par famille plus tard, ces policies pourront être
-- resserrées avec une condition du type
-- `family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid())`.
-- ------------------------------------------------------------

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "families_authenticated_all" ON public.families;
CREATE POLICY "families_authenticated_all" ON public.families
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "members_authenticated_all" ON public.members;
CREATE POLICY "members_authenticated_all" ON public.members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "events_authenticated_all" ON public.events;
CREATE POLICY "events_authenticated_all" ON public.events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contributions_authenticated_all" ON public.contributions;
CREATE POLICY "contributions_authenticated_all" ON public.contributions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ------------------------------------------------------------
-- 5. Realtime — s'assurer que les 3 tables publient bien leurs
--    changements (nécessaire pour la synchronisation en direct
--    déjà utilisée par l'app).
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END $$;
