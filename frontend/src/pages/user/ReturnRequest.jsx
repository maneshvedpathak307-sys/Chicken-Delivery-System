import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/ReturnRequest.css";

const STATUS_INFO = {
  REQUESTED: {
    title: "Request submitted",
    message: "Our team will review your return request.",
  },
  APPROVED: {
    title: "Return approved",
    message: "Pickup will be arranged for your selected product.",
  },
  REJECTED: {
    title: "Return rejected",
    message: "Please check the note from our team.",
  },
  PICKUP_SCHEDULED: {
    title: "Pickup arranged",
    message: "The return pickup has been arranged.",
  },
  PICKED_UP: {
    title: "Product collected",
    message: "Your returned product has been collected.",
  },
  REFUND_PENDING: {
    title: "Cash refund pending",
    message: "Your cash refund is awaiting payment.",
  },
  REFUNDED: {
    title: "Cash refund handed over",
    message: "Please confirm that you have received the cash.",
  },
};

const getOrders = (data) => {
  const result = data?.orders ?? data?.data?.orders ?? [];
  return Array.isArray(result) ? result : [];
};

const getRequests = (data) => {
  const result = data?.returnRequests ?? data?.data?.returnRequests ?? [];
  return Array.isArray(result) ? result : [];
};

const getOrder = (data) =>
  data?.order ?? data?.data?.order ?? data?.data ?? data;

const getOrderId = (order) => order?.orderId ?? order?.id;

const getStatus = (order) => {
  const value = order?.status ?? order?.orderStatus;

  if (typeof value === "string") return value.toUpperCase();

  return String(value?.code ?? value?.name ?? value?.status ?? "")
    .toUpperCase();
};

const getItems = (order) =>
  order?.items ?? order?.orderItems ?? order?.orderDetails ?? [];

const getItemId = (item) => item?.id ?? item?.orderItemId;

const getProduct = (item) =>
  item?.product ?? item?.productDetails ?? {};

const getItemName = (item) => {
  const product = getProduct(item);

  return (
    item?.productName ??
    product?.productName ??
    product?.name ??
    item?.name ??
    "Chicken Product"
  );
};

const getPrice = (item) =>
  Number(
    item?.price ??
      item?.unitPrice ??
      item?.productPrice ??
      getProduct(item)?.price ??
      0
  );

const getQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? 1);

const getWeight = (item) =>
  item?.weight ?? getProduct(item)?.weight ?? "";

const money = (value) =>
  value == null || value === ""
    ? "Not available"
    : `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const quantityText = (value) =>
  Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  });

const dateText = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export default function ReturnRequest() {
  const [searchParams] = useSearchParams();

  const queryOrderId = searchParams.get("orderId") || "";
  const queryItemId = searchParams.get("orderItemId") || "";

  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState(queryOrderId);

  const [selectedItemId, setSelectedItemId] =
    useState(queryItemId);

  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [reasonType, setReasonType] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          String(getOrderId(order)) === String(selectedOrderId)
      ) || null,
    [orders, selectedOrderId]
  );

  const deliveredItems = useMemo(() => {
    if (
      !selectedOrder ||
      getStatus(selectedOrder) !== "DELIVERED"
    ) {
      return [];
    }

    const items = getItems(selectedOrder);

    return Array.isArray(items)
      ? items.filter((item) => getItemId(item) != null)
      : [];
  }, [selectedOrder]);

  const selectedItem = useMemo(
    () =>
      deliveredItems.find(
        (item) =>
          String(getItemId(item)) === String(selectedItemId)
      ) || null,
    [deliveredItems, selectedItemId]
  );

  /*
   * Load the customer's orders and return requests.
   * If the URL contains an order ID, also fetch that order's details.
   */
  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersResponse, requestsResponse] = await Promise.all([
        api.get("/orders"),
        api.get("/returns/my"),
      ]);

      let customerOrders = getOrders(ordersResponse.data);
      const customerRequests = getRequests(requestsResponse.data);

      if (queryOrderId) {
        try {
          const detailResponse = await api.get(
            `/orders/${encodeURIComponent(queryOrderId)}`
          );

          const detail = getOrder(detailResponse.data);

          if (
            detail &&
            typeof detail === "object" &&
            getOrderId(detail) != null
          ) {
            const detailId = String(getOrderId(detail));

            const exists = customerOrders.some(
              (order) =>
                String(getOrderId(order)) === detailId
            );

            customerOrders = exists
              ? customerOrders.map((order) =>
                  String(getOrderId(order)) === detailId
                    ? detail
                    : order
                )
              : [...customerOrders, detail];
          }
        } catch {
          // Continue using the customer's order list.
        }
      }

      setOrders(customerOrders);
      setRequests(customerRequests);

      if (queryOrderId) {
        setSelectedOrderId(queryOrderId);
      }

      if (queryItemId) {
        setSelectedItemId(queryItemId);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load orders and return requests."
      );
    } finally {
      setLoading(false);
    }
  }, [queryOrderId, queryItemId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /*
   * Count quantities already requested for this order item.
   * Rejected requests do not reduce the remaining quantity.
   */
  const getAlreadyRequested = useCallback(
    (orderId, itemId) =>
      requests
        .filter(
          (request) =>
            String(request.orderId) === String(orderId) &&
            String(request.orderItemId) === String(itemId) &&
            String(request.status).toUpperCase() !== "REJECTED"
        )
        .reduce(
          (sum, request) =>
            sum + Number(request.returnQuantity || 0),
          0
        ),
    [requests]
  );

  const availableQuantity = selectedItem
    ? Math.max(
        0,
        getQuantity(selectedItem) -
          getAlreadyRequested(
            getOrderId(selectedOrder),
            getItemId(selectedItem)
          )
      )
    : 0;

  const estimatedAmount =
    selectedItem && Number(selectedQuantity) > 0
      ? getPrice(selectedItem) * Number(selectedQuantity)
      : 0;

  /*
   * Reset the quantity when the selected product changes or
   * when its remaining eligible quantity changes.
   */
  useEffect(() => {
    if (!selectedItem) return;

    setSelectedQuantity(
      availableQuantity > 0
        ? String(Math.min(1, availableQuantity))
        : ""
    );
  }, [selectedItem, availableQuantity]);

  /*
   * IMPORTANT:
   * Show requests for the selected order only.
   * When no order is selected, show the customer's complete history.
   */
  const visibleRequests = useMemo(() => {
    if (!selectedOrderId) {
      return requests;
    }

    return requests.filter(
      (request) =>
        String(request.orderId) === String(selectedOrderId)
    );
  }, [requests, selectedOrderId]);

  const finalReason =
    reasonType === "Other"
      ? otherReason.trim()
      : reasonType;

  const submitRequest = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !selectedOrder ||
      getStatus(selectedOrder) !== "DELIVERED"
    ) {
      setError("Please select a delivered order.");
      return;
    }

    if (!selectedItem) {
      setError("Please select the product you want to return.");
      return;
    }

    const quantity = Number(selectedQuantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > availableQuantity
    ) {
      setError(
        `Enter a valid quantity. Available quantity: ${quantityText(
          availableQuantity
        )}.`
      );
      return;
    }

    if (!finalReason) {
      setError("Please select or explain your return reason.");
      return;
    }

    if (finalReason.length > 1000) {
      setError(
        "The return reason must be 1000 characters or fewer."
      );
      return;
    }

    const orderId = getOrderId(selectedOrder);
    const orderItemId = getItemId(selectedItem);

    if (orderId == null || orderItemId == null) {
      setError(
        "Order or product ID is missing. Please reload."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/returns", {
        orderId: Number(orderId),
        orderItemId: Number(orderItemId),
        quantity,
        reason: finalReason,
      });

      setSuccess(
        response.data?.message ||
          "Your product return request has been submitted."
      );

      setReasonType("");
      setOtherReason("");

      await loadPage();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your return request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCashReceived = async (request) => {
    const id = request.returnRequestId;

    if (
      request.status !== "REFUNDED" ||
      request.customerCashConfirmed
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Confirm that you have actually received ₹${Number(
        request.refundAmount || 0
      ).toFixed(2)} in cash for ${
        request.productName || "this return"
      }?`
    );

    if (!confirmed) return;

    setConfirmingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/returns/${encodeURIComponent(id)}/confirm-cash-received`
      );

      const updated = response.data?.returnRequest;

      if (updated) {
        setRequests((current) =>
          current.map((item) =>
            String(item.returnRequestId) === String(id)
              ? updated
              : item
          )
        );
      }

      setSuccess(
        response.data?.message ||
          "Cash receipt confirmed successfully."
      );

      await loadPage();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to confirm cash receipt. Please refresh and try again."
      );
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <main className="return-page">
        <div className="return-container return-empty">
          Loading your orders and return requests...
        </div>
      </main>
    );
  }

  return (
    <main className="return-page">
      <div className="return-container">
        <header className="return-header">
          <div>
            <span className="return-eyebrow">
              FRESHNEST CUSTOMER CARE
            </span>

            <h1>Returns &amp; Refunds</h1>

            <p>
              Return individual products and track pickup and cash refunds.
            </p>
          </div>

          <Link
            to="/orders"
            className="return-back-button"
          >
            ← My Orders
          </Link>
        </header>

        {error && (
          <div
            className="return-alert return-alert-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="return-alert return-alert-success"
            role="status"
          >
            {success}
          </div>
        )}

        <section className="return-panel">
          <div className="return-panel-heading">
            <span className="return-panel-icon">↩</span>

            <div>
              <h2>Request a Product Return</h2>
              <p>
                Select a delivered order, product, and quantity.
              </p>
            </div>
          </div>

          <form
            onSubmit={submitRequest}
            className="return-form"
          >
            <div className="return-field">
              <label htmlFor="return-order">
                Delivered order
              </label>

              <select
                id="return-order"
                value={selectedOrderId}
                onChange={(event) => {
                  setSelectedOrderId(event.target.value);
                  setSelectedItemId("");
                  setSelectedQuantity("1");
                  setError("");
                  setSuccess("");
                }}
                required
              >
                <option value="">
                  Select your delivered order
                </option>

                {orders
                  .filter(
                    (order) =>
                      getStatus(order) === "DELIVERED"
                  )
                  .map((order) => (
                    <option
                      key={getOrderId(order)}
                      value={getOrderId(order)}
                    >
                      Order #{getOrderId(order)} —{" "}
                      {dateText(
                        order.createdAt ?? order.orderDate
                      )}
                    </option>
                  ))}
              </select>

              <small>
                Only delivered orders are eligible.
              </small>
            </div>

            {selectedOrder &&
              getStatus(selectedOrder) === "DELIVERED" && (
                <div className="return-product-list">
                  <h3>Select a product to return</h3>

                  {deliveredItems.length === 0 ? (
                    <p className="return-empty">
                      No product details are available for this order.
                    </p>
                  ) : (
                    deliveredItems.map((item) => {
                      const id = getItemId(item);
                      const purchased = getQuantity(item);

                      const remaining = Math.max(
                        0,
                        purchased -
                          getAlreadyRequested(
                            getOrderId(selectedOrder),
                            id
                          )
                      );

                      return (
                        <label
                          className={`return-product-option ${
                            String(selectedItemId) === String(id)
                              ? "selected"
                              : ""
                          }`}
                          key={id}
                        >
                          <input
                            type="radio"
                            name="returnProduct"
                            value={id}
                            checked={
                              String(selectedItemId) === String(id)
                            }
                            disabled={remaining <= 0}
                            onChange={() => {
                              setSelectedItemId(String(id));
                              setError("");
                            }}
                          />

                          <span className="return-product-details">
                            <strong>{getItemName(item)}</strong>

                            {getWeight(item) && (
                              <small>
                                Weight/unit: {getWeight(item)}
                              </small>
                            )}

                            <small>
                              Purchased: {quantityText(purchased)}
                            </small>

                            <small>
                              Unit price: {money(getPrice(item))}
                            </small>

                            <small>
                              Available to return:{" "}
                              {quantityText(remaining)}
                            </small>
                          </span>

                          <strong className="return-product-price">
                            {money(getPrice(item) * purchased)}
                          </strong>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

            {selectedItem && (
              <div className="return-field">
                <label htmlFor="return-quantity">
                  Return quantity
                </label>

                <input
                  id="return-quantity"
                  type="number"
                  min="0.001"
                  max={availableQuantity}
                  step="0.001"
                  value={selectedQuantity}
                  onChange={(event) =>
                    setSelectedQuantity(event.target.value)
                  }
                  required
                />

                <small>
                  Maximum available:{" "}
                  {quantityText(availableQuantity)}
                </small>

                <div className="return-estimate">
                  <span>Estimated return amount</span>
                  <strong>{money(estimatedAmount)}</strong>
                  <small>
                    The backend validates the final quantity and amount.
                  </small>
                </div>
              </div>
            )}

            <div className="return-field">
              <label htmlFor="return-reason">
                Reason for return
              </label>

              <select
                id="return-reason"
                value={reasonType}
                onChange={(event) => {
                  setReasonType(event.target.value);
                  setOtherReason("");
                  setError("");
                }}
                required
              >
                <option value="">Select a reason</option>
                <option value="Product damaged">
                  Product damaged
                </option>
                <option value="Wrong product delivered">
                  Wrong product delivered
                </option>
                <option value="Quality issue">
                  Quality issue
                </option>
                <option value="Quantity issue">
                  Quantity issue
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {reasonType === "Other" && (
              <div className="return-field">
                <label htmlFor="return-reason-details">
                  Explain the reason
                </label>

                <textarea
                  id="return-reason-details"
                  rows="3"
                  maxLength={1000}
                  value={otherReason}
                  onChange={(event) =>
                    setOtherReason(event.target.value)
                  }
                  placeholder="Explain the issue..."
                  required
                />

                <small>
                  {otherReason.length}/1000 characters
                </small>
              </div>
            )}

            <div className="return-cash-notice">
              <strong>Cash refund policy</strong>
              <p>
                After the returned product is collected and cash is
                handed over, you can confirm receipt in your return
                history.
              </p>
            </div>

            <button
              type="submit"
              className="return-primary-button"
              disabled={
                submitting ||
                !selectedItem ||
                availableQuantity <= 0
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit Return Request"}
            </button>
          </form>
        </section>

        <section className="return-history-section">
          <div className="return-history-heading">
            <div>
              <span className="return-eyebrow">
                YOUR REQUESTS
              </span>

              <h2>
                {selectedOrderId
                  ? `Return History — Order #${selectedOrderId}`
                  : "Return History"}
              </h2>
            </div>

            <button
              type="button"
              className="return-refresh-button"
              onClick={loadPage}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {!selectedOrderId && (
            <p>
              Showing all your return requests. Select an order above
              to filter this history to that order.
            </p>
          )}

          {selectedOrderId && !selectedOrder && (
            <div className="return-empty">
              <h3>Order details unavailable</h3>
              <p>
                Return history for order #{selectedOrderId} is shown
                below if any requests exist.
              </p>

              <Link
                to="/orders"
                className="return-back-button"
              >
                Go to My Orders
              </Link>
            </div>
          )}

          {visibleRequests.length === 0 ? (
            <div className="return-empty">
              <span>📦</span>

              <h3>
                {selectedOrderId
                  ? "No return requests for this order"
                  : "No return requests yet"}
              </h3>

              <p>
                {selectedOrderId
                  ? "Your return requests for this order will appear here."
                  : "Your submitted requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="return-request-list">
              {visibleRequests.map((item) => {
                const info = STATUS_INFO[item.status] || {
                  title: item.status || "Status unavailable",
                  message: "Check the latest request information.",
                };

                const confirmed =
                  item.customerCashConfirmed === true;

                const canConfirm =
                  item.status === "REFUNDED" && !confirmed;

                return (
                  <article
                    className="return-request-card"
                    key={item.returnRequestId}
                  >
                    <div className="return-request-card-header">
                      <div>
                        <span className="return-small-label">
                          RETURN REQUEST
                        </span>

                        <h3>
                          {item.productName || "Product return"}
                        </h3>

                        {item.weight && <p>{item.weight}</p>}
                      </div>

                      <span
                        className={`return-status-badge return-status-${String(
                          item.status || ""
                        ).toLowerCase()}`}
                      >
                        {info.title}
                      </span>
                    </div>

                    <p>
                      <strong>Order:</strong> #{item.orderId}
                    </p>

                    <p>
                      <strong>Quantity returned:</strong>{" "}
                      {item.returnQuantity == null
                        ? "Not available"
                        : quantityText(item.returnQuantity)}
                    </p>

                    <p className="return-reason">
                      <strong>Reason:</strong>{" "}
                      {item.reason || "Not provided"}
                    </p>

                    <p className="return-status-description">
                      {confirmed
                        ? "You have confirmed receiving the cash refund."
                        : info.message}
                    </p>

                    {item.adminNote && (
                      <div className="return-team-note">
                        <strong>Update from FreshNest</strong>
                        <p>{item.adminNote}</p>
                      </div>
                    )}

                    <div className="return-refund-box">
                      <h4>Return amount</h4>

                      <div className="return-refund-row">
                        <span>Calculated amount</span>
                        <strong>{money(item.refundAmount)}</strong>
                      </div>

                      <div className="return-refund-row">
                        <span>Refund method</span>
                        <strong>
                          {item.status === "REJECTED"
                            ? "Not applicable"
                            : item.refundMethod || "CASH"}
                        </strong>
                      </div>

                      <div className="return-refund-row">
                        <span>Cash handover recorded</span>
                        <strong>{dateText(item.refundedAt)}</strong>
                      </div>

                      <div className="return-refund-row">
                        <span>Customer confirmation</span>

                        <strong
                          style={{
                            color: confirmed
                              ? "#18743a"
                              : "#8d5a00",
                          }}
                        >
                          {confirmed
                            ? "Confirmed by Customer"
                            : item.status === "REFUNDED"
                              ? "Awaiting Confirmation"
                              : "Not Available Yet"}
                        </strong>
                      </div>

                      {confirmed && (
                        <div className="return-refund-row">
                          <span>Confirmation date</span>
                          <strong>
                            {dateText(
                              item.customerCashConfirmedAt
                            )}
                          </strong>
                        </div>
                      )}
                    </div>

                    {canConfirm && (
                      <div style={{ marginTop: 16 }}>
                        <p className="return-cash-notice">
                          Only confirm if you have actually received
                          the full cash amount shown above.
                        </p>

                        <button
                          type="button"
                          className="return-primary-button"
                          disabled={
                            String(confirmingId) ===
                            String(item.returnRequestId)
                          }
                          onClick={() =>
                            confirmCashReceived(item)
                          }
                        >
                          {String(confirmingId) ===
                          String(item.returnRequestId)
                            ? "Confirming..."
                            : "✓ Confirm Cash Received"}
                        </button>
                      </div>
                    )}

                    {confirmed && (
                      <div
                        className="return-alert return-alert-success"
                        role="status"
                        style={{
                          marginTop: 15,
                          marginBottom: 0,
                        }}
                      >
                        ✓ Cash receipt confirmed successfully.
                      </div>
                    )}

                    <div className="return-timeline">
                      <div>
                        <span>Request submitted</span>
                        <strong>
                          {dateText(item.createdAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Pickup arranged</span>
                        <strong>
                          {dateText(item.pickupScheduledAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Product collected</span>
                        <strong>
                          {dateText(item.pickedUpAt)}
                        </strong>
                      </div>
                    </div>

                    <div className="return-request-footer">
                      <span>
                        Last updated: {dateText(item.updatedAt)}
                      </span>

                      <Link to={`/orders/${item.orderId}`}>
                        View Original Order
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}