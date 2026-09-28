import { Share2 } from "lucide-react";
import {
  generateWhatsAppInviteLink,
  generateWhatsAppInviteMessage,
} from "../lib/whatsapp";

/**
 * Bouton de partage global (header). Utilise l'API native
 * `navigator.share` quand disponible (mobile, la plupart des
 * navigateurs modernes) pour laisser le système proposer WhatsApp,
 * SMS, etc. ; sinon, ouvre directement WhatsApp Web avec le message
 * d'invitation pré-rempli.
 */
export default function HeaderShareButton() {
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Libota",
          text: generateWhatsAppInviteMessage(),
          url: "https://libota.app",
        })
        .catch(() => {
          // L'utilisateur a annulé le partage — rien à faire.
        });
      return;
    }
    window.open(generateWhatsAppInviteLink(), "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="icon-btn"
      aria-label="Inviter sur WhatsApp"
      title="Inviter sur WhatsApp"
    >
      <Share2 size={17} />
    </button>
  );
}
