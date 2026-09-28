/**
 * Traduit un message d'erreur technique (Supabase / PostgREST / réseau)
 * en un message clair, présentable à l'utilisateur. On n'affiche jamais
 * le message brut du backend côté front — seulement une phrase compréhensible,
 * avec un message générique par défaut si le cas n'est pas reconnu.
 */
export function getFriendlyErrorMessage(rawMessage: string | null | undefined): string {
  const message = (rawMessage ?? "").toLowerCase();

  if (!message) {
    return "Une erreur est survenue. Réessayez dans quelques instants.";
  }
  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "Cet élément existe déjà.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
  }
  if (message.includes("foreign key constraint")) {
    return "Impossible d'enregistrer : un élément lié est introuvable ou a été supprimé.";
  }
  if (message.includes("json object requested")) {
    return "Aucune donnée trouvée pour cette demande.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout")
  ) {
    return "Problème de connexion. Vérifiez votre réseau et réessayez.";
  }
  if (message.includes("check constraint")) {
    return "Une des valeurs saisies n'est pas valide.";
  }

  return "Une erreur est survenue. Réessayez dans quelques instants.";
}
