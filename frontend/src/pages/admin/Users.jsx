import { useState, useEffect } from "react";
import { haptic, hapticNotification } from "../../lib/telegram";
import api from "../../lib/api";

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchUsers("");
  }, []);

  async function fetchUsers(q) {
    setLoading(true);
    try {
      const r = await api.get("/admin/users", { params: { q } });
      setUsers(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  if (selected) {
    return (
      <UserProfile userId={selected.id} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="page page-enter">
      <div style={{ paddingTop: 20, paddingBottom: 12 }}>
        <p className="t-title">Users</p>
      </div>

      {/* Search */}
      <div
        style={{
          background: "var(--tg-theme-section-bg-color)",
          borderRadius: 12,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="var(--tg-theme-hint-color)"
            strokeWidth="1.5"
          />
          <path
            d="m11 11 2.5 2.5"
            stroke="var(--tg-theme-hint-color)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "13px 0",
            fontSize: 15,
            color: "var(--tg-theme-text-color)",
            fontFamily: "inherit",
          }}
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tg-theme-hint-color)",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 64, borderRadius: 12, marginBottom: 8 }}
            />
          ))}
        </>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p className="t-heading" style={{ marginBottom: 8 }}>
            No users found
          </p>
          <p className="t-caption">Try a different search term.</p>
        </div>
      ) : (
        <div className="tg-section">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onClick={() => {
                haptic("light");
                setSelected(user);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────
function UserRow({ user, onClick }) {
  const initials = (user.firstName || user.username || "?")[0].toUpperCase();
  const roleColor = { admin: "#007AFF", superadmin: "#5856D6" }[user.role];

  return (
    <div className="tg-row" onClick={onClick}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          flexShrink: 0,
          background: roleColor
            ? `${roleColor}22`
            : "var(--tg-theme-button-color)",
          border: roleColor ? `1.5px solid ${roleColor}55` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 700,
          color: roleColor || "var(--tg-theme-button-text-color)",
        }}
      >
        {initials}
      </div>
      <div className="tg-row-content">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p className="tg-row-title">
            {user.firstName}
            {user.lastName ? " " + user.lastName : ""}
          </p>
          {user.role !== "user" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: roleColor,
                background: `${roleColor}18`,
                padding: "1px 6px",
                borderRadius: 8,
              }}
            >
              {user.role}
            </span>
          )}
        </div>
        <p className="tg-row-subtitle">
          {user.username ? `@${user.username}` : `ID: ${user.telegramId}`}
        </p>
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// User Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UserProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("all");
  const [requests, setRequests] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, [userId]);

  useEffect(() => {
    if (tab === "requests") fetchRequests();
    if (tab === "timeline") fetchTimeline();
  }, [tab, sessionId]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const r = await api.get(`/admin/users/${userId}`);
      setProfile(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function fetchSessions() {
    try {
      const r = await api.get("/admin/sessions");
      setSessions(r.data);
    } catch {}
  }

  async function fetchRequests() {
    try {
      const r = await api.get(`/admin/users/${userId}/requests`, {
        params: { sessionId: sessionId !== "all" ? sessionId : undefined },
      });
      setRequests(r.data);
    } catch {}
  }

  async function fetchTimeline() {
    try {
      const r = await api.get(`/admin/users/${userId}/timeline`, {
        params: { sessionId: sessionId !== "all" ? sessionId : undefined },
      });
      setTimeline(r.data);
    } catch {}
  }

  async function sendMessage() {
    if (!message.trim()) return;
    setSending(true);
    haptic("light");
    try {
      await api.post("/notify/send", { userId, message: message.trim() });
      hapticNotification("success");
      setMessage("");
      setShowMsg(false);
      setMsgSuccess(true);
      setTimeout(() => setMsgSuccess(false), 2500);
    } catch {
      hapticNotification("error");
    } finally {
      setSending(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="page page-enter">
        <div
          style={{
            paddingTop: 20,
            paddingBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <BackButton onClick={onBack} />
          <div
            className="skeleton"
            style={{ width: 140, height: 22, borderRadius: 8 }}
          />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 80, borderRadius: 12, marginBottom: 12 }}
          />
        ))}
      </div>
    );
  }

  const { user, stats, gameIds } = profile;
  const initials = (user.firstName || user.username || "?")[0].toUpperCase();
  const roleColor = {
    admin: "#007AFF",
    superadmin: "#5856D6",
    user: "var(--tg-theme-button-color)",
  }[user.role];

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
        <BackButton onClick={onBack} />
        <p className="t-heading">User Profile</p>
      </div>

      {/* Profile card */}
      <div
        style={{
          background: "var(--tg-theme-section-bg-color)",
          borderRadius: 16,
          padding: "20px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            flexShrink: 0,
            background: `${roleColor}22`,
            border: `2px solid ${roleColor}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: roleColor,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <p
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--tg-theme-text-color)",
              }}
            >
              {user.firstName}
              {user.lastName ? " " + user.lastName : ""}
            </p>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: roleColor,
                background: `${roleColor}18`,
                padding: "2px 7px",
                borderRadius: 8,
              }}
            >
              {user.role}
            </span>
          </div>
          {user.username && (
            <p style={{ fontSize: 13, color: "var(--tg-theme-hint-color)" }}>
              @{user.username}
            </p>
          )}
          <p
            style={{
              fontSize: 12,
              color: "var(--tg-theme-hint-color)",
              marginTop: 2,
            }}
          >
            Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {user.language?.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Send message */}
      <button
        className="btn btn-ghost"
        onClick={() => setShowMsg((v) => !v)}
        style={{ marginBottom: showMsg ? 8 : 16 }}
      >
        💬 Send Message via Bot
      </button>

      {showMsg && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              background: "var(--tg-theme-section-bg-color)",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <textarea
              placeholder="Type your message…"
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
            onClick={sendMessage}
            disabled={sending || !message.trim()}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      )}

      {msgSuccess && (
        <div
          style={{
            background: "rgba(52,199,89,.12)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>✅</span>
          <p style={{ fontSize: 13, color: "#1a7a35" }}>Message sent!</p>
        </div>
      )}

      {/* Session filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "var(--tg-theme-hint-color)",
            flexShrink: 0,
          }}
        >
          Session:
        </p>
        <div
          style={{
            overflowX: "auto",
            display: "flex",
            gap: 6,
            scrollbarWidth: "none",
          }}
        >
          <FilterPill
            label="All time"
            active={sessionId === "all"}
            onClick={() => setSessionId("all")}
          />
          {sessions.map((s) => (
            <FilterPill
              key={s.id}
              label={s.name || `Session ${s.id}`}
              active={sessionId === String(s.id)}
              onClick={() => setSessionId(String(s.id))}
            />
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}
      >
        {[
          { key: "summary", label: "📊 Summary" },
          { key: "requests", label: "📋 Requests" },
          { key: "gameids", label: "🎮 Game IDs" },
          { key: "timeline", label: "🕐 Timeline" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              haptic("light");
              setTab(t.key);
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              background:
                tab === t.key
                  ? "var(--tg-theme-button-color)"
                  : "var(--tg-theme-section-bg-color)",
              color:
                tab === t.key
                  ? "var(--tg-theme-button-text-color)"
                  : "var(--tg-theme-text-color)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Summary ── */}
      {tab === "summary" && (
        <>
          <p className="section-label">Lifetime Stats</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            {[
              {
                label: "Deposits",
                value: stats.totalDeposits,
                sub: stats.totalDepositAmount
                  ? `${Number(stats.totalDepositAmount).toLocaleString()} total`
                  : null,
              },
              {
                label: "Withdrawals",
                value: stats.totalWithdrawals,
                sub: stats.totalWithdrawalAmount
                  ? `${Number(stats.totalWithdrawalAmount).toLocaleString()} total`
                  : null,
              },
              { label: "Recoveries", value: stats.totalRecoveries, sub: null },
              { label: "New IDs", value: stats.totalNewIds, sub: null },
              { label: "Tickets", value: stats.totalTickets, sub: null },
              { label: "Game IDs", value: gameIds.length, sub: null },
            ].map((row) => (
              <div key={row.label} className="tg-row tg-row-static">
                <div className="tg-row-content">
                  <p
                    className="tg-row-title"
                    style={{
                      color: "var(--tg-theme-subtitle-text-color)",
                      fontSize: 14,
                    }}
                  >
                    {row.label}
                  </p>
                  {row.sub && <p className="tg-row-subtitle">{row.sub}</p>}
                </div>
                <p
                  className="tg-row-right"
                  style={{ fontWeight: 700, fontSize: 18 }}
                >
                  {row.value ?? 0}
                </p>
              </div>
            ))}
          </div>

          <p className="section-label">Account Info</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            {[
              { label: "Telegram ID", value: String(user.telegramId) },
              {
                label: "Language",
                value: user.language === "dv" ? "Dhivehi" : "English",
              },
              {
                label: "Broadcasts",
                value: user.broadcastOptIn ? "✅ Opted in" : "❌ Opted out",
              },
              {
                label: "TnC Accepted",
                value: user.tncAccepted ? "✅ Yes" : "❌ No",
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
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Requests ── */}
      {tab === "requests" &&
        (requests === null ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 64, borderRadius: 12, marginBottom: 8 }}
              />
            ))}
          </>
        ) : requests.length === 0 ? (
          <EmptyState emoji="📋" text="No requests found" />
        ) : (
          <div className="tg-section">
            {requests.map((req) => (
              <RequestSummaryRow key={`${req.type}-${req.id}`} req={req} />
            ))}
          </div>
        ))}

      {/* ── Game IDs ── */}
      {tab === "gameids" &&
        (gameIds.length === 0 ? (
          <EmptyState emoji="🎮" text="No game IDs associated" />
        ) : (
          <div className="tg-section">
            {gameIds.map((gid) => (
              <div key={gid.id} className="tg-row tg-row-static">
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: "rgba(88,86,214,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  🎮
                </div>
                <div className="tg-row-content">
                  <p
                    className="tg-row-title"
                    style={{ fontFamily: "monospace", fontSize: 14 }}
                  >
                    {gid.gameId}
                  </p>
                  <p className="tg-row-subtitle">
                    {gid.lastInteractedUserId === user.id
                      ? "👑 Current owner · "
                      : ""}
                    Added{" "}
                    {new Date(gid.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* ── Timeline ── */}
      {tab === "timeline" &&
        (timeline.length === 0 ? (
          <EmptyState emoji="🕐" text="No activity found" />
        ) : (
          <div style={{ position: "relative", paddingLeft: 8 }}>
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 8,
                bottom: 8,
                width: 2,
                background: "var(--tg-theme-section-bg-color)",
              }}
            />
            {timeline.map((log, i) => (
              <TimelineRow
                key={log.id}
                log={log}
                isLast={i === timeline.length - 1}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

// ── Timeline Row ──────────────────────────────────────────────
function TimelineRow({ log, isLast }) {
  const actionMeta = {
    "deposit-created": { label: "Deposit submitted", dot: "#34C759" },
    "deposit-approved": { label: "Deposit approved", dot: "#34C759" },
    "deposit-rejected": { label: "Deposit rejected", dot: "#FF3B30" },
    "withdrawal-created": { label: "Withdrawal submitted", dot: "#FF9500" },
    "withdrawal-approved": { label: "Withdrawal approved", dot: "#FF9500" },
    "withdrawal-rejected": { label: "Withdrawal rejected", dot: "#FF3B30" },
    "recovery-created": { label: "Recovery submitted", dot: "#007AFF" },
    "recovery-approved": { label: "Recovery approved", dot: "#007AFF" },
    "recovery-rejected": { label: "Recovery rejected", dot: "#FF3B30" },
    "newid-created": { label: "New ID requested", dot: "#5856D6" },
    "newid-approved": { label: "New ID approved", dot: "#5856D6" },
    "newid-rejected": { label: "New ID rejected", dot: "#FF3B30" },
    "transfer-created": { label: "Chip transfer submitted", dot: "#FF2D55" },
    "transfer-approved": { label: "Chip transfer approved", dot: "#FF2D55" },
    "ticket-created": { label: "Support ticket opened", dot: "#32ADE6" },
    "ticket-closed": { label: "Ticket closed", dot: "#8E8E93" },
  };
  const key = `${log.entityType}-${log.action}`;
  const meta = actionMeta[key] || {
    label: `${log.entityType} ${log.action}`,
    dot: "#8E8E93",
  };

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: isLast ? 0 : 12 }}>
      <div
        style={{
          flexShrink: 0,
          width: 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 4,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: meta.dot,
            flexShrink: 0,
            border: "2px solid var(--tg-theme-bg-color)",
            zIndex: 1,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          background: "var(--tg-theme-section-bg-color)",
          borderRadius: 12,
          padding: "10px 14px",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--tg-theme-text-color)",
            marginBottom: 2,
          }}
        >
          {meta.label}
        </p>
        <p style={{ fontSize: 11, color: "var(--tg-theme-hint-color)" }}>
          {new Date(log.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ── Request Summary Row ───────────────────────────────────────
function RequestSummaryRow({ req }) {
  const TYPE_META = {
    deposit: { emoji: "💰", color: "#34C759" },
    withdrawal: { emoji: "💸", color: "#FF9500" },
    recovery: { emoji: "🔄", color: "#007AFF" },
    newid: { emoji: "🆕", color: "#5856D6" },
    transfer: { emoji: "🔀", color: "#FF2D55" },
    ticket: { emoji: "🎫", color: "#32ADE6" },
  };
  const meta = TYPE_META[req.type] || { emoji: "•", color: "#8E8E93" };
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
        <p className="tg-row-title" style={{ textTransform: "capitalize" }}>
          {req.type}
        </p>
        <p className="tg-row-subtitle">
          {new Date(req.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          {req.amount ? ` · ${Number(req.amount).toLocaleString()}` : ""}
          {req.gameId ? ` · ${req.gameId}` : ""}
        </p>
      </div>
      <StatusBadge status={req.status} />
    </div>
  );
}

// ── Shared small components ───────────────────────────────────
function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
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
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick();
      }}
      style={{
        flexShrink: 0,
        padding: "5px 12px",
        borderRadius: 16,
        border: `1px solid ${active ? "var(--tg-theme-button-color)" : "var(--tg-theme-hint-color)"}`,
        background: active ? "var(--tg-theme-button-color)" : "transparent",
        color: active
          ? "var(--tg-theme-button-text-color)"
          : "var(--tg-theme-hint-color)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

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

function EmptyState({ emoji, text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <p className="t-caption">{text}</p>
    </div>
  );
}
