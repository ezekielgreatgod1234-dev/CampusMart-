import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiUser,
  FiMessageCircle,
  FiRefreshCw,
  FiImage,
  FiChevronRight,
  FiTag,
} from "react-icons/fi";

import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

function VerifiedBadge({ size = 16 }) {
  const s = Number(size) || 16;
  return (
    <span title="Verified seller" aria-label="Verified seller">
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

function ServiceDetails({ cartCount = 0 }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firebaseUser, profileLoading } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setService(null);
      setLoading(false);
      setError("No service was specified.");
      return undefined;
    }

    setLoading(true);
    setError("");

    const unsub = onSnapshot(
      doc(db, "services", String(id)),
      (snapshot) => {
        if (!snapshot.exists()) {
          setService(null);
          setLoading(false);
          setError("This service does not exist.");
          return;
        }

        const data = snapshot.data() || {};
        let images = [];
        if (Array.isArray(data.images)) images = data.images.filter(Boolean);
        if (data.image) images.unshift(data.image);
        if (data.imageUrl) images.unshift(data.imageUrl);
        images = [...new Set(images.filter(Boolean))];

        setService({
          id: snapshot.id,
          ...data,
          name: data.name || data.title || "Untitled Service",
          description: data.description || "",
          category: data.category || "Other",
          price: Number(data.price) || 0,
          image: images[0] || null,
          images,
          sellerId: data.sellerId || data.providerId || "",
          sellerName:
            data.sellerName || data.providerName || "CampusMart Provider",
          sellerImage: data.sellerImage || null,
          isVerifiedSeller: data.isVerifiedSeller === true,
          status: String(data.status || "Active"),
        });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load this service.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id || !service) return;
    const sellerId = String(service.sellerId || "");
    if (firebaseUser?.uid && sellerId && firebaseUser.uid === sellerId) return;

    updateDoc(doc(db, "services", String(id)), {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
    }).catch(() => {});
  }, [id, service?.id, service?.sellerId, firebaseUser?.uid]);

  const openSellerStore = () => {
    if (!service?.sellerId) return;
    navigate(`/store/${service.sellerId}`);
  };

  const handleChatWithSeller = async () => {
    if (!service || chatLoading || profileLoading) return;
    if (!firebaseUser?.uid) {
      navigate("/login");
      return;
    }

    const sellerId = String(service.sellerId || "").trim();
    if (!sellerId) {
      alert("This provider is not set up for chat.");
      return;
    }
    if (firebaseUser.uid === sellerId) {
      alert("You cannot chat with yourself.");
      return;
    }

    setChatLoading(true);
    try {
      const participantIds = [firebaseUser.uid, sellerId].sort();
      const conversationId = participantIds.join("_");
      const customerName =
        firebaseUser.displayName || firebaseUser.email || "CampusMart User";
      const sellerName = service.sellerName || "CampusMart Provider";

      await setDoc(
        doc(db, "conversations", conversationId),
        {
          participants: participantIds,
          participantNames: {
            [firebaseUser.uid]: customerName,
            [sellerId]: sellerName,
          },
          participantImages: {
            [firebaseUser.uid]: firebaseUser.photoURL || null,
            [sellerId]: service.sellerImage || null,
          },
          onlineStatus: {
            [firebaseUser.uid]: true,
            [sellerId]: false,
          },
          unreadCounts: {
            [firebaseUser.uid]: 0,
            [sellerId]: 0,
          },
          lastMessage: "",
          lastMessageAt: 0,
          serviceId: service.id,
          productId: null,
          productName: service.name || "",
          productImage: service.image || null,
          sellerId,
          type: "service",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate(`/messages/${conversationId}`);
    } catch (err) {
      console.error(err);
      alert("Unable to open chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading service...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!service) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FiImage size={26} className="mx-auto text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            Service Not Found
          </h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/browse-products?tab=services")}
            className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl"
          >
            Back to Services
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/browse-products?tab=services")}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600"
        >
          <FiArrowLeft />
          <span>Back to Services</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-72 sm:h-96 lg:h-[450px] object-cover"
                />
              ) : (
                <div className="w-full h-72 sm:h-96 lg:h-[450px] flex items-center justify-center">
                  <FiTag size={48} className="text-gray-300" />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-green-600 font-medium text-sm">
                {service.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">
                {service.name}
              </h1>

              <div className="mt-6">
                <p className="text-sm text-gray-400">Starting price</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">
                  ₦{Number(service.price || 0).toLocaleString()}
                </h2>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={openSellerStore}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openSellerStore();
                }}
                className="flex items-center gap-3 mt-6 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-green-50 border border-transparent hover:border-green-100 group"
              >
                {service.sellerImage ? (
                  <img
                    src={service.sellerImage}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                    <FiUser className="text-green-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Offered by</p>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-800 truncate group-hover:text-[#008236]">
                      {service.sellerName}
                    </p>
                    {service.isVerifiedSeller && <VerifiedBadge size={15} />}
                  </div>
                  <p className="text-[11px] text-[#008236] mt-0.5 font-medium">
                    View profile & more
                  </p>
                </div>
                <FiChevronRight className="text-gray-300 group-hover:text-[#008236]" />
              </div>

              <button
                type="button"
                onClick={handleChatWithSeller}
                disabled={chatLoading || profileLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 border border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-60 py-3 rounded-xl font-semibold"
              >
                {chatLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Opening Chat...
                  </>
                ) : (
                  <>
                    <FiMessageCircle />
                    Chat about this service
                  </>
                )}
              </button>

              <div className="mt-6">
                <h3 className="font-bold text-gray-800">About this service</h3>
                <p className="text-gray-500 text-sm leading-6 mt-2">
                  {service.description ||
                    "Contact the provider on CampusMart to discuss details, timing, and delivery."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default ServiceDetails;