/* public/firebase-messaging-sw.js */
/* eslint-disable no-undef */
/* global importScripts, firebase */

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCvkrye7sDBuFT3PMR2SfhteAo5FronrlY",
  authDomain: "campusmart-6f51e.firebaseapp.com",
  projectId: "campusmart-6f51e",
  storageBucket: "campusmart-6f51e.firebasestorage.app",
  messagingSenderId: "951479651923",
  appId: "1:951479651923:web:b83fd9ec9f399a4570c0a6",
});

const messaging = firebase.messaging();

function absUrl(path) {
  try {
    return new URL(path, self.location.origin).href;
  } catch {
    return path;
  }
}

messaging.onBackgroundMessage((payload) => {
  const title =
    (payload.notification && payload.notification.title) ||
    (payload.data && payload.data.title) ||
    "CampusMart";

  const body =
    (payload.notification && payload.notification.body) ||
    (payload.data && payload.data.body) ||
    "You have a new update";

  const data = payload.data || {};

  const options = {
    body: String(body),
    // Mobile browsers often fail with relative icon paths
    icon: absUrl("/pwa-192x192.png"),
    badge: absUrl("/pwa-192x192.png"),
    image: payload.notification && payload.notification.image
      ? payload.notification.image
      : undefined,
    tag: String(data.type || data.tag || "campusmart"),
    renotify: true,
    vibrate: [200, 100, 200],
    data: data,
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(String(title), options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const path =
    (event.notification.data && event.notification.data.path) || "/";
  let url;
  try {
    url = new URL(path, self.location.origin).href;
  } catch {
    url = self.location.origin + "/";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (
            client.url &&
            client.url.indexOf(self.location.origin) === 0 &&
            "focus" in client
          ) {
            client.focus();
            if ("navigate" in client) {
              try {
                client.navigate(url);
              } catch (_) {}
            }
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Keep SW alive / claim clients so mobile actually uses this worker
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});