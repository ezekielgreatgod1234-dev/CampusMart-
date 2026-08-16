import { useEffect, useState } from "react";

import {
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import { doc, getDoc } from "firebase/firestore";
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
// GUEST ROUTE
// =========================================================

function GuestRoute({ children }) {
  const { firebaseUser, profileLoading } = useAuth();

  if (profileLoading) {
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
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  if (firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({ children }) {
  const { firebaseUser, profileLoading } = useAuth();

  // Firebase authentication is still loading
  if (profileLoading) {
    return (
      <LoadingScreen text="Checking your account..." />
    );
  }

  // User is not authenticated
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// =========================================================
// ROLE REDIRECT
// =========================================================

function AuthenticatedRedirect({ profile }) {
  const role = String(profile?.role || "")
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

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
}

// =========================================================
// CUSTOMER ROUTE
// =========================================================

function CustomerRoute({
  children,
  profile,
}) {
  const role = String(profile?.role || "")
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
  const role = String(profile?.role || "")
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
  // FIREBASE AUTH
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
  // LOAD FIRESTORE USER PROFILE
  // =======================================================

  useEffect(() => {
    const loadUserProfile = async () => {
      // No authenticated user
      if (!firebaseUser) {
        setProfile(emptyProfile);
        setProfileFetching(false);
        return;
      }

      try {
        setProfileFetching(true);

        const userRef = doc(
          db,
          "users",
          firebaseUser.uid
        );

        const userSnapshot =
          await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData =
            userSnapshot.data();

          setProfile({
            fullName:
              userData.fullName ||
              firebaseUser.displayName ||
              "",

            email:
              userData.email ||
              firebaseUser.email ||
              "",

            phone:
              userData.phone ||
              "",

            campus:
              userData.campus ||
              "",

            address:
              userData.address ||
              "",

            profileImage:
              userData.profileImage ||
              null,

            role:
              userData.role ||
              "",
          });
        } else {
          // Firebase account exists but
          // Firestore profile does not exist yet
          setProfile({
            fullName:
              firebaseUser.displayName ||
              "",

            email:
              firebaseUser.email ||
              "",

            phone: "",
            campus: "",
            address: "",
            profileImage: null,
            role: "",
          });
        }
      } catch (error) {
        console.error(
          "Error loading user profile:",
          error
        );

        // Keep Firebase account information
        // even if Firestore fails
        setProfile({
          fullName:
            firebaseUser.displayName ||
            "",

          email:
            firebaseUser.email ||
            "",

          phone: "",
          campus: "",
          address: "",
          profileImage: null,
          role: "",
        });
      } finally {
        setProfileFetching(false);
      }
    };

    loadUserProfile();
  }, [firebaseUser]);

  // =======================================================
  // UPDATE PROFILE
  // =======================================================

  const updateProfile = (updates) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      ...updates,
    }));
  };

  // =======================================================
  // CART
  // =======================================================

  const [cart, setCart] = useState([]);

  // =======================================================
  // ADD TO CART
  // =======================================================

  const addToCart = (
    product,
    quantity = 1
  ) => {
    if (!product) {
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
                    item.quantity +
                    quantity,
                }
              : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity,
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
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
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
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                item.quantity - 1
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
    if (!Array.isArray(purchasedItems)) {
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

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  // =======================================================
  // WISHLIST
  // =======================================================

  const [wishlist, setWishlist] =
    useState([]);

  // =======================================================
  // TOGGLE WISHLIST
  // =======================================================

  const toggleWishlist = (
    productId
  ) => {
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
    setWishlist(
      (currentWishlist) =>
        currentWishlist.filter(
          (id) =>
            id !== productId
        )
    );
  };

  // =======================================================
  // ORDERS
  // =======================================================

  const [orders, setOrders] =
    useState([]);

  // =======================================================
  // PLACE ORDER
  // =======================================================

  const placeOrder = (
    orderData
  ) => {
    if (!orderData) {
      return null;
    }

    const timestamp =
      Date.now();

    const newOrder = {
      id: timestamp
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
        orderData.type || "",

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
  // MESSAGES
  // =======================================================

  const [messages, setMessages] =
    useState(messagesData);

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
    const cleanText =
      String(text || "").trim();

    if (!cleanText) {
      return;
    }

    const newMessage = {
      id: Date.now(),

      sender: "me",

      text: cleanText,

      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
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

              unread: 0,
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
    if (!product) {
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
      id: newConversationId,

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

      time: "Now",

      unread: 0,

      online: true,

      conversation: [],
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
  // INITIAL FIREBASE LOADING
  // =======================================================

  if (
    profileLoading ||
    profileFetching
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
        element={<Landing />}
      />

      {/* =================================================
          LOGIN
      ================================================= */}

      <Route
        path="/login"
        element={
          firebaseUser ? (
            <AuthenticatedRedirect
              profile={profile}
            />
          ) : (
            <Login />
          )
        }
      />

      {/* =================================================
          REGISTER
      ================================================= */}

      <Route
        path="/register"
        element={
          firebaseUser ? (
            <AuthenticatedRedirect
              profile={profile}
            />
          ) : (
            <Register />
          )
        }
      />

      {/* =================================================
          CUSTOMER DASHBOARD
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerRoute
              profile={profile}
            >
              <Dashboard
                addToCart={addToCart}
                cartCount={cartCount}
                orders={orders}
                wishlist={wishlist}
                toggleWishlist={
                  toggleWishlist
                }
                unreadMessages={
                  unreadMessages
                }
                messages={messages}
                profile={profile}
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
                addToCart={addToCart}
                cartCount={cartCount}
                wishlist={wishlist}
                toggleWishlist={
                  toggleWishlist
                }
                profile={profile}
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
                addToCart={addToCart}
                cartCount={cartCount}
                wishlist={wishlist}
                toggleWishlist={
                  toggleWishlist
                }
                openSellerChat={
                  openSellerChat
                }
                profile={profile}
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
                cart={cart}
                cartCount={cartCount}
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
                profile={profile}
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
                orders={orders}
                cartCount={cartCount}
                profile={profile}
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
                orders={orders}
                cartCount={cartCount}
                profile={profile}
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
                cartCount={cartCount}
                wishlist={wishlist}
                messages={messages}
                unreadMessages={
                  unreadMessages
                }
                markMessageAsRead={
                  markMessageAsRead
                }
                profile={profile}
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
                cartCount={cartCount}
                wishlist={wishlist}
                messages={messages}
                unreadMessages={
                  unreadMessages
                }
                markMessageAsRead={
                  markMessageAsRead
                }
                sendMessage={
                  sendMessage
                }
                profile={profile}
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
                cart={cart}
                cartCount={cartCount}
                placeOrder={placeOrder}
                profile={profile}
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
                profile={profile}
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
                wishlist={wishlist}
                removeFromWishlist={
                  removeFromWishlist
                }
                addToCart={addToCart}
                cartCount={cartCount}
                profile={profile}
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
                cartCount={cartCount}
                profile={profile}
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
                profile={profile}
                updateProfile={
                  updateProfile
                }
                cartCount={cartCount}
                wishlist={wishlist}
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
                profile={profile}
                updateProfile={
                  updateProfile
                }
                cartCount={cartCount}
                wishlist={wishlist}
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
              cartCount={cartCount}
              wishlist={wishlist}
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
              profile={profile}
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
<Route
  path="/login"
  element={
    <GuestRoute>
      <Login />
    </GuestRoute>
  }
/>




<Route
  path="/register"
  element={
    <GuestRoute>
      <Register />
    </GuestRoute>
  }
/>
    </Routes>
  );
}

export default App;