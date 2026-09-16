import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getFirebaseMessaging } from "../context/firebase";

/**
 * Enable push on THIS device and merge token into users/{uid}.fcmTokens[]
 * so laptop + phone can both receive notifications.
 */
export async function enableCampusMartPush(userId) {
  if (!userId) {
    return { ok: false, error: "Not logged in" };
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, error: "Notifications not supported on this browser" };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, error: "Permission not granted" };
  }

  if (!("serviceWorker" in navigator)) {
    return { ok: false, error: "Service workers not supported on this browser" };
  }

  // IMPORTANT: capture the exact registration for firebase-messaging-sw.js
  // and hand it to getToken() explicitly below. If we instead rely on
  // navigator.serviceWorker.ready, we get back whichever service worker
  // happens to control this page's scope — on many phones (especially if
  // the app is installed as a PWA or has any other SW registered at "/"),
  // that ends up being a *different* service worker than
  // firebase-messaging-sw.js. Desktop testing tends to only ever have the
  // one SW registered, so this bug hides there and only shows up on mobile.
  let registration;
  try {
    registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { updateViaCache: "none" } // don't let mobile browsers serve a stale cached SW
    );
    // Force a check for a newer firebase-messaging-sw.js on every enable —
    // mobile browsers are much more aggressive about caching the old one.
    await registration.update().catch(() => {});
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.error("SW register failed:", err);
    return { ok: false, error: "Could not register the notification service worker" };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return { ok: false, error: "Messaging not supported" };
  }

  const vapidKey =
    import.meta.env.VITE_FIREBASE_VAPID_KEY ||
    import.meta.env.VITE_VAPID_KEY ||
    "";

  if (!vapidKey) {
    console.warn("VITE_FIREBASE_VAPID_KEY is missing");
  }

  let token;
  try {
    token = await getToken(messaging, {
      ...(vapidKey ? { vapidKey } : {}),
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error("getToken failed:", err?.code || err?.message);
    return {
      ok: false,
      error:
        err?.code === "messaging/permission-blocked"
          ? "Notifications are blocked for this site at the OS/browser level"
          : err?.message || "Could not get FCM token",
    };
  }

  if (!token) {
    return { ok: false, error: "Could not get FCM token" };
  }

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() || {} : {};

  const existing = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
  const legacy = data.fcmToken ? [String(data.fcmToken)] : [];
  const merged = Array.from(
    new Set([...existing, ...legacy, token].map((t) => String(t || "").trim()).filter(Boolean))
  );

  await setDoc(
    userRef,
    {
      fcmToken: token, // latest device (legacy field)
      fcmTokens: merged, // all devices
      notificationsEnabled: true,
      fcmTokenUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, token, deviceCount: merged.length };
}

export async function disableCampusMartPush(userId) {
  if (!userId) return { ok: false };

  // Remove only this device's token if possible; otherwise clear all
  try {
    const messaging = await getFirebaseMessaging();
    let currentToken = null;
    if (messaging) {
      try {
        const vapidKey =
          import.meta.env.VITE_FIREBASE_VAPID_KEY ||
          import.meta.env.VITE_VAPID_KEY ||
          "";
        const registration = await navigator.serviceWorker.getRegistration(
          "/firebase-messaging-sw.js"
        );
        currentToken = await getToken(messaging, {
          ...(vapidKey ? { vapidKey } : {}),
          ...(registration ? { serviceWorkerRegistration: registration } : {}),
        });
      } catch (_) {}
    }

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() || {} : {};
    let tokens = Array.isArray(data.fcmTokens) ? [...data.fcmTokens] : [];
    if (data.fcmToken) tokens.push(data.fcmToken);
    tokens = Array.from(new Set(tokens.map(String).filter(Boolean)));

    if (currentToken) {
      tokens = tokens.filter((t) => t !== currentToken);
    } else {
      tokens = [];
    }

    await setDoc(
      userRef,
      {
        fcmTokens: tokens,
        fcmToken: tokens[0] || null,
        notificationsEnabled: tokens.length > 0,
        fcmTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}