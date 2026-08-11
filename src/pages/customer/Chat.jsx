import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiSend,
  FiMoreVertical,
  FiPaperclip,
} from "react-icons/fi";

import messages from "../../data/messages";

function Chat({ cartCount = 0 }) {

  const { id } = useParams();
  const navigate = useNavigate();

  // Find the EXACT person clicked
  const person = messages.find(
    (message) => message.id === Number(id)
  );


  const [messageText, setMessageText] = useState("");


  // If the ID doesn't exist
  const [chatMessages, setChatMessages] = useState(
  person?.conversation || []
);

if (!person) {
  return (
    <CustomerLayout cartCount={cartCount}>
      {/* not found UI */}
    </CustomerLayout>
  );
}

  // SEND MESSAGE
  const sendMessage = () => {

    const text = messageText.trim();

    if (!text) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessageText("");
  };


  // ENTER TO SEND
  const handleKeyDown = (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      sendMessage();

    }
  };


  return (
    <CustomerLayout cartCount={cartCount}>

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


        {/* ================= CHAT HEADER ================= */}

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
            "
          >
            <FiArrowLeft />
          </button>


          {/* AVATAR */}
          <div className="relative">

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
              {person.name.charAt(0)}
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

            <p className="text-xs text-green-600">
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
            "
          >
            <FiMoreVertical />
          </button>

        </div>


        {/* ================= CHAT BODY ================= */}

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

          <div className="text-center mb-4">

            <span
              className="
                inline-block
                bg-white
                text-gray-400
                text-xs
                px-3
                py-1
                rounded-full
              "
            >
              Conversation with {person.name}
            </span>

          </div>


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

                <p className="text-sm leading-5">
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


        {/* ================= INPUT ================= */}

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
              "
            >
              <FiPaperclip />
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
                focus:ring-2
                focus:ring-green-100
                focus:bg-white
              "
            />


            {/* SEND */}
            <button
              type="button"
              onClick={sendMessage}
              disabled={!messageText.trim()}
              className="
                w-11
                h-11
                rounded-full
                bg-green-600
                hover:bg-green-700
                disabled:bg-gray-300
                text-white
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <FiSend />
            </button>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}

export default Chat;