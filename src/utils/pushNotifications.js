import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getFirebaseMessaging } from "../context/firebase";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/**
 * Wait until a service worker registration is active.
 */
async function waitForActiveWorker(registration, timeoutMs = 15000) {
  if (registration.active) return registration.active;

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    await new Promise((r) => setTimeout(r, 500));
    if (registration.active) return registration.active;
    throw new Error("Service worker did not become active");
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Service worker activation timed out"));
    }, timeoutMs);

    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        clearTimeout(timer);
        resolve(worker);
      }
      if (worker.state === "redundant") {
        clearTimeout(timer);
        reject(new Error("Service worker became redundant"));
      }
    });
  });
}

/**
 * Enable push on THIS device and merge token into users/{uid}.fcmTokens[]
 */
export async function enableCampusMartPush(userId) {
  if (!userId) {
    return { ok: false, error: "Not logged in" };
  }

  if (typeof window === "undefined") {
    return { ok: false, error: "Not in a browser" };
  }

  // iOS only supports web push when the app is installed to Home Screen
  if (isIos() && !isStandalonePwa()) {
    return {
      ok: false,
      error:
        "On iPhone/iPad: tap Share → Add to Home Screen, open CampusMart from the icon, then enable notifications again.",
    };
  }

  if (!("Notification" in window)) {
    return { ok: false, error: "Notifications not supported on this browser" };
  }

  if (!window.isSecureContext && location.hostname !== "localhost") {
    return {
      ok: false,
      error: "Notifications require HTTPS on mobile. Open the live CampusMart site.",
    };
  }

  if (!("serviceWorker" in navigator)) {
    return { ok: false, error: "Service workers not supported on this browser" };
  }

  let permission = Notification.permission;
  if (permission === "denied") {
    return {
      ok: false,
      error:
        "Notifications are blocked. Open phone Settings → Apps → Browser (or CampusMart) → Notifications → Allow.",
    };
  }
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, error: "Permission not granted" };
  }

  let registration;
  try {
    // Register FCM SW at root so it can receive pushes site-wide
    registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      {
        scope: "/",
        updateViaCache: "none",
      }
    );

    try {
      await registration.update();
    } catch (_) {}

    await waitForActiveWorker(registration);
  } catch (err) {
    console.error("SW register failed:", err);
    return {
      ok: false,
      error:
        err?.message ||
        "Could not register the notification service worker on this phone",
    };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return {
      ok: false,
      error:
        "Firebase Messaging is not supported on this browser. Try Chrome on Android, or install the app on iPhone.",
    };
  }

  const vapidKey =
    import.meta.env.VITE_FIREBASE_VAPID_KEY ||
    import.meta.env.VITE_VAPID_KEY ||
    "";

  if (!vapidKey) {
    console.warn("VITE_FIREBASE_VAPID_KEY is missing — getToken may fail");
  }

  let token;
  try {
    token = await getToken(messaging, {
      ...(vapidKey ? { vapidKey } : {}),
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error("getToken failed:", err?.code || err?.message || err);
    const code = String(err?.code || "");
    const msg = String(err?.message || "");

    if (code.includes("permission-blocked") || msg.includes("blocked")) {
      return {
        ok: false,
        error:
          "Notifications are blocked for this site. Allow them in the browser/OS settings.",
      };
    }

    return {
      ok: false,
      error: msg || "Could not get FCM token on this device",
    };
  }

  if (!token) {
    return {
      ok: false,
      error:
        "No FCM token returned. On mobile use the live HTTPS site (or installed app), allow notifications, then try again.",
    };
  }

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() || {} : {};

  const existing = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
  const legacy = data.fcmToken ? [String(data.fcmToken)] : [];
  const merged = Array.from(
    new Set(
      [...existing, ...legacy, token]
        .map((t) => String(t || "").trim())
        .filter(Boolean)
    )
  );

  await setDoc(
    userRef,
    {
      fcmToken: token,
      fcmTokens: merged,
      notificationsEnabled: true,
      fcmTokenUpdatedAt: serverTimestamp(),
      lastPushDevice: {
        userAgent: navigator.userAgent || "",
        standalone: isStandalonePwa(),
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );

  return { ok: true, token, deviceCount: merged.length };
}

export async function disableCampusMartPush(userId) {
  if (!userId) return { ok: false };

  try {
    const messaging = await getFirebaseMessaging();
    let currentToken = null;

    if (messaging) {
      try {
        const vapidKey =
          import.meta.env.VITE_FIREBASE_VAPID_KEY ||
          import.meta.env.VITE_VAPID_KEY ||
          "";
        const registration =
          (await navigator.serviceWorker.getRegistration(
            "/firebase-messaging-sw.js"
          )) ||
          (await navigator.serviceWorker.getRegistration("/"));

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