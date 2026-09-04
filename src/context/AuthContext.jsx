import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";

import {
  auth,
  db,
  realtimeDb,
} from "./firebase";

// =========================================================
// IDLE TIMEOUT (1 hour of inactivity)
// =========================================================

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const LAST_ACTIVITY_KEY = "campusmart_last_activity";

const updateLastActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

const getLastActivity = () => {
  return Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
};

const clearLastActivity = () => {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

// =========================================================
// AUTH CONTEXT
// =========================================================

const AuthContext = createContext(null);

// =========================================================
// DEFAULT PROFILE
// =========================================================

const createFallbackProfile = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.uid,
    fullName: user.displayName || "",
    email: user.email || "",
    phone: "",
    campus: "",
    address: "",
    profileImage: null,
    role: "buyer",
  };
};

// =========================================================
// APPLY THEME
// =========================================================

const applyTheme = (theme) => {
  const root = document.documentElement;
  const body = document.body;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  body.style.backgroundColor = isDark ? "#080d18" : "#f8fafc";
  body.style.color = isDark ? "#f8fafc" : "#111827";
};

// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [themeLoading, setThemeLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);

  // =======================================================
  // TRACK USER ACTIVITY (resets idle timer)
  // =======================================================

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "visibilitychange",
    ];

    const onActivity = () => {
      if (!auth.currentUser) return;

      // Only count as activity when tab is visible
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      updateLastActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
    };
  }, []);

  // =======================================================
  // CHECK IDLE TIMEOUT EVERY 30 SECONDS
  // =======================================================

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

      const last = getLastActivity();

      // If somehow missing, start timer now
      if (!last) {
        updateLastActivity();
        return;
      }

      const inactiveFor = Date.now() - last;

      if (inactiveFor >= IDLE_TIMEOUT_MS) {
        try {
          console.log("CampusMart: idle timeout — signing out");
          clearLastActivity();
          await signOut(auth);
        } catch (error) {
          console.error("Idle logout failed:", error);
        }
      }
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  // =======================================================
  // REALTIME DATABASE PRESENCE
  // =======================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setIsOnline(false);
      setOnlineStatus(false);
      return undefined;
    }

    if (!realtimeDb) {
      console.warn("Realtime Database is not initialized.");
      setIsOnline(false);
      setOnlineStatus(false);
      return undefined;
    }

    const uid = firebaseUser.uid;
    const connectedRef = ref(realtimeDb, ".info/connected");
    const presenceRef = ref(realtimeDb, `presence/${uid}`);

    const unsubscribeConnection = onValue(
      connectedRef,
      async (snapshot) => {
        const connected = snapshot.val() === true;

        if (!connected) {
          setIsOnline(false);
          return;
        }

        try {
          await onDisconnect(presenceRef).set({
            online: false,
            lastSeen: rtdbServerTimestamp(),
            uid,
          });

          await set(presenceRef, {
            online: true,
            lastSeen: rtdbServerTimestamp(),
            uid,
            email: firebaseUser.email || "",
            updatedAt: rtdbServerTimestamp(),
          });

          setIsOnline(true);
          setOnlineStatus(true);

          console.log("CampusMart presence: ONLINE", uid);
        } catch (error) {
          console.error("Could not update realtime presence:", error);
          setIsOnline(false);
          setOnlineStatus(false);
        }
      }
    );

    const unsubscribePresence = onValue(
      presenceRef,
      (snapshot) => {
        const data = snapshot.val();
        const online = data?.online === true;

        setOnlineStatus(online);
        setIsOnline(online);
      },
      (error) => {
        console.error("Presence listener error:", error);
        setIsOnline(false);
        setOnlineStatus(false);
      }
    );

    return () => {
      unsubscribeConnection();
      unsubscribePresence();
    };
  }, [firebaseUser?.uid, firebaseUser?.email]);

  // =========================================================
  // FIREBASE AUTH LISTENER
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      console.log("Firebase auth state:", user ? user.email : "No user");

      // =================================================
      // NO USER
      // =================================================

      if (!user) {
        clearLastActivity();

        setFirebaseUser(null);
        setProfile(null);
        setTheme("light");
        applyTheme("light");
        setIsOnline(false);
        setOnlineStatus(false);

        if (mounted) {
          setProfileLoading(false);
          setThemeLoading(false);
        }

        return;
      }

      // =================================================
      // USER EXISTS — start / keep activity marker
      // =================================================

      updateLastActivity();
      setFirebaseUser(user);

      setTheme("light");
      applyTheme("light");
      setThemeLoading(true);

      const fallbackProfile = createFallbackProfile(user);

      if (mounted) {
        setProfile(fallbackProfile);
        setProfileLoading(false);
      }

      // =================================================
      // LOAD FIRESTORE USER
      // =================================================

      try {
        const userRef = doc(db, "users", user.uid);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Firestore request timed out."));
          }, 8000);
        });

        const firestorePromise = getDoc(userRef);

        const userSnapshot = await Promise.race([
          firestorePromise,
          timeoutPromise,
        ]);

        if (!mounted) return;

        if (userSnapshot && userSnapshot.exists()) {
          const userData = userSnapshot.data();

          const loadedProfile = {
            id: user.uid,
            fullName: userData.fullName || user.displayName || "",
            email: userData.email || user.email || "",
            phone: userData.phone || "",
            campus: userData.campus || "",
            address: userData.address || "",
            profileImage: userData.profileImage || null,
            role: userData.role || "buyer",
            ...userData,
            id: user.uid,
          };

          setProfile(loadedProfile);

          console.log("CampusMart profile loaded:", loadedProfile);

          const savedTheme = userData.theme === "dark" ? "dark" : "light";

          setTheme(savedTheme);
          applyTheme(savedTheme);

          console.log(
            "CampusMart theme loaded:",
            savedTheme,
            "for user:",
            user.uid
          );
        } else {
          console.warn("No Firestore profile found for:", user.uid);
          setTheme("light");
          applyTheme("light");
        }
      } catch (error) {
        console.error("Error loading Firestore user profile:", error);

        if (mounted) {
          setProfile(fallbackProfile);
          setTheme("light");
          applyTheme("light");
        }
      } finally {
        if (mounted) {
          setThemeLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // =========================================================
  // LOGOUT (use this from sidebar Logout buttons)
  // =========================================================

  const logout = async () => {
    try {
      clearLastActivity();
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // =========================================================
  // CHANGE USER THEME
  // =========================================================

  const updateTheme = async (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark") {
      return;
    }

    if (!firebaseUser) {
      return;
    }

    setTheme(newTheme);
    applyTheme(newTheme);

    try {
      const userRef = doc(db, "users", firebaseUser.uid);

      await setDoc(
        userRef,
        {
          theme: newTheme,
        },
        {
          merge: true,
        }
      );

      console.log("Theme saved:", newTheme, "for user:", firebaseUser.uid);
    } catch (error) {
      console.error("Could not save theme:", error);
    }
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: firebaseUser,
        profile,
        profileLoading,
        loading: profileLoading,
        isAuthenticated: !!firebaseUser,
        isOnline,
        onlineStatus,
        theme,
        themeLoading,
        updateTheme,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// CUSTOM AUTH HOOK
// =========================================================

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;