import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { haptic, hapticNotification } from "../lib/telegram";
import api from "../lib/api";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "dv", label: "Dhivehi", native: "ދިވެހި" },
];

export default function Settings() {
  const { user, setUser, config } = useApp();
  const navigate = useNavigate();

  const [savingBroadcast, setSavingBroadcast] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);

  async function toggleBroadcast() {
    haptic("light");
    setSavingBroadcast(true);
    try {
      const res = await api.patch("/users/me/broadcast", {
        broadcastOptIn: !user.broadcastOptIn,
      });
      setUser(res.data);
      hapticNotification("success");
    } catch {
      hapticNotification("error");
    } finally {
      setSavingBroadcast(false);
    }
  }

  async function handleLanguage(code) {
    if (code === user.language) {
      setShowLangSheet(false);
      return;
    }
    haptic("light");
    setSavingLang(true);
    setShowLangSheet(false);
    try {
      const res = await api.patch("/users/me/language", { language: code });
      setUser(res.data);
      hapticNotification("success");
    } catch {
      hapticNotification("error");
    } finally {
      setSavingLang(false);
    }
  }

  const currentLang =
    LANGUAGES.find((l) => l.code === user?.language) || LANGUAGES[0];

  return (
    <div className="page page-enter">
      {/* Header */}
      <div style={{ paddingTop: 20, paddingBottom: 20 }}>
        <p className="t-title">Settings</p>
      </div>

      {/* Profile card */}
      <div
        style={{
          background: "var(--tg-theme-section-bg-color)",
          borderRadius: 16,
          padding: "16px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            flexShrink: 0,
            background: "var(--tg-theme-button-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--tg-theme-button-text-color)",
          }}
        >
          {(user?.firstName || user?.username || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--tg-theme-text-color)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.firstName
              ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
              : user?.username || "User"}
          </p>
          {user?.username && (
            <p className="t-caption" style={{ marginTop: 2 }}>
              @{user.username}
            </p>
          )}
          <div
            style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: "rgba(0,122,255,.12)",
                color: "#007AFF",
              }}
            >
              {user?.role}
            </span>
            {user?.isVip && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(255,183,0,.15)",
                  color: "#b37700",
                }}
              >
                ⭐ VIP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <p className="section-label">Notifications</p>
      <div className="tg-section" style={{ marginBottom: 8 }}>
        <div className="tg-row tg-row-static">
          <div className="tg-row-content">
            <p className="tg-row-title">Broadcast Messages</p>
            <p
              className="tg-row-subtitle"
              style={{ marginTop: 2, lineHeight: 1.4 }}
            >
              Receive announcements from the bot — session updates, promotions,
              and important notices
            </p>
          </div>
          <Toggle
            on={user?.broadcastOptIn ?? true}
            loading={savingBroadcast}
            onChange={toggleBroadcast}
          />
        </div>
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--tg-theme-hint-color)",
          paddingLeft: 4,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        You'll always receive request status updates regardless of this setting.
      </p>

      {/* Language */}
      <p className="section-label">Appearance</p>
      <div className="tg-section" style={{ marginBottom: 8 }}>
        <div
          className="tg-row"
          onClick={() => {
            haptic("light");
            setShowLangSheet(true);
          }}
        >
          <div className="tg-row-content">
            <p className="tg-row-title">Language</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {savingLang ? (
              <span
                className="spinner"
                style={{
                  width: 16,
                  height: 16,
                  borderWidth: 2,
                  borderColor: "var(--tg-theme-hint-color)",
                  borderTopColor: "transparent",
                }}
              />
            ) : (
              <p
                className="tg-row-right"
                style={{ color: "var(--tg-theme-hint-color)" }}
              >
                {currentLang.native}
              </p>
            )}
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
      <p
        style={{
          fontSize: 12,
          color: "var(--tg-theme-hint-color)",
          paddingLeft: 4,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        Changes the language for bot notifications.
      </p>

      {/* About */}
      <p className="section-label">About</p>
      <div className="tg-section" style={{ marginBottom: 24 }}>
        <div className="tg-row tg-row-static">
          <p className="tg-row-title">App Name</p>
          <p
            className="tg-row-right"
            style={{ color: "var(--tg-theme-hint-color)" }}
          >
            {config?.app_name || "App"}
          </p>
        </div>
        <div className="tg-row tg-row-static">
          <p className="tg-row-title">Version</p>
          <p
            className="tg-row-right"
            style={{ color: "var(--tg-theme-hint-color)" }}
          >
            1.0.0
          </p>
        </div>
        {config?.support_contact && (
          <div
            className="tg-row"
            onClick={() =>
              window.open(
                `https://t.me/${config.support_contact.replace("@", "")}`,
                "_blank",
              )
            }
          >
            <p className="tg-row-title">Support</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <p
                className="tg-row-right"
                style={{ color: "var(--tg-theme-accent-text-color)" }}
              >
                {config.support_contact}
              </p>
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
        )}
      </div>

      {/* Language bottom sheet */}
      {showLangSheet && (
        <div className="sheet-overlay" onClick={() => setShowLangSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p className="sheet-title">Select Language</p>
            <div className="tg-section">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="tg-row"
                  onClick={() => handleLanguage(lang.code)}
                >
                  <div className="tg-row-content">
                    <p className="tg-row-title">{lang.native}</p>
                    <p className="tg-row-subtitle">{lang.label}</p>
                  </div>
                  {user?.language === lang.code && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="var(--tg-theme-button-color)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle switch ────────────────────────────────────────────
function Toggle({ on, onChange, loading }) {
  return (
    <div
      onClick={!loading ? onChange : undefined}
      style={{
        width: 51,
        height: 31,
        borderRadius: 16,
        flexShrink: 0,
        background: on
          ? "var(--tg-theme-button-color)"
          : "var(--tg-theme-secondary-bg-color)",
        position: "relative",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background .2s",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 27,
          height: 27,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
          transition: "left .2s",
        }}
      />
    </div>
  );
}
