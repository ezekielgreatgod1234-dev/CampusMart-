import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
} from "react-icons/fi";

function Gigs({ cartCount = 0 }) {
  const { firebaseUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDeleteGig = async (e, gigId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this gig?")) return;

    setDeletingId(gigId);
    try {
      await deleteDoc(doc(db, "gigs", gigId));
    } catch (error) {
      console.error("Error deleting gig:", error);
      alert("Failed to delete gig. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
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
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition shadow-sm whitespace-nowrap"
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
              <span className="font-semibold">"{search}"</span> —{" "}
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
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Results header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              {selectedCategory === "All"
                ? search
                  ? "Search Results"
                  : "All Gigs"
                : selectedCategory}
            </h2>
            <p className="text-sm text-gray-500">
              Showing {filteredGigs.length} of {gigs.length} gigs
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="shrink-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition"
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

        {!loading && filteredGigs.length > 0 && (
          <div className="grid gap-4">
            {filteredGigs.map((gig) => {
              const isOwner =
                firebaseUser && gig.posterId === firebaseUser.uid;

              return (
                <div
                  key={gig.id}
                  className="relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <Link to={`/gigs/${gig.id}`} className="block">
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
                        {gig.budget || "Negotiable"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock size={14} className="text-green-600" />
                        {gig.deadline}
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

                  {/* Delete button - only for poster */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGig(e, gig.id)}
                      disabled={deletingId === gig.id}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition disabled:opacity-50"
                      title="Delete gig"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredGigs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <FiBriefcase size={26} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              No gigs found
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              {search
                ? `We couldn't find any gigs matching "${search}".`
                : "Be the first to post a gig on campus."}
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
              <Link
                to="/gigs/create"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                <FiPlus size={16} />
                Post a Gig
              </Link>
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default Gigs;