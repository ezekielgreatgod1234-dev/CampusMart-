import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/customer/Dashboard";
import BrowseProducts from "./pages/customer/BrowseProducts";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";

function App() {
  const [cart, setCart] = useState([]);

  // ================= ADD TO CART =================
  const addToCart = (product, quantity = 1) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      // Product already exists
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

      // New product
      return [
        ...currentCart,
        {
          ...product,
          quantity,
        },
      ];
    });
  };

  // ================= CART COUNT =================
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Routes>

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <Dashboard
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* Browse Products */}
      <Route
        path="/browse-products"
        element={
          <BrowseProducts
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* Product Details */}
      <Route
        path="/products/:id"
        element={
          <ProductDetails
            addToCart={addToCart}
            cartCount={cartCount}
          />
        }
      />

      {/* Cart */}
      <Route
        path="/cart"
        element={
          <Cart
            cart={cart}
            setCart={setCart}
            cartCount={cartCount}
          />
        }
      />


      <Route
  path="/dashboard"
  element={
    <Dashboard
      cartCount={cartCount}
      addToCart={addToCart}
    />
  }
/>

    </Routes>
  );
}

export default App;