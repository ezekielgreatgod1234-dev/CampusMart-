import { useEffect, useState } from "react";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

function InternetRequired() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);

  /*
  ============================================================
  FORCE LIGHT MODE WHILE THIS PAGE IS DISPLAYED
  ============================================================
  */

  useEffect(() => {
    if (isOnline) return;

    const html = document.documentElement;
    const body = document.body;

    // Save the current values so they can be restored later
    const previousHtmlBackground = html.style.backgroundColor;
    const previousHtmlColor = html.style.color;
    const previousHtmlColorScheme = html.style.colorScheme;

    const previousBodyBackground = body.style.backgroundColor;
    const previousBodyColor = body.style.color;
    const previousBodyColorScheme = body.style.colorScheme;

    /*
      Remove dark color scheme from the document temporarily.
    */
    html.style.setProperty(
      "background-color",
      "#f9fafb",
      "important"
    );

    html.style.setProperty(
      "color",
      "#111827",
      "important"
    );

    html.style.setProperty(
      "color-scheme",
      "light",
      "important"
    );

    body.style.setProperty(
      "background-color",
      "#f9fafb",
      "important"
    );

    body.style.setProperty(
      "color",
      "#111827",
      "important"
    );

    body.style.setProperty(
      "color-scheme",
      "light",
      "important"
    );

    /*
      Tell the browser that this page is LIGHT.
    */
    html.setAttribute("data-theme", "light");
    body.setAttribute("data-theme", "light");

    /*
      Also prevent the browser from using its preferred
      dark color scheme.
    */
    html.style.setProperty(
      "forced-color-adjust",
      "none"
    );

    /*
      Cleanup when the InternetRequired page disappears.
    */
    return () => {
      html.style.removeProperty("background-color");
      html.style.removeProperty("color");
      html.style.removeProperty("color-scheme");
      html.style.removeProperty("forced-color-adjust");

      body.style.removeProperty("background-color");
      body.style.removeProperty("color");
      body.style.removeProperty("color-scheme");

      html.removeAttribute("data-theme");
      body.removeAttribute("data-theme");

      /*
        Restore the original values if they existed.
      */
      if (previousHtmlBackground) {
        html.style.backgroundColor = previousHtmlBackground;
      }

      if (previousHtmlColor) {
        html.style.color = previousHtmlColor;
      }

      if (previousHtmlColorScheme) {
        html.style.colorScheme = previousHtmlColorScheme;
      }

      if (previousBodyBackground) {
        body.style.backgroundColor = previousBodyBackground;
      }

      if (previousBodyColor) {
        body.style.color = previousBodyColor;
      }

      if (previousBodyColorScheme) {
        body.style.colorScheme = previousBodyColorScheme;
      }
    };
  }, [isOnline]);

  /*
  ============================================================
  INTERNET STATUS
  ============================================================
  */

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
  ============================================================
  RETRY
  ============================================================
  */

  const handleRetry = () => {
    setChecking(true);

    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setChecking(false);
    }, 500);
  };

  /*
  ============================================================
  INTERNET AVAILABLE
  ============================================================
  */

  if (isOnline) {
    return null;
  }

  /*
  ============================================================
  OFFLINE SCREEN
  ============================================================
  */

  return (
    <div
      className="internet-required-page"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        width: "100%",
        minHeight: "100dvh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "32px 16px",

        backgroundColor: "#f9fafb",
        color: "#111827",

        colorScheme: "light",

        forcedColorAdjust: "none",

        overflowY: "auto",

        WebkitAppearance: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "448px",

          padding: "24px",

          backgroundColor: "#ffffff",
          color: "#111827",

          borderRadius: "16px",

          textAlign: "center",

          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.08)",

          colorScheme: "light",

          forcedColorAdjust: "none",

          WebkitAppearance: "none",
        }}
      >
        {/* ==================================================
            ICON
        =================================================== */}

        <div
          style={{
            width: "80px",
            height: "80px",

            marginLeft: "auto",
            marginRight: "auto",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "9999px",

            backgroundColor: "#f0fdf4",
            color: "#16a34a",

            colorScheme: "light",

            forcedColorAdjust: "none",
          }}
        >
          <FiWifiOff size={36} />
        </div>

        {/* ==================================================
            TITLE
        =================================================== */}

        <h1
          style={{
            marginTop: "24px",
            marginBottom: 0,

            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: 700,

            color: "#111827",

            colorScheme: "light",

            forcedColorAdjust: "none",
          }}
        >
          No Internet Connection
        </h1>

        {/* ==================================================
            FIRST TEXT
        =================================================== */}

        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,

            fontSize: "14px",
            lineHeight: "24px",

            color: "#6b7280",

            colorScheme: "light",

            forcedColorAdjust: "none",
          }}
        >
          CampusMart requires an active internet
          connection to work.
        </p>

        {/* ==================================================
            SECOND TEXT
        =================================================== */}

        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,

            fontSize: "14px",
            lineHeight: "24px",

            color: "#6b7280",

            colorScheme: "light",

            forcedColorAdjust: "none",
          }}
        >
          Please connect to Wi-Fi or mobile data
          and try again.
        </p>

        {/* ==================================================
            RETRY BUTTON
        =================================================== */}

        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          style={{
            width: "100%",

            marginTop: "28px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: "8px",

            padding: "12px 20px",

            border: "none",
            borderRadius: "12px",

            backgroundColor: checking
              ? "#4ade80"
              : "#16a34a",

            color: "#ffffff",

            fontSize: "14px",
            fontWeight: 600,

            cursor: checking
              ? "not-allowed"
              : "pointer",

            colorScheme: "light",

            forcedColorAdjust: "none",

            WebkitAppearance: "none",

            appearance: "none",

            outline: "none",
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