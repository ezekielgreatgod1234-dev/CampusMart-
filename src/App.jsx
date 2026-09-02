import { useEffect, useRef, useState } from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  updateDoc,
  increment,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { db } from "./context/firebase";

// =========================================================
// INTERNET REQUIRED
// =========================================================

import InternetRequired from "./components/InternetRequired";

// =========================================================
// CUSTOMER PAGES
// =========================================================

import Dashboard from "./pages/customer/Dashboard";
import BrowseProducts from "./pages/customer/BrowseProducts";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import Messages from "./pages/customer/Messages";
import Chat from "./pages/customer/Chat";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Wishlist from "./pages/customer/Wishlist";
import Orders from "./pages/customer/Orders";
import OrderDetails from "./pages/customer/OrderDetails";
import Payment from "./pages/customer/Payment";
import Profile from "./pages/customer/Profile";
import Settings from "./pages/customer/Settings";
import PaymentOtp from "./pages/customer/PaymentOtp";

// =========================================================
// SELLER PAGES
// =========================================================

import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerMessages from "./pages/seller/SellerMessages";
import SellerChat from "./pages/seller/SellerChat";
import SellerEarnings from "./pages/seller/SellerEarnings";
import WithdrawEarnings from "./pages/seller/WithdrawEarnings";
import SellerPromotions from "./pages/seller/SellerPromotions";
import SellerPayment from "./pages/seller/SellerPayment";
import SellerProfile from "./pages/seller/SellerProfile";
import SellerSettings from "./pages/seller/SellerSettings";
import SellerOrders from "./pages/seller/SellerOrders";

// =========================================================
// OTHER PAGES
// =========================================================

import Logout from "./context/Logout";
import Login from "./context/Login";
import Register from "./context/Register";
import Landing from "./pages/customer/Landing";
import ForgotPassword from "./pages/customer/ForgotPassword";
import PrivacyPolicy from "./pages/customer/PrivacyPolicy";
import TermsAndConditions from "./pages/customer/TermsAndConditions";




import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminFees from "./pages/admin/AdminFees";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminPayments from "./pages/admin/AdminPayments";

// =========================================================
// DEFAULT PROFILE
// =========================================================

const emptyProfile = {
  fullName: "",
  displayName: "",
  email: "",
  phone: "",
  campus: "",
  address: "",
  profileImage: null,
  photoURL: null,
  role: "",
};

// =========================================================
// CUSTOMER DATA SAVE DELAY
// =========================================================

const CUSTOMER_DATA_SAVE_DELAY = 800;

// =========================================================
// LOADING SCREEN
// =========================================================

function LoadingScreen({ text = "Loading CampusMart..." }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="text-center">
        <div
          className="
            w-12
            h-12
            mx-auto
            rounded-full
            border-4
            border-green-100
            border-t-green-600
            animate-spin
          "
        />

        <p className="mt-5 text-sm font-medium text-gray-600">
          {text}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// GET NORMALIZED ROLE
// =========================================================

function getUserRole(profile) {
  return String(profile?.role || "")
    .trim()
    .toLowerCase();
}

// =========================================================
// GET PROFILE IMAGE
// =========================================================

function getProfileImage(profile, firebaseUser = null) {
  return (
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.image ||
    profile?.avatar ||
    firebaseUser?.photoURL ||
    null
  );
}

// =========================================================
// GET PROFILE NAME
// =========================================================

function getProfileName(profile, firebaseUser = null) {
  return (
    profile?.fullName ||
    profile?.displayName ||
    firebaseUser?.displayName ||
    firebaseUser?.email ||
    "CampusMart User"
  );
}

// =========================================================
// GET PUBLIC PROFILE
// =========================================================

async function getPublicProfile(userId) {
  if (!userId) {
    return null;
  }

  try {
    const publicProfileRef = doc(
      db,
      "publicProfiles",
      String(userId),
    );

    const snapshot = await getDoc(publicProfileRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      uid: String(userId),
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("Error loading public profile:", error);

    return null;
  }
}

// =========================================================
// SAVE CURRENT USER PUBLIC PROFILE
// =========================================================

async function syncOwnPublicProfile(firebaseUser, profile) {
  if (!firebaseUser) {
    return;
  }

  const userId = String(firebaseUser.uid);

  const publicProfileRef = doc(
    db,
    "publicProfiles",
    userId,
  );

  const fullName =
    profile?.fullName ||
    profile?.displayName ||
    firebaseUser.displayName ||
    firebaseUser.email ||
    "CampusMart User";

  const displayName =
    profile?.displayName ||
    profile?.fullName ||
    firebaseUser.displayName ||
    firebaseUser.email ||
    "CampusMart User";

  const profileImage = getProfileImage(
    profile,
    firebaseUser,
  );

  try {
    await setDoc(
      publicProfileRef,
      {
        fullName,
        displayName,
        profileImage: profileImage || null,

        photoURL:
          profile?.photoURL ||
          profileImage ||
          firebaseUser.photoURL ||
          null,

        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  } catch (error) {
    console.error(
      "Error syncing public profile:",
      error,
    );
  }
}

// =========================================================
// GUEST ROUTE
// =========================================================

function GuestRoute({
  children,
  profile,
  profileResolved,
}) {
  const {
    firebaseUser,
    profileLoading,
  } = useAuth();

  if (
    profileLoading ||
    (firebaseUser && !profileResolved)
  ) {
    return (
      <LoadingScreen text="Checking your account..." />
    );
  }

  if (firebaseUser) {
    const role = getUserRole(profile);

    if (role === "seller") {
      return (
        <Navigate
          to="/seller-dashboard"
          replace
        />
      );
    }

    if (role === "buyer") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <LoadingScreen
        text="Preparing your account..."
      />
    );
  }

  return children;
}

// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({
  children,
  profileResolved,
}) {
  const {
    firebaseUser,
    profileLoading,
  } = useAuth();

  if (profileLoading) {
    return (
      <LoadingScreen text="Checking your account..." />
    );
  }

  if (!firebaseUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!profileResolved) {
    return (
      <LoadingScreen text="Loading your profile..." />
    );
  }

  return children;
}

// =========================================================
// CUSTOMER ROUTE
// =========================================================

function CustomerRoute({
  children,
  profile,
  profileResolved,
}) {
  if (!profileResolved) {
    return (
      <LoadingScreen text="Loading your profile..." />
    );
  }

  const role = getUserRole(profile);

  if (role === "seller") {
    return (
      <Navigate
        to="/seller-dashboard"
        replace
      />
    );
  }

  if (role !== "buyer") {
    return (
      <LoadingScreen
        text="Preparing your account..."
      />
    );
  }

  return children;
}

// =========================================================
// SELLER ROUTE
// =========================================================

function SellerRoute({
  children,
  profile,
  profileResolved,
}) {
  if (!profileResolved) {
    return (
      <LoadingScreen
        text="Loading your seller account..."
      />
    );
  }

  const role = getUserRole(profile);

  if (role !== "seller") {
    if (role === "buyer") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <LoadingScreen
        text="Preparing your account..."
      />
    );
  }

  return children;
}

// =========================================================
// MESSAGE TIMESTAMP
//
// THIS IS THE IMPORTANT FIX.
//
// New messages:
//   createdAtMs
//   createdAt
//
// Older messages:
//   createdAt
//   time
//
// Everything is converted into milliseconds.
//
// The actual message timestamp is NEVER regenerated
// from the deployment/app version.
// =========================================================

function getMessageTimestamp(message) {
  if (!message) {
    return 0;
  }

  // =======================================================
  // 1. createdAtMs
  //
  // This is the most reliable field.
  // =======================================================

  if (
    typeof message.createdAtMs === "number" &&
    Number.isFinite(message.createdAtMs) &&
    message.createdAtMs > 0
  ) {
    return message.createdAtMs < 1e12
      ? message.createdAtMs * 1000
      : message.createdAtMs;
  }

  // =======================================================
  // 2. createdAt
  // =======================================================

  const createdAt = message.createdAt;

  if (createdAt != null) {
    // Firestore Timestamp
    if (
      typeof createdAt.toMillis === "function"
    ) {
      const ms = createdAt.toMillis();

      if (
        Number.isFinite(ms) &&
        ms > 0
      ) {
        return ms;
      }
    }

    // Firestore Timestamp-like object
    if (
      typeof createdAt === "object" &&
      typeof createdAt.seconds === "number"
    ) {
      const ms =
        createdAt.seconds * 1000 +
        Math.floor(
          Number(createdAt.nanoseconds || 0) /
            1000000,
        );

      if (
        Number.isFinite(ms) &&
        ms > 0
      ) {
        return ms;
      }
    }

    // Number
    if (
      typeof createdAt === "number" &&
      Number.isFinite(createdAt)
    ) {
      return createdAt < 1e12
        ? createdAt * 1000
        : createdAt;
    }

    // Date object
    if (createdAt instanceof Date) {
      const ms = createdAt.getTime();

      if (
        Number.isFinite(ms) &&
        ms > 0
      ) {
        return ms;
      }
    }

    // String
    if (
      typeof createdAt === "string" &&
      createdAt.trim()
    ) {
      const parsed = Date.parse(
        createdAt,
      );

      if (
        Number.isFinite(parsed) &&
        parsed > 0
      ) {
        return parsed;
      }
    }
  }

  // =======================================================
  // 3. OLD MESSAGE FALLBACK
  //
  // Some old messages have only:
  //
  // time: "07:05 PM"
  //
  // We convert the time to today's date.
  //
  // This prevents those messages from being randomly
  // placed simply because they were created before the
  // newer timestamp system.
  // =======================================================

  if (
    typeof message.time === "string" &&
    message.time.trim()
  ) {
    const timeText = message.time.trim();

    const parsedTime = Date.parse(
      `1970-01-01 ${timeText}`,
    );

    if (Number.isFinite(parsedTime)) {
      const timeDate = new Date(parsedTime);

      const now = new Date();

      const result = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        timeDate.getHours(),
        timeDate.getMinutes(),
        timeDate.getSeconds(),
        timeDate.getMilliseconds(),
      );

      const ms = result.getTime();

      if (
        Number.isFinite(ms) &&
        ms > 0
      ) {
        return ms;
      }
    }
  }

  return 0;
}

// =========================================================
// SORT MESSAGES CHRONOLOGICALLY
//
// ALWAYS:
//
// oldest
// ↓
// newest
//
// If two messages have exactly the same timestamp,
// their original array order is preserved.
// =========================================================

function sortMessagesChronologically(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message, index) => ({
      message,
      index,
      timestamp: getMessageTimestamp(
        message,
      ),
    }))
    .sort((a, b) => {
      // Both have valid timestamps
      if (
        a.timestamp > 0 &&
        b.timestamp > 0
      ) {
        if (
          a.timestamp !== b.timestamp
        ) {
          return (
            a.timestamp -
            b.timestamp
          );
        }

        return a.index - b.index;
      }

      // A has timestamp, B does not
      if (
        a.timestamp > 0 &&
        b.timestamp === 0
      ) {
        return -1;
      }

      // B has timestamp, A does not
      if (
        a.timestamp === 0 &&
        b.timestamp > 0
      ) {
        return 1;
      }

      // Neither has timestamp
      return a.index - b.index;
    })
    .map(
      (item) => item.message,
    );
}

// =========================================================
// FORMAT FIRESTORE CONVERSATION
// =========================================================

async function formatConversation(
  conversationDoc,
  currentUserId,
) {
  const data = conversationDoc.data();

  const participantNames =
    data.participantNames || {};

  const participantImages =
    data.participantImages || {};

  const participants = Array.isArray(
    data.participants,
  )
    ? data.participants
    : [];

  // =======================================================
  // FIND OTHER PARTICIPANT
  // =======================================================

  const otherParticipantId =
    participants.find(
      (uid) =>
        String(uid) !==
        String(currentUserId),
    ) || null;

  // =======================================================
  // GET PUBLIC PROFILE
  // =======================================================

  let publicProfile = null;

  if (otherParticipantId) {
    publicProfile =
      await getPublicProfile(
        otherParticipantId,
      );
  }

  // =======================================================
  // NAME
  // =======================================================

  const publicProfileName =
    publicProfile?.fullName ||
    publicProfile?.displayName ||
    "";

  const storedParticipantName =
    participantNames[
      otherParticipantId
    ] || "";

  const otherName =
    publicProfileName ||
    storedParticipantName ||
    "CampusMart User";

  // =======================================================
  // IMAGE
  // =======================================================

  const publicProfileImage =
    publicProfile?.profileImage ||
    publicProfile?.photoURL ||
    publicProfile?.image ||
    publicProfile?.avatar ||
    null;

  const storedParticipantImage =
    participantImages[
      otherParticipantId
    ] ||
    data.profileImages?.[
      otherParticipantId
    ] ||
    data.participantPhotos?.[
      otherParticipantId
    ] ||
    null;

  const otherParticipantImage =
    publicProfileImage ||
    storedParticipantImage ||
    null;

  // =======================================================
  // REPAIR OLD CONVERSATION PROFILE
  // =======================================================

  if (
    otherParticipantId &&
    publicProfile &&
    (
      String(
        participantImages[
          otherParticipantId
        ] || "",
      ) !==
        String(
          otherParticipantImage || "",
        ) ||
      String(
        participantNames[
          otherParticipantId
        ] || "",
      ) !== String(otherName)
    )
  ) {
    try {
      await setDoc(
        conversationDoc.ref,
        {
          participantNames: {
            ...participantNames,

            [otherParticipantId]:
              otherName,
          },

          participantImages: {
            ...participantImages,

            [otherParticipantId]:
              otherParticipantImage,
          },

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        },
      );
    } catch (error) {
      console.error(
        "Could not repair conversation profile:",
        error,
      );
    }
  }

  // =======================================================
  // UNREAD COUNT
  // =======================================================

  const unreadCount = Number(
    data.unreadCounts?.[
      currentUserId
    ] || 0,
  );

  // =======================================================
  // ALL MESSAGES
  // =======================================================

  const conversationMessages =
    Array.isArray(data.messages)
      ? data.messages
      : [];

  // =======================================================
  // REMOVE DELETED MESSAGES
  // =======================================================

  const visibleMessages =
    conversationMessages.filter(
      (message) => {
        const deletedFor =
          Array.isArray(
            message.deletedFor,
          )
            ? message.deletedFor
            : [];

        if (
          deletedFor.includes(
            currentUserId,
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
      },
    );

  // =======================================================
  // CRITICAL:
  //
  // SORT THE ACTUAL MESSAGES.
  //
  // This is what makes buyer chat and seller chat
  // display the same chronological conversation.
  // =======================================================

  const sortedVisibleMessages =
    sortMessagesChronologically(
      visibleMessages,
    );

  // =======================================================
  // LAST VISIBLE MESSAGE
  // =======================================================

  const lastVisibleMessage =
    sortedVisibleMessages.length > 0
      ? sortedVisibleMessages[
          sortedVisibleMessages.length - 1
        ]
      : null;

  const lastMessage =
    lastVisibleMessage?.text ||
    (
      lastVisibleMessage?.imageUrl
        ? "📷 Photo"
        : ""
    ) ||
    "";

  // =======================================================
  // LAST MESSAGE TIME
  // =======================================================

  const lastMessageTimestamp =
    getMessageTimestamp(
      lastVisibleMessage,
    );

  let displayTime = "";

  if (
    lastMessageTimestamp > 0
  ) {
    try {
      displayTime = new Date(
        lastMessageTimestamp,
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      displayTime = "";
    }
  }

  // =======================================================
  // RETURN
  // =======================================================

  return {
    id: conversationDoc.id,

    conversationId:
      conversationDoc.id,

    otherParticipantId,

    name: otherName,

    profileImage:
      otherParticipantImage,

    lastMessage,

    time: displayTime,

    unread: unreadCount,

    online:
      data.onlineStatus?.[
        otherParticipantId
      ] === true,

    // ALWAYS SORTED
    conversation:
      sortedVisibleMessages,

    // ALSO SORTED
    allMessages:
      sortedVisibleMessages,

    productId:
      data.productId || null,

    productName:
      data.productName || "",

    buyerId:
      data.buyerId || null,

    sellerId:
      data.sellerId || null,
  };
}

// =========================================================
// SORT CONVERSATIONS
// =========================================================

function sortConversations(
  conversationList,
) {
  return [...conversationList].sort(
    (a, b) => {
      const aMessages =
        Array.isArray(a.conversation)
          ? a.conversation
          : [];

      const bMessages =
        Array.isArray(b.conversation)
          ? b.conversation
          : [];

      const aLast =
        aMessages.length > 0
          ? aMessages[
              aMessages.length - 1
            ]
          : null;

      const bLast =
        bMessages.length > 0
          ? bMessages[
              bMessages.length - 1
            ]
          : null;

      const aTime =
        getMessageTimestamp(aLast);

      const bTime =
        getMessageTimestamp(bLast);

      return bTime - aTime;
    },
  );
}

// =========================================================
// APP
// =========================================================

function App() {
  const navigate = useNavigate();

  const location = useLocation();

  // =======================================================
  // INTERNET
  // =======================================================

  const [isOnline, setIsOnline] =
    useState(true);

  useEffect(() => {
    let startupTimer;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    startupTimer =
      window.setTimeout(() => {
        setIsOnline(navigator.onLine);
      }, 1000);

    return () => {
      window.clearTimeout(
        startupTimer,
      );

      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
  }, []);

  // =======================================================
  // FIREBASE AUTH
  // =======================================================

  const {
    firebaseUser,
    profile: authProfile,
    profileLoading,
  } = useAuth();

  // =======================================================
  // PROFILE
  // =======================================================

  const [profile, setProfile] =
    useState(emptyProfile);

  const [profileResolved, setProfileResolved] =
    useState(false);

  const profileRequestId =
    useRef(0);

  // =======================================================
  // LOAD CURRENT USER PROFILE
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const currentRequest =
      ++profileRequestId.current;

    const loadCurrentUserProfile =
      async () => {
        if (!firebaseUser) {
          if (!cancelled) {
            setProfile(emptyProfile);

            setProfileResolved(true);
          }

          return;
        }

        setProfileResolved(false);

        setProfile(emptyProfile);

        try {
          const userRef = doc(
            db,
            "users",
            firebaseUser.uid,
          );

          const snapshot =
            await getDoc(userRef);

          if (
            cancelled ||
            currentRequest !==
              profileRequestId.current
          ) {
            return;
          }

          let resolvedProfile;

          if (snapshot.exists()) {
            const firestoreProfile =
              snapshot.data();

            resolvedProfile = {
              ...emptyProfile,
              ...firestoreProfile,

              uid: firebaseUser.uid,

              email:
                firestoreProfile.email ||
                firebaseUser.email ||
                "",

              fullName:
                firestoreProfile.fullName ||
                firestoreProfile.displayName ||
                firebaseUser.displayName ||
                "",

              displayName:
                firestoreProfile.displayName ||
                firestoreProfile.fullName ||
                firebaseUser.displayName ||
                "",
            };
          } else {
            const authRole =
              getUserRole(authProfile);

            if (
              authRole === "seller" ||
              authRole === "buyer"
            ) {
              resolvedProfile = {
                ...emptyProfile,
                ...authProfile,

                uid: firebaseUser.uid,

                email:
                  authProfile?.email ||
                  firebaseUser.email ||
                  "",

                fullName:
                  authProfile?.fullName ||
                  authProfile?.displayName ||
                  firebaseUser.displayName ||
                  "",

                displayName:
                  authProfile?.displayName ||
                  authProfile?.fullName ||
                  firebaseUser.displayName ||
                  "",
              };
            } else {
              resolvedProfile = {
                ...emptyProfile,

                uid: firebaseUser.uid,

                email:
                  firebaseUser.email ||
                  "",

                fullName:
                  firebaseUser.displayName ||
                  "",

                displayName:
                  firebaseUser.displayName ||
                  "",

                role: "",
              };
            }
          }

          if (cancelled) {
            return;
          }

          setProfile(
            resolvedProfile,
          );

          await syncOwnPublicProfile(
            firebaseUser,
            resolvedProfile,
          );

          if (
            cancelled ||
            currentRequest !==
              profileRequestId.current
          ) {
            return;
          }

          setProfileResolved(true);
        } catch (error) {
          console.error(
            "Error loading current user profile:",
            error,
          );

          if (
            !cancelled &&
            currentRequest ===
              profileRequestId.current
          ) {
            const fallbackProfile = {
              ...emptyProfile,

              uid: firebaseUser.uid,

              email:
                firebaseUser.email ||
                "",

              fullName:
                firebaseUser.displayName ||
                "",

              displayName:
                firebaseUser.displayName ||
                "",

              role: "",
            };

            setProfile(
              fallbackProfile,
            );

            setProfileResolved(true);
          }
        }
      };

    loadCurrentUserProfile();

    return () => {
      cancelled = true;
    };
  }, [
    firebaseUser?.uid,
    authProfile,
  ]);

  // =======================================================
  // CUSTOMER DATA
  // =======================================================

  const [cart, setCart] =
    useState([]);

  const [wishlist, setWishlist] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  // =======================================================
  // CONVERSATIONS
  // =======================================================

  const [messages, setMessages] =
    useState([]);

  // =======================================================
  // CUSTOMER DATA SAVE REF
  // =======================================================

  const customerDataSaveTimer =
    useRef(null);

  const pendingCustomerData =
    useRef(null);

  // =======================================================
  // GET CURRENT USER CHAT IMAGE
  // =======================================================

  const getCurrentUserChatImage =
    () => {
      if (!firebaseUser) {
        return null;
      }

      return getProfileImage(
        profile,
        firebaseUser,
      );
    };

  // =======================================================
  // CUSTOMER DATA DOCUMENT
  // =======================================================

  const getCustomerDataRef = () => {
    if (!firebaseUser) {
      return null;
    }

    return doc(
      db,
      "users",
      firebaseUser.uid,
      "customerData",
      "main",
    );
  };

  // =======================================================
  // SAVE CUSTOMER DATA
  // =======================================================

  const writeCustomerData =
    async ({
      nextCart,
      nextWishlist,
      nextOrders,
    }) => {
      if (!firebaseUser) {
        return false;
      }

      const customerDataRef =
        getCustomerDataRef();

      if (!customerDataRef) {
        return false;
      }

      try {
        await setDoc(
          customerDataRef,
          {
            cart: Array.isArray(
              nextCart,
            )
              ? nextCart
              : [],

            wishlist: Array.isArray(
              nextWishlist,
            )
              ? nextWishlist
              : [],

            orders: Array.isArray(
              nextOrders,
            )
              ? nextOrders
              : [],

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        return true;
      } catch (error) {
        console.error(
          "Error saving customer data:",
          error,
        );

        return false;
      }
    };

  // =======================================================
  // QUEUE CUSTOMER DATA SAVE
  // =======================================================

  const queueCustomerDataSave =
    ({
      nextCart,
      nextWishlist,
      nextOrders,
      immediate = false,
    }) => {
      if (!firebaseUser) {
        return;
      }

      pendingCustomerData.current =
        {
          nextCart,
          nextWishlist,
          nextOrders,
        };

      if (
        customerDataSaveTimer.current
      ) {
        window.clearTimeout(
          customerDataSaveTimer.current,
        );

        customerDataSaveTimer.current =
          null;
      }

      if (immediate) {
        const dataToSave =
          pendingCustomerData.current;

        pendingCustomerData.current =
          null;

        writeCustomerData(
          dataToSave,
        );

        return;
      }

      customerDataSaveTimer.current =
        window.setTimeout(() => {
          const dataToSave =
            pendingCustomerData.current;

          pendingCustomerData.current =
            null;

          customerDataSaveTimer.current =
            null;

          if (dataToSave) {
            writeCustomerData(
              dataToSave,
            );
          }
        }, CUSTOMER_DATA_SAVE_DELAY);
    };

  // =======================================================
  // LOAD CUSTOMER DATA
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const loadCustomerData =
      async () => {
        if (!firebaseUser) {
          setCart([]);
          setWishlist([]);
          setOrders([]);

          return;
        }

        const customerDataRef =
          getCustomerDataRef();

        if (!customerDataRef) {
          return;
        }

        try {
          const snapshot =
            await getDoc(
              customerDataRef,
            );

          if (cancelled) {
            return;
          }

          if (!snapshot.exists()) {
            setCart([]);
            setWishlist([]);
            setOrders([]);

            await setDoc(
              customerDataRef,
              {
                cart: [],
                wishlist: [],
                orders: [],
                createdAt:
                  serverTimestamp(),
                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              },
            );

            return;
          }

          const data =
            snapshot.data();

          setCart(
            Array.isArray(data.cart)
              ? data.cart
              : [],
          );

          setWishlist(
            Array.isArray(
              data.wishlist,
            )
              ? data.wishlist
              : [],
          );

          setOrders(
            Array.isArray(
              data.orders,
            )
              ? data.orders
              : [],
          );
        } catch (error) {
          console.error(
            "Error loading customer data:",
            error,
          );

          if (!cancelled) {
            setCart([]);
            setWishlist([]);
            setOrders([]);
          }
        }
      };

    loadCustomerData();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid]);

  // =======================================================
  // CLEAN CUSTOMER SAVE
  // =======================================================

  useEffect(() => {
    return () => {
      if (
        customerDataSaveTimer.current
      ) {
        window.clearTimeout(
          customerDataSaveTimer.current,
        );

        customerDataSaveTimer.current =
          null;
      }

      pendingCustomerData.current =
        null;
    };
  }, []);

  // =======================================================
  // UPDATE PROFILE
  // =======================================================

  const updateProfile =
    async (updates) => {
      if (!firebaseUser) {
        return;
      }

      const newProfile = {
        ...profile,
        ...updates,
      };

      setProfile(newProfile);

      try {
        const userRef = doc(
          db,
          "users",
          firebaseUser.uid,
        );

        await setDoc(
          userRef,
          {
            ...updates,

            uid: firebaseUser.uid,

            email:
              newProfile.email ||
              firebaseUser.email ||
              "",

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        await syncOwnPublicProfile(
          firebaseUser,
          newProfile,
        );

        console.log(
          "Private and public profiles updated.",
        );
      } catch (error) {
        console.error(
          "Error updating profile:",
          error,
        );
      }
    };

  // =======================================================
  // SYNC CURRENT USER PROFILE IMAGE TO CONVERSATIONS
  // =======================================================

  useEffect(() => {
    if (
      !firebaseUser ||
      !profileResolved
    ) {
      return;
    }

    const currentUserId =
      String(firebaseUser.uid);

    const currentUserImage =
      getCurrentUserChatImage();

    const currentUserName =
      getProfileName(
        profile,
        firebaseUser,
      );

    let cancelled = false;

    const syncProfileImage =
      async () => {
        try {
          const conversationsRef =
            collection(
              db,
              "conversations",
            );

          const conversationsQuery =
            query(
              conversationsRef,
              where(
                "participants",
                "array-contains",
                currentUserId,
              ),
            );

          const snapshot =
            await getDocs(
              conversationsQuery,
            );

          if (cancelled) {
            return;
          }

          if (snapshot.empty) {
            return;
          }

          const updates = [];

          snapshot.docs.forEach(
            (conversationDoc) => {
              const data =
                conversationDoc.data();

              const existingImages =
                data.participantImages ||
                {};

              const existingNames =
                data.participantNames ||
                {};

              const existingImage =
                existingImages[
                  currentUserId
                ] || null;

              const existingName =
                existingNames[
                  currentUserId
                ] || "";

              if (
                String(
                  existingImage || "",
                ) !==
                  String(
                    currentUserImage ||
                      "",
                  ) ||
                  String(
                    existingName || "",
                  ) !==
                    String(
                      currentUserName ||
                        "",
                    )
              ) {
                updates.push(
                  setDoc(
                    conversationDoc.ref,
                    {
                      participantImages: {
                        ...existingImages,

                        [currentUserId]:
                          currentUserImage,
                      },

                      participantNames: {
                        ...existingNames,

                        [currentUserId]:
                          currentUserName,
                      },

                      updatedAt:
                        serverTimestamp(),
                    },
                    {
                      merge: true,
                    },
                  ),
                );
              }
            },
          );

          if (updates.length > 0) {
            await Promise.all(
              updates,
            );

            console.log(
              "Current user's chat profile synchronized.",
            );
          }
        } catch (error) {
          if (!cancelled) {
            console.error(
              "Error synchronizing chat profile:",
              error,
            );
          }
        }
      };

    syncProfileImage();

    return () => {
      cancelled = true;
    };
  }, [
    firebaseUser?.uid,
    profileResolved,
    profile?.profileImage,
    profile?.photoURL,
    profile?.image,
    profile?.avatar,
    profile?.fullName,
    profile?.displayName,
  ]);

  // =======================================================
  // ADD TO CART
  // =======================================================

  const addToCart = (
    product,
    quantity = 1,
  ) => {
    if (
      !product ||
      !firebaseUser
    ) {
      return;
    }

    const existingProduct =
      cart.find(
        (item) =>
          item.id === product.id,
      );

    let nextCart;

    if (existingProduct) {
      nextCart = cart.map(
        (item) =>
          item.id === product.id
            ? {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0,
                  ) +
                  Number(
                    quantity || 0,
                  ),
              }
            : item,
      );
    } else {
      nextCart = [
        ...cart,

        {
          ...product,

          quantity:
            Number(quantity) || 1,
        },
      ];
    }

    setCart(nextCart);

    queueCustomerDataSave({
      nextCart,
      nextWishlist: wishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // INCREASE QUANTITY
  // =======================================================

  const increaseQuantity =
    (productId) => {
      const nextCart = cart.map(
        (item) =>
          item.id === productId
            ? {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0,
                  ) + 1,
              }
            : item,
      );

      setCart(nextCart);

      queueCustomerDataSave({
        nextCart,
        nextWishlist: wishlist,
        nextOrders: orders,
      });
    };

  // =======================================================
  // DECREASE QUANTITY
  // =======================================================

  const decreaseQuantity =
    (productId) => {
      const nextCart = cart.map(
        (item) =>
          item.id === productId
            ? {
                ...item,

                quantity: Math.max(
                  1,
                  Number(
                    item.quantity || 1,
                  ) - 1,
                ),
              }
            : item,
      );

      setCart(nextCart);

      queueCustomerDataSave({
        nextCart,
        nextWishlist: wishlist,
        nextOrders: orders,
      });
    };

  // =======================================================
  // REMOVE FROM CART
  // =======================================================

  const removeFromCart =
    (productId) => {
      const nextCart =
        cart.filter(
          (item) =>
            item.id !== productId,
        );

      setCart(nextCart);

      queueCustomerDataSave({
        nextCart,
        nextWishlist: wishlist,
        nextOrders: orders,
      });
    };

  // =======================================================
  // CART COUNT
  // =======================================================

  const cartCount =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0,
        ),
      0,
    );

  // =======================================================
  // TOGGLE WISHLIST
  // =======================================================

  const toggleWishlist =
    (productId) => {
      if (!firebaseUser) {
        return;
      }

      let nextWishlist;

      if (
        wishlist.includes(productId)
      ) {
        nextWishlist =
          wishlist.filter(
            (id) =>
              id !== productId,
          );
      } else {
        nextWishlist = [
          ...wishlist,
          productId,
        ];
      }

      setWishlist(
        nextWishlist,
      );

      queueCustomerDataSave({
        nextCart: cart,
        nextWishlist,
        nextOrders: orders,
      });
    };

  // =======================================================
  // REMOVE FROM WISHLIST
  // =======================================================

  const removeFromWishlist =
    (productId) => {
      const nextWishlist =
        wishlist.filter(
          (id) =>
            id !== productId,
        );

      setWishlist(
        nextWishlist,
      );

      queueCustomerDataSave({
        nextCart: cart,
        nextWishlist,
        nextOrders: orders,
      });
    };

  // =======================================================
  // COMMISSION
  // =======================================================

  const PLATFORM_COMMISSION_RATE =
    0.05;

  const getItemLineTotal =
    (item) => {
      const price = Number(
        String(
          item?.price ?? 0,
        ).replace(
          /[₦,]/g,
          "",
        ),
      );

      const qty = Number(
        item?.quantity || 1,
      );

      return (
        (Number.isFinite(price)
          ? price
          : 0) *
        (Number.isFinite(qty)
          ? qty
          : 1)
      );
    };

  const splitAmount = (
    total,
  ) => {
    const gross =
      Number(total) || 0;

    const platformFee = Math.round(
      gross *
        PLATFORM_COMMISSION_RATE,
    );

    const sellerAmount =
      Math.max(
        0,
        gross - platformFee,
      );

    return {
      gross,
      platformFee,
      sellerAmount,
    };
  };

  // =======================================================
  // PLACE ORDER
  // =======================================================

  const placeOrder =
    async (orderData) => {
      if (
        !orderData ||
        !firebaseUser
      ) {
        return null;
      }

      const items = Array.isArray(
        orderData.items,
      )
        ? orderData.items
        : [];

      if (items.length === 0) {
        console.error(
          "placeOrder: no items",
        );

        return null;
      }

      const customer =
        orderData.customer || {};

      const paymentMethod =
        orderData.paymentMethod ||
        "card";

      const checkoutType =
        orderData.type || "all";

      const paystackReference =
        orderData.paystackReference ||
        null;

      // Group items by seller
      const bySeller = {};

      for (const item of items) {
        const sellerId =
          item.sellerId ||
          item.sellerUid ||
          item.seller?.uid ||
          item.seller?.id ||
          "";

        if (!sellerId) {
          console.warn(
            "placeOrder: item missing sellerId",
            item,
          );

          continue;
        }

        if (!bySeller[sellerId]) {
          bySeller[sellerId] = [];
        }

        bySeller[sellerId].push(
          item,
        );
      }

      const sellerIds =
        Object.keys(bySeller);

      if (
        sellerIds.length === 0
      ) {
        console.error(
          "placeOrder: no sellerId on cart items.",
        );

        return null;
      }

      const timestamp =
        Date.now();

      const createdOrders = [];

      try {
        for (
          const sellerId of sellerIds
        ) {
          const sellerItems =
            bySeller[sellerId];

          const total =
            sellerItems.reduce(
              (sum, item) =>
                sum +
                getItemLineTotal(
                  item,
                ),
              0,
            );

          const {
            platformFee,
            sellerAmount,
          } =
            splitAmount(total);

          const orderNumber =
            `CM-${String(
              timestamp,
            ).slice(
              -6,
            )}${String(
              createdOrders.length +
                1,
            ).padStart(
              2,
              "0",
            )}`;

          const orderPayload = {
            buyerId:
              firebaseUser.uid,

            sellerId:
              String(sellerId),

            items: sellerItems,

            total,

            platformFee,

            sellerAmount,

            commissionRate:
              PLATFORM_COMMISSION_RATE,

            paymentMethod,

            paymentStatus:
              "paid",

            paystackReference,

            status:
              "pending",

            type:
              checkoutType,

            orderNumber,

            customerName:
              customer.fullName ||
              "",

            fullName:
              customer.fullName ||
              "",

            phone:
              customer.phone ||
              "",

            campus:
              customer.campus ||
              "",

            address:
              customer.address ||
              "",

            note:
              customer.note ||
              "",

            customer: {
              fullName:
                customer.fullName ||
                "",

              phone:
                customer.phone ||
                "",

              campus:
                customer.campus ||
                "",

              address:
                customer.address ||
                "",

              note:
                customer.note ||
                "",
            },

            date:
              new Date().toLocaleDateString(),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          };

          const orderRef =
            await addDoc(
              collection(
                db,
                "orders",
              ),
              orderPayload,
            );

          // Credit seller
          const sellerRef =
            doc(
              db,
              "users",
              String(sellerId),
            );

          try {
            await updateDoc(
              sellerRef,
              {
                availableBalance:
                  increment(
                    sellerAmount,
                  ),

                totalEarnings:
                  increment(
                    sellerAmount,
                  ),

                totalSalesGross:
                  increment(
                    total,
                  ),

                totalPlatformFees:
                  increment(
                    platformFee,
                  ),

                updatedAt:
                  serverTimestamp(),
              },
            );
          } catch (
            sellerErr
          ) {
            console.warn(
              "Seller balance update fallback:",
              sellerErr,
            );

            await setDoc(
              sellerRef,
              {
                availableBalance:
                  increment(
                    sellerAmount,
                  ),

                totalEarnings:
                  increment(
                    sellerAmount,
                  ),

                totalSalesGross:
                  increment(
                    total,
                  ),

                totalPlatformFees:
                  increment(
                    platformFee,
                  ),

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              },
            );
          }

          // Earnings ledger
          try {
            await addDoc(
              collection(
                db,
                "earnings",
              ),
              {
                sellerId:
                  String(
                    sellerId,
                  ),

                orderId:
                  orderRef.id,

                type:
                  "sale",

                title:
                  `Order #${orderNumber}`,

                description:
                  sellerItems
                    .map(
                      (i) =>
                        i.name ||
                        i.productName ||
                        "Item",
                    )
                    .join(", "),

                gross:
                  total,

                platformFee,

                amount:
                  sellerAmount,

                status:
                  "Completed",

                createdAt:
                  serverTimestamp(),
              },
            );
          } catch (
            earnErr
          ) {
            console.warn(
              "Could not write earnings ledger:",
              earnErr,
            );
          }

          // Increment product sales
          for (
            const item of sellerItems
          ) {
            const productId =
              item.id ||
              item.productId;

            if (!productId) {
              continue;
            }

            const qty =
              Number(
                item.quantity,
              ) || 1;

            try {
              await updateDoc(
                doc(
                  db,
                  "products",
                  String(
                    productId,
                  ),
                ),
                {
                  sales:
                    increment(qty),

                  updatedAt:
                    serverTimestamp(),
                },
              );
            } catch (
              salesErr
            ) {
              console.warn(
                "Could not update product sales:",
                productId,
                salesErr,
              );
            }
          }

          createdOrders.push({
            id: orderRef.id,

            orderNumber,

            items: sellerItems,

            total,

            platformFee,

            sellerAmount,

            paymentMethod,

            type:
              checkoutType,

            fullName:
              customer.fullName ||
              "",

            phone:
              customer.phone ||
              "",

            campus:
              customer.campus ||
              "",

            address:
              customer.address ||
              "",

            note:
              customer.note ||
              "",

            customer,

            date:
              new Date().toLocaleDateString(),

            createdAt:
              new Date().toISOString(),

            status:
              "pending",

            sellerId:
              String(sellerId),

            paymentStatus:
              "paid",
          });
        }

        const nextOrders = [
          ...orders,
          ...createdOrders,
        ];

        const purchasedIds =
          items.map(
            (item) => item.id,
          );

        const nextCart =
          cart.filter(
            (item) =>
              !purchasedIds.includes(
                item.id,
              ),
          );

        setOrders(
          nextOrders,
        );

        setCart(
          nextCart,
        );

        queueCustomerDataSave({
          nextCart,
          nextWishlist:
            wishlist,
          nextOrders,
          immediate: true,
        });

        return createdOrders.length ===
          1
          ? createdOrders[0]
          : createdOrders[0];
      } catch (error) {
        console.error(
          "placeOrder error:",
          error,
        );

        throw error;
      }
    };

  // =======================================================
  // CANCEL ORDER
  // =======================================================

  const cancelOrder =
    async (orderId) => {
      if (
        !orderId ||
        !firebaseUser
      ) {
        throw new Error(
          "Cannot cancel order",
        );
      }

      const orderRef = doc(
        db,
        "orders",
        String(orderId),
      );

      const snap =
        await getDoc(orderRef);

      if (!snap.exists()) {
        const nextOrders =
          orders.map(
            (o) =>
              String(o.id) ===
              String(orderId)
                ? {
                    ...o,
                    status:
                      "cancelled",
                  }
                : o,
          );

        setOrders(
          nextOrders,
        );

        queueCustomerDataSave({
          nextCart: cart,
          nextWishlist:
            wishlist,
          nextOrders,
          immediate: true,
        });

        return;
      }

      const data =
        snap.data();

      const status =
        String(
          data.status ||
            "pending",
        ).toLowerCase();

      if (
        status ===
          "delivered" ||
        status ===
          "cancelled"
      ) {
        throw new Error(
          "This order can no longer be cancelled.",
        );
      }

      if (
        String(
          data.buyerId,
        ) !==
        String(
          firebaseUser.uid,
        )
      ) {
        throw new Error(
          "You can only cancel your own orders.",
        );
      }

      const sellerAmount =
        Number(
          data.sellerAmount,
        ) || 0;

      const sellerId =
        data.sellerId;

      await updateDoc(
        orderRef,
        {
          status:
            "cancelled",

          cancelledAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

      if (
        sellerId &&
        sellerAmount > 0
      ) {
        try {
          await updateDoc(
            doc(
              db,
              "users",
              String(
                sellerId,
              ),
            ),
            {
              availableBalance:
                increment(
                  -sellerAmount,
                ),

              totalEarnings:
                increment(
                  -sellerAmount,
                ),

              updatedAt:
                serverTimestamp(),
            },
          );
        } catch (e) {
          console.warn(
            "Could not reverse seller balance:",
            e,
          );
        }
      }

      const nextOrders =
        orders.map(
          (o) =>
            String(o.id) ===
            String(orderId)
              ? {
                  ...o,
                  status:
                    "cancelled",
                }
              : o,
        );

      setOrders(
        nextOrders,
      );

      queueCustomerDataSave({
        nextCart: cart,
        nextWishlist:
          wishlist,
        nextOrders,
        immediate: true,
      });
    };

  // =======================================================
  // REAL-TIME CONVERSATIONS
  // =======================================================

  const isMessagesPage =
    location.pathname ===
      "/messages" ||
    location.pathname.startsWith(
      "/messages/",
    ) ||
    location.pathname ===
      "/seller/messages" ||
    location.pathname.startsWith(
      "/seller/messages/",
    );

  useEffect(() => {
    if (!firebaseUser) {
      setMessages([]);

      return undefined;
    }

    const conversationsRef =
      collection(
        db,
        "conversations",
      );

    const conversationsQuery =
      query(
        conversationsRef,
        where(
          "participants",
          "array-contains",
          firebaseUser.uid,
        ),
      );

    // =====================================================
    // PROCESS CONVERSATIONS
    // =====================================================

    const processSnapshot =
      async (snapshot) => {
        try {
          const conversationList =
            await Promise.all(
              snapshot.docs.map(
                (
                  conversationDoc,
                ) =>
                  formatConversation(
                    conversationDoc,
                    firebaseUser.uid,
                  ),
              ),
            );

          setMessages(
            sortConversations(
              conversationList,
            ),
          );
        } catch (error) {
          console.error(
            "Error processing conversations:",
            error,
          );

          setMessages([]);
        }
      };

    // =====================================================
    // MESSAGE PAGES
    // =====================================================

    if (isMessagesPage) {
      const unsubscribe =
        onSnapshot(
          conversationsQuery,

          (snapshot) => {
            processSnapshot(
              snapshot,
            );
          },

          (error) => {
            console.error(
              "Conversation listener error:",
              error,
            );

            setMessages([]);
          },
        );

      return () => {
        unsubscribe();
      };
    }

    // =====================================================
    // OTHER PAGES
    // =====================================================

    let cancelled = false;

    const loadConversationsOnce =
      async () => {
        try {
          const snapshot =
            await getDocs(
              conversationsQuery,
            );

          if (cancelled) {
            return;
          }

          const conversationList =
            await Promise.all(
              snapshot.docs.map(
                (
                  conversationDoc,
                ) =>
                  formatConversation(
                    conversationDoc,
                    firebaseUser.uid,
                  ),
              ),
            );

          if (cancelled) {
            return;
          }

          setMessages(
            sortConversations(
              conversationList,
            ),
          );
        } catch (error) {
          console.error(
            "Error loading conversations:",
            error,
          );

          if (!cancelled) {
            setMessages([]);
          }
        }
      };

    loadConversationsOnce();

    return () => {
      cancelled = true;
    };
  }, [
    firebaseUser?.uid,
    isMessagesPage,
  ]);

  // =======================================================
  // UNREAD MESSAGE COUNT
  // =======================================================

  const unreadMessages =
    messages.reduce(
      (total, message) =>
        total +
        Number(
          message.unread || 0,
        ),
      0,
    );

  // =======================================================
  // MARK MESSAGE AS READ
  // =======================================================

  const markMessageAsRead =
    async (messageId) => {
      if (
        !firebaseUser ||
        !messageId
      ) {
        return false;
      }

      try {
        const conversationRef =
          doc(
            db,
            "conversations",
            String(
              messageId,
            ),
          );

        await updateDoc(
          conversationRef,
          {
            [`unreadCounts.${firebaseUser.uid}`]:
              0,
          },
        );

        return true;
      } catch (error) {
        console.error(
          "Error marking conversation as read:",
          error,
        );

        return false;
      }
    };

  // =======================================================
  // SEND MESSAGE
  //
  // IMPORTANT:
  //
  // createdAtMs and createdAt are created from the SAME
  // exact millisecond.
  //
  // This means redeploying the app cannot change the
  // message's position.
  // =======================================================

  const sendMessage =
    async (
      messageId,
      text,
    ) => {
      const cleanText =
        String(
          text || "",
        ).trim();

      if (
        !cleanText ||
        !firebaseUser ||
        !messageId
      ) {
        return false;
      }

      try {
        const conversationRef =
          doc(
            db,
            "conversations",
            String(
              messageId,
            ),
          );

        let success = false;

        await runTransaction(
          db,
          async (transaction) => {
            const conversationSnapshot =
              await transaction.get(
                conversationRef,
              );

            if (
              !conversationSnapshot.exists()
            ) {
              throw new Error(
                "Conversation not found.",
              );
            }

            const data =
              conversationSnapshot.data();

            const participants =
              Array.isArray(
                data.participants,
              )
                ? data.participants
                : [];

            if (
              !participants.includes(
                firebaseUser.uid,
              )
            ) {
              throw new Error(
                "You are not a participant in this conversation.",
              );
            }

            const receiverId =
              participants.find(
                (uid) =>
                  String(uid) !==
                  String(
                    firebaseUser.uid,
                  ),
              );

            if (!receiverId) {
              throw new Error(
                "Receiver ID is missing.",
              );
            }

            const existingMessages =
              Array.isArray(
                data.messages,
              )
                ? data.messages
                : [];

            // =================================================
            // ONE STABLE TIMESTAMP
            // =================================================

            const nowMs =
              Date.now();

            const newMessage = {
              id: `${firebaseUser.uid}_${nowMs}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

              senderId:
                firebaseUser.uid,

              sender: "me",

              text: cleanText,

              // Same exact timestamp
              // as createdAtMs.
              createdAt:
                Timestamp.fromMillis(
                  nowMs,
                ),

              createdAtMs:
                nowMs,

              time: new Date(
                nowMs,
              ).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute:
                    "2-digit",
                },
              ),

              deletedFor: [],
            };

            const currentUnread =
              Number(
                data.unreadCounts?.[
                  receiverId
                ] || 0,
              );

            transaction.update(
              conversationRef,
              {
                messages: [
                  ...existingMessages,
                  newMessage,
                ],

                lastMessage:
                  cleanText,

                lastMessageAt:
                  nowMs,

                [`unreadCounts.${receiverId}`]:
                  currentUnread + 1,

                [`unreadCounts.${firebaseUser.uid}`]:
                  0,

                updatedAt:
                  serverTimestamp(),
              },
            );

            success = true;
          },
        );

        return success;
      } catch (error) {
        console.error(
          "Error sending message:",
          error,
        );

        return false;
      }
    };

  // =======================================================
  // DELETE MESSAGES
  // =======================================================

  const deleteMessages =
    async (
      conversationId,
      messageIds,
      deleteType,
    ) => {
      if (
        !firebaseUser ||
        !conversationId ||
        !Array.isArray(
          messageIds,
        ) ||
        messageIds.length === 0
      ) {
        return false;
      }

      if (
        deleteType !== "me" &&
        deleteType !== "everyone"
      ) {
        return false;
      }

      try {
        const conversationRef =
          doc(
            db,
            "conversations",
            String(
              conversationId,
            ),
          );

        const result =
          await runTransaction(
            db,
            async (
              transaction,
            ) => {
              const snapshot =
                await transaction.get(
                  conversationRef,
                );

              if (
                !snapshot.exists()
              ) {
                throw new Error(
                  "Conversation not found.",
                );
              }

              const data =
                snapshot.data();

              const participants =
                Array.isArray(
                  data.participants,
                )
                  ? data.participants
                  : [];

              if (
                !participants.includes(
                  firebaseUser.uid,
                )
              ) {
                throw new Error(
                  "You are not a participant in this conversation.",
                );
              }

              const existingMessages =
                Array.isArray(
                  data.messages,
                )
                  ? data.messages
                  : [];

              const selectedIds =
                new Set(
                  messageIds.map(
                    (messageId) =>
                      String(
                        messageId,
                      ),
                  ),
                );

              // =============================================
              // DELETE FOR EVERYONE
              // =============================================

              if (
                deleteType ===
                "everyone"
              ) {
                const updatedMessages =
                  existingMessages.filter(
                    (message) => {
                      const messageId =
                        String(
                          message.id,
                        );

                      if (
                        !selectedIds.has(
                          messageId,
                        )
                      ) {
                        return true;
                      }

                      const isMine =
                        String(
                          message.senderId,
                        ) ===
                        String(
                          firebaseUser.uid,
                        );

                      if (!isMine) {
                        return true;
                      }

                      return false;
                    },
                  );

                const visibleMessages =
                  updatedMessages.filter(
                    (message) => {
                      const deletedFor =
                        Array.isArray(
                          message.deletedFor,
                        )
                          ? message.deletedFor
                          : [];

                      return (
                        !deletedFor.includes(
                          firebaseUser.uid,
                        ) &&
                        message.deletedForEveryone !==
                          true
                      );
                    },
                  );

                // IMPORTANT:
                // Sort again after deletion.
                const sortedMessages =
                  sortMessagesChronologically(
                    visibleMessages,
                  );

                const lastMessage =
                  sortedMessages.length >
                  0
                    ? sortedMessages[
                        sortedMessages.length -
                          1
                      ]
                    : null;

                transaction.update(
                  conversationRef,
                  {
                    messages:
                      updatedMessages,

                    lastMessage:
                      lastMessage?.text ||
                      (
                        lastMessage?.imageUrl
                          ? "📷 Photo"
                          : ""
                      ),

                    lastMessageAt:
                      getMessageTimestamp(
                        lastMessage,
                      ),

                    updatedAt:
                      serverTimestamp(),
                  },
                );

                return true;
              }

              // =============================================
              // DELETE FOR ME
              // =============================================

              const updatedMessages =
                existingMessages.map(
                  (message) => {
                    const messageId =
                      String(
                        message.id,
                      );

                    if (
                      !selectedIds.has(
                        messageId,
                      )
                    ) {
                      return message;
                    }

                    const deletedFor =
                      Array.isArray(
                        message.deletedFor,
                      )
                        ? message.deletedFor
                        : [];

                    if (
                      deletedFor.includes(
                        firebaseUser.uid,
                      )
                    ) {
                      return message;
                    }

                    return {
                      ...message,

                      deletedFor: [
                        ...deletedFor,
                        firebaseUser.uid,
                      ],
                    };
                  },
                );

              const visibleForCurrentUser =
                updatedMessages.filter(
                  (message) => {
                    const deletedFor =
                      Array.isArray(
                        message.deletedFor,
                      )
                        ? message.deletedFor
                        : [];

                    if (
                      deletedFor.includes(
                        firebaseUser.uid,
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
                  },
                );

              // IMPORTANT:
              // Sort again after deletion.
              const sortedVisible =
                sortMessagesChronologically(
                  visibleForCurrentUser,
                );

              const lastMessage =
                sortedVisible.length >
                0
                  ? sortedVisible[
                      sortedVisible.length -
                        1
                    ]
                  : null;

              transaction.update(
                conversationRef,
                {
                  messages:
                    updatedMessages,

                  lastMessage:
                    lastMessage?.text ||
                    (
                      lastMessage?.imageUrl
                        ? "📷 Photo"
                        : ""
                    ),

                  lastMessageAt:
                    getMessageTimestamp(
                      lastMessage,
                    ),

                  updatedAt:
                    serverTimestamp(),
                },
              );

              return true;
            },
          );

        return result === true;
      } catch (error) {
        console.error(
          "Error deleting messages:",
          error,
        );

        return false;
      }
    };

  // =======================================================
  // OPEN SELLER CHAT
  // =======================================================

  const openSellerChat =
    async (product) => {
      if (!firebaseUser) {
        console.error(
          "Cannot open seller chat: user is not logged in.",
        );

        return false;
      }

      if (!product) {
        console.error(
          "Cannot open seller chat: product is missing.",
        );

        return false;
      }

      const sellerId =
        product.sellerId ||
        product.sellerUid ||
        product.seller?.uid ||
        "";

      if (!sellerId) {
        console.error(
          "Cannot open seller chat: this product has no seller ID.",
          product,
        );

        return false;
      }

      if (
        String(sellerId) ===
        String(firebaseUser.uid)
      ) {
        console.error(
          "Cannot open seller chat: buyer and seller are the same user.",
        );

        return false;
      }

      // ===================================================
      // STABLE CONVERSATION ID
      // ===================================================

      const participantIds = [
        String(firebaseUser.uid),
        String(sellerId),
      ].sort();

      const conversationId =
        participantIds.join("_");

      const conversationRef =
        doc(
          db,
          "conversations",
          conversationId,
        );

      try {
        const existingSnapshot =
          await getDoc(
            conversationRef,
          );

        // =================================================
        // BUYER
        // =================================================

        const buyerName =
          getProfileName(
            profile,
            firebaseUser,
          );

        const buyerImage =
          getProfileImage(
            profile,
            firebaseUser,
          );

        // =================================================
        // SELLER PUBLIC PROFILE
        // =================================================

        const sellerPublicProfile =
          await getPublicProfile(
            sellerId,
          );

        const sellerName =
          sellerPublicProfile?.fullName ||
          sellerPublicProfile?.displayName ||
          product.sellerName ||
          product.seller?.name ||
          product.seller?.fullName ||
          "CampusMart Seller";

        const sellerImage =
          sellerPublicProfile?.profileImage ||
          sellerPublicProfile?.photoURL ||
          sellerPublicProfile?.image ||
          sellerPublicProfile?.avatar ||
          product.sellerImage ||
          product.seller?.profileImage ||
          product.seller?.image ||
          product.seller?.photoURL ||
          product.seller?.avatar ||
          null;

        // =================================================
        // EXISTING CONVERSATION
        // =================================================

        if (
          existingSnapshot.exists()
        ) {
          const existingData =
            existingSnapshot.data();

          const existingParticipantImages =
            existingData.participantImages ||
            {};

          const existingParticipantNames =
            existingData.participantNames ||
            {};

          const updatedImages = {
            ...existingParticipantImages,

            [String(
              firebaseUser.uid,
            )]:
              buyerImage,

            [String(sellerId)]:
              sellerImage,
          };

          const updatedNames = {
            ...existingParticipantNames,

            [String(
              firebaseUser.uid,
            )]:
              buyerName,

            [String(sellerId)]:
              sellerName,
          };

          await setDoc(
            conversationRef,
            {
              participants:
                participantIds,

              buyerId:
                String(
                  firebaseUser.uid,
                ),

              sellerId:
                String(
                  sellerId,
                ),

              participantNames:
                updatedNames,

              participantImages:
                updatedImages,

              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          navigate(
            `/messages/${conversationId}`,
          );

          return true;
        }

        // =================================================
        // CREATE NEW CONVERSATION
        // =================================================

        await setDoc(
          conversationRef,
          {
            participants:
              participantIds,

            buyerId:
              String(
                firebaseUser.uid,
              ),

            sellerId:
              String(
                sellerId,
              ),

            participantNames: {
              [String(
                firebaseUser.uid,
              )]:
                buyerName,

              [String(
                sellerId,
              )]:
                sellerName,
            },

            participantImages: {
              [String(
                firebaseUser.uid,
              )]:
                buyerImage,

              [String(sellerId)]:
                sellerImage,
            },

            unreadCounts: {
              [String(
                firebaseUser.uid,
              )]: 0,

              [String(
                sellerId,
              )]: 0,
            },

            onlineStatus: {
              [String(
                firebaseUser.uid,
              )]: true,

              [String(
                sellerId,
              )]: false,
            },

            lastMessage: "",

            lastMessageAt: 0,

            messages: [],

            productId:
              product.id ||
              null,

            productName:
              product.name ||
              "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        console.log(
          "Seller conversation created successfully:",
          conversationId,
        );

        navigate(
          `/messages/${conversationId}`,
        );

        return true;
      } catch (error) {
        console.error(
          "Error opening seller chat:",
          error,
        );

        return false;
      }
    };

  // =======================================================
  // AUTH INITIALIZATION
  // =======================================================

  if (
    profileLoading ||
    (
      firebaseUser &&
      !profileResolved
    )
  ) {
    return (
      <>
        {!isOnline && (
          <InternetRequired />
        )}

        <LoadingScreen
          text={
            firebaseUser
              ? "Loading your CampusMart account..."
              : "Checking your account..."
          }
        />
      </>
    );
  }

  // =======================================================
  // ROUTES
  // =======================================================

  return (
    <>
      {!isOnline && (
        <InternetRequired />
      )}

      <Routes>

        {/* ================================================= */}
        {/* LANDING */}
        {/* ================================================= */}

        <Route
          path="/"
          element={<Landing />}
        />

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={
            <GuestRoute
              profile={profile}
              profileResolved={
                profileResolved
              }
            >
              <Login />
            </GuestRoute>
          }
        />

        {/* ================================================= */}
        {/* REGISTER */}
        {/* ================================================= */}

        <Route
          path="/register"
          element={
            <GuestRoute
              profile={profile}
              profileResolved={
                profileResolved
              }
            >
              <Register />
            </GuestRoute>
          }
        />

        {/* ================================================= */}
        {/* FORGOT PASSWORD */}
        {/* ================================================= */}

        <Route
          path="/forgot-password"
          element={
            <GuestRoute
              profile={profile}
              profileResolved={
                profileResolved
              }
            >
              <ForgotPassword />
            </GuestRoute>
          }
        />

        {/* ================================================= */}
        {/* PRIVACY POLICY */}
        {/* ================================================= */}

        <Route
          path="/privacy-policy"
          element={
            <PrivacyPolicy />
          }
        />

        {/* ================================================= */}
        {/* TERMS */}
        {/* ================================================= */}

        <Route
          path="/terms-and-conditions"
          element={
            <TermsAndConditions />
          }
        />

        {/* ================================================= */}
        {/* CUSTOMER DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Dashboard
                  addToCart={
                    addToCart
                  }
                  cartCount={
                    cartCount
                  }
                  orders={orders}
                  wishlist={
                    wishlist
                  }
                  toggleWishlist={
                    toggleWishlist
                  }
                  unreadMessages={
                    unreadMessages
                  }
                  messages={
                    messages
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* BROWSE PRODUCTS */}
        {/* ================================================= */}

        <Route
          path="/browse-products"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <BrowseProducts
                  addToCart={
                    addToCart
                  }
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  toggleWishlist={
                    toggleWishlist
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PRODUCT DETAILS */}
        {/* ================================================= */}

        <Route
          path="/products/:id"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <ProductDetails
                  addToCart={
                    addToCart
                  }
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  toggleWishlist={
                    toggleWishlist
                  }
                  openSellerChat={
                    openSellerChat
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* CART */}
        {/* ================================================= */}

        <Route
          path="/cart"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Cart
                  cart={cart}
                  cartCount={
                    cartCount
                  }
                  increaseQuantity={
                    increaseQuantity
                  }
                  decreaseQuantity={
                    decreaseQuantity
                  }
                  removeFromCart={
                    removeFromCart
                  }
                  openSellerChat={
                    openSellerChat
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* ORDERS */}
        {/* ================================================= */}

        <Route
          path="/orders"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Orders
                  orders={orders}
                  cartCount={
                    cartCount
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* ORDER DETAILS */}
        {/* ================================================= */}

        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <OrderDetails
                  orders={orders}
                  cartCount={
                    cartCount
                  }
                  profile={
                    profile
                  }
                  cancelOrder={
                    cancelOrder
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* CUSTOMER MESSAGES */}
        {/* ================================================= */}

        <Route
          path="/messages"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Messages
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  messages={
                    messages
                  }
                  unreadMessages={
                    unreadMessages
                  }
                  markMessageAsRead={
                    markMessageAsRead
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* CUSTOMER CHAT */}
        {/* ================================================= */}

        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Chat
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  messages={
                    messages
                  }
                  unreadMessages={
                    unreadMessages
                  }
                  markMessageAsRead={
                    markMessageAsRead
                  }
                  sendMessage={
                    sendMessage
                  }
                  deleteMessages={
                    deleteMessages
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* CHECKOUT */}
        {/* ================================================= */}

        <Route
          path="/checkout"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Checkout
                  cart={cart}
                  cartCount={
                    cartCount
                  }
                  placeOrder={
                    placeOrder
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* ORDER SUCCESS */}
        {/* ================================================= */}

        <Route
          path="/order-success"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <OrderSuccess
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* WISHLIST */}
        {/* ================================================= */}

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Wishlist
                  wishlist={
                    wishlist
                  }
                  removeFromWishlist={
                    removeFromWishlist
                  }
                  addToCart={
                    addToCart
                  }
                  cartCount={
                    cartCount
                  }
                  profile={
                    profile
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PAYMENT */}
        {/* ================================================= */}

        <Route
          path="/payment"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Payment
                  cartCount={
                    cartCount
                  }
                  profile={
                    profile
                  }
                  placeOrder={
                    placeOrder
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PROFILE */}
        {/* ================================================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Profile
                  profile={
                    profile
                  }
                  updateProfile={
                    updateProfile
                  }
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SETTINGS */}
        {/* ================================================= */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <Settings
                  profile={
                    profile
                  }
                  updateProfile={
                    updateProfile
                  }
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* LOGOUT */}
        {/* ================================================= */}

        <Route
          path="/logout"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <Logout
                cartCount={
                  cartCount
                }
                wishlist={
                  wishlist
                }
                unreadMessages={
                  unreadMessages
                }
              />
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/seller-dashboard"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerDashboard
                  profile={
                    profile
                  }
                  cartCount={
                    cartCount
                  }
                  wishlist={
                    wishlist
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER PRODUCTS */}
        {/* ================================================= */}

        <Route
          path="/seller/products"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerProducts
                  profile={
                    profile
                  }
                  cartCount={
                    cartCount
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER MESSAGES */}
        {/* ================================================= */}

        <Route
          path="/seller/messages"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerMessages
                  messages={
                    messages
                  }
                  unreadMessages={
                    unreadMessages
                  }
                  markMessageAsRead={
                    markMessageAsRead
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER CHAT */}
        {/* ================================================= */}

        <Route
          path="/seller/messages/:id"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerChat
                  messages={
                    messages
                  }
                  unreadMessages={
                    unreadMessages
                  }
                  markMessageAsRead={
                    markMessageAsRead
                  }
                  sendMessage={
                    sendMessage
                  }
                  deleteMessages={
                    deleteMessages
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER EARNINGS */}
        {/* ================================================= */}

        <Route
          path="/seller/earnings"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerEarnings
                  profile={
                    profile
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER WITHDRAW */}
        {/* ================================================= */}

        <Route
          path="/seller/withdraw"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <WithdrawEarnings
                  unreadMessages={
                    unreadMessages
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER PROMOTIONS */}
        {/* ================================================= */}

        <Route
          path="/seller/promotions"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerPromotions
                  unreadMessages={
                    unreadMessages
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER PAYMENT */}
        {/* ================================================= */}

        <Route
          path="/seller/payment"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerPayment
                  unreadMessages={
                    unreadMessages
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER PROFILE */}
        {/* ================================================= */}

        <Route
          path="/seller/profile"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerProfile
                  profile={
                    profile
                  }
                  updateProfile={
                    updateProfile
                  }
                  unreadMessages={
                    unreadMessages
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER SETTINGS */}
        {/* ================================================= */}

        <Route
          path="/seller/settings"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerSettings
                  unreadMessages={
                    unreadMessages
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* SELLER ORDERS */}
        {/* ================================================= */}

        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <SellerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <SellerOrders
                  unreadMessages={
                    unreadMessages
                  }
                  profile={
                    profile
                  }
                />
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* ================================================= */}
        {/* PAYMENT OTP */}
        {/* ================================================= */}

        <Route
          path="/payment/otp"
          element={
            <ProtectedRoute
              profileResolved={
                profileResolved
              }
            >
              <CustomerRoute
                profile={profile}
                profileResolved={
                  profileResolved
                }
              >
                <PaymentOtp
                  cartCount={
                    cartCount
                  }
                  placeOrder={
                    placeOrder
                  }
                />
              </CustomerRoute>
            </ProtectedRoute>
          }
        />


        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/fees" element={<AdminFees />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/payments" element={<AdminPayments />} />


        {/* ================================================== */}
        {/* FALLBACK */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </>
  );
}

export default App;