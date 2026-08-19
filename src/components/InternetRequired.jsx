import { useEffect, useState } from "react";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

function InternetRequired() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);

    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setChecking(false);
    }, 500);
  };

  // Internet is available.
  // Do not render anything.
  if (isOnline) {
    return null;
  }

  return (
    <div
      className="
        internet-required-page
        fixed
        inset-0
        z-[9999]
        flex
        min-h-screen
        w-full
        items-center
        justify-center
        overflow-auto
        bg-gray-50
        px-4
        py-8
      "
      style={{
        backgroundColor: "#f9fafb",
        color: "#111827",
        colorScheme: "light",
      }}
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          text-center
          shadow-sm
          sm:p-8
        "
        style={{
          backgroundColor: "#ffffff",
          color: "#111827",
          colorScheme: "light",
        }}
      >
        {/* =====================================================
            ICON
        ====================================================== */}
        <div
          className="
            mx-auto
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-green-50
            text-green-600
          "
          style={{
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
          }}
        >
          <FiWifiOff size={36} />
        </div>

        {/* =====================================================
            TITLE
        ====================================================== */}
        <h1
          className="
            mt-6
            text-2xl
            font-bold
            text-gray-900
          "
          style={{
            color: "#111827",
          }}
        >
          No Internet Connection
        </h1>

        {/* =====================================================
            DESCRIPTION
        ====================================================== */}
        <p
          className="
            mt-3
            text-sm
            leading-6
            text-gray-500
          "
          style={{
            color: "#6b7280",
          }}
        >
          CampusMart requires an active internet connection to work.
        </p>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-gray-500
          "
          style={{
            color: "#6b7280",
          }}
        >
          Please connect to Wi-Fi or mobile data and try again.
        </p>

        {/* =====================================================
            RETRY BUTTON
        ====================================================== */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          className="
            mt-7
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-green-600
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-green-700
            disabled:cursor-not-allowed
            disabled:bg-green-400
          "
          style={{
            backgroundColor: checking ? "#4ade80" : "#16a34a",
            color: "#ffffff",
            colorScheme: "light",
          }}
        >
          <FiRefreshCw
            size={17}
            className={checking ? "animate-spin" : ""}
          />

          {checking ? "Checking..." : "Try Again"}
        </button>
      </div>
    </div>
  );
}

export default InternetRequired;