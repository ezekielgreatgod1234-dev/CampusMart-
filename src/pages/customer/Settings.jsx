import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

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
  FiKey,
  FiEyeOff,
} from "react-icons/fi";

/* =========================================================
   SETTINGS
========================================================= */

function Settings({
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  /* =======================================================
     ACTIVE SECTION
  ======================================================= */

  const [activeSection, setActiveSection] =
    useState("personal");

  /* =======================================================
     PROFILE
  ======================================================= */

  const getProfile = () => {
    try {
      const savedProfile =
        localStorage.getItem("campusmart_profile");

      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
    } catch (error) {
      console.error(
        "Could not load profile:",
        error
      );
    }

    return {
      fullName: "GreatGod",
      email: "user@example.com",
      phone: "08012345678",
      campus: "Abia State University",
      address: "Uturu, Abia State",
    };
  };

  const [profile, setProfile] =
    useState(getProfile);

  /* =======================================================
     PERSONAL INFORMATION
  ======================================================= */

  const [personalForm, setPersonalForm] =
    useState({
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      campus: profile.campus || "",
    });

  const [personalSaved, setPersonalSaved] =
    useState(false);

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [passwordMessage, setPasswordMessage] =
    useState("");

  /* =======================================================
     PROFILE VISIBILITY
  ======================================================= */

  const [profileVisibility, setProfileVisibility] =
    useState(() => {
      return (
        localStorage.getItem(
          "campusmart_profile_visibility"
        ) || "campus"
      );
    });

  /* =======================================================
     CONTACT FORM
  ======================================================= */

  const [contactForm, setContactForm] =
    useState({
      subject: "",
      message: "",
    });

  const [contactSent, setContactSent] =
    useState(false);

  const [contactError, setContactError] =
    useState("");

  /* =======================================================
     PASSWORD STRENGTH
  ======================================================= */

  const getPasswordStrength = (password) => {
    if (!password) {
      return "";
    }

    let score = 0;

    if (password.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(password)) {
      score++;
    }

    if (/[a-z]/.test(password)) {
      score++;
    }

    if (/[0-9]/.test(password)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    }

    if (score <= 2) {
      return "Not strong enough";
    }

    if (score <= 4) {
      return "Strong";
    }

    return "Very strong";
  };

  const passwordStrength =
    getPasswordStrength(
      passwordForm.newPassword
    );

  /* =======================================================
     MENU
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
  ];

  /* =======================================================
     PERSONAL INFORMATION CHANGE
  ======================================================= */

  const handlePersonalChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setPersonalForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setPersonalSaved(false);
  };

  /* =======================================================
     SAVE PERSONAL INFORMATION
  ======================================================= */

  const handlePersonalSave = () => {
    const updatedProfile = {
      ...profile,
      ...personalForm,
    };

    setProfile(
      updatedProfile
    );

    localStorage.setItem(
      "campusmart_profile",
      JSON.stringify(
        updatedProfile
      )
    );

    window.dispatchEvent(
      new Event("profileUpdated")
    );

    setPersonalSaved(true);

    setTimeout(() => {
      setPersonalSaved(false);
    }, 3000);
  };

  /* =======================================================
     PASSWORD CHANGE
  ======================================================= */

  const handlePasswordChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setPasswordForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setPasswordMessage("");
  };

  const handlePasswordUpdate = () => {
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

    if (
      passwordForm.newPassword.length < 8
    ) {
      setPasswordMessage(
        "Your new password must contain at least 8 characters."
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

    /*
      Replace this with Firebase Auth password
      update logic when your backend is ready.
    */

    setPasswordMessage("success");

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setTimeout(() => {
      setPasswordMessage("");
    }, 4000);
  };

  /* =======================================================
     PROFILE VISIBILITY
  ======================================================= */

  const handleVisibilityChange = (
    value
  ) => {
    setProfileVisibility(value);

    localStorage.setItem(
      "campusmart_profile_visibility",
      value
    );
  };

  /* =======================================================
     CONTACT
  ======================================================= */

  const handleContactChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setContactForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setContactSent(false);
    setContactError("");
  };

  const handleContactSubmit = () => {
    setContactError("");
    setContactSent(false);

    if (
      !contactForm.subject.trim()
    ) {
      setContactError(
        "Please enter a subject."
      );

      return;
    }

    if (
      !contactForm.message.trim()
    ) {
      setContactError(
        "Please enter your message."
      );

      return;
    }

    setContactSent(true);

    setContactForm({
      subject: "",
      message: "",
    });
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div
        className="
          min-h-screen
          -m-4
          sm:-m-6
          lg:-m-8
          p-4
          sm:p-6
          lg:p-8
          bg-gray-50
          text-gray-900
        "
      >
        <div className="space-y-6 max-w-[1500px] mx-auto">

          {/* HEADER */}

          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="
                flex
                items-center
                gap-2
                text-gray-500
                hover:text-green-600
                transition
              "
            >
              <FiArrowLeft
                size={18}
              />

              <span>
                Back to Dashboard
              </span>
            </button>

            <div className="mt-5">
              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-gray-900
                "
              >
                Settings
              </h1>

              <p
                className="
                  mt-1
                  text-gray-500
                "
              >
                Manage your CampusMart account,
                privacy and preferences.
              </p>
            </div>
          </div>

          {/* SETTINGS LAYOUT */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-3
              gap-6
            "
          >

            {/* SETTINGS MENU */}

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-4
                h-fit
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  px-3
                  pb-4
                  border-b
                  border-gray-100
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiShield
                    size={20}
                  />
                </div>

                <div>
                  <h2
                    className="
                      font-bold
                      text-gray-800
                    "
                  >
                    Settings
                  </h2>

                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    Account preferences
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-5">

                {menuSections.map(
                  (section) => (
                    <div
                      key={
                        section.title
                      }
                    >
                      <p
                        className="
                          px-3
                          mb-2
                          text-[11px]
                          font-semibold
                          uppercase
                          tracking-wider
                          text-gray-400
                        "
                      >
                        {
                          section.title
                        }
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
                                key={
                                  item.id
                                }
                                type="button"
                                onClick={() =>
                                  setActiveSection(
                                    item.id
                                  )
                                }
                                className={`
                                  w-full
                                  flex
                                  items-center
                                  justify-between
                                  gap-3
                                  px-3
                                  py-3
                                  rounded-xl
                                  text-left
                                  transition

                                  ${
                                    active
                                      ? `
                                        bg-green-50
                                        text-green-600
                                      `
                                      : `
                                        text-gray-600
                                        hover:bg-gray-50
                                        hover:text-green-600
                                      `
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3">

                                  <div
                                    className={`
                                      w-9
                                      h-9
                                      rounded-lg
                                      flex
                                      items-center
                                      justify-center

                                      ${
                                        active
                                          ? `
                                            bg-white
                                            text-green-600
                                          `
                                          : `
                                            bg-gray-50
                                            text-gray-400
                                          `
                                      }
                                    `}
                                  >
                                    <Icon
                                      size={
                                        17
                                      }
                                    />
                                  </div>

                                  <span
                                    className={`
                                      text-sm
                                      ${
                                        active
                                          ? "font-semibold"
                                          : "font-medium"
                                      }
                                    `}
                                  >
                                    {
                                      item.label
                                    }
                                  </span>

                                </div>

                                {active && (
                                  <FiChevronRight
                                    size={
                                      16
                                    }
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

            {/* CONTENT */}

            <div
              className="
                lg:col-span-2
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-5
                sm:p-6
                shadow-sm
              "
            >

              {/* =================================================
                  PERSONAL INFORMATION
              ================================================= */}

              {activeSection ===
                "personal" && (
                <section>
                  <SettingsHeader
                    title="Personal Information"
                    description="Manage your personal details and account information."
                    icon={FiUser}
                  />

                  {personalSaved && (
                    <SuccessMessage
                      message="Your personal information has been saved successfully."
                    />
                  )}

                  <div
                    className="
                      mt-6
                      grid
                      grid-cols-1
                      sm:grid-cols-2
                      gap-5
                    "
                  >
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

                  <div
                    className="
                      mt-6
                      pt-5
                      border-t
                      border-gray-100
                      flex
                      justify-end
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        handlePersonalSave
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-5
                        py-3
                        rounded-xl
                        bg-green-600
                        hover:bg-green-700
                        text-white
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      <FiSave
                        size={16}
                      />

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
                    description="Update your password to keep your CampusMart account secure."
                    icon={FiLock}
                  />

                  <div className="mt-6 max-w-xl space-y-5">

                    <PasswordField
                      label="Current Password"
                      name="currentPassword"
                      value={
                        passwordForm.currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter your current password"
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
                      placeholder="Enter your new password"
                    />

                    {passwordForm.newPassword && (
                      <div className="mt-2">
                        <p
                          className={`text-xs font-semibold ${
                            passwordStrength ===
                            "Very strong"
                              ? "text-green-600"
                              : passwordStrength ===
                                "Strong"
                              ? "text-yellow-600"
                              : "text-red-500"
                          }`}
                        >
                          {
                            passwordStrength
                          }
                        </p>
                      </div>
                    )}

                    <PasswordField
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Confirm your new password"
                    />

                    <div
                      className="
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-100
                        p-4
                      "
                    >
                      <div className="flex items-center gap-2">
                        <FiKey
                          className="text-green-600"
                          size={16}
                        />

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-gray-700
                          "
                        >
                          Password requirements
                        </p>
                      </div>

                      <div
                        className="
                          mt-3
                          grid
                          grid-cols-1
                          sm:grid-cols-2
                          gap-2
                        "
                      >
                        <PasswordRequirement
                          checked={
                            passwordForm.newPassword.length >=
                            8
                          }
                          text="At least 8 characters"
                        />

                        <PasswordRequirement
                          checked={
                            /[A-Z]/.test(
                              passwordForm.newPassword
                            )
                          }
                          text="One uppercase letter"
                        />

                        <PasswordRequirement
                          checked={
                            /[0-9]/.test(
                              passwordForm.newPassword
                            )
                          }
                          text="One number"
                        />

                        <PasswordRequirement
                          checked={
                            passwordForm.newPassword.length >
                              0 &&
                            passwordForm.newPassword ===
                              passwordForm.confirmPassword
                          }
                          text="Passwords match"
                        />
                      </div>
                    </div>

                    {passwordMessage ===
                    "success" ? (
                      <SuccessMessage
                        message="Your password has been updated successfully."
                      />
                    ) : passwordMessage ? (
                      <ErrorMessage
                        message={
                          passwordMessage
                        }
                      />
                    ) : null}

                    <button
                      type="button"
                      onClick={
                        handlePasswordUpdate
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-5
                        py-3
                        rounded-xl
                        bg-green-600
                        hover:bg-green-700
                        text-white
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      <FiLock
                        size={16}
                      />

                      Update Password
                    </button>
                  </div>
                </section>
              )}

              {/* =================================================
                  PROFILE VISIBILITY
              ================================================= */}

              {activeSection ===
                "visibility" && (
                <section>
                  <SettingsHeader
                    title="Profile Visibility"
                    description="Choose who can see your CampusMart profile."
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
                      title="Everyone"
                      description="Anyone on CampusMart can view your profile."
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
                      title="Campus Only"
                      description="Only students and users from your campus can view your profile."
                      icon={FiUser}
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
                      description="Your profile will only be visible to you."
                      icon={FiLock}
                    />
                  </div>

                  <div
                    className="
                      mt-5
                      rounded-xl
                      bg-green-50
                      border
                      border-green-100
                      p-4
                      flex
                      gap-3
                    "
                  >
                    <FiShield
                      className="
                        text-green-600
                        mt-0.5
                        shrink-0
                      "
                      size={18}
                    />

                    <p
                      className="
                        text-xs
                        leading-5
                        text-gray-600
                      "
                    >
                      You can change your profile
                      visibility at any time. Your
                      account information remains
                      protected.
                    </p>
                  </div>
                </section>
              )}

              {/* =================================================
                  HELP
              ================================================= */}

              {activeSection ===
                "help" && (
                <section>
                  <SettingsHeader
                    title="Help Center"
                    description="Need help using CampusMart? We're here for you."
                    icon={FiHelpCircle}
                  />

                  <div
                    className="
                      mt-6
                      grid
                      grid-cols-1
                      sm:grid-cols-2
                      gap-4
                    "
                  >
                    <SupportCard
                      icon={
                        FiMessageCircle
                      }
                      title="Frequently Asked Questions"
                      description="Find answers to common CampusMart questions."
                      onClick={() =>
                        setActiveSection(
                          "faq"
                        )
                      }
                    />

                    <SupportCard
                      icon={FiMail}
                      title="Contact Support"
                      description="Send a message to the CampusMart support team."
                      onClick={() =>
                        setActiveSection(
                          "contact"
                        )
                      }
                    />
                  </div>

                  <div
                    className="
                      mt-5
                      rounded-2xl
                      bg-green-50
                      border
                      border-green-100
                      p-6
                    "
                  >
                    <h3
                      className="
                        font-bold
                        text-gray-800
                      "
                    >
                      We're here to help.
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-gray-600
                        leading-6
                      "
                    >
                      If you're having trouble
                      with an order, payment, account
                      or seller, our support team can
                      help you resolve the issue.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveSection(
                          "contact"
                        )
                      }
                      className="
                        mt-5
                        flex
                        items-center
                        gap-2
                        px-5
                        py-3
                        rounded-xl
                        bg-green-600
                        hover:bg-green-700
                        text-white
                        text-sm
                        font-medium
                      "
                    >
                      <FiMail
                        size={16}
                      />

                      Contact Support
                    </button>
                  </div>
                </section>
              )}

              {/* =================================================
                  FAQ
              ================================================= */}

              {activeSection ===
                "faq" && (
                <section>
                  <SettingsHeader
                    title="Frequently Asked Questions"
                    description="Find answers to common CampusMart questions."
                    icon={
                      FiMessageCircle
                    }
                  />

                  <div className="mt-6 space-y-3">

                    <FAQ
                      question="How do I place an order?"
                      answer="Browse products, open the product you want, add it to your cart and proceed to checkout."
                    />

                    <FAQ
                      question="How do I contact a seller?"
                      answer="Open the product you are interested in and use the messaging option to contact the seller."
                    />

                    <FAQ
                      question="How can I cancel an order?"
                      answer="Go to your Orders page, open the order and check whether cancellation is available for that order."
                    />

                    <FAQ
                      question="How do I change my profile information?"
                      answer="Open Settings, select Personal Information and update the information you want to change."
                    />

                    <FAQ
                      question="How do I change my password?"
                      answer="Open Settings, select Change Password and enter your current and new password."
                    />

                    <FAQ
                      question="Is CampusMart available on my campus?"
                      answer="CampusMart is designed to connect students and sellers within their campus community."
                    />

                  </div>
                </section>
              )}

              {/* =================================================
                  CONTACT
              ================================================= */}

              {activeSection ===
                "contact" && (
                <section>
                  <SettingsHeader
                    title="Contact CampusMart"
                    description="Have a question, complaint or suggestion? Send us a message."
                    icon={FiMail}
                  />

                  {contactSent && (
                    <SuccessMessage
                      message="Your message has been sent to CampusMart support."
                    />
                  )}

                  {contactError && (
                    <p
                      className="
                        mt-3
                        text-sm
                        text-red-500
                      "
                    >
                      {contactError}
                    </p>
                  )}

                  <div className="mt-6 max-w-2xl space-y-5">

                    {/* SUBJECT */}

                    <div>
                      <label
                        className="
                          block
                          text-sm
                          font-medium
                          text-gray-700
                          mb-2
                        "
                      >
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
                        placeholder="What can we help you with?"
                        className="
                          w-full
                          px-4
                          py-3
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          text-sm
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          focus:bg-white
                          focus:border-green-500
                          transition
                        "
                      />
                    </div>

                    {/* MESSAGE */}

                    <div>
                      <label
                        className="
                          block
                          text-sm
                          font-medium
                          text-gray-700
                          mb-2
                        "
                      >
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
                        placeholder="Write your message..."
                        className="
                          w-full
                          px-4
                          py-3
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          text-sm
                          text-gray-800
                          placeholder:text-gray-400
                          outline-none
                          resize-none
                          focus:bg-white
                          focus:border-green-500
                          transition
                        "
                      />
                    </div>

                    {/* SEND */}

                    <div
                      className="
                        flex
                        justify-end
                        pt-2
                      "
                    >
                      <button
                        type="button"
                        onClick={
                          handleContactSubmit
                        }
                        className="
                          flex
                          items-center
                          gap-2
                          px-5
                          py-3
                          rounded-xl
                          bg-green-600
                          hover:bg-green-700
                          text-white
                          text-sm
                          font-medium
                          transition
                        "
                      >
                        <FiSend
                          size={16}
                        />

                        Send Message
                      </button>
                    </div>

                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

/* =========================================================
   SETTINGS HEADER
========================================================= */

const SettingsHeader = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <div
      className="
        flex
        items-start
        gap-4
        pb-5
        border-b
        border-gray-100
      "
    >
      <div
        className="
          w-11
          h-11
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        <Icon size={20} />
      </div>

      <div>
        <h2
          className="
            text-xl
            sm:text-2xl
            font-bold
            text-gray-800
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-gray-500
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
};

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
}) => {
  return (
    <div>
      <label
        className="
          block
          text-sm
          font-medium
          text-gray-700
          mb-2
        "
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-gray-400
          "
          size={17}
        />

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="
            w-full
            pl-10
            pr-4
            py-3
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            text-sm
            text-gray-700
            outline-none
            placeholder:text-gray-400
            focus:bg-white
            focus:border-green-500
            transition
          "
        />
      </div>
    </div>
  );
};

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
  const [show, setShow] =
    useState(false);

  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-medium
          text-gray-700
        "
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={
            show
              ? "text"
              : "password"
          }
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            px-4
            py-3
            pr-12
            text-sm
            text-gray-800
            placeholder:text-gray-400
            outline-none
            focus:border-green-500
            transition
          "
        />

        <button
          type="button"
          onClick={() =>
            setShow(!show)
          }
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-gray-400
            hover:text-green-600
          "
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
        >
          {show ? (
            <FiEyeOff />
          ) : (
            <FiEye />
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
}) => {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        text-xs
      "
    >
      <span
        className={`
          w-5
          h-5
          rounded-full
          flex
          items-center
          justify-center

          ${
            checked
              ? `
                bg-green-100
                text-green-600
              `
              : `
                bg-gray-200
                text-gray-400
              `
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
};

/* =========================================================
   VISIBILITY CARD
========================================================= */

const VisibilityCard = ({
  active,
  onClick,
  title,
  description,
  icon: Icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full
        flex
        items-center
        justify-between
        gap-4
        p-4
        rounded-2xl
        border
        text-left
        transition

        ${
          active
            ? `
              border-green-500
              bg-green-50
            `
            : `
              border-gray-100
              bg-white
              hover:border-gray-200
              hover:bg-gray-50
            `
        }
      `}
    >
      <div className="flex items-center gap-4">

        <div
          className={`
            w-11
            h-11
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0

            ${
              active
                ? `
                  bg-white
                  text-green-600
                `
                : `
                  bg-gray-50
                  text-gray-400
                `
            }
          `}
        >
          <Icon size={19} />
        </div>

        <div>
          <h3
            className="
              text-sm
              font-semibold
              text-gray-800
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-gray-500
            "
          >
            {description}
          </p>
        </div>
      </div>

      <div
        className={`
          w-5
          h-5
          rounded-full
          border
          flex
          items-center
          justify-center
          shrink-0

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
};

/* =========================================================
   SUPPORT CARD
========================================================= */

const SupportCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        p-5
        rounded-2xl
        border
        border-gray-100
        bg-white
        text-left
        hover:border-green-200
        hover:bg-green-50
        transition
      "
    >
      <div
        className="
          w-11
          h-11
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
        "
      >
        <Icon size={20} />
      </div>

      <h3
        className="
          mt-4
          text-sm
          font-bold
          text-gray-800
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          text-xs
          leading-5
          text-gray-500
        "
      >
        {description}
      </p>

      <div
        className="
          mt-4
          flex
          items-center
          gap-1
          text-xs
          font-semibold
          text-green-600
        "
      >
        Open

        <FiChevronRight
          size={14}
        />
      </div>
    </button>
  );
};

/* =========================================================
   FAQ
========================================================= */

const FAQ = ({
  question,
  answer,
}) => {
  return (
    <details
      className="
        group
        rounded-2xl
        border
        border-gray-100
        bg-white
        overflow-hidden
      "
    >
      <summary
        className="
          flex
          items-center
          justify-between
          gap-4
          cursor-pointer
          list-none
          p-5
          text-sm
          font-semibold
          text-gray-800
        "
      >
        <span>
          {question}
        </span>

        <FiChevronRight
          size={18}
          className="
            text-gray-400
            transition
            group-open:rotate-90
            shrink-0
          "
        />
      </summary>

      <div
        className="
          px-5
          pb-5
          text-sm
          leading-6
          text-gray-500
        "
      >
        {answer}
      </div>
    </details>
  );
};

/* =========================================================
   SUCCESS MESSAGE
========================================================= */

const SuccessMessage = ({
  message,
}) => {
  return (
    <div
      className="
        mt-5
        flex
        items-start
        gap-3
        rounded-xl
        border
        border-green-100
        bg-green-50
        p-4
      "
    >
      <div
        className="
          w-7
          h-7
          rounded-full
          bg-green-100
          text-green-600
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        <FiCheck
          size={15}
        />
      </div>

      <p
        className="
          text-sm
          text-green-700
        "
      >
        {message}
      </p>
    </div>
  );
};

/* =========================================================
   ERROR MESSAGE
========================================================= */

const ErrorMessage = ({
  message,
}) => {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-xl
        border
        border-red-100
        bg-red-50
        p-4
      "
    >
      <FiAlertCircle
        className="
          text-red-500
          mt-0.5
          shrink-0
        "
        size={18}
      />

      <p
        className="
          text-sm
          text-red-600
        "
      >
        {message}
      </p>
    </div>
  );
};

export default Settings;