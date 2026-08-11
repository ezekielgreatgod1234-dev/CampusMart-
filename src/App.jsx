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

function App() {
  const [cart, setCart] = useState([]);

  // ================= ORDERS =================

  const [orders, setOrders] = useState([]);

  // ================= ADD TO CART =================

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

  // ================= INCREASE =================

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

  // ================= DECREASE =================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Math.max(1, item.quantity - 1),
              }
            : item
        )
    );
  };

  // ================= REMOVE ONE PRODUCT =================

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  // ================= REMOVE CHECKED OUT ITEMS =================

  const removePurchasedItems = (purchasedItems) => {
    const purchasedIds = purchasedItems.map((item) => item.id);

    setCart((currentCart) =>
      currentCart.filter(
        (item) => !purchasedIds.includes(item.id)
      )
    );
  };

  // ================= CART COUNT =================

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ================= PLACE ORDER =================

  const placeOrder = (orderData) => {
    const newOrder = {
      id: Date.now().toString().slice(-8),
      ...orderData,
      date: new Date().toLocaleDateString(),
      status: "Placed",
    };

    setOrders((currentOrders) => [
      ...currentOrders,
      newOrder,
    ]);

    // Remove ONLY the products that were checked out
    removePurchasedItems(orderData.items);

    return newOrder;
  };

  return (
    <Routes>

      {/* ================= DASHBOARD ================= */}

      <Route
        path="/"
        element={
          <Dashboard
            addToCart={addToCart}
            cartCount={cartCount}
            orders={orders}
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
          />
        }
      />

      {/* ================= BROWSE ================= */}

      <Route
        path="/browse-products"
        element={
          <BrowseProducts
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* ================= PRODUCT DETAILS ================= */}

      <Route
        path="/products/:id"
        element={
          <ProductDetails
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* ================= CART ================= */}

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

      {/* ================= MESSAGES ================= */}

      <Route
        path="/messages"
        element={
          <Messages
            cartCount={cartCount}
          />
        }
      />

      <Route
        path="/messages/:id"
        element={
          <Chat
            cartCount={cartCount}
          />
        }
      />

      {/* ================= CHECKOUT ================= */}

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

      {/* ================= ORDER SUCCESS ================= */}

      <Route
        path="/order-success"
        element={
          <OrderSuccess />
        }
      />

    </Routes>
  );
}

export default App;