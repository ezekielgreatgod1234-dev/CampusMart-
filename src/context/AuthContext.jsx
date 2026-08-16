import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

// =========================================================
// AUTH CONTEXT
// =========================================================

const AuthContext = createContext(null);

// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [profileLoading, setProfileLoading] =
    useState(true);

  // =======================================================
  // LISTEN TO FIREBASE AUTH STATE
  // =======================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        // Firebase is checking/changing authentication
        setProfileLoading(true);

        setFirebaseUser(user);

        // =================================================
        // NO USER
        // =================================================

        if (!user) {
          setProfile(null);
          setProfileLoading(false);
          return;
        }

        // =================================================
        // LOAD FIRESTORE PROFILE
        // =================================================

        try {
          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnapshot = await getDoc(
            userRef
          );

          if (userSnapshot.exists()) {
            const userData =
              userSnapshot.data();

            setProfile({
              id: user.uid,

              fullName:
                userData.fullName ||
                user.displayName ||
                "",

              email:
                userData.email ||
                user.email ||
                "",

              phone:
                userData.phone || "",

              campus:
                userData.campus || "",

              address:
                userData.address || "",

              profileImage:
                userData.profileImage ||
                null,

              role:
                userData.role ||
                "buyer",

              ...userData,
            });
          } else {
            // =================================================
            // FIRESTORE PROFILE DOES NOT EXIST
            // =================================================

            setProfile({
              id: user.uid,

              fullName:
                user.displayName || "",

              email:
                user.email || "",

              phone: "",

              campus: "",

              address: "",

              profileImage: null,

              role: "buyer",
            });
          }
        } catch (error) {
          console.error(
            "Error loading user profile:",
            error
          );

          // Firebase account still exists,
          // so provide a fallback profile.

          setProfile({
            id: user.uid,

            fullName:
              user.displayName || "",

            email:
              user.email || "",

            phone: "",

            campus: "",

            address: "",

            profileImage: null,

            role: "buyer",
          });
        } finally {
          setProfileLoading(false);
        }
      }
    );

    // Cleanup Firebase listener
    return () => unsubscribe();
  }, []);

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        profileLoading,
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