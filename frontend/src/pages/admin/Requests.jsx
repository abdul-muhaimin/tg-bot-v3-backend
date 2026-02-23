import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { haptic, hapticNotification } from "../../lib/telegram";
import api from "../../lib/api";

const TABS = [
  {
    key: "deposits",
    label: "Deposits",
    emoji: "💰",
    color: "#34C759",
    pendingKey: "pendingDeposits",
  },
  {
    key: "withdrawals",
    label: "Withdrawals",
    emoji: "💸",
    color: "#FF9500",
    pendingKey: "pendingWithdrawals",
  },
  {
    key: "recoveries",
    label: "Recoveries",
    emoji: "🔄",
    color: "#007AFF",
    pendingKey: "pendingRecoveries",
  },
  {
    key: "newids",
    label: "New IDs",
    emoji: "🆕",
    color: "#5856D6",
    pendingKey: "pendingNewIds",
  },
  {
    key: "transfers",
    label: "Transfers",
    emoji: "🔀",
    color: "#FF2D55",
    pendingKey: "pendingTransfers",
  },
  {
    key: "tickets",
    label: "Support",
    emoji: "🎫",
    color: "#32ADE6",
    pendingKey: "pendingTickets",
  },
];

export default function AdminRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = searchParams.get("tab") || "deposits";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    fetchItems();
    setSearchParams({ tab: activeTab });
    setSelected(null);
  }, [activeTab, statusFilter]);

  async function fetchPending() {
    try {
      const r = await api.get("/admin/dashboard");
      setPending(r.data.stats || {});
    } catch {}
  }

  async function fetchItems() {
    setLoading(true);
    try {
      const r = await api.get(`/admin/requests/${activeTab}`, {
        params: { status: statusFilter },
      });
      setItems(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleTab(key) {
    haptic("light");
    setActiveTab(key);
    setStatusFilter("pending");
  }

  if (selected) {
    return (
      <DetailView
        item={selected}
        type={activeTab}
        onBack={() => {
          setSelected(null);
          fetchItems();
          fetchPending();
        }}
      />
    );
  }

  const tab = TABS.find((t) => t.key === activeTab);

  return (
    <div className="page page-enter">
      {/* Header */}
      <div style={{ paddingTop: 20, paddingBottom: 12 }}>
        <p className="t-title">Requests</p>
      </div>

      {/* Tab scroll */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 16,
          scrollbarWidth: "none",
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {TABS.map((t) => {
          const count = pending[t.pendingKey] || 0;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                transition: "all .15s",
                background: isActive
                  ? t.color
                  : "var(--tg-theme-section-bg-color)",
                color: isActive ? "white" : "var(--tg-theme-text-color)",
                position: "relative",
              }}
            >
              {t.emoji} {t.label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: isActive ? "rgba(255,255,255,.3)" : t.color,
                    color: "white",
                    borderRadius: 10,
                    padding: "1px 6px",
                    fontSize: 11,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              haptic("light");
              setStatusFilter(s);
            }}
            style={{
              padding: "5px 12px",
              borderRadius: 16,
              border: `1px solid ${statusFilter === s ? tab.color : "var(--tg-theme-hint-color)"}`,
              background: statusFilter === s ? `${tab.color}18` : "transparent",
              color:
                statusFilter === s ? tab.color : "var(--tg-theme-hint-color)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 72, borderRadius: 12, marginBottom: 8 }}
            />
          ))}
        </>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{tab.emoji}</div>
          <p className="t-heading" style={{ marginBottom: 8 }}>
            No {tab.label}
          </p>
          <p className="t-caption">
            No {statusFilter} {tab.label.toLowerCase()} found.
          </p>
        </div>
      ) : (
        <div className="tg-section">
          {items.map((item) => (
            <RequestRow
              key={item.id}
              item={item}
              type={activeTab}
              color={tab.color}
              onClick={() => {
                haptic("light");
                setSelected(item);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Request Row ───────────────────────────────────────────────
function RequestRow({ item, type, color, onClick }) {
  const title = getTitle(type, item);
  const subtitle = getSubtitle(type, item);
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = new Date(item.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="tg-row" onClick={onClick}>
      <div className="tg-row-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--tg-theme-text-color)",
            }}
          >
            {title}
          </p>
          <StatusBadge status={item.status} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p className="tg-row-subtitle">{subtitle}</p>
          <p
            style={{
              fontSize: 11,
              color: "var(--tg-theme-hint-color)",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {date} · {time}
          </p>
        </div>
        {/* User info */}
        {item.user && (
          <p
            style={{
              fontSize: 11,
              color: "var(--tg-theme-hint-color)",
              marginTop: 2,
            }}
          >
            {item.user.username
              ? `@${item.user.username}`
              : item.user.firstName || "User"}
            {item.user.firstName && item.user.username
              ? ` · ${item.user.firstName}`
              : ""}
          </p>
        )}
      </div>
      <svg
        className="tg-chevron"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="m6 4 4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────
function DetailView({ item, type, onBack }) {
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(
    item.requestedAmount || item.amount || "",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tab = TABS.find((t) => t.key === type);
  const isPending =
    item.status === "pending" || (type === "tickets" && item.status === "open");

  async function handleAction(action) {
    if (action === "reject" && !note.trim()) {
      setError("Please provide a reason for rejection");
      haptic("medium");
      return;
    }
    setSubmitting(true);
    haptic("light");
    setError("");
    try {
      await api.post(`/admin/requests/${type}/${item.id}/${action}`, {
        note: note.trim(),
        approvedAmount: action === "approve" ? parseFloat(amount) : undefined,
      });
      hapticNotification("success");
      setSuccess(
        `${action === "approve" ? "Approved" : "Rejected"} successfully!`,
      );
      setTimeout(onBack, 1200);
    } catch (err) {
      hapticNotification("error");
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendMessage() {
    if (!message.trim()) return;
    setSubmitting(true);
    haptic("light");
    try {
      await api.post("/notify/send", {
        userId: item.userId,
        message: message.trim(),
      });
      hapticNotification("success");
      setMessage("");
      setShowMsgBox(false);
      setSuccess("Message sent!");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      hapticNotification("error");
      setError("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-enter">
      {/* Header */}
      <div
        style={{
          paddingTop: 20,
          paddingBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "var(--tg-theme-secondary-bg-color)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="m10 4-4 4 4 4"
              stroke="var(--tg-theme-hint-color)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p className="t-heading">
            {tab?.emoji} {getTitle(type, item)}
          </p>
          <p className="t-caption" style={{ marginTop: 1 }}>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* User info */}
      {item.user && (
        <>
          <p className="section-label">User</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            <div className="tg-row tg-row-static">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "var(--tg-theme-button-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--tg-theme-button-text-color)",
                }}
              >
                {(item.user.firstName ||
                  item.user.username ||
                  "?")[0].toUpperCase()}
              </div>
              <div className="tg-row-content">
                <p className="tg-row-title">
                  {item.user.firstName}
                  {item.user.lastName ? " " + item.user.lastName : ""}
                </p>
                {item.user.username && (
                  <p className="tg-row-subtitle">@{item.user.username}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Details */}
      <p className="section-label">Details</p>
      <div className="tg-section" style={{ marginBottom: 20 }}>
        {getDetailRows(type, item).map(({ label, value, highlight }) =>
          value ? (
            <div key={label} className="tg-row tg-row-static">
              <p
                className="tg-row-title"
                style={{
                  color: "var(--tg-theme-subtitle-text-color)",
                  fontSize: 14,
                }}
              >
                {label}
              </p>
              <p
                className="tg-row-right"
                style={{
                  fontWeight: 600,
                  maxWidth: "55%",
                  textAlign: "right",
                  color: highlight || "var(--tg-theme-text-color)",
                  fontSize: highlight ? 16 : 14,
                  wordBreak: "break-all",
                }}
              >
                {value}
              </p>
            </div>
          ) : null,
        )}
      </div>

      {/* Slip image */}
      {item.slipImageUrl && (
        <>
          <p className="section-label">Payment Slip</p>
          <div
            style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20 }}
          >
            <img
              src={item.slipImageUrl}
              alt="Slip"
              style={{
                width: "100%",
                display: "block",
                maxHeight: 320,
                objectFit: "contain",
                background: "var(--tg-theme-section-bg-color)",
              }}
            />
          </div>
        </>
      )}

      {/* Ticket photo */}
      {item.photoUrl && (
        <>
          <p className="section-label">Attachment</p>
          <div
            style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20 }}
          >
            <img
              src={item.photoUrl}
              alt="Attachment"
              style={{
                width: "100%",
                display: "block",
                maxHeight: 320,
                objectFit: "contain",
                background: "var(--tg-theme-section-bg-color)",
              }}
            />
          </div>
        </>
      )}

      {/* Admin note (existing) */}
      {item.adminNote && (
        <>
          <p className="section-label">Admin Note</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            <div className="tg-row tg-row-static">
              <p
                style={{
                  fontSize: 14,
                  color: "var(--tg-theme-text-color)",
                  lineHeight: 1.6,
                }}
              >
                {item.adminNote}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Success / Error */}
      {success && (
        <div
          style={{
            background: "rgba(52,199,89,.12)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <span>✅</span>
          <p style={{ fontSize: 13, color: "#1a7a35" }}>{success}</p>
        </div>
      )}
      {error && (
        <div
          style={{
            background: "rgba(255,59,48,.1)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <p
            style={{
              fontSize: 13,
              color: "var(--tg-theme-destructive-text-color)",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Actions — only if pending */}
      {isPending && (
        <>
          {/* Amount adjust (deposits/withdrawals only) */}
          {(type === "deposits" || type === "withdrawals") && (
            <>
              <p className="section-label">Approved Amount</p>
              <div className="tg-input-wrap" style={{ marginBottom: 16 }}>
                <div className="tg-input-row">
                  <span className="tg-input-label">Amount</span>
                  <input
                    className="tg-input"
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Rejection note */}
          <p className="section-label">
            Note{" "}
            <span
              style={{ fontWeight: 400, textTransform: "none", fontSize: 12 }}
            >
              (required for reject)
            </span>
          </p>
          <div
            style={{
              background: "var(--tg-theme-section-bg-color)",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <textarea
              placeholder="Add a note or reason..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "12px 16px",
                fontSize: 15,
                color: "var(--tg-theme-text-color)",
                fontFamily: "inherit",
                lineHeight: 1.5,
                resize: "none",
              }}
            />
          </div>

          {/* Approve / Reject */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: "#34C759" }}
              onClick={() => handleAction("approve")}
              disabled={submitting}
            >
              {submitting ? (
                <span
                  className="spinner"
                  style={{
                    borderColor: "white",
                    borderTopColor: "transparent",
                  }}
                />
              ) : (
                "✓ Approve"
              )}
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => handleAction("reject")}
              disabled={submitting}
            >
              ✕ Reject
            </button>
          </div>
        </>
      )}

      {/* Send message to user */}
      <button
        className="btn btn-ghost"
        onClick={() => setShowMsgBox((v) => !v)}
        style={{ marginBottom: showMsgBox ? 8 : 0 }}
      >
        💬 Send Message to User
      </button>

      {showMsgBox && (
        <>
          <div
            style={{
              background: "var(--tg-theme-section-bg-color)",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "12px 16px",
                fontSize: 15,
                color: "var(--tg-theme-text-color)",
                fontFamily: "inherit",
                lineHeight: 1.5,
                resize: "none",
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={submitting || !message.trim()}
            style={{ marginBottom: 12 }}
          >
            Send via Bot
          </button>
        </>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: { bg: "rgba(255,183,0,.15)", color: "#b37700" },
    approved: { bg: "rgba(52,199,89,.15)", color: "#1a7a35" },
    rejected: { bg: "rgba(255,59,48,.15)", color: "#cc2d24" },
    open: { bg: "rgba(52,199,89,.15)", color: "#1a7a35" },
    in_progress: { bg: "rgba(0,122,255,.15)", color: "#0055b3" },
    closed: { bg: "rgba(142,142,147,.15)", color: "#48484a" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.2,
        padding: "3px 8px",
        borderRadius: 20,
        flexShrink: 0,
        textTransform: "capitalize",
      }}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function getTitle(type, item) {
  switch (type) {
    case "deposits":
      return `Deposit · ${item.currency}`;
    case "withdrawals":
      return "Withdrawal";
    case "recoveries":
      return `Recovery · ${item.type || "recovery"}`;
    case "newids":
      return `New ID · ${item.requestedGameId}`;
    case "transfers":
      return "Chip Transfer";
    case "tickets":
      return "Support Ticket";
    default:
      return "Request";
  }
}

function getSubtitle(type, item) {
  switch (type) {
    case "deposits":
      return `${item.requestedAmount?.toLocaleString()} ${item.currency} · ${item.gameId?.gameId || "—"}`;
    case "withdrawals":
      return `${item.requestedAmount?.toLocaleString()} · ${item.gameId?.gameId || "—"}`;
    case "recoveries":
      return item.gameId?.gameId || "—";
    case "newids":
      return item.requestedGameId;
    case "transfers":
      return `${item.fromGameId?.gameId} → ${item.toGameId?.gameId} · ${item.amount?.toLocaleString()}`;
    case "tickets":
      return (
        item.message?.slice(0, 50) + (item.message?.length > 50 ? "…" : "")
      );
    default:
      return "";
  }
}

function getDetailRows(type, item) {
  switch (type) {
    case "deposits":
      return [
        { label: "Game ID", value: item.gameId?.gameId },
        { label: "Currency", value: item.currency },
        {
          label: "Requested",
          value: item.requestedAmount?.toLocaleString(),
          highlight: "#34C759",
        },
        {
          label: "Approved",
          value: item.approvedAmount?.toLocaleString(),
          highlight: "#34C759",
        },
        { label: "OCR Status", value: item.ocrStatus },
        {
          label: "OCR Match",
          value:
            item.ocrAmountMatch != null
              ? item.ocrAmountMatch
                ? "✅ Yes"
                : "❌ No"
              : null,
        },
      ];
    case "withdrawals":
      return [
        { label: "Game ID", value: item.gameId?.gameId },
        {
          label: "Requested",
          value: item.requestedAmount?.toLocaleString(),
          highlight: "#FF9500",
        },
        {
          label: "Approved",
          value: item.approvedAmount?.toLocaleString(),
          highlight: "#FF9500",
        },
      ];
    case "recoveries":
      return [
        { label: "Game ID", value: item.gameId?.gameId },
        { label: "Type", value: item.type },
      ];
    case "newids":
      return [
        {
          label: "Requested ID",
          value: item.requestedGameId,
          highlight: "#5856D6",
        },
        { label: "Assigned ID", value: item.gameId?.gameId },
      ];
    case "transfers":
      return [
        { label: "From", value: item.fromGameId?.gameId },
        { label: "To", value: item.toGameId?.gameId },
        {
          label: "Amount",
          value: `${item.amount?.toLocaleString()} chips`,
          highlight: "#FF2D55",
        },
      ];
    case "tickets":
      return [{ label: "Message", value: item.message }];
    default:
      return [];
  }
}
