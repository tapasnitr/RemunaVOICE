"use client";

import { useEffect } from "react";

export default function ClientFCMSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => console.log("✅ FCM Service Worker registered"))
        .catch((err) =>
          console.error("❌ FCM Service Worker failed", err)
        );
    }
  }, []);

  return null; // 👈 nothing rendered
}
