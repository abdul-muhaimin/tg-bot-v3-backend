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

export default function Support() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=form, 2=success
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
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

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError("Please describe your issue");
      haptic("medium");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please provide more detail (at least 10 characters)");
      haptic("medium");
      return;
    }

    setError("");
    setSubmitting(true);
    haptic("light");

    try {
      const form = new FormData();
      form.append("message", message.trim());
      if (photo) form.append("photo", photo);

      await api.post("/tickets", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      hapticNotification("success");
      setStep(2);
    } catch (err) {
      hapticNotification("error");
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2: Success ──────────────────────────────────────
  if (step === 2) {
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
              background: "rgba(50,173,230,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#32ADE6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="t-title" style={{ marginBottom: 8 }}>
            Ticket Submitted!
          </p>
          <p
            className="t-caption"
            style={{ marginBottom: 32, lineHeight: 1.6 }}
          >
            Your support ticket has been received. Our team will get back to you
            as soon as possible.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => navigate("/requests")}
          >
            View My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <PageHeader
        title="Support"
        subtitle="Tell us what's wrong and we'll help"
        onClose={() => navigate("/")}
      />

      {/* Info box */}
      <div
        style={{
          background: "rgba(50,173,230,.1)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <p
          style={{
            fontSize: 13,
            color: "var(--tg-theme-text-color)",
            lineHeight: 1.5,
          }}
        >
          Describe your issue clearly. You can also attach a screenshot to help
          us understand better.
        </p>
      </div>

      {/* Message */}
      <p className="section-label">Your Message</p>
      <div
        style={{
          background: "var(--tg-theme-section-bg-color)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <textarea
          placeholder="Describe your issue in detail..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "14px 16px",
            fontSize: 16,
            color: "var(--tg-theme-text-color)",
            fontFamily: "inherit",
            lineHeight: 1.5,
            resize: "none",
          }}
        />
        <div
          style={{
            padding: "6px 16px 10px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <p className="t-caption">{message.length} chars</p>
        </div>
      </div>

      {/* Photo attachment */}
      <p className="section-label">
        Attachment{" "}
        <span style={{ fontWeight: 400, textTransform: "none", fontSize: 12 }}>
          (optional)
        </span>
      </p>

      {photoPreview ? (
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <img
            src={photoPreview}
            alt="Attachment"
            style={{
              width: "100%",
              maxHeight: 200,
              objectFit: "cover",
              display: "block",
            }}
          />
          <button
            onClick={() => {
              setPhoto(null);
              setPhotoPreview(null);
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(0,0,0,.5)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--tg-theme-section-bg-color)",
            borderRadius: 12,
            padding: "14px 16px",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--tg-theme-secondary-bg-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                stroke="var(--tg-theme-hint-color)"
                strokeWidth="2"
              />
              <circle
                cx="8.5"
                cy="8.5"
                r="1.5"
                fill="var(--tg-theme-hint-color)"
              />
              <path
                d="M21 15l-5-5L5 21"
                stroke="var(--tg-theme-hint-color)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: 15,
                color: "var(--tg-theme-text-color)",
                fontWeight: 500,
              }}
            >
              Add Screenshot
            </p>
            <p className="t-caption" style={{ marginTop: 1 }}>
              JPG, PNG or WEBP
            </p>
          </div>
          <svg
            className="tg-chevron"
            style={{ marginLeft: "auto" }}
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
        </label>
      )}

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
          "Submit Ticket"
        )}
      </button>
      <button
        className="btn btn-ghost"
        style={{ marginTop: 8 }}
        onClick={() => navigate("/")}
      >
        Cancel
      </button>
    </div>
  );
}
