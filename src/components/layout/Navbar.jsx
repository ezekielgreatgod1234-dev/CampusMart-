import {
  FiMenu,
  FiSearch,
  FiBell,
  FiMessageCircle,
  FiUser,
  FiShoppingCart,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

function Navbar({ setSidebarOpen, cartCount = 0 }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-green-800 text-white shadow-sm">

      <div className="h-20 px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-4 flex-1">

          {/* Mobile Menu */}
          <button
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


          {/* Search */}
          <div className="relative flex-1 max-w-md">

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
              "
            />

          </div>

        </div>


        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Cart */}
          <button
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

            {/* Cart Badge */}
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
                {cartCount}
              </span>
            )}
          </button>


          {/* Notifications */}
          <button
            className="
              w-11
              h-11
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-green-700
              transition
            "
          >
            <FiBell className="text-xl" />
          </button>


          {/* Messages */}
          <button
            className="
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
          >
            <FiMessageCircle className="text-xl" />
          </button>


          {/* User */}
          <div
            className="
              flex
              items-center
              gap-3
              bg-green-700
              px-3
              py-2
              rounded-full
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

            <div className="hidden md:block">

              <h3 className="font-semibold text-sm">
                GreatGod
              </h3>

              <p className="text-xs text-green-200">
                Customer
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;