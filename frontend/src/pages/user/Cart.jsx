import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import imageMap from "../../images/image";
import "../../styles/Cart.css";

// --------------------------------------------------
// CART RESPONSE HELPERS
// --------------------------------------------------

function getCartData(response) {
  const data = response?.data;

  if (data?.cart && typeof data.cart === "object") {
    return data.cart;
  }

  if (data?.data?.cart && typeof data.data.cart === "object") {
    return data.data.cart;
  }

  if (data?.data && typeof data.data === "object") {
    return data.data;
  }

  return data;
}

function getCartItems(response) {
  const data = response?.data;

  const candidates = [
    data?.cart?.items,
    data?.data?.cart?.items,
    data?.items,
    data?.cartItems,
    data?.data?.items,
    data?.data?.cartItems,
    Array.isArray(data?.data) ? data.data : null,
    Array.isArray(data) ? data : null,
  ];

  return candidates.find(Array.isArray) || [];
}

function getProduct(item) {
  return item?.product || item?.productDetails || item || {};
}

function getProductId(item) {
  const product = getProduct(item);

  return (
    item?.productId ??
    item?.product?.id ??
    item?.productDetails?.id ??
    product?.id ??
    product?.productId ??
    item?.id
  );
}

function getProductName(item) {
  const product = getProduct(item);

  return (
    item?.productName ||
    product?.name ||
    product?.productName ||
    "Fresh product"
  );
}

// --------------------------------------------------
// PRODUCT IMAGE
// --------------------------------------------------

function getProductImage(item) {
  const product = getProduct(item);
  const name = getProductName(item).trim();

  if (imageMap?.[name]) {
    return imageMap[name];
  }

  const matchingKey = Object.keys(imageMap || {}).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );

  if (matchingKey) {
    return imageMap[matchingKey];
  }

  const image =
    item?.imageUrl ||
    item?.imageURL ||
    item?.image ||
    product?.imageUrl ||
    product?.imageURL ||
    product?.image ||
    product?.imagePath ||
    "";

  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const url = image.trim();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/uploads/")) {
    return `http://localhost:8080${url}`;
  }

  if (url.startsWith("uploads/")) {
    return `http://localhost:8080/${url}`;
  }

  return url;
}

// --------------------------------------------------
// PRICE AND QUANTITY
// --------------------------------------------------

function getProductPrice(item) {
  const product = getProduct(item);

  return Number(
    item?.price ??
      item?.unitPrice ??
      product?.price ??
      product?.unitPrice ??
      product?.sellingPrice ??
      0
  );
}

function getQuantity(item) {
  return Number(item?.quantity ?? item?.qty ?? 1);
}

function getSellingUnit(item) {
  const product = getProduct(item);

  const unit = String(
    item?.sellingUnit ||
      item?.unit ||
      product?.sellingUnit ||
      product?.unit ||
      ""
  )
    .trim()
    .toUpperCase();

  if (
    ["KG", "KGS", "KILOGRAM", "KILOGRAMS"].includes(unit)
  ) {
    return "KG";
  }

  if (
    ["PIECE", "PIECES", "PC", "PCS"].includes(unit)
  ) {
    return "PIECE";
  }

  const weight = String(
    item?.weight || product?.weight || ""
  ).toUpperCase();

  if (
    weight.includes("KG") ||
    weight.includes("GRAM") ||
    /\d+\s*G\b/.test(weight)
  ) {
    return "KG";
  }

  const name = getProductName(item).toLowerCase();

  if (name.includes("egg")) {
    return "PIECE";
  }

  if (
    name.includes("chicken") ||
    name.includes("keema") ||
    name.includes("boneless") ||
    name.includes("drumstick") ||
    name.includes("breast") ||
    name.includes("wing")
  ) {
    return "KG";
  }

  return "PIECE";
}

// Format weight and piece quantities for display.
function formatQuantity(quantity, unit) {
  const safeQuantity = Number(quantity);

  if (!Number.isFinite(safeQuantity)) {
    return unit === "KG" ? "0 gm" : "0 pcs";
  }

  if (unit === "KG") {
    if (safeQuantity < 1) {
      return `${Math.round(safeQuantity * 1000)} gm`;
    }

    const formattedKg = Number.isInteger(safeQuantity)
      ? String(safeQuantity)
      : String(Number(safeQuantity.toFixed(3)));

    return `${formattedKg} kg`;
  }

  const formattedPieces = Number.isInteger(safeQuantity)
    ? String(safeQuantity)
    : String(Number(safeQuantity.toFixed(3)));

  return `${formattedPieces} ${
    safeQuantity === 1 ? "pc" : "pcs"
  }`;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

// --------------------------------------------------
// QUANTITY OPTIONS
// --------------------------------------------------

const chickenOptions = [
  { value: 0.25, label: "250 gm" },
  { value: 0.5, label: "500 gm" },
  { value: 0.75, label: "750 gm" },
  { value: 1, label: "1 kg" },
  { value: 1.25, label: "1.25 kg" },
  { value: 1.5, label: "1.5 kg" },
  { value: 1.75, label: "1.75 kg" },
  { value: 2, label: "2 kg" },
  { value: 2.25, label: "2.25 kg" },
  { value: 2.5, label: "2.5 kg" },
  { value: 2.75, label: "2.75 kg" },
  { value: 3, label: "3 kg" },
];

const pieceOptions = [
  { value: 1, label: "1 pc" },
  { value: 2, label: "2 pcs" },
  { value: 3, label: "3 pcs" },
  { value: 5, label: "5 pcs" },
  { value: 10, label: "10 pcs" },
  { value: 12, label: "12 pcs" },
  { value: 15, label: "15 pcs" },
  { value: 20, label: "20 pcs" },
  { value: 24, label: "24 pcs" },
  { value: 30, label: "30 pcs" },
];

// --------------------------------------------------
// CART COMPONENT
// --------------------------------------------------

export default function Cart() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // --------------------------------------------------
  // LOAD CART
  // --------------------------------------------------

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart");

      console.log("CART API RESPONSE:", response.data);

      const cartData = getCartData(response);
      const cartItems = getCartItems(response);

      setCart(cartData || null);
      setItems(cartItems);
    } catch (requestError) {
      console.error("Load cart error:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Refresh cart after adding a product elsewhere.
  useEffect(() => {
    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [loadCart]);

  // --------------------------------------------------
  // UPDATE QUANTITY
  // --------------------------------------------------

  const updateQuantity = async (item, newQuantity) => {
    const productId = getProductId(item);

    if (productId == null) {
      setError("Unable to identify this product in your cart.");
      return;
    }

    if (newQuantity <= 0) {
      await removeItem(item);
      return;
    }

    try {
      setBusyId(productId);
      setError("");
      setNotice("");

      await api.put(`/cart/items/${productId}`, {
        quantity: Number(Number(newQuantity).toFixed(3)),
      });

      await loadCart();
      setNotice("Cart quantity updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  // --------------------------------------------------
  // REMOVE ITEM
  // --------------------------------------------------

  const removeItem = async (item) => {
    const productId = getProductId(item);

    if (productId == null) {
      setError("Unable to identify this product in your cart.");
      return;
    }

    try {
      setBusyId(productId);
      setError("");
      setNotice("");

      await api.delete(`/cart/items/${productId}`);

      setItems((previous) =>
        previous.filter(
          (cartItem) =>
            String(getProductId(cartItem)) !== String(productId)
        )
      );

      setNotice(`${getProductName(item)} removed from your cart.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  // --------------------------------------------------
  // CLEAR CART
  // --------------------------------------------------

  const clearCart = async () => {
    if (items.length === 0 || clearing) return;

    if (!window.confirm("Are you sure you want to clear your cart?")) {
      return;
    }

    try {
      setClearing(true);
      setError("");
      setNotice("");

      await api.delete("/cart/clear");

      setItems([]);

      setCart((previous) =>
        previous
          ? { ...previous, items: [], totalAmount: 0 }
          : previous
      );

      setNotice("Your cart has been cleared.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setClearing(false);
    }
  };

  // --------------------------------------------------
  // CART TOTALS
  // --------------------------------------------------

  const subtotal = items.reduce((total, item) => {
    const quantity = getQuantity(item);

    const itemSubtotal = Number(
      item?.subtotal ??
        item?.totalPrice ??
        getProductPrice(item) * quantity
    );

    return total + itemSubtotal;
  }, 0);

  // Count distinct products, NOT the sum of their weights or pieces.
  const totalProducts = items.length;

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-state">
          <span className="cart-spinner" />
          <p>Loading your cart...</p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // CART PAGE
  // --------------------------------------------------

  return (
    <main className="cart-page">
      <header className="cart-page-heading">
        <div>
          <span className="cart-eyebrow">YOUR FRESHNEST BAG</span>
          <h1>My Shopping Cart</h1>
          <p>Review your items before moving to checkout.</p>
        </div>

        <Link to="/products" className="cart-continue-link">
          ← Continue Shopping
        </Link>
      </header>

      {error && (
        <div className="cart-alert cart-alert-error" role="alert">
          <span>!</span>
          <p>{error}</p>

          <button type="button" onClick={loadCart}>
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="cart-alert cart-alert-success" role="status">
          <span>✓</span>
          <p>{notice}</p>

          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is waiting for something fresh</h2>

          <p>
            You haven't added any products yet. Explore our selection and
            find something for your next meal.
          </p>

          <Link to="/products" className="cart-primary-button">
            Explore Products <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <>
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-items-heading">
                <h2>Your Items</h2>

                <span>
                  {totalProducts}{" "}
                  {totalProducts === 1 ? "product" : "products"}
                </span>

                <button
                  type="button"
                  className="cart-clear-button"
                  onClick={clearCart}
                  disabled={clearing || busyId !== null}
                >
                  {clearing ? "Clearing..." : "Clear Cart"}
                </button>
              </div>

              <div className="cart-items-list">
                {items.map((item, index) => {
                  const productId = getProductId(item);
                  const name = getProductName(item);
                  const image = getProductImage(item);
                  const price = getProductPrice(item);
                  const quantity = getQuantity(item);
                  const unit = getSellingUnit(item);

                  const isBusy =
                    busyId === productId || clearing;

                  const options =
                    unit === "KG" ? chickenOptions : pieceOptions;

                  return (
                    <article
                      className="cart-item"
                      key={productId ?? `${name}-${index}`}
                    >
                      <div className="cart-item-image">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span role="img" aria-label={name}>
                            🍗
                          </span>
                        )}
                      </div>

                      <div className="cart-item-details">
                        <h3>{name}</h3>

                        <p className="cart-item-unit">
                          {unit === "KG"
                            ? "Price per KG"
                            : "Price per piece"}
                        </p>

                        <p className="cart-item-unit-price">
                          {formatPrice(price)}
                        </p>

                        <div className="cart-item-actions">
                          <label className="cart-quantity-control">
                            <span className="sr-only">
                              Select quantity
                            </span>

                            <select
                              value={quantity}
                              disabled={isBusy}
                              onChange={(event) =>
                                updateQuantity(
                                  item,
                                  Number(event.target.value)
                                )
                              }
                            >
                              {options.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}

                              {!options.some(
                                (option) => option.value === quantity
                              ) && (
                                <option value={quantity}>
                                  {formatQuantity(quantity, unit)}
                                </option>
                              )}
                            </select>
                          </label>

                          <button
                            type="button"
                            className="cart-remove-button"
                            disabled={isBusy}
                            onClick={() => removeItem(item)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-total">
                        <strong>
                          {formatPrice(
                            Number(
                              item?.subtotal ??
                                item?.totalPrice ??
                                price * quantity
                            )
                          )}
                        </strong>

                        {isBusy && <small>Updating...</small>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ORDER SUMMARY */}

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="cart-summary-line">
                <span>Products ({totalProducts})</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div className="cart-summary-line">
                <span>Delivery fee</span>
                <span className="cart-summary-pending">
                  Free home delivery
                </span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total">
                <span>Subtotal</span>

                <strong>
                  {formatPrice(
                    Number(cart?.totalAmount ?? subtotal)
                  )}
                </strong>
              </div>

              <p className="cart-summary-note">
  Enjoy free home delivery on your order!
</p>

              <Link
                to="/checkout"
                className={`cart-checkout-button ${
                  busyId !== null || clearing
                    ? "cart-checkout-disabled"
                    : ""
                }`}
                onClick={(event) => {
                  if (busyId !== null || clearing) {
                    event.preventDefault();
                  }
                }}
                aria-disabled={busyId !== null || clearing}
              >
                Proceed to Checkout{" "}
                <span aria-hidden="true">→</span>
              </Link>

              <div className="cart-secure-note">
                <span>🔒</span>
                <span>Review your delivery details at checkout.</span>
              </div>

              <Link to="/products" className="cart-back-to-shop">
                ← Add More Products
              </Link>
            </aside>
          </div>

          <div className="cart-bottom-benefit">
            <span>♥</span>

            <p>
              <strong>Thank you for choosing FreshNest.</strong>
              <br />
              Fresh choices for your everyday meals.
            </p>
          </div>
        </>
      )}
    </main>
  );
}