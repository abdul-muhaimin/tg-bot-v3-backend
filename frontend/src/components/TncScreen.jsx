import { useState } from "react";
import { useApp } from "../context/AppContext";
import { hapticNotification } from "../lib/telegram";

const terms = [
  "All deposit and withdrawal requests are processed manually by our team and may take time.",
  "You are responsible for providing accurate payment information and game IDs.",
  "Fraudulent activity or misuse of the platform will result in permanent account suspension.",
  "We reserve the right to reject any request without providing a reason.",
  "Your Telegram account information is stored securely and never shared with third parties.",
  "All transactions are final once approved by an administrator.",
];

export default function TncScreen() {
  const { acceptTnc, config } = useApp();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    if (!accepted || loading) return;
    hapticNotification("success");
    setLoading(true);
    try {
      await acceptTnc();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-enter" style={{ paddingTop: 0 }}>
      {/* Hero */}
      <div className="page-hero" style={{ borderRadius: 0, marginBottom: 0 }}>
        <div className="page-hero-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="t-title">{config?.app_name || "Welcome"}</p>
        <p className="t-caption" style={{ marginTop: 4 }}>
          Review and accept our terms to continue
        </p>
      </div>

      {/* Terms */}
      <p className="section-label" style={{ marginTop: 24 }}>
        Terms & Conditions
      </p>
      <div className="tg-section">
        {terms.map((term, i) => (
          <div key={i} className="tg-row tg-row-static">
            <div
              className="tg-row-icon"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                color: "white",
              }}
            >
              {i + 1}
            </div>
            <div className="tg-row-content">
              <p className="t-subhead">{term}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement */}
      <p className="section-label">Agreement</p>
      <div className="tg-section" style={{ marginBottom: 16 }}>
        <div className="tg-row" onClick={() => setAccepted(!accepted)}>
          {/* Checkbox */}
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              flexShrink: 0,
              border: accepted
                ? "none"
                : "2px solid var(--tg-theme-hint-color)",
              background: accepted
                ? "var(--tg-theme-button-color)"
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .15s",
            }}
          >
            {accepted && (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 6.5l3.5 3.5 5.5-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="tg-row-content">
            <p className="tg-row-title">I agree to the Terms & Conditions</p>
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        className="btn btn-primary"
        onClick={handleAccept}
        disabled={!accepted || loading}
      >
        {loading ? <span className="spinner" /> : "Continue"}
      </button>
    </div>
  );
}
