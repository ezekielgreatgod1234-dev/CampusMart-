import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiBriefcase,
  FiShoppingBag,
  FiCalendar,
  FiMessageCircle,
  FiDollarSign,
  FiStar,
  FiBarChart2,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiChevronRight,
  FiMoreVertical,
  FiCheckCircle,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

function SellerMessages({
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
  profile = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // =====================================================
  // SELLER INFORMATION
  // =====================================================

  const sellerFullName =
    profile?.fullName ||
    firebaseUser?.displayName ||
    "Seller";

  const sellerFirstName =
    sellerFullName.trim().split(/\s+/)[0] ||
    "Seller";

  const sellerImage =
    profile?.profileImage ||
    firebaseUser?.photoURL ||
    null;

  // =====================================================
  // SIDEBAR MENU
  // =====================================================

  const menuItems = [
    {
      label: "Dashboard",
      icon: FiGrid,
      path: "/seller-dashboard",
    },
    {
      label: "Products",
      icon: FiPackage,
      path: "/seller/products",
    },
    {
      label: "Services",
      icon: FiBriefcase,
      path: "/seller/services",
    },
    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/seller/orders",
    },
    {
      label: "Bookings",
      icon: FiCalendar,
      path: "/seller/bookings",
    },
    {
      label: "Messages",
      icon: FiMessageCircle,
      path: "/seller/messages",
      badge: unreadMessages,
    },
    {
      label: "Earnings",
      icon: FiDollarSign,
      path: "/seller/earnings",
    },
    {
      label: "Reviews",
      icon: FiStar,
      path: "/seller/reviews",
    },
    {
      label: "Analytics",
      icon: FiBarChart2,
      path: "/seller/analytics",
    },
    {
      label: "Promotions",
      icon: FiTag,
      path: "/seller/promotions",
      new: true,
    },
    {
      label: "Profile",
      icon: FiUser,
      path: "/seller/profile",
    },
    {
      label: "Settings",
      icon: FiSettings,
      path: "/seller/settings",
    },
  ];

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }

    return location.pathname.startsWith(path);
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredMessages = messages.filter((message) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return true;
    }

    return (
      String(message.name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(message.lastMessage || "")
        .toLowerCase()
        .includes(searchText) ||
      String(message.productName || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // =====================================================
  // ONLINE USERS
  // =====================================================

  const onlineUsers = messages.filter(
    (message) => message.online
  ).length;

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = (messageId) => {
    if (!messageId) {
      return;
    }

    // Navigate immediately. A Firestore read-status update must
    // never prevent the seller from opening the conversation.
    navigate(`/seller/messages/${messageId}`);

    if (markMessageAsRead) {
      Promise.resolve(markMessageAsRead(messageId)).catch((error) => {
        console.error("Error marking seller conversation as read:", error);
      });
    }
  };

  // =====================================================
  // FORMAT EMPTY MESSAGE
  // =====================================================

  const getInitial = (name) => {
    return (
      String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase() || "U"
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 flex overflow-hidden">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            z-40
            lg:hidden
          "
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-[230px]
          bg-green-700
          text-white
          flex
          flex-col
          shadow-2xl
          lg:shadow-none
          transition-transform
          duration-300
          ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="h-[86px] px-5 flex items-center justify-between shrink-0">

          <button
            type="button"
            onClick={() =>
              handleNavigation("/seller-dashboard")
            }
            className="flex items-center gap-3"
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-white
                text-green-700
                flex
                items-center
                justify-center
                font-extrabold
                shadow-sm
              "
            >
              CM
            </div>

            <div className="text-left">

              <p className="text-lg font-extrabold leading-none">
                CampusMart
              </p>

              <p className="text-[10px] text-green-100 mt-1">
                Buy. Sell. Connect.
              </p>

            </div>

          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-green-100"
          >
            <FiX size={22} />
          </button>

        </div>

        {/* =================================================
            SIDEBAR MENU
        ================================================= */}

        <div className="flex-1 overflow-y-auto px-3 pb-5">

          <nav className="space-y-1">

            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    handleNavigation(item.path)
                  }
                  className={`
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    transition
                    ${
                      active
                        ? "bg-white text-green-700 shadow-sm"
                        : "text-white hover:bg-green-600"
                    }
                  `}
                >

                  <Icon size={18} />

                  <span className="flex-1 text-left">
                    {item.label}
                  </span>

                  {item.new && (
                    <span
                      className="
                        px-1.5
                        py-0.5
                        rounded-md
                        bg-yellow-400
                        text-green-900
                        text-[8px]
                        font-bold
                      "
                    >
                      NEW
                    </span>
                  )}

                  {item.badge > 0 && (
                    <span
                      className="
                        min-w-5
                        h-5
                        px-1
                        rounded-full
                        bg-red-500
                        text-white
                        text-[10px]
                        font-bold
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {item.badge > 99
                        ? "99+"
                        : item.badge}
                    </span>
                  )}

                </button>
              );
            })}

          </nav>

        </div>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="px-3 pb-4 shrink-0">

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-3
              rounded-xl
              text-sm
              font-medium
              text-white
              hover:bg-green-600
              transition
            "
          >
            <FiLogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="flex-1 min-w-0 lg:ml-[230px] flex flex-col h-screen">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            h-[86px]
            bg-green-800
            text-white
            flex
            items-center
            px-4
            sm:px-6
            gap-4
            shrink-0
          "
        >

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <FiMenu size={23} />
          </button>

          {/* SEARCH */}

          <div className="relative flex-1 max-w-[500px]">

            <FiSearch
              size={17}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search messages..."
              className="
                w-full
                h-10
                bg-white
                text-gray-800
                rounded-full
                pl-11
                pr-4
                text-sm
                outline-none
                placeholder:text-gray-400
              "
            />

          </div>

          {/* RIGHT SIDE */}

          <div className="ml-auto flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                navigate("/seller/messages")
              }
              className="
                relative
                w-9
                h-9
                rounded-full
                hover:bg-green-700
                flex
                items-center
                justify-center
              "
            >
              <FiMessageCircle size={19} />

              {unreadMessages > 0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    min-w-4
                    h-4
                    px-1
                    rounded-full
                    bg-red-500
                    text-white
                    text-[8px]
                    font-bold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {unreadMessages > 9
                    ? "9+"
                    : unreadMessages}
                </span>
              )}

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/seller/profile")
              }
              className="
                flex
                items-center
                gap-2
                rounded-full
                bg-green-700
                hover:bg-green-600
                px-2
                py-1.5
                transition
              "
            >

              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8
                    h-8
                    rounded-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-white
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-xs
                  "
                >
                  {getInitial(sellerFullName)}
                </div>
              )}

              <div className="hidden sm:block text-left pr-2">

                <p className="text-xs font-bold leading-none">
                  {sellerFullName}
                </p>

                <p className="text-[9px] text-green-100 mt-1">
                  Seller
                </p>

              </div>

            </button>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">

          <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
              "
            >

              <div>

                <h1
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-gray-800
                  "
                >
                  Messages
                </h1>

                <p className="text-gray-500 mt-1">
                  Chat with buyers about your products.
                </p>

              </div>

              <div
                className="
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  bg-green-50
                  text-green-700
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                "
              >
                <FiMessageCircle size={16} />
                Seller Inbox
              </div>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div
              className="
                grid
                grid-cols-2
                lg:grid-cols-3
                gap-4
              "
            >

              {/* CONVERSATIONS */}

              <div
                className="
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-green-100
                      text-green-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiMessageCircle size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-gray-500">
                      Conversations
                    </p>

                    <p className="text-xl font-bold text-gray-800">
                      {messages.length}
                    </p>

                  </div>

                </div>

              </div>

              {/* UNREAD */}

              <div
                className="
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-yellow-100
                      text-yellow-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiCheckCircle size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-gray-500">
                      Unread Messages
                    </p>

                    <p className="text-xl font-bold text-gray-800">
                      {unreadMessages}
                    </p>

                  </div>

                </div>

              </div>

              {/* ONLINE */}

              <div
                className="
                  hidden
                  lg:block
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  p-4
                  sm:p-5
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-blue-100
                      text-blue-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiUsers size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-gray-500">
                      Buyers Online
                    </p>

                    <p className="text-xl font-bold text-gray-800">
                      {onlineUsers}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="relative">

              <FiSearch
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search conversations..."
                className="
                  w-full
                  bg-white
                  border
                  border-gray-200
                  rounded-xl
                  py-3.5
                  pl-11
                  pr-4
                  text-sm
                  outline-none
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                  transition
                "
              />

            </div>

            {/* =================================================
                CONVERSATIONS CARD
            ================================================= */}

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                overflow-hidden
              "
            >

              {/* CARD HEADER */}

              <div
                className="
                  p-5
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-green-100
                      text-green-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiMessageCircle size={21} />
                  </div>

                  <div>

                    <h2 className="font-bold text-gray-800">
                      Buyer Conversations
                    </h2>

                    <p className="text-sm text-gray-400 mt-0.5">
                      {filteredMessages.length}{" "}
                      {filteredMessages.length === 1
                        ? "conversation"
                        : "conversations"}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="
                    w-9
                    h-9
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    text-gray-400
                    hover:bg-gray-100
                    hover:text-gray-600
                    transition
                  "
                >
                  <FiMoreVertical />
                </button>

              </div>

              {/* =================================================
                  LIST
              ================================================= */}

              {filteredMessages.length > 0 ? (

                <div>

                  {filteredMessages.map((message) => (

                    <button
                      key={message.id}
                      type="button"
                      onClick={() =>
                        openChat(message.id)
                      }
                      className="
                        w-full
                        flex
                        items-center
                        gap-4
                        p-4
                        sm:p-5
                        text-left
                        hover:bg-gray-50
                        transition
                        border-b
                        border-gray-100
                        last:border-b-0
                      "
                    >

                      {/* AVATAR */}

                      <div className="relative shrink-0">

                        {message.profileImage ? (

                          <img
                            src={message.profileImage}
                            alt={message.name}
                            className="
                              w-12
                              h-12
                              sm:w-13
                              sm:h-13
                              rounded-full
                              object-cover
                            "
                          />

                        ) : (

                          <div
                            className="
                              w-12
                              h-12
                              sm:w-13
                              sm:h-13
                              rounded-full
                              bg-green-100
                              text-green-700
                              flex
                              items-center
                              justify-center
                              font-bold
                              text-lg
                            "
                          >
                            {getInitial(message.name)}
                          </div>

                        )}

                        {message.online && (
                          <span
                            className="
                              absolute
                              bottom-0
                              right-0
                              w-3
                              h-3
                              bg-green-500
                              border-2
                              border-white
                              rounded-full
                            "
                          />
                        )}

                      </div>

                      {/* DETAILS */}

                      <div className="flex-1 min-w-0">

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                        >

                          <h3
                            className="
                              font-semibold
                              text-gray-800
                              truncate
                            "
                          >
                            {message.name}
                          </h3>

                          <span
                            className="
                              text-xs
                              text-gray-400
                              shrink-0
                            "
                          >
                            {message.time}
                          </span>

                        </div>

                        {message.productName && (
                          <p
                            className="
                              text-[11px]
                              text-green-600
                              font-medium
                              mt-0.5
                              truncate
                            "
                          >
                            {message.productName}
                          </p>
                        )}

                        <p
                          className={`
                            text-sm
                            truncate
                            mt-1
                            ${
                              message.unread > 0
                                ? "font-semibold text-gray-700"
                                : "text-gray-500"
                            }
                          `}
                        >
                          {message.lastMessage ||
                            "No messages yet."}
                        </p>

                      </div>

                      {/* UNREAD */}

                      {message.unread > 0 && (
                        <span
                          className="
                            min-w-5
                            h-5
                            px-1.5
                            rounded-full
                            bg-green-600
                            text-white
                            text-[11px]
                            font-bold
                            flex
                            items-center
                            justify-center
                            shrink-0
                          "
                        >
                          {message.unread}
                        </span>
                      )}

                      <FiChevronRight
                        className="
                          text-gray-300
                          shrink-0
                        "
                        size={18}
                      />

                    </button>

                  ))}

                </div>

              ) : (

                /* =================================================
                    EMPTY STATE
                ================================================= */

                <div
                  className="
                    py-16
                    px-6
                    text-center
                  "
                >

                  <div
                    className="
                      w-16
                      h-16
                      mx-auto
                      rounded-2xl
                      bg-gray-100
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiMessageCircle
                      className="text-gray-400"
                      size={26}
                    />
                  </div>

                  <h3
                    className="
                      font-semibold
                      text-gray-800
                      mt-4
                    "
                  >
                    {search
                      ? "No conversations found"
                      : "No buyer messages yet"}
                  </h3>

                  <p
                    className="
                      text-sm
                      text-gray-500
                      mt-1
                      max-w-sm
                      mx-auto
                    "
                  >
                    {search
                      ? "We couldn't find any conversations matching your search."
                      : "When buyers contact you about your products, their conversations will appear here."}
                  </p>

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="
                        mt-4
                        text-sm
                        font-medium
                        text-green-600
                        hover:underline
                      "
                    >
                      Clear search
                    </button>
                  )}

                </div>

              )}

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div
              className="
                rounded-2xl
                bg-green-50
                border
                border-green-100
                p-4
                sm:p-5
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-white
                  text-green-700
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  shrink-0
                "
              >
                <FiCheckCircle size={18} />
              </div>

              <div>

                <p className="text-sm font-semibold text-gray-800">
                  Stay connected with your buyers
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Reply quickly to questions about your products.
                </p>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default SellerMessages;