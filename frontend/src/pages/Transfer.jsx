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

export default function Transfer() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=from, 2=to+amount, 3=confirm, 4=success
  const [myGameIds, setMyGameIds] = useState([]);
  const [fromId, setFromId] = useState(null);
  const [toGameId, setToGameId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me/gameids")
      .then((r) => setMyGameIds(r.data))
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

  function handleSelectFrom(gameId) {
    haptic("light");
    setFromId(gameId);
    setStep(2);
  }

  function handleNext() {
    if (!toGameId.trim()) {
      setError("Please enter a destination Game ID");
      haptic("medium");
      return;
    }
    if (toGameId.trim() === fromId?.gameId) {
      setError("Source and destination Game IDs cannot be the same");
      haptic("medium");
      return;
    }
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
      await api.post("/transfers", {
        fromGameId: fromId.gameId,
        toGameId: toGameId.trim(),
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
              background: "rgba(255,45,85,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#FF2D55"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="t-title" style={{ marginBottom: 8 }}>
            Transfer Submitted!
          </p>
          <p
            className="t-caption"
            style={{ marginBottom: 32, lineHeight: 1.6 }}
          >
            Your chip transfer request has been submitted and is pending admin
            approval.
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
        title="Chip Transfer"
        subtitle={
          step === 1
            ? "Select source Game ID"
            : step === 2
              ? "Enter destination and amount"
              : "Confirm your transfer"
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

      {/* ══ STEP 1 — Select From ID ══════════════════════════ */}
      {step === 1 && (
        <>
          <div
            style={{
              background: "rgba(255,45,85,.1)",
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
              Select the Game ID you want to transfer chips from. You must be
              the current owner.
            </p>
          </div>

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
          ) : myGameIds.length === 0 ? (
            <div className="tg-section">
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
                <p className="t-heading" style={{ marginBottom: 8 }}>
                  No Game IDs
                </p>
                <p className="t-caption" style={{ lineHeight: 1.6 }}>
                  You don't have any Game IDs yet. Make a deposit first to get
                  started.
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
              <p className="section-label">Your Game IDs</p>
              <div className="tg-section">
                {myGameIds.map((g) => (
                  <div
                    key={g.id}
                    className="tg-row"
                    onClick={() => handleSelectFrom(g)}
                  >
                    <div
                      className="tg-row-icon"
                      style={{ background: "#FF2D55" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 12h14M15 6l6 6-6 6"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="tg-row-content">
                      <p className="tg-row-title">{g.gameId}</p>
                      <p className="tg-row-subtitle">
                        Last used ·{" "}
                        {g.lastInteractedAt
                          ? new Date(g.lastInteractedAt).toLocaleDateString()
                          : "Never"}
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

      {/* ══ STEP 2 — To + Amount ═════════════════════════════ */}
      {step === 2 && (
        <>
          {/* From — readonly */}
          <p className="section-label">From</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
            <div className="tg-row tg-row-static">
              <div className="tg-row-icon" style={{ background: "#FF2D55" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M15 6l6 6-6 6"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="tg-row-content">
                <p className="tg-row-title">{fromId?.gameId}</p>
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

          {/* To — manual entry */}
          <p className="section-label">To Game ID</p>
          <div className="tg-input-wrap">
            <input
              className="tg-input-solo"
              style={{ marginBottom: 0 }}
              placeholder="Enter destination Game ID"
              value={toGameId}
              onChange={(e) => setToGameId(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* Amount */}
          <p className="section-label">Amount</p>
          <div className="tg-input-wrap">
            <div className="tg-input-row">
              <span className="tg-input-label">Chips</span>
              <input
                className="tg-input"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              background: "rgba(255,45,85,.1)",
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
              Please confirm your transfer details. Once submitted this cannot
              be undone.
            </p>
          </div>

          <p className="section-label">Transfer Summary</p>
          <div className="tg-section" style={{ marginBottom: 24 }}>
            <div className="tg-row tg-row-static">
              <p
                className="tg-row-title"
                style={{
                  color: "var(--tg-theme-subtitle-text-color)",
                  fontSize: 14,
                }}
              >
                From
              </p>
              <p className="tg-row-right" style={{ fontWeight: 600 }}>
                {fromId?.gameId}
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
                To
              </p>
              <p className="tg-row-right" style={{ fontWeight: 600 }}>
                {toGameId.trim()}
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
                style={{
                  color: "#FF2D55",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {parseFloat(amount).toLocaleString()} chips
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
              "Confirm Transfer"
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
