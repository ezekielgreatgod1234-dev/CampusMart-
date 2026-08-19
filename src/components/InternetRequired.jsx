import { useEffect, useState } from "react";
import {
  FiWifiOff,
  FiRefreshCw,
} from "react-icons/fi";

function InternetRequired() {
  const [isOnline, setIsOnline] = useState(
    () => navigator.onLine
  );

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
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
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        bg-gray-50
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          bg-white
          border
          border-gray-100
          shadow-xl
          p-8
          text-center
        "
      >
        {/* ICON */}

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
        >
          <FiWifiOff size={36} />
        </div>

        {/* TITLE */}

        <h1
          className="
            mt-6
            text-2xl
            font-bold
            text-gray-900
          "
        >
          No Internet Connection
        </h1>

        {/* TEXT */}

        <p
          className="
            mt-3
            text-sm
            leading-6
            text-gray-500
          "
        >
          CampusMart requires an active
          internet connection to work.
        </p>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-gray-500
          "
        >
          Please connect to Wi-Fi or mobile
          data and try again.
        </p>

        {/* BUTTON */}

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
            disabled:bg-green-400
          "
        >
          <FiRefreshCw
            size={17}
            className={
              checking
                ? "animate-spin"
                : ""
            }
          />

          {checking
            ? "Checking..."
            : "Try Again"}
        </button>
      </div>
    </div>
  );
}

export default InternetRequired;