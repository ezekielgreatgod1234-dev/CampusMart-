import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "react-icons/fi";

function GigDetail({ cartCount = 0, profile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [proposal, setProposal] = useState({
    message: "",
    proposedPrice: "",
  });

  const isOwner = firebaseUser && gig?.posterId === firebaseUser.uid;

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

  const handleApply = async (e) => {
    e.preventDefault();

    if (!firebaseUser) {
      alert("You must be logged in to apply.");
      return;
    }

    if (gig.posterId === firebaseUser.uid) {
      alert("You cannot apply to your own gig.");
      return;
    }

    setApplying(true);

    try {
      const applicantName =
        profile?.fullName ||
        profile?.displayName ||
        firebaseUser.displayName ||
        "CampusMart Student";

      const applicantImage =
        profile?.profileImage ||
        profile?.photoURL ||
        firebaseUser.photoURL ||
        null;

      await addDoc(collection(db, "gigApplications"), {
        gigId: id,
        applicantId: firebaseUser.uid,
        applicantName,
        applicantImage,
        message: proposal.message.trim(),
        proposedPrice: proposal.proposedPrice.trim() || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "gigs", id), {
        applicationsCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      alert("Application sent successfully!");
      setShowApplyForm(false);
      setProposal({ message: "", proposedPrice: "" });

      setGig((prev) =>
        prev
          ? { ...prev, applicationsCount: (prev.applicationsCount || 0) + 1 }
          : prev
      );
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to send application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "gigs", id));
      alert("Gig deleted successfully.");
      navigate("/gigs");
    } catch (error) {
      console.error("Error deleting gig:", error);
      alert("Failed to delete gig. Please try again.");
    } finally {
      setDeleting(false);
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

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-1">
                {gig.title}
              </h1>
              <p className="text-sm text-gray-500">
                Posted by {gig.posterName || "Student"}
              </p>
            </div>
          </div>

          {/* Delete button for owner */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition disabled:opacity-50"
            >
              <FiTrash2 size={16} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full">
              {gig.category}
            </span>
            <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full capitalize">
              {gig.status}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">{gig.title}</h2>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1.5">
              <FiDollarSign size={15} className="text-green-600" />
              {gig.budget || "Negotiable"}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock size={15} className="text-green-600" />
              {gig.deadline}
            </span>
            <span className="flex items-center gap-1.5">
              <FiMapPin size={15} className="text-green-600" />
              {gig.location || "Campus"}
            </span>
            <span className="flex items-center gap-1.5">
              <FiUser size={15} className="text-green-600" />
              {gig.posterName}
            </span>
          </div>

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

          {/* Owner view */}
          {isOwner ? (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4">
              <p className="text-sm text-green-800 mb-3">
                This is your gig. You cannot apply to it.
              </p>
              <Link
                to="/gigs/applications"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
              >
                View Applications
              </Link>
            </div>
          ) : !showApplyForm ? (
            /* Apply button for others */
            <button
              onClick={() => setShowApplyForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition"
            >
              <FiSend size={16} />
              Apply for this Gig
            </button>
          ) : (
            /* Apply form */
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
                  onChange={(e) =>
                    setProposal({ ...proposal, message: e.target.value })
                  }
                  placeholder="Introduce yourself and explain why you're a good fit..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none bg-white"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your proposed price (optional)
                </label>
                <input
                  type="text"
                  value={proposal.proposedPrice}
                  onChange={(e) =>
                    setProposal({ ...proposal, proposedPrice: e.target.value })
                  }
                  placeholder="e.g. ₦9,500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition"
                >
                  {applying ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Sending...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}

export default GigDetail;