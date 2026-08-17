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
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  /*
    This tells the application whether Firebase has
    finished checking who is logged in.

    IMPORTANT:
    We do NOT allow Firestore profile loading to keep
    the entire application stuck forever.
  */
  const [profileLoading, setProfileLoading] =
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
          // UPDATE FIREBASE USER
          // =================================================

          setFirebaseUser(user);

          // =================================================
          // NO USER
          // =================================================

          if (!user) {
            setProfile(null);

            if (mounted) {
              setProfileLoading(false);
            }

            return;
          }

          /*
            IMPORTANT FIX

            The Firebase authentication state is already
            known at this point.

            We don't want the whole application to remain
            stuck on the loading screen just because the
            Firestore profile request is slow.

            Therefore, allow the application to continue.
          */

          if (mounted) {
            setProfileLoading(false);
          }

          // =================================================
          // FALLBACK PROFILE
          // =================================================

          const fallbackProfile =
            createFallbackProfile(user);

          /*
            Set a temporary profile immediately.

            If Firestore loads successfully, this will be
            replaced with the real profile.
          */

          if (mounted) {
            setProfile(
              fallbackProfile
            );
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

            /*
              Prevent Firestore from keeping the profile
              request hanging forever.

              If Firestore does not respond within 8 seconds,
              we continue with the fallback Firebase profile.
            */

            const timeoutPromise =
              new Promise(
                (_, reject) => {
                  setTimeout(() => {
                    reject(
                      new Error(
                        "Firestore profile request timed out."
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

            // =================================================
            // COMPONENT UNMOUNTED
            // =================================================

            if (!mounted) {
              return;
            }

            // =================================================
            // PROFILE EXISTS
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
                  Make sure the Firebase UID is
                  always available even if userData
                  contains an id field.
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
                We already created a fallback profile
                above, so there is nothing else to do.
              */
            }
          } catch (error) {
            console.error(
              "Error loading Firestore user profile:",
              error
            );

            /*
              IMPORTANT:

              Do NOT log the user out because the
              Firestore profile failed.

              The Firebase account is still valid.
            */

            if (mounted) {
              setProfile(
                fallbackProfile
              );
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
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        /*
          Original name
        */
        firebaseUser,

        /*
          Alias used by Settings and other pages.
        */
        user: firebaseUser,

        /*
          CampusMart Firestore profile
        */
        profile,

        /*
          Authentication/profile loading state
        */
        profileLoading,

        /*
          Useful alias if another component expects
          "loading".
        */
        loading: profileLoading,

        /*
          Convenient boolean
        */
        isAuthenticated:
          !!firebaseUser,
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