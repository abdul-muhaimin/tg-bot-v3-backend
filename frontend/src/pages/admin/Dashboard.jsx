import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { haptic, hapticNotification } from "../../lib/telegram";
import api from "../../lib/api";

export default function AdminDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [session, setSession] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [dashRes, actRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/dashboard/activity"),
      ]);
      setStats(dashRes.data.stats);
      setSession(dashRes.data.session);
      setActivity(actRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function toggleSession() {
    haptic("medium");
    setToggling(true);
    try {
      if (session?.status === "open") {
        await api.post("/admin/sessions/close");
        hapticNotification("success");
      } else {
        const name = `Session ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        await api.post("/admin/sessions/open", { name });
        hapticNotification("success");
      }
      fetchAll();
    } catch (err) {
      hapticNotification("error");
    } finally {
      setToggling(false);
    }
  }

  const isOpen = session?.status === "open";

  return (
    <div className="page page-enter">
      {/* Header */}
      <div
        style={{
          paddingTop: 20,
          paddingBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="t-title">Dashboard</p>
          <p className="t-caption" style={{ marginTop: 2 }}>
            {user?.firstName ? `Welcome, ${user.firstName}` : "Admin Panel"}
          </p>
        </div>

        {/* Session toggle */}
        <button
          onClick={toggleSession}
          disabled={toggling}
          style={{
            background: isOpen ? "rgba(255,59,48,.12)" : "rgba(52,199,89,.12)",
            border: `1.5px solid ${isOpen ? "rgba(255,59,48,.3)" : "rgba(52,199,89,.3)"}`,
            borderRadius: 20,
            padding: "6px 14px",
            color: isOpen ? "#cc2d24" : "#1a7a35",
            fontSize: 13,
            fontWeight: 700,
            cursor: toggling ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: toggling ? 0.6 : 1,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isOpen ? "#FF3B30" : "#34C759",
              flexShrink: 0,
            }}
          />
          {toggling ? "..." : isOpen ? "Close Session" : "Open Session"}
        </button>
      </div>

      {/* Session info card */}
      <div
        style={{
          background: isOpen ? "rgba(52,199,89,.08)" : "rgba(142,142,147,.08)",
          border: `1px solid ${isOpen ? "rgba(52,199,89,.2)" : "rgba(142,142,147,.2)"}`,
          borderRadius: 14,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            flexShrink: 0,
            background: isOpen
              ? "rgba(52,199,89,.15)"
              : "rgba(142,142,147,.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {isOpen ? "🟢" : "🔴"}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--tg-theme-text-color)",
            }}
          >
            {isOpen ? session?.name || "Active Session" : "System Closed"}
          </p>
          <p className="t-caption" style={{ marginTop: 2 }}>
            {isOpen && session?.openedAt
              ? `Opened ${new Date(session.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : "No active session"}
          </p>
        </div>
      </div>

      {/* Pending counts */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 80, borderRadius: 14 }}
            />
          ))}
        </div>
      ) : (
        <>
          <p className="section-label">Pending Requests</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Deposits",
                count: stats?.pendingDeposits,
                color: "#34C759",
                emoji: "💰",
                path: "/admin/requests?tab=deposits",
              },
              {
                label: "Withdrawals",
                count: stats?.pendingWithdrawals,
                color: "#FF9500",
                emoji: "💸",
                path: "/admin/requests?tab=withdrawals",
              },
              {
                label: "Recoveries",
                count: stats?.pendingRecoveries,
                color: "#007AFF",
                emoji: "🔄",
                path: "/admin/requests?tab=recoveries",
              },
              {
                label: "New IDs",
                count: stats?.pendingNewIds,
                color: "#5856D6",
                emoji: "🆕",
                path: "/admin/requests?tab=newids",
              },
              {
                label: "Transfers",
                count: stats?.pendingTransfers,
                color: "#FF2D55",
                emoji: "🔀",
                path: "/admin/requests?tab=transfers",
              },
              {
                label: "Support",
                count: stats?.pendingTickets,
                color: "#32ADE6",
                emoji: "🎫",
                path: "/admin/requests?tab=tickets",
              },
            ].map((item) => (
              <StatCard
                key={item.label}
                {...item}
                onClick={() => {
                  haptic("light");
                  navigate(item.path);
                }}
              />
            ))}
          </div>

          {/* Session totals */}
          <p className="section-label">This Session</p>
          <div className="tg-section" style={{ marginBottom: 24 }}>
            {[
              {
                label: "Total Deposits",
                value: stats?.totalDeposits || 0,
                suffix: "",
              },
              {
                label: "Total Withdrawals",
                value: stats?.totalWithdrawals || 0,
                suffix: "",
              },
              {
                label: "Total Recoveries",
                value: stats?.totalRecoveries || 0,
                suffix: "",
              },
              {
                label: "Active Users",
                value: stats?.activeUsers || 0,
                suffix: "",
              },
            ].map((row) => (
              <div key={row.label} className="tg-row tg-row-static">
                <p
                  className="tg-row-title"
                  style={{
                    color: "var(--tg-theme-subtitle-text-color)",
                    fontSize: 14,
                  }}
                >
                  {row.label}
                </p>
                <p
                  className="tg-row-right"
                  style={{ fontWeight: 700, fontSize: 16 }}
                >
                  {row.value.toLocaleString()}
                  {row.suffix}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent activity */}
      <p className="section-label">Recent Activity</p>
      {activity.length === 0 && !loading ? (
        <div className="tg-section">
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p className="t-caption">No activity yet this session</p>
          </div>
        </div>
      ) : (
        <div className="tg-section">
          {activity.slice(0, 20).map((log) => (
            <ActivityRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, count, color, emoji, onClick }) {
  const hasPending = count > 0;
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--tg-theme-section-bg-color)",
        borderRadius: 14,
        padding: "14px",
        cursor: "pointer",
        border: hasPending
          ? `1.5px solid ${color}40`
          : "1.5px solid transparent",
        position: "relative",
        overflow: "hidden",
        transition: "opacity .15s",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: hasPending ? color : "var(--tg-theme-text-color)",
          lineHeight: 1,
        }}
      >
        {count ?? "—"}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--tg-theme-subtitle-text-color)",
          marginTop: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      {hasPending && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
    </div>
  );
}

// ── Activity Row ──────────────────────────────────────────
function ActivityRow({ log }) {
  const META = {
    deposit: { emoji: "💰", color: "#34C759" },
    withdrawal: { emoji: "💸", color: "#FF9500" },
    recovery: { emoji: "🔄", color: "#007AFF" },
    newid: { emoji: "🆕", color: "#5856D6" },
    transfer: { emoji: "🔀", color: "#FF2D55" },
    ticket: { emoji: "🎫", color: "#32ADE6" },
    session: { emoji: "📋", color: "#8E8E93" },
    user: { emoji: "👤", color: "#8E8E93" },
  };
  const meta = META[log.entityType] || { emoji: "•", color: "#8E8E93" };
  const time = new Date(log.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(log.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="tg-row tg-row-static">
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          flexShrink: 0,
          background: `${meta.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {meta.emoji}
      </div>
      <div className="tg-row-content">
        <p
          style={{
            fontSize: 13,
            color: "var(--tg-theme-text-color)",
            fontWeight: 500,
          }}
        >
          {formatAction(log)}
        </p>
        <p className="t-caption" style={{ marginTop: 2 }}>
          {log.user?.username
            ? `@${log.user.username}`
            : log.user?.firstName || "User"}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: "var(--tg-theme-hint-color)" }}>
          {time}
        </p>
        <p style={{ fontSize: 11, color: "var(--tg-theme-hint-color)" }}>
          {date}
        </p>
      </div>
    </div>
  );
}

function formatAction(log) {
  const type = log.entityType;
  const action = log.action;
  const map = {
    "deposit-created": "New deposit request",
    "deposit-approved": "Deposit approved",
    "deposit-rejected": "Deposit rejected",
    "withdrawal-created": "New withdrawal request",
    "withdrawal-approved": "Withdrawal approved",
    "withdrawal-rejected": "Withdrawal rejected",
    "recovery-created": "New recovery request",
    "recovery-approved": "Recovery approved",
    "newid-created": "New ID request",
    "newid-approved": "New ID approved",
    "transfer-created": "Chip transfer request",
    "ticket-created": "New support ticket",
    "session-opened": "Session opened",
    "session-closed": "Session closed",
  };
  return map[`${type}-${action}`] || `${type} ${action}`;
}
