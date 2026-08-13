import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiSearch,
  FiMessageCircle,
  FiChevronRight,
  FiMoreVertical,
  FiCheckCircle,
  FiUsers,
} from "react-icons/fi";


function Messages({
  cartCount = 0,
  wishlist = [],
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
}) {

  const navigate = useNavigate();

  const [search, setSearch] = useState("");


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredMessages = messages.filter((message) => {

    const searchText = search.toLowerCase();

    return (
      message.name
        .toLowerCase()
        .includes(searchText) ||

      message.lastMessage
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

    // Mark this conversation as read
    if (markMessageAsRead) {
      markMessageAsRead(messageId);
    }

    // Then open the chat
    navigate(`/messages/${messageId}`);

  };


  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >

      <div className="space-y-6">


        {/* =====================================================
            HEADER
        ===================================================== */}

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
              Chat with buyers and sellers on CampusMart.
            </p>

          </div>


          {/* NEW MESSAGE */}

          <button
            type="button"
            className="
              hidden
              sm:flex
              items-center
              gap-2
              bg-green-50
              text-green-600
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-medium
              hover:bg-green-100
              transition
            "
          >
            <FiMessageCircle />

            New Message
          </button>

        </div>


        {/* =====================================================
            STATS
        ===================================================== */}

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
                  Online Now
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {onlineUsers}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            SEARCH
        ===================================================== */}

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
            onChange={(e) => setSearch(e.target.value)}
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


        {/* =====================================================
            MESSAGES CARD
        ===================================================== */}

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
                  All Messages
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


          {/* =====================================================
              MESSAGE LIST
          ===================================================== */}

          {filteredMessages.length > 0 ? (

            <div>

              {filteredMessages.map((message) => (

                <button
                  key={message.id}
                  type="button"
                  onClick={() => openChat(message.id)}
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
                      {message.name.charAt(0)}
                    </div>


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
                      {message.lastMessage}
                    </p>

                  </div>


                  {/* UNREAD COUNT */}

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


                  {/* ARROW */}

                  <FiChevronRight
                    className="text-gray-300 shrink-0"
                    size={18}
                  />

                </button>

              ))}

            </div>

          ) : (

            /* EMPTY STATE */

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
                No messages found
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
                We couldn't find any conversations matching
                your search.
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


        {/* =====================================================
            MOBILE NEW MESSAGE
        ===================================================== */}

        <button
          type="button"
          className="
            sm:hidden
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-green-600
            hover:bg-green-700
            text-white
            py-3
            rounded-xl
            font-medium
            transition
          "
        >
          <FiMessageCircle />

          New Message
        </button>

      </div>

    </CustomerLayout>
  );
}


export default Messages;