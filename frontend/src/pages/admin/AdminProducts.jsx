import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../../services/api";
import imageMap from "../../images/image.js";
import "../../styles/AdminProducts.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  weight: "1 KG",
  sellingUnit: "KG",
  active: true,
};

const extractProducts = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data?.products)) return data.data.products;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const normalizeUnit = (product) => {
  const unit = String(product?.sellingUnit ?? "")
    .trim()
    .toUpperCase();

  if (unit === "KG" || unit === "PIECE") return unit;

  return String(product?.weight ?? "")
    .toUpperCase()
    .includes("KG")
    ? "KG"
    : "PIECE";
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/products");
      setProducts(extractProducts(response));
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load products. Check your admin access."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Release temporary image preview URLs when replaced or unmounted.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Find the matching local image first, then use the backend image.
  const getImageUrl = useCallback((product) => {
    if (!product) return "";

    const name = String(product.name ?? "").trim();
    const localImages = imageMap || {};

    if (localImages[name]) {
      return localImages[name];
    }

    const matchingKey = Object.keys(localImages).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );

    if (matchingKey) {
      return localImages[matchingKey];
    }

    const rawUrl = String(
      product.imageUrl ??
        product.imageURL ??
        product.imagePath ??
        product.image ??
        ""
    ).trim();

    if (!rawUrl) return "";

    if (
      /^https?:\/\//i.test(rawUrl) ||
      rawUrl.startsWith("data:")
    ) {
      return rawUrl;
    }

    if (rawUrl.startsWith("/uploads/")) {
      return `http://localhost:8080${rawUrl}`;
    }

    if (rawUrl.startsWith("uploads/")) {
      return `http://localhost:8080/${rawUrl}`;
    }

    if (rawUrl.startsWith("/")) {
      return `http://localhost:8080${rawUrl}`;
    }

    return `http://localhost:8080/${rawUrl}`;
  }, []);

  const clearFileInput = () => {
    const input = document.getElementById("admin-product-image");

    if (input) {
      input.value = "";
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setError("");
    clearFileInput();
  };

  const handleAddProduct = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
  };

  const handleEdit = (product) => {
    const unit = normalizeUnit(product);

    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      weight:
        product.weight || (unit === "KG" ? "1 KG" : "1 PC"),
      sellingUnit: unit,
      active: product.active ?? true,
    });

    setImageFile(null);
    setImagePreview(getImageUrl(product));
    setError("");
    setSuccess("");
    clearFileInput();
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSellingUnitChange = (event) => {
    const sellingUnit = event.target.value;

    setForm((previous) => ({
      ...previous,
      sellingUnit,
      weight: sellingUnit === "KG" ? "1 KG" : "1 PC",
    }));

    setError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);

      const currentProduct = products.find(
        (product) => product.id === editingId
      );

      setImagePreview(
        editingId !== null ? getImageUrl(currentProduct) : ""
      );

      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Product price must be greater than 0.");
      return;
    }

    if (!form.weight.trim() || !form.sellingUnit.trim()) {
      setError("Please enter the product weight and selling unit.");
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("description", form.description.trim());
    payload.append("price", String(form.price));
    payload.append("weight", form.weight.trim());
    payload.append("sellingUnit", form.sellingUnit);
    payload.append("active", String(form.active));

    if (imageFile) {
      payload.append("image", imageFile);
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/admin/products/${editingId}`, payload);
        setSuccess("Product updated successfully.");
      } else {
        await api.post("/admin/products", payload);
        setSuccess("Product added successfully.");
      }

      setShowForm(false);
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save product. Please check the entered details."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product) => {
    setError("");
    setSuccess("");

    const payload = new FormData();
    payload.append("name", product.name ?? "");
    payload.append("description", product.description ?? "");
    payload.append("price", String(product.price ?? 0));
    payload.append("weight", product.weight ?? "");
    payload.append(
      "sellingUnit",
      product.sellingUnit ?? normalizeUnit(product)
    );
    payload.append("active", String(!product.active));

    try {
      await api.put(`/admin/products/${product.id}`, payload);

      setSuccess(
        product.active
          ? "Product deactivated successfully."
          : "Product activated successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to update product availability.")
      );
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/admin/products/${product.id}`);

      if (editingId === product.id) {
        setShowForm(false);
        resetForm();
      }

      setSuccess("Product deleted successfully.");
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this product."));
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) =>
      [
        product.name,
        product.description,
        product.weight,
        product.sellingUnit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  return (
    <main className="admin-products-page">
      <div className="ap-container">
        <header className="ap-header">
          <div>
            <span className="ap-eyebrow">
              INVENTORY MANAGEMENT
            </span>
            <h1>Products</h1>
            <p>
              Add, update and manage your chicken and egg products.
            </p>
          </div>

          <button
            className="ap-refresh-button"
            onClick={loadProducts}
            type="button"
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        {error && !showForm && (
          <div className="ap-alert ap-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="ap-alert ap-alert-success" role="status">
            {success}
          </div>
        )}

        <section className="ap-list-card">
          <div className="ap-list-heading">
            <div>
              <h2>All Products</h2>
              <p>
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"} in inventory
              </p>
            </div>

            <div className="ap-list-actions">
              <input
                className="ap-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />

              <button
                type="button"
                className="ap-primary-button"
                onClick={handleAddProduct}
              >
                <span aria-hidden="true">＋</span>
                Add Product
              </button>
            </div>
          </div>

          {loading ? (
            <div className="ap-empty">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="ap-empty">
              <span>📦</span>
              <h3>No products found</h3>
              <p>
                {products.length === 0
                  ? "Add your first product using the Add Product button."
                  : "Try changing your search."}
              </p>
            </div>
          ) : (
            <div className="ap-table-wrapper">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Selling Unit</th>
                    <th>Weight</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const imageUrl = getImageUrl(product);
                    const unit = normalizeUnit(product);

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="ap-product-cell">
                            <div className="ap-product-image-wrap">
                              {imageUrl && (
                                <img
                                  src={imageUrl}
                                  alt={product.name || "Product"}
                                  className="ap-product-image"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                    const placeholder =
                                      event.currentTarget.parentElement
                                        ?.querySelector(
                                          ".ap-product-placeholder"
                                        );

                                    if (placeholder) {
                                      placeholder.style.display = "flex";
                                    }
                                  }}
                                />
                              )}

                              <div
                                className="ap-product-placeholder"
                                style={{
                                  display: imageUrl ? "none" : "flex",
                                }}
                              >
                                🍗
                              </div>
                            </div>

                            <div className="ap-product-text">
                              <strong>{product.name}</strong>
                              <small>
                                {product.description || "No description"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td className="ap-price">
                          ₹{Number(product.price || 0).toFixed(2)}
                        </td>

                        <td>
                          <span className="ap-unit-badge">{unit}</span>
                        </td>

                        <td>{product.weight || "—"}</td>

                        <td>
                          <span
                            className={`ap-product-status ${
                              product.active ? "is-active" : "is-inactive"
                            }`}
                          >
                            {product.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="ap-actions">
                            <button
                              className="ap-action-edit"
                              onClick={() => handleEdit(product)}
                              type="button"
                            >
                              Edit
                            </button>

                            <button
                              className="ap-action-toggle"
                              onClick={() => toggleAvailability(product)}
                              type="button"
                            >
                              {product.active ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              className="ap-action-delete"
                              onClick={() => deleteProduct(product)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div
          className="ap-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="ap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-modal-title"
          >
            <div className="ap-modal-heading">
              <div>
                <span className="ap-eyebrow">
                  INVENTORY MANAGEMENT
                </span>
                <h2 id="ap-modal-title">
                  {editingId !== null ? "Edit Product" : "Add New Product"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the product details below."
                    : "Enter the new product details below."}
                </p>
              </div>

              <button
                type="button"
                className="ap-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="ap-alert ap-alert-error" role="alert">
                {error}
              </div>
            )}

            <form className="ap-form" onSubmit={handleSubmit}>
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label htmlFor="ap-name">Product Name *</label>
                  <input
                    id="ap-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Chicken Curry Cut"
                    maxLength={120}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-price">Price (₹) *</label>
                  <input
                    id="ap-price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="e.g. 280"
                    required
                    disabled={saving}
                  />
                  <small>
                    Price for one{" "}
                    {form.sellingUnit === "KG" ? "KG" : "piece"}.
                  </small>
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-unit">Selling Unit *</label>
                  <select
                    id="ap-unit"
                    name="sellingUnit"
                    value={form.sellingUnit}
                    onChange={handleSellingUnitChange}
                    required
                    disabled={saving}
                  >
                    <option value="KG">KG — Sold by weight</option>
                    <option value="PIECE">PIECE — Sold by piece</option>
                  </select>
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-weight">Weight / Unit *</label>
                  <input
                    id="ap-weight"
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder={form.sellingUnit === "KG" ? "1 KG" : "1 PC"}
                    maxLength={50}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="ap-field ap-field-full">
                  <label htmlFor="ap-description">Description</label>
                  <textarea
                    id="ap-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the product..."
                    rows={3}
                    maxLength={1000}
                    disabled={saving}
                  />
                </div>

                <div className="ap-field ap-field-full">
                  <label htmlFor="admin-product-image">
                    Product Image
                  </label>
                  <input
                    id="admin-product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                  <small>
                    {editingId !== null
                      ? "Select a replacement image or leave empty to keep the existing image."
                      : "Choose a JPG, PNG, or WebP image."}
                  </small>
                </div>

                {imagePreview && (
                  <div className="ap-field ap-field-full">
                    <label>Image Preview</label>
                    <div className="ap-image-preview">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="ap-active-option">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  disabled={saving}
                />
                <span>
                  Product is active and available for customers
                </span>
              </label>

              <div className="ap-form-actions">
                <button
                  className="ap-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Add Product"}
                </button>

                <button
                  className="ap-secondary-button"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}