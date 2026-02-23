import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  haptic,
  hapticNotification,
  showBackButton,
  hideBackButton,
} from "../lib/telegram";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";
import { useConfirmNotify } from "../hooks/useConfirmNotify";

export default function Deposit() {
  const { config, user } = useApp();
  const navigate = useNavigate();
  // Replace the hardcoded const with this:
  const CURRENCIES = JSON.parse(
    config?.accepted_currencies || '["MRF","USD","USDT"]',
  );
  const [step, setStep] = useState(1); // 1=form, 2=payment info, 3=slip upload, 4=success
  const [gameId, setGameId] = useState("");
  const [currency, setCurrency] = useState("MRF");
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userGameIds, setUserGameIds] = useState([]);
  const notify = useConfirmNotify();

  // Load user's previous game IDs and payment accounts
  useEffect(() => {
    api
      .get("/users/me/gameids")
      .then((r) => setUserGameIds(r.data))
      .catch(() => {});
    api
      .get("/deposits/payment-accounts")
      .then((r) => setAccounts(r.data))
      .catch(() => {});
  }, []);

  // Back button
  useEffect(() => {
    showBackButton(() => {
      if (step > 1) {
        haptic("light");
        setStep((s) => s - 1);
      } else {
        navigate("/");
      }
    });
    return () => hideBackButton();
  }, [step]);

  const minAmount = parseFloat(config?.deposit_min || 10);
  const maxAmount = parseFloat(config?.deposit_max || 50000);
  const filteredAccounts = accounts.filter((a) => a.currency === currency);

  function handleSlipChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSlip(file);
    setSlipPreview(URL.createObjectURL(file));
  }

  function validateStep1() {
    if (!gameId.trim()) return "Please enter your Game ID";
    if (!amount || isNaN(amount)) return "Please enter a valid amount";
    if (parseFloat(amount) < minAmount)
      return `Minimum deposit is ${minAmount}`;
    if (parseFloat(amount) > maxAmount)
      return `Maximum deposit is ${maxAmount}`;
    return "";
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        haptic("medium");
        return;
      }
      setError("");
      haptic("light");
      setStep(2);
    } else if (step === 2) {
      haptic("light");
      setStep(3);
    }
  }

  async function handleSubmit() {
    if (!slip) {
      setError("Please upload your payment slip");
      return;
    }
    setError("");
    setSubmitting(true);
    haptic("light");

    try {
      const form = new FormData();
      form.append("gameId", gameId.trim());
      form.append("currency", currency);
      form.append("amount", amount);
      form.append("slip", slip);

      await api.post("/deposits", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notify("deposit", {
        gameId: gameId.trim(),
        amount: amount,
        currency: currency,
      });

      hapticNotification("success");
      setStep(4);
    } catch (err) {
      hapticNotification("error");
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
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
              background: "rgba(52,199,89,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#34C759"
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
            Your deposit request has been received and is being reviewed by our
            team. You'll be notified once it's processed.
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
      {/* ── Header ── */}
      <PageHeader
        title="Deposit"
        subtitle={
          step === 1
            ? "Enter your deposit details"
            : step === 2
              ? "Send payment to the account below"
              : "Upload your payment slip"
        }
        onClose={() => navigate("/")}
      />

      {/* ── Step indicator ── */}
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

      {/* ══ STEP 1 — Form ══════════════════════════════════ */}
      {step === 1 && (
        <>
          {/* Game ID */}
          <p className="section-label">Game ID</p>
          <div className="tg-input-wrap">
            <input
              className="tg-input-solo"
              style={{ marginBottom: 0 }}
              placeholder="Enter your Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              autoCapitalize="characters"
            />
          </div>

          {/* Previous game IDs */}
          {userGameIds.length > 0 && (
            <>
              <p className="section-label">Previous Game IDs</p>
              <div className="tg-section">
                {userGameIds.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="tg-row"
                    onClick={() => {
                      haptic("light");
                      setGameId(g.gameId);
                    }}
                  >
                    <div className="tg-row-content">
                      <p className="tg-row-title">{g.gameId}</p>
                    </div>
                    {gameId === g.gameId && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
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
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    haptic("light");
                    navigate("/");
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Currency */}
          <p className="section-label">Currency</p>
          <div className="tg-section">
            {CURRENCIES.map((c) => (
              <div
                key={c}
                className="tg-row"
                onClick={() => {
                  haptic("light");
                  setCurrency(c);
                }}
              >
                <div className="tg-row-content">
                  <p className="tg-row-title">{c}</p>
                  <p className="tg-row-subtitle">
                    {c === "MRF" && "Maldivian Rufiyaa"}
                    {c === "USD" && "US Dollar"}
                    {c === "USDT" && "Tether (TRC20 / ERC20)"}
                  </p>
                </div>
                {currency === c && (
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

          {/* Amount */}
          <p className="section-label">Amount</p>
          <div className="tg-input-wrap">
            <div className="tg-input-row">
              <span className="tg-input-label">{currency}</span>
              <input
                className="tg-input"
                type="number"
                inputMode="decimal"
                placeholder={`Min ${minAmount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <p className="t-caption" style={{ marginBottom: 24, paddingLeft: 4 }}>
            Min: {minAmount} · Max: {maxAmount.toLocaleString()}
          </p>

          {error && <ErrorBox message={error} />}

          <button className="btn btn-primary" onClick={handleNext}>
            Continue
          </button>
        </>
      )}

      {/* ══ STEP 2 — Payment Info ═══════════════════════════ */}
      {step === 2 && (
        <>
          <div
            style={{
              background: "rgba(52,199,89,.1)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <p
              style={{
                fontSize: 13,
                color: "var(--tg-theme-text-color)",
                lineHeight: 1.5,
              }}
            >
              Send exactly{" "}
              <strong>
                {parseFloat(amount).toLocaleString()} {currency}
              </strong>{" "}
              to one of the accounts below, then tap Continue to upload your
              slip.
            </p>
          </div>

          {filteredAccounts.length > 0 ? (
            <>
              <p className="section-label">{currency} Payment Accounts</p>
              <div className="tg-section">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="tg-row tg-row-static"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                      }}
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
                          <rect
                            x="2"
                            y="5"
                            width="20"
                            height="14"
                            rx="2"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <path d="M2 10h20" stroke="white" strokeWidth="2" />
                        </svg>
                      </div>
                      <div>
                        <p className="tg-row-title">{acc.label}</p>
                        <p className="tg-row-subtitle">
                          {acc.type === "bank"
                            ? "Bank Transfer"
                            : "Crypto Wallet"}
                        </p>
                      </div>
                    </div>
                    {acc.accountNumber && (
                      <CopyRow
                        label="Account Number"
                        value={acc.accountNumber}
                      />
                    )}
                    {acc.accountName && (
                      <CopyRow label="Account Name" value={acc.accountName} />
                    )}
                    {acc.walletAddress && (
                      <CopyRow
                        label="Wallet Address"
                        value={acc.walletAddress}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="tg-section">
              <div className="tg-row tg-row-static">
                <p className="t-caption">
                  No payment accounts available for {currency}. Please contact
                  support.
                </p>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleNext}
            style={{ marginTop: 8 }}
          >
            I've Sent the Payment
          </button>
        </>
      )}

      {/* ══ STEP 3 — Slip Upload ════════════════════════════ */}
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
            <span style={{ fontSize: 18 }}>⚠️</span>
            <p
              style={{
                fontSize: 13,
                color: "var(--tg-theme-text-color)",
                lineHeight: 1.5,
              }}
            >
              Upload a clear screenshot or photo of your payment confirmation.
            </p>
          </div>

          <p className="section-label">Payment Slip</p>

          {/* Upload area */}
          <label
            style={{
              display: "block",
              border: `2px dashed ${slipPreview ? "var(--tg-theme-button-color)" : "var(--tg-theme-hint-color)"}`,
              borderRadius: 14,
              overflow: "hidden",
              cursor: "pointer",
              marginBottom: 20,
              transition: "border-color .2s",
            }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleSlipChange}
            />
            {slipPreview ? (
              <img
                src={slipPreview}
                alt="Slip preview"
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "var(--tg-theme-secondary-bg-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="var(--tg-theme-hint-color)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--tg-theme-text-color)",
                  }}
                >
                  Tap to upload slip
                </p>
                <p className="t-caption">JPG, PNG or WEBP</p>
              </div>
            )}
          </label>

          {slipPreview && (
            <button
              className="btn btn-secondary"
              style={{ marginBottom: 12 }}
              onClick={() => {
                setSlip(null);
                setSlipPreview(null);
              }}
            >
              Change Image
            </button>
          )}

          {/* Summary */}
          <p className="section-label">Summary</p>
          <div className="tg-section" style={{ marginBottom: 20 }}>
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
              <p
                className="tg-row-right"
                style={{ color: "var(--tg-theme-text-color)", fontWeight: 600 }}
              >
                {gameId}
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
                Currency
              </p>
              <p
                className="tg-row-right"
                style={{ color: "var(--tg-theme-text-color)", fontWeight: 600 }}
              >
                {currency}
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
                style={{ color: "#34C759", fontWeight: 700, fontSize: 16 }}
              >
                {parseFloat(amount).toLocaleString()} {currency}
              </p>
            </div>
          </div>

          {error && <ErrorBox message={error} />}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !slip}
          >
            {submitting ? (
              <span
                className="spinner"
                style={{ borderColor: "white", borderTopColor: "transparent" }}
              />
            ) : (
              "Submit Deposit"
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Helper components ────────────────────────────────────────

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    haptic("light");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        background: "var(--tg-theme-secondary-bg-color)",
        borderRadius: 8,
        padding: "8px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        gap: 8,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            color: "var(--tg-theme-subtitle-text-color)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--tg-theme-text-color)",
            wordBreak: "break-all",
          }}
        >
          {value}
        </p>
      </div>
      <button
        onClick={copy}
        style={{
          background: copied
            ? "rgba(52,199,89,.15)"
            : "var(--tg-theme-section-bg-color)",
          border: "none",
          borderRadius: 6,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: copied ? "#34C759" : "var(--tg-theme-button-color)",
          flexShrink: 0,
          fontFamily: "inherit",
          transition: "all .2s",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div
      style={{
        background: "rgba(255,59,48,.1)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 16,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 15 }}>⚠️</span>
      <p
        style={{
          fontSize: 13,
          color: "var(--tg-theme-destructive-text-color)",
          lineHeight: 1.4,
        }}
      >
        {message}
      </p>
    </div>
  );
}
