import { useState, useEffect, useCallback } from "react";
import { haptic } from "../lib/telegram";
import api from "../lib/api";

const PAGE_SIZE = 20;

// Flatten and sort all request types by date
function flattenRequests(data) {
  if (!data) return [];
  const all = [
    ...(data.deposits || []).map((i) => ({ ...i, _type: "deposits" })),
    ...(data.withdrawals || []).map((i) => ({ ...i, _type: "withdrawals" })),
    ...(data.recoveries || []).map((i) => ({ ...i, _type: "recoveries" })),
    ...(data.newIds || []).map((i) => ({ ...i, _type: "newIds" })),
    ...(data.transfers || []).map((i) => ({ ...i, _type: "transfers" })),
    ...(data.tickets || []).map((i) => ({ ...i, _type: "tickets" })),
  ];
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function Requests() {
  const [allItems, setAllItems] = useState([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get("/users/me/requests")
      .then((r) => setAllItems(flattenRequests(r.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Infinite scroll
  const handleScroll = useCallback(
    (e) => {
      const el = e.target;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (nearBottom && visible < allItems.length) {
        setVisible((v) => Math.min(v + PAGE_SIZE, allItems.length));
      }
    },
    [visible, allItems.length],
  );

  const displayed = allItems.slice(0, visible);

  if (selected) {
    return (
      <DetailView
        item={selected}
        type={selected._type}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="page page-enter" onScroll={handleScroll}>
      <div style={{ paddingTop: 20, paddingBottom: 16 }}>
        <p className="t-title">My Requests</p>
        <p className="t-caption" style={{ marginTop: 2 }}>
          {loading ? "Loading..." : `${allItems.length} total requests`}
        </p>
      </div>

      {loading ? (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 68, borderRadius: 12, marginBottom: 8 }}
            />
          ))}
        </>
      ) : allItems.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p className="t-heading" style={{ marginBottom: 8 }}>
            No Requests Yet
          </p>
          <p className="t-caption" style={{ lineHeight: 1.6 }}>
            Your deposits, withdrawals, and other requests will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="tg-section">
            {displayed.map((item, idx) => (
              <RequestRow
                key={`${item._type}-${item.id}`}
                item={item}
                type={item._type}
                showDivider={idx < displayed.length - 1}
                onClick={() => {
                  haptic("light");
                  setSelected(item);
                }}
              />
            ))}
          </div>

          {/* Load more indicator */}
          {visible < allItems.length ? (
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              <div
                className="spinner"
                style={{
                  borderColor: "var(--tg-theme-hint-color)",
                  borderTopColor: "transparent",
                  margin: "0 auto",
                }}
              />
            </div>
          ) : allItems.length > PAGE_SIZE ? (
            <p
              className="t-caption"
              style={{ textAlign: "center", padding: "16px 0" }}
            >
              All {allItems.length} requests loaded
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

// ── Request Row ──────────────────────────────────────────────
function RequestRow({ item, type, onClick }) {
  const { emoji, label } = TYPE_META[type] || {};
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
      {/* Type icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background:
            TYPE_META[type]?.bg || "var(--tg-theme-secondary-bg-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {emoji}
      </div>

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
      </div>
    </div>
  );
}

// ── Detail View ──────────────────────────────────────────────
function DetailView({ item, type, onBack }) {
  const title = getTitle(type, item);
  const { emoji } = TYPE_META[type] || {};

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
            {emoji} {title}
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

      {/* Admin note */}
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
                  width: "100%",
                }}
              >
                {item.adminNote}
              </p>
            </div>
          </div>
        </>
      )}

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
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────
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

// ── Type metadata ─────────────────────────────────────────────
const TYPE_META = {
  deposits: { emoji: "💰", label: "Deposit", bg: "rgba(52,199,89,.12)" },
  withdrawals: { emoji: "💸", label: "Withdrawal", bg: "rgba(255,149,0,.12)" },
  recoveries: { emoji: "🔄", label: "Recovery", bg: "rgba(0,122,255,.12)" },
  newIds: { emoji: "🆕", label: "New ID", bg: "rgba(88,86,214,.12)" },
  transfers: { emoji: "🔀", label: "Transfer", bg: "rgba(255,45,85,.12)" },
  tickets: { emoji: "🎫", label: "Support", bg: "rgba(50,173,230,.12)" },
};

// ── Helpers ───────────────────────────────────────────────────
function getTitle(type, item) {
  switch (type) {
    case "deposits":
      return `Deposit · ${item.currency}`;
    case "withdrawals":
      return "Withdrawal";
    case "recoveries":
      return "Recovery";
    case "newIds":
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
      return `${item.requestedAmount?.toLocaleString()} ${item.currency}`;
    case "withdrawals":
      return `${item.requestedAmount?.toLocaleString()}`;
    case "recoveries":
      return item.gameId?.gameId || "—";
    case "newIds":
      return item.requestedGameId;
    case "transfers":
      return `${item.amount?.toLocaleString()} chips · ${item.fromGameId?.gameId} → ${item.toGameId?.gameId}`;
    case "tickets":
      return (
        item.message?.slice(0, 45) + (item.message?.length > 45 ? "…" : "")
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
        { label: "Status", value: item.status },
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
        { label: "Status", value: item.status },
      ];
    case "recoveries":
      return [
        { label: "Game ID", value: item.gameId?.gameId },
        { label: "Type", value: item.type },
        { label: "Status", value: item.status },
      ];
    case "newIds":
      return [
        {
          label: "Requested ID",
          value: item.requestedGameId,
          highlight: "#5856D6",
        },
        { label: "Assigned ID", value: item.gameId?.gameId },
        { label: "Status", value: item.status },
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
        { label: "Status", value: item.status },
      ];
    case "tickets":
      return [
        { label: "Message", value: item.message },
        { label: "Status", value: item.status },
      ];
    default:
      return [];
  }
}
