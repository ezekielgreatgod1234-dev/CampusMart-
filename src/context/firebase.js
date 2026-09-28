import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCvkrye7sDBuFT3PMR2SfhteAo5FronrlY",
  authDomain: "campusmart-6f51e.firebaseapp.com",
  projectId: "campusmart-6f51e",
  storageBucket: "campusmart-6f51e.firebasestorage.app",
  messagingSenderId: "951479651923",
  appId: "1:951479651923:web:b83fd9ec9f399a4570c0a6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

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

export default app;