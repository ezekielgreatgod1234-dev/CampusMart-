import { useNavigate } from "react-router-dom";

import {
  FiMessageCircle,
  FiChevronRight,
} from "react-icons/fi";

import messages from "../../../data/messages";

function RecentMessages() {
  const navigate = useNavigate();

  // Show only the first 4 on dashboard
  const recentMessages = messages.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="font-bold text-gray-800">
            Recent Messages
          </h2>

          <p className="text-xs text-gray-400 mt-1">
            Your latest conversations
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <FiMessageCircle className="text-green-600 text-xl" />
        </div>

      </div>


      {/* MESSAGES */}
      <div className="mt-5 space-y-1">

        {recentMessages.map((message) => (

          <button
            key={message.id}
            type="button"

            // IMPORTANT:
            // Open THIS person's chat
            onClick={() =>
              navigate(`/messages/${message.id}`)
            }

            className="
              w-full
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              hover:bg-gray-50
              text-left
              transition
            "
          >

            {/* AVATAR */}
            <div className="relative shrink-0">

              <div
                className="
                  w-11
                  h-11
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


            {/* MESSAGE DETAILS */}
            <div className="flex-1 min-w-0">

              <div className="flex items-center justify-between gap-2">

                <h3 className="text-sm font-semibold text-gray-800 truncate">
                  {message.name}
                </h3>

                <span className="text-[10px] text-gray-400 shrink-0">
                  {message.time}
                </span>

              </div>

              <p
                className={`
                  text-xs
                  truncate
                  mt-1
                  ${
                    message.unread > 0
                      ? "font-semibold text-gray-700"
                      : "text-gray-400"
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
                  w-5
                  h-5
                  rounded-full
                  bg-green-600
                  text-white
                  text-[10px]
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


      {/* VIEW ALL */}
      <button
        type="button"
        onClick={() => navigate("/messages")}
        className="
          w-full
          mt-4
          py-3
          rounded-xl
          bg-green-50
          text-green-600
          text-sm
          font-semibold
          hover:bg-green-100
          transition
        "
      >
        View All Messages
      </button>

    </div>
  );
}

export default RecentMessages;