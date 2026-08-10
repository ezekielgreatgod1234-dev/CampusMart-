import {
  FiMessageCircle,
  FiMoreVertical,
} from "react-icons/fi";

const messages = [
  {
    id: 1,
    name: "John Doe",
    message: "Is the laptop still available?",
    time: "2 min ago",
    avatar: "J",
  },
  {
    id: 2,
    name: "Sarah James",
    message: "Thanks for the fast delivery!",
    time: "15 min ago",
    avatar: "S",
  },
  {
    id: 3,
    name: "Michael",
    message: "Can I get a discount?",
    time: "1 hr ago",
    avatar: "M",
  },
];

function RecentMessages() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="text-green-600 text-xl" />
          <h2 className="font-bold text-lg">Recent Messages</h2>
        </div>

        <button>
          <FiMoreVertical className="text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="space-y-4">

        {messages.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-xl transition"
          >

            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              {item.avatar}
            </div>

            {/* Text */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">
                {item.name}
              </h3>

              <p className="text-sm text-gray-500 truncate">
                {item.message}
              </p>

              <span className="text-xs text-gray-400">
                {item.time}
              </span>
            </div>

          </div>
        ))}

      </div>

      {/* Footer */}
      <button className="w-full mt-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition">
        View All Messages
      </button>

    </div>
  );
}

export default RecentMessages;