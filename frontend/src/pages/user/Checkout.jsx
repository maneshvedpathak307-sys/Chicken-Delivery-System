import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Checkout.css";

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

function getCartItems(data) {
  const candidates = [
    data?.cart?.items,
    data?.data?.cart?.items,
    data?.items,
    data?.cartItems,
    data?.data?.items,
    data?.data?.cartItems,
  ];

  return candidates.find(Array.isArray) || [];
}

function getProduct(item) {
  return item?.product || item?.productDetails || item || {};
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

function getProductPrice(item) {
  const product = getProduct(item);

  return Number(
    item?.unitPrice ??
      item?.price ??
      product?.price ??
      product?.unitPrice ??
      product?.sellingPrice ??
      0
  );
}

function getQuantity(item) {
  return Number(item?.quantity ?? item?.qty ?? 1);
}

// --------------------------------------------------
// QUANTITY UNIT FORMATTING
// Eggs use pcs. All other products use kg or gm.
// --------------------------------------------------

function getQuantityUnit(item) {
  const product = getProduct(item);
  const name = getProductName(item).trim().toLowerCase();

  // Only chicken eggs should display pieces.
  if (name.includes("egg")) {
    return "pcs";
  }

  const rawUnit =
    item?.unit ??
    item?.quantityUnit ??
    item?.unitOfMeasure ??
    item?.measurementUnit ??
    product?.unit ??
    product?.quantityUnit ??
    product?.unitOfMeasure ??
    product?.measurementUnit ??
    "";

  const unit = String(rawUnit).trim().toLowerCase();

  // Preserve gram units when supplied by the backend.
  if (
    ["g", "gm", "gms", "gram", "grams"].includes(unit)
  ) {
    return "gm";
  }

  // Other products default to kilograms.
  // Even if the backend says "pcs", only eggs use pcs.
  return "kg";
}

function formatDisplayQuantity(item) {
  const quantity = getQuantity(item);
  const unit = getQuantityUnit(item);

  if (!Number.isFinite(quantity) || quantity < 0) {
    return `0 ${unit}`;
  }

  // Convert fractional kilograms into grams.
  // Example: 0.5 kg -> 500 gm.
  if (unit === "kg" && quantity > 0 && quantity < 1) {
    const grams = quantity * 1000;

    if (Number.isInteger(grams)) {
      return `${grams} gm`;
    }

    return `${Number(grams.toFixed(3))} gm`;
  }

  const formattedQuantity = Number.isInteger(quantity)
    ? String(quantity)
    : String(Number(quantity.toFixed(3)));

  return `${formattedQuantity} ${unit}`;
}

// --------------------------------------------------
// PRODUCT AND PROFILE HELPERS
// --------------------------------------------------

function getProductId(item) {
  const product = getProduct(item);

  return (
    item?.productId ??
    product?.id ??
    product?.productId ??
    item?.id
  );
}

function getItemTotal(item) {
  const explicitTotal = item?.subtotal ?? item?.totalPrice;

  if (
    explicitTotal != null &&
    Number.isFinite(Number(explicitTotal))
  ) {
    return Number(explicitTotal);
  }

  return getProductPrice(item) * getQuantity(item);
}

function getProfileName(profile) {
  return String(profile?.name || profile?.fullName || "");
}

function getProfilePhone(profile) {
  return String(
    profile?.phone ||
      profile?.mobile ||
      profile?.phoneNumber ||
      ""
  );
}

function getProfileAddress(profile) {
  if (!profile) return "";

  const address = profile.address;

  if (typeof address === "string") {
    return address.trim();
  }

  if (address && typeof address === "object") {
    return [
      address.addressLine,
      address.city,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return [
    profile.addressLine,
    profile.city,
    profile.state,
    profile.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getOrderId(order) {
  return order?.orderId ?? order?.id ?? null;
}

function getResponseOrder(data) {
  return data?.order || data?.data?.order || null;
}

function getPaymentStatus(data) {
  return String(
    data?.paymentStatus ||
      data?.payment?.paymentStatus ||
      data?.order?.paymentStatus ||
      data?.order?.payment?.paymentStatus ||
      ""
  ).toUpperCase();
}

// --------------------------------------------------
// CHECKOUT COMPONENT
// --------------------------------------------------

export default function Checkout() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdOrder, setCreatedOrder] = useState(null);

  // --------------------------------------------------
  // LOAD PROFILE AND CART
  // --------------------------------------------------

  const loadCheckoutData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, cartResponse] = await Promise.all([
        api.get("/profile"),
        api.get("/cart"),
      ]);

      const profileData =
        profileResponse.data?.profile ||
        profileResponse.data?.data?.profile ||
        profileResponse.data?.user ||
        profileResponse.data?.data?.user ||
        profileResponse.data?.data ||
        profileResponse.data;

      const cartData =
        cartResponse.data?.cart ||
        cartResponse.data?.data?.cart ||
        cartResponse.data?.data ||
        cartResponse.data;

      setProfile(profileData || null);
      setCart(cartData || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  const items = getCartItems({
    cart,
    data: cart,
    items: cart?.items,
    cartItems: cart?.cartItems,
  });

  const subtotal = Number(
    cart?.totalAmount ??
      cart?.subtotal ??
      items.reduce((sum, item) => sum + getItemTotal(item), 0)
  );

  const profileName = getProfileName(profile);
  const profilePhone = getProfilePhone(profile);
  const profileAddress = getProfileAddress(profile);

  const profileComplete = Boolean(
    profileName.trim() &&
      profilePhone.trim() &&
      profileAddress.trim()
  );

  const orderId = getOrderId(createdOrder);

  const totalAmount = Number(
    createdOrder?.totalAmount ??
      createdOrder?.total ??
      createdOrder?.grandTotal ??
      subtotal
  );

  // Count product rows, not the sum of quantities.
  const totalItems = items.length;

  const selectPaymentMethod = (method) => {
    if (createdOrder || placingOrder || confirmingPayment) {
      return;
    }

    setPaymentMethod(method);
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!profileComplete) {
      setError(
        "Please update your name, mobile number, and delivery address in your profile before checkout."
      );
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty. Add products before checking out.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await api.post("/orders/checkout", {
        paymentMethod,
      });

      const order = getResponseOrder(response.data);

      if (
        response.data?.success === false ||
        !order ||
        !getOrderId(order)
      ) {
        throw new Error(
          response.data?.message ||
            "The backend did not return a valid order ID. Please check your orders before retrying."
        );
      }

      if (paymentMethod === "COD") {
        navigate(`/orders/${getOrderId(order)}`, {
          replace: true,
        });
        return;
      }

      setCreatedOrder(order);

      setSuccess(
        "Your order has been created. Scan the UPI QR code to make your payment."
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPlacingOrder(false);
    }
  };

  // --------------------------------------------------
  // VERIFY ONLINE PAYMENT
  // --------------------------------------------------

  const handleVerifyPayment = async () => {
    if (!orderId) {
      setError("The order ID is missing. Please contact support.");
      return;
    }

    setError("");
    setSuccess("");
    setConfirmingPayment(true);

    try {
      const response = await api.post(
        `/orders/${orderId}/payment/confirm`
      );

      const data = response.data || {};
      const status = getPaymentStatus(data);

      if (data.success === false || status !== "PAID") {
        setError(
          data.message ||
            "Payment has not been verified. Complete your payment and try again."
        );
        return;
      }

      setSuccess("Your payment has been verified successfully.");

      navigate(`/orders/${orderId}`, {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Payment verification is unavailable. Your payment status has not been confirmed."
      );
    } finally {
      setConfirmingPayment(false);
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-state">
          <span className="checkout-spinner" />
          <p>Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // INITIAL LOAD ERROR
  // --------------------------------------------------

  if (error && !profile && !cart) {
    return (
      <main className="checkout-page">
        <div className="checkout-state">
          <span className="checkout-state-icon">!</span>
          <h2>Unable to load checkout</h2>
          <p>{error}</p>

          <button
            type="button"
            className="checkout-primary-button"
            onClick={loadCheckoutData}
          >
            Try Again
          </button>

          <Link to="/cart" className="checkout-back-link">
            Return to Cart
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // CHECKOUT PAGE
  // --------------------------------------------------

  return (
    <main className="checkout-page">
      <header className="checkout-heading">
        <div>
          <span className="checkout-eyebrow">ALMOST THERE</span>
          <h1>Checkout</h1>
          <p>Review your delivery details and confirm your order.</p>
        </div>

        <div className="checkout-progress">
          <span className="checkout-progress-done">✓ Cart</span>
          <span className="checkout-progress-line" />
          <span className="checkout-progress-current">
            2. Checkout
          </span>
          <span className="checkout-progress-line" />
          <span>3. Confirmation</span>
        </div>
      </header>

      {error && (
        <div className="checkout-alert" role="alert">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="checkout-success-message" role="status">
          {success}
        </div>
      )}

      {items.length === 0 && !createdOrder ? (
        <section className="checkout-empty">
          <span className="checkout-empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add some products before proceeding to checkout.</p>

          <Link to="/products" className="checkout-primary-button">
            Browse Products →
          </Link>
        </section>
      ) : (
        <form
          className="checkout-layout"
          onSubmit={handlePlaceOrder}
        >
          <div className="checkout-main">
            {/* DELIVERY DETAILS */}

            <section className="checkout-card">
              <div className="checkout-card-heading">
                <span className="checkout-number">01</span>
                <div>
                  <h2>Delivery Details</h2>
                  <p>
                    Your order will use the address saved in your profile.
                  </p>
                </div>
              </div>

              {profileComplete ? (
                <div className="checkout-address-card">
                  <div className="checkout-address-icon">📍</div>

                  <div className="checkout-address-content">
                    <span className="checkout-address-label">
                      DELIVERING TO
                    </span>

                    <h3>{profileName}</h3>
                    <p>{profilePhone}</p>
                    <p>{profileAddress}</p>
                  </div>

                  {!createdOrder && (
                    <Link
                      to="/profile"
                      className="checkout-edit-link"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              ) : (
                <div className="checkout-profile-warning">
                  <span>!</span>
                  <div>
                    <strong>Complete your delivery details</strong>
                    <p>
                      Your name, mobile number, and delivery address are
                      required before you can place an order.
                    </p>

                    <Link to="/profile">
                      Update My Profile →
                    </Link>
                  </div>
                </div>
              )}

              <p className="checkout-address-note">
                Need to change your delivery address? Update your profile
                before placing the order.
              </p>
            </section>

            {/* PAYMENT METHOD */}

            {!createdOrder && (
              <section className="checkout-card">
                <div className="checkout-card-heading">
                  <span className="checkout-number">02</span>
                  <div>
                    <h2>Payment Method</h2>
                    <p>Choose how you would like to pay.</p>
                  </div>
                </div>

                <div className="checkout-payment-options">
                  <label
                    className={`checkout-payment-option ${
                      paymentMethod === "COD" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => selectPaymentMethod("COD")}
                    />

                    <span className="checkout-payment-icon">💵</span>

                    <span className="checkout-payment-text">
                      <strong>Cash on Delivery</strong>
                      <small>Pay when your order arrives.</small>
                    </span>

                    <span className="checkout-payment-check">
                      {paymentMethod === "COD" ? "✓" : ""}
                    </span>
                  </label>

                  <label
                    className={`checkout-payment-option ${
                      paymentMethod === "ONLINE" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => selectPaymentMethod("ONLINE")}
                    />

                    <span className="checkout-payment-icon">📱</span>

                    <span className="checkout-payment-text">
                      <strong>Online Payment (UPI QR)</strong>
                      <small>
                        Create your order and then scan the QR code to pay.
                      </small>
                    </span>

                    <span className="checkout-payment-check">
                      {paymentMethod === "ONLINE" ? "✓" : ""}
                    </span>
                  </label>
                </div>

                {paymentMethod === "ONLINE" && (
                  <p className="checkout-online-warning">
                    Continue to create your order and display the QR code.
                    Payment is complete only after it is verified.
                  </p>
                )}
              </section>
            )}

            {/* ORDER ITEMS */}

            <section className="checkout-card">
              <div className="checkout-card-heading">
                <span className="checkout-number">03</span>
                <div>
                  <h2>Order Items</h2>
                  <p>Check the products and quantities in your order.</p>
                </div>
              </div>

              <div className="checkout-items">
                {items.map((item, index) => {
                  const name = getProductName(item);
                  const itemTotal = getItemTotal(item);

                  const id =
                    getProductId(item) ?? `${name}-${index}`;

                  return (
                    <div className="checkout-item" key={id}>
                      <div className="checkout-item-info">
                        <h3>{name}</h3>
                        <p>
                          Quantity: {formatDisplayQuantity(item)}
                        </p>
                      </div>

                      <strong>{formatPrice(itemTotal)}</strong>
                    </div>
                  );
                })}
              </div>

              {!createdOrder && (
                <Link to="/cart" className="checkout-edit-cart">
                  ← Edit Cart
                </Link>
              )}
            </section>

            {/* ONLINE PAYMENT QR */}

            {createdOrder && paymentMethod === "ONLINE" && (
              <section className="checkout-card checkout-qr-card">
                <div className="checkout-card-heading">
                  <span className="checkout-number">04</span>
                  <div>
                    <h2>Pay Online Using UPI</h2>
                    <p>Order #{orderId}</p>
                  </div>
                </div>

                <div className="checkout-qr-content">
                  <p>
                    Scan the QR code using your UPI application.
                  </p>

                  <img
                    src="/upi_qr.png"
                    alt="UPI payment QR code"
                    className="checkout-qr-image"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />

                  <strong className="checkout-qr-total">
                    Total: {formatPrice(totalAmount)}
                  </strong>

                  <p className="checkout-qr-note">
                    Complete the payment in your UPI app. Your payment
                    must be verified by the backend before the order is
                    treated as paid.
                  </p>

                  <button
                    type="button"
                    className="checkout-place-button"
                    onClick={handleVerifyPayment}
                    disabled={confirmingPayment}
                  >
                    {confirmingPayment
                      ? "Verifying Payment..."
                      : "I Have Paid — Verify Payment"}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* ORDER SUMMARY */}

          <aside className="checkout-summary">
            <h2>Order Summary</h2>

            <div className="checkout-summary-line">
              <span>Products</span>
              <strong>{totalItems}</strong>
            </div>

            <div className="checkout-summary-line">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="checkout-summary-line">
              <span>Delivery Fee</span>
              <span className="checkout-fee-note">
                Free home delivery
              </span>
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-summary-total">
              <span>
                {createdOrder ? "Order Total" : "Cart Subtotal"}
              </span>
              <strong>{formatPrice(totalAmount)}</strong>
            </div>

            <p className="checkout-summary-note">
              Enjoy free home delivery on your order !
            </p>

            {!createdOrder && (
              <>
                <button
                  type="submit"
                  className="checkout-place-button"
                  disabled={
                    placingOrder ||
                    items.length === 0 ||
                    !profileComplete
                  }
                >
                  {placingOrder
                    ? "Processing..."
                    : paymentMethod === "COD"
                      ? "Place COD Order"
                      : "Continue to Online Payment"}

                  {!placingOrder && (
                    <span aria-hidden="true">→</span>
                  )}
                </button>

                {!profileComplete && (
                  <p className="checkout-required-note">
                    Update your profile to enable order placement.
                  </p>
                )}

                <div className="checkout-secure-note">
                  <span>🔒</span>
                  <span>
                    Your order is submitted securely to FreshNest.
                  </span>
                </div>

                <Link to="/cart" className="checkout-back-link">
                  Return to Cart
                </Link>
              </>
            )}
          </aside>
        </form>
      )}
    </main>
  );
}