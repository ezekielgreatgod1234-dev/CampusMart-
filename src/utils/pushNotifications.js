import { getToken } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, getFirebaseMessaging } from "../context/firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Ask for notification permission, get FCM token, save on user doc.
 */
export async function enableCampusMartPush(userId) {
  if (!userId) {
    throw new Error("Not signed in");
  }

  if (!VAPID_KEY) {
    throw new Error("Missing VITE_FIREBASE_VAPID_KEY in .env");
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("Notifications are not supported on this device");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, permission };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    throw new Error("Firebase Messaging is not supported in this browser");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Could not get push token");
  }

  await setDoc(
    doc(db, "users", userId),
    {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp(),
      notificationsEnabled: true,
    },
    { merge: true }
  );

  return { ok: true, permission, token };
}