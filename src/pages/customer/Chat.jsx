import {
  useEffect,
  useRef,
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
} from "firebase/firestore";

import { db } from "../../context/firebase";

import { useAuth } from "../../context/AuthContext";


// =====================================================
// CLOUDINARY (Spark-friendly — no Firebase Storage)
// Set these in .env:
//   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   VITE_CLOUDINARY_UPLOAD_PRESET=campusmart_unsigned
// =====================================================
const CLOUDINARY_CLOUD_NAME =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) ||
  "quj7ewsm";

const CLOUDINARY_UPLOAD_PRESET =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) ||
  "campusmart_unsigned";


import {
  FiArrowLeft,
  FiSend,
  FiTrash2,
  FiX,
  FiCheck,
  FiFileText,
  FiExternalLink,
  FiPaperclip,
  FiImage,
  FiPackage,
  FiCamera,
} from "react-icons/fi";

// =====================================================
// PRODUCT ATTACH — only the FIRST time.
// Once the product card has been sent (or the buyer removed it),
// we remember that per user + conversation + product so the
// "Sending with product" bar never comes back for normal chats.
// =====================================================
const productHandledKey = (uid, conversationId, productId) =>
  `cm_product_handled:${uid || "anon"}:${conversationId}:${productId}`;

const readProductHandled = (key) => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeProductHandled = (key) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* storage unavailable — the messages check below still protects us */
  }
};

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
  const messagesEndRef = useRef(null);

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // { file, previewUrl, kind: "image"|"file" }
  const [uploadingFile, setUploadingFile] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachProduct, setAttachProduct] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [toast, setToast] = useState(null); // { type: "error"|"success", message }
  const toastTimerRef = useRef(null);
  const [liveConversation, setLiveConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);


  const showToast = (message, type = "error") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message: String(message || ""), type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4200);
  };

  const copyMessageText = async (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      showToast("Message copied", "success");
    } catch (err) {
      console.warn("Copy failed:", err);
      showToast("Could not copy message", "error");
    }
  };

  // =====================================================
  // TIMESTAMP HELPER (only for display time under bubbles)
  // =====================================================

  const getMessageTimestampMs = (message) => {
    if (!message) return 0;

    if (
      typeof message.createdAtMs === "number" &&
      Number.isFinite(message.createdAtMs) &&
      message.createdAtMs > 0
    ) {
      return message.createdAtMs < 1e12
        ? message.createdAtMs * 1000
        : message.createdAtMs;
    }

    const createdAt = message.createdAt;
    if (createdAt == null) return 0;

    if (typeof createdAt.toMillis === "function") {
      const ms = createdAt.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }

    if (
      typeof createdAt === "object" &&
      typeof createdAt.seconds === "number"
    ) {
      return (
        createdAt.seconds * 1000 +
        Math.floor((createdAt.nanoseconds || 0) / 1e6)
      );
    }

    if (typeof createdAt === "number" && Number.isFinite(createdAt)) {
      return createdAt < 1e12 ? createdAt * 1000 : createdAt;
    }

    if (createdAt instanceof Date) {
      const t = createdAt.getTime();
      return Number.isFinite(t) ? t : 0;
    }

    if (typeof createdAt === "string") {
      const t = Date.parse(createdAt);
      return Number.isFinite(t) ? t : 0;
    }

    return 0;
  };

  const fallbackPerson = messages.find(
    (message) => String(message.id) === String(id)
  );

  // Lock page scroll on mobile
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Live conversation
  useEffect(() => {
    if (!id) {
      setLiveConversation(null);
      setConversationLoading(false);
      return undefined;
    }

    setConversationLoading(true);

    const conversationRef = doc(db, "conversations", String(id));

    const unsubscribe = onSnapshot(
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
        console.error("Buyer chat listener error:", error);
        setLiveConversation(null);
        setConversationLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Other participant
  const otherParticipantId =
    liveConversation?.buyerId === firebaseUser?.uid
      ? liveConversation?.sellerId
      : liveConversation?.sellerId === firebaseUser?.uid
        ? liveConversation?.buyerId
        : liveConversation?.participants?.find(
            (uid) => String(uid) !== String(firebaseUser?.uid)
          ) ||
          fallbackPerson?.otherParticipantId ||
          null;

  const personName =
    liveConversation?.participantNames?.[otherParticipantId] ||
    fallbackPerson?.name ||
    "CampusMart User";

  const personImage =
    liveConversation?.participantImages?.[otherParticipantId] ||
    fallbackPerson?.profileImage ||
    fallbackPerson?.image ||
    fallbackPerson?.photoURL ||
    null;

  // Product linked to this conversation (for seeding first product message)
  const contextProduct = (() => {
    const src = liveConversation || fallbackPerson || {};
    const productId = src.productId || src.product?.id || null;
    if (!productId && !src.productName && !src.productImage) return null;
    return {
      id: productId ? String(productId) : null,
      name: src.productName || src.product?.name || "Product",
      image: src.productImage || src.product?.image || null,
      price: src.productPrice ?? src.product?.price ?? null,
    };
  })();

  // =====================================================
  // MESSAGES — USE FIRESTORE ARRAY ORDER DIRECTLY.
  //
  // Every message is appended to this array inside a
  // transaction (read current array -> push new message ->
  // write it back), so the array is ALREADY in the exact
  // order messages were actually sent — it is the single
  // source of truth for chronology.
  //
  // This used to re-sort the array by createdAt/createdAtMs.
  // That's what caused messages to scatter: if the sender's
  // device clock is even slightly off, or a message written
  // by a different app version has a timestamp in a
  // different shape/units, re-sorting can flip two messages
  // relative to each other even though Firestore had already
  // stored them in the correct order. Trusting the array
  // order avoids that entirely. (Mirrors the same fix in
  // SellerChat.jsx — keep both in sync if this changes.)
  // =====================================================


  const chatMessages =
    liveConversation && Array.isArray(liveConversation.messages)
      ? liveConversation.messages
      : fallbackPerson?.conversation || [];

  // Has this product already been sent in this conversation (or dismissed)?
  // Checks the raw messages (even ones deleted "for me") AND a saved flag,
  // so deleting the product card later doesn't make it pop up again.
  const handledKey = contextProduct?.id
    ? productHandledKey(firebaseUser?.uid, id, contextProduct.id)
    : null;

  const productAlreadySent = (() => {
    if (!contextProduct?.id) return false;

    const inMessages = chatMessages.some(
      (m) =>
        m?.type === "product" &&
        String(m?.productId) === String(contextProduct.id)
    );

    return inMessages || (handledKey ? readProductHandled(handledKey) : false);
  })();

  const markProductHandled = () => {
    if (handledKey) writeProductHandled(handledKey);
  };

  // Attach the product ONLY the first time you chat about it.
  // Wait until the conversation has loaded so we can see its messages.
  useEffect(() => {
    if (conversationLoading) return;

    if (contextProduct?.id && !productAlreadySent) {
      setAttachProduct(true);
    } else {
      setAttachProduct(false);
    }
  }, [id, conversationLoading, contextProduct?.id, productAlreadySent]);

  const orderedChatMessages = chatMessages;

  const isMyMessage = (message) => {
    if (!message || !firebaseUser?.uid) return false;

    if (message.senderId) {
      return String(message.senderId) === String(firebaseUser.uid);
    }
    if (message.senderUid) {
      return String(message.senderUid) === String(firebaseUser.uid);
    }
    if (message.userId) {
      return String(message.userId) === String(firebaseUser.uid);
    }
    return message.sender === "me";
  };

  // Mark as read
  useEffect(() => {
    if (
      !id ||
      !firebaseUser?.uid ||
      !liveConversation ||
      !Array.isArray(liveConversation.messages)
    ) {
      return;
    }

    if (typeof markMessageAsRead !== "function") return;

    let cancelled = false;

    const markRead = async () => {
      try {
        await Promise.resolve(markMessageAsRead(id));
      } catch (error) {
        if (!cancelled) {
          console.error("Buyer mark messages as read error:", error);
        }
      }
    };

    markRead();

    return () => {
      cancelled = true;
    };
  }, [id, firebaseUser?.uid, liveConversation?.id, markMessageAsRead]);

  const visibleMessages = orderedChatMessages.filter((message) => {
    const deletedFor = Array.isArray(message.deletedFor)
      ? message.deletedFor
      : [];

    if (firebaseUser?.uid && deletedFor.includes(firebaseUser.uid)) {
      return false;
    }

    if (message.deletedForEveryone === true) {
      return false;
    }

    return true;
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length, id]);

  useEffect(() => {
    const availableIds = new Set(
      visibleMessages.map((message) => String(message.id))
    );

    setSelectedMessageIds((current) =>
      current.filter((messageId) => availableIds.has(String(messageId)))
    );
  }, [liveConversation]);

  const formatMessageTime = (message) => {
    if (message?.time && typeof message.time === "string") {
      return message.time;
    }
    if (message?.formattedTime && typeof message.formattedTime === "string") {
      return message.formattedTime;
    }

    const ms = getMessageTimestampMs(message);
    if (!ms) return "";

    try {
      return new Date(ms).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // =====================================================
  // SEEN DETECTION
  // Mirrors the logic used in the conversation list (Messages.jsx)
  // so a message's ticks turn blue the same way the list preview
  // does. Checks, in order:
  //  1) per-message read arrays (readBy / seenBy / readByUserIds ...)
  //  2) per-message read maps ({ [uid]: true })
  //  3) simple boolean/timestamp flags (seenAt, readAt, isRead, seen)
  //  4) conversation-level unreadCounts for the other participant
  // =====================================================

  const isMessageSeen = (message) => {
    if (!message) return false;

    const readArrays = [
      message.readBy,
      message.seenBy,
      message.lastMessageSeenBy,
      message.readByUserIds,
      message.seenByUserIds,
    ];

    for (const readArray of readArrays) {
      if (
        Array.isArray(readArray) &&
        otherParticipantId &&
        readArray.some((uid) => String(uid) === String(otherParticipantId))
      ) {
        return true;
      }
    }

    const readObjects = [message.readBy, message.seenBy, message.lastMessageSeenBy];

    for (const readObject of readObjects) {
      if (
        readObject &&
        typeof readObject === "object" &&
        !Array.isArray(readObject) &&
        otherParticipantId &&
        readObject[otherParticipantId] === true
      ) {
        return true;
      }
    }

    if (
      message.seenAt ||
      message.readAt ||
      message.isRead === true ||
      message.seen === true
    ) {
      return true;
    }

    // Fallback: if the other participant's unread count on the
    // conversation is 0, they've caught up on everything I sent.
    if (
      isMyMessage(message) &&
      otherParticipantId &&
      liveConversation?.unreadCounts &&
      Object.prototype.hasOwnProperty.call(
        liveConversation.unreadCounts,
        otherParticipantId
      )
    ) {
      return Number(liveConversation.unreadCounts[otherParticipantId] || 0) === 0;
    }

    return false;
  };

  const MessageTicks = ({ message }) => {
    if (!isMyMessage(message)) return null;

    const seen = isMessageSeen(message);

    return (
      <span
        className={`inline-flex items-center ml-1 align-middle ${
          seen ? "text-blue-200" : "text-green-100"
        }`}
        title={seen ? "Seen" : "Sent"}
      >
        {seen ? (
          <span className="relative inline-flex items-center">
            <FiCheck size={12} strokeWidth={3} />
            <FiCheck size={12} strokeWidth={3} className="-ml-[7px]" />
          </span>
        ) : (
          <FiCheck size={13} strokeWidth={3} />
        )}
      </span>
    );
  };

  const getMessageId = (message, index) =>
    String(message.id || `${getMessageTimestampMs(message)}-${index}`);

  // Select every visible message and jump straight to the delete
  // confirmation, instead of making the user tap each bubble.
  const selectAllForDeletion = () => {
    if (deleting || visibleMessages.length === 0) return;
    const allIds = visibleMessages.map((message, index) =>
      getMessageId(message, index)
    );
    setSelectedMessageIds(allIds);
    setShowDeleteMenu(true);
  };

  const toggleMessageSelection = (messageId) => {
    if (deleting) return;
    const idString = String(messageId);
    setSelectedMessageIds((current) =>
      current.includes(idString)
        ? current.filter((item) => item !== idString)
        : [...current, idString]
    );
  };

  const clearSelection = () => {
    if (deleting) return;
    setSelectedMessageIds([]);
    setShowDeleteMenu(false);
  };

  const selectedMessages = visibleMessages.filter((message) =>
    selectedMessageIds.includes(String(message.id))
  );

  const canDeleteForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every((message) => isMyMessage(message));

  const openDeleteOptions = () => {
    if (selectedMessageIds.length === 0 || deleting) return;
    setShowDeleteMenu(true);
  };

  const handleDelete = async (deleteType) => {
    if (
      deleting ||
      selectedMessageIds.length === 0 ||
      !firebaseUser?.uid ||
      !id ||
      typeof deleteMessages !== "function"
    ) {
      return;
    }

    if (deleteType !== "me" && deleteType !== "everyone") return;
    if (deleteType === "everyone" && !canDeleteForEveryone) return;

    const idsToDelete = [...selectedMessageIds];

    setDeleting(true);
    setShowDeleteMenu(false);

    setLiveConversation((current) => {
      if (!current) return current;
      const currentMessages = Array.isArray(current.messages)
        ? current.messages
        : [];

      const updatedMessages = currentMessages.filter((message) => {
        const messageId = String(message.id);
        if (!idsToDelete.includes(messageId)) return true;
        if (deleteType === "me") return false;
        if (deleteType === "everyone" && isMyMessage(message)) return false;
        return true;
      });

      return { ...current, messages: updatedMessages };
    });

    setSelectedMessageIds([]);

    try {
      await deleteMessages(id, idsToDelete, deleteType);
    } catch (error) {
      console.error("Customer delete message error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) {
      try {
        URL.revokeObjectURL(pendingFile.previewUrl);
      } catch (_) {}
    }
    setPendingFile(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImageFile = (file) =>
    file && String(file.type || "").startsWith("image/");

  const compressImage = (file, maxWidth = 1280, quality = 0.72) =>
    new Promise((resolve) => {
      if (!isImageFile(file)) {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / (img.width || maxWidth));
          const w = Math.max(1, Math.round((img.width || maxWidth) * scale));
          const h = Math.max(1, Math.round((img.height || maxWidth) * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (!blob) {
                resolve(file);
                return;
              }
              resolve(
                new File([blob], file.name.replace(/\.\w+$/, ".jpg") || "photo.jpg", {
                  type: "image/jpeg",
                })
              );
            },
            "image/jpeg",
            quality
          );
        } catch {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });

  const handlePickAttachment = (e, kindHint) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = isImageFile(file);
    const isPdf =
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name || "");
    const isDoc =
      /\.(doc|docx|txt|xls|xlsx|ppt|pptx)$/i.test(file.name || "") ||
      String(file.type || "").includes("document") ||
      String(file.type || "").includes("msword") ||
      String(file.type || "").includes("officedocument");

    if (!isImg && !isPdf && !isDoc && kindHint !== "file") {
      showToast("Please choose an image, PDF, or document.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast("File is too large. Please use a file under 12MB.");
      return;
    }

    if (pendingFile?.previewUrl) {
      try {
        URL.revokeObjectURL(pendingFile.previewUrl);
      } catch (_) {}
    }

    setPendingFile({
      file,
      previewUrl: isImg ? URL.createObjectURL(file) : null,
      kind: isImg ? "image" : "file",
      name: file.name || "file",
    });
  };

const uploadChatFile = async (file) => {
    if (!file) throw new Error("No file selected");

    if (
      !CLOUDINARY_CLOUD_NAME ||
      CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" ||
      !CLOUDINARY_UPLOAD_PRESET
    ) {
      throw new Error(
        "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file."
      );
    }

    const isImage = isImageFile(file);
    const resourceType = isImage ? "image" : "raw";
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append(
      "folder",
      isImage ? "campusmart/chat-images" : "campusmart/chat-files"
    );

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Upload failed (${response.status})`;
      throw new Error(msg);
    }

    const url = data.secure_url || data.url;
    if (!url) throw new Error("Upload succeeded but no URL was returned");
    return url;
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    const hasFile = Boolean(pendingFile?.file);
    const shouldAttachProduct =
      attachProduct &&
      !productAlreadySent &&
      contextProduct &&
      contextProduct.id;

    // Need at least text, file, or product
    if ((!text && !hasFile && !shouldAttachProduct) || sending || uploadingFile) {
      return;
    }
    if (typeof sendMessage !== "function") return;
    if (!id) return;

    const localPending = pendingFile;
    const productToSend = shouldAttachProduct ? { ...contextProduct } : null;

    setMessageText("");
    clearPendingFile();
    if (productToSend) setAttachProduct(false);
    setSending(true);

    try {
      let fileMeta = null;

      if (localPending?.file) {
        setUploadingFile(true);
        const toUpload =
          localPending.kind === "image"
            ? await compressImage(localPending.file)
            : localPending.file;
        const fileUrl = await uploadChatFile(toUpload);
        fileMeta = {
          type: localPending.kind === "image" ? "image" : "file",
          fileUrl,
          imageUrl: localPending.kind === "image" ? fileUrl : undefined,
          fileName: localPending.name,
          fileMime: localPending.file.type || "",
          text:
            text ||
            (localPending.kind === "image"
              ? "📷 Photo"
              : `📎 ${localPending.name}`),
        };
      }

      // 1) Send product card with optional text (user message goes on the product bubble)
      if (productToSend) {
        const productText = text || productToSend.name || "Product";
        const okProduct = await sendMessage(id, productText, {
          type: "product",
          productId: productToSend.id,
          productName: productToSend.name,
          productImage: productToSend.image,
          productPrice: productToSend.price,
          text: productText,
        });
        if (okProduct === false) {
          setMessageText(text);
          setAttachProduct(true);
          showToast("Message failed to send. Please try again.");
          return;
        }
        // Product card is out — never attach it again for this chat
        markProductHandled();
        // If user also attached a file, send it as a follow-up
        if (fileMeta) {
          const okFile = await sendMessage(
            id,
            fileMeta.text || "📷 Photo",
            fileMeta
          );
          if (okFile === false) {
            showToast("Product sent, but the attachment failed.");
          }
        }
      } else if (fileMeta) {
        const payloadText =
          text ||
          (fileMeta.type === "image"
            ? "📷 Photo"
            : `📎 ${fileMeta.fileName}`);
        const success = await sendMessage(id, payloadText, fileMeta);
        if (success === false) {
          setMessageText(text);
          showToast("Message failed to send. Please try again.");
        }
      } else {
        const success = await sendMessage(id, text);
        if (success === false) {
          setMessageText(text);
          showToast("Message failed to send. Please try again.");
        }
      }
    } catch (error) {
      console.error("Customer send message error:", error);
      setMessageText(text);
      if (productToSend) setAttachProduct(true);

      const errorText = String(error?.message || "");
      const normalizedError = errorText.toLowerCase();

      let userMessage =
        "Message failed to send. Check your connection and try again.";

      if (
        normalizedError.includes("cloudinary") ||
        normalizedError.includes("not configured")
      ) {
        userMessage = errorText || "Cloudinary upload failed.";
      } else if (
        normalizedError.includes("participant") ||
        normalizedError.includes("permission") ||
        normalizedError.includes("insufficient")
      ) {
        userMessage = "You cannot send in this conversation.";
      } else if (localPending?.file) {
        userMessage = "Could not upload file. Please try again.";
      }

      showToast(userMessage);
    } finally {
      setUploadingFile(false);
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitial = (name) =>
    String(name || "C").trim().charAt(0).toUpperCase() || "C";

  if (!conversationLoading && !liveConversation && !fallbackPerson) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={unreadMessages}
      >
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <FiX size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Conversation not found
          </h2>
          <p className="text-gray-500 mt-2">
            The conversation you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            Back to Messages
          </button>
        </div>
      </CustomerLayout>
    );
  }

  if (conversationLoading && !fallbackPerson) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={unreadMessages}
      >
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center shadow-sm">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading conversation...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div
        className="
          fixed inset-0 md:static md:h-[calc(100vh-140px)]
          z-[100] md:z-auto bg-white md:rounded-2xl
          border-0 md:border border-green-100
          overflow-hidden flex flex-col shadow-sm
          h-[100dvh] min-h-0
        "
      >
        {/* HEADER */}
        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-6 py-2.5 sm:py-4 border-b border-green-100 bg-white flex-shrink-0 z-30 pt-[max(0.625rem,env(safe-area-inset-top))]">
          {selectedMessageIds.length > 0 ? (
            <>
              <button
                type="button"
                onClick={clearSelection}
                disabled={deleting}
                className="w-10 h-10 rounded-full hover:bg-green-50 flex items-center justify-center text-green-700 flex-shrink-0"
              >
                <FiX size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">
                  {selectedMessageIds.length} selected
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Choose delete to continue
                </p>
              </div>
              <button
                type="button"
                onClick={openDeleteOptions}
                disabled={deleting}
                className="h-10 px-3 sm:px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 font-semibold text-sm flex-shrink-0"
              >
                <FiTrash2 size={17} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/messages")}
                aria-label="Back to messages"
                className="w-10 h-10 min-w-[40px] rounded-full hover:bg-green-50 active:bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0"
              >
                <FiArrowLeft size={20} />
              </button>
              {personImage ? (
                <img
                  src={personImage}
                  alt={personName}
                  className="w-10 h-10 min-w-[40px] sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-green-100 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 min-w-[40px] sm:w-11 sm:h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {getInitial(personName)}
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h2 className="font-bold text-gray-800 truncate text-sm sm:text-base">
                  {personName}
                </h2>
                <p className="text-xs text-green-600 truncate">
                  CampusMart conversation
                </p>
              </div>

              {visibleMessages.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllForDeletion}
                  disabled={deleting}
                  title="Clear all messages"
                  aria-label="Delete messages"
                  className="w-10 h-10 min-w-[40px] rounded-full hover:bg-green-50 active:bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-2 sm:space-y-3 bg-gradient-to-b from-green-50/40 to-gray-50 [scrollbar-width:thin] touch-pan-y">
          <div className="text-center mb-3 sm:mb-4">
            <span className="inline-block bg-white text-green-600 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
              Conversation with {personName}
            </span>
          </div>

          

          {visibleMessages.length === 0 && (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                <FiSend size={22} />
              </div>
              <p className="text-sm font-medium text-gray-500">No messages yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Send a message to start the conversation.
              </p>
            </div>
          )}

          {visibleMessages.map((message, index) => {
            const mine = isMyMessage(message);
            const messageId = getMessageId(message, index);
            const selected = selectedMessageIds.includes(messageId);

            const isReceiptMessage = message?.type === "receipt";
            const isProductMessage = message?.type === "product";
            const isFileMessage =
              message?.type === "file" ||
              (message?.fileUrl && message?.type !== "image");

            const receiptUrl =
              message?.receiptUrl ||
              (message?.orderId
                ? `${window.location.origin}/receipt/${message.orderId}`
                : "");

            const openReceipt = (event) => {
              event.stopPropagation();

              if (!receiptUrl) return;

              // Keep the receipt inside the SPA when possible.
              if (receiptUrl.startsWith(window.location.origin)) {
                const path = receiptUrl.replace(window.location.origin, "");
                navigate(path);
                return;
              }

              window.open(receiptUrl, "_blank", "noopener,noreferrer");
            };

            if (isProductMessage) {
              const pId = message.productId;
              const pName = message.productName || message.text || "Product";
              const pImage = message.productImage || null;
              const pPrice = message.productPrice;
              return (
                <div
                  key={messageId}
                  className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMessageIds.length > 0) {
                        toggleMessageSelection(messageId);
                        return;
                      }
                      if (pId) navigate(`/products/${pId}`);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleMessageSelection(messageId);
                    }}
                    className={`
                      max-w-[88%] sm:max-w-[70%] text-left rounded-2xl overflow-hidden
                      border shadow-sm transition
                      ${selected ? "ring-2 ring-green-500 ring-offset-2" : ""}
                      ${
                        mine
                          ? "bg-green-800 border-green-700 rounded-br-md"
                          : "bg-white border-green-200 rounded-bl-md"
                      }
                    `}
                  >
                    <div className="flex gap-3 p-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-green-50 flex-shrink-0 border border-green-100">
                        {pImage ? (
                          <img src={pImage} alt={pName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-green-600">
                            <FiPackage size={22} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${mine ? "text-green-100" : "text-green-600"}`}>
                          Product
                        </p>
                        <p className={`text-sm font-bold mt-0.5 line-clamp-2 ${mine ? "text-white" : "text-gray-900"}`}>
                          {pName}
                        </p>
                        {pPrice != null && Number(pPrice) > 0 && (
                          <p className={`text-xs font-semibold mt-1 ${mine ? "text-green-100" : "text-gray-700"}`}>
                            ₦{Number(pPrice).toLocaleString("en-NG")}
                          </p>
                        )}
                        {message.text &&
                          message.text !== pName &&
                          message.text !== "Product" && (
                          <p
                            className={`text-sm mt-2 leading-5 break-words whitespace-pre-wrap select-text ${
                              mine ? "text-green-50" : "text-gray-700"
                            }`}
                            title="Double-tap to copy"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              copyMessageText(message.text);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              copyMessageText(message.text);
                            }}
                          >
                            {message.text}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center justify-end gap-0.5 text-[10px] px-3 pb-2 ${mine ? "text-green-100" : "text-gray-400"}`}>
                      <span>{formatMessageTime(message)}</span>
                      <MessageTicks message={message} />
                    </div>
                  </button>
                </div>
              );
            }

            return (
              <div
                key={messageId}
                className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}
              >
                {isReceiptMessage ? (
                  <div
                    onClick={() => toggleMessageSelection(messageId)}
                    className={`
                      max-w-[88%] sm:max-w-[70%] rounded-2xl overflow-hidden
                      cursor-pointer transition
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
                      <div className="flex justify-end px-3 pt-2">
                        <span className="w-5 h-5 rounded-full bg-white text-green-600 flex items-center justify-center">
                          <FiCheck size={13} />
                        </span>
                      </div>
                    )}

                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                          <FiFileText size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-base">
                            {message.orderNumber
                              ? `Receipt #${message.orderNumber}`
                              : "CampusMart Receipt"}
                          </p>

                          <p className="text-xs text-green-100 mt-1">
                            {message.text || "Payment receipt shared with you."}
                          </p>

                          {message.amount != null && (
                            <p className="font-bold text-sm mt-2">
                              ₦
                              {Number(message.amount || 0).toLocaleString(
                                "en-NG"
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={openReceipt}
                        disabled={!receiptUrl}
                        className="
                          mt-3 w-full h-10 rounded-xl bg-white text-green-700
                          hover:bg-green-50 disabled:opacity-50
                          flex items-center justify-center gap-2
                          font-bold text-xs sm:text-sm transition
                        "
                      >
                        <FiExternalLink size={15} />
                        View & Download Receipt
                      </button>

                      <div className="flex items-center justify-end gap-0.5 text-[10px] mt-2 text-green-100">
                        <span>{formatMessageTime(message)}</span>
                        <MessageTicks message={message} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleMessageSelection(messageId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleMessageSelection(messageId);
                      }
                    }}
                    aria-disabled={deleting}
                    className={`
                      max-w-[82%] sm:max-w-[65%] text-left px-3.5 py-2.5 sm:px-4 sm:py-3
                      rounded-2xl transition cursor-pointer
                      ${selected ? "ring-2 ring-green-500 ring-offset-2" : ""}
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
                          <FiCheck size={13} />
                        </span>
                      </div>
                    )}
                    {(message?.type === "image" || message?.imageUrl) && (
                      <div className="mb-2 rounded-xl overflow-hidden bg-black/10 max-w-full">
                        <img
                          src={message.imageUrl || message.fileUrl || message.text}
                          alt="Shared"
                          className="max-h-56 w-full object-cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxUrl(
                              message.imageUrl || message.fileUrl || message.text
                            );
                          }}
                        />
                      </div>
                    )}
                    {isFileMessage && (
                      <a
                        href={message.fileUrl || message.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="mb-2 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-left hover:bg-white/25 cursor-pointer"
                      >
                        <FiFileText size={18} />
                        <span className="text-xs font-semibold truncate">
                          {message.fileName || "Document"}
                        </span>
                        <FiExternalLink size={14} className="ml-auto shrink-0" />
                      </a>
                    )}
                    {message.text &&
                      message.text !== "📷 Photo" &&
                      !String(message.text || "").startsWith("📎 ") &&
                      message?.type !== "product" && (
                      <p
                        className="text-sm leading-5 break-words whitespace-pre-wrap select-text"
                        title="Double-tap to copy"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          copyMessageText(message.text);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyMessageText(message.text);
                        }}
                      >
                        {message.text}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-0.5 text-[10px] mt-1 text-green-100">
                      <span>{formatMessageTime(message)}</span>
                      <MessageTicks message={message} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>

        {/* INPUT */}
        {selectedMessageIds.length === 0 && (
          <div className="flex-shrink-0 border-t border-green-100 bg-white z-30 px-2.5 sm:px-4 pt-2.5 sm:pt-4 pb-2 sm:pb-4 [padding-bottom:env(safe-area-inset-bottom)]">
            {attachProduct && contextProduct && (
              <div className="mb-2 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50/80 px-3 py-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-green-100 flex-shrink-0">
                  {contextProduct.image ? (
                    <img
                      src={contextProduct.image}
                      alt={contextProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-600">
                      <FiPackage size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    Sending with product
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {contextProduct.name}
                  </p>
                  {contextProduct.price != null &&
                    Number(contextProduct.price) > 0 && (
                      <p className="text-[11px] font-semibold text-gray-600">
                        ₦
                        {Number(contextProduct.price).toLocaleString("en-NG")}
                      </p>
                    )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    markProductHandled();
                    setAttachProduct(false);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-white text-gray-500 flex items-center justify-center flex-shrink-0"
                  aria-label="Remove product"
                  title="Remove product"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}

            {pendingFile && (
              <div className="mb-2 flex items-center gap-2">
                {pendingFile.kind === "image" && pendingFile.previewUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-green-200">
                    <img
                      src={pendingFile.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                    <FiFileText className="text-green-700" size={18} />
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">
                      {pendingFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      className="w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 flex-1">Ready to send</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePickAttachment(e, "image")}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePickAttachment(e, "image")}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handlePickAttachment(e, "file")}
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={sending || uploadingFile}
                title="Gallery"
                aria-label="Gallery"
                className="w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center shrink-0 border border-green-100 disabled:opacity-50"
              >
                <FiImage size={18} />
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={sending || uploadingFile}
                title="Camera"
                aria-label="Camera"
                className="w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center shrink-0 border border-green-100 disabled:opacity-50 sm:flex"
              >
                <FiCamera size={18} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploadingFile}
                title="Document"
                aria-label="Document"
                className="w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center shrink-0 border border-green-100 disabled:opacity-50"
              >
                <FiPaperclip size={18} />
              </button>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending || uploadingFile}
                placeholder={`Message ${personName}...`}
                className="flex-1 min-w-0 bg-gray-100 rounded-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none border border-transparent focus:ring-2 focus:ring-green-100 focus:border-green-500 focus:bg-white disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  (!messageText.trim() &&
                    !pendingFile &&
                    !(attachProduct && contextProduct?.id)) ||
                  sending ||
                  uploadingFile
                }
                className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white flex items-center justify-center shrink-0"
              >
                {sending || uploadingFile ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <FiSend size={18} />
                )}
              </button>
            </div>
          </div>
        )}

        
        {/* CAMPUSMART TOAST */}
        {toast && (
          <div className="fixed left-1/2 bottom-24 sm:bottom-28 z-[120] -translate-x-1/2 px-4 w-full max-w-sm pointer-events-none">
            <div
              className={`
                pointer-events-auto rounded-2xl px-4 py-3 shadow-lg border flex items-start gap-3
                ${
                  toast.type === "success"
                    ? "bg-[#008236] border-green-700 text-white"
                    : "bg-white border-green-200 text-gray-800"
                }
              `}
            >
              <div
                className={`
                  w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                  ${
                    toast.type === "success"
                      ? "bg-white/15 text-white"
                      : "bg-red-50 text-red-600"
                  }
                `}
              >
                {toast.type === "success" ? (
                  <FiCheck size={18} />
                ) : (
                  <FiX size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold leading-5">
                  {toast.type === "success" ? "Done" : "Couldn’t send"}
                </p>
                <p
                  className={`text-xs mt-0.5 leading-4 ${
                    toast.type === "success" ? "text-green-50" : "text-gray-500"
                  }`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  toast.type === "success"
                    ? "hover:bg-white/10 text-white"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        )}

        {/* IMAGE LIGHTBOX */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Close"
            >
              <FiX size={22} />
            </button>
            <img
              src={lightboxUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* DELETE MENU */}
        {showDeleteMenu && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
            onClick={() => {
              if (!deleting) setShowDeleteMenu(false);
            }}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-green-100 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    <FiTrash2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedMessageIds.length === visibleMessages.length &&
                      visibleMessages.length > 1
                        ? "Delete all messages"
                        : `Delete message${
                            selectedMessageIds.length > 1 ? "s" : ""
                          }`}
                    </h3>
                    <p className="text-sm text-gray-500">Choose an option</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete("me")}
                className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <FiTrash2 size={16} />
                  <div>
                    <p className="font-semibold text-gray-800">Delete for me</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Remove from your chat only.
                    </p>
                  </div>
                </div>
              </button>

              {canDeleteForEveryone && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDelete("everyone")}
                  className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <FiTrash2 size={16} />
                    <div>
                      <p className="font-semibold text-green-700">
                        Delete for everyone
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Permanently remove your message for everyone.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <div className="p-4 bg-gray-50">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteMenu(false)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold"
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