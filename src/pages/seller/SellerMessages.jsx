import {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  FiChevronRight,
  FiMoreVertical,
  FiCheckCircle,
  FiUsers,
  FiX,
  FiCheck,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

function SellerMessages({
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
  profile = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  // =====================================================
  // SELLER INFORMATION
  // =====================================================

  const sellerFullName =
    profile?.fullName ||
    profile?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email ||
    "Seller";

  const sellerImage =
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.profilePicture ||
    profile?.profilePic ||
    profile?.avatar ||
    profile?.avatarUrl ||
    profile?.avatarURL ||
    profile?.imageUrl ||
    profile?.imageURL ||
    profile?.image ||
    firebaseUser?.photoURL ||
    null;

  const sellerId =
    firebaseUser?.uid ||
    profile?.uid ||
    profile?.userId ||
    profile?.id ||
    null;

  // =====================================================
  // SIDEBAR
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
      return (
        location.pathname ===
        "/seller-dashboard"
      );
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
  // CONVERSATION ID
  // =====================================================

  const getConversationId = (message) => {
    if (!message) {
      return null;
    }

    return (
      message?.conversationId ||
      message?.chatId ||
      message?.conversationID ||
      message?.chatID ||
      message?.conversation_id ||
      message?.chat_id ||
      message?.id ||
      null
    );
  };

  // =====================================================
  // BUYER ID
  // =====================================================

  const getBuyerId = (message) => {
    if (!message) {
      return null;
    }

    // ---------------------------------------------------
    // DIRECT BUYER ID
    // ---------------------------------------------------

    const directBuyerId =
      message?.buyerId ||
      message?.buyerUID ||
      message?.buyerUid ||
      message?.buyerUserId ||
      message?.buyerUserID ||
      message?.buyer_id ||
      message?.otherParticipantId ||
      message?.otherParticipantUid ||
      message?.otherParticipantUID ||
      message?.otherUserId ||
      message?.otherUserId ||
      message?.recipientId;

    if (directBuyerId) {
      return String(directBuyerId);
    }

    // ---------------------------------------------------
    // BUYER OBJECT ID
    // ---------------------------------------------------

    const buyerObjectId =
      message?.buyer?.uid ||
      message?.buyer?.userId ||
      message?.buyer?.userID ||
      message?.buyer?.id ||
      message?.buyerProfile?.uid ||
      message?.buyerProfile?.userId ||
      message?.buyerData?.uid ||
      message?.buyerData?.userId ||
      message?.buyerInfo?.uid ||
      message?.buyerInfo?.userId;

    if (buyerObjectId) {
      return String(buyerObjectId);
    }

    // ---------------------------------------------------
    // PARTICIPANTS ARRAY
    // ---------------------------------------------------

    if (
      Array.isArray(
        message?.participants
      )
    ) {
      const otherParticipant =
        message.participants.find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherParticipant) {
        return String(otherParticipant);
      }
    }

    // ---------------------------------------------------
    // PARTICIPANT OBJECTS ARRAY
    // ---------------------------------------------------

    const participantObjects =
      message?.participantProfilesArray ||
      message?.participantUsers ||
      message?.users;

    if (
      Array.isArray(
        participantObjects
      )
    ) {
      const otherParticipant =
        participantObjects.find(
          (participant) => {
            const uid =
              participant?.uid ||
              participant?.userId ||
              participant?.id;

            return (
              uid &&
              String(uid) !==
                String(sellerId)
            );
          }
        );

      if (otherParticipant) {
        const uid =
          otherParticipant?.uid ||
          otherParticipant?.userId ||
          otherParticipant?.id;

        if (uid) {
          return String(uid);
        }
      }
    }

    // ---------------------------------------------------
    // PARTICIPANT IMAGES
    // ---------------------------------------------------

    if (
      message?.participantImages &&
      typeof message.participantImages ===
        "object"
    ) {
      const otherId =
        Object.keys(
          message.participantImages
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherId) {
        return String(otherId);
      }
    }

    // ---------------------------------------------------
    // PARTICIPANT PROFILES
    // ---------------------------------------------------

    if (
      message?.participantProfiles &&
      typeof message.participantProfiles ===
        "object"
    ) {
      const otherId =
        Object.keys(
          message.participantProfiles
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherId) {
        return String(otherId);
      }
    }

    // ---------------------------------------------------
    // PARTICIPANT NAMES
    // ---------------------------------------------------

    if (
      message?.participantNames &&
      typeof message.participantNames ===
        "object"
    ) {
      const otherId =
        Object.keys(
          message.participantNames
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherId) {
        return String(otherId);
      }
    }

    // ---------------------------------------------------
    // NESTED CONVERSATION
    // ---------------------------------------------------

    const nestedConversation =
      message?.conversationData ||
      message?.conversationInfo ||
      message?.chatData ||
      message?.chatInfo;

    if (
      nestedConversation &&
      typeof nestedConversation ===
        "object"
    ) {
      const nestedBuyerId =
        nestedConversation?.buyerId ||
        nestedConversation?.buyerUID ||
        nestedConversation?.buyerUid ||
        nestedConversation?.buyerUserId ||
        nestedConversation?.buyer?.uid ||
        nestedConversation?.buyer?.userId ||
        nestedConversation?.buyer?.id;

      if (nestedBuyerId) {
        return String(nestedBuyerId);
      }

      if (
        Array.isArray(
          nestedConversation?.participants
        )
      ) {
        const otherParticipant =
          nestedConversation.participants.find(
            (uid) =>
              String(uid) !==
              String(sellerId)
          );

        if (otherParticipant) {
          return String(
            otherParticipant
          );
        }
      }

      if (
        nestedConversation
          ?.participantImages &&
        typeof nestedConversation
          .participantImages === "object"
      ) {
        const otherId =
          Object.keys(
            nestedConversation.participantImages
          ).find(
            (uid) =>
              String(uid) !==
              String(sellerId)
          );

        if (otherId) {
          return String(otherId);
        }
      }

      if (
        nestedConversation
          ?.participantProfiles &&
        typeof nestedConversation
          .participantProfiles ===
          "object"
      ) {
        const otherId =
          Object.keys(
            nestedConversation.participantProfiles
          ).find(
            (uid) =>
              String(uid) !==
              String(sellerId)
          );

        if (otherId) {
          return String(otherId);
        }
      }
    }

    return null;
  };

  // =====================================================
  // EXTRACT PROFILE IMAGE
  // =====================================================

  const extractProfileImage = (data) => {
    if (!data) {
      return null;
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data !== "object") {
      return null;
    }

    return (
      data?.profileImage ||
      data?.profile_image ||
      data?.photoURL ||
      data?.photoUrl ||
      data?.photo ||
      data?.profilePicture ||
      data?.profilePic ||
      data?.avatar ||
      data?.avatarUrl ||
      data?.avatarURL ||
      data?.imageUrl ||
      data?.imageURL ||
      data?.image ||
      data?.picture ||
      data?.userImage ||
      data?.userPhoto ||
      data?.displayPhoto ||
      null
    );
  };

  // =====================================================
  // GET BUYER PROFILE IMAGE
  // =====================================================

  const getBuyerProfileImage = (message) => {
    if (!message) {
      return null;
    }

    const buyerId =
      getBuyerId(message);

    // ---------------------------------------------------
    // 1. DIRECT BUYER IMAGE
    // ---------------------------------------------------

    const directBuyerImage =
      message?.buyerProfileImage ||
      message?.buyerProfileImg ||
      message?.buyerPhotoURL ||
      message?.buyerPhotoUrl ||
      message?.buyerPhoto ||
      message?.buyerProfilePicture ||
      message?.buyerProfilePic ||
      message?.buyerAvatar ||
      message?.buyerAvatarUrl ||
      message?.buyerAvatarURL ||
      message?.buyerImage ||
      message?.buyerImageUrl ||
      message?.buyerImageURL ||
      message?.buyerPicture ||
      null;

    if (directBuyerImage) {
      return extractProfileImage(
        directBuyerImage
      );
    }

    // ---------------------------------------------------
    // 2. BUYER OBJECT
    // ---------------------------------------------------

    const buyerObjectImage =
      extractProfileImage(
        message?.buyer
      ) ||
      extractProfileImage(
        message?.buyerProfile
      ) ||
      extractProfileImage(
        message?.buyerData
      ) ||
      extractProfileImage(
        message?.buyerInfo
      );

    if (buyerObjectImage) {
      return buyerObjectImage;
    }

    // ---------------------------------------------------
    // 3. OTHER PARTICIPANT OBJECT
    // ---------------------------------------------------

    const otherParticipantImage =
      extractProfileImage(
        message?.otherParticipant
      ) ||
      extractProfileImage(
        message?.otherUser
      );

    if (otherParticipantImage) {
      return otherParticipantImage;
    }

    // ---------------------------------------------------
    // 4. USER OBJECT
    // ---------------------------------------------------

    const userImage =
      extractProfileImage(
        message?.user
      );

    if (userImage) {
      return userImage;
    }

    // ---------------------------------------------------
    // 5. DIRECT MESSAGE IMAGE
    //
    // IMPORTANT:
    // Do this AFTER buyer-specific fields.
    // ---------------------------------------------------

    const directImage =
      extractProfileImage(message);

    if (directImage) {
      return directImage;
    }

    // ---------------------------------------------------
    // 6. PARTICIPANT IMAGES
    // ---------------------------------------------------

    const participantImages =
      message?.participantImages;

    if (
      participantImages &&
      typeof participantImages ===
        "object"
    ) {
      // First use the exact buyer ID.

      if (
        buyerId &&
        participantImages[buyerId]
      ) {
        const image =
          extractProfileImage(
            participantImages[buyerId]
          );

        if (image) {
          return image;
        }
      }

      // Otherwise find the participant
      // who is not the seller.

      const otherParticipantId =
        Object.keys(
          participantImages
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherParticipantId) {
        const image =
          extractProfileImage(
            participantImages[
              otherParticipantId
            ]
          );

        if (image) {
          return image;
        }
      }
    }

    // ---------------------------------------------------
    // 7. PARTICIPANT PROFILES
    // ---------------------------------------------------

    const participantProfiles =
      message?.participantProfiles;

    if (
      participantProfiles &&
      typeof participantProfiles ===
        "object"
    ) {
      // Exact buyer profile.

      if (
        buyerId &&
        participantProfiles[buyerId]
      ) {
        const image =
          extractProfileImage(
            participantProfiles[buyerId]
          );

        if (image) {
          return image;
        }
      }

      // Other participant.

      const otherParticipantId =
        Object.keys(
          participantProfiles
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherParticipantId) {
        const image =
          extractProfileImage(
            participantProfiles[
              otherParticipantId
            ]
          );

        if (image) {
          return image;
        }
      }
    }

    // ---------------------------------------------------
    // 8. PARTICIPANT DATA
    // ---------------------------------------------------

    const participantData =
      message?.participantData;

    if (
      participantData &&
      typeof participantData ===
        "object"
    ) {
      if (
        buyerId &&
        participantData[buyerId]
      ) {
        const image =
          extractProfileImage(
            participantData[buyerId]
          );

        if (image) {
          return image;
        }
      }

      const otherParticipantId =
        Object.keys(
          participantData
        ).find(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (otherParticipantId) {
        const image =
          extractProfileImage(
            participantData[
              otherParticipantId
            ]
          );

        if (image) {
          return image;
        }
      }
    }

    // ---------------------------------------------------
    // 9. NESTED CONVERSATION
    // ---------------------------------------------------

    const nestedConversation =
      message?.conversationData ||
      message?.conversationInfo ||
      message?.chatData ||
      message?.chatInfo;

    if (
      nestedConversation &&
      typeof nestedConversation ===
        "object"
    ) {
      // Nested buyer.

      const nestedBuyerImage =
        extractProfileImage(
          nestedConversation?.buyer
        ) ||
        extractProfileImage(
          nestedConversation?.buyerProfile
        ) ||
        extractProfileImage(
          nestedConversation?.buyerData
        ) ||
        extractProfileImage(
          nestedConversation?.buyerInfo
        );

      if (nestedBuyerImage) {
        return nestedBuyerImage;
      }

      // Nested participant images.

      const nestedImages =
        nestedConversation
          ?.participantImages;

      if (
        nestedImages &&
        typeof nestedImages ===
          "object"
      ) {
        if (
          buyerId &&
          nestedImages[buyerId]
        ) {
          const image =
            extractProfileImage(
              nestedImages[buyerId]
            );

          if (image) {
            return image;
          }
        }

        const otherId =
          Object.keys(
            nestedImages
          ).find(
            (uid) =>
              String(uid) !==
              String(sellerId)
          );

        if (otherId) {
          const image =
            extractProfileImage(
              nestedImages[otherId]
            );

          if (image) {
            return image;
          }
        }
      }

      // Nested participant profiles.

      const nestedProfiles =
        nestedConversation
          ?.participantProfiles;

      if (
        nestedProfiles &&
        typeof nestedProfiles ===
          "object"
      ) {
        if (
          buyerId &&
          nestedProfiles[buyerId]
        ) {
          const image =
            extractProfileImage(
              nestedProfiles[buyerId]
            );

          if (image) {
            return image;
          }
        }

        const otherId =
          Object.keys(
            nestedProfiles
          ).find(
            (uid) =>
              String(uid) !==
              String(sellerId)
          );

        if (otherId) {
          const image =
            extractProfileImage(
              nestedProfiles[otherId]
            );

          if (image) {
            return image;
          }
        }
      }

      // Nested buyer profile image.

      const nestedDirectImage =
        nestedConversation?.buyerProfileImage ||
        nestedConversation?.buyerPhotoURL ||
        nestedConversation?.buyerPhotoUrl ||
        nestedConversation?.buyerAvatar ||
        nestedConversation?.buyerImage;

      if (nestedDirectImage) {
        return extractProfileImage(
          nestedDirectImage
        );
      }
    }

    return null;
  };

  // =====================================================
  // GET BUYER NAME
  // =====================================================

  const getBuyerName = (message) => {
    if (!message) {
      return "Buyer";
    }

    const buyerId =
      getBuyerId(message);

    const participantNames =
      message?.participantNames;

    const name =
      message?.buyerName ||
      message?.buyerFullName ||
      message?.buyerDisplayName ||
      message?.buyer?.fullName ||
      message?.buyer?.name ||
      message?.buyer?.displayName ||
      message?.buyerProfile?.fullName ||
      message?.buyerProfile?.name ||
      message?.buyerProfile?.displayName ||
      message?.buyerData?.fullName ||
      message?.buyerData?.name ||
      message?.buyerData?.displayName ||
      message?.buyerInfo?.fullName ||
      message?.buyerInfo?.name ||
      message?.buyerInfo?.displayName ||
      message?.otherParticipant?.fullName ||
      message?.otherParticipant?.name ||
      message?.otherParticipant?.displayName ||
      message?.user?.fullName ||
      message?.user?.name ||
      message?.user?.displayName ||
      (buyerId &&
        participantNames?.[buyerId]) ||
      message?.name ||
      null;

    if (
      name &&
      String(name).trim()
    ) {
      return String(name).trim();
    }

    // ---------------------------------------------------
    // NESTED CONVERSATION NAME
    // ---------------------------------------------------

    const nestedConversation =
      message?.conversationData ||
      message?.conversationInfo ||
      message?.chatData ||
      message?.chatInfo;

    const nestedBuyerName =
      nestedConversation?.buyerName ||
      nestedConversation?.buyerFullName ||
      nestedConversation?.buyer?.fullName ||
      nestedConversation?.buyer?.name ||
      nestedConversation?.buyer?.displayName ||
      nestedConversation?.buyerProfile?.fullName ||
      nestedConversation?.buyerProfile?.name ||
      nestedConversation?.buyerData?.fullName ||
      nestedConversation?.buyerData?.name;

    if (
      nestedBuyerName &&
      String(nestedBuyerName).trim()
    ) {
      return String(
        nestedBuyerName
      ).trim();
    }

    return "Buyer";
  };

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
        return messages;
      }

      return messages.filter(
        (message) => {
          const buyerName =
            getBuyerName(message);

          return (
            String(buyerName)
              .toLowerCase()
              .includes(searchText) ||
            String(
              message?.lastMessage ||
                message?.lastMessageText ||
                ""
            )
              .toLowerCase()
              .includes(searchText) ||
            String(
              message?.productName ||
                ""
            )
              .toLowerCase()
              .includes(searchText)
          );
        }
      );
    }, [
      messages,
      search,
    ]);

  // =====================================================
  // ONLINE USERS
  // =====================================================

  const onlineUsers =
    useMemo(() => {
      return messages.filter(
        (message) =>
          message?.online === true
      ).length;
    }, [messages]);

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
  // LAST MESSAGE
  // =====================================================

  const getLastMessage = (message) => {
    return (
      message?.lastMessage ||
      message?.lastMessageText ||
      "No messages yet."
    );
  };

  // =====================================================
  // TIME
  // =====================================================

  const getMessageTime = (message) => {
    if (message?.time) {
      return message.time;
    }

    if (message?.lastMessageAt) {
      try {
        const date =
          message.lastMessageAt
            ?.toDate
            ? message.lastMessageAt.toDate()
            : new Date(
                message.lastMessageAt
              );

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
    }

    return "";
  };

  // =====================================================
  // GET LAST MESSAGE OBJECT
  // =====================================================

  const getLastMessageObject = (
    message
  ) => {
    if (!message) {
      return null;
    }

    const conversation =
      Array.isArray(
        message?.conversation
      )
        ? message.conversation
        : Array.isArray(
            message?.messages
          )
        ? message.messages
        : [];

    if (
      conversation.length === 0
    ) {
      return null;
    }

    const sorted =
      [...conversation].sort(
        (a, b) => {
          const aTime =
            a?.createdAt?.toMillis
              ? a.createdAt.toMillis()
              : Number(
                  a?.createdAt || 0
                );

          const bTime =
            b?.createdAt?.toMillis
              ? b.createdAt.toMillis()
              : Number(
                  b?.createdAt || 0
                );

          return aTime - bTime;
        }
      );

    return (
      sorted[
        sorted.length - 1
      ] || null
    );
  };

  // =====================================================
  // IS LAST MESSAGE FROM SELLER
  // =====================================================

  const isLastMessageFromSeller = (
    message
  ) => {
    if (!message) {
      return false;
    }

    const lastMessage =
      getLastMessageObject(
        message
      );

    if (!lastMessage) {
      if (
        typeof message?.lastMessageFromSeller ===
        "boolean"
      ) {
        return message.lastMessageFromSeller;
      }

      if (
        typeof message?.sellerSentLast ===
        "boolean"
      ) {
        return message.sellerSentLast;
      }

      return false;
    }

    if (
      sellerId &&
      lastMessage?.senderId
    ) {
      return (
        String(
          lastMessage.senderId
        ) ===
        String(sellerId)
      );
    }

    if (
      sellerId &&
      lastMessage?.senderUid
    ) {
      return (
        String(
          lastMessage.senderUid
        ) ===
        String(sellerId)
      );
    }

    if (
      sellerId &&
      lastMessage?.userId
    ) {
      return (
        String(
          lastMessage.userId
        ) ===
        String(sellerId)
      );
    }

    if (
      lastMessage?.sender ===
      "seller"
    ) {
      return true;
    }

    if (
      lastMessage?.sender ===
      "me"
    ) {
      return true;
    }

    if (
      lastMessage?.senderRole ===
      "seller"
    ) {
      return true;
    }

    if (
      lastMessage?.role ===
      "seller"
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // LAST MESSAGE SEEN
  // =====================================================

  const isLastMessageSeen = (
    message
  ) => {
    if (!message) {
      return false;
    }

    const lastMessage =
      getLastMessageObject(
        message
      );

    if (
      lastMessage?.seen === true ||
      lastMessage?.isRead === true ||
      lastMessage?.read === true ||
      lastMessage?.seenAt ||
      lastMessage?.readAt
    ) {
      return true;
    }

    if (
      Array.isArray(
        lastMessage?.seenBy
      )
    ) {
      const buyerSeen =
        lastMessage.seenBy.some(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (buyerSeen) {
        return true;
      }
    }

    if (
      Array.isArray(
        lastMessage?.readBy
      )
    ) {
      const buyerRead =
        lastMessage.readBy.some(
          (uid) =>
            String(uid) !==
            String(sellerId)
        );

      if (buyerRead) {
        return true;
      }
    }

    if (
      lastMessage?.seenBy &&
      typeof lastMessage.seenBy ===
        "object" &&
      !Array.isArray(
        lastMessage.seenBy
      )
    ) {
      const buyerSeen =
        Object.entries(
          lastMessage.seenBy
        ).some(
          ([uid, seen]) =>
            String(uid) !==
              String(sellerId) &&
            seen === true
        );

      if (buyerSeen) {
        return true;
      }
    }

    if (
      lastMessage?.readBy &&
      typeof lastMessage.readBy ===
        "object" &&
      !Array.isArray(
        lastMessage.readBy
      )
    ) {
      const buyerRead =
        Object.entries(
          lastMessage.readBy
        ).some(
          ([uid, read]) =>
            String(uid) !==
              String(sellerId) &&
            read === true
        );

      if (buyerRead) {
        return true;
      }
    }

    if (
      message?.lastMessageSeen ===
      true
    ) {
      return true;
    }

    if (
      message?.seen === true ||
      message?.seenAt
    ) {
      return true;
    }

    const buyerUnread =
      message?.otherParticipantUnread;

    if (
      buyerUnread !== undefined &&
      buyerUnread !== null &&
      Number(buyerUnread) === 0 &&
      isLastMessageFromSeller(
        message
      )
    ) {
      return true;
    }

    if (
      message?.buyerUnread !==
        undefined &&
      message?.buyerUnread !==
        null &&
      Number(
        message.buyerUnread
      ) === 0 &&
      isLastMessageFromSeller(
        message
      )
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // MESSAGE STATUS
  // =====================================================

  const getLastMessageStatus = (
    message
  ) => {
    const sellerSentLast =
      isLastMessageFromSeller(
        message
      );

    if (!sellerSentLast) {
      return "none";
    }

    return isLastMessageSeen(
      message
    )
      ? "seen"
      : "sent";
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const MessageStatus = ({
    message,
  }) => {
    const status =
      getLastMessageStatus(
        message
      );

    if (status === "none") {
      return null;
    }

    if (status === "seen") {
      return (
        <span
          className="
            inline-flex
            items-center
            shrink-0
            text-green-600
          "
          title="Seen by buyer"
        >
          <FiCheck
            size={14}
            strokeWidth={3}
          />

          <FiCheck
            size={14}
            strokeWidth={3}
            className="-ml-[7px]"
          />
        </span>
      );
    }

    return (
      <span
        className="
          inline-flex
          items-center
          shrink-0
          text-gray-400
        "
        title="Sent"
      >
        <FiCheck
          size={14}
          strokeWidth={3}
        />
      </span>
    );
  };

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = async (
    message
  ) => {
    const conversationId =
      getConversationId(
        message
      );

    if (!conversationId) {
      console.error(
        "Unable to open seller conversation: missing conversationId.",
        message
      );

      return;
    }

    setSidebarOpen(false);

    navigate(
      `/seller/messages/${encodeURIComponent(
        String(
          conversationId
        )
      )}`
    );

    if (
      typeof markMessageAsRead ===
      "function"
    ) {
      try {
        await Promise.resolve(
          markMessageAsRead(
            conversationId
          )
        );
      } catch (error) {
        console.error(
          "Error marking seller conversation as read:",
          error
        );
      }
    }
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      className="
        h-screen
        w-full
        bg-gray-50
        text-gray-800
        flex
        overflow-hidden
      "
    >
      {/* ================================================= */}
      {/* MOBILE SIDEBAR OVERLAY */}
      {/* ================================================= */}

      {sidebarOpen && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            z-40
            lg:hidden
          "
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-[230px]
          bg-green-700
          text-white
          flex
          flex-col
          shadow-2xl
          lg:shadow-none
          transition-transform
          duration-300
          ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div
          className="
            h-[86px]
            px-5
            flex
            items-center
            justify-between
            shrink-0
          "
        >
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "/seller-dashboard"
              )
            }
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-white
                text-green-700
                flex
                items-center
                justify-center
                font-extrabold
                shadow-sm
              "
            >
              CM
            </div>

            <div className="text-left">
              <p
                className="
                  text-lg
                  font-extrabold
                  leading-none
                "
              >
                CampusMart
              </p>

              <p
                className="
                  text-[10px]
                  text-green-100
                  mt-1
                "
              >
                Buy. Sell. Connect.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="
              lg:hidden
              text-green-100
            "
          >
            <FiX size={22} />
          </button>
        </div>

        <div
          className="
            flex-1
            overflow-y-auto
            px-3
            pb-5
          "
        >
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
                      w-full
                      flex
                      items-center
                      gap-3
                      px-3
                      py-3
                      rounded-xl
                      text-sm
                      font-medium
                      transition
                      ${
                        active
                          ? "bg-white text-green-700 shadow-sm"
                          : "text-white hover:bg-green-600"
                      }
                    `}
                  >
                    <Icon size={18} />

                    <span
                      className="
                        flex-1
                        text-left
                      "
                    >
                      {item.label}
                    </span>

                    {item.new && (
                      <span
                        className="
                          px-1.5
                          py-0.5
                          rounded-md
                          bg-yellow-400
                          text-green-900
                          text-[8px]
                          font-bold
                        "
                      >
                        NEW
                      </span>
                    )}

                    {item.badge >
                      0 && (
                      <span
                        className="
                          min-w-5
                          h-5
                          px-1
                          rounded-full
                          bg-red-500
                          text-white
                          text-[10px]
                          font-bold
                          flex
                          items-center
                          justify-center
                        "
                      >
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

        <div
          className="
            px-3
            pb-4
            shrink-0
          "
        >
          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-3
              rounded-xl
              text-sm
              font-medium
              text-white
              hover:bg-green-600
              transition
            "
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div
        className="
          flex-1
          min-w-0
          lg:ml-[230px]
          flex
          flex-col
          h-screen
        "
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header
          className="
            h-[86px]
            bg-green-800
            text-white
            flex
            items-center
            px-4
            sm:px-6
            gap-4
            shrink-0
          "
        >
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="lg:hidden"
          >
            <FiMenu size={23} />
          </button>

          <div
            className="
              relative
              flex-1
              max-w-[500px]
            "
          >
            <FiSearch
              size={17}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
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
              className="
                w-full
                h-10
                bg-white
                text-gray-800
                rounded-full
                pl-11
                pr-4
                text-sm
                outline-none
                placeholder:text-gray-400
              "
            />
          </div>

          <div
            className="
              ml-auto
              flex
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/seller/messages"
                )
              }
              className="
                relative
                w-9
                h-9
                rounded-full
                hover:bg-green-700
                flex
                items-center
                justify-center
              "
            >
              <FiMessageCircle
                size={19}
              />

              {unreadMessages >
                0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    min-w-4
                    h-4
                    px-1
                    rounded-full
                    bg-red-500
                    text-white
                    text-[8px]
                    font-bold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {unreadMessages >
                  99
                    ? "99+"
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
              className="
                flex
                items-center
                gap-2
                rounded-full
                bg-green-700
                hover:bg-green-600
                px-2
                py-1.5
                transition
              "
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8
                    h-8
                    rounded-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-white
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-xs
                  "
                >
                  {getInitial(
                    sellerFullName
                  )}
                </div>
              )}

              <div
                className="
                  hidden
                  sm:block
                  text-left
                  pr-2
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    leading-none
                  "
                >
                  {sellerFullName}
                </p>

                <p
                  className="
                    text-[9px]
                    text-green-100
                    mt-1
                  "
                >
                  Seller
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <main
          className="
            flex-1
            overflow-y-auto
            p-4
            sm:p-6
            lg:p-7
          "
        >
          <div className="space-y-6">

            {/* ================================================= */}
            {/* TITLE */}
            {/* ================================================= */}

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

                <p
                  className="
                    text-gray-500
                    mt-1
                  "
                >
                  Chat with buyers
                  about your products.
                </p>
              </div>

              <div
                className="
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  bg-green-50
                  text-green-700
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                "
              >
                <FiMessageCircle
                  size={16}
                />
                Seller Inbox
              </div>
            </div>

            {/* ================================================= */}
            {/* STATS */}
            {/* ================================================= */}

            <div
              className="
                grid
                grid-cols-2
                lg:grid-cols-3
                gap-4
              "
            >
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
                      {messages.length}
                    </p>
                  </div>
                </div>
              </div>

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
                      {unreadMessages}
                    </p>
                  </div>
                </div>
              </div>

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
                      Buyers Online
                    </p>

                    <p className="text-xl font-bold text-gray-800">
                      {onlineUsers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* SEARCH */}
            {/* ================================================= */}

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

            {/* ================================================= */}
            {/* CONVERSATIONS */}
            {/* ================================================= */}

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                overflow-hidden
              "
            >
              {/* HEADER */}

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
                      Buyer Conversations
                    </h2>

                    <p className="text-sm text-gray-400 mt-0.5">
                      {filteredMessages.length}{" "}
                      {filteredMessages.length ===
                      1
                        ? "conversation"
                        : "conversations"}
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

              {/* ================================================= */}
              {/* MESSAGE LIST */}
              {/* ================================================= */}

              {filteredMessages.length >
              0 ? (
                <div>
                  {filteredMessages.map(
                    (
                      message,
                      index
                    ) => {
                      const conversationId =
                        getConversationId(
                          message
                        );

                      const unread =
                        Number(
                          message?.unread ||
                            message?.unreadCount ||
                            0
                        );

                      const lastMessage =
                        getLastMessage(
                          message
                        );

                      const sellerSentLast =
                        isLastMessageFromSeller(
                          message
                        );

                      const lastMessageSeen =
                        isLastMessageSeen(
                          message
                        );

                      // =========================================
                      // BUYER PROFILE
                      // =========================================

                      const buyerId =
                        getBuyerId(
                          message
                        );

                      const buyerName =
                        getBuyerName(
                          message
                        );

                      const buyerProfileImage =
                        getBuyerProfileImage(
                          message
                        );

                      return (
                        <button
                          key={
                            conversationId ||
                            message?.id ||
                            `conversation-${index}`
                          }
                          type="button"
                          disabled={
                            !conversationId
                          }
                          onClick={() =>
                            openChat(
                              message
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
                            disabled:cursor-not-allowed
                          "
                        >
                          {/* ================================================= */}
                          {/* BUYER PROFILE AVATAR */}
                          {/* ================================================= */}

                          <div className="shrink-0">
                            {buyerProfileImage ? (
                              <img
                                src={
                                  buyerProfileImage
                                }
                                alt={
                                  buyerName
                                }
                                className="
                                  w-12
                                  h-12
                                  sm:w-13
                                  sm:h-13
                                  rounded-full
                                  object-cover
                                  border
                                  border-gray-100
                                  bg-gray-100
                                "
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  const fallback =
                                    event.currentTarget
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

                            {/* FALLBACK */}

                            <div
                              style={{
                                display:
                                  buyerProfileImage
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
                              {getInitial(
                                buyerName
                              )}
                            </div>
                          </div>

                          {/* ================================================= */}
                          {/* BUYER INFORMATION */}
                          {/* ================================================= */}

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
                                    unread >
                                    0
                                      ? "font-bold text-gray-900"
                                      : "font-semibold text-gray-800"
                                  }
                                `}
                              >
                                {buyerName}
                              </h3>

                              <span
                                className="
                                  text-xs
                                  text-gray-400
                                  shrink-0
                                "
                              >
                                {getMessageTime(
                                  message
                                )}
                              </span>
                            </div>

                            {/* PRODUCT */}

                            {message?.productName && (
                              <p
                                className="
                                  text-[11px]
                                  text-green-600
                                  font-medium
                                  mt-0.5
                                  truncate
                                "
                              >
                                {
                                  message.productName
                                }
                              </p>
                            )}

                            {/* LAST MESSAGE */}

                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                                mt-1
                                min-w-0
                              "
                            >
                              {sellerSentLast && (
                                <MessageStatus
                                  message={
                                    message
                                  }
                                />
                              )}

                              <p
                                className={`
                                  text-sm
                                  truncate
                                  ${
                                    unread >
                                    0
                                      ? "font-semibold text-gray-700"
                                      : "text-gray-500"
                                  }
                                `}
                              >
                                {
                                  lastMessage
                                }
                              </p>
                            </div>

                            {/* SEEN */}

                            {sellerSentLast &&
                              lastMessageSeen && (
                                <p
                                  className="
                                    text-[10px]
                                    text-green-600
                                    font-medium
                                    mt-0.5
                                  "
                                >
                                  Seen by buyer
                                </p>
                              )}
                          </div>

                          {/* ================================================= */}
                          {/* UNREAD */}
                          {/* ================================================= */}

                          {unread >
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
                              {unread >
                              99
                                ? "99+"
                                : unread}
                            </span>
                          )}

                          {/* ================================================= */}
                          {/* CHEVRON */}
                          {/* ================================================= */}

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
                /* ================================================= */
                /* EMPTY STATE */
                /* ================================================= */

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
                      ? "No conversations found"
                      : "No buyer messages yet"}
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
                      : "When buyers contact you about your products, their conversations will appear here."}
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

            {/* ================================================= */}
            {/* FOOTER INFO */}
            {/* ================================================= */}

            <div
              className="
                rounded-2xl
                bg-green-50
                border
                border-green-100
                p-4
                sm:p-5
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-white
                  text-green-700
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  shrink-0
                "
              >
                <FiCheckCircle
                  size={18}
                />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  Stay connected
                  with your buyers
                </p>

                <p
                  className="
                    text-xs
                    text-gray-500
                    mt-0.5
                  "
                >
                  Reply quickly to
                  questions about
                  your products.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerMessages;