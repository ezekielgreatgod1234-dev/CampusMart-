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
  const root = document.documentElement;
  const body = document.body;

  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);

  root.style.colorScheme = isDark
    ? "dark"
    : "light";

  body.style.backgroundColor = isDark
    ? "#080d18"
    : "#f8fafc";

  body.style.color = isDark
    ? "#f8fafc"
    : "#111827";
};

// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(true);

  // =======================================================
  // THEME
  // =======================================================

  /*
    Theme belongs to the currently authenticated
    Firebase account.

    IMPORTANT:

    We do NOT use:

      localStorage.getItem("campusmart_theme")

    because that would be shared between accounts.
  */

  const [theme, setTheme] =
    useState("light");

  const [themeLoading, setThemeLoading] =
    useState(true);

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

          // =================================================
          // NO USER
          // =================================================

          if (!user) {
            setFirebaseUser(null);
            setProfile(null);

            /*
              VERY IMPORTANT:

              Whenever nobody is logged in, always return
              the application to LIGHT mode.

              This also prevents a previous user's dark
              theme from appearing on Login/Register.
            */

            setTheme("light");
            applyTheme("light");

            if (mounted) {
              setProfileLoading(false);
              setThemeLoading(false);
            }

            return;
          }

          // =================================================
          // USER EXISTS
          // =================================================

          setFirebaseUser(user);

          /*
            Immediately use light mode while we retrieve
            this specific user's saved theme.

            This prevents the previous account's theme
            from leaking into the new account.
          */

          setTheme("light");
          applyTheme("light");

          setThemeLoading(true);

          // =================================================
          // FALLBACK PROFILE
          // =================================================

          const fallbackProfile =
            createFallbackProfile(user);

          if (mounted) {
            setProfile(
              fallbackProfile
            );

            /*
              Authentication itself is already complete,
              so don't keep the entire application blocked.
            */

            setProfileLoading(false);
          }

          // =================================================
          // LOAD USER FIRESTORE DATA
          // =================================================

          try {
            const userRef = doc(
              db,
              "users",
              user.uid
            );

            /*
              Prevent Firestore from hanging forever.
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

            // =================================================
            // FIRESTORE PROFILE EXISTS
            // =================================================

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
                  Firebase UID must always win.
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

              // =============================================
              // LOAD THIS USER'S THEME
              // =============================================

              const savedTheme =
                userData.theme === "dark"
                  ? "dark"
                  : "light";

              /*
                Only this Firebase user's theme
                is applied.
              */

              setTheme(savedTheme);

              applyTheme(savedTheme);

              console.log(
                "CampusMart theme loaded:",
                savedTheme,
                "for user:",
                user.uid
              );
            }

            // =================================================
            // PROFILE DOES NOT EXIST
            // =================================================

            else {
              console.warn(
                "No Firestore profile found for:",
                user.uid
              );

              /*
                New accounts start with LIGHT mode.
              */

              setTheme("light");

              applyTheme("light");
            }
          } catch (error) {
            console.error(
              "Error loading Firestore user profile:",
              error
            );

            /*
              If Firestore fails, do NOT log the user out.

              Just use the safe default LIGHT theme.
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

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // =========================================================
  // CHANGE USER THEME
  // =========================================================

  const updateTheme = async (newTheme) => {
    /*
      Only allow the two valid themes.
    */

    if (
      newTheme !== "light" &&
      newTheme !== "dark"
    ) {
      return;
    }

    /*
      There must be a logged-in Firebase user.
    */

    if (!firebaseUser) {
      return;
    }

    /*
      Apply immediately for a fast UI response.
    */

    setTheme(newTheme);
    applyTheme(newTheme);

    try {
      const userRef = doc(
        db,
        "users",
        firebaseUser.uid
      );

      /*
        Save the theme specifically inside
        this user's Firestore document.
      */

      const { setDoc } = await import(
        "firebase/firestore"
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

        loading: profileLoading,

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