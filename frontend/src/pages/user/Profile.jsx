import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ImageCropModal from "../../components/ImageCropModal";
import api from "../../services/api";
import "../../styles/Profile.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  photo: "",
};

const getProfile = (response) => {
  const data = response?.data;

  return (
    data?.profile ??
    data?.data?.profile ??
    data?.user ??
    data?.data ??
    data
  );
};

const getUserId = (user) =>
  user?.id ?? user?.userId ?? user?.customerId ?? null;

const Profile = () => {
  const { user } = useAuth();
  const userId = getUserId(user);

  const storageKey =
    userId !== null && userId !== undefined
      ? `freshNestProfile_${userId}`
      : null;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cropImage, setCropImage] = useState(null);

  const readCachedProfile = useCallback(() => {
    if (!storageKey) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const cacheProfile = useCallback(
    (profile) => {
      if (!storageKey) return;

      try {
        localStorage.setItem(storageKey, JSON.stringify(profile));
      } catch (storageError) {
        console.warn("Unable to cache profile:", storageError);
      }
    },
    [storageKey]
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/profile");
        const profile = getProfile(response);

        if (!profile || typeof profile !== "object") {
          throw new Error("Profile information was not returned.");
        }

        const profileData = {
          name: profile.name ?? user?.name ?? "",
          // The email comes from the authenticated account/profile.
          email: profile.email ?? user?.email ?? "",
          phone: profile.phone ?? profile.phoneNumber ?? "",
          address:
            typeof profile.address === "string"
              ? profile.address
              : profile.deliveryAddress ?? "",
          photo: profile.photo ?? profile.photoUrl ?? "",
        };

        if (!active) return;

        setForm(profileData);
        cacheProfile(profileData);
      } catch (requestError) {
        if (!active) return;

        const cached = readCachedProfile();

        if (cached) {
          setForm({
            ...emptyForm,
            ...cached,
            // Never take the editable email from form input.
            email: user?.email ?? cached.email ?? "",
          });
        } else {
          setForm({
            ...emptyForm,
            name: user?.name ?? "",
            email: user?.email ?? "",
          });

          setError(
            requestError.response?.data?.message ??
              "Unable to load your profile. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      setForm(emptyForm);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user, cacheProfile, readCachedProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again later.
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your photo must be smaller than 5 MB.");
      return;
    }

    setError("");
    setSuccess("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropImage(reader.result);
      } else {
        setError("Unable to read the selected photo.");
      }
    };

    reader.onerror = () => {
      setError("Unable to read the selected photo.");
    };

    reader.readAsDataURL(file);
  };

  const handleCrop = (croppedPhoto) => {
    if (!croppedPhoto) {
      setCropImage(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to process the cropped photo.");
        return;
      }

      setForm((previous) => ({
        ...previous,
        photo: reader.result,
      }));

      setCropImage(null);
      setError("");
      setSuccess("Photo cropped. Save your profile to keep the changes.");
    };

    reader.onerror = () => {
      setError("Unable to process the cropped photo.");
    };

    reader.readAsDataURL(croppedPhoto);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!name) {
      setError("Full name is required.");
      return;
    }

    if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      setError("Enter a valid phone number.");
      return;
    }

    if (!address) {
      setError("Delivery address is required.");
      return;
    }

    setSaving(true);

    try {
      // Email is deliberately excluded from the update request.
      const response = await api.put("/profile", {
        name,
        phone,
        address,
        photo: form.photo || "",
      });

      const returnedProfile = getProfile(response);

      // Support APIs that return a success message without a profile object.
      const profileData = {
        name: returnedProfile?.name ?? name,
        email: returnedProfile?.email ?? form.email ?? user?.email ?? "",
        phone: returnedProfile?.phone ?? phone,
        address: returnedProfile?.address ?? address,
        photo:
          returnedProfile?.photo ??
          returnedProfile?.photoUrl ??
          form.photo ??
          "",
      };

      setForm(profileData);
      cacheProfile(profileData);

      window.dispatchEvent(new Event("customerProfileUpdated"));
      setSuccess("Your profile has been updated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = () => {
    setForm((previous) => ({
      ...previous,
      photo: "",
    }));

    setError("");
    setSuccess("Photo removed from the form. Save your profile to confirm.");
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <span className="profile-spinner" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  const initial = form.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="profile-page">
      <div className="profile-container">
       <div className="profile-top-actions">
  <Link to="/home" className="profile-back-link">
    ← Back to Home
  </Link>
</div>

        <header className="profile-page-heading">
          <span className="profile-eyebrow">YOUR ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your personal information and delivery address.</p>
        </header>

        {error && (
          <div className="profile-alert profile-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-alert profile-alert-success" role="status">
            {success}
          </div>
        )}

        <div className="profile-layout">
          <aside className="profile-intro-card">
            <div className="profile-avatar">
              {form.photo ? (
                <img src={form.photo} alt={`${form.name || "Your"} profile`} />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <h2>{form.name || "Customer"}</h2>
            <p className="profile-intro-email">{form.email || "Email unavailable"}</p>

            <div className="profile-photo-actions">
              <label htmlFor="profile-photo" className="profile-upload-button">
                Upload Photo
              </label>

              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                hidden
                disabled={saving}
              />

              {form.photo && (
                <button
                  type="button"
                  className="profile-remove-button"
                  onClick={removePhoto}
                  disabled={saving}
                >
                  Remove Photo
                </button>
              )}
            </div>

            <p className="profile-photo-help">
              JPG, PNG or WEBP. Maximum size 5 MB. Crop your photo before saving.
            </p>

            <div className="profile-intro-divider" />

            <div className="profile-tip">
              <span aria-hidden="true">📍</span>
              <div>
                <strong>Delivery address</strong>
                <p>Keep your address updated so your orders reach the right location.</p>
              </div>
            </div>

            <Link to="/orders" className="profile-orders-link">
              View My Orders →
            </Link>
          </aside>

          <section className="profile-form-card">
            <div className="profile-form-heading">
              <h2>Personal Information</h2>
              <p>Update the information associated with your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="profile-field">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  disabled={saving}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email Address</label>
                <input
  id="profile-email"
  type="email"
  value={form.email}
  readOnly
  autoComplete="email"
  aria-describedby="profile-email-help"
/>
                <small id="profile-email-help">
                  Your login email cannot be changed here.
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-phone">Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  maxLength={20}
                  required
                  disabled={saving}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-address">Delivery Address</label>
                <textarea
                  id="profile-address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House number, street, area, city, PIN code"
                  autoComplete="street-address"
                  rows={4}
                  maxLength={500}
                  required
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {cropImage && (
        <ImageCropModal
          image={cropImage}
          onCancel={() => setCropImage(null)}
          onCrop={handleCrop}
        />
      )}
    </main>
  );
};

export default Profile;