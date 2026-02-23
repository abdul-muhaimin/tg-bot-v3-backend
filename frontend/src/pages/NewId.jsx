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

export default function NewId() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=form, 2=confirm, 3=success
  const [requestedId, setRequestedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    showBackButton(() => {
      haptic("light");
      if (step > 1) setStep((s) => s - 1);
      else navigate("/");
    });
    return () => hideBackButton();
  }, [step]);

  function handleNext() {
    if (!requestedId.trim()) {
      setError("Please enter a Game ID");
      haptic("medium");
      return;
    }
    if (requestedId.trim().length < 3) {
      setError("Game ID must be at least 3 characters");
      haptic("medium");
      return;
    }
    setError("");
    haptic("light");
    setStep(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    haptic("light");
    try {
      await api.post("/newid", { requestedGameId: requestedId.trim() });
      hapticNotification("success");
      setStep(3);
    } catch (err) {
      hapticNotification("error");
      const msg = err.response?.data?.error || "Something went wrong.";
      if (msg.includes("already exists") || msg.includes("Pending")) {
        setError(msg);
        setStep(1);
      } else {
        setError(msg);
      }
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
              background: "rgba(88,86,214,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#5856D6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="t-title" style={{ marginBottom: 8 }}>
            Request Submitted!
          </p>
          <p
            className="t-caption"
            style={{ marginBottom: 12, lineHeight: 1.6 }}
          >
            Your request for Game ID
          </p>
          <div
            style={{
              background: "var(--tg-theme-section-bg-color)",
              borderRadius: 10,
              padding: "10px 20px",
              display: "inline-block",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#5856D6",
              }}
            >
              {requestedId.trim()}
            </p>
          </div>
          <p
            className="t-caption"
            style={{ marginBottom: 32, lineHeight: 1.6 }}
          >
            has been submitted. You'll be notified once an admin reviews it.
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
        title="New Game ID"
        subtitle={step === 1 ? "Request a new Game ID" : "Confirm your request"}
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

      {/* ══ STEP 1 — Enter ID ═══════════════════════════════ */}
      {step === 1 && (
        <>
          <div
            style={{
              background: "rgba(88,86,214,.1)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
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
              Enter your desired Game ID. If it's available, an admin will
              create it and link it to your account.
            </p>
          </div>

          <p className="section-label">Desired Game ID</p>
          <div className="tg-input-wrap">
            <input
              className="tg-input-solo"
              style={{ marginBottom: 0 }}
              placeholder="e.g. PLAYER123"
              value={requestedId}
              onChange={(e) => setRequestedId(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={20}
            />
          </div>
          <p className="t-caption" style={{ paddingLeft: 4, marginBottom: 24 }}>
            Letters and numbers only · Max 20 characters
          </p>

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

          <button className="btn btn-primary" onClick={handleNext}>
            Continue
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

      {/* ══ STEP 2 — Confirm ════════════════════════════════ */}
      {step === 2 && (
        <>
          <div
            style={{
              background: "rgba(88,86,214,.1)",
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
              Make sure your Game ID is correct. Once submitted it cannot be
              changed.
            </p>
          </div>

          <p className="section-label">Request Summary</p>
          <div className="tg-section" style={{ marginBottom: 24 }}>
            <div className="tg-row tg-row-static">
              <p
                className="tg-row-title"
                style={{
                  color: "var(--tg-theme-subtitle-text-color)",
                  fontSize: 14,
                }}
              >
                Requested Game ID
              </p>
              <p
                className="tg-row-right"
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#5856D6",
                  letterSpacing: 0.5,
                }}
              >
                {requestedId.trim()}
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
              "Submit Request"
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
