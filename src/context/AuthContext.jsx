import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
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
// AUTH CONTEXT
// =========================================================

const AuthContext =
  createContext(null);


// =========================================================
// DEFAULT PROFILE
// =========================================================

const createFallbackProfile = (
  user
) => {
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

const applyTheme = (
  theme
) => {
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
  // =======================================================
  // FIREBASE USER
  // =======================================================

  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState(null);


  // =======================================================
  // FIRESTORE PROFILE
  // =======================================================

  const [
    profile,
    setProfile,
  ] = useState(null);


  // =======================================================
  // PROFILE LOADING
  // =======================================================

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
  // REAL ONLINE STATUS
  // =======================================================

  const [
    isOnline,
    setIsOnline,
  ] = useState(false);


  const [
    onlineStatus,
    setOnlineStatus,
  ] = useState(false);


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
      console.warn(
        "Realtime Database is not initialized."
      );

      setIsOnline(false);
      setOnlineStatus(false);

      return undefined;
    }


    const uid =
      firebaseUser.uid;


    // =====================================================
    // CONNECTION REFERENCE
    //
    // Firebase tells us whether THIS browser is connected
    // to Realtime Database.
    // =====================================================

    const connectedRef =
      ref(
        realtimeDb,
        ".info/connected"
      );


    // =====================================================
    // USER PRESENCE REFERENCE
    //
    // /presence/{uid}
    // =====================================================

    const presenceRef =
      ref(
        realtimeDb,
        `presence/${uid}`
      );


    // =====================================================
    // LISTEN FOR FIREBASE CONNECTION
    // =====================================================

    const unsubscribeConnection =
      onValue(
        connectedRef,
        async (snapshot) => {
          const connected =
            snapshot.val() === true;


          // =================================================
          // NOT CONNECTED
          // =================================================

          if (!connected) {
            setIsOnline(false);

            return;
          }


          // =================================================
          // CONNECTED
          // =================================================

          try {
            // -----------------------------------------------
            // When connection disappears, Firebase will
            // automatically mark this user offline.
            // -----------------------------------------------

            await onDisconnect(
              presenceRef
            ).set({
              online: false,

              lastSeen:
                rtdbServerTimestamp(),

              uid,
            });


            // -----------------------------------------------
            // Immediately mark user ONLINE.
            // -----------------------------------------------

            await set(
              presenceRef,
              {
                online: true,

                lastSeen:
                  rtdbServerTimestamp(),

                uid,

                email:
                  firebaseUser.email ||
                  "",

                updatedAt:
                  rtdbServerTimestamp(),
              }
            );


            setIsOnline(true);

            setOnlineStatus(true);


            console.log(
              "CampusMart presence: ONLINE",
              uid
            );
          } catch (error) {
            console.error(
              "Could not update realtime presence:",
              error
            );

            setIsOnline(false);

            setOnlineStatus(false);
          }
        }
      );


    // =====================================================
    // LISTEN TO THIS USER'S PRESENCE
    // =====================================================

    const unsubscribePresence =
      onValue(
        presenceRef,
        (snapshot) => {
          const data =
            snapshot.val();


          const online =
            data?.online === true;


          setOnlineStatus(
            online
          );


          /*
           * Only consider the user actually online when
           * Firebase says the connection is active AND
           * the presence record says online.
           */
          setIsOnline(
            online
          );
        },
        (error) => {
          console.error(
            "Presence listener error:",
            error
          );

          setIsOnline(false);
          setOnlineStatus(false);
        }
      );


    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      unsubscribeConnection();

      unsubscribePresence();

      /*
       * We intentionally do NOT manually set the user
       * offline here because onDisconnect() handles actual
       * network/browser disconnects reliably.
       */
    };
  }, [
    firebaseUser?.uid,
    firebaseUser?.email,
  ]);


  // =========================================================
  // FIREBASE AUTH LISTENER
  // =========================================================

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
          // USER EXISTS
          // =================================================

          setFirebaseUser(user);


          /*
           * Start every newly authenticated account
           * in light mode while its profile loads.
           */

          setTheme("light");

          applyTheme("light");

          setThemeLoading(true);


          // =================================================
          // FALLBACK PROFILE
          // =================================================

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

            setProfileLoading(
              false
            );
          }


          // =================================================
          // LOAD FIRESTORE USER
          // =================================================

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
                  setTimeout(
                    () => {
                      reject(
                        new Error(
                          "Firestore request timed out."
                        )
                      );
                    },
                    8000
                  );
                }
              );


            const firestorePromise =
              getDoc(
                userRef
              );


            const userSnapshot =
              await Promise.race([
                firestorePromise,
                timeoutPromise,
              ]);


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


              const loadedProfile =
                {
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
                    userData.phone ||
                    "",

                  campus:
                    userData.campus ||
                    "",

                  address:
                    userData.address ||
                    "",

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


              // =============================================
              // LOAD USER THEME
              // =============================================

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


            // =================================================
            // PROFILE DOES NOT EXIST
            // =================================================

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
              setThemeLoading(
                false
              );
            }
          }
        }
      );


    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      mounted = false;

      unsubscribe();
    };
  }, []);


  // =========================================================
  // CHANGE USER THEME
  // =========================================================

  const updateTheme =
    async (
      newTheme
    ) => {
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

      setTheme(
        newTheme
      );

      applyTheme(
        newTheme
      );


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
            theme:
              newTheme,
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
        // ===================================================
        // FIREBASE USER
        // ===================================================

        firebaseUser,

        // Alias
        user:
          firebaseUser,


        // ===================================================
        // FIRESTORE PROFILE
        // ===================================================

        profile,


        // ===================================================
        // LOADING
        // ===================================================

        profileLoading,

        loading:
          profileLoading,


        // ===================================================
        // AUTHENTICATION
        // ===================================================

        isAuthenticated:
          !!firebaseUser,


        // ===================================================
        // REAL ONLINE PRESENCE
        // ===================================================

        isOnline,

        onlineStatus,


        // ===================================================
        // THEME
        // ===================================================

        theme,

        themeLoading,

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