import {
  useEffect,
  useState,
} from "react";

import {
  onValue,
  ref,
} from "firebase/database";

import {
  realtimeDb,
} from "../context/firebase";


// =====================================================
// REAL ONLINE USERS
// =====================================================
//
// Returns:
//
// {
//   USER_ID_1: true,
//   USER_ID_2: false,
//   USER_ID_3: true
// }
//
// A user is online if they have at least one active
// Realtime Database connection.
// =====================================================

function useOnlineUsers(
  userIds = []
) {
  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState({});

  useEffect(() => {
    const uniqueIds = [
      ...new Set(
        userIds
          .filter(Boolean)
          .map(String)
      ),
    ];

    if (
      uniqueIds.length === 0
    ) {
      setOnlineUsers({});
      return undefined;
    }

    const unsubscribers = [];

    uniqueIds.forEach(
      (uid) => {
        const connectionsRef =
          ref(
            realtimeDb,
            `status/${uid}/connections`
          );

        const unsubscribe =
          onValue(
            connectionsRef,
            (snapshot) => {
              const connections =
                snapshot.val();

              const isOnline =
                !!connections &&
                Object.keys(
                  connections
                ).length > 0;

              setOnlineUsers(
                (previous) => ({
                  ...previous,
                  [uid]: isOnline,
                })
              );
            },
            (error) => {
              console.error(
                `Presence listener error for ${uid}:`,
                error
              );

              setOnlineUsers(
                (previous) => ({
                  ...previous,
                  [uid]: false,
                })
              );
            }
          );

        unsubscribers.push(
          unsubscribe
        );
      }
    );

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [
    JSON.stringify(
      [...new Set(
        userIds
          .filter(Boolean)
          .map(String)
      )].sort()
    ),
  ]);

  return onlineUsers;
}

export default useOnlineUsers;