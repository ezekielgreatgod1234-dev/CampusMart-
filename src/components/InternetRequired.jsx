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

  /*
   * FORCE LIGHT MODE WHILE THIS PAGE IS DISPLAYED
   *
   * This protects against:
   * - CampusMart dark mode
   * - html.dark
   * - mobile browser dark mode
   * - browser form-control dark mode
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Save existing values
    const previousColorScheme = html.style.colorScheme;
    const previousBodyColor = body.style.backgroundColor;
    const previousHtmlColor = html.style.backgroundColor;

    // Force light mode
    html.style.colorScheme = "light";
    html.style.backgroundColor = "#f9fafb";

    body.style.backgroundColor = "#f9fafb";

    // Prevent the browser from treating this page as dark
    html.setAttribute("data-theme", "light");

    return () => {
      // Restore previous styles when leaving the page
      html.style.colorScheme = previousColorScheme;
      html.style.backgroundColor = previousHtmlColor;
      body.style.backgroundColor = previousBodyColor;

      html.removeAttribute("data-theme");
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);

    setTimeout(() => {
      const online = navigator.onLine;

      setIsOnline(online);
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
      className="internet-required-page"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        minHeight: "100dvh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        color: "#111827",
        colorScheme: "light",
        padding: "32px 16px",
        boxSizing: "border-box",
        overflowY: "auto",
        WebkitTextSizeAdjust: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "448px",
          backgroundColor: "#ffffff",
          color: "#111827",
          borderRadius: "16px",
          padding: "24px",
          textAlign: "center",
          boxSizing: "border-box",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          colorScheme: "light",
        }}
      >
        {/* ICON */}
        <div
          style={{
            margin: "0 auto",
            display: "flex",
            height: "80px",
            width: "80px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
          }}
        >
          <FiWifiOff size={36} />
        </div>

        {/* TITLE */}
        <h1
          style={{
            marginTop: "24px",
            marginBottom: 0,
            color: "#111827",
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: 700,
          }}
        >
          No Internet Connection
        </h1>

        {/* TEXT */}
        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            color: "#6b7280",
            fontSize: "14px",
            lineHeight: "24px",
          }}
        >
          CampusMart requires an active internet connection to work.
        </p>

        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,
            color: "#6b7280",
            fontSize: "14px",
            lineHeight: "24px",
          }}
        >
          Please connect to Wi-Fi or mobile data and try again.
        </p>

        {/* BUTTON */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          style={{
            marginTop: "28px",
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "none",
            borderRadius: "12px",
            backgroundColor: checking ? "#4ade80" : "#16a34a",
            color: "#ffffff",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: checking ? "not-allowed" : "pointer",
            colorScheme: "light",
            WebkitAppearance: "none",
            appearance: "none",
            outline: "none",
          }}
        >
          <FiRefreshCw
            size={17}
            style={{
              animation: checking
                ? "internet-required-spin 1s linear infinite"
                : "none",
            }}
          />

          {checking ? "Checking..." : "Try Again"}
        </button>
      </div>

      <style>
        {`
          @keyframes internet-required-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          /*
           * Extra mobile browser protection.
           */
          .internet-required-page,
          .internet-required-page * {
            color-scheme: light !important;
          }

          .internet-required-page {
            background: #f9fafb !important;
          }

          .internet-required-page h1 {
            color: #111827 !important;
          }

          .internet-required-page p {
            color: #6b7280 !important;
          }

          .internet-required-page button {
            background-color: #16a34a !important;
            color: #ffffff !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          @media (max-width: 480px) {
            .internet-required-page {
              padding: 20px 14px !important;
              min-height: 100dvh !important;
            }

            .internet-required-page > div {
              padding: 22px !important;
              border-radius: 16px !important;
            }

            .internet-required-page h1 {
              font-size: 22px !important;
              line-height: 30px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default InternetRequired;