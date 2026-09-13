import { useEffect, useState } from "react";

/** Detects PWA installability and returns { installable, isInstalled, prompt } */
export function usePWAInstall() {
  const [deferred, setDeferred] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => { setIsInstalled(true); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const prompt = async () => {
    if (!deferred) return { outcome: "unavailable" };
    deferred.prompt();
    const res = await deferred.userChoice;
    setDeferred(null);
    return res;
  };

  return { installable: !!deferred, isInstalled, prompt };
}

/** Detect iOS (uses different install flow — Add to Home Screen) */
export const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};
