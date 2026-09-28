export const TERMS_VERSION = "2026-09-23";

/**
 * Texte des Conditions Générales d'Utilisation.
 *
 * ⚠️ Rédigé par une IA à titre de base raisonnable, PAS par un
 * juriste. À faire relire par un professionnel avant une mise en
 * production impliquant des sommes conséquentes ou un usage au-delà
 * du cercle familial proche.
 */
export default function TermsContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-[var(--text-soft)]">
      <p className="text-xs text-[var(--muted)]">
        Dernière mise à jour : {TERMS_VERSION}
      </p>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          1. Objet
        </h3>
        <p className="mt-2">
          Libota est un outil numérique d'aide à l'organisation familiale :
          suivi des membres, des cotisations et des événements. Libota est un
          outil de <strong>suivi et de tenue de registre</strong> — il ne
          collecte, ne détient, ne transfère et ne garantit aucune somme
          d'argent. Tout échange financier entre membres d'une famille (dépôt
          de cotisation, remboursement, paiement d'un événement, etc.) a lieu
          en dehors de l'application, par les moyens que la famille choisit
          elle-même (espèces, virement, mobile money ou autre). Libota se
          limite à enregistrer les montants et statuts que les utilisateurs
          renseignent.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          2. Création de compte et rôles
        </h3>
        <p className="mt-2">
          L'utilisateur s'engage à fournir des informations exactes et à
          conserver la confidentialité de son mot de passe. Le créateur d'une
          famille reçoit le rôle <strong>Admin</strong> et assure la
          fonction de gestion des cotisations, des événements et des membres
          de cette famille. Les autres membres disposent d'un accès en
          consultation et à leur propre historique. Libota n'intervient pas
          dans les décisions de gestion prises par l'Admin d'une famille et
          n'est pas partie aux relations entre les membres d'une même
          famille.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          3. Responsabilités de l'utilisateur
        </h3>
        <p className="mt-2">
          Chaque utilisateur est responsable de l'exactitude des données
          qu'il saisit (montants, dates, statuts de paiement) et des
          conséquences d'une saisie erronée ou frauduleuse. Libota ne
          vérifie pas la réalité des paiements déclarés et ne peut être
          tenu responsable d'un désaccord entre membres d'une famille quant
          à un paiement effectué, non effectué, ou mal enregistré.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          4. Disponibilité et limitation de responsabilité
        </h3>
        <p className="mt-2">
          Libota est fourni "en l'état", sans garantie de disponibilité
          continue, d'absence d'erreur ou d'interruption de service. Dans
          la limite permise par la loi applicable, Libota ne pourra être
          tenu responsable d'une perte de données, d'un dommage indirect,
          ou d'un préjudice financier résultant de l'utilisation ou de
          l'impossibilité d'utiliser l'application — y compris en cas de
          litige portant sur des sommes d'argent gérées en dehors de
          l'application.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          5. Données personnelles
        </h3>
        <p className="mt-2">
          Les données collectées (nom, email, téléphone, et les données de
          gestion familiale saisies) sont utilisées uniquement pour le
          fonctionnement de l'application et ne sont ni vendues ni
          transmises à des tiers à des fins commerciales. Un utilisateur
          peut demander la suppression de son compte et de ses données à
          tout moment.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          6. Résiliation
        </h3>
        <p className="mt-2">
          Tout utilisateur peut cesser d'utiliser Libota et demander la
          suppression de son compte à tout moment. Libota se réserve le
          droit de suspendre un compte en cas d'usage abusif ou contraire
          aux présentes conditions.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          7. Modification des présentes conditions
        </h3>
        <p className="mt-2">
          Ces conditions peuvent être mises à jour ; la date de dernière
          modification est indiquée en haut de ce document. L'utilisation
          continue de Libota après une mise à jour vaut acceptation de la
          nouvelle version.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-[var(--text)]">
          8. Droit applicable
        </h3>
        <p className="mt-2">
          Les présentes conditions sont régies par le droit de la
          République du Congo. Tout litige relève, à défaut de résolution
          amiable, des juridictions compétentes.
        </p>
      </section>
    </div>
  );
}
