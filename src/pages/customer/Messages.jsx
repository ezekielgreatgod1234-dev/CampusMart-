import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiSearch,
  FiMessageCircle,
  FiChevronRight,
  FiMoreVertical,
  FiCheckCircle,
  FiUsers,
  FiCheck,
} from "react-icons/fi";

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../context/firebase";

import {
  useAuth,
} from "../../context/AuthContext";


function Messages({
  cartCount = 0,
  wishlist = [],
}) {
  const navigate = useNavigate();

  const {
    firebaseUser,
    profileLoading,
  } = useAuth();


  // =====================================================
  // STATE
  // =====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  // =====================================================
  // PUBLIC PROFILE STATE
  // =====================================================
  //
  // Stores:
  //
  // publicProfiles/{uid}
  //
  // Example:
  //
  // {
  //   fullName: "...",
  //   displayName: "...",
  //   profileImage: "...",
  //   photoURL: "..."
  // }
  //
  // =====================================================

  const [
    profileMap,
    setProfileMap,
  ] = useState({});


  // =====================================================
  // PRESENCE STATE
  // =====================================================

  const [
    presenceMap,
    setPresenceMap,
  ] = useState({});


  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    timestamp
  ) => {
    if (!timestamp) {
      return "";
    }

    try {
      const date =
        timestamp?.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };


  // =====================================================
  // TIMESTAMP TO MILLISECONDS
  // =====================================================

  const getTimestampMs = (
    timestamp
  ) => {
    if (!timestamp) {
      return 0;
    }

    try {
      if (
        typeof timestamp.toMillis ===
        "function"
      ) {
        return timestamp.toMillis();
      }

      if (
        typeof timestamp.toDate ===
        "function"
      ) {
        return timestamp
          .toDate()
          .getTime();
      }

      const numeric =
        Number(timestamp);

      if (
        !Number.isNaN(
          numeric
        )
      ) {
        return numeric;
      }

      const date =
        new Date(timestamp);

      return Number.isNaN(
        date.getTime()
      )
        ? 0
        : date.getTime();
    } catch {
      return 0;
    }
  };


  // =====================================================
  // GET LAST VISIBLE MESSAGE
  // =====================================================

  const getLastVisibleMessage = (
    conversation
  ) => {
    const rawMessages =
      Array.isArray(
        conversation?.messages
      )
        ? conversation.messages
        : [];

    const visibleMessages =
      rawMessages.filter(
        (message) => {
          const deletedFor =
            Array.isArray(
              message?.deletedFor
            )
              ? message.deletedFor
              : [];

          if (
            deletedFor.includes(
              firebaseUser?.uid
            )
          ) {
            return false;
          }

          if (
            message?.deletedForEveryone ===
            true
          ) {
            return false;
          }

          return true;
        }
      );

    visibleMessages.sort(
      (a, b) => {
        const aTime =
          getTimestampMs(
            a?.createdAt
          );

        const bTime =
          getTimestampMs(
            b?.createdAt
          );

        return bTime - aTime;
      }
    );

    return (
      visibleMessages[0] ||
      null
    );
  };


  // =====================================================
  // CHECK LAST MESSAGE SENDER
  // =====================================================

  const isLastMessageFromCurrentUser =
    (
      conversation,
      lastMessage
    ) => {
      if (!lastMessage) {
        return false;
      }

      const currentUid =
        firebaseUser?.uid;

      if (!currentUid) {
        return false;
      }

      if (
        lastMessage?.senderId
      ) {
        return (
          String(
            lastMessage.senderId
          ) ===
          String(
            currentUid
          )
        );
      }

      if (
        lastMessage?.userId
      ) {
        return (
          String(
            lastMessage.userId
          ) ===
          String(
            currentUid
          )
        );
      }

      if (
        lastMessage?.fromId
      ) {
        return (
          String(
            lastMessage.fromId
          ) ===
          String(
            currentUid
          )
        );
      }

      if (
        lastMessage?.sender ===
          "me" ||
        lastMessage?.sender ===
          "buyer" ||
        lastMessage?.sender ===
          "currentUser"
      ) {
        return true;
      }

      return false;
    };


  // =====================================================
  // CHECK IF OTHER USER READ LAST MESSAGE
  // =====================================================

  const isLastMessageSeenByOther =
    (
      conversation,
      lastMessage
    ) => {
      if (
        !conversation ||
        !lastMessage
      ) {
        return false;
      }

      const otherParticipantId =
        conversation?.otherParticipantId;

      if (
        !otherParticipantId
      ) {
        return false;
      }


      // =================================================
      // MESSAGE LEVEL ARRAYS
      // =================================================

      const readArrays = [
        lastMessage?.readBy,
        lastMessage?.seenBy,
        lastMessage?.lastMessageSeenBy,
        lastMessage?.readByUserIds,
        lastMessage?.seenByUserIds,
      ];

      for (
        const readArray of
          readArrays
      ) {
        if (
          Array.isArray(
            readArray
          ) &&
          readArray.some(
            (uid) =>
              String(uid) ===
              String(
                otherParticipantId
              )
          )
        ) {
          return true;
        }
      }


      // =================================================
      // MESSAGE LEVEL OBJECTS
      // =================================================

      const readObjects = [
        lastMessage?.readBy,
        lastMessage?.seenBy,
        lastMessage?.lastMessageSeenBy,
      ];

      for (
        const readObject of
          readObjects
      ) {
        if (
          readObject &&
          typeof readObject ===
            "object" &&
          !Array.isArray(
            readObject
          )
        ) {
          if (
            readObject[
              otherParticipantId
            ] === true
          ) {
            return true;
          }
        }
      }


      // =================================================
      // MESSAGE LEVEL FLAGS
      // =================================================

      if (
        lastMessage?.seen ===
          true ||
        lastMessage?.read ===
          true ||
        lastMessage?.seenAt ||
        lastMessage?.readAt
      ) {
        return true;
      }


      // =================================================
      // CONVERSATION LEVEL FLAGS
      // =================================================

      if (
        conversation?.lastMessageSeen ===
          true ||
        conversation?.seen ===
          true ||
        conversation?.seenAt ||
        conversation?.lastMessageRead ===
          true ||
        conversation?.lastMessageReadAt
      ) {
        return true;
      }


      // =================================================
      // UNREAD COUNT FALLBACK
      // =================================================

      if (
        conversation?.unreadCounts &&
        Object.prototype.hasOwnProperty.call(
          conversation.unreadCounts,
          otherParticipantId
        )
      ) {
        const otherUnread =
          Number(
            conversation
              .unreadCounts[
              otherParticipantId
            ] || 0
          );

        if (
          otherUnread === 0
        ) {
          return true;
        }
      }

      return false;
    };


  // =====================================================
  // MESSAGE CHECKS
  // =====================================================

  const MessageChecks = ({
    sentByMe,
    seenByOther,
  }) => {
    if (!sentByMe) {
      return null;
    }

    return (
      <span
        className={`
          inline-flex
          items-center
          shrink-0
          ${
            seenByOther
              ? "text-green-600"
              : "text-gray-400"
          }
        `}
        title={
          seenByOther
            ? "Seen"
            : "Sent"
        }
      >
        <FiCheck
          size={14}
          strokeWidth={3}
        />

        {seenByOther && (
          <FiCheck
            size={14}
            strokeWidth={3}
            className="-ml-[6px]"
          />
        )}
      </span>
    );
  };


  // =====================================================
  // LOAD CONVERSATIONS
  // =====================================================

  useEffect(() => {
    if (profileLoading) {
      return undefined;
    }

    if (!firebaseUser?.uid) {
      setConversations([]);
      setLoading(false);

      return undefined;
    }

    setLoading(true);

    const conversationsRef =
      collection(
        db,
        "conversations"
      );

    const conversationsQuery =
      query(
        conversationsRef,
        where(
          "participants",
          "array-contains",
          firebaseUser.uid
        )
      );

    const unsubscribe =
      onSnapshot(
        conversationsQuery,
        (snapshot) => {
          try {
            const loaded =
              snapshot.docs.map(
                (
                  conversationDoc
                ) => {
                  const data =
                    conversationDoc.data();

                  const participants =
                    Array.isArray(
                      data.participants
                    )
                      ? data.participants
                      : [];


                  // =================================================
                  // FIND OTHER USER
                  // =================================================

                  const otherParticipantId =
                    participants.find(
                      (uid) =>
                        String(uid) !==
                        String(
                          firebaseUser.uid
                        )
                    ) || null;


                  // =================================================
                  // OLD FALLBACK PROFILE DATA
                  // =================================================

                  const participantNames =
                    data.participantNames ||
                    {};

                  const participantImages =
                    data.participantImages ||
                    {};


                  // =================================================
                  // UNREAD
                  // =================================================

                  const unread =
                    Number(
                      data
                        .unreadCounts?.[
                        firebaseUser.uid
                      ] || 0
                    );


                  // =================================================
                  // RAW MESSAGES
                  // =================================================

                  const rawMessages =
                    Array.isArray(
                      data.messages
                    )
                      ? data.messages
                      : [];


                  // =================================================
                  // LAST MESSAGE
                  // =================================================

                  const lastVisibleMessage =
                    getLastVisibleMessage({
                      messages:
                        rawMessages,
                    });


                  const lastMessage =
                    lastVisibleMessage
                      ?.text ||
                    (
                      lastVisibleMessage
                        ?.imageUrl
                        ? "📷 Photo"
                        : data.lastMessage ||
                          "No messages yet"
                    );


                  const lastMessageAt =
                    lastVisibleMessage
                      ?.createdAt ||
                    data.lastMessageAt ||
                    0;


                  // =================================================
                  // RETURN
                  // =================================================

                  return {
                    id:
                      conversationDoc.id,

                    conversationId:
                      conversationDoc.id,

                    otherParticipantId,

                    /*
                     * These are only fallbacks.
                     *
                     * The real profile will come from:
                     *
                     * publicProfiles/{otherParticipantId}
                     */

                    fallbackName:
                      participantNames[
                        otherParticipantId
                      ] ||
                      "CampusMart User",

                    fallbackImage:
                      participantImages[
                        otherParticipantId
                      ] ||
                      null,

                    unread,

                    unreadCounts:
                      data.unreadCounts ||
                      {},

                    lastMessage,

                    lastMessageAt,

                    time:
                      formatTime(
                        lastMessageAt
                      ),

                    conversation:
                      rawMessages,

                    messages:
                      rawMessages,
                  };
                }
              );


            // =================================================
            // NEWEST FIRST
            // =================================================

            loaded.sort(
              (a, b) => {
                const aTime =
                  getTimestampMs(
                    a.lastMessageAt
                  );

                const bTime =
                  getTimestampMs(
                    b.lastMessageAt
                  );

                return (
                  bTime - aTime
                );
              }
            );


            setConversations(
              loaded
            );

            setLoading(false);
          } catch (error) {
            console.error(
              "Error processing conversations:",
              error
            );

            setConversations([]);

            setLoading(false);
          }
        },
        (error) => {
          console.error(
            "Conversation listener error:",
            error
          );

          setConversations([]);

          setLoading(false);
        }
      );


    return () => {
      unsubscribe();
    };
  }, [
    firebaseUser?.uid,
    profileLoading,
  ]);


  // =====================================================
  // LOAD OTHER USERS' PUBLIC PROFILES
  // =====================================================
  //
  // THIS IS THE IMPORTANT FIX.
  //
  // For every other participant we listen to:
  //
  // publicProfiles/{uid}
  //
  // This means the profile picture/name does NOT have
  // to be copied into the conversation document.
  //
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setProfileMap({});

      return undefined;
    }


    // ===================================================
    // GET UNIQUE OTHER USER IDS
    // ===================================================

    const participantIds =
      Array.from(
        new Set(
          conversations
            .map(
              (conversation) =>
                conversation?.otherParticipantId
            )
            .filter(
              (uid) =>
                uid &&
                String(uid) !==
                  String(
                    firebaseUser.uid
                  )
            )
        )
      );


    if (
      participantIds.length ===
      0
    ) {
      setProfileMap({});

      return undefined;
    }


    const unsubscribers = [];


    // ===================================================
    // REMOVE PROFILES THAT ARE NO LONGER NEEDED
    // ===================================================

    setProfileMap(
      (previous) => {
        const next = {};

        participantIds.forEach(
          (uid) => {
            if (
              previous?.[uid]
            ) {
              next[uid] =
                previous[uid];
            }
          }
        );

        return next;
      }
    );


    // ===================================================
    // LISTEN TO EACH PUBLIC PROFILE
    // ===================================================

    participantIds.forEach(
      (participantId) => {

        const profileRef =
          doc(
            db,
            "publicProfiles",
            participantId
          );


        const unsubscribe =
          onSnapshot(
            profileRef,
            (snapshot) => {

              if (
                snapshot.exists()
              ) {
                const data =
                  snapshot.data();


                console.log(
                  "Loaded public profile:",
                  participantId,
                  data
                );


                setProfileMap(
                  (previous) => ({
                    ...previous,

                    [participantId]: {
                      ...data,
                    },
                  })
                );

              } else {

                console.warn(
                  "No public profile found for:",
                  participantId
                );


                setProfileMap(
                  (previous) => ({
                    ...previous,

                    [participantId]: {
                      __missing: true,
                    },
                  })
                );
              }
            },
            (error) => {

              console.error(
                "Public profile listener error for:",
                participantId,
                error
              );


              setProfileMap(
                (previous) => ({
                  ...previous,

                  [participantId]: {
                    __error: true,
                  },
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
        (unsubscribe) => {
          unsubscribe();
        }
      );
    };
  }, [
    firebaseUser?.uid,
    conversations,
  ]);


  // =====================================================
  // REAL-TIME PRESENCE LISTENERS
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setPresenceMap({});

      return undefined;
    }


    const participantIds =
      Array.from(
        new Set(
          conversations
            .map(
              (conversation) =>
                conversation?.otherParticipantId
            )
            .filter(
              (uid) =>
                uid &&
                String(uid) !==
                  String(
                    firebaseUser.uid
                  )
            )
        )
      );


    if (
      participantIds.length ===
      0
    ) {
      setPresenceMap({});

      return undefined;
    }


    const unsubscribers = [];


    setPresenceMap(
      (previous) => {
        const next = {};

        participantIds.forEach(
          (uid) => {
            next[uid] =
              previous[uid] || {
                online: false,
                lastSeen: null,
              };
          }
        );

        return next;
      }
    );


    participantIds.forEach(
      (participantId) => {

        const presenceRef =
          doc(
            db,
            "presence",
            participantId
          );


        const unsubscribe =
          onSnapshot(
            presenceRef,
            (snapshot) => {

              if (
                snapshot.exists()
              ) {

                const data =
                  snapshot.data();


                setPresenceMap(
                  (previous) => ({
                    ...previous,

                    [participantId]: {
                      online:
                        data.online ===
                        true,

                      lastSeen:
                        data.lastSeen ||
                        null,
                    },
                  })
                );

              } else {

                setPresenceMap(
                  (previous) => ({
                    ...previous,

                    [participantId]: {
                      online: false,
                      lastSeen:
                        null,
                    },
                  })
                );
              }
            },
            (error) => {

              console.error(
                "Presence listener error for",
                participantId,
                error
              );


              setPresenceMap(
                (previous) => ({
                  ...previous,

                  [participantId]: {
                    online: false,
                    lastSeen:
                      null,
                  },
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
        (unsubscribe) => {
          unsubscribe();
        }
      );
    };
  }, [
    firebaseUser?.uid,
    conversations,
  ]);


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredMessages =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      if (!searchText) {
        return conversations;
      }


      return conversations.filter(
        (conversation) => {

          const uid =
            conversation?.otherParticipantId;


          const profile =
            profileMap?.[uid] ||
            {};


          const name =
            String(
              profile?.displayName ||
              profile?.fullName ||
              profile?.name ||
              conversation?.fallbackName ||
              ""
            ).toLowerCase();


          const lastMessage =
            String(
              conversation?.lastMessage ||
                ""
            ).toLowerCase();


          return (
            name.includes(
              searchText
            ) ||
            lastMessage.includes(
              searchText
            )
          );
        }
      );

    }, [
      conversations,
      profileMap,
      search,
    ]);


  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadMessages =
    useMemo(() => {

      return conversations.reduce(
        (
          total,
          conversation
        ) =>
          total +
          Number(
            conversation?.unread ||
              0
          ),
        0
      );

    }, [
      conversations,
    ]);


  // =====================================================
  // ONLINE USERS
  // =====================================================

  const onlineUsers =
    useMemo(() => {

      return conversations.filter(
        (conversation) => {

          const uid =
            conversation?.otherParticipantId;


          return (
            uid &&
            presenceMap?.[uid]
              ?.online === true
          );
        }
      ).length;

    }, [
      conversations,
      presenceMap,
    ]);


  // =====================================================
  // INITIAL
  // =====================================================

  const getInitial = (
    name
  ) => {

    return (
      String(
        name || "U"
      )
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "U"
    );
  };


  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = (
    conversation
  ) => {

    const conversationId =
      conversation?.conversationId ||
      conversation?.id;


    if (!conversationId) {

      console.error(
        "Cannot open chat: conversation ID is missing.",
        conversation
      );

      return;
    }


    navigate(
      `/messages/${encodeURIComponent(
        String(
          conversationId
        )
      )}`
    );
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (
    profileLoading ||
    loading
  ) {

    return (
      <CustomerLayout
        cartCount={
          cartCount
        }
        wishlist={
          wishlist
        }
        unreadMessages={0}
      >

        <div className="space-y-6">

          <div>

            <div
              className="
                h-8
                w-32
                rounded-lg
                bg-gray-200
                animate-pulse
              "
            />

            <div
              className="
                mt-2
                h-4
                w-72
                max-w-full
                rounded
                bg-gray-100
                animate-pulse
              "
            />

          </div>


          <div
            className="
              grid
              grid-cols-2
              lg:grid-cols-3
              gap-4
            "
          >

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    p-5
                    animate-pulse
                  "
                >

                  <div
                    className="
                      h-10
                      w-32
                      rounded
                      bg-gray-100
                    "
                  />

                </div>
              )
            )}

          </div>


          <div
            className="
              h-12
              rounded-xl
              bg-gray-100
              animate-pulse
            "
          />


          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              overflow-hidden
            "
          >

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    flex
                    items-center
                    gap-4
                    p-5
                    border-b
                    border-gray-100
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      rounded-full
                      bg-gray-100
                      animate-pulse
                    "
                  />

                  <div className="flex-1">

                    <div
                      className="
                        h-4
                        w-32
                        rounded
                        bg-gray-100
                        animate-pulse
                      "
                    />

                    <div
                      className="
                        mt-2
                        h-3
                        w-48
                        rounded
                        bg-gray-100
                        animate-pulse
                      "
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </CustomerLayout>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <CustomerLayout
      cartCount={
        cartCount
      }
      wishlist={
        wishlist
      }
      unreadMessages={
        unreadMessages
      }
    >

      <div className="space-y-6">


        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >

          <div>

            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-gray-800
              "
            >
              Messages
            </h1>

            <p className="text-gray-500 mt-1">
              Chat with buyers and
              sellers on CampusMart.
            </p>

          </div>


          <button
            type="button"
            className="
              hidden
              sm:flex
              items-center
              gap-2
              bg-green-50
              text-green-600
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-medium
              hover:bg-green-100
              transition
            "
          >

            <FiMessageCircle />

            New Message

          </button>

        </div>


        {/* =================================================
            STATS
        ================================================= */}

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-3
            gap-4
          "
        >

          {/* CONVERSATIONS */}

          <div
            className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-4
              sm:p-5
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiMessageCircle
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Conversations
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {
                    conversations.length
                  }
                </p>

              </div>

            </div>

          </div>


          {/* UNREAD */}

          <div
            className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-4
              sm:p-5
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-yellow-100
                  text-yellow-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiCheckCircle
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Unread Messages
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {
                    unreadMessages
                  }
                </p>

              </div>

            </div>

          </div>


          {/* ONLINE */}

          <div
            className="
              hidden
              lg:block
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-4
              sm:p-5
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-blue-100
                  text-blue-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiUsers
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Online Now
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {
                    onlineUsers
                  }
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="relative">

          <FiSearch
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search conversations..."
            className="
              w-full
              bg-white
              border
              border-gray-200
              rounded-xl
              py-3.5
              pl-11
              pr-4
              text-sm
              outline-none
              focus:border-green-500
              focus:ring-2
              focus:ring-green-100
              transition
            "
          />

        </div>


        {/* =================================================
            MESSAGES CARD
        ================================================= */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            overflow-hidden
          "
        >

          {/* CARD HEADER */}

          <div
            className="
              p-5
              border-b
              border-gray-100
              flex
              items-center
              justify-between
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiMessageCircle
                  size={21}
                />
              </div>

              <div>

                <h2 className="font-bold text-gray-800">
                  All Messages
                </h2>

                <p className="text-sm text-gray-400 mt-0.5">
                  {
                    filteredMessages.length
                  }{" "}
                  {
                    filteredMessages.length ===
                    1
                      ? "conversation"
                      : "conversations"
                  }
                </p>

              </div>

            </div>


            <button
              type="button"
              className="
                w-9
                h-9
                rounded-lg
                flex
                items-center
                justify-center
                text-gray-400
                hover:bg-gray-100
                hover:text-gray-600
                transition
              "
            >
              <FiMoreVertical />
            </button>

          </div>


          {/* =================================================
              MESSAGE LIST
          ================================================= */}

          {filteredMessages.length >
          0 ? (

            <div>

              {filteredMessages.map(
                (
                  conversation
                ) => {

                  const conversationId =
                    conversation?.conversationId ||
                    conversation?.id;


                  // =================================================
                  // OTHER USER UID
                  // =================================================

                  const otherUid =
                    conversation?.otherParticipantId;


                  // =================================================
                  // PUBLIC PROFILE
                  // =================================================

                  const publicProfile =
                    profileMap?.[
                      otherUid
                    ] || {};


                  // =================================================
                  // GET NAME
                  // =================================================
                  //
                  // Priority:
                  //
                  // 1. displayName
                  // 2. fullName
                  // 3. name
                  // 4. conversation fallback
                  //
                  // =================================================

                  const otherUserName =
                    publicProfile?.displayName ||
                    publicProfile?.fullName ||
                    publicProfile?.name ||
                    conversation?.fallbackName ||
                    "CampusMart User";


                  // =================================================
                  // GET PROFILE IMAGE
                  // =================================================
                  //
                  // Supports all common field names.
                  //
                  // =================================================

                  const otherUserImage =
                    publicProfile?.profileImage ||
                    publicProfile?.photoURL ||
                    publicProfile?.photoUrl ||
                    publicProfile?.image ||
                    publicProfile?.avatar ||
                    conversation?.fallbackImage ||
                    null;


                  // =================================================
                  // LAST MESSAGE
                  // =================================================

                  const lastMessage =
                    getLastVisibleMessage(
                      conversation
                    );


                  const sentByMe =
                    isLastMessageFromCurrentUser(
                      conversation,
                      lastMessage
                    );


                  const seenByOther =
                    isLastMessageSeenByOther(
                      conversation,
                      lastMessage
                    );


                  // =================================================
                  // ONLINE
                  // =================================================

                  const isOnline =
                    otherUid &&
                    presenceMap?.[
                      otherUid
                    ]?.online === true;


                  return (

                    <button
                      key={
                        conversationId
                      }
                      type="button"
                      disabled={
                        !conversationId
                      }
                      onClick={() =>
                        openChat(
                          conversation
                        )
                      }
                      className="
                        w-full
                        flex
                        items-center
                        gap-4
                        p-4
                        sm:p-5
                        text-left
                        hover:bg-gray-50
                        active:bg-gray-100
                        transition
                        border-b
                        border-gray-100
                        last:border-b-0
                        disabled:opacity-50
                      "
                    >


                      {/* =================================================
                          AVATAR
                      ================================================= */}

                      <div className="relative shrink-0">

                        {otherUserImage ? (

                          <img
                            src={
                              otherUserImage
                            }
                            alt={
                              otherUserName
                            }
                            className="
                              w-12
                              h-12
                              sm:w-13
                              sm:h-13
                              rounded-full
                              object-cover
                              bg-gray-100
                            "
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";

                              const fallback =
                                e.currentTarget
                                  .nextElementSibling;

                              if (
                                fallback
                              ) {
                                fallback.style.display =
                                  "flex";
                              }
                            }}
                          />

                        ) : null}


                        {/* =================================================
                            INITIAL FALLBACK
                        ================================================= */}

                        <div
                          style={{
                            display:
                              otherUserImage
                                ? "none"
                                : "flex",
                          }}
                          className="
                            w-12
                            h-12
                            sm:w-13
                            sm:h-13
                            rounded-full
                            bg-green-100
                            text-green-700
                            items-center
                            justify-center
                            font-bold
                            text-lg
                          "
                        >
                          {
                            getInitial(
                              otherUserName
                            )
                          }
                        </div>


                        {/* =================================================
                            ONLINE DOT
                        ================================================= */}

                        {isOnline && (

                          <span
                            className="
                              absolute
                              bottom-0
                              right-0
                              w-3.5
                              h-3.5
                              bg-green-500
                              border-2
                              border-white
                              rounded-full
                              shadow-sm
                            "
                            title="Online"
                          />

                        )}

                      </div>


                      {/* =================================================
                          DETAILS
                      ================================================= */}

                      <div className="flex-1 min-w-0">

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                        >

                          <h3
                            className={`
                              truncate
                              ${
                                conversation.unread >
                                0
                                  ? "font-bold text-gray-900"
                                  : "font-semibold text-gray-800"
                              }
                            `}
                          >
                            {
                              otherUserName
                            }
                          </h3>


                          <span
                            className="
                              text-xs
                              text-gray-400
                              shrink-0
                            "
                          >
                            {
                              conversation.time
                            }
                          </span>

                        </div>


                        {/* =================================================
                            ONLINE LABEL
                        ================================================= */}

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            mt-0.5
                          "
                        >

                          {isOnline && (

                            <span
                              className="
                                text-[11px]
                                font-medium
                                text-green-600
                              "
                            >
                              Online
                            </span>

                          )}

                        </div>


                        {/* =================================================
                            LAST MESSAGE
                        ================================================= */}

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            min-w-0
                            mt-0.5
                          "
                        >

                          <MessageChecks
                            sentByMe={
                              sentByMe
                            }
                            seenByOther={
                              seenByOther
                            }
                          />


                          <p
                            className={`
                              text-sm
                              truncate
                              ${
                                conversation.unread >
                                0
                                  ? "font-semibold text-gray-700"
                                  : "text-gray-500"
                              }
                            `}
                          >
                            {
                              conversation.lastMessage ||
                              "No messages yet."
                            }
                          </p>

                        </div>

                      </div>


                      {/* =================================================
                          UNREAD
                      ================================================= */}

                      {conversation.unread >
                        0 && (

                        <span
                          className="
                            min-w-5
                            h-5
                            px-1.5
                            rounded-full
                            bg-green-600
                            text-white
                            text-[11px]
                            font-bold
                            flex
                            items-center
                            justify-center
                            shrink-0
                          "
                        >
                          {conversation.unread >
                          99
                            ? "99+"
                            : conversation.unread}
                        </span>

                      )}


                      {/* =================================================
                          ARROW
                      ================================================= */}

                      <FiChevronRight
                        className="
                          text-gray-300
                          shrink-0
                        "
                        size={18}
                      />

                    </button>
                  );
                }
              )}

            </div>

          ) : (

            <div
              className="
                py-16
                px-6
                text-center
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-2xl
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                "
              >
                <FiMessageCircle
                  className="text-gray-400"
                  size={26}
                />
              </div>


              <h3
                className="
                  font-semibold
                  text-gray-800
                  mt-4
                "
              >
                {search
                  ? "No messages found"
                  : "No conversations yet"}
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                  max-w-sm
                  mx-auto
                "
              >
                {search
                  ? "We couldn't find any conversations matching your search."
                  : "Your conversations with buyers and sellers will appear here."}
              </p>


              {search && (

                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="
                    mt-4
                    text-sm
                    font-medium
                    text-green-600
                    hover:underline
                  "
                >
                  Clear search
                </button>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            MOBILE NEW MESSAGE
        ================================================= */}

        <button
          type="button"
          className="
            sm:hidden
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-green-600
            hover:bg-green-700
            text-white
            py-3
            rounded-xl
            font-medium
            transition
          "
        >
          <FiMessageCircle />

          New Message
        </button>

      </div>

    </CustomerLayout>
  );
}


export default Messages;