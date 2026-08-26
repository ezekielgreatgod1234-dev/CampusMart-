import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import {
  FiGrid,
  FiPackage,
  FiBriefcase,
  FiShoppingBag,
  FiCalendar,
  FiMessageCircle,
  FiDollarSign,
  FiStar,
  FiBarChart2,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSend,
  FiTrash2,
  FiCheck,
  FiArrowLeft,
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
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const conversationId =
    params?.id ||
    params?.conversationId ||
    params?.chatId ||
    null;

  const { firebaseUser } = useAuth();

  // =====================================================
  // SELLER INFORMATION
  // =====================================================

  const sellerFullName =
    profile?.fullName ||
    profile?.displayName ||
    firebaseUser?.displayName ||
    "Seller";

  const sellerImage =
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.profilePicture ||
    profile?.avatar ||
    profile?.imageUrl ||
    profile?.image ||
    firebaseUser?.photoURL ||
    null;

  const sellerId =
    firebaseUser?.uid ||
    profile?.uid ||
    profile?.userId ||
    null;

  // =====================================================
  // STATE
  // =====================================================

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [messageText, setMessageText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [liveConversation, setLiveConversation] =
    useState(null);

  const [participantProfile, setParticipantProfile] =
    useState(null);

  const [participantProfileImage, setParticipantProfileImage] =
    useState(null);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [selectedMessageIds, setSelectedMessageIds] =
    useState([]);

  const [showDeleteMenu, setShowDeleteMenu] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  // =====================================================
  // SIDEBAR MENU
  // =====================================================

  const menuItems = [
    {
      label: "Dashboard",
      icon: FiGrid,
      path: "/seller-dashboard",
    },
    {
      label: "Products",
      icon: FiPackage,
      path: "/seller/products",
    },
    {
      label: "Services",
      icon: FiBriefcase,
      path: "/seller/services",
    },
    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/seller/orders",
    },
    {
      label: "Bookings",
      icon: FiCalendar,
      path: "/seller/bookings",
    },
    {
      label: "Messages",
      icon: FiMessageCircle,
      path: "/seller/messages",
      badge: unreadMessages,
    },
    {
      label: "Earnings",
      icon: FiDollarSign,
      path: "/seller/earnings",
    },
    {
      label: "Reviews",
      icon: FiStar,
      path: "/seller/reviews",
    },
    {
      label: "Analytics",
      icon: FiBarChart2,
      path: "/seller/analytics",
    },
    {
      label: "Promotions",
      icon: FiTag,
      path: "/seller/promotions",
      new: true,
    },
    {
      label: "Profile",
      icon: FiUser,
      path: "/seller/profile",
    },
    {
      label: "Settings",
      icon: FiSettings,
      path: "/seller/settings",
    },
  ];

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }

    return location.pathname.startsWith(path);
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =====================================================
  // INITIAL
  // =====================================================

  const getInitial = (name) => {
    return (
      String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase() || "U"
    );
  };

  // =====================================================
  // FALLBACK CONVERSATION
  // =====================================================

  const fallbackConversation = useMemo(() => {
    if (!conversationId) {
      return null;
    }

    return (
      messages.find((message) => {
        const possibleIds = [
          message?.conversationId,
          message?.chatId,
          message?.conversationID,
          message?.chatID,
          message?.conversation_id,
          message?.chat_id,
          message?.id,
        ].filter(Boolean);

        return possibleIds.some(
          (value) =>
            String(value) === String(conversationId)
        );
      }) || null
    );
  }, [messages, conversationId]);

  // =====================================================
  // LOAD CONVERSATION
  // =====================================================

  useEffect(() => {
    if (!conversationId) {
      setLiveConversation(null);
      setConversationLoading(false);
      return undefined;
    }

    setConversationLoading(true);

    const conversationRef = doc(
      db,
      "conversations",
      String(conversationId)
    );

    const unsubscribe = onSnapshot(
      conversationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLiveConversation({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setLiveConversation(null);
        }

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

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // =====================================================
  // OTHER PARTICIPANT ID
  // =====================================================

  const otherParticipantId =
    liveConversation?.participants?.find(
      (uid) =>
        String(uid) !==
        String(firebaseUser?.uid)
    ) ||
    fallbackConversation?.otherParticipantId ||
    fallbackConversation?.buyerId ||
    fallbackConversation?.receiverId ||
    fallbackConversation?.participantId ||
    null;

  // =====================================================
  // LOAD BUYER PROFILE
  // =====================================================

  useEffect(() => {
    if (!otherParticipantId) {
      setParticipantProfile(null);
      setParticipantProfileImage(null);
      return undefined;
    }

    let cancelled = false;

    const loadParticipantProfile = async () => {
      try {
        // =================================================
        // MAIN USER DOCUMENT
        // =================================================

        const userRef = doc(
          db,
          "users",
          String(otherParticipantId)
        );

        const userSnapshot =
          await getDoc(userRef);

        let userData = {};

        if (userSnapshot.exists()) {
          userData =
            userSnapshot.data() || {};
        }

        // =================================================
        // CUSTOMER DATA
        // =================================================

        let customerData = {};

        const possibleCustomerDocuments = [
          "profile",
          "personalInfo",
          "customer",
          "data",
        ];

        for (
          const documentId of possibleCustomerDocuments
        ) {
          try {
            const customerRef = doc(
              db,
              "users",
              String(otherParticipantId),
              "customerData",
              documentId
            );

            const customerSnapshot =
              await getDoc(customerRef);

            if (
              customerSnapshot.exists()
            ) {
              customerData = {
                ...customerData,
                ...customerSnapshot.data(),
              };
            }
          } catch {
            // Ignore inaccessible fallback documents.
          }
        }

        if (cancelled) {
          return;
        }

        // =================================================
        // MERGE PROFILE DATA
        // =================================================

        const mergedProfile = {
          ...customerData,
          ...userData,
        };

        // =================================================
        // PROFILE NAME
        // =================================================

        const fullName =
          mergedProfile?.fullName ||
          mergedProfile?.displayName ||
          mergedProfile?.name ||
          [
            mergedProfile?.firstName,
            mergedProfile?.lastName,
          ]
            .filter(Boolean)
            .join(" ") ||
          liveConversation?.participantNames?.[
            otherParticipantId
          ] ||
          fallbackConversation?.buyerName ||
          fallbackConversation?.name ||
          fallbackConversation?.participantName ||
          "Buyer";

        // =================================================
        // PROFILE IMAGE
        // =================================================

        const profileImage =
          mergedProfile?.profileImage ||
          mergedProfile?.photoURL ||
          mergedProfile?.profilePicture ||
          mergedProfile?.avatar ||
          mergedProfile?.imageUrl ||
          mergedProfile?.image ||
          mergedProfile?.profilePhoto ||
          mergedProfile?.picture ||
          null;

        // =================================================
        // SAVE PROFILE
        // =================================================

        setParticipantProfile({
          ...mergedProfile,
          fullName,
          profileImage,
          uid: otherParticipantId,
        });

        setParticipantProfileImage(
          profileImage
        );
      } catch (error) {
        console.warn(
          "Could not load participant profile:",
          error
        );

        if (!cancelled) {
          setParticipantProfile(null);
          setParticipantProfileImage(null);
        }
      }
    };

    loadParticipantProfile();

    return () => {
      cancelled = true;
    };
  }, [
    otherParticipantId,
    liveConversation?.id,
    fallbackConversation?.id,
  ]);

  // =====================================================
  // BUYER NAME
  // =====================================================

  const buyerName =
    participantProfile?.fullName ||
    participantProfile?.displayName ||
    participantProfile?.name ||
    [
      participantProfile?.firstName,
      participantProfile?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    liveConversation?.participantNames?.[
      otherParticipantId
    ] ||
    fallbackConversation?.name ||
    fallbackConversation?.buyerName ||
    fallbackConversation?.participantName ||
    "Buyer";

  // =====================================================
  // BUYER IMAGE
  // =====================================================

  const buyerImage =
    participantProfile?.profileImage ||
    participantProfile?.photoURL ||
    participantProfile?.profilePicture ||
    participantProfile?.avatar ||
    participantProfile?.imageUrl ||
    participantProfile?.image ||
    liveConversation?.participantImages?.[
      otherParticipantId
    ] ||
    liveConversation?.participantProfiles?.[
      otherParticipantId
    ]?.profileImage ||
    liveConversation?.participantProfiles?.[
      otherParticipantId
    ]?.photoURL ||
    participantProfileImage ||
    fallbackConversation?.profileImage ||
    fallbackConversation?.photoURL ||
    fallbackConversation?.profilePicture ||
    fallbackConversation?.avatar ||
    fallbackConversation?.imageUrl ||
    fallbackConversation?.image ||
    fallbackConversation?.buyerImage ||
    null;

  // =====================================================
  // CHAT MESSAGES
  // =====================================================

  const chatMessages =
    liveConversation &&
    Array.isArray(liveConversation.messages)
      ? liveConversation.messages
      : Array.isArray(
          fallbackConversation?.conversation
        )
      ? fallbackConversation.conversation
      : Array.isArray(
          fallbackConversation?.messages
        )
      ? fallbackConversation.messages
      : [];

  // =====================================================
  // SORT MESSAGES
  // =====================================================

  const sortedMessages = useMemo(() => {
    return [...chatMessages].sort((a, b) => {
      const aTime =
        a?.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a?.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : Number(a?.createdAt || 0);

      const bTime =
        b?.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b?.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : Number(b?.createdAt || 0);

      return aTime - bTime;
    });
  }, [chatMessages]);

  // =====================================================
  // IS MY MESSAGE
  // =====================================================

  const isMyMessage = (message) => {
    if (
      message?.senderId &&
      firebaseUser?.uid
    ) {
      return (
        String(message.senderId) ===
        String(firebaseUser.uid)
      );
    }

    if (
      message?.senderUid &&
      firebaseUser?.uid
    ) {
      return (
        String(message.senderUid) ===
        String(firebaseUser.uid)
      );
    }

    if (
      message?.userId &&
      firebaseUser?.uid
    ) {
      return (
        String(message.userId) ===
        String(firebaseUser.uid)
      );
    }

    if (
      message?.senderType === "seller"
    ) {
      return true;
    }

    if (
      message?.sender === "seller"
    ) {
      return true;
    }

    if (
      message?.sender === "me"
    ) {
      return true;
    }

    if (
      message?.sender &&
      firebaseUser?.uid &&
      String(message.sender) ===
        String(firebaseUser.uid)
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // MARK BUYER MESSAGES AS SEEN
  // =====================================================

  useEffect(() => {
    if (
      !conversationId ||
      !firebaseUser?.uid ||
      !liveConversation ||
      !Array.isArray(
        liveConversation.messages
      )
    ) {
      return;
    }

    let cancelled = false;

    const markIncomingMessagesAsSeen =
      async () => {
        try {
          const conversationRef = doc(
            db,
            "conversations",
            String(conversationId)
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
                      String(senderId) !==
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
            !cancelled &&
            typeof markMessageAsRead ===
              "function"
          ) {
            await Promise.resolve(
              markMessageAsRead(
                conversationId
              )
            );
          }
        } catch (error) {
          console.error(
            "Seller mark messages as seen error:",
            error
          );
        }
      };

    markIncomingMessagesAsSeen();

    return () => {
      cancelled = true;
    };
  }, [
    conversationId,
    firebaseUser?.uid,
    liveConversation?.id,
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
            message?.deletedFor
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
          message?.deletedForEveryone ===
          true
        ) {
          return false;
        }

        return true;
      }
    );

  // =====================================================
  // SEARCH MESSAGES
  // =====================================================

  const searchedMessages =
    visibleMessages.filter(
      (message) => {
        if (!search.trim()) {
          return true;
        }

        const text =
          message?.text ||
          message?.message ||
          "";

        return String(text)
          .toLowerCase()
          .includes(
            search.trim().toLowerCase()
          );
      }
    );

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatMessageTime = (
    message
  ) => {
    if (message?.time) {
      return message.time;
    }

    if (message?.formattedTime) {
      return message.formattedTime;
    }

    if (!message?.createdAt) {
      return "";
    }

    try {
      const date =
        message.createdAt?.toDate
          ? message.createdAt.toDate()
          : message.createdAt?.seconds
          ? new Date(
              message.createdAt.seconds *
                1000
            )
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
  // MESSAGE SEEN
  // =====================================================

  const isMessageSeen = (message) => {
    if (!message) {
      return false;
    }

    return Boolean(
      message.seenAt ||
        message.readAt ||
        message.isRead === true ||
        message.seen === true
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
        className={`inline-flex items-center ml-1 align-middle ${
          seen
            ? "text-blue-200"
            : "text-green-100"
        }`}
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
      !conversationId ||
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

        let updatedMessages;

        if (
          deleteType === "everyone"
        ) {
          updatedMessages =
            currentMessages.filter(
              (message) => {
                const messageId =
                  String(message.id);

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
                  String(message.id)
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

    try {
      await deleteMessages(
        conversationId,
        idsToDelete,
        deleteType
      );
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
        typeof sendMessage !==
          "function" ||
        !conversationId
      ) {
        return;
      }

      setMessageText("");
      setSending(true);

      try {
        await sendMessage(
          conversationId,
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
  // KEYBOARD
  // =====================================================

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
  // PROFILE IMAGE ERROR FALLBACK
  // =====================================================

  const handleProfileImageError = (
    e
  ) => {
    e.currentTarget.style.display =
      "none";
  };

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (
    !conversationLoading &&
    !liveConversation &&
    !fallbackConversation
  ) {
    return (
      <div className="h-[100svh] lg:h-[100dvh] w-full bg-gray-50 text-gray-800 flex overflow-hidden">

        {/* SIDEBAR */}

        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-[230px] bg-green-700 text-white flex-col shadow-2xl">

          <div className="h-[86px] px-5 flex items-center">
            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller-dashboard"
                )
              }
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-green-700 flex items-center justify-center font-extrabold">
                CM
              </div>

              <div className="text-left">
                <p className="text-lg font-extrabold">
                  CampusMart
                </p>

                <p className="text-[10px] text-green-100">
                  Buy. Sell. Connect.
                </p>
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-5">
            <nav className="space-y-1">
              {menuItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      key={
                        item.path
                      }
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          item.path
                        )
                      }
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                        isActive(
                          item.path
                        )
                          ? "bg-white text-green-700"
                          : "text-white hover:bg-green-600"
                      }`}
                    >
                      <Icon size={18} />

                      <span className="flex-1 text-left">
                        {item.label}
                      </span>

                      {item.new && (
                        <span className="px-1.5 py-0.5 rounded-md bg-yellow-400 text-green-900 text-[8px] font-bold">
                          NEW
                        </span>
                      )}

                      {item.badge >
                        0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge >
                          99
                            ? "99+"
                            : item.badge}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </nav>
          </div>

          <div className="px-3 pb-4">
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-green-600"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}

        <div className="flex-1 min-w-0 lg:ml-[230px] flex flex-col h-[100dvh]">

          <header className="h-[70px] sm:h-[86px] bg-green-800 text-white flex items-center px-4 sm:px-6 gap-4 shrink-0">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="lg:hidden"
            >
              <FiMenu size={23} />
            </button>

            <div className="relative flex-1 max-w-[500px]">

              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search messages..."
                className="w-full h-10 bg-white text-gray-800 rounded-full pl-11 pr-4 text-sm outline-none"
              />

            </div>

          </header>

          <main className="flex-1 min-h-0 overflow-hidden p-3 sm:p-6 lg:p-7">

            <div className="h-full bg-white rounded-2xl border border-green-100 p-6 sm:p-10 text-center shadow-sm flex flex-col items-center justify-center">

              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <FiX size={28} />
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                Conversation not found
              </h2>

              <p className="text-gray-500 mt-2">
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
                className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold"
              >
                Back to Messages
              </button>

            </div>

          </main>

        </div>

        {/* MOBILE DRAWER */}

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
              onClick={() =>
                setSidebarOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-[70] w-[250px] bg-green-700 text-white flex flex-col shadow-2xl lg:hidden">

              <div className="h-[86px] px-5 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-white text-green-700 flex items-center justify-center font-extrabold">
                    CM
                  </div>

                  <div>
                    <p className="text-lg font-extrabold">
                      CampusMart
                    </p>

                    <p className="text-[10px] text-green-100">
                      Buy. Sell. Connect.
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                >
                  <FiX size={22} />
                </button>

              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-5">

                <nav className="space-y-1">

                  {menuItems.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <button
                          key={
                            item.path
                          }
                          type="button"
                          onClick={() =>
                            handleNavigation(
                              item.path
                            )
                          }
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                            isActive(
                              item.path
                            )
                              ? "bg-white text-green-700"
                              : "text-white hover:bg-green-600"
                          }`}
                        >
                          <Icon size={18} />

                          <span className="flex-1 text-left">
                            {item.label}
                          </span>

                          {item.new && (
                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-400 text-green-900 text-[8px] font-bold">
                              NEW
                            </span>
                          )}

                          {item.badge >
                            0 && (
                            <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {item.badge >
                              99
                                ? "99+"
                                : item.badge}
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}

                </nav>

              </div>

              <div className="px-3 pb-4">

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-green-600"
                >
                  <FiLogOut
                    size={18}
                  />
                  Logout
                </button>

              </div>

            </aside>
          </>
        )}

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
      <div className="h-[100dvh] w-full bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            Loading conversation...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-800 flex overflow-hidden">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[230px] bg-green-700 text-white
          flex flex-col shadow-2xl
          transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        <div className="h-[86px] px-5 flex items-center justify-between shrink-0">

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "/seller-dashboard"
              )
            }
            className="flex items-center gap-3"
          >

            <div className="w-10 h-10 rounded-xl bg-white text-green-700 flex items-center justify-center font-extrabold">
              CM
            </div>

            <div className="text-left">

              <p className="text-lg font-extrabold leading-none">
                CampusMart
              </p>

              <p className="text-[10px] text-green-100 mt-1">
                Buy. Sell. Connect.
              </p>

            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="lg:hidden text-green-100"
          >
            <FiX size={22} />
          </button>

        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-5">

          <nav className="space-y-1">

            {menuItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActive(
                    item.path
                  );

                return (
                  <button
                    key={
                      item.path
                    }
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        item.path
                      )
                    }
                    className={`
                      w-full flex items-center gap-3
                      px-3 py-3 rounded-xl
                      text-sm font-medium transition
                      ${
                        active
                          ? "bg-white text-green-700 shadow-sm"
                          : "text-white hover:bg-green-600"
                      }
                    `}
                  >

                    <Icon size={18} />

                    <span className="flex-1 text-left">
                      {item.label}
                    </span>

                    {item.new && (
                      <span className="px-1.5 py-0.5 rounded-md bg-yellow-400 text-green-900 text-[8px] font-bold">
                        NEW
                      </span>
                    )}

                    {item.badge >
                      0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge >
                        99
                          ? "99+"
                          : item.badge}
                      </span>
                    )}

                  </button>
                );
              }
            )}

          </nav>

        </div>

        <div className="px-3 pb-4 shrink-0">

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-green-600"
          >
            <FiLogOut
              size={18}
            />
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="flex-1 min-w-0 lg:ml-[230px] flex flex-col h-[100dvh]">

        {/* =================================================
            NAVBAR
        ================================================= */}

        <header className="h-[70px] sm:h-[86px] bg-green-800 text-white flex items-center px-3 sm:px-6 gap-3 sm:gap-4 shrink-0">

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="lg:hidden w-10 h-10 rounded-full hover:bg-green-700 flex items-center justify-center shrink-0"
          >
            <FiMenu size={23} />
          </button>

          <div className="relative flex-1 min-w-0 max-w-[500px]">

            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search messages..."
              className="w-full h-10 bg-white text-gray-800 rounded-full pl-11 pr-4 text-sm outline-none"
            />

          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/seller/messages"
                )
              }
              className="relative w-9 h-9 rounded-full hover:bg-green-700 flex items-center justify-center"
            >

              <FiMessageCircle
                size={19}
              />

              {unreadMessages >
                0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadMessages >
                  9
                    ? "9+"
                    : unreadMessages}
                </span>
              )}

            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/seller/profile"
                )
              }
              className="flex items-center gap-2 rounded-full bg-green-700 hover:bg-green-600 px-1.5 sm:px-2 py-1.5"
            >

              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={
                    sellerFullName
                  }
                  onError={
                    handleProfileImageError
                  }
                  className="w-8 h-8 rounded-full object-cover bg-green-50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold text-xs">
                  {getInitial(
                    sellerFullName
                  )}
                </div>
              )}

              <div className="hidden sm:block text-left pr-2">

                <p className="text-xs font-bold">
                  {sellerFullName}
                </p>

                <p className="text-[9px] text-green-100 mt-1">
                  Seller
                </p>

              </div>

            </button>

          </div>

        </header>

        {/* =================================================
            CHAT
        ================================================= */}

        <main className="flex-1 min-h-0 overflow-hidden p-0 sm:p-4 lg:p-7">

          <div className="h-full min-h-0 w-full bg-white sm:rounded-xl lg:rounded-2xl border border-green-100 overflow-hidden flex flex-col shadow-sm">

            {/* =================================================
                CHAT HEADER
            ================================================= */}

            <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-6 py-2.5 sm:py-4 border-b border-green-100 bg-white shrink-0 z-30">

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
                    className="w-10 h-10 rounded-full hover:bg-green-50 flex items-center justify-center text-green-700 shrink-0"
                  >
                    <FiX size={20} />
                  </button>

                  <div className="flex-1 min-w-0">

                    <p className="font-bold text-gray-800">
                      {
                        selectedMessageIds.length
                      }{" "}
                      selected
                    </p>

                    <p className="text-xs text-gray-400">
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
                    className="h-10 px-3 sm:px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 font-semibold text-sm shrink-0"
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
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/seller/messages"
                      )
                    }
                    className="w-10 h-10 rounded-full hover:bg-green-50 flex items-center justify-center text-green-700 shrink-0"
                  >
                    <FiArrowLeft
                      size={19}
                    />
                  </button>

                  {/* =================================================
                      BUYER PROFILE PHOTO
                  ================================================= */}

                  {buyerImage ? (
                    <img
                      src={buyerImage}
                      alt={buyerName}
                      onError={
                        handleProfileImageError
                      }
                      className="
                        w-10 h-10
                        sm:w-11 sm:h-11
                        rounded-full
                        object-cover
                        ring-2
                        ring-green-100
                        shrink-0
                        bg-green-50
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-10 h-10
                        sm:w-11 sm:h-11
                        rounded-full
                        bg-green-100
                        text-green-700
                        flex items-center
                        justify-center
                        font-bold
                        text-lg
                        shrink-0
                      "
                    >
                      {getInitial(
                        buyerName
                      )}
                    </div>
                  )}

                  {/* =================================================
                      BUYER NAME
                  ================================================= */}

                  <div className="flex-1 min-w-0">

                    <h2 className="
                      font-bold
                      text-gray-800
                      truncate
                      text-sm
                      sm:text-base
                    ">
                      {buyerName}
                    </h2>

                    <div className="flex items-center gap-1.5">

                      <span className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-green-500
                        shrink-0
                      " />

                      <p className="
                        text-xs
                        text-green-600
                        truncate
                      ">
                        Buyer
                      </p>

                    </div>

                  </div>
                </>
              )}

            </div>

            {/* =================================================
                MESSAGES BODY
            ================================================= */}

            <div className="
              flex-1
              min-h-0
              overflow-y-auto
              overscroll-contain
              p-2.5
              sm:p-6
              space-y-2
              sm:space-y-3
              bg-gradient-to-b
              from-green-50/40
              to-gray-50
              [scrollbar-width:thin]
            ">

              <div className="text-center mb-3 sm:mb-5">

                <span className="inline-block bg-white text-green-600 text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-green-100 shadow-sm">

                  Conversation with{" "}
                  {buyerName}

                </span>

              </div>

              {searchedMessages.length ===
                0 && (
                <div className="text-center py-10">

                  <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                    <FiSend size={22} />
                  </div>

                  <p className="text-sm font-medium text-gray-500">
                    {search.trim()
                      ? "No matching messages."
                      : "No messages yet."}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {search.trim()
                      ? "Try another search."
                      : "Send a message to start the conversation."}
                  </p>

                </div>
              )}

              {searchedMessages.map(
                (message, index) => {
                  const mine =
                    isMyMessage(
                      message
                    );

                  const messageId =
                    String(
                      message?.id ||
                        `${message?.createdAt || ""}-${index}`
                    );

                  const selected =
                    selectedMessageIds.includes(
                      messageId
                    );

                  return (
                    <div
                      key={
                        message?.id ||
                        `${message?.createdAt}-${index}`
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
                          max-w-[88%] sm:max-w-[65%]
                          text-left px-3.5 py-2.5
                          sm:px-4 sm:py-3
                          rounded-2xl transition
                          ${
                            selected
                              ? "ring-2 ring-green-500 ring-offset-2"
                              : ""
                          }
                          ${
                            mine
                              ? "bg-green-800 text-white rounded-br-md shadow-sm"
                              : "bg-green-600 text-white rounded-bl-md shadow-sm border border-green-50"
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
                          {message?.text ||
                            message?.message ||
                            ""}
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
                INPUT
            ================================================= */}

            {selectedMessageIds.length ===
              0 && (
              <div
                className="
                  shrink-0
                  w-full
                  border-t border-green-100
                  bg-white
                  px-2.5 sm:px-4
                  pt-2.5 sm:pt-4
                  pb-2
                  sm:pb-4
                  relative
                  z-40
                "
              >

                <div className="flex items-center gap-2 w-full">

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
                    autoComplete="off"
                    className="
                      flex-1
                      min-w-0
                      h-11
                      bg-gray-100
                      rounded-full
                      px-4
                      text-sm
                      text-gray-800
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
                      active:bg-green-800
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
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteMenu(
                      false
                    );
                  }
                }}
              >

                <div
                  className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100"
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
                    disabled={
                      deleting
                    }
                    onClick={() =>
                      handleDelete(
                        "me"
                      )
                    }
                    className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100"
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
                      className="w-full text-left px-5 py-4 hover:bg-green-50 border-b border-gray-100"
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
                            Remove your
                            message for
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
                      className="w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold"
                    >
                      Cancel
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default SellerChat;