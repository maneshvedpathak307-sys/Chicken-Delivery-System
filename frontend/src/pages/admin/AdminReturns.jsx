import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/AdminReturns.css";

const STATUS_INFO = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  REFUND_PENDING: "Cash Refund Pending",
  REFUNDED: "Cash Refund Handed Over",
};

const NEXT_STATUS = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKUP_SCHEDULED"],
  PICKUP_SCHEDULED: ["PICKED_UP"],
  PICKED_UP: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REJECTED: [],
  REFUNDED: [],
};

const getRequests = (data) => {
  const result =
    data?.returnRequests ??
    data?.data?.returnRequests ??
    data?.returns ??
    data?.data?.returns ??
    [];

  return Array.isArray(result) ? result : [];
};

const money = (value) =>
  value == null
    ? "Not available"
    : `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

// --------------------------------------------------
// RETURN QUANTITY FORMATTING
// --------------------------------------------------

const formatReturnQuantity = (quantity, weight, productName) => {
  if (
    quantity == null ||
    !Number.isFinite(Number(quantity))
  ) {
    return "—";
  }

  const value = Number(quantity);
  const unitText = String(weight || "").trim().toUpperCase();
  const name = String(productName || "").toLowerCase();

  const isEgg = name.includes("egg");

  const isKilogram =
    /\bKG\b|\bKGS\b|KILOGRAM/.test(unitText);

  const isGram =
    /\bGM\b|\bGMS\b|\bGRAMS?\b/.test(unitText) ||
    /^G$/.test(unitText);

  const isPiece =
    /\bPC\b|\bPCS\b|\bPIECES?\b/.test(unitText);

  const isChickenByWeight =
    name.includes("chicken") ||
    name.includes("keema") ||
    name.includes("boneless") ||
    name.includes("drumstick") ||
    name.includes("breast") ||
    name.includes("wing");

  // Eggs must always be displayed in pieces.
  // This check must come before the kilogram check.
  if (isEgg) {
    return `${Number(value.toFixed(3)).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    })} pcs`;
  }

  // Products measured in kilograms.
  if (isKilogram || isChickenByWeight) {
    if (value > 0 && value < 1) {
      return `${Number((value * 1000).toFixed(3))} gm`;
    }

    return `${Number(value.toFixed(3))} kg`;
  }

  // Products measured in grams.
  if (isGram) {
    return `${Number(value.toFixed(3))} gm`;
  }

  // Other products measured in pieces.
  if (isPiece) {
    return `${Number(value.toFixed(3)).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    })} pcs`;
  }

  // Fallback when the unit cannot be identified.
  return Number(value.toFixed(3)).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  });
};

// --------------------------------------------------
// ADMIN RETURNS COMPONENT
// --------------------------------------------------

export default function AdminReturns({
  embedded = false,
  orderId = null,
  onChanged,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notes, setNotes] = useState({});

  // --------------------------------------------------
  // LOAD RETURN REQUESTS
  // --------------------------------------------------

  const loadRequests = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);

    setError("");

    try {
      const response = await api.get("/admin/returns");
      setRequests(getRequests(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load return requests. Check your admin access."
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // --------------------------------------------------
  // UPDATE RETURN STATUS
  // --------------------------------------------------

  const updateStatus = async (request, nextStatus) => {
    const id = request.returnRequestId ?? request.id;

    if (!NEXT_STATUS[request.status]?.includes(nextStatus)) {
      setError("This status change is not allowed.");
      return;
    }

    if (
      nextStatus === "REJECTED" &&
      !notes[id]?.trim()
    ) {
      setError("Please enter a reason before rejecting the return.");
      return;
    }

    const confirmationMessages = {
      APPROVED:
        `Approve the return for ${request.productName || "this product"}? ` +
        `The calculated cash refund is ${money(request.refundAmount)}.`,
      REJECTED: "Reject this product return request?",
      PICKUP_SCHEDULED: "Confirm that pickup has been arranged?",
      PICKED_UP:
        "Confirm that the returned product has been collected?",
      REFUND_PENDING:
        "Confirm collection is complete and the cash refund is pending?",
      REFUNDED:
        `Confirm that ${money(request.refundAmount)} has actually been ` +
        "handed to the customer in cash?",
    };

    if (
      !window.confirm(
        confirmationMessages[nextStatus] ||
          `Update return status to ${STATUS_INFO[nextStatus]}?`
      )
    ) {
      return;
    }

    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await api.put(
        `/admin/returns/${id}/status`,
        {
          status: nextStatus,
          adminNote: notes[id]?.trim() || "",
          refundReference:
            nextStatus === "REFUNDED"
              ? notes[id]?.trim() || "Cash refund handed over"
              : undefined,
        }
      );

      const updatedRequest =
        response.data?.returnRequest ??
        response.data?.data?.returnRequest;

      if (updatedRequest) {
        setRequests((current) =>
          current.map((item) =>
            String(item.returnRequestId ?? item.id) ===
            String(id)
              ? updatedRequest
              : item
          )
        );
      } else {
        await loadRequests(true);
      }

      setSuccess(
        response.data?.message ||
          `Return status updated to ${STATUS_INFO[nextStatus]}.`
      );

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update the return request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // --------------------------------------------------
  // FILTER RETURN REQUESTS
  // --------------------------------------------------

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesOrder =
        orderId == null ||
        String(request.orderId) === String(orderId);

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      const searchable = [
        request.productName,
        request.customerName,
        request.customerEmail,
        request.reason,
        request.adminNote,
        request.orderId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesOrder &&
        matchesStatus &&
        searchable.includes(query)
      );
    });
  }, [requests, orderId, statusFilter, search]);

  const scopedRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          orderId == null ||
          String(request.orderId) === String(orderId)
      ),
    [requests, orderId]
  );

  const confirmedCount = scopedRequests.filter(
    (request) =>
      request.status === "REFUNDED" &&
      request.customerCashConfirmed === true
  ).length;

  const awaitingConfirmationCount = scopedRequests.filter(
    (request) =>
      request.status === "REFUNDED" &&
      request.customerCashConfirmed !== true
  ).length;

  const countByStatus = (status) =>
    scopedRequests.filter(
      (request) => request.status === status
    ).length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main
      className={
        embedded
          ? "admin-returns-page admin-returns-embedded"
          : "admin-returns-page"
      }
    >
      <div className="ar-container">
        <header className="ar-header">
          <div>
            <span className="ar-eyebrow">
              CUSTOMER CARE OPERATIONS
            </span>

            <h1>
              {orderId == null
                ? "Manage Returns & Refunds"
                : `Returns for Order ${orderId}`}
            </h1>

            <p>
              Review product returns, arrange pickup and track cash
              refunds.
            </p>
          </div>

          <div className="ar-header-actions">
            {!embedded && (
              <Link
                to="/admin/orders"
                className="ar-secondary-button"
              >
                ← Manage Orders
              </Link>
            )}

            <button
              type="button"
              className="ar-secondary-button"
              onClick={() => loadRequests()}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="ar-alert ar-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="ar-alert ar-alert-success"
            role="status"
          >
            {success}
          </div>
        )}

        <section className="ar-summary-grid">
          <article>
            <span>📥</span>
            <div>
              <p>Total Requests</p>
              <strong>{scopedRequests.length}</strong>
            </div>
          </article>

          <article>
            <span>⏳</span>
            <div>
              <p>Awaiting Review</p>
              <strong>{countByStatus("REQUESTED")}</strong>
            </div>
          </article>

          <article>
            <span>🚚</span>
            <div>
              <p>Pickup / Refund Pending</p>
              <strong>
                {countByStatus("PICKUP_SCHEDULED") +
                  countByStatus("PICKED_UP") +
                  countByStatus("REFUND_PENDING")}
              </strong>
            </div>
          </article>

          <article>
            <span>✓</span>
            <div>
              <p>Customer Confirmed</p>
              <strong>{confirmedCount}</strong>
            </div>
          </article>
        </section>

        <section className="ar-list-card">
          <div className="ar-list-heading">
            <div>
              <h2>Product Return Requests</h2>

              <p>
                {filteredRequests.length} request(s) displayed
              </p>

              <p>
                Awaiting customer cash confirmation:{" "}
                <strong>{awaitingConfirmationCount}</strong>
              </p>
            </div>

            <div className="ar-filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product or customer..."
                aria-label="Search returns"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter return status"
              >
                <option value="ALL">All statuses</option>

                {Object.entries(STATUS_INFO).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ar-empty">
              Loading return requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="ar-empty">
              <span>📦</span>
              <h3>No return requests found</h3>

              <p>
                {orderId == null
                  ? "New customer return requests will appear here."
                  : "No return requests were found for this order."}
              </p>
            </div>
          ) : (
            <div className="ar-request-list">
              {filteredRequests.map((request) => {
                const id =
                  request.returnRequestId ?? request.id;

                const allowed =
                  NEXT_STATUS[request.status] || [];

                const isUpdating =
                  String(updatingId) === String(id);

                const customerConfirmed =
                  request.customerCashConfirmed === true;

                return (
                  <article
                    className="ar-request-card"
                    key={id}
                  >
                    <div className="ar-card-header">
                      <div>
                        <span className="ar-small-label">
                          RETURN REQUEST
                        </span>

                        <h3>
                          {request.productName ||
                            "Product details unavailable"}
                        </h3>

                        <p>
                          Return quantity:{" "}
                          {formatReturnQuantity(
                            request.returnQuantity,
                            request.weight,
                            request.productName
                          )}
                        </p>
                      </div>

                      <span
                        className={`ar-status ar-status-${String(
                          request.status
                        ).toLowerCase()}`}
                      >
                        {STATUS_INFO[request.status] ||
                          request.status}
                      </span>
                    </div>

                    <div className="ar-details-grid">
                      <div>
                        <span>Order</span>
                        <strong>
                          #{request.orderId ?? "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Customer</span>
                        <strong>
                          {request.customerName || "—"}
                        </strong>
                        <small>
                          {request.customerEmail || ""}
                        </small>
                      </div>

                      <div>
                        <span>Original unit price</span>
                        <strong>
                          {money(request.unitPrice)}
                        </strong>
                      </div>

                      <div>
                        <span>Calculated cash refund</span>
                        <strong className="ar-money">
                          {money(request.refundAmount)}
                        </strong>
                      </div>

                      <div>
                        <span>Request date</span>
                        <strong>
                          {formatDate(request.createdAt)}
                        </strong>
                      </div>
                    </div>

                    <div className="ar-reason-box">
                      <strong>Customer's return reason</strong>
                      <p>
                        {request.reason || "No reason provided."}
                      </p>
                    </div>

                    {request.adminNote && (
                      <div className="ar-note-box">
                        <strong>Admin note</strong>
                        <p>{request.adminNote}</p>
                      </div>
                    )}

                    <div className="ar-timeline">
                      <div>
                        <span>Pickup arranged</span>
                        <strong>
                          {formatDate(request.pickupScheduledAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Product collected</span>
                        <strong>
                          {formatDate(request.pickedUpAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Cash handed over</span>
                        <strong>
                          {formatDate(request.refundedAt)}
                        </strong>
                      </div>
                    </div>

                    {request.status === "REFUNDED" && (
                      <section
                        className={`ar-customer-confirmation ${
                          customerConfirmed
                            ? "confirmed"
                            : "waiting"
                        }`}
                      >
                        <strong>
                          {customerConfirmed
                            ? "✓ Confirmed by Customer"
                            : "Awaiting Customer Confirmation"}
                        </strong>

                        <p>
                          {customerConfirmed
                            ? "The customer has confirmed receiving the cash refund."
                            : "Cash handover is recorded. The customer has not confirmed receipt yet."}
                        </p>

                        {customerConfirmed && (
                          <p>
                            Confirmation date:{" "}
                            <strong>
                              {formatDate(
                                request.customerCashConfirmedAt
                              )}
                            </strong>
                          </p>
                        )}
                      </section>
                    )}

                    {allowed.length > 0 ? (
                      <div className="ar-actions">
                        <label htmlFor={`admin-note-${id}`}>
                          Admin note
                          {request.status === "REQUESTED" &&
                            " (required when rejecting)"}
                        </label>

                        <textarea
                          id={`admin-note-${id}`}
                          rows="2"
                          maxLength={1000}
                          value={notes[id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [id]: event.target.value,
                            }))
                          }
                          placeholder={
                            request.status === "REQUESTED"
                              ? "Explain rejection if rejecting, or add an optional note..."
                              : "Optional update for the customer..."
                          }
                        />

                        <div className="ar-action-buttons">
                          {allowed.map((nextStatus) => (
                            <button
                              type="button"
                              key={nextStatus}
                              disabled={isUpdating}
                              className={
                                nextStatus === "REJECTED"
                                  ? "ar-danger-button"
                                  : "ar-primary-button"
                              }
                              onClick={() =>
                                updateStatus(request, nextStatus)
                              }
                            >
                              {isUpdating
                                ? "Updating..."
                                : nextStatus === "APPROVED"
                                  ? `Approve · ${money(
                                      request.refundAmount
                                    )}`
                                  : nextStatus === "REJECTED"
                                    ? "Reject Request"
                                    : nextStatus ===
                                        "PICKUP_SCHEDULED"
                                      ? "Arrange Pickup"
                                      : nextStatus === "PICKED_UP"
                                        ? "Confirm Product Collected"
                                        : nextStatus ===
                                            "REFUND_PENDING"
                                          ? "Cash Refund Pending"
                                          : "Confirm Cash Handed Over"}
                            </button>
                          ))}
                        </div>

                        {request.status === "REFUND_PENDING" && (
                          <p className="ar-cash-warning">
                            Select the next action only after cash has
                            actually been handed to the customer.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="ar-terminal-message">
                        {request.status === "REJECTED"
                          ? "This return request has been rejected."
                          : customerConfirmed
                            ? "Return complete. Cash receipt confirmed by customer."
                            : request.status === "REFUNDED"
                              ? "Cash handover recorded. Awaiting customer confirmation."
                              : "This return request is complete."}
                      </div>
                    )}
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