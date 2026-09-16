import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging, isSupported } from "firebase/messaging";

// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyCvkrye7sDBuFT3PMR2SfhteAo5FronrlY",
  authDomain: "campusmart-6f51e.firebaseapp.com",
  projectId: "campusmart-6f51e",
  storageBucket: "campusmart-6f51e.firebasestorage.app",
  messagingSenderId: "951479651923",
  appId: "1:951479651923:web:b83fd9ec9f399a4570c0a6",
};

// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

// =====================================================
// AUTHENTICATION
// =====================================================

export const auth = getAuth(app);

// =====================================================
// FIRESTORE
// =====================================================

export const db = getFirestore(app);

// =====================================================
// REALTIME DATABASE
// =====================================================

export const realtimeDb = getDatabase(app);

// =====================================================
// CLOUD MESSAGING (push notifications)
// =====================================================

let messaging = null;

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (!supported) return null;
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.warn("Firebase Messaging not available:", err);
    return null;
  }
}

// =====================================================
// EXPORT APP
// =====================================================

export default app;