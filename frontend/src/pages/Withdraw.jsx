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

export default function Withdraw() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=select gameid, 2=amount, 3=confirm, 4=success
  const [eligibleIds, setEligibleIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/withdrawals/eligible-gameids")
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

  function handleSelectId(gameId) {
    haptic("light");
    setSelectedId(gameId);
    setStep(2);
  }

  function handleNext() {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      haptic("medium");
      return;
    }
    setError("");
    haptic("light");
    setStep(3);
  }

  async function handleSubmit() {
    setSubmitting(true);
    haptic("light");
    try {
      await api.post("/withdrawals", {
        gameId: selectedId.gameId,
        amount: parseFloat(amount),
      });
      hapticNotification("success");
      setStep(4);
    } catch (err) {
      hapticNotification("error");
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 4: Success ──────────────────────────────────────
  if (step === 4) {
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
              background: "rgba(255,149,0,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#FF9500"
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
            style={{ marginBottom: 32, lineHeight: 1.6 }}
          >
            Your withdrawal request has been received. You'll be notified once
            it's processed by our team.
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
        title="Withdraw"
        subtitle={
          step === 1
            ? "Select a Game ID to withdraw from"
            : step === 2
              ? "Enter withdrawal amount"
              : "Confirm your withdrawal"
        }
        onClose={() => navigate("/")}
      />

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map((s) => (
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
                  You need an approved deposit in the current session to make a
                  withdrawal. Please make a deposit first.
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
                  background: "rgba(255,149,0,.1)",
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
                  Only Game IDs with an approved deposit this session are shown.
                </p>
              </div>

              <p className="section-label">Eligible Game IDs</p>
              <div className="tg-section">
                {eligibleIds.map((g) => (
                  <div
                    key={g.id}
                    className="tg-row"
                    onClick={() => handleSelectId(g)}
                  >
                    <div
                      className="tg-row-icon"
                      style={{ background: "#FF9500" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 21h8M12 17v4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="tg-row-content">
                      <p className="tg-row-title">{g.gameId}</p>
                      <p className="tg-row-subtitle">
                        Last used ·{" "}
                        {new Date(g.lastInteractedAt).toLocaleDateString()}
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
            </>
          )}

          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            Cancel
          </button>
        </>
      )}

      {/* ══ STEP 2 — Enter Amount ════════════════════════════ */}
      {step === 2 && (
        <>
          {/* Selected Game ID */}
          <p className="section-label">Selected Game ID</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            <div className="tg-row tg-row-static">
              <div className="tg-row-icon" style={{ background: "#FF9500" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 21h8M12 17v4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="tg-row-content">
                <p className="tg-row-title">{selectedId?.gameId}</p>
              </div>
              <button
                onClick={() => {
                  haptic("light");
                  setStep(1);
                }}
                style={{
                  background: "var(--tg-theme-secondary-bg-color)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "var(--tg-theme-button-color)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                Change
              </button>
            </div>
          </div>

          {/* Amount */}
          <p className="section-label">Amount</p>
          <div className="tg-input-wrap">
            <div className="tg-input-row">
              <span className="tg-input-label">Amount</span>
              <input
                className="tg-input"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
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

      {/* ══ STEP 3 — Confirm ════════════════════════════════ */}
      {step === 3 && (
        <>
          <div
            style={{
              background: "rgba(255,149,0,.1)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p
              style={{
                fontSize: 13,
                color: "var(--tg-theme-text-color)",
                lineHeight: 1.5,
              }}
            >
              Please confirm your withdrawal details before submitting. This
              cannot be undone.
            </p>
          </div>

          <p className="section-label">Withdrawal Summary</p>
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
                Amount
              </p>
              <p
                className="tg-row-right"
                style={{ color: "#FF9500", fontWeight: 700, fontSize: 18 }}
              >
                {parseFloat(amount).toLocaleString()}
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
              "Confirm Withdrawal"
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
