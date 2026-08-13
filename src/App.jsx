import { useState } from "react";
import { Routes, Route } from "react-router-dom";

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

import messagesData from "./data/messages";

function App() {
  // =====================================================
  // CART
  // =====================================================

  const [cart, setCart] = useState([]);

  // =====================================================
  // WISHLIST
  // =====================================================

  const [wishlist, setWishlist] = useState([]);

  // =====================================================
  // ORDERS
  // =====================================================

  const [orders, setOrders] = useState([]);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [messages, setMessages] = useState(messagesData);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (product, quantity = 1) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
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

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.max(1, item.quantity - 1),
            }
          : item
      )
    );
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  // =====================================================
  // REMOVE PURCHASED ITEMS
  // =====================================================

  const removePurchasedItems = (purchasedItems) => {
    const purchasedIds = purchasedItems.map((item) => item.id);

    setCart((currentCart) =>
      currentCart.filter(
        (item) => !purchasedIds.includes(item.id)
      )
    );
  };

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder = (orderData) => {
    const newOrder = {
      id: Date.now().toString().slice(-8),

      orderNumber: `CM-${Date.now().toString().slice(-8)}`,

      items: orderData.items,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      type: orderData.type,

      fullName: orderData.customer?.fullName || "",
      phone: orderData.customer?.phone || "",
      campus: orderData.customer?.campus || "",
      address: orderData.customer?.address || "",
      note: orderData.customer?.note || "",

      customer: orderData.customer,

      date: new Date().toLocaleDateString(),

      status: "Placed",
    };

    setOrders((currentOrders) => [
      ...currentOrders,
      newOrder,
    ]);

    removePurchasedItems(orderData.items);

    return newOrder;
  };

  // =====================================================
  // TOGGLE WISHLIST
  // =====================================================

  const toggleWishlist = (productId) => {
    setWishlist((currentWishlist) => {
      if (currentWishlist.includes(productId)) {
        return currentWishlist.filter(
          (id) => id !== productId
        );
      }

      return [
        ...currentWishlist,
        productId,
      ];
    });
  };

  // =====================================================
  // REMOVE FROM WISHLIST
  // =====================================================

  const removeFromWishlist = (productId) => {
    setWishlist((currentWishlist) =>
      currentWishlist.filter(
        (id) => id !== productId
      )
    );
  };

  // =====================================================
  // UNREAD MESSAGE COUNT
  // =====================================================

  const unreadMessages = messages.reduce(
    (total, message) =>
      total + (message.unread || 0),
    0
  );

  // =====================================================
  // MARK MESSAGE AS READ
  // =====================================================

  const markMessageAsRead = (messageId) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.id !== Number(messageId)) {
          return message;
        }

        // Already read — don't create another state update
        if (!message.unread) {
          return message;
        }

        return {
          ...message,
          unread: 0,
        };
      })
    );
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = (messageId, text) => {
    const cleanText = text.trim();

    if (!cleanText) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: cleanText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.id !== Number(messageId)) {
          return message;
        }

        return {
          ...message,

          // Add message to conversation
          conversation: [
            ...(message.conversation || []),
            newMessage,
          ],

          // Update preview on Messages page
          lastMessage: cleanText,

          // Update conversation time
          time: newMessage.time,

          // Since YOU sent the message, it isn't unread
          unread: 0,
        };
      })
    );
  };

  // =====================================================
  // ROUTES
  // =====================================================

  return (
    <Routes>

      {/* ================================================= */}
      {/* DASHBOARD */}
      {/* ================================================= */}

      <Route
        path="/"
        element={
          <Dashboard
            addToCart={addToCart}
            cartCount={cartCount}
            orders={orders}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            unreadMessages={unreadMessages}
            messages={messages}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <Dashboard
            addToCart={addToCart}
            cartCount={cartCount}
            orders={orders}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            unreadMessages={unreadMessages}
            messages={messages}
          />
        }
      />

      {/* ================================================= */}
      {/* BROWSE PRODUCTS */}
      {/* ================================================= */}

      <Route
        path="/browse-products"
        element={
          <BrowseProducts
            addToCart={addToCart}
            cartCount={cartCount}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        }
      />

      {/* ================================================= */}
      {/* PRODUCT DETAILS */}
      {/* ================================================= */}

      <Route
        path="/products/:id"
        element={
          <ProductDetails
            addToCart={addToCart}
            cartCount={cartCount}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        }
      />

      {/* ================================================= */}
      {/* CART */}
      {/* ================================================= */}

      <Route
        path="/cart"
        element={
          <Cart
            cart={cart}
            cartCount={cartCount}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
          />
        }
      />

      {/* ================================================= */}
      {/* ORDERS */}
      {/* ================================================= */}

      <Route
        path="/orders"
        element={
          <Orders
            orders={orders}
            cartCount={cartCount}
          />
        }
      />

      {/* ================================================= */}
      {/* MESSAGES */}
      {/* ================================================= */}

      <Route
        path="/messages"
        element={
          <Messages
            cartCount={cartCount}
            wishlist={wishlist}
            messages={messages}
            unreadMessages={unreadMessages}
            markMessageAsRead={markMessageAsRead}
          />
        }
      />

      {/* ================================================= */}
      {/* CHAT */}
      {/* ================================================= */}

      <Route
        path="/messages/:id"
        element={
          <Chat
            cartCount={cartCount}
            wishlist={wishlist}
            messages={messages}
            unreadMessages={unreadMessages}
            markMessageAsRead={markMessageAsRead}
            sendMessage={sendMessage}
          />
        }
      />

      {/* ================================================= */}
      {/* CHECKOUT */}
      {/* ================================================= */}

      <Route
        path="/checkout"
        element={
          <Checkout
            cart={cart}
            cartCount={cartCount}
            placeOrder={placeOrder}
          />
        }
      />

      {/* ================================================= */}
      {/* ORDER SUCCESS */}
      {/* ================================================= */}

      <Route
        path="/order-success"
        element={<OrderSuccess />}
      />

      {/* ================================================= */}
      {/* WISHLIST */}
      {/* ================================================= */}

      <Route
        path="/wishlist"
        element={
          <Wishlist
            wishlist={wishlist}
            removeFromWishlist={removeFromWishlist}
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* ================================================= */}
      {/* ORDER DETAILS */}
      {/* ================================================= */}

      <Route
        path="/orders/:id"
        element={
          <OrderDetails
            orders={orders}
            cartCount={cartCount}
          />
        }
      />

      {/* ================================================= */}
      {/* PAYMENT */}
      {/* ================================================= */}

      <Route
        path="/payment"
        element={
          <Payment
            cartCount={cartCount}
          />
        }
      />

    </Routes>
  );
}

export default App;