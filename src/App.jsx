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

        <p className="mt-5 text-sm font-medium text-gray-600">{text}</p>
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
    const publicProfileRef = doc(db, "publicProfiles", String(userId));

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

  const publicProfileRef = doc(db, "publicProfiles", userId);

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

  const profileImage = getProfileImage(profile, firebaseUser);

  try {
    await setDoc(
      publicProfileRef,
      {
        fullName,
        displayName,
        profileImage: profileImage || null,

        photoURL:
          profile?.photoURL || profileImage || firebaseUser.photoURL || null,

        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  } catch (error) {
    console.error("Error syncing public profile:", error);
  }
}

// =========================================================
// GUEST ROUTE
// =========================================================

function GuestRoute({ children, profile, profileResolved }) {
  const { firebaseUser, profileLoading } = useAuth();

  if (profileLoading || (firebaseUser && !profileResolved)) {
    return <LoadingScreen text="Checking your account..." />;
  }

  if (firebaseUser) {
    const role = getUserRole(profile);

    if (role === "seller") {
      return <Navigate to="/seller-dashboard" replace />;
    }

    if (role === "buyer") {
      return <Navigate to="/dashboard" replace />;
    }

    return <LoadingScreen text="Preparing your account..." />;
  }

  return children;
}

// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({ children, profileResolved }) {
  const { firebaseUser, profileLoading } = useAuth();

  if (profileLoading) {
    return <LoadingScreen text="Checking your account..." />;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!profileResolved) {
    return <LoadingScreen text="Loading your profile..." />;
  }

  return children;
}

// =========================================================
// CUSTOMER ROUTE
// =========================================================

function CustomerRoute({ children, profile, profileResolved }) {
  if (!profileResolved) {
    return <LoadingScreen text="Loading your profile..." />;
  }

  const role = getUserRole(profile);

  if (role === "seller") {
    return <Navigate to="/seller-dashboard" replace />;
  }

  if (role !== "buyer") {
    return <LoadingScreen text="Preparing your account..." />;
  }

  return children;
}

// =========================================================
// SELLER ROUTE
// =========================================================

function SellerRoute({ children, profile, profileResolved }) {
  if (!profileResolved) {
    return <LoadingScreen text="Loading your seller account..." />;
  }

  const role = getUserRole(profile);

  if (role !== "seller") {
    if (role === "buyer") {
      return <Navigate to="/dashboard" replace />;
    }

    return <LoadingScreen text="Preparing your account..." />;
  }

  return children;
}

// =========================================================
// MESSAGE TIME
//
// Used only as a fallback for older messages that do not yet
// have a permanent messageOrder.
// =========================================================

function getMessageTimeMs(message) {
  if (!message) {
    return 0;
  }

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

  if (!createdAt) {
    return 0;
  }

  if (typeof createdAt.toMillis === "function") {
    return createdAt.toMillis();
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

  if (typeof createdAt === "number") {
    return createdAt < 1e12 ? createdAt * 1000 : createdAt;
  }

  if (typeof createdAt === "string") {
    const time = Date.parse(createdAt);

    return Number.isFinite(time) ? time : 0;
  }

  return 0;
}

// =========================================================
// GET MESSAGE ORDER
//
// PERMANENT ORDER HAS PRIORITY.
//
// Older messages without messageOrder fall back to timestamp.
// =========================================================

function getMessageOrder(message) {
  if (
    typeof message?.messageOrder === "number" &&
    Number.isFinite(message.messageOrder)
  ) {
    return message.messageOrder;
  }

  return null;
}

// =========================================================
// SORT MESSAGES PERMANENTLY
//
// Priority:
//
// 1. messageOrder
// 2. createdAtMs / createdAt
// 3. original array position
//
// This means new messages are never reordered simply because
// the browser was refreshed or deployed again.
// =========================================================

function sortMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return [...messages]
    .map((message, index) => ({
      message,
      index,
    }))
    .sort((a, b) => {
      const aOrder = getMessageOrder(a.message);
      const bOrder = getMessageOrder(b.message);

      // Both messages have permanent order.
      if (aOrder !== null && bOrder !== null) {
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.index - b.index;
      }

      // A message with a permanent order comes before a legacy
      // message without one.
      if (aOrder !== null && bOrder === null) {
        return -1;
      }

      if (aOrder === null && bOrder !== null) {
        return 1;
      }

      // Legacy fallback.
      const aTime = getMessageTimeMs(a.message);
      const bTime = getMessageTimeMs(b.message);

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return a.index - b.index;
    })
    .map((row) => row.message);
}

// =========================================================
// GET LAST VISIBLE MESSAGE
// =========================================================

function getLastVisibleMessage(messages, currentUserId = null) {
  const visibleMessages = (Array.isArray(messages) ? messages : []).filter(
    (message) => {
      const deletedFor = Array.isArray(message?.deletedFor)
        ? message.deletedFor
        : [];

      if (currentUserId && deletedFor.includes(currentUserId)) {
        return false;
      }

      if (message?.deletedForEveryone === true) {
        return false;
      }

      return true;
    },
  );

  const sorted = sortMessages(visibleMessages);

  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

// =========================================================
// FORMAT FIRESTORE CONVERSATION
// =========================================================

async function formatConversation(conversationDoc, currentUserId) {
  const data = conversationDoc.data();

  const participantNames = data.participantNames || {};

  const participantImages = data.participantImages || {};

  const participants = Array.isArray(data.participants)
    ? data.participants
    : [];

  // =======================================================
  // FIND OTHER PARTICIPANT
  // =======================================================

  const otherParticipantId =
    participants.find((uid) => String(uid) !== String(currentUserId)) || null;

  // =======================================================
  // GET PUBLIC PROFILE
  // =======================================================

  let publicProfile = null;

  if (otherParticipantId) {
    publicProfile = await getPublicProfile(otherParticipantId);
  }

  // =======================================================
  // NAME
  // =======================================================

  const publicProfileName =
    publicProfile?.fullName || publicProfile?.displayName || "";

  const storedParticipantName = participantNames[otherParticipantId] || "";

  const otherName =
    publicProfileName || storedParticipantName || "CampusMart User";

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
    participantImages[otherParticipantId] ||
    data.profileImages?.[otherParticipantId] ||
    data.participantPhotos?.[otherParticipantId] ||
    null;

  const otherParticipantImage =
    publicProfileImage || storedParticipantImage || null;

  // =======================================================
  // REPAIR OLD CONVERSATION PROFILE
  // =======================================================

  if (
    otherParticipantId &&
    publicProfile &&
    (String(participantImages[otherParticipantId] || "") !==
      String(otherParticipantImage || "") ||
      String(participantNames[otherParticipantId] || "") !== String(otherName))
  ) {
    try {
      await setDoc(
        conversationDoc.ref,
        {
          participantNames: {
            ...participantNames,

            [otherParticipantId]: otherName,
          },

          participantImages: {
            ...participantImages,

            [otherParticipantId]: otherParticipantImage,
          },

          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );
    } catch (error) {
      console.error("Could not repair conversation profile:", error);
    }
  }

  // =======================================================
  // UNREAD COUNT
  // =======================================================

  const unreadCount = Number(data.unreadCounts?.[currentUserId] || 0);

  // =======================================================
  // ALL MESSAGES
  // =======================================================

  const conversationMessages = Array.isArray(data.messages)
    ? data.messages
    : [];

  // =======================================================
  // VISIBLE MESSAGES
  // =======================================================

  const visibleMessages = conversationMessages.filter((message) => {
    const deletedFor = Array.isArray(message.deletedFor)
      ? message.deletedFor
      : [];

    if (deletedFor.includes(currentUserId)) {
      return false;
    }

    if (message.deletedForEveryone === true) {
      return false;
    }

    return true;
  });

  // =======================================================
  // SORT USING PERMANENT MESSAGE ORDER
  // =======================================================

  const sortedVisibleMessages = sortMessages(visibleMessages);

  // =======================================================
  // LAST VISIBLE MESSAGE
  // =======================================================

  const lastVisibleMessage =
    sortedVisibleMessages.length > 0
      ? sortedVisibleMessages[sortedVisibleMessages.length - 1]
      : null;

  const lastMessage =
    lastVisibleMessage?.text ||
    (lastVisibleMessage?.imageUrl ? "📷 Photo" : "") ||
    "";

  const lastMessageAt =
    lastVisibleMessage?.createdAtMs ||
    lastVisibleMessage?.createdAt ||
    0;

  // =======================================================
  // DISPLAY TIME
  // =======================================================

  let displayTime = "";

  if (lastMessageAt) {
    try {
      let date;

      if (lastVisibleMessage?.createdAt?.toDate) {
        date = lastVisibleMessage.createdAt.toDate();
      } else if (typeof lastMessageAt === "number") {
        date = new Date(
          lastMessageAt < 1e12 ? lastMessageAt * 1000 : lastMessageAt,
        );
      } else {
        date = new Date(lastMessageAt);
      }

      if (!Number.isNaN(date.getTime())) {
        displayTime = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      displayTime = "";
    }
  }

  // =======================================================
  // RETURN
  // =======================================================

  return {
    id: conversationDoc.id,

    conversationId: conversationDoc.id,

    otherParticipantId,

    name: otherName,

    profileImage: otherParticipantImage,

    lastMessage,

    time: displayTime,

    unread: unreadCount,

    online: data.onlineStatus?.[otherParticipantId] === true,

    conversation: sortedVisibleMessages,

    allMessages: conversationMessages,

    productId: data.productId || null,

    productName: data.productName || "",

    buyerId: data.buyerId || null,

    sellerId: data.sellerId || null,
  };
}

// =========================================================
// SORT CONVERSATIONS
//
// Uses the LAST MESSAGE'S PERMANENT ORDER first and then
// timestamp as a fallback.
// =========================================================

function sortConversations(conversationList) {
  return [...conversationList].sort((a, b) => {
    const aMessages = sortMessages(a.conversation || []);

    const bMessages = sortMessages(b.conversation || []);

    const aLast =
      aMessages.length > 0 ? aMessages[aMessages.length - 1] : null;

    const bLast =
      bMessages.length > 0 ? bMessages[bMessages.length - 1] : null;

    const aOrder = getMessageOrder(aLast);
    const bOrder = getMessageOrder(bLast);

    // Permanent message order is used when available.
    if (aOrder !== null && bOrder !== null) {
      return bOrder - aOrder;
    }

    // Timestamp fallback.
    const aTime = getMessageTimeMs(aLast);
    const bTime = getMessageTimeMs(bLast);

    return bTime - aTime;
  });
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

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let startupTimer;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    startupTimer = window.setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 1000);

    return () => {
      window.clearTimeout(startupTimer);

      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // =======================================================
  // FIREBASE AUTH
  // =======================================================

  const { firebaseUser, profile: authProfile, profileLoading } = useAuth();

  // =======================================================
  // PROFILE
  // =======================================================

  const [profile, setProfile] = useState(emptyProfile);

  const [profileResolved, setProfileResolved] = useState(false);

  const profileRequestId = useRef(0);

  // =======================================================
  // LOAD CURRENT USER PROFILE
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const currentRequest = ++profileRequestId.current;

    const loadCurrentUserProfile = async () => {
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
        const userRef = doc(db, "users", firebaseUser.uid);

        const snapshot = await getDoc(userRef);

        if (cancelled || currentRequest !== profileRequestId.current) {
          return;
        }

        let resolvedProfile;

        if (snapshot.exists()) {
          const firestoreProfile = snapshot.data();

          resolvedProfile = {
            ...emptyProfile,
            ...firestoreProfile,

            uid: firebaseUser.uid,

            email: firestoreProfile.email || firebaseUser.email || "",

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
          const authRole = getUserRole(authProfile);

          if (authRole === "seller" || authRole === "buyer") {
            resolvedProfile = {
              ...emptyProfile,
              ...authProfile,

              uid: firebaseUser.uid,

              email: authProfile?.email || firebaseUser.email || "",

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

              email: firebaseUser.email || "",

              fullName: firebaseUser.displayName || "",

              displayName: firebaseUser.displayName || "",

              role: "",
            };
          }
        }

        if (cancelled) {
          return;
        }

        setProfile(resolvedProfile);

        await syncOwnPublicProfile(firebaseUser, resolvedProfile);

        if (cancelled || currentRequest !== profileRequestId.current) {
          return;
        }

        setProfileResolved(true);
      } catch (error) {
        console.error("Error loading current user profile:", error);

        if (!cancelled && currentRequest === profileRequestId.current) {
          const fallbackProfile = {
            ...emptyProfile,

            uid: firebaseUser.uid,

            email: firebaseUser.email || "",

            fullName: firebaseUser.displayName || "",

            displayName: firebaseUser.displayName || "",

            role: "",
          };

          setProfile(fallbackProfile);

          setProfileResolved(true);
        }
      }
    };

    loadCurrentUserProfile();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, authProfile]);

  // =======================================================
  // CUSTOMER DATA
  // =======================================================

  const [cart, setCart] = useState([]);

  const [wishlist, setWishlist] = useState([]);

  const [orders, setOrders] = useState([]);

  // =======================================================
  // CONVERSATIONS
  // =======================================================

  const [messages, setMessages] = useState([]);

  // =======================================================
  // CUSTOMER DATA SAVE REF
  // =======================================================

  const customerDataSaveTimer = useRef(null);

  const pendingCustomerData = useRef(null);

  // =======================================================
  // GET CURRENT USER CHAT IMAGE
  // =======================================================

  const getCurrentUserChatImage = () => {
    if (!firebaseUser) {
      return null;
    }

    return getProfileImage(profile, firebaseUser);
  };

  // =======================================================
  // CUSTOMER DATA DOCUMENT
  // =======================================================

  const getCustomerDataRef = () => {
    if (!firebaseUser) {
      return null;
    }

    return doc(db, "users", firebaseUser.uid, "customerData", "main");
  };

  // =======================================================
  // SAVE CUSTOMER DATA
  // =======================================================

  const writeCustomerData = async ({ nextCart, nextWishlist, nextOrders }) => {
    if (!firebaseUser) {
      return false;
    }

    const customerDataRef = getCustomerDataRef();

    if (!customerDataRef) {
      return false;
    }

    try {
      await setDoc(
        customerDataRef,
        {
          cart: Array.isArray(nextCart) ? nextCart : [],

          wishlist: Array.isArray(nextWishlist) ? nextWishlist : [],

          orders: Array.isArray(nextOrders) ? nextOrders : [],

          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      return true;
    } catch (error) {
      console.error("Error saving customer data:", error);

      return false;
    }
  };

  // =======================================================
  // QUEUE CUSTOMER DATA SAVE
  // =======================================================

  const queueCustomerDataSave = ({
    nextCart,
    nextWishlist,
    nextOrders,
    immediate = false,
  }) => {
    if (!firebaseUser) {
      return;
    }

    pendingCustomerData.current = {
      nextCart,
      nextWishlist,
      nextOrders,
    };

    if (customerDataSaveTimer.current) {
      window.clearTimeout(customerDataSaveTimer.current);

      customerDataSaveTimer.current = null;
    }

    if (immediate) {
      const dataToSave = pendingCustomerData.current;

      pendingCustomerData.current = null;

      writeCustomerData(dataToSave);

      return;
    }

    customerDataSaveTimer.current = window.setTimeout(() => {
      const dataToSave = pendingCustomerData.current;

      pendingCustomerData.current = null;

      customerDataSaveTimer.current = null;

      if (dataToSave) {
        writeCustomerData(dataToSave);
      }
    }, CUSTOMER_DATA_SAVE_DELAY);
  };

  // =======================================================
  // LOAD CUSTOMER DATA
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const loadCustomerData = async () => {
      if (!firebaseUser) {
        setCart([]);
        setWishlist([]);
        setOrders([]);
        return;
      }

      const customerDataRef = getCustomerDataRef();

      if (!customerDataRef) {
        return;
      }

      try {
        const snapshot = await getDoc(customerDataRef);

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
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          return;
        }

        const data = snapshot.data();

        setCart(Array.isArray(data.cart) ? data.cart : []);

        setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (error) {
        console.error("Error loading customer data:", error);

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
      if (customerDataSaveTimer.current) {
        window.clearTimeout(customerDataSaveTimer.current);

        customerDataSaveTimer.current = null;
      }

      pendingCustomerData.current = null;
    };
  }, []);

  // =======================================================
  // UPDATE PROFILE
  // =======================================================

  const updateProfile = async (updates) => {
    if (!firebaseUser) {
      return;
    }

    const newProfile = {
      ...profile,
      ...updates,
    };

    setProfile(newProfile);

    try {
      const userRef = doc(db, "users", firebaseUser.uid);

      await setDoc(
        userRef,
        {
          ...updates,

          uid: firebaseUser.uid,

          email: newProfile.email || firebaseUser.email || "",

          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      await syncOwnPublicProfile(firebaseUser, newProfile);

      console.log("Private and public profiles updated.");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // =======================================================
  // SYNC CURRENT USER PROFILE IMAGE TO CONVERSATIONS
  // =======================================================

  useEffect(() => {
    if (!firebaseUser || !profileResolved) {
      return;
    }

    const currentUserId = String(firebaseUser.uid);

    const currentUserImage = getCurrentUserChatImage();

    const currentUserName = getProfileName(profile, firebaseUser);

    let cancelled = false;

    const syncProfileImage = async () => {
      try {
        const conversationsRef = collection(db, "conversations");

        const conversationsQuery = query(
          conversationsRef,
          where("participants", "array-contains", currentUserId),
        );

        const snapshot = await getDocs(conversationsQuery);

        if (cancelled) {
          return;
        }

        if (snapshot.empty) {
          return;
        }

        const updates = [];

        snapshot.docs.forEach((conversationDoc) => {
          const data = conversationDoc.data();

          const existingImages = data.participantImages || {};

          const existingNames = data.participantNames || {};

          const existingImage = existingImages[currentUserId] || null;

          const existingName = existingNames[currentUserId] || "";

          if (
            String(existingImage || "") !== String(currentUserImage || "") ||
            String(existingName || "") !== String(currentUserName || "")
          ) {
            updates.push(
              setDoc(
                conversationDoc.ref,
                {
                  participantImages: {
                    ...existingImages,

                    [currentUserId]: currentUserImage,
                  },

                  participantNames: {
                    ...existingNames,

                    [currentUserId]: currentUserName,
                  },

                  updatedAt: serverTimestamp(),
                },
                {
                  merge: true,
                },
              ),
            );
          }
        });

        if (updates.length > 0) {
          await Promise.all(updates);

          console.log("Current user's chat profile synchronized.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error synchronizing chat profile:", error);
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

  const addToCart = (product, quantity = 1) => {
    if (!product || !firebaseUser) {
      return;
    }

    const existingProduct = cart.find((item) => item.id === product.id);

    let nextCart;

    if (existingProduct) {
      nextCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Number(item.quantity || 0) + Number(quantity || 0),
            }
          : item,
      );
    } else {
      nextCart = [
        ...cart,
        {
          ...product,
          quantity: Number(quantity) || 1,
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

  const increaseQuantity = (productId) => {
    const nextCart = cart.map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity: Number(item.quantity || 0) + 1,
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

  const decreaseQuantity = (productId) => {
    const nextCart = cart.map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity: Math.max(1, Number(item.quantity || 1) - 1),
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

  const removeFromCart = (productId) => {
    const nextCart = cart.filter((item) => item.id !== productId);

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

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  // =======================================================
  // TOGGLE WISHLIST
  // =======================================================

  const toggleWishlist = (productId) => {
    if (!firebaseUser) {
      return;
    }

    let nextWishlist;

    if (wishlist.includes(productId)) {
      nextWishlist = wishlist.filter((id) => id !== productId);
    } else {
      nextWishlist = [...wishlist, productId];
    }

    setWishlist(nextWishlist);

    queueCustomerDataSave({
      nextCart: cart,
      nextWishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // REMOVE FROM WISHLIST
  // =======================================================

  const removeFromWishlist = (productId) => {
    const nextWishlist = wishlist.filter((id) => id !== productId);

    setWishlist(nextWishlist);

    queueCustomerDataSave({
      nextCart: cart,
      nextWishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // COMMISSION
  // =======================================================

  const PLATFORM_COMMISSION_RATE = 0.05;

  const getItemLineTotal = (item) => {
    const price = Number(String(item?.price ?? 0).replace(/[₦,]/g, ""));

    const qty = Number(item?.quantity || 1);

    return (
      (Number.isFinite(price) ? price : 0) *
      (Number.isFinite(qty) ? qty : 1)
    );
  };

  const splitAmount = (total) => {
    const gross = Number(total) || 0;

    const platformFee = Math.round(gross * PLATFORM_COMMISSION_RATE);

    const sellerAmount = Math.max(0, gross - platformFee);

    return {
      gross,
      platformFee,
      sellerAmount,
    };
  };

  // =======================================================
  // PLACE ORDER
  // =======================================================

  const placeOrder = async (orderData) => {
    if (!orderData || !firebaseUser) {
      return null;
    }

    const items = Array.isArray(orderData.items) ? orderData.items : [];

    if (items.length === 0) {
      console.error("placeOrder: no items");

      return null;
    }

    const customer = orderData.customer || {};

    const paymentMethod = orderData.paymentMethod || "card";

    const checkoutType = orderData.type || "all";

    const paystackReference = orderData.paystackReference || null;

    const bySeller = {};

    for (const item of items) {
      const sellerId =
        item.sellerId ||
        item.sellerUid ||
        item.seller?.uid ||
        item.seller?.id ||
        "";

      if (!sellerId) {
        console.warn("placeOrder: item missing sellerId", item);

        continue;
      }

      if (!bySeller[sellerId]) {
        bySeller[sellerId] = [];
      }

      bySeller[sellerId].push(item);
    }

    const sellerIds = Object.keys(bySeller);

    if (sellerIds.length === 0) {
      console.error(
        "placeOrder: no sellerId on cart items. Products must include sellerId.",
      );

      return null;
    }

    const timestamp = Date.now();

    const createdOrders = [];

    try {
      for (const sellerId of sellerIds) {
        const sellerItems = bySeller[sellerId];

        const total = sellerItems.reduce(
          (sum, item) => sum + getItemLineTotal(item),
          0,
        );

        const { platformFee, sellerAmount } = splitAmount(total);

        const orderNumber = `CM-${String(timestamp).slice(-6)}${String(
          createdOrders.length + 1,
        ).padStart(2, "0")}`;

        const orderPayload = {
          buyerId: firebaseUser.uid,

          sellerId: String(sellerId),

          items: sellerItems,

          total,

          platformFee,

          sellerAmount,

          commissionRate: PLATFORM_COMMISSION_RATE,

          paymentMethod,

          paymentStatus: "paid",

          paystackReference,

          status: "pending",

          type: checkoutType,

          orderNumber,

          customerName: customer.fullName || "",

          fullName: customer.fullName || "",

          phone: customer.phone || "",

          campus: customer.campus || "",

          address: customer.address || "",

          note: customer.note || "",

          customer: {
            fullName: customer.fullName || "",
            phone: customer.phone || "",
            campus: customer.campus || "",
            address: customer.address || "",
            note: customer.note || "",
          },

          date: new Date().toLocaleDateString(),

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),
        };

        const orderRef = await addDoc(
          collection(db, "orders"),
          orderPayload,
        );

        // =================================================
        // CREDIT SELLER
        // =================================================

        const sellerRef = doc(db, "users", String(sellerId));

        try {
          await updateDoc(sellerRef, {
            availableBalance: increment(sellerAmount),

            totalEarnings: increment(sellerAmount),

            totalSalesGross: increment(total),

            totalPlatformFees: increment(platformFee),

            updatedAt: serverTimestamp(),
          });
        } catch (sellerErr) {
          console.warn("Seller balance update fallback:", sellerErr);

          await setDoc(
            sellerRef,
            {
              availableBalance: increment(sellerAmount),

              totalEarnings: increment(sellerAmount),

              totalSalesGross: increment(total),

              totalPlatformFees: increment(platformFee),

              updatedAt: serverTimestamp(),
            },
            {
              merge: true,
            },
          );
        }

        // =================================================
        // EARNINGS LEDGER
        // =================================================

        try {
          await addDoc(collection(db, "earnings"), {
            sellerId: String(sellerId),

            orderId: orderRef.id,

            type: "sale",

            title: `Order #${orderNumber}`,

            description: sellerItems
              .map((i) => i.name || i.productName || "Item")
              .join(", "),

            gross: total,

            platformFee,

            amount: sellerAmount,

            status: "Completed",

            createdAt: serverTimestamp(),
          });
        } catch (earnErr) {
          console.warn("Could not write earnings ledger:", earnErr);
        }

        // =================================================
        // INCREMENT PRODUCT SALES
        // =================================================

        for (const item of sellerItems) {
          const productId = item.id || item.productId;

          if (!productId) {
            continue;
          }

          const qty = Number(item.quantity) || 1;

          try {
            await updateDoc(doc(db, "products", String(productId)), {
              sales: increment(qty),

              updatedAt: serverTimestamp(),
            });
          } catch (salesErr) {
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

          type: checkoutType,

          fullName: customer.fullName || "",

          phone: customer.phone || "",

          campus: customer.campus || "",

          address: customer.address || "",

          note: customer.note || "",

          customer,

          date: new Date().toLocaleDateString(),

          createdAt: new Date().toISOString(),

          status: "pending",

          sellerId: String(sellerId),

          paymentStatus: "paid",
        });
      }

      const nextOrders = [...orders, ...createdOrders];

      const purchasedIds = items.map((item) => item.id);

      const nextCart = cart.filter(
        (item) => !purchasedIds.includes(item.id),
      );

      setOrders(nextOrders);

      setCart(nextCart);

      queueCustomerDataSave({
        nextCart,

        nextWishlist: wishlist,

        nextOrders,

        immediate: true,
      });

      return createdOrders.length === 1
        ? createdOrders[0]
        : createdOrders[0];
    } catch (error) {
      console.error("placeOrder error:", error);

      throw error;
    }
  };

  // =======================================================
  // CANCEL ORDER
  // =======================================================

  const cancelOrder = async (orderId) => {
    if (!orderId || !firebaseUser) {
      throw new Error("Cannot cancel order");
    }

    const orderRef = doc(db, "orders", String(orderId));

    const snap = await getDoc(orderRef);

    if (!snap.exists()) {
      const nextOrders = orders.map((o) =>
        String(o.id) === String(orderId)
          ? {
              ...o,
              status: "cancelled",
            }
          : o,
      );

      setOrders(nextOrders);

      queueCustomerDataSave({
        nextCart: cart,

        nextWishlist: wishlist,

        nextOrders,

        immediate: true,
      });

      return;
    }

    const data = snap.data();

    const status = String(data.status || "pending").toLowerCase();

    if (status === "delivered" || status === "cancelled") {
      throw new Error("This order can no longer be cancelled.");
    }

    if (String(data.buyerId) !== String(firebaseUser.uid)) {
      throw new Error("You can only cancel your own orders.");
    }

    const sellerAmount = Number(data.sellerAmount) || 0;

    const sellerId = data.sellerId;

    await updateDoc(orderRef, {
      status: "cancelled",

      cancelledAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    });

    if (sellerId && sellerAmount > 0) {
      try {
        await updateDoc(doc(db, "users", String(sellerId)), {
          availableBalance: increment(-sellerAmount),

          totalEarnings: increment(-sellerAmount),

          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Could not reverse seller balance:", e);
      }
    }

    const nextOrders = orders.map((o) =>
      String(o.id) === String(orderId)
        ? {
            ...o,
            status: "cancelled",
          }
        : o,
    );

    setOrders(nextOrders);

    queueCustomerDataSave({
      nextCart: cart,

      nextWishlist: wishlist,

      nextOrders,

      immediate: true,
    });
  };

  // =======================================================
  // REAL-TIME CONVERSATIONS
  // =======================================================

  const isMessagesPage =
    location.pathname === "/messages" ||
    location.pathname.startsWith("/messages/") ||
    location.pathname === "/seller/messages" ||
    location.pathname.startsWith("/seller/messages/");

  useEffect(() => {
    if (!firebaseUser) {
      setMessages([]);

      return undefined;
    }

    const conversationsRef = collection(db, "conversations");

    const conversationsQuery = query(
      conversationsRef,
      where("participants", "array-contains", firebaseUser.uid),
    );

    const processSnapshot = async (snapshot) => {
      try {
        const conversationList = await Promise.all(
          snapshot.docs.map((conversationDoc) =>
            formatConversation(
              conversationDoc,
              firebaseUser.uid,
            ),
          ),
        );

        setMessages(sortConversations(conversationList));
      } catch (error) {
        console.error("Error processing conversations:", error);

        setMessages([]);
      }
    };

    // =====================================================
    // MESSAGES PAGES
    // =====================================================

    if (isMessagesPage) {
      const unsubscribe = onSnapshot(
        conversationsQuery,

        (snapshot) => {
          processSnapshot(snapshot);
        },

        (error) => {
          console.error("Conversation listener error:", error);

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

    const loadConversationsOnce = async () => {
      try {
        const snapshot = await getDocs(conversationsQuery);

        if (cancelled) {
          return;
        }

        const conversationList = await Promise.all(
          snapshot.docs.map((conversationDoc) =>
            formatConversation(
              conversationDoc,
              firebaseUser.uid,
            ),
          ),
        );

        if (cancelled) {
          return;
        }

        setMessages(sortConversations(conversationList));
      } catch (error) {
        console.error("Error loading conversations:", error);

        if (!cancelled) {
          setMessages([]);
        }
      }
    };

    loadConversationsOnce();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, isMessagesPage]);

  // =======================================================
  // UNREAD MESSAGE COUNT
  // =======================================================

  const unreadMessages = messages.reduce(
    (total, message) => total + Number(message.unread || 0),
    0,
  );

  // =======================================================
  // MARK MESSAGE AS READ
  // =======================================================

  const markMessageAsRead = async (messageId) => {
    if (!firebaseUser || !messageId) {
      return false;
    }

    try {
      const conversationRef = doc(
        db,
        "conversations",
        String(messageId),
      );

      await updateDoc(conversationRef, {
        [`unreadCounts.${firebaseUser.uid}`]: 0,
      });

      return true;
    } catch (error) {
      console.error("Error marking conversation as read:", error);

      return false;
    }
  };

  // =======================================================
  // SEND MESSAGE
  //
  // =======================================================
  //
  // IMPORTANT:
  //
  // Every message receives a permanent sequential
  // messageOrder number inside the Firestore transaction.
  //
  // Example:
  //
  // Message A -> 1
  // Message B -> 2
  // Message C -> 3
  //
  // This order is stored inside Firestore itself.
  //
  // It does NOT depend on:
  //
  // - React state
  // - browser refresh
  // - deployment
  // - localStorage
  // - array sorting
  // - the current computer clock
  //
  // =======================================================

  const sendMessage = async (messageId, text) => {
    const cleanText = String(text || "").trim();

    if (!cleanText || !firebaseUser || !messageId) {
      return false;
    }

    try {
      const conversationRef = doc(
        db,
        "conversations",
        String(messageId),
      );

      let success = false;

      await runTransaction(db, async (transaction) => {
        const conversationSnapshot =
          await transaction.get(conversationRef);

        if (!conversationSnapshot.exists()) {
          throw new Error("Conversation not found.");
        }

        const data = conversationSnapshot.data();

        const participants = Array.isArray(data.participants)
          ? data.participants
          : [];

        if (!participants.includes(firebaseUser.uid)) {
          throw new Error(
            "You are not a participant in this conversation.",
          );
        }

        const receiverId = participants.find(
          (uid) => String(uid) !== String(firebaseUser.uid),
        );

        if (!receiverId) {
          throw new Error("Receiver ID is missing.");
        }

        const existingMessages = Array.isArray(data.messages)
          ? data.messages
          : [];

        // =================================================
        // PERMANENT MESSAGE ORDER
        // =================================================
        //
        // First, preserve the existing Firestore array order
        // for old messages that don't have messageOrder yet.
        //
        // This upgrades legacy messages safely.
        //
        // =================================================

        let highestMessageOrder = Number(
          data.messageSequence || 0,
        );

        if (
          !Number.isFinite(highestMessageOrder) ||
          highestMessageOrder < 0
        ) {
          highestMessageOrder = 0;
        }

        let legacyOrderChanged = false;

        const normalizedExistingMessages = existingMessages.map(
          (message, index) => {
            if (
              typeof message?.messageOrder === "number" &&
              Number.isFinite(message.messageOrder)
            ) {
              if (message.messageOrder > highestMessageOrder) {
                highestMessageOrder = message.messageOrder;
              }

              return message;
            }

            // =================================================
            // LEGACY MESSAGE
            //
            // Give it a permanent order based on its current
            // stored array position.
            // =================================================

            highestMessageOrder += 1;

            legacyOrderChanged = true;

            return {
              ...message,

              messageOrder: highestMessageOrder,
            };
          },
        );

        // =================================================
        // NEW MESSAGE GETS THE NEXT PERMANENT ORDER
        // =================================================

        const nextMessageOrder = highestMessageOrder + 1;

        const nowMs = Date.now();

        const newMessage = {
          id: `${firebaseUser.uid}_${nowMs}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          senderId: firebaseUser.uid,

          sender: "me",

          text: cleanText,

          // =================================================
          // PERMANENT ORDER
          // =================================================

          messageOrder: nextMessageOrder,

          // =================================================
          // TIMESTAMPS
          //
          // These are kept for display/fallback purposes.
          // They are NOT the primary ordering mechanism.
          // =================================================

          createdAt: Timestamp.now(),

          createdAtMs: nowMs,

          time: new Date(nowMs).toLocaleTimeString([], {
            hour: "2-digit",

            minute: "2-digit",
          }),

          deletedFor: [],
        };

        // =================================================
        // FINAL MESSAGE ARRAY
        // =================================================

        const updatedMessages = [
          ...normalizedExistingMessages,

          newMessage,
        ];

        const currentUnread = Number(
          data.unreadCounts?.[receiverId] || 0,
        );

        // =================================================
        // TRANSACTION UPDATE
        // =================================================

        transaction.update(conversationRef, {
          messages: updatedMessages,

          // Stores the highest permanent sequence number.
          messageSequence: nextMessageOrder,

          lastMessage: cleanText,

          lastMessageAt: nowMs,

          [`unreadCounts.${receiverId}`]: currentUnread + 1,

          [`unreadCounts.${firebaseUser.uid}`]: 0,

          updatedAt: serverTimestamp(),
        });

        success = true;
      });

      return success;
    } catch (error) {
      console.error("Error sending message:", error);

      return false;
    }
  };

  // =======================================================
  // DELETE MESSAGES
  // =======================================================

  const deleteMessages = async (
    conversationId,
    messageIds,
    deleteType,
  ) => {
    if (
      !firebaseUser ||
      !conversationId ||
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return false;
    }

    if (deleteType !== "me" && deleteType !== "everyone") {
      return false;
    }

    try {
      const conversationRef = doc(
        db,
        "conversations",
        String(conversationId),
      );

      const result = await runTransaction(
        db,
        async (transaction) => {
          const snapshot =
            await transaction.get(conversationRef);

          if (!snapshot.exists()) {
            throw new Error("Conversation not found.");
          }

          const data = snapshot.data();

          const participants = Array.isArray(data.participants)
            ? data.participants
            : [];

          if (!participants.includes(firebaseUser.uid)) {
            throw new Error(
              "You are not a participant in this conversation.",
            );
          }

          const existingMessages = Array.isArray(data.messages)
            ? data.messages
            : [];

          const selectedIds = new Set(
            messageIds.map((messageId) => String(messageId)),
          );

          // ================================================
          // DELETE FOR EVERYONE
          // ================================================

          if (deleteType === "everyone") {
            const updatedMessages = existingMessages.filter(
              (message) => {
                const messageId = String(message.id);

                if (!selectedIds.has(messageId)) {
                  return true;
                }

                const isMine =
                  String(message.senderId) ===
                  String(firebaseUser.uid);

                if (!isMine) {
                  return true;
                }

                return false;
              },
            );

            // =================================================
            // SORT BEFORE FINDING LAST MESSAGE
            // =================================================

            const lastMessage = getLastVisibleMessage(
              updatedMessages,
              firebaseUser.uid,
            );

            transaction.update(conversationRef, {
              messages: updatedMessages,

              lastMessage:
                lastMessage?.text ||
                (lastMessage?.imageUrl ? "📷 Photo" : ""),

              lastMessageAt:
                lastMessage?.createdAtMs ||
                lastMessage?.createdAt ||
                0,

              updatedAt: serverTimestamp(),
            });

            return true;
          }

          // ================================================
          // DELETE FOR ME
          // ================================================

          const updatedMessages = existingMessages.map(
            (message) => {
              const messageId = String(message.id);

              if (!selectedIds.has(messageId)) {
                return message;
              }

              const deletedFor = Array.isArray(
                message.deletedFor,
              )
                ? message.deletedFor
                : [];

              if (deletedFor.includes(firebaseUser.uid)) {
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

          // =================================================
          // SORT BEFORE FINDING LAST MESSAGE
          // =================================================

          const lastMessage = getLastVisibleMessage(
            updatedMessages,
            firebaseUser.uid,
          );

          transaction.update(conversationRef, {
            messages: updatedMessages,

            lastMessage:
              lastMessage?.text ||
              (lastMessage?.imageUrl ? "📷 Photo" : ""),

            lastMessageAt:
              lastMessage?.createdAtMs ||
              lastMessage?.createdAt ||
              0,

            updatedAt: serverTimestamp(),
          });

          return true;
        },
      );

      return result === true;
    } catch (error) {
      console.error("Error deleting messages:", error);

      return false;
    }
  };

  // =======================================================
  // OPEN SELLER CHAT
  // =======================================================

  const openSellerChat = async (product) => {
    // =====================================================
    // CHECK USER
    // =====================================================

    if (!firebaseUser) {
      console.error(
        "Cannot open seller chat: user is not logged in.",
      );

      return false;
    }

    // =====================================================
    // CHECK PRODUCT
    // =====================================================

    if (!product) {
      console.error(
        "Cannot open seller chat: product is missing.",
      );

      return false;
    }

    // =====================================================
    // SELLER UID
    // =====================================================

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

    // =====================================================
    // PREVENT SELF CHAT
    // =====================================================

    if (String(sellerId) === String(firebaseUser.uid)) {
      console.error(
        "Cannot open seller chat: buyer and seller are the same user.",
      );

      return false;
    }

    // =====================================================
    // STABLE CONVERSATION ID
    // =====================================================

    const participantIds = [
      String(firebaseUser.uid),
      String(sellerId),
    ].sort();

    const conversationId = participantIds.join("_");

    const conversationRef = doc(
      db,
      "conversations",
      conversationId,
    );

    try {
      // ===================================================
      // GET EXISTING CONVERSATION
      // ===================================================

      const existingSnapshot =
        await getDoc(conversationRef);

      // ===================================================
      // BUYER INFORMATION
      // ===================================================

      const buyerName = getProfileName(
        profile,
        firebaseUser,
      );

      const buyerImage = getProfileImage(
        profile,
        firebaseUser,
      );

      // ===================================================
      // GET SELLER PUBLIC PROFILE
      // ===================================================

      const sellerPublicProfile =
        await getPublicProfile(sellerId);

      // ===================================================
      // SELLER NAME
      // ===================================================

      const sellerName =
        sellerPublicProfile?.fullName ||
        sellerPublicProfile?.displayName ||
        product.sellerName ||
        product.seller?.name ||
        product.seller?.fullName ||
        "CampusMart Seller";

      // ===================================================
      // SELLER IMAGE
      // ===================================================

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

      // ===================================================
      // EXISTING CONVERSATION
      // ===================================================

      if (existingSnapshot.exists()) {
        console.log(
          "Existing seller conversation found:",
          conversationId,
        );

        const existingData =
          existingSnapshot.data();

        const existingParticipantImages =
          existingData.participantImages || {};

        const existingParticipantNames =
          existingData.participantNames || {};

        const updatedImages = {
          ...existingParticipantImages,

          [String(firebaseUser.uid)]: buyerImage,

          [String(sellerId)]: sellerImage,
        };

        const updatedNames = {
          ...existingParticipantNames,

          [String(firebaseUser.uid)]: buyerName,

          [String(sellerId)]: sellerName,
        };

        await setDoc(
          conversationRef,
          {
            participants: participantIds,

            buyerId: String(firebaseUser.uid),

            sellerId: String(sellerId),

            participantNames: updatedNames,

            participantImages: updatedImages,

            updatedAt: serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        navigate(`/messages/${conversationId}`);

        return true;
      }

      // ===================================================
      // CREATE NEW CONVERSATION
      // ===================================================

      await setDoc(
        conversationRef,
        {
          // -----------------------------------------------
          // PARTICIPANTS
          // -----------------------------------------------

          participants: participantIds,

          buyerId: String(firebaseUser.uid),

          sellerId: String(sellerId),

          // -----------------------------------------------
          // NAMES
          // -----------------------------------------------

          participantNames: {
            [String(firebaseUser.uid)]: buyerName,

            [String(sellerId)]: sellerName,
          },

          // -----------------------------------------------
          // PROFILE IMAGES
          // -----------------------------------------------

          participantImages: {
            [String(firebaseUser.uid)]: buyerImage,

            [String(sellerId)]: sellerImage,
          },

          // -----------------------------------------------
          // UNREAD COUNTS
          // -----------------------------------------------

          unreadCounts: {
            [String(firebaseUser.uid)]: 0,

            [String(sellerId)]: 0,
          },

          // -----------------------------------------------
          // ONLINE STATUS
          // -----------------------------------------------

          onlineStatus: {
            [String(firebaseUser.uid)]: true,

            [String(sellerId)]: false,
          },

          // -----------------------------------------------
          // LAST MESSAGE
          // -----------------------------------------------

          lastMessage: "",

          lastMessageAt: 0,

          // -----------------------------------------------
          // PERMANENT MESSAGE SEQUENCE
          // -----------------------------------------------

          messageSequence: 0,

          // -----------------------------------------------
          // MESSAGES
          // -----------------------------------------------

          messages: [],

          // -----------------------------------------------
          // PRODUCT
          // -----------------------------------------------

          productId: product.id || null,

          productName: product.name || "",

          // -----------------------------------------------
          // TIMESTAMPS
          // -----------------------------------------------

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      console.log(
        "Seller conversation created successfully:",
        conversationId,
      );

      navigate(`/messages/${conversationId}`);

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
    (firebaseUser && !profileResolved)
  ) {
    return (
      <>
        {!isOnline && <InternetRequired />}

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
      {!isOnline && <InternetRequired />}

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
              profileResolved={profileResolved}
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
              profileResolved={profileResolved}
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
              profileResolved={profileResolved}
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
          element={<PrivacyPolicy />}
        />

        {/* ================================================= */}
        {/* TERMS */}
        {/* ================================================= */}

        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditions />}
        />

        {/* ================================================= */}
        {/* CUSTOMER DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Dashboard
                  addToCart={addToCart}
                  cartCount={cartCount}
                  orders={orders}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  unreadMessages={unreadMessages}
                  messages={messages}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <BrowseProducts
                  addToCart={addToCart}
                  cartCount={cartCount}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <ProductDetails
                  addToCart={addToCart}
                  cartCount={cartCount}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  openSellerChat={openSellerChat}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Cart
                  cart={cart}
                  cartCount={cartCount}
                  increaseQuantity={increaseQuantity}
                  decreaseQuantity={decreaseQuantity}
                  removeFromCart={removeFromCart}
                  openSellerChat={openSellerChat}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Orders
                  orders={orders}
                  cartCount={cartCount}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <OrderDetails
                  orders={orders}
                  cartCount={cartCount}
                  profile={profile}
                  cancelOrder={cancelOrder}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Messages
                  cartCount={cartCount}
                  wishlist={wishlist}
                  messages={messages}
                  unreadMessages={unreadMessages}
                  markMessageAsRead={markMessageAsRead}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Chat
                  cartCount={cartCount}
                  wishlist={wishlist}
                  messages={messages}
                  unreadMessages={unreadMessages}
                  markMessageAsRead={markMessageAsRead}
                  sendMessage={sendMessage}
                  deleteMessages={deleteMessages}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Checkout
                  cart={cart}
                  cartCount={cartCount}
                  placeOrder={placeOrder}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <OrderSuccess
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Wishlist
                  wishlist={wishlist}
                  removeFromWishlist={removeFromWishlist}
                  addToCart={addToCart}
                  cartCount={cartCount}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Payment
                  cartCount={cartCount}
                  profile={profile}
                  placeOrder={placeOrder}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Profile
                  profile={profile}
                  updateProfile={updateProfile}
                  cartCount={cartCount}
                  wishlist={wishlist}
                  unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <CustomerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <Settings
                  profile={profile}
                  updateProfile={updateProfile}
                  cartCount={cartCount}
                  wishlist={wishlist}
                  unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <Logout
                cartCount={cartCount}
                wishlist={wishlist}
                unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerDashboard
                  profile={profile}
                  cartCount={cartCount}
                  wishlist={wishlist}
                  unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerProducts
                  profile={profile}
                  cartCount={cartCount}
                  unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerMessages
                  messages={messages}
                  unreadMessages={unreadMessages}
                  markMessageAsRead={markMessageAsRead}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerChat
                  messages={messages}
                  unreadMessages={unreadMessages}
                  markMessageAsRead={markMessageAsRead}
                  sendMessage={sendMessage}
                  deleteMessages={deleteMessages}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerEarnings
                  profile={profile}
                  unreadMessages={unreadMessages}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <WithdrawEarnings
                  unreadMessages={unreadMessages}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerPromotions
                  unreadMessages={unreadMessages}
                  profile={profile}
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
              profileResolved={profileResolved}
            >
              <SellerRoute
                profile={profile}
                profileResolved={profileResolved}
              >
                <SellerPayment
                  unreadMessages={unreadMessages}
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
            <SellerProfile
              profile={profile}
              updateProfile={updateProfile}
              unreadMessages={unreadMessages}
            />
          }
        />

        {/* ================================================= */}
        {/* SELLER SETTINGS */}
        {/* ================================================= */}

        <Route
          path="/seller/settings"
          element={
            <SellerSettings
              unreadMessages={unreadMessages}
              profile={profile}
            />
          }
        />

        {/* ================================================= */}
        {/* SELLER ORDERS */}
        {/* ================================================= */}

        <Route
          path="/seller/orders"
          element={
            <SellerOrders
              unreadMessages={unreadMessages}
              profile={profile}
            />
          }
        />

        {/* ================================================= */}
        {/* PAYMENT OTP */}
        {/* ================================================= */}

        <Route
          path="/payment/otp"
          element={
            <PaymentOtp
              cartCount={cartCount}
              placeOrder={placeOrder}
            />
          }
        />

        {/* ================================================= */}
        {/* FALLBACK */}
        {/* ================================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

export default App;