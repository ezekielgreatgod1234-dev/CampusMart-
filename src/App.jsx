import { useEffect, useState } from "react";

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
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  updateDoc,
  runTransaction,
} from "firebase/firestore";

import { db } from "./context/firebase";

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

// =========================================================
// OTHER PAGES
// =========================================================

import Logout from "./context/Logout";
import Login from "./context/Login";
import Register from "./context/Register";
import Landing from "./pages/customer/Landing";

// =========================================================
// DEFAULT PROFILE
// =========================================================

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  campus: "",
  address: "",
  profileImage: null,
  role: "",
};

// =========================================================
// LOADING SCREEN
// =========================================================

function LoadingScreen({
  text = "Loading CampusMart...",
}) {
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
// GUEST ROUTE
// =========================================================

function GuestRoute({ children }) {
  const {
    firebaseUser,
    profileLoading,
  } = useAuth();

  if (profileLoading) {
    return (
      <LoadingScreen
        text="Checking your account..."
      />
    );
  }

  if (firebaseUser) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({ children }) {
  const {
    firebaseUser,
    profileLoading,
  } = useAuth();

  if (profileLoading) {
    return (
      <LoadingScreen
        text="Checking your account..."
      />
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

  return children;
}

// =========================================================
// CUSTOMER ROUTE
// =========================================================

function CustomerRoute({
  children,
  profile,
}) {
  const role = String(
    profile?.role || ""
  )
    .trim()
    .toLowerCase();

  if (role === "seller") {
    return (
      <Navigate
        to="/seller-dashboard"
        replace
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
}) {
  const role = String(
    profile?.role || ""
  )
    .trim()
    .toLowerCase();

  if (role !== "seller") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

// =========================================================
// SELLER DASHBOARD
// =========================================================

function SellerDashboardComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <div
          className="
            mx-auto
            w-16
            h-16
            rounded-2xl
            bg-green-50
            text-green-600
            flex
            items-center
            justify-center
            text-2xl
            font-bold
          "
        >
          CM
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Seller Dashboard
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The seller dashboard is currently being built.
          Your seller account has been created successfully.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            mt-7
            w-full
            py-3
            rounded-xl
            bg-green-600
            text-white
            font-semibold
            hover:bg-green-700
            transition
          "
        >
          Back to CampusMart
        </button>
      </div>
    </div>
  );
}

// =========================================================
// CONVERT FIRESTORE CONVERSATION INTO APP DATA
// =========================================================

function formatConversation(
  conversationDoc,
  currentUserId
) {
  const data =
    conversationDoc.data();

  const participantNames =
    data.participantNames || {};

  const participantImages =
    data.participantImages || {};

  const participants =
    Array.isArray(data.participants)
      ? data.participants
      : [];

  const otherParticipantId =
    participants.find(
      (uid) =>
        String(uid) !==
        String(currentUserId)
    ) || null;

  const otherName =
    participantNames[
      otherParticipantId
    ] ||
    "CampusMart User";

  const unreadCount =
    Number(
      data.unreadCounts?.[
        currentUserId
      ] || 0
    );

  const conversationMessages =
    Array.isArray(data.messages)
      ? data.messages
      : [];

  const visibleMessages =
    conversationMessages.filter(
      (message) => {
        const deletedFor =
          Array.isArray(
            message.deletedFor
          )
            ? message.deletedFor
            : [];

        if (
          deletedFor.includes(
            currentUserId
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

  const sortedVisibleMessages = [
    ...visibleMessages,
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

  const lastVisibleMessage =
    sortedVisibleMessages.length > 0
      ? sortedVisibleMessages[
          sortedVisibleMessages.length - 1
        ]
      : null;

  const lastMessage =
    lastVisibleMessage?.text ||
    (lastVisibleMessage?.imageUrl
      ? "📷 Photo"
      : "") ||
    "";

  const lastMessageAt =
    lastVisibleMessage?.createdAt ||
    0;

  let displayTime = "";

  if (lastMessageAt) {
    try {
      const date =
        lastMessageAt?.toDate
          ? lastMessageAt.toDate()
          : new Date(lastMessageAt);

      displayTime =
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    } catch {
      displayTime = "";
    }
  }

  return {
    id:
      conversationDoc.id,

    conversationId:
      conversationDoc.id,

    otherParticipantId,

    name:
      otherName,

    profileImage:
      participantImages[
        otherParticipantId
      ] || null,

    lastMessage,

    time:
      displayTime,

    unread:
      unreadCount,

    online:
      data.onlineStatus?.[
        otherParticipantId
      ] === true,

    conversation:
      sortedVisibleMessages,

    allMessages:
      conversationMessages,
  };
}

// =========================================================
// SORT CONVERSATIONS
// =========================================================

function sortConversations(
  conversationList
) {
  return [...conversationList].sort(
    (a, b) => {
      const aMessages =
        a.conversation || [];

      const bMessages =
        b.conversation || [];

      const aLast =
        aMessages[
          aMessages.length - 1
        ]?.createdAt || 0;

      const bLast =
        bMessages[
          bMessages.length - 1
        ]?.createdAt || 0;

      const aTime =
        aLast?.toMillis
          ? aLast.toMillis()
          : Number(aLast) || 0;

      const bTime =
        bLast?.toMillis
          ? bLast.toMillis()
          : Number(bLast) || 0;

      return bTime - aTime;
    }
  );
}

// =========================================================
// APP
// =========================================================

function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
  //
  // IMPORTANT:
  // AuthContext already loads the Firestore profile.
  //
  // We therefore DO NOT call getDoc(users/uid) again here.
  // =======================================================

  const [profile, setProfile] =
    useState(emptyProfile);

  const [profileFetching, setProfileFetching] =
    useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(emptyProfile);
      setProfileFetching(false);
      return;
    }

    setProfile(
      authProfile || {
        ...emptyProfile,
        fullName:
          firebaseUser.displayName || "",
        email:
          firebaseUser.email || "",
        role: "buyer",
      }
    );

    setProfileFetching(false);
  }, [
    firebaseUser,
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
  // LOAD CUSTOMER DATA
  //
  // ONE READ WHEN THE USER LOGS IN.
  //
  // No permanent onSnapshot listener here.
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
          doc(
            db,
            "users",
            firebaseUser.uid,
            "customerData",
            "main"
          );

        try {
          const snapshot =
            await getDoc(
              customerDataRef
            );

          if (cancelled) {
            return;
          }

          if (!snapshot.exists()) {
            setCart([]);
            setWishlist([]);
            setOrders([]);

            /*
              Only create the document once.
            */

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
              }
            );

            return;
          }

          const data =
            snapshot.data();

          setCart(
            Array.isArray(data.cart)
              ? data.cart
              : []
          );

          setWishlist(
            Array.isArray(data.wishlist)
              ? data.wishlist
              : []
          );

          setOrders(
            Array.isArray(data.orders)
              ? data.orders
              : []
          );
        } catch (error) {
          console.error(
            "Error loading customer data:",
            error
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
  }, [firebaseUser]);

  // =======================================================
  // SAVE CUSTOMER DATA
  //
  // Called ONLY after an actual user action.
  // =======================================================

  const saveCustomerData =
    async ({
      nextCart,
      nextWishlist,
      nextOrders,
    }) => {
      if (!firebaseUser) {
        return false;
      }

      const customerDataRef =
        doc(
          db,
          "users",
          firebaseUser.uid,
          "customerData",
          "main"
        );

      try {
        await setDoc(
          customerDataRef,
          {
            cart:
              Array.isArray(nextCart)
                ? nextCart
                : [],

            wishlist:
              Array.isArray(
                nextWishlist
              )
                ? nextWishlist
                : [],

            orders:
              Array.isArray(nextOrders)
                ? nextOrders
                : [],

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        return true;
      } catch (error) {
        console.error(
          "Error saving customer data:",
          error
        );

        return false;
      }
    };

  // =======================================================
  // UPDATE PROFILE
  //
  // One write only when the user saves profile changes.
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
        const userRef =
          doc(
            db,
            "users",
            firebaseUser.uid
          );

        await setDoc(
          userRef,
          {
            ...updates,

            uid:
              firebaseUser.uid,

            email:
              newProfile.email ||
              firebaseUser.email ||
              "",

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (error) {
        console.error(
          "Error updating profile:",
          error
        );
      }
    };

  // =======================================================
  // ADD TO CART
  // =======================================================

  const addToCart = (
    product,
    quantity = 1
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
          item.id === product.id
      );

    let nextCart;

    if (existingProduct) {
      nextCart =
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  Number(
                    item.quantity || 0
                  ) +
                  Number(
                    quantity || 0
                  ),
              }
            : item
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

    saveCustomerData({
      nextCart,
      nextWishlist: wishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // INCREASE QUANTITY
  // =======================================================

  const increaseQuantity = (
    productId
  ) => {
    const nextCart =
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                Number(
                  item.quantity || 0
                ) + 1,
            }
          : item
      );

    setCart(nextCart);

    saveCustomerData({
      nextCart,
      nextWishlist: wishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // DECREASE QUANTITY
  // =======================================================

  const decreaseQuantity = (
    productId
  ) => {
    const nextCart =
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                Math.max(
                  1,
                  Number(
                    item.quantity || 1
                  ) - 1
                ),
            }
          : item
      );

    setCart(nextCart);

    saveCustomerData({
      nextCart,
      nextWishlist: wishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // REMOVE FROM CART
  // =======================================================

  const removeFromCart = (
    productId
  ) => {
    const nextCart =
      cart.filter(
        (item) =>
          item.id !== productId
      );

    setCart(nextCart);

    saveCustomerData({
      nextCart,
      nextWishlist: wishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // REMOVE PURCHASED ITEMS
  // =======================================================

  const removePurchasedItems = (
    purchasedItems
  ) => {
    if (
      !Array.isArray(
        purchasedItems
      )
    ) {
      return;
    }

    const purchasedIds =
      purchasedItems.map(
        (item) => item.id
      );

    const nextCart =
      cart.filter(
        (item) =>
          !purchasedIds.includes(
            item.id
          )
      );

    setCart(nextCart);

    saveCustomerData({
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
          item.quantity || 0
        ),
      0
    );

  // =======================================================
  // TOGGLE WISHLIST
  // =======================================================

  const toggleWishlist = (
    productId
  ) => {
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
            id !== productId
        );
    } else {
      nextWishlist = [
        ...wishlist,
        productId,
      ];
    }

    setWishlist(nextWishlist);

    saveCustomerData({
      nextCart: cart,
      nextWishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // REMOVE FROM WISHLIST
  // =======================================================

  const removeFromWishlist = (
    productId
  ) => {
    const nextWishlist =
      wishlist.filter(
        (id) =>
          id !== productId
      );

    setWishlist(nextWishlist);

    saveCustomerData({
      nextCart: cart,
      nextWishlist,
      nextOrders: orders,
    });
  };

  // =======================================================
  // PLACE ORDER
  // =======================================================

  const placeOrder = (
    orderData
  ) => {
    if (
      !orderData ||
      !firebaseUser
    ) {
      return null;
    }

    const timestamp =
      Date.now();

    const newOrder = {
      id:
        timestamp
          .toString()
          .slice(-8),

      orderNumber:
        `CM-${timestamp
          .toString()
          .slice(-8)}`,

      items:
        orderData.items || [],

      total:
        orderData.total || 0,

      paymentMethod:
        orderData.paymentMethod ||
        "",

      type:
        orderData.type ||
        "",

      fullName:
        orderData.customer
          ?.fullName || "",

      phone:
        orderData.customer
          ?.phone || "",

      campus:
        orderData.customer
          ?.campus || "",

      address:
        orderData.customer
          ?.address || "",

      note:
        orderData.customer
          ?.note || "",

      customer:
        orderData.customer || {},

      date:
        new Date().toLocaleDateString(),

      createdAt:
        new Date().toISOString(),

      status:
        "Placed",
    };

    const nextOrders = [
      ...orders,
      newOrder,
    ];

    const purchasedIds =
      Array.isArray(
        orderData.items
      )
        ? orderData.items.map(
            (item) => item.id
          )
        : [];

    const nextCart =
      cart.filter(
        (item) =>
          !purchasedIds.includes(
            item.id
          )
      );

    setOrders(nextOrders);
    setCart(nextCart);

    saveCustomerData({
      nextCart,
      nextWishlist: wishlist,
      nextOrders,
    });

    return newOrder;
  };

  // =======================================================
  // REAL-TIME CONVERSATIONS
  //
  // IMPORTANT:
  //
  // We ONLY keep onSnapshot active on:
  //
  // /messages
  // /messages/:id
  //
  // This prevents the entire conversations collection
  // from constantly producing reads on every other page.
  // =======================================================

  const isMessagesPage =
    location.pathname ===
      "/messages" ||
    location.pathname.startsWith(
      "/messages/"
    );

  useEffect(() => {
    if (!firebaseUser) {
      setMessages([]);
      return undefined;
    }

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

    // =====================================================
    // REAL-TIME ONLY ON MESSAGE PAGES
    // =====================================================

    if (isMessagesPage) {
      const unsubscribe =
        onSnapshot(
          conversationsQuery,

          (snapshot) => {
            try {
              const conversationList =
                snapshot.docs.map(
                  (conversationDoc) =>
                    formatConversation(
                      conversationDoc,
                      firebaseUser.uid
                    )
                );

              setMessages(
                sortConversations(
                  conversationList
                )
              );
            } catch (error) {
              console.error(
                "Error processing conversations:",
                error
              );

              setMessages([]);
            }
          },

          (error) => {
            console.error(
              "Conversation listener error:",
              error
            );

            setMessages([]);
          }
        );

      return () => {
        unsubscribe();
      };
    }

    // =====================================================
    // OUTSIDE MESSAGE PAGES
    //
    // Load conversations once.
    //
    // This gives dashboard/unread counts some data without
    // maintaining a real-time listener everywhere.
    // =====================================================

    let cancelled = false;

    const loadConversationsOnce =
      async () => {
        try {
          const snapshot =
            await getDocs(
              conversationsQuery
            );

          if (cancelled) {
            return;
          }

          const conversationList =
            snapshot.docs.map(
              (conversationDoc) =>
                formatConversation(
                  conversationDoc,
                  firebaseUser.uid
                )
            );

          setMessages(
            sortConversations(
              conversationList
            )
          );
        } catch (error) {
          console.error(
            "Error loading conversations:",
            error
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
    firebaseUser,
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
          message.unread || 0
        ),
      0
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
        return;
      }

      try {
        const conversationRef =
          doc(
            db,
            "conversations",
            String(messageId)
          );

        await updateDoc(
          conversationRef,
          {
            [`unreadCounts.${firebaseUser.uid}`]: 0,
          }
        );
      } catch (error) {
        console.error(
          "Error marking conversation as read:",
          error
        );
      }
    };

  // =======================================================
  // SEND MESSAGE
  // =======================================================

  const sendMessage =
    async (
      messageId,
      text
    ) => {
      const cleanText =
        String(text || "").trim();

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
            String(messageId)
          );

        let success = false;

        await runTransaction(
          db,
          async (transaction) => {
            const conversationSnapshot =
              await transaction.get(
                conversationRef
              );

            if (
              !conversationSnapshot.exists()
            ) {
              throw new Error(
                "Conversation not found."
              );
            }

            const data =
              conversationSnapshot.data();

            const participants =
              Array.isArray(
                data.participants
              )
                ? data.participants
                : [];

            if (
              !participants.includes(
                firebaseUser.uid
              )
            ) {
              throw new Error(
                "You are not a participant in this conversation."
              );
            }

            const receiverId =
              participants.find(
                (uid) =>
                  String(uid) !==
                  String(
                    firebaseUser.uid
                  )
              );

            if (!receiverId) {
              throw new Error(
                "Receiver ID is missing."
              );
            }

            const existingMessages =
              Array.isArray(
                data.messages
              )
                ? data.messages
                : [];

            const newMessage = {
              id:
                `${firebaseUser.uid}_${Date.now()}_${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,

              senderId:
                firebaseUser.uid,

              sender:
                "me",

              text:
                cleanText,

              createdAt:
                Date.now(),

              deletedFor: [],
            };

            const currentUnread =
              Number(
                data.unreadCounts?.[
                  receiverId
                ] || 0
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
                  Date.now(),

                [`unreadCounts.${receiverId}`]:
                  currentUnread + 1,

                [`unreadCounts.${firebaseUser.uid}`]:
                  0,

                updatedAt:
                  serverTimestamp(),
              }
            );

            success = true;
          }
        );

        return success;
      } catch (error) {
        console.error(
          "Error sending message:",
          error
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
      deleteType
    ) => {
      if (
        !firebaseUser ||
        !conversationId ||
        !Array.isArray(messageIds) ||
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
            String(conversationId)
          );

        const result =
          await runTransaction(
            db,
            async (transaction) => {
              const snapshot =
                await transaction.get(
                  conversationRef
                );

              if (
                !snapshot.exists()
              ) {
                throw new Error(
                  "Conversation not found."
                );
              }

              const data =
                snapshot.data();

              const participants =
                Array.isArray(
                  data.participants
                )
                  ? data.participants
                  : [];

              if (
                !participants.includes(
                  firebaseUser.uid
                )
              ) {
                throw new Error(
                  "You are not a participant in this conversation."
                );
              }

              const existingMessages =
                Array.isArray(
                  data.messages
                )
                  ? data.messages
                  : [];

              const selectedIds =
                new Set(
                  messageIds.map(
                    (messageId) =>
                      String(
                        messageId
                      )
                  )
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
                          message.id
                        );

                      if (
                        !selectedIds.has(
                          messageId
                        )
                      ) {
                        return true;
                      }

                      const isMine =
                        String(
                          message.senderId
                        ) ===
                        String(
                          firebaseUser.uid
                        );

                      if (!isMine) {
                        return true;
                      }

                      return false;
                    }
                  );

                const visibleMessages =
                  updatedMessages.filter(
                    (message) => {
                      const deletedFor =
                        Array.isArray(
                          message.deletedFor
                        )
                          ? message.deletedFor
                          : [];

                      return (
                        !deletedFor.includes(
                          firebaseUser.uid
                        ) &&
                        message.deletedForEveryone !==
                          true
                      );
                    }
                  );

                const lastMessage =
                  visibleMessages.length >
                  0
                    ? visibleMessages[
                        visibleMessages.length -
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
                      "",

                    lastMessageAt:
                      lastMessage?.createdAt ||
                      0,

                    updatedAt:
                      serverTimestamp(),
                  }
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
                        message.id
                      );

                    if (
                      !selectedIds.has(
                        messageId
                      )
                    ) {
                      return message;
                    }

                    const deletedFor =
                      Array.isArray(
                        message.deletedFor
                      )
                        ? message.deletedFor
                        : [];

                    if (
                      deletedFor.includes(
                        firebaseUser.uid
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
                  }
                );

              const visibleForCurrentUser =
                updatedMessages.filter(
                  (message) => {
                    const deletedFor =
                      Array.isArray(
                        message.deletedFor
                      )
                        ? message.deletedFor
                        : [];

                    if (
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

              const lastMessage =
                visibleForCurrentUser.length >
                0
                  ? visibleForCurrentUser[
                      visibleForCurrentUser.length -
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
                    "",

                  lastMessageAt:
                    lastMessage?.createdAt ||
                    0,

                  updatedAt:
                    serverTimestamp(),
                }
              );

              return true;
            }
          );

        return result === true;
      } catch (error) {
        console.error(
          "Error deleting messages:",
          error
        );

        return false;
      }
    };

  // =======================================================
  // OPEN SELLER CHAT
  // =======================================================

  const openSellerChat =
    async (product) => {
      if (
        !product ||
        !firebaseUser
      ) {
        return;
      }

      const sellerId =
        product.sellerId;

      if (!sellerId) {
        console.error(
          "This product does not have a sellerId."
        );

        return;
      }

      if (
        String(sellerId) ===
        String(firebaseUser.uid)
      ) {
        return;
      }

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
          conversationId
        );

      try {
        // ===================================================
        // CHECK WHETHER CHAT ALREADY EXISTS
        //
        // One read instead of blindly writing.
        // ===================================================

        const existingSnapshot =
          await getDoc(
            conversationRef
          );

        if (
          existingSnapshot.exists()
        ) {
          navigate(
            `/messages/${conversationId}`
          );

          return;
        }

        // ===================================================
        // CREATE NEW CONVERSATION
        //
        // Only one write.
        // ===================================================

        await setDoc(
          conversationRef,
          {
            participants:
              participantIds,

            participantNames: {
              [firebaseUser.uid]:
                profile.fullName ||
                firebaseUser.displayName ||
                "CampusMart User",

              [sellerId]:
                product.sellerName ||
                "CampusMart Seller",
            },

            participantImages: {
              [firebaseUser.uid]:
                profile.profileImage ||
                null,

              [sellerId]:
                product.sellerImage ||
                null,
            },

            unreadCounts: {
              [firebaseUser.uid]:
                0,

              [sellerId]:
                0,
            },

            onlineStatus: {
              [firebaseUser.uid]:
                true,

              [sellerId]:
                false,
            },

            lastMessage:
              "",

            lastMessageAt:
              0,

            messages: [],

            productId:
              product.id || null,

            productName:
              product.name || "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        navigate(
          `/messages/${conversationId}`
        );
      } catch (error) {
        console.error(
          "Error opening seller chat:",
          error
        );
      }
    };

  // =======================================================
  // ONLY AUTH INITIALIZATION BLOCKS THE APP
  // =======================================================

  if (profileLoading) {
    return (
      <LoadingScreen
        text="Checking your account..."
      />
    );
  }

  // =======================================================
  // ROUTES
  // =======================================================

  return (
    <Routes>

      {/* ================================================= */}
      {/* LANDING */}
      {/* ================================================= */}

      <Route
        path="/"
        element={
          <Landing />
        }
      />

      {/* ================================================= */}
      {/* LOGIN */}
      {/* ================================================= */}

      <Route
        path="/login"
        element={
          <GuestRoute>
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
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* ================================================= */}
      {/* DASHBOARD */}
      {/* ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Dashboard
                addToCart={
                  addToCart
                }
                cartCount={
                  cartCount
                }
                orders={
                  orders
                }
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Cart
                cart={
                  cart
                }
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Orders
                orders={
                  orders
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
      {/* ORDER DETAILS */}
      {/* ================================================= */}

      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <OrderDetails
                orders={
                  orders
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
      {/* MESSAGES */}
      {/* ================================================= */}

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
      {/* CHAT */}
      {/* ================================================= */}

      <Route
        path="/messages/:id"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Checkout
                cart={
                  cart
                }
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Payment
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
      {/* PROFILE */}
      {/* ================================================= */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
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
          <ProtectedRoute>
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
          <ProtectedRoute>
            <SellerRoute
              profile={profile}
            >
              <SellerDashboardComingSoon />
            </SellerRoute>
          </ProtectedRoute>
        }
      />

      {/* ================================================= */}
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
  );
}

export default App;