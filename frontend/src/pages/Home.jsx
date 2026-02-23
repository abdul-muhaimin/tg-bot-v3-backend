import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { haptic } from "../lib/telegram";
import HomeBanner from "../components/HomeBanner";

const features = [
  {
    key: "deposit",
    configKey: "deposit_enabled",
    label: "Deposit",
    subtitle: "Submit a deposit request",
    path: "/deposit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#34C759",
  },
  {
    key: "withdrawal",
    configKey: "withdrawal_enabled",
    label: "Withdraw",
    subtitle: "Request a withdrawal",
    path: "/withdraw",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#FF9500",
  },
  {
    key: "recovery",
    configKey: "recovery_enabled",
    label: "Recovery",
    subtitle: "Request account recovery",
    path: "/recovery",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 3v5h5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#007AFF",
  },
  {
    key: "newid",
    configKey: "newid_enabled",
    label: "New ID",
    subtitle: "Register a new game ID",
    path: "/newid",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.2" />
        <path
          d="M12 8v8M8 12h8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    ),
    color: "#5856D6",
  },
  {
    key: "chiptransfer",
    configKey: "chiptransfer_enabled",
    label: "Chip Transfer",
    subtitle: "Transfer chips between IDs",
    path: "/transfer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12h14M15 6l6 6-6 6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#FF2D55",
  },
  {
    key: "support",
    configKey: "support_enabled",
    label: "Support",
    subtitle: "Open a support ticket",
    path: "/support",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#32ADE6",
  },
];

export default function Home() {
  const { user, config, featureEnabled } = useApp();
  const navigate = useNavigate();

  function handleFeature(feature) {
    if (!featureEnabled(feature.configKey)) return;
    haptic("light");
    navigate(feature.path);
  }

  const name = user?.nickname || user?.firstName || "there";
  const activeFeatures = features.filter((f) => featureEnabled(f.configKey));

  return (
    <div className="page page-enter">
      {/* ── Greeting ── */}
      <div style={{ paddingTop: 24, paddingBottom: 8 }}>
        <p className="t-caption">Welcome back</p>
        <p className="t-title" style={{ marginTop: 2 }}>
          {name}
          {user?.isVip && (
            <span
              className="badge badge-vip"
              style={{ marginLeft: 8, fontSize: 11 }}
            >
              VIP
            </span>
          )}
        </p>
      </div>

      {/* ── Banner ── */}
      <HomeBanner />

      {/* ── Session status ── */}
      {/* <div className="tg-section" style={{ marginTop: 16, marginBottom: 0 }}>
        <div className="tg-row tg-row-static">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#34C759",
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(52,199,89,.2)",
            }}
          />
          <div className="tg-row-content">
            <p className="tg-row-title">System Open</p>
          </div>
          <p className="tg-row-right t-caption">{config?.app_name || "App"}</p>
        </div>
      </div> */}

      {/* ── Quick stats ── */}
      {/* <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        <StatCard
          label="Session Deposits"
          value={user?.currentSessionDepositCount ?? 0}
          amount={user?.currentSessionDepositAmount ?? 0}
          color="#34C759"
        />
        <StatCard
          label="All Time Deposits"
          value={user?.allTimeDepositCount ?? 0}
          amount={user?.allTimeDepositAmount ?? 0}
          color="#007AFF"
        />
      </div> */}

      {/* ── Features ── */}
      <p className="section-label" style={{ marginTop: 24 }}>
        Services
      </p>
      <div className="tg-section">
        {activeFeatures.map((feature, i) => (
          <div
            key={feature.key}
            className="tg-row"
            onClick={() => handleFeature(feature)}
          >
            <div className="tg-row-icon" style={{ background: feature.color }}>
              {feature.icon}
            </div>
            <div className="tg-row-content">
              <p className="tg-row-title">{feature.label}</p>
              <p className="tg-row-subtitle">{feature.subtitle}</p>
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
        ))}
      </div>

      {/* ── My Requests link ── */}
      <div className="tg-section">
        <div
          className="tg-row"
          onClick={() => {
            haptic("light");
            navigate("/requests");
          }}
        >
          <div className="tg-row-icon" style={{ background: "#636366" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="14 2 14 8 20 8"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="tg-row-content">
            <p className="tg-row-title">My Requests</p>
            <p className="tg-row-subtitle">View all your submissions</p>
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
      </div>
    </div>
  );
}

function StatCard({ label, value, amount, color }) {
  return (
    <div
      style={{
        background: "var(--tg-theme-section-bg-color)",
        borderRadius: 12,
        padding: "14px 14px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--tg-theme-subtitle-text-color)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: color,
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--tg-theme-subtitle-text-color)",
          marginTop: 4,
        }}
      >
        {amount.toLocaleString()} total
      </p>
    </div>
  );
}
