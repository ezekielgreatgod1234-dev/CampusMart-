import { useEffect, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

import {
  FiSearch,
  FiPlus,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiBriefcase,
  FiX,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";

function Gigs({ cartCount = 0 }) {
  const { firebaseUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("my"); // "my" | "other"

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    gigId: null,
    title: "",
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const categories = [
    "All",
    "Programming",
    "Graphics",
    "Photography",
    "Tutoring",
    "Repairs",
    "Delivery",
    "Others",
  ];

  const search = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category");
  const selectedCategory = categories.includes(urlCategory)
    ? urlCategory
    : "All";

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    window.setTimeout(() => {
      setToast({ open: false, message: "", type: "success" });
    }, 2800);
  };

  // Show styled success toast after posting a gig (or applying)
  useEffect(() => {
    if (location.state?.successMessage) {
      showToast(location.state.successMessage, "success");

      // Clear the state so the message doesn't reappear on refresh
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
  }, [location.state]);

  const formatNaira = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Negotiable";
    }
    if (typeof value === "number") {
      return `₦${value.toLocaleString("en-NG")}`;
    }
    const stringValue = String(value).trim();
    if (!stringValue) return "Negotiable";
    const cleaned = stringValue
      .replace(/₦/g, "")
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .trim();
    const numericValue = Number(cleaned);
    if (!Number.isNaN(numericValue)) {
      return `₦${numericValue.toLocaleString("en-NG")}`;
    }
    return stringValue.replace(/\$/g, "₦");
  };

  const formatDeadlineShort = (deadline) => {
    if (!deadline) return "No deadline";
    try {
      let date;
      if (deadline?.toDate) date = deadline.toDate();
      else if (deadline instanceof Date) date = deadline;
      else date = new Date(deadline);
      if (Number.isNaN(date.getTime())) return String(deadline);
      return date.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(deadline);
    }
  };

  useEffect(() => {
    setLoading(true);

    const gigsQuery = query(
      collection(db, "gigs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      gigsQuery,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            applications: data.applicationsCount || 0,
          };
        });
        setGigs(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading gigs:", error);
        setGigs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (!value.trim()) params.delete("search");
    else params.set("search", value);
    setSearchParams(params);
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category === "All") params.delete("category");
    else params.set("category", category);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setFilterOpen(false);
  };

  const openDeleteModal = (e, gig) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      open: true,
      gigId: gig.id,
      title: gig.title || "this gig",
    });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, gigId: null, title: "" });
  };

  const confirmDeleteGig = async () => {
    if (!deleteModal.gigId) return;

    setDeletingId(deleteModal.gigId);
    try {
      await deleteDoc(doc(db, "gigs", deleteModal.gigId));
      setDeleteModal({ open: false, gigId: null, title: "" });
      showToast("Gig deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting gig:", error);
      showToast("Failed to delete gig. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter by search + category
  const filteredGigs = gigs.filter((gig) => {
    const title = String(gig.title || "").toLowerCase();
    const description = String(gig.description || "").toLowerCase();
    const category = String(gig.category || "").toLowerCase();
    const searchValue = search.toLowerCase().trim();

    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      description.includes(searchValue) ||
      category.includes(searchValue);

    return matchesCategory && matchesSearch && gig.status !== "cancelled";
  });

  // Split
  const myGigs = filteredGigs.filter(
    (gig) => firebaseUser && gig.posterId === firebaseUser.uid
  );

  const otherGigs = filteredGigs.filter(
    (gig) => !firebaseUser || gig.posterId !== firebaseUser.uid
  );

  // What to show based on active tab
  const displayedGigs = activeTab === "my" ? myGigs : otherGigs;

  // Reusable card
  const GigCard = ({ gig, isOwner }) => (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition-all duration-200">
      <Link to={`/gigs/${gig.id}`} className="block pr-10">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg">
              {gig.title}
            </h3>
            <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">
              {gig.description}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full">
            {gig.category}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <FiDollarSign size={14} className="text-green-600" />
            {formatNaira(gig.budget)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiClock size={14} className="text-green-600" />
            {formatDeadlineShort(gig.deadline)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiMapPin size={14} className="text-green-600" />
            {gig.location || "Campus"}
          </span>
          <span className="ml-auto text-gray-400 text-xs">
            {gig.applications} application
            {gig.applications !== 1 ? "s" : ""}
          </span>
        </div>
      </Link>

      {isOwner && (
        <button
          type="button"
          onClick={(e) => openDeleteModal(e, gig)}
          disabled={deletingId === gig.id}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-green-50 text-[#008236] hover:bg-[#008236] hover:text-white border border-green-100 flex items-center justify-center transition disabled:opacity-50"
          title="Delete gig"
        >
          {deletingId === gig.id ? (
            <FiLoader size={16} className="animate-spin" />
          ) : (
            <FiTrash2 size={16} />
          )}
        </button>
      )}
    </div>
  );

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Campus Gigs
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Find jobs or post a gig for other students on campus.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-72 xl:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search gigs..."
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>

            <div className="flex gap-2">
              <Link
                to="/gigs/applications"
                className="inline-flex items-center justify-center gap-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap"
              >
                My Applications
              </Link>

              <Link
                to="/gigs/create"
                className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white px-5 py-3 rounded-xl text-sm font-medium transition shadow-sm whitespace-nowrap"
              >
                <FiPlus size={18} />
                Post a Gig
              </Link>
            </div>
          </div>
        </div>

        {search && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-sm text-green-700">
              Search results for{" "}
              <span className="font-semibold">&quot;{search}&quot;</span> —{" "}
              {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Categories */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Categories</h2>
            <span className="text-sm text-gray-500">
              {gigs.length} {gigs.length === 1 ? "gig" : "gigs"}
            </span>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-[#008236] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* ========== TAB BUTTONS ========== */}
        <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "my"
                ? "bg-[#008236] text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            My Gigs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("other")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "other"
                ? "bg-[#008236] text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            Other Campus Gigs
          </button>
        </div>

        {/* Filters button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition"
          >
            Filters
          </button>
        </div>

        {loading && (
          <section className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading gigs...</p>
          </section>
        )}

        {/* ========== GIGS LIST ========== */}
        {!loading && displayedGigs.length > 0 && (
          <div className="grid gap-4">
            {displayedGigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                isOwner={activeTab === "my"}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayedGigs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <FiBriefcase size={26} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              {activeTab === "my" ? "No gigs posted yet" : "No other gigs found"}
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              {activeTab === "my"
                ? "You haven't posted any gigs yet. Create one to get started."
                : search
                ? `We couldn't find any gigs matching "${search}".`
                : "There are no gigs from other students right now."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
              {search && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  Clear Search
                </button>
              )}
              {activeTab === "my" && (
                <Link
                  to="/gigs/create"
                  className="inline-flex items-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  <FiPlus size={16} />
                  Post a Gig
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                <p className="text-sm text-gray-500 mt-1">Refine your search</p>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-800">Category</h3>
              <div className="space-y-3 mt-4">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => handleCategoryChange(category)}
                      className="accent-green-600"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-green-600">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-green-50 hover:border-green-200 hover:text-green-600"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="flex-1 bg-[#008236] hover:bg-[#006f2e] text-white py-3 rounded-xl font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeDeleteModal}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <FiTrash2 size={22} className="text-[#008236]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Delete this gig?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              This will permanently remove{" "}
              <span className="font-semibold text-gray-800">
                “{deleteModal.title}”
              </span>{" "}
              from CampusMart. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteGig}
                disabled={!!deletingId}
                className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {deletingId ? (
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

export default Gigs;