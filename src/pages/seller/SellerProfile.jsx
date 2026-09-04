import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiMessageCircle,
  FiDollarSign,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit3,
  FiSave,
  FiCamera,
} from "react-icons/fi";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

// =========================================================
// DEFAULT PROFILE
// =========================================================

const DEFAULT_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  campus: "",
  address: "",
  profileImage: null,
  role: "Seller",
};

// =========================================================
// SELLER PROFILE
// =========================================================

function SellerProfile({
  profile: profileFromApp,
  updateProfile,
  unreadMessages = 0,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  // =======================================================
  // PROFILE FROM APP (no localStorage)
  // App.jsx should load: users/{firebaseUser.uid}
  // =======================================================

  const profile = {
    ...DEFAULT_PROFILE,
    ...(profileFromApp || {}),
    email:
      profileFromApp?.email ||
      firebaseUser?.email ||
      "",
    fullName:
      profileFromApp?.fullName ||
      profileFromApp?.name ||
      profileFromApp?.displayName ||
      firebaseUser?.displayName ||
      "",
    profileImage:
      profileFromApp?.profileImage ||
      profileFromApp?.photoURL ||
      profileFromApp?.avatar ||
      firebaseUser?.photoURL ||
      null,
    role: profileFromApp?.role || "Seller",
  };

  // =======================================================
  // SIDEBAR
  // =======================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pending orders badge
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // =======================================================
  // EDIT MODE
  // =======================================================

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState(profile);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Keep form in sync when profile prop updates
  useEffect(() => {
    if (!editing) {
      setFormData({
        ...DEFAULT_PROFILE,
        ...profile,
      });
    }
  }, [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.campus,
    profile.address,
    profile.profileImage,
  ]);

  // =======================================================
  // PENDING ORDERS BADGE
  // =======================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setNewOrdersCount(0);
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        let pending = 0;

        snapshot.docs.forEach((orderDoc) => {
          const data = orderDoc.data() || {};
          const status = String(data.status || "pending").toLowerCase();

          if (status === "cancelled" || status === "canceled") {
            return;
          }

          if (
            status === "pending" ||
            status === "placed" ||
            status === "processing"
          ) {
            pending += 1;
          }
        });

        setNewOrdersCount(pending);
      },
      (error) => {
        console.error("Seller profile orders badge error:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  // =======================================================
  // SELLER DISPLAY
  // =======================================================

  const sellerFullName =
    profile.fullName?.trim() ||
    firebaseUser?.displayName?.trim() ||
    "Seller";

  const sellerFirstName =
    sellerFullName.split(/\s+/)[0] || "Seller";

  const sellerImage = profile.profileImage || null;

  // =======================================================
  // MENU (Reviews & Analytics removed)
  // =======================================================

  const menuItems = useMemo(
    () => [
      {
        label: "Dashboard",
        icon: FiGrid,
        path: "/seller-dashboard",
      },
      {
        label: "Products",
        icon: FiPackage,
        path: "/seller/products",
      },
      {
        label: "Orders",
        icon: FiShoppingBag,
        path: "/seller/orders",
        badge: newOrdersCount,
      },
      {
        label: "Messages",
        icon: FiMessageCircle,
        path: "/seller/messages",
        badge: unreadMessages,
      },
      {
        label: "Earnings",
        icon: FiDollarSign,
        path: "/seller/earnings",
      },
      {
        label: "Promotions",
        icon: FiTag,
        path: "/seller/promotions",
        new: true,
      },
      {
        label: "Profile",
        icon: FiUser,
        path: "/seller/profile",
      },
      {
        label: "Settings",
        icon: FiSettings,
        path: "/seller/settings",
      },
    ],
    [newOrdersCount, unreadMessages]
  );

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =======================================================
  // FORM
  // =======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCameraClick = () => {
    if (saving) return;
    fileInputRef.current?.click();
  };

  // =======================================================
  // PROFILE PICTURE (saved via updateProfile → Firestore)
  // =======================================================

  const handleProfileImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 700 * 1024) {
      alert("Please choose a profile image smaller than 700 KB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const imageUrl = reader.result;
        if (!imageUrl) return;

        if (typeof updateProfile !== "function") {
          console.error(
            "updateProfile was not provided to SellerProfile.jsx"
          );
          alert("Profile update function is not available.");
          return;
        }

        setSaving(true);

        await updateProfile({
          profileImage: imageUrl,
        });

        window.dispatchEvent(new Event("profileUpdated"));
      } catch (error) {
        console.error("Error updating profile picture:", error);
        alert("Could not update your profile picture. Please try again.");
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      alert("Could not read the selected image.");
      setSaving(false);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEdit = () => {
    setFormData({
      ...DEFAULT_PROFILE,
      ...profile,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (typeof updateProfile !== "function") {
      console.error(
        "updateProfile was not provided to SellerProfile.jsx"
      );
      alert("Profile update function is not available.");
      return;
    }

    const updatedProfile = {
      fullName: formData.fullName?.trim() || "",
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      campus: formData.campus?.trim() || "",
      address: formData.address?.trim() || "",
    };

    try {
      setSaving(true);
      await updateProfile(updatedProfile);
      window.dispatchEvent(new Event("profileUpdated"));
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ...DEFAULT_PROFILE,
      ...profile,
    });
    setEditing(false);
  };

  const roleText =
    String(profile.role || "").trim() || "Seller";

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px]
          lg:w-[291px] lg:min-w-[250px]
          bg-[#008236] text-white
          flex flex-col h-[100dvh] overflow-hidden
          shadow-2xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              lg:hidden absolute top-3 right-3
              w-9 h-9 rounded-lg text-white
              hover:bg-white/10 active:bg-white/20
              flex items-center justify-center transition z-20
            "
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div
              className="
                w-10 h-10 min-w-[40px] rounded-xl
                bg-[#006f2e] flex items-center justify-center
                shadow-lg shadow-black/30 border border-white/10 flex-shrink-0
              "
            >
              <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-[30px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">Campus</span>
                <span className="text-green-300">Mart</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1 whitespace-nowrap">
                Sell. Connect. Grow.
              </p>
            </div>
          </div>
        </div>

        <nav
          className="
            flex-1 px-4 py-3 overflow-y-auto overflow-x-hidden
            overscroll-contain flex flex-col justify-start gap-1
          "
        >
          {menuItems.map(
            ({ label, icon: Icon, path, badge, new: isNew }) => {
              const active = isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavigation(path)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-3
                    rounded-xl text-left transition-all flex-shrink-0
                    ${
                      active
                        ? "bg-white text-[#008236] shadow-sm font-semibold"
                        : "text-white hover:bg-white/10 active:bg-white/20"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 2}
                    className="flex-shrink-0"
                  />
                  <span className="flex-1 text-[14px] whitespace-nowrap">
                    {label}
                  </span>
                  {badge > 0 && (
                    <span
                      className="
                        min-w-[21px] h-[21px] px-1.5 rounded-full
                        bg-red-500 text-white text-[10px] font-bold
                        flex items-center justify-center flex-shrink-0
                      "
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {isNew && (
                    <span
                      className={`
                        px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0
                        ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-green-500 text-white"
                        }
                      `}
                    >
                      New
                    </span>
                  )}
                </button>
              );
            }
          )}
        </nav>

        <div className="px-4 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-3.5 py-3 rounded-xl
              text-white hover:bg-white/10 active:bg-white/20
              transition text-left
            "
          >
            <FiLogOut size={19} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <div className="border border-green-300/30 bg-green-900/20 rounded-xl p-3.5 text-center">
            <div className="text-2xl mb-1">👑</div>
            <h3 className="font-bold text-sm">Go Premium</h3>
            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and services and reach more students.
            </p>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/promotions")}
              className="
                w-full mt-2 h-9 rounded-lg bg-white text-[#008236]
                font-bold text-xs hover:bg-green-50 active:bg-green-100 transition
              "
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div
        className="
          min-w-0 flex flex-col h-[100dvh] w-full
          lg:ml-[291px] lg:w-[calc(100%-291px)]
        "
      >
        {/* TOP NAVBAR */}
        <header
          className="
            min-h-[70px] bg-[#007233] text-white
            flex items-center px-3 sm:px-5 lg:px-8 py-3
            gap-2 sm:gap-4 flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              lg:hidden w-10 h-10 min-w-[40px] rounded-lg
              hover:bg-white/10 active:bg-white/20
              flex items-center justify-center flex-shrink-0
            "
          >
            <FiMenu size={24} />
          </button>

          <div className="flex items-center gap-2 text-white flex-shrink-0">
            <FiShoppingBag size={19} className="text-green-200" />

            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
              Your Store
            </span>
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              aria-label="Messages"
              className="
                relative w-9 h-9 sm:w-10 sm:h-10 rounded-full
                hover:bg-white/10 active:bg-white/20
                flex items-center justify-center transition flex-shrink-0
              "
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span
                  className="
                    absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1
                    rounded-full bg-red-500 text-white text-[9px] font-bold
                    flex items-center justify-center
                  "
                >
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="
                flex items-center gap-2 ml-0.5
                hover:bg-white/10 active:bg-white/20
                rounded-lg px-1 sm:px-1.5 py-1.5 transition flex-shrink-0
              "
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover
                    border-2 border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-700
                    flex items-center justify-center font-bold text-sm
                    border-2 border-white/30 flex-shrink-0
                  "
                >
                  {sellerFirstName?.charAt(0)?.toUpperCase()}
                </div>
              )}

              <div className="hidden sm:block text-left">
                <p
                  className="text-xs font-bold leading-4 max-w-[180px] truncate"
                  title={sellerFullName}
                >
                  {sellerFullName}
                </p>
                <p className="text-[10px] text-green-100 mt-0.5">Seller</p>
              </div>

              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main
          className="
            flex-1 overflow-y-auto overflow-x-hidden bg-gray-50
            px-3 sm:px-5 md:px-6 lg:px-8
            py-5 sm:py-6 lg:py-8
          "
        >
          {/* GREEN BANNER */}
          <div
            className="
              relative overflow-hidden rounded-2xl
              bg-gradient-to-r from-[#007233]
                to-[#008f3f]
               
              p-6 sm:p-7 text-white
              shadow-lg shadow-green-700/20 mb-6
            "
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-2 top-16 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute right-24 -bottom-12 h-32 w-32 rounded-full bg-white/5" />

            <div
              className="
                relative inline-flex items-center gap-1.5 rounded-full
                bg-white/15 px-3 py-1 text-xs font-medium text-green-50
                backdrop-blur-sm
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
              Profile
            </div>

            <h1 className="relative mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
              Your Profile, {sellerFirstName}
            </h1>

            <p className="relative mt-2 max-w-xl text-sm sm:text-[15px] text-green-100 leading-relaxed">
              Manage your personal information and keep your seller account up
              to date.
            </p>
          </div>

          {/* PROFILE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT CARD */}
            <div className="bg-white rounded-2xl border border-green-100 p-6 h-fit shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div
                    className="
                      w-28 h-28 rounded-full bg-green-100 text-green-600
                      flex items-center justify-center text-4xl font-bold
                      border-4 border-white shadow-sm overflow-hidden
                    "
                  >
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {profile.fullName?.charAt(0)?.toUpperCase() || "S"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={saving}
                    className="
                      absolute bottom-1 right-1 w-9 h-9 rounded-full
                      bg-green-600 hover:bg-green-700
                      disabled:bg-green-400 disabled:cursor-not-allowed
                      text-white flex items-center justify-center
                      border-4 border-white transition
                    "
                    title="Change profile picture"
                  >
                    <FiCamera size={15} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImage}
                    className="hidden"
                  />
                </div>

                <h2 className="text-xl font-bold text-gray-800 mt-4">
                  {profile.fullName || "Your Name"}
                </h2>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  {profile.email || "No email"}
                </p>

                <p className="text-sm text-gray-500 mt-1">{roleText}</p>

                <div
                  className="
                    mt-4 inline-flex items-center gap-2
                    bg-green-50 text-green-600 px-3 py-1.5
                    rounded-full text-xs font-medium
                  "
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active Account
                </div>

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={saving}
                  className="
                    mt-4 text-sm text-green-600 hover:text-green-700
                    disabled:text-green-400 font-medium
                  "
                >
                  {saving ? "Saving..." : "Change Profile Picture"}
                </button>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-green-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your seller account information
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={saving}
                    className="
                      flex items-center gap-2 px-4 py-2.5 rounded-xl
                      border border-green-600 text-green-600
                      hover:bg-green-50 disabled:opacity-50
                      text-sm font-medium
                    "
                  >
                    <FiEdit3 size={16} />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName || ""}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      className="
                        w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                        bg-gray-50 text-sm outline-none
                        focus:bg-white focus:border-green-500
                        disabled:cursor-not-allowed
                      "
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      className="
                        w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                        bg-gray-50 text-sm outline-none
                        focus:bg-white focus:border-green-500
                        disabled:cursor-not-allowed
                      "
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      className="
                        w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                        bg-gray-50 text-sm outline-none
                        focus:bg-white focus:border-green-500
                        disabled:cursor-not-allowed
                      "
                    />
                  </div>
                </div>

                {/* Campus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="campus"
                      value={formData.campus || ""}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      className="
                        w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                        bg-gray-50 text-sm outline-none
                        focus:bg-white focus:border-green-500
                        disabled:cursor-not-allowed
                      "
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      rows={3}
                      className="
                        w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                        bg-gray-50 text-sm outline-none resize-none
                        focus:bg-white focus:border-green-500
                        disabled:cursor-not-allowed
                      "
                    />
                  </div>
                </div>
              </div>

              {editing && (
                <div
                  className="
                    flex flex-col sm:flex-row justify-end gap-3
                    mt-6 pt-5 border-t border-gray-100
                  "
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="
                      flex items-center justify-center gap-2 px-5 py-3
                      rounded-xl border border-gray-200 text-gray-600
                      hover:bg-gray-50 disabled:opacity-50
                    "
                  >
                    <FiX size={16} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="
                      flex items-center justify-center gap-2 px-5 py-3
                      rounded-xl bg-green-600 hover:bg-green-700
                      disabled:bg-green-400 text-white
                    "
                  >
                    <FiSave size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerProfile;