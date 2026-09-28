/**
 * Libota permet de s'inscrire par numéro de téléphone plutôt que par
 * email, sans confirmation SMS. Techniquement, Supabase Auth attend
 * toujours un email comme identifiant unique — on synthétise donc un
 * email interne à partir du numéro (jamais montré à l'utilisateur),
 * pendant que le vrai numéro reste stocké tel quel dans `members.phone`.
 *
 * ⚠️ Prérequis côté tableau de bord Supabase (à faire une fois,
 * impossible à automatiser par code) : Authentication > Sign In / Up >
 * Email > désactiver "Confirm email". Sans ça, `signUp` renverra un
 * compte non confirmé et bloquera la connexion immédiate demandée.
 */

const PHONE_EMAIL_DOMAIN = "phone.libota.app";

/** Ne garde que les chiffres (et le + initial) d'un numéro saisi. */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function isEmailLike(input: string): boolean {
  return input.includes("@");
}

/** Convertit un numéro de téléphone normalisé en email interne unique. */
export function phoneToSyntheticEmail(phone: string): string {
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  return `${digitsOnly}@${PHONE_EMAIL_DOMAIN}`;
}

/**
 * Accepte indifféremment un email réel ou un numéro de téléphone et
 * renvoie toujours l'email à utiliser pour l'appel à Supabase Auth —
 * conserve la compatibilité avec les comptes déjà créés par email.
 */
export function resolveAuthEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (isEmailLike(trimmed)) return trimmed;
  return phoneToSyntheticEmail(normalizePhone(trimmed));
}
