import { useEffect, useState } from "react";
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
} from "react-icons/fi";

function MyGigApplications({ cartCount = 0, profile }) {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [myGigs, setMyGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGigId, setSelectedGigId] = useState("all");
  const [chattingId, setChattingId] = useState(null);

  // Custom toast state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load gigs posted by current user
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

  // Load applications for those gigs
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

  // FIXED startChat – no getDoc, just setDoc with merge
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

    // Only set the fields we need. DO NOT touch messages array.
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
        // Only set these if the document is new
        lastMessage: "",
        lastMessageAt: 0,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Navigate to the chat
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
        {/* Custom Toast */}
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
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
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

        {/* Filter by gig */}
        {myGigs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Filter by Gig
            </label>
            <select
              value={selectedGigId}
              onChange={(e) => setSelectedGigId(e.target.value)}
              className="w-full sm:w-80 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
            >
              <option value="all">All Gigs</option>
              {myGigs.map((gig) => (
                <option key={gig.id} value={gig.id}>
                  {gig.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading applications...</p>
          </div>
        )}

        {/* Empty */}
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

        {/* Applications list */}
        {!loading && filteredApps.length > 0 && (
          <div className="grid gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm overflow-hidden">
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

                    {app.proposedPrice && (
                      <p className="text-sm text-green-700 font-medium mt-2">
                        Proposed: {app.proposedPrice}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <button
                      onClick={() => startChat(app)}
                      disabled={chattingId === app.id}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
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
      </div>
    </CustomerLayout>
  );
}

export default MyGigApplications;