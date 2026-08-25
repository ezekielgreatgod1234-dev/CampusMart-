import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  FiArrowLeft,
  FiSend,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

function SellerChat({
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
  sendMessage,
  deleteMessages,
  profile = {},
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { firebaseUser } = useAuth();

  // =====================================================
  // MESSAGE INPUT
  // =====================================================

  const [messageText, setMessageText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  // =====================================================
  // LIVE CONVERSATION
  // =====================================================

  const [
    liveConversation,
    setLiveConversation,
  ] = useState(null);

  const [
    conversationLoading,
    setConversationLoading,
  ] = useState(true);

  // =====================================================
  // MESSAGE SELECTION
  // =====================================================

  const [
    selectedMessageIds,
    setSelectedMessageIds,
  ] = useState([]);

  // =====================================================
  // DELETE MENU
  // =====================================================

  const [
    showDeleteMenu,
    setShowDeleteMenu,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  // =====================================================
  // FALLBACK CONVERSATION
  // =====================================================

  const fallbackConversation =
    messages.find(
      (message) =>
        String(message.id) ===
        String(id)
    );

  // =====================================================
  // SELLER INFORMATION
  // =====================================================

  const sellerName =
    profile?.fullName ||
    firebaseUser?.displayName ||
    "Seller";

  const sellerImage =
    profile?.profileImage ||
    firebaseUser?.photoURL ||
    null;

  // =====================================================
  // MOBILE CHAT VIEWPORT
  // =====================================================

  useEffect(() => {
    const originalOverflow =
      document.body.style.overflow;

    const originalHeight =
      document.body.style.height;

    document.body.style.overflow =
      "hidden";

    document.body.style.height =
      "100%";

    return () => {
      document.body.style.overflow =
        originalOverflow;

      document.body.style.height =
        originalHeight;
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
            "Seller chat listener error:",
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
    liveConversation?.participants?.find(
      (uid) =>
        String(uid) !==
        String(firebaseUser?.uid)
    ) ||
    fallbackConversation?.otherParticipantId ||
    null;

  // =====================================================
  // BUYER INFORMATION
  // =====================================================

  const buyerName =
    liveConversation
      ?.participantNames?.[
        otherParticipantId
      ] ||
    fallbackConversation?.name ||
    "Buyer";

  const buyerImage =
    liveConversation
      ?.participantImages?.[
        otherParticipantId
      ] ||
    fallbackConversation?.profileImage ||
    null;

  // =====================================================
  // MARK AS READ
  // =====================================================

  useEffect(() => {
    if (
      id &&
      markMessageAsRead
    ) {
      markMessageAsRead(id);
    }
  }, [
    id,
    markMessageAsRead,
  ]);

  // =====================================================
  // CHAT MESSAGES
  // =====================================================

  const chatMessages =
    liveConversation &&
    Array.isArray(
      liveConversation.messages
    )
      ? liveConversation.messages
      : fallbackConversation?.conversation ||
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
        : Number(
            a.createdAt || 0
          );

    const bTime =
      b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : Number(
            b.createdAt || 0
          );

    return aTime - bTime;
  });

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

        // Deleted only for current seller
        if (
          deletedFor.includes(
            firebaseUser?.uid
          )
        ) {
          return false;
        }

        // Deleted for everyone
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
  // FORMAT TIME
  // =====================================================

  const formatMessageTime = (
    message
  ) => {
    if (message.time) {
      return message.time;
    }

    if (!message.createdAt) {
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
  // IS MY MESSAGE
  // =====================================================

  const isMyMessage = (
    message
  ) => {
    if (
      message.senderId &&
      firebaseUser?.uid
    ) {
      return (
        String(
          message.senderId
        ) ===
        String(
          firebaseUser.uid
        )
      );
    }

    if (
      message.senderUid &&
      firebaseUser?.uid
    ) {
      return (
        String(
          message.senderUid
        ) ===
        String(
          firebaseUser.uid
        )
      );
    }

    if (
      message.userId &&
      firebaseUser?.uid
    ) {
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
      message.sender === "me" ||
      message.sender === "seller"
    );
  };

  // =====================================================
  // SELECT MESSAGE
  // =====================================================

  const toggleMessageSelection = (
    messageId
  ) => {
    if (deleting) {
      return;
    }

    const idString =
      String(messageId);

    setSelectedMessageIds(
      (current) => {
        if (
          current.includes(idString)
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

  // =====================================================
  // CLEAR SELECTION
  // =====================================================

  const clearSelection = () => {
    if (deleting) {
      return;
    }

    setSelectedMessageIds([]);

    setShowDeleteMenu(false);
  };

  // =====================================================
  // SELECTED MESSAGES
  // =====================================================

  const selectedMessages =
    visibleMessages.filter(
      (message) =>
        selectedMessageIds.includes(
          String(message.id)
        )
    );

  // =====================================================
  // CAN DELETE FOR EVERYONE
  // =====================================================

  const canDeleteForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every(
      (message) =>
        isMyMessage(message)
    );

  // =====================================================
  // OPEN DELETE OPTIONS
  // =====================================================

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
  // DELETE MESSAGES
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
      !deleteMessages
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

    // =================================================
    // LOCAL UPDATE
    // =================================================

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

        let updatedMessages;

        if (
          deleteType === "everyone"
        ) {
          updatedMessages =
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

                return !isMyMessage(
                  message
                );
              }
            );
        } else {
          updatedMessages =
            currentMessages.filter(
              (message) =>
                !idsToDelete.includes(
                  String(
                    message.id
                  )
                )
            );
        }

        return {
          ...current,
          messages:
            updatedMessages,
        };
      }
    );

    setSelectedMessageIds([]);

    // =================================================
    // FIREBASE DELETE
    // =================================================

    try {
      const success =
        await deleteMessages(
          id,
          idsToDelete,
          deleteType
        );

      if (!success) {
        console.error(
          "Seller message deletion failed."
        );
      }
    } catch (error) {
      console.error(
        "Seller delete message error:",
        error
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage =
    async () => {
      const text =
        messageText.trim();

      if (
        !text ||
        sending ||
        !sendMessage ||
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
          "Seller send message error:",
          error
        );

        setMessageText(text);
      } finally {
        setSending(false);
      }
    };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (
    e
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // =====================================================
  // GET INITIAL
  // =====================================================

  const getInitial = (
    name
  ) => {
    return (
      String(name || "B")
        .trim()
        .charAt(0)
        .toUpperCase() || "B"
    );
  };

  // =====================================================
  // CONVERSATION NOT FOUND
  // =====================================================

  if (
    !conversationLoading &&
    !liveConversation &&
    !fallbackConversation
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl border border-green-100 p-8 text-center shadow-sm max-w-md w-full">

          <div
            className="
              w-16
              h-16
              mx-auto
              rounded-full
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <FiX size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Conversation not found
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            The buyer conversation
            could not be found.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/seller/messages"
              )
            }
            className="
              mt-5
              bg-green-600
              hover:bg-green-700
              text-white
              px-5
              py-2.5
              rounded-xl
              font-semibold
              transition
            "
          >
            Back to Messages
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (
    conversationLoading &&
    !fallbackConversation
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div
            className="
              w-10
              h-10
              mx-auto
              rounded-full
              border-4
              border-green-100
              border-t-green-600
              animate-spin
            "
          />

          <p className="mt-4 text-sm text-gray-500">
            Loading conversation...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        fixed
        inset-0
        bg-white
        flex
        flex-col
        overflow-hidden
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          h-[68px]
          sm:h-[76px]

          flex
          items-center
          gap-3

          px-3
          sm:px-6

          border-b
          border-green-100

          bg-green-700
          text-white

          shrink-0

          z-20
        "
      >

        {selectedMessageIds.length > 0 ? (

          <>
            {/* CANCEL */}

            <button
              type="button"
              onClick={
                clearSelection
              }
              disabled={deleting}
              className="
                w-10
                h-10
                rounded-full
                hover:bg-green-600
                flex
                items-center
                justify-center
                transition
                disabled:opacity-50
              "
            >
              <FiX size={20} />
            </button>

            <div className="flex-1 min-w-0">

              <p className="font-bold">
                {
                  selectedMessageIds.length
                }{" "}
                selected
              </p>

              <p className="text-xs text-green-100">
                Select delete to
                continue
              </p>

            </div>

            <button
              type="button"
              onClick={
                openDeleteOptions
              }
              disabled={deleting}
              className="
                h-10
                px-4
                rounded-xl
                bg-white
                text-green-700
                flex
                items-center
                gap-2
                font-semibold
                text-sm
                transition
                disabled:opacity-50
              "
            >
              <FiTrash2 size={17} />

              <span className="hidden sm:inline">
                Delete
              </span>
            </button>
          </>

        ) : (

          <>
            {/* BACK */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/seller/messages"
                )
              }
              className="
                w-10
                h-10
                rounded-full
                hover:bg-green-600
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <FiArrowLeft
                size={20}
              />
            </button>

            {/* BUYER AVATAR */}

            <div className="relative shrink-0">

              {buyerImage ? (

                <img
                  src={buyerImage}
                  alt={buyerName}
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    rounded-full
                    object-cover
                    border-2
                    border-white/30
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
                    bg-white
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-lg
                  "
                >
                  {getInitial(
                    buyerName
                  )}
                </div>

              )}

            </div>

            {/* BUYER NAME */}

            <div className="flex-1 min-w-0">

              <h2
                className="
                  font-bold
                  truncate
                  text-sm
                  sm:text-base
                "
              >
                {buyerName}
              </h2>

              <p className="text-xs text-green-100 truncate">
                Buyer
              </p>

            </div>

          </>

        )}

      </div>

      {/* =================================================
          CHAT BODY
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

          bg-[#efeae2]

          [scrollbar-width:thin]
        "
      >

        {/* CONVERSATION LABEL */}

        <div className="text-center py-2 mb-2">

          <span
            className="
              inline-block
              bg-white
              text-gray-500
              text-[10px]
              sm:text-xs
              px-3
              py-1.5
              rounded-lg
              shadow-sm
            "
          >
            Conversation with{" "}
            {buyerName}
          </span>

        </div>

        {/* EMPTY */}

        {visibleMessages.length ===
          0 && (

          <div className="text-center py-12">

            <div
              className="
                w-14
                h-14
                mx-auto
                rounded-full
                bg-white
                text-green-600
                flex
                items-center
                justify-center
                mb-3
                shadow-sm
              "
            >
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

        {/* =================================================
            MESSAGES
        ================================================= */}

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
                className={`
                  flex
                  w-full
                  ${
                    mine
                      ? "justify-end"
                      : "justify-start"
                  }
                `}
              >

                <button
                  type="button"
                  onClick={() =>
                    toggleMessageSelection(
                      messageId
                    )
                  }
                  disabled={deleting}
                  className={`
                    relative

                    max-w-[85%]
                    sm:max-w-[65%]

                    min-w-[70px]

                    text-left

                    px-3
                    py-2

                    sm:px-3.5
                    sm:py-2.5

                    rounded-2xl

                    shadow-sm

                    transition

                    focus:outline-none

                    ${
                      selected
                        ? "ring-2 ring-green-500 ring-offset-2"
                        : ""
                    }

                    ${
                      mine
                        ? "bg-[#d9fdd3] text-gray-800 rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md"
                    }

                    disabled:opacity-70
                  `}
                >

                  {/* SELECTED */}

                  {selected && (
                    <div className="flex justify-end mb-1">

                      <span
                        className="
                          w-5
                          h-5
                          rounded-full
                          bg-green-600
                          text-white
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <FiCheck
                          size={13}
                        />
                      </span>

                    </div>
                  )}

                  {/* MESSAGE */}

                  <div
                    className="
                      flex
                      items-end
                      gap-2
                    "
                  >

                    <p
                      className="
                        text-sm
                        leading-5
                        break-words
                        whitespace-pre-wrap
                        min-w-0
                      "
                    >
                      {message.text}
                    </p>

                    <span
                      className="
                        text-[9px]
                        text-gray-400
                        whitespace-nowrap
                        shrink-0
                        pb-0.5
                      "
                    >
                      {formatMessageTime(
                        message
                      )}
                    </span>

                  </div>

                </button>

              </div>

            );
          }
        )}

        <div className="h-1" />

      </div>

      {/* =================================================
          INPUT
      ================================================= */}

      {selectedMessageIds.length ===
        0 && (

        <div
          className="
            flex-shrink-0

            border-t
            border-gray-200

            p-2.5
            sm:p-4

            bg-[#f0f2f5]

            pb-[calc(0.625rem+env(safe-area-inset-bottom))]
            sm:pb-4

            z-20
          "
        >

          <div className="flex items-center gap-2">

            <input
              type="text"
              value={messageText}
              onChange={(e) =>
                setMessageText(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={sending}
              placeholder={`Message ${buyerName}...`}
              className="
                flex-1
                min-w-0

                bg-white

                rounded-full

                px-4
                py-3

                text-sm

                outline-none

                border
                border-transparent

                focus:border-green-500
                focus:ring-2
                focus:ring-green-100

                disabled:opacity-60

                transition
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

                transition
              "
            >

              {sending ? (

                <span
                  className="
                    w-4
                    h-4
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                    animate-spin
                  "
                />

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

            {/* TITLE */}

            <div
              className="
                p-5
                border-b
                border-green-100
                bg-green-50
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-green-100
                    text-green-700
                    flex
                    items-center
                    justify-center
                  "
                >
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

            {/* DELETE FOR ME */}

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
                transition
                border-b
                border-gray-100
                disabled:opacity-50
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-green-100
                    text-green-700
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiTrash2
                    size={16}
                  />
                </div>

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

            {/* DELETE EVERYONE */}

            {canDeleteForEveryone && (

              <button
                type="button"
                disabled={deleting}
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
                  transition
                  border-b
                  border-gray-100
                  disabled:opacity-50
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-9
                      h-9
                      rounded-full
                      bg-green-100
                      text-green-700
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiTrash2
                      size={16}
                    />
                  </div>

                  <div>

                    <p className="font-semibold text-green-700">
                      Delete for
                      everyone
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Remove your message
                      for everyone.
                    </p>

                  </div>

                </div>

              </button>

            )}

            {/* CANCEL */}

            <div className="p-4 bg-gray-50">

              <button
                type="button"
                disabled={deleting}
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
                  hover:bg-gray-100
                  transition
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default SellerChat;