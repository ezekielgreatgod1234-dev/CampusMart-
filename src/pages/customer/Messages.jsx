import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiSearch,
  FiMessageCircle,
  FiChevronRight,
} from "react-icons/fi";

import messages from "../../data/messages";

function Messages({ cartCount = 0 }) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const filteredMessages = messages.filter((message) => {

    const searchText = search.toLowerCase();

    return (
      message.name.toLowerCase().includes(searchText) ||
      message.lastMessage.toLowerCase().includes(searchText)
    );
  });


  return (
    <CustomerLayout cartCount={cartCount}>

      <div className="space-y-6">

        {/* HEADER */}
        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Messages
          </h1>

          <p className="text-gray-500 mt-1">
            Chat with buyers and sellers on CampusMart.
          </p>

        </div>


        {/* SEARCH */}
        <div className="relative max-w-xl">

          <FiSearch
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="
              w-full
              bg-white
              border
              border-gray-200
              rounded-xl
              py-3
              pl-11
              pr-4
              outline-none
              focus:border-green-500
              focus:ring-2
              focus:ring-green-100
            "
          />

        </div>


        {/* MESSAGE CARD */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

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

              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">

                <FiMessageCircle className="text-green-600 text-xl" />

              </div>

              <div>

                <h2 className="font-bold text-gray-800">
                  All Messages
                </h2>

                <p className="text-sm text-gray-400">
                  {filteredMessages.length} conversations
                </p>

              </div>

            </div>

          </div>


          {/* LIST */}
          {filteredMessages.length > 0 ? (

            <div>

              {filteredMessages.map((message) => (

                <button
                  key={message.id}
                  type="button"

                  onClick={() =>
                    navigate(`/messages/${message.id}`)
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

                    <div
                      className="
                        w-12
                        h-12
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

                    <div className="flex items-center justify-between gap-3">

                      <h3 className="font-semibold text-gray-800 truncate">
                        {message.name}
                      </h3>

                      <span className="text-xs text-gray-400 shrink-0">
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
                        text-xs
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


                  <FiChevronRight className="text-gray-300 shrink-0" />

                </button>

              ))}

            </div>

          ) : (

            <div className="p-12 text-center">

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-full
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                "
              >
                <FiMessageCircle className="text-gray-400 text-2xl" />
              </div>

              <h3 className="font-semibold text-gray-800 mt-4">
                No messages found
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Try searching for another conversation.
              </p>

            </div>

          )}

        </div>

      </div>

    </CustomerLayout>
  );
}

export default Messages;