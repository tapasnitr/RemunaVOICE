import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase"; // client firebase app

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

export const requestAndGetToken = async () => {
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
  });

  return token;
};
