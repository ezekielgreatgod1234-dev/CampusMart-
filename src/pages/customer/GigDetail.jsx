import { useState, useEffect, useRef } from "react";
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
  FiPaperclip,
  FiX,
  FiFileText,
  FiImage,
  FiExternalLink,
} from "react-icons/fi";

const CLOUDINARY_CLOUD_NAME =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) ||
  "";
const CLOUDINARY_UPLOAD_PRESET =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) ||
  "";

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
  const [showEditGig, setShowEditGig] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "Programming",
    budget: "",
    deadline: "",
    location: "",
    requirements: "",
    eligibility: "",
  });


  const [newDeadline, setNewDeadline] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const [proposal, setProposal] = useState({
    message: "",
    proposedPrice: "",
  });

  // slotId -> { file, previewUrl, name, kind }
  const [attachFiles, setAttachFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRefs = useRef({});
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Owner: list of applications with attachments
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

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
    if (!date) {
      if (typeof deadline === "string" && deadline.trim()) return deadline;
      return "No deadline set";
    }
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


  const formatUploadedLabel = (label, fileName) => {
    let raw = String(label || "").trim();
    if (!raw) raw = String(fileName || "file").trim() || "file";
    raw = raw.replace(/^upload\s+(your\s+)?/i, "").trim();
    if (!raw) raw = "file";
    const pretty = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (/^uploaded\b/i.test(pretty)) return pretty;
    return `Uploaded ${pretty}`;
  };

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

  const requireAttachment = gig?.requireAttachment === true;

  // New multi-slot format; fall back to single legacy slot
  const attachmentSlots = (() => {
    if (Array.isArray(gig?.attachmentSlots) && gig.attachmentSlots.length) {
      return gig.attachmentSlots.map((s, i) => ({
        id: String(s.id || `slot-${i}`),
        label: String(s.label || `File ${i + 1}`).trim() || `File ${i + 1}`,
        allowedTypes: Array.isArray(s.allowedTypes)
          ? s.allowedTypes.map((t) => String(t).toLowerCase())
          : ["jpg", "png", "pdf"],
      }));
    }
    if (requireAttachment) {
      const types = Array.isArray(gig?.allowedFileTypes)
        ? gig.allowedFileTypes.map((t) => String(t).toLowerCase())
        : ["jpg", "png", "pdf"];
      return [
        {
          id: "default",
          label: "Upload required file",
          allowedTypes: types.length ? types : ["jpg", "png", "pdf"],
        },
      ];
    }
    return [];
  })();

  const acceptForTypes = (types) => {
    const parts = [];
    const t = (types || []).map((x) => String(x).toLowerCase());
    if (t.includes("jpg") || t.includes("jpeg")) {
      parts.push("image/jpeg", ".jpg", ".jpeg");
    }
    if (t.includes("png")) parts.push("image/png", ".png");
    if (t.includes("pdf")) parts.push("application/pdf", ".pdf");
    return (
      parts.join(",") ||
      "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
    );
  };

  const detectKind = (file) => {
    const type = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (type.includes("png") || name.endsWith(".png")) return "png";
    if (
      type.includes("jpeg") ||
      type.includes("jpg") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg")
    )
      return "jpg";
    if (type.startsWith("image/")) return "jpg";
    return "file";
  };

  const isTypeAllowedForSlot = (kind, allowedTypes) => {
    const t = (allowedTypes || []).map((x) => String(x).toLowerCase());
    if (kind === "jpg" || kind === "jpeg") {
      return t.includes("jpg") || t.includes("jpeg");
    }
    return t.includes(kind);
  };

  const clearAttachSlot = (slotId) => {
    setAttachFiles((prev) => {
      const cur = prev[slotId];
      if (cur?.previewUrl) {
        try {
          URL.revokeObjectURL(cur.previewUrl);
        } catch (_) {}
      }
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId].value = "";
    }
  };

  const clearAllAttaches = () => {
    Object.keys(attachFiles).forEach((id) => clearAttachSlot(id));
    setAttachFiles({});
  };

  const handleFilePick = (slotId, allowedTypes, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const kind = detectKind(file);
    if (!isTypeAllowedForSlot(kind, allowedTypes)) {
      showToast(
        `This file only accepts: ${(allowedTypes || [])
          .map((t) => String(t).toUpperCase())
          .join(", ")}`,
        "error"
      );
      e.target.value = "";
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      showToast(
        "File is too large. Maximum size is 1MB. Please compress or choose a smaller file.",
        "error"
      );
      e.target.value = "";
      return;
    }

    clearAttachSlot(slotId);
    const isImg = kind === "jpg" || kind === "png";
    setAttachFiles((prev) => ({
      ...prev,
      [slotId]: {
        file,
        name: file.name,
        kind,
        previewUrl: isImg ? URL.createObjectURL(file) : null,
      },
    }));
  };

  const uploadToCloudinary = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
      );
    }
    const kind = detectKind(file);
    const resourceType = kind === "pdf" ? "raw" : "image";
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "campusmart/gig-applications");

    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data?.error?.message || data?.message || "Upload failed"
      );
    }
    const url = data.secure_url || data.url;
    if (!url) throw new Error("Upload succeeded but no URL returned");
    return { url, kind, name: file.name, mime: file.type || "" };
  };

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
      where("applicantId", "==", firebaseUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAlreadyApplied(!snap.empty);
        setCheckingApplication(false);
      },
      (err) => {
        console.error("Check application error:", err);
        getDocs(q)
          .then((snap) => setAlreadyApplied(!snap.empty))
          .catch(() => setAlreadyApplied(false))
          .finally(() => setCheckingApplication(false));
      }
    );

    return () => unsub();
  }, [firebaseUser?.uid, id]);

  // Owner loads applications on this page too
  useEffect(() => {
    if (!isOwner || !id) {
      setApplications([]);
      return;
    }
    setAppsLoading(true);
    const q = query(
      collection(db, "gigApplications"),
      where("gigId", "==", id)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const at = a.createdAt?.seconds || 0;
          const bt = b.createdAt?.seconds || 0;
          return bt - at;
        });
        setApplications(list);
        setAppsLoading(false);
      },
      () => {
        setApplications([]);
        setAppsLoading(false);
      }
    );
    return () => unsub();
  }, [isOwner, id]);

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

    if (
      gig.applicationOpen === false ||
      gig.status === "completed" ||
      gig.status === "closed"
    ) {
      showToast("Applications for this gig are closed.", "error");
      setShowApplyForm(false);
      return;
    }

    const currentDeadline = getDeadlineDate(gig.deadline);
    if (currentDeadline && currentDeadline.getTime() < Date.now()) {
      showToast(
        "The application deadline has passed. Please wait for the poster to extend the deadline.",
        "error"
      );
      setShowApplyForm(false);
      return;
    }

    if (requireAttachment && attachmentSlots.length) {
      for (const slot of attachmentSlots) {
        if (!attachFiles[slot.id]?.file) {
          showToast(`Please upload: ${slot.label}`, "error");
          return;
        }
      }
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

      let priceToSave = proposal.proposedPrice.trim() || null;
      if (priceToSave) {
        const cleaned = priceToSave.replace(/[^\d]/g, "");
        if (cleaned) priceToSave = Number(cleaned);
      }

      const attachments = [];
      if (attachmentSlots.length) {
        setUploading(true);
        for (const slot of attachmentSlots) {
          const picked = attachFiles[slot.id];
          if (!picked?.file) continue;
          const uploaded = await uploadToCloudinary(picked.file);
          attachments.push({
            slotId: slot.id,
            label: slot.label,
            url: uploaded.url,
            name: uploaded.name,
            type: uploaded.kind,
            mime: uploaded.mime,
          });
        }
      }

      // Legacy single-file fields (first attachment) for older UIs
      const first = attachments[0] || null;

      await addDoc(collection(db, "gigApplications"), {
        gigId: id,
        applicantId: firebaseUser.uid,
        applicantName,
        applicantImage,
        message: proposal.message.trim(),
        proposedPrice: priceToSave,
        proposedPriceDisplay: priceToSave ? formatNaira(priceToSave) : null,
        attachments,
        attachmentUrl: first?.url || null,
        attachmentName: first?.name || null,
        attachmentType: first?.type || null,
        attachmentMime: first?.mime || null,
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
      clearAllAttaches();
      setGig((prev) =>
        prev
          ? {
              ...prev,
              applicationsCount: (prev.applicationsCount || 0) + 1,
            }
          : prev
      );

      showToast("Application sent successfully!", "success");
    } catch (error) {
      console.error("Error applying:", error);
      showToast(
        error?.message || "Failed to send application. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
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
        "error"
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
        "error"
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
          : prev
      );
      setShowDeadlineEditor(false);
      showToast(
        "Deadline updated successfully. Applications are open again.",
        "success"
      );
    } catch (error) {
      console.error("Error updating deadline:", error);
      showToast("Failed to update the deadline. Please try again.", "error");
    } finally {
      setSavingDeadline(false);
    }
  };


  const openEditGig = () => {
    if (!gig) return;
    setEditForm({
      title: gig.title || "",
      description: gig.description || "",
      category: gig.category || "Programming",
      budget:
        gig.budget === "Negotiable" || gig.budget == null
          ? ""
          : String(gig.budget),
      deadline: getDateTimeLocalValue(gig.deadline),
      location: gig.location || "",
      requirements: gig.requirements || "",
      eligibility: gig.eligibility || "",
    });
    setShowEditGig(true);
  };

  const handleSaveEditGig = async (e) => {
    e.preventDefault();
    if (!firebaseUser || !isOwner || !id) {
      showToast("Only the poster can edit this gig.", "error");
      return;
    }
    if (!editForm.title.trim() || !editForm.description.trim()) {
      showToast("Title and description are required.", "error");
      return;
    }
    if (!editForm.deadline) {
      showToast("Please choose a deadline.", "error");
      return;
    }
    const selectedDate = new Date(editForm.deadline);
    if (Number.isNaN(selectedDate.getTime())) {
      showToast("Please enter a valid deadline.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        budget: editForm.budget.trim() || "Negotiable",
        deadline: selectedDate.toISOString(),
        location: editForm.location.trim() || "Campus",
        requirements: editForm.requirements.trim() || "",
        eligibility: editForm.eligibility.trim() || "",
        applicationOpen: true,
        status: "open",
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "gigs", id), payload);
      setGig((prev) => (prev ? { ...prev, ...payload } : prev));
      setShowEditGig(false);
      showToast("Gig updated successfully.", "success");
    } catch (error) {
      console.error("Edit gig error:", error);
      showToast("Could not update gig. Please try again.", "error");
    } finally {
      setSavingEdit(false);
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
          : prev
      );
      setShowApplyForm(false);
      setShowCloseModal(false);
      showToast(
        "Your gig has been marked as completed. Applications are now closed.",
        "success"
      );
    } catch (error) {
      console.error("Error closing gig:", error);
      showToast(
        "We couldn't close the gig right now. Please try again.",
        "error"
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
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
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
            {requireAttachment && (
              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-1">
                <FiPaperclip size={12} />
                File required
              </span>
            )}
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

          {gig.requirements && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Requirements</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {gig.requirements}
              </p>
            </div>
          )}

          {gig.eligibility && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Eligibility</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {gig.eligibility}
              </p>
            </div>
          )}

          {requireAttachment && attachmentSlots.length > 0 && (
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold text-[#008236] flex items-center gap-1.5">
                <FiPaperclip size={15} />
                {attachmentSlots.length} file
                {attachmentSlots.length === 1 ? "" : "s"} required to apply
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                {attachmentSlots.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium">{s.label}</span>
                    {" — "}
                    {(s.allowedTypes || [])
                      .map((x) => String(x).toUpperCase())
                      .join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            {gig.applicationsCount || 0} student
            {(gig.applicationsCount || 0) !== 1 ? "s" : ""} have applied
          </p>

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
                          : "You can manage applications and deadline from here."}
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
                  My Applications
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
                          Work Completed, Close Applications
                        </>
                      )}
                    </button>
                  )}
              </div>

              {/* Applications on this gig (with files) */}
              <div className="mt-2 border border-gray-100 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Applications ({applications.length})
                </h3>
                {appsLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : applications.length === 0 ? (
                  <p className="text-sm text-gray-500">No applications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 text-[#008236] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                            {app.applicantImage ? (
                              <img
                                src={app.applicantImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              String(app.applicantName || "U")
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              {app.applicantName || "Applicant"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">
                              {app.message}
                            </p>
                            {app.proposedPriceDisplay ||
                            app.proposedPrice != null ? (
                              <p className="text-xs font-semibold text-[#008236] mt-1">
                                Proposed:{" "}
                                {app.proposedPriceDisplay ||
                                  formatNaira(app.proposedPrice)}
                              </p>
                            ) : null}
                            {Array.isArray(app.attachments) &&
                            app.attachments.length > 0
                              ? app.attachments.map((att, idx) => (
                                  <button
                                    key={att.slotId || idx}
                                    type="button"
                                    onClick={() =>
                                      openAttachment(att.url, att.type, att.name || att.label)
                                    }
                                    className="mt-2 mr-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#008236] hover:underline"
                                  >
                                    {String(att.type || "")
                                      .toLowerCase()
                                      .includes("pdf") ? (
                                      <FiFileText size={14} />
                                    ) : (
                                      <FiImage size={14} />
                                    )}
                                    {formatUploadedLabel(att.label, att.name)}
                                    <FiExternalLink size={12} />
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
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#008236] hover:underline"
                                  >
                                    {String(app.attachmentType || "")
                                      .toLowerCase()
                                      .includes("pdf") ? (
                                      <FiFileText size={14} />
                                    ) : (
                                      <FiImage size={14} />
                                    )}
                                    {formatUploadedLabel(null, app.attachmentName)}
                                    <FiExternalLink size={12} />
                                  </button>
                                )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        Choose the new date and time for this gig.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeadlineEditor(false)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500"
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

              <div className="mb-4">
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
              </div>

              {attachmentSlots.length > 0 && (
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Required files{" "}
                    <span className="text-red-500">*</span>
                  </p>
                  {attachmentSlots.map((slot) => {
                    const picked = attachFiles[slot.id];
                    return (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-green-100 bg-white p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {slot.label}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Allowed:{" "}
                              {(slot.allowedTypes || [])
                                .map((x) => String(x).toUpperCase())
                                .join(", ") || "JPG, PNG, PDF"}
                              {" · Max 1MB"}
                            </p>
                          </div>
                        </div>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[slot.id] = el;
                          }}
                          type="file"
                          accept={acceptForTypes(slot.allowedTypes)}
                          className="hidden"
                          onChange={(e) =>
                            handleFilePick(slot.id, slot.allowedTypes, e)
                          }
                          disabled={applying}
                        />
                        {!picked ? (
                          <button
                            type="button"
                            onClick={() =>
                              fileInputRefs.current[slot.id]?.click()
                            }
                            disabled={applying}
                            className="w-full h-10 rounded-xl border border-dashed border-green-300 bg-green-50/40 text-sm font-semibold text-[#008236] flex items-center justify-center gap-2 hover:bg-green-50"
                          >
                            <FiPaperclip size={15} />
                            Choose file
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/30 px-3 py-2">
                            {picked.previewUrl ? (
                              <img
                                src={picked.previewUrl}
                                alt=""
                                className="w-11 h-11 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-green-50 text-[#008236] flex items-center justify-center">
                                <FiFileText size={18} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {picked.name}
                              </p>
                              <p className="text-xs text-gray-500 uppercase">
                                {picked.kind}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => clearAttachSlot(slot.id)}
                              className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-gray-500"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={
                    applying ||
                    alreadyApplied ||
                    uploading ||
                    (requireAttachment &&
                      attachmentSlots.some((s) => !attachFiles[s.id]?.file))
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition"
                >
                  {applying || uploading ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      {uploading ? "Uploading..." : "Sending..."}
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
                  onClick={() => {
                    setShowApplyForm(false);
                    clearAllAttaches();
                  }}
                  className="flex-1 py-3 border border-green-200 rounded-xl text-green-700 font-medium hover:bg-green-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

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
              Students will no longer be able to apply.
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
              <span className="font-semibold text-gray-800">“{gig.title}”</span>
              . This cannot be undone.
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

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
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
    </CustomerLayout>
  );
}

export default GigDetail;