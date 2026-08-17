import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit3,
  FiSave,
  FiX,
  FiCamera,
} from "react-icons/fi";

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
  role: "",
};

// =========================================================
// PROFILE
// =========================================================

function Profile({
  profile: profileFromApp,
  updateProfile,

  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  // =======================================================
  // PROFILE FROM APP
  //
  // IMPORTANT:
  //
  // Profile.jsx does NOT use localStorage.
  //
  // App.jsx should load the profile using:
  //
  // users/{firebaseUser.uid}
  //
  // This keeps User A and User B completely separate.
  // =======================================================

  const profile = {
    ...DEFAULT_PROFILE,
    ...(profileFromApp || {}),
  };

  // =======================================================
  // EDIT MODE
  // =======================================================

  const [editing, setEditing] = useState(false);

  // =======================================================
  // FORM DATA
  // =======================================================

  const [formData, setFormData] = useState(profile);

  // =======================================================
  // SAVING
  // =======================================================

  const [saving, setSaving] = useState(false);

  // =======================================================
  // FILE INPUT
  // =======================================================

  const fileInputRef = useRef(null);

  // =======================================================
  // INPUT CHANGE
  // =======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =======================================================
  // OPEN IMAGE SELECTOR
  // =======================================================

  const handleCameraClick = () => {
    if (saving) {
      return;
    }

    fileInputRef.current?.click();
  };

  // =======================================================
  // CHANGE PROFILE PICTURE
  //
  // IMPORTANT:
  //
  // No localStorage.
  //
  // updateProfile() is responsible for saving the image
  // to the currently logged-in Firebase user's document.
  //
  // users/{firebaseUser.uid}
  // =======================================================

  const handleProfileImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // -----------------------------------------------
    // Check image type
    // -----------------------------------------------

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");

      e.target.value = "";
      return;
    }

    // -----------------------------------------------
    // Keep Firestore document reasonably small
    // -----------------------------------------------

    if (file.size > 700 * 1024) {
      alert(
        "Please choose a profile image smaller than 700 KB.",
      );

      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const imageUrl = reader.result;

        if (!imageUrl) {
          return;
        }

        if (typeof updateProfile !== "function") {
          console.error(
            "updateProfile was not provided to Profile.jsx",
          );

          alert(
            "Profile update function is not available.",
          );

          return;
        }

        setSaving(true);

        // ---------------------------------------------
        // Save through App.jsx
        //
        // App.jsx must save to:
        //
        // users/{firebaseUser.uid}
        // ---------------------------------------------

        await updateProfile({
          profileImage: imageUrl,
        });

        // ---------------------------------------------
        // Tell other components that profile changed.
        //
        // Navbar can listen for this event.
        // ---------------------------------------------

        window.dispatchEvent(
          new Event("profileUpdated"),
        );
      } catch (error) {
        console.error(
          "Error updating profile picture:",
          error,
        );

        alert(
          "Could not update your profile picture. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      alert("Could not read the selected image.");

      setSaving(false);
    };

    reader.readAsDataURL(file);

    // Allow the same image to be selected again.
    e.target.value = "";
  };

  // =======================================================
  // EDIT PROFILE
  // =======================================================

  const handleEdit = () => {
    // Copy the latest profile into the form.
    setFormData({
      ...DEFAULT_PROFILE,
      ...profile,
    });

    setEditing(true);
  };

  // =======================================================
  // SAVE PROFILE
  // =======================================================

  const handleSave = async () => {
    if (typeof updateProfile !== "function") {
      console.error(
        "updateProfile was not provided to Profile.jsx",
      );

      alert(
        "Profile update function is not available.",
      );

      return;
    }

    // -----------------------------------------------
    // Only save editable fields.
    //
    // Do not overwrite profileImage or role here.
    // -----------------------------------------------

    const updatedProfile = {
      fullName: formData.fullName?.trim() || "",
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      campus: formData.campus?.trim() || "",
      address: formData.address?.trim() || "",
    };

    try {
      setSaving(true);

      // ---------------------------------------------
      // App.jsx saves this to the logged-in user's
      // Firebase document:
      //
      // users/{firebaseUser.uid}
      // ---------------------------------------------

      await updateProfile(updatedProfile);

      // ---------------------------------------------
      // Notify Navbar and other components.
      // ---------------------------------------------

      window.dispatchEvent(
        new Event("profileUpdated"),
      );

      setEditing(false);
    } catch (error) {
      console.error(
        "Error saving profile:",
        error,
      );

      alert(
        "Could not save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // CANCEL
  // =======================================================

  const handleCancel = () => {
    setFormData({
      ...DEFAULT_PROFILE,
      ...profile,
    });

    setEditing(false);
  };

  // =======================================================
  // ROLE
  // =======================================================

  const roleText =
    String(profile.role || "").trim() || "Customer";

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="
              flex
              items-center
              gap-2
              text-gray-500
              hover:text-green-600
              transition
            "
          >
            <FiArrowLeft size={18} />

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
                text-gray-800
              "
            >
              My Profile
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your personal information and account
              details.
            </p>
          </div>
        </div>

        {/* =================================================
            PROFILE CONTENT
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-6
          "
        >

          {/* =================================================
              PROFILE CARD
          ================================================= */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-6
              h-fit
            "
          >
            <div className="flex flex-col items-center text-center">

              {/* =================================================
                  AVATAR
              ================================================= */}

              <div className="relative">

                <div
                  className="
                    w-28
                    h-28
                    rounded-full
                    bg-green-100
                    text-green-600
                    flex
                    items-center
                    justify-center
                    text-4xl
                    font-bold
                    border-4
                    border-white
                    shadow-sm
                    overflow-hidden
                  "
                >
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <span>
                      {profile.fullName
                        ?.charAt(0)
                        ?.toUpperCase() || "G"}
                    </span>
                  )}
                </div>

                {/* CAMERA BUTTON */}

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={saving}
                  className="
                    absolute
                    bottom-1
                    right-1
                    w-9
                    h-9
                    rounded-full
                    bg-green-600
                    hover:bg-green-700
                    disabled:bg-green-400
                    disabled:cursor-not-allowed
                    text-white
                    flex
                    items-center
                    justify-center
                    border-4
                    border-white
                    transition
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

              {/* =================================================
                  NAME
              ================================================= */}

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                  mt-4
                "
              >
                {profile.fullName || "Your Name"}
              </h2>

              {/* =================================================
                  EMAIL
              ================================================= */}

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                  break-all
                "
              >
                {profile.email || "No email"}
              </p>

              {/* =================================================
                  ROLE
              ================================================= */}

              <p className="text-sm text-gray-500 mt-1">
                {roleText}
              </p>

              {/* =================================================
                  STATUS
              ================================================= */}

              <div
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  bg-green-50
                  text-green-600
                  px-3
                  py-1.5
                  rounded-full
                  text-xs
                  font-medium
                "
              >
                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    bg-green-500
                  "
                />

                Active Account
              </div>

              {/* =================================================
                  CHANGE PHOTO
              ================================================= */}

              <button
                type="button"
                onClick={handleCameraClick}
                disabled={saving}
                className="
                  mt-4
                  text-sm
                  text-green-600
                  hover:text-green-700
                  disabled:text-green-400
                  font-medium
                "
              >
                {saving
                  ? "Saving..."
                  : "Change Profile Picture"}
              </button>

            </div>
          </div>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div
            className="
              lg:col-span-2
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              sm:p-6
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-6
              "
            >
              <div>
                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-800
                  "
                >
                  Personal Information
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Your account information
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={saving}
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    border
                    border-green-600
                    text-green-600
                    hover:bg-green-50
                    disabled:opacity-50
                    text-sm
                    font-medium
                  "
                >
                  <FiEdit3 size={16} />

                  <span className="hidden sm:inline">
                    Edit Profile
                  </span>
                </button>
              )}
            </div>

            {/* FORM */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-5
              "
            >

              {/* =================================================
                  FULL NAME
              ================================================= */}

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
                  Full Name
                </label>

                <div className="relative">
                  <FiUser
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
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
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

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
                  Email Address
                </label>

                <div className="relative">
                  <FiMail
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
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
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  PHONE
              ================================================= */}

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
                  Phone Number
                </label>

                <div className="relative">
                  <FiPhone
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
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
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  CAMPUS
              ================================================= */}

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
                  Campus
                </label>

                <div className="relative">
                  <FiMapPin
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="text"
                    name="campus"
                    value={formData.campus || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
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
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  ADDRESS
              ================================================= */}

              <div className="sm:col-span-2">
                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  "
                >
                  Address
                </label>

                <div className="relative">
                  <FiMapPin
                    className="
                      absolute
                      left-3
                      top-3.5
                      text-gray-400
                    "
                  />

                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    rows={3}
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
                      outline-none
                      resize-none
                      focus:bg-white
                      focus:border-green-500
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

            </div>

            {/* =================================================
                SAVE / CANCEL
            ================================================= */}

            {editing && (
              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  justify-end
                  gap-3
                  mt-6
                  pt-5
                  border-t
                  border-gray-100
                "
              >

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    text-gray-600
                    hover:bg-gray-50
                    disabled:opacity-50
                  "
                >
                  <FiX size={16} />

                  Cancel
                </button>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
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
                    disabled:bg-green-400
                    text-white
                  "
                >
                  <FiSave size={16} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            )}

          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default Profile;