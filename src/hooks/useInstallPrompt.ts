import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Expose l'installation PWA (icône sur l'écran d'accueil).
 * - Android/Chrome : capture l'évènement `beforeinstallprompt` et permet
 *   de le déclencher depuis un bouton normal de l'app.
 * - iOS/Safari : cet évènement n'existe pas — `canPromptInstall` reste
 *   `false` et `isIos` permet d'afficher l'instruction manuelle à la
 *   place ("Partager -> Sur l'écran d'accueil").
 * - Si l'app tourne déjà en mode installé (standalone), les deux
 *   restent `false`/le bouton n'a pas lieu d'être proposé.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true,
    );

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return {
    canPromptInstall: !!deferredPrompt,
    isIos,
    isStandalone,
    promptInstall,
  };
}
