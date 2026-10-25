import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminReports.css";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Selected date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const extractReport = (response) => {
  const body = response?.data;
  return body?.data ?? body?.report ?? body;
};

export default function AdminReports() {
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReport = useCallback(async (date) => {
    if (!date) {
      setError("Please select a report date.");
      return;
    }

    if (date > getLocalDate()) {
      setError("Future-date reports are not allowed.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/admin/reports", {
        params: { date },
      });

      const data = extractReport(response);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The server did not return report statistics.");
      }

      setReport(data);
    } catch (err) {
      setReport(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load the report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(getLocalDate());
  }, [loadReport]);

  const handleDateSubmit = (event) => {
    event.preventDefault();
    loadReport(selectedDate);
  };

  const downloadPdf = async () => {
    if (!selectedDate || selectedDate > getLocalDate()) {
      setError("Please select a valid report date.");
      return;
    }

    setDownloading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/admin/reports/pdf", {
        params: { date: selectedDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = `Chicken-Delivery-Report-${selectedDate}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Your PDF report download has started.");
    } catch (err) {
      let message = "Unable to download the PDF report.";

      if (err.response?.data instanceof Blob) {
        try {
          const responseText = await err.response.data.text();
          const parsed = JSON.parse(responseText);
          message = parsed.message || message;
        } catch {
          // Keep the default message if the response is not JSON.
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const deliveredOrders =
    report?.deliveredOrders ?? report?.completedOrders ?? 0;

  const returnedOrders = report?.returnedOrders ?? 0;
  const netRevenue = report?.todayRevenue ?? 0;

  const cards = [
    {
      label: "Total Orders",
      value: report?.todayOrders ?? 0,
      icon: "🛍️",
      color: "red",
    },
    {
      label: "Pending Orders",
      value: report?.pendingOrders ?? 0,
      icon: "⏳",
      color: "orange",
    },
    {
      label: "Delivered Orders",
      value: deliveredOrders,
      icon: "✓",
      color: "green",
    },
    {
      label: "Cancelled Orders",
      value: report?.cancelledOrders ?? 0,
      icon: "×",
      color: "gray",
    },
    {
      label: "Returned / Refunds",
      value: returnedOrders,
      icon: "↩",
      color: "teal",
    },
    {
      label: "Today's Revenue",
      value: money(netRevenue),
      icon: "₹",
      color: "purple",
    },
  ];

  return (
    <main className="admin-reports-page">
      <div className="ar-container">
        <header className="ar-header">
          <div>
            <span className="ar-eyebrow">BUSINESS ANALYTICS</span>
            <h1>Reports &amp; Analytics</h1>
            <p>
              Review daily performance, returns and net revenue, then export a
              PDF report.
            </p>
          </div>

          <button
            type="button"
            className="ar-refresh-button"
            onClick={() => loadReport(selectedDate)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh Report"}
          </button>
        </header>

        <section className="ar-date-card">
          <div className="ar-date-description">
            <span className="ar-date-icon">📅</span>

            <div>
              <h2>Select Report Date</h2>
              <p>
                Choose a date to load its order, return and revenue statistics.
              </p>
            </div>
          </div>

          <form className="ar-date-form" onSubmit={handleDateSubmit}>
            <input
              type="date"
              value={selectedDate}
              max={getLocalDate()}
              onChange={(event) => setSelectedDate(event.target.value)}
              required
              aria-label="Select report date"
            />

            <button
              type="submit"
              className="ar-primary-button"
              disabled={loading}
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>

            <button
              type="button"
              className="ar-secondary-button"
              onClick={downloadPdf}
              disabled={downloading || loading}
            >
              {downloading ? "Preparing PDF..." : "↓ Download PDF"}
            </button>
          </form>
        </section>

        {error && (
          <div className="ar-alert ar-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="ar-alert ar-alert-success" role="status">
            {success}
          </div>
        )}

        <section className="ar-report-title">
          <div>
            <span>DAILY SUMMARY</span>
            <h2>{formatDate(report?.date ?? selectedDate)}</h2>
          </div>

          {report && (
            <span className="ar-report-badge">Report loaded</span>
          )}
        </section>

        {loading && !report ? (
          <div className="ar-empty">Loading report statistics...</div>
        ) : error && !report ? (
          <div className="ar-empty">
            <span>📊</span>
            <h3>Report unavailable</h3>
            <p>Try selecting the date again or refreshing the report.</p>
          </div>
        ) : (
          <>
            <section className="ar-stats-grid">
              {cards.map((card) => (
                <article className="ar-stat-card" key={card.label}>
                  <span className={`ar-stat-icon ${card.color}`}>
                    {card.icon}
                  </span>

                  <div>
                    <p>{card.label}</p>
                    <h3>{card.value}</h3>
                  </div>
                </article>
              ))}
            </section>

            <section className="ar-insight-card">
              <div className="ar-insight-icon">📈</div>

              <div>
                <h2>Daily Performance Summary</h2>

                <p>
                  On {formatDate(report?.date ?? selectedDate)}, FreshNest
                  recorded{" "}
                  <strong>{report?.todayOrders ?? 0}</strong> total order(s).{" "}
                  <strong>{report?.pendingOrders ?? 0}</strong> are pending,{" "}
                  <strong>{deliveredOrders}</strong> remain delivered after
                  returns, and{" "}
                  <strong>{report?.cancelledOrders ?? 0}</strong> were
                  cancelled. There are <strong>{returnedOrders}</strong>{" "}
                  returned/refund order(s). Net delivered revenue is{" "}
                  <strong>{money(netRevenue)}</strong>.
                </p>

                <small>
                  Delivered counts exclude qualifying returned orders. Revenue
                  deducts completed refunds as calculated by the backend.
                </small>
              </div>
            </section>

            <section className="ar-download-card">
              <div>
                <h2>Export Daily Report</h2>
                <p>
                  Download the selected date's report, including returns and
                  net revenue, as a PDF document.
                </p>
              </div>

              <button
                type="button"
                className="ar-primary-button"
                onClick={downloadPdf}
                disabled={downloading || loading}
              >
                {downloading ? "Preparing PDF..." : "Download PDF Report"}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}