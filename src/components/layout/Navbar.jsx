import { useEffect, useRef, useState } from "react";

import {
  FiMenu,
  FiSearch,
  FiMessageCircle,
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiX,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../context/firebase";

const DEFAULT_PROFILE = {
  fullName: "GreatGod",
  role: "Customer",
  profileImage: null,
};

function extractSellerIdFromSearch(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;

  const storeMatch = input.match(
    /(?:https?:\/\/[^/\s]+)?\/store\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i
  );
  if (storeMatch?.[1]) return storeMatch[1];

  const profileMatch = input.match(
    /(?:https?:\/\/[^/\s]+)?\/(?:seller|profile)\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i
  );
  if (profileMatch?.[1]) return profileMatch[1];

  if (/^[A-Za-z0-9]{20,36}$/.test(input)) return input;

  return null;
}

function getDisplayName(data = {}) {
  return String(
    data.fullName || data.name || data.displayName || ""
  ).trim();
}

function isSellerProfile(data = {}) {
  const role = String(data.role || "").trim().toLowerCase();
  return (
    role === "seller" ||
    data.isSeller === true ||
    (Array.isArray(data.roles) &&
      data.roles
        .map(String)
        .map((r) => r.toLowerCase())
        .includes("seller"))
  );
}

async function findSellersByName(query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return [];

  const collectMatches = (docs) => {
    const rows = docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

    const sellers = rows.filter((p) => isSellerProfile(p));
    const pool = sellers.length > 0 ? sellers : rows;

    const withNames = pool
      .map((p) => ({
        ...p,
        _name: getDisplayName(p).toLowerCase(),
      }))
      .filter((p) => p._name);

    const exact = withNames.filter((p) => p._name === needle);
    if (exact.length) return exact;

    const starts = withNames.filter((p) => p._name.startsWith(needle));
    if (starts.length) return starts;

    return withNames.filter((p) => p._name.includes(needle));
  };

  try {
    const publicSnap = await getDocs(collection(db, "publicProfiles"));
    const fromPublic = collectMatches(publicSnap.docs);
    if (fromPublic.length) return fromPublic;
  } catch (err) {
    console.warn("publicProfiles search failed:", err);
  }

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    return collectMatches(usersSnap.docs);
  } catch (err) {
    console.warn("users search failed:", err);
    return [];
  }
}

function Navbar({
  setSidebarOpen,
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const searchWrapRef = useRef(null);

  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [searching, setSearching] = useState(false);

  // Multiple seller matches → dropdown
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [showSellerDropdown, setShowSellerDropdown] = useState(false);

  const wishlistCount = wishlist.length;

  useEffect(() => {
    if (!firebaseUser?.uid) return undefined;

    const profileRef = doc(db, "users", firebaseUser.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            ...DEFAULT_PROFILE,
            ...data,
            email: data.email || firebaseUser.email || "",
          });
          return;
        }

        setProfile({
          ...DEFAULT_PROFILE,
          fullName: firebaseUser.displayName || DEFAULT_PROFILE.fullName,
          email: firebaseUser.email || "",
          profileImage: firebaseUser.photoURL || null,
        });
      },
      (error) => console.error("Could not load profile:", error)
    );

    return () => unsubscribe();
  }, [
    firebaseUser?.uid,
    firebaseUser?.email,
    firebaseUser?.displayName,
    firebaseUser?.photoURL,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onPointerDown = (e) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        setShowSellerDropdown(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const openSellerStore = (sellerId) => {
    if (!sellerId) return;
    setShowSellerDropdown(false);
    setSellerSuggestions([]);
    setSearch("");
    navigate(`/store/${encodeURIComponent(sellerId)}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmedSearch = search.trim();
    setSellerSuggestions([]);
    setShowSellerDropdown(false);

    if (!trimmedSearch) {
      navigate("/browse-products");
      return;
    }

    // 1) Store / profile link or raw UID
    const sellerIdFromLink = extractSellerIdFromSearch(trimmedSearch);
    if (sellerIdFromLink) {
      openSellerStore(sellerIdFromLink);
      return;
    }

    // 2) Seller name search
    try {
      setSearching(true);
      const matches = await findSellersByName(trimmedSearch);

      if (matches.length === 1) {
        openSellerStore(matches[0].id);
        return;
      }

      if (matches.length > 1) {
        // Option C: show dropdown — user picks
        setSellerSuggestions(matches.slice(0, 12));
        setShowSellerDropdown(true);
        return;
      }
    } catch (err) {
      console.error("Seller name search error:", err);
    } finally {
      setSearching(false);
    }

    // 3) Product search
    navigate(
      `/browse-products?search=${encodeURIComponent(trimmedSearch)}`
    );
  };

  return (
    <header className="bg-green-800 text-white">
      <div className="h-20 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-green-700 shrink-0"
          >
            <FiMenu className="text-2xl" />
          </button>

          <div ref={searchWrapRef} className="relative flex-1 max-w-md">
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-green-200 pointer-events-none" />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSellerDropdown(false);
                  setSellerSuggestions([]);
                }}
                placeholder="Search products, seller name, or paste link..."
                disabled={searching}
                className="
                  w-full
                  bg-green-700
                  text-white
                  placeholder-green-200
                  rounded-full
                  py-2.5
                  pl-11
                  pr-10
                  outline-none
                  border
                  border-green-600
                  focus:ring-2
                  focus:ring-green-400
                  disabled:opacity-70
                "
              />

              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-green-300 border-t-white animate-spin" />
              )}
            </form>

            {/* Option C: multiple sellers with same / similar name */}
            {showSellerDropdown && sellerSuggestions.length > 1 && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-[calc(100%+8px)]
                  z-50
                  bg-white
                  text-gray-800
                  rounded-2xl
                  shadow-xl
                  border
                  border-gray-100
                  overflow-hidden
                "
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">
                    {sellerSuggestions.length} sellers found — choose one
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerDropdown(false);
                      setSellerSuggestions([]);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <ul className="max-h-72 overflow-y-auto py-1">
                  {sellerSuggestions.map((seller) => {
                    const name =
                      getDisplayName(seller) || "CampusMart Seller";
                    const campus = seller.campus || seller.school || "";
                    const image =
                      seller.profileImage ||
                      seller.photoURL ||
                      seller.avatar ||
                      null;

                    return (
                      <li key={seller.id}>
                        <button
                          type="button"
                          onClick={() => openSellerStore(seller.id)}
                          className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-4
                            py-3
                            text-left
                            hover:bg-green-50
                            transition
                          "
                        >
                          <div className="w-10 h-10 rounded-full bg-green-100 text-[#008236] flex items-center justify-center overflow-hidden shrink-0 font-bold">
                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FiUser size={18} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {campus
                                ? campus
                                : "CampusMart seller"}
                              {seller.isVerifiedSeller ? " · Verified" : ""}
                            </p>
                          </div>

                          <span className="text-xs font-semibold text-[#008236] shrink-0">
                            View
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerDropdown(false);
                      setSellerSuggestions([]);
                      navigate(
                        `/browse-products?search=${encodeURIComponent(
                          search.trim()
                        )}`
                      );
                    }}
                    className="text-xs font-semibold text-gray-600 hover:text-[#008236]"
                  >
                    Search products for “{search.trim()}” instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:bg-green-700"
            title="Cart"
          >
            <FiShoppingCart className="text-xl" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/wishlist")}
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:bg-green-700"
            title="Wishlist"
          >
            <FiHeart className="text-xl" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="relative hidden sm:flex w-11 h-11 rounded-full items-center justify-center hover:bg-green-700"
            title="Messages"
          >
            <FiMessageCircle className="text-xl" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 bg-green-700 px-3 py-2 rounded-full hover:bg-green-600 transition"
          >
            <div className="w-9 h-9 rounded-full bg-white text-green-700 flex items-center justify-center overflow-hidden font-bold">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {profile.fullName?.charAt(0)?.toUpperCase() || "G"}
                </span>
              )}
            </div>

            <div className="hidden md:block text-left">
              <h3 className="font-semibold text-sm">
                {profile.fullName || "GreatGod"}
              </h3>
              <p className="text-xs text-green-200">
                {profile.role || "Customer"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;