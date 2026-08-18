import { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiLock,
  FiEye,
  FiShield,
  FiSun,
  FiMoon,
  FiHelpCircle,
  FiMessageCircle,
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiChevronRight,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

function Settings() {
  const { firebaseUser, profileLoading } = useAuth();

  // =========================================================
  // ACTIVE SECTION
  // =========================================================

  const [activeSection, setActiveSection] = useState("personal");

  // =========================================================
  // PROFILE
  // =========================================================

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    campus: "",
  });

  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    campus: "",
  });

  const [personalSaved, setPersonalSaved] = useState(false);

  // =========================================================
  // PASSWORD
  // =========================================================

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");

  // =========================================================
  // PRIVACY
  // =========================================================

  const [profileVisibility, setProfileVisibility] = useState("campus");
  const [twoFactor, setTwoFactor] = useState(false);

  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("campusmart_theme") || "light";
  });

  // =========================================================
  // CONTACT
  // =========================================================

  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");

  // =========================================================
  // LOAD SAVED DATA
  // =========================================================

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("campusmart_profile");

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);

        const safeProfile = {
          fullName: parsedProfile?.fullName || "",
          email: parsedProfile?.email || "",
          phone: parsedProfile?.phone || "",
          campus: parsedProfile?.campus || "",
        };

        setProfile(safeProfile);
        setPersonalForm(safeProfile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }

    const savedVisibility = localStorage.getItem(
      "campusmart_profile_visibility"
    );

    if (savedVisibility) {
      setProfileVisibility(savedVisibility);
    }

    const savedTwoFactor = localStorage.getItem("campusmart_two_factor");

    if (savedTwoFactor) {
      setTwoFactor(savedTwoFactor === "true");
    }
  }, []);

  // =========================================================
  // THEME
  // =========================================================

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("campusmart_theme", theme);

    // Force browser controls to use the correct color scheme.
    document.documentElement.style.colorScheme =
      theme === "dark" ? "dark" : "light";
  }, [theme]);

  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;

    setPersonalForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPersonalSaved(false);
  };

  // =========================================================
  // SAVE PERSONAL INFORMATION
  // =========================================================

  const handlePersonalSave = (e) => {
    e.preventDefault();

    const updatedProfile = {
      ...profile,
      ...personalForm,
    };

    setProfile(updatedProfile);

    localStorage.setItem(
      "campusmart_profile",
      JSON.stringify(updatedProfile)
    );

    window.dispatchEvent(new Event("profileUpdated"));

    setPersonalSaved(true);

    setTimeout(() => {
      setPersonalSaved(false);
    }, 3000);
  };

  // =========================================================
  // PASSWORD HANDLERS
  // =========================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordMessage("");
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "Your new password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    setPasswordMessage("Password updated successfully.");

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // =========================================================
  // PASSWORD STRENGTH
  // =========================================================

  const passwordStrength = useMemo(() => {
    const password = passwordForm.newPassword;

    if (!password) {
      return {
        label: "",
        percentage: 0,
        level: 0,
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        label: "Not strong enough",
        percentage: 35,
        level: 1,
      };
    }

    if (score === 3) {
      return {
        label: "Good",
        percentage: 60,
        level: 2,
      };
    }

    if (score === 4) {
      return {
        label: "Strong",
        percentage: 80,
        level: 3,
      };
    }

    return {
      label: "Very strong",
      percentage: 100,
      level: 4,
    };
  }, [passwordForm.newPassword]);

  // =========================================================
  // PRIVACY
  // =========================================================

  const handleVisibilityChange = (e) => {
    const value = e.target.value;

    setProfileVisibility(value);

    localStorage.setItem(
      "campusmart_profile_visibility",
      value
    );
  };

  const handleTwoFactor = () => {
    const newValue = !twoFactor;

    setTwoFactor(newValue);

    localStorage.setItem(
      "campusmart_two_factor",
      String(newValue)
    );
  };

  // =========================================================
  // THEME
  // =========================================================

  const handleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  // =========================================================
  // CONTACT
  // =========================================================

  const handleContactChange = (e) => {
    const { name, value } = e.target;

    setContactForm((current) => ({
      ...current,
      [name]: value,
    }));

    setContactError("");
    setContactSent(false);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();

    if (!contactForm.subject.trim()) {
      setContactError("Please enter a subject.");
      return;
    }

    if (!contactForm.message.trim()) {
      setContactError("Please enter your message.");
      return;
    }

    setContactError("");
    setContactSent(true);

    setContactForm({
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setContactSent(false);
    }, 4000);
  };

  // =========================================================
  // MENU
  // =========================================================

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          id: "personal",
          label: "Personal Information",
          description: "Update your personal details",
          icon: FiUser,
        },
        {
          id: "password",
          label: "Change Password",
          description: "Update your account password",
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
          description: "Control who can see your profile",
          icon: FiEye,
        },
        {
          id: "two-factor",
          label: "Two-Factor Authentication",
          description: "Add extra security to your account",
          icon: FiShield,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          id: "appearance",
          label: "Light & Dark Mode",
          description: "Choose your preferred theme",
          icon: theme === "dark" ? FiMoon : FiSun,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          label: "Help",
          description: "Get help using CampusMart",
          icon: FiHelpCircle,
        },
        {
          id: "faq",
          label: "FAQ",
          description: "Frequently asked questions",
          icon: FiMessageCircle,
        },
        {
          id: "contact",
          label: "Contact CampusMart",
          description: "Send us a message",
          icon: FiMail,
        },
      ],
    },
  ];

  // =========================================================
  // COMMON INPUT CLASS
  // =========================================================

  const inputClass =
    "w-full h-12 rounded-xl border px-4 text-sm outline-none transition " +
    "bg-white text-gray-900 border-gray-200 " +
    "focus:border-green-500 focus:ring-2 focus:ring-green-500/10 " +
    "dark:bg-[#111827] dark:text-white dark:border-[#334155] " +
    "dark:placeholder:text-gray-500 dark:focus:border-green-500";

  // =========================================================
  // LOADING
  // =========================================================

  if (profileLoading) {
    return (
      <div
        className="
          min-h-screen
          bg-white text-gray-900
          dark:bg-[#0f172a] dark:text-white
          flex items-center justify-center
        "
      >
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className="
        min-h-screen w-full
        bg-white text-gray-900
        dark:bg-[#0f172a] dark:text-white
        transition-colors duration-200
      "
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="
                w-11 h-11 rounded-xl
                bg-green-50 text-green-600
                dark:bg-green-500/10 dark:text-green-400
                flex items-center justify-center
              "
            >
              <FiShield size={22} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your CampusMart account and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            MOBILE SECTION SELECTOR
        ===================================================== */}

        <div className="lg:hidden mb-5">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className={inputClass}
          >
            {menuSections.flatMap((section) =>
              section.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* =====================================================
            MAIN LAYOUT
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)] gap-6">
          {/* ===================================================
              SIDEBAR
          =================================================== */}

          <aside
            className="
              hidden lg:block
              rounded-2xl border
              bg-white border-gray-100
              dark:bg-[#182230] dark:border-[#273548]
              overflow-hidden
              h-fit
              transition-colors duration-200
            "
          >
            <div
              className="
                px-5 py-5
                border-b
                border-gray-100
                dark:border-[#273548]
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10 h-10 rounded-xl
                    bg-green-50 text-green-600
                    dark:bg-green-500/10 dark:text-green-400
                    flex items-center justify-center
                  "
                >
                  <FiShield size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Settings
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Account preferences
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3">
              {menuSections.map((section) => (
                <div key={section.title} className="mb-5 last:mb-1">
                  <p
                    className="
                      px-3 mb-2
                      text-[11px] font-bold uppercase tracking-wider
                      text-gray-400
                      dark:text-gray-500
                    "
                  >
                    {section.title}
                  </p>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeSection === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          className={`
                            w-full flex items-center gap-3
                            px-3 py-3 rounded-xl
                            text-left transition
                            ${
                              active
                                ? `
                                  bg-green-50 text-green-700
                                  dark:bg-green-500/10 dark:text-green-400
                                `
                                : `
                                  text-gray-600 hover:bg-gray-50
                                  dark:text-gray-300 dark:hover:bg-[#202c3c]
                                `
                            }
                          `}
                        >
                          <div
                            className={`
                              w-9 h-9 rounded-lg
                              flex items-center justify-center shrink-0
                              ${
                                active
                                  ? `
                                    bg-white text-green-600
                                    dark:bg-[#182230] dark:text-green-400
                                  `
                                  : `
                                    bg-gray-50 text-gray-500
                                    dark:bg-[#111827] dark:text-gray-400
                                  `
                              }
                            `}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {item.label}
                            </p>

                            <p
                              className="
                                text-[11px] mt-0.5 truncate
                                text-gray-400
                                dark:text-gray-500
                              "
                            >
                              {item.description}
                            </p>
                          </div>

                          {active && (
                            <FiChevronRight
                              size={16}
                              className="shrink-0"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ===================================================
              CONTENT
          =================================================== */}

          <main
            className="
              min-w-0
              rounded-2xl border
              bg-white border-gray-100
              dark:bg-[#182230] dark:border-[#273548]
              transition-colors duration-200
            "
          >
            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            {activeSection === "personal" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiUser}
                  title="Personal Information"
                  description="Manage your personal account information."
                />

                {personalSaved && (
                  <SuccessMessage message="Your personal information has been saved successfully." />
                )}

                <form
                  onSubmit={handlePersonalSave}
                  className="mt-7 space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Full Name">
                      <input
                        type="text"
                        name="fullName"
                        value={personalForm.fullName}
                        onChange={handlePersonalChange}
                        placeholder="Enter your full name"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Email Address">
                      <input
                        type="email"
                        name="email"
                        value={personalForm.email}
                        onChange={handlePersonalChange}
                        placeholder="Enter your email"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Phone Number">
                      <input
                        type="tel"
                        name="phone"
                        value={personalForm.phone}
                        onChange={handlePersonalChange}
                        placeholder="Enter your phone number"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Campus">
                      <input
                        type="text"
                        name="campus"
                        value={personalForm.campus}
                        onChange={handlePersonalChange}
                        placeholder="Enter your campus"
                        className={inputClass}
                      />
                    </FormField>
                  </div>

                  <div
                    className="
                      pt-5 border-t
                      border-gray-100
                      dark:border-[#273548]
                    "
                  >
                    <button
                      type="submit"
                      className="
                        h-11 px-5 rounded-xl
                        bg-green-600 text-white
                        hover:bg-green-700
                        flex items-center justify-center gap-2
                        font-semibold text-sm
                        transition
                      "
                    >
                      <FiSave size={17} />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================
                PASSWORD
            ================================================= */}

            {activeSection === "password" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiLock}
                  title="Change Password"
                  description="Update your password to keep your account secure."
                />

                {passwordMessage && (
                  <div
                    className={`
                      mt-6 rounded-xl border px-4 py-3 flex items-start gap-3
                      ${
                        passwordMessage.includes("successfully")
                          ? `
                            bg-green-50 border-green-100 text-green-700
                            dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400
                          `
                          : `
                            bg-red-50 border-red-100 text-red-700
                            dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400
                          `
                      }
                    `}
                  >
                    {passwordMessage.includes("successfully") ? (
                      <FiCheckCircle className="mt-0.5 shrink-0" />
                    ) : (
                      <FiAlertCircle className="mt-0.5 shrink-0" />
                    )}

                    <p className="text-sm">{passwordMessage}</p>
                  </div>
                )}

                <form
                  onSubmit={handlePasswordUpdate}
                  className="mt-7 max-w-2xl space-y-5"
                >
                  <PasswordField
                    label="Current Password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    show={showCurrentPassword}
                    setShow={setShowCurrentPassword}
                    className={inputClass}
                  />

                  <PasswordField
                    label="New Password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    show={showNewPassword}
                    setShow={setShowNewPassword}
                    className={inputClass}
                  />

                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Password strength
                        </span>

                        <span
                          className={`
                            text-xs font-semibold
                            ${
                              passwordStrength.level <= 1
                                ? "text-red-500"
                                : passwordStrength.level === 2
                                ? "text-yellow-500"
                                : "text-green-600 dark:text-green-400"
                            }
                          `}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>

                      <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-[#111827] overflow-hidden">
                        <div
                          className={`
                            h-full rounded-full transition-all duration-300
                            ${
                              passwordStrength.level <= 1
                                ? "bg-red-500"
                                : passwordStrength.level === 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }
                          `}
                          style={{
                            width: `${passwordStrength.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <PasswordField
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    show={showConfirmPassword}
                    setShow={setShowConfirmPassword}
                    className={inputClass}
                  />

                  {/* REQUIREMENTS */}

                  <div
                    className="
                      rounded-xl p-4
                      bg-gray-50
                      dark:bg-[#111827]
                    "
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Password requirements
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Requirement
                        valid={passwordForm.newPassword.length >= 8}
                        text="At least 8 characters"
                      />

                      <Requirement
                        valid={/[A-Z]/.test(passwordForm.newPassword)}
                        text="One uppercase letter"
                      />

                      <Requirement
                        valid={/[0-9]/.test(passwordForm.newPassword)}
                        text="One number"
                      />

                      <Requirement
                        valid={
                          passwordForm.newPassword.length > 0 &&
                          passwordForm.newPassword ===
                            passwordForm.confirmPassword
                        }
                        text="Passwords match"
                      />
                    </div>
                  </div>

                  <div
                    className="
                      pt-5 border-t
                      border-gray-100
                      dark:border-[#273548]
                    "
                  >
                    <button
                      type="submit"
                      className="
                        h-11 px-5 rounded-xl
                        bg-green-600 text-white
                        hover:bg-green-700
                        font-semibold text-sm
                        flex items-center gap-2
                        transition
                      "
                    >
                      <FiLock size={16} />
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================
                PROFILE VISIBILITY
            ================================================= */}

            {activeSection === "visibility" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiEye}
                  title="Profile Visibility"
                  description="Choose who can view your CampusMart profile."
                />

                <div className="mt-7 max-w-2xl">
                  <FormField label="Who can see your profile?">
                    <select
                      value={profileVisibility}
                      onChange={handleVisibilityChange}
                      className={inputClass}
                    >
                      <option value="campus">
                        Students on my campus
                      </option>

                      <option value="everyone">
                        Everyone on CampusMart
                      </option>

                      <option value="private">
                        Only me
                      </option>
                    </select>
                  </FormField>

                  <div
                    className="
                      mt-5 rounded-xl p-4
                      bg-green-50
                      dark:bg-green-500/10
                    "
                  >
                    <div className="flex gap-3">
                      <FiShield
                        className="
                          text-green-600 dark:text-green-400
                          mt-0.5 shrink-0
                        "
                      />

                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          Your privacy matters
                        </p>

                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-6">
                          You can change this setting whenever you want.
                          Your choice is saved automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                TWO FACTOR
            ================================================= */}

            {activeSection === "two-factor" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiShield}
                  title="Two-Factor Authentication"
                  description="Add another layer of protection to your account."
                />

                <div
                  className="
                    mt-7 rounded-2xl border p-5 sm:p-6
                    border-gray-100 bg-gray-50
                    dark:border-[#273548] dark:bg-[#111827]
                  "
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex gap-4">
                      <div
                        className="
                          w-11 h-11 rounded-xl shrink-0
                          bg-green-50 text-green-600
                          dark:bg-green-500/10 dark:text-green-400
                          flex items-center justify-center
                        "
                      >
                        <FiShield size={21} />
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-6">
                          Protect your account with an additional security
                          step when signing in.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTwoFactor}
                      aria-label="Toggle two-factor authentication"
                      className={`
                        relative w-12 h-7 rounded-full shrink-0 transition
                        ${
                          twoFactor
                            ? "bg-green-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }
                      `}
                    >
                      <span
                        className={`
                          absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition
                          ${
                            twoFactor
                              ? "left-6"
                              : "left-1"
                          }
                        `}
                      />
                    </button>
                  </div>

                  <div
                    className="
                      mt-5 pt-5 border-t
                      border-gray-200
                      dark:border-[#273548]
                    "
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status:{" "}
                      <span
                        className={
                          twoFactor
                            ? "font-semibold text-green-600 dark:text-green-400"
                            : "font-semibold text-gray-500 dark:text-gray-400"
                        }
                      >
                        {twoFactor ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                APPEARANCE
            ================================================= */}

            {activeSection === "appearance" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={theme === "dark" ? FiMoon : FiSun}
                  title="Light & Dark Mode"
                  description="Choose how CampusMart should look."
                />

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  {/* LIGHT */}

                  <button
                    type="button"
                    onClick={() => handleTheme("light")}
                    className={`
                      text-left rounded-2xl border p-5 transition
                      ${
                        theme === "light"
                          ? `
                            border-green-500
                            bg-green-50
                            dark:border-green-500
                            dark:bg-green-500/10
                          `
                          : `
                            border-gray-100 bg-gray-50
                            hover:border-green-200
                            dark:border-[#273548] dark:bg-[#111827]
                            dark:hover:border-green-500/40
                          `
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="
                          w-11 h-11 rounded-xl
                          bg-white text-yellow-500
                          border border-gray-200
                          flex items-center justify-center
                        "
                      >
                        <FiSun size={21} />
                      </div>

                      {theme === "light" && (
                        <FiCheckCircle
                          className="text-green-600"
                          size={20}
                        />
                      )}
                    </div>

                    <h3 className="mt-5 font-bold text-gray-900 dark:text-white">
                      Light Mode
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Use a bright and clean appearance.
                    </p>
                  </button>

                  {/* DARK */}

                  <button
                    type="button"
                    onClick={() => handleTheme("dark")}
                    className={`
                      text-left rounded-2xl border p-5 transition
                      ${
                        theme === "dark"
                          ? `
                            border-green-500
                            bg-green-500/10
                          `
                          : `
                            border-gray-100 bg-gray-50
                            hover:border-green-200
                            dark:border-[#273548] dark:bg-[#111827]
                            dark:hover:border-green-500/40
                          `
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="
                          w-11 h-11 rounded-xl
                          bg-gray-900 text-white
                          flex items-center justify-center
                        "
                      >
                        <FiMoon size={21} />
                      </div>

                      {theme === "dark" && (
                        <FiCheckCircle
                          className="text-green-400"
                          size={20}
                        />
                      )}
                    </div>

                    <h3 className="mt-5 font-bold text-gray-900 dark:text-white">
                      Dark Mode
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Use a darker appearance that is easier on the eyes.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* =================================================
                HELP
            ================================================= */}

            {activeSection === "help" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiHelpCircle}
                  title="Help"
                  description="Get help with using CampusMart."
                />

                <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HelpCard
                    icon={FiMessageCircle}
                    title="Need assistance?"
                    text="If you are having trouble using CampusMart, contact our support team."
                  />

                  <HelpCard
                    icon={FiBookOpenIcon}
                    title="Learn CampusMart"
                    text="Explore the marketplace, products, messaging and account features."
                  />
                </div>
              </div>
            )}

            {/* =================================================
                FAQ
            ================================================= */}

            {activeSection === "faq" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiMessageCircle}
                  title="Frequently Asked Questions"
                  description="Answers to common CampusMart questions."
                />

                <div className="mt-7 space-y-3">
                  <Faq
                    question="What is CampusMart?"
                    answer="CampusMart is a marketplace designed for students to buy, sell and connect within their campus community."
                  />

                  <Faq
                    question="How do I sell an item?"
                    answer="Create an account, go to the selling section and provide the details and images of your item."
                  />

                  <Faq
                    question="How do I contact a seller?"
                    answer="Open the product you are interested in and use the available messaging option to contact the seller."
                  />

                  <Faq
                    question="Is CampusMart only for students?"
                    answer="CampusMart is designed specifically around university and campus communities."
                  />
                </div>
              </div>
            )}

            {/* =================================================
                CONTACT
            ================================================= */}

            {activeSection === "contact" && (
              <div className="p-5 sm:p-7">
                <SectionHeader
                  icon={FiMail}
                  title="Contact CampusMart"
                  description="Send us a message and our team will get back to you."
                />

                {contactSent && (
                  <SuccessMessage message="Your message has been sent successfully." />
                )}

                {contactError && (
                  <div
                    className="
                      mt-6 rounded-xl border px-4 py-3
                      flex items-start gap-3
                      bg-red-50 border-red-100 text-red-700
                      dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400
                    "
                  >
                    <FiAlertCircle className="mt-0.5 shrink-0" />

                    <p className="text-sm">
                      {contactError}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={handleContactSubmit}
                  className="mt-7 max-w-2xl space-y-5"
                >
                  <FormField label="Subject">
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      placeholder="What is your message about?"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Message">
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      placeholder="Write your message here..."
                      rows={6}
                      className="
                        w-full rounded-xl border px-4 py-3
                        text-sm outline-none resize-none transition
                        bg-white text-gray-900 border-gray-200
                        focus:border-green-500 focus:ring-2 focus:ring-green-500/10
                        dark:bg-[#111827] dark:text-white
                        dark:border-[#334155]
                        dark:placeholder:text-gray-500
                        dark:focus:border-green-500
                      "
                    />
                  </FormField>

                  <button
                    type="submit"
                    className="
                      h-11 px-5 rounded-xl
                      bg-green-600 text-white
                      hover:bg-green-700
                      font-semibold text-sm
                      flex items-center gap-2
                      transition
                    "
                  >
                    <FiMail size={17} />
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SECTION HEADER
// =============================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="
        flex items-start gap-4
        pb-6 border-b
        border-gray-100
        dark:border-[#273548]
      "
    >
      <div
        className="
          w-11 h-11 rounded-xl shrink-0
          bg-green-50 text-green-600
          dark:bg-green-500/10 dark:text-green-400
          flex items-center justify-center
        "
      >
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

// =============================================================
// FORM FIELD
// =============================================================

function FormField({ label, children }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
        {label}
      </label>

      {children}
    </div>
  );
}

// =============================================================
// PASSWORD FIELD
// =============================================================

function PasswordField({
  label,
  name,
  value,
  onChange,
  show,
  setShow,
  className,
}) {
  return (
    <FormField label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`${className} pr-14`}
        />

        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-xs font-semibold
            text-gray-500 hover:text-green-600
            dark:text-gray-400 dark:hover:text-green-400
            transition
          "
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </FormField>
  );
}

// =============================================================
// REQUIREMENT
// =============================================================

function Requirement({ valid, text }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-5 h-5 rounded-full flex items-center justify-center
          ${
            valid
              ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
              : "bg-gray-100 text-gray-400 dark:bg-[#182230] dark:text-gray-500"
          }
        `}
      >
        <FiCheckCircle size={12} />
      </div>

      <span
        className={`
          text-xs
          ${
            valid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }
        `}
      >
        {text}
      </span>
    </div>
  );
}

// =============================================================
// SUCCESS MESSAGE
// =============================================================

function SuccessMessage({ message }) {
  return (
    <div
      className="
        mt-6 rounded-xl border px-4 py-3
        flex items-start gap-3
        bg-green-50 border-green-100 text-green-700
        dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400
      "
    >
      <FiCheckCircle className="mt-0.5 shrink-0" />

      <p className="text-sm">{message}</p>
    </div>
  );
}

// =============================================================
// HELP CARD
// =============================================================

function HelpCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div
      className="
        rounded-2xl border p-6
        border-gray-100 bg-gray-50
        dark:border-[#273548] dark:bg-[#111827]
      "
    >
      <div
        className="
          w-11 h-11 rounded-xl
          bg-green-50 text-green-600
          dark:bg-green-500/10 dark:text-green-400
          flex items-center justify-center
        "
      >
        <Icon size={21} />
      </div>

      <h3 className="mt-5 font-bold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-6">
        {text}
      </p>
    </div>
  );
}

// =============================================================
// FAQ
// =============================================================

function Faq({
  question,
  answer,
}) {
  return (
    <details
      className="
        group rounded-xl border
        border-gray-100 bg-gray-50
        dark:border-[#273548] dark:bg-[#111827]
        overflow-hidden
      "
    >
      <summary
        className="
          cursor-pointer list-none
          px-5 py-4
          flex items-center justify-between gap-4
          font-semibold text-sm
          text-gray-900 dark:text-white
        "
      >
        <span>{question}</span>

        <FiChevronRight
          className="
            shrink-0 transition-transform
            group-open:rotate-90
            text-gray-400
          "
        />
      </summary>

      <div
        className="
          px-5 pb-5
          text-sm leading-6
          text-gray-500 dark:text-gray-400
        "
      >
        {answer}
      </div>
    </details>
  );
}

// =============================================================
// ICON HELPER
// =============================================================

function FiBookOpenIcon(props) {
  return <FiMessageCircle {...props} />;
}

export default Settings;