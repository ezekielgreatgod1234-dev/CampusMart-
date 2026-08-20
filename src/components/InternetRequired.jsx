import { useEffect, useRef, useState } from "react";

import {
  FiWifiOff,
  FiWifi,
  FiCheck,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";

function InternetRequired() {
  // =========================================================
  // CONNECTION STATES
  //
  // offline
  // checking
  // connected
  // online
  // =========================================================

  const [status, setStatus] = useState(() => {
    if (
      typeof navigator === "undefined" ||
      navigator.onLine
    ) {
      return "connected";
    }

    return "offline";
  });

  const [isChecking, setIsChecking] =
    useState(false);

  const mountedRef = useRef(true);

  const checkInProgressRef =
    useRef(false);

  const recoveryTimerRef =
    useRef(null);

  const pollingTimerRef =
    useRef(null);

  const abortControllerRef =
    useRef(null);

  // =========================================================
  // CHECK ACTUAL INTERNET CONNECTION
  //
  // IMPORTANT:
  //
  // navigator.onLine is NOT enough.
  //
  // On some phones:
  //
  // Wi-Fi/data can be disconnected
  // while navigator.onLine still says true.
  //
  // Therefore we actually contact an internet endpoint.
  // =========================================================

  const checkInternetConnection =
    async ({
      showChecking = false,
      allowRecoveryAnimation = true,
    } = {}) => {
      // -----------------------------------------------------
      // Prevent duplicate checks
      // -----------------------------------------------------

      if (checkInProgressRef.current) {
        return null;
      }

      checkInProgressRef.current = true;

      // -----------------------------------------------------
      // Cancel previous request if one exists
      // -----------------------------------------------------

      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {
          // Ignore abort errors.
        }
      }

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      let timeoutId = null;

      try {
        if (mountedRef.current && showChecking) {
          setIsChecking(true);
          setStatus("checking");
        }

        // ===================================================
        // FIRST CHECK BROWSER NETWORK STATE
        // ===================================================

        if (
          typeof navigator !== "undefined" &&
          navigator.onLine === false
        ) {
          if (mountedRef.current) {
            setIsChecking(false);
            setStatus("offline");
          }

          return false;
        }

        // ===================================================
        // TIMEOUT
        // ===================================================

        timeoutId = setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // Ignore abort errors.
          }
        }, 4000);

        // ===================================================
        // REAL INTERNET REQUEST
        //
        // generate_204 is a lightweight Google endpoint.
        //
        // no-cors allows this request from the browser without
        // needing CORS permission.
        //
        // cache-busting makes sure an old cached result is not
        // reused.
        // ===================================================

        const cacheBuster =
          Date.now();

        await fetch(
          `https://www.gstatic.com/generate_204?campusmart=${cacheBuster}`,
          {
            method: "GET",

            mode: "no-cors",

            cache: "no-store",

            credentials: "omit",

            redirect: "follow",

            signal:
              controller.signal,
          }
        );

        // ===================================================
        // REQUEST SUCCEEDED
        // ===================================================

        if (!mountedRef.current) {
          return true;
        }

        setIsChecking(false);

        // ---------------------------------------------------
        // If the overlay was already showing offline,
        // display the recovery sequence.
        // ---------------------------------------------------

        if (
          allowRecoveryAnimation &&
          statusRef.current === "offline"
        ) {
          setStatus("checking");

          /*
           * Give the user the requested:
           *
           * green dot
           * checking
           * connection restored
           */

          await new Promise(
            (resolve) => {
              setTimeout(
                resolve,
                500
              );
            }
          );

          if (!mountedRef.current) {
            return true;
          }

          setStatus("connected");

          if (
            recoveryTimerRef.current
          ) {
            clearTimeout(
              recoveryTimerRef.current
            );
          }

          recoveryTimerRef.current =
            setTimeout(() => {
              if (
                mountedRef.current
              ) {
                setStatus("online");
              }
            }, 1000);

          return true;
        }

        // ---------------------------------------------------
        // Normal successful check
        // ---------------------------------------------------

        if (mountedRef.current) {
          setStatus((currentStatus) => {
            if (
              currentStatus ===
              "offline"
            ) {
              return "checking";
            }

            return currentStatus ===
              "checking"
              ? "connected"
              : "online";
          });
        }

        return true;
      } catch (error) {
        // ===================================================
        // INTERNET REQUEST FAILED
        // ===================================================

        if (
          error?.name !==
          "AbortError"
        ) {
          console.warn(
            "CampusMart internet check failed:",
            error
          );
        }

        if (mountedRef.current) {
          setIsChecking(false);

          /*
           * This is the important part.
           *
           * Even if:
           *
           * navigator.onLine === true
           *
           * we still show the Internet Required screen
           * because the actual internet request failed.
           */

          setStatus("offline");
        }

        return false;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (
          abortControllerRef.current ===
          controller
        ) {
          abortControllerRef.current =
            null;
        }

        checkInProgressRef.current =
          false;
      }
    };

  // =========================================================
  // STATUS REF
  //
  // Allows the background network checker to know the
  // current status without depending on a stale closure.
  // =========================================================

  const statusRef =
    useRef(status);

  useEffect(() => {
    statusRef.current =
      status;
  }, [status]);

  // =========================================================
  // BACKGROUND INTERNET MONITOR
  //
  // THIS IS WHAT MAKES MOBILE DATA DETECTION WORK.
  //
  // navigator.onLine may remain TRUE when mobile data is
  // disabled.
  //
  // Therefore we continuously test actual internet access.
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    // =======================================================
    // INITIAL CHECK
    // =======================================================

    const initialCheck =
      async () => {
        if (
          typeof navigator !==
            "undefined" &&
          navigator.onLine === false
        ) {
          if (
            mountedRef.current
          ) {
            setStatus("offline");
          }

          return;
        }

        /*
         * Check silently at startup.
         */

        const result =
          await checkInternetConnection(
            {
              showChecking: false,
              allowRecoveryAnimation:
                false,
            }
          );

        if (
          mountedRef.current &&
          result === false
        ) {
          setStatus("offline");
        }
      };

    initialCheck();

    // =======================================================
    // OFFLINE EVENT
    // =======================================================

    const handleOffline =
      () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.log(
          "CampusMart: browser reports offline."
        );

        // Cancel recovery animation.
        if (
          recoveryTimerRef.current
        ) {
          clearTimeout(
            recoveryTimerRef.current
          );

          recoveryTimerRef.current =
            null;
        }

        // Cancel current internet request.
        if (
          abortControllerRef.current
        ) {
          try {
            abortControllerRef.current.abort();
          } catch {
            // Ignore.
          }

          abortControllerRef.current =
            null;
        }

        checkInProgressRef.current =
          false;

        setIsChecking(false);

        setStatus("offline");
      };

    // =======================================================
    // ONLINE EVENT
    // =======================================================

    const handleOnline =
      async () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.log(
          "CampusMart: browser reports online. Verifying..."
        );

        /*
         * Do NOT immediately hide the overlay.
         *
         * First verify that the internet actually works.
         */

        setStatus("checking");

        await checkInternetConnection(
          {
            showChecking: true,
            allowRecoveryAnimation:
              true,
          }
        );
      };

    // =======================================================
    // NETWORK INFORMATION API
    //
    // Some mobile browsers expose:
    //
    // navigator.connection
    //
    // It can tell us when the network type changes.
    //
    // This is an additional signal.
    // =======================================================

    const connection =
      navigator?.connection ||
      navigator?.mozConnection ||
      navigator?.webkitConnection ||
      null;

    const handleConnectionChange =
      () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        console.log(
          "CampusMart: network connection changed. Checking..."
        );

        /*
         * Check actual internet access instead of trusting
         * the network type.
         */

        checkInternetConnection(
          {
            showChecking: true,
            allowRecoveryAnimation:
              true,
          }
        );
      };

    // =======================================================
    // BROWSER EVENTS
    // =======================================================

    window.addEventListener(
      "offline",
      handleOffline
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    // =======================================================
    // NETWORK INFORMATION EVENT
    // =======================================================

    if (connection) {
      connection.addEventListener(
        "change",
        handleConnectionChange
      );
    }

    // =======================================================
    // CONTINUOUS INTERNET POLLING
    //
    // THIS IS THE MAIN FIX FOR MOBILE DATA.
    //
    // Every 2 seconds we actually test internet access.
    //
    // Example:
    //
    // User turns OFF mobile data.
    //
    // navigator.onLine may still say:
    //
    // true
    //
    // But:
    //
    // gstatic request fails
    //
    // => status becomes "offline"
    //
    // => InternetRequired screen appears.
    // =======================================================

    pollingTimerRef.current =
      setInterval(() => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        /*
         * Do not start another request if one is already
         * running.
         */

        if (
          checkInProgressRef.current
        ) {
          return;
        }

        checkInternetConnection(
          {
            showChecking: false,
            allowRecoveryAnimation:
              true,
          }
        );
      }, 2000);

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      mountedRef.current =
        false;

      window.removeEventListener(
        "offline",
        handleOffline
      );

      window.removeEventListener(
        "online",
        handleOnline
      );

      if (connection) {
        connection.removeEventListener(
          "change",
          handleConnectionChange
        );
      }

      if (
        pollingTimerRef.current
      ) {
        clearInterval(
          pollingTimerRef.current
        );

        pollingTimerRef.current =
          null;
      }

      if (
        recoveryTimerRef.current
      ) {
        clearTimeout(
          recoveryTimerRef.current
        );

        recoveryTimerRef.current =
          null;
      }

      if (
        abortControllerRef.current
      ) {
        try {
          abortControllerRef.current.abort();
        } catch {
          // Ignore.
        }

        abortControllerRef.current =
          null;
      }
    };
  }, []);

  // =========================================================
  // MANUAL RETRY
  // =========================================================

  const handleRetry =
    async () => {
      if (isChecking) {
        return;
      }

      setIsChecking(true);

      setStatus("checking");

      await checkInternetConnection(
        {
          showChecking: true,
          allowRecoveryAnimation:
            true,
        }
      );
    };

  // =========================================================
  // CONNECTION IS GOOD
  //
  // Remove the overlay and reveal the page underneath.
  //
  // IMPORTANT:
  //
  // The component remains mounted because only the rendered
  // UI returns null.
  //
  // Therefore the background internet monitor continues
  // checking even while the overlay is hidden.
  // =========================================================

  if (status === "online") {
    return null;
  }

  // =========================================================
  // CURRENT UI STATE
  // =========================================================

  const isOffline =
    status === "offline";

  const isCheckingState =
    status === "checking";

  const isConnected =
    status === "connected";

  // =========================================================
  // TEXT
  // =========================================================

  let title =
    "Waiting for connection...";

  let description =
    "CampusMart is waiting for your internet connection to return.";

  if (isCheckingState) {
    title =
      "Checking connection...";

    description =
      "Your network is back. CampusMart is checking that the internet is working.";
  }

  if (isConnected) {
    title =
      "Connection restored";

    description =
      "You're back online. Getting CampusMart ready...";
  }

  // =========================================================
  // STATUS LABEL
  // =========================================================

  let statusLabel =
    "No connection";

  if (isCheckingState) {
    statusLabel =
      "Checking connection";
  }

  if (isConnected) {
    statusLabel =
      "Connection restored";
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="internet-required-overlay"
      style={{
        position: "fixed",
        inset: 0,

        zIndex: 999999999,

        width: "100%",
        height: "100%",

        minHeight: "100vh",
        minHeight: "100dvh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "20px",

        boxSizing: "border-box",

        background:
          "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)",

        colorScheme: "light",

        overflowY: "auto",

        animation:
          "internetOverlayFadeIn 0.25s ease-out",
      }}
    >
      {/* =====================================================
          BACKGROUND CIRCLES
      ===================================================== */}

      <div
        style={{
          position: "absolute",

          width: "320px",
          height: "320px",

          borderRadius: "50%",

          background:
            "rgba(34, 197, 94, 0.08)",

          filter: "blur(70px)",

          top: "-150px",
          left: "-120px",

          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",

          width: "320px",
          height: "320px",

          borderRadius: "50%",

          background:
            "rgba(16, 185, 129, 0.08)",

          filter: "blur(70px)",

          bottom: "-150px",
          right: "-120px",

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          CARD
      ===================================================== */}

      <div
        style={{
          position: "relative",

          width: "100%",

          maxWidth: "450px",

          padding: "32px 28px",

          boxSizing: "border-box",

          backgroundColor:
            "rgba(255, 255, 255, 0.97)",

          border:
            "1px solid rgba(229, 231, 235, 0.9)",

          borderRadius: "28px",

          boxShadow:
            "0 25px 70px rgba(15, 23, 42, 0.12)",

          textAlign: "center",

          backdropFilter: "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
        }}
      >
        {/* ===================================================
            CAMPUSMART BRAND
        =================================================== */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            gap: "9px",

            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",

              borderRadius: "11px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background:
                "linear-gradient(135deg, #16a34a, #15803d)",

              color: "#ffffff",

              fontSize: "12px",

              fontWeight: 800,

              boxShadow:
                "0 7px 18px rgba(22, 163, 74, 0.22)",
            }}
          >
            CM
          </div>

          <span
            style={{
              color: "#166534",

              fontSize: "17px",

              fontWeight: 800,

              letterSpacing: "-0.3px",
            }}
          >
            CampusMart
          </span>
        </div>

        {/* ===================================================
            CONNECTION ICON
        =================================================== */}

        <div
          style={{
            position: "relative",

            width: "110px",
            height: "110px",

            margin: "0 auto",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            borderRadius: "50%",

            background:
              isConnected
                ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                : isCheckingState
                ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
                : "linear-gradient(135deg, #fef2f2, #fee2e2)",

            color:
              isConnected
                ? "#16a34a"
                : isCheckingState
                ? "#16a34a"
                : "#dc2626",

            boxShadow:
              isConnected
                ? "0 0 0 12px rgba(34, 197, 94, 0.05), 0 15px 35px rgba(22, 163, 74, 0.12)"
                : isCheckingState
                ? "0 0 0 12px rgba(34, 197, 94, 0.05), 0 15px 35px rgba(22, 163, 74, 0.10)"
                : "0 0 0 12px rgba(239, 68, 68, 0.04), 0 15px 35px rgba(239, 68, 68, 0.08)",

            transition:
              "all 0.35s ease",
          }}
        >
          {isConnected ? (
            <FiCheck
              size={50}
              strokeWidth={2.8}
              style={{
                animation:
                  "internetCheckAppear 0.35s ease-out",
              }}
            />
          ) : isCheckingState ? (
            <FiWifi
              size={48}
              style={{
                animation:
                  "internetWifiPulse 1.2s ease-in-out infinite",
              }}
            />
          ) : (
            <FiWifiOff
              size={48}
            />
          )}

          {/* =================================================
              STATUS DOT
          ================================================= */}

          <div
            style={{
              position: "absolute",

              right: "3px",
              bottom: "6px",

              width: "29px",
              height: "29px",

              borderRadius: "50%",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              backgroundColor:
                "#ffffff",

              boxShadow:
                "0 5px 15px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",

                borderRadius: "50%",

                backgroundColor:
                  isOffline
                    ? "#ef4444"
                    : "#22c55e",

                boxShadow:
                  isOffline
                    ? "0 0 0 4px rgba(239, 68, 68, 0.12)"
                    : "0 0 0 4px rgba(34, 197, 94, 0.12)",

                animation:
                  isOffline
                    ? "internetRedPulse 1.4s ease-in-out infinite"
                    : "internetGreenPulse 1.4s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* ===================================================
            TITLE
        =================================================== */}

        <h1
          style={{
            margin:
              "28px 0 0",

            color: "#111827",

            fontSize: "27px",

            lineHeight: "35px",

            fontWeight: 800,

            letterSpacing:
              "-0.6px",

            transition:
              "all 0.25s ease",
          }}
        >
          {title}
        </h1>

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <p
          style={{
            margin:
              "12px auto 0",

            maxWidth:
              "350px",

            color: "#6b7280",

            fontSize: "14px",

            lineHeight: "23px",
          }}
        >
          {description}
        </p>

        {/* ===================================================
            STATUS PILL
        =================================================== */}

        <div
          style={{
            display: "inline-flex",

            alignItems: "center",

            gap: "8px",

            marginTop: "22px",

            padding:
              "9px 14px",

            borderRadius:
              "9999px",

            backgroundColor:
              isOffline
                ? "#fef2f2"
                : "#f0fdf4",

            color:
              isOffline
                ? "#b91c1c"
                : "#15803d",

            fontSize: "12px",

            fontWeight: 700,

            border:
              isOffline
                ? "1px solid #fee2e2"
                : "1px solid #dcfce7",

            transition:
              "all 0.3s ease",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",

              borderRadius: "50%",

              backgroundColor:
                isOffline
                  ? "#ef4444"
                  : "#22c55e",

              animation:
                isOffline
                  ? "internetRedPulse 1.4s infinite"
                  : "internetGreenPulse 1.4s infinite",
            }}
          />

          {statusLabel}
        </div>

        {/* ===================================================
            WAITING MESSAGE
        =================================================== */}

        {isOffline && (
          <div
            style={{
              marginTop: "24px",

              padding:
                "15px 16px",

              borderRadius:
                "15px",

              backgroundColor:
                "#fafafa",

              border:
                "1px solid #f1f5f9",

              color: "#6b7280",

              fontSize: "12px",

              lineHeight: "20px",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                gap: "8px",
              }}
            >
              <span
                style={{
                  display:
                    "inline-flex",

                  gap: "3px",
                }}
              >
                <span
                  className="internetWaitingDot"
                />

                <span
                  className="internetWaitingDot"
                  style={{
                    animationDelay:
                      "0.2s",
                  }}
                />

                <span
                  className="internetWaitingDot"
                  style={{
                    animationDelay:
                      "0.4s",
                  }}
                />
              </span>

              <span>
                Waiting for your
                connection to return
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            CHECKING MESSAGE
        =================================================== */}

        {isCheckingState && (
          <div
            style={{
              marginTop: "24px",

              padding:
                "15px 16px",

              borderRadius:
                "15px",

              backgroundColor:
                "#f0fdf4",

              border:
                "1px solid #dcfce7",

              color: "#166534",

              fontSize: "12px",

              lineHeight: "20px",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                gap: "9px",
              }}
            >
              <FiRefreshCw
                size={14}
                style={{
                  animation:
                    "internetRequiredSpin 0.8s linear infinite",
                }}
              />

              <span>
                Verifying your internet
                connection...
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            CONNECTED MESSAGE
        =================================================== */}

        {isConnected && (
          <div
            style={{
              marginTop: "24px",

              padding:
                "15px 16px",

              borderRadius:
                "15px",

              backgroundColor:
                "#f0fdf4",

              border:
                "1px solid #bbf7d0",

              color: "#166534",

              fontSize: "12px",

              lineHeight: "20px",

              animation:
                "internetCheckAppear 0.35s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                gap: "8px",
              }}
            >
              <FiCheck
                size={16}
                strokeWidth={3}
              />

              <span>
                Internet connection is
                working properly
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            RETRY BUTTON
        =================================================== */}

        {isOffline && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isChecking}
            style={{
              width: "100%",

              marginTop: "20px",

              padding:
                "14px 20px",

              border: "none",

              borderRadius:
                "14px",

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              gap: "8px",

              backgroundColor:
                "#16a34a",

              color: "#ffffff",

              fontSize: "14px",

              fontWeight: 700,

              cursor: isChecking
                ? "not-allowed"
                : "pointer",

              boxShadow:
                "0 8px 20px rgba(22, 163, 74, 0.20)",

              transition:
                "all 0.2s ease",

              opacity: isChecking
                ? 0.7
                : 1,
            }}
          >
            <FiRefreshCw
              size={17}
              style={{
                animation: isChecking
                  ? "internetRequiredSpin 0.8s linear infinite"
                  : "none",
              }}
            />

            Check connection
          </button>
        )}

        {/* ===================================================
            SECURITY MESSAGE
        =================================================== */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent:
              "center",

            gap: "6px",

            marginTop:
              "20px",

            color: "#9ca3af",

            fontSize: "11px",
          }}
        >
          <FiShield
            size={13}
            style={{
              color: "#16a34a",
            }}
          />

          Your CampusMart data is safe
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style>
        {`
          @keyframes internetOverlayFadeIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes internetRedPulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }

            50% {
              transform: scale(1.3);
              opacity: 0.55;
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes internetGreenPulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }

            50% {
              transform: scale(1.18);
              opacity: 0.75;
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes internetRequiredSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes internetCheckAppear {
            from {
              opacity: 0;
              transform: scale(0.75);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes internetWifiPulse {
            0% {
              opacity: 0.65;
              transform: scale(0.95);
            }

            50% {
              opacity: 1;
              transform: scale(1.05);
            }

            100% {
              opacity: 0.65;
              transform: scale(0.95);
            }
          }

          .internetWaitingDot {
            width: 5px;
            height: 5px;

            display: inline-block;

            border-radius: 50%;

            background-color: #9ca3af;

            animation:
              internetWaitingAnimation
              1.2s infinite ease-in-out;
          }

          @keyframes internetWaitingAnimation {
            0% {
              opacity: 0.3;
              transform: translateY(0);
            }

            50% {
              opacity: 1;
              transform: translateY(-2px);
            }

            100% {
              opacity: 0.3;
              transform: translateY(0);
            }
          }

          @media (max-width: 480px) {
            .internet-required-overlay {
              padding: 16px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default InternetRequired;