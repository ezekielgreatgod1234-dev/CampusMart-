import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../context/firebase";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiX, FiCheck } from "react-icons/fi";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AnnouncementBanner() {
  const { firebaseUser, profile } = useAuth();

  const [banner, setBanner] = useState(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isAdmin =
    (firebaseUser?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    profile?.role === "admin" ||
    profile?.isAdmin === true ||
    (Array.isArray(profile?.roles) && profile.roles.includes("admin"));

  const dismissKey = (announcementId) =>
    `cm_banner_done_${announcementId || "latest"}`;

  useEffect(() => {
    // No banner for guests or admins
    if (!firebaseUser || isAdmin) {
      setBanner(null);
      setVisible(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "settings", "liveBanner"),
      (snap) => {
        if (!snap.exists()) {
          setBanner(null);
          setVisible(false);
          return;
        }

        const data = snap.data() || {};
        if (data.active !== true) {
          setBanner(null);
          setVisible(false);
          return;
        }

        const id = data.announcementId || "latest";
        try {
          if (localStorage.getItem(dismissKey(id)) === "1") {
            setBanner(null);
            setVisible(false);
            return;
          }
        } catch {}

        setBanner({
          announcementId: id,
          title: data.title || "CampusMart Announcement",
          bannerMessage:
            data.bannerMessage ||
            "We've sent an announcement to your email. Please also check your Junk / Spam folder if you don't see it in your inbox.",
        });
        requestAnimationFrame(() => setVisible(true));
      },
      (err) => console.error("liveBanner:", err)
    );

    return () => unsub();
  }, [firebaseUser, isAdmin]);

  const handleDone = () => {
    if (!banner) return;
    try {
      localStorage.setItem(dismissKey(banner.announcementId), "1");
    } catch {}
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      setBanner(null);
    }, 280);
  };

  if (!firebaseUser || isAdmin || !banner || !visible) return null;

  return (
    <div className="fixed z-[200] left-0 right-0 top-0 flex justify-center pointer-events-none px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={`pointer-events-auto w-full max-w-xl rounded-2xl border border-green-100 bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
          leaving ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{ animation: leaving ? undefined : "cmSlideDown 0.35s ease-out" }}
      >
        <style>{`
          @keyframes cmSlideDown {
            from { transform: translateY(-120%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div className="h-1.5 w-full bg-[#008236]" />
        <div className="p-4 sm:p-5 flex gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center shrink-0 border border-green-100">
            <FiMail size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{banner.title}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
              {banner.bannerMessage}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">
              Tip: open your inbox and also check <strong>Junk / Spam</strong>.
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleDone}
                className="h-9 px-4 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <FiCheck size={14} />
                Done
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementBanner;