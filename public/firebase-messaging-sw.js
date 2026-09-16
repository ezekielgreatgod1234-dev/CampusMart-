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

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "CampusMart";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new update";

  const options = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.data?.type || "campusmart",
    renotify: true,
    vibrate: [120, 80, 120],
    data: payload.data || {},
    requireInteraction: false,
  };

  return self.registration.showNotification(title, options);
});

// Open app when user taps the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path || "/";
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if (client.navigate) client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});