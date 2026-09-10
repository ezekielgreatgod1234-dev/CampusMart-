import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { FiX } from "react-icons/fi";

import { db } from "../context/firebase";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AnnouncementBanner() {
  const { firebaseUser, profile } = useAuth();

  const [globalTicker, setGlobalTicker] = useState(null);
  const [privateTicker, setPrivateTicker] = useState(null);

  // ---------------------------------------------------------
  // IMPORTANT:
  // Track whether the private ticker has actually finished
  // loading. This prevents the global ticker from appearing
  // before we know whether this user has a private message.
  // ---------------------------------------------------------
  const [privateTickerLoaded, setPrivateTickerLoaded] =
    useState(false);

  const [globalTickerLoaded, setGlobalTickerLoaded] =
    useState(false);

  const [dismissed, setDismissed] = useState(false);

  // Wait 2 seconds after login
  const [showAfterLogin, setShowAfterLogin] =
    useState(false);

  // =========================================================
  // ADMIN CHECK
  // =========================================================

  const isAdmin =
    (firebaseUser?.email || "").toLowerCase().trim() ===
      ADMIN_EMAIL.toLowerCase() ||
    profile?.role === "admin" ||
    profile?.isAdmin === true ||
    (Array.isArray(profile?.roles) &&
      profile.roles.includes("admin"));

  // =========================================================
  // LOGIN DELAY
  // =========================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setShowAfterLogin(false);

      setGlobalTicker(null);
      setPrivateTicker(null);

      setPrivateTickerLoaded(false);
      setGlobalTickerLoaded(false);

      setDismissed(false);

      return;
    }

    // New account/login
    setShowAfterLogin(false);

    setGlobalTicker(null);
    setPrivateTicker(null);

    setPrivateTickerLoaded(false);
    setGlobalTickerLoaded(false);

    setDismissed(false);

    const timer = setTimeout(() => {
      setShowAfterLogin(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [firebaseUser?.uid]);

  // =========================================================
  // GLOBAL TICKER
  //
  // settings/liveTicker
  // =========================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      return;
    }

    if (!showAfterLogin) {
      return;
    }

    if (isAdmin) {
      setGlobalTicker(null);
      setGlobalTickerLoaded(true);
      return;
    }

    const tickerRef = doc(
      db,
      "settings",
      "liveTicker"
    );

    const unsubscribe = onSnapshot(
      tickerRef,
      (snap) => {
        setGlobalTickerLoaded(true);

        if (!snap.exists()) {
          setGlobalTicker(null);
          return;
        }

        const data = snap.data() || {};

        const message = String(
          data.message || ""
        ).trim();

        if (
          data.active !== true ||
          !message
        ) {
          setGlobalTicker(null);
          return;
        }

        const tickerId =
          data.updatedAt?.seconds
            ? `global-${data.updatedAt.seconds}-${data.updatedAt.nanoseconds || 0}`
            : `global-${message}`;

        setGlobalTicker({
          id: tickerId,
          message,
        });

        // New global ticker can be shown again
        setDismissed(false);
      },
      (error) => {
        console.error(
          "Global ticker listener error:",
          error
        );

        setGlobalTicker(null);
        setGlobalTickerLoaded(true);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    firebaseUser?.uid,
    showAfterLogin,
    isAdmin,
  ]);

  // =========================================================
  // PRIVATE TICKER
  //
  // userTickers/{firebaseUser.uid}
  //
  // THIS IS THE IMPORTANT PART.
  // =========================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setPrivateTickerLoaded(false);
      return;
    }

    if (!showAfterLogin) {
      setPrivateTickerLoaded(false);
      return;
    }

    if (isAdmin) {
      setPrivateTicker(null);
      setPrivateTickerLoaded(true);
      return;
    }

    // Every time we start listening for a new user,
    // mark the private ticker as loading.
    setPrivateTickerLoaded(false);

    const privateTickerRef = doc(
      db,
      "userTickers",
      firebaseUser.uid
    );

    console.log(
      "CampusMart: Listening for private ticker:",
      firebaseUser.uid
    );

    const unsubscribe = onSnapshot(
      privateTickerRef,
      (snap) => {
        // VERY IMPORTANT:
        // We now know whether this user has a private ticker.
        setPrivateTickerLoaded(true);

        if (!snap.exists()) {
          console.log(
            "CampusMart: No private ticker for this account."
          );

          setPrivateTicker(null);
          return;
        }

        const data = snap.data() || {};

        console.log(
          "CampusMart: Private ticker received:",
          data
        );

        const message = String(
          data.message || ""
        ).trim();

        // Private ticker exists but is inactive
        if (
          data.active !== true ||
          !message
        ) {
          setPrivateTicker(null);
          return;
        }

        const tickerId =
          data.updatedAt?.seconds
            ? `private-${data.updatedAt.seconds}-${data.updatedAt.nanoseconds || 0}`
            : `private-${message}-${firebaseUser.uid}`;

        setPrivateTicker({
          id: tickerId,
          message,
        });

        // A new private notification should always appear.
        setDismissed(false);
      },
      (error) => {
        console.error(
          "PRIVATE TICKER LISTENER ERROR:",
          error
        );

        setPrivateTicker(null);
        setPrivateTickerLoaded(true);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    firebaseUser?.uid,
    showAfterLogin,
    isAdmin,
  ]);

  // =========================================================
  // DO NOT SHOW WHILE LOGGING IN
  // =========================================================

  if (!firebaseUser?.uid) {
    return null;
  }

  if (!showAfterLogin) {
    return null;
  }

  if (isAdmin) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  // =========================================================
  // WAIT UNTIL PRIVATE TICKER HAS BEEN CHECKED
  //
  // This is the main fix.
  //
  // We don't show the global ticker until we know whether
  // this account has a private ticker.
  // =========================================================

  if (!privateTickerLoaded) {
    return null;
  }

  // =========================================================
  // PRIVATE TICKER HAS ABSOLUTE PRIORITY
  // =========================================================

  let activeTicker = null;

  if (privateTicker) {
    activeTicker = privateTicker;
  } else if (
    globalTickerLoaded &&
    globalTicker
  ) {
    activeTicker = globalTicker;
  }

  // Nothing active
  if (!activeTicker) {
    return null;
  }

  // =========================================================
  // REPEAT MESSAGE FOR SMOOTH CONTINUOUS SCROLL
  // =========================================================

  const line = `${activeTicker.message}   •   `;

  const repeated = line.repeat(8);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[40] bg-[#008236] text-white shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
      <div className="relative flex items-center h-10 sm:h-11 overflow-hidden">

        {/* ===================================================
            SCROLLING MESSAGE
           =================================================== */}

        <div className="flex-1 min-w-0 overflow-hidden relative">
          <div
            key={activeTicker.id}
            className="campusmart-ticker whitespace-nowrap text-sm font-medium py-2.5 pl-3"
          >
            {repeated}
          </div>
        </div>

        {/* ===================================================
            DISMISS
           =================================================== */}

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
          }}
          className="flex-shrink-0 h-full px-3 sm:px-4 hover:bg-white/10 transition z-10 border-l border-white/15 flex items-center justify-center"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* =====================================================
          TICKER ANIMATION
         ===================================================== */}

      <style>{`
        @keyframes campusmart-ticker-scroll {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        .campusmart-ticker {
          display: inline-block;
          min-width: 200%;
          animation: campusmart-ticker-scroll 130s linear infinite;
          will-change: transform;
        }

        .campusmart-ticker:hover {
          animation-play-state: paused;
        }

        @media (max-width: 640px) {
          .campusmart-ticker {
            animation-duration: 90s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .campusmart-ticker {
            animation: none;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default AnnouncementBanner;