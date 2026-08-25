import {
  useEffect,
} from "react";

import {
  onValue,
  onDisconnect,
  push,
  ref,
  remove,
  set,
  serverTimestamp,
} from "firebase/database";

import {
  realtimeDb,
} from "../context/firebase";

import {
  useAuth,
} from "../context/AuthContext";


// =====================================================
// REAL-TIME PRESENCE
// =====================================================
//
// Each browser/tab gets its own connection:
//
// status
//   └── USER_ID
//       └── connections
//           ├── CONNECTION_1
//           ├── CONNECTION_2
//           └── CONNECTION_3
//
// A user is online when they have at least one
// active connection.
//
// This makes multiple browser tabs work correctly.
// =====================================================

function usePresence() {
  const {
    firebaseUser,
  } = useAuth();

  useEffect(() => {
    const uid =
      firebaseUser?.uid;

    if (!uid) {
      return undefined;
    }

    const connectionsRef =
      ref(
        realtimeDb,
        `status/${uid}/connections`
      );

    const connectedRef =
      ref(
        realtimeDb,
        ".info/connected"
      );

    let connectionRef = null;

    const unsubscribe =
      onValue(
        connectedRef,
        async (snapshot) => {
          const connected =
            snapshot.val() === true;

          if (!connected) {
            return;
          }

          try {
            // =================================================
            // CREATE A UNIQUE CONNECTION
            // =================================================

            connectionRef =
              push(
                connectionsRef
              );

            // =================================================
            // IMPORTANT:
            //
            // Tell Firebase to remove this connection when
            // this browser/tab disconnects.
            //
            // This handles:
            // - closing tab
            // - closing browser
            // - internet loss
            // - browser crash
            // - laptop going offline
            // =================================================

            await onDisconnect(
              connectionRef
            ).remove();

            // =================================================
            // MARK THIS CONNECTION ONLINE
            // =================================================

            await set(
              connectionRef,
              {
                online: true,
                lastChanged:
                  serverTimestamp(),
              }
            );

          } catch (error) {
            console.error(
              "Presence connection error:",
              error
            );
          }
        }
      );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      unsubscribe();

      if (connectionRef) {
        remove(
          connectionRef
        ).catch(() => {});
      }
    };
  }, [
    firebaseUser?.uid,
  ]);
}

export default usePresence;