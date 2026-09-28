/**
 * Nettoie un numéro de téléphone pour le format attendu par wa.me
 * (chiffres uniquement, sans espaces, +, tirets ou parenthèses).
 */
function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

type ReminderParams = {
  phone: string;
  firstName: string;
  eventName: string;
  amount: number;
};

/**
 * Génère le lien wa.me d'un rappel de cotisation, avec systématiquement
 * l'accroche virale invitant le destinataire à découvrir Libota — le
 * cœur de la mécanique d'acquisition à 0 € : chaque rappel envoyé par
 * un trésorier est aussi une invitation.
 */
export function generateWhatsAppReminderLink({
  phone,
  firstName,
  eventName,
  amount,
}: ReminderParams): string {
  const message = `Bonjour ${firstName} ! 👋
Rappel pour ta cotisation : ${eventName} (Montant : ${amount.toLocaleString()} FCFA).
───────────────
💡 Envie de gérer la caisse de ta propre famille, tontine ou réunion sans prise de tête ?
👉 Découvre Libota gratuitement ici : https://libota.app`;

  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

/** Message d'invitation générique (bouton de partage, modale de succès). */
export function generateWhatsAppInviteMessage(): string {
  return `Salut ! 👋
Je gère les cotisations et les événements de la famille avec *Libota* — fini les carnets et les calculs à la main, tout est suivi en temps réel et c'est gratuit.
👉 À découvrir ici : https://libota.app`;
}

export function generateWhatsAppInviteLink(): string {
  return `https://wa.me/?text=${encodeURIComponent(generateWhatsAppInviteMessage())}`;
}
