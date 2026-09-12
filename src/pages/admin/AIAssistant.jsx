import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import { useAuth } from "../../context/AuthContext";

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
  FiMapPin,
  FiExternalLink,
  FiTrash2,
  FiSquare,
} from "react-icons/fi";

function AIAssistant({ cartCount = 0 }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const { firebaseUser } = useAuth();

  const API_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:5000";

  const getFirstName = () => {
    const displayName = firebaseUser?.displayName || "";

    if (displayName.trim()) {
      return displayName.trim().split(/\s+/)[0];
    }

    const emailName = firebaseUser?.email?.split("@")?.[0] || "";

    if (emailName.trim()) {
      return emailName.trim().split(/\s+/)[0];
    }

    return "there";
  };

  const firstName = getFirstName();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [messages, setMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const firstTimeWelcome = () => ({
    id: "welcome",
    role: "ai",
    text:
      `Hey ${firstName} 👋\n\n` +
      `I'm your CampusMart buddy — here to help you find ` +
      `great campus deals, discover gigs, check your orders, ` +
      `and make shopping on CampusMart easy.\n\n` +
      `What are we looking for today?`,
    products: [],
    gigs: [],
  });

  const welcomeBackMessage = () => ({
    id: `welcome-back-${Date.now()}`,
    role: "ai",
    text:
      `Welcome back, ${firstName}! 😊\n\n` +
      `Great to see you again. What are we buying today? ` +
      `I can help you find products, gigs, or check your orders.`,
    products: [],
    gigs: [],
  });

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!firebaseUser) {
        if (!cancelled) {
          setMessages([]);
          setIsFirstVisit(true);
          setHistoryLoaded(true);
        }
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();

        const response = await fetch(`${API_URL}/ai/history`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (cancelled) {
          return;
        }

        if (
          response.ok &&
          data?.success &&
          data?.hasHistory &&
          Array.isArray(data.messages) &&
          data.messages.length > 0
        ) {
          const restored = data.messages.map((m, index) => ({
            id: m.id || `hist-${index}-${Date.now()}`,
            role: m.role === "user" ? "user" : "ai",
            text: String(m.text || ""),
            products: Array.isArray(m.products) ? m.products : [],
            gigs: Array.isArray(m.gigs) ? m.gigs : [],
          }));

          if (data.returningAfter24h) {
            setMessages([...restored, welcomeBackMessage()]);
          } else {
            setMessages(restored);
          }

          setIsFirstVisit(false);
        } else {
          setMessages([]);
          setIsFirstVisit(true);
        }
      } catch (error) {
        console.error("CampusMart AI history load error:", error);

        if (!cancelled) {
          setMessages([]);
          setIsFirstVisit(true);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true);
        }
      }
    };

    setHistoryLoaded(false);
    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, firstName, API_URL]);

  const suggestedPrompts = [
    {
      icon: <FiShoppingBag size={16} />,
      text: "Find affordable laptops under ₦300k",
    },
    {
      icon: <FiSearch size={16} />,
      text: "Find an iPhone 13 under ₦500,000",
    },
    {
      icon: <FiBriefcase size={16} />,
      text: "Show me tutoring gigs",
    },
    {
      icon: <FiMessageCircle size={16} />,
      text: "How do I become a seller?",
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping, searchStatus]);

  const looksLikeProductSearch = (text) => {
    const lower = String(text || "").toLowerCase();

    const productWords = [
      "find",
      "show",
      "search",
      "looking for",
      "buy",
      "available",
      "product",
      "products",
      "food",
      "laptop",
      "phone",
      "iphone",
      "samsung",
      "headphone",
      "headphones",
      "airpod",
      "airpods",
      "macbook",
      "tablet",
      "computer",
      "charger",
      "shoe",
      "shoes",
      "bag",
      "watch",
      "dress",
      "clothes",
      "keyboard",
      "mouse",
      "monitor",
      "console",
      "playstation",
      "xbox",
      "camera",
    ];

    return productWords.some((word) => lower.includes(word));
  };

  const looksLikeGigSearch = (text) => {
    const lower = String(text || "").toLowerCase();

    const gigWords = [
      "gig",
      "gigs",
      "job",
      "jobs",
      "tutoring",
      "tutor",
      "designer",
      "design",
      "freelance",
      "repair",
      "photography",
      "photographer",
      "writer",
      "writing",
      "programming",
      "developer",
    ];

    return gigWords.some((word) => lower.includes(word));
  };

  const handleSend = async (text = input) => {
    const message = String(text || "").trim();

    if (!message || isTyping) {
      return;
    }

    if (!firebaseUser) {
      const authMessage = {
        id: `error-${Date.now()}`,
        role: "ai",
        text:
          "You need to be logged in to use CampusMart AI. " +
          "Please log in and try again.",
        products: [],
        gigs: [],
      };

      setIsFirstVisit(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: message,
        },
        authMessage,
      ]);

      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    };

    setIsFirstVisit(false);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (looksLikeProductSearch(message)) {
      setSearchStatus("Searching CampusMart products...");
    } else if (looksLikeGigSearch(message)) {
      setSearchStatus("Searching CampusMart gigs...");
    } else {
      setSearchStatus("Thinking...");
    }

    // After a short moment, if still loading a product search, refresh status
    const statusTimer = setTimeout(() => {
      if (looksLikeProductSearch(message)) {
        setSearchStatus("Still searching live listings...");
      } else if (looksLikeGigSearch(message)) {
        setSearchStatus("Still searching gigs...");
      } else {
        setSearchStatus("Almost there...");
      }
    }, 2500);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const idToken = await firebaseUser.getIdToken();

      const conversation = [...messages, userMessage]
        .filter(
          (item) =>
            item && (item.role === "user" || item.role === "ai")
        )
        .map((item) => ({
          role: item.role === "ai" ? "assistant" : "user",
          content: String(item.text || ""),
        }))
        .slice(-10);

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message,
          messages: conversation,
        }),
        signal: controller.signal,
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "CampusMart AI could not process your request."
        );
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text:
          data?.reply ||
          "I couldn't generate a response right now.",
        products: Array.isArray(data?.products) ? data.products : [],
        gigs: Array.isArray(data?.gigs) ? data.gigs : [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      if (error?.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: `stopped-${Date.now()}`,
            role: "ai",
            text: "Reply stopped.",
            products: [],
            gigs: [],
          },
        ]);

        return;
      }

      console.error("CampusMart AI error:", error);

      let errorText =
        "Sorry, I couldn't connect to CampusMart AI right now.";

      const raw = String(error?.message || "").trim();
      const msg = raw.toLowerCase();

      if (
        msg.includes("rate limit") ||
        msg.includes("busy right now") ||
        msg.includes("usage limit") ||
        msg.includes("quota") ||
        msg.includes("resource exhausted")
      ) {
        errorText =
          "I'm a bit busy right now 😅 Free AI limit reached — please wait a minute and try again.";
      } else if (
        msg.includes("gemini_api_key") ||
        msg.includes("api key") ||
        msg.includes("not configured") ||
        msg.includes("invalid key") ||
        msg.includes("unauthenticated")
      ) {
        errorText =
          "CampusMart AI key is missing or invalid on the server. Set GEMINI_API_KEY (free key from Google AI Studio).";
      } else if (
        msg.includes("model") &&
        (msg.includes("not available") ||
          msg.includes("not found") ||
          msg.includes("does not exist") ||
          msg.includes("no longer available"))
      ) {
        errorText =
          "That Gemini model is not available. Set GEMINI_AI_MODEL=gemini-3.6-flash on the server.";
      } else if (
        msg.includes("authentication") ||
        msg.includes("log in") ||
        msg.includes("firebase")
      ) {
        errorText = "Please log in again so I can help you.";
      } else if (raw) {
        errorText = raw.length > 300 ? raw.slice(0, 300) + "…" : raw;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          text: errorText,
          products: [],
          gigs: [],
        },
      ]);
    } finally {
      clearTimeout(statusTimer);
      abortControllerRef.current = null;
      setIsTyping(false);
      setSearchStatus("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopReply = () => {
    abortControllerRef.current?.abort();
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || isTyping || isDeleting) {
      return;
    }

    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    // Optimistic local removal — the message disappears immediately.
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    if (!firebaseUser) {
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken();

      await fetch(
        `${API_URL}/ai/history/messages/${encodeURIComponent(messageId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
    } catch (error) {
      console.error("CampusMart AI delete message error:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (isDeleting || isTyping) {
      return;
    }

    if (!firebaseUser) {
      setMessages([]);
      setIsFirstVisit(true);
      return;
    }

    const confirmed = window.confirm(
      "Delete this entire chat? This will permanently remove your CampusMart AI conversation history."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_URL}/ai/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Could not delete chat history."
        );
      }

      setMessages([]);
      setIsFirstVisit(true);
      setInput("");
    } catch (error) {
      console.error("CampusMart AI delete history error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          text:
            String(error?.message || "").trim() ||
            "Sorry, I couldn't delete the chat right now. Please try again.",
          products: [],
          gigs: [],
        },
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProductClick = (product) => {
    if (!product?.id) return;
    navigate(`/products/${product.id}`);
  };

  const handleSellerClick = (product) => {
    if (!product?.sellerId) return;
    navigate(`/store/${product.sellerId}`);
  };

  const handleGigClick = (gig) => {
    if (!gig?.id) return;
    navigate(`/gigs/${gig.id}`);
  };

  const ProductCard = ({ product }) => {
    const image =
      product?.image ||
      product?.imageUrl ||
      product?.imageURL ||
      product?.photoURL ||
      product?.thumbnail ||
      "";

    const price = Number(product?.price);
    const hasPrice = Number.isFinite(price);

    return (
      <div className="mt-3 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {image ? (
          <img
            src={image}
            alt={product?.name || "CampusMart product"}
            className="w-full h-40 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400">
            <FiShoppingBag size={28} />
          </div>
        )}

        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
            {product?.name || "CampusMart Product"}
          </h3>

          {hasPrice && (
            <p className="mt-1 text-lg font-bold text-[#008236]">
              ₦{price.toLocaleString("en-NG")}
            </p>
          )}

          {product?.sellerName && (
            <p className="text-xs text-gray-500 mt-2">
              Seller:{" "}
              <span className="font-medium text-gray-700">
                {product.sellerName}
              </span>
            </p>
          )}

          {product?.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <FiMapPin size={12} />
              <span>{product.location}</span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleProductClick(product)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-xs font-semibold transition"
            >
              View & Buy
              <FiExternalLink size={13} />
            </button>

            {product?.sellerId && (
              <button
                type="button"
                onClick={() => handleSellerClick(product)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 text-xs font-medium transition"
              >
                Seller
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const GigCard = ({ gig }) => {
    const budget = Number(gig?.budget ?? gig?.price ?? gig?.amount);
    const hasBudget = Number.isFinite(budget);

    return (
      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center shrink-0">
            <FiBriefcase size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-800 text-sm">
              {gig?.title || gig?.name || "Campus Gig"}
            </h3>

            {gig?.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                {gig.description}
              </p>
            )}

            {hasBudget && (
              <p className="text-sm font-bold text-[#008236] mt-2">
                ₦{budget.toLocaleString("en-NG")}
              </p>
            )}

            {gig?.location && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <FiMapPin size={12} />
                {gig.location}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleGigClick(gig)}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-xs font-semibold transition"
        >
          View Gig
          <FiExternalLink size={13} />
        </button>
      </div>
    );
  };

  const showWelcomeScreen =
    historyLoaded && isFirstVisit && messages.length === 0 && !isTyping;

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
            aria-label="Go back"
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shadow-md shrink-0">
              <FiZap size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-800">
                CampusMart AI
              </h1>
              <p className="text-xs text-gray-500">
                Your smart campus assistant
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteChat}
              disabled={isDeleting || isTyping}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Delete chat"
              title="Delete chat"
            >
              {isDeleting ? (
                <FiLoader size={16} className="animate-spin" />
              ) : (
                <FiTrash2 size={16} />
              )}
            </button>
          )}
        </div>

        {/* CHAT */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {!historyLoaded && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-400">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shadow-md animate-pulse">
                  <FiZap size={22} />
                </div>
                <p className="text-sm">Loading CampusMart AI...</p>
              </div>
            )}

            {/* GEMINI-STYLE FIRST WELCOME */}
            {showWelcomeScreen && (
              <div className="flex flex-col items-center justify-center min-h-[52vh] px-2 text-center">
                <div className="w-20 h-20 rounded-[1.35rem] bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shadow-lg shadow-green-100 mb-5">
                  <FiZap size={36} />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                  Hi {firstName}
                </h2>

                <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-md leading-relaxed">
                  I&apos;m{" "}
                  <span className="font-semibold text-[#008236]">
                    CampusMart AI
                  </span>
                  . Ask me to find products, gigs, check your orders, or
                  explain how CampusMart works.
                </p>

                <div className="mt-8 w-full max-w-lg">
                  <p className="text-xs text-gray-400 mb-3 font-medium">
                    Try asking
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt.text}
                        type="button"
                        onClick={() => handleSend(prompt.text)}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition shadow-sm"
                      >
                        <span className="text-green-600">{prompt.icon}</span>
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGE LIST */}
            {historyLoaded &&
              !showWelcomeScreen &&
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group flex gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "ai"
                        ? "bg-gradient-to-br from-[#008236] to-[#00a34a] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <FiZap size={16} />
                    ) : (
                      <FiUser size={16} />
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] sm:max-w-[75%] ${
                      msg.role === "user" ? "items-end" : ""
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "ai"
                          ? "bg-gray-50 text-gray-800 rounded-tl-sm"
                          : "bg-[#008236] text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.role === "ai" &&
                      Array.isArray(msg.products) &&
                      msg.products.length > 0 && (
                        <div className="space-y-3">
                          {msg.products.map((product, index) => (
                            <ProductCard
                              key={product?.id || `product-${index}`}
                              product={product}
                            />
                          ))}
                        </div>
                      )}

                    {msg.role === "ai" &&
                      Array.isArray(msg.gigs) &&
                      msg.gigs.length > 0 && (
                        <div className="space-y-3">
                          {msg.gigs.map((gig, index) => (
                            <GigCard
                              key={gig?.id || `gig-${index}`}
                              gig={gig}
                            />
                          ))}
                        </div>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    disabled={isTyping || isDeleting}
                    className="self-center w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition disabled:opacity-0 disabled:cursor-not-allowed shrink-0"
                    aria-label="Delete message"
                    title="Delete message"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}

            {/* SEARCHING / TYPING STATUS */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#008236] to-[#00a34a] text-white flex items-center justify-center shrink-0">
                  <FiZap size={16} />
                </div>

                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#008236] mb-2">
                    <FiLoader size={13} className="animate-spin" />
                    <span>
                      {searchStatus || "CampusMart AI is thinking..."}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="border-t border-gray-100 p-3 sm:p-4">
            <div className="flex items-end gap-2.5">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask CampusMart AI anything..."
                  rows={1}
                  disabled={isTyping}
                  className="w-full resize-none px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition max-h-32 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {isTyping ? (
                <button
                  type="button"
                  onClick={handleStopReply}
                  className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition shadow-sm shrink-0"
                  aria-label="Stop response"
                  title="Stop response"
                >
                  <FiSquare size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-300 text-white flex items-center justify-center transition shadow-sm disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message"
                >
                  <FiSend size={18} />
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 mt-2 text-center">
              CampusMart AI uses live CampusMart data when available. Always
              double-check important information.
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default AIAssistant;