import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Orders.css";

// --------------------------------------------------
// PRICE AND DATE HELPERS
// --------------------------------------------------

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getValidDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getValidDate(value);

  if (!date) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDateKey(value) {
  const date = getValidDate(value);

  if (!date) return "date-unavailable";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// --------------------------------------------------
// ORDER HELPERS
// --------------------------------------------------

function getStatusCode(order) {
  const status = order?.status ?? order?.orderStatus;

  if (typeof status === "string") {
    return status.toUpperCase();
  }

  return String(
    status?.code ?? status?.name ?? status?.status ?? "PENDING"
  ).toUpperCase();
}

function getOrderId(order) {
  return order?.orderId ?? order?.id;
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.orderItems)) return order.orderItems;
  if (Array.isArray(order?.orderDetails)) return order.orderDetails;
  return [];
}

function getOrderTotal(order) {
  return (
    order?.totalAmount ??
    order?.grandTotal ??
    order?.totalPrice ??
    order?.total ??
    0
  );
}

function getOrderDate(order) {
  return (
    order?.createdAt ??
    order?.orderDate ??
    order?.createdDate ??
    order?.createdOn ??
    order?.date
  );
}

function getPaymentMethod(order) {
  const payment = order?.payment;

  const value =
    payment?.paymentMethod ??
    payment?.method ??
    order?.paymentMethod ??
    order?.paymentType;

  return typeof value === "string" || typeof value === "number"
    ? String(value).replaceAll("_", " ")
    : "Not available";
}

function getPaymentStatus(order) {
  const payment = order?.payment;

  const value =
    payment?.paymentStatus ??
    payment?.status?.label ??
    payment?.status?.code ??
    payment?.status ??
    order?.paymentStatus;

  return typeof value === "string" || typeof value === "number"
    ? String(value).replaceAll("_", " ").toUpperCase()
    : "";
}

// --------------------------------------------------
// RETURN AND REFUND HELPERS
// --------------------------------------------------

function normalizeStatus(value) {
  if (value && typeof value === "object") {
    value =
      value.code ??
      value.name ??
      value.status ??
      value.label ??
      "";
  }

  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getOrderReturnRequests(order) {
  const value =
    order?.returnRequests ??
    order?.returns ??
    order?.data?.returnRequests ??
    order?.data?.returns;

  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") return [value];

  if (
    order?.returnRequest &&
    typeof order.returnRequest === "object"
  ) {
    return [order.returnRequest];
  }

  return [];
}

function getReturnStatusCode(request) {
  return normalizeStatus(
    request?.returnStatus ??
      request?.status ??
      request?.requestStatus
  );
}

function getRefundStatusCode(request) {
  return normalizeStatus(
    request?.refundStatus ??
      request?.refund?.status ??
      request?.cashRefundStatus
  );
}

const RETURN_STATUS_MAP = {
  REQUESTED: {
    label: "Return Requested",
    code: "RETURN_REQUESTED",
    className: "orders-status-return-requested",
    priority: 1,
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    code: "RETURN_REQUESTED",
    className: "orders-status-return-requested",
    priority: 1,
  },
  APPROVED: {
    label: "Return Approved",
    code: "RETURN_APPROVED",
    className: "orders-status-return-approved",
    priority: 2,
  },
  RETURN_APPROVED: {
    label: "Return Approved",
    code: "RETURN_APPROVED",
    className: "orders-status-return-approved",
    priority: 2,
  },
  PICKUP_SCHEDULED: {
    label: "Return Approved",
    code: "RETURN_APPROVED",
    className: "orders-status-return-approved",
    priority: 2,
  },
  PICKED_UP: {
    label: "Returned",
    code: "RETURNED",
    className: "orders-status-returned",
    priority: 3,
  },
  PICKUP_COMPLETED: {
    label: "Returned",
    code: "RETURNED",
    className: "orders-status-returned",
    priority: 3,
  },
  PRODUCT_PICKED_UP: {
    label: "Returned",
    code: "RETURNED",
    className: "orders-status-returned",
    priority: 3,
  },
  RETURNED: {
    label: "Returned",
    code: "RETURNED",
    className: "orders-status-returned",
    priority: 3,
  },
  REFUND_PENDING: {
    label: "Refund Pending",
    code: "REFUND_PENDING",
    className: "orders-status-refund-pending",
    priority: 4,
  },
  CASH_REFUND_PENDING: {
    label: "Refund Pending",
    code: "REFUND_PENDING",
    className: "orders-status-refund-pending",
    priority: 4,
  },
  REFUNDED: {
    label: "Returned / Refunded",
    code: "REFUNDED",
    className: "orders-status-refunded",
    priority: 5,
  },
  REFUND_COMPLETED: {
    label: "Returned / Refunded",
    code: "REFUNDED",
    className: "orders-status-refunded",
    priority: 5,
  },
  COMPLETED: {
    label: "Returned / Refunded",
    code: "REFUNDED",
    className: "orders-status-refunded",
    priority: 5,
  },
  REJECTED: {
    label: "Return Rejected",
    code: "RETURN_REJECTED",
    className: "orders-status-cancelled",
    priority: 0,
  },
  RETURN_REJECTED: {
    label: "Return Rejected",
    code: "RETURN_REJECTED",
    className: "orders-status-cancelled",
    priority: 0,
  },
};

function getReturnDisplay(request) {
  const returnStatus = getReturnStatusCode(request);
  const refundStatus = getRefundStatusCode(request);

  if (
    ["REFUNDED", "REFUND_COMPLETED", "COMPLETED", "SUCCESS"].includes(
      refundStatus
    )
  ) {
    return RETURN_STATUS_MAP.REFUNDED;
  }

  if (
    ["REFUND_PENDING", "CASH_REFUND_PENDING"].includes(refundStatus) ||
    returnStatus === "REFUND_PENDING"
  ) {
    return RETURN_STATUS_MAP.REFUND_PENDING;
  }

  if (["REFUNDED", "REFUND_COMPLETED"].includes(returnStatus)) {
    return RETURN_STATUS_MAP.REFUNDED;
  }

  return RETURN_STATUS_MAP[returnStatus] ?? null;
}

function getRequestsForOrder(order, allReturnRequests = []) {
  const orderId = getOrderId(order);
  const embeddedRequests = getOrderReturnRequests(order);

  const externalRequests = allReturnRequests.filter((request) => {
    const requestOrderId =
      request?.orderId ??
      request?.order?.orderId ??
      request?.order?.id;

    return (
      orderId != null &&
      requestOrderId != null &&
      String(requestOrderId) === String(orderId)
    );
  });

  const combined = new Map();

  [...embeddedRequests, ...externalRequests].forEach(
    (request, index) => {
      const requestId =
        request?.returnRequestId ??
        request?.id ??
        `${request?.orderItemId ?? "item"}-${request?.createdAt ?? index}`;

      combined.set(String(requestId), request);
    }
  );

  return Array.from(combined.values());
}

function getOrderDisplayStatus(order, allReturnRequests = []) {
  const requests = getRequestsForOrder(order, allReturnRequests);

  if (requests.length > 0) {
    const displays = requests
      .map((request) => ({
        display: getReturnDisplay(request),
        status: getReturnStatusCode(request),
      }))
      .filter((entry) => entry.display !== null);

    const active = displays.filter(
      (entry) =>
        !["REJECTED", "RETURN_REJECTED"].includes(entry.status)
    );

    if (active.length > 0) {
      return active.reduce((latest, entry) =>
        entry.display.priority > latest.display.priority
          ? entry
          : latest
      ).display;
    }
  }

  const directDisplay = getReturnDisplay({
    returnStatus:
      order?.returnStatus ??
      order?.returnRequestStatus ??
      order?.returnRequest?.status,
    refundStatus:
      order?.refundStatus ??
      order?.cashRefundStatus ??
      order?.returnRequest?.refundStatus,
  });

  if (directDisplay) return directDisplay;

  const status = getStatusCode(order);

  const originalLabels = {
    PENDING: {
      label: "Pending",
      code: "PENDING",
      className: "orders-status-pending",
    },
    CONFIRMED: {
      label: "Confirmed",
      code: "CONFIRMED",
      className: "orders-status-confirmed",
    },
    ACCEPTED: {
      label: "Confirmed",
      code: "CONFIRMED",
      className: "orders-status-confirmed",
    },
    PROCESSING: {
      label: "Processing",
      code: "PROCESSING",
      className: "orders-status-confirmed",
    },
    SHIPPED: {
      label: "Shipped",
      code: "SHIPPED",
      className: "orders-status-shipping",
    },
    DISPATCHED: {
      label: "Shipped",
      code: "SHIPPED",
      className: "orders-status-shipping",
    },
    OUT_FOR_DELIVERY: {
      label: "Out for Delivery",
      code: "OUT_FOR_DELIVERY",
      className: "orders-status-shipping",
    },
    DELIVERED: {
      label: "Delivered",
      code: "DELIVERED",
      className: "orders-status-delivered",
    },
    COMPLETED: {
      label: "Delivered",
      code: "DELIVERED",
      className: "orders-status-delivered",
    },
    CANCELLED: {
      label: "Cancelled",
      code: "CANCELLED",
      className: "orders-status-cancelled",
    },
  };

  return (
    originalLabels[status] ?? {
      label: status.replaceAll("_", " "),
      code: status,
      className: "orders-status-pending",
    }
  );
}

// --------------------------------------------------
// PRODUCT HELPERS
// --------------------------------------------------

function getProduct(item) {
  return item?.product ?? item?.productDetails ?? item ?? {};
}

function getProductName(item) {
  const product = getProduct(item);

  return (
    product?.productName ??
    product?.name ??
    item?.productName ??
    "Chicken Product"
  );
}

function getItemQuantity(item) {
  const quantity = Number(item?.quantity ?? item?.qty ?? 1);

  return Number.isFinite(quantity) ? quantity : 1;
}

function getProductUnit(item) {
  const product = getProduct(item);

  const rawUnit =
    item?.sellingUnit ??
    item?.quantityUnit ??
    item?.unitOfMeasure ??
    item?.measurementUnit ??
    item?.unit ??
    product?.sellingUnit ??
    product?.quantityUnit ??
    product?.unitOfMeasure ??
    product?.measurementUnit ??
    product?.unit ??
    "";

  const unit = String(rawUnit).trim().toUpperCase();

  if (
    [
      "KG", "KGS", "KILOGRAM", "KILOGRAMS",
      "G", "GM", "GMS", "GRAM", "GRAMS",
    ].includes(unit)
  ) {
    return "KG";
  }

  if (["PC", "PCS", "PIECE", "PIECES"].includes(unit)) {
    return "PIECE";
  }

  const weight = String(
    item?.weight ?? product?.weight ?? ""
  ).toUpperCase();

  if (
    weight.includes("KG") ||
    weight.includes("GRAM") ||
    /\d+\s*G\b/.test(weight)
  ) {
    return "KG";
  }

  const name = getProductName(item).toLowerCase();

  if (name.includes("egg")) return "PIECE";

  if (
    name.includes("keema") ||
    name.includes("chicken") ||
    name.includes("boneless") ||
    name.includes("drumstick") ||
    name.includes("breast") ||
    name.includes("wing")
  ) {
    return "KG";
  }

  return "PIECE";
}

function formatOrderQuantity(item) {
  const quantity = getItemQuantity(item);

  if (getProductUnit(item) === "KG") {
    if (quantity > 0 && quantity < 1) {
      return `${Math.round(quantity * 1000)} gm`;
    }

    return `${Number(quantity.toFixed(3))} kg`;
  }

  return `${Number(quantity.toFixed(3))} ${
    quantity === 1 ? "pc" : "pcs"
  }`;
}

// --------------------------------------------------
// API RESPONSE AND SORTING
// --------------------------------------------------

function getOrderList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getReturnRequestList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.returnRequests)) return data.returnRequests;
  if (Array.isArray(data?.data?.returnRequests)) {
    return data.data.returnRequests;
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function sortNewestFirst(a, b) {
  const dateA = getValidDate(getOrderDate(a))?.getTime();
  const dateB = getValidDate(getOrderDate(b))?.getTime();

  if (dateA != null && dateB != null && dateA !== dateB) {
    return dateB - dateA;
  }

  if (dateA != null && dateB == null) return -1;
  if (dateA == null && dateB != null) return 1;

  const idA = Number(getOrderId(a));
  const idB = Number(getOrderId(b));

  if (Number.isFinite(idA) && Number.isFinite(idB)) {
    return idB - idA;
  }

  return 0;
}

function groupOrdersByDate(orders) {
  const groups = new Map();

  orders.forEach((order) => {
    const dateKey = getDateKey(getOrderDate(order));

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        key: dateKey,
        label:
          dateKey === "date-unavailable"
            ? "Date unavailable"
            : formatDate(getOrderDate(order)),
        orders: [],
        timestamp:
          getValidDate(getOrderDate(order))?.getTime() ?? -Infinity,
      });
    }

    groups.get(dateKey).orders.push(order);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      orders: [...group.orders].sort(sortNewestFirst),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

// --------------------------------------------------
// ORDERS COMPONENT
// --------------------------------------------------

export default function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnHistoryLoading, setReturnHistoryLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [returnHistoryError, setReturnHistoryError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const orderPlaced = Boolean(location.state?.orderPlaced);

  // --------------------------------------------------
  // LOAD CUSTOMER ORDERS
  // --------------------------------------------------

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");

      setOrders(getOrderList(response.data));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // LOAD CUSTOMER RETURNS AND REFUNDS
  // --------------------------------------------------

  const loadReturnHistory = useCallback(async () => {
    try {
      setReturnHistoryLoading(true);
      setReturnHistoryError("");

      const response = await api.get("/returns/my");

      setReturnRequests(getReturnRequestList(response.data));
    } catch (requestError) {
      setReturnHistoryError(
        requestError.response?.data?.message ||
          "Unable to load return and refund status."
      );

      console.error("Unable to load return history:", requestError);
    } finally {
      setReturnHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadReturnHistory();
  }, [loadOrders, loadReturnHistory]);

  const refreshOrdersAndReturns = useCallback(async () => {
    await Promise.all([loadOrders(), loadReturnHistory()]);
  }, [loadOrders, loadReturnHistory]);

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        const status = getStatusCode(order);
        const display = getOrderDisplayStatus(order, returnRequests);
        const paymentMethod = getPaymentMethod(order);
        const paymentStatus = getPaymentStatus(order);

        const matchesFilter =
          filter === "ALL" || display.code === filter;

        const searchableText = [
          status,
          display.label,
          display.code,
          paymentMethod,
          paymentStatus,
          formatDate(getOrderDate(order)),
          ...getOrderItems(order).map(getProductName),
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesFilter &&
          (!query || searchableText.includes(query))
        );
      })
      .sort(sortNewestFirst);
  }, [orders, filter, search, returnRequests]);

  const groupedOrders = useMemo(
    () => groupOrdersByDate(filteredOrders),
    [filteredOrders]
  );

  // --------------------------------------------------
  // FIVE LIVE SUMMARY CARDS
  // --------------------------------------------------

  const stats = useMemo(() => {
    const result = {
      total: orders.length,
      pending: 0,
      delivered: 0,
      cancelled: 0,
      returnedRefund: 0,
    };

    orders.forEach((order) => {
      const display = getOrderDisplayStatus(order, returnRequests);

      switch (display.code) {
        case "PENDING":
          result.pending += 1;
          break;

        case "DELIVERED":
          result.delivered += 1;
          break;

        case "CANCELLED":
          result.cancelled += 1;
          break;

        case "RETURN_REQUESTED":
        case "RETURN_APPROVED":
        case "RETURNED":
        case "REFUND_PENDING":
        case "REFUNDED":
          result.returnedRefund += 1;
          break;

        default:
          break;
      }
    });

    return result;
  }, [orders, returnRequests]);

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="orders-page">
      <header className="orders-header">
        <div>
          <span className="orders-eyebrow">
            YOUR FRESHNEST ACCOUNT
          </span>

          <h1>My Orders</h1>

          <p>
            View your purchases and follow your order progress.
          </p>
        </div>

        <Link to="/products" className="orders-shop-button">
          <span aria-hidden="true">＋</span> Shop Products
        </Link>
      </header>

      {orderPlaced && (
        <div className="orders-success-banner" role="status">
          <span className="orders-success-icon">✓</span>
          <div>
            <strong>Thank you! Your order was submitted.</strong>
            <p>
              Your order has been submitted. Check its status below.
            </p>
          </div>
        </div>
      )}

      {/* FIVE DISPLAY-ONLY CUSTOMER SUMMARY CARDS */}

      <section
        className="orders-stats"
        aria-label="Your order summary"
        aria-busy={loading || returnHistoryLoading}
      >
        <article className="orders-stat-card">
          <span className="orders-stat-icon orders-stat-red" aria-hidden="true">
            📦
          </span>
          <div className="orders-stat-info">
            <p>Total Orders</p>
            <strong>{loading ? "—" : stats.total}</strong>
          </div>
        </article>

        <article className="orders-stat-card">
          <span className="orders-stat-icon orders-stat-orange" aria-hidden="true">
            ⏳
          </span>
          <div className="orders-stat-info">
            <p>Pending</p>
            <strong>{loading ? "—" : stats.pending}</strong>
          </div>
        </article>

        <article className="orders-stat-card">
          <span className="orders-stat-icon orders-stat-green" aria-hidden="true">
            ✓
          </span>
          <div className="orders-stat-info">
            <p>Delivered</p>
            <strong>{loading || returnHistoryLoading ? "—" : stats.delivered}</strong>
          </div>
        </article>

        <article className="orders-stat-card">
          <span className="orders-stat-icon orders-stat-cancelled" aria-hidden="true">
            ✕
          </span>
          <div className="orders-stat-info">
            <p>Cancelled</p>
            <strong>{loading ? "—" : stats.cancelled}</strong>
          </div>
        </article>

        <article className="orders-stat-card">
          <span className="orders-stat-icon orders-stat-returned" aria-hidden="true">
            ↻
          </span>
          <div className="orders-stat-info">
            <p>Returned / Refund</p>
            <strong>{loading || returnHistoryLoading ? "—" : stats.returnedRefund}</strong>
          </div>
        </article>
      </section>

      <section className="orders-content">
        <div className="orders-content-heading">
          <div>
            <h2>Order History</h2>
            <p>Orders grouped by date, newest first.</p>
          </div>

          <button
            type="button"
            className="orders-refresh-button"
            onClick={refreshOrdersAndReturns}
            disabled={loading || returnHistoryLoading}
          >
            {loading || returnHistoryLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>

        {returnHistoryError && (
          <div className="orders-error" role="alert">
            <span>!</span>
            <p>{returnHistoryError}</p>
            <button
              type="button"
              onClick={loadReturnHistory}
              disabled={returnHistoryLoading}
            >
              Retry Return History
            </button>
          </div>
        )}

        <div className="orders-toolbar">
          <div className="orders-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by date, product, payment or status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search orders"
            />
          </div>

          <div className="orders-filters" aria-label="Filter orders">
            {[
              { label: "All Orders", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Confirmed", value: "CONFIRMED" },
              { label: "Shipped", value: "SHIPPED" },
              { label: "Delivered", value: "DELIVERED" },
              { label: "Return Requested", value: "RETURN_REQUESTED" },
              { label: "Return Approved", value: "RETURN_APPROVED" },
              { label: "Returned", value: "RETURNED" },
              { label: "Refund Pending", value: "REFUND_PENDING" },
              { label: "Returned / Refunded", value: "REFUNDED" },
              { label: "Cancelled", value: "CANCELLED" },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                className={filter === option.value ? "active" : ""}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="orders-error" role="alert">
            <span>!</span>
            <p>{error}</p>
            <button type="button" onClick={refreshOrdersAndReturns}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="orders-state">
            <span className="orders-spinner" />
            <p>Loading your order history...</p>
          </div>
        ) : !error && filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <span className="orders-empty-icon">
              {orders.length === 0 ? "📦" : "🔎"}
            </span>

            <h3>
              {orders.length === 0
                ? "You haven't placed any orders yet"
                : "No matching orders"}
            </h3>

            <p>
              {orders.length === 0
                ? "Your orders will appear here after you complete checkout."
                : "Try changing your search or selecting another status."}
            </p>

            {orders.length === 0 ? (
              <Link to="/products" className="orders-shop-button">
                Explore Products →
              </Link>
            ) : (
              <button
                type="button"
                className="orders-clear-filter"
                onClick={() => {
                  setFilter("ALL");
                  setSearch("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="orders-date-groups">
            {groupedOrders.map((group) => (
              <section className="orders-date-group" key={group.key}>
                <header className="orders-date-heading">
                  <div className="orders-date-icon">📅</div>
                  <div>
                    <h3>{group.label}</h3>
                    <p>
                      {group.orders.length}{" "}
                      {group.orders.length === 1 ? "order" : "orders"}{" "}
                      on this date
                    </p>
                  </div>
                </header>

                <div className="orders-list">
                  {group.orders.map((order, index) => {
                    const id = getOrderId(order);
                    const originalStatus = getStatusCode(order);
                    const display = getOrderDisplayStatus(
                      order,
                      returnRequests
                    );
                    const items = getOrderItems(order);
                    const paymentMethod = getPaymentMethod(order);
                    const paymentStatus = getPaymentStatus(order);
                    const orderDate = getValidDate(getOrderDate(order));

                    const hasReturnStatus =
                      display.code.startsWith("RETURN_") ||
                      ["RETURNED", "REFUND_PENDING", "REFUNDED"].includes(
                        display.code
                      );

                    return (
                      <article
                        className="orders-order-card"
                        key={id ?? `${group.key}-${index}`}
                      >
                        <div className="orders-order-top">
                          <div className="orders-order-identity">
                            <span className="orders-order-icon">📦</span>
                            <div>
                              <h3>Order Details</h3>
                              <p>
                                {orderDate
                                  ? orderDate.toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Time unavailable"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`orders-status ${display.className}`}
                            title={
                              hasReturnStatus
                                ? `Original order status: ${originalStatus.replaceAll("_", " ")}`
                                : undefined
                            }
                          >
                            <span className="orders-status-dot" />
                            {display.label}
                          </span>
                        </div>

                        {hasReturnStatus && (
                          <p className="orders-original-status">
                            Original order status:{" "}
                            {originalStatus.replaceAll("_", " ")}
                          </p>
                        )}

                        <div className="orders-order-details">
                          <div className="orders-order-detail">
                            <span>ITEMS</span>
                            <strong>
                              {items.length > 0
                                ? `${items.length} ${items.length === 1 ? "product" : "products"}`
                                : order.totalItems != null
                                  ? `${order.totalItems} products`
                                  : "Order items"}
                            </strong>
                          </div>

                          <div className="orders-order-detail">
                            <span>PAYMENT METHOD</span>
                            <strong>{paymentMethod}</strong>
                          </div>

                          <div className="orders-order-detail">
                            <span>PAYMENT STATUS</span>
                            <strong>
                              {paymentStatus ||
                                (paymentMethod.toUpperCase() === "COD"
                                  ? "Pay on delivery"
                                  : "See order details")}
                            </strong>
                          </div>

                          <div className="orders-order-detail">
                            <span>ORDER TOTAL</span>
                            <strong className="orders-order-total">
                              {formatPrice(getOrderTotal(order))}
                            </strong>
                          </div>
                        </div>

                        {items.length > 0 && (
                          <div className="orders-item-preview">
                            {items.slice(0, 3).map((item, itemIndex) => {
                              const name = getProductName(item);

                              return (
                                <span
                                  className="orders-item-chip"
                                  key={
                                    item.id ??
                                    item.productId ??
                                    `${name}-${itemIndex}`
                                  }
                                >
                                  {name} × {formatOrderQuantity(item)}
                                </span>
                              );
                            })}

                            {items.length > 3 && (
                              <span className="orders-more-items">
                                +{items.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="orders-order-footer">
                          <span>
                            {display.code === "DELIVERED"
                              ? "We hope you enjoyed your order!"
                              : display.code === "RETURN_REQUESTED"
                                ? "Your return request has been submitted."
                                : display.code === "RETURN_APPROVED"
                                  ? "Your return has been approved."
                                  : display.code === "RETURNED"
                                    ? "The returned product has been picked up."
                                    : display.code === "REFUND_PENDING"
                                      ? "Your cash refund is being processed."
                                      : display.code === "REFUNDED"
                                        ? "Your refund has been completed."
                                        : originalStatus === "CANCELLED"
                                          ? "This order has been cancelled."
                                          : "View your order for more information."}
                          </span>

                          <Link
                            to={`/orders/${encodeURIComponent(id)}`}
                            className="orders-details-button"
                          >
                            View Details <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="orders-bottom-help">
        <span>💬</span>
        <div>
          <strong>Need help with an order?</strong>
          <p>
            Open your order details to review its current information.
          </p>
        </div>
      </section>
    </main>
  );
}