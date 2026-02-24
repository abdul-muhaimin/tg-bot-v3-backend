import { useState, useEffect } from "react";
import { haptic, hapticNotification } from "../../lib/telegram";
import api from "../../lib/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Root — controls which view is shown
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AdminUsers() {
  const [view, setView] = useState("list"); // list | profile | gameid
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  function openProfile(user) {
    haptic("light");
    setSelectedUser(user);
    setView("profile");
  }

  function openGameId(gid) {
    haptic("light");
    setSelectedGameId(gid);
    setView("gameid");
  }

  function goBack() {
    if (view === "gameid") {
      setView("profile");
    } else {
      setView("list");
      setSelectedUser(null);
    }
  }

  if (view === "profile" && selectedUser) {
    return (
      <UserProfile
        user={selectedUser}
        onBack={goBack}
        onGameIdTap={openGameId}
      />
    );
  }

  if (view === "gameid" && selectedGameId) {
    return <GameIdDetail gameId={selectedGameId} onBack={goBack} />;
  }

  return <UsersList onUserTap={openProfile} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// View 1 — Users List
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UsersList({ onUserTap }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(t);
  }, [query]);

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

  return (
    <div className="page page-enter">
      <div style={{ paddingTop: 20, paddingBottom: 12 }}>
        <p className="t-title">Users</p>
      </div>

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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
        <EmptyState
          emoji="👥"
          title="No users found"
          subtitle="Try a different search term."
        />
      ) : (
        <div className="tg-section">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onClick={() => onUserTap(user)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// View 2 — User Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UserProfile({ user, onBack, onGameIdTap }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [requests, setRequests] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [tlLoading, setTlLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, [user.id]);

  useEffect(() => {
    if (activeTab === "requests") loadRequests();
    if (activeTab === "timeline") loadTimeline();
  }, [activeTab, sessionId]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get(`/admin/users/${user.id}`);
      setProfile(r.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Error ${err.response?.status || "network"}: ${JSON.stringify(err.response?.data) || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const r = await api.get("/admin/sessions");
      setSessions(r.data || []);
    } catch {}
  }

  async function loadRequests() {
    setReqLoading(true);
    try {
      const r = await api.get(`/admin/users/${user.id}/requests`, {
        params: { sessionId: sessionId !== "all" ? sessionId : undefined },
      });
      setRequests(r.data);
    } catch {
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  }

  async function loadTimeline() {
    setTlLoading(true);
    try {
      const r = await api.get(`/admin/users/${user.id}/timeline`, {
        params: { sessionId: sessionId !== "all" ? sessionId : undefined },
      });
      setTimeline(r.data);
    } catch {
      setTimeline([]);
    } finally {
      setTlLoading(false);
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;
    setSending(true);
    haptic("light");
    try {
      await api.post("/notify/send", {
        userId: user.id,
        message: message.trim(),
      });
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

  const roleColor =
    {
      admin: "#007AFF",
      superadmin: "#5856D6",
      user: "var(--tg-theme-button-color)",
    }[user.role] || "var(--tg-theme-button-color)";
  const initials = (user.firstName || user.username || "?")[0].toUpperCase();

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
        <p className="t-heading">User Profile</p>
      </div>

      {/* Profile card — always shown */}
      <div
        style={{
          background: "var(--tg-theme-secondary-bg-color)",
          border: "none",
          borderRadius: 16,
          padding: "18px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            flexShrink: 0,
            background: "var(--tg-theme-secondary-bg-color)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            fontWeight: 700,
            color: "var(--tg-theme-text-color)",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 3,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: 16,
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
                color: "var(--tg-theme-text-color)",
                background: "var(--tg-theme-secondary-bg-color)",
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
              fontSize: 11,
              color: "var(--tg-theme-hint-color)",
              marginTop: 2,
            }}
          >
            ID: {String(user.telegramId)} · Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(255,59,48,.1)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#cc2d24",
              marginBottom: 4,
            }}
          >
            Failed to load profile data
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#cc2d24",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {error}
          </p>
          <button
            className="btn btn-ghost"
            onClick={loadProfile}
            style={{ marginTop: 10, fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !error && (
        <>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 70, borderRadius: 12, marginBottom: 10 }}
            />
          ))}
        </>
      )}

      {/* Content */}
      {!loading && !error && profile && (
        <>
          {/* Session filter */}
          {sessions.length > 0 && (
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
                <Pill
                  label="All time"
                  active={sessionId === null}
                  onClick={() => setSessionId(null)}
                />
                {sessions.map((s) => (
                  <Pill
                    key={s.id}
                    label={s.name || `Session ${s.id}`}
                    active={sessionId === s.id}
                    onClick={() => setSessionId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sub-tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            {[
              { key: "summary", label: "Summary" },
              { key: "requests", label: "Requests" },
              { key: "gameids", label: "Game IDs" },
              { key: "timeline", label: "Timeline" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  haptic("light");
                  setActiveTab(t.key);
                }}
                style={{
                  padding: "7px 13px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    activeTab === t.key
                      ? "var(--tg-theme-button-color)"
                      : "var(--tg-theme-section-bg-color)",
                  color:
                    activeTab === t.key
                      ? "var(--tg-theme-button-text-color)"
                      : "var(--tg-theme-text-color)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          {activeTab === "summary" && (
            <>
              {/* ───────────── Current Session ───────────── */}
              {profile.stats.currentSession && (
                <>
                  <p className="section-label">Current Session</p>
                  <div className="tg-section" style={{ marginBottom: 18 }}>
                    {[
                      {
                        label: "Deposits",
                        value: profile.stats.currentSession.deposits,
                        note: profile.stats.currentSession.depositAmount
                          ? `${Number(profile.stats.currentSession.depositAmount).toLocaleString()} approved`
                          : null,
                      },
                      {
                        label: "Withdrawals",
                        value: profile.stats.currentSession.withdrawals,
                        note: profile.stats.currentSession.withdrawalAmount
                          ? `${Number(profile.stats.currentSession.withdrawalAmount).toLocaleString()} requested`
                          : null,
                      },
                      {
                        label: "Recoveries",
                        value: profile.stats.currentSession.recoveries,
                      },
                      {
                        label: "New IDs",
                        value: profile.stats.currentSession.newIds,
                      },
                      {
                        label: "Tickets",
                        value: profile.stats.currentSession.tickets,
                      },
                    ].map((row) => (
                      <div key={row.label} className="tg-row tg-row-static">
                        <div className="tg-row-content">
                          <p className="tg-row-title">{row.label}</p>
                          {row.note && (
                            <p className="tg-row-subtitle">{row.note}</p>
                          )}
                        </div>
                        <p className="tg-row-right" style={{ fontWeight: 700 }}>
                          {row.value ?? 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ───────────── Lifetime ───────────── */}
              <p className="section-label">Lifetime</p>
              <div className="tg-section" style={{ marginBottom: 18 }}>
                {[
                  {
                    label: "Deposits",
                    value: profile.stats.lifetime.deposits,
                    note: profile.stats.lifetime.depositAmount
                      ? `${Number(profile.stats.lifetime.depositAmount).toLocaleString()} approved`
                      : null,
                  },
                  {
                    label: "Withdrawals",
                    value: profile.stats.lifetime.withdrawals,
                    note: profile.stats.lifetime.withdrawalAmount
                      ? `${Number(profile.stats.lifetime.withdrawalAmount).toLocaleString()} requested`
                      : null,
                  },
                  {
                    label: "Recoveries",
                    value: profile.stats.lifetime.recoveries,
                  },
                  {
                    label: "New IDs",
                    value: profile.stats.lifetime.newIds,
                  },
                  {
                    label: "Tickets",
                    value: profile.stats.lifetime.tickets,
                  },
                  {
                    label: "Game IDs",
                    value: profile.gameIds.length,
                  },
                ].map((row) => (
                  <div key={row.label} className="tg-row tg-row-static">
                    <div className="tg-row-content">
                      <p className="tg-row-title">{row.label}</p>
                      {row.note && (
                        <p className="tg-row-subtitle">{row.note}</p>
                      )}
                    </div>
                    <p className="tg-row-right" style={{ fontWeight: 700 }}>
                      {row.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* ───────────── Account Info ───────────── */}
              <p className="section-label">Account</p>
              <div className="tg-section" style={{ marginBottom: 18 }}>
                {[
                  {
                    label: "Language",
                    value: user.language === "dv" ? "Dhivehi" : "English",
                  },
                  {
                    label: "Broadcasts",
                    value: user.broadcastOptIn ? "Opted in" : "Opted out",
                  },
                  {
                    label: "TnC Accepted",
                    value: user.tncAccepted ? "Yes" : "No",
                  },
                ].map((row) => (
                  <div key={row.label} className="tg-row tg-row-static">
                    <p className="tg-row-title">{row.label}</p>
                    <p className="tg-row-right">{row.value}</p>
                  </div>
                ))}
                {/* Send Message row */}
                <div
                  className="tg-row"
                  onClick={() => setShowMsg((v) => !v)}
                  style={{ cursor: "pointer" }}
                >
                  <p className="tg-row-title">Send Message</p>
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
              {showMsg && (
                <div style={{ marginBottom: 14 }}>
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
                    marginBottom: 14,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span>✅</span>
                  <p style={{ fontSize: 13, color: "#1a7a35" }}>
                    Message sent!
                  </p>
                </div>
              )}
            </>
          )}

          {/* Requests */}
          {activeTab === "requests" &&
            (reqLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 60, borderRadius: 12, marginBottom: 8 }}
                  />
                ))}
              </>
            ) : !requests || requests.length === 0 ? (
              <EmptyState
                emoji="📋"
                title="No requests"
                subtitle="No requests found for this filter."
              />
            ) : (
              <div className="tg-section">
                {requests.map((req) => (
                  <RequestRow key={`${req.type}-${req.id}`} req={req} />
                ))}
              </div>
            ))}

          {/* Game IDs */}
          {activeTab === "gameids" &&
            (profile.gameIds.length === 0 ? (
              <EmptyState
                emoji="🎮"
                title="No Game IDs"
                subtitle="This user has no associated game IDs."
              />
            ) : (
              <div className="tg-section">
                {profile.gameIds.map((gid) => (
                  <div
                    key={gid.id}
                    className="tg-row"
                    onClick={() => onGameIdTap(gid)}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
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
                        style={{ fontFamily: "monospace" }}
                      >
                        {gid.gameId}
                      </p>
                      <p className="tg-row-subtitle">
                        {gid.lastInteractedUserId === user.id
                          ? "👑 Current owner · "
                          : "Previously used · "}
                        Since{" "}
                        {new Date(gid.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
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
                ))}
              </div>
            ))}

          {/* Timeline */}
          {activeTab === "timeline" &&
            (tlLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 56, borderRadius: 12, marginBottom: 8 }}
                  />
                ))}
              </>
            ) : !timeline || timeline.length === 0 ? (
              <EmptyState
                emoji="🕐"
                title="No activity"
                subtitle="No activity found for this filter."
              />
            ) : (
              <div style={{ position: "relative", paddingLeft: 6 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 10,
                    bottom: 10,
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
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// View 3 — Game ID Detail  (spec 6.6)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GameIdDetail({ gameId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [gameId.id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get(`/admin/gameids/${gameId.id}`);
      setData(r.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Error ${err.response?.status || "network"}: ${JSON.stringify(err.response?.data) || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  }

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
        <div>
          <p className="t-heading" style={{ fontFamily: "monospace" }}>
            {gameId.gameId}
          </p>
          <p className="t-caption" style={{ marginTop: 2 }}>
            Game ID History
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,59,48,.1)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#cc2d24",
              marginBottom: 4,
            }}
          >
            Failed to load
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#cc2d24",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {error}
          </p>
          <button
            className="btn btn-ghost"
            onClick={loadData}
            style={{ marginTop: 10, fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 70, borderRadius: 12, marginBottom: 10 }}
            />
          ))}
        </>
      )}

      {!loading && !error && data && (
        <>
          {/* Current owner */}
          <p className="section-label">Current Owner</p>
          <div className="tg-section" style={{ marginBottom: 18 }}>
            {data.currentOwner ? (
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
                  {(data.currentOwner.firstName ||
                    data.currentOwner.username ||
                    "?")[0].toUpperCase()}
                </div>
                <div className="tg-row-content">
                  <p className="tg-row-title">
                    {data.currentOwner.firstName}
                    {data.currentOwner.lastName
                      ? " " + data.currentOwner.lastName
                      : ""}
                  </p>
                  <p className="tg-row-subtitle">
                    {data.currentOwner.username
                      ? `@${data.currentOwner.username}`
                      : `ID: ${data.currentOwner.telegramId}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="tg-row tg-row-static">
                <p
                  style={{ color: "var(--tg-theme-hint-color)", fontSize: 14 }}
                >
                  No owner assigned
                </p>
              </div>
            )}
          </div>

          {/* All users who ever used this ID */}
          {data.allUsers?.length > 0 && (
            <>
              <p className="section-label">
                All Users ({data.allUsers.length})
              </p>
              <div className="tg-section" style={{ marginBottom: 18 }}>
                {data.allUsers.map((u) => (
                  <div key={u.id} className="tg-row tg-row-static">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "var(--tg-theme-secondary-bg-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--tg-theme-hint-color)",
                      }}
                    >
                      {(u.firstName || u.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="tg-row-content">
                      <p className="tg-row-title" style={{ fontSize: 14 }}>
                        {u.firstName}
                        {u.lastName ? " " + u.lastName : ""}
                      </p>
                      <p className="tg-row-subtitle">
                        {u.username ? `@${u.username}` : `ID: ${u.telegramId}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Full transaction history */}
          <p className="section-label">
            Transaction History ({data.history?.length ?? 0})
          </p>
          {!data.history || data.history.length === 0 ? (
            <EmptyState
              emoji="📭"
              title="No transactions"
              subtitle="No deposits or withdrawals on this ID yet."
            />
          ) : (
            <div className="tg-section">
              {data.history.map((req) => (
                <RequestRow key={`${req.type}-${req.id}`} req={req} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
          {user.role !== "user" && roleColor && (
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

function RequestRow({ req }) {
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

function TimelineRow({ log, isLast }) {
  const ACTION_META = {
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
  const meta = ACTION_META[`${log.entityType}-${log.action}`] || {
    label: `${log.entityType} ${log.action}`,
    dot: "#8E8E93",
  };
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: isLast ? 0 : 10 }}>
      <div
        style={{
          flexShrink: 0,
          width: 18,
          paddingTop: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: meta.dot,
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

function Pill({ label, active, onClick }) {
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

function EmptyState({ emoji, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <p className="t-heading" style={{ marginBottom: 6 }}>
        {title}
      </p>
      <p className="t-caption">{subtitle}</p>
    </div>
  );
}
