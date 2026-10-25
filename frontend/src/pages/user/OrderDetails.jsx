import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import imageMap from "../../images/image.js";
import "../../styles/OrderDetails.css";

/* ========================================
   HELPERS
======================================== */

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeText = (value, fallback = "") =>
  value == null ? fallback : String(value);

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  });

/* ========================================
   RETURN QUANTITY FORMATTING
======================================== */

const formatReturnQuantity = (quantity, weight, productName) => {
  if (quantity == null || !Number.isFinite(Number(quantity))) {
    return "Not available";
  }

  const value = Number(quantity);
  const unit = String(weight || "").trim().toUpperCase();
  const name = String(productName || "").toLowerCase();

  const formatNumber = (number) =>
    Number(number.toFixed(3)).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    });

  if (name.includes("egg")) {
    return `${formatNumber(value)} pcs`;
  }

  const isWeightProduct =
    /KG|KGS|KILOGRAM|GM|GMS|GRAM/.test(unit) ||
    [
      "chicken",
      "keema",
      "boneless",
      "drumstick",
      "breast",
      "wing",
    ].some((word) => name.includes(word));

  if (isWeightProduct) {
    if (value > 0 && value < 1) {
      return `${formatNumber(value * 1000)} gm`;
    }

    return `${formatNumber(value)} kg`;
  }

  return `${formatNumber(value)} pcs`;
};

const getOrder = (response) => {
  const data = response?.data;

  if (data?.order) return data.order;
  if (data?.data?.order) return data.data.order;
  if (data?.data && !Array.isArray(data.data)) return data.data;

  return data;
};

const getOrderItems = (order) => {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.orderItems)) return order.orderItems;
  if (Array.isArray(order?.orderDetails)) return order.orderDetails;

  return [];
};

const getProduct = (item) =>
  item?.product ?? item?.productDetails ?? {};

const getProductName = (item) => {
  const product = getProduct(item);

  return (
    item?.productName ??
    product?.productName ??
    product?.name ??
    item?.name ??
    "Chicken Product"
  );
};

/* ========================================
   QUANTITY AND UNIT FORMATTING
======================================== */

const getQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? 1);

const getQuantityUnit = (item) => {
  const product = getProduct(item);

  const rawUnit =
    item?.sellingUnit ??
    item?.quantityUnit ??
    item?.unitOfMeasure ??
    item?.unit ??
    product?.sellingUnit ??
    product?.quantityUnit ??
    product?.unitOfMeasure ??
    product?.unit ??
    "";

  const unit = String(rawUnit).trim().toUpperCase();

  if (
    [
      "KG",
      "KGS",
      "KILOGRAM",
      "KILOGRAMS",
      "G",
      "GM",
      "GMS",
      "GRAM",
      "GRAMS",
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
};

const formatQuantityWithUnit = (item) => {
  const quantity = getQuantity(item);
  const unit = getQuantityUnit(item);

  if (unit === "KG") {
    if (quantity > 0 && quantity < 1) {
      return `${formatQuantity(quantity * 1000)} gm`;
    }

    return `${formatQuantity(quantity)} kg`;
  }

  return `${formatQuantity(quantity)} ${
    quantity === 1 ? "pc" : "pcs"
  }`;
};

/* ========================================
   PRODUCT INFORMATION
======================================== */

const getProductImage = (item) => {
  const product = getProduct(item);
  const name = String(getProductName(item)).trim();

  const key = Object.keys(imageMap || {}).find(
    (entry) => entry.trim().toLowerCase() === name.toLowerCase()
  );

  if (key) return imageMap[key];

  const value =
    item?.imageUrl ??
    product?.imageUrl ??
    item?.imagePath ??
    product?.imagePath ??
    item?.image ??
    product?.image;

  if (typeof value !== "string" || !value.trim()) return null;

  const image = value.trim();

  if (/^https?:\/\//i.test(image)) return image;

  if (image.startsWith("/uploads/")) {
    return `http://localhost:8080${image}`;
  }

  if (image.startsWith("uploads/")) {
    return `http://localhost:8080/${image}`;
  }

  return image;
};

const getPrice = (item) =>
  Number(
    item?.price ??
      item?.unitPrice ??
      item?.productPrice ??
      getProduct(item)?.price ??
      0
  );

const getItemId = (item) => item?.id ?? item?.orderItemId;

/* ========================================
   ORIGINAL ORDER STATUS
======================================== */

const getStatusCode = (order) => {
  const status = order?.status ?? order?.orderStatus;

  if (typeof status === "string") return status.toUpperCase();

  return String(
    status?.code ?? status?.name ?? status?.status ?? "PROCESSING"
  ).toUpperCase();
};

const getStatusLabel = (order) => {
  const status = order?.status ?? order?.orderStatus;

  const code =
    typeof status === "string"
      ? status
      : status?.label ?? status?.code ?? status?.name ?? "PROCESSING";

  return String(code).replaceAll("_", " ");
};

const getOrderDate = (order) =>
  order?.createdAt ??
  order?.orderDate ??
  order?.createdDate ??
  order?.createdOn ??
  order?.date;

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ========================================
   CUSTOMER AND PAYMENT INFORMATION
======================================== */

const formatAddress = (address, order) => {
  if (typeof address === "string" && address.trim()) {
    return address;
  }

  const object =
    address && typeof address === "object" ? address : {};

  const parts = [
    object.addressLine ?? object.address ?? order?.deliveryAddressLine,
    object.city ?? order?.deliveryCity,
    object.state ?? order?.deliveryState,
    object.pincode ?? object.pinCode ?? order?.deliveryPincode,
  ]
    .filter((value) => value != null && String(value).trim())
    .map(String);

  return parts.join(", ") || "Address not available";
};

const getCustomerName = (order, address) =>
  safeText(
    address?.fullName ??
      order?.deliveryFullName ??
      order?.customer?.fullName ??
      order?.customer?.name ??
      order?.customerName ??
      order?.name
  );

const getCustomerPhone = (order, address) =>
  safeText(
    address?.phone ??
      order?.deliveryPhone ??
      order?.customer?.phone ??
      order?.customerPhone ??
      order?.phone
  );

const getCustomerEmail = (order) =>
  safeText(
    order?.customer?.email ?? order?.customerEmail ?? order?.email
  );

const getPaymentDetails = (order) => {
  const payment =
    order?.payment && typeof order.payment === "object"
      ? order.payment
      : {};

  const method =
    payment.paymentMethod ??
    payment.method ??
    order?.paymentMethod ??
    order?.paymentType;

  const rawStatus =
    payment.paymentStatus ??
    payment.status?.label ??
    payment.status?.code ??
    (typeof payment.status === "string" ? payment.status : null) ??
    order?.paymentStatus;

  const amount =
    payment.amount ??
    payment.paymentAmount ??
    order?.totalAmount ??
    order?.grandTotal ??
    order?.totalPrice ??
    order?.total;

  return {
    method: safeText(
      method,
      "Payment information unavailable"
    ).replaceAll("_", " "),
    status: safeText(rawStatus).replaceAll("_", " "),
    amount,
  };
};

/* ========================================
   REVIEW AND RETURN HELPERS
======================================== */

const getReviewFromResponse = (response) => {
  const data = response?.data;

  return data?.review ?? data?.data?.review ?? null;
};

const getReturnRequests = (response) => {
  const data = response?.data;

  const list =
    data?.returnRequests ??
    data?.data?.returnRequests ??
    data?.data ??
    data;

  return Array.isArray(list) ? list : [];
};

/* ========================================
   RETURN STATUS AND CUSTOMER ORDER STATUS
======================================== */

const getReturnStatusInfo = (status) => {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  const statusInfo = {
    REQUESTED: {
      title: "Return Requested",
      message:
        "Your return request has been submitted and is waiting for review.",
    },
    APPROVED: {
      title: "Return Approved",
      message:
        "Your return is approved. Please check the pickup updates.",
    },
    REJECTED: {
      title: "Return Rejected",
      message:
        "Your return request was rejected. Please check the admin's note.",
    },
    PICKUP_SCHEDULED: {
      title: "Return Approved",
      message:
        "Your return is approved and pickup has been scheduled.",
    },
    PICKED_UP: {
      title: "Returned",
      message:
        "The returned product has been collected by FreshNest.",
    },
    REFUND_PENDING: {
      title: "Refund Pending",
      message:
        "Your product has been collected or approved for refund, and the cash refund is pending.",
    },
    REFUNDED: {
      title: "Returned / Refunded",
      message:
        "FreshNest has recorded the cash refund. Please confirm receipt only after receiving the cash.",
    },
  };

  return (
    statusInfo[normalized] || {
      title: normalized.replaceAll("_", " "),
      message: "Check the latest update for this request.",
    }
  );
};

/*
 * Displays the appropriate status in the customer-facing order banner.
 * Rejected requests are ignored when selecting an active return status.
 */
const getCustomerOrderStatus = (order, requests, orderId) => {
  const originalStatus = getStatusCode(order);

  const activeRequests = (Array.isArray(requests) ? requests : [])
    .filter(
      (request) =>
        String(request.orderId) === String(orderId) &&
        String(request.status || "").toUpperCase() !== "REJECTED"
    )
    .sort((a, b) => {
      const dateA = new Date(
        a.updatedAt || a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.updatedAt || b.createdAt || 0
      ).getTime();

      return dateB - dateA;
    });

  if (activeRequests.length === 0) {
    return {
      label: getStatusLabel(order),
      code: originalStatus,
    };
  }

  const latestStatus = String(
    activeRequests[0].status || ""
  ).toUpperCase();

  const statusMap = {
    REQUESTED: {
      label: "Return Requested",
      code: "RETURN-REQUESTED",
    },
    APPROVED: {
      label: "Return Approved",
      code: "RETURN-APPROVED",
    },
    PICKUP_SCHEDULED: {
      label: "Return Approved",
      code: "RETURN-APPROVED",
    },
    PICKED_UP: {
      label: "Returned",
      code: "RETURNED",
    },
    REFUND_PENDING: {
      label: "Refund Pending",
      code: "REFUND-PENDING",
    },
    REFUNDED: {
      label: "Returned / Refunded",
      code: "RETURNED-REFUNDED",
    },
  };

  return (
    statusMap[latestStatus] || {
      label: getStatusLabel(order),
      code: originalStatus,
    }
  );
};

/* ========================================
   ORDER DETAILS COMPONENT
======================================== */

export default function OrderDetails() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnHistoryLoading, setReturnHistoryLoading] = useState(false);
  const [returnHistoryError, setReturnHistoryError] = useState("");
  const [selectedReturnItems, setSelectedReturnItems] = useState({});
  const [returnReason, setReturnReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const [confirmingCashId, setConfirmingCashId] = useState(null);
  const [cashConfirmError, setCashConfirmError] = useState("");
  const [cashConfirmSuccess, setCashConfirmSuccess] = useState("");

  /*
   * IMPORTANT:
   * The original order status controls review and return eligibility.
   * The customer-facing return status is displayed separately.
   */
  const orderStatus = getStatusCode(order);
  const isDelivered = orderStatus === "DELIVERED";

  /* Load order and review */

  const loadOrderAndReview = useCallback(async () => {
    setLoading(true);
    setError("");
    setReviewError("");

    try {
      const response = await api.get(
        `/orders/${encodeURIComponent(orderId)}`
      );

      const result = getOrder(response);

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
      ) {
        setOrder(null);
        setError("Order details could not be found.");
        return;
      }

      setOrder(result);

      if (getStatusCode(result) === "DELIVERED") {
        try {
          const reviewResponse = await api.get(
            `/reviews/orders/${encodeURIComponent(orderId)}`
          );

          const savedReview = getReviewFromResponse(reviewResponse);

          setReview(savedReview);

          if (savedReview) {
            setRating(Number(savedReview.rating) || 5);
            setComment(savedReview.comment || "");
          }
        } catch (reviewErr) {
          if (reviewErr.response?.status !== 404) {
            setReviewError(
              reviewErr.response?.data?.message ||
                "Unable to check your saved review."
            );
          }

          setReview(null);
        }
      } else {
        setReview(null);
        setReviewSuccess("");
      }
    } catch (err) {
      setOrder(null);
      setError(
        err.response?.data?.message ||
          "Unable to load order details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderAndReview();
  }, [loadOrderAndReview]);

  /* Load customer return history */

  const loadReturnHistory = useCallback(async () => {
    setReturnHistoryLoading(true);
    setReturnHistoryError("");

    try {
      const response = await api.get("/returns/my");
      setReturnRequests(getReturnRequests(response));
    } catch (err) {
      setReturnHistoryError(
        err.response?.data?.message ||
          "Unable to load return history. You can still try submitting your request."
      );
    } finally {
      setReturnHistoryLoading(false);
    }
  }, []);

  /*
   * Load return history on page open so the customer-facing
   * order status can reflect an existing return/refund request.
   */
  useEffect(() => {
    loadReturnHistory();
  }, [loadReturnHistory]);

  const items = useMemo(() => getOrderItems(order), [order]);

  const actualOrderId = order?.orderId ?? order?.id ?? orderId;

  const customerOrderStatus = getCustomerOrderStatus(
    order,
    returnRequests,
    actualOrderId
  );

  const statusClass = customerOrderStatus.code
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");

  const deliveryAddress =
    order?.deliveryAddress ??
    order?.address ??
    order?.shippingAddress ??
    order?.customerAddress;

  const addressObject =
    deliveryAddress && typeof deliveryAddress === "object"
      ? deliveryAddress
      : null;

  const customerName = getCustomerName(order, addressObject);
  const customerPhone = getCustomerPhone(order, addressObject);
  const customerEmail = getCustomerEmail(order);
  const payment = getPaymentDetails(order);

  const total =
    order?.totalAmount ??
    order?.grandTotal ??
    order?.totalPrice ??
    order?.total ??
    0;

  const subtotal =
    order?.subtotal ??
    items.reduce(
      (sum, item) => sum + getPrice(item) * getQuantity(item),
      0
    );

  const savedRating = Math.max(
    0,
    Math.min(5, Number(review?.rating) || 0)
  );

  /* Return quantity calculations */

  const getPreviouslyRequestedQuantity = useCallback(
    (item) => {
      const itemId = getItemId(item);

      if (itemId == null) return 0;

      return returnRequests
        .filter(
          (request) =>
            String(request.orderId) === String(actualOrderId) &&
            String(request.orderItemId) === String(itemId) &&
            String(request.status).toUpperCase() !== "REJECTED"
        )
        .reduce(
          (sum, request) =>
            sum + Number(request.returnQuantity || 0),
          0
        );
    },
    [returnRequests, actualOrderId]
  );

  const getAvailableReturnQuantity = useCallback(
    (item) =>
      Math.max(
        0,
        getQuantity(item) - getPreviouslyRequestedQuantity(item)
      ),
    [getPreviouslyRequestedQuantity]
  );

  const selectedReturnLines = useMemo(
    () =>
      items
        .map((item, index) => {
          const rawId =
            getItemId(item) ?? item?.productId ?? index;

          const id = String(rawId);

          if (!selectedReturnItems[id]?.selected) return null;

          const quantity = getAvailableReturnQuantity(item);
          const price = getPrice(item);

          return {
            item,
            id,
            orderItemId: getItemId(item),
            quantity,
            available: quantity,
            price,
            amount: quantity * price,
            valid:
              Number.isFinite(quantity) &&
              quantity > 0 &&
              quantity <= getQuantity(item),
          };
        })
        .filter(Boolean),
    [items, selectedReturnItems, getAvailableReturnQuantity]
  );

  const estimatedReturnAmount = selectedReturnLines.reduce(
    (sum, line) => sum + line.amount,
    0
  );

  const invalidReturnLines = selectedReturnLines.filter(
    (line) => !line.valid || line.orderItemId == null
  );

  const visibleReturnRequests = useMemo(
    () =>
      returnRequests.filter(
        (request) =>
          String(request.orderId) === String(actualOrderId)
      ),
    [returnRequests, actualOrderId]
  );

  /* Confirm cash received */

  const confirmCashReceived = async (request) => {
    const returnRequestId = request?.returnRequestId;

    if (returnRequestId == null) {
      setCashConfirmError(
        "Return request ID is missing. Please refresh and try again."
      );
      setCashConfirmSuccess("");
      return;
    }

    if (String(request.status).toUpperCase() !== "REFUNDED") {
      setCashConfirmError(
        "You can confirm cash receipt only after the admin records the refund."
      );
      setCashConfirmSuccess("");
      return;
    }

    if (request.customerCashConfirmed === true) {
      setCashConfirmSuccess(
        "Cash receipt has already been confirmed."
      );
      setCashConfirmError("");
      return;
    }

    const confirmed = window.confirm(
      "Have you actually received the cash refund from FreshNest?"
    );

    if (!confirmed) return;

    setConfirmingCashId(String(returnRequestId));
    setCashConfirmError("");
    setCashConfirmSuccess("");

    try {
      await api.post(
        `/returns/${encodeURIComponent(returnRequestId)}/confirm-cash-received`
      );

      setCashConfirmSuccess(
        `Cash receipt confirmed for return request #${returnRequestId}.`
      );

      await loadReturnHistory();
    } catch (err) {
      setCashConfirmError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to confirm cash receipt. Please refresh and try again."
      );
    } finally {
      setConfirmingCashId(null);
    }
  };

  /* Open and close return popup */

  const openReturnPopup = async (item = null) => {
    setReturnError("");
    setReturnSuccess("");
    setReturnReason("");
    setOtherReason("");
    setReturnHistoryError("");
    setCashConfirmError("");
    setCashConfirmSuccess("");

    if (item) {
      const rawId = getItemId(item) ?? item?.productId;
      const available = getAvailableReturnQuantity(item);

      setSelectedReturnItems(
        rawId != null && available > 0
          ? { [String(rawId)]: { selected: true } }
          : {}
      );
    } else {
      setSelectedReturnItems({});
    }

    setReturnOpen(true);
    await loadReturnHistory();
  };

  const closeReturnPopup = () => {
    if (submittingReturn) return;

    setReturnOpen(false);
    setReturnError("");
    setReturnSuccess("");
    setCashConfirmError("");
    setCashConfirmSuccess("");
  };

  const toggleReturnItem = (item, index, checked) => {
    const rawId =
      getItemId(item) ?? item?.productId ?? index;

    const id = String(rawId);
    const available = getAvailableReturnQuantity(item);

    setReturnError("");
    setReturnSuccess("");

    setSelectedReturnItems((previous) => {
      const next = { ...previous };

      if (!checked) {
        delete next[id];
        return next;
      }

      if (available <= 0) return next;

      next[id] = { selected: true };
      return next;
    });
  };

  useEffect(() => {
    if (!returnOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submittingReturn) {
        setReturnOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [returnOpen, submittingReturn]);

  /* Submit return requests */

  const submitReturnRequest = async (event) => {
    event.preventDefault();
    setReturnError("");
    setReturnSuccess("");

    if (!isDelivered) {
      setReturnError(
        "Only delivered orders are eligible for returns."
      );
      return;
    }

    if (selectedReturnLines.length === 0) {
      setReturnError(
        "Please select at least one product to return."
      );
      return;
    }

    if (invalidReturnLines.length > 0) {
      setReturnError(
        "One or more selected products do not have an eligible quantity or order-item ID."
      );
      return;
    }

    const finalReason =
      returnReason === "Other"
        ? otherReason.trim()
        : returnReason;

    if (!finalReason) {
      setReturnError("Please select a reason for the return.");
      return;
    }

    if (finalReason.length > 1000) {
      setReturnError(
        "The reason must be 1000 characters or fewer."
      );
      return;
    }

    if (
      actualOrderId == null ||
      !Number.isFinite(Number(actualOrderId)) ||
      selectedReturnLines.some(
        (line) =>
          line.orderItemId == null ||
          !Number.isFinite(Number(line.orderItemId))
      )
    ) {
      setReturnError(
        "Order ID or product order-item ID is missing. Please reload the order."
      );
      return;
    }

    setSubmittingReturn(true);

    const succeededIds = new Set();
    const succeededNames = [];
    const failedNames = [];

    try {
      for (const line of selectedReturnLines) {
        try {
          await api.post("/returns", {
            orderId: Number(actualOrderId),
            orderItemId: Number(line.orderItemId),
            quantity: line.quantity,
            reason: finalReason,
          });

          succeededIds.add(line.id);
          succeededNames.push(getProductName(line.item));
        } catch (err) {
          failedNames.push({
            name: getProductName(line.item),
            message:
              err.response?.data?.message ||
              "The server could not accept this return request.",
          });
        }
      }

      if (succeededIds.size > 0) {
        setSelectedReturnItems((previous) => {
          const next = { ...previous };

          succeededIds.forEach((id) => next[id] && delete next[id]);

          return next;
        });

        setReturnReason("");
        setOtherReason("");
        await loadReturnHistory();
      }

      if (failedNames.length === 0) {
        setReturnSuccess(
          `Successfully submitted ${succeededIds.size} return ${
            succeededIds.size === 1 ? "request" : "requests"
          } for: ${succeededNames.join(", ")}.`
        );
      } else if (succeededIds.size > 0) {
        setReturnSuccess(
          `Submitted ${succeededIds.size} request(s) successfully: ${succeededNames.join(", ")}.`
        );

        setReturnError(
          `These products could not be submitted: ${failedNames
            .map((entry) => `${entry.name} (${entry.message})`)
            .join("; ")}. Their selections have been kept so you can retry.`
        );
      } else {
        setReturnError(
          `No requests were submitted. ${failedNames
            .map((entry) => `${entry.name}: ${entry.message}`)
            .join("; ")}`
        );
      }
    } finally {
      setSubmittingReturn(false);
    }
  };

  /* Submit review */

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!isDelivered) {
      setReviewError(
        "You can review this order after it is delivered."
      );
      return;
    }

    if (
      !Number.isInteger(Number(rating)) ||
      rating < 1 ||
      rating > 5
    ) {
      setReviewError(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await api.post(
        `/reviews/orders/${encodeURIComponent(orderId)}`,
        { rating: Number(rating), comment: comment.trim() }
      );

      const savedReview = getReviewFromResponse(response);

      if (savedReview) {
        setReview(savedReview);
      } else {
        const reviewResponse = await api.get(
          `/reviews/orders/${encodeURIComponent(orderId)}`
        );

        setReview(getReviewFromResponse(reviewResponse));
      }

      setReviewSuccess(
        response.data?.message ||
          "Thank you! Your review was submitted."
      );
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  /* Loading state */

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-message">
          <div className="order-details-spinner" />
          <p>Loading order details...</p>
        </div>
      </main>
    );
  }

  /* Error state */

  if (error || !order) {
    return (
      <main className="order-details-page">
        <div className="order-details-container">
          <div className="od-heading">
            <div className="od-heading-content">
              <span className="od-eyebrow">ORDER SUMMARY</span>
              <h1>Order Details</h1>
            </div>

            <Link to="/orders" className="od-back-link">
              ← Back to My Orders
            </Link>
          </div>

          <div className="order-details-message">
            <span className="order-details-message-icon">!</span>
            <h2>Order details unavailable</h2>
            <p>{error || "We couldn't find this order."}</p>

            <Link to="/orders" className="od-primary-button">
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const orderDate = getOrderDate(order);

  return (
    <main className="order-details-page">
      <div className="order-details-container">
        <section className="od-heading">
          <div className="od-heading-content">
            <span className="od-eyebrow">ORDER SUMMARY</span>
            <h1>Order Details</h1>
            <p>Review your order and delivery information.</p>
          </div>

          <Link to="/orders" className="od-back-link">
            ← Back to My Orders
          </Link>
        </section>

        {/* Order banner */}

        <section className="od-order-banner">
          <div className="od-order-icon">🍗</div>

          <div className="od-order-banner-info">
            <span>Order placed</span>
            <h2>{formatDate(orderDate)}</h2>
            <p>
              {items.length}{" "}
              {items.length === 1 ? "product" : "products"} in this order
            </p>
          </div>

          <span className={`od-status od-status-${statusClass}`}>
            {customerOrderStatus.label}
          </span>
        </section>

        <div className="od-content-grid">
          {/* Ordered products */}

          <section className="od-card od-items-card">
            <div className="od-card-heading">
              <h2>Ordered Items</h2>
              <span>{items.length} item(s)</span>
            </div>

            {items.length > 0 ? (
              <div className="od-items-list">
                {items.map((item, index) => {
                  const quantity = getQuantity(item);
                  const price = getPrice(item);
                  const productName = getProductName(item);
                  const productImage = getProductImage(item);
                  const product = getProduct(item);

                  const itemId =
                    getItemId(item) ??
                    item?.productId ??
                    product.id ??
                    index;

                  const itemSubtotal =
                    item.subtotal ??
                    item.totalPrice ??
                    price * quantity;

                  return (
                    <div className="od-item" key={itemId}>
                      <div className="od-item-image">
                        {productImage && (
                          <img
                            src={productImage}
                            alt={productName}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.parentElement?.querySelector(
                                  ".od-item-image-fallback"
                                );

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        )}

                        <span
                          className="od-item-image-fallback"
                          style={{
                            display: productImage ? "none" : "flex",
                          }}
                        >
                          🍗
                        </span>
                      </div>

                      <div className="od-item-info">
                        <h3>{productName}</h3>

                        <p className="od-item-price-quantity">
                          {formatCurrency(price)} ×{" "}
                          {formatQuantityWithUnit(item)}
                        </p>

                        {isDelivered && (
                          <button
                            type="button"
                            className="od-item-return-link"
                            onClick={() => openReturnPopup(item)}
                          >
                            ↩ Return This Product
                          </button>
                        )}
                      </div>

                      <strong>{formatCurrency(itemSubtotal)}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="od-empty-items">
                <p>
                  Item information is not available for this order.
                </p>
              </div>
            )}

            <div className="od-total-section">
              <div className="od-total-row">
                <span>Items subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {order.deliveryCharge != null && (
                <div className="od-total-row">
                  <span>Delivery charge</span>
                  <span>{formatCurrency(order.deliveryCharge)}</span>
                </div>
              )}

              {order.discount != null &&
                Number(order.discount) > 0 && (
                  <div className="od-total-row od-discount-row">
                    <span>Discount</span>
                    <span>
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}

              <div className="od-total-row od-grand-total">
                <strong>Total Amount</strong>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>
          </section>

          {/* Delivery and payment */}

          <div className="od-side-column">
            <section className="od-card">
              <div className="od-card-heading">
                <h2>Delivery Information</h2>
              </div>

              <div className="od-information">
                <span className="od-info-icon">📍</span>
                <div>
                  <h3>Delivery Address</h3>
                  <p>{formatAddress(deliveryAddress, order)}</p>
                </div>
              </div>

              {customerName && (
                <div className="od-information">
                  <span className="od-info-icon">👤</span>
                  <div>
                    <h3>Customer</h3>
                    <p>{customerName}</p>
                  </div>
                </div>
              )}

              {customerEmail && (
                <div className="od-information">
                  <span className="od-info-icon">✉</span>
                  <div>
                    <h3>Email</h3>
                    <p>{customerEmail}</p>
                  </div>
                </div>
              )}

              {customerPhone && (
                <div className="od-information">
                  <span className="od-info-icon">📞</span>
                  <div>
                    <h3>Contact Number</h3>
                    <p>{customerPhone}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="od-card">
              <div className="od-card-heading">
                <h2>Payment Information</h2>
              </div>

              <div className="od-information">
                <span className="od-info-icon">💳</span>
                <div>
                  <h3>Payment Method</h3>
                  <p>{payment.method}</p>
                </div>
              </div>

              {payment.status && (
                <div className="od-information">
                  <span className="od-info-icon">✓</span>
                  <div>
                    <h3>Payment Status</h3>
                    <p>{payment.status}</p>
                  </div>
                </div>
              )}

              {payment.amount != null && (
                <div className="od-information">
                  <span className="od-info-icon">₹</span>
                  <div>
                    <h3>Payment Amount</h3>
                    <p>{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Reviews */}

        {isDelivered && (
          <section className="od-card od-review-card">
            <div className="od-card-heading">
              <h2>⭐ Rate Your Experience</h2>
            </div>

            {review ? (
              <div className="od-saved-review">
                <p className="od-review-caption">Your rating</p>

                <div
                  className="od-review-stars"
                  aria-label={`${savedRating} out of 5 stars`}
                >
                  {"★".repeat(savedRating)}
                  {"☆".repeat(5 - savedRating)}
                </div>

                <p className="od-review-caption">Your review</p>

                <p className="od-review-comment">
                  {review.comment?.trim()
                    ? review.comment
                    : "You submitted a rating without a written comment."}
                </p>

                {review.createdAt && (
                  <p className="od-review-date">
                    Submitted: {formatDate(review.createdAt)}
                  </p>
                )}

                <p className="od-review-thanks">
                  Thank you for sharing your feedback!
                </p>
              </div>
            ) : (
              <form className="od-review-form" onSubmit={submitReview}>
                <p>How was your chicken delivery experience?</p>

                <div
                  className="od-star-picker"
                  role="radiogroup"
                  aria-label="Choose your rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={
                        star <= rating ? "od-star selected" : "od-star"
                      }
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      aria-pressed={rating === star}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <p className="od-rating-label">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                    rating
                  ]}
                </p>

                <label htmlFor="od-review-comment">
                  Your review (optional)
                </label>

                <textarea
                  id="od-review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your feedback about the products and delivery..."
                  maxLength={1000}
                  rows={4}
                />

                <small className="od-character-count">
                  {comment.length}/1000 characters
                </small>

                {reviewError && (
                  <div className="od-review-message error" role="alert">
                    {reviewError}
                  </div>
                )}

                {reviewSuccess && (
                  <div className="od-review-message success" role="status">
                    {reviewSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="od-primary-button"
                  disabled={submittingReview}
                >
                  {submittingReview
                    ? "Submitting Review..."
                    : "Submit Review"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Returns section */}

        {isDelivered && (
          <section className="od-card od-return-card">
            <div className="od-card-heading">
              <h2>↩ Returns &amp; Refunds</h2>
            </div>

            <p>
              Select multiple delivered products and track each return
              request in this popup. Purchased quantities are not editable.
            </p>

            <button
              type="button"
              className="od-primary-button"
              onClick={() => openReturnPopup()}
            >
              Request Return
            </button>
          </section>
        )}

        <div className="od-bottom-actions">
          <Link to="/products" className="od-primary-button">
            Continue Shopping
          </Link>

          <Link to="/orders" className="od-secondary-button">
            All Orders
          </Link>
        </div>
      </div>

      {/* Returns and refunds modal */}

      {returnOpen && (
        <div
          className="od-return-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReturnPopup();
            }
          }}
        >
          <section
            className="od-return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="od-return-modal-title"
          >
            <header className="od-return-modal-header">
              <div>
                <span className="od-eyebrow">
                  FRESHNEST CUSTOMER CARE
                </span>

                <h2 id="od-return-modal-title">
                  Returns &amp; Refunds
                </h2>

                <p>
                  Order · {formatDate(orderDate)}
                </p>
              </div>

              <button
                type="button"
                className="od-return-modal-close"
                onClick={closeReturnPopup}
                aria-label="Close return request"
                disabled={submittingReturn}
              >
                ×
              </button>
            </header>

            <div className="od-return-modal-body">
              {/* Order and customer information */}

              <section className="od-return-modal-section">
                <h3>📋 Order &amp; Customer Information</h3>

                <p>
                  <strong>Order status:</strong>{" "}
                  {customerOrderStatus.label}
                </p>

                <p>
                  <strong>Customer:</strong>{" "}
                  {customerName || "Not available"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {customerEmail || "Not available"}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {customerPhone || "Not available"}
                </p>

                <p>
                  <strong>Delivery address:</strong>{" "}
                  {formatAddress(deliveryAddress, order)}
                </p>
              </section>

              {/* Return policy */}

              <section className="od-return-modal-section od-return-policy">
                <h3>📌 Returns &amp; Refunds Information</h3>

                <div className="od-return-policy-item">
                  <strong>1. Eligibility</strong>
                  <p>
                    Only products from delivered orders are eligible for
                    return.
                  </p>
                </div>

                <div className="od-return-policy-item">
                  <strong>2. Multiple product returns</strong>
                  <p>
                    Select one or more products. The purchased quantity is
                    not editable in this form.
                  </p>
                </div>

                <div className="od-return-policy-item">
                  <strong>3. Previously requested quantities</strong>
                  <p>
                    Quantities in non-rejected return requests are deducted
                    from the quantity available to return.
                  </p>
                </div>

                <div className="od-return-policy-item">
                  <strong>4. Review and pickup</strong>
                  <p>
                    The FreshNest team reviews each request. Approval and
                    pickup arrangements are reflected in the return history.
                  </p>
                </div>

                <div className="od-return-policy-item">
                  <strong>5. Cash refunds</strong>
                  <p>
                    Refunds are handled manually in cash. The estimated
                    amount is not a guarantee; the backend determines the
                    final eligible amount.
                  </p>
                </div>

                <div className="od-return-policy-item">
                  <strong>6. Track your request</strong>
                  <p>
                    Each product has its own return request and status. You
                    can track the requests below.
                  </p>
                </div>
              </section>

              {!isDelivered && (
                <div className="od-return-message error" role="alert">
                  Only delivered orders are eligible for a return.
                </div>
              )}

              {/* Select products */}

              <section className="od-return-modal-section">
                <h3>🛒 Select Products to Return</h3>

                <p className="od-return-selection-hint">
                  Tick every product you want to return. You can select
                  multiple products. Quantity cannot be changed.
                </p>

                <div className="od-return-modal-products">
                  {items.map((item, index) => {
                    const rawId =
                      getItemId(item) ?? item?.productId ?? index;

                    const id = String(rawId);
                    const name = getProductName(item);
                    const image = getProductImage(item);

                    const chosen = Boolean(
                      selectedReturnItems[id]?.selected
                    );

                    const purchasedQuantity = getQuantity(item);

                    const remainingQuantity =
                      getAvailableReturnQuantity(item);

                    const price = getPrice(item);

                    return (
                      <div
                        key={id}
                        className={`od-return-modal-product ${
                          chosen ? "selected" : ""
                        }`}
                      >
                        <label className="od-return-checkbox-label">
                          <input
                            type="checkbox"
                            checked={chosen}
                            disabled={
                              !isDelivered ||
                              remainingQuantity <= 0 ||
                              submittingReturn
                            }
                            onChange={(event) =>
                              toggleReturnItem(
                                item,
                                index,
                                event.target.checked
                              )
                            }
                          />

                          <span className="od-return-modal-product-image">
                            {image ? (
                              <img src={image} alt={name} />
                            ) : (
                              "🍗"
                            )}
                          </span>

                          <span className="od-return-modal-product-info">
                            <strong>{name}</strong>

                            <small>
                              Purchased quantity:{" "}
                              {formatQuantityWithUnit(item)}
                            </small>

                            <small>
                              Available to return:{" "}
                              {formatQuantityWithUnit({
                                ...item,
                                quantity: remainingQuantity,
                                qty: remainingQuantity,
                              })}
                            </small>

                            <small>
                              Unit price: {formatCurrency(price)}
                            </small>

                            <small>
                              Item total:{" "}
                              {formatCurrency(price * purchasedQuantity)}
                            </small>

                            {remainingQuantity <= 0 && (
                              <small className="od-return-unavailable-label">
                                No quantity available to return
                              </small>
                            )}
                          </span>
                        </label>

                        {chosen && (
                          <div className="od-return-line-editor">
                            <div className="od-return-line-amount">
                              <span>
                                Quantity requested:{" "}
                                {formatQuantityWithUnit({
                                  ...item,
                                  quantity: remainingQuantity,
                                  qty: remainingQuantity,
                                })}
                              </span>

                              <strong>
                                {formatCurrency(price * remainingQuantity)}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Submit return request form */}

              {isDelivered && (
                <form
                  className="od-return-form"
                  onSubmit={submitReturnRequest}
                >
                  <h3>📝 Return Request Form</h3>

                  <div className="od-return-selected-summary">
                    <h4>Selected Products Summary</h4>

                    {selectedReturnLines.length === 0 ? (
                      <p>
                        Select products above to calculate the estimated
                        refund.
                      </p>
                    ) : (
                      <>
                        {selectedReturnLines.map((line) => (
                          <div
                            className="od-return-summary-row"
                            key={line.id}
                          >
                            <span>
                              {getProductName(line.item)}

                              <small>
                                Quantity:{" "}
                                {formatQuantityWithUnit({
                                  ...line.item,
                                  quantity: line.quantity,
                                  qty: line.quantity,
                                })}
                              </small>
                            </span>

                            <strong>
                              {formatCurrency(line.amount)}
                            </strong>
                          </div>
                        ))}

                        <div className="od-return-summary-total">
                          <span>Combined estimated refund</span>

                          <strong>
                            {formatCurrency(estimatedReturnAmount)}
                          </strong>
                        </div>

                        <small className="od-return-estimate-disclaimer">
                          Estimate only. The backend determines the final
                          eligible refund amount for each request.
                        </small>
                      </>
                    )}
                  </div>

                  <label htmlFor="od-return-reason">
                    Reason for return
                  </label>

                  <select
                    id="od-return-reason"
                    value={returnReason}
                    onChange={(event) => {
                      setReturnReason(event.target.value);
                      setOtherReason("");
                      setReturnError("");
                      setReturnSuccess("");
                    }}
                    disabled={submittingReturn}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Product damaged">
                      Product damaged
                    </option>
                    <option value="Wrong product delivered">
                      Wrong product delivered
                    </option>
                    <option value="Quality issue">Quality issue</option>
                    <option value="Quantity issue">Quantity issue</option>
                    <option value="Other">Other</option>
                  </select>

                  {returnReason === "Other" && (
                    <>
                      <label htmlFor="od-return-other-reason">
                        Explain the reason
                      </label>

                      <textarea
                        id="od-return-other-reason"
                        rows={3}
                        maxLength={1000}
                        value={otherReason}
                        onChange={(event) =>
                          setOtherReason(event.target.value)
                        }
                        placeholder="Explain the issue..."
                        disabled={submittingReturn}
                        required
                      />

                      <small>
                        {otherReason.length}/1000 characters
                      </small>
                    </>
                  )}

                  <div className="od-return-cash-note">
                    <strong>💵 Cash refund process</strong>
                    <p>
                      Your requests must be reviewed. If approved, the team
                      will update pickup and refund progress. A refund should
                      only be marked complete after the cash is handed over.
                    </p>
                  </div>

                  {returnError && (
                    <div className="od-return-message error" role="alert">
                      {returnError}
                    </div>
                  )}

                  {returnSuccess && (
                    <div className="od-return-message success" role="status">
                      {returnSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="od-primary-button"
                    disabled={
                      submittingReturn ||
                      selectedReturnLines.length === 0 ||
                      invalidReturnLines.length > 0 ||
                      !returnReason ||
                      (returnReason === "Other" &&
                        !otherReason.trim())
                    }
                  >
                    {submittingReturn
                      ? "Submitting Requests..."
                      : `Submit ${selectedReturnLines.length} Return ${
                          selectedReturnLines.length === 1
                            ? "Request"
                            : "Requests"
                        }`}
                  </button>
                </form>
              )}

              {/* Return history and cash confirmation */}

              <section className="od-return-modal-section od-return-history-section">
                <div className="od-return-history-heading">
                  <h3>📦 Return &amp; Refund History</h3>

                  <button
                    type="button"
                    className="od-return-refresh-button"
                    onClick={loadReturnHistory}
                    disabled={
                      returnHistoryLoading || submittingReturn
                    }
                  >
                    {returnHistoryLoading
                      ? "Refreshing..."
                      : "↻ Refresh"}
                  </button>
                </div>

                {cashConfirmError && (
                  <div className="od-return-message error" role="alert">
                    {cashConfirmError}
                  </div>
                )}

                {cashConfirmSuccess && (
                  <div className="od-return-message success" role="status">
                    {cashConfirmSuccess}
                  </div>
                )}

                {returnHistoryError && (
                  <div className="od-return-message error" role="alert">
                    {returnHistoryError}
                  </div>
                )}

                {returnHistoryLoading ? (
                  <p className="od-return-history-empty">
                    Loading your return history...
                  </p>
                ) : visibleReturnRequests.length === 0 ? (
                  <p className="od-return-history-empty">
                    No return requests have been submitted for this order yet.
                  </p>
                ) : (
                  <div className="od-return-history-list">
                    {visibleReturnRequests.map((request) => {
                      const info = getReturnStatusInfo(request.status);

                      const normalizedStatus = String(
                        request.status || ""
                      ).toUpperCase();

                      return (
                        <article
                          className="od-return-history-item"
                          key={
                            request.returnRequestId ??
                            `${request.orderItemId}-${request.createdAt}`
                          }
                        >
                          <div className="od-return-history-item-heading">
                            <div>
                              <h4>
                                {request.productName || "Product return"}
                              </h4>

                              <small>
                                Request ID:{" "}
                                {request.returnRequestId ?? "Not available"}
                              </small>
                            </div>

                            <span
                              className={`od-return-history-status status-${String(
                                request.status || "unknown"
                              ).toLowerCase()}`}
                            >
                              {info.title}
                            </span>
                          </div>

                          <p>
                            <strong>Order:</strong> #{request.orderId}
                          </p>

                          <p>
                            <strong>Quantity returned:</strong>{" "}
                            {formatReturnQuantity(
                              request.returnQuantity,
                              request.weight,
                              request.productName
                            )}
                          </p>

                          <p>
                            <strong>Reason:</strong>{" "}
                            {request.reason || "Not provided"}
                          </p>

                          <p className="od-return-history-status-message">
                            {info.message}
                          </p>

                          <div className="od-return-history-refund">
                            <h5>Refund information</h5>

                            <p>
                              <strong>Refund amount:</strong>{" "}
                              {request.refundAmount == null
                                ? "Not available yet"
                                : formatCurrency(request.refundAmount)}
                            </p>

                            <p>
                              <strong>Refund method:</strong>{" "}
                              {normalizedStatus === "REJECTED"
                                ? "Not applicable"
                                : request.refundMethod || "Cash"}
                            </p>

                            <p>
                              <strong>Pickup scheduled:</strong>{" "}
                              {formatDate(request.pickupScheduledAt)}
                            </p>

                            <p>
                              <strong>Product collected:</strong>{" "}
                              {formatDate(request.pickedUpAt)}
                            </p>

                            <p>
                              <strong>Cash handover recorded:</strong>{" "}
                              {formatDate(request.refundedAt)}
                            </p>
                          </div>

                          {request.adminNote && (
                            <div className="od-return-team-note">
                              <strong>Update from FreshNest</strong>
                              <p>{request.adminNote}</p>
                            </div>
                          )}

                          {normalizedStatus === "REFUNDED" && (
                            <section className="od-cash-confirmation">
                              {request.customerCashConfirmed === true ? (
                                <div
                                  className="od-cash-confirmed-badge"
                                  role="status"
                                >
                                  <strong>
                                    ✓ Cash Received Confirmed
                                  </strong>

                                  <span>
                                    Confirmed on:{" "}
                                    {formatDate(
                                      request.customerCashConfirmedAt
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="od-cash-confirmation-pending">
                                  <strong>
                                    Cash refund recorded by FreshNest
                                  </strong>

                                  <p>
                                    Please confirm only if you have actually
                                    received the cash refund from the FreshNest
                                    team.
                                  </p>

                                  <button
                                    type="button"
                                    className="od-confirm-cash-button"
                                    disabled={confirmingCashId !== null}
                                    onClick={() =>
                                      confirmCashReceived(request)
                                    }
                                  >
                                    {confirmingCashId ===
                                    String(request.returnRequestId)
                                      ? "Confirming..."
                                      : "✓ Confirm Cash Received"}
                                  </button>
                                </div>
                              )}
                            </section>
                          )}

                          <div className="od-return-history-dates">
                            <p>
                              <strong>Request submitted:</strong>{" "}
                              {formatDate(request.createdAt)}
                            </p>

                            <p>
                              <strong>Last updated:</strong>{" "}
                              {formatDate(request.updatedAt)}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="od-return-modal-footer">
                <button
                  type="button"
                  className="od-secondary-button"
                  onClick={closeReturnPopup}
                  disabled={submittingReturn}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}