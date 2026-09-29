import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  FiArrowLeft,
  FiMessageCircle,
  FiClock,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiPaperclip,
  FiFileText,
  FiImage,
  FiExternalLink,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

/** Turn poster label into "Uploaded CV" style */
function formatUploadedLabel(label, fileName) {
  let raw = String(label || "").trim();
  if (!raw) {
    raw = String(fileName || "file").trim() || "file";
  }
  // strip leading "upload" / "upload your" instructions
  raw = raw.replace(/^upload\s+(your\s+)?/i, "").trim();
  if (!raw) raw = "file";
  // Title-ish case first letter
  const pretty = raw.charAt(0).toUpperCase() + raw.slice(1);
  if (/^uploaded\b/i.test(pretty)) return pretty;
  return `Uploaded ${pretty}`;
}

function MyGigApplications({ cartCount = 0, profile }) {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [myGigs, setMyGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGigId, setSelectedGigId] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chattingId, setChattingId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const filterRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const gigsQuery = query(
      collection(db, "gigs"),
      where("posterId", "==", firebaseUser.uid)
    );

    const unsub = onSnapshot(gigsQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyGigs(list);
    });

    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || myGigs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const gigIds = myGigs.map((g) => g.id);

    const appsQuery = query(
      collection(db, "gigApplications"),
      where("gigId", "in", gigIds.slice(0, 30))
    );

    const unsub = onSnapshot(
      appsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        list.sort((a, b) => {
          const aT = a.createdAt?.toMillis?.() || 0;
          const bT = b.createdAt?.toMillis?.() || 0;
          return bT - aT;
        });

        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [firebaseUser, myGigs]);

  const filteredApps =
    selectedGigId === "all"
      ? applications
      : applications.filter((a) => a.gigId === selectedGigId);

  const getGigTitle = (gigId) => {
    const gig = myGigs.find((g) => g.id === gigId);
    return gig?.title || "Unknown Gig";
  };

  const selectedGigLabel =
    selectedGigId === "all"
      ? "All Gigs"
      : getGigTitle(selectedGigId);

  const isMobileDevice = () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent || "" : ""
    );

  /**
   * Open an uploaded applicant file.
   * We never force a Cloudinary "attachment" download — that sends a
   * Content-Disposition: attachment header, which most mobile browsers
   * treat as a silent download and show as a blank tab instead of the
   * file. Letting the browser open the plain URL directly lets it show
   * PDFs/images in its own built-in viewer; anything it truly can't
   * preview (e.g. .docx) it just downloads normally with a filename,
   * instead of going blank.
   */
  const openAttachment = (url, type, fileName) => {
    if (!url) return;

    const t = String(type || "").toLowerCase();
    const isImage =
      t === "jpg" ||
      t === "jpeg" ||
      t === "png" ||
      t === "image" ||
      t.startsWith("image");

    // Desktop images still get the in-app lightbox for a nicer preview.
    if (!isMobileDevice() && isImage) {
      setLightboxUrl(url);
      return;
    }

    // Open the URL exactly as stored — do NOT rewrite/insert Cloudinary
    // transformation flags (fl_attachment, fl_inline, etc). Cloudinary
    // "raw" uploads (most non-image files, e.g. PDFs from a resume
    // upload) don't support delivery flags at all, and if the URL is
    // signed, changing it even slightly invalidates the signature —
    // both cases come back as an HTTP 400 "page isn't working" error.
    // The untouched URL already has the correct Content-Type, which is
    // all that's needed for the browser to preview or download it.
    const openUrl = String(url);

    const win = window.open(openUrl, "_blank", "noopener,noreferrer");

    // Some in-app/mobile browsers block window.open or silently no-op it
    // (that's the other common cause of a "blank" result). Fall back to
    // a normal same-tab navigation so the file still opens.
    if (!win) {
      window.location.href = openUrl;
    }
  };


  const formatProposed = (app) => {
    if (app.proposedPriceDisplay) return app.proposedPriceDisplay;
    if (app.proposedPrice == null || app.proposedPrice === "") return null;
    if (typeof app.proposedPrice === "number") {
      return `₦${app.proposedPrice.toLocaleString("en-NG")}`;
    }
    return String(app.proposedPrice);
  };

  const startChat = async (application) => {
    if (!firebaseUser) {
      showToast("error", "You must be logged in.");
      return;
    }

    const otherId = String(application.applicantId || "").trim();
    if (!otherId) {
      showToast("error", "Applicant information is missing.");
      return;
    }

    if (otherId === String(firebaseUser.uid)) {
      showToast("error", "You cannot chat with yourself.");
      return;
    }

    setChattingId(application.id);

    const myUid = String(firebaseUser.uid);
    const participantIds = [myUid, otherId].sort();
    const conversationId = participantIds.join("_");
    const conversationRef = doc(db, "conversations", conversationId);

    try {
      const myName =
        profile?.fullName ||
        profile?.displayName ||
        firebaseUser.displayName ||
        "CampusMart User";

      const myImage =
        profile?.profileImage ||
        profile?.photoURL ||
        firebaseUser.photoURL ||
        null;

      const otherName = application.applicantName || "Student";
      const otherImage = application.applicantImage || null;
      const gigTitle = getGigTitle(application.gigId);

      await setDoc(
        conversationRef,
        {
          participants: participantIds,
          buyerId: myUid,
          sellerId: otherId,
          participantNames: {
            [myUid]: myName,
            [otherId]: otherName,
          },
          participantImages: {
            [myUid]: myImage,
            [otherId]: otherImage,
          },
          unreadCounts: {
            [myUid]: 0,
            [otherId]: 0,
          },
          onlineStatus: {
            [myUid]: true,
            [otherId]: false,
          },
          productId: null,
          productName: `Gig: ${gigTitle}`,
          updatedAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: 0,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      showToast(
        "error",
        error?.code === "permission-denied"
          ? "Permission denied. Please check Firestore rules."
          : "Could not start chat. Please try again."
      );
    } finally {
      setChattingId(null);
    }
  };

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6 relative">
        {toast && (
          <div className="fixed top-5 right-5 z-[200] animate-fade-in">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] max-w-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <FiCheckCircle size={18} className="text-green-600 shrink-0" />
              ) : (
                <FiAlertCircle size={18} className="text-red-600 shrink-0" />
              )}
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/gigs")}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Gig Applications
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              See who applied to the gigs you posted
            </p>
          </div>
        </div>

        {/* Custom green filter */}
        {myGigs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Filter by Gig
            </label>
            <div className="relative w-full sm:w-80" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                  filterOpen
                    ? "border-[#008236] ring-2 ring-green-100 bg-white text-gray-900"
                    : "border-gray-200 bg-white text-gray-800 hover:border-green-300"
                }`}
              >
                <span className="truncate text-left">{selectedGigLabel}</span>
                <FiChevronDown
                  size={18}
                  className={`text-[#008236] shrink-0 transition ${
                    filterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {filterOpen && (
                <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-green-100 bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGigId("all");
                      setFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition ${
                      selectedGigId === "all"
                        ? "bg-[#008236] text-white font-semibold"
                        : "text-gray-700 hover:bg-green-50 hover:text-[#008236]"
                    }`}
                  >
                    <span>All Gigs</span>
                    {selectedGigId === "all" && <FiCheck size={16} />}
                  </button>
                  {myGigs.map((gig) => {
                    const active = selectedGigId === gig.id;
                    return (
                      <button
                        key={gig.id}
                        type="button"
                        onClick={() => {
                          setSelectedGigId(gig.id);
                          setFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition ${
                          active
                            ? "bg-[#008236] text-white font-semibold"
                            : "text-gray-700 hover:bg-green-50 hover:text-[#008236]"
                        }`}
                      >
                        <span className="truncate">{gig.title || "Untitled"}</span>
                        {active && <FiCheck size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading applications...</p>
          </div>
        )}

        {!loading && filteredApps.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-500">
              {myGigs.length === 0
                ? "You haven't posted any gigs yet."
                : "No applications yet for this gig."}
            </p>
            <Link
              to="/gigs/create"
              className="inline-block mt-4 text-green-600 font-medium hover:underline"
            >
              Post a Gig
            </Link>
          </div>
        )}

        {!loading && filteredApps.length > 0 && (
          <div className="grid gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                        {getGigTitle(app.gigId)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                          app.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : app.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm overflow-hidden shrink-0">
                        {app.applicantImage ? (
                          <img
                            src={app.applicantImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (app.applicantName || "S")[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {app.applicantName || "Student"}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <FiClock size={11} />
                          Applied recently
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                      {app.message}
                    </p>

                    {formatProposed(app) && (
                      <p className="text-sm text-green-700 font-medium mt-2">
                        Proposed: {formatProposed(app)}
                      </p>
                    )}

                    {(Array.isArray(app.attachments) &&
                      app.attachments.length > 0) ||
                    app.attachmentUrl ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.isArray(app.attachments) &&
                        app.attachments.length > 0
                          ? app.attachments.map((att, idx) => (
                              <button
                                key={att.slotId || idx}
                                type="button"
                                onClick={() =>
                                  openAttachment(att.url, att.type, att.name || att.label)
                                }
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008236] bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg hover:bg-green-100"
                              >
                                {String(att.type || "")
                                  .toLowerCase()
                                  .includes("pdf") ? (
                                  <FiFileText size={13} />
                                ) : (
                                  <FiImage size={13} />
                                )}
                                {formatUploadedLabel(att.label, att.name)}
                                <FiExternalLink size={11} />
                              </button>
                            ))
                          : app.attachmentUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAttachment(
                                    app.attachmentUrl,
                                    app.attachmentType,
                                    app.attachmentName
                                  )
                                }
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008236] bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg hover:bg-green-100"
                              >
                                <FiPaperclip size={13} />
                                {formatUploadedLabel(
                                  null,
                                  app.attachmentName
                                )}
                                <FiExternalLink size={11} />
                              </button>
                            )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <button
                      type="button"
                      onClick={() => startChat(app)}
                      disabled={chattingId === app.id}
                      className="inline-flex items-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
                    >
                      {chattingId === app.id ? (
                        <>
                          <FiLoader className="animate-spin" size={16} />
                          Opening...
                        </>
                      ) : (
                        <>
                          <FiMessageCircle size={16} />
                          Chat
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
              onClick={() => setLightboxUrl(null)}
            >
              <FiX size={22} />
            </button>
            <img
              src={lightboxUrl}
              alt="Attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default MyGigApplications;