import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, PartyPopper, X } from "lucide-react";
import {
  generateWhatsAppInviteLink,
  generateWhatsAppInviteMessage,
} from "../lib/whatsapp";

type EventCreatedSuccessModalProps = {
  eventTitle: string;
  onClose: () => void;
};

/**
 * Affichée juste après la création d'un événement/tontine : incite le
 * trésorier à partager immédiatement le lien Libota sur le groupe
 * WhatsApp de sa famille — le meilleur moment pour le faire, pendant
 * qu'il est déjà en train d'organiser la collecte.
 */
export default function EventCreatedSuccessModal({
  eventTitle,
  onClose,
}: EventCreatedSuccessModalProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Libota",
          text: generateWhatsAppInviteMessage(),
          url: "https://libota.app",
        })
        .catch(() => {});
      return;
    }
    window.open(generateWhatsAppInviteLink(), "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--overlay)] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="card glow-panel relative w-full max-w-sm overflow-hidden p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="icon-btn absolute right-3 top-3 h-8 w-8"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <PartyPopper size={26} />
          </div>

          <h2 className="font-display mt-4 text-xl font-bold text-[var(--text)]">
            « {eventTitle} » est créé !
          </h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Prévenez toute la famille tout de suite pour que personne ne
            rate la collecte.
          </p>

          <button
            type="button"
            onClick={handleShare}
            className="btn-primary mt-5 w-full"
          >
            <MessageCircle size={16} />
            Partager sur WhatsApp
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost mt-1 w-full"
          >
            Plus tard
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
