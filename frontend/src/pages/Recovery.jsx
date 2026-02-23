import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  haptic,
  hapticNotification,
  showBackButton,
  hideBackButton,
} from "../lib/telegram";
import PageHeader from "../components/PageHeader";
import api from "../lib/api";

export default function Recovery() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=select, 2=confirm, 3=success
  const [eligibleIds, setEligibleIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/recoveries/eligible-gameids")
      .then((r) => setEligibleIds(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    showBackButton(() => {
      haptic("light");
      if (step > 1) setStep((s) => s - 1);
      else navigate("/");
    });
    return () => hideBackButton();
  }, [step]);

  function handleSelect(gameId) {
    haptic("light");
    setSelectedId(gameId);
    setStep(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    haptic("light");
    try {
      await api.post("/recoveries", { gameId: selectedId.gameId });
      hapticNotification("success");
      setStep(3);
    } catch (err) {
      hapticNotification("error");
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 3: Success ──────────────────────────────────────
  if (step === 3) {
    return (
      <div
        className="page page-enter"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(0,122,255,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#007AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="t-title" style={{ marginBottom: 8 }}>
            Recovery Requested!
          </p>
          <p
            className="t-caption"
            style={{ marginBottom: 32, lineHeight: 1.6 }}
          >
            Your recovery request has been submitted. Our team will process it
            and notify you shortly.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => navigate("/requests")}
          >
            View My Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <PageHeader
        title="Recovery"
        subtitle={
          step === 1
            ? "Select a Game ID to recover"
            : "Confirm your recovery request"
        }
        onClose={() => navigate("/")}
      />

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              flex: s === step ? 2 : 1,
              height: 4,
              borderRadius: 2,
              background:
                s <= step
                  ? "var(--tg-theme-button-color)"
                  : "var(--tg-theme-secondary-bg-color)",
              transition: "flex .3s, background .3s",
            }}
          />
        ))}
      </div>

      {/* ══ STEP 1 — Select Game ID ══════════════════════════ */}
      {step === 1 && (
        <>
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 56, borderRadius: 12, marginBottom: 8 }}
                />
              ))}
            </>
          ) : eligibleIds.length === 0 ? (
            <div className="tg-section">
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <p className="t-heading" style={{ marginBottom: 8 }}>
                  Not Eligible
                </p>
                <p className="t-caption" style={{ lineHeight: 1.6 }}>
                  You need an approved deposit in the current session to request
                  a recovery.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 20 }}
                  onClick={() => navigate("/deposit")}
                >
                  Make a Deposit
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "rgba(0,122,255,.1)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>💡</span>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--tg-theme-text-color)",
                    lineHeight: 1.5,
                  }}
                >
                  Select the Game ID you want to recover. Our team will process
                  your request and restore your account.
                </p>
              </div>

              <p className="section-label">Eligible Game IDs</p>
              <div className="tg-section">
                {eligibleIds.map((g) => (
                  <div
                    key={g.id}
                    className="tg-row"
                    onClick={() => handleSelect(g)}
                  >
                    <div
                      className="tg-row-icon"
                      style={{ background: "#007AFF" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 3v5h5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="tg-row-content">
                      <p className="tg-row-title">{g.gameId}</p>
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
            </>
          )}

          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            Cancel
          </button>
        </>
      )}

      {/* ══ STEP 2 — Confirm ════════════════════════════════ */}
      {step === 2 && (
        <>
          <div
            style={{
              background: "rgba(0,122,255,.1)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p
              style={{
                fontSize: 13,
                color: "var(--tg-theme-text-color)",
                lineHeight: 1.5,
              }}
            >
              Once submitted, our team will review and process your recovery
              request. You'll receive a notification when it's done.
            </p>
          </div>

          <p className="section-label">Recovery Summary</p>
          <div className="tg-section" style={{ marginBottom: 24 }}>
            <div className="tg-row tg-row-static">
              <p
                className="tg-row-title"
                style={{
                  color: "var(--tg-theme-subtitle-text-color)",
                  fontSize: 14,
                }}
              >
                Game ID
              </p>
              <p className="tg-row-right" style={{ fontWeight: 600 }}>
                {selectedId?.gameId}
              </p>
            </div>
            <div className="tg-row tg-row-static">
              <p
                className="tg-row-title"
                style={{
                  color: "var(--tg-theme-subtitle-text-color)",
                  fontSize: 14,
                }}
              >
                Type
              </p>
              <p className="tg-row-right" style={{ fontWeight: 600 }}>
                Account Recovery
              </p>
            </div>
          </div>

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

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span
                className="spinner"
                style={{ borderColor: "white", borderTopColor: "transparent" }}
              />
            ) : (
              "Submit Recovery Request"
            )}
          </button>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
