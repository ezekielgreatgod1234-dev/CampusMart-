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

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMap, setProfileMap] = useState({});
  const [presenceMap, setPresenceMap] = useState({});

  // =====================================================
  // ROBUST TIMESTAMP PARSER
  // Handles: Firestore Timestamp, Date, number (sec/ms),
  // ISO string, and createdAtMs
  // =====================================================

  const getTimestampMs = (value) => {
    if (value == null) return 0;

    try {
      // Firestore Timestamp
      if (typeof value.toMillis === "function") {
        const ms = value.toMillis();
        return Number.isFinite(ms) && ms > 0 ? ms : 0;
      }

      if (typeof value.toDate === "function") {
        const ms = value.toDate().getTime();
        return Number.isFinite(ms) && ms > 0 ? ms : 0;
      }

      // { seconds, nanoseconds }
      if (
        typeof value === "object" &&
        typeof value.seconds === "number"
      ) {
        const ms =
          value.seconds * 1000 +
          Math.floor(Number(value.nanoseconds || 0) / 1e6);
        return Number.isFinite(ms) && ms > 0 ? ms : 0;
      }

      // Date object
      if (value instanceof Date) {
        const ms = value.getTime();
        return Number.isFinite(ms) && ms > 0 ? ms : 0;
      }

      // Number (seconds or milliseconds)
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value < 1e12 ? value * 1000 : value;
      }

      // Numeric string
      if (typeof value === "string" && value.trim()) {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber) && asNumber > 0) {
          return asNumber < 1e12 ? asNumber * 1000 : asNumber;
        }

        const parsed = Date.parse(value);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }

    return 0;
  };

  const getMessageTimestampMs = (message) => {
    if (!message) return 0;

    // Prefer our own createdAtMs
    if (
      typeof message.createdAtMs === "number" &&
      Number.isFinite(message.createdAtMs) &&
      message.createdAtMs > 0
    ) {
      return message.createdAtMs < 1e12
        ? message.createdAtMs * 1000
        : message.createdAtMs;
    }

    // Then createdAt / timestamp / sentAt
    const candidates = [
      message.createdAt,
      message.timestamp,
      message.sentAt,
      message.time,
    ];

    for (const candidate of candidates) {
      const ms = getTimestampMs(candidate);
      if (ms > 0) return ms;
    }

    return 0;
  };

  const formatTime = (timestampMs) => {
    if (!timestampMs || timestampMs <= 0) return "";

    try {
      return new Date(timestampMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // =====================================================
  // FIND THE REAL NEWEST VISIBLE MESSAGE
  // =====================================================

  const getNewestVisibleMessage = (conversation) => {
    const rawMessages = Array.isArray(conversation?.messages)
      ? conversation.messages
      : Array.isArray(conversation?.conversation)
        ? conversation.conversation
        : [];

    if (rawMessages.length === 0) return null;

    let newest = null;
    let newestMs = -1;
    let newestIndex = -1;

    rawMessages.forEach((message, index) => {
      if (!message) return;

      // Skip deleted-for-me / deleted-for-everyone
      const deletedFor = Array.isArray(message.deletedFor)
        ? message.deletedFor
        : [];

      if (
        firebaseUser?.uid &&
        deletedFor.includes(firebaseUser.uid)
      ) {
        return;
      }

      if (message.deletedForEveryone === true) return;

      const messageMs = getMessageTimestampMs(message);

      // Prefer higher timestamp. If timestamps are equal/zero,
      // prefer the one that appears later in the array
      // (sendMessage always appends).
      if (
        messageMs > newestMs ||
        (messageMs === newestMs && index > newestIndex)
      ) {
        newest = message;
        newestMs = messageMs;
        newestIndex = index;
      }
    });

    // Absolute fallback: last non-deleted message in the array
    if (!newest) {
      for (let i = rawMessages.length - 1; i >= 0; i--) {
        const message = rawMessages[i];
        if (!message) continue;

        const deletedFor = Array.isArray(message.deletedFor)
          ? message.deletedFor
          : [];

        if (
          firebaseUser?.uid &&
          deletedFor.includes(firebaseUser.uid)
        ) {
          continue;
        }

        if (message.deletedForEveryone === true) continue;

        return message;
      }
    }

    return newest;
  };

  // =====================================================
  // BUILD PREVIEW FROM THE NEWEST MESSAGE ONLY
  // =====================================================

  const getConversationPreview = (conversation) => {
    const newestMessage = getNewestVisibleMessage(conversation);

    if (newestMessage) {
      const timestampMs = getMessageTimestampMs(newestMessage);

      let previewText = "";

      if (
        typeof newestMessage.text === "string" &&
        newestMessage.text.trim()
      ) {
        previewText = newestMessage.text.trim();
      } else if (newestMessage.imageUrl) {
        previewText = "📷 Photo";
      } else if (
        typeof newestMessage.message === "string" &&
        newestMessage.message.trim()
      ) {
        previewText = newestMessage.message.trim();
      } else if (
        typeof newestMessage.content === "string" &&
        newestMessage.content.trim()
      ) {
        previewText = newestMessage.content.trim();
      }

      return {
        message: previewText || "No messages yet",
        timestamp: timestampMs,
        embedded: newestMessage,
      };
    }

    // Fallback only when messages[] has nothing usable
    const documentText =
      typeof conversation?.lastMessage === "string"
        ? conversation.lastMessage.trim()
        : "";

    const documentMs = getTimestampMs(conversation?.lastMessageAt);

    if (documentText && documentMs > 0) {
      return {
        message: documentText,
        timestamp: documentMs,
        embedded: null,
      };
    }

    if (documentText) {
      return {
        message: documentText,
        timestamp: 0,
        embedded: null,
      };
    }

    return {
      message: "No messages yet",
      timestamp: 0,
      embedded: null,
    };
  };

  // =====================================================
  // LAST MESSAGE SENDER / SEEN HELPERS
  // =====================================================

  const isLastMessageFromCurrentUser = (conversation, lastMessage) => {
    if (!lastMessage || !firebaseUser?.uid) return false;

    const currentUid = String(firebaseUser.uid);

    if (lastMessage.senderId) {
      return String(lastMessage.senderId) === currentUid;
    }
    if (lastMessage.userId) {
      return String(lastMessage.userId) === currentUid;
    }
    if (lastMessage.fromId) {
      return String(lastMessage.fromId) === currentUid;
    }
    if (
      lastMessage.sender === "me" ||
      lastMessage.sender === "buyer" ||
      lastMessage.sender === "currentUser"
    ) {
      return true;
    }

    return false;
  };

  const isLastMessageSeenByOther = (conversation, lastMessage) => {
    if (!conversation || !lastMessage) return false;

    const otherParticipantId = conversation?.otherParticipantId;
    if (!otherParticipantId) return false;

    const readArrays = [
      lastMessage?.readBy,
      lastMessage?.seenBy,
      lastMessage?.lastMessageSeenBy,
      lastMessage?.readByUserIds,
      lastMessage?.seenByUserIds,
    ];

    for (const readArray of readArrays) {
      if (
        Array.isArray(readArray) &&
        readArray.some(
          (uid) => String(uid) === String(otherParticipantId)
        )
      ) {
        return true;
      }
    }

    const readObjects = [
      lastMessage?.readBy,
      lastMessage?.seenBy,
      lastMessage?.lastMessageSeenBy,
    ];

    for (const readObject of readObjects) {
      if (
        readObject &&
        typeof readObject === "object" &&
        !Array.isArray(readObject) &&
        readObject[otherParticipantId] === true
      ) {
        return true;
      }
    }

    if (
      lastMessage?.seen === true ||
      lastMessage?.read === true ||
      lastMessage?.seenAt ||
      lastMessage?.readAt
    ) {
      return true;
    }

    if (
      conversation?.unreadCounts &&
      Object.prototype.hasOwnProperty.call(
        conversation.unreadCounts,
        otherParticipantId
      )
    ) {
      const otherUnread = Number(
        conversation.unreadCounts[otherParticipantId] || 0
      );
      if (otherUnread === 0) return true;
    }

    return false;
  };

  const MessageChecks = ({ sentByMe, seenByOther }) => {
    if (!sentByMe) return null;

    return (
      <span
        className={`inline-flex items-center shrink-0 ${
          seenByOther ? "text-green-600" : "text-gray-400"
        }`}
        title={seenByOther ? "Seen" : "Sent"}
      >
        <FiCheck size={14} strokeWidth={3} />
        {seenByOther && (
          <FiCheck size={14} strokeWidth={3} className="-ml-[6px]" />
        )}
      </span>
    );
  };

  // =====================================================
  // LOAD CONVERSATIONS (live)
  // =====================================================

  useEffect(() => {
    if (profileLoading) return undefined;

    if (!firebaseUser?.uid) {
      setConversations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        try {
          const loaded = snapshot.docs.map((conversationDoc) => {
            const data = conversationDoc.data() || {};

            const participants = Array.isArray(data.participants)
              ? data.participants
              : [];

            const otherParticipantId =
              participants.find(
                (uid) => String(uid) !== String(firebaseUser.uid)
              ) || null;

            const participantNames = data.participantNames || {};
            const participantImages = data.participantImages || {};

            const unread = Number(
              data.unreadCounts?.[firebaseUser.uid] || 0
            );

            const rawMessages = Array.isArray(data.messages)
              ? data.messages
              : [];

            // ALWAYS derive preview from the real newest message
            const preview = getConversationPreview({
              ...data,
              messages: rawMessages,
            });

            return {
              id: conversationDoc.id,
              conversationId: conversationDoc.id,
              otherParticipantId,
              fallbackName:
                participantNames[otherParticipantId] || "CampusMart User",
              fallbackImage:
                participantImages[otherParticipantId] || null,
              unread,
              unreadCounts: data.unreadCounts || {},
              lastMessage: preview.message,
              lastMessageAt: preview.timestamp,
              time: formatTime(preview.timestamp),
              conversation: rawMessages,
              messages: rawMessages,
              _previewEmbedded: preview.embedded,
            };
          });

          // Sort by the real newest message timestamp
          loaded.sort((a, b) => {
            const aTime =
              typeof a.lastMessageAt === "number" && a.lastMessageAt > 0
                ? a.lastMessageAt
                : 0;
            const bTime =
              typeof b.lastMessageAt === "number" && b.lastMessageAt > 0
                ? b.lastMessageAt
                : 0;
            return bTime - aTime;
          });

          setConversations(loaded);
          setLoading(false);
        } catch (error) {
          console.error("Error processing conversations:", error);
          setConversations([]);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Conversation listener error:", error);
        setConversations([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid, profileLoading]);

  // =====================================================
  // PUBLIC PROFILES
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setProfileMap({});
      return undefined;
    }

    const participantIds = Array.from(
      new Set(
        conversations
          .map((c) => c?.otherParticipantId)
          .filter(
            (uid) =>
              uid && String(uid) !== String(firebaseUser.uid)
          )
      )
    );

    if (participantIds.length === 0) {
      setProfileMap({});
      return undefined;
    }

    const unsubscribers = [];

    setProfileMap((previous) => {
      const next = {};
      participantIds.forEach((uid) => {
        if (previous?.[uid]) next[uid] = previous[uid];
      });
      return next;
    });

    participantIds.forEach((participantId) => {
      const profileRef = doc(db, "publicProfiles", participantId);

      const unsubscribe = onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setProfileMap((previous) => ({
              ...previous,
              [participantId]: { ...snapshot.data() },
            }));
          } else {
            setProfileMap((previous) => ({
              ...previous,
              [participantId]: { __missing: true },
            }));
          }
        },
        () => {
          setProfileMap((previous) => ({
            ...previous,
            [participantId]: { __error: true },
          }));
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser?.uid, conversations]);

  // =====================================================
  // PRESENCE
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setPresenceMap({});
      return undefined;
    }

    const participantIds = Array.from(
      new Set(
        conversations
          .map((c) => c?.otherParticipantId)
          .filter(
            (uid) =>
              uid && String(uid) !== String(firebaseUser.uid)
          )
      )
    );

    if (participantIds.length === 0) {
      setPresenceMap({});
      return undefined;
    }

    const unsubscribers = [];

    setPresenceMap((previous) => {
      const next = {};
      participantIds.forEach((uid) => {
        next[uid] = previous[uid] || { online: false, lastSeen: null };
      });
      return next;
    });

    participantIds.forEach((participantId) => {
      const presenceRef = doc(db, "presence", participantId);

      const unsubscribe = onSnapshot(
        presenceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setPresenceMap((previous) => ({
              ...previous,
              [participantId]: {
                online: data.online === true,
                lastSeen: data.lastSeen || null,
              },
            }));
          } else {
            setPresenceMap((previous) => ({
              ...previous,
              [participantId]: { online: false, lastSeen: null },
            }));
          }
        },
        () => {
          setPresenceMap((previous) => ({
            ...previous,
            [participantId]: { online: false, lastSeen: null },
          }));
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser?.uid, conversations]);

  // =====================================================
  // SEARCH + STATS
  // =====================================================

  const filteredMessages = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return conversations;

    return conversations.filter((conversation) => {
      const uid = conversation?.otherParticipantId;
      const profile = profileMap?.[uid] || {};

      const name = String(
        profile?.displayName ||
          profile?.fullName ||
          profile?.name ||
          conversation?.fallbackName ||
          ""
      ).toLowerCase();

      const lastMessage = String(
        conversation?.lastMessage || ""
      ).toLowerCase();

      return name.includes(searchText) || lastMessage.includes(searchText);
    });
  }, [conversations, profileMap, search]);

  const unreadMessages = useMemo(() => {
    return conversations.reduce(
      (total, conversation) =>
        total + Number(conversation?.unread || 0),
      0
    );
  }, [conversations]);

  const onlineUsers = useMemo(() => {
    return conversations.filter((conversation) => {
      const uid = conversation?.otherParticipantId;
      return uid && presenceMap?.[uid]?.online === true;
    }).length;
  }, [conversations, presenceMap]);

  const getInitial = (name) =>
    String(name || "U").trim().charAt(0).toUpperCase() || "U";

  const openChat = (conversation) => {
    const conversationId =
      conversation?.conversationId || conversation?.id;

    if (!conversationId) return;

    navigate(`/messages/${encodeURIComponent(String(conversationId))}`);
  };

  // =====================================================
  // LOADING UI
  // =====================================================

  if (profileLoading || loading) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={0}
      >
        <div className="space-y-6">
          <div>
            <div className="h-8 w-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse"
              >
                <div className="h-10 w-32 rounded bg-gray-100" />
              </div>
            ))}
          </div>

          <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-5 border-b border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                  <div className="mt-2 h-3 w-48 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
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
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Messages
            </h1>
            <p className="text-gray-500 mt-1">
              Chat with buyers and sellers on CampusMart.
            </p>
          </div>

          <button
            type="button"
            className="hidden sm:flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition"
          >
            <FiMessageCircle />
            New Message
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <FiMessageCircle size={19} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Conversations</p>
                <p className="text-xl font-bold text-gray-800">
                  {conversations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <FiCheckCircle size={19} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Unread Messages</p>
                <p className="text-xl font-bold text-gray-800">
                  {unreadMessages}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <FiUsers size={19} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Online Now</p>
                <p className="text-xl font-bold text-gray-800">
                  {onlineUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <FiMessageCircle size={21} />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">All Messages</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {filteredMessages.length}{" "}
                  {filteredMessages.length === 1
                    ? "conversation"
                    : "conversations"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <FiMoreVertical />
            </button>
          </div>

          {filteredMessages.length > 0 ? (
            <div>
              {filteredMessages.map((conversation) => {
                const conversationId =
                  conversation?.conversationId || conversation?.id;

                const otherUid = conversation?.otherParticipantId;
                const publicProfile = profileMap?.[otherUid] || {};

                const otherUserName =
                  publicProfile?.displayName ||
                  publicProfile?.fullName ||
                  publicProfile?.name ||
                  conversation?.fallbackName ||
                  "CampusMart User";

                const otherUserImage =
                  publicProfile?.profileImage ||
                  publicProfile?.photoURL ||
                  publicProfile?.photoUrl ||
                  publicProfile?.image ||
                  publicProfile?.avatar ||
                  conversation?.fallbackImage ||
                  null;

                // Preview already computed from newest message
                const previewText =
                  conversation.lastMessage || "No messages yet.";
                const previewTime = conversation.time || "";

                const lastMessage =
                  conversation._previewEmbedded || null;

                const sentByMe = isLastMessageFromCurrentUser(
                  conversation,
                  lastMessage
                );

                const seenByOther = isLastMessageSeenByOther(
                  conversation,
                  lastMessage
                );

                const isOnline =
                  otherUid &&
                  presenceMap?.[otherUid]?.online === true;

                return (
                  <button
                    key={conversationId}
                    type="button"
                    disabled={!conversationId}
                    onClick={() => openChat(conversation)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50 active:bg-gray-100 transition border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                  >
                    <div className="relative shrink-0">
                      {otherUserImage ? (
                        <img
                          src={otherUserImage}
                          alt={otherUserName}
                          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover bg-gray-100"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback =
                              e.currentTarget.nextElementSibling;
                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}

                      <div
                        style={{
                          display: otherUserImage ? "none" : "flex",
                        }}
                        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-green-100 text-green-700 items-center justify-center font-bold text-lg"
                      >
                        {getInitial(otherUserName)}
                      </div>

                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"
                          title="Online"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className={`truncate ${
                            conversation.unread > 0
                              ? "font-bold text-gray-900"
                              : "font-semibold text-gray-800"
                          }`}
                        >
                          {otherUserName}
                        </h3>

                        <span className="text-xs text-gray-400 shrink-0">
                          {previewTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isOnline && (
                          <span className="text-[11px] font-medium text-green-600">
                            Online
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        <MessageChecks
                          sentByMe={sentByMe}
                          seenByOther={seenByOther}
                        />

                        <p
                          className={`text-sm truncate ${
                            conversation.unread > 0
                              ? "font-semibold text-gray-700"
                              : "text-gray-500"
                          }`}
                        >
                          {previewText}
                        </p>
                      </div>
                    </div>

                    {conversation.unread > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {conversation.unread > 99
                          ? "99+"
                          : conversation.unread}
                      </span>
                    )}

                    <FiChevronRight
                      className="text-gray-300 shrink-0"
                      size={18}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
                <FiMessageCircle className="text-gray-400" size={26} />
              </div>

              <h3 className="font-semibold text-gray-800 mt-4">
                {search ? "No messages found" : "No conversations yet"}
              </h3>

              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {search
                  ? "We couldn't find any conversations matching your search."
                  : "Your conversations with buyers and sellers will appear here."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 text-sm font-medium text-green-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="sm:hidden w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
        >
          <FiMessageCircle />
          New Message
        </button>
      </div>
    </CustomerLayout>
  );
}

export default Messages;