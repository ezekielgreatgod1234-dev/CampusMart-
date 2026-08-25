import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import {
  FiArrowLeft,
  FiCheck,
  FiMessageCircle,
  FiSend,
  FiTrash2,
  FiUsers,
  FiX,
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
  const { firebaseUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef(null);

  const sellerName =
    profile?.fullName ||
    firebaseUser?.displayName ||
    "Seller";

  useEffect(() => {
    if (!id || !firebaseUser?.uid) {
      setConversation(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setErrorText("");

    const ref = doc(db, "conversations", String(id));

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConversation(null);
          setErrorText("This conversation does not exist.");
          setLoading(false);
          return;
        }

        const data = snapshot.data() || {};
        const participants = Array.isArray(data.participants)
          ? data.participants.map(String)
          : [];

        if (!participants.includes(String(firebaseUser.uid))) {
          setConversation(null);
          setErrorText("You are not a participant in this conversation.");
          setLoading(false);
          return;
        }

        setConversation({ id: snapshot.id, ...data });
        setLoading(false);
      },
      (error) => {
        console.error("Seller chat listener error:", error);
        setConversation(null);
        setErrorText(
          error?.code === "permission-denied"
            ? "You do not have permission to open this conversation."
            : "Unable to load this conversation."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, firebaseUser?.uid]);

  const fallbackConversation = useMemo(
    () => messages.find((item) => String(item.id) === String(id)),
    [messages, id]
  );

  const otherParticipantId =
    conversation?.participants?.find(
      (uid) => String(uid) !== String(firebaseUser?.uid)
    ) || fallbackConversation?.otherParticipantId || null;

  const buyerName =
    conversation?.participantNames?.[otherParticipantId] ||
    fallbackConversation?.name ||
    "CampusMart Buyer";

  const buyerImage =
    conversation?.participantImages?.[otherParticipantId] ||
    fallbackConversation?.profileImage ||
    null;

  const productName =
    conversation?.productName ||
    fallbackConversation?.productName ||
    "";

  const rawMessages =
    Array.isArray(conversation?.messages)
      ? conversation.messages
      : Array.isArray(fallbackConversation?.allMessages)
      ? fallbackConversation.allMessages
      : Array.isArray(fallbackConversation?.conversation)
      ? fallbackConversation.conversation
      : [];

  const visibleMessages = useMemo(() => {
    return [...rawMessages]
      .filter((message) => {
        const deletedFor = Array.isArray(message.deletedFor)
          ? message.deletedFor
          : [];

        if (deletedFor.includes(firebaseUser?.uid)) return false;
        if (message.deletedForEveryone === true) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : Number(a.createdAt || 0);
        const bTime = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : Number(b.createdAt || 0);
        return aTime - bTime;
      });
  }, [rawMessages, firebaseUser?.uid]);

  useEffect(() => {
    if (!id || !markMessageAsRead) return;
    // Do not block rendering/navigation on the read update.
    Promise.resolve(markMessageAsRead(id)).catch((error) => {
      console.error("Seller chat read update error:", error);
    });
  }, [id, markMessageAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  const isMine = (message) => {
    return (
      String(message.senderId || "") === String(firebaseUser?.uid || "") ||
      message.sender === "me"
    );
  };

  const formatTime = (message) => {
    if (message.time) return message.time;
    if (!message.createdAt) return "";

    try {
      const date = message.createdAt?.toDate
        ? message.createdAt.toDate()
        : new Date(message.createdAt);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const toggleSelection = (messageId) => {
    if (deleting) return;
    const value = String(messageId);
    setSelectedIds((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const selectedMessages = visibleMessages.filter((message) =>
    selectedIds.includes(String(message.id))
  );

  const canDeleteForEveryone =
    selectedMessages.length > 0 && selectedMessages.every(isMine);

  const handleDelete = async (type) => {
    if (
      deleting ||
      !id ||
      !firebaseUser?.uid ||
      !deleteMessages ||
      selectedIds.length === 0
    ) {
      return;
    }

    if (type === "everyone" && !canDeleteForEveryone) return;

    setDeleting(true);
    setShowDeleteMenu(false);

    try {
      const ok = await deleteMessages(id, [...selectedIds], type);
      if (!ok) {
        console.error("Seller chat message deletion failed.");
      }
    } catch (error) {
      console.error("Seller chat delete error:", error);
    } finally {
      setSelectedIds([]);
      setDeleting(false);
    }
  };

  const handleSend = async () => {
    const clean = text.trim();
    if (!clean || sending || !sendMessage || !id) return;

    setSending(true);
    setText("");

    try {
      const ok = await sendMessage(id, clean);
      if (!ok) setText(clean);
    } catch (error) {
      console.error("Seller chat send error:", error);
      setText(clean);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <SellerChatShell
        sellerName={sellerName}
        buyerName="Loading..."
        buyerImage={null}
        unreadMessages={unreadMessages}
        navigate={navigate}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="mt-4 text-sm text-gray-500">Loading conversation...</p>
          </div>
        </div>
      </SellerChatShell>
    );
  }

  if (!conversation && !fallbackConversation) {
    return (
      <SellerChatShell
        sellerName={sellerName}
        buyerName="Buyer"
        buyerImage={null}
        unreadMessages={unreadMessages}
        navigate={navigate}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-green-100 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <FiX size={25} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">
              Conversation unavailable
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {errorText || "The conversation could not be opened."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/seller/messages")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </SellerChatShell>
    );
  }

  return (
    <SellerChatShell
      sellerName={sellerName}
      buyerName={buyerName}
      buyerImage={buyerImage}
      productName={productName}
      unreadMessages={unreadMessages}
      navigate={navigate}
      selectedCount={selectedIds.length}
      onCancelSelection={() => setSelectedIds([])}
      onDelete={() => setShowDeleteMenu(true)}
    >
      <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-green-50/40 to-gray-50 p-3 sm:p-6">
        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-2 bg-white border border-green-100 rounded-full px-3 py-1.5 text-xs text-green-700 shadow-sm">
            <FiUsers size={13} />
            Conversation with {buyerName}
          </span>
          {productName && (
            <p className="text-[11px] text-gray-400 mt-2">Product: {productName}</p>
          )}
        </div>

        {visibleMessages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <FiMessageCircle size={22} />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">No messages yet.</p>
            <p className="text-xs text-gray-400 mt-1">Send a reply to this buyer.</p>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {visibleMessages.map((message) => {
            const mine = isMine(message);
            const messageId = String(message.id);
            const selected = selectedIds.includes(messageId);

            return (
              <div
                key={message.id || `${message.createdAt}-${message.text}`}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelection(messageId)}
                  disabled={deleting}
                  className={`max-w-[88%] sm:max-w-[68%] text-left px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl focus:outline-none transition ${
                    selected ? "ring-2 ring-green-500 ring-offset-2" : ""
                  } ${
                    mine
                      ? "bg-green-600 text-white rounded-br-md shadow-sm"
                      : "bg-white text-gray-700 rounded-bl-md shadow-sm border border-green-50"
                  }`}
                >
                  {selected && (
                    <div className="flex justify-end mb-1">
                      <span className="w-5 h-5 rounded-full bg-white text-green-600 flex items-center justify-center">
                        <FiCheck size={13} />
                      </span>
                    </div>
                  )}

                  <p className="text-sm leading-5 break-words whitespace-pre-wrap">
                    {message.text || (message.imageUrl ? "📷 Photo" : "")}
                  </p>

                  <p className={`text-[10px] mt-1 ${mine ? "text-green-100" : "text-gray-400"}`}>
                    {formatTime(message)}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} className="h-1" />
      </div>

      {selectedIds.length === 0 ? (
        <div className="shrink-0 border-t border-green-100 bg-white p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder={`Reply to ${buyerName}...`}
              className="flex-1 min-w-0 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white flex items-center justify-center shrink-0"
            >
              {sending ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <FiSend size={18} />
              )}
            </button>
          </div>
        </div>
      ) : null}

      {showDeleteMenu && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
          onClick={() => !deleting && setShowDeleteMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-5 border-b border-green-100 bg-green-50">
              <h3 className="text-lg font-bold text-gray-900">
                Delete message{selectedIds.length > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Choose an option.</p>
            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={() => handleDelete("me")}
              className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <FiTrash2 className="text-green-700" />
                <div>
                  <p className="font-semibold text-gray-800">Delete for me</p>
                  <p className="text-xs text-gray-500 mt-1">Remove from your chat only.</p>
                </div>
              </div>
            </button>

            {canDeleteForEveryone && (
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete("everyone")}
                className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <FiTrash2 className="text-green-700" />
                  <div>
                    <p className="font-semibold text-green-700">Delete for everyone</p>
                    <p className="text-xs text-gray-500 mt-1">Remove your message for both users.</p>
                  </div>
                </div>
              </button>
            )}

            <div className="p-4 bg-gray-50">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteMenu(false)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerChatShell>
  );
}

function SellerChatShell({
  sellerName,
  buyerName,
  buyerImage,
  productName,
  unreadMessages,
  navigate,
  children,
  selectedCount = 0,
  onCancelSelection,
  onDelete,
}) {
  const initial = String(buyerName || "B").trim().charAt(0).toUpperCase() || "B";

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 flex flex-col overflow-hidden">
      <header className="h-[70px] shrink-0 bg-green-800 text-white flex items-center px-4 sm:px-6 gap-3">
        <button
          type="button"
          onClick={() => navigate("/seller/messages")}
          className="w-10 h-10 rounded-full hover:bg-green-700 flex items-center justify-center"
          title="Back to messages"
        >
          <FiArrowLeft size={19} />
        </button>

        {selectedCount > 0 ? (
          <>
            <button
              type="button"
              onClick={onCancelSelection}
              className="w-10 h-10 rounded-full hover:bg-green-700 flex items-center justify-center"
            >
              <FiX size={19} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold">{selectedCount} selected</p>
              <p className="text-xs text-green-100">Choose delete to continue.</p>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="h-10 px-3 sm:px-4 rounded-xl bg-white text-green-700 font-semibold flex items-center gap-2"
            >
              <FiTrash2 size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </>
        ) : (
          <>
            {buyerImage ? (
              <img
                src={buyerImage}
                alt={buyerName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-green-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white text-green-700 flex items-center justify-center font-bold">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{buyerName}</p>
              <p className="text-xs text-green-100 truncate">
                {productName ? `About ${productName}` : `Chat with ${sellerName}'s buyer`}
              </p>
            </div>

            {unreadMessages > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-green-700 px-3 py-1.5 rounded-full">
                {unreadMessages} unread
              </span>
            )}
          </>
        )}
      </header>

      {children}
    </div>
  );
}

export default SellerChat;