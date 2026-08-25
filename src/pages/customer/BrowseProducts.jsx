import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import ProductCard from "../../components/dashboard/ProductCard";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../context/firebase";

import {
  FiSearch,
  FiX,
  FiStar,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

function BrowseProducts({
  cartCount = 0,
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [sortBy, setSortBy] = useState("Newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // null means "no maximum price filter"
  const [maxPrice, setMaxPrice] = useState(null);

  const [minRating, setMinRating] = useState(0);

  const categories = [
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

  const sortOptions = [
    "Newest",
    "Lowest Price",
    "Highest Price",
    "Top Rated",
  ];

  const search = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category");

  const selectedCategory = categories.includes(urlCategory)
    ? urlCategory
    : "All";

  // =====================================================
  // HELPERS
  // =====================================================

  const getNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }

    const number = Number(
      String(value)
        .replace(/[₦,\s]/g, "")
        .trim()
    );

    return Number.isFinite(number) ? number : fallback;
  };

  const getTimestamp = (value) => {
    if (!value) return 0;

    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }

    if (typeof value.toDate === "function") {
      return value.toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (
      typeof value === "object" &&
      value.seconds !== undefined
    ) {
      return (
        Number(value.seconds) * 1000 +
        Math.floor(
          Number(value.nanoseconds || 0) / 1000000
        )
      );
    }

    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getProductStock = (data) => {
    const fields = [
      data.stock,
      data.stockQuantity,
      data.quantity,
      data.inventory,
      data.availableStock,
      data.availableQuantity,
    ];

    for (const value of fields) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return Math.max(0, getNumber(value));
      }
    }

    const status = String(data.status || "").toLowerCase();
    const availability = String(
      data.availability || ""
    ).toLowerCase();

    if (
      status === "out of stock" ||
      status === "out_of_stock" ||
      status === "out-of-stock" ||
      availability === "unavailable"
    ) {
      return 0;
    }

    // Older products may not have a stock field.
    if (status === "active") {
      return 1;
    }

    return 0;
  };

  // =====================================================
  // REAL-TIME FIRESTORE PRODUCTS
  // =====================================================

  useEffect(() => {
    setProductsLoading(true);
    setProductsError("");

    const productsRef = collection(db, "products");

    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        try {
          const loadedProducts = snapshot.docs
            .map((productDoc) => {
              const data = productDoc.data();

              // -------------------------------
              // PRODUCT IMAGES
              // -------------------------------

              let images = [];

              if (Array.isArray(data.images)) {
                images = data.images.filter(Boolean);
              }

              if (data.image) {
                images.unshift(data.image);
              }

              if (data.imageUrl) {
                images.unshift(data.imageUrl);
              }

              images = [
                ...new Set(images.filter(Boolean)),
              ];

              // -------------------------------
              // PRODUCT INFORMATION
              // -------------------------------

              const stock = getProductStock(data);

              const status = String(
                data.status || "active"
              ).toLowerCase();

              const createdAt = data.createdAt || null;
              const updatedAt = data.updatedAt || null;

              return {
                id: productDoc.id,

                ...data,

                name:
                  data.name ||
                  "Untitled Product",

                description:
                  data.description || "",

                category:
                  data.category || "Other",

                price: getNumber(data.price),

                rating: getNumber(data.rating),

                reviews: getNumber(data.reviews),

                sales: getNumber(data.sales),

                image:
                  images[0] || null,

                images,

                sellerId:
                  data.sellerId || "",

                sellerName:
                  data.sellerName ||
                  "CampusMart Seller",

                sellerImage:
                  data.sellerImage || null,

                stock,

                quantity: stock,

                status,

                availability:
                  stock > 0
                    ? "available"
                    : "unavailable",

                createdAt,

                updatedAt,

                _createdAt:
                  getTimestamp(createdAt),

                _updatedAt:
                  getTimestamp(updatedAt),
              };
            })

            // Only remove products that are actually
            // deleted, inactive or archived.
            .filter((product) => {
              const status = String(
                product.status || "active"
              ).toLowerCase();

              return ![
                "deleted",
                "inactive",
                "archived",
              ].includes(status);
            });

          console.log(
            "CampusMart - ALL FIRESTORE PRODUCTS:",
            loadedProducts
          );

          console.log(
            "CampusMart - TOTAL PRODUCTS:",
            loadedProducts.length
          );

          setProducts(loadedProducts);
          setProductsLoading(false);
          setProductsError("");
        } catch (error) {
          console.error(
            "Error processing products:",
            error
          );

          setProducts([]);
          setProductsLoading(false);

          setProductsError(
            "We couldn't process the products right now. Please try again."
          );
        }
      },

      (error) => {
        console.error(
          "Error loading products from Firestore:",
          error
        );

        setProducts([]);
        setProductsLoading(false);

        setProductsError(
          "We couldn't load products right now. Please check your internet connection and Firebase rules."
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // AUTOMATIC MAXIMUM PRICE
  // =====================================================

  const highestProductPrice = useMemo(() => {
    if (!products.length) {
      return 1000000;
    }

    const highest = Math.max(
      ...products.map((product) =>
        getNumber(product.price)
      )
    );

    // Add a little room above the highest price.
    return Math.max(
      1000000,
      Math.ceil(highest / 100000) * 100000
    );
  }, [products]);

  // When products load, make sure the price filter
  // includes every product by default.
  useEffect(() => {
    if (products.length > 0 && maxPrice === null) {
      setMaxPrice(highestProductPrice);
    }
  }, [products, highestProductPrice, maxPrice]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearchChange = (event) => {
    const value = event.target.value;

    const params = new URLSearchParams(
      searchParams
    );

    if (!value.trim()) {
      params.delete("search");
    } else {
      params.set("search", value);
    }

    setSearchParams(params);
  };

  // =====================================================
  // CATEGORY
  // =====================================================

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(
      searchParams
    );

    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    setSearchParams(params);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());

    // No price restriction after reset.
    setMaxPrice(highestProductPrice);

    setMinRating(0);
    setSortBy("Newest");
    setSortOpen(false);
    setFilterOpen(false);
  };

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  let filteredProducts = products.filter(
    (product) => {
      const price = getNumber(product.price);

      const name = String(
        product.name || ""
      ).toLowerCase();

      const description = String(
        product.description || ""
      ).toLowerCase();

      const category = String(
        product.category || ""
      ).toLowerCase();

      const searchValue =
        search.toLowerCase().trim();

      // -------------------------------
      // CATEGORY
      // -------------------------------

      const matchesCategory =
        selectedCategory === "All" ||
        category ===
          selectedCategory.toLowerCase();

      // -------------------------------
      // SEARCH
      // -------------------------------

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        description.includes(searchValue) ||
        category.includes(searchValue);

      // -------------------------------
      // PRICE
      // -------------------------------

      // If maxPrice is null, don't filter
      // by price at all.
      const matchesPrice =
        maxPrice === null ||
        price <= maxPrice;

      // -------------------------------
      // RATING
      // -------------------------------

      const matchesRating =
        getNumber(product.rating) >=
        minRating;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesRating
      );
    }
  );

  // =====================================================
  // SORT PRODUCTS
  // =====================================================

  filteredProducts = [
    ...filteredProducts,
  ].sort((a, b) => {
    if (sortBy === "Lowest Price") {
      return (
        getNumber(a.price) -
        getNumber(b.price)
      );
    }

    if (sortBy === "Highest Price") {
      return (
        getNumber(b.price) -
        getNumber(a.price)
      );
    }

    if (sortBy === "Top Rated") {
      return (
        getNumber(b.rating) -
        getNumber(a.rating)
      );
    }

    // Newest
    const aTime =
      getNumber(a._createdAt) ||
      getNumber(a._updatedAt);

    const bTime =
      getNumber(b._createdAt) ||
      getNumber(b._updatedAt);

    return bTime - aTime;
  });

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Browse Products
            </h1>

            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Discover products from students around campus.
            </p>
          </div>

          <div className="relative w-full lg:w-80 xl:w-96">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
        </div>

        {/* =================================================
            SEARCH RESULT MESSAGE
        ================================================= */}

        {search && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-sm text-green-700">
              Search results for{" "}
              <span className="font-semibold">
                "{search}"
              </span>{" "}
              — {filteredProducts.length}{" "}
              product
              {filteredProducts.length !== 1
                ? "s"
                : ""}
            </p>
          </div>
        )}

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">
              Categories
            </h2>

            <span className="text-sm text-gray-500">
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}
            </span>
          </div>

          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  handleCategoryChange(category)
                }
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

        {/* =================================================
            SORT + FILTER
        ================================================= */}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              {selectedCategory === "All"
                ? search
                  ? "Search Results"
                  : "All Products"
                : selectedCategory}
            </h2>

            <p className="text-sm text-gray-500">
              Showing {filteredProducts.length}{" "}
              of {products.length} products
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">

            {/* SORT */}

            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  setSortOpen(
                    (open) => !open
                  )
                }
                className="w-full sm:min-w-[190px] flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
              >
                <span>{sortBy}</span>

                <FiChevronDown
                  size={17}
                  className={`transition-transform ${
                    sortOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {sortOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close sort menu"
                    onClick={() =>
                      setSortOpen(false)
                    }
                    className="fixed inset-0 z-40"
                  />

                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-green-100 rounded-xl shadow-xl overflow-hidden p-1.5">
                    {sortOptions.map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSortBy(option);
                            setSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-lg text-sm font-medium ${
                            sortBy === option
                              ? "bg-green-600 text-white"
                              : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                          }`}
                        >
                          <span>
                            {option}
                          </span>

                          {sortBy === option && (
                            <FiCheck
                              size={17}
                            />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* FILTER BUTTON */}

            <button
              type="button"
              onClick={() =>
                setFilterOpen(true)
              }
              className="shrink-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition"
            >
              Filters
            </button>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {productsLoading && (
          <section className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

            <p className="text-sm text-gray-500 mt-4">
              Loading products...
            </p>
          </section>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!productsLoading &&
          productsError && (
            <section className="bg-white rounded-2xl border border-red-100 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Unable to load products
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {productsError}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Try Again
              </button>
            </section>
          )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {!productsLoading &&
          !productsError &&
          filteredProducts.length > 0 && (
            <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    wishlist={wishlist}
                    toggleWishlist={
                      toggleWishlist
                    }
                  />
                )
              )}
            </section>
          )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!productsLoading &&
          !productsError &&
          filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <FiSearch
                  size={26}
                  className="text-gray-400"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">
                No products found
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                {search
                  ? `We couldn't find any products matching "${search}".`
                  : "Try changing your search or filters."}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
      </div>

      {/* ===================================================
          FILTER DRAWER
      =================================================== */}

      {filterOpen && (
        <div className="fixed inset-0 z-[100]">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setFilterOpen(false)
            }
          />

          {/* DRAWER */}

          <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl p-6 overflow-y-auto">

            {/* HEADER */}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Filters
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Refine your search
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFilterOpen(false)
                }
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* CATEGORY */}

            <div className="mt-8">
              <h3 className="font-semibold text-gray-800">
                Category
              </h3>

              <div className="space-y-3 mt-4">
                {categories.map(
                  (category) => (
                    <label
                      key={category}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={
                          selectedCategory ===
                          category
                        }
                        onChange={() =>
                          handleCategoryChange(
                            category
                          )
                        }
                        className="accent-green-600"
                      />

                      <span className="text-sm text-gray-600 group-hover:text-green-600">
                        {category}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* MAXIMUM PRICE */}

            <div className="mt-8">
              <div className="flex justify-between gap-4">
                <h3 className="font-semibold text-gray-800">
                  Maximum Price
                </h3>

                <span className="text-sm text-green-600 font-medium">
                  ₦
                  {(
                    maxPrice ??
                    highestProductPrice
                  ).toLocaleString()}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={highestProductPrice}
                step="5000"
                value={
                  maxPrice ??
                  highestProductPrice
                }
                onChange={(e) =>
                  setMaxPrice(
                    Number(e.target.value)
                  )
                }
                className="w-full mt-5 accent-green-600"
              />

              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>₦0</span>

                <span>
                  ₦
                  {highestProductPrice.toLocaleString()}
                </span>
              </div>

              {/* REMOVE PRICE FILTER */}

              <button
                type="button"
                onClick={() =>
                  setMaxPrice(
                    highestProductPrice
                  )
                }
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Show all prices
              </button>
            </div>

            {/* MINIMUM RATING */}

            <div className="mt-8">
              <h3 className="font-semibold text-gray-800">
                Minimum Rating
              </h3>

              <div className="space-y-3 mt-4">
                {[4, 3, 2, 1].map(
                  (rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={
                          minRating ===
                          rating
                        }
                        onChange={() =>
                          setMinRating(
                            rating
                          )
                        }
                        className="accent-green-600"
                      />

                      <div className="flex items-center gap-1">
                        {Array.from({
                          length: rating,
                        }).map(
                          (_, index) => (
                            <FiStar
                              key={index}
                              className="text-yellow-500 fill-yellow-500"
                              size={15}
                            />
                          )
                        )}

                        <span className="text-sm text-gray-500 ml-1">
                          & up
                        </span>
                      </div>
                    </label>
                  )
                )}

                {/* ALL RATINGS */}

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    checked={
                      minRating === 0
                    }
                    onChange={() =>
                      setMinRating(0)
                    }
                    className="accent-green-600"
                  />

                  <span className="text-sm text-gray-600 group-hover:text-green-600">
                    All ratings
                  </span>
                </label>
              </div>
            </div>

            {/* BUTTONS */}

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
                onClick={() =>
                  setFilterOpen(false)
                }
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

export default BrowseProducts;