import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import ProductCard from "../../components/dashboard/ProductCard";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";
import { canViewProfile, getCampusOf } from "../../utils/profileVisibility";

import {
  FiArrowLeft,
  FiShare2,
  FiCheck,
  FiMapPin,
  FiMail,
  FiPhone,
  FiPackage,
  FiUser,
  FiCopy,
  FiExternalLink,
  FiLock,
  FiX,
} from "react-icons/fi";

function VerifiedBadge({ size = 18, className = "" }) {
  const s = Number(size) || 18;
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      title="Verified seller"
      aria-label="Verified seller"
    >
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#008236" />
        <path
          d="M7.2 12.3l2.7 2.7 6.5-6.5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SellerStore({
  cartCount = 0,
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [viewerCampus, setViewerCampus] = useState("");
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { src, alt }

  // Always uses current site origin (localhost in dev, real domain in production)
  const storeUrl = useMemo(() => {
    if (!sellerId) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/store/${sellerId}`;
    }
    return `/store/${sellerId}`;
  }, [sellerId]);

  const shareText = useMemo(() => {
    const name =
      seller?.shopName ||
      seller?.fullName ||
      seller?.displayName ||
      "this seller";
    return `Check out ${name}'s store on CampusMart`;
  }, [seller]);

  useEffect(() => {
    if (!sellerId) {
      setSeller(null);
      setLoading(false);
      setError("No seller specified.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        let data = null;

        try {
          const pub = await getDoc(doc(db, "publicProfiles", String(sellerId)));
          if (pub.exists()) {
            data = { id: sellerId, ...pub.data() };
          }
        } catch {
          // ignore
        }

        try {
          const userSnap = await getDoc(doc(db, "users", String(sellerId)));
          if (userSnap.exists()) {
            const u = userSnap.data() || {};
            data = {
              id: sellerId,
              ...(data || {}),
              fullName:
                u.fullName ||
                u.displayName ||
                u.name ||
                data?.fullName ||
                "",
              displayName: u.displayName || data?.displayName || "",
              email: u.email || data?.email || "",
              phone: u.phone || data?.phone || "",
              campus: u.campus || data?.campus || "",
              address: u.address || data?.address || "",
              bio: u.bio || u.about || data?.bio || "",
              profileImage:
                u.profileImage ||
                u.photoURL ||
                u.avatar ||
                data?.profileImage ||
                null,
              isVerifiedSeller:
                u.isVerifiedSeller === true ||
                data?.isVerifiedSeller === true,
              role: u.role || data?.role || "seller",
              shopName: u.shopName || data?.shopName || "",
              coverPhoto:
                u.coverPhoto || u.profile?.coverPhoto || data?.coverPhoto || "",
              profileVisibility:
                u.settings?.profileVisibility || data?.profileVisibility || "",
            };
          }
        } catch {
          // buyers may not read users
        }

        if (cancelled) return;

        if (!data) {
          setSeller(null);
          setError("This seller profile could not be found.");
        } else {
          setSeller(data);
          setError("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setSeller(null);
          setError("Unable to load this seller right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  // Keep the About text (and name / photo) live, so when the seller edits
  // their bio the public store updates without a refresh.
  useEffect(() => {
    if (!sellerId) return undefined;

    const unsub = onSnapshot(
      doc(db, "publicProfiles", String(sellerId)),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data() || {};

        setSeller((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bio: typeof d.bio === "string" ? d.bio : prev.bio,
            fullName: d.fullName || prev.fullName,
            displayName: d.displayName || prev.displayName,
            campus: typeof d.campus === "string" ? d.campus : prev.campus,
            profileImage: d.profileImage || prev.profileImage,
            coverPhoto:
              typeof d.coverPhoto === "string" ? d.coverPhoto : prev.coverPhoto,
            profileVisibility: d.profileVisibility || prev.profileVisibility,
          };
        });
      },
      () => {
        // ignore: the first load already filled the page
      }
    );

    return () => unsub();
  }, [sellerId]);

  // Who is looking? Their campus decides "campus only" profiles.
  useEffect(() => {
    let cancelled = false;

    if (!firebaseUser?.uid) {
      setViewerCampus("");
      setViewerLoaded(true);
      return undefined;
    }

    setViewerLoaded(false);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!cancelled) {
          setViewerCampus(snap.exists() ? getCampusOf(snap.data() || {}) : "");
        }
      } catch {
        if (!cancelled) setViewerCampus("");
      } finally {
        if (!cancelled) setViewerLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid]);

  // The owner of the store can always see their own picture, cover and products,
  // whatever their visibility setting is.
  const isOwnStore = Boolean(
    firebaseUser?.uid && String(firebaseUser.uid) === String(sellerId)
  );

  // Public / campus only / private
  const access = useMemo(
    () =>
      canViewProfile({
        ownerId: sellerId,
        owner: seller,
        viewerId: firebaseUser?.uid,
        viewerCampus,
      }),
    [sellerId, seller, firebaseUser?.uid, viewerCampus]
  );
  const canSee = isOwnStore || access.allowed;

  // Close the picture viewer with Esc
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  useEffect(() => {
    if (!sellerId || !canSee) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }

    setProductsLoading(true);
    setVisibleCount(10);

    const q = query(
      collection(db, "products"),
      where("sellerId", "==", String(sellerId))
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            ...data,
            name: data.name || "Untitled Product",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            image: data.image || data.imageUrl || "",
            description: data.description || "",
            sellerId: data.sellerId || sellerId,
            sellerName:
              data.sellerName ||
              seller?.fullName ||
              seller?.displayName ||
              "CampusMart Seller",
            isVerifiedSeller:
              data.isVerifiedSeller === true ||
              seller?.isVerifiedSeller === true,
            status: data.status || "Active",
            createdAt: data.createdAt || null,
          };
        });

        list.sort((a, b) => {
          const aActive =
            String(a.status || "").toLowerCase() === "active" ? 1 : 0;
          const bActive =
            String(b.status || "").toLowerCase() === "active" ? 1 : 0;
          if (aActive !== bActive) return bActive - aActive;
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return bT - aT;
        });

        setProducts(list);
        setProductsLoading(false);
      },
      (err) => {
        console.error("Store products error:", err);
        setProducts([]);
        setProductsLoading(false);
      }
    );

    return () => unsub();
  }, [sellerId, canSee, seller?.fullName, seller?.isVerifiedSeller]);

  const displayName =
    seller?.shopName ||
    seller?.fullName ||
    seller?.displayName ||
    seller?.name ||
    "CampusMart Seller";

  // Locked viewers never get the picture or cover (the owner always does).
  const avatar = canSee
    ? seller?.profileImage || seller?.photoURL || seller?.avatar || null
    : null;

  const coverPhoto = canSee ? seller?.coverPhoto || "" : "";

  const isVerified = seller?.isVerifiedSeller === true;
  const productCount = products.length;
  const sellerBio = String(seller?.bio || seller?.about || "").trim();

  // The seller's own bio is the About text. Only when they have not
  // written one do we show a short default line.
  const bio =
    sellerBio ||
    (isOwnStore
      ? "You have not added a bio yet. Add one in your profile so buyers can learn about you."
      : seller?.campus
        ? `Seller on CampusMart · ${seller.campus}`
        : "Seller on CampusMart. Browse products and chat to buy securely.");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = storeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShareWindow = (url) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const shareToWhatsApp = () => {
    openShareWindow(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${storeUrl}`)}`
    );
  };

  const shareToFacebook = () => {
    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`
    );
  };

  const shareToTwitter = () => {
    openShareWindow(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storeUrl)}`
    );
  };

  const shareToTelegram = () => {
    openShareWindow(
      `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(shareText)}`
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on CampusMart`,
          text: shareText,
          url: storeUrl,
        });
        setShareOpen(false);
        return;
      } catch {
        // user cancelled — keep modal open for other options
      }
    }
    setShareOpen(true);
  };

  if (loading || (!viewerLoaded && access.visibility === "campus")) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-[#008236] animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading store...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!seller || error) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <FiUser size={28} className="text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mt-4">
            Store not found
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {error || "This seller does not have a public store yet."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/browse-products")}
            className="mt-6 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e]"
          >
            Browse products
          </button>
        </div>
      </CustomerLayout>
    );
  }

  // ========== LOCKED PROFILE ==========
  // The visitor still lands on the store page, but sees no profile picture,
  // no cover photo and no products.
  if (!canSee) {
    const isPrivate = access.reason === "private";

    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#008236] transition"
          >
            <FiArrowLeft size={16} />
            Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Plain cover (the real cover photo is hidden) */}
            <div className="h-32 sm:h-44 bg-gradient-to-r from-[#007233] to-[#00a34a] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30" />
                <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full bg-white/20" />
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6">
              {/* Lock instead of the profile picture */}
              <div className="relative -mt-12 sm:-mt-14 mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-gray-100 text-gray-400 flex items-center justify-center">
                  <FiLock size={30} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayName}
                </h1>
                {seller?.isVerifiedSeller === true && <VerifiedBadge size={20} />}
              </div>

              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                <FiLock size={12} />
                {isPrivate ? "Private profile" : "Campus only profile"}
              </p>

              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                {isPrivate
                  ? "This person has locked their profile. You won't see their profile picture, cover photo or products."
                  : `Only students of ${
                      access.ownerCampus || "their campus"
                    } can see their profile picture, cover photo and products.${
                      viewerCampus
                        ? ""
                        : " If you study there, add your campus in Settings > Personal Information."
                    }`}
              </p>
            </div>
          </div>

          {/* Products stay hidden */}
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <FiLock size={22} />
            </div>
            <p className="font-semibold text-gray-800 mt-3">
              Products are hidden
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isPrivate
                ? "This seller keeps their products private."
                : "Products are only shown to students of this seller's campus."}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-11 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => navigate("/browse-products")}
                className="h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e]"
              >
                Browse products
              </button>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#008236] transition"
        >
          <FiArrowLeft size={16} />
          Back
        </button>

        {/* ========== PROFILE CARD ========== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover only — no text on cover */}
          <div className="h-32 sm:h-44 bg-gradient-to-r from-[#007233] to-[#00a34a] relative overflow-hidden">
            {coverPhoto ? (
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    src: coverPhoto,
                    alt: `${displayName} cover photo`,
                  })
                }
                className="absolute inset-0 w-full h-full cursor-zoom-in"
                aria-label="View cover photo"
              >
                <img
                  src={coverPhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30" />
                <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full bg-white/20" />
              </div>
            )}
          </div>

          {/* Avatar + name sit in WHITE area below cover */}
          <div className="px-4 sm:px-6 pb-5">
            {/* Avatar overlaps cover slightly */}
            <div className="relative -mt-12 sm:-mt-14 mb-3">
              {avatar ? (
                <button
                  type="button"
                  onClick={() => setLightbox({ src: avatar, alt: displayName })}
                  className="block rounded-full cursor-zoom-in"
                  aria-label="View profile picture"
                >
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  />
                </button>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-green-50 text-[#008236] flex items-center justify-center text-3xl font-bold">
                  {String(displayName).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + meta — fully on white background */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  {isVerified && <VerifiedBadge size={20} />}
                </div>

                {isVerified && (
                  <p className="text-xs text-[#008236] font-semibold mt-1">
                    Verified CampusMart seller
                  </p>
                )}

                <p className="text-sm text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <FiPackage size={14} />
                    {productCount} product{productCount === 1 ? "" : "s"}
                  </span>
                  {seller.campus && (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin size={14} />
                      {seller.campus}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#006f2e] transition"
                >
                  <FiShare2 size={16} />
                  Share store
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition"
                >
                  {copied ? (
                    <>
                      <FiCheck size={16} className="text-[#008236]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <FiCopy size={16} />
                      Copy link
                    </>
                  )}
                </button>

                {isOwnStore && (
                  <button
                    type="button"
                    onClick={() => navigate("/seller/profile")}
                    className="h-10 px-4 rounded-xl border border-green-200 bg-green-50 text-[#008236] text-sm font-semibold hover:bg-green-100 transition"
                  >
                    Edit profile
                  </button>
                )}
              </div>
            </div>

            {/* About */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {bio}
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                {seller.campus && (
                  <p className="flex items-center gap-2">
                    <FiMapPin className="text-[#008236] flex-shrink-0" size={15} />
                    <span>{seller.campus}</span>
                  </p>
                )}
                {seller.phone && (
                  <p className="flex items-center gap-2">
                    <FiPhone className="text-[#008236] flex-shrink-0" size={15} />
                    <span>{seller.phone}</span>
                  </p>
                )}
                {seller.email && isOwnStore && (
                  <p className="flex items-center gap-2">
                    <FiMail className="text-[#008236] flex-shrink-0" size={15} />
                    <span className="truncate">{seller.email}</span>
                  </p>
                )}
              </div>

              
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Products
              <span className="text-gray-400 font-medium text-sm ml-2">
                ({productCount})
              </span>
            </h2>
          </div>

          {productsLoading ? (
            <div className="py-16 text-center">
              <div className="w-9 h-9 mx-auto rounded-full border-4 border-green-100 border-t-[#008236] animate-spin" />
              <p className="text-sm text-gray-500 mt-3">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">🛍️</div>
              <p className="font-semibold text-gray-800">No products yet</p>
              <p className="text-sm text-gray-500 mt-1">
                This seller has not listed any products.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {products.slice(0, visibleCount).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                  />
                ))}
              </div>

              {(products.length > 10 || visibleCount > 10) && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {visibleCount < products.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((n) =>
                          Math.min(n + 10, products.length)
                        )
                      }
                      className="h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition shadow-sm"
                    >
                      Load more
                    </button>
                  )}
                  {visibleCount > 10 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(10)}
                      className="h-11 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Load less
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========== PICTURE VIEWER ========== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Close"
          >
            <FiX size={22} />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] object-contain rounded-lg"
          />
        </div>
      )}

      {/* ========== SHARE MODAL ========== */}
      {shareOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShareOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Share store</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px]">
                  {displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={shareToWhatsApp}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-100 transition text-left"
              >
                <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  W
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  WhatsApp
                </span>
              </button>

              <button
                type="button"
                onClick={shareToFacebook}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition text-left"
              >
                <span className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  f
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  Facebook
                </span>
              </button>

              <button
                type="button"
                onClick={shareToTwitter}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-left"
              >
                <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  X
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  X / Twitter
                </span>
              </button>

              <button
                type="button"
                onClick={shareToTelegram}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-sky-50 hover:border-sky-100 transition text-left"
              >
                <span className="w-10 h-10 rounded-full bg-[#26A5E4] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  T
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  Telegram
                </span>
              </button>
            </div>

            <div className="px-4 pb-5 space-y-2">
              
              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                }}
                className="w-full h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <FiCheck size={16} className="text-[#008236]" />
                    Link copied
                  </>
                ) : (
                  <>
                    <FiCopy size={16} />
                    Copy link
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

export default SellerStore;