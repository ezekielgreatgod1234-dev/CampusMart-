import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import ProductCard from "../../components/dashboard/ProductCard";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "../../context/firebase";

import {
  FiSearch,
  FiX,
  FiStar,
  FiChevronDown,
  FiCheck,
  FiRefreshCw,
  FiTag,
  FiPackage,
} from "react-icons/fi";

const PAGE_SIZE = 20;

const SERVICE_CATEGORIES = [
  "All",
  "Online Services",
  "Barbing",
  "Photography",
  "Tutoring",
  "Graphics Design",
  "Programming",
  "Repairs",
  "Cleaning",
  "Delivery",
  "Beauty & Makeup",
  "Tailoring",
  "Writing",
  "Music",
  "Other",
];

const PRODUCT_CATEGORIES = [
  "All",
  "Phone",
  "Fashion",
  "Books",
  "Electronics",
  "Food",
  "Accessories",
  "Audio",
  "Gifts",
];

function BrowseProducts({
  cartCount = 0,
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    searchParams.get("tab") === "services" ? "services" : "products";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [sortBy, setSortBy] = useState("Newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);

  const categories =
    activeTab === "services" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES;
  const sortOptions = ["Newest", "Lowest Price", "Highest Price", "Top Rated"];

  const search = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category");
  const selectedCategory = categories.includes(urlCategory)
    ? urlCategory
    : "All";

  const getNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
    const n = Number(String(value).replace(/[₦,\s]/g, "").trim());
    return Number.isFinite(n) ? n : fallback;
  };

  const getTimestamp = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    if (typeof value === "object" && value.seconds !== undefined) {
      return Number(value.seconds) * 1000;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const isCurrentlyBoosted = (item) => {
    if (item?.isPromoted !== true) return false;
    const until = item.promotedUntil;
    if (!until) return false;
    let untilMs = 0;
    if (typeof until.toMillis === "function") untilMs = until.toMillis();
    else if (until.seconds != null) untilMs = Number(until.seconds) * 1000;
    else untilMs = new Date(until).getTime() || 0;
    return untilMs > Date.now();
  };

  const getPromotedAtMs = (item) => {
    const at = item?.promotedAt;
    if (!at) return 0;
    if (typeof at.toMillis === "function") return at.toMillis();
    if (at.seconds != null) return Number(at.seconds) * 1000;
    return new Date(at).getTime() || 0;
  };

  const mapDoc = (d, kind) => {
    const data = d.data() || {};
    let images = [];
    if (Array.isArray(data.images)) images = data.images.filter(Boolean);
    if (data.image) images.unshift(data.image);
    if (data.imageUrl) images.unshift(data.imageUrl);
    images = [...new Set(images.filter(Boolean))];

    return {
      id: d.id,
      kind,
      ...data,
      name: data.name || data.title || "Untitled",
      description: data.description || "",
      category: data.category || "Other",
      price: getNumber(data.price),
      rating: getNumber(data.rating),
      image: images[0] || null,
      images,
      sellerId: data.sellerId || data.providerId || "",
      sellerName: data.sellerName || data.providerName || "CampusMart",
      status: String(data.status || "active").toLowerCase(),
      _createdAt: getTimestamp(data.createdAt),
      isPromoted: data.isPromoted === true,
      promotedUntil: data.promotedUntil || null,
      promotedAt: data.promotedAt || null,
    };
  };

  const isActive = (item) =>
    !["deleted", "inactive", "archived"].includes(
      String(item.status || "active").toLowerCase()
    );

  const collectionName = activeTab === "services" ? "services" : "products";

  const loadItems = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) setLoadingMore(true);
        else {
          setLoading(true);
          setError("");
        }

        let q;
        try {
          if (isLoadMore && lastDoc) {
            q = query(
              collection(db, collectionName),
              orderBy("createdAt", "desc"),
              startAfter(lastDoc),
              limit(PAGE_SIZE)
            );
          } else {
            q = query(
              collection(db, collectionName),
              orderBy("createdAt", "desc"),
              limit(PAGE_SIZE)
            );
          }
        } catch {
          q = query(collection(db, collectionName), limit(PAGE_SIZE));
        }

        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch {
          snapshot = await getDocs(
            query(collection(db, collectionName), limit(PAGE_SIZE))
          );
        }

        const batch = snapshot.docs
          .map((d) => mapDoc(d, activeTab === "services" ? "service" : "product"))
          .filter(isActive);

        setLastDoc(
          snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null
        );
        setHasMore(snapshot.docs.length >= PAGE_SIZE);
        setItems((prev) => (isLoadMore ? [...prev, ...batch] : batch));
      } catch (err) {
        console.error(err);
        setError("Could not load items. Check your connection.");
        if (!isLoadMore) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, collectionName, lastDoc]
  );

  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    setItems([]);
    loadItems(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const highestPrice = useMemo(() => {
    if (!items.length) return 1000000;
    const highest = Math.max(...items.map((i) => getNumber(i.price)));
    return Math.max(1000000, Math.ceil(highest / 100000) * 100000);
  }, [items]);

  useEffect(() => {
    if (items.length > 0 && maxPrice === null) setMaxPrice(highestPrice);
  }, [items, highestPrice, maxPrice]);

  const setTab = (tab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "services") params.set("tab", "services");
    else params.delete("tab");
    params.delete("category");
    setSearchParams(params);
    setMaxPrice(null);
    setMinRating(0);
    setSortBy("Newest");
  };

  const handleSearchChange = (e) => {
    const params = new URLSearchParams(searchParams);
    if (!e.target.value.trim()) params.delete("search");
    else params.set("search", e.target.value);
    setSearchParams(params);
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category === "All") params.delete("category");
    else params.set("category", category);
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (activeTab === "services") params.set("tab", "services");
    setSearchParams(params);
    setMaxPrice(highestPrice);
    setMinRating(0);
    setSortBy("Newest");
    setFilterOpen(false);
  };

  let filtered = items.filter((item) => {
    const price = getNumber(item.price);
    const name = String(item.name || "").toLowerCase();
    const description = String(item.description || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory.toLowerCase();
    const matchesSearch =
      !q ||
      name.includes(q) ||
      description.includes(q) ||
      category.includes(q);
    const matchesPrice = maxPrice === null || price <= maxPrice;
    const matchesRating = getNumber(item.rating) >= minRating;

    return matchesCategory && matchesSearch && matchesPrice && matchesRating;
  });

  filtered = [...filtered].sort((a, b) => {
    const aB = isCurrentlyBoosted(a);
    const bB = isCurrentlyBoosted(b);
    if (aB && !bB) return -1;
    if (!aB && bB) return 1;
    if (aB && bB) return getPromotedAtMs(b) - getPromotedAtMs(a);
    if (sortBy === "Lowest Price") return getNumber(a.price) - getNumber(b.price);
    if (sortBy === "Highest Price") return getNumber(b.price) - getNumber(a.price);
    if (sortBy === "Top Rated") return getNumber(b.rating) - getNumber(a.rating);
    return (b._createdAt || 0) - (a._createdAt || 0);
  });

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {activeTab === "services" ? "Browse Services" : "Browse Products"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "services"
                ? "Find campus skills — barbing, design, tutoring, and more."
                : "Discover products from students around campus."}
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={
                activeTab === "services"
                  ? "Search services..."
                  : "Search products..."
              }
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        {/* Products / Services tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-gray-100 w-fit">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === "products"
                ? "bg-[#008236] text-white"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            <FiPackage size={16} />
            Products
          </button>
          <button
            type="button"
            onClick={() => setTab("services")}
            className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              activeTab === "services"
                ? "bg-[#008236] text-white"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            <FiTag size={16} />
            Services
          </button>
        </div>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Categories</h2>
            <span className="text-sm text-gray-500">{items.length} loaded</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              {selectedCategory === "All"
                ? activeTab === "services"
                  ? "All Services"
                  : "All Products"
                : selectedCategory}
            </h2>
            <p className="text-sm text-gray-500">
              Showing {filtered.length} of {items.length} loaded
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                className="min-w-[160px] flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold text-green-700"
              >
                <span>{sortBy}</span>
                <FiChevronDown
                  className={sortOpen ? "rotate-180" : ""}
                  size={17}
                />
              </button>
              {sortOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setSortOpen(false)}
                  />
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-green-100 rounded-xl shadow-xl p-1.5">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortBy(option);
                          setSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm ${
                          sortBy === option
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-green-50"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && <FiCheck size={17} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold"
            >
              Filters
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <p className="text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLastDoc(null);
                loadItems(false);
              }}
              className="mt-4 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((item) =>
                activeTab === "services" ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/services/${item.id}`)}
                    className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-green-100 transition"
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiTag className="text-gray-300" size={32} />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold">
                        Service
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] text-green-600 font-medium truncate">
                        {item.category}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 mt-0.5">
                        {item.name}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-2">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {item.sellerName}
                      </p>
                    </div>
                  </button>
                ) : (
                  <ProductCard
                    key={item.id}
                    product={item}
                    addToCart={addToCart}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                  />
                )
              )}
            </section>

            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => loadItems(true)}
                  className="h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <FiSearch size={26} className="mx-auto text-gray-400" />
            <h3 className="text-lg font-semibold mt-4">Nothing found</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Filters</h2>
              <button type="button" onClick={() => setFilterOpen(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="mt-8">
              <h3 className="font-semibold">Category</h3>
              <div className="space-y-3 mt-4">
                {categories.map((c) => (
                  <label key={c} className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedCategory === c}
                      onChange={() => handleCategoryChange(c)}
                      className="accent-green-600"
                    />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between">
                <h3 className="font-semibold">Max price</h3>
                <span className="text-sm text-green-600">
                  ₦{(maxPrice ?? highestPrice).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={highestPrice}
                step="1000"
                value={maxPrice ?? highestPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full mt-4 accent-green-600"
              />
            </div>
            <div className="flex gap-3 mt-10">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 border py-3 rounded-xl"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default BrowseProducts;