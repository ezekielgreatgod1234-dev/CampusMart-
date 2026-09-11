import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import {
  FiArrowLeft,
  FiSend,
  FiZap,
  FiShoppingBag,
  FiBriefcase,
  FiSearch,
  FiMessageCircle,
  FiLoader,
  FiUser,
} from "react-icons/fi";

function AIAssistant({ cartCount = 0 }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Demo conversation (UI only for now)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Hi 👋 I’m CampusMartAI, your smart AI assistant.\n\nI can help you find products, suggest gigs, or answer questions about CampusMart. What do you need?",
    },
  ]);

  const suggestedPrompts = [
    {
      icon: <FiShoppingBag size={16} />,
      text: "Find affordable laptops under ₦300k",
    },
    {
      icon: <FiBriefcase size={16} />,
      text: "Show me tutoring gigs near me",
    },
    {
      icon: <FiSearch size={16} />,
      text: "Best headphones for students",
    },
    {
      icon: <FiMessageCircle size={16} />,
      text: "How do I post a gig?",
    },
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text = input) => {
    const message = text.trim();
    if (!message) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Fake AI response (UI only)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: "ai",
        text: getDemoResponse(message),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  // Temporary demo responses (later we’ll connect real AI)
  const getDemoResponse = (message) => {
    const lower = message.toLowerCase();

    if (lower.includes("laptop") || lower.includes("macbook")) {
      return "I found some popular laptops currently listed by students:\n\n• MacBook Air M1 – around ₦450,000\n• HP Pavilion – ₦280,000\n• Dell Inspiron – ₦220,000\n\nWould you like me to show you products under a specific budget?";
    }

    if (lower.includes("gig") || lower.includes("tutoring") || lower.includes("job")) {
      return "Here are some active campus gigs you might like:\n\n• Math Tutoring – ₦3,000/session\n• Logo Design – ₦8,000\n• Phone Repair – Negotiable\n\nWant me to filter by category or location?";
    }

    if (lower.includes("how") && lower.includes("post")) {
      return "To post a gig:\n\n1. Go to Campus Gigs\n2. Click “Post a Gig”\n3. Fill in the title, description, budget and deadline\n4. Submit\n\nStudents on your campus will be able to apply.";
    }

    return "Got it! I’m still learning, but I can help you with:\n\n• Finding products\n• Discovering campus gigs\n• Explaining how CampusMart works\n\nTry asking me something more specific 😊";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shadow-md">
              <FiZap size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">CampusMartAI</h1>
              <p className="text-xs text-gray-500">Your smart campus assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "ai"
                      ? "bg-gradient-to-br from-[#008236] to-[#00a34a] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {msg.role === "ai" ? <FiZap size={16} /> : <FiUser size={16} />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "ai"
                      ? "bg-gray-50 text-gray-800 rounded-tl-sm"
                      : "bg-[#008236] text-white rounded-tr-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shrink-0">
                  <FiZap size={16} />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (only show when few messages) */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-4 sm:px-6 pb-3">
              <p className="text-xs text-gray-400 mb-2.5 font-medium">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => handleSend(prompt.text)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition"
                  >
                    <span className="text-green-600">{prompt.icon}</span>
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3 sm:p-4">
            <div className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask CampusAI anything..."
                  rows={1}
                  className="w-full resize-none px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition max-h-32"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="w-11 h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-300 text-white flex items-center justify-center transition shadow-sm disabled:cursor-not-allowed shrink-0"
              >
                {isTyping ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : (
                  <FiSend size={18} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              CampusAI can make mistakes. Double-check important info.
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default AIAssistant;