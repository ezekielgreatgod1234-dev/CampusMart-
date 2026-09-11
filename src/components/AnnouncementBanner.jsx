import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { FiX } from "react-icons/fi";

import { db } from "../context/firebase";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AnnouncementBanner() {
  const { firebaseUser, profile } = useAuth();
  const location = useLocation();

  const [globalTicker, setGlobalTicker] = useState(null);
  const [privateTicker, setPrivateTicker] = useState(null);

  const [privateTickerLoaded, setPrivateTickerLoaded] = useState(false);
  const [globalTickerLoaded, setGlobalTickerLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showAfterLogin, setShowAfterLogin] = useState(false);

  // Only show on Dashboard
  const isDashboard =
    location.pathname === "/dashboard" ||
    location.pathname === "/" ||
    location.pathname === "/home";

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
  // LOGIN DELAY (2 seconds)
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

    // Reset on new login
    setShowAfterLogin(false);
    setGlobalTicker(null);
    setPrivateTicker(null);
    setPrivateTickerLoaded(false);
    setGlobalTickerLoaded(false);
    setDismissed(false);

    const timer = setTimeout(() => {
      setShowAfterLogin(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [firebaseUser?.uid]);

  // =========================================================
  // GLOBAL TICKER
  // =========================================================

  useEffect(() => {
    if (!firebaseUser?.uid || !showAfterLogin || isAdmin) {
      if (isAdmin) {
        setGlobalTicker(null);
        setGlobalTickerLoaded(true);
      }
      return;
    }

    const tickerRef = doc(db, "settings", "liveTicker");

    const unsubscribe = onSnapshot(
      tickerRef,
      (snap) => {
        setGlobalTickerLoaded(true);

        if (!snap.exists()) {
          setGlobalTicker(null);
          return;
        }

        const data = snap.data() || {};
        const message = String(data.message || "").trim();

        if (data.active !== true || !message) {
          setGlobalTicker(null);
          return;
        }

        const tickerId = data.updatedAt?.seconds
          ? `global-${data.updatedAt.seconds}-${data.updatedAt.nanoseconds || 0}`
          : `global-${message}`;

        setGlobalTicker({
          id: tickerId,
          message,
        });

        setDismissed(false);
      },
      (error) => {
        console.error("Global ticker listener error:", error);
        setGlobalTicker(null);
        setGlobalTickerLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid, showAfterLogin, isAdmin]);

  // =========================================================
  // PRIVATE TICKER
  // =========================================================

  useEffect(() => {
    if (!firebaseUser?.uid || !showAfterLogin || isAdmin) {
      if (isAdmin) {
        setPrivateTicker(null);
        setPrivateTickerLoaded(true);
      } else {
        setPrivateTickerLoaded(false);
      }
      return;
    }

    setPrivateTickerLoaded(false);

    const privateTickerRef = doc(db, "userTickers", firebaseUser.uid);

    const unsubscribe = onSnapshot(
      privateTickerRef,
      (snap) => {
        setPrivateTickerLoaded(true);

        if (!snap.exists()) {
          setPrivateTicker(null);
          return;
        }

        const data = snap.data() || {};
        const message = String(data.message || "").trim();

        if (data.active !== true || !message) {
          setPrivateTicker(null);
          return;
        }

        const tickerId = data.updatedAt?.seconds
          ? `private-${data.updatedAt.seconds}-${data.updatedAt.nanoseconds || 0}`
          : `private-${message}-${firebaseUser.uid}`;

        setPrivateTicker({
          id: tickerId,
          message,
        });

        setDismissed(false);
      },
      (error) => {
        console.error("PRIVATE TICKER LISTENER ERROR:", error);
        setPrivateTicker(null);
        setPrivateTickerLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid, showAfterLogin, isAdmin]);

  // =========================================================
  // EARLY RETURNS
  // =========================================================

  // Not logged in
  if (!firebaseUser?.uid) return null;

  // Still in the 2-second delay
  if (!showAfterLogin) return null;

  // Admin never sees it
  if (isAdmin) return null;

  // Only show on Dashboard
  if (!isDashboard) return null;

  // User dismissed it
  if (dismissed) return null;

  // Wait until we know if private ticker exists
  if (!privateTickerLoaded) return null;

  // =========================================================
  // CHOOSE WHICH TICKER TO SHOW
  // =========================================================

  let activeTicker = null;

  if (privateTicker) {
    activeTicker = privateTicker;
  } else if (globalTickerLoaded && globalTicker) {
    activeTicker = globalTicker;
  }

  if (!activeTicker) return null;

  // =========================================================
  // RENDER
  // =========================================================

  const line = `${activeTicker.message}   •   `;
  const repeated = line.repeat(8);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[40] bg-[#008236] text-white shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
      <div className="relative flex items-center h-10 sm:h-11 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <div
            key={activeTicker.id}
            className="campusmart-ticker whitespace-nowrap text-sm font-medium py-2.5 pl-3"
          >
            {repeated}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 h-full px-3 sm:px-4 hover:bg-white/10 transition z-10 border-l border-white/15 flex items-center justify-center"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <FiX size={16} />
        </button>
      </div>

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
          animation: campusmart-ticker-scroll 160s linear infinite;
          will-change: transform;
        }

        .campusmart-ticker:hover {
          animation-play-state: paused;
        }

        /* Much slower on mobile */
        @media (max-width: 640px) {
          .campusmart-ticker {
            animation-duration: 220s;
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