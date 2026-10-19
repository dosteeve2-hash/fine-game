"use client";

import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
let listening = false;

function emit() {
  for (const listener of listeners) listener();
}

/** Starts listening for Chrome's install offer as early as possible (the event fires once, soon after load). */
export function listenInstall() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferred = event as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function useInstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    listenInstall();
    const update = () => setAvailable(deferred !== null && !installed);
    update();
    setStandalone(isStandalone());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async () => {
    const event = deferred;
    if (!event) return;
    deferred = null;
    emit();
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      return;
    }
  };

  return { available, standalone, install };
}

listenInstall();
