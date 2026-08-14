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

const DEFAULT_PROFILE = {
  fullName: "GreatGod",
  email: "user@example.com",
  phone: "08012345678",
  campus: "Abia State University",
  address: "Uturu, Abia State",
  profileImage: null,
  role: "Customer",
};

function getSavedProfile() {
  try {
    const savedProfile = localStorage.getItem("campusmart_profile");

    if (savedProfile) {
      return {
        ...DEFAULT_PROFILE,
        ...JSON.parse(savedProfile),
      };
    }
  } catch (error) {
    console.error("Could not load profile:", error);
  }

  return DEFAULT_PROFILE;
}

function Profile({
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  // =====================================================
  // PROFILE
  // =====================================================

  const [profile, setProfile] = useState(getSavedProfile);

  // =====================================================
  // EDIT MODE
  // =====================================================

  const [editing, setEditing] = useState(false);

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState(profile);

  // =====================================================
  // FILE INPUT
  // =====================================================

  const fileInputRef = useRef(null);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =====================================================
  // CHANGE PROFILE PICTURE
  // =====================================================

  const handleProfileImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result;

      const updatedProfile = {
        ...profile,
        profileImage: imageUrl,
      };

      setProfile(updatedProfile);

      localStorage.setItem(
        "campusmart_profile",
        JSON.stringify(updatedProfile)
      );

      // Tell Navbar and other components
      // that the profile has changed.
      window.dispatchEvent(new Event("profileUpdated"));
    };

    reader.readAsDataURL(file);
  };

  // =====================================================
  // OPEN IMAGE SELECTOR
  // =====================================================

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // EDIT PROFILE
  // =====================================================

  const handleEdit = () => {
    setFormData(profile);
    setEditing(true);
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = () => {
    const updatedProfile = {
      ...profile,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      campus: formData.campus,
      address: formData.address,
    };

    setProfile(updatedProfile);

    localStorage.setItem(
      "campusmart_profile",
      JSON.stringify(updatedProfile)
    );

    window.dispatchEvent(new Event("profileUpdated"));

    setEditing(false);
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

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

            <span>Back to Dashboard</span>
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
              Manage your personal information and account details.
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

              {/* AVATAR */}

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
                    profile.fullName
                      ?.charAt(0)
                      ?.toUpperCase() || "G"
                  )}

                </div>

                {/* CAMERA BUTTON */}

                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="
                    absolute
                    bottom-1
                    right-1
                    w-9
                    h-9
                    rounded-full
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    flex
                    items-center
                    justify-center
                    border-4
                    border-white
                    transition
                  "
                >
                  <FiCamera size={15} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleProfileImage}
                  className="hidden"
                />

              </div>

              {/* NAME */}

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                  mt-4
                "
              >
                {profile.fullName}
              </h2>

              {/* ROLE */}

              <p className="text-sm text-gray-500 mt-1">
                {profile.role}
              </p>

              {/* STATUS */}

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

              {/* CHANGE PHOTO */}

              <button
                type="button"
                onClick={handleCameraClick}
                className="
                  mt-4
                  text-sm
                  text-green-600
                  hover:text-green-700
                  font-medium
                "
              >
                Change Profile Picture
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

              {/* FULL NAME */}

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
                    disabled={!editing}
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
                    "
                  />

                </div>

              </div>

              {/* EMAIL */}

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
                    disabled={!editing}
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
                    "
                  />

                </div>

              </div>

              {/* PHONE */}

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
                    disabled={!editing}
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
                    "
                  />

                </div>

              </div>

              {/* CAMPUS */}

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
                    disabled={!editing}
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
                    "
                  />

                </div>

              </div>

              {/* ADDRESS */}

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
                    disabled={!editing}
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
                    "
                  />

                </div>

              </div>

            </div>

            {/* SAVE / CANCEL */}

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

                <button
                  type="button"
                  onClick={handleCancel}
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
                  "
                >
                  <FiX size={16} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
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
                  "
                >
                  <FiSave size={16} />
                  Save Changes
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