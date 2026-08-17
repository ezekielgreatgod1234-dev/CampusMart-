import { useEffect, useState } from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
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
// DATA
// =========================================================

import messagesData from "./data/messages";

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
// APP
// =========================================================

function App() {
  const navigate = useNavigate();

  // =======================================================
  // AUTH
  // =======================================================

  const {
    firebaseUser,
    profileLoading,
  } = useAuth();

  // =======================================================
  // PROFILE
  // =======================================================

  const [profile, setProfile] =
    useState(emptyProfile);

  const [profileFetching, setProfileFetching] =
    useState(false);

  // =======================================================
  // CUSTOMER DATA
  // =======================================================

  const [cart, setCart] =
    useState([]);

  const [wishlist, setWishlist] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  // =======================================================
  // IMPORTANT
  //
  // This stores the UID whose customer data is currently
  // loaded into React state.
  //
  // This prevents User A's old state from being saved into
  // User B's Firestore document during account switching.
  // =======================================================

  const [customerDataUid, setCustomerDataUid] =
    useState(null);

  // =======================================================
  // PROFILE LOADING
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    async function loadUserProfile() {
      // -----------------------------------------------
      // NO USER
      //
      // We do NOT call setState synchronously here.
      // This avoids the React cascading-render warning.
      // -----------------------------------------------

      if (!firebaseUser) {
        return;
      }

      setProfileFetching(true);

      try {
        const userRef = doc(
          db,
          "users",
          firebaseUser.uid
        );

        const userSnapshot =
          await getDoc(userRef);

        if (cancelled) {
          return;
        }

        // =================================================
        // PROFILE EXISTS
        // =================================================

        if (userSnapshot.exists()) {
          const userData =
            userSnapshot.data();

          setProfile({
            fullName:
              userData.fullName ??
              firebaseUser.displayName ??
              "",

            email:
              userData.email ??
              firebaseUser.email ??
              "",

            phone:
              userData.phone ??
              "",

            campus:
              userData.campus ??
              "",

            address:
              userData.address ??
              "",

            profileImage:
              userData.profileImage ??
              null,

            role:
              userData.role ??
              "",
          });

          return;
        }

        // =================================================
        // FIRST TIME USER
        // =================================================

        const newProfile = {
          fullName:
            firebaseUser.displayName ??
            "",

          email:
            firebaseUser.email ??
            "",

          phone: "",

          campus: "",

          address: "",

          profileImage: null,

          role: "",
        };

        setProfile(newProfile);

        await setDoc(
          userRef,
          {
            ...newProfile,

            uid:
              firebaseUser.uid,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (error) {
        console.error(
          "Error loading user profile:",
          error
        );

        if (!cancelled) {
          setProfile({
            fullName:
              firebaseUser.displayName ??
              "",

            email:
              firebaseUser.email ??
              "",

            phone: "",

            campus: "",

            address: "",

            profileImage: null,

            role: "",
          });
        }
      } finally {
        if (!cancelled) {
          setProfileFetching(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  // =======================================================
  // CUSTOMER DATA LISTENER
  //
  // FIRESTORE:
  //
  // users/{UID}/customerData/main
  //
  // The UID is ALWAYS taken from the currently authenticated
  // Firebase user.
  // =======================================================

  useEffect(() => {
    if (!firebaseUser) {
      // Do not call setState here.
      //
      // Protected routes disappear automatically because
      // ProtectedRoute sees that firebaseUser is null.
      //
      // Most importantly, we don't save old data anywhere.
      return undefined;
    }

    const currentUid =
      firebaseUser.uid;

    const customerDataRef = doc(
      db,
      "users",
      currentUid,
      "customerData",
      "main"
    );

    let cancelled = false;

    const unsubscribe =
      onSnapshot(
        customerDataRef,

        async (snapshot) => {
          if (cancelled) {
            return;
          }

          try {
            // =================================================
            // DOCUMENT EXISTS
            // =================================================

            if (snapshot.exists()) {
              const data =
                snapshot.data();

              setCart(
                Array.isArray(data.cart)
                  ? data.cart
                  : []
              );

              setWishlist(
                Array.isArray(
                  data.wishlist
                )
                  ? data.wishlist
                  : []
              );

              setOrders(
                Array.isArray(data.orders)
                  ? data.orders
                  : []
              );

              setMessages(
                Array.isArray(
                  data.messages
                )
                  ? data.messages
                  : messagesData
              );

              // Mark THIS UID as loaded.
              setCustomerDataUid(
                currentUid
              );

              return;
            }

            // =================================================
            // FIRST TIME USER
            // =================================================

            const initialCustomerData = {
              cart: [],

              wishlist: [],

              orders: [],

              messages: messagesData,
            };

            setCart(
              initialCustomerData.cart
            );

            setWishlist(
              initialCustomerData.wishlist
            );

            setOrders(
              initialCustomerData.orders
            );

            setMessages(
              initialCustomerData.messages
            );

            // Create the document for THIS user only.
            await setDoc(
              customerDataRef,
              {
                ...initialCustomerData,

                uid:
                  currentUid,

                createdAt:
                  serverTimestamp(),

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            if (!cancelled) {
              setCustomerDataUid(
                currentUid
              );
            }
          } catch (error) {
            console.error(
              "Error loading customer data:",
              error
            );

            if (!cancelled) {
              setCart([]);

              setWishlist([]);

              setOrders([]);

              setMessages(
                messagesData
              );

              // Even if the document cannot be created,
              // mark this UID as the one being displayed.
              setCustomerDataUid(
                currentUid
              );
            }
          }
        },

        (error) => {
          console.error(
            "Customer data listener error:",
            error
          );

          if (!cancelled) {
            setCart([]);

            setWishlist([]);

            setOrders([]);

            setMessages(
              messagesData
            );

            setCustomerDataUid(
              currentUid
            );
          }
        }
      );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [firebaseUser]);

  // =======================================================
  // SAVE CUSTOMER DATA
  //
  // VERY IMPORTANT:
  //
  // We only save if customerDataUid === firebaseUser.uid.
  //
  // Therefore:
  //
  // User A -> logs out
  // User B -> logs in
  //
  // User A's old React state cannot be written into
  // User B's Firestore document.
  // =======================================================

  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    // -----------------------------------------------
    // Do NOT save until the current user's document
    // has actually been loaded.
    // -----------------------------------------------

    if (
      customerDataUid !==
      firebaseUser.uid
    ) {
      return;
    }

    const currentUid =
      firebaseUser.uid;

    const customerDataRef = doc(
      db,
      "users",
      currentUid,
      "customerData",
      "main"
    );

    const saveData = async () => {
      try {
        await setDoc(
          customerDataRef,
          {
            cart,

            wishlist,

            orders,

            messages,

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (error) {
        console.error(
          "Error saving customer data:",
          error
        );
      }
    };

    saveData();
  }, [
    firebaseUser,
    customerDataUid,
    cart,
    wishlist,
    orders,
    messages,
  ]);

  // =======================================================
  // UPDATE PROFILE
  //
  // PROFILE LOCATION:
  //
  // users/{UID}
  // =======================================================

  const updateProfile = async (
    updates
  ) => {
    if (!firebaseUser) {
      return;
    }

    const currentUid =
      firebaseUser.uid;

    const newProfile = {
      ...profile,
      ...updates,
    };

    // Update UI immediately.
    setProfile(newProfile);

    try {
      const userRef = doc(
        db,
        "users",
        currentUid
      );

      await setDoc(
        userRef,
        {
          ...updates,

          uid:
            currentUid,

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

    setCart((currentCart) => {
      const existingProduct =
        currentCart.find(
          (item) =>
            item.id === product.id
        );

      if (existingProduct) {
        return currentCart.map(
          (item) =>
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
      }

      return [
        ...currentCart,

        {
          ...product,

          quantity:
            Number(quantity) || 1,
        },
      ];
    });
  };

  // =======================================================
  // INCREASE QUANTITY
  // =======================================================

  const increaseQuantity = (
    productId
  ) => {
    if (!firebaseUser) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map(
        (item) =>
          item.id === productId
            ? {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0
                  ) + 1,
              }
            : item
      )
    );
  };

  // =======================================================
  // DECREASE QUANTITY
  // =======================================================

  const decreaseQuantity = (
    productId
  ) => {
    if (!firebaseUser) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map(
        (item) =>
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
      )
    );
  };

  // =======================================================
  // REMOVE FROM CART
  // =======================================================

  const removeFromCart = (
    productId
  ) => {
    if (!firebaseUser) {
      return;
    }

    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== productId
      )
    );
  };

  // =======================================================
  // REMOVE PURCHASED ITEMS
  // =======================================================

  const removePurchasedItems = (
    purchasedItems
  ) => {
    if (
      !firebaseUser ||
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

    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !purchasedIds.includes(
            item.id
          )
      )
    );
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

    setWishlist(
      (currentWishlist) => {
        if (
          currentWishlist.includes(
            productId
          )
        ) {
          return currentWishlist.filter(
            (id) =>
              id !== productId
          );
        }

        return [
          ...currentWishlist,
          productId,
        ];
      }
    );
  };

  // =======================================================
  // REMOVE FROM WISHLIST
  // =======================================================

  const removeFromWishlist = (
    productId
  ) => {
    if (!firebaseUser) {
      return;
    }

    setWishlist(
      (currentWishlist) =>
        currentWishlist.filter(
          (id) =>
            id !== productId
        )
    );
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
        new Date()
          .toLocaleDateString(),

      createdAt:
        new Date()
          .toISOString(),

      status:
        "Placed",
    };

    setOrders(
      (currentOrders) => [
        ...currentOrders,
        newOrder,
      ]
    );

    removePurchasedItems(
      orderData.items || []
    );

    return newOrder;
  };

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

  const markMessageAsRead = (
    messageId
  ) => {
    if (!firebaseUser) {
      return;
    }

    setMessages(
      (currentMessages) =>
        currentMessages.map(
          (message) => {
            if (
              message.id !==
              Number(messageId)
            ) {
              return message;
            }

            return {
              ...message,

              unread: 0,
            };
          }
        )
    );
  };

  // =======================================================
  // SEND MESSAGE
  // =======================================================

  const sendMessage = (
    messageId,
    text
  ) => {
    if (!firebaseUser) {
      return;
    }

    const cleanText =
      String(text || "").trim();

    if (!cleanText) {
      return;
    }

    const newMessage = {
      id:
        Date.now(),

      sender:
        "me",

      text:
        cleanText,

      time:
        new Date()
          .toLocaleTimeString(
            [],
            {
              hour:
                "2-digit",

              minute:
                "2-digit",
            }
          ),
    };

    setMessages(
      (currentMessages) =>
        currentMessages.map(
          (message) => {
            if (
              message.id !==
              Number(messageId)
            ) {
              return message;
            }

            return {
              ...message,

              conversation: [
                ...(message.conversation ||
                  []),

                newMessage,
              ],

              lastMessage:
                cleanText,

              time:
                newMessage.time,

              unread:
                0,
            };
          }
        )
    );
  };

  // =======================================================
  // OPEN SELLER CHAT
  // =======================================================

  const openSellerChat = (
    product
  ) => {
    if (
      !product ||
      !firebaseUser
    ) {
      return;
    }

    const existingConversation =
      messages.find(
        (message) =>
          message.sellerId ===
          product.sellerId
      );

    if (existingConversation) {
      navigate(
        `/messages/${existingConversation.id}`
      );

      return;
    }

    const newConversationId =
      Date.now();

    const newConversation = {
      id:
        newConversationId,

      sellerId:
        product.sellerId,

      name:
        product.sellerName ||
        "CampusMart Seller",

      productId:
        product.id,

      productName:
        product.name,

      lastMessage:
        `You can ask the seller about ${product.name}.`,

      time:
        "Now",

      unread:
        0,

      online:
        true,

      conversation:
        [],
    };

    setMessages(
      (currentMessages) => [
        newConversation,
        ...currentMessages,
      ]
    );

    navigate(
      `/messages/${newConversationId}`
    );
  };

  // =======================================================
  // INITIAL LOADING
  //
  // Notice:
  //
  // customerDataUid !== firebaseUser.uid
  //
  // means we have NOT loaded the current user's Firestore
  // data yet.
  // =======================================================

  const customerDataLoading =
    Boolean(
      firebaseUser &&
      customerDataUid !==
        firebaseUser.uid
    );

  if (
    profileLoading ||
    profileFetching ||
    customerDataLoading
  ) {
    return (
      <LoadingScreen />
    );
  }

  // =======================================================
  // ROUTES
  // =======================================================

  return (
    <Routes>

      {/* =================================================
          LANDING
      ================================================= */}

      <Route
        path="/"
        element={
          <Landing />
        }
      />

      {/* =================================================
          LOGIN
      ================================================= */}

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      {/* =================================================
          REGISTER
      ================================================= */}

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* =================================================
          DASHBOARD
      ================================================= */}

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

      {/* =================================================
          BROWSE PRODUCTS
      ================================================= */}

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

      {/* =================================================
          PRODUCT DETAILS
      ================================================= */}

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

      {/* =================================================
          CART
      ================================================= */}

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

      {/* =================================================
          ORDERS
      ================================================= */}

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

      {/* =================================================
          ORDER DETAILS
      ================================================= */}

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

      {/* =================================================
          MESSAGES
      ================================================= */}

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

      {/* =================================================
          CHAT
      ================================================= */}

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

                profile={
                  profile
                }
              />
            </CustomerRoute>
          </ProtectedRoute>
        }
      />

      {/* =================================================
          CHECKOUT
      ================================================= */}

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

      {/* =================================================
          ORDER SUCCESS
      ================================================= */}

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

      {/* =================================================
          WISHLIST
      ================================================= */}

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

      {/* =================================================
          PAYMENT
      ================================================= */}

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

      {/* =================================================
          PROFILE
      ================================================= */}

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

      {/* =================================================
          SETTINGS
      ================================================= */}

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

      {/* =================================================
          LOGOUT
      ================================================= */}

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

      {/* =================================================
          SELLER DASHBOARD
      ================================================= */}

      <Route
        path="/seller-dashboard"
        element={
          <ProtectedRoute>
            <SellerRoute
              profile={
                profile
              }
            >
              <SellerDashboardComingSoon />
            </SellerRoute>
          </ProtectedRoute>
        }
      />

      {/* =================================================
          FALLBACK
      ================================================= */}

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