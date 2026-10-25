import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../../services/api";
import AdminReturns from "./AdminReturns";
import "../../styles/AdminOrders.css";

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const TIME_ZONE = "Asia/Kolkata";

/* ========================================
   FORMAT HELPERS
======================================== */

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getOrderId = (order) => order?.orderId ?? order?.id;

const getStatusCode = (status) => {
  if (status && typeof status === "object") {
    return String(status.code ?? status.name ?? "PENDING")
      .toUpperCase();
  }

  return String(status || "PENDING").toUpperCase();
};

const formatStatus = (status) =>
  String(getStatusCode(status))
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ========================================
   INDIA STANDARD TIME HELPERS
======================================== */

const getDateKeyInIST = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const getTodayISTDateKey = () => getDateKeyInIST(new Date());

const isOrderCreatedToday = (order, todayKey) =>
  Boolean(todayKey) &&
  getDateKeyInIST(order?.createdAt) === todayKey;

const getTimestamp = (order) => {
  const timestamp = new Date(order?.createdAt || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getAvailableStatuses = (status) =>
  STATUS_TRANSITIONS[getStatusCode(status)] || [];

/* ========================================
   ADDRESS AND ITEM HELPERS
======================================== */

const getFullAddress = (address) => {
  if (!address) return "Address not available";

  if (typeof address === "string") {
    return address.trim() || "Address not available";
  }

  return [
    address.addressLine ?? address.address ?? address.street,
    address.city,
    address.state,
    address.pincode ?? address.pinCode ?? address.postalCode,
  ].filter(Boolean).join(", ") || "Address not available";
};

const getItemSubtotal = (item) => {
  if (item.subtotal != null) return item.subtotal;
  if (item.totalPrice != null) return item.totalPrice;

  return (
    Number(item.price ?? item.unitPrice ?? item.product?.price ?? 0) *
    Number(item.quantity ?? item.qty ?? 1)
  );
};

const getOrderItemQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? 1);

const getOrderItemUnit = (item) => {
  const rawUnit = String(
    item?.sellingUnit ??
      item?.quantityUnit ??
      item?.unitOfMeasure ??
      item?.unit ??
      item?.product?.sellingUnit ??
      item?.product?.quantityUnit ??
      item?.product?.unit ??
      ""
  ).trim().toUpperCase();

  if (["PC", "PCS", "PIECE", "PIECES"].includes(rawUnit)) {
    return "PIECE";
  }

  if (
    [
      "KG", "KGS", "KILOGRAM", "KILOGRAMS",
      "G", "GM", "GMS", "GRAM", "GRAMS",
    ].includes(rawUnit)
  ) {
    return "KG";
  }

  const name = String(
    item?.productName ??
      item?.product?.productName ??
      item?.product?.name ??
      item?.name ??
      ""
  ).toLowerCase();

  if (name.includes("egg")) return "PIECE";

  if (
    [
      "chicken", "keema", "boneless",
      "drumstick", "breast", "wing",
    ].some((word) => name.includes(word))
  ) {
    return "KG";
  }

  return "PIECE";
};

const formatOrderItemQuantity = (item) => {
  const quantity = getOrderItemQuantity(item);
  const unit = getOrderItemUnit(item);

  const formatted = (value) =>
    Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    });

  if (unit === "KG") {
    if (quantity > 0 && quantity < 1) {
      return `${formatted(quantity * 1000)} gm`;
    }

    return `${formatted(quantity)} kg`;
  }

  return `${formatted(quantity)} ${quantity === 1 ? "pc" : "pcs"}`;
};

/* ========================================
   RETURN STATUS HELPERS

   REQUESTED          -> Return Requested
   APPROVED           -> Return Approved
   PICKUP_SCHEDULED   -> Return Approved
   PICKED_UP          -> Returned
   REFUND_PENDING     -> Refund Pending
   REFUNDED           -> Returned / Refunded
   REJECTED           -> Original order status

   Rejected requests never override an active return.
======================================== */

const getRequests = (data) => {
  const result =
    data?.returnRequests ??
    data?.data?.returnRequests ??
    data?.returns ??
    data?.data?.returns ??
    data?.data ??
    data;

  return Array.isArray(result) ? result : [];
};

const normalizeReturnStatus = (request) =>
  String(request?.status ?? "")
    .trim()
    .toUpperCase();

const RETURN_STATUS_DISPLAY = {
  REQUESTED: {
    label: "Return Requested",
    className: "requested",
    priority: 1,
  },
  APPROVED: {
    label: "Return Approved",
    className: "approved",
    priority: 2,
  },
  PICKUP_SCHEDULED: {
    label: "Return Approved",
    className: "approved",
    priority: 2,
  },
  PICKED_UP: {
    label: "Returned",
    className: "returned",
    priority: 4,
  },
  REFUND_PENDING: {
    label: "Refund Pending",
    className: "refund-pending",
    priority: 3,
  },
  REFUNDED: {
    label: "Returned / Refunded",
    className: "returned",
    priority: 5,
  },
};

/*
 * Returns null if every request was rejected or no requests exist.
 * The caller then displays the original order status.
 *
 * When multiple requests exist, an active/non-rejected return
 * takes precedence over rejected requests.
 */
const getReturnBadge = (requests) => {
  if (!Array.isArray(requests) || requests.length === 0) {
    return null;
  }

  const recognizedRequests = requests
    .map((request) => {
      const status = normalizeReturnStatus(request);

      return {
        status,
        display: RETURN_STATUS_DISPLAY[status],
      };
    })
    .filter((request) => request.display);

  if (recognizedRequests.length === 0) {
    return null;
  }

  const nonRejectedRequests = recognizedRequests.filter(
    (request) => request.status !== "REJECTED"
  );

  // Rejected requests must not override another active return.
  if (nonRejectedRequests.length === 0) {
    return null;
  }

  // Display the most advanced recognized return status.
  const selected = nonRejectedRequests.reduce(
    (current, request) =>
      !current ||
      request.display.priority > current.display.priority
        ? request
        : current,
    null
  );

  return selected
    ? {
        label: selected.display.label,
        className: selected.display.className,
        status: selected.status,
      }
    : null;
};

const getOrderDisplayBadge = (order, requests) => {
  const returnBadge = getReturnBadge(requests);

  if (returnBadge) return returnBadge;

  return {
    label: formatStatus(order?.status),
    className: getStatusCode(order?.status).toLowerCase(),
    isOriginalStatus: true,
  };
};

/* ========================================
   MAIN COMPONENT
======================================== */

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [returnsLoading, setReturnsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDisplayNumber, setSelectedDisplayNumber] =
    useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const [returnModalOrder, setReturnModalOrder] = useState(null);

  /* ========================================
     LOAD ORDERS
  ======================================== */

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/orders");
      const data = response.data;
      const result = data?.orders ?? data?.data?.orders ?? [];

      const sortedOrders = Array.isArray(result)
        ? [...result].sort((a, b) => {
            const difference = getTimestamp(a) - getTimestamp(b);

            if (difference !== 0) return difference;

            return String(getOrderId(a) ?? "").localeCompare(
              String(getOrderId(b) ?? ""),
              undefined,
              { numeric: true }
            );
          })
        : [];

      setOrders(sortedOrders);
    } catch (err) {
      console.error("Load admin orders error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to load orders. Check your admin access."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================
     LOAD RETURN REQUESTS
  ======================================== */

  const loadReturnRequests = useCallback(async (quiet = false) => {
    if (!quiet) setReturnsLoading(true);

    try {
      const response = await api.get("/admin/returns");
      setReturnRequests(getRequests(response.data));
    } catch (err) {
      console.error("Load return requests error:", err);

      if (!quiet) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load return requests."
        );
      }
    } finally {
      if (!quiet) setReturnsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadOrders(),
      loadReturnRequests(true),
    ]);
  }, [loadOrders, loadReturnRequests]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ========================================
     TODAY'S ORDERS — IST
  ======================================== */

  const todayKey = getTodayISTDateKey();

  const todayOrders = useMemo(
    () =>
      orders.filter((order) =>
        isOrderCreatedToday(order, todayKey)
      ),
    [orders, todayKey]
  );

  const displayNumberById = useMemo(() => {
    const numbers = new Map();

    todayOrders.forEach((order, index) => {
      numbers.set(String(getOrderId(order)), index + 1);
    });

    return numbers;
  }, [todayOrders]);

  const getDisplayNumber = (order) =>
    displayNumberById.get(String(getOrderId(order))) ?? "—";

  const getOrderReturnRequests = useCallback(
    (order) =>
      returnRequests.filter(
        (request) =>
          String(request.orderId ?? request.order?.id ?? request.order?.orderId) ===
          String(getOrderId(order))
      ),
    [returnRequests]
  );

  /* ========================================
     SUMMARY COUNTS
  ======================================== */

  const summary = useMemo(() => {
  const returnedOrderIds = new Set();

  todayOrders.forEach((order) => {
    const id = String(getOrderId(order));

    const requests = returnRequests.filter(
      (request) =>
        String(
          request.orderId ??
            request.order?.id ??
            request.order?.orderId
        ) === id
    );

    const badge = getReturnBadge(requests);

    // Count the order as returned only after pickup has occurred
    // or the refund has entered/completed its final stages.
    if (
      badge &&
      ["returned", "refund-pending"].includes(badge.className)
    ) {
      returnedOrderIds.add(id);
    }
  });

  return {
    all: todayOrders.length,

    pending: todayOrders.filter(
      (order) => getStatusCode(order.status) === "PENDING"
    ).length,

    delivered: todayOrders.filter((order) => {
      const id = String(getOrderId(order));

      return (
        getStatusCode(order.status) === "DELIVERED" &&
        !returnedOrderIds.has(id)
      );
    }).length,

    cancelled: todayOrders.filter(
      (order) => getStatusCode(order.status) === "CANCELLED"
    ).length,

    returned: returnedOrderIds.size,
  };
}, [todayOrders, returnRequests]);

  /* ========================================
     CUSTOMER REVIEW
  ======================================== */

  const loadReviewForOrder = async (orderId) => {
    try {
      const { data } = await api.get("/admin/reviews");

      const reviews = Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(data?.data?.reviews)
          ? data.data.reviews
          : [];

      const review = reviews.find(
        (item) =>
          String(
            item.orderId ??
              item.order?.orderId ??
              item.order?.id
          ) === String(orderId)
      );

      setSelectedReview(review || null);
    } catch (err) {
      console.error("Unable to load admin reviews:", err);
      setSelectedReview(null);
    }
  };

  /* ========================================
     VIEW ORDER DETAILS
  ======================================== */

  const viewDetails = async (order) => {
    const id = getOrderId(order);

    setError("");
    setSelectedReview(null);
    setSelectedDisplayNumber(getDisplayNumber(order));
    setSelectedOrder(null);
    setDetailLoading(true);

    try {
      const response = await api.get(`/admin/orders/${id}`);
      const data = response.data;

      const detail =
        data?.order ??
        data?.data?.order ??
        data?.data ??
        data;

      if (!detail || typeof detail !== "object") {
        throw new Error("Order details were not returned.");
      }

      setSelectedOrder(detail);
      await loadReviewForOrder(getOrderId(detail));
    } catch (err) {
      console.error("Load order details error:", err);

      setSelectedDisplayNumber(null);
      setSelectedOrder(null);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to load order details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    if (detailLoading) return;

    setSelectedOrder(null);
    setSelectedDisplayNumber(null);
    setSelectedReview(null);
  };

  /* ========================================
     UPDATE ORIGINAL ORDER STATUS
  ======================================== */

  const updateStatus = async (order, newStatus) => {
    const id = getOrderId(order);
    const currentStatus = getStatusCode(order.status);
    const allowedStatuses = getAvailableStatuses(currentStatus);

    if (!newStatus || newStatus === currentStatus) return;

    if (!allowedStatuses.includes(newStatus)) {
      setError(
        `Cannot change status from ${formatStatus(currentStatus)} to ${formatStatus(newStatus)}.`
      );
      return;
    }

    const displayNumber = getDisplayNumber(order);

    if (
      !window.confirm(
        `Change Order ${displayNumber} from ${formatStatus(currentStatus)} to ${formatStatus(newStatus)}?`
      )
    ) {
      return;
    }

    setUpdatingId(String(id));
    setError("");
    setSuccess("");

    try {
      await api.put(`/admin/orders/${id}/status`, null, {
        params: { status: newStatus },
      });

      setSuccess(
        `Order ${displayNumber} status changed to ${formatStatus(newStatus)} successfully.`
      );

      await loadOrders();

      if (
        selectedOrder &&
        String(getOrderId(selectedOrder)) === String(id)
      ) {
        try {
          const response = await api.get(`/admin/orders/${id}`);
          const data = response.data;

          const refreshedOrder =
            data?.order ??
            data?.data?.order ??
            data?.data ??
            data;

          if (refreshedOrder) setSelectedOrder(refreshedOrder);

          await loadReviewForOrder(id);
        } catch (refreshError) {
          console.error("Refresh order details error:", refreshError);
        }
      }
    } catch (err) {
      console.error("Update order status error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ========================================
     SEARCH AND FILTER
  ======================================== */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return todayOrders.filter((order) => {
      const id = getOrderId(order);
      const status = getStatusCode(order.status);
      const displayNumber =
        displayNumberById.get(String(id)) ?? "—";

      const requests = returnRequests.filter(
        (request) =>
          String(request.orderId ?? request.order?.id ?? request.order?.orderId) ===
          String(id)
      );

      const returnBadge = getReturnBadge(requests);
      const displayBadge = getOrderDisplayBadge(order, requests);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter ||
        (statusFilter === "RETURN" && Boolean(returnBadge)) ||
        displayBadge.label.toUpperCase().replaceAll(" ", "_") ===
          statusFilter;

      const searchableText = [
        displayNumber,
        `order ${displayNumber}`,
        id,
        order.customerName,
        order.customerEmail,
        order.deliveryPhone,
        order.deliveryAddress?.phone,
        displayBadge.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [
    todayOrders,
    search,
    statusFilter,
    displayNumberById,
    returnRequests,
  ]);

  /* ========================================
     SELECTED ORDER DATA
  ======================================== */

  const selectedItems = Array.isArray(selectedOrder?.items)
    ? selectedOrder.items
    : [];

  const address = selectedOrder?.deliveryAddress;
  const payment = selectedOrder?.payment;

  const selectedOrderRequests = selectedOrder
    ? getOrderReturnRequests(selectedOrder)
    : [];

  const selectedReturnBadge = selectedOrder
    ? getReturnBadge(selectedOrderRequests)
    : null;

  return (
    <main className="admin-orders-page">
      <div className="ao-container">
        <header className="ao-header">
          <div>
            <span className="ao-eyebrow">ORDER OPERATIONS</span>
            <h1>Today's Orders</h1>
            <p>
              Manage today's orders, delivery progress, returns and
              refunds from one place.
            </p>
            <small className="ao-number-note">
              Date:{" "}
              {new Date().toLocaleDateString("en-IN", {
                timeZone: TIME_ZONE,
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              (IST)
            </small>
          </div>

          <button
            className="ao-refresh-button"
            onClick={refreshAll}
            type="button"
            disabled={loading || returnsLoading}
          >
            {loading || returnsLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </header>

        {error && (
          <div className="ao-alert ao-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="ao-alert ao-alert-success" role="status">
            {success}
          </div>
        )}

        <section className="ao-summary-grid">
          <article className="ao-summary-card all">
            <span className="ao-summary-icon">🛍️</span>
            <div>
              <p>Today's Orders</p>
              <strong>{summary.all}</strong>
            </div>
          </article>

          <article className="ao-summary-card pending">
            <span className="ao-summary-icon">⏳</span>
            <div>
              <p>Pending</p>
              <strong>{summary.pending}</strong>
            </div>
          </article>

          <article className="ao-summary-card delivered">
            <span className="ao-summary-icon">✓</span>
            <div>
              <p>Delivered</p>
              <strong>{summary.delivered}</strong>
            </div>
          </article>

          <article className="ao-summary-card cancelled">
            <span className="ao-summary-icon">✕</span>
            <div>
              <p>Cancelled</p>
              <strong>{summary.cancelled}</strong>
            </div>
          </article>

          <article className="ao-summary-card returned">
            <span className="ao-summary-icon">↩</span>
            <div>
              <p>Returned / Refund</p>
              <strong>{summary.returned}</strong>
            </div>
          </article>
        </section>

        <section className="ao-list-card">
          <div className="ao-list-heading">
            <div>
              <h2>Today's Orders</h2>
              <p>
                {filteredOrders.length} of {todayOrders.length} order(s)
                displayed
              </p>
              <small className="ao-number-note">
                Only orders created today in Indian Standard Time are
                shown. Display numbers start from 1 each day.
              </small>
            </div>

            <div className="ao-filters">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search today's orders..."
                aria-label="Search today's orders or customers"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter today's orders by status"
              >
                <option value="ALL">All statuses</option>

                {Object.keys(STATUS_TRANSITIONS).map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}

                <option value="RETURN">All returns</option>
                <option value="RETURN_REQUESTED">Return Requested</option>
                <option value="RETURN_APPROVED">Return Approved</option>
                <option value="RETURNED">Returned</option>
                <option value="REFUND_PENDING">Refund Pending</option>
                <option value="RETURNED_/_REFUNDED">
                  Returned / Refunded
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ao-empty">Loading today's orders...</div>
          ) : todayOrders.length === 0 ? (
            <div className="ao-empty">
              <span>📦</span>
              <h3>No orders placed today</h3>
              <p>New customer orders will appear here when they are placed.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="ao-empty">
              <span>🔎</span>
              <h3>No matching orders</h3>
              <p>Try another search term or status filter.</p>
            </div>
          ) : (
            <div className="ao-table-wrapper">
              <table className="ao-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed At</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Details / Return</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const id = getOrderId(order);
                    const displayNumber = getDisplayNumber(order);
                    const status = getStatusCode(order.status);
                    const availableStatuses = getAvailableStatuses(status);
                    const isUpdating = updatingId === String(id);

                    const requests = getOrderReturnRequests(order);
                    const returnBadge = getReturnBadge(requests);
                    const displayBadge = getOrderDisplayBadge(order, requests);

                    return (
                      <tr key={String(id)}>
                        <td>
                          <strong>Order {displayNumber}</strong>
                        </td>

                        <td>
                          <strong>{order.customerName || "Customer"}</strong>
                          <small>{order.customerEmail || ""}</small>
                        </td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td>
                          {order.totalItems ?? order.items?.length ?? 0}
                        </td>

                        <td className="ao-total">
                          {money(order.totalAmount)}
                        </td>

                        <td>
                          <span
                            className={`ao-status ao-status-${displayBadge.className}`}
                          >
                            {displayBadge.label}
                          </span>

                          {returnBadge && (
                            <small className="ao-original-status">
                              Original: {formatStatus(status)}
                            </small>
                          )}
                        </td>

                        <td>
                          {availableStatuses.length > 0 ? (
                            <select
                              className="ao-status-select"
                              value=""
                              disabled={updatingId !== null}
                              onChange={(event) => {
                                const nextStatus = event.target.value;
                                if (nextStatus) updateStatus(order, nextStatus);
                              }}
                              aria-label={`Update status for Order ${displayNumber}`}
                            >
                              <option value="" disabled>
                                {isUpdating ? "Updating..." : "Change Status"}
                              </option>

                              {availableStatuses.map((option) => (
                                <option key={option} value={option}>
                                  {formatStatus(option)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="ao-status-locked">
                              {status === "DELIVERED"
                                ? "✓ Completed"
                                : status === "CANCELLED"
                                  ? "✕ Cancelled"
                                  : "No changes"}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="ao-row-actions">
                            <button
                              className="ao-details-button"
                              onClick={() => viewDetails(order)}
                              type="button"
                            >
                              View Details
                            </button>

                            {requests.length > 0 && (
                              <button
                                className="ao-return-button"
                                onClick={() => setReturnModalOrder(order)}
                                type="button"
                              >
                                Return ({requests.length})
                              </button>
                            )}
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

      {/* RETURN / REFUND MODAL */}

      {returnModalOrder && (
        <div
          className="ao-modal-backdrop"
          onClick={() => setReturnModalOrder(null)}
          role="presentation"
        >
          <section
            className="ao-modal ao-return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ao-return-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="ao-modal-header">
              <div>
                <span className="ao-eyebrow">RETURN &amp; REFUND MANAGEMENT</span>
                <h2 id="ao-return-modal-title">
                  Order {getDisplayNumber(returnModalOrder)}
                </h2>
                <p>
                  {returnModalOrder.customerName || "Customer"} ·{" "}
                  {returnModalOrder.customerEmail || ""}
                </p>
              </div>

              <button
                type="button"
                className="ao-modal-close"
                onClick={() => setReturnModalOrder(null)}
                aria-label="Close return details"
              >
                ✕
              </button>
            </header>

            <div className="ao-modal-body">
              <AdminReturns
                embedded
                orderId={getOrderId(returnModalOrder)}
                onChanged={refreshAll}
              />
            </div>
          </section>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}

      {(detailLoading || selectedOrder) && (
        <div
          className="ao-modal-backdrop"
          onClick={closeDetails}
          role="presentation"
        >
          <section
            className="ao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ao-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="ao-modal-header">
              <div>
                <span className="ao-eyebrow">ORDER INFORMATION</span>
                <h2 id="ao-modal-title">Order {selectedDisplayNumber}</h2>
                {!detailLoading && selectedOrder && (
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                )}
              </div>

              <button
                type="button"
                className="ao-modal-close"
                onClick={closeDetails}
                aria-label="Close order details"
                disabled={detailLoading}
              >
                ✕
              </button>
            </header>

            {detailLoading ? (
              <div className="ao-modal-loading">
                <span className="ao-spinner" />
                <p>Loading order details...</p>
              </div>
            ) : selectedOrder ? (
              <div className="ao-modal-body">
                <section className="ao-modal-section">
                  <h3>👤 Customer Information</h3>
                  <div className="ao-info-card">
                    <p>
                      <strong>Name:</strong> {selectedOrder.customerName || "—"}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customerEmail || "—"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {address?.phone ?? selectedOrder.deliveryPhone ?? "—"}
                    </p>
                  </div>
                </section>

                <section className="ao-modal-section">
                  <h3>📍 Delivery Address</h3>
                  <div className="ao-info-card">
                    <p>
                      <strong>
                        {address?.fullName ??
                          address?.name ??
                          selectedOrder.deliveryFullName ??
                          selectedOrder.customerName ??
                          "—"}
                      </strong>
                    </p>
                    <p>{getFullAddress(address)}</p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {address?.phone ?? selectedOrder.deliveryPhone ?? "—"}
                    </p>
                  </div>
                </section>

                <section className="ao-modal-section">
                  <h3>🍗 Ordered Products</h3>

                  {selectedItems.length === 0 ? (
                    <div className="ao-info-card">
                      No item details were returned.
                    </div>
                  ) : (
                    <div className="ao-modal-items">
                      {selectedItems.map((item, index) => (
                        <article
                          className="ao-modal-item"
                          key={
                            item.id ??
                            item.orderItemId ??
                            item.productId ??
                            index
                          }
                        >
                          <div>
                            <strong>
                              {item.productName ??
                                item.product?.productName ??
                                item.product?.name ??
                                item.name ??
                                "Product"}
                            </strong>

                            <p>
                              Quantity: {formatOrderItemQuantity(item)}
                            </p>

                            <small>
                              Unit price:{" "}
                              {money(
                                item.price ??
                                  item.unitPrice ??
                                  item.product?.price
                              )}
                            </small>
                          </div>

                          <strong className="ao-item-subtotal">
                            {money(getItemSubtotal(item))}
                          </strong>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="ao-modal-section">
                  <h3>💳 Payment Information</h3>
                  <div className="ao-info-card">
                    <p>
                      <strong>Method:</strong>{" "}
                      {payment?.paymentMethod ??
                        selectedOrder.paymentMethod ??
                        "Not available"}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      {payment?.paymentStatus ??
                        selectedOrder.paymentStatus ??
                        "Not available"}
                    </p>
                    <p>
                      <strong>Payment Amount:</strong>{" "}
                      {money(payment?.amount ?? selectedOrder.totalAmount)}
                    </p>
                  </div>
                </section>

                <section className="ao-modal-section">
                  <h3>⭐ Customer Review</h3>
                  <div className="ao-info-card ao-admin-review">
                    {selectedReview ? (
                      <>
                        <p>
                          <strong>Customer:</strong>{" "}
                          {selectedReview.customerName ??
                            selectedReview.customer?.name ??
                            selectedReview.customer?.fullName ??
                            selectedOrder.customerName ??
                            "—"}
                        </p>

                        <p>
                          <strong>Rating:</strong>{" "}
                          <span className="ao-review-stars">
                            {"★".repeat(
                              Math.max(
                                0,
                                Math.min(5, Number(selectedReview.rating) || 0)
                              )
                            )}
                            {"☆".repeat(
                              5 -
                                Math.max(
                                  0,
                                  Math.min(5, Number(selectedReview.rating) || 0)
                                )
                            )}
                          </span>{" "}
                          ({Number(selectedReview.rating) || 0}/5)
                        </p>

                        <p>
                          <strong>Review:</strong>{" "}
                          {selectedReview.comment?.trim() ||
                            "No written comment provided."}
                        </p>

                        <p>
                          <strong>Submitted:</strong>{" "}
                          {selectedReview.createdAt
                            ? formatDate(selectedReview.createdAt)
                            : "Date unavailable"}
                        </p>
                      </>
                    ) : (
                      <p className="ao-no-review">
                        No customer review has been submitted for this order yet.
                      </p>
                    )}
                  </div>
                </section>

                {/* Original order status remains separate from return status */}

                <section className="ao-modal-section">
                  <h3>📦 Current Order Status</h3>

                  <div className="ao-current-status">
                    <span
                      className={`ao-status ao-status-${getStatusCode(
                        selectedOrder.status
                      ).toLowerCase()}`}
                    >
                      {formatStatus(selectedOrder.status)}
                    </span>
                  </div>

                  <p className="ao-status-help">
                    This is the original order status. Return and refund
                    progress is displayed separately below and does not
                    overwrite the delivery history.
                  </p>
                </section>

                {selectedReturnBadge && (
                  <section className="ao-modal-section">
                    <h3>↩ Return / Refund Status</h3>

                    <div className="ao-current-status ao-return-current-status">
                      <span
                        className={`ao-status ao-status-${selectedReturnBadge.className}`}
                      >
                        {selectedReturnBadge.label}
                      </span>
                    </div>
                  </section>
                )}

                <div className="ao-modal-total">
                  <span>Order Total</span>
                  <strong>{money(selectedOrder.totalAmount)}</strong>
                </div>

                <footer className="ao-modal-footer">
                  <button
                    type="button"
                    className="ao-modal-done"
                    onClick={closeDetails}
                  >
                    Close Details
                  </button>
                </footer>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}