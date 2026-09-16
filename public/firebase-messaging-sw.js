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
  const title = payload.notification?.title || "CampusMart";
  const options = {
    body: payload.notification?.body || "You have a new update",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});