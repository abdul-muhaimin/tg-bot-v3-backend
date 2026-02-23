import { useNavigate } from "react-router-dom";
import { haptic } from "../lib/telegram";

export default function PageHeader({
  title,
  subtitle,
  onBack,
  onClose,
  backPath = "/",
}) {
  const navigate = useNavigate();

  function handleBack() {
    haptic("light");
    if (onBack) onBack();
    else navigate(backPath);
  }

  function handleClose() {
    haptic("light");
    if (onClose) onClose();
    else navigate(backPath);
  }

  return (
    <div
      style={{
        paddingTop: 20,
        paddingBottom: 16,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <p className="t-title">{title}</p>
        {subtitle && (
          <p className="t-caption" style={{ marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
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
          marginTop: 4,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1l12 12M13 1L1 13"
            stroke="var(--tg-theme-hint-color)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
