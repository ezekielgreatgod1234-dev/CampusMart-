import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiUser,
  FiSend,
  FiLoader,
  FiTrash2,
  FiEdit3,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";

function GigDetail({ cartCount = 0, profile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [closingGig, setClosingGig] = useState(false);

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showDeadlineEditor, setShowDeadlineEditor] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newDeadline, setNewDeadline] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const [proposal, setProposal] = useState({
    message: "",
    proposedPrice: "",
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const isOwner = firebaseUser && gig?.posterId === firebaseUser.uid;

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    window.setTimeout(() => {
      setToast({ open: false, message: "", type: "success" });
    }, 2800);
  };

  const getDeadlineDate = (deadline) => {
    if (!deadline) return null;
    try {
      if (deadline?.toDate) return deadline.toDate();
      if (deadline instanceof Date) return deadline;
      const parsed = new Date(deadline);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    } catch (error) {
      console.error("Error parsing deadline:", error);
    }
    return null;
  };

  const deadlineDate = getDeadlineDate(gig?.deadline);

  const isExpired =
    deadlineDate &&
    deadlineDate.getTime() < Date.now() &&
    gig?.applicationOpen !== false &&
    gig?.status !== "completed" &&
    gig?.status !== "closed";

  const applicationClosed =
    gig?.applicationOpen === false ||
    gig?.status === "completed" ||
    gig?.status === "closed" ||
    !!isExpired;

  const formatDeadline = (deadline) => {
    const date = getDeadlineDate(deadline);
    if (!date) return "No deadline set";
    return date.toLocaleString("en-NG", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatNaira = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Negotiable";
    }
    if (typeof value === "number") {
      return `₦${value.toLocaleString("en-NG")}`;
    }
    const stringValue = String(value).trim();
    if (!stringValue) return "Negotiable";

    const cleanedValue = stringValue
      .replace(/₦/g, "")
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .trim();

    const numericValue = Number(cleanedValue);
    if (!Number.isNaN(numericValue)) {
      return `₦${numericValue.toLocaleString("en-NG")}`;
    }
    return stringValue.replace(/\$/g, "₦");
  };

  /**
   * Live-format proposed price input: digits only → ₦12,500 style
   */
  const handleProposedPriceChange = (raw) => {
    const digits = String(raw || "").replace(/[^\d]/g, "");
    if (!digits) {
      setProposal((p) => ({ ...p, proposedPrice: "" }));
      return;
    }
    const num = Number(digits);
    if (Number.isNaN(num)) {
      setProposal((p) => ({ ...p, proposedPrice: "" }));
      return;
    }
    setProposal((p) => ({
      ...p,
      proposedPrice: `₦${num.toLocaleString("en-NG")}`,
    }));
  };

  const getDateTimeLocalValue = (deadline) => {
    const date = getDeadlineDate(deadline);
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch gig
  useEffect(() => {
    const fetchGig = async () => {
      try {
        const snap = await getDoc(doc(db, "gigs", id));
        if (snap.exists()) {
          setGig({ id: snap.id, ...snap.data() });
        } else {
          setGig(null);
        }
      } catch (error) {
        console.error("Error fetching gig:", error);
        setGig(null);
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id]);

  // Check if current user already applied
  useEffect(() => {
    if (!firebaseUser?.uid || !id) {
      setAlreadyApplied(false);
      setCheckingApplication(false);
      return;
    }

    setCheckingApplication(true);

    const q = query(
      collection(db, "gigApplications"),
      where("gigId", "==", id),
      where("applicantId", "==", firebaseUser.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAlreadyApplied(!snap.empty);
        setCheckingApplication(false);
      },
      (err) => {
        console.error("Check application error:", err);
        // fallback one-shot
        getDocs(q)
          .then((snap) => {
            setAlreadyApplied(!snap.empty);
          })
          .catch(() => setAlreadyApplied(false))
          .finally(() => setCheckingApplication(false));
      },
    );

    return () => unsub();
  }, [firebaseUser?.uid, id]);

  const handleApply = async (e) => {
    e.preventDefault();

    if (!firebaseUser) {
      showToast("Please log in to apply for this gig.", "error");
      return;
    }
    if (!gig) {
      showToast("This gig is no longer available.", "error");
      return;
    }
    if (gig.posterId === firebaseUser.uid) {
      showToast("You cannot apply to your own gig.", "error");
      return;
    }
    if (alreadyApplied) {
      showToast("You already applied for this gig.", "error");
      setShowApplyForm(false);
      return;
    }

    const currentDeadline = getDeadlineDate(gig.deadline);

    if (
      gig.applicationOpen === false ||
      gig.status === "completed" ||
      gig.status === "closed"
    ) {
      showToast("Applications for this gig are closed.", "error");
      setShowApplyForm(false);
      return;
    }

    if (currentDeadline && currentDeadline.getTime() < Date.now()) {
      showToast(
        "The application deadline has passed. Please wait for the poster to extend the deadline.",
        "error",
      );
      setShowApplyForm(false);
      return;
    }

    setApplying(true);

    try {
      const applicantName =
        profile?.fullName ||
        profile?.displayName ||
        firebaseUser.displayName ||
        "CampusMart User";

      const applicantImage =
        profile?.profileImage ||
        profile?.photoURL ||
        firebaseUser.photoURL ||
        null;

      // Store numeric proposed price when possible
      let priceToSave = proposal.proposedPrice.trim() || null;
      if (priceToSave) {
        const cleaned = priceToSave.replace(/[^\d]/g, "");
        if (cleaned) priceToSave = Number(cleaned);
      }

      await addDoc(collection(db, "gigApplications"), {
        gigId: id,
        applicantId: firebaseUser.uid,
        applicantName,
        applicantImage,
        message: proposal.message.trim(),
        proposedPrice: priceToSave,
        proposedPriceDisplay: priceToSave ? formatNaira(priceToSave) : null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "gigs", id), {
        applicationsCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      setAlreadyApplied(true);
      setShowApplyForm(false);
      setProposal({ message: "", proposedPrice: "" });
      setGig((prev) =>
        prev
          ? {
              ...prev,
              applicationsCount: (prev.applicationsCount || 0) + 1,
            }
          : prev,
      );

      showToast("Application sent successfully!", "success");
    } catch (error) {
      console.error("Error applying:", error);
      showToast("Failed to send application. Please try again.", "error");
    } finally {
      setApplying(false);
    }
  };

  const handleOpenDeadlineEditor = () => {
    setNewDeadline(getDateTimeLocalValue(gig?.deadline));
    setShowDeadlineEditor(true);
  };

  const handleUpdateDeadline = async (e) => {
    e.preventDefault();

    if (!firebaseUser || !isOwner) {
      showToast(
        "Only the person who posted this gig can change the deadline.",
        "error",
      );
      return;
    }
    if (!newDeadline) {
      showToast("Please select a new deadline.", "error");
      return;
    }

    const selectedDate = new Date(newDeadline);
    if (Number.isNaN(selectedDate.getTime())) {
      showToast("Please enter a valid deadline.", "error");
      return;
    }
    if (selectedDate.getTime() <= Date.now()) {
      showToast(
        "Please choose a future date and time for the new deadline.",
        "error",
      );
      return;
    }

    setSavingDeadline(true);
    try {
      await updateDoc(doc(db, "gigs", id), {
        deadline: selectedDate.toISOString(),
        applicationOpen: true,
        status: "open",
        updatedAt: serverTimestamp(),
      });

      setGig((prev) =>
        prev
          ? {
              ...prev,
              deadline: selectedDate.toISOString(),
              applicationOpen: true,
              status: "open",
            }
          : prev,
      );
      setShowDeadlineEditor(false);
      showToast(
        "Deadline updated successfully. Applications are open again.",
        "success",
      );
    } catch (error) {
      console.error("Error updating deadline:", error);
      showToast("Failed to update the deadline. Please try again.", "error");
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleCloseGig = () => {
    if (!firebaseUser || !isOwner) {
      showToast("Only the person who posted this gig can close it.", "error");
      return;
    }
    setShowCloseModal(true);
  };

  const confirmCloseGig = async () => {
    setClosingGig(true);
    try {
      await updateDoc(doc(db, "gigs", id), {
        applicationOpen: false,
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setGig((prev) =>
        prev
          ? {
              ...prev,
              applicationOpen: false,
              status: "completed",
            }
          : prev,
      );
      setShowApplyForm(false);
      setShowCloseModal(false);
      showToast(
        "Your gig has been marked as completed. Applications are now closed.",
        "success",
      );
    } catch (error) {
      console.error("Error closing gig:", error);
      showToast(
        "We couldn't close the gig right now. Please try again.",
        "error",
      );
    } finally {
      setClosingGig(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "gigs", id));
      showToast("Gig deleted successfully.", "success");
      setTimeout(() => navigate("/gigs"), 600);
    } catch (error) {
      console.error("Error deleting gig:", error);
      showToast("We couldn't delete this gig. Please try again.", "error");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading gig...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!gig) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Gig not found</p>
          <Link
            to="/gigs"
            className="text-green-600 font-medium hover:underline"
          >
            Back to Gigs
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const canApply =
    !isOwner && !applicationClosed && !alreadyApplied && !checkingApplication;

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Toast */}
        {toast.open && (
          <div
            className={`fixed top-4 right-4 z-[120] max-w-sm rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
              toast.type === "error"
                ? "bg-red-50 border-red-100 text-red-700"
                : "bg-green-50 border-green-100 text-green-800"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (location.state?.fromSellerGigs) {
                  navigate("/seller-dashboard", { state: { fromGigs: true } });
                } else {
                  navigate("/gigs");
                }
              }}
              className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-1">
                {gig.title}
              </h1>
              <p className="text-sm text-gray-500">
                Posted by {gig.posterName || "Student"}
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#008236] text-white hover:bg-[#006f2e] text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FiTrash2 size={16} />
              {deleting ? "Deleting..." : "Delete Gig"}
            </button>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full">
              {gig.category}
            </span>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                gig.status === "completed" || gig.status === "closed"
                  ? "bg-green-100 text-green-700"
                  : isExpired
                    ? "bg-orange-50 text-orange-700"
                    : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {gig.status === "completed"
                ? "Completed"
                : gig.status === "closed"
                  ? "Closed"
                  : isExpired
                    ? "Deadline Passed"
                    : gig.status || "Open"}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">{gig.title}</h2>

          <div className="flex flex-col gap-3 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-2">
              <FiDollarSign size={16} className="text-green-600 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">Budget:</span>{" "}
                {formatNaira(gig.budget)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <FiClock size={16} className="text-green-600 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">Deadline:</span>{" "}
                {formatDeadline(gig.deadline)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <FiMapPin size={16} className="text-green-600 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">Location:</span>{" "}
                {gig.location || "Campus"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <FiUser size={16} className="text-green-600 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">Posted by:</span>{" "}
                {gig.posterName || "Student"}
              </span>
            </span>
          </div>

          {isExpired && (
            <div className="mb-6 flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
              <FiAlertCircle
                className="text-orange-600 mt-0.5 shrink-0"
                size={19}
              />
              <div>
                <p className="font-medium text-orange-800 text-sm">
                  Application deadline has passed
                </p>
                <p className="text-orange-700 text-sm mt-1">
                  Applications are currently closed. The poster can extend the
                  deadline if the work is still available.
                </p>
              </div>
            </div>
          )}

          {!isExpired &&
            (gig.status === "completed" ||
              gig.status === "closed" ||
              gig.applicationOpen === false) && (
              <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                <FiCheckCircle
                  className="text-green-600 mt-0.5 shrink-0"
                  size={19}
                />
                <div>
                  <p className="font-medium text-green-800 text-sm">
                    Applications are closed
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    This gig is no longer accepting applications.
                  </p>
                </div>
              </div>
            )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {gig.description}
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {gig.applicationsCount || 0} student
            {(gig.applicationsCount || 0) !== 1 ? "s" : ""} have applied
          </p>

          {/* OWNER VIEW */}
          {isOwner ? (
            <div className="space-y-4">
              <div
                className={`rounded-xl px-4 py-4 border ${
                  isExpired
                    ? "bg-orange-50 border-orange-100"
                    : "bg-green-50 border-green-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isExpired ? (
                    <FiAlertCircle
                      className="text-orange-600 mt-0.5 shrink-0"
                      size={20}
                    />
                  ) : gig.status === "completed" || gig.status === "closed" ? (
                    <FiCheckCircle
                      className="text-green-600 mt-0.5 shrink-0"
                      size={20}
                    />
                  ) : (
                    <FiClock
                      className="text-green-600 mt-0.5 shrink-0"
                      size={20}
                    />
                  )}
                  <div>
                    <p
                      className={`font-medium text-sm ${
                        isExpired ? "text-orange-800" : "text-green-800"
                      }`}
                    >
                      {isExpired
                        ? "Your gig deadline has passed"
                        : gig.status === "completed" || gig.status === "closed"
                          ? "This gig is closed"
                          : "This is your gig"}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isExpired ? "text-orange-700" : "text-green-700"
                      }`}
                    >
                      {isExpired
                        ? "If the work is finished, close the gig. If you still need someone, extend the deadline."
                        : gig.status === "completed" || gig.status === "closed"
                          ? "Applications are no longer being accepted for this gig."
                          : "You can manage your applications and deadline from here."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/gigs/applications"
                  className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-medium px-4 py-3 rounded-xl transition shadow-sm"
                >
                  <FiUser size={16} />
                  View Applications
                </Link>

                <button
                  type="button"
                  onClick={handleOpenDeadlineEditor}
                  className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-medium px-4 py-3 rounded-xl transition shadow-sm"
                >
                  {isExpired ? (
                    <FiRefreshCw size={16} />
                  ) : (
                    <FiEdit3 size={16} />
                  )}
                  {isExpired ? "Extend Deadline" : "Edit Deadline"}
                </button>

                {gig.status !== "completed" &&
                  gig.status !== "closed" &&
                  gig.applicationOpen !== false && (
                    <button
                      type="button"
                      onClick={handleCloseGig}
                      disabled={closingGig}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white text-sm font-medium px-4 py-3 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
                    >
                      {closingGig ? (
                        <>
                          <FiLoader className="animate-spin" size={16} />
                          Closing Gig...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={16} />
                          Work Completed — Close Applications
                        </>
                      )}
                    </button>
                  )}
              </div>

              {showDeadlineEditor && (
                <form
                  onSubmit={handleUpdateDeadline}
                  className="border border-green-100 rounded-2xl p-5 bg-green-50/40"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {isExpired
                          ? "Extend Gig Deadline"
                          : "Edit Gig Deadline"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isExpired
                          ? "If you still need the work completed, choose a new deadline below."
                          : "Choose the new date and time for this gig."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeadlineEditor(false)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 transition"
                    >
                      ×
                    </button>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    min={getDateTimeLocalValue(new Date(Date.now() + 60000))}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={savingDeadline}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition"
                    >
                      {savingDeadline ? (
                        <>
                          <FiLoader className="animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw size={16} />
                          {isExpired
                            ? "Extend & Reopen Applications"
                            : "Save New Deadline"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeadlineEditor(false)}
                      className="flex-1 py-3 border border-green-200 rounded-xl text-green-700 font-medium hover:bg-green-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !showApplyForm ? (
            /* APPLICANT VIEW */
            alreadyApplied ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-[#008236] font-medium px-6 py-3 rounded-xl cursor-not-allowed"
              >
                <FiCheckCircle size={16} />
                You already applied
              </button>
            ) : applicationClosed ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 font-medium px-6 py-3 rounded-xl cursor-not-allowed"
              >
                <FiXCircle size={16} />
                Application Closed
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowApplyForm(true)}
                disabled={!canApply || checkingApplication}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-6 py-3 rounded-xl transition disabled:cursor-not-allowed"
              >
                {checkingApplication ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Checking...
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    Apply for this Gig
                  </>
                )}
              </button>
            )
          ) : (
            /* APPLY FORM */
            <form
              onSubmit={handleApply}
              className="border border-green-100 rounded-2xl p-5 bg-green-50/40"
            >
              <h3 className="font-semibold text-gray-800 mb-4">
                Send your proposal
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={proposal.message}
                  disabled={applying || alreadyApplied}
                  onChange={(e) =>
                    setProposal({ ...proposal, message: e.target.value })
                  }
                  placeholder="Introduce yourself and explain why you're a good fit..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none bg-white disabled:opacity-60"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your proposed price (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={proposal.proposedPrice}
                  disabled={applying || alreadyApplied}
                  onChange={(e) => handleProposedPriceChange(e.target.value)}
                  placeholder="e.g. ₦9,500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white disabled:opacity-60"
                />
                {proposal.proposedPrice && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Will be submitted as{" "}
                    <span className="font-semibold text-[#008236]">
                      {formatNaira(proposal.proposedPrice)}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={applying || alreadyApplied}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition"
                >
                  {applying ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Sending...
                    </>
                  ) : alreadyApplied ? (
                    "Already applied"
                  ) : (
                    "Submit Application"
                  )}
                </button>
                <button
                  type="button"
                  disabled={applying}
                  onClick={() => setShowApplyForm(false)}
                  className="flex-1 py-3 border border-green-200 rounded-xl text-green-700 font-medium hover:bg-green-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Close completion modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => !closingGig && setShowCloseModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <FiCheckCircle size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Mark this gig as completed?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              If the work has been completed, you can close applications for
              this gig. Students will no longer be able to apply.
            </p>
            <p className="text-sm text-gray-500 mt-3">
              If the work is not finished yet, choose
              <span className="font-medium text-green-600">
                {" "}
                Extend Deadline
              </span>{" "}
              instead.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                disabled={closingGig}
                className="flex-1 py-3 border border-green-200 rounded-xl text-green-700 font-medium hover:bg-green-50 transition disabled:opacity-50"
              >
                Not Yet
              </button>
              <button
                type="button"
                onClick={confirmCloseGig}
                disabled={closingGig}
                className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {closingGig ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Closing...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    Yes, Complete Gig
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal — CampusMart green */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <FiTrash2 size={22} className="text-[#008236]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Delete this gig?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              This will permanently remove{" "}
              <span className="font-semibold text-gray-800">“{gig.title}”</span>{" "}
              from CampusMart. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default GigDetail;
