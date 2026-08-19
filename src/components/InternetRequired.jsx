import { useEffect, useState } from "react";
import {
  FiWifiOff,
  FiRefreshCw,
} from "react-icons/fi";

function InternetRequired() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  const [checking, setChecking] = useState(false);

  /*
   * =========================================================
   * FORCE INTERNET REQUIRED SCREEN TO LIGHT MODE
   * =========================================================
   *
   * This page is completely independent of the application's
   * light/dark theme.
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    /*
     * Save existing values so they can be restored when
     * InternetRequired disappears.
     */
    const previous = {
      htmlBackground:
        html.style.getPropertyValue(
          "background-color"
        ),

      htmlColor:
        html.style.getPropertyValue("color"),

      htmlColorScheme:
        html.style.getPropertyValue(
          "color-scheme"
        ),

      bodyBackground:
        body.style.getPropertyValue(
          "background-color"
        ),

      bodyColor:
        body.style.getPropertyValue("color"),

      bodyColorScheme:
        body.style.getPropertyValue(
          "color-scheme"
        ),
    };

    /*
     * =======================================================
     * FORCE LIGHT
     * =======================================================
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
     * Tell the rest of the application's CSS that the
     * Internet Required screen is currently active.
     */
    html.setAttribute(
      "data-internet-required",
      "true"
    );

    /*
     * =======================================================
     * MOBILE BROWSER THEME COLOR
     * =======================================================
     */

    let themeColorMeta =
      document.querySelector(
        'meta[name="theme-color"]'
      );

    let createdThemeColorMeta = false;

    if (!themeColorMeta) {
      themeColorMeta =
        document.createElement("meta");

      themeColorMeta.setAttribute(
        "name",
        "theme-color"
      );

      document.head.appendChild(
        themeColorMeta
      );

      createdThemeColorMeta = true;
    }

    const previousThemeColor =
      themeColorMeta.getAttribute(
        "content"
      );

    themeColorMeta.setAttribute(
      "content",
      "#f9fafb"
    );

    /*
     * =======================================================
     * CLEANUP
     * =======================================================
     */

    return () => {
      /*
       * Restore HTML background.
       */
      if (previous.htmlBackground) {
        html.style.setProperty(
          "background-color",
          previous.htmlBackground
        );
      } else {
        html.style.removeProperty(
          "background-color"
        );
      }

      /*
       * Restore HTML color.
       */
      if (previous.htmlColor) {
        html.style.setProperty(
          "color",
          previous.htmlColor
        );
      } else {
        html.style.removeProperty(
          "color"
        );
      }

      /*
       * Restore HTML color scheme.
       */
      if (previous.htmlColorScheme) {
        html.style.setProperty(
          "color-scheme",
          previous.htmlColorScheme
        );
      } else {
        html.style.removeProperty(
          "color-scheme"
        );
      }

      /*
       * Restore body background.
       */
      if (previous.bodyBackground) {
        body.style.setProperty(
          "background-color",
          previous.bodyBackground
        );
      } else {
        body.style.removeProperty(
          "background-color"
        );
      }

      /*
       * Restore body color.
       */
      if (previous.bodyColor) {
        body.style.setProperty(
          "color",
          previous.bodyColor
        );
      } else {
        body.style.removeProperty(
          "color"
        );
      }

      /*
       * Restore body color scheme.
       */
      if (previous.bodyColorScheme) {
        body.style.setProperty(
          "color-scheme",
          previous.bodyColorScheme
        );
      } else {
        body.style.removeProperty(
          "color-scheme"
        );
      }

      /*
       * Remove Internet Required marker.
       */
      html.removeAttribute(
        "data-internet-required"
      );

      /*
       * Restore browser theme color.
       */
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
   * CHECK INTERNET
   * =========================================================
   */

  const handleRetry = async () => {
    if (checking) {
      return;
    }

    setChecking(true);

    /*
     * First check the browser's network state.
     */
    if (!navigator.onLine) {
      setIsOnline(false);
      setChecking(false);
      return;
    }

    /*
     * Give the browser a short moment to reconnect.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    setIsOnline(navigator.onLine);
    setChecking(false);
  };

  /*
   * =========================================================
   * INTERNET AVAILABLE
   * =========================================================
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

        width: "100%",
        height: "100%",
        minHeight: "100vh",
        minHeight: "100dvh",

        display: "flex",

        alignItems: "center",
        justifyContent: "center",

        boxSizing: "border-box",

        padding:
          "max(16px, env(safe-area-inset-top)) " +
          "max(16px, env(safe-area-inset-right)) " +
          "max(16px, env(safe-area-inset-bottom)) " +
          "max(16px, env(safe-area-inset-left))",

        backgroundColor: "#f9fafb",

        color: "#111827",

        colorScheme: "light",

        forcedColorAdjust: "none",

        WebkitTextSizeAdjust: "100%",

        overflowY: "auto",

        overscrollBehavior: "none",
      }}
    >
      {/* =====================================================
          CARD
      ===================================================== */}

      <div
        className="internet-required-card"
        style={{
          width: "100%",
          maxWidth: "448px",

          boxSizing: "border-box",

          padding:
            "clamp(20px, 5vw, 32px)",

          backgroundColor: "#ffffff",

          color: "#111827",

          borderRadius:
            "clamp(16px, 4vw, 20px)",

          textAlign: "center",

          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.06)",

          colorScheme: "light",

          forcedColorAdjust: "none",
        }}
      >
        {/* ===================================================
            ICON
        =================================================== */}

        <div
          className="internet-required-icon"
          style={{
            width:
              "clamp(64px, 18vw, 80px)",

            height:
              "clamp(64px, 18vw, 80px)",

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
          <FiWifiOff
            size={36}
            strokeWidth={1.8}
          />
        </div>

        {/* ===================================================
            TITLE
        =================================================== */}

        <h1
          className="internet-required-title"
          style={{
            marginTop:
              "clamp(20px, 5vw, 24px)",

            marginBottom: 0,

            color: "#111827",

            fontSize:
              "clamp(21px, 6vw, 26px)",

            lineHeight:
              "clamp(28px, 7vw, 34px)",

            fontWeight: 700,

            letterSpacing: "-0.02em",

            forcedColorAdjust: "none",
          }}
        >
          No Internet Connection
        </h1>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        <p
          className="internet-required-text"
          style={{
            marginTop: "12px",

            marginBottom: 0,

            color: "#6b7280",

            fontSize:
              "clamp(13px, 3.8vw, 15px)",

            lineHeight: 1.7,

            forcedColorAdjust: "none",
          }}
        >
          CampusMart requires an active
          internet connection to work.
        </p>

        <p
          className="internet-required-text"
          style={{
            marginTop: "6px",

            marginBottom: 0,

            color: "#6b7280",

            fontSize:
              "clamp(13px, 3.8vw, 15px)",

            lineHeight: 1.7,

            forcedColorAdjust: "none",
          }}
        >
          Please connect to Wi-Fi or mobile
          data and try again.
        </p>

        {/* ===================================================
            BUTTON
        =================================================== */}

        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          className="internet-required-button"
          style={{
            marginTop:
              "clamp(22px, 6vw, 28px)",

            display: "flex",

            width: "100%",

            minHeight: "48px",

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

            WebkitTapHighlightColor:
              "transparent",

            touchAction: "manipulation",
          }}
        >
          <FiRefreshCw
            size={17}
            style={{
              animation: checking
                ? "internet-required-spin 1s linear infinite"
                : "none",

              flexShrink: 0,
            }}
          />

          <span>
            {checking
              ? "Checking..."
              : "Try Again"}
          </span>
        </button>
      </div>

      {/* =====================================================
          LIGHT MODE PROTECTION
      ===================================================== */}

      <style>
        {`
          /*
           * ===================================================
           * SPINNER
           * ===================================================
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
           * ===================================================
           * FORCE LIGHT MODE
           * ===================================================
           */

          html[data-internet-required="true"],
          html[data-internet-required="true"] body {
            background-color: #f9fafb !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * ===================================================
           * PAGE
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-page {
            background-color: #f9fafb !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * ===================================================
           * CARD
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-card {
            background-color: #ffffff !important;
            color: #111827 !important;
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * ===================================================
           * ICON
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-icon {
            background-color: #f0fdf4 !important;
            color: #16a34a !important;
          }


          /*
           * ===================================================
           * TITLE
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-title {
            color: #111827 !important;
          }


          /*
           * ===================================================
           * TEXT
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-text {
            color: #6b7280 !important;
          }


          /*
           * ===================================================
           * BUTTON
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-button {
            background-color: #16a34a !important;
            color: #ffffff !important;
            color-scheme: light !important;
          }


          html[data-internet-required="true"]
          .internet-required-button:disabled {
            background-color: #4ade80 !important;
            color: #ffffff !important;
          }


          /*
           * ===================================================
           * DARK HTML CLASS
           *
           * Even if the rest of CampusMart has:
           *
           * html.dark { ... }
           *
           * this screen stays light.
           * ===================================================
           */

          html.dark[data-internet-required="true"],
          html.dark[data-internet-required="true"] body {
            background-color: #f9fafb !important;
            color: #111827 !important;
            color-scheme: light !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-page {
            background-color: #f9fafb !important;
            color: #111827 !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-card {
            background-color: #ffffff !important;
            color: #111827 !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-icon {
            background-color: #f0fdf4 !important;
            color: #16a34a !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-title {
            color: #111827 !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-text {
            color: #6b7280 !important;
          }


          html.dark[data-internet-required="true"]
          .internet-required-button {
            background-color: #16a34a !important;
            color: #ffffff !important;
          }


          /*
           * ===================================================
           * ALL CHILD ELEMENTS
           * ===================================================
           */

          html[data-internet-required="true"]
          .internet-required-page,
          html[data-internet-required="true"]
          .internet-required-page * {
            color-scheme: light !important;
            forced-color-adjust: none !important;
          }


          /*
           * ===================================================
           * MOBILE
           * ===================================================
           */

          @media (max-width: 640px) {

            html[data-internet-required="true"],
            html[data-internet-required="true"] body {
              background-color: #f9fafb !important;
              color: #111827 !important;
              color-scheme: light !important;
            }


            html[data-internet-required="true"]
            .internet-required-page {
              min-height: 100vh !important;
              min-height: 100dvh !important;

              padding:
                max(16px, env(safe-area-inset-top))
                max(16px, env(safe-area-inset-right))
                max(16px, env(safe-area-inset-bottom))
                max(16px, env(safe-area-inset-left))
                !important;
            }


            html[data-internet-required="true"]
            .internet-required-card {
              width: 100% !important;
              max-width: 448px !important;
            }


            html[data-internet-required="true"]
            .internet-required-button {
              min-height: 50px !important;
            }
          }


          /*
           * ===================================================
           * VERY SMALL PHONES
           * ===================================================
           */

          @media (max-width: 360px) {

            html[data-internet-required="true"]
            .internet-required-card {
              padding: 20px 16px !important;
              border-radius: 16px !important;
            }


            html[data-internet-required="true"]
            .internet-required-title {
              font-size: 21px !important;
              line-height: 28px !important;
            }


            html[data-internet-required="true"]
            .internet-required-text {
              font-size: 13px !important;
            }
          }


          /*
           * ===================================================
           * TOUCH DEVICES
           * ===================================================
           */

          @media (hover: none) and (pointer: coarse) {

            html[data-internet-required="true"]
            .internet-required-button {
              min-height: 50px !important;

              -webkit-tap-highlight-color:
                transparent !important;
            }
          }


          /*
           * ===================================================
           * REMOVE BROWSER DARK MODE
           * ===================================================
           */

          @media (prefers-color-scheme: dark) {

            html[data-internet-required="true"],
            html[data-internet-required="true"] body {
              background-color: #f9fafb !important;
              color: #111827 !important;
              color-scheme: light !important;
            }


            html[data-internet-required="true"]
            .internet-required-page {
              background-color: #f9fafb !important;
            }


            html[data-internet-required="true"]
            .internet-required-card {
              background-color: #ffffff !important;
              color: #111827 !important;
            }


            html[data-internet-required="true"]
            .internet-required-title {
              color: #111827 !important;
            }


            html[data-internet-required="true"]
            .internet-required-text {
              color: #6b7280 !important;
            }


            html[data-internet-required="true"]
            .internet-required-button {
              background-color: #16a34a !important;
              color: #ffffff !important;
            }
          }


          /*
           * ===================================================
           * HIGH CONTRAST / FORCED COLORS
           * ===================================================
           */

          @media (forced-colors: active) {

            html[data-internet-required="true"]
            .internet-required-page {
              forced-color-adjust: none !important;
            }

            html[data-internet-required="true"]
            .internet-required-card {
              forced-color-adjust: none !important;
            }

            html[data-internet-required="true"]
            .internet-required-button {
              forced-color-adjust: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default InternetRequired;