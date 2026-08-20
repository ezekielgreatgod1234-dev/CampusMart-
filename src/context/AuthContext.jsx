import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";



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

    fullName:
      user.displayName || "",

    email:
      user.email || "",

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
  const root =
    document.documentElement;

  const body =
    document.body;

  const isDark =
    theme === "dark";

  root.classList.toggle(
    "dark",
    isDark
  );

  root.style.colorScheme =
    isDark
      ? "dark"
      : "light";

  body.style.backgroundColor =
    isDark
      ? "#080d18"
      : "#f8fafc";

  body.style.color =
    isDark
      ? "#f8fafc"
      : "#111827";
};

// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({
  children,
}) {
  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  // =======================================================
  // THEME
  // =======================================================

  const [
    theme,
    setTheme,
  ] = useState("light");

  const [
    themeLoading,
    setThemeLoading,
  ] = useState(true);

  // =======================================================
  // FIREBASE AUTH LISTENER
  // =======================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!mounted) {
            return;
          }

          console.log(
            "Firebase auth state:",
            user
              ? user.email
              : "No user"
          );

          // ===============================================
          // NO USER
          // ===============================================

          if (!user) {
            setFirebaseUser(null);

            setProfile(null);

            setTheme("light");

            applyTheme("light");

            if (mounted) {
              setProfileLoading(false);

              setThemeLoading(false);
            }

            return;
          }

          // ===============================================
          // USER EXISTS
          // ===============================================

          setFirebaseUser(user);

          /*
           * Start every newly authenticated account
           * in light mode while its profile loads.
           */

          setTheme("light");

          applyTheme("light");

          setThemeLoading(true);

          // ===============================================
          // FALLBACK PROFILE
          // ===============================================

          const fallbackProfile =
            createFallbackProfile(
              user
            );

          if (mounted) {
            setProfile(
              fallbackProfile
            );

            /*
             * Authentication itself has completed.
             */

            setProfileLoading(false);
          }

          // ===============================================
          // LOAD FIRESTORE USER
          // ===============================================

          try {
            const userRef =
              doc(
                db,
                "users",
                user.uid
              );

            /*
             * Prevent Firestore from
             * hanging forever.
             */

            const timeoutPromise =
              new Promise(
                (_, reject) => {
                  setTimeout(() => {
                    reject(
                      new Error(
                        "Firestore request timed out."
                      )
                    );
                  }, 8000);
                }
              );

            const firestorePromise =
              getDoc(userRef);

            const userSnapshot =
              await Promise.race([
                firestorePromise,
                timeoutPromise,
              ]);

            if (!mounted) {
              return;
            }

            // =============================================
            // PROFILE EXISTS
            // =============================================

            if (
              userSnapshot &&
              userSnapshot.exists()
            ) {
              const userData =
                userSnapshot.data();

              const loadedProfile = {
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

                /*
                 * Firebase UID always wins.
                 */

                id: user.uid,
              };

              setProfile(
                loadedProfile
              );

              console.log(
                "CampusMart profile loaded:",
                loadedProfile
              );

              // =========================================
              // LOAD USER THEME
              // =========================================

              const savedTheme =
                userData.theme ===
                "dark"
                  ? "dark"
                  : "light";

              setTheme(
                savedTheme
              );

              applyTheme(
                savedTheme
              );

              console.log(
                "CampusMart theme loaded:",
                savedTheme,
                "for user:",
                user.uid
              );
            }

            // =============================================
            // PROFILE DOES NOT EXIST
            // =============================================

            else {
              console.warn(
                "No Firestore profile found for:",
                user.uid
              );

              setTheme("light");

              applyTheme("light");
            }
          } catch (error) {
            console.error(
              "Error loading Firestore user profile:",
              error
            );

            /*
             * Do NOT log the user out if
             * Firestore fails.
             */

            if (mounted) {
              setProfile(
                fallbackProfile
              );

              setTheme("light");

              applyTheme("light");
            }
          } finally {
            if (mounted) {
              setThemeLoading(false);
            }
          }
        }
      );

    // ===============================================
    // CLEANUP
    // ===============================================

    return () => {
      mounted = false;

      unsubscribe();
    };
  }, []);

  // =========================================================
  // CHANGE USER THEME
  // =========================================================

  const updateTheme =
    async (newTheme) => {
      /*
       * Only allow valid themes.
       */

      if (
        newTheme !== "light" &&
        newTheme !== "dark"
      ) {
        return;
      }

      /*
       * User must be logged in.
       */

      if (!firebaseUser) {
        return;
      }

      /*
       * Apply immediately.
       */

      setTheme(newTheme);

      applyTheme(newTheme);

      try {
        const userRef =
          doc(
            db,
            "users",
            firebaseUser.uid
          );

        await setDoc(
          userRef,
          {
            theme: newTheme,
          },
          {
            merge: true,
          }
        );

        console.log(
          "Theme saved:",
          newTheme,
          "for user:",
          firebaseUser.uid
        );
      } catch (error) {
        console.error(
          "Could not save theme:",
          error
        );
      }
    };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        // Firebase user
        firebaseUser,

        // Alias
        user: firebaseUser,

        // Firestore profile
        profile,

        // Loading
        profileLoading,

        loading:
          profileLoading,

        // Authentication
        isAuthenticated:
          !!firebaseUser,

        // Theme
        theme,

        // Theme loading
        themeLoading,

        // Theme updater
        updateTheme,
      }}
    >
      {/* ===================================================
          GLOBAL INTERNET MONITOR
          
          IMPORTANT:
          This is outside App's Routes.

          Therefore it stays mounted while navigating
          through every CampusMart page.
      =================================================== */}

      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// CUSTOM AUTH HOOK
// =========================================================

export function useAuth() {
  return useContext(
    AuthContext
  );
}

// =========================================================
// DEFAULT EXPORT
// =========================================================

export default AuthContext;