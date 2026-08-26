import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

import { useAuth } from "../../context/AuthContext";

import {
  FiArrowLeft,
  FiSend,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";

function Chat({
  cartCount = 0,
  wishlist = [],
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
  sendMessage,
  deleteMessages,
}) {
  const { firebaseUser } = useAuth();

  const { id } = useParams();

  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [messageText, setMessageText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [
    liveConversation,
    setLiveConversation,
  ] = useState(null);

  const [
    conversationLoading,
    setConversationLoading,
  ] = useState(true);

  const [
    selectedMessageIds,
    setSelectedMessageIds,
  ] = useState([]);

  const [
    showDeleteMenu,
    setShowDeleteMenu,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  // =====================================================
  // FALLBACK PERSON
  // =====================================================

  const fallbackPerson =
    messages.find(
      (message) =>
        String(message.id) ===
        String(id)
    );

  // =====================================================
  // LOCK PAGE SCROLL
  // =====================================================

  useEffect(() => {
    const originalBodyOverflow =
      document.body.style.overflow;

    const originalBodyHeight =
      document.body.style.height;

    const originalHtmlOverflow =
      document.documentElement.style
        .overflow;

    const originalHtmlHeight =
      document.documentElement.style
        .height;

    document.body.style.overflow =
      "hidden";

    document.body.style.height =
      "100%";

    document.documentElement.style.overflow =
      "hidden";

    document.documentElement.style.height =
      "100%";

    return () => {
      document.body.style.overflow =
        originalBodyOverflow;

      document.body.style.height =
        originalBodyHeight;

      document.documentElement.style.overflow =
        originalHtmlOverflow;

      document.documentElement.style.height =
        originalHtmlHeight;
    };
  }, []);

  // =====================================================
  // LOAD LIVE CONVERSATION
  // =====================================================

  useEffect(() => {
    if (!id) {
      setLiveConversation(null);
      setConversationLoading(false);

      return undefined;
    }

    setConversationLoading(true);

    const conversationRef =
      doc(
        db,
        "conversations",
        String(id)
      );

    const unsubscribe =
      onSnapshot(
        conversationRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setLiveConversation(null);
            setConversationLoading(false);

            return;
          }

          setLiveConversation({
            id: snapshot.id,
            ...snapshot.data(),
          });

          setConversationLoading(false);
        },
        (error) => {
          console.error(
            "Buyer chat listener error:",
            error
          );

          setLiveConversation(null);
          setConversationLoading(false);
        }
      );

    return () => unsubscribe();
  }, [id]);

  // =====================================================
  // OTHER PARTICIPANT
  // =====================================================

  const otherParticipantId =
    liveConversation?.buyerId ===
    firebaseUser?.uid
      ? liveConversation?.sellerId
      : liveConversation?.sellerId ===
          firebaseUser?.uid
        ? liveConversation?.buyerId
        : liveConversation?.participants?.find(
            (uid) =>
              String(uid) !==
              String(
                firebaseUser?.uid
              )
          ) ||
          fallbackPerson?.otherParticipantId ||
          null;

  // =====================================================
  // PERSON NAME
  // =====================================================

  const personName =
    liveConversation
      ?.participantNames?.[
        otherParticipantId
      ] ||
    fallbackPerson?.name ||
    "CampusMart User";

  // =====================================================
  // PERSON IMAGE
  // =====================================================

  const personImage =
    liveConversation
      ?.participantImages?.[
        otherParticipantId
      ] ||
    fallbackPerson?.profileImage ||
    fallbackPerson?.image ||
    fallbackPerson?.photoURL ||
    null;

  // =====================================================
  // CHAT MESSAGES
  // =====================================================

  const chatMessages =
    liveConversation &&
    Array.isArray(
      liveConversation.messages
    )
      ? liveConversation.messages
      : fallbackPerson?.conversation ||
        [];

  // =====================================================
  // SORT MESSAGES
  // =====================================================

  const sortedMessages = [
    ...chatMessages,
  ].sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : Number(a.createdAt || 0);

    const bTime =
      b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : Number(b.createdAt || 0);

    return aTime - bTime;
  });

  // =====================================================
  // IS MY MESSAGE
  // =====================================================

  const isMyMessage = (message) => {
    if (
      !message ||
      !firebaseUser?.uid
    ) {
      return false;
    }

    if (message.senderId) {
      return (
        String(
          message.senderId
        ) ===
        String(
          firebaseUser.uid
        )
      );
    }

    if (message.senderUid) {
      return (
        String(
          message.senderUid
        ) ===
        String(
          firebaseUser.uid
        )
      );
    }

    if (message.userId) {
      return (
        String(
          message.userId
        ) ===
        String(
          firebaseUser.uid
        )
      );
    }

    return (
      message.sender === "me"
    );
  };

  // =====================================================
  // MARK INCOMING MESSAGES AS SEEN
  // =====================================================

  useEffect(() => {
    if (
      !id ||
      !firebaseUser?.uid ||
      !liveConversation ||
      !Array.isArray(
        liveConversation.messages
      )
    ) {
      return;
    }

    const markIncomingMessagesAsSeen =
      async () => {
        try {
          const conversationRef =
            doc(
              db,
              "conversations",
              String(id)
            );

          await runTransaction(
            db,
            async (transaction) => {
              const snapshot =
                await transaction.get(
                  conversationRef
                );

              if (!snapshot.exists()) {
                return;
              }

              const data =
                snapshot.data();

              const currentMessages =
                Array.isArray(
                  data.messages
                )
                  ? data.messages
                  : [];

              let changed = false;

              const updatedMessages =
                currentMessages.map(
                  (message) => {
                    const senderId =
                      message?.senderId ||
                      message?.senderUid ||
                      message?.userId;

                    const belongsToOtherPerson =
                      senderId &&
                      String(
                        senderId
                      ) !==
                        String(
                          firebaseUser.uid
                        );

                    if (
                      belongsToOtherPerson &&
                      !message?.seenAt
                    ) {
                      changed = true;

                      return {
                        ...message,
                        seenAt:
                          Timestamp.now(),
                      };
                    }

                    return message;
                  }
                );

              if (changed) {
                transaction.update(
                  conversationRef,
                  {
                    messages:
                      updatedMessages,
                  }
                );
              }
            }
          );

          if (
            typeof markMessageAsRead ===
            "function"
          ) {
            await Promise.resolve(
              markMessageAsRead(id)
            );
          }
        } catch (error) {
          console.error(
            "Buyer mark messages as seen error:",
            error
          );
        }
      };

    markIncomingMessagesAsSeen();
  }, [
    id,
    firebaseUser?.uid,
    liveConversation?.messages,
    markMessageAsRead,
  ]);

  // =====================================================
  // VISIBLE MESSAGES
  // =====================================================

  const visibleMessages =
    sortedMessages.filter(
      (message) => {
        const deletedFor =
          Array.isArray(
            message.deletedFor
          )
            ? message.deletedFor
            : [];

        if (
          firebaseUser?.uid &&
          deletedFor.includes(
            firebaseUser.uid
          )
        ) {
          return false;
        }

        if (
          message.deletedForEveryone ===
          true
        ) {
          return false;
        }

        return true;
      }
    );

  // =====================================================
  // CLEAN SELECTION
  // =====================================================

  useEffect(() => {
    const availableIds =
      new Set(
        visibleMessages.map(
          (message) =>
            String(message.id)
        )
      );

    setSelectedMessageIds(
      (current) =>
        current.filter(
          (messageId) =>
            availableIds.has(
              String(messageId)
            )
        )
    );
  }, [liveConversation]);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatMessageTime = (
    message
  ) => {
    if (message?.time) {
      return message.time;
    }

    if (!message?.createdAt) {
      return "";
    }

    try {
      const date =
        message.createdAt?.toDate
          ? message.createdAt.toDate()
          : new Date(
              message.createdAt
            );

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
  // READ RECEIPT
  // =====================================================

  const isMessageSeen = (
    message
  ) => {
    return Boolean(
      message?.seenAt ||
        message?.readAt ||
        message?.isRead === true ||
        message?.seen === true
    );
  };

  // =====================================================
  // MESSAGE TICKS
  // =====================================================

  const MessageTicks = ({
    message,
  }) => {
    if (!isMyMessage(message)) {
      return null;
    }

    const seen =
      isMessageSeen(message);

    return (
      <span
        className={`
          inline-flex
          items-center
          ml-1
          align-middle
          ${
            seen
              ? "text-blue-200"
              : "text-green-100"
          }
        `}
        title={
          seen
            ? "Seen"
            : "Sent"
        }
      >
        {seen ? (
          <span className="relative inline-flex items-center">
            <FiCheck
              size={12}
              strokeWidth={3}
            />

            <FiCheck
              size={12}
              strokeWidth={3}
              className="-ml-[7px]"
            />
          </span>
        ) : (
          <FiCheck
            size={13}
            strokeWidth={3}
          />
        )}
      </span>
    );
  };

  // =====================================================
  // SELECTION
  // =====================================================

  const toggleMessageSelection =
    (messageId) => {
      if (deleting) {
        return;
      }

      const idString =
        String(messageId);

      setSelectedMessageIds(
        (current) => {
          if (
            current.includes(
              idString
            )
          ) {
            return current.filter(
              (item) =>
                item !== idString
            );
          }

          return [
            ...current,
            idString,
          ];
        }
      );
    };

  const clearSelection = () => {
    if (deleting) {
      return;
    }

    setSelectedMessageIds([]);
    setShowDeleteMenu(false);
  };

  const selectedMessages =
    visibleMessages.filter(
      (message) =>
        selectedMessageIds.includes(
          String(message.id)
        )
    );

  const canDeleteForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every(
      (message) =>
        isMyMessage(message)
    );

  const openDeleteOptions = () => {
    if (
      selectedMessageIds.length ===
        0 ||
      deleting
    ) {
      return;
    }

    setShowDeleteMenu(true);
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    deleteType
  ) => {
    if (
      deleting ||
      selectedMessageIds.length ===
        0 ||
      !firebaseUser?.uid ||
      !id ||
      typeof deleteMessages !==
        "function"
    ) {
      return;
    }

    if (
      deleteType !== "me" &&
      deleteType !== "everyone"
    ) {
      return;
    }

    if (
      deleteType === "everyone" &&
      !canDeleteForEveryone
    ) {
      return;
    }

    const idsToDelete = [
      ...selectedMessageIds,
    ];

    setDeleting(true);
    setShowDeleteMenu(false);

    setLiveConversation(
      (current) => {
        if (!current) {
          return current;
        }

        const currentMessages =
          Array.isArray(
            current.messages
          )
            ? current.messages
            : [];

        const updatedMessages =
          currentMessages.filter(
            (message) => {
              const messageId =
                String(
                  message.id
                );

              if (
                !idsToDelete.includes(
                  messageId
                )
              ) {
                return true;
              }

              if (
                deleteType === "me"
              ) {
                return false;
              }

              if (
                deleteType ===
                  "everyone" &&
                isMyMessage(message)
              ) {
                return false;
              }

              return true;
            }
          );

        return {
          ...current,
          messages:
            updatedMessages,
        };
      }
    );

    setSelectedMessageIds([]);

    try {
      await deleteMessages(
        id,
        idsToDelete,
        deleteType
      );
    } catch (error) {
      console.error(
        "Customer delete message error:",
        error
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // SEND
  // =====================================================

  const handleSendMessage =
    async () => {
      const text =
        messageText.trim();

      if (
        !text ||
        sending ||
        typeof sendMessage !==
          "function" ||
        !id
      ) {
        return;
      }

      setMessageText("");
      setSending(true);

      try {
        await sendMessage(
          id,
          text
        );
      } catch (error) {
        console.error(
          "Customer send message error:",
          error
        );

        setMessageText(text);
      } finally {
        setSending(false);
      }
    };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // =====================================================
  // INITIAL
  // =====================================================

  const getInitial = (name) => {
    return (
      String(name || "C")
        .trim()
        .charAt(0)
        .toUpperCase() || "C"
    );
  };

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (
    !conversationLoading &&
    !liveConversation &&
    !fallbackPerson
  ) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={
          unreadMessages
        }
      >
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <FiX size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Conversation not found
          </h2>

          <p className="text-gray-500 mt-2">
            The conversation you're
            looking for doesn't exist.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/messages"
              )
            }
            className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            Back to Messages
          </button>
        </div>
      </CustomerLayout>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (
    conversationLoading &&
    !fallbackPerson
  ) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={
          unreadMessages
        }
      >
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center shadow-sm">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            Loading conversation...
          </p>
        </div>
      </CustomerLayout>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={
        unreadMessages
      }
    >
      <div
        className="
          fixed
          inset-0
          md:static
          md:h-[calc(100vh-140px)]
          z-20
          md:z-auto
          bg-white
          md:rounded-2xl
          border
          border-green-100
          overflow-hidden
          flex
          flex-col
          shadow-sm
          h-[100dvh]
          min-h-0
        "
      >
        {/* =================================================
            FIXED CHAT HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            px-3
            sm:px-6
            py-3
            sm:py-4
            border-b
            border-green-100
            bg-white
            flex-shrink-0
            z-30
          "
        >
          {selectedMessageIds.length >
          0 ? (
            <>
              <button
                type="button"
                onClick={
                  clearSelection
                }
                disabled={
                  deleting
                }
                className="
                  w-10
                  h-10
                  rounded-full
                  hover:bg-green-50
                  flex
                  items-center
                  justify-center
                  text-green-700
                  flex-shrink-0
                "
              >
                <FiX size={20} />
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">
                  {
                    selectedMessageIds.length
                  }{" "}
                  selected
                </p>

                <p className="text-xs text-gray-400 truncate">
                  Choose delete to
                  continue
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openDeleteOptions
                }
                disabled={
                  deleting
                }
                className="
                  h-10
                  px-3
                  sm:px-4
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  flex
                  items-center
                  gap-2
                  font-semibold
                  text-sm
                  flex-shrink-0
                "
              >
                <FiTrash2
                  size={17}
                />

                <span className="hidden sm:inline">
                  Delete
                </span>
              </button>
            </>
          ) : (
            <>
              {/* BACK BUTTON */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/messages"
                  )
                }
                className="
                  w-10
                  h-10
                  rounded-full
                  hover:bg-green-50
                  flex
                  items-center
                  justify-center
                  text-green-700
                  flex-shrink-0
                "
              >
                <FiArrowLeft
                  size={19}
                />
              </button>

              {/* =================================================
                  PROFILE IMAGE
              ================================================= */}

              {personImage ? (
                <img
                  src={personImage}
                  alt={personName}
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    rounded-full
                    object-cover
                    ring-2
                    ring-green-100
                    flex-shrink-0
                  "
                />
              ) : (
                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    rounded-full
                    bg-green-100
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-lg
                    flex-shrink-0
                  "
                >
                  {getInitial(
                    personName
                  )}
                </div>
              )}

              {/* =================================================
                  PROFILE NAME
              ================================================= */}

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800 truncate text-sm sm:text-base">
                  {personName}
                </h2>

                <p className="text-xs text-green-600 truncate">
                  CampusMart
                  conversation
                </p>
              </div>
            </>
          )}
        </div>

        {/* =================================================
            ONLY THIS SECTION SCROLLS
        ================================================= */}

        <div
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overscroll-contain
            p-3
            sm:p-6
            space-y-2
            sm:space-y-3
            bg-gradient-to-b
            from-green-50/40
            to-gray-50
            [scrollbar-width:thin]
            touch-pan-y
          "
        >
          <div className="text-center mb-4 sm:mb-5">
            <span className="inline-block bg-white text-green-600 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
              Conversation with{" "}
              {personName}
            </span>
          </div>

          {visibleMessages.length ===
            0 && (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                <FiSend size={22} />
              </div>

              <p className="text-sm font-medium text-gray-500">
                No messages yet.
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Send a message to
                start the conversation.
              </p>
            </div>
          )}

          {visibleMessages.map(
            (message) => {
              const mine =
                isMyMessage(
                  message
                );

              const messageId =
                String(
                  message.id
                );

              const selected =
                selectedMessageIds.includes(
                  messageId
                );

              return (
                <div
                  key={
                    message.id ||
                    `${message.createdAt}-${message.text}`
                  }
                  className={`flex w-full ${
                    mine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleMessageSelection(
                        messageId
                      )
                    }
                    disabled={
                      deleting
                    }
                    className={`
                      max-w-[82%]
                      sm:max-w-[65%]
                      text-left
                      px-3.5
                      py-2.5
                      sm:px-4
                      sm:py-3
                      rounded-2xl
                      transition
                      ${
                        selected
                          ? "ring-2 ring-green-500 ring-offset-2"
                          : ""
                      }
                      ${
                        mine
                          ? "bg-green-800 text-white rounded-br-md shadow-sm"
                          : "bg-green-600 text-white rounded-bl-md shadow-md"
                      }
                    `}
                  >
                    {selected && (
                      <div className="flex justify-end mb-1">
                        <span className="w-5 h-5 rounded-full bg-white text-green-600 flex items-center justify-center">
                          <FiCheck
                            size={13}
                          />
                        </span>
                      </div>
                    )}

                    <p className="text-sm leading-5 break-words whitespace-pre-wrap">
                      {message.text}
                    </p>

                    <div
                      className="
                        flex
                        items-center
                        justify-end
                        gap-0.5
                        text-[10px]
                        mt-1
                        text-green-100
                      "
                    >
                      <span>
                        {formatMessageTime(
                          message
                        )}
                      </span>

                      <MessageTicks
                        message={
                          message
                        }
                      />
                    </div>
                  </button>
                </div>
              );
            }
          )}

          <div className="h-1 shrink-0" />
        </div>

        {/* =================================================
            FIXED INPUT
        ================================================= */}

        {selectedMessageIds.length ===
          0 && (
          <div
            className="
              flex-shrink-0
              border-t
              border-green-100
              bg-white
              z-30
              px-2.5
              sm:px-4
              pt-2.5
              sm:pt-4
              pb-2
              sm:pb-4
              [padding-bottom:env(safe-area-inset-bottom)]
            "
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={
                  messageText
                }
                onChange={(e) =>
                  setMessageText(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={sending}
                placeholder={`Message ${personName}...`}
                className="
                  flex-1
                  min-w-0
                  bg-gray-100
                  rounded-full
                  px-4
                  py-3
                  text-sm
                  outline-none
                  border
                  border-transparent
                  focus:ring-2
                  focus:ring-green-100
                  focus:border-green-500
                  focus:bg-white
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={
                  handleSendMessage
                }
                disabled={
                  !messageText.trim() ||
                  sending
                }
                className="
                  w-11
                  h-11
                  rounded-full
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-gray-300
                  text-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                {sending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <FiSend
                    size={18}
                  />
                )}
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            DELETE MENU
        ================================================= */}

        {showDeleteMenu && (
          <div
            className="
              fixed
              inset-0
              z-50
              bg-black/40
              backdrop-blur-[2px]
              flex
              items-end
              sm:items-center
              justify-center
              p-4
            "
            onClick={() => {
              if (!deleting) {
                setShowDeleteMenu(
                  false
                );
              }
            }}
          >
            <div
              className="
                w-full
                max-w-sm
                bg-white
                rounded-2xl
                shadow-2xl
                overflow-hidden
                border
                border-green-100
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="p-5 border-b border-green-100 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    <FiTrash2
                      size={18}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Delete message
                      {selectedMessageIds.length >
                      1
                        ? "s"
                        : ""}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Choose an option
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  handleDelete("me")
                }
                className="
                  w-full
                  text-left
                  px-5
                  py-4
                  hover:bg-green-50
                  border-b
                  border-gray-100
                "
              >
                <div className="flex items-center gap-3">
                  <FiTrash2
                    size={16}
                  />

                  <div>
                    <p className="font-semibold text-gray-800">
                      Delete for me
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Remove from your
                      chat only.
                    </p>
                  </div>
                </div>
              </button>

              {canDeleteForEveryone && (
                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    handleDelete(
                      "everyone"
                    )
                  }
                  className="
                    w-full
                    text-left
                    px-5
                    py-4
                    hover:bg-green-50
                    border-b
                    border-gray-100
                  "
                >
                  <div className="flex items-center gap-3">
                    <FiTrash2
                      size={16}
                    />

                    <div>
                      <p className="font-semibold text-green-700">
                        Delete for
                        everyone
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Permanently remove
                        your message for
                        everyone.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <div className="p-4 bg-gray-50">
                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setShowDeleteMenu(
                      false
                    )
                  }
                  className="
                    w-full
                    h-11
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-600
                    font-semibold
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default Chat;