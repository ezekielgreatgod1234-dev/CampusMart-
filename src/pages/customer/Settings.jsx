import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import InstallHelpModal from "../../components/InstallHelpModal";
import { useAuth } from "../../context/AuthContext";
import { enableCampusMartPush } from "../../utils/pushNotifications";

import {
  FiArrowLeft,
  FiUser,
  FiLock,
  FiShield,
  FiEye,
  FiHelpCircle,
  FiMessageCircle,
  FiMail,
  FiChevronRight,
  FiCheck,
  FiSave,
  FiAlertCircle,
  FiSend,
  FiEyeOff,
  FiFileText,
  FiBookOpen,
  FiDownload,
  FiBell,
  FiShoppingBag,
  FiRefreshCw,
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

function Settings({ cartCount = 0, wishlist = [], unreadMessages = 0 }) {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [activeSection, setActiveSection] = useState("personal");
  const [loading, setLoading] = useState(true);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const [profile, setProfile] = useState({
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState("campus");

  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSending, setContactSending] = useState(false);

  const [pushStatus, setPushStatus] = useState("");
  const [pushLoading, setPushLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState("");

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstalling(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    try {
      setInstalling(true);
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result?.outcome === "accepted") setIsInstalled(true);
    } catch (e) {
      console.error(e);
    } finally {
      setInstalling(false);
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          const p = d.profile || {};
          const s = d.settings || {};
          const loaded = {
            fullName: p.fullName || "",
            email: p.email || firebaseUser.email || "",
            phone: p.phone || "",
            campus: p.campus || "",
            address: p.address || "",
          };
          setProfile(loaded);
          setPersonalForm({
            fullName: loaded.fullName,
            email: loaded.email,
            phone: loaded.phone,
            campus: loaded.campus,
          });
          setProfileVisibility(s.profileVisibility || "campus");
          setNotificationsEnabled(d.notificationsEnabled === true);
          setHasStore(
            d.hasStore === true ||
              d.isSeller === true ||
              d.role === "seller"
          );
        } else {
          const loaded = {
            fullName: "",
            email: firebaseUser.email || "",
            phone: "",
            campus: "",
            address: "",
          };
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            { profile: loaded, settings: { profileVisibility: "campus" } },
            { merge: true }
          );
          setProfile(loaded);
          setPersonalForm({
            fullName: "",
            email: firebaseUser.email || "",
            phone: "",
            campus: "",
          });
          setNotificationsEnabled(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser]);

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
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  const menuSections = [
    {
      title: "Account",
      items: [
        { id: "personal", label: "Personal Information", icon: FiUser },
        { id: "password", label: "Change Password", icon: FiLock },
        { id: "store", label: "My Store", icon: FiShoppingBag },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { id: "visibility", label: "Profile Visibility", icon: FiEye },
        { id: "notifications", label: "Notifications", icon: FiBell },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", label: "Help", icon: FiHelpCircle },
        { id: "faq", label: "FAQ", icon: FiMessageCircle },
        { id: "contact", label: "Contact CampusMart", icon: FiMail },
      ],
    },
    {
      title: "Legal",
      items: [
        { id: "terms", label: "Terms & Conditions", icon: FiFileText },
        { id: "privacy", label: "Privacy Policy", icon: FiBookOpen },
      ],
    },
  ];

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm((c) => ({ ...c, [name]: value }));
    setPersonalSaved(false);
  };

  const handlePersonalSave = async () => {
    if (!firebaseUser?.uid) return;
    try {
      const updated = { ...profile, ...personalForm };
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { profile: updated },
        { merge: true }
      );
      setProfile(updated);
      setPersonalSaved(true);
      window.dispatchEvent(new Event("profileUpdated"));
      setTimeout(() => setPersonalSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((c) => ({ ...c, [name]: value }));
    setPasswordMessage("");
  };

  const handlePasswordUpdate = async () => {
    setPasswordMessage("");
    if (!firebaseUser) {
      setPasswordMessage("Please log in again.");
      return;
    }
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }
    try {
      setPasswordUpdating(true);
      const cred = EmailAuthProvider.credential(
        firebaseUser.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, cred);
      await updatePassword(firebaseUser, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("success");
    } catch (e) {
      setPasswordMessage(
        e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : "Unable to update password."
      );
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleVisibilityChange = async (value) => {
    if (!firebaseUser?.uid) return;
    setProfileVisibility(value);
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { settings: { profileVisibility: value } },
      { merge: true }
    );
  };

  const handleEnableNotifications = async () => {
    if (!firebaseUser?.uid) {
      setPushStatus("Please log in again.");
      return;
    }
    setPushLoading(true);
    setPushStatus("");
    try {
      const result = await enableCampusMartPush(firebaseUser.uid);
      if (result.ok) {
        setNotificationsEnabled(true);
        setPushStatus("Notifications enabled for this device.");
      } else {
        setPushStatus("Permission not granted.");
      }
    } catch (e) {
      setPushStatus(e.message || "Could not enable notifications.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!firebaseUser?.uid) return;
    setPushLoading(true);
    setPushStatus("");
    try {
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          fcmToken: null,
          notificationsEnabled: false,
          fcmTokenUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setNotificationsEnabled(false);
      setPushStatus("Notifications disabled on this device.");
    } catch (e) {
      setPushStatus(e.message || "Could not disable notifications.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!firebaseUser?.uid) {
      setStoreMessage("Please log in again.");
      return;
    }
    setCreatingStore(true);
    setStoreMessage("");
    try {
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          hasStore: true,
          isSeller: true,
          // keep role as buyer for dual access; isSeller marks store
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "publicProfiles", firebaseUser.uid),
        {
          hasStore: true,
          isSeller: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
      setHasStore(true);
      setStoreMessage("Store created. Opening seller dashboard…");
      setTimeout(() => {
        navigate("/seller-dashboard");
      }, 600);
    } catch (e) {
      console.error(e);
      setStoreMessage(e.message || "Could not create store. Try again.");
    } finally {
      setCreatingStore(false);
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((c) => ({ ...c, [name]: value }));
    setContactSent(false);
    setContactError("");
  };

  const handleContactSubmit = async () => {
    if (!firebaseUser?.uid) {
      setContactError("Please log in again.");
      return;
    }
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setContactError("Please enter subject and message.");
      return;
    }
    try {
      setContactSending(true);
      await addDoc(collection(db, "supportMessages"), {
        userId: firebaseUser.uid,
        userName: profile.fullName || "CampusMart User",
        userEmail: firebaseUser.email || "",
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        status: "unread",
        createdAt: serverTimestamp(),
      });
      setContactSent(true);
      setContactForm({ subject: "", message: "" });
    } catch (e) {
      setContactError("Could not send message.");
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout cartCount={cartCount} wishlist={wishlist} unreadMessages={unreadMessages}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount} wishlist={wishlist} unreadMessages={unreadMessages}>
      <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="space-y-6 max-w-[1500px] mx-auto">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-500 hover:text-green-600"
            >
              <FiArrowLeft size={18} /> Back to Dashboard
            </button>
            <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-500">Manage your CampusMart account.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 h-fit shadow-sm">
              <div className="mb-4">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-gray-400">App</p>
                <button
                  type="button"
                  onClick={handleInstallApp}
                  disabled={isInstalled || installing}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left ${
                    isInstalled ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                    {isInstalled ? <FiCheck size={17} /> : <FiDownload size={17} />}
                  </div>
                  <span className="text-sm font-medium">
                    {isInstalled ? "CampusMart Installed" : installing ? "Installing..." : "Install CampusMart"}
                  </span>
                </button>
              </div>

              {menuSections.map((section) => (
                <div key={section.title} className="mb-5">
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-gray-400">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 ${
                          active ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            active ? "bg-white text-green-600" : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          <Icon size={17} />
                        </div>
                        <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                          {item.label}
                        </span>
                        {active && <FiChevronRight size={16} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              {activeSection === "personal" && (
                <section>
                  <Header title="Personal Information" desc="Manage your details." icon={FiUser} />
                  {personalSaved && <Ok msg="Saved successfully." />}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Full Name" name="fullName" value={personalForm.fullName} onChange={handlePersonalChange} icon={FiUser} />
                    <Field label="Email" name="email" type="email" value={personalForm.email} onChange={handlePersonalChange} icon={FiMail} />
                    <Field label="Phone" name="phone" value={personalForm.phone} onChange={handlePersonalChange} icon={FiUser} />
                    <Field label="Campus" name="campus" value={personalForm.campus} onChange={handlePersonalChange} icon={FiEye} />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={handlePersonalSave} className="px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium">
                      <FiSave className="inline mr-2" size={16} /> Save Changes
                    </button>
                  </div>
                </section>
              )}

              {activeSection === "password" && (
                <section>
                  <Header title="Change Password" desc="Update your password." icon={FiLock} />
                  {passwordMessage === "success" && <Ok msg="Password updated." />}
                  {passwordMessage && passwordMessage !== "success" && <Err msg={passwordMessage} />}
                  <div className="mt-6 space-y-4 max-w-xl">
                    <PassField label="Current Password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} />
                    <PassField label="New Password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} />
                    <PassField label="Confirm Password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} />
                    {passwordForm.newPassword && (
                      <p className="text-xs text-gray-500">Strength: {passwordStrength}</p>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={passwordUpdating}
                      onClick={handlePasswordUpdate}
                      className="px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {passwordUpdating ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </section>
              )}

              {activeSection === "visibility" && (
                <section>
                  <Header title="Profile Visibility" desc="Who can see your profile." icon={FiEye} />
                  <div className="mt-6 space-y-3">
                    {["public", "campus", "private"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleVisibilityChange(v)}
                        className={`w-full text-left p-4 rounded-2xl border ${
                          profileVisibility === v ? "border-green-500 bg-green-50" : "border-gray-100"
                        }`}
                      >
                        <p className="font-semibold text-sm capitalize">{v === "public" ? "Everyone" : v === "campus" ? "Campus only" : "Private"}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeSection === "notifications" && (
                <section>
                  <Header
                    title="Notifications"
                    desc="Alerts for orders, messages, and updates — even when the app is closed."
                    icon={FiBell}
                  />
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-sm font-bold text-gray-900">Push notifications</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status:{" "}
                      <span className={notificationsEnabled ? "text-[#008236]" : "text-gray-500"}>
                        {notificationsEnabled ? "Enabled" : "Not enabled"}
                      </span>
                    </p>
                    {notificationsEnabled ? (
                      <button
                        type="button"
                        disabled={pushLoading}
                        onClick={handleDisableNotifications}
                        className="mt-5 h-11 px-5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold disabled:opacity-60"
                      >
                        {pushLoading ? "Updating..." : "Disable notifications"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pushLoading}
                        onClick={handleEnableNotifications}
                        className="mt-5 h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {pushLoading ? "Enabling..." : "Enable notifications"}
                      </button>
                    )}
                    {pushStatus && <p className="mt-3 text-xs text-gray-600">{pushStatus}</p>}
                  </div>
                </section>
              )}


              {activeSection === "store" && (
                <section>
                  <Header
                    title="My Store"
                    desc="Open a CampusMart store on this same account. No new login needed."
                    icon={FiShoppingBag}
                  />
                  <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/50 p-5">
                    {hasStore ? (
                      <>
                        <p className="text-sm font-bold text-gray-900">
                          Your store is active
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-5">
                          You can switch between buyer shopping and your seller
                          dashboard anytime. Buyers use the main dashboard; sellers
                          use Your Store.
                        </p>
                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => navigate("/seller-dashboard")}
                            className="h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e]"
                          >
                            Go to seller dashboard
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50"
                          >
                            Back to buyer dashboard
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-900">
                          Create your store
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-5">
                          List products, receive orders, and withdraw earnings —
                          all on this account. You stay a buyer and can return to
                          shopping anytime.
                        </p>
                        <button
                          type="button"
                          disabled={creatingStore}
                          onClick={handleCreateStore}
                          className="mt-5 h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] disabled:opacity-60 flex items-center gap-2"
                        >
                          {creatingStore ? (
                            <>
                              <FiRefreshCw className="animate-spin" size={16} />
                              Creating store…
                            </>
                          ) : (
                            <>
                              <FiShoppingBag size={16} />
                              Create store
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {storeMessage && (
                      <p className="mt-3 text-xs text-gray-600">{storeMessage}</p>
                    )}
                  </div>
                </section>
              )}

              {activeSection === "help" && (
                <section>
                  <Header title="Help" desc="Get support." icon={FiHelpCircle} />
                  <button type="button" onClick={() => setActiveSection("contact")} className="mt-6 text-green-600 text-sm font-semibold">
                    Contact support →
                  </button>
                </section>
              )}

              {activeSection === "faq" && (
                <section>
                  <Header title="FAQ" desc="Common questions." icon={FiMessageCircle} />
                  <p className="mt-6 text-sm text-gray-600">Open Contact if you need more help.</p>
                </section>
              )}

              {activeSection === "contact" && (
                <section>
                  <Header title="Contact CampusMart" desc="Send a message." icon={FiMail} />
                  {contactSent && <Ok msg="Message sent." />}
                  {contactError && <Err msg={contactError} />}
                  <div className="mt-6 space-y-4 max-w-xl">
                    <input
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      placeholder="Subject"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    />
                    <textarea
                      name="message"
                      rows={5}
                      value={contactForm.message}
                      onChange={handleContactChange}
                      placeholder="Message"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none"
                    />
                    <button
                      type="button"
                      disabled={contactSending}
                      onClick={handleContactSubmit}
                      className="px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium"
                    >
                      {contactSending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </section>
              )}

              {activeSection === "terms" && (
                <section>
                  <Header title="Terms & Conditions" desc="CampusMart rules." icon={FiFileText} />
                  <p className="mt-6 text-sm text-gray-600 leading-7">
                    By using CampusMart you agree to use the platform lawfully and responsibly.
                  </p>
                </section>
              )}

              {activeSection === "privacy" && (
                <section>
                  <Header title="Privacy Policy" desc="How we handle data." icon={FiBookOpen} />
                  <p className="mt-6 text-sm text-gray-600 leading-7">
                    We use your information to run the marketplace and support your account.
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
      <InstallHelpModal open={showInstallHelp} onClose={() => setShowInstallHelp(false)} />
    </CustomerLayout>
  );
}

function Header({ title, desc, icon: Icon }) {
  return (
    <div className="flex items-start gap-4 pb-5 border-b border-gray-100">
      <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, icon: Icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
  );
}

function PassField({ label, name, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {show ? <FiEye size={18} /> : <FiEyeOff size={18} />}
        </button>
      </div>
    </div>
  );
}

function Ok({ msg }) {
  return (
    <div className="mt-5 flex gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
      <FiCheck size={16} /> {msg}
    </div>
  );
}

function Err({ msg }) {
  return (
    <div className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
      <FiAlertCircle size={16} /> {msg}
    </div>
  );
}

export default Settings;