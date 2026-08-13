import { useNavigate } from "react-router-dom";

import {
  FiMessageCircle,
  FiChevronRight,
} from "react-icons/fi";


function RecentMessages({
  messages = [],
}) {

  const navigate = useNavigate();


  // =====================================================
  // RECENT MESSAGES
  // =====================================================

  // Sort conversations by ID and show the latest 5
  const recentMessages = [...messages]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);


  // =====================================================
  // TOTAL UNREAD
  // =====================================================

  const totalUnread = messages.reduce(
    (total, message) => total + (message.unread || 0),
    0
  );


  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-100
        overflow-hidden
      "
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          p-5
          pb-3
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h2 className="font-bold text-gray-800">
            Recent Messages
          </h2>

          <p className="text-xs text-gray-400 mt-1">
            Your latest conversations
          </p>

        </div>


        {/* MESSAGE ICON */}

        <div
          className="
            relative
            w-9
            h-9
            rounded-full
            bg-green-100
            text-green-600
            flex
            items-center
            justify-center
          "
        >

          <FiMessageCircle size={17} />


          {/* TOTAL UNREAD BADGE */}

          {totalUnread > 0 && (

            <span
              className="
                absolute
                -top-1
                -right-1
                min-w-4
                h-4
                px-1
                rounded-full
                bg-green-600
                text-white
                text-[9px]
                font-bold
                flex
                items-center
                justify-center
                border-2
                border-white
              "
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>

          )}

        </div>

      </div>


      {/* =====================================================
          MESSAGE LIST
      ===================================================== */}

      {recentMessages.length > 0 ? (

        <div>

          {recentMessages.map((message) => (

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
                gap-3
                px-4
                py-3
                text-left
                hover:bg-gray-50
                transition
                border-b
                border-gray-50
              "
            >

              {/* =================================================
                  AVATAR
              ================================================= */}

              <div className="relative shrink-0">

                <div
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-green-100
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-sm
                  "
                >
                  {message.name?.charAt(0)?.toUpperCase() || "?"}
                </div>


                {/* ONLINE INDICATOR */}

                {message.online && (

                  <span
                    className="
                      absolute
                      bottom-0
                      right-0
                      w-2.5
                      h-2.5
                      bg-green-500
                      border-2
                      border-white
                      rounded-full
                    "
                  />

                )}

              </div>


              {/* =================================================
                  MESSAGE INFORMATION
              ================================================= */}

              <div className="flex-1 min-w-0">

                {/* NAME + TIME */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >

                  <h3
                    className={`
                      text-xs
                      truncate
                      ${
                        message.unread > 0
                          ? "font-bold text-gray-800"
                          : "font-medium text-gray-700"
                      }
                    `}
                  >
                    {message.name}
                  </h3>


                  <span
                    className="
                      text-[9px]
                      text-gray-400
                      shrink-0
                    "
                  >
                    {message.time}
                  </span>

                </div>


                {/* LAST MESSAGE + UNREAD */}

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mt-1
                  "
                >

                  <p
                    className={`
                      text-[10px]
                      truncate
                      ${
                        message.unread > 0
                          ? "font-semibold text-gray-700"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {message.lastMessage || "No messages yet"}
                  </p>


                  {/* UNREAD COUNT */}

                  {message.unread > 0 && (

                    <span
                      className="
                        min-w-4
                        h-4
                        px-1
                        rounded-full
                        bg-green-600
                        text-white
                        text-[9px]
                        font-bold
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                    >
                      {message.unread > 99
                        ? "99+"
                        : message.unread}
                    </span>

                  )}

                </div>

              </div>


              {/* =================================================
                  ARROW
              ================================================= */}

              <FiChevronRight
                className="text-gray-300 shrink-0"
                size={15}
              />

            </button>

          ))}

        </div>

      ) : (

        /* =====================================================
           EMPTY STATE
        ===================================================== */

        <div
          className="
            px-5
            py-8
            text-center
          "
        >

          <div
            className="
              w-12
              h-12
              mx-auto
              rounded-full
              bg-gray-100
              text-gray-400
              flex
              items-center
              justify-center
            "
          >
            <FiMessageCircle size={22} />
          </div>


          <p className="text-sm font-medium text-gray-600 mt-3">
            No messages yet.
          </p>


          <p className="text-xs text-gray-400 mt-1">
            Your conversations will appear here.
          </p>

        </div>

      )}


      {/* =====================================================
          VIEW ALL
      ===================================================== */}

      {messages.length > 0 && (

        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="
            w-[calc(100%-24px)]
            mx-3
            mb-3
            py-2.5
            rounded-xl
            bg-green-50
            hover:bg-green-100
            text-green-600
            text-xs
            font-medium
            transition
          "
        >
          View All Messages
        </button>

      )}

    </div>
  );
}


export default RecentMessages;