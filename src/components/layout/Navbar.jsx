import { useEffect, useRef, useState } from "react";

import {
  FiMenu,
  FiSearch,
  FiMessageCircle,
  FiShoppingCart,
  FiHeart,
  FiX,
  FiChevronRight,
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

function VerifiedBadge({ size = 12 }) {
  const s = Number(size) || 12;
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      title="Verified seller"
      aria-label="Verified seller"
    >
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#008236" />
        <path
          d="M7.2 12.3l2.7 2.7 6.5-6.5"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function extractLinkTarget(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;

  const productMatch = input.match(
    /(?:https?:\/\/[^/\s]+)?\/products\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i
  );
  if (productMatch?.[1]) {
    return { type: "product", id: productMatch[1] };
  }

  const storeMatch = input.match(
    /(?:https?:\/\/[^/\s]+)?\/store\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i
  );
  if (storeMatch?.[1]) {
    return { type: "profile", id: storeMatch[1] };
  }

  const profileMatch = input.match(
    /(?:https?:\/\/[^/\s]+)?\/(?:seller|profile)\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i
  );
  if (profileMatch?.[1]) {
    return { type: "profile", id: profileMatch[1] };
  }

  if (/^[A-Za-z0-9]{20,36}$/.test(input)) {
    return { type: "profile", id: input };
  }

  return null;
}

function getDisplayName(data = {}) {
  return String(
    data.fullName || data.name || data.displayName || ""
  ).trim();
}

function getProfileImage(data = {}) {
  const img =
    data.profileImage ||
    data.photoURL ||
    data.avatar ||
    data.profilePicture ||
    data.imageUrl ||
    data.image ||
    null;
  if (!img || typeof img !== "string") return null;
  const t = img.trim();
  if (!t || t === "null" || t === "undefined") return null;
  return t;
}

/**
 * Seller badge ONLY if they opened a store / are marked seller
 * on publicProfiles (what search can actually read).
 * Everyone else = Buyer.
 */
function hasOpenedStore(data = {}) {
  if (data.hasStore === true) return true;
  if (data.isSeller === true) return true;
  if (data.storeCreated === true) return true;

  const role = String(data.role || "").trim().toLowerCase();
  if (role === "seller") return true;

  if (
    Array.isArray(data.roles) &&
    data.roles.some(
      (r) => String(r).trim().toLowerCase() === "seller"
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Search publicProfiles (readable by all signed-in users).
 * users/ is usually private — other people cannot read it,
 * so seller flags must live on publicProfiles.
 */
async function findPeopleByName(query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return [];

  let docs = [];
  try {
    const publicSnap = await getDocs(collection(db, "publicProfiles"));
    docs = publicSnap.docs;
  } catch (err) {
    console.warn("publicProfiles search failed:", err);
    return [];
  }

  // Best-effort merge from users (only works if rules allow list read)
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const byId = new Map(docs.map((d) => [d.id, { id: d.id, ...(d.data() || {}) }]));
    usersSnap.docs.forEach((d) => {
      const u = { id: d.id, ...(d.data() || {}) };
      const prev = byId.get(d.id) || { id: d.id };
      byId.set(d.id, {
        ...prev,
        ...u,
        // Prefer store flags from either source
        hasStore: prev.hasStore === true || u.hasStore === true,
        isSeller: prev.isSeller === true || u.isSeller === true,
        role: hasOpenedStore(u) ? (u.role || prev.role) : (prev.role || u.role),
        fullName: getDisplayName(prev) || getDisplayName(u),
        profileImage: getProfileImage(prev) || getProfileImage(u),
        photoURL: prev.photoURL || u.photoURL,
        campus: prev.campus || u.campus || prev.school || u.school,
        isVerifiedSeller:
          prev.isVerifiedSeller === true || u.isVerifiedSeller === true,
      });
    });
    docs = Array.from(byId.values()).map((row) => ({
      id: row.id,
      data: () => row,
    }));
  } catch {
    // Expected when rules block listing users — publicProfiles only
  }

  const rows = docs.map((d) => {
    const data = typeof d.data === "function" ? d.data() : d;
    const id = d.id || data.id;
    return {
      id,
      ...data,
      _name: getDisplayName(data).toLowerCase(),
      _hasStore: hasOpenedStore(data),
      _image: getProfileImage(data),
    };
  }).filter((p) => p._name);

  const exact = rows.filter((p) => p._name === needle);
  if (exact.length) return exact;

  const starts = rows.filter((p) => p._name.startsWith(needle));
  if (starts.length) return starts;

  return rows.filter((p) => p._name.includes(needle));
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

  const [peopleSuggestions, setPeopleSuggestions] = useState([]);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

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
            profileImage:
              getProfileImage(data) || firebaseUser.photoURL || null,
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

  useEffect(() => {
    const onPointerDown = (e) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        setShowPeopleDropdown(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const closeDropdown = () => {
    setShowPeopleDropdown(false);
    setPeopleSuggestions([]);
  };

  const openPersonProfile = (personId) => {
    if (!personId) return;
    closeDropdown();
    setSearch("");
    navigate(`/store/${encodeURIComponent(personId)}`);
  };

  const openProduct = (productId) => {
    if (!productId) return;
    closeDropdown();
    setSearch("");
    navigate(`/products/${encodeURIComponent(productId)}`);
  };

  const handleSelectPerson = (person) => {
    if (!person) return;
    openPersonProfile(person.id);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmedSearch = search.trim();
    closeDropdown();

    if (!trimmedSearch) {
      navigate("/browse-products");
      return;
    }

    const linkTarget = extractLinkTarget(trimmedSearch);
    if (linkTarget?.type === "product") {
      openProduct(linkTarget.id);
      return;
    }
    if (linkTarget?.type === "profile") {
      openPersonProfile(linkTarget.id);
      return;
    }

    try {
      setSearching(true);
      const matches = await findPeopleByName(trimmedSearch);

      if (matches.length === 1) {
        openPersonProfile(matches[0].id);
        return;
      }

      if (matches.length > 1) {
        setPeopleSuggestions(matches.slice(0, 12));
        setShowPeopleDropdown(true);
        setSearching(false);
        return;
      }
    } catch (err) {
      console.error("People search error:", err);
    } finally {
      setSearching(false);
    }

    navigate(
      `/browse-products?search=${encodeURIComponent(trimmedSearch)}`
    );
  };

  return (
    <header className="bg-green-800 text-white relative z-40">
      <div className="h-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-green-700 shrink-0"
          >
            <FiMenu className="text-2xl" />
          </button>

          <div
            ref={searchWrapRef}
            className="relative flex-1 min-w-0 max-w-none sm:max-w-md"
          >
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-green-200 pointer-events-none" />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  closeDropdown();
                }}
                placeholder="Search name, product, or paste a link…"
                disabled={searching}
                className="
                  w-full
                  bg-green-700
                  text-white
                  placeholder-green-200
                  rounded-full
                  py-2.5
                  pl-10 sm:pl-11
                  pr-10
                  outline-none
                  border
                  border-green-600
                  focus:ring-2
                  focus:ring-green-400
                  disabled:opacity-70
                  text-sm
                "
              />

              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-green-300 border-t-white animate-spin" />
              )}
            </form>

            {showPeopleDropdown && peopleSuggestions.length > 0 && (
              <div
                className="
                  fixed
                  left-3
                  right-3
                  top-[4.75rem]
                  z-[60]
                  sm:absolute
                  sm:left-0
                  sm:right-0
                  sm:top-[calc(100%+10px)]
                  sm:w-full
                  bg-white
                  text-gray-800
                  rounded-2xl
                  shadow-[0_20px_50px_rgba(0,0,0,0.22)]
                  border
                  border-gray-100
                  overflow-hidden
                  max-h-[min(70vh,420px)]
                  flex
                  flex-col
                "
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50 shrink-0">
                  <p className="text-xs font-semibold text-gray-600">
                    {peopleSuggestions.length === 1
                      ? "1 person found"
                      : `${peopleSuggestions.length} people found`}
                  </p>
                  <button
                    type="button"
                    onClick={closeDropdown}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <ul className="overflow-y-auto py-1.5 flex-1 overscroll-contain">
                  {peopleSuggestions.map((person) => {
                    const name =
                      getDisplayName(person) || "CampusMart User";
                    const campus = person.campus || person.school || "";
                    const image =
                      person._image || getProfileImage(person) || null;
                    const isStoreOwner = Boolean(person._hasStore);
                    const verified =
                      isStoreOwner && person.isVerifiedSeller === true;

                    return (
                      <li key={person.id} className="px-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPerson(person)}
                          className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            rounded-xl
                            text-left
                            transition
                            cursor-pointer
                            hover:bg-green-50
                            active:bg-green-100
                          "
                        >
                          <div className="w-11 h-11 rounded-full bg-green-100 text-[#008236] flex items-center justify-center overflow-hidden shrink-0 font-bold border border-green-100">
                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-sm font-bold">
                                {name.charAt(0).toUpperCase() || "U"}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {name}
                              </p>
                              {verified && <VerifiedBadge size={13} />}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {isStoreOwner ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-[#008236] border border-green-200">
                                  Seller
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                  Buyer
                                </span>
                              )}

                              {campus ? (
                                <span className="text-xs text-gray-500 truncate max-w-[140px]">
                                  {campus}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <span className="hidden sm:flex items-center gap-0.5 text-xs font-semibold text-[#008236] shrink-0">
                            {isStoreOwner ? "View store" : "View profile"}
                            <FiChevronRight size={14} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const term = search.trim();
                      closeDropdown();
                      navigate(
                        `/browse-products?search=${encodeURIComponent(term)}`
                      );
                    }}
                    className="text-xs font-semibold text-gray-600 hover:text-[#008236] text-left w-full"
                  >
                    Search products for “{search.trim()}” instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:bg-green-700"
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
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:bg-green-700"
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
            className="flex items-center gap-2 sm:gap-3 bg-green-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-green-600 transition"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-green-700 flex items-center justify-center overflow-hidden font-bold">
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
                {hasOpenedStore(profile) ? "Seller" : "Buyer"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;