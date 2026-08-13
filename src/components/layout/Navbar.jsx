import { useState } from "react";

import {
  FiMenu,
  FiSearch,
  FiMessageCircle,
  FiUser,
  FiShoppingCart,
  FiHeart,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";



function Navbar({
  setSidebarOpen,
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  // ================= SEARCH STATE =================
  const [search, setSearch] = useState("");

  // ================= UNREAD MESSAGES =================
 

  // ================= WISHLIST COUNT =================
  const wishlistCount = wishlist.length;

  // ================= SEARCH FUNCTION =================
  const handleSearch = (e) => {
    e.preventDefault();

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      navigate("/browse-products");
      return;
    }

    navigate(
      `/browse-products?search=${encodeURIComponent(trimmedSearch)}`
    );
  };

  return (
    <header className="bg-green-800 text-white">

      <div className="h-20 px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-4 flex-1">

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="
              lg:hidden
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              hover:bg-green-700
              transition
            "
          >
            <FiMenu className="text-2xl" />
          </button>


          {/* ================= SEARCH ================= */}
          <form
            onSubmit={handleSearch}
            className="relative flex-1 max-w-md"
          >

            <FiSearch
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-green-200
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="
                w-full
                bg-green-700
                text-white
                placeholder-green-200
                rounded-full
                py-2.5
                pl-11
                pr-4
                outline-none
                border
                border-green-600
                focus:ring-2
                focus:ring-green-400
                transition
              "
            />

          </form>

        </div>


        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-2 sm:gap-4">


          {/* ================= CART ================= */}
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="
              relative
              w-11
              h-11
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-green-700
              transition
            "
            title="Cart"
          >

            <FiShoppingCart className="text-xl" />

            {/* CART BADGE */}
            {cartCount > 0 && (
              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  min-w-5
                  h-5
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                "
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}

          </button>


          {/* ================= WISHLIST ================= */}
          <button
            type="button"
            onClick={() => navigate("/wishlist")}
            className="
              relative
              w-11
              h-11
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-green-700
              transition
            "
            title="Wishlist"
          >

            <FiHeart className="text-xl" />

            {/* WISHLIST BADGE */}
            {wishlistCount > 0 && (
              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  min-w-5
                  h-5
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-green-800
                "
              >
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}

          </button>


          {/* ================= MESSAGES ================= */}
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="
              relative
              hidden
              sm:flex
              w-11
              h-11
              rounded-full
              items-center
              justify-center
              hover:bg-green-700
              transition
            "
            title="Messages"
          >

            <FiMessageCircle className="text-xl" />

            {/* UNREAD MESSAGE BADGE */}
            {unreadMessages > 0 && (
              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  min-w-5
                  h-5
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-green-800
                "
              >
                {unreadMessages > 99
                  ? "99+"
                  : unreadMessages}
              </span>
            )}

          </button>


          {/* ================= USER ================= */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="
              flex
              items-center
              gap-3
              bg-green-700
              px-3
              py-2
              rounded-full
              hover:bg-green-600
              transition
            "
          >

            <div
              className="
                w-9
                h-9
                rounded-full
                bg-white
                text-green-700
                flex
                items-center
                justify-center
              "
            >
              <FiUser />
            </div>

            <div className="hidden md:block text-left">

              <h3 className="font-semibold text-sm">
                GreatGod
              </h3>

              <p className="text-xs text-green-200">
                Customer
              </p>

            </div>

          </button>

        </div>

      </div>

    </header>
  );
}

export default Navbar;