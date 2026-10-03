import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../context/firebase";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

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

// Shrinks a chosen photo in the browser and returns a JPEG data URL, so the
// profile picture and cover photo always fit inside a Firestore document (1 MB).
function compressImageFile(
  file,
  { maxWidth = 1280, maxHeight = 1280, maxBytes = 200 * 1024 } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type).startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let scale = Math.min(
        1,
        maxWidth / img.naturalWidth,
        maxHeight / img.naturalHeight
      );
      let quality = 0.82;
      let dataUrl = "";

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        dataUrl = canvas.toDataURL("image/jpeg", quality);

        if (Math.ceil((dataUrl.length * 3) / 4) <= maxBytes) break;

        if (quality > 0.5) quality -= 0.1;
        else scale *= 0.85;
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image."));
    };

    img.src = url;
  });
}

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
  const { firebaseUser } = useAuth();

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

  const handleProfileImage = async (e) => {
    const file = e.target.files?.[0];

    // Allow the same image to be selected again.
    e.target.value = "";

    if (!file) {
      return;
    }

    if (typeof updateProfile !== "function") {
      console.error("updateProfile was not provided to Profile.jsx");
      alert("Profile update function is not available.");
      return;
    }

    try {
      setSaving(true);

      // Shrink the photo so it always fits in Firestore.
      const imageUrl = await compressImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxBytes: 120 * 1024,
      });

      await updateProfile({
        profileImage: imageUrl,
      });

      // Public copy, so other people see it on your profile.
      if (firebaseUser?.uid) {
        await setDoc(
          doc(db, "publicProfiles", firebaseUser.uid),
          { profileImage: imageUrl, updatedAt: serverTimestamp() },
          { merge: true }
        ).catch((err) => console.warn("Public photo sync failed:", err));
      }

      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert(
        error?.message ||
          "Could not update your profile picture. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // COVER PHOTO
  // =======================================================

  const coverInputRef = useRef(null);
  const [coverPhoto, setCoverPhoto] = useState("");
  const [coverSaving, setCoverSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snapshot) => {
        const data = snapshot.data() || {};
        setCoverPhoto(data.coverPhoto || data.profile?.coverPhoto || "");
      },
      () => {}
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const saveCover = async (value) => {
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { coverPhoto: value, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // Public copy, so other people see it on your profile.
    await setDoc(
      doc(db, "publicProfiles", firebaseUser.uid),
      { coverPhoto: value, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch((err) => console.warn("Public cover sync failed:", err));

    setCoverPhoto(value);
  };

  const handleCoverImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !firebaseUser?.uid) return;

    try {
      setCoverSaving(true);
      const imageUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 720,
        maxBytes: 180 * 1024,
      });
      await saveCover(imageUrl);
    } catch (error) {
      console.error("Error updating cover photo:", error);
      alert(
        error?.message || "Could not update your cover photo. Please try again."
      );
    } finally {
      setCoverSaving(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!firebaseUser?.uid || coverSaving) return;
    try {
      setCoverSaving(true);
      await saveCover("");
    } catch (error) {
      console.error("Error removing cover photo:", error);
      alert("Could not remove your cover photo. Please try again.");
    } finally {
      setCoverSaving(false);
    }
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
            COVER + PROFILE PICTURE (Facebook style)
            The profile picture sits on the bottom edge of the cover photo.
        ================================================= */}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* COVER */}
          <div className="relative h-40 sm:h-60 bg-gradient-to-r from-[#007233] to-[#00a34a]">
            {coverPhoto && (
              <img
                src={coverPhoto}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {coverPhoto && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={coverSaving}
                  className="h-9 px-3 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-60 text-white text-xs font-semibold"
                >
                  Remove
                </button>
              )}

              <button
                type="button"
                onClick={() => !coverSaving && coverInputRef.current?.click()}
                disabled={coverSaving}
                className="h-9 px-3 rounded-full bg-white/90 hover:bg-white disabled:opacity-60 text-gray-800 text-xs font-semibold flex items-center gap-2 shadow"
                title="Change cover photo"
              >
                <FiCamera size={14} />
                {coverSaving
                  ? "Saving..."
                  : coverPhoto
                    ? "Change cover"
                    : "Add cover photo"}
              </button>
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImage}
              className="hidden"
            />
          </div>

          {/* PICTURE + NAME */}
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 mx-auto sm:mx-0 -mt-16 sm:-mt-20">
                <div className="w-full h-full rounded-full bg-green-100 text-green-600 flex items-center justify-center text-5xl font-bold border-4 border-white shadow-md overflow-hidden">
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

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={saving}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white flex items-center justify-center border-4 border-white transition"
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

              <div className="min-w-0 flex-1 text-center sm:text-left sm:pt-4">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {profile.fullName || "Your Name"}
                  </h2>
                </div>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  {profile.email || "No email"}
                </p>

                <p className="text-sm text-gray-500 mt-0.5">{roleText}</p>

                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active Account
                </div>

                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={saving}
                    className="text-sm text-green-600 hover:text-green-700 disabled:text-green-400 font-medium"
                  >
                    {saving ? "Saving..." : "Change Profile Picture"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            PROFILE CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 gap-6">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div
            className="
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