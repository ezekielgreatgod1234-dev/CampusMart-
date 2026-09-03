import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

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
  FiBell,
  FiChevronDown,
  FiX,
  FiLock,
  FiShield,
  FiEye,
  FiHelpCircle,
  FiMail,
  FiChevronRight,
  FiCheck,
  FiSave,
  FiAlertCircle,
  FiSend,
  FiEyeOff,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

/* =========================================================
   SELLER SETTINGS
========================================================= */

function SellerSettings({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeSection, setActiveSection] = useState("personal");

  const [loading, setLoading] = useState(true);

  /* =======================================================
     FIXED PROFILE STATE
  ======================================================= */

  const [sellerProfile, setSellerProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    campus: "",
    address: "",
  });

  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    campus: "",
  });

  const [personalSaved, setPersonalSaved] = useState(false);

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");

  const [passwordUpdating, setPasswordUpdating] = useState(false);

  /* =======================================================
     PROFILE VISIBILITY
  ======================================================= */

  const [profileVisibility, setProfileVisibility] = useState("campus");

  /* =======================================================
     CONTACT SUPPORT
  ======================================================= */

  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const [contactSent, setContactSent] = useState(false);

  const [contactError, setContactError] = useState("");

  const [contactSending, setContactSending] = useState(false);

  /* =======================================================
     SELLER DISPLAY
  ======================================================= */

  const sellerFullName =
    sellerProfile?.fullName ||
    profile?.fullName ||
    profile?.name ||
    profile?.displayName ||
    firebaseUser?.displayName?.trim() ||
    "Seller";

  const sellerFirstName =
    String(sellerFullName).trim().split(/\s+/)[0] || "Seller";

  const sellerImage =
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.profilePicture ||
    profile?.avatar ||
    profile?.imageUrl ||
    profile?.image ||
    firebaseUser?.photoURL ||
    null;

  /* =======================================================
     MAIN SELLER MENU
  ======================================================= */

  const menuItems = [
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
  ];

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

  const handleNotifications = () => {
    console.log("Open seller notifications");
  };

  /* =======================================================
     LOAD USER SETTINGS
  ======================================================= */

  useEffect(() => {
    const loadSettings = async () => {
      if (!firebaseUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const userRef = doc(db, "users", firebaseUser.uid);

        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          const savedProfile = userData.profile || userData || {};

          const savedSettings = userData.settings || {};

          const loadedProfile = {
            fullName:
              savedProfile.fullName ||
              savedProfile.name ||
              savedProfile.displayName ||
              firebaseUser.displayName ||
              "",

            email:
              savedProfile.email ||
              firebaseUser.email ||
              "",

            phone: savedProfile.phone || "",

            campus: savedProfile.campus || "",

            address: savedProfile.address || "",
          };

          setSellerProfile(loadedProfile);

          setPersonalForm({
            fullName: loadedProfile.fullName,
            email: loadedProfile.email,
            phone: loadedProfile.phone,
            campus: loadedProfile.campus,
          });

          setProfileVisibility(
            savedSettings.profileVisibility || "campus"
          );
        } else {
          const newProfile = {
            fullName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            phone: "",
            campus: "",
            address: "",
          };

          const newSettings = {
            profileVisibility: "campus",
          };

          await setDoc(
            userRef,
            {
              profile: newProfile,
              settings: newSettings,
              role: "seller",
            },
            { merge: true }
          );

          setSellerProfile(newProfile);

          setPersonalForm({
            fullName: newProfile.fullName,
            email: newProfile.email,
            phone: "",
            campus: "",
          });

          setProfileVisibility("campus");
        }
      } catch (error) {
        console.error("Could not load seller settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [firebaseUser]);

  /* =======================================================
     PASSWORD STRENGTH
  ======================================================= */

  const getPasswordStrength = (password) => {
    if (!password) return "";

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return "Not strong enough";
    if (score <= 4) return "Strong";

    return "Very strong";
  };

  const passwordStrength = getPasswordStrength(
    passwordForm.newPassword
  );

  /* =======================================================
     SETTINGS MENU SECTIONS
  ======================================================= */

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          id: "personal",
          label: "Personal Information",
          icon: FiUser,
        },
        {
          id: "password",
          label: "Change Password",
          icon: FiLock,
        },
      ],
    },

    {
      title: "Privacy & Security",
      items: [
        {
          id: "visibility",
          label: "Profile Visibility",
          icon: FiEye,
        },
      ],
    },

    {
      title: "Support",
      items: [
        {
          id: "help",
          label: "Help",
          icon: FiHelpCircle,
        },
        {
          id: "faq",
          label: "FAQ",
          icon: FiMessageCircle,
        },
        {
          id: "contact",
          label: "Contact CampusMart",
          icon: FiMail,
        },
      ],
    },

    {
      title: "Legal",
      items: [
        {
          id: "terms",
          label: "Terms & Conditions",
          icon: FiFileText,
        },
        {
          id: "privacy",
          label: "Privacy Policy",
          icon: FiBookOpen,
        },
      ],
    },
  ];

  /* =======================================================
     PERSONAL INFORMATION
  ======================================================= */

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;

    setPersonalForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPersonalSaved(false);
  };

  const handlePersonalSave = async () => {
    if (!firebaseUser?.uid) return;

    try {
      const updatedProfile = {
        ...sellerProfile,
        ...personalForm,
      };

      const userRef = doc(db, "users", firebaseUser.uid);

      await setDoc(
        userRef,
        {
          profile: updatedProfile,
        },
        {
          merge: true,
        }
      );

      setSellerProfile(updatedProfile);

      setPersonalSaved(true);

      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        setPersonalSaved(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Could not save personal information:",
        error
      );

      setPersonalSaved(false);
    }
  };

  /* =======================================================
     PASSWORD
  ======================================================= */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordMessage("");
  };

  const handlePasswordUpdate = async () => {
    setPasswordMessage("");

    if (!firebaseUser) {
      setPasswordMessage(
        "Your account session has expired. Please log in again."
      );
      return;
    }

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage(
        "Please fill in all password fields."
      );
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      setPasswordMessage(
        "Your new password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordMessage(
        "Your new password must contain at least one number."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordMessage(
        "New password and confirmation password do not match."
      );
      return;
    }

    if (!firebaseUser.email) {
      setPasswordMessage(
        "No email address is associated with this account."
      );
      return;
    }

    const passwordProvider =
      firebaseUser.providerData?.some(
        (provider) =>
          provider.providerId === "password"
      );

    if (!passwordProvider) {
      setPasswordMessage(
        "This account does not use email and password login. Please use the sign-in method you registered with."
      );
      return;
    }

    try {
      setPasswordUpdating(true);

      const credential =
        EmailAuthProvider.credential(
          firebaseUser.email,
          passwordForm.currentPassword
        );

      await reauthenticateWithCredential(
        firebaseUser,
        credential
      );

      await updatePassword(
        firebaseUser,
        passwordForm.newPassword
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage("success");
    } catch (error) {
      console.error(
        "Password update error:",
        error
      );

      switch (error.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setPasswordMessage(
            "Your current password is incorrect."
          );
          break;

        case "auth/requires-recent-login":
          setPasswordMessage(
            "For security, please log out and log in again before changing your password."
          );
          break;

        case "auth/weak-password":
          setPasswordMessage(
            "This password is too weak. Please choose a stronger password."
          );
          break;

        case "auth/too-many-requests":
          setPasswordMessage(
            "Too many attempts. Please wait a while and try again."
          );
          break;

        default:
          setPasswordMessage(
            "Unable to update your password. Please try again."
          );
      }
    } finally {
      setPasswordUpdating(false);
    }
  };

  /* =======================================================
     PROFILE VISIBILITY
  ======================================================= */

  const handleVisibilityChange = async (value) => {
    if (!firebaseUser?.uid) return;

    try {
      setProfileVisibility(value);

      const userRef = doc(
        db,
        "users",
        firebaseUser.uid
      );

      await setDoc(
        userRef,
        {
          settings: {
            profileVisibility: value,
          },
        },
        {
          merge: true,
        }
      );
    } catch (error) {
      console.error(
        "Could not update profile visibility:",
        error
      );
    }
  };

  /* =======================================================
     CONTACT SUPPORT
  ======================================================= */

  const handleContactChange = (e) => {
    const { name, value } = e.target;

    setContactForm((current) => ({
      ...current,
      [name]: value,
    }));

    setContactSent(false);
    setContactError("");
  };

  const handleContactSubmit = async () => {
    setContactError("");
    setContactSent(false);

    /* -----------------------------------------------
       CHECK AUTHENTICATION
    ------------------------------------------------ */

    if (!firebaseUser?.uid) {
      setContactError(
        "Your account session has expired. Please log in again."
      );
      return;
    }

    /* -----------------------------------------------
       VALIDATE SUBJECT
    ------------------------------------------------ */

    const subject = contactForm.subject.trim();

    if (!subject) {
      setContactError(
        "Please enter a subject."
      );
      return;
    }

    /* -----------------------------------------------
       VALIDATE MESSAGE
    ------------------------------------------------ */

    const message = contactForm.message.trim();

    if (!message) {
      setContactError(
        "Please enter your message."
      );
      return;
    }

    /* -----------------------------------------------
       OPTIONAL LENGTH VALIDATION
    ------------------------------------------------ */

    if (subject.length > 150) {
      setContactError(
        "Subject must be 150 characters or less."
      );
      return;
    }

    if (message.length > 5000) {
      setContactError(
        "Message must be 5000 characters or less."
      );
      return;
    }

    try {
      setContactSending(true);

      /* ---------------------------------------------
         CREATE SUPPORT MESSAGE
      --------------------------------------------- */

      const supportMessage = {
        userId: firebaseUser.uid,

        userName:
          sellerProfile?.fullName ||
          personalForm.fullName ||
          profile?.fullName ||
          profile?.name ||
          firebaseUser.displayName ||
          "CampusMart Seller",

        userEmail:
          firebaseUser.email ||
          personalForm.email ||
          profile?.email ||
          "",

        role: "seller",

        subject,

        message,

        status: "unread",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "supportMessages"),
        supportMessage
      );

      /* ---------------------------------------------
         SUCCESS
      --------------------------------------------- */

      setContactSent(true);

      setContactForm({
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error(
        "Could not send support message:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setContactError(
          "You do not have permission to send this support message. Please make sure you are logged in."
        );
      } else {
        setContactError(
          "We couldn't send your message. Please check your internet connection and try again."
        );
      }
    } finally {
      setContactSending(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col">

      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

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

        {/* LOGO */}

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
            <FiX
              size={21}
              strokeWidth={2.5}
            />
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
                <span className="text-white">
                  Campus
                </span>

                <span className="text-green-300">
                  Mart
                </span>
              </h1>

              <p className="text-[10px] text-green-100 mt-1 whitespace-nowrap">
                Sell. Connect. Grow.
              </p>

            </div>
          </div>
        </div>

        {/* MENU */}

        <nav
          className="
            flex-1 px-4 py-3 overflow-y-auto overflow-x-hidden
            overscroll-contain flex flex-col justify-start gap-1
          "
        >
          {menuItems.map(
            ({
              label,
              icon: Icon,
              path,
              badge,
              new: isNew,
            }) => {

              const active = isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleNavigation(path)
                  }
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
                    strokeWidth={
                      active ? 2.5 : 2
                    }
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
                      {badge}
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

        {/* LOGOUT */}

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

            <span className="text-[14px]">
              Logout
            </span>
          </button>

        </div>

        {/* PREMIUM */}

        <div className="px-4 pb-3 flex-shrink-0">

          <div className="border border-green-300/30 bg-green-900/20 rounded-xl p-3.5 text-center">

            <div className="text-2xl mb-1">
              👑
            </div>

            <h3 className="font-bold text-sm">
              Go Premium
            </h3>

            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and services and reach more students.
            </p>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/promotions"
                )
              }
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

      {/* ===================================================
          MAIN
      =================================================== */}

      <div
        className="
          min-w-0 flex flex-col h-[100dvh] w-full
          lg:ml-[291px] lg:w-[calc(100%-291px)]
        "
      >

        {/* =================================================
            TOP NAVBAR
        ================================================= */}

        <header
          className="
            min-h-[70px] bg-[#007233] text-white
            flex items-center px-3 sm:px-5 lg:px-8 py-3
            gap-2 sm:gap-4 flex-shrink-0
          "
        >

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
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

            <FiShoppingBag
              size={19}
              className="text-green-200"
            />

            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
              Your Store
            </span>

          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={handleNotifications}
              aria-label="Notifications"
              className="
                relative w-9 h-9 sm:w-10 sm:h-10 rounded-full
                hover:bg-white/10 active:bg-white/20
                flex items-center justify-center transition flex-shrink-0
              "
            >

              <FiBell size={20} />

              <span
                className="
                  absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1
                  rounded-full bg-red-500 text-white text-[9px] font-bold
                  flex items-center justify-center
                "
              >
                5
              </span>

            </button>

            {/* MESSAGES */}

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/messages"
                )
              }
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

            {/* PROFILE */}

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
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
                  {sellerFirstName
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              )}

              <div className="hidden sm:block text-left">

                <p
                  className="text-xs font-bold leading-4 max-w-[180px] truncate"
                  title={sellerFullName}
                >
                  {sellerFullName}
                </p>

                <p className="text-[10px] text-green-100 mt-0.5">
                  Seller
                </p>

              </div>

              <FiChevronDown
                size={16}
                className="hidden sm:block"
              />

            </button>

          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

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
              bg-gradient-to-r from-[#007233] to-[#008f3f]
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

              Settings
            </div>

            <h1 className="relative mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
              Your Settings, {sellerFirstName}
            </h1>

            <p className="relative mt-2 max-w-xl text-sm sm:text-[15px] text-green-100 leading-relaxed">
              Manage your CampusMart seller account, privacy and preferences.
            </p>

          </div>

          {/* SETTINGS LAYOUT */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* SETTINGS SIDE MENU */}

            <div className="bg-white rounded-2xl border border-green-100 p-4 h-fit shadow-sm">

              <div className="flex items-center gap-3 px-3 pb-4 border-b border-gray-100">

                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <FiShield size={20} />
                </div>

                <div>

                  <h2 className="font-bold text-gray-800">
                    Settings
                  </h2>

                  <p className="text-xs text-gray-500">
                    Account preferences
                  </p>

                </div>

              </div>

              <div className="mt-4 space-y-5">

                {menuSections.map(
                  (section) => (
                    <div key={section.title}>

                      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {section.title}
                      </p>

                      <div className="space-y-1">

                        {section.items.map(
                          (item) => {

                            const Icon =
                              item.icon;

                            const active =
                              activeSection ===
                              item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setActiveSection(
                                    item.id
                                  )
                                }
                                className={`
                                  w-full flex items-center justify-between gap-3
                                  px-3 py-3 rounded-xl text-left transition
                                  ${
                                    active
                                      ? "bg-green-50 text-green-600"
                                      : "text-gray-600 hover:bg-gray-50 hover:text-green-600"
                                  }
                                `}
                              >

                                <div className="flex items-center gap-3">

                                  <div
                                    className={`
                                      w-9 h-9 rounded-lg flex items-center justify-center
                                      ${
                                        active
                                          ? "bg-white text-green-600"
                                          : "bg-gray-50 text-gray-400"
                                      }
                                    `}
                                  >
                                    <Icon size={17} />
                                  </div>

                                  <span
                                    className={`text-sm ${
                                      active
                                        ? "font-semibold"
                                        : "font-medium"
                                    }`}
                                  >
                                    {item.label}
                                  </span>

                                </div>

                                {active && (
                                  <FiChevronRight
                                    size={16}
                                  />
                                )}

                              </button>
                            );
                          }
                        )}

                      </div>
                    </div>
                  )
                )}

              </div>
            </div>

            {/* CONTENT PANEL */}

            <div className="lg:col-span-2 bg-white rounded-2xl border border-green-100 p-5 sm:p-6 shadow-sm">

              {/* =================================================
                  PERSONAL
              ================================================= */}

              {activeSection ===
                "personal" && (
                <section>

                  <SettingsHeader
                    title="Personal Information"
                    description="Manage your personal details and seller account information."
                    icon={FiUser}
                  />

                  {personalSaved && (
                    <SuccessMessage message="Your personal information has been saved successfully." />
                  )}

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

                    <SettingsInput
                      label="Full Name"
                      name="fullName"
                      value={
                        personalForm.fullName
                      }
                      onChange={
                        handlePersonalChange
                      }
                      icon={FiUser}
                    />

                    <SettingsInput
                      label="Email Address"
                      name="email"
                      type="email"
                      value={
                        personalForm.email
                      }
                      onChange={
                        handlePersonalChange
                      }
                      icon={FiMail}
                    />

                    <SettingsInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={
                        personalForm.phone
                      }
                      onChange={
                        handlePersonalChange
                      }
                      icon={FiUser}
                    />

                    <SettingsInput
                      label="Campus"
                      name="campus"
                      value={
                        personalForm.campus
                      }
                      onChange={
                        handlePersonalChange
                      }
                      icon={FiEye}
                    />

                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">

                    <button
                      type="button"
                      onClick={
                        handlePersonalSave
                      }
                      className="
                        flex items-center justify-center gap-2 px-5 py-3
                        rounded-xl bg-green-600 hover:bg-green-700
                        text-white text-sm font-medium transition
                      "
                    >
                      <FiSave size={16} />

                      Save Changes
                    </button>

                  </div>

                </section>
              )}

              {/* =================================================
                  PASSWORD
              ================================================= */}

              {activeSection ===
                "password" && (
                <section>

                  <SettingsHeader
                    title="Change Password"
                    description="Update your account password to keep your seller account secure."
                    icon={FiLock}
                  />

                  {passwordMessage ===
                    "success" && (
                    <SuccessMessage message="Your password has been updated successfully." />
                  )}

                  {passwordMessage &&
                    passwordMessage !==
                      "success" && (
                      <div className="mt-5">
                        <ErrorMessage
                          message={
                            passwordMessage
                          }
                        />
                      </div>
                    )}

                  <div className="mt-6 space-y-5 max-w-lg">

                    <PasswordField
                      label="Current Password"
                      name="currentPassword"
                      value={
                        passwordForm.currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter current password"
                    />

                    <PasswordField
                      label="New Password"
                      name="newPassword"
                      value={
                        passwordForm.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter new password"
                    />

                    <PasswordField
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Confirm new password"
                    />

                    {passwordForm.newPassword && (
                      <div className="space-y-2">

                        <p className="text-xs text-gray-500">
                          Strength:{" "}
                          <span className="font-semibold text-gray-700">
                            {passwordStrength}
                          </span>
                        </p>

                        <PasswordRequirement
                          checked={
                            passwordForm.newPassword.length >=
                            8
                          }
                          text="At least 8 characters"
                        />

                        <PasswordRequirement
                          checked={/[A-Z]/.test(
                            passwordForm.newPassword
                          )}
                          text="At least one uppercase letter"
                        />

                        <PasswordRequirement
                          checked={/[0-9]/.test(
                            passwordForm.newPassword
                          )}
                          text="At least one number"
                        />

                      </div>
                    )}

                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">

                    <button
                      type="button"
                      onClick={
                        handlePasswordUpdate
                      }
                      disabled={
                        passwordUpdating
                      }
                      className="
                        flex items-center justify-center gap-2 px-5 py-3
                        rounded-xl bg-green-600 hover:bg-green-700
                        disabled:bg-green-300 text-white text-sm font-medium transition
                      "
                    >

                      <FiLock size={16} />

                      {passwordUpdating
                        ? "Updating..."
                        : "Update Password"}

                    </button>

                  </div>

                </section>
              )}

              {/* =================================================
                  VISIBILITY
              ================================================= */}

              {activeSection ===
                "visibility" && (
                <section>

                  <SettingsHeader
                    title="Profile Visibility"
                    description="Control who can see your seller profile on CampusMart."
                    icon={FiEye}
                  />

                  <div className="mt-6 space-y-3">

                    <VisibilityCard
                      active={
                        profileVisibility ===
                        "public"
                      }
                      onClick={() =>
                        handleVisibilityChange(
                          "public"
                        )
                      }
                      title="Public"
                      description="Anyone on CampusMart can see your seller profile."
                      icon={FiEye}
                    />

                    <VisibilityCard
                      active={
                        profileVisibility ===
                        "campus"
                      }
                      onClick={() =>
                        handleVisibilityChange(
                          "campus"
                        )
                      }
                      title="Campus only"
                      description="Only users from your campus can see your profile."
                      icon={FiShield}
                    />

                    <VisibilityCard
                      active={
                        profileVisibility ===
                        "private"
                      }
                      onClick={() =>
                        handleVisibilityChange(
                          "private"
                        )
                      }
                      title="Private"
                      description="Your profile is hidden from other users."
                      icon={FiLock}
                    />

                  </div>

                </section>
              )}

              {/* =================================================
                  HELP
              ================================================= */}

              {activeSection === "help" && (
                <section>

                  <SettingsHeader
                    title="Help"
                    description="Quick tips for managing your seller account."
                    icon={FiHelpCircle}
                  />

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <SupportCard
                      icon={FiPackage}
                      title="Managing products"
                      description="Add, edit and update your product listings from the Products page."
                      onClick={() =>
                        handleNavigation(
                          "/seller/products"
                        )
                      }
                    />

                    <SupportCard
                      icon={FiShoppingBag}
                      title="Orders"
                      description="Track and fulfill buyer orders from your Orders page."
                      onClick={() =>
                        handleNavigation(
                          "/seller/orders"
                        )
                      }
                    />

                    <SupportCard
                      icon={FiMessageCircle}
                      title="Messages"
                      description="Reply to buyers quickly from your Messages inbox."
                      onClick={() =>
                        handleNavigation(
                          "/seller/messages"
                        )
                      }
                    />

                    <SupportCard
                      icon={FiMail}
                      title="Contact support"
                      description="Need more help? Send a message to the CampusMart team."
                      onClick={() =>
                        setActiveSection(
                          "contact"
                        )
                      }
                    />

                  </div>

                </section>
              )}

              {/* =================================================
                  FAQ
              ================================================= */}

              {activeSection === "faq" && (
                <section>

                  <SettingsHeader
                    title="FAQ"
                    description="Common questions about selling on CampusMart."
                    icon={FiMessageCircle}
                  />

                  <div className="mt-6 space-y-3">

                    <FAQ
                      question="How do I add a product?"
                      answer="Go to Products, tap Add Product, fill in the details and save. Your listing will appear for buyers on CampusMart."
                    />

                    <FAQ
                      question="How do I get paid?"
                      answer="Earnings from completed sales appear on your Earnings page. You can track available balance and withdraw when ready."
                    />

                    <FAQ
                      question="How do I chat with a buyer?"
                      answer="Open Messages from the sidebar. Select a conversation and reply directly in the chat."
                    />

                    <FAQ
                      question="Can I change my password?"
                      answer="Yes. Open Settings → Change Password, enter your current password and set a new one."
                    />

                  </div>

                </section>
              )}

              {/* =================================================
                  CONTACT CAMPUSMART
              ================================================= */}

              {activeSection === "contact" && (
                <section>

                  <SettingsHeader
                    title="Contact CampusMart"
                    description="Send a message to the CampusMart support team."
                    icon={FiMail}
                  />

                  {/* SUCCESS */}

                  {contactSent && (
                    <SuccessMessage message="Your message has been sent successfully. We'll get back to you soon." />
                  )}

                  {/* ERROR */}

                  {contactError && (
                    <div className="mt-5">
                      <ErrorMessage
                        message={contactError}
                      />
                    </div>
                  )}

                  {/* FORM */}

                  <div className="mt-6 space-y-5">

                    {/* SUBJECT */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>

                      <input
                        type="text"
                        name="subject"
                        value={
                          contactForm.subject
                        }
                        onChange={
                          handleContactChange
                        }
                        disabled={
                          contactSending
                        }
                        maxLength={150}
                        placeholder="What do you need help with?"
                        className="
                          w-full px-4 py-3 rounded-xl border border-gray-200
                          bg-gray-50 text-sm outline-none
                          focus:bg-white focus:border-green-500
                          disabled:opacity-60
                        "
                      />

                      <div className="mt-1 text-right text-[11px] text-gray-400">
                        {contactForm.subject.length}/150
                      </div>

                    </div>

                    {/* MESSAGE */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>

                      <textarea
                        rows={6}
                        name="message"
                        value={
                          contactForm.message
                        }
                        onChange={
                          handleContactChange
                        }
                        disabled={
                          contactSending
                        }
                        maxLength={5000}
                        placeholder="Write your message..."
                        className="
                          w-full px-4 py-3 rounded-xl border border-gray-200
                          bg-gray-50 text-sm outline-none resize-none
                          focus:bg-white focus:border-green-500
                          disabled:opacity-60
                        "
                      />

                      <div className="mt-1 text-right text-[11px] text-gray-400">
                        {contactForm.message.length}/5000
                      </div>

                    </div>

                    {/* SEND */}

                    <div className="flex justify-end pt-2">

                      <button
                        type="button"
                        onClick={
                          handleContactSubmit
                        }
                        disabled={
                          contactSending
                        }
                        className="
                          flex items-center justify-center gap-2 px-5 py-3
                          rounded-xl bg-green-600 hover:bg-green-700
                          disabled:bg-green-300 text-white text-sm font-medium transition
                        "
                      >

                        <FiSend size={16} />

                        {contactSending
                          ? "Sending..."
                          : "Send Message"}

                      </button>

                    </div>

                  </div>

                </section>
              )}

              {/* =================================================
                  TERMS
              ================================================= */}

              {activeSection === "terms" && (
                <section>

                  <SettingsHeader
                    title="Terms & Conditions"
                    description="Rules that apply when selling on CampusMart."
                    icon={FiFileText}
                  />

                  <div className="mt-6 space-y-6 text-sm leading-7 text-gray-600">

                    <LegalSection
                      number="1"
                      title="Acceptance of Terms"
                    >
                      By creating an account or using CampusMart, you agree to
                      comply with these Terms & Conditions. If you do not agree
                      with these terms, please do not use the platform.
                    </LegalSection>

                    <LegalSection
                      number="2"
                      title="Using CampusMart"
                    >
                      CampusMart is a marketplace designed to help students and
                      members of campus communities buy and sell products. You
                      agree to use the platform responsibly and only for lawful
                      purposes.
                    </LegalSection>

                    <LegalSection
                      number="3"
                      title="Accounts"
                    >
                      You are responsible for providing accurate information
                      when creating your account and for keeping your account
                      credentials secure. You should not share your password
                      with other people.
                    </LegalSection>

                    <LegalSection
                      number="4"
                      title="Buying and Selling"
                    >
                      Buyers and sellers are responsible for the information
                      they provide about products, prices, availability and
                      transactions. CampusMart does not permit fraudulent,
                      illegal, dangerous or prohibited items.
                    </LegalSection>

                    <LegalSection
                      number="5"
                      title="Seller Responsibility"
                    >
                      Sellers must provide honest and accurate descriptions of
                      their products. Sellers are responsible for fulfilling
                      legitimate orders and communicating appropriately with
                      buyers.
                    </LegalSection>

                    <LegalSection
                      number="6"
                      title="Buyer Responsibility"
                    >
                      Buyers should review product information carefully before
                      making a purchase. Buyers are responsible for
                      communicating with sellers and following CampusMart's
                      applicable ordering and payment procedures.
                    </LegalSection>

                    <LegalSection
                      number="7"
                      title="Prohibited Activities"
                    >
                      Users must not use CampusMart for scams, impersonation,
                      harassment, abuse, unauthorized access, spam, illegal
                      transactions or activities that could harm other users or
                      the platform.
                    </LegalSection>

                    <LegalSection
                      number="8"
                      title="Content"
                    >
                      You are responsible for the content you post, including
                      product descriptions, images and messages. Content must
                      not violate applicable laws or the rights of other people.
                    </LegalSection>

                    <LegalSection
                      number="9"
                      title="Account Suspension"
                    >
                      CampusMart may restrict, suspend or terminate an account
                      where there is a violation of these terms, misuse of the
                      platform, fraudulent activity or conduct that creates a
                      risk to other users.
                    </LegalSection>

                    <LegalSection
                      number="10"
                      title="Changes to These Terms"
                    >
                      We may update these Terms & Conditions from time to time.
                      Continued use of CampusMart after an update means that you
                      accept the updated terms.
                    </LegalSection>

                  </div>

                </section>
              )}

              {/* =================================================
                  PRIVACY
              ================================================= */}

              {activeSection === "privacy" && (
                <section>

                  <SettingsHeader
                    title="Privacy Policy"
                    description="How CampusMart handles your seller information."
                    icon={FiBookOpen}
                  />

                  <div className="mt-6 space-y-6 text-sm leading-7 text-gray-600">

                    <LegalSection
                      number="1"
                      title="Information We Collect"
                    >
                      When you create and use a CampusMart account, we may
                      collect information such as your name, email address,
                      phone number, campus information, account details and
                      information you provide while using the platform.
                    </LegalSection>

                    <LegalSection
                      number="2"
                      title="How We Use Your Information"
                    >
                      Your information may be used to create and manage your
                      account, provide marketplace functionality, process
                      orders, facilitate communication between users, provide
                      support and improve CampusMart.
                    </LegalSection>

                    <LegalSection
                      number="3"
                      title="Account Information"
                    >
                      Your account information is associated with your
                      CampusMart account. Some information may be displayed to
                      other users depending on your profile visibility settings
                      and the features you use.
                    </LegalSection>

                    <LegalSection
                      number="4"
                      title="Messages and Communications"
                    >
                      Messages sent through CampusMart may be stored so that the
                      messaging features can operate and so that we can address
                      support, safety or platform-related issues where
                      appropriate.
                    </LegalSection>

                    <LegalSection
                      number="5"
                      title="Firebase and Service Providers"
                    >
                      CampusMart uses third-party services such as Firebase to
                      provide authentication, database and other technical
                      services. Information required for these services may be
                      processed by those providers according to their applicable
                      policies.
                    </LegalSection>

                    <LegalSection
                      number="6"
                      title="Security"
                    >
                      We take reasonable steps to protect information associated
                      with your CampusMart account. However, no internet service
                      can guarantee absolute security.
                    </LegalSection>

                    <LegalSection
                      number="7"
                      title="Your Choices"
                    >
                      You can update certain account information through
                      Settings. You can also manage your profile visibility
                      using the privacy controls provided by CampusMart.
                    </LegalSection>

                    <LegalSection
                      number="8"
                      title="Data Retention"
                    >
                      We may retain information for as long as reasonably
                      necessary to provide CampusMart services, maintain
                      security, resolve disputes, comply with applicable
                      requirements and improve the platform.
                    </LegalSection>

                    <LegalSection
                      number="9"
                      title="Children and Minors"
                    >
                      CampusMart is intended for users who are legally permitted
                      to use online marketplace services. If you are not legally
                      permitted to use the service in your location, you should
                      not create an account.
                    </LegalSection>

                    <LegalSection
                      number="10"
                      title="Changes to This Privacy Policy"
                    >
                      We may update this Privacy Policy as CampusMart develops.
                      When changes are made, the updated version will be made
                      available through the platform.
                    </LegalSection>

                  </div>

                </section>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   HELPER COMPONENTS
========================================================= */

const SettingsHeader = ({
  title,
  description,
  icon: Icon,
}) => (
  <div className="flex items-start gap-4 pb-5 border-b border-gray-100">

    <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
      <Icon size={20} />
    </div>

    <div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

    </div>

  </div>
);

/* =========================================================
   SETTINGS INPUT
========================================================= */

const SettingsInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  icon: Icon,
}) => (
  <div>

    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>

    <div className="relative">

      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={17}
      />

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
          bg-gray-50 text-sm text-gray-700 outline-none
          focus:bg-white focus:border-green-500 transition
        "
      />

    </div>

  </div>
);

/* =========================================================
   PASSWORD FIELD
========================================================= */

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full rounded-xl border border-gray-200 bg-gray-50
            px-4 py-3 pr-12 text-sm text-gray-800 outline-none
            focus:border-green-500 transition
          "
        />

        <button
          type="button"
          onClick={() =>
            setShow((current) => !current)
          }
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-gray-400 hover:text-green-600
          "
        >
          {show ? (
            <FiEye size={18} />
          ) : (
            <FiEyeOff size={18} />
          )}
        </button>

      </div>

    </div>
  );
};

/* =========================================================
   PASSWORD REQUIREMENT
========================================================= */

const PasswordRequirement = ({
  checked,
  text,
}) => (
  <div className="flex items-center gap-2 text-xs">

    <span
      className={`
        w-5 h-5 rounded-full flex items-center justify-center
        ${
          checked
            ? "bg-green-100 text-green-600"
            : "bg-gray-200 text-gray-400"
        }
      `}
    >
      <FiCheck size={12} />
    </span>

    <span
      className={
        checked
          ? "text-green-600"
          : "text-gray-500"
      }
    >
      {text}
    </span>

  </div>
);

/* =========================================================
   VISIBILITY CARD
========================================================= */

const VisibilityCard = ({
  active,
  onClick,
  title,
  description,
  icon: Icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      w-full flex items-center justify-between gap-4 p-4 rounded-2xl border text-left transition
      ${
        active
          ? "border-green-500 bg-green-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
      }
    `}
  >

    <div className="flex items-center gap-4">

      <div
        className={`
          w-11 h-11 rounded-xl flex items-center justify-center shrink-0
          ${
            active
              ? "bg-white text-green-600"
              : "bg-gray-50 text-gray-400"
          }
        `}
      >
        <Icon size={19} />
      </div>

      <div>

        <h3 className="text-sm font-semibold text-gray-800">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

    </div>

    <div
      className={`
        w-5 h-5 rounded-full border flex items-center justify-center shrink-0
        ${
          active
            ? "border-green-600 bg-green-600"
            : "border-gray-300"
        }
      `}
    >
      {active && (
        <FiCheck
          className="text-white"
          size={12}
        />
      )}
    </div>

  </button>
);

/* =========================================================
   SUPPORT CARD
========================================================= */

const SupportCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="
      p-5 rounded-2xl border border-gray-100 bg-white text-left
      hover:border-green-200 hover:bg-green-50 transition
    "
  >

    <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
      <Icon size={20} />
    </div>

    <h3 className="mt-4 text-sm font-bold text-gray-800">
      {title}
    </h3>

    <p className="mt-1 text-xs leading-5 text-gray-500">
      {description}
    </p>

    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-green-600">
      Open
      <FiChevronRight size={14} />
    </div>

  </button>
);

/* =========================================================
   FAQ
========================================================= */

const FAQ = ({
  question,
  answer,
}) => (
  <details className="group rounded-2xl border border-gray-100 bg-white overflow-hidden">

    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 text-sm font-semibold text-gray-800">

      <span>{question}</span>

      <FiChevronRight
        size={18}
        className="text-gray-400 transition group-open:rotate-90 shrink-0"
      />

    </summary>

    <div className="px-5 pb-5 text-sm leading-6 text-gray-500">
      {answer}
    </div>

  </details>
);

/* =========================================================
   LEGAL SECTION
========================================================= */

const LegalSection = ({
  number,
  title,
  children,
}) => (
  <div>

    <div className="flex items-start gap-3">

      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 text-xs font-bold">
        {number}
      </div>

      <div>

        <h3 className="text-base font-bold text-gray-800">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-7 text-gray-600">
          {children}
        </p>

      </div>

    </div>

  </div>
);

/* =========================================================
   SUCCESS MESSAGE
========================================================= */

const SuccessMessage = ({
  message,
}) => (
  <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">

    <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
      <FiCheck size={15} />
    </div>

    <p className="text-sm text-green-700">
      {message}
    </p>

  </div>
);

/* =========================================================
   ERROR MESSAGE
========================================================= */

const ErrorMessage = ({
  message,
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">

    <FiAlertCircle
      className="text-red-500 mt-0.5 shrink-0"
      size={18}
    />

    <p className="text-sm text-red-600">
      {message}
    </p>

  </div>
);

export default SellerSettings;