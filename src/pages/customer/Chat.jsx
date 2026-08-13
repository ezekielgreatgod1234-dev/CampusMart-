import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiSend,
  FiMoreVertical,
  FiPaperclip,
} from "react-icons/fi";

function Chat({
  cartCount = 0,
  wishlist = [],
  messages = [],
  unreadMessages = 0,
  markMessageAsRead,
  sendMessage,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // FIND PERSON
  // =====================================================

  const person = messages.find(
    (message) => message.id === Number(id)
  );

  // =====================================================
  // MESSAGE INPUT
  // =====================================================

  const [messageText, setMessageText] = useState("");

  // =====================================================
  // MARK AS READ WHEN CHAT OPENS
  // =====================================================

  useEffect(() => {
    if (person && person.unread > 0 && markMessageAsRead) {
      markMessageAsRead(person.id);
    }
  }, [person?.id]);

  // =====================================================
  // PERSON NOT FOUND
  // =====================================================

  if (!person) {
    return (
      <CustomerLayout
        cartCount={cartCount}
        wishlist={wishlist}
        unreadMessages={unreadMessages}
      >
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-10
            text-center
          "
        >
          <h2 className="text-xl font-bold text-gray-800">
            Conversation not found
          </h2>

          <p className="text-gray-500 mt-2">
            The conversation you're looking for doesn't exist.
          </p>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="
              mt-5
              bg-green-600
              hover:bg-green-700
              text-white
              px-5
              py-2.5
              rounded-xl
              font-medium
              transition
            "
          >
            Back to Messages
          </button>
        </div>
      </CustomerLayout>
    );
  }

  // =====================================================
  // CHAT MESSAGES
  // =====================================================

  const chatMessages = person.conversation || [];

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = () => {
    const text = messageText.trim();

    if (!text) return;

    if (sendMessage) {
      sendMessage(person.id, text);
    }

    setMessageText("");
  };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >

      <div
        className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          overflow-hidden
          flex
          flex-col
          h-[calc(100vh-140px)]
          min-h-[550px]
        "
      >

        {/* =====================================================
            CHAT HEADER
        ===================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            px-4
            sm:px-6
            py-4
            border-b
            border-gray-100
            bg-white
          "
        >

          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="
              w-10
              h-10
              rounded-full
              hover:bg-gray-100
              flex
              items-center
              justify-center
              text-gray-600
              transition
            "
          >
            <FiArrowLeft size={19} />
          </button>

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
              {person.name?.charAt(0)?.toUpperCase()}
            </div>

            {person.online && (
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

          {/* PERSON */}

          <div className="flex-1 min-w-0">

            <h2 className="font-bold text-gray-800 truncate">
              {person.name}
            </h2>

            <p
              className={`text-xs ${
                person.online
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {person.online ? "Online" : "Offline"}
            </p>

          </div>

          {/* MORE */}

          <button
            type="button"
            className="
              w-10
              h-10
              rounded-full
              hover:bg-gray-100
              flex
              items-center
              justify-center
              text-gray-500
              transition
            "
          >
            <FiMoreVertical size={19} />
          </button>

        </div>

        {/* =====================================================
            CHAT BODY
        ===================================================== */}

        <div
          className="
            flex-1
            overflow-y-auto
            p-4
            sm:p-6
            space-y-4
            bg-gray-50
          "
        >

          {/* CONVERSATION LABEL */}

          <div className="text-center mb-5">

            <span
              className="
                inline-block
                bg-white
                text-gray-400
                text-xs
                px-3
                py-1.5
                rounded-full
                border
                border-gray-100
              "
            >
              Conversation with {person.name}
            </span>

          </div>

          {/* NO MESSAGES */}

          {chatMessages.length === 0 && (
            <div className="text-center py-10">

              <p className="text-sm text-gray-400">
                No messages yet.
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Send a message to start the conversation.
              </p>

            </div>
          )}

          {/* MESSAGES */}

          {chatMessages.map((message) => (

            <div
              key={message.id}
              className={`
                flex
                ${
                  message.sender === "me"
                    ? "justify-end"
                    : "justify-start"
                }
              `}
            >

              <div
                className={`
                  max-w-[80%]
                  sm:max-w-[65%]
                  px-4
                  py-3
                  rounded-2xl
                  ${
                    message.sender === "me"
                      ? "bg-green-600 text-white rounded-br-md"
                      : "bg-white text-gray-700 rounded-bl-md shadow-sm"
                  }
                `}
              >

                <p className="text-sm leading-5 break-words">
                  {message.text}
                </p>

                <p
                  className={`
                    text-[10px]
                    mt-1
                    ${
                      message.sender === "me"
                        ? "text-green-100"
                        : "text-gray-400"
                    }
                  `}
                >
                  {message.time}
                </p>

              </div>

            </div>

          ))}

        </div>

        {/* =====================================================
            INPUT
        ===================================================== */}

        <div
          className="
            border-t
            border-gray-100
            p-3
            sm:p-4
            bg-white
          "
        >

          <div className="flex items-center gap-2">

            {/* ATTACHMENT */}

            <button
              type="button"
              className="
                w-10
                h-10
                rounded-full
                hover:bg-gray-100
                text-gray-500
                flex
                items-center
                justify-center
                shrink-0
                transition
              "
            >
              <FiPaperclip size={18} />
            </button>

            {/* INPUT */}

            <input
              type="text"
              value={messageText}
              onChange={(e) =>
                setMessageText(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={`Message ${person.name}...`}
              className="
                flex-1
                bg-gray-100
                rounded-full
                px-4
                py-3
                text-sm
                outline-none
                border
                border-transparent
                focus:ring-2
                focus:ring-green-100
                focus:border-green-500
                focus:bg-white
                transition
              "
            />

            {/* SEND */}

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="
                w-11
                h-11
                rounded-full
                bg-green-600
                hover:bg-green-700
                disabled:bg-gray-300
                disabled:cursor-not-allowed
                text-white
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <FiSend size={18} />
            </button>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}

export default Chat;