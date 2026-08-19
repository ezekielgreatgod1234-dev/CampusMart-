import { useEffect, useState } from "react";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

function InternetRequired() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);

  /*
   * =========================================================
   * FORCE THIS PAGE TO LIGHT MODE
   * =========================================================
   *
   * This temporarily overrides:
   *
   * - html.dark
   * - dark body styles
   * - !important background colors
   * - browser color-scheme
   * - mobile dark-mode form controls
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Save current values
    const previousHtmlBackground =
      html.style.getPropertyValue("background-color");

    const previousHtmlColor =
      html.style.getPropertyValue("color");

    const previousBodyBackground =
      body.style.getPropertyValue("background-color");

    const previousBodyColor =
      body.style.getPropertyValue("color");

    const previousHtmlColorScheme =
      html.style.getPropertyValue("color-scheme");

    const previousBodyColorScheme =
      body.style.getPropertyValue("color-scheme");

    /*
     * Force LIGHT mode with !important.
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
     * Add an attribute so CSS can specifically identify
     * that the Internet Required screen is active.
     */
    html.setAttribute(
      "data-internet-required",
      "true"
    );

    /*
     * Change browser address-bar/theme color to light.
     */
    let themeColorMeta =
      document.querySelector(
        'meta[name="theme-color"]'
      );

    let createdThemeColorMeta = false;

    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");

      themeColorMeta.setAttribute(
        "name",
        "theme-color"
      );

      document.head.appendChild(themeColorMeta);

      createdThemeColorMeta = true;
    }

    const previousThemeColor =
      themeColorMeta.getAttribute("content");

    themeColorMeta.setAttribute(
      "content",
      "#f9fafb"
    );

    /*
     * Cleanup when InternetRequired disappears.
     */
    return () => {
      if (previousHtmlBackground) {
        html.style.setProperty(
          "background-color",
          previousHtmlBackground
        );
      } else {
        html.style.removeProperty(
          "background-color"
        );
      }

      if (previousHtmlColor) {
        html.style.setProperty(
          "color",
          previousHtmlColor
        );
      } else {
        html.style.removeProperty("color");
      }

      if (previousHtmlColorScheme) {
        html.style.setProperty(
          "color-scheme",
          previousHtmlColorScheme
        );
      } else {
        html.style.removeProperty(
          "color-scheme"
        );
      }

      if (previousBodyBackground) {
        body.style.setProperty(
          "background-color",
          previousBodyBackground
        );
      } else {
        body.style.removeProperty(
          "background-color"
        );
      }

      if (previousBodyColor) {
        body.style.setProperty(
          "color",
          previousBodyColor
        );
      } else {
        body.style.removeProperty("color");
      }

      if (previousBodyColorScheme) {
        body.style.setProperty(
          "color-scheme",
          previousBodyColorScheme
        );
      } else {
        body.style.removeProperty(
          "color-scheme"
        );
      }

      html.removeAttribute(
        "data-internet-required"
      );

      if (themeColorMeta) {
        if (previousThemeColor) {
          themeColorMeta.setAttribute(
            "content",
            previousThemeColor
          );
        } else if (createdThemeColorMeta) {
          themeColorMeta.remove();
        }
      }
    };
  }, []);

  /*
   * =========================================================
   * INTERNET STATUS
   * =========================================================
   */

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

  /*
   * =========================================================
   * RETRY
   * =========================================================
   */

  const handleRetry = () => {
    setChecking(true);

    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setChecking(false);
    }, 500);
  };

  /*
   * Internet available.
   */
  if (isOnline) {
    return null;
  }

  /*
   * =========================================================
   * INTERNET REQUIRED SCREEN
   * =========================================================
   */

  return (
    <div
      className="internet-required-page"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,

        display: "flex",

        width: "100%",
        minHeight: "100vh",
      

        alignItems: "center",
        justifyContent: "center",

        boxSizing: "border-box",

        padding: "24px 16px",

        backgroundColor: "#f9fafb",

        color: "#111827",

        colorScheme: "light",

        forcedColorAdjust: "none",

        WebkitTextSizeAdjust: "100%",

        overflowY: "auto",
      }}
    >
      {/* =====================================================
          CARD
      ===================================================== */}

      <div
        style={{
          width: "100%",
          maxWidth: "448px",

          boxSizing: "border-box",

          padding: "24px",

          backgroundColor: "#ffffff",

          color: "#111827",

          borderRadius: "16px",

          textAlign: "center",

          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.08)",

          colorScheme: "light",

          forcedColorAdjust: "none",
        }}
      >
        {/* ===================================================
            ICON
        =================================================== */}

        <div
          style={{
            width: "80px",
            height: "80px",

            margin: "0 auto",

            display: "flex",

            alignItems: "center",
            justifyContent: "center",

            borderRadius: "9999px",

            backgroundColor: "#f0fdf4",

            color: "#16a34a",

            forcedColorAdjust: "none",
          }}
        >
          <FiWifiOff size={36} />
        </div>

        {/* ===================================================
            TITLE
        =================================================== */}

        <h1
          style={{
            marginTop: "24px",
            marginBottom: "0",

            color: "#111827",

            fontSize: "24px",

            lineHeight: "32px",

            fontWeight: 700,

            forcedColorAdjust: "none",
          }}
        >
          No Internet Connection
        </h1>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        <p
          style={{
            marginTop: "12px",
            marginBottom: "0",

            color: "#6b7280",

            fontSize: "14px",

            lineHeight: "24px",

            forcedColorAdjust: "none",
          }}
        >
          CampusMart requires an active internet
          connection to work.
        </p>

        <p
          style={{
            marginTop: "8px",
            marginBottom: "0",

            color: "#6b7280",

            fontSize: "14px",

            lineHeight: "24px",

            forcedColorAdjust: "none",
          }}
        >
          Please connect to Wi-Fi or mobile data
          and try again.
        </p>

        {/* ===================================================
            BUTTON
        =================================================== */}

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

            WebkitAppearance: "none",

            appearance: "none",

            forcedColorAdjust: "none",

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

          {checking
            ? "Checking..."
            : "Try Again"}
        </button>
      </div>

      {/* =====================================================
          MOBILE + DARK MODE PROTECTION
      ===================================================== */}

      <style>
        {`
          /*
           * Animation
           */
          @keyframes internet-required-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }


          /*
           * FORCE LIGHT MODE
           */
          html[data-internet-required="true"],
          html[data-internet-required="true"] body {
            background-color: #f9fafb !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * Internet Required container
           */
          html.dark .internet-required-page {
            background-color: #f9fafb !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * Card
           */
          html.dark .internet-required-page > div {
            background-color: #ffffff !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * Title
           */
          html.dark .internet-required-page h1 {
            color: #111827 !important;
          }


          /*
           * Paragraphs
           */
          html.dark .internet-required-page p {
            color: #6b7280 !important;
          }


          /*
           * Icon background
           */
          html.dark .internet-required-page
          .internet-required-icon {
            background-color: #f0fdf4 !important;
            color: #16a34a !important;
          }


          /*
           * Button
           */
          html.dark .internet-required-page button {
            background-color: #16a34a !important;
            color: #ffffff !important;
            color-scheme: light !important;
          }


          /*
           * Prevent dark-mode color changes
           */
          .internet-required-page,
          .internet-required-page *,
          .internet-required-page button,
          .internet-required-page h1,
          .internet-required-page p {
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * Mobile browsers
           */
          @media (max-width: 768px) {
            html[data-internet-required="true"],
            html[data-internet-required="true"] body {
              background-color: #f9fafb !important;
              color: #111827 !important;
              color-scheme: light !important;
            }

            .internet-required-page {
              background-color: #f9fafb !important;
              color: #111827 !important;
              min-height: 100dvh !important;
            }

            .internet-required-page > div {
              background-color: #ffffff !important;
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
            }
          }
        `}
      </style>
    </div>
  );
}

export default InternetRequired;